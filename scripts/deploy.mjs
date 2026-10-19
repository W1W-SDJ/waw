// Stage the built site into git and commit it.
//   node scripts/deploy.mjs                 # copy build to root + commit (no network)
//   node scripts/deploy.mjs --push          # commit + push to W1W-SDJ/waw
//   node scripts/deploy.mjs --push --enable-pages   # also switch Pages on via the API
//
// Sandbox note: in a restricted environment only *inherited* stdio can be spawned, so
// every git call goes through execFileSync with stdio:'inherit' and output we need is
// redirected to a temp file inside the workspace instead of piped.

import { existsSync, readFileSync, readdirSync, statSync, copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(join(root, 'src/site.config.json'), 'utf8'));
const dist = join(root, 'dist');
const tmpDir = join(root, '.deploy-tmp');

const portableGit = 'D:\\ai\\tools\\git\\cmd\\git.exe';
const gitExe = existsSync(portableGit) ? portableGit : 'git';

mkdirSync(tmpDir, { recursive: true });

/* ----------------------------------------------------------- TLS trust --- */

/**
 * Corporate proxies, VPNs and "accelerator" tools re-sign TLS traffic, which makes git
 * fail with UNABLE_TO_VERIFY_LEAF_SIGNATURE while the browser still works (it trusts the
 * Windows store). Git's bundled OpenSSL ignores the Windows store, so build a CA bundle
 * from git's own roots plus the machine's CurrentUser Root/CA stores.
 * Returns the bundle path, or undefined to keep git's default behaviour.
 */
function buildCaBundle() {
  const bundle = join(tmpDir, 'ca-bundle.crt');
  const gitRoots = [
    'D:\\ai\\tools\\git\\ucrt64\\etc\\ssl\\certs\\ca-bundle.crt',
    'D:\\ai\\tools\\git\\mingw64\\ssl\\certs\\ca-bundle.crt',
    'D:\\ai\\tools\\git\\etc\\ssl\\certs\\ca-bundle.crt',
  ].find((p) => existsSync(p));

  // Export the Windows stores with PowerShell (no certutil: it is denied in sandboxes).
  const script = `
    $sb = New-Object System.Text.StringBuilder
    foreach ($store in @('Root','CA')) {
      foreach ($c in (Get-ChildItem "Cert:\\CurrentUser\\$store" -ErrorAction SilentlyContinue)) {
        try {
          $b64 = [Convert]::ToBase64String($c.RawData, 'InsertLineBreaks')
          [void]$sb.AppendLine("-----BEGIN CERTIFICATE-----")
          [void]$sb.AppendLine($b64)
          [void]$sb.AppendLine("-----END CERTIFICATE-----")
        } catch {}
      }
    }
    [System.IO.File]::WriteAllText('${bundle}.win', $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
  `;

  try {
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { stdio: 'ignore' });
  } catch {
    return undefined;
  }

  if (!existsSync(`${bundle}.win`)) return undefined;

  const parts = [];
  if (gitRoots) parts.push(readFileSync(gitRoots, 'utf8'));
  parts.push(readFileSync(`${bundle}.win`, 'utf8'));
  writeFileSync(bundle, parts.join('\n'), 'utf8');
  rmSync(`${bundle}.win`, { force: true });
  return bundle;
}

const caBundle = buildCaBundle();
if (caBundle) console.log(`✓ TLS: CA bundle with Windows store loaded (${caBundle})`);

/* ----------------------------------------------------------- git helpers -- */

let capture = 0;

/** Environment shared by every git invocation. */
function gitEnv() {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: process.env.GITHUB_TOKEN ? '0' : '1' };
  if (caBundle) {
    env.GIT_SSL_CAINFO = caBundle;
    env.SSL_CERT_FILE = caBundle;
  }
  return env;
}

/** Run git with inherited stdio (required under restricted sandboxing). */
function git(args, { quiet = false } = {}) {
  if (!quiet) {
    execFileSync(gitExe, args, { cwd: root, stdio: 'inherit', env: gitEnv() });
    return '';
  }

  // Capture path: PowerShell's `>` redirection emits UTF-16, so we set the console
  // output encodings to UTF-8 and pipe through Out-File with an explicit encoding.
  const out = join(tmpDir, `out-${++capture}.txt`);
  const quoted = args.map((a) => `'${String(a).replace(/'/g, "''")}'`).join(' ');
  const script = [
    "$ErrorActionPreference='Continue'",
    "$OutputEncoding=[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)",
    `& '${gitExe}' ${quoted} 2>$null | Out-String | Set-Content -Path '${out}' -Encoding utf8`,
  ].join('; ');

  try {
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
      cwd: root,
      stdio: 'ignore',
      env: gitEnv(),
    });
  } catch {
    return '';
  }

  const text = existsSync(out) ? readFileSync(out, 'utf8').replace(/\r/g, '').trim() : '';
  rmSync(out, { force: true });
  return text;
}

/** Best-effort git call that must not abort the run. */
function gitTry(args, opts = {}) {
  try {
    return git(args, opts);
  } catch {
    return null;
  }
}

/** Read a ref straight out of .git (no subprocess, no encoding pitfalls). */
function readHead() {
  try {
    const head = readFileSync(join(root, '.git', 'HEAD'), 'utf8').trim();
    if (!head.startsWith('ref: ')) return head.slice(0, 7);
    const ref = head.slice(5).trim();
    const sha = readFileSync(join(root, '.git', ...ref.split('/')), 'utf8').trim();
    return sha.slice(0, 7);
  } catch {
    return '(none)';
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
// Windows git defaults to schannel, whose credential handle is unavailable in restricted
// sandboxes ("SEC_E_NO_CREDENTIALS"). OpenSSL + an explicit CA bundle works instead.
gitTry(['config', 'http.sslBackend', 'openssl'], { quiet: true });
if (caBundle) {
  gitTry(['config', 'http.sslCAInfo', caBundle], { quiet: true });
}
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

console.log(`· HEAD ${readHead()}`);

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
