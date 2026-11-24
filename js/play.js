// The box (what goes in, what does not), the climb, and the method loop.
import { cell, face, el, watch } from './cell.js';
import { climb as STEPS } from '../data/map.js';

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const IN = ['state', 'time', 'interactions', 'flows', 'limited resources', 'perturbations', 'allowed changes'];
const OUT = {
  'speak()': 'If we put words in, hearing words proves nothing.',
  'understand()': 'Understanding has to appear. We only test for it.',
  'remember()': 'A memory we install is our memory.',
  'learn()': 'Learning must show up as a change that lasts and transfers.',
  'plan()': 'A planner would do the thinking for it.',
  'a reward': 'A score pulls it where we want. Then we only measure our own wish.',
  'a hidden answer': 'The world must not already know the solution.',
};

export function box() {
  const root = document.getElementById('box'), stage = document.getElementById('box-otto'), say = document.getElementById('box-say');
  const svg = el('svg', { viewBox: '-26 -26 52 52', 'aria-hidden': 'true' });
  const body = svg.appendChild(cell('oh'));
  stage.append(svg);
  watch(svg, 1.8);
  const eaten = new Set();
  let back;
  const mood = (m) => { body.setAttribute('class', `cell cell-${m}`); body.replaceChild(face(m), body.lastChild); };
  const play = (cls) => { if (calm) return; stage.classList.remove('gulp', 'shake'); void stage.offsetWidth; stage.classList.add(cls); };

  const chip = (label, kind, on) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `chip chip-${kind}`; b.textContent = label;
    b.addEventListener('click', () => on(b));
    return b;
  };
  const fly = (b) => {
    const a = b.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return [s.x + s.width / 2 - a.x - a.width / 2, s.y + s.height / 2 - a.y - a.height / 2];
  };
  for (const label of IN) root.querySelector('.in').append(chip(label, 'in', (b) => {
    clearTimeout(back);
    if (eaten.has(label)) return;
    eaten.add(label); b.setAttribute('aria-pressed', 'true');
    const [x, y] = fly(b);
    if (!calm) b.animate([{ transform: 'none' }, { transform: `translate(${x}px,${y}px) scale(.3)`, opacity: .4 }, { transform: 'none' }], { duration: 620, easing: 'cubic-bezier(.3,.7,.3,1)' });
    mood('smile'); play('gulp');
    say.textContent = eaten.size === IN.length ? 'That is all Otto gets. The rest has to grow.' : `Yum. ${eaten.size} of ${IN.length}.`;
  }));
  for (const [label, why] of Object.entries(OUT)) root.querySelector('.out').append(chip(label, 'out', (b) => {
    const [x, y] = fly(b);
    if (!calm) b.animate([{ transform: 'none' }, { transform: `translate(${x * .8}px,${y * .8}px) rotate(8deg)`, offset: .45 }, { transform: `translate(${x * -.06}px,${y * -.06}px)`, offset: .8 }, { transform: 'none' }], { duration: 760, easing: 'ease-out' });
    mood('nope'); play('shake'); say.textContent = why;
    clearTimeout(back); back = setTimeout(() => mood(eaten.size === IN.length ? 'smile' : 'oh'), 2600);
  }));
}

export function climb() {
  const stairs = document.getElementById('stairs'), panel = document.getElementById('climb-panel');
  const svg = el('svg', { viewBox: '-22 -22 44 44', class: 'climber', 'aria-hidden': 'true' });
  svg.append(cell('smile'));
  const btns = STEPS.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `stair ${i === 0 ? 'done' : i === 1 ? 'begun' : ''}`;
    b.style.setProperty('--i', i);
    const n = document.createElement('span'); n.className = 'n'; n.textContent = i;
    const l = document.createElement('span'); l.className = 'l'; l.textContent = s.k;
    b.append(n, l);
    b.addEventListener('click', () => pick(i));
    stairs.append(b);
    return b;
  });
  stairs.append(svg);
  let cur = 0;
  const place = () => {
    const b = btns[cur];
    svg.style.transform = `translate(${b.offsetLeft + b.offsetWidth / 2 - svg.clientWidth / 2}px, ${b.offsetTop - svg.clientHeight + 3}px)`;
  };
  function pick(i, quiet) {
    cur = i;
    btns.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
    svg.replaceChildren(cell(i < 1 ? 'smile' : i < 2 ? 'oh' : 'sleep'));
    const s = STEPS[i];
    panel.replaceChildren(...[['p', 'k', `Question ${i} · ${s.s}`], ['h3', '', s.t], ['p', '', s.d]].map(([t, c, x]) => {
      const n = document.createElement(t); if (c) n.className = c; n.textContent = x; return n;
    }));
    place();
    if (!quiet && !calm) { svg.classList.remove('hop'); void svg.getBoundingClientRect(); svg.classList.add('hop'); }
    if (!quiet) btns[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: calm ? 'auto' : 'smooth' });
  }
  stairs.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const i = Math.max(0, Math.min(STEPS.length - 1, cur + d));
    btns[i].focus(); pick(i);
  });
  pick(0, true);
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
  const walker = svg.appendChild(el('g', { class: 'walker' }, cell('smile')));
  let t = 0, last, on = false;
  const frame = (now) => {
    if (!on) return;
    t += Math.min(60, now - (last ?? now)) / 14000; last = now;
    const a = t * 2 * Math.PI - Math.PI / 2, hop = Math.abs(Math.sin(t * n * Math.PI)) * 8;
    walker.setAttribute('transform', `translate(${Math.cos(a) * (R + hop)} ${Math.sin(a) * (R + hop)})`);
    requestAnimationFrame(frame);
  };
  walker.setAttribute('transform', `translate(0 ${-R})`);
  if (!calm) new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; last = undefined; if (on && !was) requestAnimationFrame(frame); }).observe(svg);
}
