// Tests for tabs, the Weekly Treasure Chest, the pet fox, Boss Battle and the Friend Challenge.
import { test, expect } from '@playwright/test';
import { press, fillIn, reveal } from './helpers.js';

const points = async (page) => Number((await page.locator('#points').textContent()).replace(/,/g, ''));
const profileOf = (page) => page.evaluate(() => window.EmiApp.getProfile());
const encodeCode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');

async function productAnswer(page) {
  const m = (await page.locator('#question').textContent()).match(/(\d+) × (\d+) = \?/);
  return String(Number(m[1]) * Number(m[2]));
}
const correctButton = async (page) => page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`);
const wrongButton = async (page) => page.locator(`#answers .answer:not([data-value="${await productAnswer(page)}"])`).first();

// Saves a profile and reloads. By default today's daily bonus is already taken and
// every badge is owned, so point totals only change because of what a test does.
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

// Fixed, frozen clock: only runFor() / setSystemTime() move time.
async function startOn(page, isoDateTime) {
  await page.clock.install({ time: new Date(isoDateTime) });
  await page.goto('/');
  await page.clock.pauseAt(new Date(new Date(isoDateTime).getTime() + 60_000));
}

async function answerOneQuickQuizQuestion(page) {
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await press(await correctButton(page));
  await press(page.locator('#closeBtn'));
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { errors.push('Unexpected pop-up: ' + d.message()); d.dismiss(); });
});
test.afterEach(() => { expect(errors, 'JavaScript errors on the page').toEqual([]); });

/* ---------- Tabs ---------- */

test('tabs: one page at a time; leaving Play stops a running game', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('#page-play')).toBeVisible();
  for (const hidden of ['shop', 'friends', 'event']) await expect(page.locator('#page-' + hidden)).toBeHidden();

  await press(page.locator('#tab-shop'));
  await expect(page.locator('#page-shop')).toBeVisible();
  await expect(page.locator('#page-play')).toBeHidden();
  await expect(page.locator('#tab-shop')).toHaveAttribute('aria-selected', 'true');

  await press(page.locator('#tab-play'));
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await expect(page.locator('#playArea')).toHaveClass(/active/);
  await press(page.locator('#tab-friends'));
  await press(page.locator('#tab-play'));
  await expect(page.locator('#playArea')).not.toHaveClass(/active/);
  await page.clock.runFor(70_000);                      // the quiz timer was stopped
  await expect(page.locator('#feedback')).toHaveText('');
});

test('tabs: the Event tab shows a dot when a reward is waiting', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#eventDot')).toBeHidden();
  await setProfile(page, { event: { claimed: 0, unclaimed: 1 } });
  await expect(page.locator('#eventDot')).toBeVisible();
  await press(page.locator('#claimEventBtn'));
  await expect(page.locator('#eventDot')).toBeHidden();
});

/* ---------- Weekly Treasure Chest ---------- */

test('chest: practise on 4 days in a week, open it once, new chest next week', async ({ page }) => {
  test.setTimeout(90_000);   // long test: several simulated days / two full rounds
  await startOn(page, '2026-04-06T09:00:00');          // a Monday
  await setProfile(page, { points: 0 }, { settled: false });
  for (const day of ['2026-04-06', '2026-04-07', '2026-04-09']) {
    await page.clock.setSystemTime(new Date(day + 'T09:00:00'));
    await page.reload();
    await answerOneQuickQuizQuestion(page);
    await answerOneQuickQuizQuestion(page);              // a second answer the same day doesn't count twice
  }
  await expect(page.locator('#chestStatus')).toContainText('1 more day');
  await expect(page.locator('#openChestBtn')).toBeHidden();
  await expect(page.locator('#chestDays .chest-day.done')).toHaveCount(3);

  await page.clock.setSystemTime(new Date('2026-04-12T09:00:00'));   // Sunday, same week
  await page.reload();
  await answerOneQuickQuizQuestion(page);
  await expect(page.locator('#eventDot')).toBeVisible();
  await reveal(page.locator('#openChestBtn'));
  await expect(page.locator('#openChestBtn')).toBeVisible();

  const before = await profileOf(page);
  await press(page.locator('#openChestBtn'));
  await page.clock.runFor(1_000);
  const after = await profileOf(page);
  expect(after.chestsOpened).toBe(1);
  const chestEmojis = await page.evaluate(() => window.EmiApp.CHEST_EMOJIS.map((e) => e.emoji));
  const gotEmoji = after.ownedEmojis.some((e) => chestEmojis.includes(e));
  // The first chest also earns the Treasure Hunter badge (+50), so take that off.
  const badgeBonus = !before.badges.chest && after.badges.chest ? 50 : 0;
  const prizePoints = after.points - before.points - badgeBonus;
  const gotPoints = prizePoints >= 250 && prizePoints <= 500;
  const gotFreeze = after.streakFreezes === before.streakFreezes + 1;
  expect([gotEmoji, gotPoints, gotFreeze].filter(Boolean)).toHaveLength(1);
  await expect(page.locator('#chestStatus')).toContainText('opened this week');
  await expect(page.locator('#openChestBtn')).toBeHidden();
  await expect(page.locator('#eventDot')).toBeHidden();

  // A new week brings a new chest.
  await page.clock.setSystemTime(new Date('2026-04-13T09:00:00'));
  await page.reload();
  await expect(page.locator('#chestStatus')).toContainText('0 of 4');
});

