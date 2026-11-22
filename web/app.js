// Emi's Learning Platform — game logic. Made by Danny Kehoe.
'use strict';

/* ---------- Settings ---------- */

const PROFILE_KEY = 'emisLearningProfile';
const FRIENDS_KEY = 'emisLearningFriends';
const POINTS_PER_CORRECT = 10;

// Personalised practice (see "Personalised practice" below).
const TRICKY_CHANCE = 0.3;
const TRICKY_MAX = 6;
const PERSONALISED_MODES = new Set(['mix', 'table', 'speed', 'missing', 'truefalse', 'division', 'mtc', 'boss']);   // not Ranked or Friend Challenge: keep them fair

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
  boss:      { title: '👾 Boss Battle',          total: 10, perQuestion: 15, boss: true, auto: true, starAt: 8 },
  daily:     { title: '🏁 Friend Challenge',     total: 10, perQuestion: 20, daily: true, auto: true, starAt: 8 },
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
  { id: 'pet',        icon: '🦊', name: 'Fox Friend',       desc: 'Grow your fox into a Super Fox',       test: (p) => p.petStage >= 3 },
  { id: 'boss',       icon: '⚔️', name: 'Boss Beater',      desc: 'Defeat a weekly boss',                 test: (p) => p.bossesDefeated >= 1 },
  { id: 'chest',      icon: '🧰', name: 'Treasure Hunter',  desc: 'Open a Treasure Chest',                test: (p) => p.chestsOpened >= 1 },
  { id: 'challenge',  icon: '🏁', name: 'Challenger',       desc: 'Play a Friend Challenge',              test: (p) => p.challengesPlayed >= 1 },
  { id: 'fashion',    icon: '👗', name: 'Fashion Fox',      desc: 'Collect 3 fox suits',                  test: (p) => p.ownedSuits.length >= 3 },
  { id: 'mega',       icon: '🎁', name: 'Mega Haul',        desc: 'Open a Weekly Mega Chest',             test: (p) => p.megaChestsOpened >= 1 },
  { id: 'collector',  icon: '🎨', name: 'Collector',        desc: 'Own 10 emojis from the shop',          test: (p) => p.ownedEmojis.length >= 11 },
];
const BADGES_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b]));

