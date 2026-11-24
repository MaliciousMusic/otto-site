// Five exhibits drawn from the recorded data.
import R from '../data/results.js';
import { el, face } from './cell.js';
import { SplitMix64, seeded, settle, stepInOrder } from './world.js';

const $ = (id) => document.getElementById(id);
const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const tip = h('div', 'tip'); tip.hidden = true; document.body.append(tip);
const hover = (n, strong, rest) => {
  const on = (x, y) => {
    tip.replaceChildren(h('strong', '', strong()), h('span', '', rest())); tip.hidden = false;
    const b = tip.getBoundingClientRect();
    tip.style.left = `${Math.max(8, Math.min(innerWidth - b.width - 8, x - b.width / 2))}px`; tip.style.top = `${y - b.height - 14 < 8 ? y + 18 : y - b.height - 14}px`;
  };
  n.addEventListener('pointermove', (e) => on(e.clientX, e.clientY));
  n.addEventListener('pointerleave', () => { tip.hidden = true; });
  n.addEventListener('focus', () => { const b = n.getBoundingClientRect(); on(b.x + b.width / 2, b.y); });
  n.addEventListener('blur', () => { tip.hidden = true; });
};
const toggle = (root, opts, on) => {
  const bs = opts.map(([v, label]) => { const b = h('button', '', label); b.type = 'button'; b.addEventListener('click', () => set(v)); root.append(b); return [v, b]; });
  const set = (v) => { bs.forEach(([x, b]) => b.setAttribute('aria-pressed', String(x === v))); on(v); };
  return set;
};
const table = (id, head, body) => {
  const t = h('table'), tr = t.createTHead().insertRow();
  head.forEach((x) => { const c = h('th', '', x); c.scope = 'col'; tr.append(c); });
  const tb = t.createTBody();
  body.forEach((r) => { const row = tb.insertRow(); r.forEach((x) => { row.insertCell().textContent = x; }); });
  $(id).append(t);
};
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

function law() {
  const root = $('law-chart'), read = $('law-read');
  let p = '0.5', on = 0;
  const MAX = 13, svg = root.appendChild(el('svg', { role: 'img', 'aria-label': 'Number of groups in each of 64 worlds, with the law off or on' }));
  const axis = svg.appendChild(el('g', { class: 'axis' })), dots = svg.appendChild(el('g'));
  const cs = Array.from({ length: 64 }, (_, i) => {
    const c = dots.appendChild(el('circle', { class: 'pt' }));
    hover(c, () => { const [, a, b] = R.law[p][i]; return `${a} → ${b} groups`; }, () => `World ${R.law[p][i][0]}`);
    return c;
  });
  function layout() {
    const W = root.clientWidth; if (!W) return;
    const cw = (W - 8) / (MAX + 1), d = Math.min(13, (cw - 4) / 2), per = Math.max(2, Math.floor((cw - 4) / d));
    const data = R.law[p], stacks = {};
    const tall = Math.max(...['0.25', '0.5'].flatMap((q) => [1, 2].map((k) => { const m = {}; R.law[q].forEach((r) => { m[r[k]] = (m[r[k]] || 0) + 1; }); return Math.max(...Object.values(m)); })));
    const H = Math.ceil(tall / per) * d + 44, base = H - 34;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    axis.replaceChildren(el('line', { x1: 0, x2: W, y1: base + 3, y2: base + 3 }));
    for (let i = 0; i <= MAX; i++) { const t = el('text', { x: 4 + (i + .5) * cw, y: base + 20, 'text-anchor': 'middle' }); t.textContent = i; axis.append(t); }
    data.forEach((r, i) => {
      const v = on ? r[2] : r[1], k = stacks[v] = (stacks[v] ?? -1) + 1;
      const x = 4 + (v + .5) * cw + ((k % per) - (per - 1) / 2) * d, y = base - d / 2 - Math.floor(k / per) * d;
      cs[i].setAttribute('r', d / 2 - 1);
      cs[i].style.transform = `translate(${x}px,${y}px)`; cs[i].style.transitionDelay = `${i * 7}ms`;
      cs[i].classList.toggle('g', !!on);
    });
    const a = mean(data.map((r) => r[1])), b = mean(data.map((r) => r[2]));
    read.textContent = on ? `Law on: ${b.toFixed(1)} groups on average, down from ${a.toFixed(1)}. Fewer in all 64 worlds.` : `Law off: ${a.toFixed(1)} groups on average, and nothing moves.`;
  }
  const setP = toggle($('law-p'), [['0.25', 'Sparse start'], ['0.5', 'Balanced start']], (v) => { p = v; layout(); });
  const setOn = toggle($('law-on'), [[0, 'Law off'], [1, 'Law on']], (v) => { on = v; layout(); });
  setP('0.5'); setOn(0);
  setTimeout(() => dots.classList.add('ready'), 300);
  new ResizeObserver(layout).observe(root);
  table('law-table', ['Start', 'Worlds', 'Groups, law off', 'Groups, law on', 'Fewer in'], ['0.25', '0.5'].map((q) => { const d = R.law[q]; return [q === '0.25' ? 'Sparse (25%)' : 'Balanced (50%)', d.length, mean(d.map((r) => r[1])).toFixed(2), mean(d.map((r) => r[2])).toFixed(2), `${d.filter((r) => r[2] < r[1]).length} of ${d.length}`]; }));
  return () => setOn(1);
}

