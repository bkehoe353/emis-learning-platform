// Tests for events (the ended 15-Day event, the Fox Fashion Event), ex-event shop items,
// the Emi emoji, fox suits and streak freezes.
import { test, expect } from '@playwright/test';
import { press, reveal } from './helpers.js';

const points = async (page) => Number((await page.locator('#points').textContent()).replace(/,/g, ''));
const profileOf = (page) => page.evaluate(() => window.EmiApp.getProfile());

async function productAnswer(page) {
  const m = (await page.locator('#question').textContent()).match(/(\d+) × (\d+) = \?/);
  return String(Number(m[1]) * Number(m[2]));
}

// Saves a profile and reloads. By default the player has already had today's
// daily bonus and owns every badge, so totals only change because of what a test does.
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

// One lesson: a full Speed Round (it ends by itself after 60 seconds).
async function finishSpeedRound(page) {
  await press(page.getByRole('button', { name: 'Start the timer →' }));
  await page.clock.runFor(61_000);
  await expect(page.locator('#roundLabel')).toHaveText('Round finished');
  await press(page.locator('#closeBtn'));
}

async function closePrizeScreen(page) {
  await press(page.locator('#revealCloseBtn'));
  await expect(page.locator('#prizeReveal')).toBeHidden();
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { errors.push('Unexpected pop-up: ' + d.message()); d.dismiss(); });
});
test.afterEach(() => { expect(errors, 'JavaScript errors on the page').toEqual([]); });

/* ---------- The ended 15-Day Reward Event ---------- */

test('15-Day event has ended: unclaimed rewards are given automatically', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 0, event: { claimed: 1, unclaimed: 1 } });   // Day 2 (+100) was waiting
  await expect(page.locator('#toast')).toContainText('has ended');
  const p = await profileOf(page);
  expect(p.event).toMatchObject({ claimed: 2, unclaimed: 0 });
  expect(await points(page)).toBe(100);
  await page.reload();                                 // given only once
  expect(await points(page)).toBe(100);
});

test('ex-event emojis and backgrounds can now be bought', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 40000 });
  await press(page.locator('#emojiMore'));
  await press(page.getByRole('button', { name: 'Buy Owl for 11000 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Owl' }));
  expect(await points(page)).toBe(29000);
  await expect(page.locator('#profileAvatar')).toHaveText('🦉');

  const cheetah = page.locator('#shopGrid .emoji-item', { hasText: 'Cheetah' });
  await expect(cheetah.locator('.rarity-chip')).toHaveText('Ultra Legendary');
  await press(page.getByRole('button', { name: 'Buy Cheetah for 25000 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Cheetah' }));
  expect(await points(page)).toBe(4000);

  await press(page.getByRole('tab', { name: '🎨 Backgrounds' }));
  await press(page.locator('#bgMore'));
  await expect(page.getByRole('button', { name: 'Buy Savanna background for 6000 points' })).toHaveText('Need 2,000 more');
});

/* ---------- The Emi emoji ---------- */

test('Emi emoji: Ultra Legendary, must be bought, shows a girl on a cheetah', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 1000, name: 'Emi' });
  await press(page.locator('#emojiMore'));
  const card = page.locator('#shopGrid .emoji-item', { has: page.getByRole('button', { name: 'Buy Emi for 30000 points' }) });
  await expect(card).toHaveClass(/rarity-ultra/);
  await expect(card).toContainText('30,000 points');
  await expect(card.getByRole('button', { name: 'Buy Emi for 30000 points' })).toHaveText('Need 29,000 more');
  await expect(card.locator('.emi-wrap')).toHaveAttribute('aria-label', 'Emi riding a cheetah');

  await setProfile(page, { points: 30000, name: 'Emi' });
  await press(page.locator('#emojiMore'));
  await press(page.getByRole('button', { name: 'Buy Emi for 30000 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Emi' }));
  expect(await points(page)).toBe(0);
  await expect(page.locator('#profileAvatar .emi-girl')).toHaveText('👧');
  await expect(page.locator('#profileAvatar .emi-cheetah')).toHaveText('🐆');
  await expect(page.locator('.leader-row.you .face .emi-wrap')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('#profileAvatar .emi-wrap')).toHaveCount(1);
});

/* ---------- Fox Fashion Event ---------- */

test('fashion event: 2 lessons unlock Day 1 (+100 points), shown on the prize screen', async ({ page }) => {
  await startOn(page, '2026-04-01T09:00:00');
  await setProfile(page, { points: 0 });
  await expect(page.locator('#eventTrack .event-day')).toHaveCount(20);
  await expect(page.locator('#eventStatus')).toContainText('0 of 2 done');

  await finishSpeedRound(page);
  await expect(page.locator('#eventStatus')).toContainText('1 of 2 done');
  await finishSpeedRound(page);
  await press(page.getByRole('button', { name: '🎁 Claim Day 1 reward' }));
  await expect(page.locator('#prizeReveal')).toBeVisible();
  await expect(page.locator('#revealName')).toHaveText('100 points');
  expect(await points(page)).toBe(100);
  await closePrizeScreen(page);
  await expect(page.locator('#eventStatus')).toContainText('Come back tomorrow for Day 2');

  await finishSpeedRound(page);                        // a third lesson earns nothing more today
  await expect(page.locator('#claimEventBtn')).toBeHidden();
});

