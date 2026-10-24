// Emi's Learning Platform — game logic. Made by Danny Kehoe.
'use strict';

/* ---------- Settings ---------- */

const PROFILE_KEY = 'emisLearningProfile';
const FRIENDS_KEY = 'emisLearningFriends';
const POINTS_PER_CORRECT = 10;

const GAMES = {
  mix:       { title: '🎯 Quick Quiz',          total: 10, perQuestion: 60, starAt: 8 },
  table:     { title: '🧠 Table Trainer',       total: 10, starAt: 8 },
  speed:     { title: '⚡ Speed Round',          total: Infinity, roundSeconds: 60, starAt: 15 },
  missing:   { title: '🕵️ Missing Number',      total: 10, starAt: 8 },
  truefalse: { title: '✅ True or False?',       total: 10, starAt: 8 },
  division:  { title: '➗ Division Dash',        total: 10, starAt: 8 },
  word:      { title: '📚 Word Problems',        total: 10, starAt: 8 },
  mtc:       { title: '⏱️ Times Tables Check',   total: 25, perQuestion: 6, typed: true, starAt: 20 },
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
  const saved = storage.read(PROFILE_KEY, {}) || {};
  const owned = Array.isArray(saved.ownedEmojis) ? saved.ownedEmojis.filter((e) => typeof e === 'string') : [];
  if (!owned.includes(DEFAULT_EMOJI)) owned.unshift(DEFAULT_EMOJI);
  const num = (v) => Math.max(0, Math.floor(Number(v)) || 0);
  const profile = {
    playerId: typeof saved.playerId === 'string' && saved.playerId ? saved.playerId : newPlayerId(),
    name: typeof saved.name === 'string' ? saved.name.slice(0, 20) : '',
    points: num(saved.points),
    selectedEmoji: owned.includes(saved.selectedEmoji) ? saved.selectedEmoji : DEFAULT_EMOJI,
    ownedEmojis: [...new Set(owned)],
    stars: num(saved.stars),
    correctTotal: num(saved.correctTotal),
    bestStreak: num(saved.bestStreak),
  };
  return profile;
}

let profile = loadProfile();
let friends = (() => { const f = storage.read(FRIENDS_KEY, []); return Array.isArray(f) ? f : []; })();

