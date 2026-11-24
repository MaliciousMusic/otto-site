// Live filters for the questions and the record, plus the copy-citation button.
export function find() {
  const wire = (form, input, out, sel, word) => {
    const f = document.getElementById(form);
    if (!f) return;
    const q = document.getElementById(input), n = document.getElementById(out), items = [...document.querySelectorAll(sel)].map((e) => [e, e.textContent.toLowerCase()]);
    const run = () => {
      const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      let k = 0;
      for (const [e, t] of items) { const ok = terms.every((x) => t.includes(x)); e.hidden = !ok; k += ok; }
      n.textContent = terms.length ? `${k} ${k === 1 ? word[0] : word[1]} found` : '';
    };
    f.addEventListener('submit', (e) => e.preventDefault());
    q.addEventListener('input', run);
  };
  wire('faq-find', 'faq-q', 'faq-n', '.faq .qa, .gloss dl > div', ['entry', 'entries']);
  wire('rec-find', 'rec-q', 'rec-n', '.rec .entry', ['record', 'records']);
  const copy = document.getElementById('cite-copy');
  copy?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(document.getElementById('cite-text').textContent); copy.textContent = 'Copied'; } catch { copy.textContent = 'Select the text to copy it'; }
  });
}
