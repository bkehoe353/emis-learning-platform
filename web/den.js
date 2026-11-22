// Fox's Den: a bedroom for the pet fox that the player decorates.
// Colours are free to change; furniture and decorations are bought with points.
// Loaded before app.js; uses app.js's profile, saveProfile, $, tone and celebrate when called.
'use strict';

/* ---------- Choices ---------- */

const DEN_COLOURS = [
  { id: 'pink', name: 'Pink', hex: '#ffc6dd' }, { id: 'lilac', name: 'Lilac', hex: '#d9c8ff' },
  { id: 'sky', name: 'Sky blue', hex: '#bfe3ff' }, { id: 'mint', name: 'Mint', hex: '#c8f2dd' },
  { id: 'lemon', name: 'Lemon', hex: '#fff1a8' }, { id: 'peach', name: 'Peach', hex: '#ffd6b8' },
  { id: 'coral', name: 'Coral', hex: '#ff9e8f' }, { id: 'white', name: 'White', hex: '#fbfbfb' },
  { id: 'grey', name: 'Grey', hex: '#cfd5df' }, { id: 'navy', name: 'Navy', hex: '#2c3e70' },
  { id: 'forest', name: 'Forest green', hex: '#2e7d4f' }, { id: 'red', name: 'Red', hex: '#d64545' },
];
const DEN_WOODS = [
  { id: 'light', name: 'Light wood', hex: '#e2b98a' }, { id: 'honey', name: 'Honey', hex: '#c98a4b' },
  { id: 'walnut', name: 'Walnut', hex: '#7a4a2a' }, { id: 'whitewood', name: 'White', hex: '#f1ede6' },
  { id: 'pinkwood', name: 'Pink', hex: '#f4a9c8' }, { id: 'bluewood', name: 'Blue', hex: '#7fb2e5' },
];
const DEN_SKIES = [
  { id: 'day', name: '☀️ Day', css: 'linear-gradient(180deg,#8fd3ff,#d9f1ff)' },
  { id: 'sunset', name: '🌅 Sunset', css: 'linear-gradient(180deg,#ff9a8b,#ffd27a)' },
  { id: 'night', name: '🌙 Night', css: 'radial-gradient(#fff 1px,transparent 1.5px) 0 0/12px 12px,linear-gradient(180deg,#141a4a,#3a2c7a)' },
];
// What each colour choice paints, and its starting colour.
const DEN_PAINT = [
  { key: 'wall', name: 'Walls', list: DEN_COLOURS, start: 'lilac' },
  { key: 'bedding', name: 'Bedding', list: DEN_COLOURS, start: 'sky' },
  { key: 'curtains', name: 'Curtains', list: DEN_COLOURS, start: 'pink' },
  { key: 'rug', name: 'Rug', list: DEN_COLOURS, start: 'coral' },
  { key: 'carpet', name: 'Carpet', list: DEN_COLOURS, start: 'mint' },
  { key: 'wood', name: 'Furniture', list: DEN_WOODS, start: 'light' },
  { key: 'sky', name: 'Window view', list: DEN_SKIES, start: 'day' },
];

