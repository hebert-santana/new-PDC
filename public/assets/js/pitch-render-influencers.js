// /assets/js/pitch-render-influencers.js
(() => {
  'use strict';

  // ===== CONSTS =====
  const SAVE_KEY = 'pitch_positions_v6';
  const IS_MOBILE = matchMedia('(max-width: 430px)').matches;
  const clamp = (v,a=0,b=100)=>Math.max(a,Math.min(b,v));
  const PCT = v => `${v}%`;


// ===== CSS =====
(function injectOnce(){
  if (document.getElementById('pitch-view-style')) return;
  const css = `
  :root{
    --img:clamp(56px,5.5vw,92px);
    --img-coach:clamp(44px,4vw,70px);
    --laranja:#FB5904; --azul:#40A8B0;
    --gap-label:24px; /* espaçamento vertical uniforme */
  }

  .player{
    position:absolute;transform:translate(-50%,-50%);
    text-align:center;width:var(--img);height:var(--img);
    overflow:visible;touch-action:manipulation;
  }
  .player img{
    display:block;width:var(--img);height:var(--img);
    border-radius:50%;background:#fff;border:2px solid #fff;
    outline:1px solid rgba(15,23,42,.08);box-shadow:0 4px 14px rgba(0,0,0,.28);
  }
  .player.ok img{ box-shadow:0 0 0 3px #22c55e,0 6px 14px rgba(0,0,0,.28) }
  .player.doubt img{ box-shadow:0 0 0 3px #f59e0b,0 6px 14px rgba(0,0,0,.28) }
  .player.coach{width:var(--img-coach);height:var(--img-coach)}
  .player.coach img{width:var(--img-coach);height:var(--img-coach)}

  .player .cap, .player .stat, .player .alt-cap, .player .alt-stat{ pointer-events:none; }

  .player .cap{
    position:absolute;left:50%;top:100%;transform:translateX(-50%);
    margin-top:6px;padding:4px 10px;font-size:13px;font-weight:600;
    color:#0a1324;background:rgba(255,255,255,.98);
    border:1px solid rgba(15,23,42,.14);border-radius:12px;
    box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 4px 10px rgba(2,6,23,.18);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;
  }

  /* Média principal */
  .player .stat{
    position:absolute;left:50%;transform:translateX(-50%);
    top:calc(100% + var(--gap-label));
    font-size:10px;font-weight:700;letter-spacing:.1px;background:rgba(255,255,255,.95);
    border:1px solid rgba(15,23,42,.12);border-radius:10px;padding:2px 6px;
    box-shadow:0 2px 6px rgba(2,6,23,.12);white-space:nowrap;
  }
  .player .stat.green{ color:#16a34a;border-color:rgba(22,163,74,.25) }
  .player .stat.amber{ color:#f59e0b;border-color:rgba(245,158,11,.25) }
  .player .stat.red{ color:#ef4444;border-color:rgba(239,68,68,.25) }

  /* Dúvida: nome + média do reserva */
  .player .alt-cap{
    position:absolute;left:50%;transform:translateX(-50%);
    padding:3px 8px;font-size:12px;font-weight:500;color:#111;background:rgba(255,255,255,.96);
    border:1px solid rgba(15,23,42,.12);border-radius:10px;box-shadow:0 3px 8px rgba(2,6,23,.14);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;
  }
  .player .alt-stat{
    position:absolute;left:50%;transform:translateX(-50%);
    font-size:10px;font-weight:700;letter-spacing:.1px;background:rgba(255,255,255,.95);
    border:1px solid rgba(15,23,42,.12);border-radius:10px;padding:2px 6px;
    box-shadow:0 2px 6px rgba(2,6,23,.12);white-space:nowrap;display:none;
  }
  .player .alt-stat.green{ color:#16a34a;border-color:rgba(22,163,74,.25) }
  .player .alt-stat.amber{ color:#f59e0b;border-color:rgba(245,158,11,.25) }
  .player .alt-stat.red{ color:#ef4444;border-color:rgba(239,68,68,.25) }

  /* Posicionamento uniforme */
  .pitch:not(.hide-stat) .player .alt-cap{ top:calc(100% + (var(--gap-label) * 2)) }
  /* só exibe a média do reserva se NÃO estiver ocultando dúvida */
.pitch:not(.hide-stat):not(.hide-doubt) .player .alt-cap + .alt-stat{
  top:calc(100% + (var(--gap-label) * 3));
  display:block;
  }
  .pitch.hide-stat .player .alt-cap{ top:calc(100% + var(--gap-label)) }
  .pitch.hide-stat .player .alt-stat{ display:none }

  /* Ocultar dúvida (nome + média) */
  .pitch.hide-doubt .player .alt-cap{ display:none }
  .pitch.hide-doubt .player .alt-stat{ display:none }

  /* Responsivo: reduz o gap */
  @media (max-width:768px){ :root{ --gap-label:20px } .player .cap{max-width:120px} }
  @media (max-width:480px){ :root{ --gap-label:18px } .player .cap,.player .alt-cap{max-width:90px} }

  /* Toolbar — 50% menor */
  .pitch-toolbar{ position:absolute;right:8px;top:8px;display:flex;gap:6px;z-index:5; }
  .pitch-toolbar .btn{
    font:700 10px system-ui;padding:4px 8px;border-radius:999px;cursor:pointer;
    border:1px solid #e5e7eb;background:#fff;color:#0b192b;
    box-shadow:0 2px 6px rgba(2,6,23,.08),inset 0 0 0 1px rgba(255,255,255,.6);
    transition:transform .05s ease,background .12s ease,box-shadow .12s ease;
  }
  .pitch-toolbar .btn:hover{ background:#f7f7f8 }
  .pitch-toolbar .btn:active{ transform:translateY(1px) }
  .pitch-toolbar .btn-stat.active{
    background:linear-gradient(135deg,var(--laranja),#ff8a3d 50%,#ffc08a 100%);
    border-color:rgba(251,89,4,.4);color:#111;
  }
  .pitch-toolbar .btn-doubt.active{
    background:linear-gradient(135deg,var(--azul),#67c4ca 50%,#a9e0e3 100%);
    border-color:rgba(64,168,176,.4);color:#072024;
  }
  `;
  const s = document.createElement('style');
  s.id = 'pitch-view-style';
  s.textContent = css;
  document.head.appendChild(s);
})();




  // ===== posições =====
  const POS = {
    GOL:{x:50,y:90},
    'ZAG-L':{x:35,y:75}, 'ZAG-C':{x:50,y:75}, 'ZAG-R':{x:65,y:75},
    'LAT-L':{x:20,y:78}, 'LAT-R':{x:80,y:78},
    VOL:{x:50,y:65},
    'MEI-L':{x:30,y:58}, 'MEI-C':{x:50,y:55}, 'MEI-R':{x:70,y:58},
    'ATA-L':{x:35,y:30}, 'ATA-C':{x:50,y:25}, 'ATA-R':{x:65,y:30},
    TEC:{x:92,y:96}
  };
  const MPRESETS = {
    '4-3-3': {'GOL':[50,88],'ZAG-L':[33,72],'ZAG-C':[50,72],'ZAG-R':[67,72],'LAT-L':[12,66],'LAT-R':[88,66],
              'MEI-L':[26,48],'MEI-C':[50,35],'MEI-R':[74,48],'ATA-L':[22,20],'ATA-C':[50,10],'ATA-R':[78,20],'TEC':[12,92]},
    '4-4-2': {'GOL':[50,88],'ZAG-L':[33,72],'ZAG-C':[50,72],'ZAG-R':[67,72],'LAT-L':[12,66],'LAT-R':[88,66],
              'VOL':[50,55],'MEI-L':[26,46],'MEI-C':[50,30],'MEI-R':[74,46],'ATA-L':[36,10],'ATA-R':[64,10],'TEC':[12,92]},
    '3-5-2': {'GOL':[50,88],'ZAG-L':[26,70],'ZAG-C':[50,68],'ZAG-R':[74,70],'LAT-L':[12,47],'LAT-R':[88,47],
              'VOL':[50,57],'MEI-L':[36,47],'MEI-C':[50,30],'MEI-R':[64,47],'ATA-L':[36,10],'ATA-R':[64,10],'TEC':[12,92]},
    '4-2-3-1': {'GOL':[50,92],'ZAG-L':[40,77],'ZAG-R':[60,77],'LAT-L':[22,79],'LAT-R':[78,79],
                'VOL':[40,66],'VOL2':[60,66],'MEI-L':[36,57],'MEI-C':[50,54],'MEI-R':[64,57],'ATA-C':[50,32],'TEC':[10,92]},
  };

  // ===== helpers =====
  async function jget(url){
    const r = await fetch(url, { cache:'no-store' });
    if(!r.ok) throw new Error(`fetch ${url} ${r.status}`);
    return r.json();
  }
  async function loadMercado(){
    try{
      const arr = await jget('/assets/data/mercado.images.json');
      window.MERCADO = { byId: new Map(arr.map(a => [a.atleta_id, a])) };
    }catch{ window.MERCADO = { byId: new Map() }; }
  }
  const getA = id => window.MERCADO?.byId?.get(+id) || null;
  const nome = id => getA(id)?.apelido_abreviado || getA(id)?.apelido || getA(id)?.nome || String(id);
  const clubIdOf = id => getA(id)?.clube_id ?? 0;
  const foto = id => (getA(id)?.foto || '').trim() || `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`;
  const mediaNum = id => Number(getA(id)?.media_num ?? NaN);
  const resolveTeamKey = (pitch) =>
    String(pitch.dataset.scope || pitch.getAttribute('data-team') || '').trim();

  const fmtMedia = v => Number.isFinite(v) ? `Média: ${v.toFixed(1).replace('.',',')}` : 'Média: —';
  const statClass = v => !Number.isFinite(v) ? '' : (v > 7 ? 'green' : v > 5 ? 'amber' : 'red');

  function place(el, slot, xy, formacao){
    let p = xy || POS[slot] || POS['MEI-C'];
    if (IS_MOBILE) {
      const mp = (MPRESETS[formacao] || {})[slot];
      if (Array.isArray(mp)) p = { x: clamp(+mp[0]), y: clamp(+mp[1]) };
    }
    el.style.left = PCT(p.x);
    el.style.top  = PCT(p.y);
  }

  // ===== criação/reuso de nó + média =====
  function ensurePlayerEl(pitch, {id, slot, sit, duvidaCom}){
    let el = pitch.querySelector(`#p-${id}`);
    const clsBase = 'player jogador';
    const clsSit  = (sit === 'duvida') ? 'doubt' : 'ok';

    if (!el){
      el = document.createElement('figure');
      el.id = `p-${id}`;
      el.dataset.id = String(id);
      el.dataset.slot = slot;
      el.className = `${clsBase} ${clsSit}`;
      if (slot === 'TEC') el.classList.add('coach');

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 92; img.height = 92;
      img.alt = nome(id);
      img.src = foto(id);
      img.onerror = () => { img.onerror = null; img.src = `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`; };
      img.setAttribute('draggable','false');
      img.style.webkitUserDrag = 'none';
      img.style.userSelect = 'none';
      img.style.pointerEvents = 'none';

      const cap = document.createElement('figcaption');
      cap.className = 'cap';
      cap.textContent = nome(id);

      const stat = document.createElement('div');
      stat.className = 'stat';
      const m = mediaNum(id);
      stat.textContent = fmtMedia(m);
      if (statClass(m)) stat.classList.add(statClass(m));

      el.appendChild(img);
      el.appendChild(cap);
      el.appendChild(stat);
      pitch.appendChild(el);
    } else {
      el.className = `${clsBase} ${clsSit}` + (slot === 'TEC' ? ' coach' : '');
      const cap = el.querySelector('.cap'); if (cap) cap.textContent = nome(id);

      const stat = el.querySelector('.stat');
      if (stat){
        const m = mediaNum(id);
        stat.textContent = fmtMedia(m);
        stat.classList.remove('green','amber','red');
        if (statClass(m)) stat.classList.add(statClass(m));
      }
      const img = el.querySelector('img'); if (img){ img.alt = nome(id); img.src = foto(id); }
    }

    // alt-cap
    // remover anteriores
el.querySelectorAll('.alt-cap, .alt-stat').forEach(n=>n.remove());

// dúvida: nome + média do reserva
if (sit === 'duvida' && Number.isFinite(+duvidaCom)) {
  const altId = +duvidaCom;

  const altCap = document.createElement('div');
  altCap.className = 'alt-cap';
  altCap.textContent = nome(altId);
  el.appendChild(altCap);

  // média do reserva (aparece só quando a média está habilitada no pitch)
  const altM = mediaNum(altId);
  const altStat = document.createElement('div');
  altStat.className = 'alt-stat';
  altStat.textContent = Number.isFinite(altM) ? `Média: ${altM.toFixed(1).replace('.',',')}` : 'Média: —';
  altStat.classList.add(altM > 7 ? 'green' : altM > 5 ? 'amber' : 'red');
  el.appendChild(altStat);
}

    return el;
  }

  // ===== lineups =====
  async function loadLineups(){
    const base = await jget(`/assets/data/lineups.json?t=${Date.now()}`).catch(()=>({version:1,teams:{}}));
    try{
      const ov = JSON.parse(localStorage.getItem('lineups_override') || 'null');
      if (ov && ov.teams) base.teams = Object.assign(base.teams||{}, ov.teams);
    }catch{}
    return base;
  }

  // ===== toolbar por time (Reset) =====
  function ensureToolbar(pitch){
  let tb = pitch.querySelector('.pitch-toolbar');
  if (!tb){
    tb = document.createElement('div');
    tb.className = 'pitch-toolbar';
    pitch.appendChild(tb);
  }
  tb.innerHTML = '';

  // Botão: Mostrar/Ocultar média
  const bStat = document.createElement('button');
  bStat.type = 'button';
  bStat.className = 'btn btn-stat';
  const syncStat = () => {
    const hidden = pitch.classList.contains('hide-stat');
    bStat.textContent = hidden ? 'Mostrar média' : 'Ocultar média';
    bStat.classList.toggle('active', !hidden);
  };
  bStat.addEventListener('click', ()=>{
    pitch.classList.toggle('hide-stat');
    syncStat();
  });
  syncStat();
  tb.appendChild(bStat);

  // Botão: Mostrar/Ocultar dúvidas
  const bDoubt = document.createElement('button');
  bDoubt.type = 'button';
  bDoubt.className = 'btn btn-doubt';
  const syncDoubt = () => {
    const hidden = pitch.classList.contains('hide-doubt');
    bDoubt.textContent = hidden ? 'Mostrar dúvidas' : 'Ocultar dúvidas';
    bDoubt.classList.toggle('active', !hidden);
  };
  bDoubt.addEventListener('click', ()=>{
    pitch.classList.toggle('hide-doubt');
    syncDoubt();
  });
  syncDoubt();
  tb.appendChild(bDoubt);
}



  // ===== render =====
  function drawPitch(pitch, team){
    // remove e reconstrói jogadores
    pitch.querySelectorAll('.player[id^="p-"]').forEach(n=>n.remove());

    const lista = Array.isArray(team.titulares) ? team.titulares : [];
    const seenIds = new Set();

    for (const p of lista){
      const id = Number(p.id);
      if (!Number.isFinite(id)) continue;
      const slot = String(p.slot || 'MEI-C').toUpperCase();
      const sit  = (p.sit || 'provavel').toLowerCase();

      const el = ensurePlayerEl(pitch, { id, slot, sit, duvidaCom: p.duvida_com });
      const xy = (p.x!=null && p.y!=null) ? {x:+p.x, y:+p.y} : null;
      place(el, slot, xy, team.formacao || '');
      seenIds.add(`p-${id}`);
    }

    const hasCoach = lista.some(p => String(p.slot||'').toUpperCase() === 'TEC');
    if (!hasCoach && Number.isFinite(+team.tecnico)){
      const el = ensurePlayerEl(pitch, { id:+team.tecnico, slot:'TEC', sit:'normal' });
      place(el, 'TEC');
      seenIds.add(`p-${+team.tecnico}`);
    }

    // remove órfãos
    pitch.querySelectorAll('.player[id^="p-"]').forEach(el=>{
      if (!seenIds.has(el.id)) el.remove();
    });
  }

  async function drawAll(){
    const CURRENT = await loadLineups();
    window.CURRENT_LINEUPS = CURRENT;

    // aguarda pitches
    await new Promise(res=>{
      const tick = () => document.querySelectorAll('.pitch[data-team]').length ? res() : setTimeout(tick, 40);
      tick();
    });

    document.querySelectorAll('.pitch[data-team]').forEach(pitch=>{
      const rawKey = pitch.getAttribute('data-team') || '';
      const team = CURRENT?.teams?.[rawKey];
      const key = team ? rawKey : (Object.keys(CURRENT.teams||{})[0] || rawKey);
      pitch.dataset.scope = key;

      if (!team) { pitch.innerHTML = ''; return; }

      pitch.classList.add('pitch');
      if (!pitch.style.position) pitch.style.position = 'relative';

      ensureToolbar(pitch, key, team);
      drawPitch(pitch, team);
    });
  }

  async function bootstrap(){
    await loadMercado();
    await drawAll();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