test('fashion event: Day 3 gives the Beach Suit, which the fox wears; wardrobe changes suits', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { fashion: { claimed: 2, unclaimed: 1 } });
  await expect(page.locator('#eventTrack .event-day').nth(2)).toContainText('Fox suit');
  await press(page.locator('#claimEventBtn'));
  await expect(page.locator('#revealName')).toHaveText('Beach Suit');
  await expect(page.locator('#revealRarity')).toHaveText('Rare');
  await expect(page.locator('#revealVisual .fox-figure .fox-body')).toHaveText('🦊');
  await closePrizeScreen(page);

  const p = await profileOf(page);
  expect(p.ownedSuits).toEqual(['beach']);
  expect(p.petSuit).toBe('beach');
  await expect(page.locator('#petTitle')).toContainText('(Beach Suit)');
  await expect(page.locator('#petAccessory')).toHaveText('👒');

  await press(page.getByRole('button', { name: '🦊 No suit' }));
  await expect(page.locator('#petTitle')).not.toContainText('Suit');
  await expect(page.getByRole('button', { name: 'Dinosaur Suit: win it in the Fox Fashion Event' })).toBeDisabled();
  await press(page.getByRole('button', { name: '🏖️ Beach Suit' }));
  await expect(page.locator('#petTitle')).toContainText('(Beach Suit)');
});

test('fashion event: Day 5 gives a bonus chest that opens without a lesson', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await setProfile(page, { fashion: { claimed: 4, unclaimed: 1 } });
  await press(page.locator('#claimEventBtn'));
  await expect(page.locator('#revealName')).toHaveText('Bonus chest');
  await closePrizeScreen(page);
  await expect(page.locator('#openChestBtn')).toHaveText('🧰 Open a bonus chest (1 left)');
  await press(page.locator('#openChestBtn'));
  await page.clock.runFor(1_000);
  await expect(page.locator('#prizeReveal')).toBeVisible();
  expect((await profileOf(page)).bonusChests).toBe(0);
});

test('fashion event: Day 20 gives the Ultra Legendary Royal Dragon Suit and completes it', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { fashion: { claimed: 19, unclaimed: 1 } });
  await expect(page.locator('#eventTrack .event-day').nth(19)).toContainText('Ultra Legendary');
  await press(page.getByRole('button', { name: '🎁 Claim Day 20 reward' }));
  await expect(page.locator('#revealName')).toHaveText('Royal Dragon Suit');
  await expect(page.locator('#revealRarity')).toHaveText('Ultra Legendary');
  await closePrizeScreen(page);
  await expect(page.locator('#eventStatus')).toContainText('Event complete');
  await expect(page.locator('#petAccessory')).toHaveText('👑');
});

test('fashion event: a suit every 3 days, other rewards in between', async ({ page }) => {
  await page.goto('/');
  const days = await page.evaluate(() => window.EmiApp.EVENTS.fashion.rewards.map((r, i) => r.type === 'suit' ? i + 1 : null).filter(Boolean));
  expect(days).toEqual([3, 6, 9, 12, 15, 18, 20]);
});

test('Fashion Fox badge for 3 suits', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { ownedSuits: ['beach', 'dino'], fashion: { claimed: 8, unclaimed: 1 } }, { settled: false });
  await press(page.locator('#claimEventBtn'));         // Day 9: Astronaut Suit
  expect(Object.keys((await profileOf(page)).badges)).toContain('fashion');
});

/* ---------- Streak freezes ---------- */

test('streak freeze: saves the streak for one missed day', async ({ page }) => {
  await startOn(page, '2026-04-10T09:00:00');
  await setProfile(page, { dailyStreak: 5, bestDailyStreak: 5, lastPlayDay: '2026-04-08', streakFreezes: 1 });
  await expect(page.locator('#dayStreak')).toHaveText('5');
  await expect(page.locator('#toast')).toContainText('saved your 5-day streak');
  expect((await profileOf(page)).streakFreezes).toBe(0);
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await press(page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`));
  await expect(page.locator('#dayStreak')).toHaveText('6');
});

test('streak freeze: not enough freezes for the missed days means the streak is lost', async ({ page }) => {
  await startOn(page, '2026-04-10T09:00:00');
  await setProfile(page, { dailyStreak: 5, lastPlayDay: '2026-04-07', streakFreezes: 1 });
  await expect(page.locator('#dayStreak')).toHaveText('0');
  expect((await profileOf(page)).streakFreezes).toBe(1);
});

test('event progress and suits are included in backups', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { streakFreezes: 2, ownedSuits: ['beach'], petSuit: 'beach', fashion: { claimed: 3 }, bonusChests: 2 });
  const restored = await page.evaluate(() => window.EmiApp.readBackupCode(window.EmiApp.makeBackupCode()));
  expect(restored.profile).toMatchObject({ streakFreezes: 2, ownedSuits: ['beach'], petSuit: 'beach', bonusChests: 2 });
  expect(restored.profile.fashion.claimed).toBe(3);
});
