// node tests/security.mjs: security checks on the source and on the built pages (run the build first).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { get } from 'node:http';
import vm from 'node:vm';

const read = (f) => readFileSync(f, 'utf8');

// Display choices live on an origin shared with other sites: any stored value must be harmless.
const boot = (stored, reduced = false) => {
  const html = { dataset: {}, classList: { add() {} } };
  vm.runInNewContext(read('src/js/boot.js'), { document: { documentElement: html }, localStorage: { getItem() { if (stored instanceof Error) throw stored; return stored; } }, matchMedia: () => ({ matches: reduced }) });
  return { ...html.dataset };
};
const base = { detail: 'simple', motion: 'on', letters: 'faces' };
for (const bad of [null, '', 'null', '0', '"x"', '[]', '{', 'true', '{"detail":{},"motion":"x\\" onload","letters":1}', new Error('blocked')]) assert.deepEqual(boot(bad), base, `stored ${bad}`);
assert.deepEqual(boot(null, true), { ...base, motion: 'off' });
assert.deepEqual(boot('{"detail":"full","motion":"off","letters":"plain"}'), { detail: 'full', motion: 'off', letters: 'plain' });

// No text from the address bar or storage can reach an HTML or code sink.
for (const f of readdirSync('src/js')) {
  const s = read(`src/js/${f}`);
  assert.doesNotMatch(s, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|createContextualFragment|setHTMLUnsafe|\beval\(|new Function|srcdoc|postMessage|document\.cookie|serviceWorker|importScripts|setTimeout\(\s*['"`]/, f);
}
assert.match(read('src/js/map.js'), /Object\.hasOwn\(byId, id\)/);
// The build empties its output folder: it must refuse any folder outside the project, and the sources.
for (const out of ['..', '../elsewhere', '.', 'src', '.git', 'tools/font']) assert.equal(spawnSync('node', ['tools/build.mjs', '--quiet', `--out=${out}`]).status, 1, out);
assert.equal(readFileSync('src/js/main.js').length > 0, true);

// Built pages: one strict policy, set before anything loads; nothing from another host; nothing private published.
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk('dist'), cfg = JSON.parse(read('site.config.json'));
for (const f of files.filter((x) => x.endsWith('.html'))) {
  const h = read(f), csp = [...h.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/g)];
  assert.equal(csp.length, 1, f);
  for (const d of ["default-src 'none'", "script-src 'self'", "style-src 'self'", "base-uri 'none'", "form-action 'none'", "require-trusted-types-for 'script'", "trusted-types 'none'"]) assert.ok(csp[0][1].split('; ').includes(d), `${f}: ${d}`);
  assert.doesNotMatch(csp[0][1], /unsafe|\*|https?:/, f);
  assert.ok(h.indexOf('Content-Security-Policy') < h.search(/<(script|link|style|img)\b/), `${f}: policy must come first`);
  assert.match(h, /<meta name="referrer" content="strict-origin-when-cross-origin">/, f);
  for (const [tag, u] of h.matchAll(/<(?:script|img|source|iframe|video|audio|embed|object)\b[^>]*?\s(?:src|data)="([^"]+)"/g)) assert.doesNotMatch(u, /^(https?:)?\/\//, `${f}: ${tag}`);
  for (const [tag] of h.matchAll(/<link\b[^>]*rel="(?:stylesheet|preload|modulepreload|icon|manifest|preconnect|dns-prefetch)"[^>]*>/g)) assert.doesNotMatch(tag, /href="(https?:)?\/\//, f);
  assert.doesNotMatch(h, /<iframe|<object|<embed|http:\/\/(?!www\.w3\.org)|target="_blank"|type="password"/, f);
  // GitHub Pages: no shop, no payment
  assert.doesNotMatch(h, /stripe\.com|paypal|checkout|gumroad|patreon|ko-fi\.com|buymeacoffee/i, f);
}
for (const f of files) {
  const ext = /\.(html|js|css|csv|json|txt|xml|svg|png|woff2|webmanifest)$|\.nojekyll$/;
  assert.match(f, ext, `unexpected file ${f}`);
  if (/\.(png|woff2)$/.test(f)) continue;
  assert.doesNotMatch(read(f), /sourceMappingURL|\/home\/|\/Users\/|BEGIN [A-Z ]*PRIVATE KEY|\b(?:sk|rk)_(?:live|test)_|whsec_|AIza[\w-]{30}|gh[pousr]_\w{30}|xox[bp]-|service_role/, f);
}
// Without scripts the map is still readable.
assert.match(read('dist/css/style.css'), /html:not\(\.js\) \.maplist\[hidden\] \{ display: block !important; \}/);

const svg = read('dist/assets/otto.svg');
assert.doesNotMatch(svg, /<script|\son\w+=|<foreignObject|href="http/i);

// Workflows: read-only, actions pinned by commit, no secret, no untrusted text in a command.
for (const f of readdirSync('.github/workflows')) {
  const y = read(join('.github/workflows', f));
  assert.match(y, /^permissions:\n  contents: read$/m, f);
  assert.doesNotMatch(y, /: write|secrets\.|pull_request_target|workflow_run/, f);
  for (const [, a] of y.matchAll(/uses: (\S+)/g)) assert.match(a, /@[0-9a-f]{40}$/, a);
  assert.doesNotMatch(y, /run:.*\$\{\{/, f);
}
assert.doesNotMatch(read('tools/deploy.mjs'), /--force|'-f',\s*'origin|\+\$\{commit/);

// Font tools: exact versions, none with a known flaw (the local build only reads our own code).
const pins = Object.fromEntries(read('tools/font/requirements.txt').split('\n').filter((l) => /^\w/.test(l)).map((l) => l.split('==')));
const atLeast = (v, min) => v && v.localeCompare(min, 'en', { numeric: true }) >= 0;
assert.ok(atLeast(pins.brotli, '1.2.1') && atLeast(pins.fonttools, '4.60.2'), JSON.stringify(pins));
assert.match(read('tools/check-live.mjs'), /'accept-encoding': 'identity'/);

// security.txt: a contact, and an expiry between one month and one year away.
const st = read('dist/.well-known/security.txt'), days = (Date.parse(st.match(/^Expires: (.+)$/m)?.[1]) - Date.now()) / 864e5;
assert.ok(st.includes(`Contact: mailto:${cfg.email}\n`));
assert.ok(st.includes('Contact: https://github.com/MaliciousMusic/otto-site/security/advisories/new\n') && read('SECURITY.md').includes('https://github.com/MaliciousMusic/otto-site/security/advisories/new'));
assert.ok(days > 30 && days < 366, `security.txt expires in ${Math.round(days)} days: renew securityExpires in site.config.json`);
// The font trial shows its focus.
assert.match(read('dist/css/font.css'), /#try:focus-visible \{ outline: 3px/);

// The local server answers badly formed and out-of-folder addresses without falling over.
const server = spawn('node', ['tools/serve.mjs', '4597'], { stdio: ['ignore', 'pipe', 'inherit'] });
try {
  await new Promise((ok) => server.stdout.on('data', (d) => /localhost/.test(d) && ok()));
  const status = (path) => new Promise((ok) => get({ host: '127.0.0.1', port: 4597, path }, (r) => { r.resume(); ok(r.statusCode); }));
  for (const [path, code] of [['/%E0%A4%A', 400], ['/../package.json', 404], ['/..%2fpackage.json', 404], ['/%2e%2e/%2e%2e/etc/passwd', 404], ['/', 200]]) assert.equal(await status(path), code, path);
} finally { server.kill(); }

console.log('ok: stored values, no HTML or code sinks, content policy, published files, security.txt');
