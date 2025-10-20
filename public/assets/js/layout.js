// include simples via <div data-include="nome"> → /partials/nome.html
// dá pro gasto. se crescer, vejo build depois. TODO: cache leve em prod.
(function () {
  async function inject(el) {
    const name = el?.getAttribute?.('data-include');
    if (!name) return;

    const src = el.getAttribute('data-src') || `/partials/${name}.html`;
    try {
      const r = await fetch(src, { cache: 'no-store' });
      if (!r.ok) throw new Error(`fetch ${src} → ${r.status}`);
      el.outerHTML = await r.text(); // simples e direto
    } catch (e) {
      console.warn('[include]', src, e); // sem drama
    }
  }

  function run() {
    document.querySelectorAll('[data-include]').forEach(inject);
  }

  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', run)
    : run();
})();
