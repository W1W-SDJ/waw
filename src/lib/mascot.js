import { whaleSvg } from './whale.js';
import { playSong } from './song.js';

/* Falling whales — a slow drift of small whales behind the content.
   Count stays low on purpose: it should read as atmosphere, not confetti. */

const RAIN_COUNT = 18;

export function initWhaleRain() {
  const layer = document.querySelector('.whale-rain');
  if (!layer) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    layer.hidden = true;
    return;
  }

  const frag = document.createDocumentFragment();
  for (let i = 0; i < RAIN_COUNT; i++) {
    const span = document.createElement('span');
    span.className = 'rain-whale';
    // Deterministic-ish spread: stratify left so they never clump.
    const left = ((i + 0.5) / RAIN_COUNT) * 100 + (Math.random() * 8 - 4);
    const size = 14 + Math.random() * 18;
    const duration = 16 + Math.random() * 16;
    const delay = -(Math.random() * duration); // start mid-flight
    span.style.setProperty('--l', `${left.toFixed(1)}%`);
    span.style.setProperty('--dur', `${duration.toFixed(1)}s`);
    span.style.setProperty('--delay', `${delay.toFixed(1)}s`);
    span.style.setProperty('--s', `${size.toFixed(0)}px`);
    span.style.setProperty('--drift', `${(Math.random() * 40 - 20).toFixed(0)}px`);
    span.style.setProperty('--spin', `${(Math.random() * 50 - 25).toFixed(0)}deg`);
    span.innerHTML = whaleSvg({ cls: 'rain-whale__art' });
    frag.appendChild(span);
  }
  layer.appendChild(frag);
}

/* Mascot interaction — tap the whale girl and she reacts.
   She cycles through seven lines; the seventh promises a song, so the tap after it
   actually makes her sing. */

const SAYINGS = [
  '今天也在认真摸鱼～',
  '要不要看看我的项目？',
  '咕噜咕噜…在写代码',
  '一起做点可爱的东西吧',
  '嘿，别戳啦，会痒的！',
  '不许叫我大肥鱼',
  '再戳一下我就唱歌了',
];

const HEARTS = ['🐋', '🫧', '💙', '🐳'];
const NOTES = ['♪', '♫', '♬', '🎵'];

/** Shown while she sings, and right after. */
const SING_TEXT = '♪ 啦～啦啦～ ♪';
const SING_DONE = '唱完啦～ 还要听吗？';
const SING_MS = 4200;

export function initMascot() {
  const figures = document.querySelectorAll('[data-mascot]');
  if (!figures.length) return;

  for (const figure of figures) {
    const bubble = figure.querySelector('[data-mascot-say]');
    const hold = figure.querySelector('.whale-hold');
    let index = -1;   // -1 = nothing said yet
    let singing = false;

    // Keyboard access: it behaves like a button.
    figure.setAttribute('role', 'button');
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('aria-label', '和看板娘互动');

    const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sing = () => {
      singing = true;
      index = -1; // restart the cycle afterwards
      figure.classList.add('is-singing');
      if (bubble) bubble.textContent = SING_TEXT;

      // The click that started this is the user gesture browsers require for audio.
      const songSeconds = playSong();
      if (songSeconds === null && bubble) {
        // No Web Audio (very old browser) — keep the visual performance.
        bubble.textContent = '♪ 啦～啦啦～ ♪（这台设备放不出声音）';
      }

      // Keep the sway on screen for as long as the tune actually plays.
      const singMs = songSeconds ? Math.round(songSeconds * 1000) + 450 : SING_MS;

      if (!reduce()) {
        // A wave of notes at the start, middle and end of the tune.
        for (const delay of [0, Math.round(singMs * 0.33), Math.round(singMs * 0.66)]) {
          window.setTimeout(() => {
            if (singing) spawnBurst(figure, hold, NOTES, 3);
          }, delay);
        }
      }

      window.setTimeout(() => {
        singing = false;
        figure.classList.remove('is-singing');
        if (bubble) bubble.textContent = SING_DONE;
      }, singMs);
    };

    const react = () => {
      if (singing) return; // let her finish the song

      figure.classList.remove('is-tapped');
      // Force a reflow so the squash animation can replay on rapid taps.
      void figure.offsetWidth;
      figure.classList.add('is-tapped');

      // The line currently on screen was the promise — next tap delivers it.
      if (index === SAYINGS.length - 1) {
        sing();
        return;
      }

      index += 1;
      if (bubble) bubble.textContent = SAYINGS[index];
      if (!reduce()) spawnBurst(figure, hold, HEARTS, 3);
    };

    figure.addEventListener('click', react);
    figure.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        react();
      }
    });
  }
}

/** Throw a small burst of emoji upward from `origin`. */
function spawnBurst(figure, origin, symbols, count = 3) {
  const host = document.createElement('span');
  host.className = 'mascot-hearts';
  host.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.setProperty('--x', `${(Math.random() * 54 - 27).toFixed(0)}px`);
    el.style.setProperty('--delay', `${(i * 90).toFixed(0)}ms`);
    el.style.setProperty('--scale', `${(0.75 + Math.random() * 0.6).toFixed(2)}`);
    host.appendChild(el);
  }

  (origin ?? figure).appendChild(host);
  window.setTimeout(() => host.remove(), 1400);
}
