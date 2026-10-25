import { test, expect } from '@playwright/test';
import { press, fillIn, reveal } from './helpers.js';


// Works out the right answer for "a × b = ?" questions.
async function productAnswer(page) {
  const text = await page.locator('#question').textContent();
  const m = text.match(/(\d+) × (\d+) = \?/);
  if (!m) throw new Error('Unexpected question: ' + text);
  return String(Number(m[1]) * Number(m[2]));
}

const points = async (page) => Number((await page.locator('#points').textContent()).replace(/,/g, ''));

// Saves a profile and reloads. By default the player has already had today's
// daily bonus and owns every badge, so point totals only count answers and buying.
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
const settle = (page) => setProfile(page, {});

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Some browsers/app wrappers block pop-ups, so the app must never rely on them.
  page.on('dialog', (d) => { errors.push('Unexpected pop-up: ' + d.message()); d.dismiss(); });
});
test.afterEach(() => { expect(errors, 'JavaScript errors on the page').toEqual([]); });

test('every game button opens its game', async ({ page }) => {
  await page.goto('/');
  const buttons = page.locator('.games [data-game]');
  const count = await page.evaluate(() => Object.keys(window.EmiApp.GAMES).length);
  await expect(buttons).toHaveCount(count);   // one card per game
  for (let i = 0; i < count; i++) {
    await press(buttons.nth(i));
    await expect(page.locator('#playArea')).toHaveClass(/active/);
    await expect(page.locator('#question')).not.toHaveText('');
    // The table picker belongs to Table Trainer only.
    const isTable = (await buttons.nth(i).getAttribute('data-game')) === 'table';
    await expect(page.locator('#tableControls')).toBeVisible({ visible: isTable });
    await press(page.locator('#closeBtn'));
    await expect(page.locator('#playArea')).not.toHaveClass(/active/);
  }
  await expect(page.locator('footer')).toContainText('Made by Danny Kehoe');
});

test('Quick Quiz: 10 questions, +10 once per correct answer, final score out of 10', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  for (let q = 1; q <= 10; q++) {
    await expect(page.locator('#roundLabel')).toHaveText(`Question ${q} of 10`);
    const correct = page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`);
    await press(correct);
    // Tapping again must not score twice.
    await correct.click({ force: true });
    expect(await points(page)).toBe(q * 10);
    if (q < 10) await press(page.locator('#nextBtn'));
  }
  await expect(page.locator('#feedback')).toContainText('You got 10 out of 10');
  await expect(page.locator('#restartBtn')).toBeVisible();
  await expect(page.locator('#nextBtn')).toBeHidden();
  await expect(page.locator('#stars')).toHaveText('1');
});

test('Quick Quiz: each question has its own 60-second timer', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await expect(page.locator('#timerLabel')).toHaveText('⏱ 60s');
  await page.clock.runFor(59_000);
  await expect(page.locator('#timerLabel')).toHaveText('⏱ 1s');
  await page.clock.runFor(1_000);
  await expect(page.locator('#feedback')).toContainText('Time’s up');
  await expect(page.locator('#answers .answer').first()).toBeDisabled();
  await expect(page.locator('#answers .answer.correct')).toHaveCount(1);
  expect(await points(page)).toBe(0);

  await press(page.locator('#nextBtn'));
  await expect(page.locator('#roundLabel')).toHaveText('Question 2 of 10');
  await expect(page.locator('#timerLabel')).toHaveText('⏱ 60s');

  // Answering stops the timer: no "time's up" afterwards.
  await press(page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`));
  await page.clock.runFor(120_000);
  await expect(page.locator('#feedback')).not.toContainText('Time’s up');
});

test('Quick Quiz: timing out on question 10 ends the round cleanly', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  for (let q = 1; q <= 9; q++) {
    await page.clock.runFor(60_000);
    await press(page.locator('#nextBtn'));
  }
  await expect(page.locator('#roundLabel')).toHaveText('Question 10 of 10');
  await page.clock.runFor(60_000);
  await expect(page.locator('#feedback')).toContainText('You got 0 out of 10');
  await expect(page.locator('#restartBtn')).toBeVisible();
  await expect(page.locator('#nextBtn')).toBeHidden();
  await press(page.locator('#restartBtn'));
  await expect(page.locator('#roundLabel')).toHaveText('Question 1 of 10');
});

