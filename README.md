# `waw` — 个人作品集

零依赖的静态作品集站点：手写 CSS 设计系统 + 原生 ES 模块，构建与预览都只用 Node，**不需要打包器、不需要任何原生产物**。

**线上地址 → <https://w1w-sdj.github.io/waw/>**

## 站点结构

```
index.html            首页
projects/index.html   作品档案（搜索 + 分类筛选）
about/index.html      关于
assets/               哈希命名的样式表（app-<hash>.css）
main.js  lib/  pages/  data/   浏览器直接加载的 ES 模块
favicon.svg  .nojekyll
```

## 本地开发

```bash
npm run dev          # http://127.0.0.1:5173/  改完刷新，无需打包
npm run build        # 产出 dist/
npm run preview      # 预览 dist/，模拟 GitHub Pages
npm run check        # 自检：ESM 语法 / 数据层 / 压缩器 / 产物标记 / 链接完整性
npm run verify:live  # 抓取线上地址，确认页面与每个模块都返回 200
```

`npm run check` 会验证三页 HTML 里每个本地 `href`/`src` 都能在 `dist/` 中找到真实文件——防止改了资源哈希或导航路径后出现死链。

## 内容怎么改

| 想改什么 | 改哪里 |
| --- | --- |
| 名字、标语、邮箱、社交链接 | `src/site.config.json` |
| 项目卡片标题、中文文案、分类 | `src/data/projects.js` 里的 `CURATED` |
| 同步 GitHub 最新仓库数据 | `npm run fetch:repos` → 写入 `src/data/repos.js` |
| 配色、字体、间距、栅格 | `src/styles/base.css` 顶部的设计变量 |
| 页面骨架 | `src/template.html` |
| 页面内容 | `src/pages/{home,projects,about}.js` |

改完统一走：

```bash
npm run build && npm run deploy   # 复制产物到仓库根 + 提交
```

## 部署

仓库根目录就是发布内容，GitHub Pages 配置为 **Deploy from a branch → `main` / `(root)`**。

```bash
npm run build
npm run deploy
git push
```

或者一条命令推上去（需要 `GITHUB_TOKEN`，见下）：

```bash
$env:GITHUB_TOKEN="ghp_xxx"; npm run push
```

### 关于 token

`--push` 只从环境变量 `GITHUB_TOKEN` 读取凭据，用完会把 `origin` 还原成不带 token 的普通 HTTPS 地址，不会写进 `.git/config`。
建 token：GitHub → Settings → Developer settings → Personal access tokens (classic) → 勾 `repo`。

### TLS 特别注意

如果开着代理/加速器/VPN，它们的根证书通常只装在 Windows 证书库里，而 git 自带的 OpenSSL bundle 不认，会报：

```
UNABLE_TO_VERIFY_LEAF_SIGNATURE / unable to verify the first certificate
```

`scripts/deploy.mjs` 会自动把 **git 自带根证书 + Windows CurrentUser Root/CA 证书库** 合并成 `.deploy-tmp/ca-bundle.crt`，并设置 `http.sslBackend=openssl`。换机器首次运行时它会自己生成，不需要手动干预。

## 设计说明

- 纸感米白 `#f4f3eb` + 墨绿 `#153c38`，衬线标题（Newsreader）+ 无衬线正文（Inter）+ 等宽元信息（JetBrains Mono）
- 全站 CSS 变量驱动，`data-theme="dark"` 一键切换，默认跟随系统偏好
- 首屏 HTML 里就有静态内容（含 `noscript` 兜底），JS 失败也不白屏
- 相对路径按页面深度自动生成，部署在子路径或根域名都不会挂
- 支持键盘导航、`prefers-reduced-motion`、打印样式
- 字体用 `<link media="print" onload>` 异步加载，不阻塞首屏

## 环境备注

本机 `winget` 只是 0 字节的占位别名，`git` 也未预装。
`npm run toolchain` 会用 Node 的 fetch 把便携版 MinGit（及可选 GitHub CLI）下载到 `D:\ai\tools`，不需要管理员权限。
