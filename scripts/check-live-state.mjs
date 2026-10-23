// What is the deployed site actually serving right now?
const base = 'https://w1w-sdj.github.io/waw/';

const bust = (url) => fetch(`${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`).then((r) => r.text());

const html = await bust(base);
console.log('HTML 版本号 :', (html.match(/main\.js\?v=([0-9a-f]{8})/) ?? [])[1] ?? '(无)');
console.log('首页标题    :', (html.match(/<title>([^<]*)</) ?? [])[1] ?? '(无)');

const data = await bust(`${base}data/repos.js`);
const names = [...data.matchAll(/"name": "([^"]+)"/g)].map((m) => m[1]);
console.log('线上仓库数据:', names.join(', ') || '(空)');
console.log('含新仓库    :', /Small-scale-project/.test(data));

const projects = await bust(`${base}data/projects.js`);
console.log('projects.js 含新仓库:', /Small-scale-project/.test(projects));

const home = await bust(`${base}pages/home.js`);
console.log('home.js 字符数:', home.length);
console.log('home.js 数据来源:', (home.match(/loadProjects[^;]*/) ?? ['(未找到)'])[0].slice(0, 80));

// Cache headers on the HTML entry.
const head = await fetch(base, { method: 'GET', cache: 'no-store' });
console.log('页面缓存头  :', head.headers.get('cache-control') ?? '(无)');
console.log('ETag        :', head.headers.get('etag') ?? '(无)');
