import { calm } from './prefs.js';

// One cell, drawn with the proportions of the logo (ring r 18, stroke 3.6).
const NS = 'http://www.w3.org/2000/svg';
export const el = (tag, attrs = {}, kids = []) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  for (const c of [].concat(kids)) n.append(c);
  return n;
};

const arc = (d) => el('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' });
const dot = (x) => el('circle', { cx: x, cy: -2, r: 1.95, fill: 'currentColor' });

export function face(mood) {
  const eyes = el('g', { class: 'eyes' });
  const g = el('g', { class: `face face-${mood}` }, eyes);
  if (mood === 'smile') { eyes.append(dot(-4.2), dot(4.2)); g.append(arc('M-3.6 4.2Q0 8 3.6 4.2')); }
  else if (mood === 'oh') { eyes.append(dot(-4.2), dot(4.2)); g.append(el('circle', { cx: 0, cy: 5.6, r: 1.9, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5 })); }
  else if (mood === 'nope') { eyes.append(arc('M-6.4 -4.4L-3.2 -2.2L-6.4 0'), arc('M6.4 -4.4L3.2 -2.2L6.4 0')); g.append(arc('M-3 5.6Q-1.5 4 0 5.6T3 5.6')); }
  else { eyes.append(arc('M-6.4 -2Q-4.4 .4 -2.4 -2'), arc('M2.4 -2Q4.4 .4 6.4 -2')); g.append(arc('M-1.6 5Q0 6 1.6 5')); }
  return g;
}

export function cell(mood) {
  return el('g', { class: `cell cell-${mood}` }, [
    el('circle', { r: 18, class: 'skin' }), face(mood),
  ]);
}

// Eyes inside `root` look toward the pointer.
export function watch(root, max = 1.5) {
  let queued = false, px = 0, py = 0;
  addEventListener('pointermove', (e) => {
    if (calm()) return;
    px = e.clientX; py = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const box = root.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      for (const e2 of root.querySelectorAll('.face-smile .eyes, .face-oh .eyes')) {
        const b = e2.getBoundingClientRect();
        const dx = px - b.x - b.width / 2, dy = py - b.y - b.height / 2, d = Math.hypot(dx, dy) || 1;
        const k = max * Math.min(1, d / 120);
        e2.setAttribute('transform', `translate(${(dx / d * k).toFixed(2)} ${(dy / d * k).toFixed(2)})`);
      }
    });
  }, { passive: true });
}
