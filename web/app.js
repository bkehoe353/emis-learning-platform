// Emi's Learning Platform — game logic. Made by Danny Kehoe.
'use strict';

/* ---------- Settings ---------- */

const PROFILE_KEY = 'emisLearningProfile';
const FRIENDS_KEY = 'emisLearningFriends';
const POINTS_PER_CORRECT = 10;

// Personalised practice (see "Personalised practice" below).
const TRICKY_CHANCE = 0.3;
const TRICKY_MAX = 6;
const PERSONALISED_MODES = new Set(['mix', 'table', 'speed', 'missing', 'truefalse', 'division', 'mtc']);   // not Ranked: keep it fair

const GAMES = {
  mix:       { title: '🎯 Quick Quiz',          total: 10, perQuestion: 60, starAt: 8 },
  table:     { title: '🧠 Table Trainer',       total: 10, starAt: 8 },
  speed:     { title: '⚡ Speed Round',          total: Infinity, roundSeconds: 60, starAt: 15 },
  missing:   { title: '🕵️ Missing Number',      total: 10, starAt: 8 },
  truefalse: { title: '✅ True or False?',       total: 10, starAt: 8 },
  division:  { title: '➗ Division Dash',        total: 10, starAt: 8 },
  word:      { title: '📚 Word Problems',        total: 10, starAt: 8 },
  mtc:       { title: '⏱️ Times Tables Check',   total: 25, perQuestion: 6, typed: true, starAt: 20 },
  ranked:    { title: '🏅 Ranked',               total: 15, perQuestion: 10, typed: true, ranked: true, starAt: 13 },
};

// Every emoji must appear only once (ownership is stored by emoji).
const EMOJI_CATALOG = [
  { emoji: '😎', name: 'Cool Face', price: 100 }, { emoji: '😂', name: 'Laughing Face', price: 150 },
  { emoji: '🥳', name: 'Party Face', price: 200 }, { emoji: '😍', name: 'Love Eyes', price: 250 },
  { emoji: '🐶', name: 'Dog', price: 300 }, { emoji: '🐢', name: 'Sea Turtle', price: 350 },
  { emoji: '🦊', name: 'Fox', price: 400 }, { emoji: '🐼', name: 'Panda', price: 450 },
  { emoji: '🐸', name: 'Frog', price: 500 }, { emoji: '🦄', name: 'Unicorn', price: 600 },
  { emoji: '🐉', name: 'Dragon', price: 700 }, { emoji: '👾', name: 'Alien', price: 800 },
  { emoji: '🤖', name: 'Robot', price: 900 }, { emoji: '👑', name: 'Crown', price: 1000 },
  { emoji: '🚀', name: 'Rocket', price: 1200 }, { emoji: '🦖', name: 'Dinosaur', price: 1400 },
  { emoji: '💎', name: 'Diamond', price: 1600 }, { emoji: '🔥', name: 'Fire', price: 1800 },
  { emoji: '🌈', name: 'Rainbow', price: 2000 }, { emoji: '🦋', name: 'Butterfly', price: 2200 },
  { emoji: '🐬', name: 'Dolphin', price: 2500 }, { emoji: '🦁', name: 'Lion', price: 2800 },
  { emoji: '🐙', name: 'Octopus', price: 3000 }, { emoji: '🛸', name: 'UFO', price: 3500 },
  { emoji: '🦈', name: 'Shark', price: 4000 }, { emoji: '🐳', name: 'Whale', price: 4500 },
  { emoji: '🦕', name: 'Long-neck Dinosaur', price: 5000 }, { emoji: '🦅', name: 'Eagle', price: 5500 },
  { emoji: '🧙', name: 'Wizard', price: 6000 }, { emoji: '🧛', name: 'Vampire', price: 6500 },
  { emoji: '🧟', name: 'Zombie', price: 7000 }, { emoji: '🥷', name: 'Ninja', price: 7500 },
  { emoji: '🦸', name: 'Superhero', price: 8000 }, { emoji: '🧑‍🚀', name: 'Astronaut', price: 8500 },
  { emoji: '👻', name: 'Ghost', price: 9000 }, { emoji: '🎃', name: 'Pumpkin', price: 9500 },
  { emoji: '🏆', name: 'Trophy', price: 10000 }, { emoji: '⚡', name: 'Lightning', price: 11000 },
  { emoji: '🌟', name: 'Super Star', price: 12000 }, { emoji: '🪐', name: 'Planet', price: 13000 },
  { emoji: '🦚', name: 'Peacock', price: 14000 }, { emoji: '🦩', name: 'Flamingo', price: 15000 },
  { emoji: '🐲', name: 'Dragon Face', price: 16000 }, { emoji: '🌌', name: 'Galaxy', price: 18000 },
  // Rare space & magic collection
  { emoji: '🌙', name: 'Moon', price: 10500 }, { emoji: '🌞', name: 'Sunshine', price: 11500 },
  { emoji: '🌍', name: 'Planet Earth', price: 12500 }, { emoji: '💫', name: 'Sparkle Star', price: 12800 },
  { emoji: '🔮', name: 'Crystal Ball', price: 13500 }, { emoji: '🌠', name: 'Shooting Star', price: 14500 },
  { emoji: '☄️', name: 'Comet', price: 15500 }, { emoji: '🪄', name: 'Magic Wand', price: 15800 },
  { emoji: '🧞', name: 'Genie', price: 16500 }, { emoji: '🌀', name: 'Cosmic Swirl', price: 16800 },
  { emoji: '🏰', name: 'Castle', price: 17200 }, { emoji: '🎆', name: 'Fireworks', price: 17500 },
  { emoji: '🧜', name: 'Mermaid', price: 17800 },
].sort((a, b) => a.price - b.price);   // shop shows cheapest first
const DEFAULT_EMOJI = '😀';

// Ranked mode: rank comes from the average seconds per question.
// Wrong answers and timeouts count as the full 10 seconds. Worst first.
const RANKS = [
  { id: 'bronze',   name: 'Bronze',   maxAvg: Infinity },
  { id: 'silver',   name: 'Silver',   maxAvg: 7 },
  { id: 'gold',     name: 'Gold',     maxAvg: 5 },
  { id: 'diamond',  name: 'Diamond',  maxAvg: 3.5 },
  { id: 'amethyst', name: 'Amethyst', maxAvg: 2.5 },
];
const RANKS_BY_ID = Object.fromEntries(RANKS.map((r, i) => [r.id, { ...r, level: i }]));
const rankForAverage = (avg) => [...RANKS].reverse().find((r) => avg <= r.maxAvg).id;
const medalSrc = (id) => `ranks/${id}.svg`;

