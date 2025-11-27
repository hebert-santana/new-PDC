// club-grid.js — monta os jogos no #jogos-root para o pitch-render
(function () {
  'use strict';

  const FIELD_BG = '/assets/img/campinhos/campinho.webp';

  // ===== VIEW: coluna de um time =====
  function lineupCol(side) {
    const key    = side?.key  || '';
    const name   = side?.name || '';
    const rodada = window.RODADA || '';

    return `
      <div class="lineup-col">
        <div class="lineup-card"
             style="position:relative;width:100%;max-width:631px;aspect-ratio:631/892;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.12);background:#020617;">
          
          <!-- Contêiner que o pitch-render vai preencher -->
          <div class="pitch"
               data-team="${key}"
               role="group"
               aria-label="Escalação provável do ${name} — rodada ${rodada}"
               style="position:relative;width:100%;height:100%;background:url('${FIELD_BG}') center/contain no-repeat;">
          </div>
        </div>

        <div class="status-card" data-team="${key}" aria-live="polite">
          <div class="status-head">
            <strong class="status-team">${name}</strong>
            <span class="status-badge">Desfalques</span>
          </div>
          <div class="status-body">
            <div class="status-group">
              <div class="sg-title">
                <span class="ico-injury"><i class="bi bi-activity"></i></span> Lesionados
              </div>
              <div class="tag-list" data-role="lesionados"></div>
            </div>
            <div class="status-group">
              <div class="sg-title">
                <span class="ico-susp"><i class="bi bi-slash-circle"></i></span> Suspensos
              </div>
              <div class="tag-list" data-role="suspensos"></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // múltiplas âncoras equivalentes (slug, sem acento, sem hífen)
  function anchorSet(team) {
    const ids = new Set();

    const rawSlug = team?.slug || '';
    const rawKey  = team?.key  || '';
    const rawName = team?.name || '';

    if (rawSlug) ids.add(rawSlug);
    if (rawKey)  ids.add(rawKey);

    const baseSource = rawSlug || rawKey || rawName;
    const base = String(baseSource)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (base) {
      ids.add(base);                 // "sao-paulo"
      ids.add(base.replace(/-/g,''));// "saopaulo"
    }

    return Array.from(ids)
      .map(id => `<span id="${id}"></span>`)
      .join('');
  }

  function jogoSection({ id, home, away }, isLast) {
    return `
    <section id="${id}" class="jogo">
      <!-- Âncoras para navegação via grid de escudos -->
      ${anchorSet(home)}
      ${anchorSet(away)}

      <div class="col-12 d-flex justify-content-center">
        <div class="custom-provaveis-item">
          <div class="lineups">
            ${lineupCol(home)}
            ${lineupCol(away)}
          </div>
        </div>
      </div>
    </section>
    ${isLast ? '' : '<hr class="separador">'}
    `;
  }

  function render() {
    const root = document.getElementById('jogos-root');
    if (!root || !Array.isArray(window.JOGOS)) return;

    const html = window.JOGOS
      .map((j, idx) => jogoSection(j, idx === window.JOGOS.length - 1))
      .join('\n');

    root.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
