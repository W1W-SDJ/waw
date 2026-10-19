// Locate the little whale printed on the apron, so it can be scaled up and
// composited into her arms. Prints colour-cluster bounding boxes per band.
import { PNG } from 'file:///D:/ai/desktop-pet/node_modules/pngjs/lib/png.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = 'D:\\ai\\plugins\\whale-purse\\assets\\whale-sprite.png';
const outDir = 'D:\\ai\\portfolio\\.probe';
mkdirSync(outDir, { recursive: true });

const png = PNG.sync.read(readFileSync(src));
const { width, height, data } = png;
console.log(`sprite ${width}x${height}`);

const px = (x, y) => {
  const i = (y * width + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
};

// The apron is white/near-white; the whale on it is a mid blue. Scan the lower-middle
// region for bluish pixels surrounded by pale ones.
function isBlue(c) {
  return c.a > 180 && c.b > c.r + 18 && c.b > 110 && c.r < 190;
}
function isPale(c) {
  return c.a > 180 && c.r > 205 && c.g > 205 && c.b > 210;
}

// Report a coarse grid of blue-pixel density so we can spot the apron whale.
const cell = 20;
console.log('\nblue-pixel density grid (x across, y down, cell=20px):');
for (let y = 0; y < height; y += cell) {
  let row = '';
  for (let x = 0; x < width; x += cell) {
    let blue = 0, pale = 0, total = 0;
    for (let yy = y; yy < Math.min(y + cell, height); yy++) {
      for (let xx = x; xx < Math.min(x + cell, width); xx++) {
        const c = px(xx, yy);
        if (c.a < 180) continue;
        total++;
        if (isBlue(c)) blue++;
        if (isPale(c)) pale++;
      }
    }
    if (!total) row += '  ';
    else if (blue / total > 0.45) row += '##';
    else if (blue / total > 0.18) row += '++';
    else if (pale / total > 0.5) row += '..';
    else row += '  ';
  }
  console.log(String(y).padStart(3, ' ') + ' |' + row + '|');
}

// Find the largest blue blob that is mostly enclosed by pale pixels (the apron print).
let best = null;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (!isBlue(px(x, y))) continue;
    // flood fill
    const stack = [[x, y]];
    const seen = new Set();
    let minX = x, maxX = x, minY = y, maxY = y, n = 0;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      const key = cy * width + cx;
      if (seen.has(key)) continue;
      seen.add(key);
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      if (!isBlue(px(cx, cy))) continue;
      n++;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    if (n > 400 && (!best || n > best.n)) {
      best = { n, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    }
    if (n > 400) y = maxY; // skip past this blob's rows
  }
}
console.log('\nlargest blue blob:', JSON.stringify(best));

// Crop the apron region generously and save it for visual inspection.
function crop(x0, y0, w, h, scale, file) {
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);
  const dst = new PNG({ width: tw, height: th });
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const sx = Math.min(width - 1, Math.floor(x0 + (x / tw) * w));
      const sy = Math.min(height - 1, Math.floor(y0 + (y / th) * h));
      const si = (sy * width + sx) * 4;
      const di = (y * tw + x) * 4;
      dst.data[di] = data[si];
      dst.data[di + 1] = data[si + 1];
      dst.data[di + 2] = data[si + 2];
      dst.data[di + 3] = data[si + 3];
    }
  }
  writeFileSync(file, PNG.sync.write(dst, { colorType: 6 }));
  console.log('wrote', file, `${tw}x${th}`);
}

// Whole lower half at 2x, to eyeball the apron and arms.
crop(0, Math.round(height * 0.55), width, Math.round(height * 0.45), 2, `${outDir}\\lower.png`);
// Head-to-waist at 2x.
crop(0, 0, width, Math.round(height * 0.5), 2, `${outDir}\\upper.png`);
