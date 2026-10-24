// Draws the five rank medals as SVG files in web/ranks/.
// Run again after changing colours: node tools/make-medals.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../web/ranks/', import.meta.url));
mkdirSync(out, { recursive: true });

const star = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};
const sparkle = (x, y, s) => `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="#fff"/>`;

const starEmblem = (fill, stroke) =>
  `<polygon points="${star(50, 76, 17)}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>`;
const gemEmblem = (light, mid, dark) => `
  <polygon points="36,68 43,60 57,60 64,68 50,92" fill="${mid}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>
  <polygon points="36,68 43,60 50,68" fill="${light}"/>
  <polygon points="50,68 57,60 64,68" fill="${light}" opacity=".7"/>
  <polygon points="43,68 57,68 50,92" fill="${light}" opacity=".45"/>
  <path d="M36 68 H64 M43 68 L50 92 L57 68" fill="none" stroke="${dark}" stroke-width="1.5" opacity=".6"/>`;

const medals = {
  bronze:   { ribbon: ['#c0392b', '#e8604c'], rim: ['#7a3f14', '#e0a46a'], face: ['#c06a2b', '#f5c08c'], emblem: starEmblem('#f9d9b5', '#7a3f14') },
  silver:   { ribbon: ['#2e86de', '#54a0ff'], rim: ['#7d8996', '#f2f5f8'], face: ['#aab5c0', '#ffffff'], emblem: starEmblem('#ffffff', '#6d7884') },
  gold:     { ribbon: ['#7357d9', '#9b84ff'], rim: ['#a8740a', '#ffe27a'], face: ['#f0b90b', '#fff3b0'], emblem: starEmblem('#fff8d6', '#a8740a') },
  diamond:  { ribbon: ['#0a9ec7', '#48dbfb'], rim: ['#3a9cc4', '#e8fbff'], face: ['#8fdcf7', '#ffffff'], emblem: gemEmblem('#ffffff', '#7fe0ff', '#1b7fa8'), sparkles: true },
  amethyst: { ribbon: ['#e0569a', '#ff9cc8'], rim: ['#4b1f73', '#d9b0ff'], face: ['#8a3fc4', '#e7c6ff'], emblem: gemEmblem('#f3e2ff', '#b064f0', '#4b1f73'), sparkles: true },
};

for (const [id, m] of Object.entries(medals)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" role="img" aria-label="${id} medal">
  <defs>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.rim[1]}"/><stop offset="1" stop-color="${m.rim[0]}"/></linearGradient>
    <linearGradient id="face" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.face[1]}"/><stop offset="1" stop-color="${m.face[0]}"/></linearGradient>
  </defs>
  <path d="M28 2 H46 L58 44 H40 Z" fill="${m.ribbon[0]}"/>
  <path d="M72 2 H54 L42 44 H60 Z" fill="${m.ribbon[1]}"/>
  <circle cx="50" cy="76" r="38" fill="url(#rim)"/>
  <circle cx="50" cy="76" r="30" fill="url(#face)"/>
  <circle cx="50" cy="76" r="30" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
  ${m.emblem}
  ${m.sparkles ? sparkle(20, 50, 6) + sparkle(84, 96, 5) + sparkle(82, 48, 4) : ''}
</svg>
`;
  writeFileSync(out + id + '.svg', svg);
}
console.log('Medals written to web/ranks/');
