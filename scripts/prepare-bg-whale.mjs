// Prepare the background whale-girl asset.
//   1. copy the source JPEG into a temp serve dir
//   2. emit a page that removes the flat background and exports a PNG data URL
// The actual browser run is done separately (headless Edge --dump-dom), then
// extract-bg-whale.mjs turns the data URL into public/whale-bg.png.
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const work = join(root, '.deploy-tmp/bgwhale');
const srcJpg = process.argv[2];

if (!srcJpg || !existsSync(srcJpg)) {
  console.error('usage: node scripts/prepare-bg-whale.mjs <path-to-jpg>');
  process.exit(1);
}

mkdirSync(work, { recursive: true });
copyFileSync(srcJpg, join(work, 'src.jpg'));

const page = `<!doctype html>
<html><head><meta charset="utf-8"><title>working</title></head>
<body style="margin:0;background:#fff">
<div id="out">pending</div>
<script>
const TOLERANCE = 34;         // colour distance from the border seed
const MIN_COMPONENT = 0.006;  // fraction of pixels — bigger eats the floating hearts/sparkles
const MAX_WIDTH = 760;
const PAD = 6;

function idx(x, y, w) { return (y * w + x) * 4; }

function run() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = 'src.jpg';
  }).then((img) => {
    const scale = Math.min(1, MAX_WIDTH / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;

    // Seed colour: average of the outermost ring of pixels.
    let sr = 0, sg = 0, sb = 0, n = 0;
    for (let x = 0; x < w; x++) {
      for (const y of [0, h - 1]) {
        const i = idx(x, y, w);
        sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++;
      }
    }
    for (let y = 0; y < h; y++) {
      for (const x of [0, w - 1]) {
        const i = idx(x, y, w);
        sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++;
      }
    }
    sr /= n; sg /= n; sb /= n;

    // Flood fill from the border: reachable pixels close to the seed colour go transparent.
    // Interior whites (apron, lace) are never reached, so they survive.
    const visited = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (visited[p]) return;
      visited[p] = 1;
      const i = p * 4;
      const dr = d[i] - sr, dg = d[i + 1] - sg, db = d[i + 2] - sb;
      if (Math.sqrt(dr * dr + dg * dg + db * db) > TOLERANCE) return;
      stack.push(p);
    };

    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p - x) / w;
      d[p * 4 + 3] = 0;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }

    // Drop detached islands (hearts, sparkles, clouds): keep only the main subject.
    const seen = new Uint8Array(w * h);
    const minSize = Math.round(w * h * MIN_COMPONENT);
    for (let p = 0; p < w * h; p++) {
      if (seen[p] || d[p * 4 + 3] === 0) continue;
      const comp = [p];
      seen[p] = 1;
      const queue = [p];
      while (queue.length) {
        const q = queue.pop();
        const x = q % w, y = (q - x) / w;
        const neighbours = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
        for (const [nx, ny] of neighbours) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const np = ny * w + nx;
          if (seen[np] || d[np * 4 + 3] === 0) continue;
          seen[np] = 1;
          queue.push(np);
          comp.push(np);
        }
      }
      if (comp.length < minSize) for (const q of comp) d[q * 4 + 3] = 0;
    }

    ctx.putImageData(imageData, 0, 0);

    // Auto-crop to her silhouette so the asset carries no dead space.
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[idx(x, y, w) + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    minX = Math.max(0, minX - PAD); minY = Math.max(0, minY - PAD);
    maxX = Math.min(w - 1, maxX + PAD); maxY = Math.min(h - 1, maxY + PAD);

    const cw = maxX - minX + 1, ch = maxY - minY + 1;
    const out = document.createElement('canvas');
    out.width = cw; out.height = ch;
    out.getContext('2d').drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);

    // WebP keeps the alpha and is far smaller than PNG for this kind of art.
    const url = out.toDataURL('image/webp', 0.92);
    document.getElementById('out').textContent = url.startsWith('data:image/webp')
      ? url
      : out.toDataURL('image/png');
    document.title = 'done ' + cw + 'x' + ch + ' ' + (url.startsWith('data:image/webp') ? 'webp' : 'png');
  });
}

run().catch((e) => { document.title = 'FAILED ' + e.message; });
</script>
</body></html>`;

writeFileSync(join(work, 'index.html'), page, 'utf8');
console.log(`prepared ${join(work, 'index.html')}`);
console.log('serve this dir, then: msedge --headless --dump-dom <url> > dump.html');