// Dates are the player's local calendar day, e.g. "2026-10-24".
const dayString = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dayString(new Date(Date.now()));
// Monday of the current week, e.g. "2026-10-19". Weeks run Monday to Sunday.
const weekStart = () => { const d = new Date(Date.now()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayString(d); };
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
// Ultra Legendary is the top tier, above every price tier (Cheetah and the Emi emoji).
const ULTRA = { id: 'ultra', name: 'Ultra Legendary', minPrice: Infinity };
const RARITIES_BY_ID = Object.fromEntries([...RARITIES, ULTRA].map((r) => [r.id, r]));
// Some items have a fixed rarity; the rest get theirs from the price.
const rarityOf = (item) => (item.rarity ? RARITIES_BY_ID[item.rarity] : rarityFor(item.price));

/* ---------- Ex-event items (now in the shop) ---------- */
// These were 15-Day Reward Event prizes. The event has ended, so they can now be bought.
const EVENT_EMOJIS = [
  { emoji: '🦉', name: 'Owl', rarity: 'epic', price: 11000 }, { emoji: '🦦', name: 'Otter', rarity: 'epic', price: 11500 },
  { emoji: '🐨', name: 'Koala', rarity: 'epic', price: 12000 }, { emoji: '🦔', name: 'Hedgehog', rarity: 'epic', price: 12500 },
  { emoji: '🐧', name: 'Penguin', rarity: 'epic', price: 13000 }, { emoji: '🦝', name: 'Raccoon', rarity: 'epic', price: 13500 },
  { emoji: '🦜', name: 'Parrot', rarity: 'epic', price: 14000 }, { emoji: '🐝', name: 'Bee', rarity: 'epic', price: 14500 },
  { emoji: '🐆', name: 'Cheetah', rarity: 'ultra', price: 25000 },
];
const MYSTERY_POOL = EVENT_EMOJIS.filter((e) => e.rarity !== 'ultra').map((e) => e.emoji);
// The Emi emoji: a girl riding a cheetah. Ultra Legendary, and it must be bought.
// Stored as the two emojis together; drawn stacked (girl on the cheetah's back) by setEmoji().
const EMI_EMOJI = '👧🐆';
const EMI_ITEM = { emoji: EMI_EMOJI, name: 'Emi', rarity: 'ultra', price: 30000 };
const EVENT_BACKGROUNDS = [
  { id: 'savanna', name: 'Savanna', rarity: 'super', price: 6000, css: 'radial-gradient(circle at 75% 25%,#fff3b0 0 9%,transparent 10%),linear-gradient(180deg,#ffd27a,#f4a640 60%,#9c6b2f)' },
  { id: 'goldenhour', name: 'Golden Hour', rarity: 'epic', price: 12000, css: 'radial-gradient(circle at 50% 85%,#fff2a8 0 16%,transparent 17%),linear-gradient(180deg,#ff8a8a,#ffb36b 55%,#ffe39a)' },
  { id: 'rainbowgalaxy', name: 'Rainbow Galaxy', rarity: 'legendary', price: 17500, css: STARS + ',conic-gradient(from 90deg at 50% 50%,#ff83b599,#ffd65a99,#8de4cb99,#8bd5ff99,#b48cff99,#ff83b599),linear-gradient(135deg,#0b0b2e,#3a1c71)' },
];
const BACKGROUNDS_BY_ID = Object.fromEntries([...BACKGROUND_CATALOG, ...EVENT_BACKGROUNDS].map((b) => [b.id, b]));

/* ---------- Fox suits (won in the Fox Fashion Event) ---------- */
// Each suit dresses the pet fox: a background, a hat (on its head) and a prop (beside it).
const FOX_SUITS = [
  { id: 'beach',     name: 'Beach Suit',        icon: '🏖️', hat: '👒', prop: '🏐', rarity: 'rare',      bg: 'linear-gradient(180deg,#8bd5ff 0 52%,#ffe39a 52%)' },
  { id: 'dino',      name: 'Dinosaur Suit',     icon: '🦖', hat: '🦖', prop: '🦴', rarity: 'super',     bg: 'radial-gradient(circle at 30% 30%,#d6f7c4,#3fa66a)' },
  { id: 'astronaut', name: 'Astronaut Suit',    icon: '🚀', hat: '🌟', prop: '🚀', rarity: 'super',     bg: STARS + ',linear-gradient(180deg,#0b1033,#2a1a5e)' },
  { id: 'pirate',    name: 'Pirate Suit',       icon: '🏴‍☠️', hat: '🏴‍☠️', prop: '🦜', rarity: 'epic',  bg: 'linear-gradient(180deg,#a8e4ff,#2f7fc1)' },
  { id: 'wizard',    name: 'Wizard Suit',       icon: '🧙', hat: '🎩', prop: '🪄', rarity: 'epic',      bg: 'radial-gradient(circle,#d9c4ff,#5b2a86)' },
  { id: 'superhero', name: 'Superhero Suit',    icon: '🦸', hat: '⚡', prop: '🛡️', rarity: 'legendary', bg: 'linear-gradient(135deg,#ff6b6b,#4d7cff)' },
  { id: 'dragon',    name: 'Royal Dragon Suit', icon: '🐉', hat: '👑', prop: '🐉', rarity: 'ultra',     bg: 'radial-gradient(circle,#ffe27a,#ff7a3d)' },
];
const SUITS_BY_ID = Object.fromEntries(FOX_SUITS.map((s) => [s.id, s]));

/* ---------- Events ---------- */
// Finish EXERCISES_PER_DAY lessons in a day to unlock that day's reward, then claim it.
// Missing a day just pauses the event.
const EXERCISES_PER_DAY = 2;
const EVENTS = {
  // Ended: any reward unlocked but not claimed is given automatically.
  reward15: {
    key: 'event', name: '15-Day Reward Event', days: 15, ended: true,
    rewards: [
      { type: 'freeze', amount: 1 }, { type: 'points', amount: 100 }, { type: 'mystery' }, { type: 'background', id: 'savanna' },
      { type: 'points', amount: 200 }, { type: 'freeze', amount: 1 }, { type: 'mystery' }, { type: 'points', amount: 300 },
      { type: 'background', id: 'goldenhour' }, { type: 'freeze', amount: 2 }, { type: 'mystery' }, { type: 'points', amount: 500 },
      { type: 'background', id: 'rainbowgalaxy' }, { type: 'points', amount: 1000 }, { type: 'emoji', emoji: '🐆' },
    ],
  },
  // Running now: a fox suit every 3 days, other rewards in between.
  fashion: {
    key: 'fashion', name: 'Fox Fashion Event', days: 20,
    rewards: [
      { type: 'points', amount: 100 }, { type: 'freeze', amount: 1 }, { type: 'suit', id: 'beach' },
      { type: 'points', amount: 150 }, { type: 'chest', amount: 1 }, { type: 'suit', id: 'dino' },
      { type: 'points', amount: 200 }, { type: 'freeze', amount: 1 }, { type: 'suit', id: 'astronaut' },
      { type: 'points', amount: 300 }, { type: 'chest', amount: 1 }, { type: 'suit', id: 'pirate' },
      { type: 'points', amount: 400 }, { type: 'freeze', amount: 2 }, { type: 'suit', id: 'wizard' },
      { type: 'chest', amount: 2 }, { type: 'points', amount: 500 }, { type: 'suit', id: 'superhero' },
      { type: 'points', amount: 1000 }, { type: 'suit', id: 'dragon' },
    ],
  },
};
const ACTIVE_EVENT = EVENTS.fashion;

/* ---------- Daily Treasure Chest ---------- */
// One free chest a day, unlocked by finishing 1 lesson (any game, played to the end).
// Bonus chests from the event can be opened any time.
const CHEST_EMOJIS = [
  { emoji: '🦥', name: 'Sloth' }, { emoji: '🦭', name: 'Seal' }, { emoji: '🐡', name: 'Blowfish' },
  { emoji: '🐞', name: 'Ladybird' }, { emoji: '🦀', name: 'Crab' }, { emoji: '🐌', name: 'Snail' },
].map((e) => ({ ...e, rarity: 'super', price: 0, event: true, source: 'chest' }));
// Weekly Mega Chest: lessons on this many different days (Mon–Sun) unlock it on Sunday.
const MEGA_DAYS_NEEDED = 3;
// Items that can only be won (Treasure Chest), shown in the shop but not for sale.
const SPECIAL_EMOJIS = CHEST_EMOJIS;
// Everything the emoji shop sells, cheapest first.
const SHOP_EMOJIS = [...EMOJI_CATALOG, ...EVENT_EMOJIS, EMI_ITEM].sort((a, b) => a.price - b.price);
const SHOP_BACKGROUNDS = [...BACKGROUND_CATALOG, ...EVENT_BACKGROUNDS].sort((a, b) => a.price - b.price);

// Pet fox: grows as the player gets answers right. It is never sad.
const PET_STAGES = [
  { min: 0,    name: 'Baby Fox',      size: 2.4, accessory: '' },
  { min: 25,   name: 'Little Fox',    size: 2.9, accessory: '🎀' },
  { min: 100,  name: 'Clever Fox',    size: 3.4, accessory: '🎓' },
  { min: 250,  name: 'Super Fox',     size: 3.8, accessory: '⭐' },
  { min: 500,  name: 'Royal Fox',     size: 4.2, accessory: '👑' },
  { min: 1000, name: 'Legendary Fox', size: 4.6, accessory: '✨' },
];
function petStageFor(correctTotal) { let i = 0; PET_STAGES.forEach((s, n) => { if (correctTotal >= s.min) i = n; }); return i; }

// Weekly Boss Battle: a new boss every Monday.
const BOSS_HP = 300;
const BOSS_HIT = 10;
const BOSS_CRITICAL = 15;          // for answers within 3 seconds
const BOSS_REWARD = 300;
const BOSSES = [
  { name: 'Glitch Gremlin', face: '👾' }, { name: 'Kraken King', face: '🐙' }, { name: 'T-Rex Titan', face: '🦖' },
  { name: 'Ghostly Gus', face: '👻' }, { name: 'Robo Rumble', face: '🤖' }, { name: 'Dragon Lord', face: '🐉' },
];

/* ---------- Helpers ---------- */

const $ = (id) => document.getElementById(id);

// Puts an emoji into an element. The Emi emoji is drawn as a girl sitting on a cheetah's back.
function setEmoji(el, value) {
  el.textContent = '';
  const isEmi = value === EMI_EMOJI;
  el.classList.toggle('emi-combo', isEmi);
  if (!isEmi) { el.textContent = value; return; }
  const cheetah = document.createElement('span'); cheetah.className = 'emi-cheetah'; cheetah.textContent = '🐆';
  const girl = document.createElement('span'); girl.className = 'emi-girl'; girl.textContent = '👧';
  const wrap = document.createElement('span'); wrap.className = 'emi-wrap'; wrap.setAttribute('role', 'img'); wrap.setAttribute('aria-label', 'Emi riding a cheetah');
  wrap.append(cheetah, girl);
  el.appendChild(wrap);
}
// All question randomness goes through rng(), so the Friend Challenge can swap in a
// "seeded" generator that gives everyone the same questions on the same day.
let rng = Math.random;
function withRng(generator, fn) { const old = rng; rng = generator; try { return fn(); } finally { rng = old; } }
// Small seeded random generator (mulberry32): same seed → same numbers.
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hashText = (text) => { let h = 2166136261; for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
const rand = (n) => Math.floor(rng() * n) + 1;            // 1..n
const randBetween = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
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
  const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
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
    streakFreezes: Math.min(99, num(saved.streakFreezes)),
    event: sanitizeEvent(saved.event, EVENTS.reward15.days),     // the ended 15-Day Reward Event
    fashion: sanitizeEvent(saved.fashion, EVENTS.fashion.days),  // the Fox Fashion Event
    petName: typeof saved.petName === 'string' && saved.petName.trim() ? saved.petName.trim().slice(0, 16) : 'Foxy',
    petStage: saved.petStage === undefined ? petStageFor(num(saved.correctTotal)) : Math.min(PET_STAGES.length - 1, num(saved.petStage)),
    ownedSuits: Array.isArray(saved.ownedSuits) ? [...new Set(saved.ownedSuits.filter((id) => SUITS_BY_ID[id]))] : [],
    petSuit: SUITS_BY_ID[saved.petSuit] && Array.isArray(saved.ownedSuits) && saved.ownedSuits.includes(saved.petSuit) ? saved.petSuit : null,
    // Lessons finished today (any game played to the end): unlocks the daily chest.
    lessonsDay: isDay(saved.lessonsDay) ? saved.lessonsDay : null,
    lessons: Math.min(999, num(saved.lessons)),
    chestOpenedDay: isDay(saved.chestOpenedDay) ? saved.chestOpenedDay : null,
    bonusChests: Math.min(99, num(saved.bonusChests)),
    weekLessons: {
      week: isDay(saved.weekLessons && saved.weekLessons.week) ? saved.weekLessons.week : null,
      days: Array.isArray(saved.weekLessons && saved.weekLessons.days) ? [...new Set(saved.weekLessons.days.filter(isDay))].slice(0, 7) : [],
    },
    megaOpenedWeek: isDay(saved.megaOpenedWeek) ? saved.megaOpenedWeek : null,
    megaPendingWeek: isDay(saved.megaPendingWeek) ? saved.megaPendingWeek : null,
    megaChestsOpened: num(saved.megaChestsOpened),
    // Online friends: whether this player joined, and their anonymous sign-in (kept on this device).
    online: {
      joined: !!(saved.online && saved.online.joined === true),
      uid: saved.online && typeof saved.online.uid === 'string' && /^[a-zA-Z0-9]{1,128}$/.test(saved.online.uid) ? saved.online.uid : null,
      refreshToken: saved.online && typeof saved.online.refreshToken === 'string' ? saved.online.refreshToken.slice(0, 2000) : null,
    },
    chestsOpened: num(saved.chestsOpened),
    boss: {
      week: isDay(saved.boss && saved.boss.week) ? saved.boss.week : null,
      hp: saved.boss && Number.isFinite(Number(saved.boss.hp)) ? Math.min(BOSS_HP, num(saved.boss.hp)) : BOSS_HP,
      defeated: !!(saved.boss && saved.boss.defeated === true),
    },
    bossesDefeated: num(saved.bossesDefeated),
    challenge: isDay(saved.challenge && saved.challenge.day)
      ? { day: saved.challenge.day, score: Math.min(10, num(saved.challenge.score)), time: Math.min(9999, Math.max(0, Number(saved.challenge.time) || 0)) }
      : null,
    challengesPlayed: num(saved.challengesPlayed),
  };
  return profile;
}

// Event progress: rewards claimed, rewards earned but not yet claimed, and today's exercises.
function sanitizeEvent(e, days) {
  if (!e || typeof e !== 'object') e = {};
  const num = (v) => Math.max(0, Math.floor(Number(v)) || 0);
  const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const claimed = Math.min(days, num(e.claimed));
  const won = {};
  for (const [day, emoji] of Object.entries(e.won && typeof e.won === 'object' ? e.won : {})) {
    if (Number(day) >= 1 && Number(day) <= claimed && MYSTERY_POOL.includes(emoji)) won[day] = emoji;
  }
  return {
    claimed,
    unclaimed: Math.min(days - claimed, num(e.unclaimed)),
    lastEarnedDay: isDay(e.lastEarnedDay) ? e.lastEarnedDay : null,
    roundsDay: isDay(e.roundsDay) ? e.roundsDay : null,
    rounds: Math.min(99, num(e.rounds)),
    won,
  };
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
    // Friend Challenge: their first-try score on that day (score out of 10, total seconds).
    chDay: typeof f.chDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f.chDay) ? f.chDay : null,
    chScore: Math.min(10, Math.max(0, Math.floor(Number(f.chScore)) || 0)),
    chTime: Math.min(9999, Math.max(0, Number(f.chTime) || 0)),
    points: Math.min(10_000_000, Math.max(0, Math.floor(Number(f.points)))),
    updated: Number.isNaN(Date.parse(f.updated)) ? new Date().toISOString() : f.updated,
    // Online friends update by themselves; 'gone' means they left online friends.
    uid: typeof f.uid === 'string' && /^[a-zA-Z0-9]{1,128}$/.test(f.uid) ? f.uid : null,
    online: f.online === true,
    gone: f.gone === true,
  };
}
const sanitizeFriends = (list) => (Array.isArray(list) ? list.map(sanitizeFriend).filter(Boolean) : []);

let profile = loadProfile();
let friends = sanitizeFriends(storage.read(FRIENDS_KEY, []));

function saveProfile() {
  checkPetGrowth();
  checkBadges();
  storage.write(PROFILE_KEY, profile);
  renderAll();
  schedulePush();                        // online friends see the change (if joined)
}

