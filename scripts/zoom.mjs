// Crop + zoom regions of a screenshot for close inspection.
//   node scripts/zoom.mjs <src.png> <out.png> <x> <y> <w> <h> [scale]
import { PNG } from 'file:///D:/ai/desktop-pet/node_modules/pngjs/lib/png.js';
import { readFileSync, writeFileSync } from 'node:fs';

const [, , src, out, xArg, yArg, wArg, hArg, scaleArg] = process.argv;
const png = PNG.sync.read(readFileSync(src));
const x0 = Number(xArg), y0 = Number(yArg), w = Number(wArg), h = Number(hArg);
const scale = Number(scaleArg ?? 2);

const tw = Math.round(w * scale);
const th = Math.round(h * scale);
const dst = new PNG({ width: tw, height: th });

for (let y = 0; y < th; y++) {
  for (let x = 0; x < tw; x++) {
    const sx = Math.min(png.width - 1, x0 + Math.floor(x / scale));
    const sy = Math.min(png.height - 1, y0 + Math.floor(y / scale));
    const si = (sy * png.width + sx) * 4;
    const di = (y * tw + x) * 4;
    dst.data[di] = png.data[si];
    dst.data[di + 1] = png.data[si + 1];
    dst.data[di + 2] = png.data[si + 2];
    dst.data[di + 3] = 255;
  }
}
writeFileSync(out, PNG.sync.write(dst, { colorType: 6 }));
console.log(`wrote ${out} ${tw}x${th}`);
