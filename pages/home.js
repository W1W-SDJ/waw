import { icon, langColor } from '../lib/icons.js';
import { projectCard } from '../lib/projects-view.js';
import { link, esc } from '../lib/site.js';
import { loadProjects, stats } from '../data/projects.js';

export default async function renderHome(outlet) {
  const projects = await loadProjects();
  const s = stats(projects);
  const featured = projects.filter((p) => !p.isProfileRepo).slice(0, 3);
  const cfg = globalThis.__SITE__;

  outlet.innerHTML = `
    <section class="hero reveal" id="top">
      <p class="kicker">${esc(cfg.kicker)}</p>
      <h1 class="hero__title">在构建，<em>也在记录。</em></h1>
      <p class="hero__lede">
        ${esc(cfg.taglineZh)} ${esc(cfg.tagline)}
        这里放我的项目、实验和一些没做完的想法。
      </p>
      <div class="hero__actions">
        <a class="btn btn--solid" href="${link('projects/')}">看作品${icon('arrowRight')}</a>
        <a class="btn" href="${esc(cfg.social.github)}" target="_blank" rel="noopener noreferrer">${icon('github')}GitHub</a>
        <a class="btn btn--ghost" href="${link('about/')}">关于我${icon('arrowUpRight')}</a>
      </div>

      <div class="hero__stats">
        <div class="stat"><b>${s.total}</b><span>公开仓库</span></div>
        <div class="stat"><b>${s.languages}</b><span>使用语言</span></div>
        <div class="stat"><b>${s.stars}</b><span>累计 star</span></div>
        <div class="stat"><b>${esc(s.updatedLabel)}</b><span>最近更新</span></div>
      </div>
    </section>

    <section class="section section--flush">
      <div class="head reveal">
        <h2 class="head__title">精选作品<sup>03</sup></h2>
        <p class="head__note">从 GitHub 自动同步 · 按 star 与更新时间排序</p>
      </div>
      <div class="grid">
        ${featured.length ? featured.map(projectCard).join('') : emptyState()}
      </div>
      ${featured.length ? `<p class="more reveal"><a class="btn" href="${link('projects/')}">全部 ${s.total} 个项目${icon('arrowRight')}</a></p>` : ''}
    </section>
  `;
}

function emptyState() {
  const cfg = globalThis.__SITE__;
  return `
    <div class="empty">
      还没有同步到项目数据。<br>
      在仓库根目录运行 <code>npm run fetch:repos</code> 抓取，或先往 <a href="${esc(cfg.social.github)}">GitHub</a> 上放几个仓库。
    </div>
  `;
}