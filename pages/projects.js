import { icon } from '../lib/icons.js?v=14940af1';
import { projectCard } from '../lib/projects-view.js?v=14940af1';
import { generatedAt, loadProjects, CATEGORY_LABELS } from '../data/projects.js?v=14940af1';
import { relativeDays } from '../lib/site.js?v=14940af1';

export default async function renderProjects(outlet) {
  const projects = await loadProjects();
  const categories = [...new Set(projects.map((p) => p.category))].filter(Boolean);
  const synced = generatedAt();

  outlet.innerHTML = `
    <section class="hero hero--page reveal" id="top">
      <p class="kicker">02 / Projects</p>
      <h1 class="hero__title">作品<em>档案</em></h1>
      <p class="hero__lede">
        共 ${projects.length} 个项目，从 GitHub 同步而来。按关键词或类别筛选，
        点标题直接跳到仓库。
      </p>
      <p class="syncnote">
        ${icon('spark')}数据同步于 ${synced ? relativeDays(synced) ?? '' : '—'}${synced ? ` · ${new Date(synced).toLocaleString('zh-CN', { hour12: false })}` : ''}
      </p>
    </section>

    <section class="section section--flush">
      <div class="toolbar reveal" role="search">
        <label class="field">
          ${icon('search')}
          <input type="search" placeholder="搜索项目名、说明或标签…" data-search-input aria-label="搜索项目">
        </label>
        <button class="chip" type="button" data-filter="all" aria-pressed="true">全部</button>
        ${categories
          .map((c) => `<button class="chip" type="button" data-filter="${c}" aria-pressed="false">${CATEGORY_LABELS[c] ?? c}</button>`)
          .join('')}
      </div>

      <div class="grid" data-projects data-count="${projects.length}">
        ${projects.length ? projects.map(projectCard).join('') : ''}
      </div>

      <p class="empty" data-empty hidden>没有匹配的项目，换个关键词试试。</p>
    </section>
  `;

  wireFilters(outlet);
}

function wireFilters(outlet) {
  const cards = [...outlet.querySelectorAll('[data-project]')];
  const input = outlet.querySelector('[data-search-input]');
  const chips = [...outlet.querySelectorAll('[data-filter]')];
  const empty = outlet.querySelector('[data-empty]');

  let category = 'all';
  let query = '';

  const apply = () => {
    let shown = 0;
    for (const card of cards) {
      const matchCategory = category === 'all' || card.dataset.category === category;
      const matchQuery = !query || card.dataset.search.includes(query);
      const visible = matchCategory && matchQuery;
      card.hidden = !visible;
      if (visible) shown++;
    }
    if (empty) empty.hidden = shown > 0;
  };

  input?.addEventListener('input', () => {
    query = input.value.trim().toLowerCase();
    apply();
  });

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      category = chip.dataset.filter;
      for (const other of chips) other.setAttribute('aria-pressed', String(other === chip));
      apply();
    });
  }
}