test('chest: never gives a duplicate emoji; chest emojis cannot be bought', async ({ page }) => {
  await startOn(page, '2026-04-09T09:00:00');
  const chestEmojis = await page.evaluate(() => window.EmiApp.CHEST_EMOJIS.map((e) => e.emoji));
  await setProfile(page, {
    points: 99999, ownedEmojis: ['😀', ...chestEmojis],
    chest: { week: '2026-04-06', days: ['2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09'], opened: false },
  });
  await press(page.locator('#openChestBtn'));
  await page.clock.runFor(1_000);
  const p = await profileOf(page);
  expect(p.ownedEmojis).toHaveLength(1 + chestEmojis.length);   // nothing new, nothing doubled
  expect(p.chestsOpened).toBe(1);

  await press(page.locator('#emojiMore'));
  await expect(page.getByRole('button', { name: 'Sloth: win it in the Treasure Chest' })).toBeHidden();   // owned → "Use"
  await setProfile(page, { points: 99999 });
  await press(page.locator('#emojiMore'));
  const sloth = page.getByRole('button', { name: 'Sloth: win it in the Treasure Chest' });
  await expect(sloth).toBeDisabled();
  await expect(sloth).toHaveText('🧰 Chest prize');
});

/* ---------- Pet fox ---------- */

test('pet: grows with right answers, can be named, cheers when tapped', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#petTitle')).toHaveText('Foxy the Baby Fox');
  await expect(page.locator('#petNext')).toContainText('25 more right answers');

  await setProfile(page, { correctTotal: 24 });
  await expect(page.locator('#petNext')).toContainText('1 more right answer until');
  await answerOneQuickQuizQuestion(page);
  await expect(page.locator('#petTitle')).toHaveText('Foxy the Little Fox');
  await expect(page.locator('#petAccessory')).toHaveText('🎀');
  await expect(page.locator('#toast')).toContainText('grew into a Little Fox');

  await fillIn(page.locator('#petNameInput'), 'Biscuit');
  await press(page.locator('#petNameBtn'));
  await expect(page.locator('#petTitle')).toHaveText('Biscuit the Little Fox');
  await page.reload();
  await expect(page.locator('#petTitle')).toHaveText('Biscuit the Little Fox');
  await press(page.locator('#petBtn'));
  await expect(page.locator('#petMood')).toContainText('Biscuit');
});

test('pet: existing players start at the right size without a surprise growth message', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { correctTotal: 300 });
  await expect(page.locator('#petTitle')).toHaveText('Foxy the Super Fox');
  await expect(page.locator('#toast')).toBeHidden();
});

/* ---------- Boss Battle ---------- */

test('boss: right answers hit it, fast ones are critical, wrong answers miss', async ({ page }) => {
  await startOn(page, '2026-04-06T09:00:00');
  await setProfile(page, {});
  await press(page.locator('#bossPlayBtn'));
  await expect(page.locator('#bossPanel')).toBeVisible();
  await expect(page.locator('#bossHpText')).toHaveText('300 / 300 HP');

  await page.clock.runFor(1_000);
  await press(await correctButton(page));               // answered in 1 second → critical
  await expect(page.locator('#bossHpText')).toHaveText('285 / 300 HP');
  await expect(page.locator('#bossHit')).toContainText('CRITICAL');

  await page.clock.runFor(900);                         // next question appears
  await page.clock.runFor(5_000);
  await press(await correctButton(page));               // 5 seconds → normal hit
  await expect(page.locator('#bossHpText')).toHaveText('275 / 300 HP');

  await page.clock.runFor(900);
  await press(await wrongButton(page));
  await expect(page.locator('#feedback')).toContainText('dodged');
  await expect(page.locator('#bossHpText')).toHaveText('275 / 300 HP');

  await page.reload();                                  // health is saved for the week
  expect((await profileOf(page)).boss.hp).toBe(275);
});