test('closing a game stops its timer', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await press(page.locator('#closeBtn'));
  await page.clock.runFor(70_000);
  await expect(page.locator('#feedback')).toHaveText('');
});

test('Speed Round ends after 60 seconds', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await settle(page);
  await press(page.getByRole('button', { name: 'Start the timer →' }));
  await press(page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`));
  await page.clock.runFor(1_000);
  await expect(page.locator('#roundLabel')).toHaveText('Correct: 1');
  await page.clock.runFor(60_000);
  await expect(page.locator('#feedback')).toContainText('You got 1 correct in 60 seconds');
  await expect(page.locator('#answers .answer')).toHaveCount(0);
  expect(await points(page)).toBe(10);
});

test('Times Tables Check: typed answers, 25 questions, 6 seconds each', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T09:00:00') });
  await page.goto('/');
  await settle(page);
  await page.clock.pauseAt(new Date('2026-01-01T09:05:00'));   // only runFor() moves time
  await press(page.getByRole('button', { name: 'Take the check →' }));
  await expect(page.locator('#roundLabel')).toHaveText('Question 1 of 25');
  await expect(page.locator('#timerLabel')).toHaveText('⏱ 6s');

  // Q1: type the right answer on the keypad.
  for (const digit of await productAnswer(page)) await press(page.locator(`#keypad [data-key="${digit}"]`));
  await press(page.locator('#keypad [data-key="enter"]'));
  await expect(page.locator('#typedAnswer')).toHaveClass(/correct/);
  expect(await points(page)).toBe(10);
  await page.clock.runFor(1_500);
  await expect(page.locator('#roundLabel')).toHaveText('Question 2 of 25');

  // Q2: use the physical keyboard with a wrong answer, then delete and retype.
  await page.keyboard.press('9'); await page.keyboard.press('Backspace');
  await expect(page.locator('#typedAnswer')).toHaveText(' ');

  // Let the rest time out (6s each + 1.5s pause).
  for (let q = 2; q <= 25; q++) await page.clock.runFor(7_500);
  await page.clock.runFor(5_000);   // a little spare time
  await expect(page.locator('#feedback')).toContainText('You got 1 out of 25');
  await expect(page.locator('#missed')).toBeVisible();
  await expect(page.locator('#missed')).toContainText('Facts to practise');
  expect(await points(page)).toBe(10);
});

test('Table Trainer uses the chosen table and changing it restarts the round', async ({ page }) => {
  await page.goto('/');
  await press(page.getByRole('button', { name: 'Train a table →' }));
  await press(page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`));
  await press(page.locator('#nextBtn'));
  await expect(page.locator('#roundLabel')).toHaveText('Question 2 of 10');
  await page.locator('#tableSelect').selectOption('7');
  await expect(page.locator('#roundLabel')).toHaveText('Question 1 of 10');
  await expect(page.locator('#question')).toHaveText(/^7 × \d+ = \?$/);
});

test('progress is saved and restored after reload', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await fillIn(page.locator('#profileName'), 'Emi');
  await press(page.locator('#saveNameBtn'));
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await press(page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`));
  await page.reload();
  expect(await points(page)).toBe(10);
  await expect(page.locator('#profileTitle')).toHaveText('Emi');
  await expect(page.locator('#correctCount')).toHaveText('1');
  await expect(page.locator('#streak')).toHaveText('1');
  await expect(page.locator('#profileAvatar')).toHaveText('😀');
});

