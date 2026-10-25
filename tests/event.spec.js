// Tests for the 15-Day Reward Event and streak freezes.
import { test, expect } from '@playwright/test';
import { press, fillIn, reveal } from './helpers.js';

const points = async (page) => Number((await page.locator('#points').textContent()).replace(/,/g, ''));
const profileOf = (page) => page.evaluate(() => window.EmiApp.getProfile());

async function productAnswer(page) {
  const m = (await page.locator('#question').textContent()).match(/(\d+) × (\d+) = \?/);
  return String(Number(m[1]) * Number(m[2]));
}

// Saves a profile and reloads. By default the player has already had today's
// daily bonus and owns every badge, so totals only change because of the event.
async function setProfile(page, data, { settled = true } = {}) {
  await page.evaluate(({ d, settled }) => {
    if (settled) {
      const now = new Date(Date.now());
      const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      d = { lastPlayDay: day, dailyStreak: 1, badges: Object.fromEntries(window.EmiApp.BADGES.map((b) => [b.id, day])), ...d };
    }
    localStorage.setItem('emisLearningProfile', JSON.stringify(d));
  }, { d: data, settled });
  await page.reload();
}

// Starts the test clock on a fixed day and freezes it so only runFor() moves time.
async function startOn(page, isoDateTime) {
  await page.clock.install({ time: new Date(isoDateTime) });
  await page.goto('/');
  await page.clock.pauseAt(new Date(new Date(isoDateTime).getTime() + 60_000));
}

// One "exercise": a full Speed Round (it ends by itself after 60 seconds).
async function finishSpeedRound(page) {
  await press(page.getByRole('button', { name: 'Start the timer →' }));
  await page.clock.runFor(61_000);
  await expect(page.locator('#roundLabel')).toHaveText('Round finished');
  await press(page.locator('#closeBtn'));
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { errors.push('Unexpected pop-up: ' + d.message()); d.dismiss(); });
});
test.afterEach(() => { expect(errors, 'JavaScript errors on the page').toEqual([]); });

test('event: 2 finished exercises unlock Day 1 (a streak freeze), once per day', async ({ page }) => {
  await startOn(page, '2026-04-01T09:00:00');
  await setProfile(page, {});
  await expect(page.locator('#eventStatus')).toContainText('0 of 2 done');
  await expect(page.locator('#eventTrack .event-day')).toHaveCount(15);
  await expect(page.locator('#claimEventBtn')).toBeHidden();

  // Closing a game early does not count.
  await press(page.getByRole('button', { name: 'Start the timer →' }));
  await press(page.locator('#closeBtn'));
  await expect(page.locator('#eventStatus')).toContainText('0 of 2 done');

  await finishSpeedRound(page);
  await expect(page.locator('#eventStatus')).toContainText('1 of 2 done');
  await expect(page.locator('#claimEventBtn')).toBeHidden();

  await finishSpeedRound(page);
  await expect(page.locator('#claimEventBtn')).toHaveText('🎁 Claim Day 1 reward');
  await expect(page.locator('#eventTrack .event-day').nth(0)).toHaveClass(/ready/);
  await press(page.locator('#claimEventBtn'));
  expect((await profileOf(page)).streakFreezes).toBe(1);
  await expect(page.locator('#eventFreezes')).toHaveText('❄️ Streak freezes: 1');
  await expect(page.locator('#eventTrack .event-day').nth(0)).toHaveClass(/claimed/);
  await expect(page.locator('#eventStatus')).toContainText('Come back tomorrow for Day 2');

  // A third exercise the same day earns nothing more.
  await finishSpeedRound(page);
  await expect(page.locator('#claimEventBtn')).toBeHidden();
  await page.reload();
  expect((await profileOf(page)).event).toMatchObject({ claimed: 1, unclaimed: 0 });
});

test('event: next day unlocks Day 2 (+100 points); a missed day just pauses it', async ({ page }) => {
  await startOn(page, '2026-04-01T09:00:00');
  await setProfile(page, { points: 0, event: { claimed: 1, lastEarnedDay: '2026-04-01' } });

  // Skip two days: the event is still waiting at Day 2.
  await page.clock.setSystemTime(new Date('2026-04-04T09:00:00'));
  await page.reload();
  await expect(page.locator('#eventStatus')).toContainText('unlock Day 2: 0 of 2 done');
  await finishSpeedRound(page);
  await finishSpeedRound(page);
  await press(page.getByRole('button', { name: '🎁 Claim Day 2 reward' }));
  // Only the event gives points here: no answers were played, so no daily bonus.
  expect(await points(page)).toBe(100);
});

