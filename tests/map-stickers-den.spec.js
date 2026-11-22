// Tests for the Fox Adventure Map, the Sticker Album and the Fox's Den.
import { test, expect } from '@playwright/test';
import { press, reveal } from './helpers.js';

const points = async (page) => Number((await page.locator('#points').textContent()).replace(/,/g, ''));
const profileOf = (page) => page.evaluate(() => window.EmiApp.getProfile());

async function productAnswer(page) {
  const m = (await page.locator('#question').textContent()).match(/(\d+) × (\d+) = \?/);
  return String(Number(m[1]) * Number(m[2]));
}
const correctButton = async (page) => page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`);
const wrongButton = async (page) => page.locator(`#answers .answer:not([data-value="${await productAnswer(page)}"])`).first();

// Saves a profile and reloads. By default today's bonus is taken and every badge is owned.
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

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { errors.push('Unexpected pop-up: ' + d.message()); d.dismiss(); });
});
test.afterEach(() => { expect(errors, 'JavaScript errors on the page').toEqual([]); });

/* ---------- Adventure Map ---------- */

test('map: each finished lesson walks the fox one step', async ({ page }) => {
  await startOn(page, '2026-11-10T09:00:00');
  await setProfile(page, {});
  await expect(page.locator('#mapLandTitle')).toHaveText('🌲 Whispering Forest');
  await expect(page.locator('#mapPath .map-node')).toHaveCount(8);
  await expect(page.locator('#mapStatus')).toContainText('7 more steps');
  await finishLesson(page);
  expect((await profileOf(page)).map).toEqual({ land: 0, step: 1 });
  await expect(page.locator('#mapStatus')).toContainText('6 more steps');
  await expect(page.locator('#mapPath .map-node.done')).toHaveCount(1);
  await expect(page.locator('#mapBossBtn')).toBeHidden();
});

async function playBoss(page, correct) {
  await press(page.locator('#mapBossBtn'));
  await expect(page.locator('#gameTitle')).toContainText('Bear Guardian');
  for (let q = 0; q < 10; q++) {
    await press(q < correct ? await correctButton(page) : await wrongButton(page));
    await page.clock.runFor(900);
  }
}

test('map: beating the land boss (7+ right) unlocks the next land and its background', async ({ page }) => {
  await startOn(page, '2026-11-10T09:00:00');
  await setProfile(page, { points: 0, map: { land: 0, step: 7 } });
  await expect(page.locator('#mapBossBtn')).toHaveText('⚔️ Fight the Bear Guardian!');
  await playBoss(page, 7);
  await expect(page.locator('#prizeReveal')).toBeVisible();
  await expect(page.locator('#revealTitle')).toContainText('You beat the Bear Guardian');
  await expect(page.locator('#revealName')).toHaveText('Forest Glade background');
  await press(page.locator('#revealUseBtn'));
  const p = await profileOf(page);
  expect(p.map).toEqual({ land: 1, step: 0 });               // the boss round isn't a map step
  expect(p.selectedBackground).toBe('forestglade');
  expect(await points(page)).toBe(7 * 10 + 200);
  await press(page.locator('#closeBtn'));
  await expect(page.locator('#mapLandTitle')).toHaveText('🏖️ Sunny Shores');
  await expect(page.locator('#mapLands .map-land.done')).toHaveCount(1);
});

test('map: scoring under 7 means try again', async ({ page }) => {
  await startOn(page, '2026-11-10T09:00:00');
  await setProfile(page, { map: { land: 0, step: 7 } });
  await playBoss(page, 6);
  await expect(page.locator('#feedback')).toContainText('So close');
  expect((await profileOf(page)).map).toEqual({ land: 0, step: 7 });
  await press(page.locator('#closeBtn'));
  await expect(page.locator('#mapBossBtn')).toBeVisible();
});

test('map: finishing every land', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { map: { land: 6, step: 0 } });
  await expect(page.locator('#mapLandTitle')).toHaveText('🏆 Adventure complete!');
  await expect(page.locator('#mapLands .map-land.done')).toHaveCount(6);
});

/* ---------- Sticker Album ---------- */

test('stickers: a sticker for each finished lesson, duplicates counted', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });   // always the first sticker (🐶)
  await startOn(page, '2026-11-10T09:00:00');
  await setProfile(page, {});
  await finishLesson(page);
  expect((await profileOf(page)).stickers).toEqual({ 'animals:🐶': 1 });
  await finishLesson(page);
  expect((await profileOf(page)).stickers).toEqual({ 'animals:🐶': 2 });
  await press(page.getByRole('tab', { name: '🎴 Stickers' }));
  const animals = page.locator('.sticker-album').first();
  await expect(animals).toContainText('1 of 8');
  await expect(animals.locator('.sticker.got')).toHaveText('🐶×2');
  await expect(animals.locator('.sticker:not(.got)')).toHaveCount(7);
});

test('stickers: completing an album gives its free emoji, once', async ({ page }) => {
  // Index 7 of 32 is the last Animals sticker (🐧).
  await page.addInitScript(() => { Math.random = () => 7.5 / 32; });
  await startOn(page, '2026-11-10T09:00:00');
  const seven = Object.fromEntries(['🐶', '🐱', '🐰', '🐹', '🐻', '🐸', '🐵'].map((e) => [`animals:${e}`, 1]));
  await setProfile(page, { stickers: seven });
  await press(page.getByRole('button', { name: 'Start the timer →' }));
  await page.clock.runFor(61_000);
  // The prize screen pops up over the game as soon as the lesson ends.
  await expect(page.locator('#revealTitle')).toHaveText('📒 Animals album complete!');
  await expect(page.locator('#revealName')).toHaveText('Kangaroo');
  await press(page.locator('#revealUseBtn'));
  await press(page.locator('#closeBtn'));
  await expect(page.locator('#profileAvatar')).toHaveText('🦘');
  expect((await profileOf(page)).albumsDone).toEqual(['animals']);
  await finishLesson(page);                                    // another 🐧: no second prize
  await expect(page.locator('#prizeReveal')).toBeHidden();
  expect((await profileOf(page)).ownedEmojis.filter((e) => e === '🦘')).toHaveLength(1);

  await press(page.getByRole('tab', { name: '🎴 Stickers' }));
  await expect(page.locator('.sticker-album').first()).toContainText('Complete!');
});