test('emoji shop: buy once, never charged twice, rare items stay locked', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 1000 });
  await expect(page.locator("#shopGrid .emoji-item")).toHaveCount(12);
  await press(page.locator("#emojiMore"));
  await expect(page.getByRole('button', { name: 'Buy Galaxy for 18000 points' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Buy Galaxy for 18000 points' })).toHaveText('Need 17,000 more');

  // First tap only asks to confirm; nothing is spent yet.
  await press(page.getByRole('button', { name: 'Buy Crown for 1000 points' }));
  await expect(page.getByRole('button', { name: 'Confirm: buy Crown' })).toHaveText('Tap again to buy');
  expect(await points(page)).toBe(1000);
  // Second tap buys it.
  await press(page.getByRole('button', { name: 'Confirm: buy Crown' }));
  expect(await points(page)).toBe(0);
  await expect(page.locator('#profileAvatar')).toHaveText('👑');
  // The 18,000 rare item must NOT be unlocked by the cheap crown.
  await expect(page.getByRole('button', { name: 'Buy Galaxy for 18000 points' })).toBeDisabled();

  await page.reload();
  await expect(page.locator('#profileAvatar')).toHaveText('👑');
  // Switching between owned emojis is free.
  await press(page.getByRole('button', { name: 'Use Happy Face' }));
  await expect(page.locator('#profileAvatar')).toHaveText('😀');
  await press(page.locator("#emojiMore"));
  await press(page.getByRole('button', { name: 'Use Crown' }));
  await expect(page.locator('#profileAvatar')).toHaveText('👑');
  expect(await points(page)).toBe(0);
});

test('emoji shop: an unconfirmed purchase cancels itself after 5 seconds', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await setProfile(page, { points: 500 });
  await press(page.getByRole('button', { name: 'Buy Cool Face for 100 points' }));
  await expect(page.getByRole('button', { name: 'Confirm: buy Cool Face' })).toBeVisible();
  await page.clock.runFor(5_000);
  await expect(page.getByRole('button', { name: 'Buy Cool Face for 100 points' })).toHaveText('Buy');
  expect(await points(page)).toBe(500);
});

test('emoji catalogue: 40+ unique items, rare ones up to 18,000', async ({ page }) => {
  await page.goto('/');
  const catalog = await page.evaluate(() => window.EmiApp.EMOJI_CATALOG);
  expect(catalog.length).toBeGreaterThanOrEqual(40);
  expect(new Set(catalog.map((c) => c.emoji)).size).toBe(catalog.length);
  expect(catalog.some((c) => c.emoji === '😀')).toBe(false);   // default is free, not for sale
  expect(Math.max(...catalog.map((c) => c.price))).toBe(18000);
  expect(catalog.filter((c) => c.price >= 10000).length).toBeGreaterThanOrEqual(20);
  expect(catalog.map((c) => c.price)).toEqual([...catalog.map((c) => c.price)].sort((a, b) => a - b));
});

test('questions are always valid in every mode', async ({ page }) => {
  await page.goto('/');
  const problems = await page.evaluate(() => {
    const bad = [];
    for (const mode of ['mix', 'table', 'speed', 'missing', 'truefalse', 'division', 'word', 'mtc']) {
      for (let i = 0; i < 300; i++) {
        const q = window.EmiApp.makeQuestion(mode, 6);
        if (mode === 'mtc') { if (!Number.isInteger(q.answer) || q.choices) bad.push([mode, q]); continue; }
        const want = mode === 'truefalse' ? 2 : 4;
        if (q.choices.length !== want || new Set(q.choices).size !== want || !q.choices.includes(q.answer)) bad.push([mode, q]);
        if (mode === 'table' && !q.text.startsWith('6 × ')) bad.push([mode, q]);
      }
    }
    return bad;
  });
  expect(problems).toEqual([]);
});

test('friend codes: add, update without duplicates, sort, remove, reject bad codes', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 500, name: 'Emi' });
  const code = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');

  // Own code is rejected.
  await press(page.locator('#makeFriendCode'));
  const mine = await page.locator('#myFriendCode').inputValue();
  await fillIn(page.locator('#friendCodeInput'), mine);
  await press(page.locator('#addFriendBtn'));
  await expect(page.locator('#friendMessage')).toContainText('your own code');

  // Bad code is rejected.
  await fillIn(page.locator('#friendCodeInput'), 'not a code');
  await press(page.locator('#addFriendBtn'));
  await expect(page.locator('#friendMessage')).toContainText('does not look right');

  // Add a friend, then update their score with a newer code.
  await fillIn(page.locator('#friendCodeInput'), code({ v: 2, id: 'friend-1', name: 'Zoe', emoji: '🦄', points: 300 }));
  await press(page.locator('#addFriendBtn'));
  await fillIn(page.locator('#friendCodeInput'), code({ v: 2, id: 'friend-1', name: 'Zoe', emoji: '🐼', points: 900 }));
  await press(page.locator('#addFriendBtn'));
  await expect(page.locator('#friendMessage')).toContainText('updated');
  // Old-style (v1) codes still work.
  await fillIn(page.locator('#friendCodeInput'), code({ v: 1, name: 'Sam', emoji: '🐶', points: 50 }));
  await press(page.locator('#addFriendBtn'));

  const rows = page.locator('.leader-row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Zoe');
  await expect(rows.nth(0)).toContainText('900 pts');
  await expect(rows.nth(1)).toContainText('Emi (You)');
  await expect(rows.nth(2)).toContainText('Sam');

  await page.reload();
  await expect(rows).toHaveCount(3);
  await press(page.getByRole('button', { name: 'Remove Zoe' }));
  await expect(rows).toHaveCount(2);
});

