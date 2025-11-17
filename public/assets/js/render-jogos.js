(function () {
  'use strict';

  const ESC_BASE = "/assets/img/escalacoes";

  // versão global (fallback) + mapa por time
  let ESC_VER = "r0";
  let ESC_MAP = {};
  let preloaded = false;

  // monta URL da escalação com versão específica do time (ou global se faltar)
  function esc(teamKey = "") {
    const v = ESC_MAP[teamKey] || ESC_VER || "r0";
    return `${ESC_BASE}/${teamKey}.png?v=${encodeURIComponent(v)}`;
  }

  // baixa o manifest sem cache e popula ESC_VER + ESC_MAP
  async function initVersion() {
    try {
      const r = await fetch("/assets/img/escalacoes/manifest.json", { cache: "no-store" });
      if (!r.ok) return;
      const m = await r.json();
      if (m?.version) ESC_VER = m.version;
      if (m?.files && typeof m.files === "object") ESC_MAP = m.files;
    } catch {
      // ignora offline/erro
    }
  }

  // ===== PRELOAD (idempotente, em lotes) =====
  function preloadEscalacoes() {
    if (!Array.isArray(window.JOGOS)) return Promise.resolve();
    if (preloaded) return Promise.resolve();
    preloaded = true;

    const seen = new Set();
    const queue = [];

    for (const j of window.JOGOS) {
      if (j?.home?.key) {
        const u = esc(j.home.key);
        if (!seen.has(u)) {
          seen.add(u);
          queue.push(u);
        }
      }
      if (j?.away?.key) {
        const u = esc(j.away.key);
        if (!seen.has(u)) {
          seen.add(u);
          queue.push(u);
        }
      }
    }

    const CONCURRENCY = 3;
    let inFlight = 0;
    let i = 0;

    return new Promise((resolve) => {
      function kick() {
        while (inFlight < CONCURRENCY && i < queue.length) {
          const src = queue[i++];
          const img = new Image();
          try {
            img.fetchPriority = "low";
          } catch {
            // alguns navegadores não suportam
          }
          img.decoding = "async";
          inFlight++;

          img.onload = img.onerror = () => {
            inFlight--;
            if (i >= queue.length && inFlight === 0) {
              resolve();
            } else {
              kick();
            }
          };

          img.src = src;
        }

        if (i >= queue.length && inFlight === 0) {
          resolve();
        }
      }

      kick();
    });
  }

  // ===== VIEW =====
  function lineupCol(side = {}) {
    const key  = side.key  || "";
    const name = side.name || "";
    const rodada = window.RODADA || "";
    const alt  = `Escalação provável do ${name} — rodada ${rodada}`;

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
    const ids = new Set();
    const rawSlug = team?.slug || "";
    const rawKey  = team?.key  || "";
    const rawName = team?.name || "";

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
      .map((id) => `<span id="${id}"></span>`)
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

    // injeta tudo na página
    root.innerHTML = htmlParts.join("\n");

    // segue fluxo normal
    preloadEscalacoes();
    window.initArbitragem?.();
  }

  // ===== Botão "Atualizar escalações" =====
  function wireRefreshButton() {
    const btn = document.getElementById("btn-refresh-esc");
    if (!btn) return;

    const set = (t, s, cls = []) => {
      btn.className = ["btn-refresh", ...cls].join(" ");
      btn.innerHTML = `<span class="lbl">${t}</span><small class="sublbl">${s || ""}</small>`;
    };

    set(
      "Atualizar escalações prováveis",
      "garante a versão mais recente",
      ["attn"]
    );

    btn.addEventListener("click", async () => {
      set("Atualizando…", "verificando imagens novas", ["is-loading"]);
      await initVersion();
      preloaded = false;

      document.querySelectorAll(".lineup-img[data-team]").forEach((img) => {
        const key = img.getAttribute("data-team") || "";
        if (key) img.src = esc(key);
      });

      await preloadEscalacoes();
      set("Atualizado", "versões mais recentes aplicadas", ["is-done"]);
    });
  }

  // boot
  async function boot() {
    await initVersion();
    render();
    wireRefreshButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
