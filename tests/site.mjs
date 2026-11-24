// node tests/site.mjs — checks the built pages in dist/ (run the build first).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
// What is not ready or not shown says so, in both languages, and never looks finished.
const page = (p) => html[join(DIST, p, 'index.html')];
const gaps = Object.values(JSON.parse(readFileSync('site.config.json', 'utf8')).legal).filter((v) => !v).length;
assert.equal((page('legal').match(/class="todo">Upcoming</g) ?? []).length, gaps);
assert.equal((page('legal').match(/class="todo">À venir</g) ?? []).length, gaps);
for (const h of Object.values(html)) assert.doesNotMatch(h, /before launch|À compléter|lorem|coming soon/i);
assert.match(page('record'), /Upcoming: not started, no evidence yet/);
assert.match(page('record'), /Upcoming, not run/);
assert.match(page('record'), /Licence: upcoming/);
assert.match(page('accessibility'), /Screen reader tests are upcoming/);
// Publisher identity: complete, valid number, in both languages.
const legal = JSON.parse(readFileSync('site.config.json', 'utf8')).legal;
if (legal.siret) {
  const n = legal.siret.replace(/ /g, ''), sum = [...n].reverse().reduce((t, c, i) => t + (i % 2 ? (c * 2 > 9 ? c * 2 - 9 : c * 2) : +c), 0);
  assert.match(n, /^\d{14}$/); assert.equal(sum % 10, 0, 'SIRET check digit');
  assert.equal(page('legal').split(legal.siret).length - 1, 2);
  assert.equal(page('legal').split(legal.address).length - 1, 2);
}
const { person } = JSON.parse(readFileSync('site.config.json', 'utf8'));
for (const h of Object.values(html)) assert.equal(h.includes(`href="${person.url}"`), !person.upcoming);
assert.deepEqual(problems, []);

// The release build refuses to run while the URL or a legal fact is missing.
const cfg = JSON.parse(readFileSync('site.config.json', 'utf8'));
const full = join(mkdtempSync(join(tmpdir(), 'otto-')), 'config.json');
writeFileSync(full, JSON.stringify({ ...cfg, legal: Object.fromEntries(Object.entries(cfg.legal).map(([k, v]) => [k, v || 'test'])) }));
const ready = cfg.url && Object.values(cfg.legal).every(Boolean);
const before = spawnSync('node', ['tools/build.mjs', '--release', '--quiet'], { encoding: 'utf8' });
assert.equal(before.status, ready ? 0 : 1);

// A URL is not enough: with a legal fact missing, pages stay out of search engines and there is no sitemap.
writeFileSync(`${full}.gap`, JSON.stringify({ ...cfg, legal: { ...cfg.legal, siret: '' } }));
assert.equal(spawnSync('node', ['tools/build.mjs', '--quiet'], { env: { ...process.env, SITE_URL: 'https://example.test/otto', SITE_CONFIG: `${full}.gap` } }).status, 0);
assert.ok(!existsSync(join(DIST, 'sitemap.xml')));
for (const f of pages) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex">/, f);

// With a URL, every public page has a canonical address and is in the sitemap.
const withUrl = spawnSync('node', ['tools/build.mjs', '--quiet'], { env: { ...process.env, SITE_URL: 'https://example.test/otto', SITE_CONFIG: full } });
assert.equal(withUrl.status, 0);
const map = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
for (const f of pages.filter((x) => !x.includes('404'))) {
  const h = readFileSync(f, 'utf8'), c = h.match(/rel="canonical" href="([^"]+)/)?.[1];
  assert.ok(c && map.includes(`<loc>${c}</loc>`), `${f} not in sitemap`);
  assert.ok(/content="index, follow/.test(h), `${f} not indexable`);
}
spawnSync('node', ['tools/build.mjs', '--quiet']);
console.log(`ok: ${pages.length} pages, links, headings, metadata, structured data`);
