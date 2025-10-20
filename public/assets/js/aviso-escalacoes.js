/* CTA BIAScore — tech + urgência */
(() => {
  'use strict';
  if (window.__avisoEscInitDone) return;
  window.__avisoEscInitDone = true;

  const CFGS = ['/data/aviso-escalacoes.json','/assets/data/aviso-escalacoes.json'];
  const BIA = 'https://www.biascore.com.br';
  const CUPOM = 'BIA50';
  const DEADLINE = new Date('2025-10-15T18:59:00-03:00').getTime();
  const WINDOW_DAYS = 7; // janela visual da barra

  async function getCfg(){
    for (const u of CFGS){
      try { const r = await fetch(u+'?_='+Date.now(),{cache:'no-store'}); if (r.ok) return r.json(); } catch {}
    }
    return { comingSoon: true };
  }

  function banner(){
    const el = document.createElement('section');
    el.id = 'aviso-escalacoes';
    el.className = 'biascore-cta tech';
    el.innerHTML = `
      <div class="cta-head">
        <span class="brand">BIA<span>Score</span></span>
        <span class="tag">IA para Cartola</span>
      </div>

      <h3 class="cta-title">50% OFF no <b>plano ANUAL</b></h3>
      <p class="cta-sub">Acesso antecipado ao painel com dados, projeções e filtros avançados.</p>

      <div class="cta-actions">
        <a id="cta-bia" class="btn-primary" href="${BIA}" target="_blank" rel="noopener">
          <i class="bi bi-cpu"></i> Ativar desconto
        </a>

        <div class="coupon">
          <span>cupom</span>
          <button id="btn-cupom" type="button" class="pill" aria-label="Copiar cupom ${CUPOM}">
            <code id="cupom-code">${CUPOM}</code>
            <i class="bi bi-clipboard"></i>
          </button>
          <small id="copied-tip" hidden>copiado</small>
        </div>
      </div>

      <div class="cta-urgency">
        <div class="urg-track"><span id="urg-fill"></span></div>
        <div class="cta-deadline">
          <i class="bi bi-clock-history"></i> expira em <b id="dl-left">…</b>
        </div>
      </div>
    `;

    const lbl  = el.querySelector('#dl-left');
    const fill = el.querySelector('#urg-fill');
    const START = DEADLINE - WINDOW_DAYS*24*60*60*1000;

    const tick = () => {
      const now = Date.now();
      const left = DEADLINE - now;

      if (left <= 0) {
        lbl.textContent = 'encerrado';
        el.classList.remove('is-warning','is-critical');
        fill.style.width = '100%';
        return;
      }

      // texto
      const s = Math.floor(left/1000),
            d = Math.floor(s/86400),
            h = Math.floor((s%86400)/3600),
            m = Math.floor((s%3600)/60);
      lbl.textContent = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;

      // barra
      const total = DEADLINE - START;
      const used  = Math.min(Math.max(now-START,0), total);
      fill.style.width = `${Math.round((used/total)*100)}%`;

      // estágios
      el.classList.toggle('is-warning',  left <= 12*60*60*1000 && left > 60*60*1000); // ≤12h
      el.classList.toggle('is-critical', left <= 60*60*1000);                           // ≤1h
    };

    tick();
    setInterval(tick, 1000);

    // copiar cupom + GA
    const btn = el.querySelector('#btn-cupom');
    const tip = el.querySelector('#copied-tip');
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(CUPOM); tip.hidden=false; setTimeout(()=>tip.hidden=true,1200); } catch {}
      if (typeof gtag==='function') gtag('event','copy_cupom_biascore',{loc:'aviso',cupom:CUPOM});
    });
    el.querySelector('#cta-bia').addEventListener('click',()=>{ if (typeof gtag==='function') gtag('event','click_cta_biascore',{loc:'aviso'}); });

    return el;
  }

  async function boot(){
 const cfg = await getCfg();
if (!cfg?.comingSoon || cfg.showBiascore === false) return;
    const nav  = document.querySelector('#provaveis-container [data-include="navbar-equipes"]');
    const root = document.querySelector('#jogos-root');
    const el   = banner();
    if (nav)  nav.insertAdjacentElement('afterend', el);
    else if (root) root.insertAdjacentElement('beforebegin', el);
    else document.body.prepend(el);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();