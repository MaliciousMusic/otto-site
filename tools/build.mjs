// node tools/build.mjs [--release] [--quiet] [--out=dist]   src/ -> dist/
// Static pages, metadata, structured data, sitemap, llms.txt and data files. No dependency.
// Without a site URL in site.config.json every page is marked noindex.
// --preview keeps every page noindex even with a URL (public link, legal facts still missing).
// --release refuses to build while the URL or a legal fact is missing.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { objectives, links, tests, climb } from '../src/data/map.js';
import { faq, glossary } from '../src/data/faq.js';
import { protocols } from '../src/data/protocols.js';
import { BOX_IN, BOX_OUT } from '../src/data/box.js';
import { LOOKALIKES } from '../src/data/lookalikes.js';
import R from '../src/data/results.js';
import { seeded, step } from '../src/js/world.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), SRC = join(ROOT, 'src'), DIST = join(ROOT, process.argv.find((a) => a.startsWith('--out='))?.slice(6) || 'dist');
const release = process.argv.includes('--release'), quiet = process.argv.includes('--quiet'), preview = process.argv.includes('--preview');
const cfg = JSON.parse(readFileSync(process.env.SITE_CONFIG ?? join(ROOT, 'site.config.json'), 'utf8'));
const SITE = (process.env.SITE_URL ?? cfg.url).replace(/\/$/, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const human = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const VERDICT = { holds: 'Holds, within its domain', toy: 'Toy model only', rejected: 'Rejected', waiting: 'Upcoming, not run' };
const STATE = { measured: 'Measured, within a bounded domain', now: 'We are working here', asleep: 'Upcoming: not started, no evidence yet' };
const LINK = { solid: 'supported', maybe: 'plausible', unsure: 'contested or unknown', def: 'part of the definition', no: 'refuted' };
const nm = (o) => o.name.join(' ');
const obj = Object.fromEntries(objectives.map((o) => [o.id, o]));
const count = (s) => objectives.filter((o) => o.state === s).length;

// ---- what is still missing before launch
const missing = []; // any gap keeps every page out of search engines
if (!SITE) missing.push('url');
for (const [k, v] of Object.entries(cfg.legal)) if (!v) missing.push(`legal.${k}`);
if (release && missing.length) {
  console.error(`Not ready to publish. Fill in site.config.json: ${missing.join(', ')}`);
  process.exit(1);
}
const open2web = SITE && !preview && !missing.length;
const todo = (fr) => `<mark class="todo">${fr ? 'À venir' : 'Upcoming'}</mark>`;

// the output folder is emptied first, so it must be inside this project
if (!DIST.startsWith(ROOT + sep) || ['src', 'tools', 'tests', '.git', '.claude'].includes(DIST.slice(ROOT.length + 1).split(sep)[0])) {
  console.error(`Refusing to write to ${DIST}`);
  process.exit(1);
}
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'data'), { recursive: true });
for (const d of ['assets', 'css', 'js']) cpSync(join(SRC, d), join(DIST, d), { recursive: true });
for (const f of ['map.js', 'results.js', 'box.js', 'lookalikes.js', 'film.js', 'film-audio.js']) cpSync(join(SRC, 'data', f), join(DIST, 'data', f));
const ver = (f) => createHash('sha256').update(readFileSync(join(SRC, f))).digest('hex').slice(0, 8);

