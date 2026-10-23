// Inspect a --dump-dom capture for the freshness pill and the baked build id.
//   node scripts/inspect-fresh.mjs <dump.html>
import { readFileSync } from 'node:fs';

const html = readFileSync(process.argv[2], 'utf8');

const pill = /class="freshness"/.test(html);
const text = (html.match(/<div class="freshness"[^>]*>\s*<span>([^<]*)</) ?? [])[1] ?? '(none)';
const btn = (html.match(/class="freshness__btn">([^<]*)</) ?? [])[1] ?? '(none)';
const cfg = html.match(/window\.__SITE__ = (\{.*?\});/s);
const build = cfg ? (cfg[1].match(/"build":"([^"]+)"/) ?? [])[1] ?? '(missing)' : '(no config)';

console.log('pill present :', pill);
console.log('pill text    :', JSON.stringify(text));
console.log('button text  :', JSON.stringify(btn));
console.log('config build :', build);
console.log('projects     :', [...html.matchAll(/data-project[^>]*data-search="([^"]{0,28})/g)].map((m) => m[1]).join(' | ') || '(none)');
