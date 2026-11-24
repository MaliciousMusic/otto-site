// Port of the E0 world: binary ring, radius-one majority law, SplitMix64 seeds.
// tests/replay.mjs checks it against the recorded runs.
const M = (1n << 64n) - 1n;

export class SplitMix64 {
  constructor(seed) { this.s = BigInt(seed) & M; }
  next() {
    this.s = (this.s + 0x9E3779B97F4A7C15n) & M;
    let v = this.s;
    v = ((v ^ (v >> 30n)) * 0xBF58476D1CE4E5B9n) & M;
    v = ((v ^ (v >> 27n)) * 0x94D049BB133111EBn) & M;
    return v ^ (v >> 31n);
  }
  unit() { return Number(this.next() >> 11n) / 2 ** 53; }
  index(n) {
    const u = BigInt(n), t = ((M + 1n) - u) % u;
    for (;;) { const v = this.next(); if (v >= t) return Number(v % u); }
  }
}

export const seeded = (seed, n, p) => {
  const r = new SplitMix64(seed);
  return Array.from({ length: n }, () => (r.unit() < p ? 1 : 0));
};

const maj = (s, i, n) => (s[(i + n - 1) % n] + s[i] + s[(i + 1) % n] >= 2 ? 1 : 0);

export const step = (s) => s.map((_, i) => maj(s, i, s.length));

export const stepInOrder = (s, rng) => {
  const n = s.length, out = s.slice(), order = [...out.keys()];
  for (let i = n - 1; i > 0; i--) { const j = rng.index(i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  for (const i of order) out[i] = maj(out, i, n);
  return out;
};

export const same = (a, b) => a.every((v, i) => v === b[i]);

export const settle = (s, stepper = step, max = 128) => {
  let t = 0;
  for (; t < max; t++) { const n = stepper(s); if (same(n, s)) break; s = n; }
  return { state: s, ticks: t };
};

// Occupied runs on the ring.
export const clusters = (s) => {
  if (s.every(Boolean)) return 1;
  return s.filter((v, i) => v && !s[(i + s.length - 1) % s.length]).length;
};

// Ring distance from site i to the nearest site whose two neighbours differ.
export const borderDistance = (s, i) => {
  const n = s.length;
  for (let d = 0; d <= n / 2; d++)
    for (const j of [(i + d) % n, (i - d + n) % n])
      if (s[(j + n - 1) % n] !== s[(j + 1) % n]) return d;
  return Infinity;
};
