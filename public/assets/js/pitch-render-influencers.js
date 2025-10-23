// /assets/js/pitch-render-influencers.js
(() => {
  'use strict';

  // ===== CSS injetado =====
  (function injectOnce(){
    if (document.getElementById('pitch-view-style')) return;
    const css = `
  :root{
    --img: clamp(56px, 5.5vw, 92px);
    --img-coach: clamp(44px, 4vw, 70px);
  }
  .player{position:absolute;transform:translate(-50%,-50%);text-align:center;width:var(--img);height:var(--img);overflow:visible}
  .player img{display:block;width:var(--img);height:var(--img);border-radius:50%;background:#fff;border:2px solid #fff;outline:1px solid rgba(15,23,42,.08);box-shadow:0 4px 14px rgba(0,0,0,.28)}
  .player.ok img{ box-shadow:0 0 0 3px #22c55e,0 6px 14px rgba(0,0,0,.28) }
  .player.doubt img{ box-shadow:0 0 0 3px #f59e0b,0 6px 14px rgba(0,0,0,.28) }
  .player.coach{width:var(--img-coach);height:var(--img-coach)}
  .player.coach img{width:var(--img-coach);height:var(--img-coach)}
  .player .cap{
    position:absolute;left:50%;top:100%;transform:translateX(-50%);
    margin-top:6px;padding:4px 10px;font-size:13px;font-weight:600;line-height:1.05;letter-spacing:.15px;
    color:#0a1324;background:rgba(255,255,255,.98);border:1px solid rgba(15,23,42,.14);border-radius:12px;
    box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 4px 10px rgba(2,6,23,.18);white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;
  }
  .player .alt-cap{
    position:absolute;left:50%;top:calc(100% + 28px);transform:translateX(-50%);
    padding:3px 8px;font-size:12px;font-weight:500;line-height:1.05;color:#111;background:rgba(255,255,255,.96);
    border:1px solid rgba(15,23,42,.12);border-radius:10px;box-shadow:0 3px 8px rgba(2,6,23,.14);white-space:nowrap;
  }
  @media (max-width:768px){
    .player .cap{font-size:11px;padding:3px 8px;max-width:80px}
    .player .alt-cap{font-size:10px;padding:2px 7px;top:calc(100% + 22px)}
  }
  @media (max-width:480px){
    .player .cap{font-size:9px;padding:2px 6px;max-width:68px;margin-top:-5px}
    .player .alt-cap{font-size:8.5px;padding:2px 5px;top:calc(100% + 8px)}
  }`;
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
  const IS_MOBILE = matchMedia('(max-width: 430px)').matches;
  const clamp = (v,a=0,b=100)=>Math.max(a,Math.min(b,v));
  const PCT = v => `${v}%`;
  const SHOW_SLOT_CHIP = false;

  // ===== dados mercado =====
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
  const nome = id => {
    const a = window.MERCADO?.byId?.get(+id);
    return a?.apelido_abreviado || a?.apelido || a?.nome || String(id);
  };
  const clubIdOf = id => window.MERCADO?.byId?.get(+id)?.clube_id ?? 0;
  const foto = id => {
    const a = window.MERCADO?.byId?.get(+id);
    const f = (a?.foto || '').trim();
    return f || `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`;
  };

  // ===== criação/reuso de nó =====
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

      el.appendChild(img);
      el.appendChild(cap);
      pitch.appendChild(el);
    } else {
      el.className = `${clsBase} ${clsSit}` + (slot === 'TEC' ? ' coach' : '');
      const cap = el.querySelector('.cap');
      if (cap) cap.textContent = nome(id);
      const img = el.querySelector('img');
      if (img) img.alt = nome(id);
    }

    // alt-cap
    el.querySelectorAll('.alt-cap').forEach(n=>n.remove());
    if (sit === 'duvida' && Number.isFinite(+duvidaCom)) {
      const alt = document.createElement('div');
      alt.className = 'alt-cap';
      alt.textContent = nome(+duvidaCom);
      el.appendChild(alt);
    }
    return el;
  }

  function place(el, slot, xy, formacao){
    let p = xy || POS[slot] || POS['MEI-C'];
    if (IS_MOBILE) {
      const mp = (MPRESETS[formacao] || {})[slot];
      if (Array.isArray(mp)) p = { x: clamp(+mp[0]), y: clamp(+mp[1]) };
    }
    el.style.left = PCT(p.x);
    el.style.top  = PCT(p.y);
  }

  async function loadLineups(){
    const base = await jget(`/assets/data/lineups.json?t=${Date.now()}`).catch(()=>({version:1,teams:{}}));
    try{
      const ov = JSON.parse(localStorage.getItem('lineups_override') || 'null');
      if (ov && ov.teams) base.teams = Object.assign(base.teams||{}, ov.teams);
    }catch{}
    return base;
  }

  async function drawAll(){
    const CURRENT = await loadLineups();

    // aguarda pitches
    await new Promise(res=>{
      const tick = () => document.querySelectorAll('.pitch[data-team]').length ? res() : setTimeout(tick, 40);
      tick();
    });

    document.querySelectorAll('.pitch[data-team]').forEach(pitch=>{
      const teamKey = pitch.getAttribute('data-team');
      const team = CURRENT?.teams?.[teamKey];
      if (!team) { pitch.innerHTML = ''; return; }

      pitch.classList.add('pitch');
      if (!pitch.style.position) pitch.style.position = 'relative';
      if (!pitch.dataset.scope)  pitch.dataset.scope = teamKey;

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

      // técnico, se não veio
      const hasCoach = lista.some(p => String(p.slot||'').toUpperCase() === 'TEC');
      if (!hasCoach && Number.isFinite(+team.tecnico)){
        const el = ensurePlayerEl(pitch, { id:+team.tecnico, slot:'TEC', sit:'normal' });
        place(el, 'TEC');
        seenIds.add(`p-${+team.tecnico}`);
      }

      // remove órfãos (evita duplicados residual)
      pitch.querySelectorAll('.player[id^="p-"]').forEach(el=>{
        if (!seenIds.has(el.id)) el.remove();
      });
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
