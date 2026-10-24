// Tests for daily streaks, badges, celebrations, try-on, backup and the ranked leaderboard.
import { test, expect } from '@playwright/test';

const press = async (locator) => (test.info().project.use.hasTouch ? locator.tap() : locator.click());

async function productAnswer(page) {
  const m = (await page.locator('#question').textContent()).match(/(\d+) × (\d+) = \?/);
  return String(Number(m[1]) * Number(m[2]));
}

const points = async (page) => Number((await page.locator('#points').textContent()).replace(/,/g, ''));

// Saves a profile and reloads. By default the player has already had today's
// daily bonus and owns every badge, so totals only count answers and buying.
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

async function answerQuickQuizCorrectly(page) {
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await press(page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`));
}

const encodeCode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { errors.push('Unexpected pop-up: ' + d.message()); d.dismiss(); });
});
test.afterEach(() => { expect(errors, 'JavaScript errors on the page').toEqual([]); });

/* ---------- Daily streak ---------- */

test('daily streak: bonus once a day, grows on consecutive days, resets after a gap', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-03-02T09:00:00') });
  await page.goto('/');
  await expect(page.locator('#dayStreak')).toHaveText('0');
  await answerQuickQuizCorrectly(page);
  await expect(page.locator('#toast')).toContainText('Daily bonus: +20');
  await expect(page.locator('#dayStreak')).toHaveText('1');
  expect(await points(page)).toBe(10 + 20 + 50);   // answer + daily bonus + First Answer badge

  // Same day again: no second bonus.
  await press(page.locator('#closeBtn'));
  await answerQuickQuizCorrectly(page);
  expect(await points(page)).toBe(90);

  // Next day: streak 2, bonus +30.
  await page.clock.setSystemTime(new Date('2026-03-03T08:00:00'));
  await page.reload();
  await expect(page.locator('#dayStreakHint')).toHaveText('Play today to keep it!');
  await answerQuickQuizCorrectly(page);
  await expect(page.locator('#dayStreak')).toHaveText('2');
  expect(await points(page)).toBe(90 + 10 + 30);

  // Skip two days: the streak is lost and starts again at 1.
  await page.clock.setSystemTime(new Date('2026-03-06T08:00:00'));
  await page.reload();
  await expect(page.locator('#dayStreak')).toHaveText('0');
  await answerQuickQuizCorrectly(page);
  await expect(page.locator('#dayStreak')).toHaveText('1');
  expect(await page.evaluate(() => window.EmiApp.getProfile().bestDailyStreak)).toBe(2);
});

/* ---------- Badges ---------- */

test('badges: earned once with +50 points, shown in the Badges tab', async ({ page }) => {
  await page.goto('/');
  await press(page.getByRole('tab', { name: '🏅 Badges' }));
  await expect(page.locator('#badgePanel')).toBeVisible();
  const total = await page.evaluate(() => window.EmiApp.BADGES.length);
  await expect(page.locator('#badgeCount')).toContainText(`0 of ${total} badges`);
  await expect(page.locator('.badge-tile.earned')).toHaveCount(0);

  await answerQuickQuizCorrectly(page);
  await expect(page.locator('#toast')).toBeVisible();
  await expect(page.locator('.badge-tile.earned')).toHaveCount(1);
  await expect(page.locator('.badge-tile.earned')).toContainText('First Answer');
  await page.reload();
  await expect(page.locator('#badgeCount')).toContainText(`1 of ${total} badges`);
  expect(await points(page)).toBe(80);   // the badge reward is not given again
});

test('badges: rank, perfect-round and 100-correct badges', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { bestRank: 'diamond', bestRankAvg: 3, perfectRounds: 1, correctTotal: 120 }, { settled: false });
  await answerQuickQuizCorrectly(page);   // badges are checked when progress is saved
  const earned = await page.evaluate(() => Object.keys(window.EmiApp.getProfile().badges).sort());
  expect(earned).toEqual(['c100', 'diamond', 'first', 'gold', 'perfect']);
});

/* ---------- Celebrations ---------- */

test('celebrations: confetti and fox message on a purchase', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 500 });
  await press(page.getByRole('button', { name: 'Buy Cool Face for 100 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Cool Face' }));
  await expect(page.locator('#toast')).toContainText('You got 😎 Cool Face!');
  await expect(page.locator('#confetti .confetti-piece').first()).toBeAttached();
});

/* ---------- Try it on ---------- */

test('try on: preview an emoji and background without paying', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await setProfile(page, { points: 0 });
  await press(page.locator('#emojiMore'));
  await press(page.getByRole('button', { name: 'Try on Galaxy' }));
  await expect(page.locator('#profileAvatar')).toHaveText('🌌');
  await expect(page.locator('#tryOnNote')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try on Galaxy' })).toHaveText('👀 Trying on');
  expect(await points(page)).toBe(0);
  await page.clock.runFor(6_000);
  await expect(page.locator('#profileAvatar')).toHaveText('😀');
  await expect(page.locator('#tryOnNote')).toBeHidden();

  await press(page.getByRole('tab', { name: '🎨 Backgrounds' }));
  await press(page.getByRole('button', { name: 'Try on Ocean background' }));
  const bg = await page.locator('#profileAvatar').evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain('rgb(61, 139, 253)');   // ocean blue
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('emisLearningProfile')).selectedBackground);
  expect(saved).toBe('sunny');
});

/* ---------- Backup ---------- */

test('backup: make a code, restore it on a fresh device, reject bad codes', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 1234, name: 'Emi', ownedEmojis: ['😀', '👑'], selectedEmoji: '👑', bestRank: 'gold', bestRankAvg: 4.2 });
  await page.evaluate(() => localStorage.setItem('emisLearningFriends',
    JSON.stringify([{ id: 'f-1', name: 'Zoe', emoji: '🦄', points: 50, updated: new Date().toISOString() }])));
  await page.reload();
  await press(page.locator('#makeBackupBtn'));
  const code = await page.locator('#backupCode').inputValue();
  expect(code.startsWith('EMI1-')).toBe(true);

  // A "new device": everything cleared.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  expect(await points(page)).toBe(0);

  // Bad and damaged codes are rejected.
  await page.locator('#restoreInput').fill('hello');
  await press(page.locator('#restoreBtn'));
  await expect(page.locator('#backupMessage')).toContainText('doesn’t look right');
  const damaged = code.slice(0, 20) + (code[20] === 'A' ? 'B' : 'A') + code.slice(21);
  await page.locator('#restoreInput').fill(damaged);
  await press(page.locator('#restoreBtn'));
  await expect(page.locator('#backupMessage')).toContainText('doesn’t look right');

  // Good code: the first tap explains, the second tap restores.
  await page.locator('#restoreInput').fill(code);
  await press(page.locator('#restoreBtn'));
  await expect(page.locator('#backupMessage')).toContainText('1,234 points');
  expect(await points(page)).toBe(0);
  await press(page.getByRole('button', { name: 'Tap again to replace this device’s progress' }));
  expect(await points(page)).toBe(1234);
  await expect(page.locator('#profileAvatar')).toHaveText('👑');
  await expect(page.locator('#profileTitle')).toHaveText('Emi');
  await expect(page.locator('#profileRank')).toContainText('Gold');
  await expect(page.locator('.leader-row', { hasText: 'Zoe' })).toBeVisible();
  await page.reload();
  expect(await points(page)).toBe(1234);
});

/* ---------- Leaderboard by rank ---------- */

test('leaderboard: ordered by rank, then average time, then points; shows streaks', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-03-10T09:00:00') });
  await page.goto('/');
  await setProfile(page, { name: 'Emi', points: 300, bestRank: 'gold', bestRankAvg: 4.5, dailyStreak: 4 });
  const friendsToAdd = [
    { v: 2, id: 'max', name: 'Max', emoji: '🐶', points: 99999 },   // unranked
    { v: 2, id: 'sam', name: 'Sam', emoji: '🐼', rank: 'gold', rankAvg: 4.0, points: 5, streak: 2, streakDay: '2026-03-01' },
    { v: 2, id: 'zoe', name: 'Zoe', emoji: '🦄', rank: 'diamond', rankAvg: 3.1, points: 10, streak: 6, streakDay: '2026-03-10' },
  ];
  for (const f of friendsToAdd) {
    await page.locator('#friendCodeInput').fill(encodeCode(f));
    await press(page.locator('#addFriendBtn'));
  }
  const rows = page.locator('.leader-row');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText('Zoe');
  await expect(rows.nth(1)).toContainText('Sam');
  await expect(rows.nth(2)).toContainText('Emi (You)');
  await expect(rows.nth(3)).toContainText('Max');

  await expect(rows.nth(0)).toContainText('Diamond rank · 3.1s');
  await expect(rows.nth(0)).toContainText('🔥 6-day streak');
  await expect(rows.nth(0)).not.toContainText('ask for a new code');   // Zoe's code is from today
  await expect(rows.nth(0).locator('.score img[alt="Diamond rank"]')).toBeVisible();
  await expect(rows.nth(1)).toContainText('ask for a new code');   // Sam's code is old
  await expect(rows.nth(2)).toContainText('🔥 4-day streak');
  await expect(rows.nth(3)).toContainText('Unranked');
  await expect(rows.nth(3)).toContainText('No day streak yet');

  // My friend code shares my streak and rank time.
  const mine = await page.evaluate(() => JSON.parse(new TextDecoder().decode(
    Uint8Array.from(atob(window.EmiApp.makeFriendCode()), (c) => c.charCodeAt(0)))));
  expect(mine).toMatchObject({ rank: 'gold', rankAvg: 4.5, streak: 4 });
});

/* ---------- Rarities ---------- */

test('rarities: every item has a tier by price, shown on its card', async ({ page }) => {
  await page.goto('/');
  const tiers = await page.evaluate(() => [0, 999, 1000, 4999, 5000, 9999, 10000, 15999, 16000, 18000].map((p) => window.EmiApp.rarityFor(p).name));
  expect(tiers).toEqual(['Common', 'Common', 'Rare', 'Rare', 'Super Rare', 'Super Rare', 'Epic', 'Epic', 'Legendary', 'Legendary']);

  // Every tier is used by both shops.
  const used = await page.evaluate(() => {
    const { EMOJI_CATALOG, BACKGROUND_CATALOG, rarityFor } = window.EmiApp;
    const names = (list) => [...new Set(list.map((i) => rarityFor(i.price).name))];
    return { emoji: names(EMOJI_CATALOG), bg: names(BACKGROUND_CATALOG) };
  });
  expect(used.emoji).toEqual(['Common', 'Rare', 'Super Rare', 'Epic', 'Legendary']);
  expect(used.bg).toEqual(['Common', 'Rare', 'Super Rare', 'Epic', 'Legendary']);

  await press(page.locator('#emojiMore'));
  const galaxy = page.locator('#shopGrid .emoji-item', { hasText: 'Galaxy' });
  await expect(galaxy).toHaveClass(/rarity-legendary/);
  await expect(galaxy.locator('.rarity-chip')).toHaveText('Legendary');
  await expect(page.locator('#shopGrid .emoji-item', { hasText: 'Cool Face' }).locator('.rarity-chip')).toHaveText('Common');
  await expect(page.locator('#shopGrid .emoji-item', { hasText: 'Crown' }).first().locator('.rarity-chip')).toHaveText('Rare');
});

test('rarities: buying a Legendary gets a special message', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 20000 });
  await press(page.locator('#emojiMore'));
  await press(page.getByRole('button', { name: 'Buy Galaxy for 18000 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Galaxy' }));
  await expect(page.locator('#toast')).toContainText('You got a LEGENDARY 🌌 Galaxy!');
});

test('leaderboard: a friend in a time zone ahead still shows a current streak', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-03-10T23:30:00') });
  await page.goto('/');
  await page.locator('#friendCodeInput').fill(encodeCode({ v: 2, id: 'kim', name: 'Kim', emoji: '🐸', points: 5, streak: 3, streakDay: '2026-03-11' }));
  await press(page.locator('#addFriendBtn'));
  const row = page.locator('.leader-row', { hasText: 'Kim' });
  await expect(row).toContainText('🔥 3-day streak');
  await expect(row).not.toContainText('ask for a new code');
  await expect(page.locator('.leader-row .rank').first()).toHaveText('1st');
});

test('Start playing scrolls to the challenges instead of starting a game', async ({ page }) => {
  await page.goto('/');
  await press(page.getByRole('button', { name: '🚀 Start playing' }));
  await expect(page.locator('#playArea')).not.toHaveClass(/active/);
  await expect(page.getByRole('heading', { name: 'Choose your challenge' })).toBeInViewport();
  await expect(page.locator('#challenges')).toBeFocused();
});
