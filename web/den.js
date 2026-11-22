// Fox's Den: a bedroom for the pet fox that the player decorates.
// Colours are free to change; furniture and decorations are bought with points.
// Everything placed in the room can be dragged to a new spot ("Move things").
// A four-legged fox trots around the floor and now and then curls up for a nap.
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
  { key: 'sofa', name: 'Sofa & armchair', list: DEN_COLOURS, start: 'navy' },
  { key: 'wood', name: 'Furniture', list: DEN_WOODS, start: 'light' },
  { key: 'sky', name: 'Window view', list: DEN_SKIES, start: 'day' },
];

// Furniture and decorations. Slots hold one choice; 'decor' items can all be shown at once.
// "at" is where a decoration starts (left %, bottom %); everything can be moved later.
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
  { id: 'wardrobe-none', slot: 'wardrobe', name: 'No wardrobe', icon: '✖️', price: 0 },
  { id: 'wardrobe-wood', slot: 'wardrobe', name: 'Wooden wardrobe', icon: '🚪', price: 1200 },
  { id: 'wardrobe-princess', slot: 'wardrobe', name: 'Princess wardrobe', icon: '🏰', price: 2200 },
  { id: 'sofa-none', slot: 'sofa', name: 'No sofa', icon: '✖️', price: 0 },
  { id: 'sofa-armchair', slot: 'sofa', name: 'Comfy armchair', icon: '💺', price: 900 },
  { id: 'sofa-couch', slot: 'sofa', name: 'Sofa', icon: '🛋️', price: 1500 },
  { id: 'bedside-none', slot: 'bedside', name: 'No bedside table', icon: '✖️', price: 0 },
  { id: 'bedside-table', slot: 'bedside', name: 'Bedside table', icon: '🗄️', price: 400 },
  { id: 'tv-none', slot: 'tv', name: 'No TV', icon: '✖️', price: 0 },
  { id: 'tv-set', slot: 'tv', name: 'TV on a stand', icon: '📺', price: 1800 },
  { id: 'poster-none', slot: 'poster', name: 'No poster', icon: '✖️', price: 0 },
  { id: 'poster-cat', slot: 'poster', name: 'Cat poster', icon: '🐱', price: 300 },
  { id: 'poster-rainbow', slot: 'poster', name: 'Rainbow poster', icon: '🌈', price: 300 },
  { id: 'poster-unicorn', slot: 'poster', name: 'Unicorn poster', icon: '🦄', price: 400 },
  { id: 'poster-football', slot: 'poster', name: 'Football poster', icon: '⚽', price: 400 },
  { id: 'poster-space', slot: 'poster', name: 'Space poster', icon: '🚀', price: 500 },
  // Things the den fox can wear (one per place: head, face, neck, ear).
  { id: 'head-none', slot: 'wear-head', name: 'No hat', icon: '✖️', price: 0 },
  { id: 'head-cap', slot: 'wear-head', name: 'Cap', icon: '🧢', price: 200 },
  { id: 'head-tophat', slot: 'wear-head', name: 'Top hat', icon: '🎩', price: 500 },
  { id: 'head-headphones', slot: 'wear-head', name: 'Headphones', icon: '🎧', price: 600 },
  { id: 'head-crown', slot: 'wear-head', name: 'Crown', icon: '👑', price: 2000 },
  { id: 'face-none', slot: 'wear-face', name: 'Nothing on face', icon: '✖️', price: 0 },
  { id: 'face-glasses', slot: 'wear-face', name: 'Glasses', icon: '👓', price: 250 },
  { id: 'face-sunglasses', slot: 'wear-face', name: 'Sunglasses', icon: '🕶️', price: 350 },
  { id: 'neck-none', slot: 'wear-neck', name: 'No scarf', icon: '✖️', price: 0 },
  { id: 'neck-scarf', slot: 'wear-neck', name: 'Scarf', icon: '🧣', price: 300 },
  { id: 'neck-medal', slot: 'wear-neck', name: 'Gold medal', icon: '🏅', price: 800 },
  { id: 'ear-none', slot: 'wear-ear', name: 'Nothing on ear', icon: '✖️', price: 0 },
  { id: 'ear-flower', slot: 'wear-ear', name: 'Flower', icon: '🌸', price: 150 },
  { id: 'ear-bow', slot: 'wear-ear', name: 'Bow', icon: '🎀', price: 150 },
  // Decorations.
  { id: 'dec-books', slot: 'decor', name: 'Pile of books', icon: '📚', price: 150, at: [77, 26] },
  { id: 'dec-candle', slot: 'decor', name: 'Candle', icon: '🕯️', price: 150, at: [45, 26] },
  { id: 'dec-cupcake', slot: 'decor', name: 'Cupcake', icon: '🧁', price: 150, at: [72, 26] },
  { id: 'dec-plant', slot: 'decor', name: 'Plant', icon: '🪴', price: 200, at: [24, 44] },
  { id: 'dec-balloons', slot: 'decor', name: 'Balloons', icon: '🎈', price: 200, at: [2, 60] },
  { id: 'dec-sunflower', slot: 'decor', name: 'Sunflower', icon: '🌻', price: 200, at: [30, 3] },
  { id: 'dec-ball', slot: 'decor', name: 'Football', icon: '⚽', price: 250, at: [33, 2] },
  { id: 'dec-basket', slot: 'decor', name: 'Basketball', icon: '🏀', price: 250, at: [38, 1] },
  { id: 'dec-cactus', slot: 'decor', name: 'Cactus', icon: '🌵', price: 250, at: [52, 26] },
  { id: 'dec-teddy', slot: 'decor', name: 'Teddy bear', icon: '🧸', price: 300, at: [8, 28] },
  { id: 'dec-puzzle', slot: 'decor', name: 'Jigsaw puzzle', icon: '🧩', price: 300, at: [46, 1] },
  { id: 'dec-clock', slot: 'decor', name: 'Clock', icon: '🕰️', price: 350, at: [57, 74] },
  { id: 'dec-picture', slot: 'decor', name: 'Framed picture', icon: '🖼️', price: 350, at: [66, 70] },
  { id: 'dec-globe', slot: 'decor', name: 'Globe', icon: '🌍', price: 400, at: [86, 66] },
  { id: 'dec-kite', slot: 'decor', name: 'Kite', icon: '🪁', price: 400, at: [30, 72] },
  { id: 'dec-radio', slot: 'decor', name: 'Radio', icon: '📻', price: 450, at: [88, 30] },
  { id: 'dec-mirror', slot: 'decor', name: 'Mirror', icon: '🪞', price: 500, at: [48, 56] },
  { id: 'dec-skates', slot: 'decor', name: 'Roller skates', icon: '🛼', price: 500, at: [58, 2] },
  { id: 'dec-paint', slot: 'decor', name: 'Paint set', icon: '🎨', price: 550, at: [64, 26] },
  { id: 'dec-skate', slot: 'decor', name: 'Skateboard', icon: '🛹', price: 600, at: [66, 1] },
  { id: 'dec-camera', slot: 'decor', name: 'Camera', icon: '📷', price: 600, at: [82, 26] },
  { id: 'dec-dino', slot: 'decor', name: 'Toy dinosaur', icon: '🦖', price: 700, at: [24, 2] },
  { id: 'dec-fish', slot: 'decor', name: 'Fish tank', icon: '🐠', price: 800, at: [87, 48] },
  { id: 'dec-drum', slot: 'decor', name: 'Drum', icon: '🥁', price: 800, at: [74, 3] },
  { id: 'dec-guitar', slot: 'decor', name: 'Guitar', icon: '🎸', price: 900, at: [52, 14] },
  { id: 'dec-console', slot: 'decor', name: 'Games console', icon: '🎮', price: 900, at: [60, 26] },
  { id: 'dec-trophy', slot: 'decor', name: 'Trophy', icon: '🏆', price: 1000, at: [91, 34] },
  { id: 'dec-violin', slot: 'decor', name: 'Violin', icon: '🎻', price: 1000, at: [16, 40] },
  { id: 'dec-rocket', slot: 'decor', name: 'Toy rocket', icon: '🚀', price: 1100, at: [86, 19] },
  { id: 'dec-laptop', slot: 'decor', name: 'Laptop', icon: '💻', price: 1200, at: [68, 26] },
  { id: 'dec-castle', slot: 'decor', name: 'Toy castle', icon: '🏰', price: 1300, at: [80, 2] },
  { id: 'dec-robot', slot: 'decor', name: 'Toy robot', icon: '🤖', price: 1500, at: [92, 3] },
  { id: 'dec-cat', slot: 'decor', name: 'Pet cat', icon: '🐈', price: 1500, at: [14, 4] },
  { id: 'dec-puppy', slot: 'decor', name: 'Pet puppy', icon: '🐕', price: 1500, at: [86, 4] },
  { id: 'dec-piano', slot: 'decor', name: 'Keyboard piano', icon: '🎹', price: 1800, at: [43, 40] },
  { id: 'dec-unicorn', slot: 'decor', name: 'Unicorn toy', icon: '🦄', price: 2000, at: [4, 6] },
  { id: 'dec-crown', slot: 'decor', name: 'Golden crown', icon: '👑', price: 3000, at: [16, 50] },
];
const DEN_ITEMS_BY_ID = Object.fromEntries(DEN_ITEMS.map((i) => [i.id, i]));
const WEAR_SLOTS = ['wear-head', 'wear-face', 'wear-neck', 'wear-ear'];
const DEN_SLOTS = ['wallpaper', 'floor', 'bed', 'rug', 'desk', 'chair', 'lamp', 'shelf', 'wardrobe', 'sofa', 'bedside', 'tv', 'poster', ...WEAR_SLOTS];
const DEN_START = {
  wallpaper: 'wp-plain', floor: 'fl-wood', bed: 'bed-cosy', rug: 'rug-none', desk: 'desk-none', chair: 'chair-none', lamp: 'lamp-none',
  shelf: 'shelf-none', wardrobe: 'wardrobe-none', sofa: 'sofa-none', bedside: 'bedside-none', tv: 'tv-none', poster: 'poster-none',
  'wear-head': 'head-none', 'wear-face': 'face-none', 'wear-neck': 'neck-none', 'wear-ear': 'ear-none',
};
// Where each piece of furniture starts (left %, bottom %). It can be dragged somewhere else.
const DEN_PLACES = {
  bed: [2, 5], rug: [36, 2], desk: [55, 12], chair: [59, 7], shelf: [84, 16], wardrobe: [43, 16], sofa: [62, 4],
  bedside: [41, 8], tv: [28, 10], poster: [38, 68], lamp: [58, 34],
};
// The decorate menu.
const DEN_TABS = [
  { id: 'paint', name: '🎨 Colours' },
  { id: 'beds', name: '🛏️ Beds', slots: ['bed', 'bedside'] },
  { id: 'furniture', name: '🪑 Furniture', slots: ['desk', 'chair', 'sofa', 'wardrobe', 'shelf', 'tv', 'lamp'] },
  { id: 'decor', name: '🧸 Decorations', slots: ['decor'] },
  { id: 'outfit', name: '🦊 Fox outfit', slots: WEAR_SLOTS },
  { id: 'walls', name: '🖼️ Walls & floor', slots: ['wallpaper', 'floor', 'rug', 'poster'] },
];

