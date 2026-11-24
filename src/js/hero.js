import { el, face, watch } from './cell.js';
import { seeded, step, same, borderDistance } from './world.js';
import { calm, roving } from './prefs.js';

const N = 32, R = 268, C = 320, FIRST = 183807, COUNT = 64;
const COLOR = ['var(--blue)', 'var(--green)'];

export function hero() {
  const $ = (id) => document.getElementById(id);
  const svg = $('ring'), say = $('ring-say'), tally = $('ring-tally'), tag = $('ring-world'), guessBox = $('ring-guess');
  const at = (i) => { const a = (i / N) * 2 * Math.PI - Math.PI / 2; return [C + R * Math.cos(a), C + R * Math.sin(a)]; };
  const [gSkin, gBridge, gFlesh, gInner, gFaces] = ['skin', 'bridge', 'flesh', 'inner', 'faces'].map((c) => svg.appendChild(el('g', { class: c })));
  const cells = Array.from({ length: N }, (_, i) => {
    const [x, y] = at(i), [x2, y2] = at(i + 1), seg = { x1: x, y1: y, x2, y2 };
    const c = {
      skin: gSkin.appendChild(el('circle', { cx: x, cy: y, r: 20.5 })),
      bridge: gBridge.appendChild(el('line', seg)),
      flesh: gFlesh.appendChild(el('circle', { cx: x, cy: y, r: 16.6 })),
      inner: gInner.appendChild(el('line', seg)),
      hold: gFaces.appendChild(el('g', { transform: `translate(${x} ${y})`, class: 'poke', role: 'button' })),
    };
    c.hold.append(el('circle', { r: 26, class: 'hit' }));
    c.pop = c.hold.appendChild(el('g', { class: 'pop' }));
    c.hold.addEventListener('click', () => poke(i));
    c.hold.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(i); } });
    return c;
  });
  roving(cells.map((c) => c.hold));

  let k = Math.floor(Math.random() * COUNT), state, timer, busy = false, guess = null;
  const count = { near: 0, nearMoved: 0, far: 0, farHealed: 0, guessed: 0, right: 0 };

  function paint(prev) {
    cells.forEach((c, i) => {
      const v = state[i], tied = v === state[(i + 1) % N];
      if (!prev || prev[i] !== v) {
        c.skin.style.fill = c.bridge.style.stroke = c.pop.style.color = COLOR[v];
        c.pop.replaceChildren(face(v ? 'smile' : 'oh'));
        if (prev && !calm()) { c.pop.classList.remove('hop'); void c.pop.getBoundingClientRect(); c.pop.classList.add('hop'); }
      }
      c.bridge.style.strokeWidth = tied ? 19 : 0;
      c.inner.style.strokeWidth = tied ? 11 : 0;
      c.hold.setAttribute('aria-label', `Cell ${i + 1} of ${N}, ${v ? 'green' : 'blue'}`);
    });
  }

  function run(done, t = 0) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const next = step(state);
      if (same(next, state) || t > 128) { busy = false; return done(t); }
      const prev = state; state = next; paint(prev);
      run(done, t + 1);
    }, calm() ? 60 : 620);
  }

  function fresh() {
    const seed = FIRST + k; k = (k + 1) % COUNT;
    state = seeded(seed, N, .5); busy = true; paint();
    tag.textContent = `World ${seed}`;
    say.textContent = 'Each cell copies the majority around it.';
    run((t) => { say.textContent = `Settled in ${t} ${t === 1 ? 'step' : 'steps'}. Guess, then poke a cell.`; guessBox.hidden = false; });
  }

  const row = (a, b) => {
    const d = document.createElement('div'), s = document.createElement('span'), t = document.createElement('strong');
    s.textContent = a; t.textContent = b; d.append(s, t); return d;
  };
  function poke(i) {
    if (busy) return;
    busy = true;
    const base = state.slice(), d = borderDistance(base, i), bet = guess;
    const prev = state; state = state.slice(); state[i] ^= 1; paint(prev);
    run(() => {
      const healed = same(state, base);
      if (d < 2) { count.near++; if (!healed) count.nearMoved++; } else { count.far++; if (healed) count.farHealed++; }
      let verdict = '';
      if (bet) { const ok = (bet === 'heal') === healed; count.guessed++; if (ok) count.right++; verdict = ok ? 'Well guessed. ' : 'Not this time. '; }
      say.textContent = verdict + (healed ? 'It healed: you poked deep inside.' : 'It moved: you poked near a border.');
      const rows = [];
      if (count.near) rows.push(row('Near a border', `${count.nearMoved} of ${count.near} moved`));
      if (count.far) rows.push(row('Deep inside', `${count.farHealed} of ${count.far} healed`));
      if (count.guessed) rows.push(row('Your guesses', `${count.right} of ${count.guessed} right`));
      tally.replaceChildren(...rows); tally.hidden = false;
    });
  }

  const bets = [...guessBox.querySelectorAll('button')];
  bets.forEach((b) => b.addEventListener('click', () => {
    guess = guess === b.dataset.guess ? null : b.dataset.guess;
    bets.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.guess === guess)));
  }));
  $('ring-new').addEventListener('click', fresh);
  fresh();
  watch(svg, 1.6);
}
