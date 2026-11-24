// Spot the one that renews itself: nine small illustrated worlds, one ledger of origins.
import { LOOKALIKES } from '../data/lookalikes.js';
import { calm, onMotion } from './prefs.js';

const N = 18, TAU = Math.PI * 2;
const rand = (a) => { let s = a; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };

// A piece: angle, age in seconds, life, origin ('start' | 'in' | 'out'), and how it arrives.
function world(id, i) {
  const rnd = rand(77 + i * 101), start = (k) => ({ a: k / N * TAU, age: 9, life: Infinity, from: 'start' });
  const pieces = Array.from({ length: N }, (_, k) => start(k));
  const flow = id === 'converter' || id === 'external' || id === 'mirror', leak = flow || id === 'decay';
  if (leak) pieces.forEach((p) => { p.life = 9 + rnd() * (id === 'decay' ? 24 : 7); });
  return {
    pieces,
    step(dt, t) {
      for (const p of pieces) p.age += dt;
      pieces.forEach((p, k) => {
        if (id === 'carousel') p.a += dt * .45;
        if (leak && p.age > p.life && !p.gone) { p.gone = true; p.age = 0; }
        if (flow && p.gone && p.age > .9) Object.assign(p, { gone: false, age: 0, life: 3 + rnd() * 6, from: id === 'converter' ? 'in' : 'out' });
        if (id === 'noise' && rnd() < dt * .5) Object.assign(p, { gone: !p.gone, age: 0, from: 'out' });
        p.size = id === 'travel' ? .55 + .45 * (Math.sin(k / N * TAU * 2 - t * 2.4) + 1) : id === 'standing' ? .55 + .45 * (Math.sin(k / N * TAU * 3) * Math.sin(t * 2.4) + 1) : 1;
      });
    },
  };
}

export function spot() {
  const root = document.getElementById('spot'), say = document.getElementById('spot-say'), originBtn = document.getElementById('spot-origin');
  const css = getComputedStyle(document.documentElement), C = (n) => css.getPropertyValue(n).trim();
  const INK = C('--ink'), GREEN = C('--green-d'), BLUE = C('--blue-d'), GREY = C('--rest');
  const info = Object.fromEntries(LOOKALIKES.map((l) => [l.id, l]));
  let cards = [...root.querySelectorAll('.spotcard')].map((b, i) => ({ b, id: b.dataset.id, cv: b.querySelector('canvas'), label: b.querySelector('span'), w: world(b.dataset.id, i) }));
  let origin = false, shown = false, last, t = 0, tries = 0, running = false;

  function draw(c) {
    const ctx = c.cv.getContext('2d'), m = 110;
    ctx.clearRect(0, 0, 220, 220);
    ctx.strokeStyle = C('--sky-2'); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(m, m, 70, 0, TAU); ctx.stroke();
    for (const p of c.w.pieces) {
      const k = Math.min(1, p.age / .8);
      let R = 70, s = p.size ?? 1;
      if (p.gone) { if (c.id === 'noise' || k >= 1) continue; s *= 1 - k; } // fades where it stood
      else if (k < 1) { s *= .3 + .7 * k; if (origin) R = p.from === 'out' ? 70 + 34 * (1 - k) : p.from === 'in' ? 70 - 34 * (1 - k) : 70; }
      ctx.fillStyle = !origin || p.from === 'start' ? (origin ? GREY : INK) : p.from === 'in' ? GREEN : BLUE;
      const x = m + R * Math.cos(p.a), y = m + R * Math.sin(p.a), r = 8.5 * s;
      ctx.beginPath();
      if (origin && p.from === 'out') ctx.rect(x - r, y - r, 2 * r, 2 * r); else ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }
  const frame = (now) => {
    if (!shown || calm() || document.hidden) { running = false; return; }
    const dt = Math.min(.05, (now - (last ?? now)) / 1000); last = now; t += dt;
    for (const c of cards) { c.w.step(dt, t); draw(c); }
    requestAnimationFrame(frame);
  };
  const go = () => { if (!running && shown && !calm()) { running = true; last = undefined; requestAnimationFrame(frame); } };
  const still = () => { for (const c of cards) { for (let i = 0; i < 260; i++) c.w.step(.04, i * .04); draw(c); } };

  function shuffle(quiet) {
    cards = cards.map((c) => [Math.random(), c]).sort((a, b) => a[0] - b[0]).map(([, c]) => c);
    cards.forEach((c, i) => {
      c.name = `Pattern ${'ABCDEFGHI'[i]}`; c.label.textContent = c.name; c.b.className = 'spotcard'; c.b.disabled = false; c.b.setAttribute('aria-pressed', 'false');
      root.append(c.b);
    });
    tries = 0;
    if (!quiet) say.textContent = 'Shuffled. Pick the one that renews itself.';
  }
  cards.forEach((c) => c.b.addEventListener('click', () => {
    if (c.b.classList.contains('known')) { say.textContent = `${c.name}, ${info[c.id].name.toLowerCase()}. ${info[c.id].why}`; return; }
    tries++;
    c.b.classList.add('known', info[c.id].renews ? 'yes' : 'no'); c.b.setAttribute('aria-pressed', 'true');
    c.label.textContent = info[c.id].name;
    say.textContent = info[c.id].renews ? `Yes, in ${tries} ${tries === 1 ? 'try' : 'tries'}. ${info[c.id].why}` : `A look-alike: ${info[c.id].name.toLowerCase()}. ${info[c.id].why}`;
  }));
  originBtn.addEventListener('click', () => {
    origin = !origin; originBtn.setAttribute('aria-pressed', String(origin));
    say.textContent = origin ? 'Round and green: made inside. Square and blue: brought from outside. Grey: there from the start. The amounts never told you that.' : 'Origins hidden.';
    cards.forEach(draw);
  });
  document.getElementById('spot-shuffle').addEventListener('click', () => shuffle());
  shuffle(true); still();
  new IntersectionObserver(([e]) => { shown = e.isIntersecting; go(); }).observe(root);
  onMotion(go);
  document.addEventListener('visibilitychange', go);
}
