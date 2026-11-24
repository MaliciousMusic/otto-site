// The lab: any elementary law on a ring, seeded and replayable. Rule 232 is the majority law of the recorded studies.
import { SplitMix64, seeded, clusters, same } from './world.js';
import { el } from './cell.js';
import { calm } from './prefs.js';

const T = 64, $ = (id) => document.getElementById(id);
const PRESETS = [
  ['Reference run', { seed: 183742, n: 32, p: 25, order: 'sync', rule: 232 }],
  ['Balanced start', { seed: 183809, n: 32, p: 50, order: 'sync', rule: 232 }],
  ['One by one', { seed: 183809, n: 32, p: 50, order: 'seq', rule: 232 }],
  ['Frozen', { seed: 183809, n: 64, p: 50, order: 'sync', rule: 204 }],
  ['Chaos', { seed: 33, n: 128, p: 50, order: 'sync', rule: 30 }],
  ['Triangles', { seed: 8, n: 128, p: 5, order: 'sync', rule: 90 }],
  ['Gliders', { seed: 110, n: 128, p: 50, order: 'sync', rule: 110 }],
];
const NAMES = { 232: 'majority, the law of the recorded studies', 204: 'identity, the frozen control', 30: 'rule 30', 90: 'rule 90', 110: 'rule 110' };

