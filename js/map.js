// The map: objectives (cells), tests (dishes) and results (drops), on springs.
// Deep links: map/#ORG opens an objective, map/#T10 a test, map/#list the list view.
import { el, cell } from './cell.js';
import { objectives, links, tests, wayUp } from '../data/map.js';
import { calm, onMotion, roving, smooth } from './prefs.js';

const VERDICT = { holds: 'Holds, within its domain', toy: 'Toy model only', rejected: 'Rejected', waiting: 'Not run' };
const STATE = { measured: 'Measured, within a bounded domain', now: 'We are working here', asleep: 'Not started, no evidence yet' };
const LINK = { solid: 'supported', maybe: 'plausible', unsure: 'contested or unknown', def: 'part of the definition', no: 'refuted' };
const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
const nm = (o) => o.name.join(' ');

export function map() {
  const $ = (id) => document.getElementById(id);
  const wrap = $('map'), panel = $('map-panel'), tip = $('map-tip'), tourBtn = $('map-tour'), emptyPanel = [...panel.childNodes].map((n) => n.cloneNode(true));
  const svg = wrap.appendChild(el('svg', { role: 'group', 'aria-label': 'Graph of objectives, tests and results', 'aria-describedby': 'map-help' }));
  let nodes, edges, byId, W, r, H, sel = null, show = 'all', touring = null, visible = false, drag = null;

  // ---- drawing
  function build() {
    W = wrap.clientWidth;
    if (!W) return;
    const small = W < 640;
    r = small ? 20 : 27;
    const rowH = small ? 106 : 118, top = small ? 74 : 92, padX = small ? 30 : 64;
    const X = (x) => padX + x * (W - 2 * padX), Y = (t) => top + (8 - t) * rowH;
    const ground = Y(0) + (small ? 62 : 72);
    H = ground + (small ? 300 : 210);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    const focused = svg.contains(document.activeElement) ? document.activeElement.dataset.id : null;
    svg.replaceChildren();
    svg.append(el('path', { class: 'soil', d: `M0 ${ground}${Array.from({ length: 6 }, (_, i) => `q${W / 12} ${i % 2 ? 12 : -12} ${W / 6} 0`).join('')}V${H}H0Z` }));
    const yHere = Y(2) + r + (small ? 40 : 50);
    svg.append(el('path', { class: 'here', d: `M0 ${yHere}${Array.from({ length: 12 }, (_, i) => `q${W / 24} ${i % 2 ? 5 : -5} ${W / 12} 0`).join('')}` }));
    const hl = el('text', { class: 'here-label', x: small ? 6 : 10, y: yHere + (small ? 18 : 24) }); hl.textContent = small ? 'not crossed yet' : 'Otto is below this line'; svg.append(hl);

    nodes = objectives.map((o) => ({ ...o, kind: 'objective', hx: X(o.x), hy: Y(o.tier), r: o.goal ? r * 1.35 : r }));
    const cols = small ? 6 : 11, cw = (W - (small ? 8 : 2 * padX - 40)) / cols, x0 = small ? 4 : padX - 20;
    tests.forEach((t, i) => {
      const row = Math.floor(i / cols), n = row === 0 ? cols : tests.length - cols;
      const x = x0 + ((i % cols) + .5) * cw + (n < cols ? cw / 2 : 0);
      const y = ground + (small ? 34 + row * 136 : 62);
      nodes.push({ ...t, kind: 'test', hx: x, hy: y, r: small ? 13 : 16 });
      nodes.push({ id: `${t.id}r`, of: t.id, kind: 'result', verdict: t.verdict, value: t.value, test: t, hx: x, hy: y + (small ? 72 : 92), r: 12 });
    });
    byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    edges = links.map(([a, b, kind]) => ({ a: byId[a], b: byId[b], kind }));
    for (const t of tests) {
      for (const o of t.to) edges.push({ a: byId[t.id], b: byId[o], kind: `root ${t.verdict}` });
      edges.push({ a: byId[`${t.id}r`], b: byId[t.id], kind: `root ${t.verdict}` });
    }
    const gE = svg.appendChild(el('g', { class: 'edges', 'aria-hidden': 'true' })), gN = svg.appendChild(el('g', { class: 'nodes' }));
    for (const e of edges) {
      e.path = gE.appendChild(el('path', { class: `edge ${e.kind}` }));
      if (e.kind === 'no') e.cross = gE.appendChild(el('path', { class: 'edge-x', d: 'M-6 -6L6 6M6 -6L-6 6' }));
    }
    nodes.forEach((n, i) => drawNode(n, i, gN, small));
    roving(nodes.map((n) => n.g), nearest);
    if (focused && byId[focused]) byId[focused].g.focus({ preventScroll: true });
    draw(0); filter(show); light(sel);
  }

  function drawNode(n, i, gN, small) {
    Object.assign(n, { x: n.hx, y: n.hy, vx: 0, vy: 0, ph: i * 1.7 });
    const g = n.g = gN.appendChild(el('g', { class: `node ${n.kind} ${n.state || n.verdict || ''}`, role: 'button', 'data-id': n.id }));
    g.setAttribute('aria-label', n.kind === 'objective' ? `Objective: ${nm(n)}. ${STATE[n.state]}.` : n.kind === 'test' ? `Test: ${nm(n)}. ${VERDICT[n.verdict]}.` : `Result of ${nm(n.test)}: ${n.value}. ${VERDICT[n.verdict]}.`);
    const b = n.body = el('g', { class: 'body' });
    // one text element per label, so that the visible words match the accessible name
    const label = (cls, y, lines, dy = 0) => {
      const t = el('text', { class: cls, 'text-anchor': 'middle' });
      lines.forEach((l, j) => { const s = el('tspan', { x: 0, y: y + j * dy }); s.textContent = l; if (j) t.append(' '); t.append(s); });
      b.append(t);
    };
    if (n.kind === 'objective') {
      const c = b.appendChild(cell(n.state === 'measured' ? 'smile' : n.state === 'now' ? 'oh' : 'sleep')); c.setAttribute('transform', `scale(${n.r / 19.8})`);
      if (n.state === 'asleep' && !small) b.append(el('path', { class: 'zz', d: `M${n.r * .8} ${-n.r * .7 - 9}h8l-8 9h8` }));
      const lh = n.goal ? (small ? 15 : 19) : (small ? 13 : 16);
      label(n.goal ? 'name goal' : 'name', n.goal ? -n.r - 10 - (n.name.length - 1) * lh : n.r + (small ? 15 : 18), n.name, lh);
    } else if (n.kind === 'test') {
      b.append(el('path', { class: 'dish', d: `M${-n.r} ${-n.r * .7}H${n.r}V${n.r * .15}A${n.r} ${n.r * .75} 0 0 1 ${-n.r} ${n.r * .15}Z` }),
        el('path', { class: 'rim', d: `M${-n.r - 4} ${-n.r * .7}H${n.r + 4}` }),
        el('circle', { class: 'bub', cx: -4, cy: 1, r: 2.4 }), el('circle', { class: 'bub', cx: 4, cy: -3, r: 1.7 }));
      label('tname', n.r + 13, n.name, 13);
    } else {
      b.append(el('path', { class: 'drop', d: 'M0 -13C5 -6 9 -2 9 4A9 9 0 0 1 -9 4C-9 -2 -5 -6 0 -13Z' }));
      b.append(el('path', { class: 'mark', d: { holds: 'M-4 3L-1 6L4.5 -.5', rejected: 'M-3.4 .2L3.4 7M3.4 .2L-3.4 7', toy: 'M-3.6 4Q-1.8 2 0 4T3.6 4', waiting: 'M0 1V5M0 7.6V7.7' }[n.verdict] }));
      label('value', 30, [n.value]);
    }
    n.hit = el('circle', { r: Math.max(n.r + 4, 22), class: 'hit' });
    g.append(n.hit, b);

    g.addEventListener('pointerdown', (e) => { drag = { n, sx: e.clientX, sy: e.clientY, moved: false, touch: e.pointerType === 'touch' }; if (!drag.touch) g.setPointerCapture(e.pointerId); });
    g.addEventListener('pointermove', (e) => {
      if (!drag || drag.n !== n || drag.touch) return;
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) drag.moved = true;
      if (!drag.moved) return;
      const box = svg.getBoundingClientRect();
      n.x = e.clientX - box.x; n.y = e.clientY - box.y; n.vx = n.vy = 0; n.held = true;
      wake();
    });
    const drop = () => { if (drag?.n === n) { n.held = false; drag.done = drag.moved; setTimeout(() => { drag = null; }, 60); } };
    g.addEventListener('pointerup', drop); g.addEventListener('pointercancel', drop);
    g.addEventListener('click', () => { const m = drag?.done; drag = null; if (!m) { stopTour(); pick(n.id); } });
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopTour(); pick(n.id, true); } });
    g.addEventListener('pointerenter', () => { if (!touring && !drag) light(n.id); });
    g.addEventListener('pointerleave', () => { if (!touring && !drag) light(sel); });
  }

  // the closest node in the direction of the arrow key
  function nearest(i, key) {
    const a = nodes[i], [ux, uy] = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[key];
    let best = null, score = Infinity;
    nodes.forEach((b, j) => {
      const dx = b.hx - a.hx, dy = b.hy - a.hy, along = dx * ux + dy * uy, off = Math.abs(dx * uy - dy * ux);
      if (j === i || along < 8 || off > along * 2.2 + 30) return;
      if (along + off * 1.6 < score) { score = along + off * 1.6; best = j; }
    });
    return best;
  }

  function edgePath(e) {
    const { a, b } = e, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    if (e.kind === 'no') { e.cross.setAttribute('transform', `translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`); return `M${a.x} ${a.y - a.r}L${b.x} ${b.y + b.r}`; }
    if (Math.abs(dy) < 60 || dy > 0) {
      const s = { x: a.x + dx / L * a.r, y: a.y + dy / L * a.r }, t = { x: b.x - dx / L * b.r, y: b.y - dy / L * b.r };
      return `M${s.x} ${s.y}Q${(s.x + t.x) / 2 + dy * .12} ${(s.y + t.y) / 2 - 16} ${t.x} ${t.y}`;
    }
    if (a.id === 'SCA') { const edge = Math.min(W - 8, Math.max(a.x, b.x) + 30); return `M${a.x} ${a.y - a.r}C${edge} ${a.y - 160} ${edge} ${b.y + 260} ${b.x + b.r * .8} ${b.y + b.r * .6}`; }
    const k = Math.max(26, -dy * .45);
    return `M${a.x} ${a.y - a.r}C${a.x} ${a.y - k} ${b.x} ${b.y + k} ${b.x} ${b.y + b.r}`;
  }
  function draw(now) {
    for (const n of nodes) {
      const fl = calm() || n.kind !== 'objective' ? 0 : Math.sin(now / 1100 + n.ph) * (n.state === 'asleep' ? 1.2 : 2.6);
      n.body.setAttribute('transform', `translate(${n.x.toFixed(1)} ${(n.y + fl).toFixed(1)})`);
      n.hit.setAttribute('cx', n.x); n.hit.setAttribute('cy', n.y);
    }
    for (const e of edges) e.path.setAttribute('d', edgePath(e));
  }
  let raf = 0;
  function wake() { if (!raf && nodes) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    let moving = false;
    for (const e of edges) {
      if (e.kind === 'no') continue;
      for (const [p, q] of [[e.a, e.b], [e.b, e.a]]) { q.vx += (p.x - p.hx) * .006; q.vy += (p.y - p.hy) * .006; }
    }
    for (const n of nodes) {
      if (n.held) { moving = true; continue; }
      n.vx = (n.vx + (n.hx - n.x) * .085) * .8; n.vy = (n.vy + (n.hy - n.y) * .085) * .8;
      n.x += n.vx; n.y += n.vy;
      if (Math.abs(n.vx) + Math.abs(n.vy) > .02) moving = true;
    }
    draw(now);
    if (visible && (moving || !calm())) wake();
  }

  // ---- highlighting
  function kin(id) {
    const reach = (up) => {
      const keep = new Set([id]), go = (from) => edges.forEach((e) => {
        if (e.kind === 'no') return;
        const [p, q] = up ? [e.a.id, e.b.id] : [e.b.id, e.a.id];
        if (p === from && !keep.has(q)) { keep.add(q); go(q); }
      });
      go(id);
      return keep;
    };
    return new Set([...reach(true), ...reach(false)]);
  }
  function light(id) {
    if (!nodes) return;
    const keep = Array.isArray(id) ? new Set(id) : id ? kin(id) : null;
    svg.classList.toggle('lit', !!keep);
    for (const n of nodes) { n.g.classList.toggle('on', !!keep?.has(n.id)); n.g.classList.toggle('sel', n.id === sel); n.g.setAttribute('aria-pressed', String(n.id === sel)); }
    for (const e of edges) {
      const on = e.kind === 'no' ? id === 'PER' || id === 'ACI' : !!keep && keep.has(e.a.id) && keep.has(e.b.id);
      e.path.classList.toggle('on', on); e.cross?.classList.toggle('on', on);
    }
  }

  // ---- details
  function pick(id, focus) {
    sel = id; light(id);
    const n = byId[id], out = [], add = (...x) => out.push(...x);
    const part = (title, ...body) => add(h('h3', 'pt', title), ...body);
    const jump = (title, items) => {
      if (!items.length) return;
      const d = h('div', 'jump');
      for (const [t, label, note] of items) { const b = h('button', 'chip chip-in', label); b.type = 'button'; if (note) b.append(h('span', 'note', ` ${note}`)); b.addEventListener('click', () => { pick(t, true); reveal(t); }); d.append(b); }
      part(title, d);
    };
    if (n.kind === 'objective') {
      add(h('p', `badge ${n.state}`, STATE[n.state]), h('h2', 'ph', nm(n)), h('p', 'big', n.q));
      part('How we would test it', h('p', '', n.test));
      const ul = h('ul'); n.fool.forEach((x) => ul.append(h('li', '', x)));
      part('What could fool us', ul);
      part('On record', h('p', '', n.record));
      jump('Tests', tests.filter((t) => t.to.includes(id)).map((t) => [t.id, nm(t), `${t.value}`]));
      const name = (x) => nm(objectives.find((o) => o.id === x));
      jump('May need', links.filter(([, b, k]) => b === id && k !== 'no').map(([a, , k]) => [a, name(a), LINK[k]]));
      jump('May lead to', links.filter(([a, , k]) => a === id && k !== 'no').map(([, b, k]) => [b, name(b), LINK[k]]));
    } else {
      const t = n.kind === 'test' ? n : n.test;
      add(h('p', `badge ${t.verdict}`, VERDICT[t.verdict]), h('h2', 'ph', `${nm(t)}: ${t.value}`), h('p', 'big', t.q));
      part('What happened', h('p', '', t.result));
      jump('Bears on', t.to.map((x) => [x, nm(objectives.find((o) => o.id === x))]));
      const links2 = h('p', 'go');
      if (t.go) { const a = h('a', 'btn small', 'Play with the data'); a.href = `../results/#r-${t.go}`; links2.append(a); }
      const rec = h('a', 'btn small ghost', 'Technical sheet'); rec.href = `../record/#${t.id}`; links2.append(rec);
      add(h('p', 'code', t.code), links2);
    }
    const x = h('button', 'close', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close details'); x.addEventListener('click', close);
    panel.replaceChildren(x, ...out); panel.classList.add('open'); panel.scrollTop = 0;
    if (focus) { const t = panel.querySelector('.ph'); t.tabIndex = -1; t.focus({ preventScroll: true }); }
    history.replaceState(null, '', `#${n.kind === 'result' ? n.of : id}`);
  }
  function close() { const was = sel; sel = null; panel.classList.remove('open'); rest(); light(null); byId[was]?.g.focus({ preventScroll: true }); history.replaceState(null, '', location.pathname); }
  function rest() { panel.replaceChildren(...emptyPanel.map((n) => n.cloneNode(true))); }
  function reveal(id) {
    const y = svg.getBoundingClientRect().top + byId[id].hy;
    if (y < 180 || y > innerHeight - 180) scrollTo({ top: scrollY + y - innerHeight / 2, behavior: smooth() });
  }
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (touring) stopTour(); else if (panel.classList.contains('open')) close(); } });

  // ---- controls
  const press = (attr, value) => document.querySelectorAll(`[data-${attr}]`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === value)));
  function filter(f) { show = f; svg.dataset.show = f; press('filter', f); }
  document.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => filter(b.dataset.filter)));
  function view(v) {
    stopTour(); press('view', v);
    $('map-graph').hidden = $('map-filters').hidden = $('map-legend').hidden = tourBtn.hidden = v === 'list';
    $('map-list').hidden = v !== 'list';
    if (v === 'graph') build();
  }
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => view(b.dataset.view)));

  const q = $('map-q'), names = new Map([...objectives, ...tests].map((x) => [nm(x).toLowerCase(), x.id]));
  for (const x of [...objectives, ...tests]) { const o = document.createElement('option'); o.value = nm(x); $('map-names').append(o); }
  const search = () => {
    const t = q.value.trim().toLowerCase();
    if (!t) { q.setCustomValidity(''); return; }
    const hay = (x) => [nm(x), x.q, x.test, x.record, x.result, x.code].join(' ').toLowerCase();
    const id = names.get(t) ?? [...names].find(([k]) => k.startsWith(t))?.[1] ?? [...objectives, ...tests].find((x) => hay(x).includes(t))?.id;
    q.setCustomValidity(id ? '' : 'Nothing with that name on the map.');
    if (!id) { q.reportValidity(); return; }
    if (!$('map-list').hidden) { const li = $(`list-${id}`); li.tabIndex = -1; li.scrollIntoView({ block: 'center', behavior: smooth() }); li.focus({ preventScroll: true }); return; }
    pick(id, true); reveal(id);
  };
  $('map-find').addEventListener('submit', (e) => { e.preventDefault(); search(); });
  q.addEventListener('input', (e) => { q.setCustomValidity(''); if (names.has(q.value.toLowerCase()) && e.inputType !== 'insertText') search(); });

  function stopTour() { clearTimeout(touring); touring = null; tip.textContent = ''; tip.hidden = true; tourBtn.textContent = 'Show the way up'; tourBtn.setAttribute('aria-pressed', 'false'); light(sel); }
  function tour(i = 0, lit = []) {
    if (i >= wayUp.length) { touring = setTimeout(stopTour, 4200); return; }
    const [id, text] = wayUp[i], now = [...lit, id];
    light(now); tip.hidden = false; tip.textContent = text;
    if (!calm()) { byId[id].vy = -9; wake(); }
    reveal(id);
    touring = setTimeout(() => tour(i + 1, now), 3400);
  }
  tourBtn.addEventListener('click', () => {
    if (touring) return stopTour();
    sel = null; panel.classList.remove('open'); rest();
    if (show === 'tests') filter('all');
    tourBtn.textContent = 'Stop'; tourBtn.setAttribute('aria-pressed', 'true'); tour();
  });

  const open = () => {
    const id = location.hash.slice(1);
    if (id === 'list') view('list');
    else if (byId?.[id]) { pick(id); reveal(id); }
  };
  build(); open();
  addEventListener('hashchange', open);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(wrap);
  onMotion(wake);
  let lastW = W;
  new ResizeObserver(() => { if (wrap.clientWidth && Math.abs(wrap.clientWidth - lastW) > 2) { lastW = wrap.clientWidth; build(); } }).observe(wrap);
}
