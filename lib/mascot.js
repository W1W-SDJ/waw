import { whaleSvg } from './whale.js?v=02ebf735';

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
  '要不要看看我做的项目？',
  '咕噜咕噜…在写代码',
  '一起做点可爱的东西吧',
  '嘿，别戳啦，会痒的！',
  '不许叫我大肥鱼',
  '再戳一下我就唱歌了（骗你的）',
];

const HEARTS = ['🐋', '🫧', '💙', '🐳'];

export function initMascot() {
  const figures = document.querySelectorAll('[data-mascot]');
  if (!figures.length) return;

  const sayings = new Map();

  for (const figure of figures) {
    const bubble = figure.querySelector('[data-mascot-say]');
    const hold = figure.querySelector('.whale-hold');
    sayings.set(figure, 0);

    figure.setAttribute('role', 'button');
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('aria-label', '和看板娘互动');

    const react = () => {
      figure.classList.remove('is-tapped');
      void figure.offsetWidth;
      figure.classList.add('is-tapped');

      const next = ((sayings.get(figure) ?? 0) + 1) % SAYINGS.length;
      sayings.set(figure, next);
      if (bubble) bubble.textContent = SAYINGS[next];

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) spawnHearts(figure, hold);
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

function spawnHearts(figure, origin) {
  const host = document.createElement('span');
  host.className = 'mascot-hearts';
  host.setAttribute('aria-hidden', 'true');

  const count = 3;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    el.style.setProperty('--x', `${(Math.random() * 54 - 27).toFixed(0)}px`);
    el.style.setProperty('--delay', `${(i * 90).toFixed(0)}ms`);
    el.style.setProperty('--scale', `${(0.75 + Math.random() * 0.6).toFixed(2)}`);
    host.appendChild(el);
  }

  (origin ?? figure).appendChild(host);
  window.setTimeout(() => host.remove(), 1400);
}