test('still works when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  await page.goto('/');
  await expect(page.locator('#storageWarning')).toBeVisible();
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await press(page.locator(`#answers .answer[data-value="${await productAnswer(page)}"]`));
  expect(await points(page)).toBe(80);   // 10 + daily bonus 20 + First Answer badge 50
});

test('shop tabs switch between emojis and backgrounds', async ({ page }) => {
  await page.goto('/');
  await press(page.locator('#tab-shop'));
  await expect(page.locator('#emojiPanel')).toBeVisible();
  await expect(page.locator('#bgPanel')).toBeHidden();
  await press(page.getByRole('tab', { name: '🎨 Backgrounds' }));
  await expect(page.locator('#bgPanel')).toBeVisible();
  await expect(page.locator('#emojiPanel')).toBeHidden();
  await expect(page.getByRole('tab', { name: '🎨 Backgrounds' })).toHaveAttribute('aria-selected', 'true');
  await press(page.getByRole('tab', { name: '🛍️ Emojis' }));
  await expect(page.locator('#emojiPanel')).toBeVisible();
});

test('background shop: buy, save, switch back, never charged twice', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { points: 2000 });
  await press(page.getByRole('tab', { name: '🎨 Backgrounds' }));
  await expect(page.getByRole('button', { name: 'Using Sunny background' })).toBeVisible();
  await press(page.locator("#bgMore"));
  await expect(page.getByRole('button', { name: 'Buy Deep Space background for 18000 points' })).toHaveText('Need 16,000 more');

  await press(page.getByRole('button', { name: 'Buy Ocean background for 800 points' }));
  expect(await points(page)).toBe(2000);
  await press(page.getByRole('button', { name: 'Confirm: buy Ocean background' }));
  expect(await points(page)).toBe(1200);
  const avatarBg = () => page.locator('#profileAvatar').evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(await avatarBg()).toContain('rgb(61, 139, 253)');   // ocean blue

  await page.reload();
  expect(await avatarBg()).toContain('rgb(61, 139, 253)');
  await press(page.getByRole('tab', { name: '🎨 Backgrounds' }));
  await press(page.getByRole('button', { name: 'Use Sunny background' }));
  expect(await avatarBg()).not.toContain('rgb(61, 139, 253)');
  await press(page.getByRole('button', { name: 'Use Ocean background' }));
  expect(await points(page)).toBe(1200);
});

test('background catalogue: unique, sorted, rare ones up to 18,000', async ({ page }) => {
  await page.goto('/');
  const bgs = await page.evaluate(() => window.EmiApp.BACKGROUND_CATALOG);
  expect(bgs.length).toBeGreaterThanOrEqual(20);
  expect(new Set(bgs.map((b) => b.id)).size).toBe(bgs.length);
  expect(bgs[0]).toMatchObject({ id: 'sunny', price: 0 });
  expect(Math.max(...bgs.map((b) => b.price))).toBe(18000);
  expect(bgs.map((b) => b.price)).toEqual([...bgs.map((b) => b.price)].sort((a, b) => a - b));
});

