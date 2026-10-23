import { icon } from '../lib/icons.js?v=14940af1';
import { projectCard } from '../lib/projects-view.js?v=14940af1';
import { link, esc } from '../lib/site.js?v=14940af1';
import { loadProjects, stats } from '../data/projects.js?v=14940af1';

const SAYINGS = [
  '今天也在认真摸鱼～',
  '要不要看看我做的项目？',
  '咕噜咕噜…在写代码',
  '一起做点可爱的东西吧',
];

export default async function renderHome(outlet) {
  const projects = await loadProjects();
  const s = stats(projects);
  const featured = projects.filter((p) => !p.isProfileRepo).slice(0, 3);
  const cfg = globalThis.__SITE__;
  const say = SAYINGS[Math.floor(Math.random() * SAYINGS.length)];

  outlet.innerHTML = `
    <section class="hero reveal" id="top">
      <div class="hero__grid">
        <div class="hero__copy">
          <p class="kicker">${esc(cfg.kicker)}</p>
          <h1 class="hero__title">在构建，<br>也在<em>记录</em>。</h1>
          <p class="hero__lede">
            ${esc(cfg.taglineZh)} ${esc(cfg.tagline)}
            这里放我的项目、实验和一些没做完的想法。
          </p>
          <div class="hero__actions">
            <a class="btn btn--solid" href="${link('projects/')}">看作品${icon('arrowRight')}</a>
            <a class="btn" href="${esc(cfg.social.github)}" target="_blank" rel="noopener noreferrer">${icon('github')}GitHub</a>
            <a class="btn btn--ghost" href="${link('about/')}">关于我${icon('arrowUpRight')}</a>
          </div>
        </div>

        <figure class="whale-figure" data-mascot>
          <p class="whale-say" data-mascot-say aria-live="polite">${esc(say)}</p>
          <div class="whale-hold">
            <img src="${link('whale.png')}" alt="鲸鱼娘 · 站点看板娘" width="210" height="280" decoding="async" fetchpriority="high">
          </div>
          <figcaption><span class="tap-hint">点她一下</span> · 看板娘</figcaption>
        </figure>
      </div>

      <div class="hero__stats">
        <div class="stat"><b>${s.total}</b><span>公开仓库</span></div>
        <div class="stat"><b>${s.languagesLabel}</b><span>使用语言</span></div>
        <div class="stat"><b>${s.starsLabel}</b><span>累计 star</span></div>
        <div class="stat"><b>${esc(s.updatedLabel)}</b><span>最近更新</span></div>
      </div>
    </section>

    <section class="section section--flush">
      <div class="head reveal">
        <h2 class="head__title">精选作品<sup>03</sup></h2>
        <p class="head__note">从 GitHub 自动同步 · 按 star 与更新时间排序</p>
      </div>
      <div class="grid" data-count="${featured.length}">
        ${featured.length ? featured.map(projectCard).join('') : emptyState()}
      </div>
      ${featured.length ? `<p class="more reveal"><a class="btn" href="${link('projects/')}">全部 ${s.total} 个项目${icon('arrowRight')}</a></p>` : ''}
    </section>

    <section class="section section--flush">
      <div class="head reveal">
        <h2 class="head__title">此刻<sup>03</sup></h2>
        <p class="head__note">最近在忙的三件事 · 随时会变</p>
      </div>
      <div class="now__grid">
        ${NOW.map(
          (item) => `
          <article class="now__item reveal">
            <span class="now__label">${esc(item.label)}</span>
            <p>${esc(item.text)}</p>
          </article>`,
        ).join('')}
      </div>
    </section>
  `;
}

const NOW = [
  { label: '在做', text: '这个站点本身：手写 CSS 设计系统，零依赖构建，部署在 GitHub Pages。' },
  { label: '在学', text: '把工程习惯补齐——测试、版本管理，以及怎么把想法讲清楚。' },
  { label: '想要', text: '把仓库一个个填满，让这里的内容配得上这只鲸鱼娘。' },
];

function emptyState() {
  const cfg = globalThis.__SITE__;
  return `
    <div class="empty">
      还没有同步到项目数据。<br>
      在仓库根目录运行 <code>npm run fetch:repos</code> 抓取，或先往 <a href="${esc(cfg.social.github)}">GitHub</a> 上放几个仓库。
    </div>
  `;
}