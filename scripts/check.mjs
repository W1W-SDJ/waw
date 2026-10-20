// Node-side smoke checks that do not need a DOM.
//   node scripts/check.mjs
// 1. every source + dist module parses
// 2. the project data layer maps repos into renderable objects
// 3. the CSS minifier preserves the media-query structure

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
let failures = 0;

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  failures++;
};
const pass = (msg) => console.log(`✓ ${msg}`);

function walk(dir, ext, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, ext, base));
    else if (full.endsWith(ext)) out.push(relative(base, full).replace(/\\/g, '/'));
  }
  return out;
}

/* 1. syntax ---------------------------------------------------------------- */
// Spawning `node --check` is blocked in a restricted sandbox, so parse via the ESM
// loader itself: add a cache-busting query so an import actually evaluates the module
// body. A SyntaxError means the file is broken; a ReferenceError from the DOM stubs
// means the file parsed and started running, which is the best a non-browser can do.

const stubNode = {
  dataset: { page: 'home', depth: '0' },
  innerHTML: '',
  classList: { add() {}, remove() {} },
  querySelector: () => null,
  querySelectorAll: () => [],
  appendChild() {},
};
globalThis.document = {
  documentElement: { dataset: {} },
  body: stubNode,
  getElementById: () => stubNode,
  querySelector: () => null,
  querySelectorAll: () => [],
};
globalThis.window = globalThis;
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });

// The real site config, so modules importing site.js behave as they do in the browser.
globalThis.__SITE__ = JSON.parse(readFileSync(join(root, 'src/site.config.json'), 'utf8'));

const jsFiles = walk(join(root, 'src'), '.js');
let parsed = 0;
for (const rel of jsFiles) {
  const abs = join(root, 'src', rel);
  try {
    await import(`${pathToFileURL(abs).href}?check=${Date.now()}-${parsed}`);
    parsed++;
  } catch (err) {
    if (err?.name === 'SyntaxError') {
      fail(`syntax ${relative(root, abs)}: ${err.message}`);
    } else {
      // Parsed fine; it needs a real browser (or a real template) to go further.
      parsed++;
    }
  }
}
if (parsed === jsFiles.length) pass(`${parsed} source modules parse cleanly`);

/* 2. data layer ------------------------------------------------------------ */

try {
  const mod = await import(pathToFileURL(join(root, 'src/data/projects.js')).href);
  const projects = await mod.loadProjects();
  if (!projects.length) fail('loadProjects() returned no projects');

  for (const p of projects) {
    for (const field of ['name', 'title', 'blurb', 'role', 'category']) {
      if (typeof p[field] !== 'string') fail(`project ${p.name}: "${field}" is not a string (${typeof p[field]})`);
    }
    if (!Array.isArray(p.tags)) fail(`project ${p.name}: tags is not an array`);
    const card = (await import(pathToFileURL(join(root, 'src/lib/projects-view.js')).href)).projectCard(p);
    if (!card.includes('class="card')) fail(`project ${p.name}: card markup missing`);
    if (card.includes('undefined')) fail(`project ${p.name}: card markup contains "undefined"`);
  }
  const s = mod.stats(projects);
  pass(`data layer: ${projects.length} project(s) → ${s.total} cards, ${s.languages} language(s), latest ${s.updatedLabel}`);
} catch (err) {
  console.error(err);
  fail(`data layer threw: ${err.message}`);
}

/* 3. minifier -------------------------------------------------------------- */

try {
  const build = readFileSync(join(root, 'scripts/build.mjs'), 'utf8');
  const minifyCss = new Function('input', `${build.match(/function minifyCss[\s\S]*?\n}/)[0]}\nreturn minifyCss;`)();
  const css = readFileSync(join(root, 'src/styles/base.css'), 'utf8');
  const min = minifyCss(css);
  const open = (min.match(/\{/g) ?? []).length;
  const close = (min.match(/\}/g) ?? []).length;
  const medias = (min.match(/@media/g) ?? []).length;
  const sourceMedias = (css.match(/@media/g) ?? []).length;
  if (open !== close) fail(`minified CSS braces unbalanced: ${open} { vs ${close} }`);
  if (medias !== sourceMedias) fail(`minified CSS dropped @media blocks: ${medias} vs ${sourceMedias}`);
  if (/\/\*/.test(min)) fail('minified CSS still contains comments');
  if (min.length >= css.length) fail('minified CSS is not smaller than source');
  pass(`minifier: ${(css.length / 1024).toFixed(1)}KB → ${(min.length / 1024).toFixed(1)}KB, ${medias} @media blocks, braces balanced`);
} catch (err) {
  fail(`minifier check threw: ${err.message}`);
}

/* 4. dist --------------------------------------------------------------- */

if (existsSync(join(root, 'dist'))) {
  const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
  const checks = [
    [/data-page="home"/, 'home page marker'],
    [/data-depth="0"/, 'home depth'],
    [/href="assets\/app-[0-9a-f]{8}\.css"/, 'hashed css link'],
    [/src="main\.js\?v=[0-9a-f]{8}"/, 'versioned module entry'],
    [/window\.__SITE__ = \{/, 'inline site config'],
    [/^<!doctype html>/i, 'doctype'],
  ];
  for (const [re, label] of checks) if (!re.test(html)) fail(`dist/index.html missing ${label}`);

  const sub = readFileSync(join(root, 'dist/projects/index.html'), 'utf8');
  if (!/href="\.\.\/assets\/app-/.test(sub)) fail('dist/projects/index.html css path is not depth-correct');
  if (!/src="\.\.\/main\.js\?v=/.test(sub)) fail('dist/projects/index.html js path is not depth-correct');
  pass('dist HTML: page markers, hashed assets, depth-correct relative paths');

  // 5. Every local href/src must resolve to a real file inside dist/.
  // Catches broken nav links, missing favicon, wrong asset hashes.
  const distDir = join(root, 'dist');
  for (const page of ['index.html', 'projects/index.html', 'about/index.html']) {
    const file = join(distDir, page);
    if (!existsSync(file)) {
      fail(`dist/${page} missing`);
      continue;
    }
    const source = readFileSync(file, 'utf8');
    const refs = [...source.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    const local = refs.filter(
      (r) => !/^(https?:|mailto:|#|data:)/.test(r) && !r.endsWith('/') && !r.startsWith('//'),
    );
    for (const ref of local) {
      const target = resolve(distDir, dirname(page), ref.split(/[?#]/)[0]);
      if (!existsSync(target)) fail(`dist/${page}: broken reference "${ref}"`);
    }
    // Directory links (e.g. "projects/") must contain an index.html.
    for (const ref of refs.filter((r) => r.endsWith('/') && !/^(https?:|#)/.test(r))) {
      const target = resolve(distDir, dirname(page), ref, 'index.html');
      if (!existsSync(target)) fail(`dist/${page}: link "${ref}" has no index.html`);
    }
  }
  pass('dist links: every local href/src resolves to a file');
} else {
  console.log('· dist/ not built yet — run npm run build first');
}

console.log(failures ? `\n✗ ${failures} check(s) failed` : '\n✓ all checks passed');
process.exit(failures ? 1 : 0);
