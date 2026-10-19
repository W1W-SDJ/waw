import { boot } from './lib/shell.js';

const PAGES = {
  home: () => import('./pages/home.js'),
  projects: () => import('./pages/projects.js'),
  about: () => import('./pages/about.js'),
};

const page = document.body.dataset.page ?? 'home';
const load = PAGES[page];

if (!load) {
  console.error(`[site] unknown page "${page}" — falling back to home`);
}

boot(async (outlet) => {
  const mod = await (load ?? PAGES.home)();
  await mod.default(outlet);
}).catch((err) => {
  console.error('[site] render failed', err);
  const outlet = document.getElementById('content');
  if (outlet) {
    outlet.innerHTML = `
      <section class="section">
        <div class="empty">
          页面渲染出错：${String(err?.message ?? err)}<br>
          刷新试试，或直接去 <a href="https://github.com/W1W-SDJ">GitHub</a>。
        </div>
      </section>`;
  }
});