test('event: Day 3 mystery emoji is one you cannot buy, and it is equipped', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { event: { claimed: 2, unclaimed: 1 } });
  await press(page.locator('#claimEventBtn'));
  const p = await profileOf(page);
  const { won, shopEmojis, pool } = await page.evaluate(() => ({
    won: window.EmiApp.getProfile().event.won['3'],
    shopEmojis: window.EmiApp.EMOJI_CATALOG.map((e) => e.emoji),
    pool: window.EmiApp.EVENT_EMOJIS.filter((e) => e.rarity === 'epic').map((e) => e.emoji),
  }));
  expect(pool).toContain(won);
  expect(shopEmojis).not.toContain(won);
  expect(p.ownedEmojis).toContain(won);
  await expect(page.locator('#profileAvatar')).toHaveText(won);
  await expect(page.locator('#eventTrack .event-day').nth(2)).toContainText('Epic');
  await expect(page.locator('#eventTrack .event-day').nth(2)).not.toContainText('Mystery');
});

test('event: Day 4 gives the Super Rare Savanna background', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { event: { claimed: 3, unclaimed: 1 } });
  await expect(page.locator('#eventTrack .event-day').nth(3)).toContainText('Super Rare');
  await press(page.locator('#claimEventBtn'));
  const p = await profileOf(page);
  expect(p.ownedBackgrounds).toContain('savanna');
  expect(p.selectedBackground).toBe('savanna');
});

test('event: Day 15 gives the Ultra Legendary Cheetah and completes the event', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { event: { claimed: 14, unclaimed: 1 } });
  await expect(page.locator('#eventTrack .event-day').nth(14)).toContainText('Ultra Legendary');
  await press(page.getByRole('button', { name: '🎁 Claim Day 15 reward' }));
  await expect(page.locator('#profileAvatar')).toHaveText('🐆');
  await expect(page.locator('#toast')).toContainText('ULTRA LEGENDARY Cheetah');
  await expect(page.locator('#eventStatus')).toContainText('Event complete');
  await expect(page.locator('#claimEventBtn')).toBeHidden();

  await press(page.locator('#emojiMore'));
  const card = page.locator('#shopGrid .emoji-item', { hasText: 'Cheetah' });
  await expect(card).toHaveClass(/rarity-ultra/);
  await expect(card.locator('.rarity-chip')).toHaveText('Ultra Legendary');
  await expect(card.getByRole('button', { name: 'Using Cheetah' })).toBeVisible();
});

test('event items show in the shop but cannot be bought', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 99999 });
  await press(page.locator('#emojiMore'));
  const cheetah = page.locator('#shopGrid .emoji-item', { hasText: 'Cheetah' });
  await expect(cheetah).toContainText('🎁 Event only');
  await expect(cheetah.getByRole('button', { name: 'Cheetah: win it in the Reward Event' })).toBeDisabled();
  await press(page.getByRole('tab', { name: '🎨 Backgrounds' }));
  await press(page.locator('#bgMore'));
  await expect(page.getByRole('button', { name: 'Rainbow Galaxy background: win it in the Reward Event' })).toBeDisabled();
  expect(await points(page)).toBe(99999);
});

test('streak freeze: saves the streak for one missed day', async ({ page }) => {
  await startOn(page, '2026-04-10T09:00:00');
  // Last played on the 8th, missed the 9th.
  await setProfile(page, { dailyStreak: 5, bestDailyStreak: 5, lastPlayDay: '2026-04-08', streakFreezes: 1 });
  await expect(page.locator('#dayStreak')).toHaveText('5');
  await expect(page.locator('#toast')).toContainText('saved your 5-day streak');
  expect((await profileOf(page)).streakFreezes).toBe(0);

  // Playing today continues the streak.
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await press(page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`));
  await expect(page.locator('#dayStreak')).toHaveText('6');
});

test('streak freeze: not enough freezes for the missed days means the streak is lost', async ({ page }) => {
  await startOn(page, '2026-04-10T09:00:00');
  // Missed the 8th and 9th, but only one freeze.
  await setProfile(page, { dailyStreak: 5, lastPlayDay: '2026-04-07', streakFreezes: 1 });
  await expect(page.locator('#dayStreak')).toHaveText('0');
  expect((await profileOf(page)).streakFreezes).toBe(1);   // the freeze is kept for later
});

test('event progress is included in backups', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { streakFreezes: 2, event: { claimed: 7, won: { 3: '🦉', 7: '🐧' } }, ownedEmojis: ['😀', '🦉', '🐧'] });
  const restored = await page.evaluate(() => window.EmiApp.readBackupCode(window.EmiApp.makeBackupCode()));
  expect(restored.profile.streakFreezes).toBe(2);
  expect(restored.profile.event).toMatchObject({ claimed: 7, won: { 3: '🦉', 7: '🐧' } });
});
