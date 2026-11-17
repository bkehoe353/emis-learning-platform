// Builds the happy fox picture and the app icons from the 3D fox emoji.
// Fox image: Microsoft Fluent Emoji (MIT licence) — tools/assets/fox_3d.png
// We give it happy closed eyes (^ ^) and rosy cheeks, then put it on a yellow background.
// Run: node tools/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = 'data:image/png;base64,' + readFileSync(root + 'tools/assets/fox_3d.png').toString('base64');
mkdirSync(root + 'web/img', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const out = await page.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode();

  // 1. The happy fox (256 × 256, transparent background).
  const fox = document.createElement('canvas'); fox.width = fox.height = 256;
  const g = fox.getContext('2d');
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, 256, 256);
  const d = data.data;
  const at = (x, y) => (y * 256 + x) * 4;
  // Paint over each round eye by blending the fur colour on its left and right, row by row.
  for (const eye of [{ x0: 89, x1: 102, y0: 134, y1: 162 }, { x0: 152, x1: 165, y0: 134, y1: 161 }]) {
    for (let y = eye.y0; y <= eye.y1; y++) {
      const a = at(eye.x0 - 3, y), b = at(eye.x1 + 3, y);
      for (let x = eye.x0; x <= eye.x1; x++) {
        const t = (x - (eye.x0 - 3)) / (eye.x1 - eye.x0 + 6), i = at(x, y);
        for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[a + k] * (1 - t) + d[b + k] * t);
      }
    }
  }
  g.putImageData(data, 0, 0);
  // Happy closed eyes: little upside-down "U" curves.
  g.strokeStyle = '#2a1c1c'; g.lineWidth = 5.5; g.lineCap = 'round';
  for (const cx of [95.5, 158.5]) { g.beginPath(); g.arc(cx, 153, 9, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); }
  // Rosy cheeks.
  for (const cx of [76, 180]) {
    const blush = g.createRadialGradient(cx, 176, 0, cx, 176, 17);
    blush.addColorStop(0, 'rgba(255,92,138,0.55)'); blush.addColorStop(1, 'rgba(255,92,138,0)');
    g.fillStyle = blush; g.beginPath(); g.arc(cx, 176, 17, 0, Math.PI * 2); g.fill();
  }

  // 2. App icons: warm yellow background, fox at 74%.
  const icon = (size) => {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d');
    const bg = x.createLinearGradient(0, 0, 0, size); bg.addColorStop(0, '#ffe27a'); bg.addColorStop(1, '#ffc43c');
    x.fillStyle = bg; x.fillRect(0, 0, size, size);
    const f = size * 0.74; x.imageSmoothingQuality = 'high';
    x.drawImage(fox, (size - f) / 2, (size - f) / 2 + size * 0.02, f, f);
    return c.toDataURL('image/png');
  };
  return { fox: fox.toDataURL('image/png'), 180: icon(180), 192: icon(192), 512: icon(512) };
}, src);
await browser.close();

const save = (path, dataUrl) => writeFileSync(root + path, Buffer.from(dataUrl.split(',')[1], 'base64'));
save('web/img/fox-happy.png', out.fox);
save('web/icons/apple-touch-icon.png', out[180]);
save('web/icons/icon-192.png', out[192]);
save('web/icons/icon-512.png', out[512]);
console.log('Wrote web/img/fox-happy.png and web/icons/*.png');