test('friend codes carry the background; unknown backgrounds fall back to Sunny', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const enc = (o) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))));
    const { decodeFriendCode } = window.EmiApp;
    return {
      good: decodeFriendCode(enc({ v: 2, id: 'f1', name: 'Zoe', emoji: '🦄', bg: 'lava', points: 1 })).bg,
      bad: decodeFriendCode(enc({ v: 2, id: 'f2', name: 'Sam', emoji: '🐶', bg: 'url(evil)', points: 1 })).bg,
      none: decodeFriendCode(enc({ v: 1, name: 'Old', emoji: '🐶', points: 1 })).bg,
    };
  });
  expect(result).toEqual({ good: 'lava', bad: 'sunny', none: 'sunny' });
});

/* ---------- Ranked mode ---------- */

async function typeAnswer(page) {
  for (const digit of await productAnswer(page)) await press(page.locator(`#keypad [data-key="${digit}"]`));
  await press(page.locator('#keypad [data-key="enter"]'));
}

test('Ranked: fast answers earn Amethyst, shown on profile and leaderboard', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T09:00:00') });
  await page.goto('/');
  // Freeze time so slow test taps don't count; only runFor() moves the clock.
  await page.clock.pauseAt(new Date('2026-01-01T09:05:00'));
  await settle(page);
  await expect(page.locator('#profileRank')).toContainText('Unranked');
  await press(page.getByRole('button', { name: 'Play Ranked →' }));
  await expect(page.locator('#roundLabel')).toHaveText('Question 1 of 15');
  await expect(page.locator('#timerLabel')).toHaveText('⏱ 10s');
  for (let q = 1; q <= 15; q++) {
    await page.clock.runFor(1_000);          // answer after about 1 second
    await typeAnswer(page);
    await page.clock.runFor(900);            // short pause before the next question
  }
  await expect(page.locator('#rankResult')).toBeVisible();
  await expect(page.locator('#rankResult h3')).toHaveText('Amethyst rank!');
  await expect(page.locator('#rankResult')).toContainText('New best!');
  await expect(page.locator('#rankResult img[alt="Amethyst rank"]').first()).toBeVisible();
  await expect(page.locator('#rankResult .rank-step')).toHaveCount(5);
  await expect(page.locator('#profileRank')).toContainText('Amethyst');
  expect(await points(page)).toBe(150);

  await page.reload();
  await expect(page.locator('#profileRank')).toContainText('Amethyst');
  await expect(page.locator('.leader-row', { hasText: '(You)' })).toContainText('Amethyst rank');
});

test('Ranked: slow round gives Bronze but never lowers your best rank', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await setProfile(page, { bestRank: 'gold', bestRankAvg: 4.5 });
  await press(page.getByRole('button', { name: 'Play Ranked →' }));
  for (let q = 1; q <= 15; q++) await page.clock.runFor(10_900);   // every question times out
  await expect(page.locator('#rankResult h3')).toHaveText('Bronze rank!');
  await expect(page.locator('#rankResult')).toContainText('Your best is still Gold');
  await expect(page.locator('#profileRank')).toContainText('Gold');
  await expect(page.locator('#missed')).toContainText('Facts to practise');
});

test('Ranked: rank thresholds by average seconds', async ({ page }) => {
  await page.goto('/');
  const ranks = await page.evaluate(() => [1, 2.5, 2.6, 3.5, 3.6, 5, 5.1, 7, 7.1, 10].map(window.EmiApp.rankForAverage));
  expect(ranks).toEqual(['amethyst', 'amethyst', 'diamond', 'diamond', 'gold', 'gold', 'silver', 'silver', 'bronze', 'bronze']);
});

test('Ranked: medal images load', async ({ request }) => {
  for (const id of ['bronze', 'silver', 'gold', 'diamond', 'amethyst']) {
    const res = await request.get(`/ranks/${id}.svg`);
    expect(res.ok()).toBe(true);
    expect(await res.text()).toContain('<svg');
  }
});

