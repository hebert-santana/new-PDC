/* Preenche os cartões de Desfalques (lesionados/suspensos) */
(function () {
  "use strict";

  // Onde procurar o JSON (primeiro que responder é usado)
  const JSON_CANDIDATES = [
    "/data/desfalques.json",
    "data/desfalques.json",
    "./data/desfalques.json",
    // fallbacks (se mover a pasta no futuro)
    "/assets/data/desfalques.json",
    "assets/data/desfalques.json",
    "/assets/js/desfalques.json",
    "assets/js/desfalques.json",
  ];

  // Apelidos → slug oficial (cobre variações comuns)
  const ALIASES = {
    "saopaulo": "sao-paulo",
    "sao paulo": "sao-paulo",
    "rb-bragantino": "bragantino",
    "red-bull-bragantino": "bragantino",
    "bragantino-sp": "bragantino",
    "ceará": "ceara",
    "grêmio": "gremio",
    "atlético-mg": "atletico-mg",
    "atletico": "atletico-mg",
    "internacional-rs": "internacional",
  };

  // Util: remove acentos, baixa caixa, troca espaços/seq não-alfanum por hífen
  const toSlug = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // Resolve o slug do time vindo do JSON (aplica alias se precisar)
  function normalizeKey(k) {
    if (!k) return k;
    const s = toSlug(String(k).replace(/_v\d+$/i,''));
    return ALIASES[s] || s;
  }

  async function fetchFirstOk() {
    let lastErr = null;
    for (const url of JSON_CANDIDATES) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        console.info("[desfalques] carregado de", url);
        return j;
      } catch (e) {
        lastErr = e;
        console.warn("[desfalques] falha em", url, e);
      }
    }
    throw lastErr || new Error("Nenhum caminho válido para desfalques.json");
  }

  // Busca bloco do time no JSON aceitando dois formatos de raiz (com/sem 'teams')
  function getTeamBlock(json, teamKey) {
    if (!json || !teamKey) return null;

    const key = normalizeKey(teamKey);
    const direct = json[key];
    if (direct) return direct;

    const fromTeams = json.teams && json.teams[key];
    if (fromTeams) return fromTeams;

    // tenta alguns apelidos de fallback (ex.: 'saopaulo' vs 'sao-paulo')
    for (const [alias, official] of Object.entries(ALIASES)) {
      if (key === alias) {
        const alt = json[official] || (json.teams && json.teams[official]);
        if (alt) return alt;
      }
    }
    return null;
  }

  // Converte item (string | objeto) → <span class="tag">...</span>
  function renderTag(item) {
    if (item == null) return "";
    if (typeof item === "string") {
      const txt = item.trim();
      if (!txt) return "";
      return `<span class="tag">${escapeHtml(txt)}</span>`;
    }
    if (typeof item === "object") {
      const nome = item.nome || item.name || item.jogador || "";
      const motivo = item.motivo || item.motivo_resumo || item.reason || "";
      const prazo = item.prazo || item.retorno || item.eta || "";
      const title =
        (motivo ? String(motivo) : "") + (prazo ? ` · ${String(prazo)}` : "");
      const label = escapeHtml(String(nome || "").trim());
      const tip = escapeHtml(title.trim());
      if (!label) return "";
      return `<span class="tag"${tip ? ` title="${tip}"` : ""}>${label}</span>`;
    }
    return "";
  }

  // Escapa HTML básico em textos dinâmicos
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

// Modo EM BREVE (discreto): deixa os cards sutis e injeta 1 chip por lista
const applyComingSoon = (msg) => {
  const chipFull = msg || "No dia do fechamento (após boletins oficiais).";
  const chipMobile = "No fechamento.";
  const tip = "Publicamos nas manhãs dos dias de fechamento para garantir precisão. Base: ge.globo.com e comunicados oficiais dos clubes.";

  const chipHTML = `
    <span class="tag -soon" aria-label="${escapeHtml(chipFull)}" title="${escapeHtml(tip)}">
      <span class="t-desk">${escapeHtml(chipFull)}</span>
      <span class="t-mob">${escapeHtml(chipMobile)}</span>
    </span>`;

  document.querySelectorAll(".status-card").forEach(card => {
    card.classList.add("-quiet"); // modo discreto

    const inj = card.querySelector('.tag-list[data-role="lesionados"]');
    const sus = card.querySelector('.tag-list[data-role="suspensos"]');

    if (inj) inj.innerHTML = chipHTML;
    if (sus) sus.innerHTML = chipHTML;

    const badge = card.querySelector(".status-badge");
    if (badge && !badge.dataset._soon) {
      badge.dataset._soon = "1";
      badge.textContent = "Desfalques — EM BREVE";
    }

    if (window.DESFALQUES_HIDE_WHEN_SOON === true) {
      card.classList.add('is-hidden');
    }
  });
};




  // Preenche cada card com as listas do JSON
  function applyData(json) {
    // Se vier em modo "comingSoon", usa o compacto e sai
    if (json && json.comingSoon) {
      applyComingSoon(json.message);
      return;
    }

    document.querySelectorAll(".status-card").forEach((card) => {
      const teamKey = card.getAttribute("data-team"); // ex.: "fluminense"
      const block = getTeamBlock(json, teamKey) || {};

      const lesionados = Array.isArray(block.lesionados)
        ? block.lesionados
        : block.les || block.inj || [];
      const suspensos = Array.isArray(block.suspensos)
        ? block.suspensos
        : block.sus || block.susp || [];

      const injWrap = card.querySelector('.tag-list[data-role="lesionados"]');
      const susWrap = card.querySelector('.tag-list[data-role="suspensos"]');

      // Lesionados
      if (injWrap) {
        if (!lesionados || (Array.isArray(lesionados) && lesionados.length === 0)) {
          injWrap.innerHTML = '<span class="tag">Nenhum</span>';
        } else {
          const html = []
            .concat(lesionados)
            .map((it) => renderTag(it))
            .filter(Boolean)
            .join("");
          injWrap.innerHTML = html || '<span class="tag">Nenhum</span>';
        }
      }

      // Suspensos
      if (susWrap) {
        if (!suspensos || (Array.isArray(suspensos) && suspensos.length === 0)) {
          susWrap.innerHTML = '<span class="tag">Nenhum</span>';
        } else {
          const html = []
            .concat(suspensos)
            .map((it) => renderTag(it))
            .filter(Boolean)
            .join("");
          susWrap.innerHTML = html || '<span class="tag">Nenhum</span>';
        }
      }

      // Se ambos vazios, badge segue "Desfalques"
      const badge = card.querySelector(".status-badge");
      if (badge && badge.dataset._soon) {
        // caso já tenha sido setado por algum estado anterior
        delete badge.dataset._soon;
        badge.textContent = "Desfalques";
      }
    });
  }

  // Boot
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const json = await fetchFirstOk();
      // expõe a flag para applyComingSoon decidir ocultar
      window.DESFALQUES_HIDE_WHEN_SOON = !!json?.hideWhenSoon;
      applyData(json);
    } catch (err) {
      console.error("[desfalques] erro ao carregar JSON:", err);
      document.querySelectorAll(".status-card .tag-list").forEach((wrap) => {
        wrap.innerHTML = '<span class="tag">Nenhum</span>';
      });
    }
  });

})();
