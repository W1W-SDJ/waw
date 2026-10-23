import { icon } from './icons.js?v=3d3cad43';
import { esc, formatMonth, relativeDays } from './site.js?v=3d3cad43';

export function projectCard(project) {
  const haystack = [project.title, project.name, project.blurb, project.note, project.language, ...(project.tags ?? [])]
    .join(' ')
    .toLowerCase();

  const external = project.homepage
    ? `<a class="card__ext" href="${esc(project.homepage)}" target="_blank" rel="noopener noreferrer" title="在线访问">${icon('globe')}</a>`
    : project.url
      ? `<a class="card__ext" href="${esc(project.url)}" target="_blank" rel="noopener noreferrer" title="在 GitHub 打开">${icon('github')}</a>`
      : '';

  const tags = (project.tags ?? []).slice(0, 4).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const stamp = relativeDays(project.updatedAt) ?? formatMonth(project.updatedAt);

  const title = project.url
    ? `<a href="${esc(project.url)}" target="_blank" rel="noopener noreferrer">${esc(project.title)}</a>`
    : esc(project.title);

  return `
    <article class="card reveal" data-project data-search="${esc(haystack)}"${project.category ? ` data-category="${esc(project.category)}"` : ''}>
      <div class="card__top">
        <span class="card__lang">
          <i class="langdot" style="background:${project.langColor ?? 'var(--ink-3)'}" aria-hidden="true"></i>
          ${esc(project.language ?? '未标注语言')}
        </span>
        <span>${esc(project.role ?? '')}</span>
      </div>

      <h3 class="card__title">${title}</h3>
      <p class="card__desc">${esc(project.blurb || '这个仓库还没有写说明。')}</p>
      ${project.note ? `<p class="card__note">${esc(project.note)}</p>` : ''}
      ${tags ? `<div class="card__tags">${tags}</div>` : ''}

      <div class="card__foot">
        <span title="Stars">${icon('star')}${project.stars}</span>
        ${project.forks ? `<span title="Forks">${icon('fork')}${project.forks}</span>` : ''}
        <span title="最后更新">${icon('clock')}${esc(stamp)}</span>
        ${external}
      </div>
    </article>
  `;
}