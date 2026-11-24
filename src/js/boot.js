// Runs before the first paint: marks that scripts work and applies the visitor's display choices.
(function () {
  var h = document.documentElement, v;
  h.classList.add('js');
  // other sites share this origin and its storage, so the stored value is never trusted
  try { v = JSON.parse(localStorage.getItem('otto-display')); } catch (e) { /* storage can be blocked */ }
  v = v || {};
  h.dataset.detail = v.detail === 'full' ? 'full' : 'simple';
  h.dataset.motion = v.motion === 'on' || v.motion === 'off' ? v.motion : (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on');
  h.dataset.letters = v.letters === 'plain' ? 'plain' : 'faces';
})();
