/* Desfalques LITE — preenche lesionados/suspensos a partir de /assets/data/desfalques.json */
(() => {
  "use strict";

  const JSON_URL = "/assets/data/desfalques.json";
  const ALIASES = {
    "saopaulo":"sao-paulo","sao paulo":"sao-paulo",
    "rb-bragantino":"bragantino","red-bull-bragantino":"bragantino","bragantino-sp":"bragantino",
    "ceará":"ceara","grêmio":"gremio",
    "atlético-mg":"atletico-mg","atletico":"atletico-mg",
    "internacional-rs":"internacional"
  };

  const toSlug = s => String(s||"")
    .normalize("NFD").replace(/\p{Diacritic}/gu,"")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

  const normKey = k => {
    if (!k) return k;
    const s = toSlug(String(k).replace(/_v\d+$/i,""));
    return ALIASES[s] || s;
  };

  const esc = s => String(s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  function getTeamBlock(json, teamKey){
    const key = normKey(teamKey);
    if (!key || !json) return null;
    return json[key] || (json.teams && json.teams[key]) || null;
  }

  function tag(item){
    if (item == null) return "";
    if (typeof item === "string"){
      const t = item.trim();
      return t ? `<span class="tag">${esc(t)}</span>` : "";
    }
    const nome  = item.nome || item.name || item.jogador || "";
    const mot   = item.motivo || item.motivo_resumo || item.reason || "";
    const prazo = item.prazo || item.retorno || item.eta || "";
    if (!nome) return "";
    const title = [mot, prazo].filter(Boolean).join(" · ");
    return `<span class="tag"${title ? ` title="${esc(title)}"` : ""}>${esc(nome)}</span>`;
  }

  function applySoon(msg){
    const full = msg || "No dia do fechamento (após boletins oficiais).";
    const mob  = "No fechamento.";
    const tip  = "Publicamos nas manhãs do fechamento para garantir precisão (ge e comunicados oficiais).";
    const chip = `
      <span class="tag -soon" aria-label="${esc(full)}" title="${esc(tip)}">
        <span class="t-desk">${esc(full)}</span>
        <span class="t-mob">${esc(mob)}</span>
      </span>`;
    document.querySelectorAll(".status-card").forEach(card=>{
      card.classList.add("-quiet");
      const inj = card.querySelector('.tag-list[data-role="lesionados"]');
      const sus = card.querySelector('.tag-list[data-role="suspensos"]');
      if (inj) inj.innerHTML = chip;
      if (sus) sus.innerHTML = chip;
      const badge = card.querySelector(".status-badge");
      if (badge){ badge.textContent = "Desfalques — EM BREVE"; badge.dataset._soon = "1"; }
      if (window.DESFALQUES_HIDE_WHEN_SOON === true) card.classList.add("is-hidden");
    });
  }

  function fill(json){
    if (json?.comingSoon) { applySoon(json.message); return; }

    document.querySelectorAll(".status-card").forEach(card=>{
      const team   = card.getAttribute("data-team");
      const block  = getTeamBlock(json, team) || {};
      const les    = Array.isArray(block.lesionados) ? block.lesionados : (block.les || block.inj || []);
      const sus    = Array.isArray(block.suspensos)  ? block.suspensos  : (block.sus || block.susp || []);
      const injEl  = card.querySelector('.tag-list[data-role="lesionados"]');
      const susEl  = card.querySelector('.tag-list[data-role="suspensos"]');

      if (injEl) injEl.innerHTML = (les && les.length)
        ? les.map(tag).filter(Boolean).join("") : '<span class="tag">Nenhum</span>';

      if (susEl) susEl.innerHTML = (sus && sus.length)
        ? sus.map(tag).filter(Boolean).join("") : '<span class="tag">Nenhum</span>';

      const badge = card.querySelector(".status-badge");
      if (badge && badge.dataset._soon){ delete badge.dataset._soon; badge.textContent = "Desfalques"; }
    });
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    try{
      const r = await fetch(JSON_URL, { cache:"no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      window.DESFALQUES_HIDE_WHEN_SOON = !!json?.hideWhenSoon;
      fill(json);
    }catch(e){
      console.error("[desfalques] falha:", e);
      document.querySelectorAll(".status-card .tag-list")
        .forEach(el => el.innerHTML = '<span class="tag">Nenhum</span>');
    }
  });
})();

