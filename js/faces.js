// Blinks and glances for text set in Otto Cells. The text itself is never touched.
import { calm } from './prefs.js';

export function faces(root = document) {
  const seen = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => seen[e.isIntersecting ? 'add' : 'delete'](e.target)));
  root.querySelectorAll('.alive').forEach((n) => io.observe(n));
  const still = () => calm() || document.hidden || document.documentElement.dataset.letters === 'plain';

  const blink = () => {
    if (!still()) for (const n of seen) {
      if (Math.random() < .35) continue;
      const cast = `--blk${'abc'[Math.floor(Math.random() * 3)]}`;
      const twice = Math.random() < .2;
      n.animate({ [cast]: twice ? [0, 1, 0, 1, 0] : [0, 1, 0] }, { duration: twice ? 420 : 190, easing: 'ease-in-out' });
    }
    setTimeout(blink, 900 + Math.random() * 1500);
  };
  setTimeout(blink, 1200);

  let px, py, queued = false;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || still()) return;
    px = e.clientX; py = e.clientY;
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      for (const n of seen) {
        const b = n.getBoundingClientRect(), dx = px - b.x - b.width / 2, dy = py - b.y - b.height / 2;
        const f = (d, r) => (Math.max(-1, Math.min(1, d / r))).toFixed(1);
        n.style.setProperty('--gazx', f(dx, 320)); n.style.setProperty('--gazy', f(-dy, 240));
      }
    }, 90);
  }, { passive: true });
}