// Furniture and decorations. Slots hold one choice; 'decor' items can all be shown at once.
const DEN_ITEMS = [
  { id: 'wp-plain', slot: 'wallpaper', name: 'Plain walls', icon: '🎨', price: 0 },
  { id: 'wp-stripes', slot: 'wallpaper', name: 'Stripy wallpaper', icon: '📏', price: 400 },
  { id: 'wp-polka', slot: 'wallpaper', name: 'Spotty wallpaper', icon: '🔵', price: 500 },
  { id: 'wp-hearts', slot: 'wallpaper', name: 'Heart wallpaper', icon: '💗', price: 600 },
  { id: 'wp-stars', slot: 'wallpaper', name: 'Starry wallpaper', icon: '✨', price: 700 },
  { id: 'wp-clouds', slot: 'wallpaper', name: 'Cloud wallpaper', icon: '☁️', price: 900 },
  { id: 'fl-wood', slot: 'floor', name: 'Wooden floor', icon: '🪵', price: 0 },
  { id: 'fl-dark', slot: 'floor', name: 'Dark wood floor', icon: '🟫', price: 300 },
  { id: 'fl-carpet', slot: 'floor', name: 'Soft carpet', icon: '🧶', price: 400 },
  { id: 'fl-tiles', slot: 'floor', name: 'Checker tiles', icon: '🔲', price: 600 },
  { id: 'fl-grass', slot: 'floor', name: 'Grass floor', icon: '🌱', price: 800 },
  { id: 'bed-cosy', slot: 'bed', name: 'Cosy bed', icon: '🛏️', price: 0 },
  { id: 'bed-bunk', slot: 'bed', name: 'Bunk bed', icon: '🪜', price: 1500 },
  { id: 'bed-canopy', slot: 'bed', name: 'Princess canopy bed', icon: '👑', price: 2500 },
  { id: 'bed-car', slot: 'bed', name: 'Race car bed', icon: '🏎️', price: 3000 },
  { id: 'bed-cloud', slot: 'bed', name: 'Cloud bed', icon: '☁️', price: 4000 },
  { id: 'rug-none', slot: 'rug', name: 'No rug', icon: '✖️', price: 0 },
  { id: 'rug-round', slot: 'rug', name: 'Round rug', icon: '⭕', price: 300 },
  { id: 'rug-star', slot: 'rug', name: 'Star rug', icon: '⭐', price: 700 },
  { id: 'rug-rainbow', slot: 'rug', name: 'Rainbow rug', icon: '🌈', price: 900 },
  { id: 'desk-none', slot: 'desk', name: 'No desk', icon: '✖️', price: 0 },
  { id: 'desk-study', slot: 'desk', name: 'Study desk', icon: '📝', price: 800 },
  { id: 'desk-gaming', slot: 'desk', name: 'Gaming desk', icon: '🖥️', price: 2000 },
  { id: 'chair-none', slot: 'chair', name: 'No chair', icon: '✖️', price: 0 },
  { id: 'chair-wood', slot: 'chair', name: 'Wooden chair', icon: '🪑', price: 300 },
  { id: 'chair-beanbag', slot: 'chair', name: 'Beanbag', icon: '🟣', price: 600 },
  { id: 'chair-gaming', slot: 'chair', name: 'Gaming chair', icon: '🕹️', price: 1200 },
  { id: 'lamp-none', slot: 'lamp', name: 'No lamp', icon: '✖️', price: 0 },
  { id: 'lamp-desk', slot: 'lamp', name: 'Desk lamp', icon: '💡', price: 300 },
  { id: 'lamp-fairy', slot: 'lamp', name: 'Fairy lights', icon: '✨', price: 900 },
  { id: 'lamp-lava', slot: 'lamp', name: 'Lava lamp', icon: '🫧', price: 1200 },
  { id: 'shelf-none', slot: 'shelf', name: 'No bookshelf', icon: '✖️', price: 0 },
  { id: 'shelf-books', slot: 'shelf', name: 'Bookshelf', icon: '📚', price: 700 },
  { id: 'poster-none', slot: 'poster', name: 'No poster', icon: '✖️', price: 0 },
  { id: 'poster-cat', slot: 'poster', name: 'Cat poster', icon: '🐱', price: 300 },
  { id: 'poster-rainbow', slot: 'poster', name: 'Rainbow poster', icon: '🌈', price: 300 },
  { id: 'poster-unicorn', slot: 'poster', name: 'Unicorn poster', icon: '🦄', price: 400 },
  { id: 'poster-football', slot: 'poster', name: 'Football poster', icon: '⚽', price: 400 },
  { id: 'poster-space', slot: 'poster', name: 'Space poster', icon: '🚀', price: 500 },
  // Decorations: each has its own place in the room (left/bottom in %).
  { id: 'dec-books', slot: 'decor', name: 'Pile of books', icon: '📚', price: 150, at: [77, 26], on: 'desk', floor: [58, 3] },
  { id: 'dec-plant', slot: 'decor', name: 'Plant', icon: '🪴', price: 200, at: [24, 44] },
  { id: 'dec-balloons', slot: 'decor', name: 'Balloons', icon: '🎈', price: 200, at: [2, 60] },
  { id: 'dec-ball', slot: 'decor', name: 'Football', icon: '⚽', price: 250, at: [33, 2] },
  { id: 'dec-teddy', slot: 'decor', name: 'Teddy bear', icon: '🧸', price: 300, at: [8, 28] },
  { id: 'dec-clock', slot: 'decor', name: 'Clock', icon: '🕰️', price: 350, at: [57, 74] },
  { id: 'dec-globe', slot: 'decor', name: 'Globe', icon: '🌍', price: 400, at: [86, 66], on: 'shelf', floor: [80, 3] },
  { id: 'dec-skate', slot: 'decor', name: 'Skateboard', icon: '🛹', price: 600, at: [66, 1] },
  { id: 'dec-fish', slot: 'decor', name: 'Fish tank', icon: '🐠', price: 800, at: [87, 48], on: 'shelf', floor: [70, 3] },
  { id: 'dec-guitar', slot: 'decor', name: 'Guitar', icon: '🎸', price: 900, at: [52, 14] },
  { id: 'dec-trophy', slot: 'decor', name: 'Trophy', icon: '🏆', price: 1000, at: [91, 34], on: 'shelf', floor: [86, 3] },
  { id: 'dec-rocket', slot: 'decor', name: 'Toy rocket', icon: '🚀', price: 1100, at: [86, 19], on: 'shelf', floor: [75, 3] },
  { id: 'dec-laptop', slot: 'decor', name: 'Laptop', icon: '💻', price: 1200, at: [68, 26], on: 'desk', floor: [62, 3] },
  { id: 'dec-robot', slot: 'decor', name: 'Toy robot', icon: '🤖', price: 1500, at: [92, 3] },
  { id: 'dec-piano', slot: 'decor', name: 'Keyboard piano', icon: '🎹', price: 1800, at: [43, 40] },
  { id: 'dec-crown', slot: 'decor', name: 'Golden crown', icon: '👑', price: 3000, at: [16, 50] },
];
const DEN_ITEMS_BY_ID = Object.fromEntries(DEN_ITEMS.map((i) => [i.id, i]));
const DEN_SLOTS = ['wallpaper', 'floor', 'bed', 'rug', 'desk', 'chair', 'lamp', 'shelf', 'poster'];
const DEN_START = { wallpaper: 'wp-plain', floor: 'fl-wood', bed: 'bed-cosy', rug: 'rug-none', desk: 'desk-none', chair: 'chair-none', lamp: 'lamp-none', shelf: 'shelf-none', poster: 'poster-none' };
// The decorate menu.
const DEN_TABS = [
  { id: 'paint', name: '🎨 Colours' },
  { id: 'beds', name: '🛏️ Beds', slots: ['bed'] },
  { id: 'furniture', name: '🪑 Furniture', slots: ['desk', 'chair', 'lamp', 'shelf'] },
  { id: 'decor', name: '🧸 Decorations', slots: ['decor'] },
  { id: 'walls', name: '🖼️ Walls & floor', slots: ['wallpaper', 'floor', 'rug', 'poster'] },
];