test('Ranked: friend codes carry rank; unknown ranks are ignored', async ({ page }) => {
  await page.goto('/');
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64');
  await fillIn(page.locator('#friendCodeInput'), enc({ v: 2, id: 'f-1', name: 'Zoe', emoji: '🦄', rank: 'diamond', points: 900 }));
  await press(page.locator('#addFriendBtn'));
  await fillIn(page.locator('#friendCodeInput'), enc({ v: 2, id: 'f-2', name: 'Sam', emoji: '🐶', rank: 'platinum', points: 50 }));
  await press(page.locator('#addFriendBtn'));
  await expect(page.locator('.leader-row', { hasText: 'Zoe' })).toContainText('Diamond rank');
  await expect(page.locator('.leader-row', { hasText: 'Zoe' }).locator('.score img[alt="Diamond rank"]')).toBeVisible();
  await expect(page.locator('.leader-row', { hasText: 'Sam' })).toContainText('Unranked');
  const mine = await page.evaluate(() => JSON.parse(atob(window.EmiApp.makeFriendCode())));
  expect(mine.rank).toBeNull();
});

/* ---------- Personalised practice ---------- */

test('tricky facts: wrong answers are remembered, right answers count down', async ({ page }) => {
  await page.goto('/');
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  const [a, b] = (await page.locator('#question').textContent()).match(/\d+/g).map(Number);
  const key = Math.min(a, b) + 'x' + Math.max(a, b);
  await press(page.locator(`#answers .answer:not([data-value="${a * b}"])`).first());
  await page.reload();
  expect(await page.evaluate(() => window.EmiApp.getProfile().trickyFacts)).toEqual({ [key]: 2 });
});

test('tricky facts: asked about 3 in 10 times, never twice in a row, not in Ranked', async ({ page }) => {
  await page.goto('/');
  await setProfile(page, { trickyFacts: { '7x8': 6, '3x4': 2 } });
  const r = await page.evaluate(() => {
    const { pickTrickyFactors } = window.EmiApp;
    let picked = 0, repeats = 0, last = null;
    const counts = {};
    for (let i = 0; i < 4000; i++) {
      const f = pickTrickyFactors('mix', 2, last);
      const key = f ? Math.min(...f) + 'x' + Math.max(...f) : null;
      if (key) { picked++; counts[key] = (counts[key] || 0) + 1; if (key === last) repeats++; }
      last = key;
    }
    return {
      share: picked / 4000, repeats, counts,
      ranked: pickTrickyFactors('ranked', 2, null, () => 0),
      tableMatch: pickTrickyFactors('table', 7, null, () => 0),
      tableNoMatch: pickTrickyFactors('table', 9, null, () => 0),
      lastWasOnly: pickTrickyFactors('table', 7, '7x8', () => 0),
    };
  });
  expect(r.share).toBeGreaterThan(0.24);
  expect(r.share).toBeLessThan(0.36);
  expect(r.repeats).toBe(0);
  expect(r.counts['7x8']).toBeGreaterThan(r.counts['3x4']);   // trickier facts come up more
  expect(r.ranked).toBeNull();
  expect(r.tableMatch).toEqual([7, 8]);
  expect(r.tableNoMatch).toBeNull();
  expect(r.lastWasOnly).toBeNull();
});

test('shops show 12 items until See more is tapped', async ({ page }) => {
  await page.goto('/');
  const emojiCount = await page.evaluate(() => window.EmiApp.EMOJI_CATALOG.length + window.EmiApp.EVENT_EMOJIS.length + window.EmiApp.CHEST_EMOJIS.length + 1);   // + event/chest-only + free Happy Face
  await expect(page.locator('#shopGrid .emoji-item')).toHaveCount(12);
  await expect(page.locator('#emojiMore')).toHaveText(`See more (${emojiCount - 12} more) ▼`);
  await press(page.locator('#emojiMore'));
  await expect(page.locator('#shopGrid .emoji-item')).toHaveCount(emojiCount);
  await expect(page.locator('#emojiMore')).toHaveText('Show less ▲');
  await expect(page.locator('#emojiMore')).toHaveAttribute('aria-expanded', 'true');
  await press(page.locator('#emojiMore'));
  await expect(page.locator('#shopGrid .emoji-item')).toHaveCount(12);

  await press(page.getByRole('tab', { name: '🎨 Backgrounds' }));
  await expect(page.locator('#bgGrid .emoji-item')).toHaveCount(12);
  await press(page.locator('#bgMore'));
  await expect(page.locator('#bgGrid .emoji-item')).toHaveCount(await page.evaluate(() => window.EmiApp.BACKGROUND_CATALOG.length + window.EmiApp.EVENT_BACKGROUNDS.length));
});
