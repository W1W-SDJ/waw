// Instrumented harness for the singing feature.
//   node scripts/sing-harness.mjs <outDir> [muted]
// Writes a copy of dist/ whose page:
//   · wraps AudioContext to count contexts + oscillators
//   · clicks the mascot 8 times (7 sayings, then the song)
//   · writes the counters into document.title for --dump-dom
import { readdirSync, statSync, copyFileSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, process.argv[2] ?? '.deploy-tmp/singtest');
const muted = process.argv.includes('muted');

rmSync(outDir, { recursive: true, force: true });

function copyTree(from, to, rel = '') {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const src = join(from, entry);
    const dst = join(to, entry);
    if (statSync(src).isDirectory()) copyTree(src, dst, rel ? `${rel}/${entry}` : entry);
    else copyFileSync(src, dst);
  }
}
copyTree(join(root, 'dist'), outDir);

const inject = `
<script>
${muted ? `try { localStorage.setItem('waw-sound', 'off'); } catch (e) {}` : ''}
window.addEventListener('load', function () {
  var Orig = window.AudioContext || window.webkitAudioContext;
  var ctxCount = 0, oscCount = 0;
  if (Orig) {
    window.AudioContext = function () {
      ctxCount++;
      var inner = new Orig();
      var create = inner.createOscillator.bind(inner);
      inner.createOscillator = function () { oscCount++; return create(); };
      return inner;
    };
  } else {
    document.title = 'NO-WEB-AUDIO';
  }
  setTimeout(function () {
    var f = document.querySelector('[data-mascot]');
    var n = 0;
    var iv = setInterval(function () {
      if (!f || n >= 8) {
        clearInterval(iv);
        setTimeout(function () {
          var bubble = document.querySelector('[data-mascot-say]');
          var fig = document.querySelector('[data-mascot]');
          document.title = 'CTX=' + ctxCount + ' OSC=' + oscCount
            + ' SINGING=' + (fig && fig.classList.contains('is-singing') ? '1' : '0')
            + ' BUBBLE=' + (bubble ? bubble.textContent : '?')
            + ' SOUNDBTN=' + (document.querySelector('[data-sound-toggle]') ? '1' : '0');
        }, 400);
        return;
      }
      f.click();
      n++;
    }, 70);
  }, 400);
});
</script>
`;

const indexPath = join(outDir, 'index.html');
writeFileSync(indexPath, readFileSync(indexPath, 'utf8').replace('</body>', `${inject}</body>`), 'utf8');
console.log(`harness → ${outDir}${muted ? ' (muted)' : ''}`);