// Badges: collectables earned by playing. Each one gives a small points reward once.
const BADGE_REWARD = 50;
const rankAtLeast = (p, id) => !!p.bestRank && RANKS_BY_ID[p.bestRank].level >= RANKS_BY_ID[id].level;
const BADGES = [
  { id: 'first',      icon: '🌱', name: 'First Answer',     desc: 'Get your first answer right',          test: (p) => p.correctTotal >= 1 },
  { id: 'c100',       icon: '💯', name: 'Century',          desc: 'Get 100 answers right',                test: (p) => p.correctTotal >= 100 },
  { id: 'c500',       icon: '🧠', name: 'Brain Power',      desc: 'Get 500 answers right',                test: (p) => p.correctTotal >= 500 },
  { id: 'c1000',      icon: '🏛️', name: 'Maths Legend',     desc: 'Get 1,000 answers right',              test: (p) => p.correctTotal >= 1000 },
  { id: 'run10',      icon: '🔥', name: 'On Fire',          desc: 'Get 10 right in a row',                test: (p) => p.bestStreak >= 10 },
  { id: 'run25',      icon: '☄️', name: 'Unstoppable',      desc: 'Get 25 right in a row',                test: (p) => p.bestStreak >= 25 },
  { id: 'perfect',    icon: '🎯', name: 'Perfect Round',    desc: 'Get every question right in a round',  test: (p) => p.perfectRounds >= 1 },
  { id: 'perfect5',   icon: '🌟', name: 'Perfectionist',    desc: 'Get 5 perfect rounds',                 test: (p) => p.perfectRounds >= 5 },
  { id: 'day3',       icon: '📅', name: '3-Day Streak',     desc: 'Practise 3 days in a row',             test: (p) => p.bestDailyStreak >= 3 },
  { id: 'day7',       icon: '🗓️', name: 'Week Warrior',     desc: 'Practise 7 days in a row',             test: (p) => p.bestDailyStreak >= 7 },
  { id: 'day30',      icon: '🏅', name: 'Monthly Master',   desc: 'Practise 30 days in a row',            test: (p) => p.bestDailyStreak >= 30 },
  { id: 'speed20',    icon: '⚡', name: 'Lightning Fingers', desc: 'Get 20 right in one Speed Round',      test: (p) => p.bestSpeed >= 20 },
  { id: 'mtc',        icon: '⏱️', name: 'Check Champion',   desc: 'Get 25 out of 25 in the Times Tables Check', test: (p) => p.mtcPerfect },
  { id: 'gold',       icon: '🥇', name: 'Going for Gold',   desc: 'Reach Gold rank in Ranked',            test: (p) => rankAtLeast(p, 'gold') },
  { id: 'diamond',    icon: '💎', name: 'Diamond Mind',     desc: 'Reach Diamond rank in Ranked',         test: (p) => rankAtLeast(p, 'diamond') },
  { id: 'amethyst',   icon: '🔮', name: 'Amethyst Ace',     desc: 'Reach Amethyst rank in Ranked',        test: (p) => rankAtLeast(p, 'amethyst') },
  { id: 'tricky',     icon: '🦸', name: 'Tricky Tamer',     desc: 'Beat 10 tricky facts',                 test: (p) => p.trickyCleared >= 10 },
  { id: 'shopper',    icon: '🛍️', name: 'First Buy',        desc: 'Buy something in the shop',            test: (p) => p.ownedEmojis.length > 1 || p.ownedBackgrounds.length > 1 },
  { id: 'collector',  icon: '🎨', name: 'Collector',        desc: 'Own 10 emojis from the shop',          test: (p) => p.ownedEmojis.length >= 11 },
];
const BADGES_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b]));

// Dates are the player's local calendar day, e.g. "2026-10-24".
const dayString = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dayString(new Date(Date.now()));
const yesterday = () => { const d = new Date(Date.now()); d.setDate(d.getDate() - 1); return dayString(d); };
const dailyBonus = (days) => 10 + 10 * Math.min(days, 10);   // day 1: +20 … day 10+: +110

function medalImg(id, size) {
  const img = document.createElement('img');
  img.src = medalSrc(id);
  img.alt = RANKS_BY_ID[id].name + ' rank';
  img.width = size; img.height = Math.round(size * 1.2);
  img.className = 'medal';
  return img;
}

// Backgrounds shown behind the character emoji. Saved by id.
const STARS = 'radial-gradient(#fff 1px,transparent 1.6px) 0 0/14px 14px,radial-gradient(#fff9 1px,transparent 1.6px) 7px 7px/14px 14px';
const BACKGROUND_CATALOG = [
  { id: 'sunny', name: 'Sunny', price: 0, css: 'linear-gradient(135deg,#fff0a8,#ffd3e5)' },
  { id: 'mint', name: 'Mint Breeze', price: 200, css: 'linear-gradient(135deg,#d4fbe9,#9fe3ff)' },
  { id: 'bubblegum', name: 'Bubblegum', price: 300, css: 'linear-gradient(135deg,#ffe0f1,#ff9fcf)' },
  { id: 'lavender', name: 'Lavender', price: 400, css: 'linear-gradient(135deg,#efe6ff,#bca5ff)' },
  { id: 'lemonade', name: 'Lemonade', price: 600, css: 'linear-gradient(135deg,#fffbd0,#ffe14d)' },
  { id: 'ocean', name: 'Ocean', price: 800, css: 'linear-gradient(180deg,#a8e4ff,#3d8bfd)' },
  { id: 'forest', name: 'Forest', price: 1000, css: 'linear-gradient(180deg,#d6f7c4,#3fa66a)' },
  { id: 'peach', name: 'Peachy', price: 1300, css: 'linear-gradient(135deg,#ffe5cc,#ff9f7a)' },
  { id: 'sunset', name: 'Sunset', price: 1700, css: 'linear-gradient(180deg,#ffd36b,#ff7a7a 55%,#b15cff)' },
  { id: 'clouds', name: 'Cloudy Sky', price: 2200, css: 'radial-gradient(circle at 25% 35%,#fff 0 14%,transparent 15%),radial-gradient(circle at 38% 32%,#fff 0 17%,transparent 18%),radial-gradient(circle at 72% 70%,#fff 0 13%,transparent 14%),linear-gradient(180deg,#7cc8ff,#cdeeff)' },
  { id: 'candy', name: 'Candy Stripes', price: 3000, css: 'repeating-linear-gradient(45deg,#ffd3e5 0 10px,#fff 10px 20px)' },
  { id: 'polka', name: 'Polka Dots', price: 4000, css: 'radial-gradient(#ff83b5 22%,transparent 24%) 0 0/18px 18px,#fff4fa' },
  { id: 'rainbow', name: 'Rainbow', price: 5000, css: 'linear-gradient(135deg,#ff9a9a,#ffd17a,#fff59a,#a8f0a0,#8bd5ff,#c7a8ff)' },
  { id: 'checkers', name: 'Checkers', price: 6000, css: 'repeating-conic-gradient(#8de4cb 0 25%,#fff 0 50%) 0 0/20px 20px' },
  { id: 'lava', name: 'Lava', price: 7500, css: 'radial-gradient(circle at 30% 70%,#ffe08a,#ff6a3d 45%,#8a1c1c)' },
  { id: 'underwater', name: 'Under the Sea', price: 9000, css: 'radial-gradient(circle at 20% 80%,#ffffff88 0 5%,transparent 6%),radial-gradient(circle at 75% 30%,#ffffff88 0 4%,transparent 5%),radial-gradient(circle at 60% 85%,#ffffff66 0 3%,transparent 4%),linear-gradient(180deg,#2fb8d9,#0b4f8a)' },
  { id: 'gold', name: 'Pure Gold', price: 11000, css: 'linear-gradient(135deg,#fff3b0,#ffcf3f 40%,#c98a00 60%,#ffe680)' },
  { id: 'aurora', name: 'Northern Lights', price: 13000, css: 'linear-gradient(160deg,#0b1d3a,#1f6f78 45%,#7cf5c4 70%,#b48cff)' },
  { id: 'diamond', name: 'Diamond', price: 14500, css: 'conic-gradient(from 45deg,#e0fbff,#b8e8ff,#ffffff,#d8c8ff,#e0fbff,#b8f5ff,#ffffff,#e0fbff)' },
  { id: 'nebula', name: 'Nebula', price: 16000, css: 'radial-gradient(circle at 30% 30%,#ff83b5aa,transparent 45%),radial-gradient(circle at 70% 70%,#8bd5ffaa,transparent 45%),linear-gradient(135deg,#1a0b3d,#4a1c71)' },
  { id: 'starry', name: 'Starry Night', price: 17000, css: STARS + ',linear-gradient(180deg,#0b1033,#2a1a5e)' },
  { id: 'deepspace', name: 'Deep Space', price: 18000, css: STARS + ',radial-gradient(circle at 30% 30%,#ff83b5cc,transparent 40%),radial-gradient(circle at 75% 65%,#8bd5ffcc,transparent 40%),linear-gradient(135deg,#05051f,#3a1c71)' },
];
const DEFAULT_BACKGROUND = 'sunny';

