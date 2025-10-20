(() => {
  'use strict';

  // ===== Estilo mínimo injetado para o index (pílula branca do nome) =====
  (function injectOnce(){
    if (document.getElementById('pitch-view-style')) return;
    const css = `
  .player{position:absolute;transform:translate(-50%,-50%);text-align:center;width:92px;height:92px;overflow:visible}
  .player img{display:block;width:92px;height:92px;border-radius:50%;background:#fff;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.28)}
  .player .cap{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:6px;font-size:12.5px;line-height:1.1;color:#0b192b;background:rgba(255,255,255,.96);border-radius:12px;padding:3px 8px;white-space:nowrap;max-width:160px;display:inline-block}
  .player .alt-cap{position:absolute;left:50%;top:calc(100% + 24px);transform:translateX(-50%);font-size:11.5px;line-height:1.1;color:#111;background:rgba(255,255,255,.96);border-radius:10px;padding:2px 7px;display:inline-block;white-space:nowrap}
  .player.ok img{box-shadow:0 0 0 3px #22c55e,0 6px 14px rgba(0,0,0,.28)}
  .player.doubt img{box-shadow:0 0 0 3px #f59e0b,0 6px 14px rgba(0,0,0,.28)}
  .player.coach{width:70px;height:70px}
  .player.coach img{width:70px;height:70px;margin:0 auto}

}

    `;
    const s = document.createElement('style');
    s.id = 'pitch-view-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // ===== Layout padrão em % =====
  const POS = {
    GOL:{x:50,y:90},
    'ZAG-L':{x:35,y:75}, 'ZAG-C':{x:50,y:75}, 'ZAG-R':{x:65,y:75},
    'LAT-L':{x:20,y:78}, 'LAT-R':{x:80,y:78},
    VOL:{x:50,y:65},
    'MEI-L':{x:30,y:58}, 'MEI-C':{x:50,y:55}, 'MEI-R':{x:70,y:58},
    'ATA-L':{x:35,y:30}, 'ATA-C':{x:50,y:25}, 'ATA-R':{x:65,y:30},
    TEC:{x:92,y:96}
  };
  const PCT = v => `${v}%`;

  // Não mostrar a legenda da posição no index
  const SHOW_SLOT_CHIP = false;

  // ===== Util =====
  async function jget(url){
    const r = await fetch(url, { cache:'no-store' });
    if(!r.ok) throw new Error(`fetch ${url} ${r.status}`);
    return r.json();
  }

  // Carrega mercado
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

  const nome = id => {
    const a = window.MERCADO?.byId?.get(+id);
    return a?.apelido_abreviado || a?.apelido || a?.nome || String(id);
  };
  const clubIdOf = id => window.MERCADO?.byId?.get(+id)?.clube_id ?? 0;

  // Foto com fallback para escudo .jpg
  const foto = id => {
    const a = window.MERCADO?.byId?.get(+id);
    const f = (a?.foto || '').trim();
    if (f) return f;
    return `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`;
  };

  // ===== Elemento do jogador =====
  function playerEl({id, slot, sit, duvidaCom}){
    const el = document.createElement('figure');
    el.className = 'player ' + (sit === 'duvida' ? 'doubt' : 'ok');
    if (slot === 'TEC') el.classList.add('coach');
    el.dataset.id = id;
    el.dataset.slot = slot;

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 92; img.height = 92;
    img.alt = `${nome(id)}`;
    img.src = foto(id);
    img.onerror = () => { img.onerror = null; img.src = `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`; };

    const cap = document.createElement('figcaption');
    cap.className = 'cap';
    cap.textContent = nome(id);

    el.appendChild(img);
    el.appendChild(cap);

    if (sit === 'duvida' && Number.isFinite(+duvidaCom)) {
      const alt = document.createElement('div');
      alt.className = 'alt-cap';
      alt.textContent = nome(+duvidaCom);
      el.appendChild(alt);
    }

    if (SHOW_SLOT_CHIP) {
      const chip = document.createElement('span');
      chip.className = 'slot-chip';
      chip.textContent = slot;
      el.appendChild(chip);
    }

    return el;
  }

  function place(el, slot, xy){
    const p = xy || POS[slot] || POS['MEI-C'];
    el.style.left = PCT(p.x);
    el.style.top  = PCT(p.y);
  }

  // ===== Lineups + override =====
  async function loadLineups(){
    const base = await jget(`/assets/data/lineups.json?t=${Date.now()}`).catch(()=>({version:1,tz:"-03:00",teams:{}}));
    try{
      const ov = JSON.parse(localStorage.getItem('lineups_override') || 'null');
      if (ov && ov.teams) base.teams = Object.assign(base.teams||{}, ov.teams);
    }catch{}
    return base;
  }

  let CURRENT = null;

  // ===== Render =====
  async function drawAll(){
    CURRENT = await loadLineups();

    await new Promise(res=>{
      const tick = () => document.querySelectorAll('.pitch[data-team]').length ? res() : setTimeout(tick, 30);
      tick();
    });

    document.querySelectorAll('.pitch[data-team]').forEach(pitch=>{
      const teamKey = pitch.getAttribute('data-team');
      const team = CURRENT?.teams?.[teamKey];
      pitch.innerHTML = '';
      if (!team) return;

      const lista = Array.isArray(team.titulares) ? team.titulares : [];

      // Detecta se o técnico já veio na lista de titulares
      let hasCoachInTitulares = lista.some(p => String(p.slot||'').toUpperCase() === 'TEC');

      for (const p of lista){
        const id = Number(p.id);
        if (!Number.isFinite(id)) continue;

        const slot = String(p.slot || 'MEI-C').toUpperCase();
        const sit  = (p.sit || 'provavel').toLowerCase();

        const el = playerEl({ id, slot, sit, duvidaCom: p.duvida_com });
        const xy = (p.x!=null && p.y!=null) ? {x:+p.x, y:+p.y} : null;
        place(el, slot, xy);
        pitch.appendChild(el);
      }

      // Adiciona técnico somente se NÃO estiver nos titulares
      if (!hasCoachInTitulares && Number.isFinite(+team.tecnico)){
        const el = playerEl({ id: +team.tecnico, slot:'TEC', sit:'normal' });
        place(el, 'TEC');
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
