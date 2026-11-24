// node tests/security.mjs: security checks on the source and on the built pages (run the build first).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
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
const svg = read('dist/assets/otto.svg');
assert.doesNotMatch(svg, /<script|\son\w+=|<foreignObject|href="http/i);

// security.txt: a contact, and an expiry between one month and one year away.
const st = read('dist/.well-known/security.txt'), days = (Date.parse(st.match(/^Expires: (.+)$/m)?.[1]) - Date.now()) / 864e5;
assert.ok(st.includes(`Contact: mailto:${cfg.email}\n`));
assert.ok(days > 30 && days < 366, `security.txt expires in ${Math.round(days)} days: renew securityExpires in site.config.json`);
console.log('ok: stored values, no HTML or code sinks, content policy, published files, security.txt');