// Rarity comes from the price, so it works for emojis and backgrounds alike.
const RARITIES = [
  { id: 'common',    name: 'Common',     minPrice: 0 },
  { id: 'rare',      name: 'Rare',       minPrice: 1000 },
  { id: 'super',     name: 'Super Rare', minPrice: 5000 },
  { id: 'epic',      name: 'Epic',       minPrice: 10000 },
  { id: 'legendary', name: 'Legendary',  minPrice: 16000 },
];
const rarityFor = (price) => [...RARITIES].reverse().find((r) => price >= r.minPrice);
const BACKGROUNDS_BY_ID = Object.fromEntries(BACKGROUND_CATALOG.map((b) => [b.id, b]));

/* ---------- Helpers ---------- */

const $ = (id) => document.getElementById(id);
const rand = (n) => Math.floor(Math.random() * n) + 1;            // 1..n
const randBetween = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* ---------- Saving (browser storage may be blocked, e.g. private mode) ---------- */

const storage = {
  ok: (() => { try { localStorage.setItem('__emi_test', '1'); localStorage.removeItem('__emi_test'); return true; } catch { return false; } })(),
  read(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  },
  write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  },
};

function newPlayerId() {
  try { return crypto.randomUUID(); } catch { return 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
}

function loadProfile() {
  return sanitizeProfile(storage.read(PROFILE_KEY, {}));
}

// Cleans saved (or restored) profile data so bad values can't break the game.
function sanitizeProfile(saved) {
  if (!saved || typeof saved !== 'object') saved = {};
  const owned = Array.isArray(saved.ownedEmojis) ? saved.ownedEmojis.filter((e) => typeof e === 'string') : [];
  if (!owned.includes(DEFAULT_EMOJI)) owned.unshift(DEFAULT_EMOJI);
  const ownedBgs = Array.isArray(saved.ownedBackgrounds) ? saved.ownedBackgrounds.filter((id) => BACKGROUNDS_BY_ID[id]) : [];
  if (!ownedBgs.includes(DEFAULT_BACKGROUND)) ownedBgs.unshift(DEFAULT_BACKGROUND);
  const num = (v) => Math.max(0, Math.floor(Number(v)) || 0);
  const profile = {
    playerId: typeof saved.playerId === 'string' && saved.playerId ? saved.playerId : newPlayerId(),
    name: typeof saved.name === 'string' ? saved.name.slice(0, 20) : '',
    points: num(saved.points),
    selectedEmoji: owned.includes(saved.selectedEmoji) ? saved.selectedEmoji : DEFAULT_EMOJI,
    ownedEmojis: [...new Set(owned)],
    selectedBackground: ownedBgs.includes(saved.selectedBackground) ? saved.selectedBackground : DEFAULT_BACKGROUND,
    ownedBackgrounds: [...new Set(ownedBgs)],
    stars: num(saved.stars),
    correctTotal: num(saved.correctTotal),
    bestStreak: num(saved.bestStreak),
    trickyFacts: Object.fromEntries(Object.entries(saved.trickyFacts && typeof saved.trickyFacts === 'object' ? saved.trickyFacts : {})
      .filter(([k, v]) => /^\d{1,2}x\d{1,2}$/.test(k) && Number(v) > 0).map(([k, v]) => [k, Math.min(TRICKY_MAX, Math.floor(Number(v)))])),
    bestRank: RANKS_BY_ID[saved.bestRank] ? saved.bestRank : null,       // null = not ranked yet
    bestRankAvg: Number.isFinite(saved.bestRankAvg) ? saved.bestRankAvg : null,
    dailyStreak: num(saved.dailyStreak),
    bestDailyStreak: num(saved.bestDailyStreak),
    lastPlayDay: typeof saved.lastPlayDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.lastPlayDay) ? saved.lastPlayDay : null,
    perfectRounds: num(saved.perfectRounds),
    mtcPerfect: saved.mtcPerfect === true,
    bestSpeed: num(saved.bestSpeed),
    trickyCleared: num(saved.trickyCleared),
    badges: Object.fromEntries(Object.entries(saved.badges && typeof saved.badges === 'object' ? saved.badges : {})
      .filter(([id, day]) => BADGES_BY_ID[id] && typeof day === 'string').map(([id, day]) => [id, day.slice(0, 10)])),
  };
  return profile;
}

// Cleans one stored friend entry.
function sanitizeFriend(f) {
  if (!f || typeof f !== 'object' || typeof f.name !== 'string') return null;
  const id = String(f.id || '').replace(/[^\p{L}\p{N}\p{Emoji}-]/gu, '').slice(0, 80);
  if (!id || !Number.isFinite(Number(f.points))) return null;
  return {
    id, name: f.name.trim().slice(0, 20) || 'Friend',
    emoji: String(f.emoji || DEFAULT_EMOJI).slice(0, 16),
    bg: BACKGROUNDS_BY_ID[f.bg] ? f.bg : DEFAULT_BACKGROUND,
    rank: RANKS_BY_ID[f.rank] ? f.rank : null,
    rankAvg: RANKS_BY_ID[f.rank] && Number(f.rankAvg) > 0 && Number(f.rankAvg) <= 10 ? Math.round(Number(f.rankAvg) * 10) / 10 : null,
    streak: Math.min(3650, Math.max(0, Math.floor(Number(f.streak)) || 0)),
    streakDay: typeof f.streakDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f.streakDay) ? f.streakDay : null,
    points: Math.min(10_000_000, Math.max(0, Math.floor(Number(f.points)))),
    updated: Number.isNaN(Date.parse(f.updated)) ? new Date().toISOString() : f.updated,
  };
}
const sanitizeFriends = (list) => (Array.isArray(list) ? list.map(sanitizeFriend).filter(Boolean) : []);

let profile = loadProfile();
let friends = sanitizeFriends(storage.read(FRIENDS_KEY, []));

function saveProfile() {
  checkBadges();
  storage.write(PROFILE_KEY, profile);
  renderProfile();
  renderStats();
  renderLeaderboard();
}

function saveFriends() {
  storage.write(FRIENDS_KEY, friends);
  renderLeaderboard();
}

/* ---------- Sound ---------- */

let soundOn = true;
let audioCtx = null;

function tone(freq = 660, duration = 0.12, type = 'sine') {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.12, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + duration);
  } catch { /* sound not available */ }
}

function toggleSound() {
  soundOn = !soundOn;
  const btn = $('soundToggle');
  btn.textContent = soundOn ? '🔊 Sound on' : '🔇 Sound off';
  btn.setAttribute('aria-pressed', String(soundOn));
  if (soundOn) tone(660);
}

/* ---------- Celebrations: fox messages and confetti ---------- */

const toastQueue = [];
let toastBusy = false;

function celebrate(message, { confetti = true } = {}) {
  toastQueue.push(message);
  if (confetti) burstConfetti();
  if (!toastBusy) nextToast();
}

function nextToast() {
  const el = $('toast');
  const message = toastQueue.shift();
  if (!message) { toastBusy = false; el.hidden = true; return; }
  toastBusy = true;
  el.textContent = '🦊 ' + message;
  el.hidden = false;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');   // restart the pop-in animation
  setTimeout(nextToast, 2800);
}

function burstConfetti() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = $('confetti');
  const colours = ['#ff83b5', '#ffd65a', '#8de4cb', '#8bd5ff', '#7357d9', '#ff9f7a'];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colours[i % colours.length];
    piece.style.animationDelay = Math.random() * 0.35 + 's';
    piece.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
    piece.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
    piece.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 3400);
  }
}

/* ---------- Daily streak ---------- */

function currentDailyStreak() {
  return profile.lastPlayDay === today() || profile.lastPlayDay === yesterday() ? profile.dailyStreak : 0;
}

