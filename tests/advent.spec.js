// Tests for the Christmas Advent Calendar: hidden before December, 24 doors in December.
import { test, expect } from '@playwright/test';
import { press, reveal } from './helpers.js';

const profileOf = (page) => page.evaluate(() => window.EmiApp.getProfile());

// Saves a profile and reloads (today's bonus taken and all badges owned, so totals stay simple).
async function setProfile(page, data) {
  await page.evaluate((d) => {
    const now = new Date(Date.now());
    const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    localStorage.setItem('emisLearningProfile', JSON.stringify({ lastPlayDay: day, dailyStreak: 1, badges: Object.fromEntries(window.EmiApp.BADGES.map((b) => [b.id, day])), ...d }));
  }, data);
  await page.reload();
}

// Fixed, frozen clock: only runFor() and setSystemTime() move time.
async function startOn(page, isoDateTime) {
  await page.clock.install({ time: new Date(isoDateTime) });
  await page.goto('/');
  await page.clock.pauseAt(new Date(new Date(isoDateTime).getTime() + 60_000));
}

// One lesson: a full Speed Round (it ends by itself after 60 seconds).
async function finishLesson(page) {
  await press(page.getByRole('button', { name: 'Start the timer →' }));
  await page.clock.runFor(61_000);
  await expect(page.locator('#roundLabel')).toHaveText('Round finished');
  await press(page.locator('#closeBtn'));
}

const door = (page, day) => page.locator('#adventGrid .advent-door').filter({ has: page.locator('.advent-num', { hasText: new RegExp(`^${day}$`) }) });

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { errors.push('Unexpected pop-up: ' + d.message()); d.dismiss(); });
});
test.afterEach(() => { expect(errors, 'JavaScript errors on the page').toEqual([]); });

test('before December nothing about the calendar is shown anywhere', async ({ page }) => {
  await startOn(page, '2026-11-30T20:00:00');
  await setProfile(page, { points: 99999, lessonsDay: '2026-11-30', lessons: 1 });
  await expect(page.locator('#adventSection')).toBeHidden();
  await expect(page.locator('#adventBanner')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/december/);
  await expect(page.locator('#wardrobe')).not.toContainText('Santa');
  await press(page.locator('#tab-shop'));
  await press(page.locator('#emojiMore'));
  await expect(page.locator('#shopGrid')).not.toContainText('Advent only');
  await expect(page.locator('#shopGrid')).not.toContainText('Snowman');
  await press(page.getByRole('tab', { name: '🎨 Backgrounds' }));
  await press(page.locator('#bgMore'));
  await expect(page.locator('#bgGrid')).not.toContainText('Snowy Night');
});

test('1 December: the calendar appears; a lesson opens door 1 (Snowman)', async ({ page }) => {
  await startOn(page, '2026-12-01T08:00:00');
  await setProfile(page, {});
  await expect(page.locator('body')).toHaveClass(/december/);
  await reveal(page.locator('#adventSection'));
  await expect(page.locator('#adventSection')).toBeVisible();
  await expect(page.locator('#adventGrid .advent-door')).toHaveCount(24);
  await expect(page.locator('#adventStatus')).toContainText('Finish 1 lesson today to open door 1');
  await expect(door(page, 1)).toBeDisabled();
  await expect(door(page, 2)).toHaveClass(/locked/);

  await finishLesson(page);
  await expect(page.locator('#adventBanner')).toBeVisible();
  await expect(page.locator('#eventDot')).toBeVisible();
  await press(page.locator('#adventBanner'));                       // jumps to the calendar
  await expect(page.locator('#page-event')).toBeVisible();
  await press(door(page, 1));
  await expect(page.locator('#revealTitle')).toHaveText('🎄 Door 1');
  await expect(page.locator('#revealName')).toHaveText('Snowman');
  await press(page.locator('#revealUseBtn'));
  await expect(page.locator('#profileAvatar')).toHaveText('⛄');
  await expect(door(page, 1)).toHaveClass(/opened/);
  await expect(page.locator('#adventStatus')).toContainText('Door 2 opens tomorrow');
  await expect(page.locator('#adventBanner')).toBeHidden();
  expect((await profileOf(page)).advent.opened).toEqual([1]);

  // Christmas prizes show in the shop now, but can't be bought.
  await press(page.locator('#tab-shop'));
  await press(page.locator('#emojiMore'));
  await expect(page.getByRole('button', { name: 'Reindeer: win it in the Advent Calendar' })).toBeDisabled();
});

test('missed days: earlier doors can still be opened later in December', async ({ page }) => {
  await startOn(page, '2026-12-05T08:00:00');
  await setProfile(page, { advent: { year: 2026, opened: [1] } });
  await reveal(page.locator('#adventStatus'));
  await expect(page.locator('#adventStatus')).toContainText('your 4 doors');
  await finishLesson(page);
  for (const d of [2, 3, 4, 5]) {
    await press(door(page, d));
    await press(page.locator('#revealCloseBtn'));
  }
  await expect(door(page, 6)).toHaveClass(/locked/);
  const p = await profileOf(page);
  expect(p.advent.opened.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  expect(p.ownedBackgrounds).toContain('snowynight');    // door 3
  expect(p.ownedEmojis).toContain('🦌');                  // door 5
});

test('door 24 gives the Ultra Legendary Santa Suit, worn by the fox', async ({ page }) => {
  await startOn(page, '2026-12-24T08:00:00');
  const all23 = Array.from({ length: 23 }, (_, i) => i + 1);
  await setProfile(page, { advent: { year: 2026, opened: all23 }, lessonsDay: '2026-12-24', lessons: 1 });
  await press(door(page, 24));
  await expect(page.locator('#revealTitle')).toHaveText('🎄 Door 24: Merry Christmas!');
  await expect(page.locator('#revealName')).toHaveText('Santa Suit');
  await expect(page.locator('#revealRarity')).toHaveText('Ultra Legendary');
  await press(page.locator('#revealCloseBtn'));
  await expect(page.locator('#adventStatus')).toContainText('opened every door');
  await expect(page.locator('#petTitle')).toContainText('(Santa Suit)');
});

test('January: the calendar is gone, but Christmas prizes are kept', async ({ page }) => {
  await startOn(page, '2027-01-02T09:00:00');
  await setProfile(page, { advent: { year: 2026, opened: [1, 6] }, ownedEmojis: ['😀', '⛄'], ownedSuits: ['elf'] });
  await expect(page.locator('#adventSection')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/december/);
  await expect(page.getByRole('button', { name: '🧝 Elf Suit' })).toBeVisible();          // owned: still in the wardrobe
  await expect(page.locator('#wardrobe')).not.toContainText('Santa');                      // not owned: hidden again
  await press(page.locator('#tab-shop'));
  await press(page.locator('#emojiMore'));
  await expect(page.getByRole('button', { name: 'Use Snowman' })).toBeVisible();
  await expect(page.locator('#shopGrid')).not.toContainText('Reindeer');
});
