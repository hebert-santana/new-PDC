// /assets/js/status-mercado.js — ZERO REQUESTS (sem mercado.json)
(function () {
  'use strict';

  const el = document.getElementById('status-mercado');
  if (!el) return;

  const elStatus = el.querySelector('.mb-status');
  const elTxt    = el.querySelector('.mb-ctxt');
  const wrapCtd  = el.querySelector('.mb-countdown');
  const TZ       = 'America/Sao_Paulo';

  // 1) de onde vem a data de fechamento?
  //    prioridade: <script id="market-config"> → data attribute → fallback erro
  function readCloseISO(){
    // a) JSON embutido
    try {
      const raw = document.getElementById('status-mercado-config')?.textContent?.trim();
      if (raw) {
        const cfg = JSON.parse(raw);
        if (cfg?.closeISO) return String(cfg.closeISO);
      }
    } catch { /* ignora */ }
    // b) data attribute no próprio #status-mercado
    const d = el.getAttribute('data-close-iso');
    if (d) return d;
    // c) sem config
    return null;
  }

  const closeISO = readCloseISO();
  if (!closeISO) {
    el.classList.add('-error');
    if (elStatus) elStatus.textContent = 'Indisponível';
    if (elTxt)    elTxt.textContent    = 'configure closeISO no HTML';
    return;
  }

  const closeTs = new Date(closeISO).getTime();

 const statusHTML = isOpen => (
  isOpen
    ? '<i class="bi bi-toggle-on" style="color:#16a34a"></i> <span>Mercado Aberto</span>'
    : '<i style="color:#dc2626"></i> <span style="color:#dc2626">Mercado Fechado</span>'
);


  const fmt2 = n => (n < 10 ? '0' : '') + n;

  function setKind(kind){
    el.className = el.className.replace(/\s-(open|closed|soon|urgent|error)\b/g,'');
    el.classList.add(kind);
  }

  function tooltip(ts){
    const p = new Intl.DateTimeFormat('pt-BR',{
      timeZone: TZ, day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false
    }).formatToParts(new Date(ts));
    const b = Object.fromEntries(p.map(x => [x.type, x.value]));
    return `Fecha às ${b.hour}h${b.minute} de ${b.day}/${b.month}`;
  }

  function draw(){
    const now   = Date.now();
    const diff  = closeTs - now;
    const open  = diff > 0;

    // status + classes
    if (elStatus) elStatus.innerHTML = statusHTML(open);
    if (open) {
      setKind('-open');
      if (diff <= 30*60*1000) setKind('-urgent');
      else if (diff <= 2*60*60*1000) setKind('-soon');
    } else {
      setKind('-closed');
    }

    // tooltip de acessibilidade
    if (wrapCtd) {
      const tip = tooltip(closeTs);
      wrapCtd.title = tip;
      wrapCtd.setAttribute('aria-label', tip);
    }

    // texto principal
if (elTxt){
  if (!open) {
    elTxt.innerHTML = '<i class="bi bi-toggle2-off" style="color:#dc2626"></i>';
  } else {
    const totalMin = Math.floor(diff / 60000);
    if (totalMin >= 24*60){
      const days = Math.floor(totalMin / (60*24));
      const hours = Math.floor((totalMin % (60*24)) / 60);
      const minutes = totalMin % 60;
      elTxt.textContent = `fecha em ${days}d ${fmt2(hours)}h ${fmt2(minutes)}m`;
    } else if (totalMin >= 60){
      const hours = Math.floor(totalMin / 60);
      const minutes = totalMin % 60;
      elTxt.textContent = `fecha em ${fmt2(hours)}h ${fmt2(minutes)}m`;
    } else {
      const minutes = totalMin;
      const sec = Math.max(0, Math.floor((diff/1000) % 60));
      elTxt.textContent = `fecha em ${fmt2(minutes)}m ${fmt2(sec)}s`;
    }
  }
}


    // ciclo: 60s normal, 1s nos 30 min finais
    const next = (diff <= 30*60*1000) ? 1000 : 60_000;
    setTimeout(draw, next);
  }

  draw();
})();
