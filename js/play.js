// The box (what goes in, what does not), the climb, and the method loop.
import { cell, face, el, watch } from './cell.js';
import { climb as STEPS } from '../data/map.js';
import { BOX_IN, BOX_OUT } from '../data/box.js';
import { calm, onMotion, smooth } from './prefs.js';

export function box() {
  const root = document.getElementById('box'), stage = document.getElementById('box-otto'), say = document.getElementById('box-say');
  const svg = el('svg', { viewBox: '-26 -26 52 52', 'aria-hidden': 'true' });
  const body = svg.appendChild(cell('oh'));
  stage.append(svg);
  watch(svg, 1.8);
  const eaten = new Set();
  let back;
  const mood = (m) => { body.setAttribute('class', `cell cell-${m}`); body.replaceChild(face(m), body.lastChild); };
  const play = (cls) => { if (calm()) return; stage.classList.remove('gulp', 'shake'); void stage.offsetWidth; stage.classList.add(cls); };
  const fly = (b, frames, duration) => {
    if (calm()) return;
    const a = b.getBoundingClientRect(), s = stage.getBoundingClientRect();
    b.animate(frames(s.x + s.width / 2 - a.x - a.width / 2, s.y + s.height / 2 - a.y - a.height / 2), { duration, easing: 'ease-out' });
  };
  root.querySelectorAll('.in .chip').forEach((b, i) => {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      clearTimeout(back);
      const label = BOX_IN[i];
      if (eaten.has(label)) return;
      eaten.add(label); b.setAttribute('aria-pressed', 'true');
      fly(b, (x, y) => [{ transform: 'none' }, { transform: `translate(${x}px,${y}px) scale(.3)`, opacity: .4 }, { transform: 'none' }], 620);
      mood('smile'); play('gulp');
      say.textContent = eaten.size === BOX_IN.length ? 'That is all Otto gets. The rest has to grow.' : `Yum. ${eaten.size} of ${BOX_IN.length}.`;
    });
  });
  root.querySelectorAll('.out .chip').forEach((b) => b.addEventListener('click', () => {
    fly(b, (x, y) => [{ transform: 'none' }, { transform: `translate(${x * .8}px,${y * .8}px) rotate(8deg)`, offset: .45 }, { transform: `translate(${x * -.06}px,${y * -.06}px)`, offset: .8 }, { transform: 'none' }], 760);
    mood('nope'); play('shake'); say.textContent = BOX_OUT[b.textContent];
    clearTimeout(back); back = setTimeout(() => mood(eaten.size === BOX_IN.length ? 'smile' : 'oh'), 2600);
  }));
}

export function climb() {
  const stairs = document.getElementById('stairs'), panel = document.getElementById('climb-panel');
  const svg = el('svg', { viewBox: '-22 -22 44 44', class: 'climber', 'aria-hidden': 'true' });
  svg.append(cell('smile'));
  const btns = [...stairs.querySelectorAll('.stair')];
  stairs.append(svg);
  let cur = 0;
  const place = () => {
    const b = btns[cur];
    svg.style.transform = `translate(${b.offsetLeft + b.offsetWidth / 2 - svg.clientWidth / 2}px, ${b.offsetTop - svg.clientHeight + 3}px)`;
  };
  function pick(i) {
    cur = i;
    btns.forEach((b, j) => { b.setAttribute('aria-pressed', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    svg.replaceChildren(cell(i < 1 ? 'smile' : i < 2 ? 'oh' : 'sleep'));
    const s = STEPS[i];
    panel.replaceChildren(...[['p', 'k', `Question ${i} · ${s.s}`], ['h3', '', s.t], ['p', '', s.d]].map(([t, c, x]) => {
      const n = document.createElement(t); if (c) n.className = c; n.textContent = x; return n;
    }));
    place();
    if (!calm()) { svg.classList.remove('hop'); void svg.getBoundingClientRect(); svg.classList.add('hop'); }
    const wrap = stairs.parentElement, b = btns[i];
    wrap.scrollTo({ left: b.offsetLeft - wrap.clientWidth / 2 + b.offsetWidth / 2, behavior: smooth() });
  }
  btns.forEach((b, i) => { b.tabIndex = i ? -1 : 0; b.addEventListener('click', () => pick(i)); });
  stairs.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const i = Math.max(0, Math.min(STEPS.length - 1, cur + d));
    pick(i); btns[i].focus({ preventScroll: true });
  });
  place();
  new ResizeObserver(place).observe(stairs);
  document.fonts?.ready.then(place);
}

const LOOP = ['Observe', 'Decompose', 'Hypothesise', 'Build small', 'Run', 'Measure', 'Intervene', 'Falsify', 'Reduce', 'Rebuild'];
export function loop() {
  const svg = document.getElementById('loop'), n = LOOP.length, R = 150;
  svg.append(el('circle', { r: R, class: 'track' }));
  LOOP.forEach((w, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2, x = Math.cos(a), y = Math.sin(a);
    svg.append(el('circle', { cx: x * R, cy: y * R, r: 7, class: 'stop' }));
    const t = el('text', { x: x * (R + 22), y: y * (R + 34) + 5, 'text-anchor': Math.abs(x) < .2 ? 'middle' : x > 0 ? 'start' : 'end' });
    t.textContent = w; svg.append(t);
  });
  const walker = svg.appendChild(el('g', { class: 'walker', transform: `translate(0 ${-R})` }, cell('smile')));
  let t = 0, last, shown = false, running = false;
  const frame = (now) => {
    if (!shown || calm()) { running = false; return; }
    t += Math.min(60, now - (last ?? now)) / 14000; last = now;
    const a = t * 2 * Math.PI - Math.PI / 2, hop = Math.abs(Math.sin(t * n * Math.PI)) * 8;
    walker.setAttribute('transform', `translate(${Math.cos(a) * (R + hop)} ${Math.sin(a) * (R + hop)})`);
    requestAnimationFrame(frame);
  };
  const go = () => { if (!running && shown && !calm()) { running = true; last = undefined; requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { shown = e.isIntersecting; go(); }).observe(svg);
  onMotion(go);
}