// Called on the first correct answer each day. Does not save; the caller does.
function registerPractice() {
  const day = today();
  if (profile.lastPlayDay === day) return;
  profile.dailyStreak = profile.lastPlayDay === yesterday() ? profile.dailyStreak + 1 : 1;
  profile.lastPlayDay = day;
  profile.bestDailyStreak = Math.max(profile.bestDailyStreak, profile.dailyStreak);
  const bonus = dailyBonus(profile.dailyStreak);
  profile.points += bonus;
  celebrate(profile.dailyStreak === 1
    ? `Welcome back! Daily bonus: +${bonus} points`
    : `🔥 ${profile.dailyStreak}-day streak! Daily bonus: +${bonus} points`);
}

/* ---------- Badges ---------- */

// Gives any newly earned badges. Called from saveProfile().
function checkBadges() {
  for (const b of BADGES) {
    if (!profile.badges[b.id] && b.test(profile)) {
      profile.badges[b.id] = today();
      profile.points += BADGE_REWARD;
      celebrate(`Badge unlocked: ${b.icon} ${b.name}! +${BADGE_REWARD} points`);
      tone(1180, 0.2);
    }
  }
}

function renderBadges() {
  const grid = $('badgeGrid');
  const earned = BADGES.filter((b) => profile.badges[b.id]).length;
  $('badgeCount').textContent = `${earned} of ${BADGES.length} badges collected · each one gives +${BADGE_REWARD} points`;
  grid.textContent = '';
  for (const b of BADGES) {
    const got = profile.badges[b.id];
    const tile = document.createElement('div');
    tile.className = 'badge-tile' + (got ? ' earned' : '');
    tile.setAttribute('aria-label', `${b.name}: ${b.desc}. ${got ? 'Earned' : 'Not earned yet'}`);
    const icon = document.createElement('span'); icon.className = 'badge-icon'; icon.textContent = got ? b.icon : '🔒';
    const name = document.createElement('strong'); name.textContent = b.name;
    const desc = document.createElement('small'); desc.textContent = b.desc;
    tile.append(icon, name, desc);
    grid.appendChild(tile);
  }
}

/* ---------- Try it on (shop preview) ---------- */

let tryOn = null;          // { kind, key } while previewing an item
let tryOnTimer = null;

function tryItem(kind, key) {
  clearTimeout(tryOnTimer);
  tryOn = { kind, key };
  tryOnTimer = setTimeout(endTryOn, 6000);
  renderProfile();
  $('profileAvatar').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  tone(760, 0.08);
}

function endTryOn() {
  clearTimeout(tryOnTimer);
  tryOnTimer = null;
  if (!tryOn) return;
  tryOn = null;
  renderProfile();
}

const shownEmoji = () => (tryOn && tryOn.kind === 'emoji' ? tryOn.key : profile.selectedEmoji);
const shownBackground = () => (tryOn && tryOn.kind === 'bg' ? tryOn.key : profile.selectedBackground);

/* ---------- Progress backup ---------- */
// A backup code holds this device's whole profile and friends list. It has a
// checksum so a code that was copied wrongly is rejected (it is not tamper-proof).

function checksum(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36);
}

function makeBackupCode() {
  const body = JSON.stringify({ p: profile, f: friends });
  return 'EMI1-' + toBase64(JSON.stringify({ b: body, s: checksum(body) }));
}

function readBackupCode(code) {
  try {
    const text = String(code).trim();
    if (!text.startsWith('EMI1-')) return null;
    const wrapper = JSON.parse(fromBase64(text.slice(5)));
    if (typeof wrapper.b !== 'string' || checksum(wrapper.b) !== wrapper.s) return null;
    const data = JSON.parse(wrapper.b);
    if (!data || typeof data.p !== 'object') return null;
    return { profile: sanitizeProfile(data.p), friends: sanitizeFriends(data.f) };
  } catch {
    return null;
  }
}

function showBackupMessage(msg) { $('backupMessage').textContent = msg; }

async function createBackup(share) {
  const code = makeBackupCode();
  $('backupCode').value = code;
  if (!share) { showBackupMessage('Backup code made! Copy it and keep it somewhere safe (for example, email it to a grown-up).'); return; }
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Emi’s Learning Platform backup', text: code });
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(code);
      showBackupMessage('Backup code copied! Paste it somewhere safe.');
    } else {
      $('backupCode').focus(); $('backupCode').select();
      showBackupMessage('Select and copy the code above, then keep it somewhere safe.');
    }
  } catch {
    showBackupMessage('Your backup code is shown above. Copy it and keep it somewhere safe.');
  }
}

// Restoring replaces this device's progress, so it needs two taps.
let pendingRestore = null;
let pendingRestoreTimer = null;

function resetRestoreButton() {
  clearTimeout(pendingRestoreTimer);
  pendingRestore = null;
  $('restoreBtn').textContent = '♻️ Restore progress';
  $('restoreBtn').classList.remove('confirm-danger');
}

function restoreBackup() {
  const restored = readBackupCode($('restoreInput').value);
  if (!restored) { resetRestoreButton(); showBackupMessage('That backup code doesn’t look right. Make sure you copied the whole code, starting with EMI1-.'); return; }
  const code = $('restoreInput').value.trim();
  if (pendingRestore !== code) {
    resetRestoreButton();
    pendingRestore = code;
    $('restoreBtn').textContent = 'Tap again to replace this device’s progress';
    $('restoreBtn').classList.add('confirm-danger');
    showBackupMessage(`This backup has ${restored.profile.points.toLocaleString()} points for ${restored.profile.name || 'your character'}. It will replace the progress on this device.`);
    pendingRestoreTimer = setTimeout(resetRestoreButton, 6000);
    return;
  }
  resetRestoreButton();
  profile = restored.profile;
  friends = restored.friends;
  storage.write(FRIENDS_KEY, friends);
  $('profileName').value = profile.name;
  $('restoreInput').value = '';
  saveProfile();
  showBackupMessage('Progress restored!');
  celebrate(`Welcome back${profile.name ? ', ' + profile.name : ''}! Your progress is restored.`);
}

/* ---------- Profile, stats and shop ---------- */

function renderStats() {
  const days = currentDailyStreak();
  $('dayStreak').textContent = days.toLocaleString();
  $('dayStreakHint').textContent = profile.lastPlayDay === today() ? 'Day streak ✓ today'
    : days > 0 ? 'Play today to keep it!' : 'Day streak';
  $('stars').textContent = profile.stars.toLocaleString();
  $('correctCount').textContent = profile.correctTotal.toLocaleString();
  $('streak').textContent = profile.bestStreak.toLocaleString();
}

// The two shops share one set of rules. Each item has a key (what we save),
// a name, a price, and a way to draw its preview.
const SHOPS = {
  emoji: {
    items: () => [{ emoji: DEFAULT_EMOJI, name: 'Happy Face', price: 0 }, ...EMOJI_CATALOG],
    key: (item) => item.emoji,
    label: (item) => item.name,
    owned: () => profile.ownedEmojis,
    selected: () => profile.selectedEmoji,
    select: (key) => { profile.selectedEmoji = key; },
    preview(item) {
      const em = document.createElement('span'); em.className = 'shop-emoji'; em.textContent = item.emoji;
      return em;
    },
  },
  bg: {
    items: () => BACKGROUND_CATALOG,
    key: (item) => item.id,
    label: (item) => item.name + ' background',
    owned: () => profile.ownedBackgrounds,
    selected: () => profile.selectedBackground,
    select: (key) => { profile.selectedBackground = key; },
    preview(item) {
      const swatch = document.createElement('span');
      swatch.className = 'bg-swatch';
      swatch.style.background = item.css;
      swatch.textContent = shownEmoji();   // shows how it will look
      return swatch;
    },
  },
};

const backgroundCss = (id) => (BACKGROUNDS_BY_ID[id] || BACKGROUNDS_BY_ID[DEFAULT_BACKGROUND]).css;

