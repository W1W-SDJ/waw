import { icon } from './icons.js';
import { site, NAV, THEME_KEY, link, currentPage } from './site.js';

export { site, link, currentPage, esc, formatMonth, relativeDays } from './site.js';

export function renderShell(depth = 0) {
  const active = currentPage();
  const root = document.getElementById('site');
  if (!root) throw new Error('#site root missing');

  const nav = NAV.map((item) => {
    const current = item.key === active ? ' aria-current="page"' : '';
    const href = item.key === active && depth === 0 ? './' : `${'../'.repeat(depth)}${item.href}`;
    return `<a class="navlink" href="${href}"${current}><i>${item.index}</i>${item.label}<span class="navlink__en">${item.en}</span></a>`;
  }).join('');

  const mark = site.avatar
    ? `<img class="rail__mark" src="${site.avatar}" alt="" width="38" height="38" loading="lazy" referrerpolicy="no-referrer">`
    : `<span class="rail__monogram" aria-hidden="true">${(site.name || site.owner).slice(0, 1).toUpperCase()}</span>`;

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
        <span>零依赖手写 · <a href="https://pages.github.com/" target="_blank" rel="noopener noreferrer">GitHub Pages</a></span>
        <a class="foot__top" href="#top">${icon('arrowUp')}回到顶部</a>
      </footer>
    </div>
  `;
}

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

    }
  });
}

export function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    for (const el of targets) el.classList.add('is-in');
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
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  targets.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
    io.observe(el);
  });
}

export async function boot(render) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const depth = Number(document.body.dataset.depth ?? 0);
  renderShell(depth);
  initTheme();
  const outlet = document.getElementById('content');
  await render(outlet);
  initReveal();
}