function orders() {
  const root = $('orders-chart'), view = $('orders-view');
  const strip = (s, label) => {
    const d = h('div', 'strip'); d.append(h('span', '', label));
    const b = h('div', 'beads'); s.forEach((v) => b.append(h('i', v ? 'g' : 'b'))); d.append(b); return d;
  };
  const show = (seed, btn) => {
    root.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
    const s = seeded(seed, 32, .5), names = {}, out = [strip(s, 'Start')];
    for (let k = 0; k < 4; k++) {
      const rng = new SplitMix64(910000 + (seed - 183807) * 4 + k), e = settle(s, (x) => stepInOrder(x, rng)).state, key = e.join('');
      names[key] ??= 'ABCD'[Object.keys(names).length];
      out.push(strip(e, `Order ${k + 1}: ${names[key]}`));
    }
    const n = Object.keys(names).length;
    view.replaceChildren(h('p', 'read', `World ${seed}: ${n} ${n === 1 ? 'ending' : 'different endings'} from one start.`), ...out);
  };
  let first;
  for (const n of [1, 2, 3, 4]) {
    const set = R.orders.filter((o) => o[1] === n), row = h('div', 'orow');
    row.append(h('span', 'olabel', `${n} ${n === 1 ? 'ending' : 'endings'}`));
    const cells = h('div', 'ocells');
    for (const [seed] of set) {
      const b = h('button', n > 1 ? 'g' : 'b'); b.type = 'button'; b.setAttribute('aria-label', `World ${seed}, ${n} endings`);
      b.addEventListener('click', () => show(seed, b)); hover(b, () => `${n} ${n === 1 ? 'ending' : 'endings'}`, () => `World ${seed}`);
      cells.append(b); if (n === 4) first ??= [seed, b];
    }
    row.append(cells, h('strong', '', set.length)); root.append(row);
  }
  show(...first);
}

const bead = (v) => { const s = el('svg', { viewBox: '-21 -21 42 42', class: `bead ${v ? 'g' : 'b'}` }); s.append(el('circle', { r: 18, class: 'skin' }), face(v ? 'smile' : 'oh')); return s; };

function poke() {
  const root = $('poke-chart');
  const draw = (n) => {
    root.replaceChildren(...Object.entries(R.distance[n]).map(([cls, rows]) => {
      const far = cls.startsWith('2'), moved = rows.filter((r) => r[1]).length, d = h('div', 'pcol');
      d.append(h('h4', '', far ? '2 or more away' : cls === '0' ? 'On a border' : '1 away'));
      const grid = h('div', 'beadgrid');
      rows.forEach(([seed, m]) => { const b = bead(!m); hover(b, () => (m ? 'Moved for good' : 'Healed'), () => `World ${seed}`); grid.append(b); });
      d.append(grid, h('p', '', far ? `${rows.length - moved} of ${rows.length} healed` : `${moved} of ${rows.length} moved`));
      return d;
    }));
  };
  toggle($('poke-n'), [['32', '32 cells'], ['64', '64 cells']], draw)('32');
  table('poke-table', ['World size', 'Distance to a border', 'Moved', 'Healed'], ['32', '64'].flatMap((n) => Object.entries(R.distance[n]).map(([c, r]) => { const m = r.filter((x) => x[1]).length; return [n, c.startsWith('2') ? '2 or more' : c, m, r.length - m]; })));
}