function renderAll() {
  renderProfile();
  renderStats();
  renderLeaderboard();
  renderEvent();
  renderChest();
  renderMegaChest();
  renderOnline();
  renderPet();
  renderBossCard();
  renderDailyCard();
  renderChallengeBoard();
}

function saveFriends() {
  storage.write(FRIENDS_KEY, friends);
  renderLeaderboard();
  renderChallengeBoard();
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

// Whole days between two "YYYY-MM-DD" dates (local calendar days).
function daysBetween(from, to) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

// Streak freezes: each one covers one missed day. If there are enough freezes for
// every missed day, they are used up and the streak carries on. Returns true if used.
function applyStreakFreezes() {
  if (!profile.lastPlayDay || profile.dailyStreak === 0) return false;
  const missed = daysBetween(profile.lastPlayDay, today()) - 1;
  if (missed <= 0 || missed > profile.streakFreezes) return false;
  profile.streakFreezes -= missed;
  profile.lastPlayDay = yesterday();   // the streak is safe: as if they played yesterday
  celebrate(`❄️ ${missed === 1 ? 'A streak freeze' : missed + ' streak freezes'} saved your ${profile.dailyStreak}-day streak!`, { confetti: false });
  return true;
}

// Called on the first correct answer each day. Does not save; the caller does.
function registerPractice() {
  const day = today();
  if (profile.lastPlayDay === day) return;
  applyStreakFreezes();
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

/* ---------- Events ---------- */

const evState = (ev) => profile[ev.key];
const eventComplete = (ev = ACTIVE_EVENT) => evState(ev).claimed >= ev.days;
const roundsToday = () => (evState(ACTIVE_EVENT).roundsDay === today() ? evState(ACTIVE_EVENT).rounds : 0);
const lessonsToday = () => (profile.lessonsDay === today() ? profile.lessons : 0);

// Called whenever a lesson is finished (all questions, or the full Speed Round).
function recordExercise() {
  const day = today();
  if (profile.lessonsDay !== day) { profile.lessonsDay = day; profile.lessons = 0; }
  profile.lessons++;
  markWeekLesson();                     // counts towards this week's Mega Chest
  if (profile.lessons === 1 && profile.chestOpenedDay !== day) {
    celebrate('🧰 Your daily Treasure Chest is ready! Open it in the Event tab.');
  }
  const ev = evState(ACTIVE_EVENT);
  if (ev.roundsDay !== day) { ev.roundsDay = day; ev.rounds = 0; }
  ev.rounds++;
  const canEarn = ev.lastEarnedDay !== day && ev.claimed + ev.unclaimed < ACTIVE_EVENT.days;
  if (canEarn && ev.rounds >= EXERCISES_PER_DAY) {
    ev.unclaimed++;
    ev.lastEarnedDay = day;
    celebrate(`🎁 Day ${ev.claimed + ev.unclaimed} reward unlocked! Claim it in the Event tab.`);
  } else if (canEarn) {
    const left = EXERCISES_PER_DAY - ev.rounds;
    celebrate(`${left} more lesson${left === 1 ? '' : 's'} today to unlock your event reward!`, { confetti: false });
  }
  saveProfile();
}

// What a reward looks like on an event track.
function describeReward(ev, day) {
  const r = ev.rewards[day - 1];
  if (r.type === 'freeze') return { icon: '❄️', text: r.amount === 1 ? 'Streak freeze' : `${r.amount} streak freezes` };
  if (r.type === 'points') return { icon: '🪙', text: `${r.amount} points` };
  if (r.type === 'chest') return { icon: '🧰', text: r.amount === 1 ? 'Bonus chest' : `${r.amount} bonus chests` };
  if (r.type === 'suit') { const s = SUITS_BY_ID[r.id]; return { icon: s.icon, text: s.name, rarity: s.rarity, tag: '🦊 Fox suit' }; }
  if (r.type === 'mystery') {
    const won = evState(ev).won[day];
    const item = won && EVENT_EMOJIS.find((e) => e.emoji === won);
    return item ? { icon: item.emoji, text: item.name, rarity: 'epic' } : { icon: '🎁', text: 'Mystery emoji', rarity: 'epic' };
  }
  if (r.type === 'background') { const bg = BACKGROUNDS_BY_ID[r.id]; return { bg: bg.css, text: bg.name, rarity: bg.rarity }; }
  return { icon: r.emoji, text: EVENT_EMOJIS.find((e) => e.emoji === r.emoji).name, rarity: 'ultra' };
}

// Gives a reward. Returns a short message and what the prize screen should show.
function grantReward(ev, day) {
  const r = ev.rewards[day - 1];
  if (r.type === 'freeze') {
    profile.streakFreezes += r.amount;
    return { message: `❄️ ${r.amount === 1 ? 'A streak freeze' : r.amount + ' streak freezes'}!`,
      reveal: { icon: '❄️', name: r.amount === 1 ? 'Streak freeze' : `${r.amount} streak freezes`, note: 'If you miss a day, a freeze keeps your streak safe.' } };
  }
  if (r.type === 'points') {
    profile.points += r.amount;
    return { message: `🪙 +${r.amount} points!`, reveal: { icon: '🪙', name: `${r.amount} points` } };
  }
  if (r.type === 'chest') {
    profile.bonusChests += r.amount;
    return { message: `🧰 ${r.amount === 1 ? 'A bonus chest' : r.amount + ' bonus chests'}!`,
      reveal: { icon: '🧰', name: r.amount === 1 ? 'Bonus chest' : `${r.amount} bonus chests`, note: 'Open it in the Treasure Chest below, any time you like!' } };
  }
  if (r.type === 'suit') {
    const s = SUITS_BY_ID[r.id];
    if (!profile.ownedSuits.includes(s.id)) profile.ownedSuits.push(s.id);
    profile.petSuit = s.id;                       // dress the fox in it straight away
    return { message: `🦊 ${profile.petName} got the ${s.name}!`,
      reveal: { suit: s, name: s.name, rarity: s.rarity, note: `${profile.petName} is wearing it now! Change suits on the Play tab.` } };
  }
  if (r.type === 'mystery') {
    const choices = MYSTERY_POOL.filter((e) => !profile.ownedEmojis.includes(e));
    if (!choices.length) { profile.points += 500; return { message: '🎁 +500 points!', reveal: { icon: '🪙', name: '500 points' } }; }
    const emoji = choices[Math.floor(Math.random() * choices.length)];
    profile.ownedEmojis.push(emoji);
    evState(ev).won[day] = emoji;
    const item = EVENT_EMOJIS.find((e) => e.emoji === emoji);
    return { message: `🎁 ${emoji} ${item.name}!`, reveal: { emoji, name: item.name, rarity: 'epic' } };
  }
  if (r.type === 'background') {
    const bg = BACKGROUNDS_BY_ID[r.id];
    if (!profile.ownedBackgrounds.includes(r.id)) profile.ownedBackgrounds.push(r.id);
    return { message: `🖼️ ${bg.name} background!`, reveal: { bg: bg.css, name: `${bg.name} background`, rarity: bg.rarity } };
  }
  if (!profile.ownedEmojis.includes(r.emoji)) profile.ownedEmojis.push(r.emoji);
  return { message: `${r.emoji} Ultra Legendary!`, reveal: { emoji: r.emoji, name: 'Cheetah', rarity: 'ultra' } };
}

function claimEventReward() {
  const ev = ACTIVE_EVENT;
  const st = evState(ev);
  if (st.unclaimed <= 0 || eventComplete(ev)) return;
  const day = st.claimed + 1;
  const { reveal } = grantReward(ev, day);
  st.claimed++;
  st.unclaimed--;
  endTryOn();
  saveProfile();
  tone(1100, 0.15); setTimeout(() => tone(1400, 0.2), 120);
  burstConfetti();
  if (day === ev.days) burstConfetti();         // extra confetti for the last day
  showReveal({ ...reveal, title: day === ev.days ? `🎉 Day ${day}: the grand prize!` : `🎁 Day ${day} reward` });
}

// When an event ends, any reward that was unlocked but not claimed is given automatically.
function finishEndedEvents() {
  let given = 0;
  for (const ev of Object.values(EVENTS)) {
    if (!ev.ended) continue;
    const st = evState(ev);
    while (st.unclaimed > 0 && st.claimed < ev.days) {
      grantReward(ev, st.claimed + 1);
      st.claimed++;
      st.unclaimed--;
      given++;
    }
  }
  if (given) celebrate(`The 15-Day Reward Event has ended. We gave you your ${given === 1 ? 'last unclaimed reward' : given + ' unclaimed rewards'}!`);
  return given > 0;
}

function renderEvent() {
  const ev = ACTIVE_EVENT;
  const st = evState(ev);
  const done = roundsToday();
  const status = $('eventStatus');
  const claimBtn = $('claimEventBtn');
  claimBtn.hidden = st.unclaimed <= 0;
  claimBtn.textContent = `🎁 Claim Day ${st.claimed + 1} reward`;
  if (eventComplete(ev)) {
    status.textContent = `🎉 Event complete! You collected all ${ev.days} rewards, including the Royal Dragon Suit.`;
  } else if (st.unclaimed > 0) {
    status.textContent = `Your Day ${st.claimed + 1} reward is ready!`;
  } else if (st.lastEarnedDay === today()) {
    status.textContent = `✅ Today’s reward is done. Come back tomorrow for Day ${st.claimed + 1}!`;
  } else {
    status.textContent = `Finish ${EXERCISES_PER_DAY} lessons today (any game, all the way to the end) to unlock Day ${st.claimed + 1}: ${done} of ${EXERCISES_PER_DAY} done.`;
  }
  $('eventPips').textContent = eventComplete(ev) || st.lastEarnedDay === today() ? '✅✅'
    : '✅'.repeat(Math.min(done, EXERCISES_PER_DAY)) + '⬜'.repeat(Math.max(0, EXERCISES_PER_DAY - done));
  $('eventFreezes').textContent = `❄️ Streak freezes: ${profile.streakFreezes} · 🦊 Fox suits: ${profile.ownedSuits.length} of ${FOX_SUITS.length}`;

  const track = $('eventTrack');
  track.textContent = '';
  for (let day = 1; day <= ev.days; day++) {
    const d = describeReward(ev, day);
    const state = day <= st.claimed ? 'claimed' : day <= st.claimed + st.unclaimed ? 'ready' : day === st.claimed + 1 ? 'next' : 'locked';
    const tile = document.createElement('div');
    tile.className = `event-day ${state}` + (day === ev.days ? ' finale' : '') + (d.tag ? ' suit-day' : '');
    tile.setAttribute('aria-label', `Day ${day}: ${d.text}. ${{ claimed: 'Claimed', ready: 'Ready to claim', next: 'Next reward', locked: 'Locked' }[state]}`);
    const label = document.createElement('small'); label.textContent = 'Day ' + day;
    const icon = document.createElement('span'); icon.className = 'event-icon';
    if (d.bg) { icon.classList.add('event-swatch'); icon.style.background = d.bg; } else icon.textContent = d.icon;
    const text = document.createElement('strong'); text.textContent = d.text;
    tile.append(label, icon, text);
    if (d.tag) { const tag = document.createElement('small'); tag.className = 'event-tag'; tag.textContent = d.tag; tile.appendChild(tag); }
    if (d.rarity) { const chip = document.createElement('span'); chip.className = `rarity-chip ${d.rarity}`; chip.textContent = RARITIES_BY_ID[d.rarity].name; tile.appendChild(chip); }
    if (state === 'claimed') { const tick = document.createElement('span'); tick.className = 'event-tick'; tick.textContent = '✓'; tile.appendChild(tick); }
    track.appendChild(tile);
  }
  updateTabDots();
}

/* ---------- Prize screen ("You got…") ---------- */

let revealUse = null;

// The picture for one prize: an emoji, an icon, a background swatch or a suited fox.
function fillPrizeVisual(visual, prize, foxSize) {
  if (prize.suit) visual.appendChild(foxFigure(prize.suit, foxSize));
  else if (prize.bg) { visual.classList.add('reveal-swatch'); visual.style.background = prize.bg; setEmoji(visual, profile.selectedEmoji); }
  else if (prize.emoji) setEmoji(visual, prize.emoji);
  else visual.textContent = prize.icon;
}

// Shows prizes big in the middle of the screen.
// prize: { emoji | icon | bg | suit, name, rarity, note, title, useLabel, onUse }
// or several at once: { title, items: [{ emoji | icon | bg, name, rarity }, …] } — they pop in one by one.
function showReveal(prize) {
  const visual = $('revealVisual');
  visual.textContent = '';
  visual.className = 'reveal-visual';
  visual.removeAttribute('style');
  const many = Array.isArray(prize.items);
  if (many) {
    visual.classList.add('reveal-many');
    prize.items.forEach((item, i) => {
      const tile = document.createElement('div');
      tile.className = 'reveal-item' + (item.rarity ? ` rarity-${item.rarity}` : '');
      tile.style.animationDelay = i * 0.35 + 's';
      const pic = document.createElement('div'); pic.className = 'reveal-item-pic';
      fillPrizeVisual(pic, item, 3);
      const name = document.createElement('strong'); name.textContent = item.name;
      tile.append(pic, name);
      if (item.rarity) { const c = document.createElement('span'); c.className = `rarity-chip ${item.rarity}`; c.textContent = RARITIES_BY_ID[item.rarity].name; tile.appendChild(c); }
      visual.appendChild(tile);
    });
  } else {
    fillPrizeVisual(visual, prize, 7);
  }
  $('revealTitle').textContent = prize.title || 'You got…';
  $('revealName').textContent = many ? '' : prize.name;
  $('revealName').hidden = many;
  const chip = $('revealRarity');
  chip.hidden = many || !prize.rarity;
  if (!many && prize.rarity) { chip.className = `rarity-chip ${prize.rarity}`; chip.textContent = RARITIES_BY_ID[prize.rarity].name; }
  $('revealNote').textContent = prize.note || '';
  revealUse = prize.onUse || null;
  $('revealUseBtn').hidden = !revealUse;
  $('revealUseBtn').textContent = prize.useLabel || 'Use it now';
  $('prizeReveal').hidden = false;
  $('revealCloseBtn').focus({ preventScroll: true });
}

function closeReveal() {
  $('prizeReveal').hidden = true;
  revealUse = null;
}

function useRevealedPrize() {
  if (revealUse) revealUse();
  closeReveal();
}

/* ---------- Tabs: Play · Shop · Friends · Event ---------- */

const PAGES = ['play', 'shop', 'friends', 'event'];

function showPage(name) {
  if (!PAGES.includes(name)) name = 'play';
  // Leaving the Play page stops any game, so no timers keep running out of sight.
  if (name !== 'play' && $('playArea').classList.contains('active')) closeGame();
  for (const p of PAGES) {
    $('page-' + p).hidden = p !== name;
    const tab = $('tab-' + p);
    tab.setAttribute('aria-selected', String(p === name));
    tab.tabIndex = p === name ? 0 : -1;
  }
  window.scrollTo({ top: 0 });
  if (name === 'friends') refreshOnlineFriends().catch(() => {});   // online friends update when you look
}

// The dot on the Event tab shows when a reward or the chest is waiting.
function updateTabDots() {
  $('eventDot').hidden = !(evState(ACTIVE_EVENT).unclaimed > 0 || chestReady() || !!megaReadyWeek());
}

/* ---------- Daily Treasure Chest ---------- */

const dailyChestReady = () => lessonsToday() >= 1 && profile.chestOpenedDay !== today();
const chestReady = () => dailyChestReady() || profile.bonusChests > 0;

// Every prize is good and never a duplicate emoji.
function rollChestPrize() {
  const unowned = CHEST_EMOJIS.filter((e) => !profile.ownedEmojis.includes(e.emoji));
  const roll = Math.random();
  if (unowned.length && roll < 0.3) return { type: 'emoji', item: unowned[Math.floor(Math.random() * unowned.length)] };
  if (roll < 0.85) return { type: 'points', amount: 100 + 25 * Math.floor(Math.random() * 7) };   // 100–250
  return { type: 'freeze' };
}

let chestOpening = false;
function openChest() {
  if (!chestReady() || chestOpening) return;
  chestOpening = true;
  const usingDaily = dailyChestReady();
  $('openChestBtn').disabled = true;
  $('chestIcon').classList.add('opening');
  tone(520, 0.12); setTimeout(() => tone(660, 0.12), 250); setTimeout(() => tone(820, 0.12), 500);
  setTimeout(() => {
    const prize = rollChestPrize();
    let reveal;
    if (prize.type === 'emoji') {
      const emoji = prize.item.emoji;
      profile.ownedEmojis.push(emoji);
      reveal = { emoji, name: prize.item.name, rarity: 'super', note: 'A chest-only emoji! You can’t buy this one.',
        useLabel: `Use ${emoji} now`, onUse: () => { profile.selectedEmoji = emoji; saveProfile(); } };
    } else if (prize.type === 'points') {
      profile.points += prize.amount;
      reveal = { icon: '🪙', name: `${prize.amount} points` };
    } else {
      profile.streakFreezes += 1;
      reveal = { icon: '❄️', name: 'Streak freeze', note: 'If you miss a day, it keeps your streak safe.' };
    }
    if (usingDaily) profile.chestOpenedDay = today(); else profile.bonusChests--;
    profile.chestsOpened++;
    chestOpening = false;
    $('chestIcon').classList.remove('opening');
    $('openChestBtn').disabled = false;
    saveProfile();
    burstConfetti();
    tone(1180, 0.2);
    showReveal({ ...reveal, title: '🧰 You opened the chest and got…' });
  }, 900);
}

function renderChest() {
  const n = profile.bonusChests;
  const bonusText = n ? ` You also have ${n} bonus chest${n === 1 ? '' : 's'} from the event.` : '';
  $('openChestBtn').hidden = !chestReady();
  $('openChestBtn').textContent = dailyChestReady() ? '🧰 Open today’s chest!' : `🧰 Open a bonus chest (${n} left)`;
  $('chestIcon').classList.toggle('ready', chestReady());
  $('chestStatus').textContent = (dailyChestReady() ? '🎉 You finished a lesson today. Open your chest!'
    : profile.chestOpenedDay === today() ? '✅ You opened today’s chest! Come back tomorrow for another.'
    : 'Finish 1 lesson today (any game, played to the end) to unlock today’s chest.') + bonusText;
  const owned = CHEST_EMOJIS.filter((e) => profile.ownedEmojis.includes(e.emoji)).length;
  $('chestPrizes').textContent = `Possible prizes: 🪙 100–250 points · ❄️ a streak freeze · a chest-only emoji ${CHEST_EMOJIS.map((e) => e.emoji).join(' ')} (you have ${owned} of ${CHEST_EMOJIS.length}). One free chest a day. Chests can’t be bought.`;
  updateTabDots();
}

/* ---------- Weekly Mega Chest ---------- */
// Finish lessons on MEGA_DAYS_NEEDED different days in a week (Monday–Sunday) and a
// Mega Chest opens on Sunday. If Sunday is missed, it waits during the next week.
// It holds 5 prizes and always includes at least one new emoji.

const isSunday = () => new Date(Date.now()).getDay() === 0;

// A new week: remember if last week earned a chest that wasn't opened.
function syncWeekLessons() {
  const week = weekStart();
  const wl = profile.weekLessons;
  if (wl.week === week) return;
  if (wl.week && wl.days.length >= MEGA_DAYS_NEEDED && profile.megaOpenedWeek !== wl.week) profile.megaPendingWeek = wl.week;
  profile.weekLessons = { week, days: [] };
}

function markWeekLesson() {
  syncWeekLessons();
  const day = today();
  if (!profile.weekLessons.days.includes(day)) profile.weekLessons.days.push(day);
}

// The week whose Mega Chest can be opened now, or null.
function megaReadyWeek() {
  syncWeekLessons();
  if (profile.megaPendingWeek && profile.megaPendingWeek !== profile.megaOpenedWeek) return profile.megaPendingWeek;
  const wl = profile.weekLessons;
  return isSunday() && wl.days.length >= MEGA_DAYS_NEEDED && profile.megaOpenedWeek !== wl.week ? wl.week : null;
}

// Five prizes; the first is always an emoji the player doesn't have yet. No duplicates.
function rollMegaChest() {
  const ownedEmojis = new Set(profile.ownedEmojis);
  const ownedBgs = new Set(profile.ownedBackgrounds);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const newEmoji = () => {
    const chestOnly = CHEST_EMOJIS.filter((e) => !ownedEmojis.has(e.emoji));
    const shop = SHOP_EMOJIS.filter((e) => e.price < 16000 && !ownedEmojis.has(e.emoji));   // up to Epic
    const pool = chestOnly.length ? chestOnly : shop;
    if (!pool.length) return null;
    const e = pick(pool); ownedEmojis.add(e.emoji); return e;
  };
  const points = () => ({ type: 'points', amount: 150 + 50 * Math.floor(Math.random() * 6) });   // 150–400
  const first = newEmoji();
  const items = [first ? { type: 'emoji', item: first } : { type: 'points', amount: 1000 }];
  let freezes = 0, chests = 0;
  while (items.length < 5) {
    const r = Math.random();
    if (r < 0.45) items.push(points());
    else if (r < 0.6 && !freezes) { items.push({ type: 'freeze' }); freezes++; }
    else if (r < 0.75 && !chests) { items.push({ type: 'chest' }); chests++; }
    else if (r < 0.9) {
      const bgs = SHOP_BACKGROUNDS.filter((b) => b.price > 0 && b.price <= 12000 && !ownedBgs.has(b.id));
      if (bgs.length) { const b = pick(bgs); ownedBgs.add(b.id); items.push({ type: 'background', item: b }); } else items.push(points());
    } else {
      const e = newEmoji();
      items.push(e ? { type: 'emoji', item: e } : points());
    }
  }
  return items;
}

let megaOpening = false;
function openMegaChest() {
  const week = megaReadyWeek();
  if (!week || megaOpening) return;
  megaOpening = true;
  $('openMegaBtn').disabled = true;
  $('megaIcon').classList.add('opening');
  tone(440, 0.12); setTimeout(() => tone(554, 0.12), 220); setTimeout(() => tone(659, 0.12), 440); setTimeout(() => tone(880, 0.2), 660);
  setTimeout(() => {
    const items = rollMegaChest();
    const shown = items.map((p) => {
      if (p.type === 'emoji') { profile.ownedEmojis.push(p.item.emoji); return { emoji: p.item.emoji, name: p.item.name, rarity: rarityOf(p.item).id }; }
      if (p.type === 'points') { profile.points += p.amount; return { icon: '🪙', name: `${p.amount} points` }; }
      if (p.type === 'freeze') { profile.streakFreezes++; return { icon: '❄️', name: 'Streak freeze' }; }
      if (p.type === 'chest') { profile.bonusChests++; return { icon: '🧰', name: 'Bonus chest' }; }
      profile.ownedBackgrounds.push(p.item.id);
      return { bg: p.item.css, name: `${p.item.name} background`, rarity: rarityOf(p.item).id };
    });
    profile.megaOpenedWeek = week;
    if (profile.megaPendingWeek === week) profile.megaPendingWeek = null;
    profile.megaChestsOpened++;
    megaOpening = false;
    $('megaIcon').classList.remove('opening');
    $('openMegaBtn').disabled = false;
    saveProfile();
    burstConfetti(); burstConfetti();
    const firstEmoji = items[0].type === 'emoji' ? items[0].item.emoji : null;
    showReveal({
      title: '🎁 Mega Chest! You got 5 prizes:', items: shown,
      ...(firstEmoji ? { useLabel: `Use ${firstEmoji === EMI_EMOJI ? 'Emi' : firstEmoji} now`, onUse: () => { profile.selectedEmoji = firstEmoji; saveProfile(); } } : {}),
    });
  }, 1200);
}

function renderMegaChest() {
  const ready = megaReadyWeek();
  const wl = profile.weekLessons;
  const n = wl.days.length;
  $('openMegaBtn').hidden = !ready;
  $('megaIcon').classList.toggle('ready', !!ready);
  $('megaStatus').textContent = ready
    ? (ready === wl.week ? '🎉 It’s Sunday and you practised on 3 days this week. Open your Mega Chest!' : '🎉 You earned a Mega Chest last week. Open it!')
    : profile.megaOpenedWeek === wl.week ? '✅ You opened this week’s Mega Chest! A new week starts on Monday.'
    : n >= MEGA_DAYS_NEEDED ? '⭐ You practised on 3 days this week. Your Mega Chest opens on Sunday!'
    : `Finish lessons on ${MEGA_DAYS_NEEDED - n} more day${MEGA_DAYS_NEEDED - n === 1 ? '' : 's'} this week (${n} of ${MEGA_DAYS_NEEDED}). The Mega Chest opens on Sunday!`;
  const days = $('megaDays');
  days.textContent = '';
  const [y, m, d] = wl.week.split('-').map(Number);
  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((letter, i) => {
    const date = dayString(new Date(y, m - 1, d + i));
    const pip = document.createElement('span');
    pip.className = 'chest-day' + (wl.days.includes(date) ? ' done' : '') + (date === today() ? ' today' : '') + (i === 6 ? ' sunday' : '');
    pip.textContent = wl.days.includes(date) ? '✓' : letter;
    days.appendChild(pip);
  });
}

/* ---------- Pet fox ---------- */

const PET_CHEERS = ['loves maths time with you!', 'is doing a happy dance!', 'thinks you are brilliant!', 'wants to practise the 7s!', 'gave you a high five! ✋'];

function checkPetGrowth() {
  const stage = petStageFor(profile.correctTotal);
  if (stage > profile.petStage) {
    profile.petStage = stage;
    celebrate(`🦊 ${profile.petName} grew into a ${PET_STAGES[stage].name}!`);
  }
}

// A picture of the happy fox wearing a suit (or no suit), sized in rem.
function foxFigure(suit, size) {
  const fig = document.createElement('span');
  fig.className = 'fox-figure';
  fig.style.fontSize = size / 4.6 + 'rem';        // hat and prop scale with the fox
  if (suit) fig.style.background = suit.bg;
  const fox = document.createElement('span'); fox.className = 'fox-body'; fox.textContent = '🦊'; fox.style.fontSize = size + 'rem';
  const hat = document.createElement('span'); hat.className = 'fox-hat'; hat.textContent = suit ? suit.hat : '';
  const prop = document.createElement('span'); prop.className = 'fox-prop'; prop.textContent = suit ? suit.prop : '';
  fig.append(fox, hat, prop);
  return fig;
}

function renderPet(mood) {
  const stage = PET_STAGES[profile.petStage];
  const next = PET_STAGES[profile.petStage + 1];
  const suit = SUITS_BY_ID[profile.petSuit];
  $('petBody').style.fontSize = stage.size + 'rem';     // the fox emoji grows with each stage
  $('petAccessory').textContent = suit ? suit.hat : stage.accessory;
  $('petProp').textContent = suit ? suit.prop : '';
  $('petBtn').style.background = suit ? suit.bg : '';
  $('petBtn').classList.toggle('legendary', profile.petStage === PET_STAGES.length - 1);
  $('petTitle').textContent = `${profile.petName} the ${stage.name}` + (suit ? ` (${suit.name})` : '');
  renderWardrobe();
  $('petMood').textContent = mood || (profile.lastPlayDay === today()
    ? `😊 ${profile.petName} is so happy you practised today!`
    : `🦊 ${profile.petName} can’t wait to practise with you today!`);
  if (next) {
    const pct = ((profile.correctTotal - stage.min) / (next.min - stage.min)) * 100;
    $('petProgress').style.width = Math.max(0, Math.min(100, pct)) + '%';
    const left = next.min - profile.correctTotal;
    $('petNext').textContent = `${left} more right answer${left === 1 ? '' : 's'} until ${profile.petName} grows into a ${next.name}!`;
  } else {
    $('petProgress').style.width = '100%';
    $('petNext').textContent = `${profile.petName} is fully grown: a Legendary Fox! ✨`;
  }
  if (document.activeElement !== $('petNameInput')) $('petNameInput').value = profile.petName;
}

// Suit buttons under the pet: "No suit" plus every suit (locked ones are won in the event).
function renderWardrobe() {
  const box = $('wardrobe');
  box.textContent = '';
  const make = (suit) => {
    const owned = !suit || profile.ownedSuits.includes(suit.id);
    const on = (suit ? suit.id : null) === profile.petSuit;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suit-btn' + (on ? ' on' : '') + (owned ? '' : ' locked');
    btn.textContent = suit ? (owned ? `${suit.icon} ${suit.name}` : `🔒 ${suit.name}`) : '🦊 No suit';
    btn.setAttribute('aria-pressed', String(on));
    if (owned) {
      btn.addEventListener('click', () => { profile.petSuit = suit ? suit.id : null; saveProfile(); renderPet(suit ? `✨ ${profile.petName} loves the ${suit.name}!` : undefined); });
    } else {
      btn.disabled = true;
      btn.title = 'Win it in the Fox Fashion Event';
      btn.setAttribute('aria-label', `${suit.name}: win it in the Fox Fashion Event`);
    }
    box.appendChild(btn);
  };
  make(null);
  FOX_SUITS.forEach(make);
}

function petTheFox() {
  const btn = $('petBtn');
  btn.classList.remove('happy'); void btn.offsetWidth; btn.classList.add('happy');
  tone(880, 0.08); setTimeout(() => tone(1175, 0.1), 90);
  renderPet(`💛 ${profile.petName} ${PET_CHEERS[Math.floor(Math.random() * PET_CHEERS.length)]}`);
}

function savePetName() {
  const name = $('petNameInput').value.trim().slice(0, 16);
  if (!name) return;
  profile.petName = name;
  saveProfile();
  renderPet(`🦊 Hello! My name is ${name}!`);
}

/* ---------- Weekly Boss Battle ---------- */

const currentBoss = () => BOSSES[Math.abs(Math.floor(daysBetween('2026-01-05', weekStart()) / 7)) % BOSSES.length];

// A new week brings a new boss with full health.
function syncBoss() {
  const week = weekStart();
  if (profile.boss.week !== week) profile.boss = { week, hp: BOSS_HP, defeated: false };
}

function renderBossCard() {
  syncBoss();
  const boss = currentBoss();
  $('bossCardIcon').textContent = boss.face;
  const btn = $('bossPlayBtn');
  if (profile.boss.defeated) {
    $('bossCardText').textContent = `✅ You beat ${boss.name}! A new boss arrives on Monday.`;
    btn.textContent = 'Beaten! ✅';
    btn.disabled = true;
  } else {
    $('bossCardText').textContent = `${boss.face} ${boss.name} has ${profile.boss.hp} of ${BOSS_HP} HP left. Every right answer hits it. Fast answers are CRITICAL hits!`;
    btn.textContent = 'Fight the boss →';
    btn.disabled = false;
  }
}

function renderBossPanel(hitText) {
  const boss = currentBoss();
  $('bossFace').textContent = boss.face;
  $('bossName').textContent = boss.name;
  $('bossHp').style.width = (profile.boss.hp / BOSS_HP) * 100 + '%';
  $('bossHpText').textContent = `${profile.boss.hp} / ${BOSS_HP} HP`;
  const hit = $('bossHit');
  hit.textContent = hitText || '';
  if (hitText) {
    hit.classList.remove('show'); void hit.offsetWidth; hit.classList.add('show');
    $('bossFace').classList.remove('hurt'); void $('bossFace').offsetWidth; $('bossFace').classList.add('hurt');
  }
}

// Called for each correct answer in Boss Battle.
function hitBoss(seconds) {
  const critical = seconds <= 3;
  const damage = critical ? BOSS_CRITICAL : BOSS_HIT;
  profile.boss.hp = Math.max(0, profile.boss.hp - damage);
  renderBossPanel(critical ? `💥 CRITICAL! −${damage}` : `−${damage}`);
  if (profile.boss.hp === 0 && !profile.boss.defeated) {
    profile.boss.defeated = true;
    profile.bossesDefeated++;
    profile.points += BOSS_REWARD;
    celebrate(`🏆 You defeated ${currentBoss().name}! +${BOSS_REWARD} points`);
    burstConfetti();
  }
}

/* ---------- Friend Challenge of the Day ---------- */

// Everyone gets the same 10 questions on the same date.
function dailyQuestions(day = today()) {
  return withRng(seededRandom(hashText('emi-daily-' + day)), () =>
    Array.from({ length: GAMES.daily.total }, () => makeQuestion('mix', 2, [randBetween(2, 12), randBetween(2, 12)])));
}

const playedChallengeToday = () => !!profile.challenge && profile.challenge.day === today();

function renderDailyCard() {
  $('dailyCardText').textContent = playedChallengeToday()
    ? `✅ Today: ${profile.challenge.score}/10 in ${profile.challenge.time.toFixed(1)}s. Play again for practice (only your first try counts).`
    : 'Today’s 10 questions are the same for everyone. Only your first try counts!';
}

function renderChallengeBoard() {
  const box = $('challengeBoard');
  box.textContent = '';
  const day = today();
  const rows = friends.filter((f) => f.chDay === day).map((f) => ({ name: f.name, emoji: f.emoji, bg: f.bg, score: f.chScore, time: f.chTime }));
  if (playedChallengeToday()) rows.push({ name: (profile.name || 'You') + ' (You)', emoji: profile.selectedEmoji, bg: profile.selectedBackground, score: profile.challenge.score, time: profile.challenge.time, isYou: true });
  rows.sort((a, b) => b.score - a.score || a.time - b.time);
  if (!rows.length) {
    const p = document.createElement('p'); p.className = 'shop-note';
    p.textContent = 'Nobody has played today’s challenge yet. Be the first! (Find it in the Play tab.)';
    box.appendChild(p);
    return;
  }
  if (!playedChallengeToday()) {
    const p = document.createElement('p'); p.className = 'shop-note';
    p.textContent = 'You haven’t played today’s challenge yet. Find it in the Play tab!';
    box.appendChild(p);
  }
  rows.forEach((r, i) => {
    const row = document.createElement('div'); row.className = 'leader-row' + (r.isYou ? ' you' : '');
    const place = document.createElement('span'); place.className = 'rank place-' + (i + 1); place.textContent = i + 1 + (['st', 'nd', 'rd'][i] || 'th');
    const face = document.createElement('span'); face.className = 'face'; setEmoji(face, r.emoji); face.style.background = backgroundCss(r.bg);
    const details = document.createElement('div'); details.className = 'person';
    const name = document.createElement('strong'); name.textContent = r.name;
    const sub = document.createElement('small'); sub.textContent = `${r.time.toFixed(1)} seconds`;
    details.append(name, sub);
    const score = document.createElement('span'); score.className = 'score'; score.textContent = `${r.score}/10`;
    row.append(place, face, details, score);
    box.appendChild(row);
  });
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
  if (profile.streakFreezes) $('dayStreakHint').textContent += ` · ❄️${profile.streakFreezes}`;
  $('stars').textContent = profile.stars.toLocaleString();
  $('correctCount').textContent = profile.correctTotal.toLocaleString();
  $('streak').textContent = profile.bestStreak.toLocaleString();
}

// The two shops share one set of rules. Each item has a key (what we save),
// a name, a price, and a way to draw its preview.
const SHOPS = {
  emoji: {
    items: () => [{ emoji: DEFAULT_EMOJI, name: 'Happy Face', price: 0 }, ...SHOP_EMOJIS, ...SPECIAL_EMOJIS],
    key: (item) => item.emoji,
    label: (item) => item.name,
    owned: () => profile.ownedEmojis,
    selected: () => profile.selectedEmoji,
    select: (key) => { profile.selectedEmoji = key; },
    preview(item) {
      const em = document.createElement('span'); em.className = 'shop-emoji'; setEmoji(em, item.emoji);
      return em;
    },
  },
  bg: {
    items: () => SHOP_BACKGROUNDS,
    key: (item) => item.id,
    label: (item) => item.name + ' background',
    owned: () => profile.ownedBackgrounds,
    selected: () => profile.selectedBackground,
    select: (key) => { profile.selectedBackground = key; },
    preview(item) {
      const swatch = document.createElement('span');
      swatch.className = 'bg-swatch';
      swatch.style.background = item.css;
      setEmoji(swatch, shownEmoji());   // shows how it will look
      return swatch;
    },
  },
};

const backgroundCss = (id) => (BACKGROUNDS_BY_ID[id] || BACKGROUNDS_BY_ID[DEFAULT_BACKGROUND]).css;

function renderProfile() {
  $('points').textContent = profile.points.toLocaleString();
  setEmoji($('profileAvatar'), shownEmoji());
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
    const rarity = rarityOf(item);
    card.className = `emoji-item rarity-${rarity.id}` + (chosen ? ' chosen' : '');
    const chip = document.createElement('span'); chip.className = 'rarity-chip'; chip.textContent = rarity.name;
    const name = document.createElement('strong'); name.textContent = item.name;
    const price = document.createElement('small'); price.textContent = item.source === 'chest' ? '🧰 Treasure Chest only' : item.price ? item.price.toLocaleString() + ' points' : 'Free';
    const btn = document.createElement('button');
    btn.type = 'button';
    if (owned) {
      btn.className = 'owned';
      btn.textContent = chosen ? 'Using ✓' : 'Use';
      btn.setAttribute('aria-label', (chosen ? 'Using ' : 'Use ') + label);
      btn.addEventListener('click', () => useItem(kind, key));
    } else if (item.event) {
      const fromChest = item.source === 'chest';      // can only be won, never bought
      btn.textContent = fromChest ? '🧰 Chest prize' : '🎁 Event reward';
      btn.className = 'event-locked';
      btn.disabled = true;
      btn.setAttribute('aria-label', `${label}: win it in the ${fromChest ? 'Treasure Chest' : 'Reward Event'}`);
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
  if (item.event) return;                                     // event items can't be bought
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
  const rarity = rarityOf(item);
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
    chDay: profile.challenge ? profile.challenge.day : null,
    chScore: profile.challenge ? profile.challenge.score : 0,
    chTime: profile.challenge ? profile.challenge.time : 0,
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
    const face = document.createElement('span'); face.className = 'face'; setEmoji(face, person.emoji);
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
    note.textContent = (person.isYou ? 'You · '
      : person.online ? (person.gone ? '🌐 Left online friends · ' : '🌐 Updates by itself · ')
      : 'From their code on ' + new Date(person.updated).toLocaleDateString() + ' · ') + person.points.toLocaleString() + ' pts';
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

/* ---------- Online friends (Firebase) ---------- */
// Optional. A child who joins gets an online profile (nickname, emoji, points, league,
// streak, challenge score) that friends can find by name. Friends added online update
// by themselves. Uses Firebase's web APIs directly (anonymous sign-in + Firestore).
// Nothing happens until a grown-up has filled in web/online-config.js.

const ONLINE = window.EMI_ONLINE || {};
const onlineConfigured = () => !!(ONLINE.apiKey && ONLINE.projectId);
const onlineJoined = () => onlineConfigured() && profile.online.joined && !!profile.online.uid;
const fsBase = () => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(ONLINE.projectId)}/databases/(default)/documents`;
const playerTag = (uid) => (uid || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();

let idToken = null;
let idTokenExpires = 0;

// Signs in (anonymously, no email or password) and returns a fresh sign-in token.
async function authToken() {
  if (idToken && Date.now() < idTokenExpires - 60_000) return idToken;
  const o = profile.online;
  let res, data;
  if (o.refreshToken) {
    res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(ONLINE.apiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(o.refreshToken),
    });
    if (!res.ok) throw new Error('sign-in failed');
    data = await res.json();
    idToken = data.id_token; o.refreshToken = data.refresh_token; o.uid = data.user_id;
    idTokenExpires = Date.now() + Number(data.expires_in) * 1000;
  } else {
    res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(ONLINE.apiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
    });
    if (!res.ok) throw new Error('sign-in failed');
    data = await res.json();
    idToken = data.idToken; o.refreshToken = data.refreshToken; o.uid = data.localId;
    idTokenExpires = Date.now() + Number(data.expiresIn) * 1000;
  }
  storage.write(PROFILE_KEY, profile);
  return idToken;
}

async function firestore(path, options = {}) {
  const token = await authToken();
  const res = await fetch(fsBase() + path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('online request failed: ' + res.status);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Firestore stores values with their type, e.g. { integerValue: "120" }.
function toFirestore(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) fields[k] = { nullValue: null };
    else if (typeof v === 'string') fields[k] = k === 'updated' ? { timestampValue: v } : { stringValue: v };
    else if (Number.isInteger(v)) fields[k] = { integerValue: String(v) };
    else fields[k] = { doubleValue: v };
  }
  return { fields };
}
function fromFirestore(fields = {}) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    if ('stringValue' in v) out[k] = v.stringValue;
    else if ('integerValue' in v) out[k] = Number(v.integerValue);
    else if ('doubleValue' in v) out[k] = Number(v.doubleValue);
    else if ('timestampValue' in v) out[k] = v.timestampValue;
    else out[k] = null;
  }
  return out;
}

// Only these details ever go online.
function myOnlineProfile() {
  return {
    name: profile.name, nameLower: profile.name.toLowerCase(), nameKey: nameKey(profile.name), tag: playerTag(profile.online.uid),
    emoji: profile.selectedEmoji, bg: profile.selectedBackground, points: profile.points,
    rank: profile.bestRank, rankAvg: profile.bestRankAvg,
    streak: currentDailyStreak(), streakDay: profile.lastPlayDay,
    chDay: profile.challenge ? profile.challenge.day : null,
    chScore: profile.challenge ? profile.challenge.score : 0,
    chTime: profile.challenge ? profile.challenge.time : 0,
    updated: new Date().toISOString(),
  };
}

let pushTimer = null;
// Sends this player's latest details online (a few seconds after a change, so changes are grouped).
function schedulePush(delay = 3000) {
  if (!onlineJoined()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushOnlineNow().catch(() => {}); }, delay);
}
async function pushOnlineNow() {
  if (!onlineJoined() || !profile.name) return;
  await firestore(`/players/${profile.online.uid}`, { method: 'PATCH', body: JSON.stringify(toFirestore(myOnlineProfile())) });
}

// A friend entry for the leaderboard, from an online profile.
function onlineFriendEntry(uid, data) {
  return sanitizeFriend({ ...data, id: 'online-' + uid, uid, online: true, updated: data.updated || new Date().toISOString() });
}

let lastFriendRefresh = 0;
// Fetches every online friend's latest details.
async function refreshOnlineFriends(force = false) {
  const online = friends.filter((f) => f.online && f.uid);
  if (!onlineJoined() || !online.length) return;
  if (!force && Date.now() - lastFriendRefresh < 60_000) return;
  lastFriendRefresh = Date.now();
  const docs = online.map((f) => `projects/${ONLINE.projectId}/databases/(default)/documents/players/${f.uid}`);
  const results = await firestore(':batchGet', { method: 'POST', body: JSON.stringify({ documents: docs }) });
  for (const r of results || []) {
    if (r.found) {
      const uid = r.found.name.split('/').pop();
      const i = friends.findIndex((f) => f.uid === uid);
      if (i >= 0) friends[i] = onlineFriendEntry(uid, fromFirestore(r.found.fields));
    } else if (r.missing) {
      const uid = r.missing.split('/').pop();
      const f = friends.find((x) => x.uid === uid);
      if (f) f.gone = true;                       // they left online friends
    }
  }
  saveFriends();
}

function showOnlineMessage(msg) { $('onlineMessage').textContent = msg; }

// Joining and leaving take two taps.
let pendingOnline = null;
let pendingOnlineTimer = null;
function armOnlineButton(btn, label) {
  clearTimeout(pendingOnlineTimer);
  pendingOnline = btn.id;
  btn.textContent = label;
  btn.classList.add('confirm-danger');
  pendingOnlineTimer = setTimeout(() => { pendingOnline = null; renderOnline(); }, 6000);
}

async function joinOnline() {
  if (!onlineConfigured() || onlineJoined()) return;
  if (!profile.name) { showOnlineMessage('Choose a nickname first (in the Shop tab, under your character).'); return; }
  if (pendingOnline !== 'joinOnlineBtn') { armOnlineButton($('joinOnlineBtn'), 'Tap again: my grown-up said yes'); return; }
  pendingOnline = null;
  showOnlineMessage('Joining…');
  try {
    await authToken();
    profile.online.joined = true;
    await pushOnlineNow();
    saveProfile();
    showOnlineMessage(`🎉 You’re online as ${profile.name} #${playerTag(profile.online.uid)}! Friends can now find you.`);
  } catch {
    profile.online.joined = false;
    showOnlineMessage('Couldn’t connect to the internet. Please try again later.');
  }
  renderOnline();
}

async function leaveOnline() {
  if (!onlineJoined()) return;
  if (pendingOnline !== 'leaveOnlineBtn') { armOnlineButton($('leaveOnlineBtn'), 'Tap again to delete my online profile'); return; }
  pendingOnline = null;
  try {
    await firestore(`/players/${profile.online.uid}`, { method: 'DELETE' });
  } catch {
    showOnlineMessage('Couldn’t reach the internet, so your online profile wasn’t deleted yet. Please try again later.');
    renderOnline();
    return;
  }
  profile.online = { joined: false, uid: null, refreshToken: null };
  idToken = null;
  saveProfile();
  showOnlineMessage('Your online profile has been deleted. Friends can’t find you any more.');
  renderOnline();
}

// The searchable form of a nickname: lower case, letters and numbers only.
// So "❤️Cheetahs ❤️" is found by typing "cheetahs".
const nameKey = (text) => String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 20);

