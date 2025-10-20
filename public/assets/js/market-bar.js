// /assets/js/market-bar.js — só JSON local
(function () {
  'use strict';

  const el = document.getElementById('market-bar');
  const elPlantao = document.getElementById('market-plantao');
  if (!el) return;

  const elStatus = el.querySelector('.mb-status');
  const elTxt    = el.querySelector('.mb-ctxt');
  const wrapCtd  = el.querySelector('.mb-countdown');

  const JSONF = 'assets/data/mercado_status.json';
  const TZ    = 'America/Sao_Paulo';

  let tick = null;
  let currentTickMs = 60_000;

  const statusLabel = (s) => ({1:'Aberto',2:'Fechado',3:'Em manutenção',4:'Em atualização'}[s] || 'Indisponível');
  const setKind = (k) => { el.className = el.className.replace(/\s-(open|closed|maint|soon|urgent|error)\b/g,''); el.classList.add(k); };

  // >>> pinta o texto do status (Aberto/Fechado/…)
  function paintStatus(status){
    if (!elStatus) return;
    elStatus.classList.remove('open','closed','waiting');
    if (status === 1)      elStatus.classList.add('open');
    else if (status === 2) elStatus.classList.add('closed');
    else                   elStatus.classList.add('waiting');
  }
  // <<<

  const fmt2 = (n) => (n<10?'0':'') + n;

  function tooltip(ts){
    if (!ts) return '';
    const p = new Intl.DateTimeFormat('pt-BR',{
      timeZone:TZ, day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false
    }).formatToParts(new Date(ts));
    const b = Object.fromEntries(p.map(x=>[x.type,x.value]));
    return `Fecha às ${b.hour}h${b.minute} de ${b.day}/${b.month}`;
  }

  function ensureInterval(period, drawFn){
    if (currentTickMs !== period){
      clearInterval(tick);
      currentTickMs = period;
      tick = setInterval(drawFn, currentTickMs);
    }
  }

  function updatePlantao(status, diffMs){
    if (!elPlantao) return;
    if (status === 1 && typeof diffMs === 'number' && diffMs > 0){
      const show = diffMs/36e5 <= 6;
      elPlantao.hidden = !show;
      if (show){
        elPlantao.setAttribute('aria-live','polite');
        elPlantao.title = 'Plantão de fechamento: revisões frequentes até o fechamento do mercado';
      } else {
        elPlantao.removeAttribute('aria-live');
        elPlantao.removeAttribute('title');
      }
    } else {
      elPlantao.hidden = true;
    }
  }

  function start(status, closeTs){
    clearInterval(tick);

    const applyState = (diff) => {
      if (status === 1){
        setKind('-open');
        if (typeof diff === 'number'){
          if (diff <= 30*60*1000) setKind('-urgent');
          else if (diff <= 2*60*60*1000) setKind('-soon');
        }
      } else if (status === 2){
        setKind('-closed');
      } else {
        setKind('-maint');
      }
    };

    function draw(){
      const now  = Date.now();
      const diff = closeTs ? (closeTs - now) : null;

      elStatus.textContent = statusLabel(status);
      paintStatus(status);                  // <<< aplica a cor do status
      applyState(diff ?? 0);

      const tip = tooltip(closeTs);
      if (tip && wrapCtd){ wrapCtd.title = tip; wrapCtd.setAttribute('aria-label', tip); }

      if (status === 1 && diff !== null){
        if (diff <= 0){
          elTxt.textContent = 'fechado';
          setKind('-closed');
        } else {
          const totalMin = Math.floor(diff / 60000);
          const days = Math.floor(totalMin / (60 * 24));
          const hours = Math.floor((totalMin % (60 * 24)) / 60);
          const minutes = totalMin % 60;
          if (days > 0) {
            elTxt.textContent = `fecha em ${days}d ${fmt2(hours)}h ${fmt2(minutes)}m`;
          } else if (hours > 0) {
            elTxt.textContent = `fecha em ${fmt2(hours)}h ${fmt2(minutes)}m`;
          } else {
            const sec = Math.floor((diff/1000) % 60);
            elTxt.textContent = `fecha em ${fmt2(minutes)}m ${fmt2(sec)}s`;
          }
        }
      } else if (status === 2){
        elTxt.textContent = 'fechado';
      } else {
        elTxt.textContent = 'aguarde…';
      }

      updatePlantao(status, diff);
      const desired = (closeTs && (closeTs - Date.now() <= 30*60*1000)) ? 1000 : 60_000;
      ensureInterval(desired, draw);
    }

    const period = closeTs && (closeTs - Date.now() <= 30*60*1000) ? 1000 : 60_000;
    currentTickMs = period;
    draw();
    tick = setInterval(draw, period);
  }

  function boot(){
    fetch(JSONF, { headers:{'Accept':'application/json'}, cache:'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const status = Number(data?.status) || 1;
        const iso = data?.fechamentoISO;
        const close = iso ? new Date(iso).getTime() : null;
        start(status, close);
      })
      .catch(() => {
        const now = new Date();
        const day = now.getDay(); // 0=dom
        const add = (6 - day + 7) % 7;
        const tmp = new Date(now.getFullYear(), now.getMonth(), now.getDate()+add, 16, 0, 0);
        start(1, tmp.getTime());
      });
  }

  boot();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) boot(); });

  setTimeout(() => {
    if (/carregando/i.test(elTxt?.textContent || '')) {
      el.classList.add('-error');
      el.querySelector('.mb-status').textContent = 'Indisponível';
      el.querySelector('.mb-ctxt').textContent = 'não foi possível consultar agora';
    }
  }, 8000);
})();