/* ---------- Saved den ---------- */

function sanitizeDen(d) {
  if (!d || typeof d !== 'object') d = {};
  const owned = Array.isArray(d.owned) ? [...new Set(d.owned.filter((id) => DEN_ITEMS_BY_ID[id] && DEN_ITEMS_BY_ID[id].price > 0))] : [];
  const has = (id) => DEN_ITEMS_BY_ID[id] && (DEN_ITEMS_BY_ID[id].price === 0 || owned.includes(id));
  const den = { owned, decor: [], colours: {}, pos: {} };
  for (const slot of DEN_SLOTS) den[slot] = has(d[slot]) && DEN_ITEMS_BY_ID[d[slot]].slot === slot ? d[slot] : DEN_START[slot];
  den.decor = Array.isArray(d.decor) ? [...new Set(d.decor.filter((id) => owned.includes(id) && DEN_ITEMS_BY_ID[id].slot === 'decor'))] : [];
  const colours = d.colours && typeof d.colours === 'object' ? d.colours : {};
  for (const p of DEN_PAINT) den.colours[p.key] = p.list.some((c) => c.id === colours[p.key]) ? colours[p.key] : p.start;
  // Which suit the den fox wears: the same as the pet, none, or a particular owned suit.
  den.suit = d.suit === 'none' || (typeof d.suit === 'string' && SUITS_BY_ID[d.suit]) ? d.suit : 'pet';
  // Moved positions: { bed: [left%, bottom%], "dec-teddy": [...] }
  const pos = d.pos && typeof d.pos === 'object' ? d.pos : {};
  for (const [key, xy] of Object.entries(pos)) {
    const known = DEN_PLACES[key] || (DEN_ITEMS_BY_ID[key] && DEN_ITEMS_BY_ID[key].slot === 'decor');
    if (known && Array.isArray(xy) && xy.length === 2 && xy.every((n) => Number.isFinite(n) && n >= -10 && n <= 100)) den.pos[key] = [Number(xy[0]), Number(xy[1])];
  }
  return den;
}

