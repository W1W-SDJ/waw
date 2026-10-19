// Download portable git (MinGit) and the GitHub CLI into D:\ai\tools.
// Uses Node's fetch + the ESM zlib API, so it needs no curl, no winget and no admin rights.
//   node scripts/get-toolchain.mjs
//
// Windows support note: winget on this machine is only a 0-byte App Execution Alias stub.

import { writeFileSync, mkdirSync, existsSync, statSync, rmSync, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const toolsDir = 'D:\\ai\\tools';
const tmpDir = join(toolsDir, '_download');
mkdirSync(tmpDir, { recursive: true });

const headers = { 'User-Agent': 'waw-toolchain', Accept: 'application/vnd.github+json' };

/** GitHub connectivity here is flaky — retry with backoff instead of failing the run. */
async function fetchRetry(url, opts = {}, attempts = 5) {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(120_000) });
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      if (i < attempts) {
        const wait = Math.min(2 ** i * 1000, 20_000);
        console.log(`  … attempt ${i}/${attempts} failed (${err.message}) — retrying in ${wait / 1000}s`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastError;
}

async function latestAsset(repo, matcher) {
  const res = await fetchRetry(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
  if (!res.ok) throw new Error(`${repo}: ${res.status} ${res.statusText}`);
  const release = await res.json();
  const asset = release.assets.find((a) => matcher.test(a.name));
  if (!asset) throw new Error(`${repo}: no asset matching ${matcher} in ${release.tag_name}`);
  return { tag: release.tag_name, name: asset.name, url: asset.browser_download_url, size: asset.size };
}

async function download(asset, dest) {
  if (existsSync(dest) && statSync(dest).size === asset.size) {
    console.log(`  = cached ${asset.name}`);
    return dest;
  }
  const res = await fetchRetry(asset.url, { headers: { 'User-Agent': 'waw-toolchain' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`download ${asset.name}: ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  const size = statSync(dest).size;
  console.log(`  ↓ ${asset.name}  ${(size / 1048576).toFixed(1)}MB`);
  return dest;
}

/* ------------------------------------------------------------------ main -- */

/** Extract a .zip using Windows' bundled bsdtar (tar.exe) — no extra modules needed. */
function extractWithTar(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true });
  execFileSync('tar', ['-xf', zipPath, '-C', destDir], { stdio: 'inherit' });
}

console.log('→ resolving latest portable builds');
const targets = [
  { key: 'git', repo: 'git-for-windows/git', match: /^MinGit-.*-64-bit\.zip$/ },
  { key: 'gh', repo: 'cli/cli', match: /windows_amd64\.zip$/ },
];

for (const target of targets) {
  const asset = await latestAsset(target.repo, target.match);
  console.log(`· ${target.key} ${asset.tag} → ${asset.name} (${(asset.size / 1048576).toFixed(1)}MB)`);
  const zip = await download(asset, join(tmpDir, asset.name));
  const dest = join(toolsDir, target.key);
  if (existsSync(join(dest, '.ready'))) {
    console.log(`  = already extracted → ${dest}`);
    continue;
  }
  rmSync(dest, { recursive: true, force: true });
  console.log(`  ⤷ extracting → ${dest}`);
  extractWithTar(zip, dest);
  writeFileSync(join(dest, '.ready'), `${asset.tag}\n${new Date().toISOString()}\n`);
}

console.log('\n✓ toolchain ready');
for (const key of ['git', 'gh']) {
  const exe = key === 'git' ? join(toolsDir, 'git', 'cmd', 'git.exe') : join(toolsDir, 'gh', 'bin', 'gh.exe');
  console.log(`  ${key}: ${existsSync(exe) ? 'OK' : 'MISSING'}  ${exe}`);
}
