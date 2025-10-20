// Limpador de parâmetros de tracking (compartilhado entre todas as páginas)
(function () {
  if (typeof window === 'undefined') return;
  if (!window.__CLEAN_PARAMS__) return; 

  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const kill = ['fbclid','gclid','gbraid','wbraid','utm_source','utm_medium','utm_campaign','utm_term','utm_content'];

    let changed = false;
    for (const k of kill) if (params.has(k)) { params.delete(k); changed = true; }

    if (changed) {
      const clean = url.pathname + (params.toString() ? '?' + params.toString() : '') + (url.hash || '');
      window.history.replaceState({}, '', clean);
    }
  } catch (e) {}
})();
