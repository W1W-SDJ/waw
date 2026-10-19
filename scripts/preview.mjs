// Static preview of the built dist/ — mirrors how GitHub Pages serves the site.
//   node scripts/preview.mjs [--port 4173] [--dir dist]

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, extname, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const dir = resolve(root, arg('--dir', 'dist'));
const port = Number(arg('--port', process.env.PORT ?? 4173));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(dir)) {
  console.error(`✗ ${relative(root, dir)} not found — run: npm run build`);
  process.exit(1);
}

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let rel = urlPath.replace(/^\/+/, '');
  if (rel.endsWith('/')) rel += 'index.html';
  let file = join(dir, rel);
  if (!file.startsWith(dir)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 — ${urlPath}`);
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`▸ preview (${relative(root, dir)})  http://127.0.0.1:${port}/`);
});
