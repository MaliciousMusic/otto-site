// node tests/site.mjs — checks the built pages in dist/ (run the build first).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, relative } from 'node:path';

const DIST = 'dist', walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const pages = walk(DIST).filter((f) => f.endsWith('.html')), html = Object.fromEntries(pages.map((f) => [f, readFileSync(f, 'utf8')]));
const problems = [], bad = (f, m) => problems.push(`${relative(DIST, f)}: ${m}`);
const ids = (h) => new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const titles = new Map(), descs = new Map();
const DYNAMIC = /^(seed=|list$)/; // hashes read by scripts

for (const [f, h] of Object.entries(html)) {
  const one = (re) => h.match(re)?.[1];
  const title = one(/<title>([^<]+)/), desc = one(/<meta name="description" content="([^"]+)/);
  if (!title || title.length > 75) bad(f, `title ${title?.length}`);
  if (!desc || (!f.includes('404') && (desc.length < 70 || desc.length > 230))) bad(f, `description ${desc?.length}`);
  for (const [map, v] of [[titles, title], [descs, desc]]) { if (map.has(v)) bad(f, `duplicate of ${map.get(v)}`); map.set(v, f); }
  if ((h.match(/<h1[\s>]/g) ?? []).length !== 1) bad(f, 'needs exactly one h1');
  let last = 0;
  for (const [, n] of h.replace(/<footer[\s\S]*/, '').matchAll(/<h([1-6])[\s>]/g)) { if (+n > last + 1) bad(f, `heading jumps from h${last} to h${n}`); last = +n; }
  if (!/<html lang="en">/.test(h)) bad(f, 'lang');
  for (const [img] of h.matchAll(/<img[^>]*>/g)) if (!/\salt=/.test(img)) bad(f, `no alt: ${img}`);
  if (/\sstyle="|\son[a-z]+="|javascript:/.test(h)) bad(f, 'inline style or handler (blocked by CSP)');
  for (const [, body] of h.matchAll(/<script(?![^>]*(?:src=|ld\+json))[^>]*>([\s\S]*?)<\/script>/g)) bad(f, `inline script ${body.slice(0, 30)}`);
  for (const [, j] of h.matchAll(/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(j);
  const own = [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const x of new Set(own)) if (own.filter((y) => y === x).length > 1) bad(f, `duplicate id ${x}`);
  for (const [, list] of h.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) for (const x of list.split(' ')) if (!own.includes(x)) bad(f, `aria points to missing #${x}`);
  for (const [, u] of h.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(u)) continue;
    const [path, hash] = u.split('#'), clean = path.split('?')[0];
    const base = clean.startsWith('/') ? DIST : dirname(f);
    let target = clean ? join(base, clean) : f;
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) bad(f, `broken link ${u}`);
    else if (hash && !DYNAMIC.test(hash) && html[target] && !ids(html[target]).has(hash)) bad(f, `missing anchor ${u}`);
  }
  if (/\{\{|undefined|\[object/.test(h.replace(/<script[\s\S]*?<\/script>/g, ''))) bad(f, 'unrendered value');
  if (Buffer.byteLength(h) > 120000) bad(f, `heavy page ${Buffer.byteLength(h)}`);
}
for (const f of ['robots.txt', 'llms.txt', 'llms-full.txt', 'site.webmanifest', '.well-known/security.txt', 'assets/og.png', 'assets/apple-touch-icon.png', 'assets/icon-192.png', 'assets/icon-512.png', 'data/otto-results.json', 'data/tests.csv']) if (!existsSync(join(DIST, f))) bad(join(DIST, f), 'missing');
JSON.parse(readFileSync(join(DIST, 'data/otto-results.json'), 'utf8'));
assert.deepEqual(problems, []);

// The release build refuses to run while the URL or a legal fact is missing.
const cfg = JSON.parse(readFileSync('site.config.json', 'utf8'));
const ready = cfg.url && Object.values(cfg.legal).every(Boolean);
const before = spawnSync('node', ['tools/build.mjs', '--release', '--quiet'], { encoding: 'utf8' });
assert.equal(before.status, ready ? 0 : 1);

// With a URL, every public page has a canonical address and is in the sitemap.
const withUrl = spawnSync('node', ['tools/build.mjs', '--quiet'], { env: { ...process.env, SITE_URL: 'https://example.test/otto' } });
assert.equal(withUrl.status, 0);
const map = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
for (const f of pages.filter((x) => !x.includes('404'))) {
  const h = readFileSync(f, 'utf8'), c = h.match(/rel="canonical" href="([^"]+)/)?.[1];
  assert.ok(c && map.includes(`<loc>${c}</loc>`), `${f} not in sitemap`);
  assert.ok(/content="index, follow/.test(h), `${f} not indexable`);
}
spawnSync('node', ['tools/build.mjs', '--quiet']);
console.log(`ok: ${pages.length} pages, links, headings, metadata, structured data`);