function renderProfile() {
  $('points').textContent = profile.points.toLocaleString();
  $('profileAvatar').textContent = shownEmoji();
  $('profileAvatar').style.background = backgroundCss(shownBackground());
  $('profileAvatar').classList.toggle('trying', !!tryOn);
  $('tryOnNote').hidden = !tryOn;
  $('profileTitle').textContent = profile.name || 'Your Character';
  const badge = $('profileRank');
  badge.textContent = '';
  if (profile.bestRank) {
    const label = document.createElement('span');
    label.textContent = RANKS_BY_ID[profile.bestRank].name;
    badge.append(medalImg(profile.bestRank, 30), label);
  } else {
    badge.textContent = 'Unranked — play Ranked!';
  }
  renderShop('emoji', $('shopGrid'));
  renderShop('bg', $('bgGrid'));
  renderBadges();
}

// Each shop shows its first SHOP_PREVIEW items until "See more" is tapped.
const SHOP_PREVIEW = 12;
const shopExpanded = { emoji: false, bg: false };

function toggleShopMore(kind) {
  shopExpanded[kind] = !shopExpanded[kind];
  clearPendingBuy();
  renderProfile();
}

function renderShop(kind, grid) {
  const shop = SHOPS[kind];
  const all = shop.items();
  const visible = shopExpanded[kind] ? all : all.slice(0, SHOP_PREVIEW);
  const more = $(kind === 'emoji' ? 'emojiMore' : 'bgMore');
  more.hidden = all.length <= SHOP_PREVIEW;
  more.textContent = shopExpanded[kind] ? 'Show less ▲' : `See more (${all.length - SHOP_PREVIEW} more) ▼`;
  more.setAttribute('aria-expanded', String(shopExpanded[kind]));
  grid.textContent = '';
  for (const item of visible) {
    const key = shop.key(item);
    const label = shop.label(item);
    const owned = shop.owned().includes(key);
    const chosen = shop.selected() === key;
    const card = document.createElement('div');
    const rarity = rarityFor(item.price);
    card.className = `emoji-item rarity-${rarity.id}` + (chosen ? ' chosen' : '');
    const chip = document.createElement('span'); chip.className = 'rarity-chip'; chip.textContent = rarity.name;
    const name = document.createElement('strong'); name.textContent = item.name;
    const price = document.createElement('small'); price.textContent = item.price ? item.price.toLocaleString() + ' points' : 'Free';
    const btn = document.createElement('button');
    btn.type = 'button';
    if (owned) {
      btn.className = 'owned';
      btn.textContent = chosen ? 'Using ✓' : 'Use';
      btn.setAttribute('aria-label', (chosen ? 'Using ' : 'Use ') + label);
      btn.addEventListener('click', () => useItem(kind, key));
    } else {
      const short = item.price - profile.points;
      const confirming = pendingBuy === kind + ':' + key;
      btn.textContent = short > 0 ? `Need ${short.toLocaleString()} more` : confirming ? 'Tap again to buy' : 'Buy';
      if (confirming) btn.className = 'confirm';
      btn.setAttribute('aria-label', confirming ? `Confirm: buy ${label}` : `Buy ${label} for ${item.price} points`);
      btn.disabled = short > 0;
      btn.addEventListener('click', () => buyItem(kind, item));
    }
    card.append(chip, shop.preview(item), name, price, btn);
    if (!owned) {
      const trying = tryOn && tryOn.kind === kind && tryOn.key === key;
      const tryBtn = document.createElement('button');
      tryBtn.type = 'button';
      tryBtn.className = 'try-btn' + (trying ? ' trying' : '');
      tryBtn.textContent = trying ? '👀 Trying on' : '👀 Try on';
      tryBtn.setAttribute('aria-label', 'Try on ' + label);
      tryBtn.addEventListener('click', () => (trying ? endTryOn() : tryItem(kind, key)));
      card.appendChild(tryBtn);
    }
    grid.appendChild(card);
  }
}

function useItem(kind, key) {
  const shop = SHOPS[kind];
  if (!shop.owned().includes(key)) return;
  endTryOn();
  shop.select(key);
  saveProfile();
}

// Buying takes two taps: "Buy" then "Tap again to buy" (within 5 seconds).
// This is done on the page itself because some browsers and app wrappers
// silently block confirm() pop-ups, which would cancel every purchase.
let pendingBuy = null;
let pendingBuyTimer = null;

function clearPendingBuy() {
  clearTimeout(pendingBuyTimer);
  pendingBuy = null;
  pendingBuyTimer = null;
}

function buyItem(kind, item) {
  const shop = SHOPS[kind];
  const key = shop.key(item);
  if (shop.owned().includes(key)) return;                     // never charge twice
  if (profile.points < item.price) return;
  const pendingKey = kind + ':' + key;
  if (pendingBuy !== pendingKey) {
    clearPendingBuy();
    pendingBuy = pendingKey;
    pendingBuyTimer = setTimeout(() => { clearPendingBuy(); renderProfile(); }, 5000);
    renderProfile();
    tone(600, 0.08);
    return;
  }
  clearPendingBuy();
  endTryOn();
  profile.points -= item.price;
  shop.owned().push(key);
  shop.select(key);
  saveProfile();
  tone(900, 0.16);
  const rarity = rarityFor(item.price);
  const fancy = rarity.minPrice >= 10000 ? `a ${rarity.name.toUpperCase()} ` : '';   // shout about Epic and Legendary
  celebrate(kind === 'emoji' ? `You got ${fancy}${item.emoji} ${item.name}!` : `You got ${fancy || 'the '}${item.name} background!`);
}

function showShopTab(kind) {
  for (const tab of document.querySelectorAll('.shop-tab')) {
    const on = tab.dataset.shop === kind;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
  }
  $('emojiPanel').hidden = kind !== 'emoji';
  $('bgPanel').hidden = kind !== 'bg';
  $('badgePanel').hidden = kind !== 'badges';
}

function saveName() {
  profile.name = $('profileName').value.trim().slice(0, 20);
  saveProfile();
  tone(720, 0.1);
}

/* ---------- Friend codes (snapshots, not live) ---------- */

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}
function fromBase64(code) {
  const bin = atob(code.replace(/\s+/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function makeFriendCode() {
  return toBase64(JSON.stringify({
    v: 2, id: profile.playerId, name: profile.name || 'Maths Champion',
    emoji: profile.selectedEmoji || DEFAULT_EMOJI, bg: profile.selectedBackground, rank: profile.bestRank, rankAvg: profile.bestRankAvg,
    streak: currentDailyStreak(), streakDay: profile.lastPlayDay, points: profile.points,
  }));
}

function decodeFriendCode(code) {
  try {
    const data = JSON.parse(fromBase64(String(code).trim()));
    if ((data.v !== 1 && data.v !== 2) || typeof data.name !== 'string' || !Number.isFinite(Number(data.points))) return null;
    const name = data.name.trim().slice(0, 20) || 'Friend';
    const emoji = String(data.emoji || DEFAULT_EMOJI).slice(0, 16);
    const id = data.v === 2 && typeof data.id === 'string'
      ? data.id.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64)
      : 'v1-' + name.toLowerCase() + '-' + emoji;
    if (!id) return null;
    return sanitizeFriend({ ...data, id, name, emoji, updated: new Date().toISOString() });
  } catch {
    return null;
  }
}

function showFriendMessage(msg) { $('friendMessage').textContent = msg; }

function showMyCode() {
  $('myFriendCode').value = makeFriendCode();
  showFriendMessage('Your code is ready! Copy it and send it to your friend.');
}

async function shareMyCode() {
  const code = makeFriendCode();
  $('myFriendCode').value = code;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'My Emi’s Learning Platform friend code', text: 'Add me on Emi’s Learning Platform with this friend code: ' + code });
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(code);
      showFriendMessage('Friend code copied! Send it to your friend.');
    } else {
      $('myFriendCode').focus(); $('myFriendCode').select();
      showFriendMessage('Select and copy the code above, then send it to your friend.');
    }
  } catch {
    showFriendMessage('Your code is shown above. Copy it and send it to your friend.');
  }
}

