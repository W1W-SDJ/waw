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

  window.setTimeout(check, 4000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}