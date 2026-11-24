// Display menu: detail level, motion, letters. Also the small-screen menu.
const html = document.documentElement;
export const calm = () => html.dataset.motion === 'off';
export const onMotion = (fn) => addEventListener('otto-motion', fn);
export const smooth = () => (calm() ? 'auto' : 'smooth');

const KEY = 'otto-display';
export function forget() { try { localStorage.removeItem(KEY); } catch { /* blocked */ } }

export function prefs() {
  const radios = [...document.querySelectorAll('#prefs input')];
  for (const r of radios) {
    r.checked = html.dataset[r.name] === r.value;
    r.addEventListener('change', () => {
      html.dataset[r.name] = r.value;
      try { localStorage.setItem(KEY, JSON.stringify({ detail: html.dataset.detail, motion: html.dataset.motion, letters: html.dataset.letters })); } catch { /* blocked */ }
      if (r.name === 'motion') dispatchEvent(new Event('otto-motion'));
    });
  }
  const box = document.getElementById('prefs'), menu = document.getElementById('menu');
  const shut = (focus) => { if (box.open) { box.open = false; if (focus) box.querySelector('summary').focus(); } };
  const menuShut = (focus) => { if (menu.getAttribute('aria-expanded') === 'true') { menu.setAttribute('aria-expanded', 'false'); if (focus) menu.focus(); } };
  addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; if (box.open) shut(true); else menuShut(true); });
  addEventListener('pointerdown', (e) => { if (!e.target.closest('#prefs')) shut(); if (!e.target.closest('.top')) menuShut(); });
  box.addEventListener('focusout', (e) => { if (e.relatedTarget && !box.contains(e.relatedTarget)) shut(); });
  menu.addEventListener('click', () => menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') !== 'true')));

  const f = document.getElementById('forget');
  f?.addEventListener('click', () => { forget(); document.getElementById('forget-say').textContent = 'Erased from this device.'; });
}

// One tab stop for a group of items; arrow keys move inside it.
export function roving(items, pickNext) {
  const go = (i) => { items.forEach((n, j) => n.setAttribute('tabindex', j === i ? '0' : '-1')); };
  go(0);
  items.forEach((n, i) => {
    n.addEventListener('focus', () => go(i));
    n.addEventListener('keydown', (e) => {
      if (!/^Arrow|^Home$|^End$/.test(e.key)) return;
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : pickNext ? pickNext(i, e.key) : (i + (/Right|Down/.test(e.key) ? 1 : -1) + items.length) % items.length;
      if (j == null || j === i) return;
      e.preventDefault(); e.stopPropagation(); items[j].focus();
    });
  });
}
