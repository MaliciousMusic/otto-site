import { prefs } from './prefs.js';
import { faces } from './faces.js';

// Each part loads only on the pages that contain it.
const PARTS = [
  ['#ring', './hero.js', 'hero'], ['#box', './play.js', 'box'], ['#stairs', './play.js', 'climb'], ['#loop', './play.js', 'loop'],
  ['#map', './map.js', 'map'], ['#law-chart', './results.js', 'results'], ['#lab-canvas', './lab.js', 'lab'], ['#spot', './spot.js', 'spot'],
  ['.find', './find.js', 'find'], ['#try', './font.js', 'font'], ['#film', './film.js', 'film'],
];
prefs();
faces();
for (const [sel, file, name] of PARTS)
  if (document.querySelector(sel)) import(file).then((m) => m[name]()).catch((e) => console.error(name, e));