/* ---------- Saved den ---------- */

function sanitizeDen(d) {
  if (!d || typeof d !== 'object') d = {};
  const owned = Array.isArray(d.owned) ? [...new Set(d.owned.filter((id) => DEN_ITEMS_BY_ID[id] && DEN_ITEMS_BY_ID[id].price > 0))] : [];
  const has = (id) => DEN_ITEMS_BY_ID[id] && (DEN_ITEMS_BY_ID[id].price === 0 || owned.includes(id));
  const den = { owned, decor: [], colours: {} };
  for (const slot of DEN_SLOTS) den[slot] = has(d[slot]) && DEN_ITEMS_BY_ID[d[slot]].slot === slot ? d[slot] : DEN_START[slot];
  den.decor = Array.isArray(d.decor) ? [...new Set(d.decor.filter((id) => owned.includes(id) && DEN_ITEMS_BY_ID[id].slot === 'decor'))] : [];
  const colours = d.colours && typeof d.colours === 'object' ? d.colours : {};
  for (const p of DEN_PAINT) den.colours[p.key] = p.list.some((c) => c.id === colours[p.key]) ? colours[p.key] : p.start;
  return den;
}

const denColour = (key) => { const p = DEN_PAINT.find((x) => x.key === key); return (p.list.find((c) => c.id === profile.den.colours[key]) || p.list[0]); };
const hex = (key) => denColour(key).hex;
// A slightly darker shade, for shadows and edges.
function shade(h, amount = -30) {
  const n = parseInt(h.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amount));
  return '#' + [c(n >> 16), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/* ---------- Drawing the room ---------- */

function bedSvg(style, wood, bedding) {
  const pillow = '<rect x="22" y="44" width="40" height="18" rx="8" fill="#fff" stroke="#e3e3e3"/>';
  const cosy = (y = 0) => `<g transform="translate(0 ${y})">
    <rect x="0" y="10" width="20" height="100" rx="6" fill="${wood}"/><rect x="0" y="72" width="200" height="34" rx="6" fill="${wood}"/>
    <rect x="16" y="56" width="180" height="22" rx="7" fill="#fff"/><rect x="58" y="50" width="138" height="32" rx="9" fill="${bedding}"/>
    <rect x="58" y="74" width="138" height="8" rx="4" fill="${shade(bedding, -25)}"/>${pillow}
    <rect x="6" y="104" width="10" height="12" fill="${shade(wood)}"/><rect x="184" y="104" width="10" height="12" fill="${shade(wood)}"/></g>`;
  if (style === 'bed-bunk') return `<svg viewBox="0 0 200 230" preserveAspectRatio="xMidYMax meet">
    <rect x="0" y="0" width="10" height="230" fill="${shade(wood)}"/><rect x="190" y="0" width="10" height="230" fill="${shade(wood)}"/>
    ${cosy(0)}${cosy(112)}<g fill="${shade(wood, -45)}"><rect x="200" y="30" width="0" height="0"/></g>
    <g stroke="${shade(wood, -50)}" stroke-width="5"><line x1="168" y1="80" x2="168" y2="186"/><line x1="190" y1="80" x2="190" y2="186"/>
    <line x1="168" y1="100" x2="190" y2="100"/><line x1="168" y1="125" x2="190" y2="125"/><line x1="168" y1="150" x2="190" y2="150"/></g></svg>`;
  if (style === 'bed-canopy') return `<svg viewBox="0 0 200 190" preserveAspectRatio="xMidYMax meet">
    <rect x="2" y="0" width="8" height="190" fill="${shade(wood)}"/><rect x="190" y="0" width="8" height="190" fill="${shade(wood)}"/>
    <path d="M0 4 H200 V18 Q150 60 100 22 Q50 60 0 18 Z" fill="${bedding}" opacity=".85"/>
    <path d="M6 18 Q20 90 16 150 L4 150 Z" fill="${bedding}" opacity=".5"/><path d="M194 18 Q180 90 184 150 L196 150 Z" fill="${bedding}" opacity=".5"/>
    <g transform="translate(0 72)">${cosy(0).replace(/^<g transform="translate\(0 0\)">/, '<g>')}</g></svg>`;
  if (style === 'bed-car') return `<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet">
    <path d="M6 100 V62 Q8 40 40 38 H130 Q150 38 165 55 L190 62 Q198 66 198 80 V100 Z" fill="${bedding}"/>
    <rect x="26" y="48" width="130" height="18" rx="7" fill="#fff"/>${pillow.replace('y="44"', 'y="34"')}
    <circle cx="150" cy="80" r="10" fill="#fff"/><text x="150" y="85" font-size="13" text-anchor="middle" font-weight="900" fill="${shade(bedding, -60)}">1</text>
    <circle cx="45" cy="104" r="16" fill="#222"/><circle cx="45" cy="104" r="6" fill="#bbb"/><circle cx="160" cy="104" r="16" fill="#222"/><circle cx="160" cy="104" r="6" fill="#bbb"/>
    <rect x="186" y="70" width="12" height="8" rx="2" fill="#ffe27a"/></svg>`;
  if (style === 'bed-cloud') return `<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet">
    <g fill="#fff" stroke="#dfe9f5" stroke-width="2"><circle cx="30" cy="80" r="30"/><circle cx="80" cy="70" r="36"/><circle cx="130" cy="74" r="34"/><circle cx="172" cy="84" r="26"/><rect x="20" y="78" width="160" height="36" rx="18"/></g>
    <path d="M60 64 Q110 48 186 70 L186 92 Q110 80 60 92 Z" fill="${bedding}"/>${pillow.replace('y="44"', 'y="50"')}</svg>`;
  return `<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet">${cosy(0)}</svg>`;
}

function deskSvg(style, wood) {
  if (style === 'desk-gaming') return `<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet">
    <rect x="70" y="8" width="70" height="44" rx="4" fill="#222"/><rect x="74" y="12" width="62" height="36" rx="2" fill="#3b82f6"/>
    <rect x="100" y="52" width="10" height="10" fill="#333"/><rect x="0" y="60" width="200" height="12" rx="4" fill="#2a2a2a"/>
    <rect x="0" y="70" width="200" height="4" fill="url(#rgb)"/><defs><linearGradient id="rgb"><stop offset="0" stop-color="#ff4f8b"/><stop offset=".5" stop-color="#7c5cff"/><stop offset="1" stop-color="#2ee6d6"/></linearGradient></defs>
    <rect x="8" y="72" width="10" height="46" fill="#222"/><rect x="182" y="72" width="10" height="46" fill="#222"/></svg>`;
  return `<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet">
    <rect x="0" y="56" width="200" height="12" rx="4" fill="${wood}"/><rect x="130" y="68" width="60" height="44" rx="3" fill="${shade(wood, -15)}"/>
    <rect x="138" y="76" width="44" height="12" rx="3" fill="${shade(wood, -35)}"/><rect x="138" y="94" width="44" height="12" rx="3" fill="${shade(wood, -35)}"/>
    <rect x="8" y="68" width="10" height="50" fill="${shade(wood)}"/><rect x="182" y="110" width="10" height="8" fill="${shade(wood)}"/></svg>`;
}

function chairSvg(style, wood, colour) {
  if (style === 'chair-beanbag') return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet"><path d="M10 96 Q0 60 30 40 Q50 20 70 40 Q100 60 90 96 Z" fill="${colour}"/><path d="M28 70 Q50 60 72 70" stroke="${shade(colour, -35)}" stroke-width="4" fill="none"/></svg>`;
  if (style === 'chair-gaming') return `<svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet"><rect x="28" y="2" width="44" height="64" rx="12" fill="#222"/><rect x="42" y="8" width="16" height="52" rx="6" fill="#e8343c"/><rect x="22" y="62" width="56" height="16" rx="6" fill="#333"/><rect x="47" y="78" width="6" height="26" fill="#555"/><path d="M20 112 L50 102 L80 112" stroke="#555" stroke-width="5" fill="none"/></svg>`;
  return `<svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet"><rect x="26" y="4" width="10" height="70" fill="${wood}"/><rect x="26" y="8" width="48" height="10" rx="3" fill="${wood}"/><rect x="26" y="28" width="48" height="8" rx="3" fill="${wood}"/><rect x="20" y="64" width="60" height="12" rx="3" fill="${shade(wood, -15)}"/><rect x="24" y="76" width="8" height="42" fill="${shade(wood)}"/><rect x="68" y="76" width="8" height="42" fill="${shade(wood)}"/></svg>`;
}

function shelfSvg(wood) {
  const books = (y) => ['#e8343c', '#3b82f6', '#ffd65a', '#2e8b57', '#b06cf0', '#ff9f43'].map((c, i) => `<rect x="${10 + i * 13}" y="${y - (i % 2 ? 26 : 30)}" width="11" height="${i % 2 ? 26 : 30}" rx="2" fill="${c}"/>`).join('');
  return `<svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMax meet"><rect x="0" y="0" width="100" height="200" rx="4" fill="${wood}"/><rect x="6" y="6" width="88" height="188" fill="${shade(wood, -35)}"/>
    ${[66, 128, 190].map((y) => `<rect x="4" y="${y}" width="92" height="6" fill="${wood}"/>`).join('')}${books(66)}${books(128)}</svg>`;
}

function rugHtml(style, colour) {
  if (style === 'rug-none') return '';
  if (style === 'rug-rainbow') return `<div class="den-rug" style="background:radial-gradient(ellipse at 50% 100%,#ff8a8a 0 20%,#ffd17a 20% 36%,#fff59a 36% 52%,#a8f0a0 52% 66%,#8bd5ff 66% 80%,#c7a8ff 80% 100%);border-radius:50% 50% 8px 8px / 100% 100% 8px 8px"></div>`;
  if (style === 'rug-star') return `<div class="den-rug" style="background:${colour};clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"></div>`;
  return `<div class="den-rug" style="background:radial-gradient(circle,${shade(colour, 20)} 0 30%,${colour} 30% 60%,${shade(colour, -20)} 60%);border-radius:50%"></div>`;
}

function wallpaperCss(id, wall) {
  const light = 'rgba(255,255,255,.45)';
  if (id === 'wp-stripes') return `repeating-linear-gradient(90deg,${light} 0 14px,transparent 14px 28px),${wall}`;
  if (id === 'wp-polka') return `radial-gradient(${light} 22%,transparent 24%) 0 0/26px 26px,${wall}`;
  if (id === 'wp-stars') return `radial-gradient(rgba(255,255,255,.8) 1.6px,transparent 2px) 0 0/24px 24px,radial-gradient(rgba(255,255,255,.6) 1.2px,transparent 1.8px) 12px 12px/24px 24px,${wall}`;
  if (id === 'wp-clouds') return `radial-gradient(circle at 25% 40%,${light} 0 9%,transparent 10%) 0 0/120px 70px,radial-gradient(circle at 40% 36%,${light} 0 11%,transparent 12%) 0 0/120px 70px,${wall}`;
  if (id === 'wp-hearts') return `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><text x="6" y="20" font-size="14" fill="white" fill-opacity=".55">♥</text></svg>')}") 0 0/28px 28px,${wall}`;
  return wall;
}

function floorCss(id) {
  const wood = '#d9a066';
  if (id === 'fl-dark') return 'repeating-linear-gradient(90deg,#7a4a2a 0 46px,#5e3820 46px 48px)';
  if (id === 'fl-carpet') return `radial-gradient(rgba(255,255,255,.18) 1px,transparent 1.5px) 0 0/6px 6px,${hex('carpet')}`;
  if (id === 'fl-tiles') return 'repeating-conic-gradient(#ffffff 0 25%,#d8dde6 0 50%) 0 0/36px 36px';
  if (id === 'fl-grass') return 'repeating-linear-gradient(100deg,#7ccf6b 0 10px,#6fc15e 10px 20px)';
  return `repeating-linear-gradient(90deg,${wood} 0 46px,#c58b52 46px 48px)`;
}

function renderDen() {
  const den = profile.den;
  const room = $('denRoom');
  if (!room) return;
  $('denTitle').textContent = `🏠 ${profile.petName}’s Den`;
  const wood = hex('wood');
  const bedding = hex('bedding');
  const sky = DEN_SKIES.find((s) => s.id === den.colours.sky).css;
  const suit = SUITS_BY_ID[profile.petSuit];
  const parts = [];
  parts.push(`<div class="den-wall" style="background:${wallpaperCss(den.wallpaper, hex('wall'))}"></div>`);
  parts.push(`<div class="den-floor" style="background:${floorCss(den.floor)}"></div>`);
  parts.push(`<div class="den-window"><div class="den-sky" style="background:${sky}"></div><div class="den-curtain left" style="background:${hex('curtains')}"></div><div class="den-curtain right" style="background:${hex('curtains')}"></div><div class="den-sill" style="background:${wood}"></div></div>`);
  if (den.poster !== 'poster-none') parts.push(`<div class="den-poster" style="border-color:${wood}">${DEN_ITEMS_BY_ID[den.poster].icon}</div>`);
  if (den.lamp === 'lamp-fairy') parts.push(`<div class="den-fairy">${'<i></i>'.repeat(16)}</div>`);
  if (den.shelf === 'shelf-books') parts.push(`<div class="den-shelf">${shelfSvg(wood)}</div>`);
  if (den.desk !== 'desk-none') parts.push(`<div class="den-desk">${deskSvg(den.desk, wood)}</div>`);
  if (den.chair !== 'chair-none') parts.push(`<div class="den-chair">${chairSvg(den.chair, wood, hex('rug'))}</div>`);
  if (den.lamp === 'lamp-desk') parts.push('<div class="den-lamp desk">💡</div>');
  if (den.lamp === 'lamp-lava') parts.push(`<div class="den-lamp lava"><svg viewBox="0 0 40 100"><path d="M12 10 H28 L34 70 H6 Z" fill="#ff6aa6" opacity=".85"/><circle cx="20" cy="40" r="6" fill="#ffd65a"/><circle cx="16" cy="58" r="5" fill="#ffd65a"/><rect x="10" y="0" width="20" height="10" rx="3" fill="#888"/><path d="M6 70 H34 L30 100 H10 Z" fill="#666"/></svg></div>`);
  parts.push(`<div class="den-bed${den.bed === 'bed-bunk' ? ' bunk' : den.bed === 'bed-canopy' ? ' canopy' : ''}">${bedSvg(den.bed, wood, bedding)}</div>`);
  parts.push(rugHtml(den.rug, hex('rug')));
  for (const id of den.decor) {
    const item = DEN_ITEMS_BY_ID[id];
    // Desk and shelf ornaments go on the floor if there is no desk or bookshelf to stand on.
    const missing = (item.on === 'desk' && den.desk === 'desk-none') || (item.on === 'shelf' && den.shelf === 'shelf-none');
    const [x, y] = missing ? item.floor : item.at;
    parts.push(`<span class="den-decor" style="left:${x}%;bottom:${y}%">${item.icon}</span>`);
  }
  parts.push(`<span class="den-fox"><span class="den-fox-hat">${suit ? suit.hat : ''}</span>🦊<span class="den-fox-prop">${suit ? suit.prop : ''}</span></span>`);
  room.innerHTML = parts.join('');   // built only from the fixed choices above
  if (!$('denEditor').hidden) renderDenEditor();
}

/* ---------- Decorating ---------- */

let denTab = 'paint';
let denPending = null;
let denPendingTimer = null;

function denOwns(id) { const item = DEN_ITEMS_BY_ID[id]; return item.price === 0 || profile.den.owned.includes(id); }
function denUsing(id) { const item = DEN_ITEMS_BY_ID[id]; return item.slot === 'decor' ? profile.den.decor.includes(id) : profile.den[item.slot] === id; }

function denMessage(text) { $('denMessage').textContent = text; }

function chooseDenColour(key, id) {
  profile.den.colours[key] = id;
  saveProfile();
  tone(880, 0.05);
}

function useDenItem(id) {
  const item = DEN_ITEMS_BY_ID[id];
  if (!denOwns(id)) return;
  if (item.slot === 'decor') {
    const on = profile.den.decor.includes(id);
    profile.den.decor = on ? profile.den.decor.filter((x) => x !== id) : [...profile.den.decor, id];
  } else {
    profile.den[item.slot] = id;
  }
  saveProfile();
  tone(760, 0.06);
}

// Buying takes two taps, like the shop.
function buyDenItem(id) {
  const item = DEN_ITEMS_BY_ID[id];
  if (denOwns(id) || profile.points < item.price) return;
  if (denPending !== id) {
    clearTimeout(denPendingTimer);
    denPending = id;
    denPendingTimer = setTimeout(() => { denPending = null; renderDenEditor(); }, 5000);
    renderDenEditor();
    return;
  }
  clearTimeout(denPendingTimer);
  denPending = null;
  profile.points -= item.price;
  profile.den.owned.push(id);
  useDenItem(id);                    // put it straight into the room (also saves)
  celebrate(`🏠 You got the ${item.name} for ${profile.petName}’s den!`);
  tone(900, 0.16);
}

function renderDenEditor() {
  const tabs = $('denTabs');
  tabs.textContent = '';
  for (const t of DEN_TABS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'shop-tab'; b.setAttribute('role', 'tab');
    b.textContent = t.name;
    b.setAttribute('aria-selected', String(t.id === denTab));
    b.addEventListener('click', () => { denTab = t.id; denPending = null; renderDenEditor(); });
    tabs.appendChild(b);
  }
  const box = $('denOptions');
  box.textContent = '';
  if (denTab === 'paint') {
    for (const p of DEN_PAINT) {
      const row = document.createElement('div'); row.className = 'den-paint-row';
      const label = document.createElement('strong'); label.textContent = p.name;
      const swatches = document.createElement('div'); swatches.className = 'den-swatches';
      for (const c of p.list) {
        const s = document.createElement('button');
        s.type = 'button';
        const on = profile.den.colours[p.key] === c.id;
        s.className = 'den-swatch' + (on ? ' on' : '') + (p.key === 'sky' ? ' wide' : '');
        if (c.hex) s.style.background = c.hex; else { s.style.background = c.css; s.textContent = c.name; }
        s.setAttribute('aria-label', `${p.name}: ${c.name}`);
        s.setAttribute('aria-pressed', String(on));
        s.addEventListener('click', () => chooseDenColour(p.key, c.id));
        swatches.appendChild(s);
      }
      row.append(label, swatches);
      box.appendChild(row);
    }
    return;
  }
  const slots = DEN_TABS.find((t) => t.id === denTab).slots;
  const grid = document.createElement('div'); grid.className = 'den-item-grid';
  for (const item of DEN_ITEMS.filter((i) => slots.includes(i.slot))) {
    const owned = denOwns(item.id);
    const using = denUsing(item.id);
    const card = document.createElement('div');
    card.className = 'den-item' + (using ? ' using' : '');
    const icon = document.createElement('span'); icon.className = 'den-item-icon'; icon.textContent = item.icon;
    const name = document.createElement('strong'); name.textContent = item.name;
    const price = document.createElement('small'); price.textContent = item.price ? (owned ? 'Owned' : `${item.price.toLocaleString()} points`) : 'Free';
    const btn = document.createElement('button'); btn.type = 'button';
    if (owned) {
      if (item.slot === 'decor') { btn.textContent = using ? 'Hide' : 'Show'; btn.setAttribute('aria-label', `${using ? 'Hide' : 'Show'} ${item.name}`); }
      else { btn.textContent = using ? 'Using ✓' : 'Use'; btn.setAttribute('aria-label', `${using ? 'Using' : 'Use'} ${item.name}`); }
      btn.className = 'owned';
      btn.disabled = using && item.slot !== 'decor';
      btn.addEventListener('click', () => useDenItem(item.id));
    } else {
      const short = item.price - profile.points;
      const confirming = denPending === item.id;
      btn.textContent = short > 0 ? `Need ${short.toLocaleString()} more` : confirming ? 'Tap again to buy' : 'Buy';
      if (confirming) btn.className = 'confirm';
      btn.disabled = short > 0;
      btn.setAttribute('aria-label', confirming ? `Confirm: buy ${item.name}` : `Buy ${item.name} for ${item.price} points`);
      btn.addEventListener('click', () => buyDenItem(item.id));
    }
    card.append(icon, name, price, btn);
    grid.appendChild(card);
  }
  box.appendChild(grid);
}

document.getElementById('denEditBtn').addEventListener('click', () => {
  const editor = document.getElementById('denEditor');
  editor.hidden = !editor.hidden;
  document.getElementById('denEditBtn').setAttribute('aria-expanded', String(!editor.hidden));
  document.getElementById('denEditBtn').textContent = editor.hidden ? '🎨 Decorate' : '✅ Done decorating';
  if (!editor.hidden) renderDenEditor();
});
