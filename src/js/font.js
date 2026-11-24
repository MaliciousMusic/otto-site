const K = [
  ['wght', 'Weight', 400, 700, 1, 700], ['--face', 'Face size', 0, 1, .01, 1], ['--mood', 'Mood', 0, 1, .01, 0], ['--gazx', 'Look left or right', -1, 1, .1, 0],
  ['--gazy', 'Look down or up', -1, 1, .1, 0], ['--blka', 'Eyelids, smilers', 0, 1, .05, 0], ['--blkb', 'Eyelids, wonderers', 0, 1, .05, 0], ['--blkc', 'Eyelids, winkers', 0, 1, .05, 0],
];
export function font() {
  const word = document.getElementById('try'), knobs = document.getElementById('knobs');
  for (const [prop, name, min, max, step, value] of K) {
    const l = document.createElement('label'), i = document.createElement('input');
    Object.assign(i, { type: 'range', min, max, step, value });
    i.addEventListener('input', () => { if (prop === 'wght') word.style.fontWeight = i.value; else word.style.setProperty(prop, i.value); });
    l.append(name, i); knobs.append(l);
  }
  word.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); word.blur(); } });
}