test('stickers: album emojis show in the shop but cannot be bought', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 99999 });
  await press(page.locator('#emojiMore'));
  await expect(page.getByRole('button', { name: 'Kangaroo: win it in the Sticker Album' })).toBeDisabled();
});

/* ---------- Fox's Den ---------- */

test('den: the bedroom is drawn with the fox in it, wearing its suit', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { petName: 'Biscuit', ownedSuits: ['beach'], petSuit: 'beach' });
  await expect(page.locator('#denTitle')).toHaveText('🏠 Biscuit’s Den');
  for (const part of ['.den-wall', '.den-floor', '.den-window', '.den-bed svg', '.den-fox']) await expect(page.locator('#denRoom ' + part)).toHaveCount(1);
  await expect(page.locator('#denRoom .den-fox-hat')).toHaveText('👒');
});

test('den: colours are free to change and are saved', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 50 });
  await press(page.locator('#denEditBtn'));
  await press(page.getByRole('button', { name: 'Walls: Pink' }));
  await press(page.getByRole('button', { name: 'Bedding: Red' }));
  await press(page.getByRole('button', { name: 'Window view: 🌙 Night' }));
  const p = await profileOf(page);
  expect(p.den.colours).toMatchObject({ wall: 'pink', bedding: 'red', sky: 'night' });
  expect(await points(page)).toBe(50);
  const wall = await page.locator('#denRoom .den-wall').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(wall).toBe('rgb(255, 198, 221)');
  await page.reload();
  expect((await profileOf(page)).den.colours.wall).toBe('pink');
});

test('den: buying furniture (two taps) puts it in the room; it stays bought', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 2000 });
  await press(page.locator('#denEditBtn'));
  await press(page.getByRole('tab', { name: '🛏️ Beds' }));
  await expect(page.getByRole('button', { name: 'Buy Princess canopy bed for 2500 points' })).toHaveText('Need 500 more');
  await press(page.getByRole('button', { name: 'Buy Bunk bed for 1500 points' }));
  expect(await points(page)).toBe(2000);
  await press(page.getByRole('button', { name: 'Confirm: buy Bunk bed' }));
  expect(await points(page)).toBe(500);
  await expect(page.locator('#denRoom .den-bed')).toHaveClass(/bunk/);
  await expect(page.getByRole('button', { name: 'Using Bunk bed' })).toBeDisabled();
  await press(page.getByRole('button', { name: 'Use Cosy bed' }));
  await expect(page.locator('#denRoom .den-bed')).not.toHaveClass(/bunk/);
  await page.reload();
  expect((await profileOf(page)).den.owned).toContain('bed-bunk');
  expect(await points(page)).toBe(500);
});

test('den: decorations can be shown and hidden', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 300 });
  await press(page.locator('#denEditBtn'));
  await press(page.getByRole('tab', { name: '🧸 Decorations' }));
  await press(page.getByRole('button', { name: 'Buy Teddy bear for 300 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Teddy bear' }));
  await expect(page.locator('#denRoom .den-decor')).toHaveText('🧸');
  await press(page.getByRole('button', { name: 'Hide Teddy bear' }));
  await expect(page.locator('#denRoom .den-decor')).toHaveCount(0);
  await press(page.getByRole('button', { name: 'Show Teddy bear' }));
  await expect(page.locator('#denRoom .den-decor')).toHaveCount(1);
});

test('den: a wide range of things to buy, all drawable', async ({ page }) => {
  await page.goto('/');
  // Own and use everything at once: the room must still draw without errors.
  const all = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#denOptions')].length;   // touch the page
    return items;
  });
  expect(all).toBe(1);
  const dens = [
    { bed: 'bed-canopy', desk: 'desk-study', chair: 'chair-wood', lamp: 'lamp-desk', shelf: 'shelf-books', poster: 'poster-space', wallpaper: 'wp-hearts', floor: 'fl-carpet', rug: 'rug-star' },
    { bed: 'bed-car', desk: 'desk-gaming', chair: 'chair-gaming', lamp: 'lamp-fairy', wallpaper: 'wp-clouds', floor: 'fl-tiles', rug: 'rug-rainbow' },
    { bed: 'bed-cloud', chair: 'chair-beanbag', lamp: 'lamp-lava', wallpaper: 'wp-stars', floor: 'fl-grass', rug: 'rug-round' },
  ];
  for (const d of dens) {
    const owned = Object.values(d);
    await setProfile(page, { den: { ...d, owned, decor: [] } });
    const den = (await profileOf(page)).den;
    for (const [slot, id] of Object.entries(d)) expect(den[slot], slot).toBe(id);
    await expect(page.locator('#denRoom .den-bed svg')).toHaveCount(1);
  }
});

test('Interior Designer badge after 5 den purchases', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 5000, den: { owned: ['rug-round', 'chair-wood', 'lamp-desk', 'poster-cat'] } }, { settled: false });
  await press(page.locator('#denEditBtn'));
  await press(page.getByRole('tab', { name: '🧸 Decorations' }));
  await press(page.getByRole('button', { name: 'Buy Plant for 200 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Plant' }));
  expect(Object.keys((await profileOf(page)).badges)).toContain('decorator');
});