const denColour = (key) => { const p = DEN_PAINT.find((x) => x.key === key); return (p.list.find((c) => c.id === profile.den.colours[key]) || p.list[0]); };
const hex = (key) => denColour(key).hex;
// A slightly darker (or lighter) shade, for shadows and edges.
function shade(h, amount = -30) {
  const n = parseInt(h.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amount));
  return '#' + [c(n >> 16), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/* ---------- Drawing furniture ---------- */

function bedSvg(style, wood, bedding) {
  const pillow = '<rect x="22" y="44" width="40" height="18" rx="8" fill="#fff" stroke="#e3e3e3"/>';
  const cosy = (y = 0) => `<g transform="translate(0 ${y})">
    <rect x="0" y="10" width="20" height="100" rx="6" fill="${wood}"/><rect x="0" y="72" width="200" height="34" rx="6" fill="${wood}"/>
    <rect x="16" y="56" width="180" height="22" rx="7" fill="#fff"/><rect x="58" y="50" width="138" height="32" rx="9" fill="${bedding}"/>
    <rect x="58" y="74" width="138" height="8" rx="4" fill="${shade(bedding, -25)}"/>${pillow}
    <rect x="6" y="104" width="10" height="12" fill="${shade(wood)}"/><rect x="184" y="104" width="10" height="12" fill="${shade(wood)}"/></g>`;
  if (style === 'bed-bunk') return `<svg viewBox="0 0 200 230" preserveAspectRatio="xMidYMax meet">
    <rect x="0" y="0" width="10" height="230" fill="${shade(wood)}"/><rect x="190" y="0" width="10" height="230" fill="${shade(wood)}"/>
    ${cosy(0)}${cosy(112)}
    <g stroke="${shade(wood, -50)}" stroke-width="5"><line x1="168" y1="80" x2="168" y2="186"/><line x1="190" y1="80" x2="190" y2="186"/>
    <line x1="168" y1="100" x2="190" y2="100"/><line x1="168" y1="125" x2="190" y2="125"/><line x1="168" y1="150" x2="190" y2="150"/></g></svg>`;
  if (style === 'bed-canopy') return `<svg viewBox="0 0 200 190" preserveAspectRatio="xMidYMax meet">
    <rect x="2" y="0" width="8" height="190" fill="${shade(wood)}"/><rect x="190" y="0" width="8" height="190" fill="${shade(wood)}"/>
    <path d="M0 4 H200 V18 Q150 60 100 22 Q50 60 0 18 Z" fill="${bedding}" opacity=".85"/>
    <path d="M6 18 Q20 90 16 150 L4 150 Z" fill="${bedding}" opacity=".5"/><path d="M194 18 Q180 90 184 150 L196 150 Z" fill="${bedding}" opacity=".5"/>
    <g transform="translate(0 72)">${cosy(0)}</g></svg>`;
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
    <rect x="0" y="70" width="200" height="4" fill="#7c5cff"/><rect x="0" y="70" width="70" height="4" fill="#ff4f8b"/><rect x="130" y="70" width="70" height="4" fill="#2ee6d6"/>
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

function wardrobeSvg(style, wood) {
  if (style === 'wardrobe-princess') return `<svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMax meet">
    <path d="M4 196 V40 Q50 -6 96 40 V196 Z" fill="#f7b6cf" stroke="#e48fb3" stroke-width="3"/><line x1="50" y1="30" x2="50" y2="186" stroke="#e48fb3" stroke-width="3"/>
    <circle cx="43" cy="110" r="4" fill="#ffd65a"/><circle cx="57" cy="110" r="4" fill="#ffd65a"/><text x="50" y="62" font-size="22" text-anchor="middle">💖</text>
    <rect x="8" y="186" width="10" height="10" fill="#e48fb3"/><rect x="82" y="186" width="10" height="10" fill="#e48fb3"/></svg>`;
  return `<svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMax meet"><rect x="4" y="6" width="92" height="184" rx="4" fill="${wood}"/>
    <rect x="10" y="14" width="38" height="166" rx="3" fill="${shade(wood, -12)}"/><rect x="52" y="14" width="38" height="166" rx="3" fill="${shade(wood, -12)}"/>
    <circle cx="44" cy="100" r="4" fill="${shade(wood, -60)}"/><circle cx="56" cy="100" r="4" fill="${shade(wood, -60)}"/>
    <rect x="8" y="190" width="10" height="8" fill="${shade(wood, -30)}"/><rect x="82" y="190" width="10" height="8" fill="${shade(wood, -30)}"/></svg>`;
}

function sofaSvg(style, colour) {
  const dark = shade(colour, -30);
  if (style === 'sofa-armchair') return `<svg viewBox="0 0 100 90" preserveAspectRatio="xMidYMax meet">
    <rect x="14" y="8" width="72" height="50" rx="16" fill="${dark}"/><rect x="4" y="34" width="20" height="44" rx="10" fill="${colour}"/><rect x="76" y="34" width="20" height="44" rx="10" fill="${colour}"/>
    <rect x="20" y="46" width="60" height="26" rx="8" fill="${colour}"/><rect x="12" y="78" width="6" height="10" fill="#555"/><rect x="82" y="78" width="6" height="10" fill="#555"/></svg>`;
  return `<svg viewBox="0 0 200 90" preserveAspectRatio="xMidYMax meet">
    <rect x="14" y="6" width="172" height="50" rx="16" fill="${dark}"/><rect x="2" y="32" width="26" height="46" rx="12" fill="${colour}"/><rect x="172" y="32" width="26" height="46" rx="12" fill="${colour}"/>
    <rect x="24" y="44" width="76" height="28" rx="8" fill="${colour}"/><rect x="100" y="44" width="76" height="28" rx="8" fill="${colour}"/>
    <rect x="40" y="18" width="30" height="24" rx="8" fill="#ffd65a"/><rect x="130" y="18" width="30" height="24" rx="8" fill="#fff"/>
    <rect x="12" y="78" width="8" height="10" fill="#555"/><rect x="180" y="78" width="8" height="10" fill="#555"/></svg>`;
}

function bedsideSvg(wood) {
  return `<svg viewBox="0 0 60 70" preserveAspectRatio="xMidYMax meet"><rect x="2" y="4" width="56" height="54" rx="4" fill="${wood}"/>
    <rect x="8" y="12" width="44" height="18" rx="3" fill="${shade(wood, -20)}"/><rect x="8" y="34" width="44" height="18" rx="3" fill="${shade(wood, -20)}"/>
    <circle cx="30" cy="21" r="3" fill="${shade(wood, -60)}"/><circle cx="30" cy="43" r="3" fill="${shade(wood, -60)}"/>
    <rect x="6" y="58" width="6" height="10" fill="${shade(wood, -35)}"/><rect x="48" y="58" width="6" height="10" fill="${shade(wood, -35)}"/></svg>`;
}

function tvSvg(wood) {
  return `<svg viewBox="0 0 120 100" preserveAspectRatio="xMidYMax meet"><rect x="10" y="2" width="100" height="58" rx="5" fill="#222"/>
    <rect x="15" y="7" width="90" height="48" rx="2" fill="#5ab0ff"/><circle cx="45" cy="30" r="10" fill="#ffd65a"/><path d="M15 55 L45 32 L65 48 L80 38 L105 55 Z" fill="#45c69c"/>
    <rect x="56" y="60" width="8" height="8" fill="#333"/><rect x="0" y="68" width="120" height="30" rx="4" fill="${wood}"/>
    <rect x="8" y="74" width="48" height="18" rx="3" fill="${shade(wood, -20)}"/><rect x="64" y="74" width="48" height="18" rx="3" fill="${shade(wood, -20)}"/></svg>`;
}

function rugHtml(style, colour) {
  if (style === 'rug-rainbow') return 'background:radial-gradient(ellipse at 50% 100%,#ff8a8a 0 20%,#ffd17a 20% 36%,#fff59a 36% 52%,#a8f0a0 52% 66%,#8bd5ff 66% 80%,#c7a8ff 80% 100%);border-radius:50% 50% 8px 8px / 100% 100% 8px 8px';
  if (style === 'rug-star') return `background:${colour};clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)`;
  return `background:radial-gradient(circle,${shade(colour, 20)} 0 30%,${colour} 30% 60%,${shade(colour, -20)} 60%);border-radius:50%`;
}

// Wallpaper patterns sit on top of the wall colour. (The heart pattern is a tiny SVG picture; it uses
// single quotes inside url() so it can't clash with the double-quoted style="…" it is written into.)
function wallpaperCss(id, wall) {
  const light = 'rgba(255,255,255,.45)';
  if (id === 'wp-stripes') return `repeating-linear-gradient(90deg,${light} 0 14px,transparent 14px 28px),${wall}`;
  if (id === 'wp-polka') return `radial-gradient(${light} 22%,transparent 24%) 0 0/26px 26px,${wall}`;
  if (id === 'wp-stars') return `radial-gradient(rgba(255,255,255,.8) 1.6px,transparent 2px) 0 0/24px 24px,radial-gradient(rgba(255,255,255,.6) 1.2px,transparent 1.8px) 12px 12px/24px 24px,${wall}`;
  if (id === 'wp-clouds') return `radial-gradient(circle at 25% 40%,${light} 0 9%,transparent 10%) 0 0/120px 70px,radial-gradient(circle at 40% 36%,${light} 0 11%,transparent 12%) 0 0/120px 70px,${wall}`;
  if (id === 'wp-hearts') {
    const heart = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><path d="M15 25 C4 17 3 10 8 7 C11 5 14 7 15 10 C16 7 19 5 22 7 C27 10 26 17 15 25 Z" fill="white" fill-opacity="0.6"/></svg>';
    return `url('data:image/svg+xml,${encodeURIComponent(heart)}') 0 0/30px 30px,${wall}`;
  }
  return wall;
}

function floorCss(id) {
  if (id === 'fl-dark') return 'repeating-linear-gradient(90deg,#7a4a2a 0 46px,#5e3820 46px 48px)';
  if (id === 'fl-carpet') return `radial-gradient(rgba(255,255,255,.18) 1px,transparent 1.5px) 0 0/6px 6px,${hex('carpet')}`;
  if (id === 'fl-tiles') return 'repeating-conic-gradient(#ffffff 0 25%,#d8dde6 0 50%) 0 0/36px 36px';
  if (id === 'fl-grass') return 'repeating-linear-gradient(100deg,#7ccf6b 0 10px,#6fc15e 10px 20px)';
  return 'repeating-linear-gradient(90deg,#d9a066 0 46px,#c58b52 46px 48px)';
}

/* ---------- The four-legged fox ---------- */
// A side-view fox (facing right). CSS classes "walking" and "sleeping" animate it.
const FOX_SVG = `<svg viewBox="0 0 140 90" class="fox-svg" aria-hidden="true">
  <g class="fox-tail"><path d="M36 52 C14 52 4 34 12 18 C22 26 26 40 44 44 Z" fill="#f28a2e"/><path d="M12 18 C6 26 6 33 11 38 C13 31 16 26 21 23 Z" fill="#fff"/></g>
  <g class="leg leg-b2"><rect x="50" y="52" width="8" height="26" rx="4" fill="#d97420"/><rect x="50" y="68" width="8" height="10" rx="4" fill="#2d211b"/></g>
  <g class="leg leg-f2"><rect x="92" y="52" width="8" height="26" rx="4" fill="#d97420"/><rect x="92" y="68" width="8" height="10" rx="4" fill="#2d211b"/></g>
  <ellipse class="fox-body" cx="70" cy="50" rx="34" ry="15" fill="#f28a2e"/>
  <ellipse cx="78" cy="58" rx="22" ry="6" fill="#fff3e6"/>
  <g class="leg leg-b1"><rect x="40" y="52" width="8" height="27" rx="4" fill="#f28a2e"/><rect x="40" y="69" width="8" height="10" rx="4" fill="#3b2a20"/></g>
  <g class="leg leg-f1"><rect x="84" y="52" width="8" height="27" rx="4" fill="#f28a2e"/><rect x="84" y="69" width="8" height="10" rx="4" fill="#3b2a20"/></g>
  <g class="fox-head">
    <path d="M98 26 L101 6 L111 22 Z" fill="#f28a2e"/><path d="M100 15 L101 7 L106 15 Z" fill="#3b2a20"/>
    <path d="M108 24 L117 6 L120 26 Z" fill="#e57d24"/><path d="M114 13 L117 7 L118 15 Z" fill="#3b2a20"/>
    <circle cx="108" cy="34" r="15" fill="#f28a2e"/>
    <path d="M100 38 Q112 52 134 41 Q122 33 106 34 Z" fill="#fff"/>
    <path d="M110 30 Q124 30 134 38 Q122 38 108 37 Z" fill="#f28a2e"/>
    <circle cx="134.5" cy="38.5" r="3.2" fill="#2a1c1c"/>
    <ellipse class="fox-eye" cx="114" cy="30" rx="2.2" ry="3" fill="#2a1c1c"/>
    <path class="fox-eye-shut" d="M111 30 Q114 33.5 117 30" stroke="#2a1c1c" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

let denFox = null;       // the fox element (kept between redraws so its walk isn't interrupted)
let foxTimer = null;
let foxX = 46;
let foxWalks = 0;
let foxNapAfter = 3;

function makeDenFox() {
  const el = document.createElement('div');
  el.className = 'den-walker';
  el.style.left = foxX + '%';
  el.innerHTML = `<div class="den-walker-body">${FOX_SVG}<span class="fox-wear neck"></span><span class="fox-wear face"></span><span class="fox-wear ear"></span><span class="fox-wear head den-fox-hat"></span></div><span class="den-zzz" aria-hidden="true">💤</span>`;
  return el;
}

// Walk somewhere, look around, walk again… and every few walks, curl up for a nap.
function foxStep() {
  clearTimeout(foxTimer);
  if (!denFox || !denFox.isConnected) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;   // a still fox
  if (foxWalks >= foxNapAfter) {
    foxWalks = 0;
    foxNapAfter = 3 + Math.floor(Math.random() * 3);
    denFox.classList.remove('walking');
    denFox.classList.add('sleeping');
    foxTimer = setTimeout(() => { denFox.classList.remove('sleeping'); foxTimer = setTimeout(foxStep, 900); }, 7000 + Math.random() * 6000);
    return;
  }
  let target = 6 + Math.random() * 74;
  if (Math.abs(target - foxX) < 8) target = foxX < 40 ? foxX + 20 : foxX - 20;
  const seconds = Math.max(1.2, Math.abs(target - foxX) / 10);
  denFox.style.setProperty('--face', target >= foxX ? '1' : '-1');
  denFox.style.transition = `left ${seconds}s linear`;
  denFox.classList.add('walking');
  denFox.style.left = target + '%';
  foxX = target;
  foxWalks++;
  foxTimer = setTimeout(() => {
    denFox.classList.remove('walking');
    foxTimer = setTimeout(foxStep, 1200 + Math.random() * 2500);    // a little pause to sniff around
  }, seconds * 1000);
}

/* ---------- Drawing the room ---------- */

const denPlace = (key, fallback) => profile.den.pos[key] || fallback;
// A movable thing: positioned from the bottom-left; things lower on the floor sit in front.
function placed(key, cls, inner, fallback, extraStyle = '') {
  const [x, y] = denPlace(key, fallback);
  const layer = cls.startsWith('den-decor') ? 200 : 100;   // decorations sit in front of furniture
  return `<div class="${cls} den-movable" data-move="${key}" style="left:${x}%;bottom:${y}%;z-index:${Math.round(layer - y)};${extraStyle}">${inner}</div>`;
}

function renderDen() {
  const den = profile.den;
  const room = $('denRoom');
  if (!room) return;
  $('denTitle').textContent = `🏠 ${profile.petName}’s Den`;
  let scene = room.querySelector('.den-scene');
  if (!scene) {
    room.textContent = '';
    scene = document.createElement('div'); scene.className = 'den-scene';
    denFox = makeDenFox();
    room.append(scene, denFox);
    setTimeout(foxStep, 800);
  }
  const wood = hex('wood');
  const bedding = hex('bedding');
  const sky = DEN_SKIES.find((s) => s.id === den.colours.sky).css;
  const parts = [];
  parts.push(`<div class="den-wall" style="background:${wallpaperCss(den.wallpaper, hex('wall'))}"></div>`);
  parts.push(`<div class="den-floor" style="background:${floorCss(den.floor)}"></div>`);
  parts.push(`<div class="den-window"><div class="den-sky" style="background:${sky}"></div><div class="den-curtain left" style="background:${hex('curtains')}"></div><div class="den-curtain right" style="background:${hex('curtains')}"></div><div class="den-sill" style="background:${wood}"></div></div>`);
  if (den.lamp === 'lamp-fairy') parts.push(`<div class="den-fairy">${'<i></i>'.repeat(16)}</div>`);
  if (den.poster !== 'poster-none') parts.push(placed('poster', 'den-poster', DEN_ITEMS_BY_ID[den.poster].icon, DEN_PLACES.poster, `border-color:${wood}`));
  if (den.wardrobe !== 'wardrobe-none') parts.push(placed('wardrobe', 'den-wardrobe', wardrobeSvg(den.wardrobe, wood), DEN_PLACES.wardrobe));
  if (den.shelf === 'shelf-books') parts.push(placed('shelf', 'den-shelf', shelfSvg(wood), DEN_PLACES.shelf));
  if (den.tv === 'tv-set') parts.push(placed('tv', 'den-tv', tvSvg(wood), DEN_PLACES.tv));
  if (den.desk !== 'desk-none') parts.push(placed('desk', 'den-desk', deskSvg(den.desk, wood), DEN_PLACES.desk));
  if (den.chair !== 'chair-none') parts.push(placed('chair', 'den-chair', chairSvg(den.chair, wood, hex('rug')), DEN_PLACES.chair));
  if (den.lamp === 'lamp-desk') parts.push(placed('lamp', 'den-lamp desk', '💡', DEN_PLACES.lamp));
  if (den.lamp === 'lamp-lava') parts.push(placed('lamp', 'den-lamp lava', '<svg viewBox="0 0 40 100"><path d="M12 10 H28 L34 70 H6 Z" fill="#ff6aa6" opacity=".85"/><circle cx="20" cy="40" r="6" fill="#ffd65a"/><circle cx="16" cy="58" r="5" fill="#ffd65a"/><rect x="10" y="0" width="20" height="10" rx="3" fill="#888"/><path d="M6 70 H34 L30 100 H10 Z" fill="#666"/></svg>', [79, 33]));
  if (den.sofa !== 'sofa-none') parts.push(placed('sofa', `den-sofa ${den.sofa === 'sofa-armchair' ? 'armchair' : 'couch'}`, sofaSvg(den.sofa, hex('sofa')), DEN_PLACES.sofa));
  if (den.bedside === 'bedside-table') parts.push(placed('bedside', 'den-bedside', bedsideSvg(wood), DEN_PLACES.bedside));
  parts.push(placed('bed', `den-bed${den.bed === 'bed-bunk' ? ' bunk' : den.bed === 'bed-canopy' ? ' canopy' : ''}`, bedSvg(den.bed, wood, bedding), DEN_PLACES.bed));
  if (den.rug !== 'rug-none') parts.push(placed('rug', 'den-rug', '', DEN_PLACES.rug, rugHtml(den.rug, hex('rug')) + ';z-index:1'));
  for (const id of den.decor) {
    const item = DEN_ITEMS_BY_ID[id];
    parts.push(placed(id, 'den-decor', item.icon, item.at));
  }
  scene.innerHTML = parts.join('');   // built only from the fixed choices above
  // The den fox's outfit: its suit's hat, unless a hat is chosen, plus face, neck and ear things.
  const suitId = den.suit === 'pet' ? profile.petSuit : den.suit === 'none' ? null : (profile.ownedSuits.includes(den.suit) ? den.suit : null);
  const suit = SUITS_BY_ID[suitId];
  const worn = (slot) => (den[slot] === DEN_START[slot] ? '' : DEN_ITEMS_BY_ID[den[slot]].icon);
  denFox.querySelector('.fox-wear.head').textContent = worn('wear-head') || (suit ? suit.hat : '');
  denFox.querySelector('.fox-wear.face').textContent = worn('wear-face');
  denFox.querySelector('.fox-wear.neck').textContent = worn('wear-neck');
  denFox.querySelector('.fox-wear.ear').textContent = worn('wear-ear');
  room.classList.toggle('moving', denMoving);
  if (!$('denEditor').hidden) renderDenEditor();
}

/* ---------- Moving things around ---------- */

let denMoving = false;
let denDrag = null;

function toggleDenMoving() {
  denMoving = !denMoving;
  $('denMoveBtn').textContent = denMoving ? '✅ Done moving' : '✋ Move things';
  $('denMoveBtn').setAttribute('aria-pressed', String(denMoving));
  $('denMoveHelp').hidden = !denMoving;
  $('denRoom').classList.toggle('moving', denMoving);
}

function resetDenPlaces() {
  profile.den.pos = {};
  saveProfile();
  tone(660, 0.08);
}

function startDenDrag(e) {
  if (!denMoving) return;
  const el = e.target.closest('[data-move]');
  if (!el) return;
  e.preventDefault();
  const room = $('denRoom').getBoundingClientRect();
  const box = el.getBoundingClientRect();
  denDrag = {
    el, key: el.dataset.move, room, startX: e.clientX, startY: e.clientY,
    left: ((box.left - room.left) / room.width) * 100,
    bottom: ((room.bottom - box.bottom) / room.height) * 100,
    w: (box.width / room.width) * 100, h: (box.height / room.height) * 100,
  };
  el.classList.add('dragging');
  el.setPointerCapture && el.setPointerCapture(e.pointerId);
}

function moveDenDrag(e) {
  if (!denDrag) return;
  const d = denDrag;
  const x = Math.max(-2, Math.min(100 - d.w + 2, d.left + ((e.clientX - d.startX) / d.room.width) * 100));
  const y = Math.max(0, Math.min(100 - d.h, d.bottom - ((e.clientY - d.startY) / d.room.height) * 100));
  d.el.style.left = x + '%';
  d.el.style.bottom = y + '%';
  d.x = x; d.y = y;
}

function endDenDrag() {
  if (!denDrag) return;
  const d = denDrag;
  denDrag = null;
  d.el.classList.remove('dragging');
  if (d.x === undefined) return;      // just a tap, no move
  profile.den.pos[d.key] = [Math.round(d.x * 10) / 10, Math.round(d.y * 10) / 10];
  saveProfile();
}

/* ---------- Decorating ---------- */

let denTab = 'paint';
let denPending = null;
let denPendingTimer = null;

function denOwns(id) { const item = DEN_ITEMS_BY_ID[id]; return item.price === 0 || profile.den.owned.includes(id); }
function denUsing(id) { const item = DEN_ITEMS_BY_ID[id]; return item.slot === 'decor' ? profile.den.decor.includes(id) : profile.den[item.slot] === id; }

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
  if (denTab === 'outfit') box.appendChild(denSuitChooser());
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

// Choose the den fox's suit: the same as the pet, none, or any owned suit.
function denSuitChooser() {
  const row = document.createElement('div'); row.className = 'den-paint-row';
  const label = document.createElement('strong'); label.textContent = 'Suit';
  const list = document.createElement('div'); list.className = 'wardrobe';
  const choices = [{ id: 'pet', text: '🦊 Same as my pet' }, { id: 'none', text: '✖️ No suit' },
    ...profile.ownedSuits.map((id) => ({ id, text: `${SUITS_BY_ID[id].icon} ${SUITS_BY_ID[id].name}` }))];
  for (const c of choices) {
    const b = document.createElement('button'); b.type = 'button';
    const on = profile.den.suit === c.id;
    b.className = 'suit-btn' + (on ? ' on' : '');
    b.textContent = c.text;
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', `Den suit: ${c.text.replace(/^\S+ /, '')}`);
    b.addEventListener('click', () => { profile.den.suit = c.id; saveProfile(); tone(760, 0.06); });
    list.appendChild(b);
  }
  row.append(label, list);
  return row;
}

document.getElementById('denEditBtn').addEventListener('click', () => {
  const editor = document.getElementById('denEditor');
  editor.hidden = !editor.hidden;
  document.getElementById('denEditBtn').setAttribute('aria-expanded', String(!editor.hidden));
  document.getElementById('denEditBtn').textContent = editor.hidden ? '🎨 Decorate' : '✅ Done decorating';
  if (!editor.hidden) renderDenEditor();
});
document.getElementById('denMoveBtn').addEventListener('click', toggleDenMoving);
document.getElementById('denResetBtn').addEventListener('click', resetDenPlaces);
const denRoomEl = document.getElementById('denRoom');
denRoomEl.addEventListener('pointerdown', startDenDrag);
denRoomEl.addEventListener('pointermove', moveDenDrag);
denRoomEl.addEventListener('pointerup', endDenDrag);
denRoomEl.addEventListener('pointercancel', endDenDrag);
