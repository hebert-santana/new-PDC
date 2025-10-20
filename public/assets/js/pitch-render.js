(() => {
  'use strict';

  // ===== Estilo mínimo injetado para o index (pílula branca do nome) =====
(function injectOnce(){
  if (document.getElementById('pitch-view-style')) return;
  const css = `

  :root{ --font-ui: system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,Arial,sans-serif; }
html,body,.player .cap,.player .alt-cap,.status-card{ font-family:var(--font-ui); -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }


.player{position:absolute;transform:translate(-50%,-50%);text-align:center;width:92px;height:92px;overflow:visible}
.player img{display:block;width:92px;height:92px;border-radius:50%;background:#fff;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.28)}

/* sombra oval 3D sob o jogador */
.player::before{content:"";position:absolute;left:50%;top:100%;transform:translate(-50%,-40%);width:70%;height:20px;background:radial-gradient(ellipse at center, rgba(0,0,0,.25) 0%, rgba(0,0,0,0) 80%);filter:blur(4px);opacity:.45;pointer-events:none;z-index:0}
.player img,.player .cap,.player .alt-cap{position:relative;z-index:1}
.player img{ border:2px solid #fff; outline:1px solid rgba(15,23,42,.08); }


.player .cap{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:6px;padding:4px 10px;font-size:13px;font-weight:600;line-height:1.05;letter-spacing:.1px;color:#0a1324;background:rgba(255,255,255,.98);border:1px solid rgba(15,23,42,.12);border-radius:12px;box-shadow:0 4px 10px rgba(2,6,23,.18);white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;backdrop-filter:saturate(120%) blur(2px)}
.player .alt-cap{position:absolute;left:50%;top:calc(100% + 28px);transform:translateX(-50%);padding:3px 8px;font-size:12px;font-weight:500;line-height:1.05;color:#111;background:rgba(255,255,255,.96);border:1px solid rgba(15,23,42,.12);border-radius:10px;box-shadow:0 3px 8px rgba(2,6,23,.14);white-space:nowrap}

.player.ok    img{ box-shadow:0 0 0 3px #22c55e,0 6px 14px rgba(0,0,0,.28) }
.player.doubt img{ box-shadow:0 0 0 3px #f59e0b,0 6px 14px rgba(0,0,0,.28) }
.player.coach{width:70px;height:70px}
.player.coach img{width:70px;height:70px;margin:0 auto}

.status-card .sg-title{font-weight:700}
.status-card .tag-list{display:flex;flex-wrap:wrap;gap:6px}
.status-card .tag-list>*{display:inline-block;padding:4px 10px;font-size:13px;font-weight:600;line-height:1.05;letter-spacing:.1px;color:#0a1324;background:#fff;border:1px solid rgba(15,23,42,.12);border-radius:12px;box-shadow:0 3px 8px rgba(2,6,23,.10)}


.player::before{
  content:""; position:absolute; left:50%; top:100%; transform:translate(-50%,-38%);
  width:76%; height:18px; background:radial-gradient(ellipse at center, rgba(0,0,0,.28) 0%, rgba(0,0,0,0) 70%);
  filter:blur(5px); opacity:.55; pointer-events:none; z-index:0;
}

.player .cap{
  border:1px solid rgba(15,23,42,.14);
  box-shadow:0 1px 0 rgba(255,255,255,.6) inset, 0 4px 10px rgba(2,6,23,.18);
  letter-spacing:.15px;
}


.pitch .player:hover img{ transform:scale(1.03); transition:transform .12s ease; }


.player .cap,.player .alt-cap{ white-space:nowrap; max-width:160px; text-overflow:ellipsis; overflow:hidden; }
@media (max-width:420px){ .player .cap{ max-width:130px } }


.status-card .tag-list>*{
  padding:4px 10px; font-size:13px; font-weight:600; color:#0a1324;
  background:#fff; border:1px solid rgba(15,23,42,.12);
  border-radius:12px; box-shadow:0 3px 8px rgba(2,6,23,.10);
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