// What was typed: a nickname, a nickname with its tag ("Ddog #VTJE"), or just a tag ("#VTJE").
function parseSearch(text) {
  const raw = String(text || '').trim();
  const tagMatch = raw.match(/#\s*([a-z0-9]{4})\b/i);
  const tag = tagMatch ? tagMatch[1].toUpperCase() : null;
  const key = nameKey(tagMatch ? raw.replace(tagMatch[0], '') : raw);
  // Four letters/numbers on their own might be a tag typed without the #: tried if no name matches.
  const maybeTag = !tag && /^[a-z0-9]{4}$/i.test(raw) ? raw.toUpperCase() : null;
  return { key, tag, maybeTag };
}

async function runPlayerQuery(where, orderBy) {
  const rows = await firestore(':runQuery', {
    method: 'POST',
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'players' }], where, ...(orderBy ? { orderBy: [{ field: { fieldPath: orderBy } }] } : {}), limit: 10 } }),
  });
  return (rows || []).filter((r) => r.document).map((r) => ({ uid: r.document.name.split('/').pop(), data: fromFirestore(r.document.fields) }));
}

async function searchOnline() {
  const typed = $('onlineSearch').value.trim();
  const { key, tag, maybeTag } = parseSearch(typed);
  const box = $('onlineResults');
  box.textContent = '';
  if (key.length < 2 && !tag) { showOnlineMessage('Type at least 2 letters of your friend’s nickname (or their tag, like #K2P7).'); return; }
  showOnlineMessage('Searching…');
  let found = [];
  try {
    if (key.length >= 2) {
      found = await runPlayerQuery({ compositeFilter: { op: 'AND', filters: [
        { fieldFilter: { field: { fieldPath: 'nameKey' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: key } } },
        { fieldFilter: { field: { fieldPath: 'nameKey' }, op: 'LESS_THAN', value: { stringValue: key + '' } } },
      ] } }, 'nameKey');
      if (tag) found = found.filter((r) => String(r.data.tag || '').toUpperCase() === tag);
    }
    if (!found.length && (tag || maybeTag)) {   // the tag alone is enough
      found = await runPlayerQuery({ fieldFilter: { field: { fieldPath: 'tag' }, op: 'EQUAL', value: { stringValue: tag || maybeTag } } });
    }
  } catch {
    showOnlineMessage('Couldn’t search right now. Check the internet and try again.');
    return;
  }
  found = found.filter((r) => r.uid !== profile.online.uid);
  showOnlineMessage(found.length ? `Found ${found.length}. Tap “Add” to add a friend.` : `Nobody called “${$('onlineSearch').value.trim()}” yet. Check the spelling, or ask your friend to join online friends.`);
  for (const { uid, data } of found) {
    const row = document.createElement('div'); row.className = 'leader-row';
    const face = document.createElement('span'); face.className = 'face'; setEmoji(face, String(data.emoji || DEFAULT_EMOJI).slice(0, 16));
    face.style.background = backgroundCss(data.bg);
    const details = document.createElement('div'); details.className = 'person';
    const name = document.createElement('strong'); name.textContent = `${String(data.name || 'Friend').slice(0, 20)} #${String(data.tag || playerTag(uid)).slice(0, 4)}`;
    const sub = document.createElement('small');
    sub.textContent = RANKS_BY_ID[data.rank] ? `${RANKS_BY_ID[data.rank].name} league` : 'Unranked';
    details.append(name, sub);
    const already = friends.some((f) => f.uid === uid);
    const add = document.createElement('button'); add.type = 'button';
    add.textContent = already ? 'Added ✓' : '➕ Add';
    add.disabled = already;
    add.setAttribute('aria-label', already ? `${data.name} is already your friend` : `Add ${data.name} #${data.tag || playerTag(uid)}`);
    add.addEventListener('click', () => {
      if (friends.some((f) => f.uid === uid)) return;
      friends.push(onlineFriendEntry(uid, data));
      saveFriends();
      add.textContent = 'Added ✓'; add.disabled = true;
      add.setAttribute('aria-label', `${data.name} is already your friend`);
      celebrate(`👫 ${data.name} is now your friend! Their points and league will update by themselves.`, { confetti: false });
    });
    row.append(face, details, add);
    box.appendChild(row);
  }
}

