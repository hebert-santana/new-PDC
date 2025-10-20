/* ============================================================
   MAIS INDICADOS — Estado do banner “em andamento” + destrava/render
   ============================================================ */
(() => {
  'use strict';

  // Evita rodar 2x se o arquivo for incluído de novo
  if (window.__indicadosInitDone) return;
  window.__indicadosInitDone = true;

  const CFG_CANDIDATES = ['/assets/data/indicados.json', '/data/indicados.json'];
  const WHATS_LINK = 'https://whatsapp.com/channel/0029VbBFrZ4Gk1FxlriZ7R2I';

  const $lane   = () => document.getElementById('canal-whats-lane');
  const $strong = () => document.getElementById('soon-strong');
  const $sub    = () => document.getElementById('soon-sub');
  const $btn    = () => document.getElementById('cw-btn');

  // cache leve global
  async function fetchCfg() {
    if (!window.__indicadosCfgPromise) {
      window.__indicadosCfgPromise = (async () => {
        let lastErr;
        for (const base of CFG_CANDIDATES) {
          try {
            const url = `${base}${base.includes('?') ? '&' : '?'}_=${Date.now()}`; // cache-bust
            const r = await fetch(url, { cache: 'no-store' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return await r.json();
          } catch (err) { lastErr = err; }
        }
        console.warn('[indicados] não consegui carregar indicados.json:', lastErr);
        return null;
      })();
    }
    return window.__indicadosCfgPromise;
  }

  function applySoonBanner(cfg) {
    const lane = $lane(); if (!lane) return;
    const isSoon = !!(cfg && cfg.comingSoon === true);

    if (isSoon) {
      const defaultStrong = 'O levantamento das indicações está em andamento!';
      const defaultSub    = 'Entre no nosso canal do WhatsApp e seja avisado em primeira mão quando atualizarmos!';
      if ($strong()) $strong().textContent = (cfg?.message?.toString().trim()) || defaultStrong;
      if ($sub())    $sub().textContent    = defaultSub;
      if ($btn())    $btn().href = WHATS_LINK;
      lane.hidden = false;
    } else {
      lane.hidden = true;
    }
  }

  function applyGlobalState(cfg) {
    const html = document.documentElement;
    const isSoon   = !!(cfg && cfg.comingSoon === true);
    const hideAll  = !!(isSoon && cfg?.hideWhenSoon);  // só esconde tudo se as duas flags vierem juntas
    const skeleton = !!(hideAll && cfg?.useSkeleton);

    html.classList.toggle('indicados--soon-hidden', hideAll);
    html.classList.toggle('indicados--skeleton',    skeleton);
  }

  // Ponte que tenta chamar seu render “de verdade”
  async function renderIndicados() {
    try {
      const load = window.carregarJogadores
                || window.carregarIndicados
                || window.loadIndicados
                || null;

      const render = window.renderJogadores
                  || window.renderIndicados
                  || window.mountIndicados
                  || null;

      if (typeof load === 'function') await load();
      if (typeof render === 'function') {
        await render();
      } else {
        // avisa outros módulos
        document.dispatchEvent(new CustomEvent('indicados:render-request'));
      }
    } catch (e) {
      console.error('[indicados] falha ao renderizar jogadores:', e);
    }
  }

  async function boot() {
    const cfg = await fetchCfg().catch(() => null) || {};

    // 1) aviso + classes globais
    applySoonBanner(cfg);
    applyGlobalState(cfg);

    // 2) se NÃO estiver em “esconder tudo”, destrava e renderiza
    const hideAll = !!(cfg?.comingSoon && cfg?.hideWhenSoon);
    if (!hideAll) {
      document.documentElement.classList.remove('indicados--skeleton', 'indicados--soon-hidden');

      // força mostrar containers caso alguém tenha ocultado via atributo
      ['campinho-mais-indicados'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.hidden = false;
      });

      await renderIndicados();
    }

    // fallback visual: se o aviso aparecer/desaparecer, não esconda campinho por aqui
    const lane = $lane();
    if (lane) {
      const sync = () => { document.body.classList.remove('indicados--soon-hidden'); };
      sync();
      new MutationObserver(sync).observe(lane, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // utilitário público
  window.getIndicadosConfig = () => fetchCfg();
})();
