// assets/js/render-jogos.js
(() => {
  'use strict';

  function lineupCol(side = {}) {
    const key    = side.key  || '';
    const name   = side.name || '';
    const rodada = window.RODADA || '';
    const alt    = `Escalação provável do ${name} — rodada ${rodada}`;

    return `
      <div class="lineup-col">
        <div class="lineup-card">
          <div class="pitch" data-team="${key}" role="img" aria-label="${alt}"></div>
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

  function anchorSet(team = {}) {
    const ids     = new Set();
    const rawSlug = team?.slug || '';
    const rawKey  = team?.key  || '';
    const rawName = team?.name || '';

    if (rawSlug) ids.add(rawSlug);
    if (rawKey)  ids.add(rawKey);

    const baseSource = rawSlug || rawKey || rawName;
    const base = String(baseSource)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (base) {
      ids.add(base);
      ids.add(base.replace(/-/g, ""));
    }

    return Array.from(ids)
      .map(id => `<span id="${id}"></span>`)
      .join("");
  }

  function jogoSection(jogo = {}) {
    const { id, home, away } = jogo;

    return `
      <section id="${id}" class="jogo">
        ${anchorSet(home)}${anchorSet(away)}
        <div class="col-12 d-flex justify-content-center">
          <div class="custom-provaveis-item">
            <div class="lineups">
              ${lineupCol(home)}${lineupCol(away)}
            </div>
            <div class="arb-slot container-avisosize" data-jogo="${id}"></div>
          </div>
        </div>
      </section>`;
  }

  function render() {
    const root = document.getElementById("jogos-root");
    if (!root || !Array.isArray(window.JOGOS)) return;

    const htmlParts = window.JOGOS.map(jogoSection);
    root.innerHTML = htmlParts.join("\n");

    // arbitragem micro
    window.initArbitragem?.();
  }

  function boot() {
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