// ---- data downloads
const quote = (c) => (/[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c);
const csv = (head, rows) => `${[head, ...rows].map((r) => r.map(quote).join(',')).join('\n')}\n`;
const FILES = {
  'otto-results.json': [JSON.stringify(R), 'All recorded results used on this site'],
  'law.csv': [csv(['density', 'seed', 'groups_start', 'groups_end'], Object.entries(R.law).flatMap(([p, a]) => a.map((r) => [p, ...r]))), 'Majority against a frozen control, 128 pairs'],
  'orders.csv': [csv(['seed', 'distinct_endings_in_four_orders'], R.orders), 'Endings reached under four random orders, 64 starts'],
  'poke.csv': [csv(['cells', 'border_distance', 'seed', 'ending_changed'], Object.entries(R.distance).flatMap(([n, o]) => Object.entries(o).flatMap(([c, a]) => a.map((r) => [n, c, ...r])))), 'Single pokes by distance to a border, 384 interventions'],
  'loop.csv': [csv(['condition', 'output_states_0_to_64'], Object.entries(R.org01)), 'Two-bit loop, eight conditions'],
  'observer.csv': [csv(['start', 'path', 'window_10_20', 'window_8_18', 'window_12_22', 'bin_width_2'], Object.entries(R.observer).flatMap(([n, a]) => a.map((p, i) => [n, i, ...p]))), 'Self-renewal verdicts under four observers, 128 paths'],
  'objectives.csv': [csv(['id', 'name', 'state', 'question', 'minimal_test', 'on_record'], objectives.map((o) => [o.id, nm(o), o.state, o.q, o.test, o.record])), 'The 21 objectives'],
  'tests.csv': [csv(['id', 'code', 'name', 'verdict', 'outcome', 'question', 'result', 'design', 'numbers', 'limit'], tests.map((t) => [t.id, t.code, nm(t), t.verdict, t.value, t.q, t.result, protocols[t.id].design, protocols[t.id].numbers, protocols[t.id].limit])), 'The 11 tests with their technical sheets'],
};
for (const [f, [body]] of Object.entries(FILES)) writeFileSync(join(DIST, 'data', f), body);

// ---- small drawings made at build time
const EYES = '<circle cx="-4.2" cy="-2" r="1.95" fill="currentColor"/><circle cx="4.2" cy="-2" r="1.95" fill="currentColor"/>';
const PEN = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"';
const FACE = {
  smile: `${EYES}<path d="M-3.6 4.2Q0 8 3.6 4.2" ${PEN}/>`,
  oh: `${EYES}<circle cx="0" cy="5.6" r="1.9" ${PEN}/>`,
  sleep: `<path d="M-6.4 -2Q-4.4 .4 -2.4 -2M2.4 -2Q4.4 .4 6.4 -2M-1.6 5Q0 6 1.6 5" ${PEN}/>`,
};
const MOOD = { measured: 'smile', now: 'oh', asleep: 'sleep' };
const cell = (mood, x = 0, y = 0, s = 1) => `<g class="cell cell-${mood}" transform="translate(${x} ${y}) scale(${s})"><circle r="18" class="skin"/>${FACE[mood]}</g>`;
const XY = (o) => [30 + o.x * 440, 24 + (8 - o.tier) * 27];
const curve = ([a, b, k]) => { const [x, y] = XY(obj[a]), [u, v] = XY(obj[b]); return `<path class="edge ${k}" d="M${x} ${y}C${x} ${(y + v) / 2} ${u} ${(y + v) / 2} ${u} ${v}"/>`; };
const miniMap = `<svg viewBox="0 0 500 262" aria-hidden="true">${links.filter((l) => l[2] !== 'no').map(curve).join('')}${objectives.map((o) => cell(MOOD[o.state], ...XY(o), o.goal ? 0.75 : 0.55)).join('')}</svg>`;
const miniResults = `<svg viewBox="0 0 320 128" aria-hidden="true">${Array.from({ length: 32 }, (_, i) => cell(i % 8 < 5 ? 'oh' : 'smile', 24 + (i % 8) * 39, 20 + Math.floor(i / 8) * 30, 0.72)).join('')}</svg>`;
const miniMethod = `<svg viewBox="0 0 320 128" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => cell('oh', 34 + i * 31.5, i % 2 ? 84 : 46, 0.85)).join('')}</svg>`;
let world = seeded(183809, 64, 0.5);
const strokes = ['', ''];
for (let t = 0; t < 12; t++) { world.forEach((v, i) => { strokes[v] += `M${i * 5 + 1} ${t * 10.6 + 5}h3`; }); world = step(world); }
const miniLab = `<svg viewBox="0 0 322 128" aria-hidden="true"><path class="sb" d="${strokes[0]}"/><path class="sg" d="${strokes[1]}"/></svg>`;

// ---- fragments used by the pages
const kv = (pairs) => `<dl class="kv">${pairs.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`;
const sheet = (id) => { const p = protocols[id]; return [['Design', esc(p.design)], ['Numbers', esc(p.numbers)], ['Limit', esc(p.limit)]]; };
const tech = (ids) => `<div class="full tech">${ids.split(',').map((id) => `<p><strong>${esc(tests.find((x) => x.id === id).code)}</strong></p>${kv(sheet(id))}`).join('')}</div>`;
const toOf = (o) => links.filter(([a]) => a === o.id).map(([, b, k]) => `${nm(obj[b])} (${LINK[k]})`);
const rising = [...objectives].sort((a, b) => a.tier - b.tier);
const ORDER = ['measured', 'now', 'asleep'];
const stateRow = [...objectives].sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state));
const fragments = (root) => ({
  root, replays: 769, nObjectives: objectives.length, nMeasured: count('measured'), nNow: count('now'), nAsleep: count('asleep'),
  progressCells: stateRow.map((o) => `<svg viewBox="-21 -21 42 42" aria-hidden="true">${cell(MOOD[o.state])}</svg>`).join(''),
  boxIn: BOX_IN.map((x) => `<button type="button" class="chip chip-in">${esc(x)}</button>`).join(''),
  boxOut: Object.keys(BOX_OUT).map((x) => `<button type="button" class="chip chip-out">${esc(x)}</button>`).join(''),
  stairs: climb.map((s, i) => `<button type="button" class="stair ${i === 0 ? 'done' : i === 1 ? 'begun' : ''} s${i}" aria-pressed="${i === 0}"><span class="n">${i}</span><span class="l">${esc(s.k)}</span></button>`).join(''),
  climbFirst: `<p class="k">Question 0 · ${esc(climb[0].s)}</p><h3>${esc(climb[0].t)}</h3><p>${esc(climb[0].d)}</p><noscript><ol>${climb.map((s) => `<li>${esc(s.t)} <span class="note">${esc(s.s)}.</span></li>`).join('')}</ol></noscript>`,
  miniMap, miniResults, miniMethod, miniLab,
  faqShort: ['what', 'ai', 'speak', 'rejected'].map((id) => faq.find((f) => f[0] === id)).map(([, q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join(''),
  faqAll: faq.map(([id, q, a]) => `<div class="qa" id="${id}"><h2>${esc(q)}</h2><p>${esc(a)}</p></div>`).join(''),
  glossary: glossary.map(([t, d]) => `<div id="g-${t.toLowerCase().replace(/\W+/g, '-')}"><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join(''),
  mapList: `<h2>Objectives, from the roots up</h2><ol>${rising.map((o) => `<li id="list-${o.id}"><h3>${esc(nm(o))}</h3><p class="badge ${o.state}">${STATE[o.state]}</p><p>${esc(o.q)}</p><p class="note">${toOf(o).length ? `May lead to: ${esc(toOf(o).join(', '))}.` : 'Nothing lies above it on the map.'}</p></li>`).join('')}</ol><h2>Tests</h2><ol>${tests.map((t) => `<li id="list-${t.id}"><h3>${esc(nm(t))}</h3><p class="badge ${t.verdict}">${VERDICT[t.verdict]}: ${esc(t.value)}</p><p>${esc(t.q)} ${esc(t.result)}</p><p class="note">Bears on: ${t.to.map((x) => esc(nm(obj[x]))).join(', ')}.</p></li>`).join('')}</ol>`,
  glanceRows: tests.map((t) => `<tr data-v="${t.verdict}"><th scope="row"><a href="${t.go ? `#r-${t.go}` : `${root}record/#${t.id}`}">${esc(nm(t))}</a></th><td>${esc(t.q)}</td><td class="num">${esc(t.value)}</td><td><span class="badge ${t.verdict}">${VERDICT[t.verdict]}</span></td></tr>`).join(''),
  spotCards: LOOKALIKES.map((l, i) => `<button type="button" class="spotcard" data-id="${l.id}"><canvas width="220" height="220" aria-hidden="true"></canvas><span>Pattern ${'ABCDEFGHI'[i]}</span></button>`).join(''),
  recordTests: tests.map((t) => `<article class="entry" id="${t.id}"><h3>${esc(nm(t))}</h3><p class="badge ${t.verdict}">${VERDICT[t.verdict]}: ${esc(t.value)}</p><p>${esc(t.q)}</p><p>${esc(t.result)}</p>${kv([['Protocol', `<code>${esc(t.code)}</code>`], ...sheet(t.id), ['Bears on', t.to.map((x) => `<a href="#${x}">${esc(nm(obj[x]))}</a>`).join(', ')]])}</article>`).join(''),
  recordObjectives: rising.map((o) => `<article class="entry" id="${o.id}"><h3>${esc(nm(o))}</h3><p class="badge ${o.state}">${STATE[o.state]}</p><p>${esc(o.q)}</p>${kv([['How we would test it', esc(o.test)], ['What could fool us', o.fool.map(esc).join('; ')], ['On record', esc(o.record)], ...(toOf(o).length ? [['May lead to', esc(toOf(o).join(', '))]] : [])])}</article>`).join(''),
  files: Object.entries(FILES).map(([f, [b, d]]) => `<li><a href="${root}data/${f}" download>${f}</a> <span class="note">${esc(d)}, ${Math.max(1, Math.round(Buffer.byteLength(b) / 1024))} KB</span></li>`).join(''),
  commit: R.source.commit.slice(0, 12), recordDate: cfg.recordDate, recordDateText: human(cfg.recordDate), updated: cfg.updated, updatedText: human(cfg.updated),
  email: cfg.email, person: cfg.person.name,
  cite: `${cfg.person.name}. Otto, artificial life research: public record. State of ${human(cfg.recordDate)}.${SITE ? ` ${SITE}/record/` : ''}`,
  ...Object.fromEntries(Object.entries(cfg.legal).flatMap(([k, v]) => [[`legal.${k}`, v ? esc(v) : todo()], [`legal.${k}.fr`, v ? esc(cfg.legalFr?.[k] ?? v) : todo(true)]])),
});

// ---- structured data
const abs = (p) => (SITE ? `${SITE}/${p}` : undefined);
const PERSON = { '@type': 'Person', name: cfg.person.name, url: cfg.person.upcoming ? undefined : cfg.person.url || undefined };
const ORG = {
  '@type': 'ResearchProject', '@id': abs('#otto') ?? '#otto', name: 'Otto', alternateName: 'Otto, artificial life research', description: faq[0][2], url: abs(''), logo: abs('assets/icon-512.png'), email: cfg.email,
  foundingDate: '2026', founder: PERSON, sameAs: Object.values(cfg.social), knowsAbout: ['Artificial life', 'Emergence', 'Cellular automata', 'Self-organisation', 'Open-ended evolution', 'Preregistration', 'Reproducible research'],
};
const dataset = () => ({
  '@type': 'Dataset', name: 'Otto, recorded results of the ring world and renewal studies',
  description: 'Recorded results of Otto’s artificial life studies: matched law ablations, update orders, perturbation by border distance, a two-bit loop, and an observer sensitivity study that was rejected.',
  url: abs('record/'), creator: PERSON, dateModified: cfg.recordDate, inLanguage: 'en', isAccessibleForFree: true, usageInfo: abs('terms/'),
  keywords: ['artificial life', 'cellular automata', 'majority rule', 'emergence', 'reproducibility'],
  variableMeasured: ['number of occupied groups', 'distinct endings', 'ending changed after a single flip', 'self-renewal verdict'],
  distribution: SITE ? Object.keys(FILES).map((f) => ({ '@type': 'DataDownload', name: f, encodingFormat: f.endsWith('json') ? 'application/json' : 'text/csv', contentUrl: abs(`data/${f}`) })) : undefined,
});
const schema = (p) => {
  const page = { '@type': p.schema === 'faq' ? 'FAQPage' : 'WebPage', name: p.title, description: p.description, url: abs(p.path), inLanguage: 'en', dateModified: cfg.updated, isPartOf: { '@type': 'WebSite', name: 'Otto', url: abs('') }, about: { '@id': ORG['@id'] } };
  if (p.schema === 'faq') page.mainEntity = faq.map(([, q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }));
  const graph = [page, ORG];
  if (p.path && !p.noindex) graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Otto', item: abs('') }, { '@type': 'ListItem', position: 2, name: p.short, item: abs(p.path) }] });
  if (p.schema === 'results' || p.schema === 'record') graph.push(dataset());
  if (p.schema === 'faq') graph.push({ '@type': 'DefinedTermSet', name: 'Otto glossary', hasDefinedTerm: glossary.map(([name, description]) => ({ '@type': 'DefinedTerm', name, description })) });
  if (p.schema === 'lab') graph.push({ '@type': 'WebApplication', name: 'Otto lab', url: abs('lab/'), applicationCategory: 'EducationalApplication', operatingSystem: 'Any', browserRequirements: 'JavaScript', isAccessibleForFree: true, description: p.description });
  if (p.schema === 'map') graph.push({ '@type': 'ItemList', name: 'Objectives of Otto', itemListElement: objectives.map((o, i) => ({ '@type': 'ListItem', position: i + 1, name: nm(o), description: `${o.q} ${STATE[o.state]}.` })) });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
};

// ---- layout
// GitHub Pages cannot send headers: this policy travels in a meta tag, where frame-ancestors, sandbox and report-uri do not work.
// Everything is closed except what the pages load. Trusted types forbid any HTML or script sink.
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; media-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; require-trusted-types-for 'script'; trusted-types 'none'";
const NAV = [['film/', 'Film'], ['map/', 'Map'], ['results/', 'Results'], ['lab/', 'Lab'], ['method/', 'Method'], ['questions/', 'Questions']];
const MINOR = [['record/', 'Record and data'], ['font/', 'Typeface'], ['legal/', 'Legal notice'], ['privacy/', 'Privacy'], ['terms/', 'Terms'], ['accessibility/', 'Accessibility']];
const navLink = (p, root, [h, t]) => `<a href="${root}${h}"${p.path === h ? ' aria-current="page"' : ''}>${t}</a>`;
const radio = (name, legend, options) => `<fieldset><legend>${legend}</legend>${options.map(([v, t], i) => `<label><input type="radio" name="${name}" value="${v}"${i ? '' : ' checked'}> ${t}</label>`).join('')}</fieldset>`;
const head = (p, root) => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="robots" content="${!open2web || p.noindex ? 'noindex' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
<meta name="author" content="${esc(cfg.person.name)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="theme-color" content="#ffffff">${SITE && !p.noindex ? `
<link rel="canonical" href="${abs(p.path)}">
<meta property="og:url" content="${abs(p.path)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Otto">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:image" content="${abs('assets/og.png') ?? `${root}assets/og.png`}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Otto, artificial life research. Can a mind grow from almost nothing?">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@ottoalife">
<link rel="icon" href="${root}assets/otto.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}assets/apple-touch-icon.png">
<link rel="manifest" href="${root}site.webmanifest">
<link rel="alternate" type="text/plain" href="${root}llms.txt" title="Plain text for AI assistants">
<link rel="preload" href="${root}assets/fonts/otto-cells-vf.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}assets/fonts/jost-latin-wght.woff2" as="font" type="font/woff2" crossorigin>
${['style', 'otto-cells', ...(p.css ?? [])].map((c) => `<link rel="stylesheet" href="${root}css/${c}.css?v=${ver(`css/${c}.css`)}">`).join('\n')}
<script src="${root}js/boot.js?v=${ver('js/boot.js')}"></script>
<script type="module" src="${root}js/main.js?v=${ver('js/main.js')}"></script>
<script type="application/ld+json">${schema(p)}</script>`;
const layout = (p, body, root) => `<!doctype html>
<html lang="en">
<head>
${head(p, root)}
</head>
<body${p.kind ? ` class="${p.kind}page"` : ''}>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="${root || './'}"${p.path === '' ? ' aria-current="page"' : ''}><img src="${root}assets/otto.svg" alt="" width="72" height="72"><span>otto</span></a>
  <button type="button" class="menu" id="menu" aria-expanded="false" aria-controls="menubox">Menu</button>
  <div class="menubox" id="menubox">
    <nav aria-label="Main">${NAV.map((n) => navLink(p, root, n)).join('')}</nav>
    <details class="prefs" id="prefs"><summary>Display</summary><div class="prefbox">
      ${radio('detail', 'Detail', [['simple', 'Simple'], ['full', 'Full, with protocols']])}
      ${radio('motion', 'Motion', [['on', 'On'], ['off', 'Paused']])}
      ${radio('letters', 'Letters', [['faces', 'With faces'], ['plain', 'Plain']])}
    </div></details>
  </div>
</header>
<main id="main" tabindex="-1">
${p.path && !p.noindex ? `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${root}">Otto</a></li><li aria-current="page">${esc(p.short)}</li></ol></nav>` : ''}
${body}
${p.next ? `<nav class="nextpage" aria-label="Next page"><a class="btn" href="${root}${p.next[0]}">Next: ${esc(p.next[1])}</a></nav>` : ''}
</main>
<footer>
  <img src="${root}assets/otto.svg" alt="" width="120" height="120">
  <p class="big alive">Follow Otto as it grows</p>
  <ul>${Object.entries(cfg.social).map(([n, u]) => `<li><a href="${u}" rel="me noopener">${n}</a></li>`).join('')}<li><a href="mailto:${cfg.email}">Write to us</a></li></ul>
  <nav aria-label="Site"><ul class="minor">${[...NAV, ...MINOR].map((n) => `<li>${navLink(p, root, n)}</li>`).join('')}</ul></nav>
  <p class="fine">Research record as of ${human(cfg.recordDate)}. A project by ${cfg.person.url && !cfg.person.upcoming ? `<a href="${cfg.person.url}">${esc(cfg.person.name)}</a>` : esc(cfg.person.name)}${cfg.person.upcoming ? ` (${new URL(cfg.person.url).hostname}, upcoming)` : ''}. No cookies, no trackers.</p>
</footer>
</body>
</html>
`;

const pages = [];
for (const file of readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'))) {
  const raw = readFileSync(join(SRC, 'pages', file), 'utf8');
  const end = raw.indexOf('-->'), p = JSON.parse(raw.slice(4, end));
  // a 404 can be served from any depth, so its links start at the site root
  const base = SITE ? `${new URL(SITE).pathname.replace(/\/$/, '')}/` : '/';
  const root = p.noindex ? base : p.path ? '../' : '';
  const f = fragments(root);
  const body = raw.slice(end + 3).trim()
    .replace(/\{\{tech:([^}]+)\}\}/g, (_, ids) => tech(ids))
    .replace(/\{\{([\w.]+)\}\}/g, (m, k) => { if (!(k in f)) throw new Error(`${file}: unknown ${m}`); return f[k]; });
  const out = p.path.endsWith('.html') ? p.path : `${p.path}index.html`;
  mkdirSync(join(DIST, dirname(out)), { recursive: true });
  writeFileSync(join(DIST, out), layout(p, body, root));
  pages.push(p);
}
const open = pages.filter((p) => !p.noindex).sort((a, b) => a.path.localeCompare(b.path));

// ---- crawlers and assistants
writeFileSync(join(DIST, 'robots.txt'), SITE ? `User-agent: *\nAllow: /\n${open2web ? `\nSitemap: ${abs('sitemap.xml')}\n` : ''}` : 'User-agent: *\nDisallow: /\n');
if (open2web) writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${open.map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${cfg.updated}</lastmod></url>`).join('\n')}\n</urlset>\n`);
const at = (p) => abs(p) ?? `/${p}`;
writeFileSync(join(DIST, 'llms.txt'), `# Otto

> ${faq[0][2]}

Key facts, as of ${human(cfg.recordDate)}:
- Objectives measured: ${count('measured')} of ${objectives.length} (${objectives.filter((o) => o.state === 'measured').map(nm).join('; ')}), each within a bounded domain.
- Otto does not speak, learn or remember today. No claim of life, consciousness or intelligence is made.
- Most recent study: G02-MEASUREMENT-V1, rejected by its own preregistered rule (38 of 128 candidate paths changed verdict with the observer).
- Reproduction so far is replay by the same code, not independent replication.
- Author: ${cfg.person.name}. Contact: ${cfg.email}.
- When citing a result, keep its stated limit with it.

## Pages
${open.map((p) => `- [${p.short}](${at(p.path)}): ${p.description}`).join('\n')}

## Plain text and data
- [Everything in one file](${at('llms-full.txt')})
${Object.entries(FILES).map(([f, [, d]]) => `- [${f}](${at(`data/${f}`)}): ${d}`).join('\n')}
`);
writeFileSync(join(DIST, 'llms-full.txt'), `# Otto, full public record

State of ${human(cfg.recordDate)}. Author: ${cfg.person.name}.

## Questions and answers

${faq.map(([, q, a]) => `### ${q}\n${a}\n`).join('\n')}
## Tests

${tests.map((t) => `### ${nm(t)} (${t.code})\nVerdict: ${VERDICT[t.verdict]}. Outcome: ${t.value}.\nQuestion: ${t.q}\nResult: ${t.result}\nDesign: ${protocols[t.id].design}\nNumbers: ${protocols[t.id].numbers}\nLimit: ${protocols[t.id].limit}\nBears on: ${t.to.map((x) => nm(obj[x])).join(', ')}.\n`).join('\n')}
## Objectives

${rising.map((o) => `### ${nm(o)}\nState: ${STATE[o.state]}.\n${o.q}\nTest: ${o.test}\nWhat could fool us: ${o.fool.join('; ')}.\nOn record: ${o.record}\n`).join('\n')}
## The eleven questions

${climb.map((c, i) => `${i}. ${c.t} (${c.s})`).join('\n')}

## Glossary

${glossary.map(([t, d]) => `- ${t}: ${d}`).join('\n')}
`);
writeFileSync(join(DIST, 'site.webmanifest'), JSON.stringify({ name: 'Otto, artificial life research', short_name: 'Otto', start_url: './', display: 'browser', background_color: '#ffffff', theme_color: '#ffffff', icons: [192, 512].map((n) => ({ src: `assets/icon-${n}.png`, sizes: `${n}x${n}`, type: 'image/png' })) }));
// A project site on GitHub Pages cannot own the root of its origin, so the file lives under the project path; SECURITY.md and the legal page point to it.
mkdirSync(join(DIST, '.well-known'), { recursive: true });
writeFileSync(join(DIST, '.well-known/security.txt'), `Contact: mailto:${cfg.email}\nContact: https://github.com/MaliciousMusic/otto-site/security/advisories/new\nExpires: ${cfg.securityExpires}T00:00:00.000Z\nPreferred-Languages: en, fr\n${SITE ? `Canonical: ${abs('.well-known/security.txt')}\n` : ''}`);

writeFileSync(join(DIST, '.nojekyll'), '');

if (!quiet) {
  console.log(`${pages.length} pages built`);
  if (missing.length) console.log(`Draft build (noindex). Before launch, fill in site.config.json: ${missing.join(', ')}`);
}
