const cfg = globalThis.__SITE__;
if (!cfg) throw new Error('window.__SITE__ missing — template was not expanded');

export const site = cfg;

export const NAV = [
  { key: 'home', href: '', label: '首页', en: 'Home', index: '01' },
  { key: 'projects', href: 'projects/', label: '作品', en: 'Projects', index: '02' },
  { key: 'about', href: 'about/', label: '关于', en: 'About', index: '03' },
];

export const THEME_KEY = 'waw-theme';

/** Relative prefix for the current page depth ('' for home, '../' for subpages). */
export function prefix() {
  return '../'.repeat(Number(document.body.dataset.depth ?? 0));
}

/** Link to a path inside the site, relative to the current page. */
export function link(path = '') {
  return `${prefix()}${path}`;
}

export function absolute(path = '') {
  return new URL(path, site.siteUrl).href;
}

export function currentPage() {
  return document.body.dataset.page ?? 'home';
}

export function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function formatMonth(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function relativeDays(iso) {
  if (!iso) return null;
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (Number.isNaN(days)) return null;
  if (days <= 1) return '今天更新';
  if (days < 30) return `${days} 天前更新`;
  if (days < 365) return `${Math.round(days / 30)} 个月前更新`;
  return `${Math.round(days / 365)} 年前更新`;
}