function addFriend() {
  const data = decodeFriendCode($('friendCodeInput').value);
  if (!data) { showFriendMessage('That code does not look right. Ask your friend to make a new code and copy the whole thing.'); return; }
  if (data.id === profile.playerId) { showFriendMessage('That looks like your own code! Ask a friend for theirs.'); return; }
  const existing = friends.findIndex((f) => f.id === data.id);
  if (existing >= 0) friends[existing] = data; else friends.push(data);
  saveFriends();
  $('friendCodeInput').value = '';
  showFriendMessage(existing >= 0 ? `${data.name}’s score has been updated!` : `${data.name} added to your leaderboard!`);
}

function removeFriend(id) {
  friends = friends.filter((f) => f.id !== id);
  saveFriends();
}

// Leaderboard order: best Ranked medal first; same medal → faster average time;
// still tied → more points. Players with no rank yet go at the bottom.
function compareLeaders(a, b) {
  const level = (p) => (p.rank && RANKS_BY_ID[p.rank] ? RANKS_BY_ID[p.rank].level : -1);
  const avg = (p) => (p.rank && Number.isFinite(p.rankAvg) ? p.rankAvg : Infinity);
  return level(b) - level(a) || avg(a) - avg(b) || b.points - a.points;
}

// A friend's streak comes from their last code. If that code is old, say so.
function friendStreakText(person) {
  if (!person.streak) return 'No day streak yet';
  const text = `🔥 ${person.streak}-day streak`;
  // Dates compare as text (YYYY-MM-DD). A date "ahead" of ours is just a different time zone, so it counts as current.
  if (person.isYou || (person.streakDay && person.streakDay >= yesterday())) return text;
  return text + ' (ask for a new code to update)';
}

function renderLeaderboard() {
  const box = $('leaderboard');
  const you = {
    id: 'you', name: profile.name || 'You', emoji: profile.selectedEmoji, bg: profile.selectedBackground,
    rank: profile.bestRank, rankAvg: profile.bestRankAvg, streak: currentDailyStreak(), points: profile.points, isYou: true,
  };
  const everyone = [you, ...friends].sort(compareLeaders);
  box.textContent = '';
  const title = document.createElement('h3'); title.textContent = '🏆 Leaderboard';
  const how = document.createElement('p'); how.className = 'shop-note';
  how.textContent = 'Ordered by best Ranked medal. Same medal? The faster average time wins. Play Ranked to climb!';
  box.append(title, how);
  if (!friends.length) {
    const empty = document.createElement('p'); empty.className = 'shop-note';
    empty.textContent = 'No friends added yet. Share your code, then paste a friend’s code above.';
    box.appendChild(empty);
  }
  everyone.forEach((person, index) => {
    const row = document.createElement('div'); row.className = 'leader-row' + (person.isYou ? ' you' : '');
    const place = document.createElement('span'); place.className = 'rank place-' + (index + 1);
    place.textContent = index + 1 + (['st', 'nd', 'rd'][index] || 'th');
    place.setAttribute('aria-label', `Place ${index + 1}`);
    const face = document.createElement('span'); face.className = 'face'; face.textContent = person.emoji;
    face.style.background = backgroundCss(person.bg);
    const details = document.createElement('div'); details.className = 'person';
    const name = document.createElement('strong'); name.textContent = person.name + (person.isYou ? ' (You)' : '');
    const rankLine = document.createElement('span'); rankLine.className = 'leader-rank';
    const ranked = person.rank && RANKS_BY_ID[person.rank];
    if (ranked) {
      rankLine.append(medalImg(person.rank, 20), RANKS_BY_ID[person.rank].name + ' rank' + (Number.isFinite(person.rankAvg) ? ` · ${person.rankAvg.toFixed(1)}s` : ''));
    } else {
      rankLine.textContent = 'Unranked';
    }
    const streakLine = document.createElement('span'); streakLine.className = 'leader-streak';
    streakLine.textContent = friendStreakText(person);
    const note = document.createElement('small');
    note.textContent = (person.isYou ? 'You · ' : 'From their code on ' + new Date(person.updated).toLocaleDateString() + ' · ') + person.points.toLocaleString() + ' pts';
    details.append(name, rankLine, streakLine, note);
    const medal = document.createElement('span'); medal.className = 'score';
    if (ranked) medal.appendChild(medalImg(person.rank, 40)); else medal.textContent = '—';
    row.append(place, face, details, medal);
    if (!person.isYou) {
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + person.name);
      remove.addEventListener('click', () => removeFriend(person.id));
      row.appendChild(remove);
    }
    box.appendChild(row);
  });
}

/* ---------- Questions ---------- */

// Builds one question for a game mode. Pure: no page changes.
// `factors` (optional) picks the multiplication fact to ask, e.g. [7, 8].
function makeQuestion(mode, table = 2, factors = null) {
  if (mode === 'mtc' || mode === 'ranked') {
    const [a, b] = factors || [randBetween(2, 12), randBetween(2, 12)];
    return { text: `${a} × ${b} = ?`, hint: 'Type your answer, then press Enter', answer: a * b, fact: `${a} × ${b} = ${a * b}`, factors: [a, b] };
  }
  const [a, b] = factors || [mode === 'table' ? Number(table) : rand(12), rand(12)];
  const product = a * b;
  const fourChoices = (answer, makeWrong) => {
    const opts = new Set([answer]);
    let guard = 0;
    while (opts.size < 4 && guard++ < 200) { const n = makeWrong(); if (n >= 0) opts.add(n); }
    return shuffle([...opts]);
  };

  if (mode === 'missing') {
    return { text: `? × ${b} = ${product}`, hint: 'Which number belongs in the gap?', answer: a, choices: fourChoices(a, () => rand(12)), factors: [a, b] };
  }
  if (mode === 'division') {
    return { text: `${product} ÷ ${a} = ?`, hint: 'Division is multiplication in reverse!', answer: b, choices: fourChoices(b, () => rand(12)), factors: [a, b] };
  }
  if (mode === 'truefalse') {
    const isTrue = Math.random() < 0.5;
    let shown = isTrue ? product : product + (Math.random() < 0.5 ? rand(5) : -rand(5));
    if (shown < 0) shown = product + rand(5);
    return { text: `${a} × ${b} = ${shown}`, hint: 'Is this multiplication fact true or false?', answer: isTrue ? 'True' : 'False', choices: ['True', 'False'], factors: [a, b] };
  }
  if (mode === 'word') {
    const things = ['stickers', 'cupcakes', 'books', 'shells', 'football cards', 'pencils'];
    const item = things[rand(things.length) - 1];
    const groups = rand(9) + 1, each = rand(12), answer = groups * each;
    return {
      text: `There are ${groups} boxes with ${each} ${item} in each. How many ${item} altogether?`,
      hint: 'Multiply the number of groups by the number in each group.',
      answer, choices: fourChoices(answer, () => answer + rand(15) - 8),
    };
  }
  // mix, table, speed
  return {
    text: `${a} × ${b} = ?`, hint: 'Choose the correct answer below', answer: product,
    choices: fourChoices(product, () => (Math.random() < 0.6 ? product + rand(20) - 10 : rand(12) * rand(12))),
    factors: [a, b],
  };
}

/* ---------- Personalised practice ---------- */
// Each fact the player gets wrong gets a "tricky" score (7 × 8 and 8 × 7 count as one).
// Wrong or too slow: +2 (max 6). Right: -1. At 0 it is forgotten.
// About 3 in 10 questions are picked from tricky facts, never the same one twice in a row.
const factKey = (a, b) => Math.min(a, b) + 'x' + Math.max(a, b);

function recordFact(factors, correct) {
  if (!factors) return;
  const key = factKey(...factors);
  const next = (profile.trickyFacts[key] || 0) + (correct ? -1 : 2);
  if (next <= 0) {
    if (profile.trickyFacts[key]) profile.trickyCleared++;   // a tricky fact has been beaten
    delete profile.trickyFacts[key];
  }
  else profile.trickyFacts[key] = Math.min(TRICKY_MAX, next);
}

