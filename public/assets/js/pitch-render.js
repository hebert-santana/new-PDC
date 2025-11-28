// /assets/js/pitch-render.js
(() => {
  'use strict';

  // ========================================================================
  // FLAGS / HELPERS
  // ========================================================================
  const IS_MOBILE = matchMedia('(max-width: 430px)').matches;
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const PCT = v => `${v}%`;

  // ========================================================================
  // POSIÇÕES (MESMAS DO INFLUENCER)
  // ========================================================================
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
    '4-3-3': {'GOL':[50,89],'ZAG-L':[33,72],'ZAG-C':[50,72],'ZAG-R':[67,72],'LAT-L':[12,66],'LAT-R':[88,66],
              'MEI-L':[26,48],'MEI-C':[50,35],'MEI-R':[74,48],'ATA-L':[22,20],'ATA-C':[50,13],'ATA-R':[78,20],'TEC':[12,91]},
    '4-4-2': {'GOL':[50,89],'ZAG-L':[33,72],'ZAG-C':[50,72],'ZAG-R':[67,72],'LAT-L':[12,66],'LAT-R':[88,66],
              'VOL':[50,55],'MEI-L':[26,44],'MEI-C':[50,30],'MEI-R':[74,44],'ATA-L':[32,13],'ATA-R':[68,13],'TEC':[12,91]},
    '3-5-2': {'GOL':[50,89],'ZAG-L':[26,70],'ZAG-C':[50,68],'ZAG-R':[74,70],'LAT-L':[12,47],'LAT-R':[88,47],
              'VOL':[50,57],'MEI-L':[36,47],'MEI-C':[50,30],'MEI-R':[64,47],'ATA-L':[32,13],'ATA-R':[68,13],'TEC':[12,91]},
    '4-2-3-1': {'GOL':[50,89],'ZAG-L':[40,77],'ZAG-R':[60,77],'LAT-L':[22,79],'LAT-R':[78,79],
              'VOL':[40,66],'VOL2':[60,66],'MEI-L':[36,57],'MEI-C':[50,54],'MEI-R':[64,57],'ATA-C':[50,32],'TEC':[12,91]},
    '3-4-3':{'GOL': [50, 89],'ZAG-L': [26, 70],'ZAG-C': [50, 68],'ZAG-R': [74, 70], 'LAT-L':[12,47],'LAT-R':[88,47],
              'MEI-L': [36, 47],'VOL': [50, 46],'MEI-R': [64, 47],'ATA-L': [22, 25],'ATA-C': [50, 13],'ATA-R': [78, 25],'TEC': [12, 91]}
  };

  // ========================================================================
  // FETCH / MERCADO
  // ========================================================================
  async function jget(url){
    const r = await fetch(url, { cache:'force-cache' });
    if (!r.ok) throw new Error(`fetch ${url} ${r.status}`);
    return r.json();
  }

  async function loadMercado(){
    const CANDIDATES = ['/assets/data/mercado.images.json'];
    for (const u of CANDIDATES){
      try{
        const arr = await jget(u);
        window.MERCADO = { byId: new Map(arr.map(a => [a.atleta_id, a])) };
        return;
      }catch{}
    }
    window.MERCADO = { byId: new Map() };
    console.warn('[pitch] mercado.images.json não encontrado');
  }

  const getA     = id => window.MERCADO?.byId?.get(+id) || null;
  const nome     = id => getA(id)?.apelido_abreviado || getA(id)?.apelido || getA(id)?.nome || String(id);
  const clubIdOf = id => getA(id)?.clube_id ?? 0;
  const foto     = id => (getA(id)?.foto || '').trim() || `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`;

  // ========================================================================
  // POSIÇÃO (mesmo resolvePos do influenciador, simplificado)
  // ========================================================================
  function resolvePos(slot, xy, formacao){
    if (xy && Number.isFinite(+xy.x) && Number.isFinite(+xy.y)){
      return { x: clamp(+xy.x), y: clamp(+xy.y) };
    }
    let p = POS[slot] || POS['MEI-C'];
    if (IS_MOBILE){
      const mp = (MPRESETS[formacao] || {})[slot];
      if (Array.isArray(mp)) p = { x:+mp[0], y:+mp[1] };
    }
    return { x: clamp(+p.x), y: clamp(+p.y) };
  }

  function place(el, slot, xy, formacao){
    const p = resolvePos(slot, xy, formacao);
    el.style.left = PCT(p.x);
    el.style.top  = PCT(p.y);
  }

  // ========================================================================
  // ELEMENTO DO JOGADOR — IGUAL AO DO INFLUENCERS (sem stats)
  // ========================================================================
  function playerEl({id, slot, sit, duvidaCom}){
    const el = document.createElement('figure');
    const clsBase = 'player jogador';          // mesmo combo do influencers
    const clsSit  = (sit === 'duvida') ? 'doubt' : 'ok';
    el.className  = `${clsBase} ${clsSit}` + (slot === 'TEC' ? ' coach' : '');
    el.dataset.id = String(id);
    el.dataset.slot = slot;

    const img = document.createElement('img');
    img.loading  = 'lazy';
    img.decoding = 'async';
    img.width = 92; img.height = 92;
    img.alt   = nome(id);
    img.src   = foto(id);
    img.onerror = () => {
      img.onerror = null;
      img.src = `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`;
    };

    const cap = document.createElement('figcaption');
    cap.className = 'cap';
    cap.textContent = nome(id);

    el.appendChild(img);
    el.appendChild(cap);

    // linha "em dúvida com"
    if (sit === 'duvida' && Number.isFinite(+duvidaCom)) {
      const altCap = document.createElement('div');
      altCap.className = 'alt-cap';
      altCap.textContent = nome(+duvidaCom);
      el.appendChild(altCap);
    }

    return el;
  }

  // ========================================================================
  // LINEUPS + CACHE LOCAL
  // ========================================================================
  async function loadLineups(){
    let cache = null;
    try {
      cache = JSON.parse(localStorage.getItem('lineups_cache') || 'null');
    } catch {}

    let serverVersion = 0;
    try {
      const v = await fetch('/assets/data/lineups.version.json', {
        cache: 'no-store'
      }).then(r => r.json());
      serverVersion = Number(v.version) || 0;
    } catch {
      if (cache) return cache.data;
      throw new Error('Falha ao obter versão do lineups');
    }

    if (cache && cache.version === serverVersion) {
      return cache.data;
    }

    const fresh = await fetch('/assets/data/lineups.json', {
      cache: 'no-store'
    }).then(r => r.json());

    localStorage.setItem('lineups_cache', JSON.stringify({
      version: serverVersion,
      data: fresh
    }));

    return fresh;
  }

  // ========================================================================
  // RENDER
  // ========================================================================
  let CURRENT = null;

  async function drawAll(){
    CURRENT = await loadLineups();

    // espera os pitches existirem
    await new Promise(res=>{
      const tick = () => document.querySelectorAll('.pitch[data-team]').length
        ? res()
        : setTimeout(tick, 30);
      tick();
    });

    document.querySelectorAll('.pitch[data-team]').forEach(pitch=>{
      const teamKey = pitch.getAttribute('data-team');
      const team = CURRENT?.teams?.[teamKey];
      pitch.innerHTML = '';
      if (!team) return;

      const lista = Array.isArray(team.titulares) ? team.titulares : [];

      let hasCoachInTitulares = lista.some(p => String(p.slot||'').toUpperCase() === 'TEC');

      for (const p of lista){
        const id = Number(p.id);
        if (!Number.isFinite(id)) continue;

        const slot = String(p.slot || 'MEI-C').toUpperCase();
        const sit  = (p.sit || 'provavel').toLowerCase();

        const el = playerEl({ id, slot, sit, duvidaCom: p.duvida_com });
        const xy = (p.x!=null && p.y!=null) ? {x:+p.x, y:+p.y} : null;
        place(el, slot, xy, team.formacao || '');
        pitch.appendChild(el);
      }

      if (!hasCoachInTitulares && Number.isFinite(+team.tecnico)){
        const el = playerEl({ id: +team.tecnico, slot:'TEC', sit:'normal' });
        place(el, 'TEC', null, team.formacao || '');
        pitch.appendChild(el);
      }
    });
  }

  // Hot-reload
  try{
    const ch = new BroadcastChannel('lineups');
    ch.onmessage = (e) => { if (e?.data?.type === 'refresh') drawAll(); };
  }catch{}

  // Boot
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