function saveProfile() {
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

/* ---------- Profile, stats and shop ---------- */

function renderStats() {
  $('stars').textContent = profile.stars.toLocaleString();
  $('correctCount').textContent = profile.correctTotal.toLocaleString();
  $('streak').textContent = profile.bestStreak.toLocaleString();
}

function renderProfile() {
  $('points').textContent = profile.points.toLocaleString();
  $('profileAvatar').textContent = profile.selectedEmoji;
  $('profileTitle').textContent = profile.name || 'Your Character';
  const grid = $('shopGrid');
  grid.textContent = '';
  for (const item of [{ emoji: DEFAULT_EMOJI, name: 'Happy Face', price: 0 }, ...EMOJI_CATALOG]) {
    const owned = profile.ownedEmojis.includes(item.emoji);
    const chosen = profile.selectedEmoji === item.emoji;
    const card = document.createElement('div');
    card.className = 'emoji-item';
    const em = document.createElement('span'); em.className = 'shop-emoji'; em.textContent = item.emoji;
    const name = document.createElement('strong'); name.textContent = item.name;
    const price = document.createElement('small'); price.textContent = item.price ? item.price.toLocaleString() + ' points' : 'Free';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.emoji = item.emoji;
    if (owned) {
      btn.className = 'owned';
      btn.textContent = chosen ? 'Using ✓' : 'Use emoji';
      btn.setAttribute('aria-label', (chosen ? 'Using ' : 'Use ') + item.name);
      btn.addEventListener('click', () => useEmoji(item.emoji));
    } else {
      const short = item.price - profile.points;
      const confirming = pendingBuy === item.emoji;
      btn.textContent = short > 0 ? `Need ${short.toLocaleString()} more` : confirming ? 'Tap again to buy' : 'Buy';
      if (confirming) btn.className = 'confirm';
      btn.setAttribute('aria-label', confirming ? `Confirm: buy ${item.name}` : `Buy ${item.name} for ${item.price} points`);
      btn.disabled = short > 0;
      btn.addEventListener('click', () => buyEmoji(item));
    }
    card.append(em, name, price, btn);
    grid.appendChild(card);
  }
}

function useEmoji(emoji) {
  if (!profile.ownedEmojis.includes(emoji)) return;
  profile.selectedEmoji = emoji;
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

function buyEmoji(item) {
  if (profile.ownedEmojis.includes(item.emoji)) return;        // never charge twice
  if (profile.points < item.price) return;
  if (pendingBuy !== item.emoji) {
    clearPendingBuy();
    pendingBuy = item.emoji;
    pendingBuyTimer = setTimeout(() => { clearPendingBuy(); renderProfile(); }, 5000);
    renderProfile();
    tone(600, 0.08);
    return;
  }
  clearPendingBuy();
  profile.points -= item.price;
  profile.ownedEmojis.push(item.emoji);
  profile.selectedEmoji = item.emoji;
  saveProfile();
  tone(900, 0.16);
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
    emoji: profile.selectedEmoji || DEFAULT_EMOJI, points: profile.points,
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
    return { id, name, emoji, points: Math.min(10_000_000, Math.max(0, Math.floor(Number(data.points)))), updated: new Date().toISOString() };
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

function renderLeaderboard() {
  const box = $('leaderboard');
  const everyone = [
    { id: 'you', name: profile.name || 'You', emoji: profile.selectedEmoji, points: profile.points, isYou: true },
    ...friends,
  ].sort((a, b) => b.points - a.points);
  box.textContent = '';
  const title = document.createElement('h3'); title.textContent = '🏆 Points leaderboard';
  box.appendChild(title);
  if (!friends.length) {
    const empty = document.createElement('p'); empty.className = 'shop-note';
    empty.textContent = 'No friends added yet. Share your code, then paste a friend’s code above.';
    box.appendChild(empty);
  }
  everyone.forEach((person, index) => {
    const row = document.createElement('div'); row.className = 'leader-row';
    const rank = document.createElement('span'); rank.className = 'rank'; rank.textContent = ['🥇', '🥈', '🥉'][index] || '#' + (index + 1);
    const face = document.createElement('span'); face.className = 'face'; face.textContent = person.emoji;
    const details = document.createElement('div'); details.className = 'person';
    const name = document.createElement('strong'); name.textContent = person.name + (person.isYou ? ' (You)' : '');
    const note = document.createElement('small');
    note.textContent = person.isYou ? 'Your current score' : 'Score from their code on ' + new Date(person.updated).toLocaleDateString();
    details.append(name, note);
    const score = document.createElement('span'); score.className = 'score'; score.textContent = person.points.toLocaleString() + ' pts';
    row.append(rank, face, details, score);
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
function makeQuestion(mode, table = 2) {
  if (mode === 'mtc') {
    const a = randBetween(2, 12), b = randBetween(2, 12);
    return { text: `${a} × ${b} = ?`, hint: 'Type your answer, then press Enter', answer: a * b, fact: `${a} × ${b} = ${a * b}` };
  }
  let a = mode === 'table' ? Number(table) : rand(12);
  let b = rand(12);
  const product = a * b;
  const fourChoices = (answer, makeWrong) => {
    const opts = new Set([answer]);
    let guard = 0;
    while (opts.size < 4 && guard++ < 200) { const n = makeWrong(); if (n >= 0) opts.add(n); }
    return shuffle([...opts]);
  };

  if (mode === 'missing') {
    return { text: `? × ${b} = ${product}`, hint: 'Which number belongs in the gap?', answer: a, choices: fourChoices(a, () => rand(12)) };
  }
  if (mode === 'division') {
    return { text: `${product} ÷ ${a} = ?`, hint: 'Division is multiplication in reverse!', answer: b, choices: fourChoices(b, () => rand(12)) };
  }
  if (mode === 'truefalse') {
    const isTrue = Math.random() < 0.5;
    let shown = isTrue ? product : product + (Math.random() < 0.5 ? rand(5) : -rand(5));
    if (shown < 0) shown = product + rand(5);
    return { text: `${a} × ${b} = ${shown}`, hint: 'Is this multiplication fact true or false?', answer: isTrue ? 'True' : 'False', choices: ['True', 'False'] };
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
  };
}

/* ---------- Game flow ---------- */

const game = { mode: 'mix', config: GAMES.mix, qNum: 0, score: 0, streak: 0, locked: true, ended: true, seconds: 0, question: null, typed: '', missed: [] };
const timers = { round: null, question: null, advance: null };

function clearTimers() {
  clearInterval(timers.round); clearInterval(timers.question); clearTimeout(timers.advance);
  timers.round = timers.question = timers.advance = null;
}

function startGame(mode) {
  if (!GAMES[mode]) mode = 'mix';
  clearTimers();
  Object.assign(game, { mode, config: GAMES[mode], qNum: 0, score: 0, streak: 0, locked: false, ended: false, typed: '', missed: [] });
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
  game.question = makeQuestion(game.mode, $('tableSelect').value);
  const q = game.question;

  $('feedback').textContent = '';
  $('nextBtn').hidden = true;
  $('question').textContent = q.text;
  $('questionHint').textContent = q.hint;
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
  if (game.mode === 'mtc') { game.missed.push(game.question.fact); $('typedAnswer').classList.add('wrong'); }
  $('feedback').textContent = `⏰ Time’s up! The answer was ${game.question.answer}.`;
  tone(240, 0.2, 'triangle');
  afterAnswer();
}

function submitAnswer(value, btn) {
  if (game.locked || game.ended) return;
  lockAnswers();
  const correct = String(value) === String(game.question.answer);
  if (correct) {
    game.score++;
    game.streak++;
    profile.points += POINTS_PER_CORRECT;                 // once per question: answers are locked above
    profile.correctTotal++;
    profile.bestStreak = Math.max(profile.bestStreak, game.streak);
    saveProfile();
    $('feedback').textContent = ['🌟 Brilliant!', '🎉 Fantastic!', '🚀 You nailed it!', '🦊 Fox-tastic!'][rand(4) - 1] + ' +10 points';
    tone(880, 0.15); setTimeout(() => tone(1100, 0.12), 100);
  } else {
    game.streak = 0;
    if (btn) btn.classList.add('wrong');
    if (game.mode === 'mtc') game.missed.push(game.question.fact);
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
    timers.advance = setTimeout(nextQuestion, 1500);
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
  const star = awardStarIfEarned();
  $('nextBtn').hidden = true;
  $('restartBtn').hidden = false;
  $('progress').style.width = '100%';
  $('roundLabel').textContent = 'Round finished';
  $('timerLabel').textContent = '';
  const summary = `🏆 Round complete! You got ${game.score} out of ${total}.` + (star ? ' ⭐ You earned a star!' : '');
  if (game.config.typed) {
    setKeypadEnabled(false);
    $('question').textContent = '🏆 Check complete!';
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

function endSpeedRound() {
  if (game.ended) return;
  game.ended = true;
  game.locked = true;
  clearTimers();
  const star = awardStarIfEarned();
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
window.EmiApp = { makeQuestion, decodeFriendCode, makeFriendCode, EMOJI_CATALOG, GAMES };

init();
