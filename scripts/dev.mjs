// Minimal static dev server — no dependencies, no bundler.
// Serves src/ for app files and public/ for static assets, expanding the HTML template per page.
//   node scripts/dev.mjs [--port 5173]

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const srcDir = join(root, 'src');
const publicDir = join(root, 'public');

const portArg = process.argv.indexOf('--port');
const port = Number(portArg > -1 ? process.argv[portArg + 1] : process.env.PORT ?? 5173);

const PAGES = {
  'index.html': { page: 'home', depth: 0 },
  'projects/index.html': { page: 'projects', depth: 1 },
  'about/index.html': { page: 'about', depth: 1 },
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

function expandTemplate(page, depth) {
  const config = JSON.parse(readFileSync(join(srcDir, 'site.config.json'), 'utf8'));
  const template = readFileSync(join(srcDir, 'template.html'), 'utf8');
  const prefix = '../'.repeat(depth);
  const replacements = {
    __PAGE__: page,
    __DEPTH__: String(depth),
    __ROOT__: prefix,
    __CSS__: `${prefix}src/styles/base.css`,
    __JS__: `${prefix}src/main.js`,
    __CONFIG__: JSON.stringify(config),
    __LANG__: config.locale ?? 'zh-CN',
    __TITLE__: page === 'home' ? config.title : page === 'projects' ? `作品 · ${config.title}` : `关于 · ${config.title}`,
    __DESC__: config.description,
    __AUTHOR__: config.owner,
    __SITE_URL__: page === 'home' ? config.siteUrl : `${config.siteUrl}${page}/`,
    __THEME_COLOR__: '#f4f3eb',
    __THEME_COLOR_DARK__: '#101a19',
    __GITHUB__: config.social?.github ?? config.url,
    __GITHUB_LABEL__: `github.com/${config.owner}`,
    __KICKER__: config.kicker,
  };
  let html = template;
  // Longest token first: __SITE_URL__ must expand before __SITE__.
  const ordered = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);
  for (const [token, value] of ordered) html = html.replaceAll(token, String(value));
  return html;
}

function resolvePath(urlPath) {
  let pathname = decodeURIComponent(urlPath.split('?')[0]);
  if (pathname.endsWith('/')) pathname += 'index.html';

  // 1. one of our template pages
  const rel = pathname.replace(/^\/+/, '');
  if (PAGES[rel]) return { kind: 'template', ...PAGES[rel] };

  // 2. a real file in src/ (app JS, CSS, JSON data) or public/
  for (const base of [srcDir, publicDir]) {
    const candidate = join(base, rel);
    if (candidate.startsWith(base) && existsSync(candidate) && statSync(candidate).isFile()) {
      return { kind: 'file', file: candidate };
    }
  }
  return null;
}

const server = createServer((req, res) => {
  const found = resolvePath(req.url ?? '/');
  if (!found) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 — ${req.url}\n\n可用页面：/  /projects/  /about/`);
    return;
  }

  try {
    if (found.kind === 'template') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(expandTemplate(found.page, found.depth));
      return;
    }
    const body = readFileSync(found.file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(found.file).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`500 — ${err.message}`);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`▸ dev server   http://127.0.0.1:${port}/`);
  console.log(`  pages        /  ·  /projects/  ·  /about/`);
  console.log('  no bundler — edit src/ and reload');
});
