// /assets/js/navbar.js
(function () {
  function norm(u) {
    try {
      return new URL(u, location.origin)
        .pathname.replace(/\/index\.html$/, '/');
    } catch {
      return u;
    }
  }

  function applyInfluencerMode() {
    try {
      const influMode = localStorage.getItem('pdc_influ_mode') === '1';
      if (!influMode) return;

      // troca TODOS os links raiz ("/") para /influencers.html
      document.querySelectorAll('a[href="/"]').forEach(a => {
        a.setAttribute('href', '/influencers.html');
      });
    } catch {}
  }

  function markActiveLink() {
    const here = norm(location.href);

    // desktop
    document.querySelectorAll('.hero-buttons .btn-nav').forEach(a => {
      if (norm(a.href) === here) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });

    // mobile
    document.querySelectorAll('.nav-shortcut').forEach(a => {
      if (norm(a.href) === here) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  function init() {
    const nav = document.querySelector('.hero-buttons, .nav-shortcuts');
    if (!nav) {
      // navbar ainda não injetada, tenta de novo
      return setTimeout(init, 120);
    }
    applyInfluencerMode();
    markActiveLink();
  }

  // espera o load + faz um retry se precisar
  window.addEventListener('load', init);
})();
