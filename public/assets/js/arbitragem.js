// assets/js/arbitragem.js
(() => {
  const SRC = '/data/arbitragem.json';
  const fmt = v => Number(v).toFixed(2).replace('.', ',');

  // -------- helpers de estatística --------
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

  // -------- UI --------
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


async function init() {
  try {
    const r = await fetch(SRC, { cache: 'no-store' });
    if (!r.ok) return;
    const data = await r.json();

    const hideAll  = (data.enabled === false) || (data.comingSoon && data.hideWhenSoon);
    const hideCard = (data.style === 'stealth') || hideAll;

    // remove o CARD grande
    if (hideCard) {
      document.querySelectorAll('#arbitragem-bloco, .arb-wrap').forEach(n => n.remove());
    }

    // totalmente oculto: nem micro nem botão
    if (hideAll) {
      document.querySelectorAll('section.jogo .arb-slot').forEach(s => s.innerHTML = '');
      return;
    }

    // micros e botão
    const thr = buildThr(data);
    document.querySelectorAll('section.jogo').forEach(sec => {
      const id   = sec.id;
      const slot = sec.querySelector('.arb-slot');
      if (!slot) return;

      const m = data.matches?.[id];
      let html = '';
      if (m && data.style !== 'stealth') html += cardMicro(m, thr); // micro opcional
      html += backToTop();                                          // botão sempre
      slot.innerHTML = html;
    });
  } catch { /* silencioso */ }
}

// expõe e inicializa
window.initArbitragem = init;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
})();

