import { icon } from './icons.js';
import { site, NAV, THEME_KEY, link, currentPage } from './site.js';
import { whaleSvg } from './whale.js';
import { initMascot, initWhaleRain } from './mascot.js';

export { site, link, currentPage, esc, formatMonth, relativeDays } from './site.js';

/* ------------------------------------------------------------- whales --- */

/** Fill every [data-whale-pet] slot with the little whale she holds. */
export function paintWhalePets(scope = document) {
  for (const slot of scope.querySelectorAll('[data-whale-pet]')) {
    if (slot.firstElementChild) continue;
    slot.innerHTML = whaleSvg({ cls: 'whale-pet-art' });
  }
}

/* ---------------------------------------------------------------- shell --- */

/**
 * Render the persistent chrome (rail + footer) around the page content.
 * @param {0|1} depth how many directories deep the current page lives
 */
export function renderShell(depth = 0) {
  const active = currentPage();
  const root = document.getElementById('site');
  if (!root) throw new Error('#site root missing');

  const nav = NAV.map((item) => {
    const current = item.key === active ? ' aria-current="page"' : '';
    const href = item.key === active && depth === 0 ? './' : `${'../'.repeat(depth)}${item.href}`;
    return `<a class="navlink" href="${href}"${current}><i>${item.index}</i>${item.label}<span class="navlink__en">${item.en}</span></a>`;
  }).join('');

  // The whale girl's face is the brand mark — it reads instantly at 40px.
  const mark = `<img class="rail__mark" src="${'../'.repeat(depth)}whale-head.png" alt="" width="41" height="41" decoding="async">`;

  const emailRow = site.email ? `<a href="mailto:${site.email}">${site.email}</a>` : '';

  root.innerHTML = `
    <a class="skip" href="#content">跳到正文</a>
    <div class="shell">
      <header class="rail">
        <a class="rail__brand" href="${'../'.repeat(depth)}./" aria-label="${site.name} 首页">
          ${mark}
          <span class="rail__brandtext">
            <b>${site.name}</b>
            <span>@${site.owner}</span>
          </span>
        </a>

        <nav class="rail__nav" aria-label="主导航">${nav}</nav>

        <div class="rail__foot">
          <p class="rail__status"><span class="dot" aria-hidden="true"></span>可联系 / open to talk</p>
          <div class="rail__meta">
            <a href="${site.social.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            ${emailRow}
          </div>
          <button class="themebtn" type="button" data-theme-toggle aria-label="切换深浅色">
            ${icon('moon')}${icon('sun')}
            <span class="lbl-light">深色</span><span class="lbl-dark">浅色</span>
          </button>
        </div>
      </header>

      <main class="main" id="content"></main>

      <footer class="foot">
        <span>© ${new Date().getFullYear()} ${site.name} · ${site.owner}</span>
        <span>鲸鱼娘立绘 <a href="https://github.com/1190fasheqi/dafeiyu-pet" target="_blank" rel="noopener noreferrer">dafeiyu-pet</a> (MIT) · 手写无依赖</span>
        <a class="foot__top" href="#top">${icon('arrowUp')}回到顶部</a>
      </footer>
    </div>
  `;
}

/* ---------------------------------------------------------------- theme --- */

export function initTheme() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const el = document.documentElement;
    const next = el.dataset.theme === 'dark' ? 'light' : 'dark';
    el.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — theme still applies for this view */
    }
  });
}

/* --------------------------------------------------------------- reveal --- */

export function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  const revealAll = () => {
    for (const el of targets) el.classList.add('is-in');
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
  );

  targets.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 55}ms`;
    io.observe(el);
  });

  // Safety net: content must never stay invisible. Reveal anything already in the
  // viewport on the next frame, and force everything visible after a short delay —
  // covers environments where the observer never fires (prerender, headless, print).
  requestAnimationFrame(() => {
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) el.classList.add('is-in');
    }
  });

  window.setTimeout(revealAll, 1500);
  window.addEventListener('load', () => window.setTimeout(revealAll, 900), { once: true });
}

/* ------------------------------------------------------------------ boot -- */

/**
 * Page bootstrap: chrome first, then page content, then motion wiring.
 * @param {(outlet: HTMLElement) => void | Promise<void>} render
 */
export async function boot(render) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const depth = Number(document.body.dataset.depth ?? 0);
  renderShell(depth);
  initTheme();
  paintWhalePets();      // the background mascot's held whale
  initWhaleRain();       // slow drift of small whales behind everything
  const outlet = document.getElementById('content');
  await render(outlet);
  paintWhalePets();      // page-rendered mascots
  initMascot();
  initReveal();
}