// Returns [a, b] for a tricky fact, or null to ask a normal random question.
function pickTrickyFactors(mode, table, lastKey, random = Math.random) {
  if (!PERSONALISED_MODES.has(mode) || random() >= TRICKY_CHANCE) return null;
  let options = Object.entries(profile.trickyFacts)
    .map(([key, weight]) => ({ key, weight, nums: key.split('x').map(Number) }))
    .filter((f) => f.key !== lastKey);
  if (mode === 'table') options = options.filter((f) => f.nums.includes(Number(table)));
  if (mode === 'mtc') options = options.filter((f) => f.nums.every((n) => n >= 2));   // the check uses 2-12
  if (!options.length) return null;
  let roll = random() * options.reduce((sum, f) => sum + f.weight, 0);     // trickier facts come up more
  const pick = options.find((f) => (roll -= f.weight) < 0) || options[options.length - 1];
  let [a, b] = pick.nums;
  if (mode === 'table') { b = a === Number(table) ? b : a; a = Number(table); }
  else if (random() < 0.5) [a, b] = [b, a];
  return [a, b];
}

/* ---------- Game flow ---------- */

const game = { mode: 'mix', config: GAMES.mix, qNum: 0, score: 0, streak: 0, locked: true, ended: true, seconds: 0, question: null, typed: '', missed: [], times: [], questionStart: 0 };
const timers = { round: null, question: null, advance: null };

function clearTimers() {
  clearInterval(timers.round); clearInterval(timers.question); clearTimeout(timers.advance);
  timers.round = timers.question = timers.advance = null;
}

function startGame(mode) {
  if (!GAMES[mode]) mode = 'mix';
  clearTimers();
  Object.assign(game, { mode, config: GAMES[mode], qNum: 0, score: 0, streak: 0, locked: false, ended: false, typed: '', missed: [], times: [] });
  $('rankResult').hidden = true;
  $('playArea').classList.add('active');
  $('tableControls').hidden = mode !== 'table';
  $('gameTitle').textContent = game.config.title;
  $('restartBtn').hidden = true;
  $('nextBtn').hidden = true;
  $('missed').hidden = true;
  $('timerLabel').textContent = '';
  newQuestion();
  $('playArea').scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (game.config.roundSeconds) {
    game.seconds = game.config.roundSeconds;
    $('timerLabel').textContent = '⏱ ' + game.seconds + 's';
    timers.round = setInterval(() => {
      game.seconds--;
      $('timerLabel').textContent = '⏱ ' + Math.max(0, game.seconds) + 's';
      if (game.seconds <= 0) endSpeedRound();
    }, 1000);
  }
}

function newQuestion() {
  if (game.ended) return;
  clearInterval(timers.question); timers.question = null;
  game.locked = false;
  game.typed = '';
  const lastKey = game.question && game.question.factors ? factKey(...game.question.factors) : null;
  const tricky = pickTrickyFactors(game.mode, $('tableSelect').value, lastKey);
  game.question = makeQuestion(game.mode, $('tableSelect').value, tricky);
  game.question.tricky = !!tricky;
  const q = game.question;

  $('feedback').textContent = '';
  $('nextBtn').hidden = true;
  $('question').textContent = q.text;
  $('questionHint').textContent = (q.tricky ? '🎯 Practice time — this one was tricky before! ' : '') + q.hint;
  $('roundLabel').textContent = game.mode === 'speed' ? 'Correct: ' + game.score : `Question ${game.qNum + 1} of ${game.config.total}`;
  $('progress').style.width = (game.mode === 'speed' ? (game.score % 10) * 10 : (game.qNum / game.config.total) * 100) + '%';

  const typed = !!game.config.typed;
  $('answers').hidden = typed;
  $('typedArea').hidden = !typed;
  $('answers').textContent = '';
  if (typed) {
    renderTyped();
    $('typedAnswer').className = 'typed-answer';
    setKeypadEnabled(true);
  } else {
    for (const choice of q.choices) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer';
      btn.textContent = choice;
      btn.dataset.value = String(choice);
      btn.addEventListener('click', () => submitAnswer(choice, btn));
      $('answers').appendChild(btn);
    }
  }

  if (game.config.perQuestion) startQuestionTimer(game.config.perQuestion);
  game.questionStart = Date.now();
}

function startQuestionTimer(seconds) {
  game.seconds = seconds;
  $('timerLabel').textContent = '⏱ ' + seconds + 's';
  timers.question = setInterval(() => {
    if (game.locked) { clearInterval(timers.question); timers.question = null; return; }
    game.seconds--;
    $('timerLabel').textContent = '⏱ ' + Math.max(0, game.seconds) + 's';
    if (game.seconds <= 0) questionTimedOut();
  }, 1000);
}

function lockAnswers() {
  game.locked = true;
  clearInterval(timers.question); timers.question = null;
  document.querySelectorAll('#answers .answer').forEach((b) => {
    b.disabled = true;
    if (b.dataset.value === String(game.question.answer)) b.classList.add('correct');
  });
  setKeypadEnabled(false);
}

function questionTimedOut() {
  if (game.locked) return;
  lockAnswers();
  game.streak = 0;
  recordFact(game.question.factors, false);
  saveProfile();
  if (game.config.typed) { game.missed.push(game.question.fact); $('typedAnswer').classList.add('wrong'); }
  if (game.config.ranked) game.times.push(game.config.perQuestion);
  $('feedback').textContent = `⏰ Time’s up! The answer was ${game.question.answer}.`;
  tone(240, 0.2, 'triangle');
  afterAnswer();
}

function submitAnswer(value, btn) {
  if (game.locked || game.ended) return;
  lockAnswers();
  const correct = String(value) === String(game.question.answer);
  if (game.config.ranked) {
    const seconds = Math.min(game.config.perQuestion, (Date.now() - game.questionStart) / 1000);
    game.times.push(correct ? seconds : game.config.perQuestion);   // wrong answers count as the full time
  }
  recordFact(game.question.factors, correct);
  if (!correct) saveProfile();   // a correct answer saves below
  if (correct) {
    game.score++;
    game.streak++;
    profile.points += POINTS_PER_CORRECT;                 // once per question: answers are locked above
    registerPractice();                                    // daily streak (first correct answer of the day)
    profile.correctTotal++;
    profile.bestStreak = Math.max(profile.bestStreak, game.streak);
    saveProfile();
    $('feedback').textContent = ['🌟 Brilliant!', '🎉 Fantastic!', '🚀 You nailed it!', '🦊 Fox-tastic!'][rand(4) - 1] + ' +10 points';
    tone(880, 0.15); setTimeout(() => tone(1100, 0.12), 100);
  } else {
    game.streak = 0;
    if (btn) btn.classList.add('wrong');
    if (game.config.typed) game.missed.push(game.question.fact);
    $('feedback').textContent = `Nearly! The answer is ${game.question.answer}. Keep going!`;
    tone(240, 0.2, 'triangle');
  }
  if (game.config.typed) $('typedAnswer').classList.add(correct ? 'correct' : 'wrong');
  afterAnswer();
}

function isLastQuestion() { return game.qNum + 1 >= game.config.total; }

function afterAnswer() {
  if (game.mode === 'speed') {
    $('roundLabel').textContent = 'Correct: ' + game.score;
    $('progress').style.width = (game.score % 10) * 10 + '%';
    timers.advance = setTimeout(nextQuestion, 700);
  } else if (game.config.typed) {
    // Ranked moves on quickly; the clock for the next question starts when it appears.
    timers.advance = setTimeout(nextQuestion, game.config.ranked ? 900 : 1500);
  } else if (isLastQuestion()) {
    finishRound();
  } else {
    $('nextBtn').hidden = false;
    $('nextBtn').focus({ preventScroll: true });
  }
}

function nextQuestion() {
  if (game.ended) return;
  clearTimeout(timers.advance); timers.advance = null;
  game.qNum++;
  if (game.qNum >= game.config.total) { finishRound(); return; }
  newQuestion();
}