test('boss: defeating it gives a reward, then it waits for next week', async ({ page }) => {
  await startOn(page, '2026-04-08T09:00:00');
  await setProfile(page, { points: 0, boss: { week: '2026-04-06', hp: 15, defeated: false } });
  await press(page.locator('#bossPlayBtn'));
  await press(await correctButton(page));               // instant answer → critical 15 → defeated
  await page.clock.runFor(1_000);
  await expect(page.locator('#feedback')).toContainText('You defeated');
  const p = await profileOf(page);
  expect(p.boss.defeated).toBe(true);
  expect(p.bossesDefeated).toBe(1);
  expect(await points(page)).toBe(10 + 300);
  await press(page.locator('#closeBtn'));
  await expect(page.locator('#bossPlayBtn')).toBeDisabled();
  await expect(page.locator('#bossPlayBtn')).toHaveText('Beaten! ✅');

  // Next Monday: a new boss at full health.
  const oldFace = await page.locator('#bossCardIcon').textContent();
  await page.clock.setSystemTime(new Date('2026-04-13T09:00:00'));
  await page.reload();
  await expect(page.locator('#bossPlayBtn')).toBeEnabled();
  expect((await profileOf(page)).boss.hp).toBe(300);
  await expect(page.locator('#bossCardIcon')).not.toHaveText(oldFace);
});

/* ---------- Friend Challenge of the Day ---------- */

test('challenge: same questions for everyone on the same day, different the next day', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const texts = (d) => window.EmiApp.dailyQuestions(d).map((q) => q.text + '|' + q.choices.join(','));
    return { a: texts('2026-04-06'), b: texts('2026-04-06'), c: texts('2026-04-07') };
  });
  expect(r.a).toHaveLength(10);
  expect(r.a).toEqual(r.b);
  expect(r.a).not.toEqual(r.c);
});

test('challenge: first try is saved, practice runs are not; board compares with friends', async ({ page }) => {
  test.setTimeout(90_000);   // long test: several simulated days / two full rounds
  await startOn(page, '2026-04-06T09:00:00');
  await setProfile(page, { name: 'Emi', trickyFacts: { '7x8': 6 } });
  const expected = await page.evaluate(() => window.EmiApp.dailyQuestions().map((q) => q.text));

  await press(page.locator('#dailyPlayBtn'));
  for (let q = 0; q < 10; q++) {
    await expect(page.locator('#question')).toHaveText(expected[q]);   // no personalised questions here
    await page.clock.runFor(2_000);
    await press(await correctButton(page));
    await page.clock.runFor(900);
  }
  await expect(page.locator('#feedback')).toContainText('saved for today: 10/10 in 20.0s');
  expect((await profileOf(page)).challenge).toMatchObject({ day: '2026-04-06', score: 10, time: 20 });

  // A second go is just practice.
  await press(page.locator('#restartBtn'));
  await press(await wrongButton(page));
  for (let q = 1; q < 10; q++) { await page.clock.runFor(900); await press(await correctButton(page)); }
  await page.clock.runFor(900);
  await expect(page.locator('#feedback')).toContainText('Practice run');
  expect((await profileOf(page)).challenge.score).toBe(10);

  // Friends' scores from their codes: only today's count.
  for (const f of [
    { v: 2, id: 'zoe', name: 'Zoe', emoji: '🦄', points: 1, chDay: '2026-04-06', chScore: 10, chTime: 18.5 },
    { v: 2, id: 'sam', name: 'Sam', emoji: '🐼', points: 1, chDay: '2026-04-06', chScore: 8, chTime: 12 },
    { v: 2, id: 'max', name: 'Max', emoji: '🐶', points: 1, chDay: '2026-04-05', chScore: 10, chTime: 5 },
  ]) {
    await fillIn(page.locator('#friendCodeInput'), encodeCode(f));
    await press(page.locator('#addFriendBtn'));
  }
  const rows = page.locator('#challengeBoard .leader-row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Zoe');     // 10/10, faster
  await expect(rows.nth(1)).toContainText('Emi (You)');
  await expect(rows.nth(2)).toContainText('Sam');
  await expect(page.locator('#challengeBoard')).not.toContainText('Max');

  const mine = await page.evaluate(() => JSON.parse(new TextDecoder().decode(
    Uint8Array.from(atob(window.EmiApp.makeFriendCode()), (c) => c.charCodeAt(0)))));
  expect(mine).toMatchObject({ chDay: '2026-04-06', chScore: 10, chTime: 20 });
});
