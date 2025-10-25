// /assets/js/pitch-render-influencers.js
(() => {
  'use strict';

  // ===== CONSTS =====
  const SAVE_KEY = 'pitch_positions_v6';
  const IS_MOBILE = matchMedia('(max-width: 430px)').matches;
  const clamp = (v,a=0,b=100)=>Math.max(a,Math.min(b,v));
  const PCT = v => `${v}%`;

  // bloqueia qualquer persistência de drag nesta página
  try{
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('pitch_drag_positions');
    sessionStorage.removeItem('pitch_drag_positions');
    const __set = localStorage.setItem.bind(localStorage);
    const __get = localStorage.getItem.bind(localStorage);
    localStorage.setItem = (k,v)=> (k===SAVE_KEY ? void 0 : __set(k,v));
    localStorage.getItem = (k)=> (k===SAVE_KEY ? null : __get(k));
  }catch{}

  // ===== CSS =====
  (() => {
    if (document.getElementById('pitch-view-style')) return;
    const css = `
  :root{
    --img:clamp(56px,5.5vw,92px);
    --img-coach:clamp(44px,4vw,70px);
    --laranja:#FB5904; --azul:#40A8B0;
    --gap-label:26px;
    --chip-size:24px;
    --chip-ring:#ffd54a;
    --chip-fg:#0b192b;
  }

  .player{
    position:absolute; transform:translate(-50%,-50%);
    text-align:center; width:var(--img); height:var(--img);
    overflow:visible; touch-action:manipulation;
  }
  .player img{
    display:block; width:var(--img); height:var(--img);
    border-radius:50%; background:#fff; border:2px solid #fff;
    outline:1px solid rgba(15,23,42,.08);
    box-shadow:0 4px 14px rgba(0,0,0,.28);
    pointer-events:none; user-select:none;
  }
  .player.ok img{ box-shadow:0 0 0 3px #22c55e,0 6px 14px rgba(0,0,0,.28) }
  .player.doubt img{ box-shadow:0 0 0 3px #f59e0b,0 6px 14px rgba(0,0,0,.28) }
  .player.coach{ width:var(--img-coach); height:var(--img-coach) }
  .player.coach img{ width:var(--img-coach); height:var(--img-coach) }

  .player .cap, .player .stat, .player .alt-cap, .player .alt-stat{
    position:absolute; left:50%; transform:translateX(-50%);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px;
  }
  .player .cap, .player .alt-cap{ pointer-events:auto; cursor:pointer }
  .player .stat, .player .alt-stat{ pointer-events:none }

  .player .cap{
    top:calc(100% + 0px);
    padding:4px 10px; font-size:13px; font-weight:600; color:#0a1324;
    background:rgba(255,255,255,.98);
    border:1px solid rgba(15,23,42,.14); border-radius:12px;
    box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 4px 10px rgba(2,6,23,.18);
  }
  .player .stat{
    top:calc(100% + var(--gap-label));
    font-size:10px; font-weight:700; letter-spacing:.1px;
    color:#fff; background:#16a34a; border:1px solid rgba(22,163,74,.6);
    border-radius:10px; padding:2px 6px; box-shadow:0 2px 6px rgba(2,6,23,.12);
  }
  .player .stat.amber{ background:#f59e0b; border-color:rgba(245,158,11,.6) }
  .player .stat.red{ background:#ef4444; border-color:rgba(239,68,68,.6) }

  .player .alt-cap{
    top:calc(100% + (var(--gap-label) * 1.8));
    padding:3px 8px; font-size:12px; font-weight:500; color:#111;
    background:rgba(255,255,255,.96);
    border:1px solid rgba(15,23,42,.12); border-radius:10px;
    box-shadow:0 3px 8px rgba(2,6,23,.14);
  }
  .player .alt-stat{
    top:calc(100% + (var(--gap-label) * 2.55));
    font-size:10px; font-weight:700; letter-spacing:.1px;
    color:#fff; background:#16a34a; border:1px solid rgba(22,163,74,.6);
    border-radius:10px; padding:2px 6px; box-shadow:0 2px 6px rgba(2,6,23,.12);
    display:none;
  }
  .player .alt-stat.amber{ background:#f59e0b; border-color:rgba(245,158,11,.6) }
  .player .alt-stat.red{ background:#ef4444; border-color:rgba(239,68,68,.6) }

  .pitch.hide-stat .player .stat{ display:none }
  .pitch.hide-stat .player .alt-cap{ top:calc(100% + var(--gap-label)) }
  .pitch.hide-doubt .player .alt-cap, .pitch.hide-doubt .player .alt-stat{ display:none }
  .pitch:not(.hide-stat):not(.hide-doubt) .player .alt-cap + .alt-stat{ display:block }

  @media (max-width:768px){
    :root{ --gap-label:20px }
    .player .cap{ max-width:120px }
  }
  @media (max-width:480px){
    :root{ --gap-label:18px }
    .player .cap, .player .alt-cap{ max-width:90px }
  }

  /* ===== Toolbar ===== */
  .pitch-toolbar{
    position:absolute; right:8px; top:8px;
    display:flex; align-items:center; gap:8px; z-index:9;
  }

  /* chips circulares: M, ?, P(docked) */
  .pitch-toolbar .btn-chip{
    width:var(--chip-size); height:var(--chip-size);
    border-radius:999px; display:inline-flex; align-items:center; justify-content:center;
    font:800 12px/1 system-ui; color:var(--chip-fg);
    background:rgba(255,255,255,.96);
    border:2px solid rgba(11,25,43,.22);
    box-shadow:0 1px 4px rgba(2,6,23,.14), 0 0 0 2px rgba(255,255,255,.6) inset;
    cursor:pointer; user-select:none; padding:0;
    transition:transform .05s ease, background .12s ease, box-shadow .12s ease, border-color .12s ease;
  }
  .pitch-toolbar .btn-chip:hover{ background:#fff }
  .pitch-toolbar .btn-chip:active{ transform:translateY(1px) }

  .pitch-toolbar .btn-chip.stat.active{
    color:#111;
    background:linear-gradient(135deg,#ffd37a,#ffb24e 60%,#ffa34a);
    border-color:rgba(251,89,4,.35);
    box-shadow:0 2px 10px rgba(251,89,4,.22), 0 0 0 2px var(--chip-ring) inset;
  }
  .pitch-toolbar .btn-chip.doubt.active{
    color:#072024;
    background:linear-gradient(135deg,#8ee2e6,#67c4ca 60%,#40a8b0);
    border-color:rgba(64,168,176,.35);
    box-shadow:0 2px 10px rgba(165, 176, 64, 0.22), 0 0 0 2px var(--chip-ring) inset;
  }

  /* P docked — idêntico aos chips */
  .pen-marker.docked{
    position:static; transform:none; box-sizing:border-box;
    width:var(--chip-size); height:var(--chip-size);
    margin:0; padding:0;
    display:inline-flex; align-items:center; justify-content:center; vertical-align:middle;
    border-radius:999px; font:800 12px/1 system-ui; color:#0b192b;
    background:radial-gradient(circle at 30% 30%, #fff, #ffe68a);
    border:2px solid rgba(11,25,43,.22);
    box-shadow:0 1px 4px rgba(2,6,23,.14), 0 0 0 2px rgba(255,255,255,.6) inset;
    cursor:grab; user-select:none; touch-action:none;
  }

  /* P solto no campo */
  .pen-marker:not(.docked){
    position:absolute; transform:translate(-50%,-50%); z-index:4;
    width:28px; height:28px; border-radius:50%;
    background:radial-gradient(circle at 30% 30%, #f8fc07ff, #ffe68a);
    border:2px solid #111; color:#111; font:900 14px/28px system-ui;
    text-align:center; user-select:none; touch-action:none; cursor:grab;
    box-shadow:0 6px 16px rgba(0,0,0,.30), 0 0 0 2px var(--chip-ring) inset;
  }
  .pen-marker:active{ cursor:grabbing }

  /* badge de atualização */
  .upd-badge{
    display:inline-flex; align-items:center; gap:6px;
    padding:3px 8px; border-radius:999px;
    font:700 11px system-ui; letter-spacing:.1px;
    color:#eaf3ff;
    background:rgba(11,25,43,.55);
    border:1px solid rgba(255,255,255,.16);
    box-shadow:0 8px 18px rgba(0,0,0,.25);
    backdrop-filter:saturate(120%) blur(2px);
  }
  .upd-badge .bi{ opacity:.9 }
    `;
    const s = document.createElement('style');
    s.id = 'pitch-view-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // ===== Presets =====
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

  // ===== helpers de dados =====
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
  const statClass = v => !Number.isFinite(v) ? '' : (v>5?'':(v>=3?'amber':'red'));

  function place(el, slot, xy, formacao){
    let p = xy || POS[slot] || POS['MEI-C'];
    if (IS_MOBILE) {
      const mp = (MPRESETS[formacao] || {})[slot];
      if (Array.isArray(mp)) p = { x: clamp(+mp[0]), y: clamp(+mp[1]) };
    }
    el.style.left = PCT(p.x);
    el.style.top  = PCT(p.y);
  }

  // ===== Player node =====
  function ensurePlayerEl(pitch, {id, slot, sit, duvidaCom}){
    let el = pitch.querySelector(`#p-${id}`);
    const clsBase = 'player jogador';
    const clsSit  = (sit === 'duvida') ? 'doubt' : 'ok';

    if (!el){
      el = document.createElement('figure');
      el.id = `p-${id}`;
      el.dataset.id = String(id);
      el.dataset.slot = slot;
      el.className = `${clsBase} ${clsSit}` + (slot === 'TEC' ? ' coach' : '');

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 92; img.height = 92;
      img.alt = nome(id);
      img.src = foto(id);
      img.onerror = () => { img.onerror = null; img.src = `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`; };

      const cap = document.createElement('figcaption');
      cap.className = 'cap';
      cap.textContent = nome(id);

      const stat = document.createElement('div');
      const m = mediaNum(id);
      stat.textContent = Number.isFinite(m) ? `Média: ${m.toFixed(1).replace('.',',')}` : 'Média: —';
      stat.className = 'stat';
      const sc = statClass(m); if (sc) stat.classList.add(sc);

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
        stat.textContent = Number.isFinite(m) ? `Média: ${m.toFixed(1).replace('.',',')}` : 'Média: —';
        stat.classList.remove('amber','red');
        const sc = statClass(m); if (sc) stat.classList.add(sc);
      }
      const img = el.querySelector('img'); if (img){ img.alt = nome(id); img.src = foto(id); }
    }

    // seção de dúvida
    el.querySelectorAll('.alt-cap, .alt-stat').forEach(n => n.remove());
    if (sit === 'duvida' && Number.isFinite(+duvidaCom)) {
      const altId = +duvidaCom;
      const altCap = document.createElement('div');
      altCap.className = 'alt-cap';
      altCap.textContent = nome(altId);
      el.appendChild(altCap);

      const altM = mediaNum(altId);
      const altStat = document.createElement('div');
      altStat.className = 'alt-stat';
      if (Number.isFinite(altM)) {
        altStat.textContent = `Média: ${altM.toFixed(1).replace('.', ',')}`;
        const sc = (altM>5?'':(altM>=3?'amber':'red')); if (sc) altStat.classList.add(sc);
      } else {
        altStat.textContent = 'Média: —';
      }
      el.appendChild(altStat);
    }

    return el;
  }

  // ===== Penalty marker (dockable) =====
  function ensurePenaltyMarker(pitch, toolbar){
    let m = pitch.querySelector('.pen-marker, .pitch-toolbar .pen-marker');
    if (m) return m;

    m = document.createElement('div');
    m.className = 'pen-marker docked';
    m.textContent = 'P';
    m.title = 'Arraste para o cobrador. Duplo clique para voltar ao dock.';
    toolbar.appendChild(m);

    const on = (t,ev,fn,opts)=>t.addEventListener(ev,fn,opts||false);
    let dragging = false, moved = false, offX=0, offY=0, sx=0, sy=0;
    const THRESH = 4; // px para considerar arrasto

    function pctFromClient(x, y){
      const r = pitch.getBoundingClientRect();
      const px = Math.max(0, Math.min(r.width,  x - r.left));
      const py = Math.max(0, Math.min(r.height, y - r.top ));
      return { x: (px / r.width) * 100, y: (py / r.height) * 100 };
    }
    function findNearestPlayer(){
      const r = pitch.getBoundingClientRect();
      let best=null, bestD2=Infinity;
      const cx = r.left + r.width  * (parseFloat(m.style.left||'50')/100);
      const cy = r.top  + r.height * (parseFloat(m.style.top ||'18')/100);
      pitch.querySelectorAll('.player').forEach(p=>{
        const pr = p.getBoundingClientRect();
        const px = pr.left + pr.width/2;
        const py = pr.top  + pr.height/2;
        const dx = px - cx, dy = py - cy;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestD2){ bestD2 = d2; best = p; }
      });
      return {el:best, d:Math.sqrt(bestD2)};
    }
    function snapAbove(playerEl){
      if (!playerEl) return;
      const pr = playerEl.getBoundingClientRect();
      const cx = pr.left + pr.width/2;
      const top = pr.top - Math.min(18, pr.height*0.25);
      const {x,y} = pctFromClient(cx, top);
      m.style.left = x + '%';
      m.style.top  = y + '%';
      m.classList.add('attached');
      m.dataset.to = playerEl.id || '';
    }
    function detach(){ m.classList.remove('attached'); m.dataset.to=''; }
    function undockAtPointer(clientX, clientY){
      if (!m.classList.contains('docked')) return;
      pitch.appendChild(m);
      m.classList.remove('docked');
      const {x,y} = pctFromClient(clientX, clientY);
      m.style.left = x + '%';
      m.style.top  = y + '%';
    }
    function redock(){
      detach();
      m.removeAttribute('style');
      m.classList.add('docked');
      toolbar.prepend(m); // sempre primeiro
    }

    on(m,'pointerdown',e=>{
      e.preventDefault();
      dragging = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      const r = m.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      m.setPointerCapture?.(e.pointerId);
    });

    on(window,'pointermove',e=>{
      if (!dragging) return;
      if (!moved){
        const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy);
        if (dx < THRESH && dy < THRESH) return;
        moved = true;
        if (m.classList.contains('docked')) undockAtPointer(sx, sy);
      }
      const r = pitch.getBoundingClientRect();
      const x = Math.max(r.left, Math.min(r.right, e.clientX - offX + m.offsetWidth/2));
      const y = Math.max(r.top , Math.min(r.bottom, e.clientY - offY + m.offsetHeight/2));
      const {x:xp,y:yp} = pctFromClient(x, y);
      m.style.left = xp + '%';
      m.style.top  = yp + '%';
      detach();
    });

    on(window,'pointerup',()=>{
      if (!dragging) return;
      dragging = false;
      if (!moved) return; // clique simples não faz nada
      if (m.classList.contains('docked')) return;
      const {el,d} = findNearestPlayer();
      const SNAP = (IS_MOBILE ? 70 : 92) * 1.3;
      if (d <= SNAP) snapAbove(el);
    });

    on(m,'dblclick', redock);

    return m;
  }

  // ===== Toolbar =====
  function ensureToolbar(pitch){
    let tb = pitch.querySelector('.pitch-toolbar');
    if (!tb){
      tb = document.createElement('div');
      tb.className = 'pitch-toolbar';
      pitch.appendChild(tb);
    }
    tb.innerHTML = '';

    // P primeiro
    const marker = ensurePenaltyMarker(pitch, tb);
    tb.prepend(marker);

    // M — médias
    const bStat = document.createElement('button');
    bStat.type = 'button';
    bStat.className = 'btn-chip stat';
    bStat.textContent = 'M';
    const syncStat = () => {
      const hidden = pitch.classList.contains('hide-stat');
      bStat.classList.toggle('active', !hidden);
      bStat.title = hidden ? 'Mostrar média' : 'Ocultar média';
      bStat.setAttribute('aria-label', bStat.title);
    };
    bStat.onclick = ()=>{ pitch.classList.toggle('hide-stat'); syncStat(); };
    tb.appendChild(bStat); syncStat();

    // ? — dúvidas
    const bDoubt = document.createElement('button');
    bDoubt.type = 'button';
    bDoubt.className = 'btn-chip doubt';
    bDoubt.textContent = '?';
    const syncDoubt = () => {
      const hidden = pitch.classList.contains('hide-doubt');
      bDoubt.classList.toggle('active', !hidden);
      bDoubt.title = hidden ? 'Mostrar dúvidas' : 'Ocultar dúvidas';
      bDoubt.setAttribute('aria-label', bDoubt.title);
    };
    bDoubt.onclick = ()=>{ pitch.classList.toggle('hide-doubt'); syncDoubt(); };
    tb.appendChild(bDoubt); syncDoubt();
  }

  // ===== Reset por clique no nome =====
  function bindCapReset(pitch){
    pitch.querySelectorAll('.player .cap').forEach(cap=>{
      cap.onclick = (e)=>{
        const el = e.currentTarget.closest('.player');
        el.removeAttribute('data-free-x');
        el.removeAttribute('data-free-y');
        const slot = el.dataset.slot;
        place(el, slot, null, pitch.dataset.formacao||'');
      };
    });
  }

  // ===== Draw team =====
  function drawPitch(pitch, team){
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
      place(el, 'TEC', null, team.formacao || '');
      seenIds.add(`p-${+team.tecnico}`);
    }

    pitch.querySelectorAll('.player[id^="p-"]').forEach(el=>{
      if (!seenIds.has(el.id)) el.remove();
    });

    bindCapReset(pitch);
  }

  // ===== Load lineups =====
  async function loadLineups(){
    const base = await jget(`/assets/data/lineups.json?t=${Date.now()}`).catch(()=>({version:1,teams:{}}));
    try{
      const ov = JSON.parse(localStorage.getItem('lineups_override') || 'null');
      if (ov && ov.teams) base.teams = Object.assign(base.teams||{}, ov.teams);
    }catch{}
    return base;
  }

  // ===== Orquestração =====
  async function drawAll() {
    const CURRENT = await loadLineups();
    window.CURRENT_LINEUPS = CURRENT;

    await new Promise(res => {
      const tick = () => document.querySelectorAll('.pitch[data-team]').length ? res() : setTimeout(tick, 40);
      tick();
    });

    document.querySelectorAll('.pitch[data-team]').forEach(pitch => {
      const rawKey = pitch.getAttribute('data-team') || '';
      const team = CURRENT?.teams?.[rawKey];
      const key = team ? rawKey : (Object.keys(CURRENT.teams || {})[0] || rawKey);
      pitch.dataset.scope = key;
      pitch.dataset.formacao = team?.formacao || '';

      if (!team) {
        pitch.innerHTML = '';
        return;
      }

      pitch.classList.add('pitch');
      pitch.classList.add('hide-stat'); // médias ocultas por padrão
      if (!pitch.style.position) pitch.style.position = 'relative';

      ensureToolbar(pitch);
      drawPitch(pitch, team);
    });

    try{
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem('pitch_drag_positions');
      sessionStorage.removeItem('pitch_drag_positions');
    }catch{}

    window.dispatchEvent(new Event('pitch:ready'));
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
