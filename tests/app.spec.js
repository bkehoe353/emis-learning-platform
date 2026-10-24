import { test, expect } from '@playwright/test';

// Tap on the iPad project, click on desktop.
const press = async (locator) => {
  const touch = test.info().project.use.hasTouch;
  return touch ? locator.tap() : locator.click();
};

// Works out the right answer for "a × b = ?" questions.
async function productAnswer(page) {
  const text = await page.locator('#question').textContent();
  const m = text.match(/(\d+) × (\d+) = \?/);
  if (!m) throw new Error('Unexpected question: ' + text);
  return String(Number(m[1]) * Number(m[2]));
}

const points = async (page) => Number((await page.locator('#points').textContent()).replace(/,/g, ''));

async function setProfile(page, data) {
  await page.evaluate((d) => localStorage.setItem('emisLearningProfile', JSON.stringify(d)), data);
  await page.reload();
}

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
  await expect(buttons).toHaveCount(8);
  for (let i = 0; i < 8; i++) {
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
  await page.clock.install();
  await page.goto('/');
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
  await page.locator('#profileName').fill('Emi');
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
  await page.locator('#friendCodeInput').fill(mine);
  await press(page.locator('#addFriendBtn'));
  await expect(page.locator('#friendMessage')).toContainText('your own code');

  // Bad code is rejected.
  await page.locator('#friendCodeInput').fill('not a code');
  await press(page.locator('#addFriendBtn'));
  await expect(page.locator('#friendMessage')).toContainText('does not look right');

  // Add a friend, then update their score with a newer code.
  await page.locator('#friendCodeInput').fill(code({ v: 2, id: 'friend-1', name: 'Zoe', emoji: '🦄', points: 300 }));
  await press(page.locator('#addFriendBtn'));
  await page.locator('#friendCodeInput').fill(code({ v: 2, id: 'friend-1', name: 'Zoe', emoji: '🐼', points: 900 }));
  await press(page.locator('#addFriendBtn'));
  await expect(page.locator('#friendMessage')).toContainText('updated');
  // Old-style (v1) codes still work.
  await page.locator('#friendCodeInput').fill(code({ v: 1, name: 'Sam', emoji: '🐶', points: 50 }));
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
  expect(await points(page)).toBe(10);
});

test('shop tabs switch between emojis and backgrounds', async ({ page }) => {
  await page.goto('/');
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
