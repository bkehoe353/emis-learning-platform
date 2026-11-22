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

test('map: beating the land boss (7+ right) gives points, a suit, a background and a chest, and opens the next land', async ({ page }) => {
  await startOn(page, '2026-11-10T09:00:00');
  await setProfile(page, { points: 0, bonusChests: 0, map: { land: 0, step: 7 } });
  await expect(page.locator('#mapBossBtn')).toHaveText('⚔️ Fight the Bear Guardian!');
  await expect(page.locator('#mapPrize')).toContainText('500 points');
  await expect(page.locator('#mapPrize')).toContainText('Explorer Suit');
  await playBoss(page, 7);
  await expect(page.locator('#prizeReveal')).toBeVisible();
  await expect(page.locator('#revealTitle')).toContainText('You beat the Bear Guardian');
  await expect(page.locator('#revealVisual .reveal-item')).toHaveCount(4);
  await expect(page.locator('#revealVisual')).toContainText('500 points');
  await expect(page.locator('#revealVisual')).toContainText('Explorer Suit');
  await expect(page.locator('#revealVisual')).toContainText('Forest Glade background');
  await expect(page.locator('#revealUseBtn')).toHaveText('Wear the Explorer Suit');
  await press(page.locator('#revealUseBtn'));
  const p = await profileOf(page);
  expect(p.map).toEqual({ land: 1, step: 0 });               // the boss round isn't a map step
  expect(p.ownedBackgrounds).toContain('forestglade');
  expect(p.ownedSuits).toContain('explorer');
  expect(p.petSuit).toBe('explorer');
  expect(p.bonusChests).toBe(1);
  expect(await points(page)).toBe(7 * 10 + 500);
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
  for (const part of ['.den-wall', '.den-floor', '.den-window', '.den-bed svg', '.den-walker .fox-svg']) await expect(page.locator('#denRoom ' + part)).toHaveCount(1);
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

test('den: the heart wallpaper shows', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { den: { wallpaper: 'wp-hearts', owned: ['wp-hearts'] } });
  const bg = await page.locator('#denRoom .den-wall').evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain('data:image/svg+xml');
});

test('den: things can be dragged to a new place, and put back', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { den: { owned: ['dec-teddy'], decor: ['dec-teddy'] } });
  const teddy = page.locator('#denRoom [data-move="dec-teddy"]');
  await teddy.scrollIntoViewIfNeeded();
  const drag = async () => {
    const box = await teddy.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 30, { steps: 6 });
    await page.mouse.up();
  };
  await drag();                                           // not in move mode: nothing moves
  expect((await profileOf(page)).den.pos).toEqual({});
  await press(page.locator('#denMoveBtn'));
  await expect(page.locator('#denMoveHelp')).toBeVisible();
  await drag();
  const pos = (await profileOf(page)).den.pos['dec-teddy'];
  expect(pos[0]).toBeGreaterThan(12);                     // started at 8% from the left
  await page.reload();
  const left = await page.locator('#denRoom [data-move="dec-teddy"]').evaluate((el) => el.style.left);
  expect(left).toBe(pos[0] + '%');
  await press(page.locator('#denMoveBtn'));
  await press(page.locator('#denResetBtn'));
  expect((await profileOf(page)).den.pos).toEqual({});
});

test.describe(() => {
  test.use({ reducedMotion: 'no-preference' });
test('den: the fox walks around on four legs and sometimes naps', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-10T09:00:00') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-11-10T09:01:00'));
  await setProfile(page, {});
  await expect(page.locator('#denRoom .den-walker .leg')).toHaveCount(4);
  await page.evaluate(() => {
    window.__fox = { walking: false, sleeping: false, lefts: new Set() };
    const fox = document.querySelector('.den-walker');
    new MutationObserver(() => {
      if (fox.classList.contains('walking')) window.__fox.walking = true;
      if (fox.classList.contains('sleeping')) window.__fox.sleeping = true;
      window.__fox.lefts.add(fox.style.left);
    }).observe(fox, { attributes: true });
  });
  await page.clock.runFor(120_000);
  const seen = await page.evaluate(() => ({ walking: window.__fox.walking, sleeping: window.__fox.sleeping, places: window.__fox.lefts.size }));
  expect(seen.walking).toBe(true);
  expect(seen.sleeping).toBe(true);
  expect(seen.places).toBeGreaterThan(2);
});});


test('den: new furniture (sofa) can be bought, and its colour changed for free', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 1500 });
  await press(page.locator('#denEditBtn'));
  await press(page.getByRole('tab', { name: '🪑 Furniture' }));
  await press(page.getByRole('button', { name: 'Buy Sofa for 1500 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Sofa' }));
  await expect(page.locator('#denRoom .den-sofa')).toHaveCount(1);
  await press(page.getByRole('tab', { name: '🎨 Colours' }));
  await press(page.getByRole('button', { name: 'Sofa & armchair: Mint' }));
  expect((await profileOf(page)).den.colours.sofa).toBe('mint');
  expect(await points(page)).toBe(0);
  const count = await page.evaluate(() => [...document.querySelectorAll('#denOptions')].length);
  expect(count).toBe(1);
});

test('den: the fox can wear den clothes, and its suit can be chosen just for the den', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 2250, ownedSuits: ['beach'], petSuit: 'beach' });
  await expect(page.locator('#denRoom .fox-wear.head')).toHaveText('👒');
  await press(page.locator('#denEditBtn'));
  await press(page.getByRole('tab', { name: '🦊 Fox outfit' }));
  await press(page.getByRole('button', { name: 'Buy Glasses for 250 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Glasses' }));
  await expect(page.locator('#denRoom .fox-wear.face')).toHaveText('👓');
  await press(page.getByRole('button', { name: 'Buy Crown for 2000 points' }));
  await press(page.getByRole('button', { name: 'Confirm: buy Crown' }));
  await expect(page.locator('#denRoom .fox-wear.head')).toHaveText('👑');   // replaces the suit's hat
  expect(await points(page)).toBe(0);
  await press(page.getByRole('button', { name: 'Use No hat' }));
  await expect(page.locator('#denRoom .fox-wear.head')).toHaveText('👒');
  await press(page.getByRole('button', { name: 'Den suit: No suit' }));
  await expect(page.locator('#denRoom .fox-wear.head')).toHaveText('');
  const p = await profileOf(page);
  expect(p.den.suit).toBe('none');
  expect(p.petSuit).toBe('beach');                       // the Play-tab pet keeps its suit
  expect(p.den['wear-face']).toBe('face-glasses');
});

test('map: steps give coins and a chest halfway through each land', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 0, bonusChests: 0, map: { land: 0, step: 2 } });
  await page.evaluate(() => window.EmiApp.mapStep());
  let p = await profileOf(page);
  expect(p.map.step).toBe(3);
  expect(p.points).toBe(20);
  expect(p.bonusChests).toBe(0);
  await page.evaluate(() => window.EmiApp.mapStep());
  p = await profileOf(page);
  expect(p.points).toBe(40);
  expect(p.bonusChests).toBe(1);
});

test('a shortcut on the Play tab opens the sticker album', async ({ page }) => {
  await page.goto('/');
  await press(page.locator('#stickerShortcut'));
  await expect(page.locator('#page-shop')).toBeVisible();
  await expect(page.locator('#stickerPanel')).toBeVisible();
});
