// Gera o bloco dos jogos no #jogos-root a partir de window.JOGOS.
// Precarrega TODAS as escalações (JPG) em lotes para evitar "buracos".
(function () {
  const ESC_BASE = "/assets/img/escalacoes";

  // ===== PRELOAD (idempotente, em lotes) ======================
  let _preloaded = false;

  function preloadEscalacoes() {
    if (_preloaded || !Array.isArray(window.JOGOS)) return;
    _preloaded = true;

    // Colete todas as URLs .png (sem duplicar)
    const seen = new Set();
    const queue = [];
    window.JOGOS.forEach(j => {
      const h = j?.home?.key ? `${ESC_BASE}/${j.home.key}.png` : null;
      const a = j?.away?.key ? `${ESC_BASE}/${j.away.key}.png` : null;
      if (h && !seen.has(h)) { seen.add(h); queue.push(h); }
      if (a && !seen.has(a)) { seen.add(a); queue.push(a); }
    });

    // Concurrency moderada (boa para 3G/4G). Ajuste se quiser: 2~4.
    const CONCURRENCY = 3;
    let inFlight = 0, i = 0;

    function kick() {
      while (inFlight < CONCURRENCY && i < queue.length) {
        const src = queue[i++];
        const img = new Image();
        try { img.fetchPriority = "low"; } catch (e) {}
        img.decoding = "async";
        inFlight++;
        img.onload = img.onerror = () => { inFlight--; kick(); };
        img.src = src; // dispara o download (só cache, não entra no DOM)
      }
    }
    kick();
  }

  // expõe para outros scripts (club-grid) chamarem quando quiserem
  window.preloadEscalacoes = preloadEscalacoes;

  // ===== VIEW ==================================================
function lineupCol(side){
  const key  = side.key  || "";
  const name = side.name || "";
  const alt  = `Escalação provável do ${name} — rodada ${window.RODADA || ""}`;
  const overlay = `${ESC_BASE}/${key}.png`;
  const fieldBg = `/assets/img/campinhos/campinho.png`;

  return `
    <div class="lineup-col">
      <div class="lineup-card" style="position:relative;width:100%;max-width:631px;aspect-ratio:631/892;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.12)">
        <!-- campinho atrás -->
        <img
          src="${fieldBg}"
          alt=""
          aria-hidden="true"
          style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:0">

        <!-- jogadores na frente -->
        <img
          class="lineup-img players-layer"
          src="${overlay}"
          alt="${alt}"
          loading="lazy" fetchpriority="low" decoding="async"
          width="631" height="892"
          style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:transparent!important;z-index:1">
      </div>

      <div class="status-card" data-team="${key}" aria-live="polite">
        <div class="status-head">
          <strong class="status-team">${name}</strong>
          <span class="status-badge">Desfalques</span>
        </div>
        <div class="status-body">
          <div class="status-group">
            <div class="sg-title"><span class="ico-injury"><i class="bi bi-activity"></i></span> Lesionados</div>
            <div class="tag-list" data-role="lesionados"></div>
          </div>
          <div class="status-group">
            <div class="sg-title"><span class="ico-susp"><i class="bi bi-slash-circle"></i></span> Suspensos</div>
            <div class="tag-list" data-role="suspensos"></div>
          </div>
        </div>
      </div>
    </div>`;
}


  // múltiplas âncoras equivalentes (slug, sem acento, sem hífen)
  function anchorSet(team){
    const ids = new Set();

    const rawSlug = team?.slug || "";
    const rawKey  = team?.key  || "";
    const rawName = team?.name || "";

    if (rawSlug) ids.add(rawSlug);
    if (rawKey)  ids.add(rawKey);

    const baseSource = rawSlug || rawKey || rawName;
    const base = String(baseSource)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (base) {
      ids.add(base);                 // "sao-paulo"
      ids.add(base.replace(/-/g,"")) // "saopaulo"
    }

    return Array.from(ids).map(id => `<span id="${id}"></span>`).join("");
  }

  function jogoSection({id, home, away}, isLast){
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
    ${isLast ? "" : `<hr class="separador">`}`;
  }

  function render(){
    const root = document.getElementById('jogos-root');
    if (!root || !Array.isArray(window.JOGOS)) return;

    // aquece o cache das escalações assim que possível
    preloadEscalacoes();

    const html = window.JOGOS
      .map((j, idx) => jogoSection(j, idx === window.JOGOS.length - 1))
      .join("\n");
    root.innerHTML = html;
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
