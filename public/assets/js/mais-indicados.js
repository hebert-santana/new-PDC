/* ============================================================
   1) FLAGS RÁPIDAS  — ativa classes na <html> e aceita QS
   ============================================================ */
(() => {
  'use strict';
  // merge com defaults sem perder overrides prévios
  window.INDICADOS_FLAGS = Object.assign({
    captain: true,   // bolinha do capitão
    luxBadge: false, // selo em bolinha p/ luxo
    luxTag: true     // chip "Reserva de luxo" no banco
  }, window.INDICADOS_FLAGS || {});

  const root = document.documentElement;
  const set = (flag, cls) => root.classList.toggle(cls, !!flag);

  // 1) aplica padrão
  set(INDICADOS_FLAGS.captain,  'has-captain');
  set(INDICADOS_FLAGS.luxBadge, 'has-lux-badge');
  set(INDICADOS_FLAGS.luxTag,   'has-lux-tag');

  // 2) overrides por querystring (?captain=0&luxTag=1)
  const qs = new URLSearchParams(location.search);
  if (qs.has('captain'))  set(qs.get('captain')  !== '0', 'has-captain');
  if (qs.has('luxBadge')) set(qs.get('luxBadge') !== '0', 'has-lux-badge');
  if (qs.has('luxTag'))   set(qs.get('luxTag')   !== '0', 'has-lux-tag');
})();

/* ============================================================
   2) ESTADO + RENDER  — controla "em andamento" e destrava UI
   ============================================================ */
(() => {
  'use strict';
  if (window.__indicadosInitDone) return;
  window.__indicadosInitDone = true;

  const CFG_CANDIDATES = ['/assets/data/indicados.json', '/data/indicados.json'];
  const WHATS_LINK = 'https://whatsapp.com/channel/0029VbBFrZ4Gk1FxlriZ7R2I';

  const $lane   = () => document.getElementById('canal-whats-lane');
  const $strong = () => document.getElementById('soon-strong');
  const $sub    = () => document.getElementById('soon-sub');
  const $btn    = () => document.getElementById('cw-btn');

  async function fetchCfg(){
    if (!window.__indicadosCfgPromise){
      window.__indicadosCfgPromise = (async () => {
        let lastErr;
        for (const base of CFG_CANDIDATES){
          try{
            const url = `${base}${base.includes('?') ? '&' : '?'}_=${Date.now()}`;
            const r = await fetch(url, { cache:'no-store' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return await r.json();
          }catch(err){ lastErr = err; }
        }
        console.warn('[indicados] não consegui carregar indicados.json:', lastErr);
        return null;
      })();
    }
    return window.__indicadosCfgPromise;
  }

  function applySoonBanner(cfg){
    const lane = $lane(); if (!lane) return;
    const isSoon = !!(cfg && cfg.comingSoon === true);

    if (isSoon){
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

  function applyGlobalState(cfg){
    const html = document.documentElement;
    const isSoon   = !!(cfg && cfg.comingSoon === true);
    const hideAll  = !!(isSoon && cfg?.hideWhenSoon);
    const skeleton = !!(hideAll && cfg?.useSkeleton);
    html.classList.toggle('indicados--soon-hidden', hideAll);
    html.classList.toggle('indicados--skeleton',    skeleton);
  }

  async function renderIndicados(){
    try{
      const load =
        window.carregarJogadores ||
        window.carregarIndicados ||
        window.loadIndicados     ||
        null;

      const render =
        window.renderJogadores ||
        window.renderIndicados ||
        window.mountIndicados  ||
        null;

      if (typeof load === 'function') await load();
      if (typeof render === 'function'){
        await render();
      } else {
        document.dispatchEvent(new CustomEvent('indicados:render-request'));
      }
    }catch(e){
      console.error('[indicados] falha ao renderizar jogadores:', e);
    }
  }

  async function boot(){
    const cfg = await fetchCfg().catch(() => null) || {};
    applySoonBanner(cfg);
    applyGlobalState(cfg);

    const hideAll = !!(cfg?.comingSoon && cfg?.hideWhenSoon);
    if (!hideAll){
      document.documentElement.classList.remove('indicados--skeleton', 'indicados--soon-hidden');
      const ids = ['campinho-mais-indicados'];
      ids.forEach(id => { const el = document.getElementById(id); if (el) el.hidden = false; });
      await renderIndicados();
    }

    const lane = $lane();
    if (lane){
      const sync = () => { document.body.classList.remove('indicados--soon-hidden'); };
      sync();
      new MutationObserver(sync).observe(lane, { attributes:true, attributeFilter:['hidden'] });
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }

  window.getIndicadosConfig = () => fetchCfg();
})();

/* ============================================================
   3) SHARE RAIL  — posiciona e garante fallback de render
   ============================================================ */
(() => {
  'use strict';

  function placeShareRail(){
    // deixe vazio se o posicionamento for só por CSS do projeto
    // ou injete aqui se precisar mover nós após o render
  }

  function maybeRenderFallback(){
    const alreadyMounted = document.querySelector('#campinho-mais-indicados .player, #campinho-mais-indicados [data-player]');
    if (alreadyMounted) return;
    document.dispatchEvent(new CustomEvent('indicados:render-request'));
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      placeShareRail();
      setTimeout(maybeRenderFallback, 400);
    }, { once:true });
  } else {
    placeShareRail();
    setTimeout(maybeRenderFallback, 400);
  }
})();

