/* Freshness guard.
 *
 * GitHub Pages caches HTML for ~10 minutes, and a tab left open keeps its old DOM
 * indefinitely — so a deploy can be live while the page you're reading still shows
 * the previous build. This compares the build id baked into the page with the one
 * the server currently serves and offers a refresh when they differ.
 */

const CHECK_EVERY_MS = 5 * 60 * 1000;

let shown = false;
let lastCheck = 0;

export function initFreshness(localBuildId) {
  if (!localBuildId || localBuildId === 'dev') return;

  const check = async () => {
    if (shown || Date.now() - lastCheck < CHECK_EVERY_MS) return;
    lastCheck = Date.now();

    try {
      const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const { v } = await res.json();
      if (!v || v === localBuildId) return;
      show(localBuildId, v);
    } catch {
      /* offline, or the file isn't there — never bother the reader */
    }
  };

  const show = () => {
    shown = true;
    const el = document.createElement('div');
    el.className = 'freshness';
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <span>页面有新版本了</span>
      <button type="button" class="freshness__btn">刷新看看</button>
    `;
    el.querySelector('.freshness__btn').addEventListener('click', () => location.reload());
    document.body.appendChild(el);
  };

  // Once shortly after load, then whenever the tab becomes visible again — that is
  // exactly the "left open for days" case.
  window.setTimeout(check, 4000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}
