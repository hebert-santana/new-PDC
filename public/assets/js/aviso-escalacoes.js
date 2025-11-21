/* Aviso de escalações em andamento */
(() => {
  'use strict';
  if (window.__avisoEscInitDone) return;
  window.__avisoEscInitDone = true;

  const CFGS = ['/assets/data/aviso-escalacoes.json'];
  const WHATS_LINK = 'https://whatsapp.com/channel/0029VbBFrZ4Gk1FxlriZ7R2I'; // canal oficial

  async function getCfg() {
    for (const u of CFGS) {
      try {
        const r = await fetch(u + '?_=' + Date.now(), { cache: 'no-store' });
        if (r.ok) return r.json();
      } catch {
        /* ignora erro de rede */
      }
    }
    return null;
  }

  function renderNotice(message) {
    const el = document.createElement('section');
    el.id = 'aviso-escalacoes';
    el.className = 'esc-alert';

    el.innerHTML = `
      <div class="esc-alert-main">
        <div class="esc-alert-icon" aria-hidden="true">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div class="esc-alert-body">
          <h3 class="esc-alert-title">Escalações em andamento</h3>
          <p class="esc-alert-text">${message}</p>
        </div>
      </div>

      <div class="esc-alert-cta">
        <a class="esc-alert-btn" href="${WHATS_LINK}" target="_blank" rel="noopener">
          <i class="bi bi-whatsapp"></i>
          <span>acessar canal</span>
        </a>
      </div>
    `;

    return el;
  }

  async function boot() {
    const cfg = await getCfg() || {};

    // se não estiver em "comingSoon" E pedir pra esconder nesse caso, não mostra
    if (!cfg.comingSoon && cfg.hideWhenSoon) return;

    const msg =
      cfg.message ||
      'O levantamento das escalações está em andamento. Volte em alguns minutos.';

    const nav  = document.querySelector('#provaveis-container [data-include="navbar-equipes"]');
    const root = document.querySelector('#jogos-root');
    const el   = renderNotice(msg);

    if (nav) {
      nav.insertAdjacentElement('afterend', el);
    } else if (root) {
      root.insertAdjacentElement('beforebegin', el);
    } else {
      document.body.appendChild(el);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
