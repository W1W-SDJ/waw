import { whaleSvg } from './whale.js?v=1cde691b';

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

const SAYINGS = [
  '今天也在认真摸鱼～',
  '要不要看看我的项目？',
  '咕噜咕噜…在写代码',
  '一起做点可爱的东西吧',
  '嘿，别戳啦，会痒的！',
  '不许叫我大肥鱼',
  '再戳一下我就唱歌了（骗你的）',
];

const HEARTS = ['🐋', '🫧', '💙', '🐳'];
const NOTES = ['♪', '♫', '♬', '🎵'];

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

    figure.setAttribute('role', 'button');
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('aria-label', '和看板娘互动');

    const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sing = () => {
      singing = true;
      index = -1; // restart the cycle afterwards
      figure.classList.add('is-singing');
      if (bubble) bubble.textContent = SING_TEXT;

      if (!reduce()) {
        for (const delay of [0, 1300, 2600]) {
          window.setTimeout(() => {
            if (singing) spawnBurst(figure, hold, NOTES, 3);
          }, delay);
        }
      }

      window.setTimeout(() => {
        singing = false;
        figure.classList.remove('is-singing');
        if (bubble) bubble.textContent = SING_DONE;
      }, SING_MS);
    };

    const react = () => {
      if (singing) return; // let her finish the song

      figure.classList.remove('is-tapped');
      void figure.offsetWidth;
      figure.classList.add('is-tapped');

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