function renderOnline() {
  const configured = onlineConfigured();
  const joined = onlineJoined();
  $('onlineNotReady').hidden = configured;
  $('onlineJoin').hidden = !configured || joined;
  $('onlineJoined').hidden = !joined;
  if (pendingOnline !== 'joinOnlineBtn') { $('joinOnlineBtn').textContent = '🌐 Join online friends'; $('joinOnlineBtn').classList.remove('confirm-danger'); }
  if (pendingOnline !== 'leaveOnlineBtn') { $('leaveOnlineBtn').textContent = 'Leave online friends'; $('leaveOnlineBtn').classList.remove('confirm-danger'); }
  if (joined) $('onlineName').textContent = `${profile.name || 'You'} #${playerTag(profile.online.uid)}`;
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
    const isTrue = rng() < 0.5;
    let shown = isTrue ? product : product + (rng() < 0.5 ? rand(5) : -rand(5));
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
    choices: fourChoices(product, () => (rng() < 0.6 ? product + rand(20) - 10 : rand(12) * rand(12))),
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
  if (mode === 'boss') {
    syncBoss();
    if (profile.boss.defeated) { celebrate('✅ You already beat this week’s boss. A new one arrives on Monday!', { confetti: false }); return; }
  }
  clearTimers();
  Object.assign(game, { mode, config: GAMES[mode], qNum: 0, score: 0, streak: 0, locked: false, ended: false, typed: '', missed: [], times: [] });
  game.dailySet = mode === 'daily' ? dailyQuestions() : null;
  $('rankResult').hidden = true;
  $('playArea').classList.add('active');
  $('tableControls').hidden = mode !== 'table';
  $('bossPanel').hidden = mode !== 'boss';
  if (mode === 'boss') renderBossPanel();
  $('gameTitle').textContent = mode === 'boss' ? `${currentBoss().face} Boss Battle: ${currentBoss().name}` : game.config.title;
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
  const tricky = game.dailySet ? null : pickTrickyFactors(game.mode, $('tableSelect').value, lastKey);
  game.question = game.dailySet ? { ...game.dailySet[game.qNum] } : makeQuestion(game.mode, $('tableSelect').value, tricky);
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
  if (game.config.ranked || game.config.daily) game.times.push(game.config.perQuestion);
  $('feedback').textContent = `⏰ Time’s up! The answer was ${game.question.answer}.`;
  tone(240, 0.2, 'triangle');
  afterAnswer();
}

