/* ============================================================
   Share rail (mínimo, sem interferir no estado/aviso)
   ============================================================ */
(() => {
  'use strict';

  function placeShareRail() {
    // se você tiver lógica de posicionamento do rail, coloque aqui.
    // Mantive como no CSS: móvel vira pílula e desktop fixa via CSS/JS do seu projeto
  }

  // Opcional: se a página ainda não montou o campinho após um curto tempo, tenta disparar render
  function maybeRenderFallback() {
    const alreadyMounted = document.querySelector('#campinho-mais-indicados .player, #campinho-mais-indicados [data-player]');
    if (alreadyMounted) return;

    // Se o controlador de estado expôs algo, deixe ele coordenar
    document.dispatchEvent(new CustomEvent('indicados:render-request'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { placeShareRail(); setTimeout(maybeRenderFallback, 400); }, { once: true });
  } else {
    placeShareRail(); setTimeout(maybeRenderFallback, 400);
  }
})();
