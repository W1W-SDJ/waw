# `waw` — 个人作品集

零依赖的静态作品集站点：手写 CSS 设计系统 + 原生 ES 模块，构建与预览都只用 Node，**不需要打包器、不需要任何原生产物**。

上线地址 → <https://w1w-sdj.github.io/waw/>

## 结构

```
index.html            首页（构建产物，直接部署）
projects/index.html   作品档案（含搜索与分类筛选）
about/index.html      关于
assets/               哈希命名的样式表
lib/  pages/  data/   浏览器直接加载的 ES 模块
favicon.svg  .nojekyll
```

## 本地开发

```bash
npm run dev       # http://127.0.0.1:5173/  （改完刷新即可，无需打包）
npm run build     # 产出 dist/
npm run preview   # 预览 dist/，模拟 GitHub Pages
npm run check     # 语法 / 数据层 / 压缩器 / 产出自检
```

## 内容怎么改

| 想改什么 | 改哪里 |
| --- | --- |
| 名字、标语、邮箱、社交链接 | `src/site.config.json` |
| 项目卡片文案、标题、分类 | `src/data/projects.js` 里的 `CURATED` |
| 从 GitHub 拉最新仓库数据 | `npm run fetch:repos`（写入 `src/data/repos.js`） |
| 配色、字体、间距、栅格 | `src/styles/base.css` 顶部的设计变量 |
| 页面结构 | `src/template.html`（骨架）+ `src/pages/*.js`（内容） |

## 部署

仓库根目录就是发布内容。改完源码后：

```bash
npm run build
```

把 `dist/` 里的文件复制到仓库根目录（覆盖同名文件）后提交推送即可。
GitHub Pages 设置为 **Deploy from a branch → `main` / `(root)`**。

> 没有用 GitHub Actions：这台机器访问 GitHub 不稳定，预构建直推的失败面最小。
> 想换成 Actions 构建的话，把 `dist/` 加回 `.gitignore` 并加一个部署 workflow 就行。

## 设计说明

- 主色 `#f4f3eb` 米白纸感底 + `#153c38` 墨绿，衬线标题（Newsreader）+ 无衬线正文（Inter）
- 全站 CSS 变量驱动，`data-theme="dark"` 一键换深色，跟随系统偏好
- 首屏在 HTML 里就有静态内容，JS 挂了也不会白屏；带 `noscript` 兜底
- 相对路径全部按页面深度生成，部署在子路径或根域名都不会挂
- 支持键盘导航、`prefers-reduced-motion`、打印样式

## 环境备注

本机 `winget` 只是 0 字节的占位别名，`git` 也没有预装。
`npm run toolchain` 会用 Node 的 fetch 下载便携版 MinGit 与 GitHub CLI 到 `D:\ai\tools`，不需要管理员权限。
