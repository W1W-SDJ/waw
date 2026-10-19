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
npm run push
```

### 关于 token

建 token：GitHub → Settings → Developer settings → Personal access tokens (classic) → 勾 `repo`。

凭据按顺序读取，**推荐第一种**——token 不进对话记录、不进 shell 历史：

1. 项目根目录的 `.github-token` 文件（已在 `.gitignore` 里，不会被提交）
   ```powershell
   Set-Content -Path .github-token -Value "ghp_xxx" -NoNewline
   ```
2. 环境变量 `GITHUB_TOKEN`

推送完成后脚本会把 `origin` 还原成不带 token 的普通 HTTPS 地址，不会写进 `.git/config`。
推完就可以删掉 `.github-token`。

### TLS 特别注意

如果开着代理/加速器/VPN，它们的根证书通常只装在 Windows 证书库里，而 git 自带的 OpenSSL bundle 不认，会报：

```
UNABLE_TO_VERIFY_LEAF_SIGNATURE / unable to verify the first certificate
```

`scripts/deploy.mjs` 会自动把 **git 自带根证书 + Windows CurrentUser Root/CA 证书库** 合并成 `.deploy-tmp/ca-bundle.crt`，并设置 `http.sslBackend=openssl`。换机器首次运行时它会自己生成，不需要手动干预。

## 设计说明

**配色来自鲸鱼娘立绘本身**，不是凭感觉调的蓝。用 `npm run whale:assets` 从 280×373 的 PNG 里按明度采样，得到五档锚点：

| 角色 | 色值 | 用在哪 |
| --- | --- | --- |
| deep | `#1b1d43` | 正文墨色、深色模式底 |
| mid | `#343d7b` | 主按钮、导航强调 |
| bright | `#556bb2` | 次级强调 |
| light | `#83a4e3` | 水泡、发丝光、悬停边 |
| pale | `#d5daeb` | 分隔线、引用边 |

- 纸感蓝白底 `#f7f9ff`，深色为深海军蓝 `#0c1030`
- 字体：衬线标题（Newsreader）+ 无衬线正文（Inter）+ 等宽元信息（JetBrains Mono）；整体走"小巧精致"——细发丝线、小字号大字距标签、宽行高
- 鲸鱼娘出现四次：导航头像、首屏看板娘（带气泡与呼吸浮动）、关于页、右下角固定水印
- 七颗缓慢上升的水泡，数量刻意克制，只当质感不抢注意力
- 全站 CSS 变量驱动，`data-theme="dark"` 一键切换，默认跟随系统偏好
- 首屏 HTML 里就有静态内容（含 `noscript` 兜底），JS 失败也不白屏
- 滚动渐显带三重保险：IO + rAF 首屏即显 + 1.5s 兜底强制显示，任何环境都不会停在透明态
- 相对路径按页面深度自动生成，部署在子路径或根域名都不会挂
- 支持键盘导航、`prefers-reduced-motion`、打印样式
- 字体用 `<link media="print" onload>` 异步加载，不阻塞首屏

### 素材来源与再生成

鲸鱼娘立绘来自 [dafeiyu-pet](https://github.com/1190fasheqi/dafeiyu-pet)（MIT License，DeepSeek 鲸鱼形象的二创），桌面端由 `whale-purse` 插件使用。

站点用的两张图是从原始立绘裁切/缩放而来（`public/whale.png` 全身、`public/whale-head.png` 头像），由脚本生成：

```bash
npm run whale:assets
```

脚本会读取本机 `D:\ai\plugins\whale-purse\assets\whale-sprite.png`，顺便打印采样出的调色板。换立绘后重跑一次即可。

## 环境备注

本机 `winget` 只是 0 字节的占位别名，`git` 也未预装。
`npm run toolchain` 会用 Node 的 fetch 把便携版 MinGit（及可选 GitHub CLI）下载到 `D:\ai\tools`，不需要管理员权限。
