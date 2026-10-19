// Verify the live GitHub Pages deployment end to end.
const base = 'https://w1w-sdj.github.io/waw/';
const urls = [
  base,
  `${base}projects/`,
  `${base}about/`,
  `${base}main.js`,
  `${base}whale.png`,
  `${base}whale-head.png`,
];

let failures = 0;

for (const url of urls) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const rel = url.replace(base, '/') || '/';
    console.log(`${res.status} | ${String(text.length).padStart(7)} chars | ${rel}`);
    if (res.status !== 200) failures++;

    if (rel === '/') {
      const title = text.match(/<title>([^<]*)<\/title>/)?.[1];
      const css = text.match(/href="(assets\/[^"]+\.css)"/)?.[1];
      const js = text.match(/src="(main\.js)"/)?.[1];
      console.log(`     title        : ${title}`);
      console.log(`     stylesheet   : ${css}`);
      console.log(`     module entry : ${js}`);
      console.log(`     inline config: ${/window\.__SITE__ = \{/.test(text)}`);
      console.log(`     no-JS shell  : ${/class="initial"/.test(text)}`);
      console.log(`     .nojekyll ok : ${!/__[A-Z][A-Z0-9]*__/.test(text)}`);

      // Follow the stylesheet link so a wrong hash shows up as a 404.
      if (css) {
        const cssRes = await fetch(new URL(css, base));
        const cssText = await cssRes.text();
        console.log(`     css fetch    : ${cssRes.status} (${cssText.length} chars)`);
        if (cssRes.status !== 200 || !cssText.includes('--paper')) failures++;
      }
      if (js) {
        const jsRes = await fetch(new URL(js, base));
        console.log(`     js fetch     : ${jsRes.status} (${(await jsRes.text()).length} chars)`);
        if (jsRes.status !== 200) failures++;
      }
    }
  } catch (err) {
    console.log(`FAIL | ${url} → ${err.message}`);
    failures++;
  }
}

// Sub-resources the pages need: every module the entry imports.
const modules = ['lib/shell.js', 'lib/site.js', 'lib/icons.js', 'lib/projects-view.js', 'pages/home.js', 'pages/projects.js', 'pages/about.js', 'data/projects.js', 'data/repos.js'];
for (const m of modules) {
  const res = await fetch(`${base}${m}`);
  console.log(`${res.status} | module ${m}`);
  if (res.status !== 200) failures++;
}

console.log(failures ? `\n✗ ${failures} live check(s) failed` : '\n✓ live site verified');
process.exit(failures ? 1 : 0);
