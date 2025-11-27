// assets/js/arbitragem.js
(() => {
  const SRC = 'assets/data/arbitragem.json';

  // ---------- utils ----------
  const fmt = v => Number(v).toFixed(2).replace('.', ',');
  const Q = (arr, q) => {
    if (!arr.length) return NaN;
    const v = [...arr].sort((a,b)=>a-b);
    const i = Math.max(0, Math.min(v.length-1, Math.floor((v.length-1)*q)));
    return v[i];
  };
  const buildThr = (data) => {
    const keys = ['fouls','yellows','reds','pens'];
    const vals = { fouls:[], yellows:[], reds:[], pens:[] };
    Object.values(data.matches||{}).forEach(m=>{
      const s = m?.stats || {};
      keys.forEach(k => { const x = +s[k]; if (!Number.isNaN(x)) vals[k].push(x); });
    });
    return {
      fouls:   { lo: Q(vals.fouls,   0.30), hi: Q(vals.fouls,   0.70) },
      yellows: { lo: Q(vals.yellows, 0.30), hi: Q(vals.yellows, 0.70) },
      reds:    { lo: Q(vals.reds,    0.30), hi: Q(vals.reds,    0.70) },
      pens:    { lo: Q(vals.pens,    0.30), hi: Q(vals.pens,    0.70) }
    };
  };
  const kClass = (stat, val, t) => {
    if (!t || Number.isNaN(val)) return '';
    const hi = val >= t[stat].hi, lo = val <= t[stat].lo;
    return stat === 'pens'
      ? (hi ? 'arb-k--ok' : (lo ? 'arb-k--bad' : ''))
      : (lo ? 'arb-k--ok' : (hi ? 'arb-k--bad' : ''));
  };

  // ---------- UI ----------
  const cardMicro = (m,thr) => {
    const s = m.stats || {};
    return `
      <div class="arb-pill arb-micro" role="region" aria-label="Arbitragem">
        <i class="bi bi-whistle" aria-hidden="true"></i>
        <strong class="ref">${m.referee}</strong>
        <span class="sep">•</span><span class="k ${kClass('fouls',+s.fouls,thr)}"><span class="k-prefix">F</span> <b>${fmt(s.fouls)}</b></span>
        <span class="sep">•</span><span class="k ${kClass('yellows',+s.yellows,thr)}"><span class="k-prefix">A</span> <b>${fmt(s.yellows)}</b></span>
        <span class="sep">•</span><span class="k ${kClass('reds',+s.reds,thr)}"><span class="k-prefix">V</span> <b>${fmt(s.reds)}</b></span>
        <span class="sep">•</span><span class="k ${kClass('pens',+s.pens,thr)}"><span class="k-prefix">P</span> <b>${fmt(s.pens)}</b></span>
      </div>`;
  };
  const backToTop = () => `
    <div class="arb-topline" aria-hidden="true"></div>
    <div class="backtop-lane">
      <a href="#" class="backtop-btn" aria-label="Voltar ao topo"
         onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">
        <i class="bi bi-arrow-up-short" aria-hidden="true"></i><span>Topo</span>
      </a>
    </div>`;

  // ---------- pass 1: DOM grooming + match chip ----------
  const prepareDomAndChips = () => {
    document.querySelectorAll('.custom-provaveis-item').forEach(item => {
      const arb = item.querySelector('#arbitragem-bloco, .arb-wrap');
      const lineups = item.querySelector('.lineups');

      // arbitragem antes dos campinhos
      if (arb && lineups) item.insertBefore(arb, lineups);

      // match label
      let matchText = '';
      const arbMatch = item.querySelector('.arb-wrap .arb-head .arb-match');
      if (arbMatch) {
        matchText = arbMatch.textContent.replace(/^Jogo:\s*/,'').trim();
      } else {
        const teams = Array.from(item.querySelectorAll('.status-card .status-team'))
                           .map(n => n.textContent.trim()).slice(0,2);
        if (teams.length === 2) {
          const img = item.querySelector('.lineup-img[alt*="rodada"]');
          let rodada = '';
          if (img) {
            const m = img.alt.match(/rodada\s+(\d+)/i);
            if (m) rodada = ` • Rodada ${m[1]}`;
          }
          matchText = `${teams[0]} × ${teams[1]}${rodada}`;
        }
      }

      if (matchText) {
        let meta = item.querySelector('.arb-meta.container-avisosize');
        const anchor = arb || lineups || item.firstChild;
        if (!meta) {
          meta = document.createElement('div');
          meta.className = 'arb-meta container-avisosize rail-right';
          item.insertBefore(meta, anchor);
        }
        meta.innerHTML = '';
        const chip = document.createElement('a');
        chip.className = 'match-chip';
        chip.setAttribute('role','button');
        chip.setAttribute('aria-label', `Partida ${matchText}`);
        chip.innerHTML = `<i class="bi bi-calendar2-event" aria-hidden="true"></i><span class="mc-label">${matchText}</span>`;
        meta.appendChild(chip);

        // remove “Jogo: …” interno para evitar duplicação
        if (arbMatch) arbMatch.remove();
      }
    });
  };

  // ---------- pass 2: fetch + render micro/back-to-top ----------
  const renderArbitragem = async () => {
    try {
      const r = await fetch(SRC);
      if (!r.ok) return;
      const data = await r.json();

      const hideAll  = (data.enabled === false) || (data.comingSoon && data.hideWhenSoon);
      const hideCard = (data.style === 'stealth') || hideAll;

      // remove card grande, se aplicável
      if (hideCard) {
        document.querySelectorAll('#arbitragem-bloco, .arb-wrap').forEach(n => n.remove());
      }

      // totalmente oculto
      if (hideAll) {
        document.querySelectorAll('section.jogo .arb-slot').forEach(s => s.innerHTML = '');
        return;
      }

      // micro + topo
      const thr = buildThr(data);
      document.querySelectorAll('section.jogo').forEach(sec => {
        const id   = sec.id;
        const slot = sec.querySelector('.arb-slot');
        if (!slot) return;

        const m = data.matches?.[id];
        let html = '';
        if (m && data.style !== 'stealth') html += cardMicro(m, thr);
        html += backToTop();
        slot.innerHTML = html;
      });
    } catch {
      // silencioso
    }
  };

  async function init() {
    prepareDomAndChips();
    await renderArbitragem();
  }

  // expõe e inicializa
  window.initArbitragem = init;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
