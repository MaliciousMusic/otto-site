// The film: animated diagrams in SVG, captions, and a narration.
// Narration: recorded MP3 files when they match the current text (tools/film_voice.mjs),
// otherwise the browser's own voice (speechSynthesis), otherwise captions alone. No network.
// No emoji: the Otto cells carry the feelings, every prop is drawn here.
import { scenes, parts } from '../data/film.js';
import AUDIO from '../data/film-audio.js';
import R from '../data/results.js';
import { objectives } from '../data/map.js';
import { el } from './cell.js';
import { seeded, step } from './world.js';
import { calm, onMotion } from './prefs.js';

const W = 1280, H = 720, LANGS = ['fr', 'en'];
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => { x = clamp(x); return x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2; };
const pop = (x) => { x = clamp(x); return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2; };
const put = (n, x, y, s = 1, r = 0) => n.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${Math.max(0, s).toFixed(3)})${r ? ` rotate(${r.toFixed(1)})` : ''}`);
const show = (n, o) => n.setAttribute('opacity', clamp(o).toFixed(3));
const text = (x, y, s, cls = '', anchor = 'middle') => { const t = el('text', { x, y, class: cls, 'text-anchor': anchor }); t.textContent = s; return t; };
const box = (x, y, w, h, cls, r = 26) => el('rect', { x, y, width: w, height: h, rx: r, class: cls });
const path = (d, cls = 'ink') => el('path', { d, class: cls });
const grp = (parent, ...kids) => { const g = el('g'); g.append(...kids); parent.append(g); return g; };
const word = (L, fr, en) => (L ? en : fr);
// on-stage reveal: visible from line a, popping in over the first part of that line
const at = (k, u, a, d = 0) => (k > a ? 1 : k === a ? pop(u * 1.6 - d) : 0);
const fade = (k, u, a, d = 0) => (k > a ? 1 : k === a ? clamp(u * 2 - d) : 0);

// ---- faces. The four of the site, plus a few more for the film, same strokes.
const stroke = (d) => el('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const eye = (x, y = -2, r = 1.95) => el('circle', { cx: x, cy: y, r, fill: 'currentColor' });
const MOODS = {
  smile: { c: 'g', eyes: () => [eye(-4.2), eye(4.2)], mouth: 'M-3.6 4.2Q0 8 3.6 4.2' },
  oh: { c: 'b', eyes: () => [eye(-4.2), eye(4.2)], mouth: 'M0 3.7A1.9 1.9 0 1 0 0.01 3.7' },
  nope: { c: 'b', eyes: () => [stroke('M-6.4 -4.4L-3.2 -2.2L-6.4 0'), stroke('M6.4 -4.4L3.2 -2.2L6.4 0')], mouth: 'M-3 5.6Q-1.5 4 0 5.6T3 5.6' },
  sleep: { c: 's', eyes: () => [stroke('M-6.4 -2Q-4.4 .4 -2.4 -2'), stroke('M2.4 -2Q4.4 .4 6.4 -2')], mouth: 'M-1.6 5Q0 6 1.6 5' },
  proud: { c: 'g', eyes: () => [stroke('M-6.4 -1.2Q-4.4 -4.4 -2.4 -1.2'), stroke('M2.4 -1.2Q4.4 -4.4 6.4 -1.2')], mouth: 'M-4 3.6Q0 9 4 3.6Z' },
  wow: { c: 'g', eyes: () => [eye(-4.4, -2.4, 2.6), eye(4.4, -2.4, 2.6)], mouth: 'M-2.4 5.2Q0 2.4 2.4 5.2Q0 8.6 -2.4 5.2Z' },
  think: { c: 'b', eyes: () => [eye(-3, -4), eye(5.4, -4)], mouth: 'M-2.6 5.4L3 4.2' },
  sad: { c: 'b', eyes: () => [eye(-4.2), eye(4.2)], mouth: 'M-3.4 6.6Q0 3.2 3.4 6.6' },
  wink: { c: 'g', eyes: () => [stroke('M-6.2 -2L-2.6 -2'), eye(4.2)], mouth: 'M-3.6 4.2Q0 8 3.6 4.2' },
  worry: { c: 'b', eyes: () => [eye(-4.2, -1.6), eye(4.2, -1.6), stroke('M-6.6 -6L-2.6 -4.6'), stroke('M6.6 -6L2.6 -4.6')], mouth: 'M-3.4 5.6Q-1.7 4.2 0 5.6T3.4 5.6' },
};
function faceOf(m) {
  const f = MOODS[m] || MOODS.smile, g = el('g', { class: 'face' }), eyes = el('g', { class: 'eyes' });
  eyes.append(...f.eyes()); g.append(eyes);
  const mouth = stroke(f.mouth); if (/Z$/.test(f.mouth)) mouth.setAttribute('fill', 'currentColor'); g.append(mouth);
  return g;
}
// A character: a site cell with a face, radius r. set() changes mood, blink() closes the eyes now and then.
function buddy(mood = 'smile', r = 40, cls = '') {
  const g = el('g', { class: `buddy ${cls}` }), c = el('g'), skin = el('circle', { r: 18, class: 'skin' });
  c.setAttribute('transform', `scale(${(r / 20).toFixed(3)})`); c.append(skin); g.append(c);
  g.set = (m) => { if (m === g.mood) return; g.mood = m; c.setAttribute('class', `cell c-${(MOODS[m] || MOODS.smile).c}`); c.replaceChildren(skin, faceOf(m)); };
  g.blink = (t, seed = 0) => { const e = c.querySelector('.eyes'); if (!e) return; const p = (t + seed * 1.7) % 3.6; e.setAttribute('transform', p < .13 ? 'scale(1 .12)' : ''); };
  g.set(mood);
  return g;
}
// The narrator: one Otto in the corner, its mood follows the line.
function narrator(g, moods, x = 1180, y = 628) {
  const o = buddy(moods[0], 52); g.append(o);
  return (k, u, t) => { o.set(moods[Math.min(k, moods.length - 1)]); put(o, x, y + Math.sin(t * 2.4) * 5, 1, Math.sin(t * 1.3) * 3); o.blink(t); };
}
// A labelled card: a title and a sub line, optionally a prop drawn above.
function card(g, w, h, title, sub, prop) {
  const n = grp(g, box(-w / 2, -h / 2, w, h, 'card'));
  if (prop) { prop.setAttribute('transform', `translate(0 ${-h / 2 + 70})`); n.append(prop); }
  n.append(text(0, prop ? h / 2 - 66 : -6, title, 'mid'));
  if (sub) n.append(text(0, prop ? h / 2 - 26 : 34, sub, 'small'));
  return n;
}
const pill = (g, s, c = 'r', w = 360) => grp(g, box(-w / 2, -30, w, 60, `pill ${c}`, 30), text(0, 10, s, 'pill-t'));

// ---- drawn props, centred on 0 0, about 100 px tall
const PROP = {
  lock: () => { const g = el('g'); g.append(path('M-26 -8V-30A26 26 0 0 1 26 -30V-8', 'line-k'), box(-38, -10, 76, 62, 'fill-g', 12), el('circle', { cx: 0, cy: 16, r: 7, class: 'fill-k' }), path('M0 18V34', 'line-w')); return g; },
  dice: () => { const g = el('g'); g.append(box(-40, -40, 80, 80, 'fill-w', 16)); for (const [x, y] of [[-20, -20], [20, -20], [0, 0], [-20, 20], [20, 20]]) g.append(el('circle', { cx: x, cy: y, r: 7, class: 'fill-k' })); return g; },
  crystal: () => { const g = el('g'); g.append(path('M0 -48L36 -18L36 22L0 50L-36 22L-36 -18Z', 'fill-b'), path('M0 -48L0 50M-36 -18L36 22M36 -18L-36 22', 'line-w')); return g; },
  flame: () => { const g = el('g'); g.append(path('M0 -52C24 -20 34 0 30 20C26 42 -26 42 -30 20C-34 0 -12 -10 0 -52Z', 'fill-o'), path('M0 -10C10 6 14 14 12 24C10 34 -10 34 -12 24C-14 14 -6 6 0 -10Z', 'fill-y')); return g; },
  loop: () => { const g = el('g'); g.append(path('M-34 0A34 34 0 1 1 0 34', 'line-k'), path('M-10 26L0 34L-8 46', 'line-k')); return g; },
  target: () => { const g = el('g'); for (const [r, c] of [[48, 'fill-w'], [34, 'fill-b'], [20, 'fill-w'], [8, 'fill-o']]) g.append(el('circle', { r, class: c })); return g; },
  arrow: () => { const g = el('g'); g.append(path('M-70 0H0', 'line-k'), path('M-12 -9L2 0L-12 9', 'line-k'), path('M-70 0L-80 -10M-70 0L-80 10', 'line-k')); return g; },
  ball: (n) => { const g = el('g'); g.append(el('circle', { r: 30, class: 'fill-w' }), text(0, 12, n, 'mid')); return g; },
  chess: () => { const g = el('g'); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.append(el('rect', { x: -40 + i * 20, y: -40 + j * 20, width: 20, height: 20, class: (i + j) % 2 ? 'fill-k' : 'fill-w' })); return g; },
  leaflet: () => { const g = el('g'); g.append(box(-34, -46, 68, 92, 'fill-w', 8)); for (let i = 0; i < 5; i++) g.append(path(`M-22 ${-28 + i * 14}H${i === 4 ? 6 : 22}`, 'line-s')); return g; },
  thermo: () => { const g = el('g'); g.append(box(-10, -50, 20, 80, 'fill-w', 10), el('circle', { cy: 36, r: 16, class: 'fill-o' }), box(-4, -20, 8, 50, 'fill-o', 4)); return g; },
  glasses: () => { const g = el('g'); g.append(el('circle', { cx: -34, r: 26, class: 'line-k' }), el('circle', { cx: 34, r: 26, class: 'line-k' }), path('M-8 -4Q0 -12 8 -4', 'line-k')); return g; },
  books: () => { const g = el('g'); [['fill-g', -60], ['fill-b', -34], ['fill-o', -8], ['fill-y', 18], ['fill-b', 44]].forEach(([c, x], i) => g.append(box(x, -50 + (i % 2) * 8, 22, 100 - (i % 2) * 8, c, 4))); return g; },
  seed: () => { const g = el('g'); g.append(el('ellipse', { rx: 14, ry: 9, cy: 40, class: 'fill-o' }), path('M0 32C0 10 0 -10 0 -30', 'line-g'), path('M0 -6C-20 -16 -30 -10 -34 -2C-20 4 -8 0 0 -6Z', 'fill-g'), path('M0 -22C18 -34 30 -28 34 -18C20 -12 8 -14 0 -22Z', 'fill-g')); return g; },
  mountain: () => { const g = el('g'); g.append(path('M-110 50L-30 -40L0 -10L40 -60L120 50Z', 'fill-s'), path('M40 -60V-96', 'line-k'), path('M40 -96L66 -88L40 -80Z', 'fill-o')); return g; },
  pot: () => { const g = el('g'); g.append(path('M-44 -10H44L36 40H-36Z', 'fill-k'), path('M-54 -10H54', 'line-k'), path('M-14 -24Q-10 -36 -14 -46M6 -24Q10 -36 6 -46', 'line-s')); return g; },
  compost: () => { const g = el('g'); g.append(path('M-50 40L-40 -20H40L50 40Z', 'fill-o'), path('M-30 -20Q-20 -40 0 -30Q20 -44 30 -20', 'fill-g')); return g; },
  fountain: () => { const g = el('g'); g.append(path('M-50 40H50L40 10H-40Z', 'fill-b'), path('M0 10V-30', 'line-k'), path('M0 -30C-20 -44 -36 -20 -40 8M0 -30C20 -44 36 -20 40 8', 'line-b')); return g; },
  statue: () => { const g = el('g'); g.append(box(-36, 20, 72, 20, 'fill-s', 4), el('circle', { cy: -30, r: 16, class: 'fill-s' }), path('M-20 20L-14 -12H14L20 20Z', 'fill-s')); return g; },
  mattress: () => { const g = el('g'); g.append(box(-120, 0, 200, 40, 'fill-b', 18), box(80, -60, 40, 100, 'fill-s', 4)); return g; },
  map: () => { const g = el('g'); g.append(path('M-60 -40L-20 -50L20 -40L60 -50V40L20 50L-20 40L-60 50Z', 'fill-w'), path('M-40 20Q-20 -10 0 10T40 -20', 'line-d')); return g; },
  bridge: () => { const g = el('g'); g.append(path('M-100 -20H100', 'line-k')); for (const x of [-70, 0, 70]) g.append(box(x - 10, -20, 20, 60, 'fill-s', 4)); return g; },
  ladder: (gap) => { const g = el('g'); g.append(path('M-30 -80V80M30 -80V80', 'line-k')); for (let i = 0; i < 7; i++) if (i !== gap) g.append(path(`M-30 ${-66 + i * 22}H30`, 'line-k')); return g; },
  parrot: () => { const g = el('g'); g.append(el('ellipse', { rx: 26, ry: 34, class: 'fill-g' }), el('circle', { cy: -40, r: 20, class: 'fill-g' }), path('M14 -44L32 -36L14 -30Z', 'fill-o'), el('circle', { cx: 4, cy: -46, r: 4, class: 'fill-k' }), path('M-20 30L-34 60M0 34L-8 62', 'line-g')); return g; },
  key: () => { const g = el('g'); g.append(el('circle', { cx: -30, r: 18, class: 'line-k' }), path('M-12 0H40M26 0V14M38 0V12', 'line-k')); return g; },
  wave: () => { const g = el('g'); for (let i = 0; i < 9; i++) g.append(el('circle', { cx: -96 + i * 24, cy: 0, r: 9, class: 'fill-b' })); return g; },
  flag: () => { const g = el('g'); g.append(path('M0 40V-40', 'line-k'), path('M0 -40L36 -30L0 -20Z', 'fill-o')); return g; },
};
const prop = (name, ...a) => { const p = PROP[name](...a); p.setAttribute('class', 'prop'); return p; };

// ---- scenes. Each builder fills g and returns tick(k, u, t): line k, u seconds into the line, t into the scene.
const BUILD = {
  hook(g, L) {
    const otto = g.appendChild(buddy('sleep', 120)), q = g.appendChild(text(640, 140, word(L, 'Un esprit peut-il pousser', 'Can a mind grow'), 'big')), q2 = g.appendChild(text(640, 210, word(L, 'à partir de presque rien ?', 'from almost nothing?'), 'big'));
    const seed = grp(g, prop('seed')), crew = Array.from({ length: 6 }, (_, i) => g.appendChild(buddy(['smile', 'oh', 'wow', 'proud', 'think', 'smile'][i], 24)));
    return (k, u, t) => {
      otto.set(k === 0 ? (u < 1.2 ? 'sleep' : 'smile') : k === 1 ? 'think' : 'wow'); otto.blink(t);
      put(otto, k === 2 ? 470 : 640, 450 + Math.sin(t * 2) * 6, (k ? .8 : 1) * pop(u * 1.4 + (k > 0)));
      show(q, fade(k, u, 1)); show(q2, fade(k, u, 1, .6));
      put(seed, 800, 470, at(k, u, 2) * 1.6);
      crew.forEach((c, i) => { const a = i / 6 * Math.PI * 2 + t * .4, on = k === 2 ? ease(u * .8 - .6 - i * .1) : 0; put(c, 800 + Math.cos(a) * 170 * on, 470 + Math.sin(a) * 120 * on, on); c.blink(t, i); });
    };
  },
  pitch(g, L) {
    const lib = grp(g, prop('books')), lib2 = grp(g, prop('books')), parrot = grp(g, prop('parrot'));
    const q = g.appendChild(text(330, 610, '?', 'huge'));
    const stairs = Array.from({ length: 5 }, (_, i) => g.appendChild(box(760 + i * 80, 560 - i * 60, 80, 60 + i * 60, 'step', 4)));
    const otto = g.appendChild(buddy('smile', 30)), tag1 = g.appendChild(text(330, 140, word(L, 'apprendre en lisant tout', 'learn by reading everything'), 'mid')), tag2 = g.appendChild(text(960, 140, word(L, 'partir du tout petit', 'start from the very small'), 'mid'));
    const nar = narrator(g, ['think', 'oh', 'smile', 'proud']);
    return (k, u, t) => {
      put(lib, 220, 330, at(k, u, 0) * 1.4); put(lib2, 440, 330, at(k, u, 0, .3) * 1.4); show(tag1, fade(k, u, 0));
      put(parrot, 330, 470 + Math.sin(t * 3) * 4, at(k, u, 1) * 1.2, Math.sin(t * 2) * 6); show(q, fade(k, u, 1, 1.2));
      stairs.forEach((s, i) => show(s, k >= 2 ? ease(u * 1.5 - i * .25 + (k > 2) * 3) : 0)); show(tag2, fade(k, u, 2));
      const step = k >= 3 ? Math.min(4, Math.floor(t * .8) % 6) : 0; put(otto, 800 + step * 80, 530 - step * 60 - Math.abs(Math.sin(t * 4)) * 10, k >= 2 ? 1 : 0); otto.set(k >= 3 ? 'proud' : 'smile'); otto.blink(t);
      nar(k, u, t);
    };
  },
  goal(g, L) {
    const mt = grp(g, prop('mountain')), top = g.appendChild(text(640, 140, word(L, 'parler et comprendre par soi-même', 'speak and understand on its own'), 'mid'));
    const camps = [[420, 570], [520, 500], [620, 430], [710, 365]].map(([x, y]) => { const f = grp(g, prop('flag')); f.home = [x, y]; return f; });
    const labs = [word(L, 'tenir', 'hold'), word(L, 'se souvenir', 'remember'), word(L, 'communiquer', 'communicate'), word(L, 'questionner', 'question')].map((s) => g.appendChild(text(0, 0, s, 'small', 'start')));
    const ans = [[word(L, 'oui', 'yes'), 'g'], [word(L, 'non', 'no'), 'b'], [word(L, 'avec autre chose', 'with something more'), 'r']].map(([s, c]) => pill(g, s, c, 300));
    const climber = g.appendChild(buddy('smile', 22));
    const nar = narrator(g, ['wow', 'think', 'smile', 'proud']);
    return (k, u, t) => {
      put(mt, 640, 470, 2.8 * at(k, u, 0)); show(top, fade(k, u, 0, .8));
      camps.forEach((c, i) => { put(c, ...c.home, k >= 1 ? pop(u * 1.4 - i * .3 + (k > 1) * 3) : 0); labs[i].setAttribute('x', c.home[0] + 30); labs[i].setAttribute('y', c.home[1] + 30); show(labs[i], k >= 2 ? fade(k, u, 2, i * .4) : 0); });
      const cl = k >= 1 ? Math.min(3, Math.floor(t * .5)) : 0; put(climber, camps[cl].home[0] - 24, camps[cl].home[1] + 20, k >= 1 ? 1 : 0); climber.blink(t);
      ans.forEach((a, i) => { put(a, 260 + i * 330, 660, at(k, u, 3, i * .4)); });
      show(mt, k === 3 ? .35 : 1);
      nar(k, u, t);
    };
  },
  box(g, L) {
    const otto = g.appendChild(buddy('oh', 80));
    const yes = (L ? ['a small world', 'matter', 'time', 'local rules'] : ['un petit monde', 'de la matière', 'du temps', 'des règles locales']).map((s) => pill(g, s, 'g', 300));
    const no = (L ? ['words', 'goals', 'a score', 'a language model'] : ['des mots', 'un but', 'un score', 'un modèle de langage']).map((s) => { const n = pill(g, s, 'b', 330); n.append(path('M-140 0H140', 'strike')); return n; });
    const pot = grp(g, prop('pot')), cake = g.appendChild(text(640, 640, word(L, 'pas de gâteau livré', 'no delivered cake'), 'mid'));
    return (k, u, t) => {
      put(otto, 640, 360 + Math.sin(t * 2.2) * 5, 1); otto.blink(t); otto.set(k === 0 ? 'think' : k === 1 ? 'smile' : k === 2 ? 'nope' : 'wink');
      put(pot, 640, 180, k === 0 ? pop(u * 1.4) * 1.3 : 1.3 * (k < 3)); show(pot, k === 0 || k === 3 ? 1 : 0);
      yes.forEach((n, i) => { const p = k >= 1 ? ease(k > 1 ? 1 : u * 1.2 - i * .3) : 0; put(n, 220, 190 + i * 100, 1); show(n, p); });
      no.forEach((n, i) => { const p = k >= 2 ? ease(k > 2 ? 1 : u * 1.2 - i * .3) : 0, back = k === 2 ? Math.sin(clamp(u * 1.2 - i * .3) * Math.PI) * 60 : 0; put(n, 1040 - back, 190 + i * 100, 1); show(n, p); });
      show(cake, fade(k, u, 3, .6));
    };
  },
  cells(g, L) {
    const n = 11, row = [0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0], cs = row.map(() => g.appendChild(buddy('sleep', 30)));
    const hl = g.appendChild(box(-140, -46, 280, 92, 'frame', 46)), arrow = g.appendChild(path('M0 0V60', 'line-k')), out = g.appendChild(buddy('smile', 30));
    const rule = g.appendChild(text(640, 560, '', 'mid')), wave = grp(g, prop('wave')), ola = g.appendChild(text(640, 600, word(L, 'la ola : chacun regarde son voisin', 'the wave: everyone watches their neighbour'), 'small'));
    const big = g.appendChild(text(640, 600, word(L, 'Que peut-il naître de règles aussi simples ?', 'What can come out of rules this simple?'), 'mid'));
    const nar = narrator(g, ['smile', 'think', 'think', 'wow', 'oh']);
    let s = row.slice(), last = -1;
    return (k, u, t) => {
      const c = 5, tick = Math.floor(t * 1.2);
      if (k === 3 && tick !== last) { last = tick; s = s.map((_, i) => (i === tick % n ? 1 : 0)); }
      if (k === 4 && tick !== last) { last = tick; s = step(s); }
      cs.forEach((b, i) => { put(b, 640 + (i - c) * 84, 260, at(k, u, 0, i * .08)); b.set(s[i] ? 'smile' : 'sleep'); b.blink(t, i); });
      put(hl, 640, 260, k === 1 || k === 2 ? 1 : 0);
      put(arrow, 640, 312, k === 2 ? 1 : 0); put(out, 640, 400, k === 2 ? pop(u * 1.4 - .4) : 0); out.set((row[4] + row[5] + row[6]) >= 2 ? 'smile' : 'sleep');
      rule.textContent = k === 2 ? word(L, '2 sur 3 allumées → allumée, sinon éteinte', '2 of 3 on → on, otherwise off') : k === 1 ? word(L, 'elle-même + ses deux voisines', 'itself + its two neighbours') : '';
      show(rule, k === 1 || k === 2 ? 1 : 0);
      put(wave, 640, 470, k === 3 ? 1.6 : 0); [...wave.firstChild.children].forEach((c, i) => c.setAttribute('cy', -Math.max(0, Math.sin(t * 4 - i * .7)) * 22)); show(ola, k === 3 ? 1 : 0); show(big, fade(k, u, 4));
      nar(k, u, t);
    };
  },
  lock(g, L) {
    const tgt = grp(g, prop('target')), arr = grp(g, prop('arrow')), paint = g.appendChild(el('circle', { r: 70, class: 'paint' }));
    const steps = [word(L, 'question', 'question'), word(L, 'mesure', 'measure'), word(L, 'décision', 'decision')].map((s) => pill(g, s, 'g', 230));
    const lock = grp(g, prop('lock')), fp = g.appendChild(text(640, 560, word(L, 'empreinte : 663b006…', 'fingerprint: 663b006…'), 'code'));
    const after = grp(g, box(-300, -40, 600, 80, 'pill r', 40), text(0, 10, word(L, 'changement = nouvelle étude', 'change = new study'), 'pill-t'));
    const nar = narrator(g, ['wink', 'worry', 'proud', 'think']);
    return (k, u, t) => {
      const sh = k <= 1 ? 1 : 0;
      put(arr, 520 + ease(u * 1.2) * (k === 0 ? 180 : 180), 300, sh); put(tgt, 700, 300, k === 0 ? ease(u * 1.5 - 1.2) * 1.5 * sh : 1.5 * sh);
      put(paint, 700, 300, k === 1 ? 1 + Math.sin(t * 6) * .04 : 0);
      steps.forEach((s, i) => put(s, 330 + i * 300, 300, at(k, u, 2, i * .3) * (k <= 2 ? 1 : .8)));
      put(lock, 640, 450, at(k, u, 2, 1.2) * 1.3); show(fp, fade(k, u, 2, 2));
      put(after, 640, 640, at(k, u, 3));
      nar(k, u, t);
    };
  },
  dice(g, L) {
    const dice = [0, 1].map(() => grp(g, prop('dice'))), cheat = g.appendChild(text(640, 520, word(L, 'relancer jusqu’à ce que ça arrange ?', 'redraw until it suits us?'), 'mid'));
    const balls = ['3', '4', '2', '8', '2', '4', '9', '2'].map((n) => grp(g, prop('ball', n)));
    const round = g.appendChild(text(640, 420, word(L, 'tirage public n° 34 282 492', 'public draw no. 34,282,492'), 'mid'));
    const mix = grp(g, box(-330, -40, 660, 80, 'pill g', 40), text(0, 10, word(L, 'tirage + mot du plan → les 600 lois', 'draw + word in the plan → the 600 laws'), 'pill-t'));
    const nar = narrator(g, ['wink', 'think', 'proud']);
    return (k, u, t) => {
      dice.forEach((d, i) => put(d, 560 + i * 160, 300 + Math.abs(Math.sin(t * 5 + i)) * -40, k === 0 ? 1.3 : 0, t * 160 * (i ? -1 : 1)));
      show(cheat, k === 0 ? clamp(u * 2 - 1) : 0);
      balls.forEach((b, i) => put(b, 290 + i * 100, 300 + Math.sin(t * 3 + i) * 6, k >= 1 ? pop(u * 1.6 - i * .15 + (k > 1) * 4) : 0));
      show(round, fade(k, u, 1, 1.4)); put(mix, 640, 560, at(k, u, 2));
      nar(k, u, t);
    };
  },
  lineup(g, L) {
    const wall = []; for (let i = 0; i < 5; i++) wall.push(g.appendChild(path(`M100 ${180 + i * 80}H1060`, 'line-s')));
    const subs = [['crystal', word(L, 'le cristal', 'the crystal'), word(L, 'grandit, mais ne fait rien pour durer', 'grows, but does nothing to last')], ['flame', word(L, 'la flamme', 'the flame'), word(L, 'se maintient, sans mémoire', 'keeps going, no memory')], ['loop', word(L, 'la boucle', 'the loop'), word(L, 'tourne parce qu’on l’a écrite', 'turns because we wrote it')]]
      .map(([p, a, b]) => { const n = grp(g, prop(p)); n.lab = g.appendChild(text(0, 0, a, 'mid')); n.sub = g.appendChild(text(0, 0, b, 'small')); return n; });
    const real = g.appendChild(buddy('oh', 46)), mag = grp(g, prop('glasses'));
    const verdict = subs.map(() => g.appendChild(text(0, 0, word(L, 'NON', 'NO'), 'stamp-s')));
    const nar = narrator(g, ['think', 'nope', 'nope', 'nope', 'proud']);
    return (k, u, t) => {
      subs.forEach((s, i) => { const x = 230 + i * 270; put(s, x, 360, at(k, u, i + 1) * 1.4 + (k === 0 ? at(k, u, 0, i * .3) * 1.4 : 0)); s.lab.setAttribute('x', x); s.lab.setAttribute('y', 480); s.sub.setAttribute('x', x); s.sub.setAttribute('y', 520); show(s.lab, k >= 1 ? (k > i ? 1 : 0) : 0); show(s.sub, k === i + 1 ? 1 : 0); verdict[i].setAttribute('x', x); verdict[i].setAttribute('y', 250); show(verdict[i], k === 4 ? clamp(u * 2 - i * .3) : 0); });
      put(real, 1010, 360, k === 4 ? pop(u * 1.2 - 1) : k === 0 ? at(k, u, 0, 1) : 0); real.set(k === 4 ? 'proud' : 'oh'); real.blink(t);
      put(mag, 1010, 250, k === 4 ? at(k, u, 4, 1.4) * .8 : 0);
      nar(k, u, t);
    };
  },
  replay(g, L) {
    const chess = grp(g, prop('chess')), moves = g.appendChild(text(640, 470, '1. e4 e5   2. Nf3 Nc6   3. Bb5 …', 'code'));
    const runs = Array.from({ length: 24 }, () => g.appendChild(el('circle', { r: 9, class: 'tick' }))), n = g.appendChild(text(640, 540, word(L, '769 parties rejouées à l’identique', '769 runs replayed identically'), 'mid'));
    const leaf = grp(g, prop('leaflet')), l1 = g.appendChild(text(780, 300, word(L, 'ce que ça montre', 'what it shows'), 'mid', 'start')), l2 = g.appendChild(text(780, 360, word(L, 'ce que ça ne montre pas', 'what it does not show'), 'mid', 'start'));
    const nar = narrator(g, ['smile', 'proud', 'wink']);
    return (k, u, t) => {
      put(chess, 640, 320, k === 0 ? pop(u * 1.3) * 2 : 0); show(moves, k === 0 ? fade(k, u, 0, .8) : 0);
      runs.forEach((r, i) => { r.setAttribute('cx', 340 + i * 26); r.setAttribute('cy', 400); r.setAttribute('class', k >= 1 && (t * 6) % 24 > i ? 'tick on' : 'tick'); show(r, k === 1 ? 1 : 0); }); show(n, k === 1 ? fade(k, u, 1, .5) : 0);
      put(leaf, 560, 340, at(k, u, 2) * 2); show(l1, fade(k, u, 2, .8)); show(l2, fade(k, u, 2, 1.6));
      nar(k, u, t);
    };
  },
  stairs(g, L) {
    const tiers = 9, sw = 116, sh = 56, x0 = 100, y0 = 680;
    const steps = Array.from({ length: tiers }, (_, i) => g.appendChild(el('rect', { x: x0 + i * sw, y: y0 - (i + 1) * sh, width: sw + 4, height: (i + 1) * sh, class: 'step' })));
    const order = [...objectives].sort((a, b) => a.tier - b.tier || a.x - b.x), per = {};
    const dots = order.map((o) => { const b = g.appendChild(buddy('sleep', 14)); const j = per[o.tier] = (per[o.tier] ?? -1) + 1; b.home = [x0 + o.tier * sw + 22 + (j % 3) * 36, y0 - (o.tier + 1) * sh - 18 - Math.floor(j / 3) * 32]; b.tier = o.tier; return b; });
    const zones = [[0, 1, word(L, 'monde, forme, frontière, ressources', 'world, shape, boundary, resources')], [2, 4, word(L, 'organisation, mémoire, hérédité, communication', 'organisation, memory, heredity, communication')], [5, 8, word(L, 'question, compréhension, recherche, parole', 'question, understanding, research, speech')]]
      .map(([a, b, s], i) => { const t2 = text(x0 + ((a + b) / 2 + .5) * sw, 120 + i * 0, s, 'small'); g.append(t2); t2.a = a; t2.b = b; return t2; });
    const team = [0, 1, 2].map(() => g.appendChild(buddy('proud', 18)));
    return (k, u, t) => {
      steps.forEach((s, i) => show(s, k === 0 ? clamp(u * 2 - i * .12) : 1));
      dots.forEach((d, i) => { const zone = k - 1, on = k === 0 ? 0 : 1, lit = zone >= 0 && zones[zone] && d.tier >= zones[zone].a && d.tier <= zones[zone].b; put(d, ...d.home, on * (lit ? 1.25 : 1)); d.set(lit ? 'wow' : 'sleep'); d.blink(t, i); });
      zones.forEach((z, i) => { z.setAttribute('y', y0 - (z.b + 1) * sh - 110); show(z, k === i + 1 ? clamp(u * 2) : 0); });
      team.forEach((m, i) => { const c = k === 0 ? Math.min(8, Math.floor(t * 1.5)) : 0; put(m, x0 + c * sw + 30 + i * 26, y0 - (c + 1) * sh - 20 - Math.abs(Math.sin(t * 5 + i)) * 8, k === 0 ? 1 : 0); m.blink(t, i); });
    };
  },
  today(g, L) {
    const groups = [['measured', 'smile', word(L, 'mesuré', 'measured')], ['now', 'oh', word(L, 'en chantier', 'under way')], ['asleep', 'sleep', word(L, 'pas commencé', 'not started')]];
    const cols = groups.map(([st, m, lab], i) => { const list = objectives.filter((o) => o.state === st); const bs = list.map(() => g.appendChild(buddy(m, 22))); const head = g.appendChild(text(260 + i * 380, 170, lab, 'mid')), n = g.appendChild(text(260 + i * 380, 230, String(list.length), 'big')); return { bs, head, n, i }; });
    const first = grp(g, box(-360, -40, 720, 80, 'pill r', 40), text(0, 10, word(L, 'première marche : une loi, un anneau', 'first step: one law, one ring'), 'pill-t'));
    const nar = narrator(g, ['smile', 'think', 'worry']);
    return (k, u, t) => {
      cols.forEach((c) => { show(c.head, fade(k, u, 0, c.i * .5)); show(c.n, k >= 1 ? fade(k, u, 1, c.i * .4) : 0); c.bs.forEach((b, j) => { put(b, 260 + c.i * 380 + ((j % 6) - 2.5) * 52, 300 + Math.floor(j / 6) * 52, at(k, u, 0, c.i * .5 + j * .05)); b.blink(t, j); }); });
      put(first, 640, 620, at(k, u, 2));
      nar(k, u, t);
    };
  },
  ring(g, L) {
    let s = seeded(183807, 32, .5); const frozen = s.slice(); let last = -1;
    const live = s.map(() => g.appendChild(buddy('smile', 15))), ice = s.map(() => g.appendChild(buddy('sleep', 15)));
    const labA = g.appendChild(text(380, 160, word(L, 'avec la règle', 'with the rule'), 'mid')), labB = g.appendChild(text(900, 160, word(L, 'jumeau gelé', 'frozen twin'), 'mid'));
    const res = g.appendChild(text(640, 650, word(L, 'moins de groupes : 64 mondes sur 64', 'fewer groups: 64 worlds of 64'), 'mid'));
    const place = (cx, i, p) => { const a = (i / 32) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(a) * 170 * p, 390 + Math.sin(a) * 170 * p]; };
    return (k, u, t) => {
      const tick = Math.floor(t * 1.4);
      if (tick !== last) { last = tick; const n = step(s); s = n.join('') === s.join('') && tick % 5 === 0 ? seeded(183807 + (tick % 7), 32, .5) : n; }
      const two = k >= 1;
      live.forEach((c, i) => { put(c, ...place(two ? 380 : 640, i, at(k, u, 0, i * .02) || 1), 1); c.set(s[i] ? 'smile' : 'sleep'); c.blink(t, i); });
      ice.forEach((c, i) => { put(c, ...place(900, i, 1), two ? 1 : 0); c.set(frozen[i] ? 'oh' : 'sleep'); });
      show(labA, two ? 1 : 0); show(labB, two ? 1 : 0); show(res, fade(k, u, 2));
    };
  },
  orders(g, L) {
    const talk = [0, 1, 2].map((i) => g.appendChild(buddy(['smile', 'oh', 'think'][i], 40)));
    const bubbles = [0, 1, 2].map(() => grp(g, box(-50, -30, 100, 60, 'bubble', 30), text(0, 10, '…', 'mid')));
    const strips = [0, 1, 2, 3].map((j) => { const r = seeded(183809, 16, .5); return r.map((v) => g.appendChild(el('circle', { r: 11, class: v ? 'tick on' : 'tick' }))); });
    const lab = g.appendChild(text(640, 640, word(L, '56 mondes sur 64 : plusieurs fins possibles', '56 worlds of 64: several possible endings'), 'mid'));
    const nar = narrator(g, ['think', 'smile', 'wow']);
    return (k, u, t) => {
      talk.forEach((b, i) => { put(b, 440 + i * 200, 330, k === 1 ? 1 : 0); b.blink(t, i); });
      bubbles.forEach((b, i) => { const on = k === 1 && Math.floor(t * 1.2) % 3 === i; put(b, 440 + i * 200, 240, on ? 1 : 0); });
      strips.forEach((row, j) => row.forEach((c, i) => { c.setAttribute('cx', 420 + i * 30); c.setAttribute('cy', 220 + j * 70); const v = (Math.sin((i + 1) * (j + 2) * 1.7 + 3) > (j - 1.5) * .2) ? 1 : 0; c.setAttribute('class', (k === 2 ? v : (i + j) % 2) ? 'tick on' : 'tick'); show(c, k === 0 || k === 2 ? (k === 0 ? (j === 0 ? 1 : 0) : 1) : 0); }));
      show(lab, fade(k, u, 2, .8));
      nar(k, u, t);
    };
  },
  poke(g, L) {
    const mat = grp(g, prop('mattress')), finger = g.appendChild(path('M0 -60V0', 'line-k'));
    const row = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1], cs = row.map(() => g.appendChild(buddy('sleep', 24)));
    const marks = [word(L, 'sur la frontière : change', 'on the border: changes'), word(L, 'juste à côté : change', 'right next to it: changes'), word(L, 'à 2 cases ou plus : change', '2 cells away or more: changes')].map((s) => g.appendChild(text(0, 0, s, 'mid')));
    const vals = ['64/64', '64/64', '0/64'].map((s, i) => g.appendChild(text(0, 0, s, i === 2 ? 'mid good' : 'mid')));
    const twice = g.appendChild(text(640, 640, word(L, '32 cellules, puis 64 : même partage', '32 cells, then 64: same split'), 'mid'));
    const nar = narrator(g, ['think', 'oh', 'wow', 'smile']);
    return (k, u, t) => {
      put(mat, 560, 330, k === 1 ? 1.8 : 0); put(finger, k === 1 ? (u % 3 < 1.5 ? 420 : 680) : 0, 300 + Math.abs(Math.sin(t * 3)) * 20, k === 1 ? 1 : 0);
      const pokeAt = Math.floor(t * .7) % 3, target = [4, 3, 1][pokeAt];
      cs.forEach((c, i) => { put(c, 330 + i * 68, k >= 2 ? 300 : 320, k === 0 || k >= 2 ? 1 : 0); const flicked = k >= 2 && i === target && (t * .7 % 1) < .45; c.set(flicked ? 'oh' : row[i] ? 'smile' : 'sleep'); c.blink(t, i); });
      marks.forEach((m, i) => { m.setAttribute('x', 380); m.setAttribute('y', 440 + i * 56); m.setAttribute('text-anchor', 'start'); show(m, k >= 2 ? fade(k, u, 2, i * .5) : 0); vals[i].setAttribute('x', 900); vals[i].setAttribute('y', 444 + i * 56); show(vals[i], k >= 2 ? fade(k, u, 2, 1 + i * .5) : 0); });
      show(twice, fade(k, u, 3));
      nar(k, u, t);
    };
  },
  tune(g, L) {
    const band = [0, 1, 2, 3].map((i) => g.appendChild(buddy(['think', 'smile', 'oh', 'smile'][i], 44)));
    const notes = Array.from({ length: 6 }, () => g.appendChild(el('circle', { r: 10, class: 'fill-k' })));
    const t1 = g.appendChild(text(640, 170, word(L, 'règle connue = étalonnage', 'known rule = calibration'), 'big')), t2 = g.appendChild(text(640, 600, word(L, 'accorder, puis jouer l’inconnu', 'tune up, then play the unknown'), 'mid'));
    const nar = narrator(g, ['worry', 'wink']);
    return (k, u, t) => {
      band.forEach((b, i) => { put(b, 400 + i * 160, 390 + Math.sin(t * 4 + i) * (k === 1 ? 10 : 2), 1); b.blink(t, i); });
      notes.forEach((n, i) => { const p = (t * .5 + i / 6) % 1; n.setAttribute('cx', 360 + p * 640); n.setAttribute('cy', 280 - Math.sin(p * Math.PI * 3) * 40); show(n, k === 1 ? 1 - p : 0); });
      show(t1, fade(k, u, 0)); show(t2, fade(k, u, 1));
      nar(k, u, t);
    };
  },
  glasses(g, L) {
    const n = 128, beads = Array.from({ length: n }, () => g.appendChild(buddy('smile', 10)));
    const changed = new Set(); (R.observer['4'].concat(R.observer['92'])).forEach((p, i) => { if (new Set(p).size > 1) changed.add(i); });
    const rings = [...changed].map((i) => { const c = g.appendChild(el('circle', { r: 14, class: 'diffring' })); c.i = i; return c; });
    const lock = grp(g, prop('lock')), thermo = [0, 1, 2].map(() => grp(g, prop('thermo'))), readers = [0, 1, 2].map((i) => g.appendChild(buddy(['smile', 'oh', 'think'][i], 26)));
    const temps = ['37,2', '38,9', '36,1'].map((s) => g.appendChild(text(0, 0, L ? s.replace(',', '.') : s, 'mid')));
    const stamp = grp(g, box(-200, -55, 400, 110, 'stampbox', 18), text(0, 22, word(L, 'REJETÉE', 'REJECTED'), 'stamp-t'));
    const cap = g.appendChild(text(640, 680, '', 'mid'));
    const nar = narrator(g, ['proud', 'oh', 'think', 'nope']);
    const pos = (i) => [150 + (i % 16) * 36, 150 + Math.floor(i / 16) * 44];
    return (k, u, t) => {
      const beadsOn = k === 0 || k === 1 || k === 3;
      beads.forEach((b, i) => { put(b, ...pos(i), beadsOn ? (k === 0 ? pop(u * 1.5 - i * .004) : 1) : 0); b.set(k >= 1 && changed.has(i) && Math.floor(t * 1.5 + i) % 2 ? 'oh' : 'smile'); });
      rings.forEach((r) => { const [x, y] = pos(r.i); r.setAttribute('cx', x); r.setAttribute('cy', y); show(r, k === 1 || k === 3 ? fade(k, u, k, .5) : 0); });
      put(lock, 960, 300, k === 0 ? at(k, u, 0, .8) * 1.4 : 0);
      thermo.forEach((th, i) => { put(th, 380 + i * 260, 330, k === 2 ? at(k, u, 2, i * .3) * 1.5 : 0); put(readers[i], 380 + i * 260, 480, k === 2 ? 1 : 0); readers[i].blink(t, i); temps[i].setAttribute('x', 380 + i * 260); temps[i].setAttribute('y', 230); show(temps[i], k === 2 ? fade(k, u, 2, .8 + i * .3) : 0); });
      put(stamp, 1000, 420, k === 3 ? pop(u * 1.5 - .6) : 0, -10);
      cap.textContent = [word(L, 'verrouillée avant le test', 'locked before the test'), word(L, '198 imposteurs attrapés · 38 sur 128 changent de verdict', '198 impostors caught · 38 of 128 change verdict'), word(L, 'même malade, trois lectures', 'same patient, three readings'), word(L, 'un fait ne doit pas dépendre de nos lunettes', 'a fact must not depend on our glasses')][k];
      nar(k, u, t);
    };
  },
  twins(g, L) {
    const houses = [0, 1].map(() => { const n = grp(g, path('M-150 -40L0 -140L150 -40Z', 'fill-s'), box(-130, -40, 260, 200, 'card', 10)); return n; });
    const kids = [0, 1].map(() => g.appendChild(buddy('smile', 40)));
    const grid = Array.from({ length: 48 }, (_, i) => g.appendChild(el('rect', { width: 30, height: 30, rx: 6, class: 'sq' })));
    const legend = [['fill-g', word(L, 'matière', 'matter')], ['fill-y', word(L, 'nourriture', 'food')], ['fill-o', word(L, 'restes', 'remains')]].map(([c, s], i) => grp(g, el('rect', { x: -14, y: -14, width: 28, height: 28, rx: 6, class: c }), text(24, 9, s, 'small', 'start')));
    const sw = [['pot', word(L, 'pousser mange la nourriture ?', 'growing eats food?')], ['compost', word(L, 'l’usure laisse des restes ?', 'wear leaves remains?')], ['statue', word(L, 'les choses s’usent ?', 'things wear out?')]]
      .map(([p, s]) => { const n = grp(g, box(-330, -50, 660, 100, 'card', 50), text(-180, 12, s, 'pill-t', 'start'), el('rect', { x: 200, y: -20, width: 80, height: 40, rx: 20, class: 'toggle' }), el('circle', { cx: 220, cy: 0, r: 15, class: 'knob' })); const pr = prop(p); pr.setAttribute('transform', 'translate(-260 0) scale(.6)'); n.append(pr); return n; });
    const eight = g.appendChild(text(640, 660, word(L, '2 × 2 × 2 = 8 mondes · les mêmes 600 lois dans chacun', '2 × 2 × 2 = 8 worlds · the same 600 laws in each'), 'mid'));
    const nar = narrator(g, ['smile', 'think', 'think', 'think', 'wow']);
    return (k, u, t) => {
      houses.forEach((h, i) => put(h, 380 + i * 520, 380, k === 0 ? at(k, u, 0, i * .3) : 0)); kids.forEach((c, i) => { put(c, 380 + i * 520, 440, k === 0 ? at(k, u, 0, .6 + i * .3) : 0); c.blink(t, i); });
      grid.forEach((r, i) => { const x = 400 + (i % 8) * 36, y = 160 + Math.floor(i / 8) * 36, v = Math.sin(i * 12.9 + Math.floor(t * 1.5) * .7); r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('class', `sq ${v > .55 ? 'fill-g' : v > -.1 ? 'fill-y' : v > -.5 ? 'fill-o' : 'fill-w'}`); show(r, k === 1 ? fade(k, u, 1, i * .01) : 0); });
      legend.forEach((l, i) => put(l, 800, 220 + i * 70, k === 1 ? at(k, u, 1, .8 + i * .3) : 0));
      sw.forEach((s, i) => { const on = k >= 2 ? (k === i + 2 ? pop(u * 1.4) : k > i + 2 ? .82 : 0) : 0; put(s, 640, 180 + i * 140, on); show(s, k === i + 2 ? 1 : .55); s.lastChild.previousSibling.setAttribute('cx', 220 + (Math.floor(t * 1.2 + i) % 2) * 40); });
      show(eight, fade(k, u, 4, 1));
      nar(k, u, t);
    };
  },
  success(g, L) {
    const checks = [word(L, '1. un amas localisé', '1. a localised cluster'), word(L, '2. dure 1 500 pas', '2. lasts 1,500 steps'), word(L, '3. a besoin de sa production', '3. needs its own production')].map((s) => g.appendChild(text(120, 0, s, 'mid', 'start')));
    const blob = Array.from({ length: 14 }, (_, i) => g.appendChild(el('circle', { r: 16, class: 'fill-g' })));
    const runners = [0, 1].map(() => g.appendChild(buddy('proud', 26)));
    const fountain = grp(g, prop('fountain')), statue = grp(g, prop('statue')), pump = g.appendChild(text(780, 560, word(L, 'pompe coupée', 'pump cut'), 'small'));
    const gates = [['8', '7'], ['64', '62'], ['96×96', '']].map(([a, b], i) => grp(g, box(-150, -60, 300, 120, 'card', 24), text(0, -8, a === '96×96' ? word(L, 'monde ×4', 'world ×4') : word(L, `${a} graines`, `${a} seeds`), 'mid'), text(0, 36, b ? word(L, `${b} doivent passer`, `${b} must pass`) : word(L, 'doit tenir', 'must hold'), 'small')));
    const nar = narrator(g, ['think', 'smile', 'smile', 'wow', 'proud']);
    return (k, u, t) => {
      checks.forEach((c, i) => { c.setAttribute('y', 150 + i * 56); show(c, k >= 1 && k <= 3 ? (k - 1 >= i ? (k - 1 === i ? 1 : .45) : 0) : k === 0 ? fade(k, u, 0, i * .5) * .8 : 0); });
      blob.forEach((b, i) => { const a = i / 14 * Math.PI * 2, r = 50 + Math.sin(t * 2 + i) * 6; b.setAttribute('cx', 420 + Math.cos(a) * r * (k === 1 ? ease(u) : 1)); b.setAttribute('cy', 450 + Math.sin(a) * r); show(b, k === 1 || k === 2 ? 1 : 0); });
      runners.forEach((r, i) => { const p = (t * .25 + i * .5) % 1; put(r, 700 + Math.cos(p * Math.PI * 2) * 160, 450 + Math.sin(p * Math.PI * 2) * 70, k === 2 ? 1 : 0); r.blink(t, i); });
      const cut = k === 3 && u > 2.5;
      put(fountain, 460, 440, k === 3 ? 1.8 : 0); show(fountain, cut ? .35 : 1); put(statue, 820, 440, k === 3 ? 1.8 : 0); put(pump, 0, 0, k === 3 && cut ? 1 : 0);
      gates.forEach((gt, i) => put(gt, 300 + i * 340, 420, at(k, u, 4, i * .4)));
      nar(k, u, t);
    };
  },
  bars(g, L) {
    const T = R.twin;
    const rows = [['EKW', word(L, 'tout compté', 'all counted'), 'g'], ['ekW', word(L, 'rien compté', 'nothing counted'), 'b']].map(([key, l, c], i) => {
      const n = grp(g, text(-20, 12, l, 'mid', 'end'), el('rect', { x: 0, y: -30, width: 720, height: 60, rx: 30, class: 'track' }));
      const ci = el('rect', { y: -6, height: 12, rx: 6, class: 'ci' }), fill = el('rect', { x: 0, y: -30, height: 60, rx: 30, class: `bar ${c}` }), v = text(0, 14, '', 'barv', 'start');
      n.append(fill, ci, v); Object.assign(n, { fill, ci, v, y: T.yields[key] }); return n;
    });
    const scale = (x) => 720 * x / .3;
    const pairs = [[T.onlyCounted, word(L, 'seulement si compté', 'only when counted'), 'g'], [T.onlyUncounted, word(L, 'seulement si pas compté', 'only when not counted'), 'b']].map(([n, l, c]) => { const gg = grp(g, el('rect', { x: -80, width: 160, rx: 22, class: `bar ${c}` }), text(0, 0, String(n), 'barv'), text(0, 44, l, 'small')); gg.n = n; return gg; });
    const gap = g.appendChild(text(640, 680, word(L, `écart : ${(100 * T.interval[0]).toFixed(1).replace('.', ',')} à ${(100 * T.interval[1]).toFixed(1).replace('.', ',')} %`, `gap: ${(100 * T.interval[0]).toFixed(1)} to ${(100 * T.interval[1]).toFixed(1)}%`), 'mid'));
    const stamp = grp(g, box(-260, -55, 520, 110, 'stampbox good', 18), text(0, 22, word(L, 'COMPTER AIDE', 'COUNTING HELPS'), 'stamp-t good'));
    const nar = narrator(g, ['wow', 'think', 'smile', 'proud']);
    return (k, u, t) => {
      rows.forEach((r, i) => { const vis = (i === 0 && k <= 1) || (i === 1 && k === 1) || (k === 3); const p = k === i ? ease(u * .7) : 1; put(r, 380, 240 + i * 120, vis ? 1 : 0); r.fill.setAttribute('width', Math.max(60, scale(r.y[0] / T.laws) * p)); r.ci.setAttribute('x', scale(r.y[1])); r.ci.setAttribute('width', scale(r.y[2] - r.y[1])); r.v.setAttribute('x', 740); r.v.textContent = `${Math.round(r.y[0] * p)} / ${T.laws}`; });
      pairs.forEach((pp, i) => { const h = pp.n * 2.4 * (k === 2 ? ease(u * .8 - i * .3) : 0); pp.firstChild.setAttribute('y', -h); pp.firstChild.setAttribute('height', h); pp.children[1].setAttribute('y', -h - 14); put(pp, 470 + i * 340, 560, k === 2 ? 1 : 0); });
      show(gap, k === 2 ? fade(k, u, 2, 2.4) : 0);
      put(stamp, 640, 560, at(k, u, 3), -4);
      nar(k, u, t);
    };
  },
  subtle(g, L) {
    const T = R.twin;
    const halves = [[T.yields.EkW[0], word(L, 'manger seul', 'eating only'), 'r'], [T.yields.eKW[0], word(L, 'restes seuls', 'remains only'), 'r'], [T.yields.ekW[0], word(L, 'rien compté', 'nothing counted'), 'b'], [T.yields.EKW[0], word(L, 'les deux', 'both'), 'g']]
      .map(([n, l, c]) => { const gg = grp(g, el('rect', { x: -70, width: 140, rx: 20, class: `bar ${c}` }), text(0, 0, String(n), 'barv'), text(0, 44, l, 'small')); gg.n = n; return gg; });
    const pot = grp(g, prop('pot')), compost = grp(g, prop('compost')), cyc1 = g.appendChild(path('M-120 -60A140 90 0 0 1 120 -60', 'line-d')), cyc2 = g.appendChild(path('M120 60A140 90 0 0 1 -120 60', 'line-d'));
    const half = g.appendChild(text(640, 650, word(L, 'le cycle ne marche que complet', 'the cycle only works whole'), 'mid'));
    const statue = grp(g, prop('statue')), zero = g.appendChild(text(640, 260, '0', 'huge'));
    const big = g.appendChild(text(640, 300, `${T.held96.EKW[0]} / ${T.held96.EKW[1]}`, 'huge')), small = g.appendChild(text(640, 400, word(L, 'tiennent dans le monde ×4', 'hold in the world ×4'), 'mid'));
    const nar = narrator(g, ['wow', 'think', 'oh', 'proud']);
    return (k, u, t) => {
      halves.forEach((h, i) => { const hh = h.n * 2.8 * (k === 0 ? ease(u * .8 - i * .3) : 1); h.firstChild.setAttribute('y', -hh); h.firstChild.setAttribute('height', hh); h.children[1].setAttribute('y', -hh - 14); put(h, 300 + i * 200, 600, k === 0 ? 1 : 0); });
      const sh = k === 1 ? 1 : 0; put(pot, 460, 380, sh * 1.4); put(compost, 820, 380, sh * 1.4); [cyc1, cyc2].forEach((c, i) => { c.setAttribute('transform', 'translate(640 380)'); show(c, sh * (Math.floor(t) % 2 === i ? 1 : .3)); }); show(half, k === 1 ? fade(k, u, 1, 2) : 0);
      put(statue, 640, 450, k === 2 ? 2 : 0); show(zero, k === 2 ? fade(k, u, 2, .6) : 0);
      show(big, k === 3 ? fade(k, u, 3) : 0); show(small, k === 3 ? fade(k, u, 3, .6) : 0);
      nar(k, u, t);
    };
  },
  careful(g, L) {
    const quote = grp(g, box(-470, -70, 940, 140, 'card', 30), text(0, 14, word(L, '« le test rapporte plus quand on compte »', '“the test yields more when matter is counted”'), 'mid'));
    const nots = [word(L, 'vivant', 'alive'), word(L, 'organisé', 'organised'), word(L, 'se maintient', 'self-maintaining')].map((s) => { const n = pill(g, s, 'b', 280); n.append(path('M-120 0H120', 'strike')); return n; });
    const scope = g.appendChild(text(640, 560, word(L, '1 banc · 1 famille de lois · 2 tailles', '1 bench · 1 family of laws · 2 sizes'), 'mid'));
    const v1 = grp(g, box(-380, -60, 760, 120, 'card', 24), text(0, -6, word(L, 'V1 invalide : carburant épuisé (4 essais)', 'V1 invalid: fuel ran out (4 trials)'), 'mid'), text(0, 36, word(L, 'relue après coup : même dessin, pas une preuve', 'read afterwards: same pattern, not proof'), 'small'));
    const nar = narrator(g, ['think', 'nope', 'sad']);
    return (k, u, t) => {
      put(quote, 640, 200, at(k, u, 0) * (k === 2 ? .8 : 1)); show(quote, k === 2 ? .4 : 1);
      nots.forEach((n, i) => put(n, 320 + i * 320, 380, k === 1 ? at(k, u, 1, i * .3) : 0)); show(scope, k === 1 ? fade(k, u, 1, 1.5) : 0);
      put(v1, 640, 420, at(k, u, 2));
      nar(k, u, t);
    };
  },
  probe(g, L) {
    const plant = grp(g, prop('seed')), crumbs = Array.from({ length: 36 }, () => g.appendChild(el('circle', { r: 8, class: 'fill-o' })));
    const n95 = g.appendChild(text(640, 640, word(L, 'restes étalés partout : 95 lois sur 122 réussissent encore', 'remains spread everywhere: 95 of 122 laws still succeed'), 'mid'));
    const trail = g.appendChild(path('M200 520C360 420 520 560 680 460S960 380 1060 300', 'trail')), walker = g.appendChild(buddy('smile', 24));
    const mb = [['0,12', .123, 'g', word(L, 'restes gardés', 'remains kept')], ['0,04', .040, 'b', word(L, 'mélangés', 'shuffled')]].map(([s, v, c, l], i) => { const gg = grp(g, el('rect', { x: -60, width: 120, rx: 18, class: `bar ${c}` }), text(0, 0, L ? s.replace(',', '.') : s, 'barv'), text(0, 40, l, 'small')); gg.v = v; return gg; });
    const stamp = grp(g, box(-170, -48, 340, 96, 'stampbox soft', 18), text(0, 20, word(L, 'MITIGÉ', 'MIXED'), 'stamp-t soft'));
    const nar = narrator(g, ['think', 'oh', 'worry']);
    return (k, u, t) => {
      put(plant, 640, 330, k === 1 ? 2 : k === 0 ? at(k, u, 0) * 2 : 0);
      crumbs.forEach((c, i) => { const hx = 640 + ((i % 6) - 2.5) * 16, hy = 440 + Math.floor(i / 6) * 10, sx = 160 + ((i * 97) % 960), sy = 180 + ((i * 53) % 380), p = k === 1 ? ease(u * .5 - 1) : 0; c.setAttribute('cx', hx + (sx - hx) * p); c.setAttribute('cy', hy + (sy - hy) * p); show(c, k === 1 ? 1 : 0); });
      show(n95, k === 1 ? fade(k, u, 1, 3) : 0);
      show(trail, k === 2 ? 1 : 0); const p = (t * .12) % 1; put(walker, 200 + p * 860, 520 - p * 220 + Math.sin(p * 9) * 30, k === 2 ? 1 : 0); walker.blink(t);
      mb.forEach((b, i) => { const h = 1400 * b.v * (k === 2 ? ease(u * .6 - 2) : 0); b.firstChild.setAttribute('y', -h); b.firstChild.setAttribute('height', h); b.children[1].setAttribute('y', -h - 14); put(b, 380 + i * 170, 640, k === 2 ? 1 : 0); });
      put(stamp, 900, 560, k === 2 ? pop(u * .8 - 3.2) : 0, -8);
      nar(k, u, t);
    };
  },
  cloud(g, L) {
    const N = 420, pts = [], BANDS = ['c', 'm', 'f', 'x', 'n'];
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < N; i++) { const st = Math.floor(rnd() * 86), b = BANDS[Math.min(4, Math.floor(rnd() * rnd() * 7))]; pts.push({ x: (st / 85 - .5) * 2, y: ({ c: .8, m: .35, f: -.15, x: -.6, n: 0 })[b] + (rnd() - .5) * .35, z: (rnd() - .5) * 1.6, b, n: g.appendChild(el('circle', { r: 4, class: `dot ${b}` })) }); }
    const mapP = grp(g, prop('map')), readers = [['think', word(L, 'le guide', 'the guide')], ['wow', word(L, 'l’aventurier', 'the adventurer')], ['wink', word(L, 'l’inventeur', 'the inventor')]].map(([m, l]) => { const b = g.appendChild(buddy(m, 40)); b.lab = g.appendChild(text(0, 0, l, 'mid')); return b; });
    const count = g.appendChild(text(640, 120, '', 'big')), warn = grp(g, box(-300, -36, 600, 72, 'stampbox soft', 36), text(0, 12, word(L, 'des idées, pas des résultats', 'ideas, not results'), 'pill-t'));
    const legend = grp(g); [['c', word(L, 'consensus', 'consensus')], ['m', word(L, 'minoritaire', 'minority')], ['f', word(L, 'marginal', 'fringe')], ['x', word(L, 'extrême', 'extreme')], ['n', word(L, 'inédit', 'new')]].forEach(([b, l], i) => legend.append(el('circle', { cx: 180 + i * 190, cy: 690, r: 9, class: `dot ${b}` }), text(198 + i * 190, 697, l, 'small', 'start')));
    const nar = narrator(g, ['think', 'smile', 'wow', 'worry']);
    return (k, u, t) => {
      put(mapP, 640, 360, k === 0 ? at(k, u, 0) * 3 : 0);
      readers.forEach((r, i) => { put(r, 330 + i * 310, 360, k === 1 ? at(k, u, 1, i * .5) : 0); r.blink(t, i); r.lab.setAttribute('x', 330 + i * 310); r.lab.setAttribute('y', 450); show(r.lab, k === 1 ? fade(k, u, 1, i * .5 + .3) : 0); });
      const yaw = t * .25, cy = Math.cos(yaw), sy = Math.sin(yaw), on = k >= 2;
      pts.forEach((p, i) => { const x = p.x * cy - p.z * sy, z = p.x * sy + p.z * cy, f = 1 / (1.8 - z * .45), o = k === 2 ? ease(u * .8 - i / N) : on ? 1 : 0; p.n.setAttribute('cx', 640 + x * 420 * f); p.n.setAttribute('cy', 400 - p.y * 210 * f); p.n.setAttribute('r', (3 + 3 * f) * o); show(p.n, (k === 3 ? .35 : 1) * (.55 + .45 * f)); });
      count.textContent = k >= 2 ? `${Math.round(8567 * (k === 2 ? ease(u * .5) : 1)).toLocaleString(L ? 'en' : 'fr')} ${word(L, 'réponses', 'answers')}` : '';
      show(legend, on ? 1 : 0); put(warn, 640, 400, at(k, u, 3));
      nar(k, u, t);
    };
  },
  tokens(g, L) {
    const scale = Array.from({ length: 6 }, (_, i) => grp(g, el('circle', { r: 40, class: `tok t${i}` }), text(0, 14, String(i), 'mid')));
    const ends = [word(L, 'intuition', 'hunch'), word(L, 'établi, répliqué', 'established, replicated')].map((s) => g.appendChild(text(0, 0, s, 'small')));
    const src = grp(g, box(-260, -36, 520, 72, 'pill g', 36), text(0, 12, word(L, 'dès 2 : une source vérifiable', 'from 2 up: a checkable source'), 'pill-t'));
    const rain = [20, 90].map((p) => grp(g, box(-110, -60, 220, 120, 'card', 24), text(0, 16, `${p} %`, 'big')));
    const audit = grp(g, box(-380, -50, 760, 100, 'card', 24), text(0, 14, word(L, 'audit : 2,5 à 11 % de jetons trop optimistes', 'audit: 2.5 to 11% of tokens too optimistic'), 'mid'));
    const nar = narrator(g, ['think', 'smile', 'worry']);
    return (k, u, t) => {
      rain.forEach((r, i) => put(r, 480 + i * 320, 230, k === 0 ? at(k, u, 0, i * .6) : 0));
      scale.forEach((s, i) => put(s, 290 + i * 140, k === 0 ? 440 : 330, at(k, u, 0, 1.4 + i * .2) * (k === 1 && Math.floor(t * 2) % 6 === i ? 1.2 : 1)));
      ends[0].setAttribute('x', 290); ends[1].setAttribute('x', 990); ends.forEach((e) => { e.setAttribute('y', 410); show(e, k === 1 ? 1 : 0); });
      put(src, 640, 520, k === 1 ? at(k, u, 1, 1.2) : k > 1 ? .8 : 0);
      put(audit, 640, 640, at(k, u, 2));
      nar(k, u, t);
    };
  },
  pillars(g, L) {
    const br = grp(g, prop('bridge'));
    const P = [[262, word(L, 'certitudes', 'certain'), 'g', word(L, 'sol ferme', 'solid ground')], [312, word(L, 'incertitudes', 'uncertain'), 'b', word(L, 'terre inconnue', 'unknown land')], [298, word(L, 'disputes', 'disputes'), 'r', word(L, 'cartes contradictoires', 'maps disagree')], [730, word(L, 'ponts', 'bridges'), 'g2', word(L, 'une clé, plusieurs portes', 'one key, many doors')]];
    const cols = P.map(([n, l, c, m], i) => { const gg = grp(g, el('rect', { x: -70, width: 140, rx: 20, class: `bar ${c}` }), text(0, 0, n, 'barv'), text(0, 44, l, 'mid'), text(0, 80, m, 'small')); gg.n = n; gg.i = i; return gg; });
    const keyP = grp(g, prop('key')), star = g.appendChild(buddy('wow', 34));
    const nar = narrator(g, ['smile', 'think', 'wow', 'proud']);
    return (k, u, t) => {
      put(br, 640, 300, k === 0 ? at(k, u, 0) * 2.6 : 0);
      cols.forEach((c) => { const vis = k === 1 ? c.i < 3 : k >= 2; const h = (c.n / 730) * 300 * (vis ? (k === 1 ? ease(u * .7 - c.i * .5) : k === 2 && c.i === 3 ? ease(u * .7) : 1) : 0); c.firstChild.setAttribute('y', -h); c.firstChild.setAttribute('height', h); c.children[1].setAttribute('y', -h - 16); put(c, 230 + c.i * 260, 540, vis ? 1 : 0); show(c, k === 3 && c.i !== 1 ? .35 : 1); });
      put(keyP, 1010, 150, k === 2 ? at(k, u, 2, 1) * 1.4 : 0);
      put(star, 490, 540 - (312 / 730) * 300 - 70 + Math.sin(t * 3) * 5, k === 3 ? 1 : 0); star.blink(t);
      nar(k, u, t);
    };
  },
  traps(g, L) {
    const cousins = [0, 1, 2].map((i) => g.appendChild(buddy(['smile', 'think', 'wink'][i], 44)));
    const same = g.appendChild(text(640, 480, word(L, 'idées différentes, même éducation', 'different ideas, same upbringing'), 'mid'));
    const echo = Array.from({ length: 12 }, (_, i) => g.appendChild(text(0, 0, word(L, 'usure… usure…', 'wear… wear…'), 'small')));
    const circles = [['b', 'consensus', 0], ['f', word(L, 'marginaux + inédits', 'fringe + new'), 1]].map(([c, l, i]) => grp(g, el('circle', { r: 150, class: `venn ${c}` }), text(i ? 80 : -80, 0, l, 'small')));
    const quarter = g.appendChild(text(640, 640, word(L, '¼ en commun : il reste à découvrir', '¼ shared: more to find'), 'mid'));
    const nar = narrator(g, ['think', 'worry', 'oh', 'smile']);
    return (k, u, t) => {
      cousins.forEach((c, i) => { put(c, 460 + i * 180, 340, k === 1 ? at(k, u, 1, i * .3) : k === 0 ? at(k, u, 0, i * .2) * .7 : 0); c.blink(t, i); }); show(same, k === 1 ? fade(k, u, 1, 1.5) : 0);
      echo.forEach((e, i) => { e.setAttribute('x', 200 + (i % 4) * 280); e.setAttribute('y', 200 + Math.floor(i / 4) * 140 + Math.sin(t * 2 + i) * 8); show(e, k === 2 ? clamp(u * 1.5 - i * .15) : 0); });
      circles.forEach((c, i) => put(c, 560 + i * 160, 360, k === 3 ? at(k, u, 3, i * .4) : 0)); show(quarter, k === 3 ? fade(k, u, 3, 1.4) : 0);
      nar(k, u, t);
    };
  },
  path(g, L) {
    const lad = grp(g, prop('ladder', 3)), hole = g.appendChild(el('circle', { r: 20, class: 'diffring' }));
    const N = 30, base = Array.from({ length: N }, (_, i) => g.appendChild(buddy(i < 3 ? 'smile' : 'sleep', 12)));
    const fresh = Array.from({ length: 14 }, () => g.appendChild(buddy('wow', 14)));
    const names = (L ? ['moves by itself', 'clusters in contact', 'partner answers live', 'chain of learners'] : ['se déplace seule', 'amas au contact', 'partenaire en direct', 'chaîne d’apprenants']).map((s) => pill(g, s, 'b', 270));
    const gates = (L ? ['aim at someone', 'stop when answered', 'insist or change'] : ['viser quelqu’un', 'arrêt à la réponse', 'insister ou changer']).map((s) => pill(g, s, 'g', 300));
    const swap = g.appendChild(text(640, 600, 'S00 ⇄ S01', 'mid')), frozen = g.appendChild(text(640, 660, word(L, 'propositions · rien n’est testé · l’original reste gelé', 'proposals · nothing tested · the original stays frozen'), 'mid'));
    const curve = (p) => [100 + p * 1000, 470 - Math.sin(p * Math.PI * 2.2) * 90 - p * 110];
    const nar = narrator(g, ['think', 'wow', 'smile', 'proud']);
    return (k, u, t) => {
      put(lad, 640, 360, k === 0 ? at(k, u, 0) * 2.4 : 0); hole.setAttribute('cx', 640); hole.setAttribute('cy', 360 - 1.4 * 24); put(hole, 0, 0, k === 0 ? 1 + Math.sin(t * 5) * .06 : 0);
      base.forEach((b, i) => { put(b, ...curve(i / (N - 1)), k >= 1 ? 1 : 0); b.blink(t, i); });
      fresh.forEach((f, i) => { const [x, y] = curve((i + .5) / 14); put(f, x, y - 40 + Math.sin(t * 3 + i) * 4, k >= 1 ? pop(u * 1.4 - i * .06 + (k > 1) * 3) : 0); f.blink(t, i); });
      names.forEach((n, i) => { put(n, 205 + i * 290, 150, k === 1 ? at(k, u, 1, 1.4 + i * .4) : 0); });
      gates.forEach((n, i) => put(n, 290 + i * 350, 150, k === 2 ? at(k, u, 2, 1.6 + i * .5) : 0)); show(swap, k === 2 ? fade(k, u, 2, .4) : 0);
      show(frozen, fade(k, u, 3));
      nar(k, u, t);
    };
  },
  honest(g, L) {
    const otto = g.appendChild(buddy('nope', 100));
    const no = [word(L, 'parler', 'speak'), word(L, 'apprendre', 'learn'), word(L, 'se souvenir', 'remember')].map((s) => { const n = pill(g, s, 'b', 300); n.append(path('M-110 0H110', 'strike')); return n; });
    const tiers = Array.from({ length: 9 }, (_, i) => g.appendChild(el('rect', { x: 140 + i * 115, width: 119, rx: 6, class: 'step' })));
    const tiny = g.appendChild(buddy('smile', 20)), flag = grp(g, prop('flag'));
    const promise = [word(L, 'mesuré', 'measured'), word(L, 'rejouable', 'replayable'), word(L, 'limite écrite', 'limit written')].map((s) => pill(g, s, 'g', 260));
    return (k, u, t) => {
      put(otto, 640, 300, k === 0 ? 1 : 0); otto.blink(t);
      no.forEach((n, i) => put(n, 260 + i * 380, 560, k === 0 ? at(k, u, 0, .6 + i * .4) : 0));
      tiers.forEach((r, i) => { const h = (i + 1) * 56 * (k >= 1 ? (k === 1 ? ease(u * 1.2 - i * .06) : 1) : 0); r.setAttribute('y', 680 - h); r.setAttribute('height', h); });
      put(tiny, 190, 680 - 56 - 22 - Math.abs(Math.sin(t * 3)) * 8, k >= 1 ? 1 : 0); tiny.set(k === 2 ? 'proud' : 'smile'); tiny.blink(t); put(flag, 1110, 680 - 9 * 56 - 40, k >= 1 ? 1 : 0);
      promise.forEach((p, i) => put(p, 360 + i * 300, 150, at(k, u, 2, i * .4)));
    };
  },
  next(g, L) {
    const thermo = grp(g, prop('thermo')), bench = grp(g, box(-90, -50, 180, 100, 'card', 20), text(0, 12, word(L, 'banc', 'bench'), 'mid')), books = grp(g, prop('books'));
    const labs = [word(L, 'une mesure fiable', 'a reliable measure'), word(L, 'tester les marches', 'test the steps'), word(L, 'lire en 7 langues', 'read in 7 languages')].map((s) => g.appendChild(text(0, 0, s, 'mid')));
    const crew = ['proud', 'think', 'smile'].map((m) => g.appendChild(buddy(m, 30)));
    const nar = narrator(g, ['think', 'proud']);
    return (k, u, t) => {
      put(thermo, 320, 330, at(k, u, 0) * 1.6); put(bench, 640, 330, k === 1 ? at(k, u, 1) * 1.2 : 0); put(books, 960, 330, k === 1 ? at(k, u, 1, 1.2) * 1.4 : 0);
      labs.forEach((l, i) => { l.setAttribute('x', 320 + i * 320); l.setAttribute('y', 480); show(l, i === 0 ? fade(k, u, 0, .6) : k === 1 ? fade(k, u, 1, i * .8) : 0); });
      crew.forEach((c, i) => { put(c, 320 + i * 320, 580 + Math.sin(t * 3 + i) * 5, i === 0 ? at(k, u, 0, .8) : k === 1 ? at(k, u, 1, i * .8) : 0); c.blink(t, i); });
      nar(k, u, t);
    };
  },
  outro(g, L) {
    const crew = ['smile', 'oh', 'proud', 'sleep', 'wow', 'wink', 'think'].map((m) => g.appendChild(buddy(m, 36)));
    const bet = g.appendChild(text(640, 170, word(L, 'comprendre la compréhension', 'understanding understanding'), 'big'));
    const site = [word(L, 'la carte', 'the map'), word(L, 'les résultats', 'the results'), word(L, 'les données', 'the data'), word(L, 'nos échecs', 'our failures')].map((s) => pill(g, s, 'r', 250));
    const end = g.appendChild(text(640, 640, word(L, 'oui · non · seulement avec autre chose', 'yes · no · only with something more'), 'big'));
    return (k, u, t) => {
      show(bet, fade(k, u, 0));
      crew.forEach((c, i) => { put(c, 260 + i * 126, 380 + Math.sin(t * 4 + i) * (k === 2 ? 18 : 4), at(k, u, 0, .4 + i * .12)); c.set(k === 2 ? ['wow', 'proud', 'smile', 'wink', 'wow', 'proud', 'smile'][i] : c.mood); c.blink(t, i); });
      site.forEach((s, i) => put(s, 250 + i * 260, 520, k === 1 ? at(k, u, 1, i * .35) : 0));
      show(end, fade(k, u, 2, .5));
    };
  },
};

// ---- the player
export function film() {
  const root = $('film'), stage = $('film-stage'), cap = $('film-cap'), playB = $('film-play'), prevB = $('film-prev'), nextB = $('film-next');
  const chapters = $('film-chapters'), bar = $('film-bar'), voiceNote = $('film-voice'), langBox = $('film-lang'), transcript = $('film-transcript');
  let L = 0, si = 0, k = 0, playing = false, t0 = 0, lineT0 = 0, tick = null, raf = 0, timer = 0, voice = null, voiceOn = true, said = 0, dur = 0;
  const svg = stage.appendChild(el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', class: 'film-svg' }));
  const layer = svg.appendChild(el('g'));
  const synth = 'speechSynthesis' in window ? speechSynthesis : null;
  const player = new Audio(), next = new Audio(); player.preload = 'auto'; next.preload = 'auto';
  const BASE = new URL('../assets/film/', import.meta.url);

  // Recorded narration is used only when its hash matches the text on screen.
  const HASH = {};
  const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 10);
  const ready = (async () => { try { for (const [lang, m] of Object.entries(AUDIO)) { const li = LANGS.indexOf(lang); for (const [key, [, h]] of Object.entries(m)) { const [a, b] = key.split('.').map(Number); const line = scenes[a]?.lines[b]; if (line && await sha(line[li]) === h) HASH[`${lang}:${key}`] = true; } } } catch { /* no subtle crypto: browser voice only */ } sayVoice(); })();
  const recorded = (a, b) => (HASH[`${LANGS[L]}:${a}.${b}`] ? new URL(`${LANGS[L]}/${AUDIO[LANGS[L]][`${a}.${b}`][0]}`, BASE).href : null);
  const hasRecorded = () => Object.keys(HASH).some((x) => x.startsWith(`${LANGS[L]}:`));

  const pickVoice = () => {
    if (!synth) return null;
    const vs = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith(LANGS[L]));
    return vs.find((v) => /natural|neural|google|online|premium|enhanced/i.test(v.name)) || vs.find((v) => v.localService) || vs[0] || null;
  };
  function sayVoice() {
    voice = pickVoice();
    voiceNote.textContent = !voiceOn ? word(L, 'Voix coupée : sous-titres seuls.', 'Voice off: captions only.')
      : hasRecorded() ? word(L, 'Voix enregistrée avec Piper, une synthèse vocale libre (voix « siwis »).', 'Narration recorded with Piper, a free speech synthesiser.')
        : voice ? word(L, `Voix : ${voice.name}, fournie par ton navigateur.`, `Voice: ${voice.name}, provided by your browser.`)
          : word(L, 'Pas de voix dans cette langue sur ce navigateur : sous-titres seuls.', 'No voice in this language on this browser: captions only.');
  }
  synth?.addEventListener?.('voiceschanged', sayVoice);

  const estimate = (s) => 1.4 + s.length / 14;
  const lines = () => scenes[si].lines;
  const build = () => {
    const sc = scenes[si];
    const g = el('g'); layer.replaceChildren(g);
    g.append(el('rect', { x: 0, y: 0, width: W, height: H, class: `bg bg-${sc.part % 3}` }));
    const title = g.appendChild(text(40, 56, `${parts[sc.part][L]} · ${sc.title[L]}`, 'scene-t', 'start'));
    title.setAttribute('aria-hidden', 'true');
    const inner = g.appendChild(el('g'));
    tick = BUILD[sc.id](inner, L);
    svg.setAttribute('aria-label', `${sc.title[L]}. ${sc.lines.map((l) => l[L]).join(' ')}`);
    [...chapters.querySelectorAll('button')].forEach((b, i) => b.setAttribute('aria-current', String(i === si)));
  };
  const caption = () => { cap.textContent = lines()[k][L]; cap.lang = LANGS[L]; };
  const progress = () => {
    const into = playing ? clamp((performance.now() - lineT0) / 1000 / (dur || estimate(lines()[k][L])), 0, .99) : 0;
    bar.style.width = `${(100 * (si + (k + into) / lines().length) / scenes.length).toFixed(2)}%`;
  };
  const frame = () => {
    const now = performance.now(), t = (now - t0) / 1000, u = calm() ? 99 : (now - lineT0) / 1000;
    tick?.(k, u, calm() ? 0 : t); progress();
    cancelAnimationFrame(raf); if (!calm() && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const stop = () => { clearTimeout(timer); said++; player.onended = null; player.onerror = null; player.pause(); if (synth) synth.cancel(); };
  const advance = () => {
    if (k < lines().length - 1) { k++; startLine(); return; }
    if (si < scenes.length - 1) { si++; k = 0; build(); t0 = performance.now(); startLine(); return; }
    pause(); playB.textContent = word(L, 'Revoir', 'Replay'); si = 0; k = 0; build(); caption();
  };
  const preloadNext = () => { const [a, b] = k < lines().length - 1 ? [si, k + 1] : [si + 1, 0]; const url = scenes[a] && recorded(a, b); if (url) next.src = url; };
  function speakBrowser(s, me, fallback) {
    if (voiceOn && voice && synth) {
      const ut = new SpeechSynthesisUtterance(s); ut.voice = voice; ut.lang = voice.lang; ut.rate = 1.0;
      ut.onend = () => { if (me === said && playing) timer = setTimeout(advance, 450); };
      ut.onerror = () => { if (me === said && playing) timer = setTimeout(advance, fallback); };
      synth.speak(ut);
      timer = setTimeout(() => { if (me === said && playing && !synth.speaking) advance(); }, fallback * 2.5);
    } else timer = setTimeout(() => { if (me === said && playing) advance(); }, fallback);
  }
  function startLine() {
    stop(); caption(); lineT0 = performance.now(); dur = 0; frame();
    if (!playing) return;
    const s = lines()[k][L], me = said, fallback = (estimate(s) + .5) * 1000, url = voiceOn && recorded(si, k);
    if (url) {
      player.src = url;
      player.onloadedmetadata = () => { if (me === said) dur = player.duration + .45; };
      player.onended = () => { if (me === said && playing) timer = setTimeout(advance, 450); };
      player.onerror = () => { if (me === said && playing) speakBrowser(s, me, fallback); };
      player.play().catch(() => { if (me === said && playing) speakBrowser(s, me, fallback); });
      preloadNext();
    } else speakBrowser(s, me, fallback);
  }
  function play() {
    playing = true; playB.textContent = word(L, 'Pause', 'Pause'); playB.setAttribute('aria-pressed', 'true'); root.classList.add('on');
    startLine();
  }
  function pause() { playing = false; stop(); playB.textContent = word(L, 'Lecture', 'Play'); playB.setAttribute('aria-pressed', 'false'); root.classList.remove('on'); frame(); }
  const goScene = (i, line = 0) => { stop(); si = clamp(i, 0, scenes.length - 1); k = line; build(); t0 = performance.now(); startLine(); };

  const fillChrome = () => {
    chapters.replaceChildren(...parts.map((p, pi) => {
      const d = document.createElement('div'), h = document.createElement('p'); d.className = 'film-part'; h.textContent = p[L]; d.append(h);
      scenes.forEach((sc, i) => { if (sc.part !== pi) return; const b = document.createElement('button'); b.type = 'button'; b.textContent = sc.title[L]; b.setAttribute('aria-current', String(i === si)); b.addEventListener('click', () => goScene(i)); d.append(b); });
      return d;
    }));
    transcript.replaceChildren(...scenes.map((sc) => { const d = document.createElement('div'), h = document.createElement('h3'); h.textContent = sc.title[L]; d.append(h); for (const l of sc.lines) { const p = document.createElement('p'); p.textContent = l[L]; d.append(p); } return d; }));
    transcript.lang = LANGS[L]; chapters.lang = LANGS[L];
    prevB.textContent = word(L, '‹ Avant', '‹ Back'); nextB.textContent = word(L, 'Après ›', 'Next ›');
    if (!playing) playB.textContent = word(L, 'Lecture', 'Play');
    $('film-voice-b').textContent = voiceOn ? word(L, 'Couper la voix', 'Voice off') : word(L, 'Mettre la voix', 'Voice on');
    $('film-time').textContent = word(L, `${scenes.length} scènes · environ ${Math.round(scenes.flatMap((s) => s.lines).reduce((a, l) => a + estimate(l[L]) + .5, 0) / 60)} minutes`, `${scenes.length} scenes · about ${Math.round(scenes.flatMap((s) => s.lines).reduce((a, l) => a + estimate(l[L]) + .5, 0) / 60)} minutes`);
    sayVoice();
  };
  playB.addEventListener('click', () => (playing ? pause() : play()));
  prevB.addEventListener('click', () => (k > 0 ? goScene(si, k - 1) : goScene(si - 1, 0)));
  nextB.addEventListener('click', () => (k < lines().length - 1 ? goScene(si, k + 1) : goScene(si + 1)));
  $('film-voice-b').addEventListener('click', () => { voiceOn = !voiceOn; fillChrome(); if (playing) startLine(); });
  for (const [i, lab] of [['0', 'Français'], ['1', 'English']]) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = lab; b.lang = LANGS[i];
    b.addEventListener('click', () => { L = +i; [...langBox.children].forEach((x) => x.setAttribute('aria-pressed', String(x === b))); fillChrome(); goScene(si, k); });
    b.setAttribute('aria-pressed', String(i === '0')); langBox.append(b);
  }
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); } else if (e.key === 'ArrowRight') nextB.click(); else if (e.key === 'ArrowLeft') prevB.click();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); if (!document.hidden) frame(); });
  onMotion(() => frame());
  fillChrome(); build(); caption(); frame(); ready.then(() => {});
}
