// Stage the built site into git and commit it.
//   node scripts/deploy.mjs                 # copy build to root + commit (no network)
//   node scripts/deploy.mjs --push          # commit + push to W1W-SDJ/waw
//   node scripts/deploy.mjs --push --enable-pages   # also switch Pages on via the API
//
// Sandbox note: in a restricted environment only *inherited* stdio can be spawned, so
// every git call goes through execFileSync with stdio:'inherit' and output we need is
// redirected to a temp file inside the workspace instead of piped.

import { existsSync, readFileSync, readdirSync, statSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(join(root, 'src/site.config.json'), 'utf8'));
const dist = join(root, 'dist');
const tmpDir = join(root, '.deploy-tmp');

const portableGit = 'D:\\ai\\tools\\git\\cmd\\git.exe';
const gitExe = existsSync(portableGit) ? portableGit : 'git';

mkdirSync(tmpDir, { recursive: true });

/* ----------------------------------------------------------- git helpers -- */

let capture = 0;

/** Run git with inherited stdio (required under restricted sandboxing). */
function git(args, { quiet = false } = {}) {
  const out = quiet ? join(tmpDir, `out-${++capture}.txt`) : null;
  const err = quiet ? join(tmpDir, `err-${capture}.txt`) : null;

  const wrapped = out ? ['-c', 'core.pager=cat'] : [];
  try {
    if (out) {
      // Write stdout/stderr to files; inherited handles cannot be captured directly.
      const script = `& '${gitExe}' ${args.map((a) => `'${String(a).replace(/'/g, "''")}'`).join(' ')} 1> '${out}' 2> '${err}'; exit $LASTEXITCODE`;
      execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
        cwd: root,
        stdio: 'ignore',
      });
      const text = existsSync(out) ? readFileSync(out, 'utf8').trim() : '';
      return text;
    }
    execFileSync(gitExe, [...wrapped, ...args], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, GIT_TERMINAL_PROMPT: process.env.GITHUB_TOKEN ? '0' : '1' },
    });
    return '';
  } catch (err2) {
    if (quiet) return '';
    throw err2;
  } finally {
    if (out) {
      rmSync(out, { force: true });
      rmSync(err, { force: true });
    }
  }
}

/** Best-effort git call that must not abort the run. */
function gitTry(args, opts = {}) {
  try {
    return git(args, opts);
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------------- checks -- */

console.log(`→ deploy target ${config.owner}/${config.repo}`);
console.log(`  repository ${config.url}`);

if (!existsSync(join(dist, 'index.html'))) {
  console.error('✗ dist/index.html missing — run: npm run build first');
  process.exit(1);
}
console.log(`✓ ${git(['--version'], { quiet: true })}`);

/* ------------------------------------------------------------- git init --- */

if (!existsSync(join(root, '.git'))) {
  git(['init', '-b', 'main']);
  console.log('✓ initialised repository (branch main)');
} else {
  console.log('· repository already initialised');
}

gitTry(['config', 'user.name', config.owner], { quiet: true });
gitTry(['config', 'user.email', `${config.owner}@users.noreply.github.com`], { quiet: true });
gitTry(['config', 'core.quotepath', 'false'], { quiet: true });
gitTry(['config', 'commit.gpgsign', 'false'], { quiet: true });
console.log(
  `✓ identity ${git(['config', 'user.name'], { quiet: true })} <${git(['config', 'user.email'], { quiet: true })}>`,
);

/* ---------------------------------------------------- copy dist to root --- */

const copied = [];
function copyRecursive(srcDir, dstDir, rel = '') {
  for (const entry of readdirSync(srcDir)) {
    const from = join(srcDir, entry);
    const relPath = rel ? `${rel}/${entry}` : entry;
    if (statSync(from).isDirectory()) {
      copyRecursive(from, join(dstDir, entry), relPath);
      continue;
    }
    mkdirSync(dstDir, { recursive: true });
    copyFileSync(from, join(dstDir, entry));
    copied.push(relPath);
  }
}
copyRecursive(dist, root);
console.log(`✓ copied ${copied.length} built files to the repo root`);

/* ---------------------------------------------------------------- commit -- */

gitTry(['add', '-A'], { quiet: true });

const status = git(['status', '--porcelain'], { quiet: true });
if (!status) {
  console.log('· nothing to commit — tree already matches the build');
} else {
  const lines = status.split('\n').filter(Boolean);
  console.log(`· ${lines.length} changed path(s)`);
  for (const line of lines.slice(0, 8)) console.log(`   ${line}`);
  if (lines.length > 8) console.log(`   … ${lines.length - 8} more`);

  const subject = `site: publish build ${new Date().toISOString().slice(0, 10)}`;
  git(['commit', '-m', subject], {});
  console.log(`✓ committed "${subject}"`);
}

console.log(`· HEAD ${git(['log', '-1', '--pretty=%h %s'], { quiet: true }) || '(none)'}`);

/* ------------------------------------------------------------------ push -- */

if (!process.argv.includes('--push')) {
  console.log('\n· dry run — nothing pushed. Add --push to publish.');
  rmSync(tmpDir, { recursive: true, force: true });
  process.exit(0);
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('\n✗ GITHUB_TOKEN is not set.');
  console.error('  Create one at https://github.com/settings/tokens with the `repo` scope, then:');
  console.error('    $env:GITHUB_TOKEN="ghp_..."; node scripts/deploy.mjs --push');
  process.exit(1);
}

const remoteUrl = `https://x-access-token:${token}@github.com/${config.owner}/${config.repo}.git`;
gitTry(['remote', 'remove', 'origin'], { quiet: true });
git(['remote', 'add', 'origin', remoteUrl], { quiet: true });

console.log('→ pushing (large-ish first push, be patient)…');
try {
  git(['push', '-u', 'origin', 'main'], {});
  console.log('✓ pushed to origin/main');
} catch (err) {
  console.error('✗ push failed:', err.message);
  gitTry(['remote', 'set-url', 'origin', config.url], { quiet: true });
  rmSync(tmpDir, { recursive: true, force: true });
  process.exit(1);
}
gitTry(['remote', 'set-url', 'origin', config.url], { quiet: true });
console.log('✓ remote reset to the plain HTTPS URL (token is not persisted)');

/* ------------------------------------------------------------ enable pages -- */

if (process.argv.includes('--enable-pages')) {
  console.log('→ enabling GitHub Pages (main / root)…');
  const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/pages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'waw-deploy',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ source: { branch: 'main', path: '/' } }),
  });

  if (res.status === 201) {
    const page = await res.json();
    console.log(`✓ Pages enabled → ${page.html_url}`);
  } else if (res.status === 409) {
    console.log('· Pages already enabled');
  } else {
    const body = await res.text();
    console.error(`✗ could not enable Pages (${res.status}): ${body.slice(0, 300)}`);
    console.error('  Enable manually: Settings → Pages → Deploy from a branch → main / (root)');
  }
}

rmSync(tmpDir, { recursive: true, force: true });
console.log(`\n  site (after Pages build, ~1 min): ${config.siteUrl}`);