function submitAnswer(value, btn) {
  if (game.locked || game.ended) return;
  lockAnswers();
  const correct = String(value) === String(game.question.answer);
  const seconds = Math.min(game.config.perQuestion || Infinity, (Date.now() - game.questionStart) / 1000);
  if (game.config.ranked) game.times.push(correct ? seconds : game.config.perQuestion);   // wrong answers count as the full time
  if (game.config.daily) game.times.push(seconds);                                        // challenge: total time is the tie-break
  if (correct && game.config.boss) hitBoss(seconds);
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
    $('feedback').textContent = game.config.boss
      ? `💨 The boss dodged! The answer is ${game.question.answer}. Keep going!`
      : `Nearly! The answer is ${game.question.answer}. Keep going!`;
    tone(240, 0.2, 'triangle');
  }
  if (game.config.typed) $('typedAnswer').classList.add(correct ? 'correct' : 'wrong');
  afterAnswer();
}

function isLastQuestion() { return game.qNum + 1 >= game.config.total; }

function afterAnswer() {
  if (game.config.boss && profile.boss.defeated) {       // the boss is beaten: end the battle
    timers.advance = setTimeout(finishRound, 900);
    return;
  }
  if (game.config.auto) {                                // Boss Battle and Friend Challenge move on by themselves
    timers.advance = setTimeout(nextQuestion, 900);
    return;
  }
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
  recordExercise();
  let summary = `🏆 Round complete! You got ${game.score} out of ${total}.` + (star ? ' ⭐ You earned a star!' : '');
  if (game.config.boss) {
    const boss = currentBoss();
    summary = profile.boss.defeated ? `⚔️ You defeated ${boss.name}! +${BOSS_REWARD} points` : `${boss.face} ${boss.name} has ${profile.boss.hp} HP left. Come back to finish it!`;
  }
  if (game.config.daily) {
    const time = Math.round(game.times.reduce((a, b) => a + b, 0) * 10) / 10;
    if (!playedChallengeToday()) {
      profile.challenge = { day: today(), score: game.score, time };
      profile.challengesPlayed++;
      saveProfile();
      summary = `🏁 Your score is saved for today: ${game.score}/10 in ${time.toFixed(1)}s. Send your friend code so friends can compare!`;
    } else {
      summary = `🏁 Practice run: ${game.score}/10 in ${time.toFixed(1)}s. Only your first try counts on the board.`;
    }
  }
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
  recordExercise();   // also saves
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
  $('claimEventBtn').addEventListener('click', claimEventReward);
  $('revealCloseBtn').addEventListener('click', closeReveal);
  $('revealUseBtn').addEventListener('click', useRevealedPrize);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('prizeReveal').hidden) closeReveal(); });
  document.querySelectorAll('.tabbar .tab').forEach((tab) => tab.addEventListener('click', () => showPage(tab.dataset.page)));
  $('openChestBtn').addEventListener('click', openChest);
  $('openMegaBtn').addEventListener('click', openMegaChest);
  $('joinOnlineBtn').addEventListener('click', joinOnline);
  $('leaveOnlineBtn').addEventListener('click', leaveOnline);
  $('onlineSearchBtn').addEventListener('click', searchOnline);
  $('onlineSearch').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchOnline(); });
  $('petBtn').addEventListener('click', petTheFox);
  $('petNameBtn').addEventListener('click', savePetName);
  $('petNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') savePetName(); });
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
  applyStreakFreezes();                  // a missed day? use a freeze if there is one
  finishEndedEvents();                   // give out any unclaimed rewards from ended events
  if (onlineJoined()) {                  // online: send my latest details and fetch my friends'
    schedulePush(500);
    refreshOnlineFriends(true).catch(() => {});
  }
  storage.write(PROFILE_KEY, profile);   // keeps the new player id
  renderAll();

  // Offline support / Home Screen install (only on https or localhost).
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// Exposed for automated tests.
window.EmiApp = { makeQuestion, decodeFriendCode, makeFriendCode, EMOJI_CATALOG, BACKGROUND_CATALOG, GAMES, RANKS, rankForAverage, pickTrickyFactors, getProfile: () => profile, BADGES, makeBackupCode, readBackupCode, compareLeaders, RARITIES, rarityFor, rarityOf, EVENT_EMOJIS, EVENT_BACKGROUNDS, EVENTS, FOX_SUITS, EMI_EMOJI, SHOP_EMOJIS, SHOP_BACKGROUNDS, rollMegaChest,
  CHEST_EMOJIS, PET_STAGES, BOSSES, BOSS_HP, dailyQuestions, showPage };

init();
