// Zero-dependency production build.
//   node scripts/build.mjs [--out dist]
//
// · minifies CSS, content-hashes the CSS entry
// · copies the ES-module graph verbatim (relative imports keep working in the browser)
// · expands src/template.html into one relative-path HTML file per page
// · verifies the emitted import graph actually resolves inside dist/
//
// No bundler, no native binaries: works on any machine with Node 18+.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
  statSync,
  copyFileSync,
} from 'node:fs';
import { resolve, join, dirname, extname, relative } from 'node:path';
import { createHash } from 'node:crypto';

const here = import.meta.dirname;
const root = resolve(here, '..');
const src = join(root, 'src');
const publicDir = join(root, 'public');
const outArg = process.argv.indexOf('--out');
const outDir = resolve(root, outArg > -1 ? process.argv[outArg + 1] : 'dist');

const config = JSON.parse(readFileSync(join(src, 'site.config.json'), 'utf8'));

const PAGES = [
  { page: 'home', out: 'index.html' },
  { page: 'projects', out: 'projects/index.html' },
  { page: 'about', out: 'about/index.html' },
];

const CSS_SOURCE = join(src, 'styles/base.css');
const JS_ENTRY = 'main.js';

/* ------------------------------------------------------------ minifiers --- */

function minifyCss(input) {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>~])\s*/g, '$1')
    .replace(/\s*:\s*/g, ':')
    .replace(/;}/g, '}')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

/** Conservative JS cleanup: whole-line comments and trailing whitespace out, newlines kept. */
function minifyJs(input) {
  let inBlockComment = false;
  const lines = [];
  for (const raw of input.split('\n')) {
    let line = raw;
    if (inBlockComment) {
      const end = line.indexOf('*/');
      if (end === -1) continue;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//')) continue;
    if (trimmed.startsWith('/*')) {
      const end = trimmed.indexOf('*/', 2);
      if (end === -1) {
        inBlockComment = true;
        continue;
      }
      line = trimmed.slice(end + 2);
    }
    lines.push(line.replace(/[ \t]+$/, ''));
  }
  return lines
    .filter((line, i, arr) => line.trim() !== '' || (i > 0 && arr[i - 1].trim() !== ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const hash = (content) => createHash('sha256').update(content).digest('hex').slice(0, 8);

/* --------------------------------------------------- import-graph check --- */

const SPECIFIER_RE = /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g;

function resolveSpecifier(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  const candidates = [base, `${base}.js`, `${base}.json`, join(base, 'index.js')];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

function verifyGraph(dir) {
  const problems = [];
  const stack = walkFiles(dir).filter((f) => f.endsWith('.js')).map((f) => join(dir, f));
  const seen = new Set();
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const code = readFileSync(file, 'utf8');
    for (const match of code.matchAll(SPECIFIER_RE)) {
      const resolved = resolveSpecifier(file, match[1]);
      if (!resolved) {
        problems.push(`${relative(dir, file)} → ${match[1]}`);
        continue;
      }
      if (resolved.endsWith('.js') && !seen.has(resolved)) stack.push(resolved);
    }
  }
  return problems;
}

/* ------------------------------------------------------------- fs helper -- */

function writeOut(relPath, content) {
  const target = join(outDir, relPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
  return target;
}

function walkFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full, base));
    else out.push(relative(base, full).replace(/\\/g, '/'));
  }
  return out;
}

/* ----------------------------------------------------------------- build -- */

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
console.log(`→ build → ${relative(root, outDir) || '.'}`);
rmSync(outDir, { recursive: true, force: true });

// 1. CSS → hashed single file.
const cssSource = readFileSync(CSS_SOURCE, 'utf8');
const cssMin = minifyCss(cssSource);
const cssName = `assets/app-${hash(cssMin)}.css`;
writeOut(cssName, cssMin);

// 2. JS graph → copied verbatim (minified), entry keeps a stable name for simplicity.
const jsRelFiles = walkFiles(src).filter((f) => f.endsWith('.js'));
for (const rel of jsRelFiles) {
  const code = readFileSync(join(src, rel), 'utf8');
  writeOut(rel, minifyJs(code));
}
if (existsSync(join(src, 'site.config.json'))) {
  copyFileSync(join(src, 'site.config.json'), writeOut('site.config.json', readFileSync(join(src, 'site.config.json'))));
}
if (existsSync(join(src, 'data'))) {
  for (const rel of walkFiles(join(src, 'data'))) {
    copyFileSync(join(src, 'data', rel), writeOut(`data/${rel}`, readFileSync(join(src, 'data', rel))));
  }
}

// 3. HTML per page with depth-correct relative paths.
const template = readFileSync(join(src, 'template.html'), 'utf8');
for (const { page, out } of PAGES) {
  const depth = out.split('/').length - 1;
  const prefix = '../'.repeat(depth);
  const html = expandTemplate(template, page, depth, prefix);
  writeOut(out, html);
  console.log(`  · ${out}${depth ? `  (root prefix "${prefix}")` : ''}`);
}

/** Fill in every template placeholder for one page. */
function expandTemplate(template, page, depth, prefix) {
  const replacements = {
    __PAGE__: page,
    __DEPTH__: String(depth),
    __ROOT__: prefix,
    __CSS__: `${prefix}${cssName}`,
    __JS__: `${prefix}${JS_ENTRY}`,
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
  for (const [token, value] of ordered) {
    html = html.replaceAll(token, String(value));
  }
  // Catch leftovers like __TITLE__ but not window.__SITE__.
  // Explicit token names: no character-class guessing, so an unusual regex engine
  // cannot make "_" sneak into [A-Z0-9].
  const leftover = Object.keys(replacements).filter((token) => html.includes(token));
  if (leftover.length) throw new Error(`unexpanded template tokens: ${leftover.join(', ')}`);
  return html;
}

// 4. public/ passthrough.
if (existsSync(publicDir)) {
  for (const rel of walkFiles(publicDir)) {
    const target = join(outDir, rel);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(publicDir, rel), target);
  }
}

// 5. GitHub Pages.
writeOut('.nojekyll', '');

// 6. Verify + report.
const problems = verifyGraph(outDir);
if (problems.length) {
  console.error('\n✗ unresolved imports in dist:');
  for (const p of problems) console.error(`   ${p}`);
  process.exitCode = 1;
}

let total = 0;
for (const rel of walkFiles(outDir)) total += statSync(join(outDir, rel)).size;

console.log(`\n  css  ${cssName}  ${kb(Buffer.byteLength(cssMin))}   (source ${kb(Buffer.byteLength(cssSource))})`);
console.log(`  js   ${jsRelFiles.length} modules copied (entry ${JS_ENTRY})`);
console.log(`  dist ${kb(total)} across ${walkFiles(outDir).length} files`);
console.log(problems.length ? '✗ build finished with import errors' : '✓ build clean');
