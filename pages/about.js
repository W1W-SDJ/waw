import { icon } from '../lib/icons.js?v=9ee2a27e';
import { loadProjects, profile, stats } from '../data/projects.js?v=9ee2a27e';
import { esc, link } from '../lib/site.js?v=9ee2a27e';

const FOCUS = [
  {
    label: '在做',
    items: ['把想法做成能跑的东西，先跑起来再优化', '用脚本把重复劳动自动化掉'],
  },
  {
    label: '在学',
    items: ['把工程习惯补齐：测试、版本管理、部署', '数据结构与算法，以及模型训练的基础功'],
  },
  {
    label: '偏好',
    items: ['少依赖、可读、能自己讲清楚的实现', '先写下来，再决定要不要继续做'],
  },
];

const PRINCIPLES = [
  { t: '先做出来', d: '能运行的粗糙版本胜过不能运行的完美设计。' },
  { t: '写下来', d: '把踩过的坑写进 README，下一次就省一半时间。' },
  { t: '少而稳', d: '能不加的依赖就不加，能删的代码就删。' },
];

export default async function renderAbout(outlet) {
  const [projects] = await Promise.all([loadProjects()]);
  const p = profile();
  const s = stats(projects);
  const cfg = globalThis.__SITE__;
  const name = p.name || cfg.name || cfg.owner;
  const since = p.createdAt ? new Date(p.createdAt).getFullYear() : null;

  outlet.innerHTML = `
    <section class="hero hero--page reveal" id="top">
      <div class="hero__grid">
        <div class="hero__copy">
          <p class="kicker">03 / About</p>
          <h1 class="hero__title">关于<em>${esc(name)}</em></h1>
          <p class="hero__lede">${esc(cfg.taglineZh)} ${esc(cfg.tagline)}</p>
        </div>
        <figure class="whale-figure" data-mascot>
          <div class="whale-hold">
            <img src="${link('whale.png')}" alt="鲸鱼娘 · 站点看板娘" width="210" height="280" decoding="async">
          </div>
          <figcaption><span class="tap-hint">点她一下</span> · 看板娘</figcaption>
        </figure>
      </div>
    </section>

    <section class="section">
      <div class="split">
        <div class="prose reveal">
          <h2 class="subhead">我是谁</h2>
          <p>
            我是 <strong>${esc(name)}</strong>，GitHub 上是
            <a href="${esc(p.htmlUrl ?? cfg.social.github)}" target="_blank" rel="noopener noreferrer">@${esc(p.login ?? cfg.owner)}</a>。
            ${since ? `${since} 年注册账号，` : ''}现在有 ${s.total} 个公开仓库${s.languages ? `、${s.languages} 种语言` : ''}。
          </p>
          <p>
            这里既放正经项目，也放练手和半成品。我更在意“能否讲清楚自己做了什么”，
            所以每个仓库尽量写清动机、做法和结论；没写完的也会标出来。
          </p>
          <p>
            这个网站本身就是其中一个项目：手写 CSS、零依赖构建、部署在 GitHub Pages 上。
            源码在 <a href="${esc(cfg.url)}" target="_blank" rel="noopener noreferrer">${esc(cfg.owner)}/${esc(cfg.repo)}</a>。
          </p>
        </div>

        <aside class="railcol">
          <div class="panel reveal">
            <h3>关注方向</h3>
            <ul class="stack">
              ${FOCUS.map(
                (block) => `
                <li>
                  <b>${block.label}</b>
                  <span>${block.items.map(esc).join('<br>')}</span>
                </li>`,
              ).join('')}
            </ul>
          </div>

          <div class="panel reveal">
            <h3>找到我</h3>
            <div class="links">
              <a class="linkrow" href="${esc(cfg.social.github)}" target="_blank" rel="noopener noreferrer">
                ${icon('github')}GitHub<small>@${esc(cfg.owner)}</small>
              </a>
              ${cfg.email ? `<a class="linkrow" href="mailto:${esc(cfg.email)}">${icon('mail')}邮箱<small>${esc(cfg.email)}</small></a>` : ''}
              <a class="linkrow" href="${link('projects/')}">${icon('layers')}作品档案<small>${s.total} 项</small></a>
              <a class="linkrow" href="${esc(cfg.url)}/issues" target="_blank" rel="noopener noreferrer">${icon('doc')}提 issue<small>欢迎反馈</small></a>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section class="section section--tint">
      <div class="head reveal">
        <h2 class="head__title">做事的方式</h2>
        <p class="head__note">写在最前面，用来提醒自己</p>
      </div>
      <div class="principles">
        ${PRINCIPLES.map(
          (item, i) => `
          <article class="principle reveal">
            <span class="principle__num">${String(i + 1).padStart(2, '0')}</span>
            <h3>${esc(item.t)}</h3>
            <p>${esc(item.d)}</p>
          </article>`,
        ).join('')}
      </div>
    </section>
  `;
}