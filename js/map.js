// The map: objectives (cells), tests (dishes) and results (drops), on springs.
import { el, cell } from './cell.js';
import { objectives, links, tests, wayUp } from '../data/map.js';

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const VERDICT = { holds: 'Holds, within its domain', toy: 'Toy model only', rejected: 'Rejected', waiting: 'Not run' };
const STATE = { measured: 'Measured, within a bounded domain', now: 'We are working here', asleep: 'Asleep, no evidence yet' };
const LINK = { solid: 'supported', maybe: 'plausible', unsure: 'contested or unknown', def: 'part of the definition', no: 'refuted' };
const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

export function map() {
  const wrap = document.getElementById('map'), panel = document.getElementById('map-panel'), tip = document.getElementById('map-tip');
  const svg = wrap.appendChild(el('svg', { role: 'group', 'aria-label': 'Map of objectives, tests and results' }));
  let nodes, edges, byId, W, r, H, sel = null, show = 'all', touring = null, visible = false, drag = null;

  function build() {
    W = wrap.clientWidth;
    const small = W < 640;
    r = small ? 20 : 27;
    const rowH = small ? 106 : 118, top = small ? 74 : 92, padX = small ? 30 : 64;
    const X = (x) => padX + x * (W - 2 * padX), Y = (t) => top + (8 - t) * rowH;
    const ground = Y(0) + (small ? 62 : 72);
    H = ground + (small ? 300 : 210);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.replaceChildren();

    const soil = el('path', { class: 'soil', d: `M0 ${ground}${Array.from({ length: 6 }, (_, i) => `q${W / 12} ${i % 2 ? 12 : -12} ${W / 6} 0`).join('')}V${H}H0Z` });
    svg.append(soil);
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
    edges = links.map(([a, b, kind, both]) => ({ a: byId[a], b: byId[b], kind, both }));
    for (const t of tests) {
      for (const o of t.to) edges.push({ a: byId[t.id], b: byId[o], kind: `root ${t.verdict}` });
      edges.push({ a: byId[`${t.id}r`], b: byId[t.id], kind: `root ${t.verdict}` });
    }
    const gE = svg.appendChild(el('g', { class: 'edges' })), gN = svg.appendChild(el('g', { class: 'nodes' }));
    for (const e of edges) {
      e.path = gE.appendChild(el('path', { class: `edge ${e.kind}` }));
      if (e.kind === 'no') e.cross = gE.appendChild(el('path', { class: 'edge-x', d: 'M-6 -6L6 6M6 -6L-6 6' }));
    }
    nodes.forEach((n, i) => {
      Object.assign(n, { x: n.hx, y: n.hy, vx: 0, vy: 0, ph: i * 1.7 });
      const g = n.g = gN.appendChild(el('g', { class: `node ${n.kind} ${n.state || n.verdict || ''}`, tabindex: 0, role: 'button' }));
      g.setAttribute('aria-label', n.kind === 'objective' ? `Objective: ${n.name.join(' ')}. ${STATE[n.state]}.`
        : n.kind === 'test' ? `Test: ${n.name.join(' ')}.` : `Result: ${n.value}. ${VERDICT[n.verdict]}.`);
      const b = n.body = g.appendChild(el('g', { class: 'body' }));
      if (n.kind === 'objective') {
        const mood = n.state === 'measured' ? 'smile' : n.state === 'now' ? 'oh' : 'sleep';
        const c = b.appendChild(cell(mood)); c.setAttribute('transform', `scale(${n.r / 19.8})`);
        if (n.state === 'asleep' && !small) { const z = el('text', { class: 'zz', x: n.r * .8, y: -n.r * .7 }); z.textContent = 'z'; b.append(z); }
        n.name.forEach((l, j) => {
          const t = el('text', { class: 'name', y: n.goal ? -n.r - 10 - (n.name.length - 1 - j) * (small ? 15 : 19) : n.r + (small ? 15 : 18) + j * (small ? 13 : 16), 'text-anchor': 'middle' });
          t.textContent = l; b.append(t);
        });
      } else if (n.kind === 'test') {
        b.append(el('path', { class: 'dish', d: `M${-n.r} ${-n.r * .7}H${n.r}V${n.r * .15}A${n.r} ${n.r * .75} 0 0 1 ${-n.r} ${n.r * .15}Z` }),
          el('path', { class: 'rim', d: `M${-n.r - 4} ${-n.r * .7}H${n.r + 4}` }),
          el('circle', { class: 'bub', cx: -4, cy: 1, r: 2.4 }), el('circle', { class: 'bub', cx: 4, cy: -3, r: 1.7 }));
        n.name.forEach((l, j) => { const t = el('text', { class: 'tname', y: n.r + 13 + j * 13, 'text-anchor': 'middle' }); t.textContent = l; b.append(t); });
      } else {
        b.append(el('path', { class: 'drop', d: 'M0 -13C5 -6 9 -2 9 4A9 9 0 0 1 -9 4C-9 -2 -5 -6 0 -13Z' }));
        b.append(el('path', { class: 'mark', d: n.verdict === 'holds' ? 'M-4 3L-1 6L4.5 -.5' : n.verdict === 'rejected' ? 'M-3.4 .2L3.4 7M3.4 .2L-3.4 7' : n.verdict === 'toy' ? 'M-3.6 4Q-1.8 2 0 4T3.6 4' : 'M0 1V5M0 7.6V7.7' }));
        const t = el('text', { class: 'value', y: 30, 'text-anchor': 'middle' }); t.textContent = n.value; b.append(t);
      }
      g.prepend(el('circle', { r: Math.max(n.r + 4, 22), fill: 'transparent' }));
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
      g.addEventListener('pointerup', drop); g.addEventListener('pointercancel', () => { drop(); drag = null; });
      g.addEventListener('click', () => { const m = drag?.done; drag = null; if (!m) { stopTour(); pick(n.id); } });
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopTour(); pick(n.id); } });
      g.addEventListener('pointerenter', () => { if (!touring && !drag) light(n.id); });
      g.addEventListener('pointerleave', () => { if (!touring && !drag) light(sel); });
    });
    draw(0); filter(show); light(sel);
  }

  function edgePath(e) {
    const { a, b } = e, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    if (e.kind === 'no') {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      e.cross?.setAttribute('transform', `translate(${mx} ${my})`);
      return `M${a.x} ${a.y - a.r}L${b.x} ${b.y + b.r}`;
    }
    if (Math.abs(dy) < 60 || dy > 0) {
      const s = { x: a.x + dx / L * a.r, y: a.y + dy / L * a.r }, t = { x: b.x - dx / L * b.r, y: b.y - dy / L * b.r };
      return `M${s.x} ${s.y}Q${(s.x + t.x) / 2 + dy * .12} ${(s.y + t.y) / 2 - 16} ${t.x} ${t.y}`;
    }
    if (a.id === 'SCA') {
      const side = Math.min(W - 8, Math.max(a.x, b.x) + 30);
      return `M${a.x} ${a.y - a.r}C${side} ${a.y - 160} ${side} ${b.y + 260} ${b.x + b.r * .8} ${b.y + b.r * .6}`;
    }
    const k = Math.max(26, -dy * .45);
    return `M${a.x} ${a.y - a.r}C${a.x} ${a.y - k} ${b.x} ${b.y + k} ${b.x} ${b.y + b.r}`;
  }

  function draw(now) {
    for (const n of nodes) {
      const fl = calm || n.kind !== 'objective' ? 0 : Math.sin(now / 1100 + n.ph) * (n.state === 'asleep' ? 1.2 : 2.6);
      n.body.setAttribute('transform', `translate(${n.x.toFixed(1)} ${(n.y + fl).toFixed(1)})`);
      n.g.firstChild.setAttribute('cx', n.x); n.g.firstChild.setAttribute('cy', n.y);
    }
    for (const e of edges) e.path.setAttribute('d', edgePath(e));
  }

  let raf = 0;
  function wake() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    let moving = false;
    for (const e of edges) { // neighbours follow a little
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
    if (visible && (moving || !calm)) wake();
  }

  // everything that leads to a node, and everything it may lead to
  function kin(id) {
    const keep = new Set([id]), go = (from, dir) => {
      for (const e of edges) {
        if (e.kind === 'no') continue;
        const [p, q] = dir ? [e.b.id, e.a.id] : [e.a.id, e.b.id];
        if (p === from && !keep.has(q)) { keep.add(q); go(q, dir); }
      }
    };
    go(id, true);
    const down = new Set(keep); keep.clear(); keep.add(id); go(id, false);
    return new Set([...down, ...keep]);
  }
  function light(id) {
    const keep = Array.isArray(id) ? new Set(id) : id ? kin(id) : null;
    svg.classList.toggle('lit', !!keep);
    for (const n of nodes) { n.g.classList.toggle('on', !!keep?.has(n.id)); n.g.classList.toggle('sel', n.id === sel); }
    for (const e of edges) {
      const on = !!keep && keep.has(e.a.id) && keep.has(e.b.id);
      e.path.classList.toggle('on', on);
      e.cross?.classList.toggle('on', on || id === 'PER' || id === 'ACI');
      if (e.kind === 'no') e.path.classList.toggle('on', id === 'PER' || id === 'ACI');
    }
  }

  function pick(id) {
    sel = id; light(id);
    const n = byId[id], out = [];
    const list = (title, items) => { const d = h('div', 'fool'); d.append(h('h4', '', title)); const u = h('ul'); items.forEach((x) => u.append(h('li', '', x))); d.append(u); out.push(d); };
    const part = (title, text) => { out.push(h('h4', '', title), h('p', '', text)); };
    if (n.kind === 'objective') {
      out.push(h('p', `badge ${n.state}`, STATE[n.state]), h('h3', '', n.name.join(' ')), h('p', 'big', n.q));
      part('How we would test it', n.test);
      list('What could fool us', n.fool);
      part('On record', n.record);
      const ts = tests.filter((t) => t.to.includes(id));
      if (ts.length) { const d = h('div', 'jump'); ts.forEach((t) => { const b = h('button', 'chip chip-in', t.name.join(' ')); b.type = 'button'; b.addEventListener('click', () => pick(t.id)); d.append(b); }); out.push(h('h4', '', 'Tests'), d); }
    } else {
      const t = n.kind === 'test' ? n : n.test;
      out.push(h('p', `badge ${t.verdict}`, VERDICT[t.verdict]), h('h3', '', `${t.name.join(' ')}: ${t.value}`), h('p', 'big', t.q));
      part('What happened', t.result);
      out.push(h('p', 'code', t.code));
      if (t.go) { const a = h('a', 'btn small', 'Play with the data'); a.href = `#r-${t.go}`; out.push(a); }
    }
    const x = h('button', 'close', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', close);
    panel.replaceChildren(x, ...out); panel.classList.add('open'); panel.scrollTop = 0;
  }
  function close() { const was = sel; sel = null; panel.classList.remove('open'); rest(); light(null); byId[was]?.g.focus({ preventScroll: true }); }
  function rest() {
    panel.replaceChildren(h('h3', '', 'Pick anything'), h('p', '', 'Each cell is an objective. Dishes are tests. Drops are results. Pull a cell and let go: it knows its place.'),
      h('p', '', 'A dashed path is a bet. It says one thing may help another, and no test has settled it.'));
  }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });

  function filter(f) {
    show = f; svg.dataset.show = f;
    document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
  }
  document.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => filter(b.dataset.filter)));

  const tourBtn = document.getElementById('map-tour');
  function stopTour() { clearTimeout(touring); touring = null; tip.textContent = ''; tip.hidden = true; tourBtn.textContent = 'Show the way up'; tourBtn.setAttribute('aria-pressed', 'false'); light(sel); }
  function tour(i = 0, lit = []) {
    if (i >= wayUp.length) { touring = setTimeout(stopTour, 4200); return; }
    const [id, text] = wayUp[i]; lit = [...lit, id];
    light(lit); tip.hidden = false; tip.textContent = text;
    const n = byId[id]; n.vy = -9; wake();
    const y = svg.getBoundingClientRect().top + n.hy;
    if (y < 180 || y > innerHeight - 180) scrollTo({ top: scrollY + y - innerHeight / 2, behavior: calm ? 'auto' : 'smooth' });
    touring = setTimeout(() => tour(i + 1, lit), 2500);
  }
  tourBtn.addEventListener('click', () => {
    if (touring) return stopTour();
    sel = null; panel.classList.remove('open'); rest();
    if (show === 'tests') filter('all');
    tourBtn.textContent = 'Stop'; tourBtn.setAttribute('aria-pressed', 'true'); tour();
  });

  // the same content as a list
  const list = document.getElementById('map-list');
  for (const o of objectives) {
    const li = h('li'); li.append(h('strong', '', o.name.join(' ')), document.createTextNode(` (${STATE[o.state].toLowerCase()}). ${o.q} `));
    const ups = links.filter(([a]) => a === o.id).map(([, b, k]) => `${objectives.find((x) => x.id === b).name.join(' ')} (${LINK[k]})`);
    if (ups.length) li.append(h('em', '', `May lead to: ${ups.join(', ')}.`));
    list.append(li);
  }
  for (const t of tests) { const li = h('li'); li.append(h('strong', '', `Test, ${t.name.join(' ')}`), document.createTextNode(`: ${t.q} ${t.result}`)); list.append(li); }

  rest(); build();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(wrap);
  let lastW = W;
  new ResizeObserver(() => { if (Math.abs(wrap.clientWidth - lastW) > 2) { lastW = wrap.clientWidth; build(); } }).observe(wrap);
}
