// Extract the image data URL produced by the in-browser cutout.
//   node scripts/extract-bg-whale.mjs <dump.html> <out.webp|out.png>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , dumpPath, outPath] = process.argv;
if (!dumpPath || !outPath) {
  console.error('usage: node scripts/extract-bg-whale.mjs <dump.html> <out.webp|out.png>');
  process.exit(1);
}

const html = readFileSync(resolve(dumpPath), 'utf8');
const title = (html.match(/<title>([^<]*)</) ?? [])[1] ?? '(no title)';
const match = html.match(/data:image\/(webp|png);base64,([A-Za-z0-9+/=]+)/);

if (!match) {
  console.error(`no image data URL in ${dumpPath} — page title: ${title}`);
  process.exit(1);
}

const [, format, base64] = match;
const buffer = Buffer.from(base64, 'base64');
writeFileSync(resolve(outPath), buffer);
console.log(`title   : ${title}`);
console.log(`format  : ${format}`);
console.log(`written : ${outPath} (${(buffer.length / 1024).toFixed(1)}KB)`);
