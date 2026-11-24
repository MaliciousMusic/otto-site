import { hero } from './hero.js';
import { box, climb, loop } from './play.js';
import { map } from './map.js';
import { results } from './results.js';
for (const start of [hero, box, climb, map, results, loop]) {
  try { start(); } catch (e) { console.error(start.name, e); }
}