const ORG = {
  closed_cycle_baseline: 'The loop, left alone', sham: 'Pretend cut', role_preserving_substitution: 'Cut, inner stand-in',
  external_replacement: 'Cut, outside help', edge_ablation: 'Cut', fixed_attractor_control: 'Control: frozen',
  externally_maintained_control: 'Control: fed from outside', all_zero_control: 'Control: empty',
};
function org() {
  const root = $('loop-chart');
  for (const [k, label] of Object.entries(ORG)) {
    const s = R.org01[k], row = h('div', 'trace'); row.append(h('span', '', label));
    const bar = h('div', 'ticks'); bar.tabIndex = 0; bar.setAttribute('role', 'img');
    const lost = s.indexOf('0');
    bar.setAttribute('aria-label', lost < 0 ? `${label}: stays on for all 65 states` : lost === 0 ? `${label}: never on` : `${label}: lost at state ${lost}`);
    [...s].forEach((c, i) => { const t = h('i', c === '1' ? 'g' : ''); if (i >= 8 && i < 16) t.classList.add('cut'); bar.append(t); });
    hover(bar, () => (lost < 0 ? 'On from 0 to 64' : lost === 0 ? 'Never on' : `Lost at state ${lost}`), () => label);
    row.append(bar, h('strong', '', lost < 0 ? 'on' : lost === 0 ? 'off' : `lost at ${lost}`)); root.append(row);
  }
}

const EYES = [['0', 'Look from 10 to 20'], ['1', 'Look from 8 to 18'], ['2', 'Look from 12 to 22'], ['3', 'Look with wider steps']];
function observer() {
  const root = $('observer-chart'), read = $('observer-read');
  const groups = ['4', '92'].map((n) => {
    const d = h('div', 'ocol'), title = h('h4', '', `Starting from ${n}`), grid = h('div', 'beadgrid wide'), note = h('p');
    const beads = R.observer[n].map((p, i) => { const b = bead(p[0]); hover(b, () => (p[eye] ? 'Counted as self-renewing' : 'Not counted'), () => (new Set(p).size > 1 ? `Path ${i}: changes with the observer` : `Path ${i}: same verdict for everyone`)); grid.append(b); return b; });
    d.append(title, grid, note); root.append(d);
    return { n, beads, note };
  });
  let eye = 0;
  toggle($('observer-eye'), EYES, (v) => {
    eye = +v; let changed = 0;
    for (const g of groups) {
      let pass = 0;
      R.observer[g.n].forEach((p, i) => {
        const b = g.beads[i], v2 = p[eye]; pass += v2;
        if (b.classList.contains('g') !== !!v2) { b.classList.toggle('g', !!v2); b.classList.toggle('b', !v2); b.replaceChild(face(v2 ? 'smile' : 'oh'), b.lastChild); }
        const diff = p[eye] !== p[0]; b.classList.toggle('diff', diff); changed += diff;
      });
      g.note.textContent = `${pass} of 64 counted`;
    }
    read.textContent = eye ? `${changed} paths changed their verdict. Nothing in Otto’s world changed, only the way we looked.` : 'This is the reference observer. Try another one.';
  })('0');
  table('observer-table', ['Observer', 'Counted, start 4', 'Counted, start 92', 'Changed verdict'], EYES.map(([k, l]) => [l, R.observer['4'].filter((p) => p[k]).length, R.observer['92'].filter((p) => p[k]).length, ['4', '92'].reduce((a, n) => a + R.observer[n].filter((p) => p[k] !== p[0]).length, 0)]));
}

export function results() {
  const turnOn = law(); orders(); poke(); org(); observer();
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setTimeout(turnOn, 900); } }, { threshold: .6 });
  io.observe($('law-chart'));
}
