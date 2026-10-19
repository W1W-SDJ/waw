const PATHS = {
  arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  github:
    '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  star: '<path d="M11.5 2.5 14 8l6 .9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3 8.9 9 8z"/>',
  fork: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><path d="M12 15v-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 7 9 6 9-6"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M6.3 17.7l2.4-2.4M15.3 8.7l2.4-2.4"/>',
  code: '<path d="m9 18-6-6 6-6"/><path d="m15 6 6 6-6 6"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
};

export function icon(name, opts = {}) {
  const d = PATHS[name];
  if (!d) throw new Error(`unknown icon: ${name}`);
  const size = opts.size ?? 16;
  const cls = opts.cls ? ` class="${opts.cls}"` : '';
  return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}

const LANG_COLORS = {
  JavaScript: '#c9a227',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  HTML: '#c4532d',
  CSS: '#663399',
  Shell: '#4eaa25',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Java: '#b07219',
  Go: '#00add8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Lua: '#000080',
  Jupyter: '#da5b0b',
  'Jupyter Notebook': '#da5b0b',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  R: '#198ce7',
  MATLAB: '#e16737',
  Assembly: '#6e4c13',
  Makefile: '#427819',
  Dockerfile: '#384d54',
  TeX: '#3d6117',
};

export function langColor(lang) {
  if (!lang) return 'var(--ink-3)';
  return LANG_COLORS[lang] ?? 'var(--ink-3)';
}