function awardStarIfEarned() {
  if (game.score >= game.config.starAt) { profile.stars++; saveProfile(); return true; }
  return false;
}

function finishRound() {
  game.ended = true;
  game.locked = true;
  clearTimers();
  const total = game.config.total;
  const perfect = game.score === total;
  if (perfect) {
    profile.perfectRounds++;
    if (game.mode === 'mtc') profile.mtcPerfect = true;
    saveProfile();
  }
  const star = awardStarIfEarned();
  if (perfect) celebrate(`Perfect round! ${total} out of ${total}!`);
  else if (star) celebrate('You earned a star! ⭐');
  $('nextBtn').hidden = true;
  $('restartBtn').hidden = false;
  $('progress').style.width = '100%';
  $('roundLabel').textContent = 'Round finished';
  $('timerLabel').textContent = '';
  const summary = `🏆 Round complete! You got ${game.score} out of ${total}.` + (star ? ' ⭐ You earned a star!' : '');
  if (game.config.typed) {
    setKeypadEnabled(false);
    $('question').textContent = game.config.ranked ? '🏆 Ranked round complete!' : '🏆 Check complete!';
    if (game.config.ranked) showRankResult();
    $('questionHint').textContent = 'Every question helps your brain grow.';
    $('typedArea').hidden = true;
    $('feedback').textContent = summary;
    if (game.missed.length) {
      $('missed').hidden = false;
      $('missed').textContent = '';
      const label = document.createElement('strong'); label.textContent = 'Facts to practise: ';
      $('missed').append(label, game.missed.join(' · '));
    }
  } else {
    $('feedback').textContent += ' ' + summary;
  }
  tone(1040, 0.25);
  $('restartBtn').focus({ preventScroll: true });
}

function showRankResult() {
  const avg = game.times.reduce((a, b) => a + b, 0) / game.times.length;
  const rankId = rankForAverage(avg);
  const rank = RANKS_BY_ID[rankId];
  const isNewBest = !profile.bestRank || rank.level > RANKS_BY_ID[profile.bestRank].level
    || (rankId === profile.bestRank && avg < (profile.bestRankAvg ?? Infinity));
  if (isNewBest) {
    celebrate(`New best rank: ${rank.name}!`);
    profile.bestRank = rankId;
    profile.bestRankAvg = Math.round(avg * 10) / 10;
    saveProfile();
  }

  const box = $('rankResult');
  box.textContent = '';
  box.hidden = false;
  box.append(medalImg(rankId, 110));
  const title = document.createElement('h3');
  title.textContent = `${rank.name} rank!`;
  const detail = document.createElement('p');
  detail.textContent = `Average time: ${avg.toFixed(1)} seconds per question.` + (isNewBest ? ' 🎉 New best!' : ` Your best is still ${RANKS_BY_ID[profile.bestRank].name}.`);
  box.append(title, detail);

  // The ladder shows every rank and the time needed for it.
  const ladder = document.createElement('div');
  ladder.className = 'rank-ladder';
  RANKS.forEach((r, i) => {
    const step = document.createElement('div');
    step.className = 'rank-step' + (r.id === rankId ? ' current' : '');
    const label = document.createElement('small');
    label.textContent = r.name + (i === 0 ? '' : ` · ${r.maxAvg}s`);
    step.append(medalImg(r.id, 40), label);
    ladder.appendChild(step);
  });
  box.appendChild(ladder);
  if (rank.level === RANKS.length - 1) tone(1320, 0.3);
}

function endSpeedRound() {
  if (game.ended) return;
  game.ended = true;
  game.locked = true;
  clearTimers();
  profile.bestSpeed = Math.max(profile.bestSpeed, game.score);
  saveProfile();
  const star = awardStarIfEarned();
  if (star) celebrate(`Speedy! ${game.score} in 60 seconds! ⭐`);
  $('answers').textContent = '';
  $('question').textContent = '🏆 Amazing effort!';
  $('questionHint').textContent = 'Every question helps your brain grow.';
  $('feedback').textContent = `⏰ Time’s up! You got ${game.score} correct in 60 seconds. ` + (star ? '⭐ You earned a star!' : game.score >= 10 ? 'Superstar work!' : 'Keep practising — you’re getting stronger!');
  $('roundLabel').textContent = 'Round finished';
  $('timerLabel').textContent = '⏱ 0s';
  $('nextBtn').hidden = true;
  $('restartBtn').hidden = false;
  $('progress').style.width = '100%';
  tone(900, 0.2); setTimeout(() => tone(1200, 0.25), 140);
}

function closeGame() {
  clearTimers();
  game.ended = true;
  game.locked = true;
  $('playArea').classList.remove('active');
}

/* ---------- Typed answers (Times Tables Check) ---------- */

function renderTyped() { $('typedAnswer').textContent = game.typed || ' '; }

function setKeypadEnabled(on) { document.querySelectorAll('#keypad button').forEach((b) => { b.disabled = !on; }); }

function pressKey(key) {
  if (!game.config.typed || game.locked || game.ended) return;
  if (key === 'enter') {
    if (game.typed !== '') submitAnswer(Number(game.typed), null);
    return;
  }
  if (key === 'del') game.typed = game.typed.slice(0, -1);
  else if (/^\d$/.test(key) && game.typed.length < 3) game.typed += key;
  renderTyped();
}

/* ---------- Start up ---------- */

function init() {
  document.querySelectorAll('[data-game]').forEach((btn) => btn.addEventListener('click', () => startGame(btn.dataset.game)));
  $('soundToggle').addEventListener('click', toggleSound);
  $('startPlayingBtn').addEventListener('click', () => {
    const target = $('challenges');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.focus({ preventScroll: true });   // keyboard and screen-reader users land there too
  });
  $('makeBackupBtn').addEventListener('click', () => createBackup(false));
  $('shareBackupBtn').addEventListener('click', () => createBackup(true));
  $('restoreBtn').addEventListener('click', restoreBackup);
  $('restoreInput').addEventListener('input', resetRestoreButton);
  $('emojiMore').addEventListener('click', () => toggleShopMore('emoji'));
  $('bgMore').addEventListener('click', () => toggleShopMore('bg'));
  document.querySelectorAll('.shop-tab').forEach((tab) => tab.addEventListener('click', () => showShopTab(tab.dataset.shop)));
  $('saveNameBtn').addEventListener('click', saveName);
  $('profileName').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
  $('makeFriendCode').addEventListener('click', showMyCode);
  $('shareFriendCode').addEventListener('click', shareMyCode);
  $('addFriendBtn').addEventListener('click', addFriend);
  $('closeBtn').addEventListener('click', closeGame);
  $('nextBtn').addEventListener('click', nextQuestion);
  $('restartBtn').addEventListener('click', () => startGame(game.mode));
  $('tableSelect').addEventListener('change', () => { if (game.mode === 'table') startGame('table'); });
  $('keypad').addEventListener('click', (e) => { const b = e.target.closest('button[data-key]'); if (b) pressKey(b.dataset.key); });
  document.addEventListener('keydown', (e) => {
    if (!$('playArea').classList.contains('active') || !game.config.typed) return;
    if (e.target.closest('input, textarea, select')) return;
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === 'Backspace') { e.preventDefault(); pressKey('del'); }
    else if (e.key === 'Enter') { e.preventDefault(); pressKey('enter'); }
  });

  $('profileName').value = profile.name;
  $('storageWarning').hidden = storage.ok;
  storage.write(PROFILE_KEY, profile);   // keeps the new player id
  renderProfile();
  renderStats();
  renderLeaderboard();

  // Offline support / Home Screen install (only on https or localhost).
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// Exposed for automated tests.
window.EmiApp = { makeQuestion, decodeFriendCode, makeFriendCode, EMOJI_CATALOG, BACKGROUND_CATALOG, GAMES, RANKS, rankForAverage, pickTrickyFactors, getProfile: () => profile, BADGES, makeBackupCode, readBackupCode, compareLeaders, RARITIES, rarityFor };

init();
