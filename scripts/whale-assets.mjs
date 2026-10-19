// Sample the whale sprite to derive an accurate blue palette, and emit derived assets.
//   node scripts/whale-assets.mjs
// Requires pngjs (pure JS, already present in the desktop-pet checkout).

import { PNG } from 'file:///D:/ai/desktop-pet/node_modules/pngjs/lib/png.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outDir = join(root, 'public');
const src = 'D:\\ai\\plugins\\whale-purse\\assets\\whale-sprite.png';

mkdirSync(outDir, { recursive: true });

const png = PNG.sync.read(readFileSync(src));
const { width, height, data } = png;

/* ---- collect opaque pixels, quantise to 5 bits/channel -------------------- */
const buckets = new Map();
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const a = data[i + 3];
    if (a < 200) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Skip near-white lace/skin so hair and cloth dominate the palette.
    const key = `${r >> 3},${g >> 3},${b >> 3}`;
    const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    cur.n++;
    cur.r += r; cur.g += g; cur.b += b;
    buckets.set(key, cur);
  }
}

const toHex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const hsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const ranked = [...buckets.values()]
  .map((c) => ({ n: c.n, r: c.r / c.n, g: c.g / c.n, b: c.b / c.n }))
  .sort((a, b) => b.n - a.n)
  .slice(0, 400);

// Keep only bluish pixels (the character's identity) and report them by lightness.
const bluish = ranked.filter((c) => {
  const { h, s } = hsl(c.r, c.g, c.b);
  return s > 18 && h >= 195 && h <= 260;
});

console.log(`sprite ${width}x${height} — ${ranked.length} quantised colours sampled, ${bluish.length} bluish\n`);
console.log('dominant bluish tones (share of opaque px):');
const totalOpaque = [...buckets.values()].reduce((s, c) => s + c.n, 0);
for (const c of bluish.slice(0, 14)) {
  const hex = toHex(c.r, c.g, c.b);
  const { h, s, l } = hsl(c.r, c.g, c.b);
  console.log(`  ${hex}  hsl(${h} ${s}% ${l}%)  ${((c.n / totalOpaque) * 100).toFixed(1)}%`);
}

// Pick representative anchors from the lightness range.
const byL = [...bluish].sort((a, b) => hsl(a.r, a.g, a.b).l - hsl(b.r, b.g, b.b).l);
const pick = (target) => byL.reduce((best, c) => (Math.abs(hsl(c.r, c.g, c.b).l - target) < Math.abs(hsl(best.r, best.g, best.b).l - target) ? c : best), byL[0]);
const anchors = { deep: pick(18), mid: pick(34), bright: pick(52), light: pick(70), pale: pick(84) };

console.log('\nanchors:');
const palette = {};
for (const [name, c] of Object.entries(anchors)) {
  const hex = toHex(c.r, c.g, c.b);
  const { h, s, l } = hsl(c.r, c.g, c.b);
  palette[name] = hex;
  console.log(`  ${name.padEnd(6)} ${hex}  hsl(${h} ${s}% ${l}%)`);
}

writeFileSync(join(root, '.whale-palette.json'), `${JSON.stringify({ sampled: bluish.slice(0, 20).map((c) => toHex(c.r, c.g, c.b)), palette }, null, 2)}\n`);

/* ---- derived asset: head crop for the favicon ----------------------------- */
// The face sits in the upper third; crop generously around it and downscale.
function cropScale(x0, y0, w, h, scale, out) {
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);
  const dst = new PNG({ width: tw, height: th });
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      // Box-average the source block for a clean downscale.
      const sx0 = Math.floor(x0 + (x / tw) * w);
      const sy0 = Math.floor(y0 + (y / th) * h);
      const sx1 = Math.min(width, Math.max(sx0 + 1, Math.floor(x0 + ((x + 1) / tw) * w)));
      const sy1 = Math.min(height, Math.max(sy0 + 1, Math.floor(y0 + ((y + 1) / th) * h)));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * width + sx) * 4;
          const al = data[i + 3] / 255;
          r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al; a += data[i + 3];
          n++;
        }
      }
      const o = (y * tw + x) * 4;
      if (a === 0) { dst.data[o + 3] = 0; continue; }
      const alpha = a / n / 255;
      dst.data[o] = Math.round(r / n / Math.max(alpha, 0.001));
      dst.data[o + 1] = Math.round(g / n / Math.max(alpha, 0.001));
      dst.data[o + 2] = Math.round(b / n / Math.max(alpha, 0.001));
      dst.data[o + 3] = Math.round(a / n);
    }
  }
  writeFileSync(out, PNG.sync.write(dst, { colorType: 6 }));
  console.log(`  wrote ${out} (${tw}x${th})`);
}

console.log('\nderived assets:');
// Head + shoulders: x 48..244, y 18..194 of the 280x373 sprite, downscaled for a
// 41px display size (128px covers 2x DPR with room for the object-fit crop).
cropScale(48, 18, 196, 176, 128 / 196, join(outDir, 'whale-head.png'));

// Full sprite, downscaled for background/mascot use.
cropScale(0, 0, width, height, 0.75, join(outDir, 'whale.png'));

console.log('\npalette →', JSON.stringify(palette));
