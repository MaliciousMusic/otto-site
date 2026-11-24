// node tests/replay.mjs — the in-page world must land exactly where the recorded Rust runs landed.
import assert from 'node:assert/strict';
import R from '../data/results.js';
import { SplitMix64, seeded, settle, stepInOrder, clusters, borderDistance } from '../js/world.js';

let n = 0;
for (const p of ['0.25', '0.5'])
  for (const [seed, before, after] of R.law[p]) {
    const s = seeded(seed, 32, +p);
    assert.equal(clusters(s), before, `seed ${seed} start`);
    assert.equal(clusters(settle(s).state), after, `seed ${seed} end`);
    n += 1;
  }

for (const [seed, distinct] of R.orders) {
  const s = seeded(seed, 32, 0.5);
  const ends = new Set([0, 1, 2, 3].map((k) => {
    const rng = new SplitMix64(910000 + (seed - 183807) * 4 + k);
    return settle(s, (x) => stepInOrder(x, rng)).state.join('');
  }));
  assert.equal(ends.size, distinct, `orders ${seed}`);
  n += 4;
}

for (const size of [32, 64])
  for (const cls of ['0', '1', Object.keys(R.distance[size]).find((k) => k.startsWith('2'))])
    for (const [seed, changed] of R.distance[size][cls]) {
      const base = settle(seeded(seed, size, 0.5)).state;
      const near = +cls[0];
      const i = base.findIndex((_, j) => (near < 2 ? borderDistance(base, j) === near : borderDistance(base, j) >= 2));
      const poked = base.slice(); poked[i] ^= 1;
      assert.equal(+(settle(poked).state.join('') !== base.join('')), changed, `distance ${size}/${cls}/${seed}`);
      n += 1;
    }

const first = seeded(183742, 32, 0.25);
assert.equal(first.reduce((a, b) => a + b) / 32, 0.34375);
assert.equal(settle(first).state.reduce((a, b) => a + b) / 32, 0.1875);

const obs = R.observer;
assert.deepEqual([0, 1, 2, 3].map((k) => obs['4'].filter((p) => p[k]).length), [1, 0, 1, 2]);
assert.deepEqual([0, 1, 2, 3].map((k) => obs['92'].filter((p) => p[k]).length), [22, 22, 17, 32]);
assert.equal(R.reversals.length, 38);
console.log(`ok: ${n + 1} recorded runs reproduced in the page's world`);
