// Tests for online friends, using a pretend Firebase that answers like the real one.
import { test, expect } from '@playwright/test';
import { press, fillIn, reveal } from './helpers.js';

const BASE = 'https://firestore.googleapis.com/v1/projects/demo/databases/(default)/documents';
const ALLOWED = ['name', 'nameLower', 'tag', 'emoji', 'bg', 'points', 'rank', 'rankAvg', 'streak', 'streakDay', 'chDay', 'chScore', 'chTime', 'updated'];

// A tiny in-memory Firebase: anonymous sign-in plus the Firestore calls the site uses.
function fakeFirebase() {
  const db = new Map();          // uid → Firestore fields
  let nextUser = 0;
  const failing = new Set();     // e.g. 'runQuery' to simulate no internet
  const fieldsOf = (obj) => {
    const f = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === null) f[k] = { nullValue: null };
      else if (k === 'updated') f[k] = { timestampValue: v };
      else if (typeof v === 'string') f[k] = { stringValue: v };
      else if (Number.isInteger(v)) f[k] = { integerValue: String(v) };
      else f[k] = { doubleValue: v };
    }
    return f;
  };
  const plain = (fields) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.stringValue ?? (v.integerValue !== undefined ? Number(v.integerValue) : v.doubleValue ?? v.timestampValue ?? null)]));
  const doc = (uid) => ({ name: `projects/demo/databases/(default)/documents/players/${uid}`, fields: db.get(uid) });

  async function attach(page) {
    await page.route('**/online-config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.EMI_ONLINE = { apiKey: 'test-key', projectId: 'demo' };" }));
    await page.route('https://identitytoolkit.googleapis.com/**', (r) => {
      const uid = 'u' + (++nextUser) + 'abcxyz';
      r.fulfill({ json: { idToken: 'tok-' + uid, refreshToken: 'ref-' + uid, localId: uid, expiresIn: '3600' } });
    });
    await page.route('https://securetoken.googleapis.com/**', (r) => {
      const uid = new URLSearchParams(r.request().postData()).get('refresh_token').slice(4);
      r.fulfill({ json: { id_token: 'tok-' + uid, refresh_token: 'ref-' + uid, user_id: uid, expires_in: '3600' } });
    });
    await page.route('https://firestore.googleapis.com/**', (r) => {
      const req = r.request();
      const caller = (req.headers().authorization || '').replace('Bearer tok-', '');
      const url = decodeURIComponent(req.url());
      if (!caller) return r.fulfill({ status: 401, json: {} });
      if (url.endsWith(':runQuery')) {
        if (failing.has('runQuery')) return r.fulfill({ status: 503, json: {} });
        const body = JSON.parse(req.postData());
        const q = body.structuredQuery.where.compositeFilter.filters[0].fieldFilter.value.stringValue;
        const hits = [...db.keys()].filter((uid) => db.get(uid).nameLower.stringValue.startsWith(q))
          .sort((a, b) => db.get(a).nameLower.stringValue.localeCompare(db.get(b).nameLower.stringValue))
          .slice(0, body.structuredQuery.limit);
        return r.fulfill({ json: hits.length ? hits.map((uid) => ({ document: doc(uid) })) : [{ readTime: new Date().toISOString() }] });
      }
      if (url.endsWith(':batchGet')) {
        const names = JSON.parse(req.postData()).documents;
        return r.fulfill({ json: names.map((n) => { const uid = n.split('/').pop(); return db.has(uid) ? { found: doc(uid) } : { missing: n }; }) });
      }
      const uid = url.split('/players/')[1];
      if (uid !== caller) return r.fulfill({ status: 403, json: {} });       // like the security rules
      if (req.method() === 'PATCH') { db.set(uid, JSON.parse(req.postData()).fields); return r.fulfill({ json: doc(uid) }); }
      if (req.method() === 'DELETE') { db.delete(uid); return r.fulfill({ json: {} }); }
      return r.fulfill({ status: 400, json: {} });
    });
  }
  return { db, attach, fieldsOf, plain, failing };
}

async function setProfile(page, data) {
  await page.evaluate((d) => {
    const now = new Date(Date.now());
    const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    localStorage.setItem('emisLearningProfile', JSON.stringify({ lastPlayDay: day, dailyStreak: 1, badges: Object.fromEntries(window.EmiApp.BADGES.map((b) => [b.id, day])), ...d }));
  }, data);
  await page.reload();
}