export function apply(rule, s, i) { const n = s.length; return (rule >> (s[(i + n - 1) % n] * 4 + s[i] * 2 + s[(i + 1) % n])) & 1; }
export function evolve(c, pokes = {}) {
  let s = seeded(c.seed, c.n, c.p / 100);
  const rng = new SplitMix64(BigInt(c.seed) ^ 0xD1B54A32D192ED03n), rows = [];
  for (let t = 0; t <= T; t++) {
    if (pokes[t]) { s = s.slice(); for (const i of pokes[t]) s[i] ^= 1; }
    rows.push(s);
    if (c.order === 'sync') s = s.map((_, i) => apply(c.rule, rows[t], i));
    else {
      const order = [...s.keys()], next = s.slice();
      for (let i = c.n - 1; i > 0; i--) { const j = rng.index(i + 1); [order[i], order[j]] = [order[j], order[i]]; }
      for (const i of order) next[i] = apply(c.rule, next, i);
      s = next;
    }
  }
  return rows;
}
async function fingerprint(rows) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rows.map((r) => r.join('')).join('\n'))));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function lab() {
  let c = { ...PRESETS[0][1] }, pokes = {}, rows = [], t = 0, timer = null;
  const canvas = $('lab-canvas'), ctx = canvas.getContext('2d'), css = getComputedStyle(document.documentElement);
  const COLOR = [css.getPropertyValue('--blue').trim(), css.getPropertyValue('--green').trim()];

  // ---- the law editor
  const law = $('lab-law');
  const bits = Array.from({ length: 8 }, (_, k) => 7 - k).map((k) => {
    const b = document.createElement('button'), trio = document.createElement('span'), out = document.createElement('i');
    b.type = 'button'; trio.className = 'trio';
    const t3 = [k >> 2 & 1, k >> 1 & 1, k & 1], w = (v) => (v ? 'green' : 'blue');
    for (const v of t3) { const i = document.createElement('i'); i.className = v ? 'g' : 'b'; trio.append(i); }
    b.append(trio, out); law.append(b);
    b.addEventListener('click', () => { c.rule ^= 1 << k; restart(); });
    return () => { const v = c.rule >> k & 1; out.className = v ? 'g' : 'b'; b.setAttribute('aria-label', `${t3.map(w).join(', ')}: the middle cell becomes ${w(v)}`); b.setAttribute('aria-pressed', String(!!v)); };
  });

  // ---- drawing
  function draw() {
    const w = canvas.clientWidth, d = devicePixelRatio || 1, s = w / c.n, hgt = Math.max(3, Math.min(s, 12)) * (T + 1);
    canvas.style.height = `${hgt}px`;
    canvas.width = Math.round(w * d); canvas.height = Math.round(hgt * d);
    ctx.scale(d, d);
    const ch = hgt / (T + 1), gap = s > 6 ? 1 : 0;
    for (let y = 0; y <= T; y++) for (let x = 0; x < c.n; x++) {
      ctx.globalAlpha = y <= t ? 1 : .12;
      ctx.fillStyle = COLOR[rows[y][x]];
      ctx.beginPath(); ctx.roundRect(x * s, y * ch, s - gap, ch - (ch > 5 ? 1 : 0), Math.min(s, ch) * .4); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.strokeStyle = css.getPropertyValue('--ink'); ctx.lineWidth = 2;
    ctx.strokeRect(1, t * ch + .5, w - 2, ch);
    graph();
  }
  function graph() {
    const g = $('lab-groups'), w = g.clientWidth || 600, hgt = 120, ys = rows.map(clusters), max = Math.max(4, ...ys);
    const X = (i) => 34 + i / T * (w - 44), Y = (v) => 92 - v / max * 78;
    g.setAttribute('viewBox', `0 0 ${w} ${hgt}`); g.setAttribute('height', hgt);
    const text = (x, y, s, a = 'start') => { const n = el('text', { x, y, 'text-anchor': a }); n.textContent = s; return n; };
    g.replaceChildren(el('line', { x1: 34, x2: w - 10, y1: 92, y2: 92, class: 'base' }),
      el('path', { d: `M${ys.map((v, i) => `${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('L')}`, class: 'curve' }),
      el('circle', { cx: X(t), cy: Y(ys[t]), r: 6, class: 'mark-dot' }),
      text(28, Y(max) + 5, max, 'end'), text(28, 97, 0, 'end'), text(34, 114, 'Groups over time'), text(w - 10, 114, `time ${T}`, 'end'));
    g.setAttribute('aria-label', `Groups over time: ${ys[0]} at the start, ${ys[T]} at time ${T}, ${ys[t]} now.`);
  }
  const settled = () => { const k = rows.findIndex((r, i) => i && same(r, rows[i - 1])); return k < 0 ? null : k - 1; };
  function tell() {
    const r = rows[t], green = r.reduce((a, b) => a + b, 0), still = settled();
    $('lab-say').textContent = `Time ${t}: ${green} of ${c.n} cells green, in ${clusters(r)} ${clusters(r) === 1 ? 'group' : 'groups'}. ${still === null ? `Still changing at time ${T}.` : `Settled at time ${still}.`}`;
    $('lab-t').value = t; $('lab-t-out').textContent = t;
  }
  function show(k) { t = Math.max(0, Math.min(T, k)); draw(); tell(); }

  // ---- state
  async function refresh() {
    rows = evolve(c, pokes);
    for (const b of bits) b();
    $('lab-law-say').textContent = `Law number ${c.rule}${NAMES[c.rule] ? `: ${NAMES[c.rule]}` : ', your own'}.`;
    $('lab-seed').value = c.seed; $('lab-n').value = c.n; $('lab-p').value = c.p; $('lab-p-out').textContent = `${c.p}%`; $('lab-order').value = c.order; $('lab-cell').max = c.n;
    show(t);
    history.replaceState(null, '', `#${new URLSearchParams({ seed: c.seed, n: c.n, p: c.p, order: c.order, rule: c.rule })}`);
    const mine = rows, f = await fingerprint(rows);
    if (mine === rows) $('lab-hash').textContent = `Fingerprint of this run: ${f.slice(0, 16)}`;
  }
  function restart() { stop(); pokes = {}; t = 0; refresh(); }
  function stop() { clearInterval(timer); timer = null; $('lab-play').textContent = 'Play'; }
  function play() {
    if (timer) return stop();
    if (t >= T) show(0);
    $('lab-play').textContent = 'Pause';
    timer = setInterval(() => { if (t >= T) return stop(); show(t + 1); }, calm() ? 400 : 110);
  }

  for (const [name, p] of PRESETS) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = name;
    b.addEventListener('click', () => { c = { ...p }; restart(); }); $('lab-presets').append(b);
  }
  $('lab-form').addEventListener('submit', (e) => e.preventDefault());
  $('lab-seed').addEventListener('change', (e) => { c.seed = Math.max(0, Math.min(4294967295, Math.round(+e.target.value) || 0)); restart(); });
  $('lab-dice').addEventListener('click', () => { c.seed = crypto.getRandomValues(new Uint32Array(1))[0]; restart(); });
  $('lab-n').addEventListener('change', (e) => { c.n = +e.target.value; restart(); });
  $('lab-p').addEventListener('input', (e) => { c.p = +e.target.value; restart(); });
  $('lab-order').addEventListener('change', (e) => { c.order = e.target.value; restart(); });
  $('lab-play').addEventListener('click', play);
  $('lab-step').addEventListener('click', () => { stop(); show(t + 1); });
  $('lab-end').addEventListener('click', () => { stop(); show(T); });
  $('lab-back').addEventListener('click', () => { stop(); show(0); });
  $('lab-t').addEventListener('input', (e) => { stop(); show(+e.target.value); });
  const pokeAt = (i) => { stop(); (pokes[t] ??= []).push(i); refresh(); $('lab-cell').value = i + 1; };
  $('lab-poke').addEventListener('click', () => pokeAt(Math.max(1, Math.min(c.n, +$('lab-cell').value || 1)) - 1));
  canvas.addEventListener('click', (e) => { const b = canvas.getBoundingClientRect(); show(Math.floor((e.clientY - b.y) / b.height * (T + 1))); pokeAt(Math.min(c.n - 1, Math.floor((e.clientX - b.x) / b.width * c.n))); });
  canvas.addEventListener('keydown', (e) => { const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); stop(); show(t + d); } });
  $('lab-replay').addEventListener('click', async () => {
    const [a, b] = await Promise.all([fingerprint(rows), fingerprint(evolve(c, pokes))]);
    $('lab-hash').textContent = a === b ? `Same fingerprint twice: ${a.slice(0, 16)}. Every cell at every step is identical.` : 'The two runs differ. Please tell us, this should never happen.';
  });
  const flash = (b, text) => { const was = b.textContent; b.textContent = text; setTimeout(() => { b.textContent = was; }, 1600); };
  $('lab-link').addEventListener('click', async (e) => { try { await navigator.clipboard.writeText(location.href); flash(e.target, 'Copied'); } catch { flash(e.target, 'Copy the address bar'); } });
  const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const file = () => `otto-law${c.rule}-seed${c.seed}-n${c.n}-p${c.p}-${c.order}`;
  $('lab-csv').addEventListener('click', () => save(new Blob([`time,groups,green,${rows[0].map((_, i) => `cell_${i + 1}`).join(',')}\n${rows.map((r, i) => [i, clusters(r), r.reduce((a, b) => a + b, 0), ...r].join(',')).join('\n')}\n`], { type: 'text/csv' }), `${file()}.csv`));
  $('lab-png').addEventListener('click', () => { const was = t; show(T); canvas.toBlob((b) => { save(b, `${file()}.png`); show(was); }); });

  const h = new URLSearchParams(location.hash.slice(1));
  if (h.has('seed')) {
    const num = (k, lo, hi, d) => { const v = Math.round(+h.get(k)); return v >= lo && v <= hi ? v : d; };
    c = { seed: num('seed', 0, 4294967295, 183742), n: [32, 64, 128].includes(+h.get('n')) ? +h.get('n') : 32, p: num('p', 5, 95, 25), order: h.get('order') === 'seq' ? 'seq' : 'sync', rule: num('rule', 0, 255, 232) };
  }
  t = h.has('seed') ? 0 : 6;
  refresh();
  new ResizeObserver(() => { if (rows.length) draw(); }).observe(canvas.parentElement);
}