async function join(page) {
  await press(page.locator('#joinOnlineBtn'));
  await expect(page.locator('#joinOnlineBtn')).toHaveText('Tap again: my grown-up said yes');
  await press(page.locator('#joinOnlineBtn'));
  await expect(page.locator('#onlineJoined')).toBeVisible();
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { errors.push('Unexpected pop-up: ' + d.message()); d.dismiss(); });
});
test.afterEach(() => { expect(errors, 'JavaScript errors on the page').toEqual([]); });

test('online friends are off until a grown-up finishes the setup', async ({ page }) => {
  await page.goto('/');
  await reveal(page.locator('#onlineNotReady'));
  await expect(page.locator('#onlineNotReady')).toBeVisible();
  await expect(page.locator('#onlineJoin')).toBeHidden();
  await expect(page.locator('#onlineJoined')).toBeHidden();
});

test('joining: needs a nickname and two taps; only the allowed details go online', async ({ page }) => {
  const fb = fakeFirebase();
  await fb.attach(page);
  await page.goto('/');
  await reveal(page.locator('#joinOnlineBtn'));
  await press(page.locator('#joinOnlineBtn'));
  await expect(page.locator('#onlineMessage')).toContainText('Choose a nickname first');

  await setProfile(page, { name: 'Emi', points: 1234, bestRank: 'gold', bestRankAvg: 4.5 });
  await reveal(page.locator('#joinOnlineBtn'));
  await join(page);
  await expect(page.locator('#onlineName')).toHaveText(/^Emi #[A-Z0-9]{4}$/);
  expect(fb.db.size).toBe(1);
  const [stored] = [...fb.db.values()];
  expect(Object.keys(stored).sort()).toEqual([...ALLOWED].sort());
  expect(fb.plain(stored)).toMatchObject({ name: 'Emi', nameLower: 'emi', points: 1234, rank: 'gold', rankAvg: 4.5 });

  // Still joined after a reload (signs in again with the saved token).
  await page.reload();
  await reveal(page.locator('#onlineName'));
  await expect(page.locator('#onlineName')).toHaveText(/^Emi #/);
});

test('search by nickname, add a friend, and their details update by themselves', async ({ page }) => {
  const fb = fakeFirebase();
  fb.db.set('zoe123', fb.fieldsOf({ name: 'Zoe', nameLower: 'zoe', tag: 'ZOE1', emoji: '🦄', bg: 'sunny', points: 900, rank: 'diamond', rankAvg: 3.2, streak: 4, streakDay: '2026-01-01', chDay: null, chScore: 0, chTime: 0, updated: '2026-01-01T09:00:00Z' }));
  fb.db.set('zola77', fb.fieldsOf({ name: 'Zola', nameLower: 'zola', tag: 'ZOLA', emoji: '🐼', bg: 'sunny', points: 50, rank: null, rankAvg: null, streak: 0, streakDay: null, chDay: null, chScore: 0, chTime: 0, updated: '2026-01-01T09:00:00Z' }));
  await fb.attach(page);
  await page.goto('/');
  await setProfile(page, { name: 'Emi', points: 100 });
  await reveal(page.locator('#joinOnlineBtn'));
  await join(page);

  await fillIn(page.locator('#onlineSearch'), 'z');
  await press(page.locator('#onlineSearchBtn'));
  await expect(page.locator('#onlineMessage')).toContainText('at least 2 letters');

  await fillIn(page.locator('#onlineSearch'), 'Zo');
  await press(page.locator('#onlineSearchBtn'));
  await expect(page.locator('#onlineResults .leader-row')).toHaveCount(2);
  await expect(page.locator('#onlineResults')).toContainText('Zoe #ZOE1');
  await expect(page.locator('#onlineResults')).toContainText('Diamond league');
  await press(page.getByRole('button', { name: 'Add Zoe #ZOE1' }));
  await expect(page.getByRole('button', { name: 'Zoe is already your friend' })).toBeDisabled();

  const zoeRow = page.locator('#leaderboard .leader-row', { hasText: 'Zoe' });
  await expect(zoeRow).toContainText('Updates by itself');
  await expect(zoeRow).toContainText('900 pts');

  // Zoe plays on her own iPad: her online details change…
  fb.db.set('zoe123', fb.fieldsOf({ ...fb.plain(fb.db.get('zoe123')), points: 5000, rank: 'amethyst', rankAvg: 2.1, streak: 5 }));
  // …and Emi sees it next time she opens the site, without adding Zoe again.
  await page.reload();
  await reveal(zoeRow);
  await expect(zoeRow).toContainText('5,000 pts');
  await expect(zoeRow).toContainText('Amethyst rank');

  // Searching never shows yourself, and an unknown name says so.
  await fillIn(page.locator('#onlineSearch'), 'emi');
  await press(page.locator('#onlineSearchBtn'));
  await expect(page.locator('#onlineResults .leader-row')).toHaveCount(0);
  await expect(page.locator('#onlineMessage')).toContainText('Nobody called');
});

test('a friend who leaves online friends is marked, not lost', async ({ page }) => {
  const fb = fakeFirebase();
  fb.db.set('sam999', fb.fieldsOf({ name: 'Sam', nameLower: 'sam', tag: 'SAM9', emoji: '🐶', bg: 'sunny', points: 300, rank: null, rankAvg: null, streak: 0, streakDay: null, chDay: null, chScore: 0, chTime: 0, updated: '2026-01-01T09:00:00Z' }));
  await fb.attach(page);
  await page.goto('/');
  await setProfile(page, { name: 'Emi' });
  await reveal(page.locator('#joinOnlineBtn'));
  await join(page);
  await fillIn(page.locator('#onlineSearch'), 'sam');
  await press(page.locator('#onlineSearchBtn'));
  await press(page.getByRole('button', { name: 'Add Sam #SAM9' }));
  fb.db.delete('sam999');
  await page.reload();
  const row = page.locator('#leaderboard .leader-row', { hasText: 'Sam' });
  await reveal(row);
  await expect(row).toContainText('Left online friends');
});

test('my changes are sent online automatically', async ({ page }) => {
  const fb = fakeFirebase();
  await fb.attach(page);
  await page.goto('/');
  await setProfile(page, { name: 'Emi', points: 10 });
  await reveal(page.locator('#joinOnlineBtn'));
  await join(page);
  await page.evaluate(() => { window.EmiApp.getProfile().points = 777; });
  await press(page.locator('#tab-shop'));
  await page.locator('#profileName').fill('Emi Fox');
  await press(page.locator('#saveNameBtn'));                  // saving triggers a push a moment later
  await expect.poll(() => { const [d] = [...fb.db.values()]; return d && fb.plain(d).name; }, { timeout: 10_000 }).toBe('Emi Fox');
  const [d] = [...fb.db.values()];
  expect(fb.plain(d)).toMatchObject({ nameLower: 'emi fox', points: 777 });
});

test('leaving deletes the online profile (two taps)', async ({ page }) => {
  const fb = fakeFirebase();
  await fb.attach(page);
  await page.goto('/');
  await setProfile(page, { name: 'Emi' });
  await reveal(page.locator('#joinOnlineBtn'));
  await join(page);
  expect(fb.db.size).toBe(1);
  await press(page.locator('#leaveOnlineBtn'));
  await expect(page.locator('#leaveOnlineBtn')).toHaveText('Tap again to delete my online profile');
  expect(fb.db.size).toBe(1);
  await press(page.locator('#leaveOnlineBtn'));
  await expect(page.locator('#onlineMessage')).toContainText('has been deleted');
  expect(fb.db.size).toBe(0);
  await expect(page.locator('#onlineJoin')).toBeVisible();
});

test('no internet: search says so and the rest of the game keeps working', async ({ page }) => {
  const fb = fakeFirebase();
  await fb.attach(page);
  await page.goto('/');
  await setProfile(page, { name: 'Emi' });
  await reveal(page.locator('#joinOnlineBtn'));
  await join(page);
  fb.failing.add('runQuery');
  await fillIn(page.locator('#onlineSearch'), 'zoe');
  await press(page.locator('#onlineSearchBtn'));
  await expect(page.locator('#onlineMessage')).toContainText('Couldn’t search right now');
  await press(page.getByRole('button', { name: 'Play Quick Quiz →' }));
  await expect(page.locator('#playArea')).toHaveClass(/active/);
});
