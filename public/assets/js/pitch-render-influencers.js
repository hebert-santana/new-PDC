// /assets/js/pitch-render-influencers.js
(() => {
  'use strict';

  // ===== CONSTS =====
  const SAVE_KEY = 'pitch_positions_v6'; // mesmo usado no drag-players.js
  const IS_MOBILE = matchMedia('(max-width: 430px)').matches;
  const clamp = (v,a=0,b=100)=>Math.max(a,Math.min(b,v));
  const PCT = v => `${v}%`;
  const SHOW_SLOT_CHIP = false;

  // ===== CSS =====
  (function injectOnce(){
    if (document.getElementById('pitch-view-style')) return;
    const css = `
  :root{ --img:clamp(56px,5.5vw,92px); --img-coach:clamp(44px,4vw,70px); }
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
  /* média abaixo do nome (só nesta página) */
  .player .stat{
    position:absolute;left:50%;top:calc(100% + 24px);transform:translateX(-50%);
    font-size:11px;font-weight:600;color:#0a1324;background:rgba(255,255,255,.95);
    border:1px solid rgba(15,23,42,.12);border-radius:10px;padding:2px 6px;box-shadow:0 2px 6px rgba(2,6,23,.12);
  }
  .player .alt-cap{
    position:absolute;left:50%;top:calc(100% + 44px);transform:translateX(-50%);
    padding:3px 8px;font-size:12px;font-weight:500;line-height:1.05;color:#111;background:rgba(255,255,255,.96);
    border:1px solid rgba(15,23,42,.12);border-radius:10px;box-shadow:0 3px 8px rgba(2,6,23,.14);white-space:nowrap;
  }
  @media (max-width:768px){
    .player .cap{font-size:11px;padding:3px 8px;max-width:80px}
    .player .stat{font-size:10px;top:calc(100% + 20px)}
    .player .alt-cap{font-size:10px;padding:2px 7px;top:calc(100% + 36px)}
  }
  @media (max-width:480px){
    .player .cap{font-size:9px;padding:2px 6px;max-width:68px;margin-top:-5px}
    .player .stat{font-size:9px;top:calc(100% + 14px)}
    .player .alt-cap{font-size:8.5px;padding:2px 5px;top:calc(100% + 26px)}
  }
  /* toolbar por time */
  .pitch-toolbar{position:absolute;right:8px;top:8px;display:flex;gap:6px;z-index:5}
  .pitch-toolbar button{font:600 12px system-ui; padding:6px 8px; border:1px solid #d1d5db; background:#fff; border-radius:8px; cursor:pointer}
  .pitch-toolbar button:hover{background:#f3f4f6}
  /* botão de troca no card */
  .player .swap-btn{
    position:absolute; right:-10px; top:-10px; width:24px; height:24px; border-radius:50%;
    background:#fff; border:1px solid #d1d5db; box-shadow:0 2px 6px rgba(0,0,0,.18);
    display:flex; align-items:center; justify-content:center; font-size:12px; cursor:pointer;
  }
  .player .swap-btn:hover{background:#f3f4f6}
  /* modal simples */
  .swap-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35);z-index:9999}
  .swap-box{width:min(560px,92vw);background:#fff;border-radius:12px;padding:14px;border:1px solid #e5e7eb}
  .swap-box h3{margin:0 0 8px;font:700 16px system-ui}
  .swap-box input{width:100%;padding:8px;border:1px solid #d1d5db;border-radius:8px;font:500 14px system-ui}
  .swap-list{max-height:340px;overflow:auto;margin-top:8px}
  .swap-item{display:flex;align-items:center;gap:8px;padding:6px;border-radius:8px;cursor:pointer}
  .swap-item:hover{background:#f3f4f6}
  .swap-item img{width:28px;height:28px;border-radius:50%}
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

  function place(el, slot, xy, formacao){
    let p = xy || POS[slot] || POS['MEI-C'];
    if (IS_MOBILE) {
      const mp = (MPRESETS[formacao] || {})[slot];
      if (Array.isArray(mp)) p = { x: clamp(+mp[0]), y: clamp(+mp[1]) };
    }
    el.style.left = PCT(p.x);
    el.style.top  = PCT(p.y);
  }

  // transfere posição salva quando trocar id
  function transferSavedPos(scope, oldId, newId){
    try{
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      const oldK = `${scope}:${oldId}`;
      const newK = `${scope}:${newId}`;
      if (saved[oldK]) { saved[newK] = saved[oldK]; delete saved[oldK]; }
      localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    }catch{}
  }

  // ===== criação/reuso de nó + média + botão trocar =====
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

      const stat = document.createElement('div'); // média abaixo do nome
      stat.className = 'stat';
      const m = mediaNum(id);
      stat.textContent = Number.isFinite(m) ? `Média ${m.toFixed(2)}` : 'Média —';

      const swapBtn = document.createElement('button');
      swapBtn.type = 'button';
      swapBtn.className = 'swap-btn';
      swapBtn.title = 'Trocar jogador';
      swapBtn.textContent = '↺';
      swapBtn.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        openSwapModal({
          pitch,
          teamKey: pitch.dataset.scope || pitch.getAttribute('data-team') || '',
          fromId: id,
          slot
        });
      });

      el.appendChild(img);
      el.appendChild(cap);
      el.appendChild(stat);
      el.appendChild(swapBtn);
      pitch.appendChild(el);
    } else {
      el.className = `${clsBase} ${clsSit}` + (slot === 'TEC' ? ' coach' : '');
      const cap = el.querySelector('.cap'); if (cap) cap.textContent = nome(id);
      const stat = el.querySelector('.stat'); if (stat){
        const m = mediaNum(id);
        stat.textContent = Number.isFinite(m) ? `Média ${m.toFixed(2)}` : 'Média —';
      }
      const img = el.querySelector('img'); if (img){ img.alt = nome(id); img.src = foto(id); }
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

  // ===== lineups =====
  async function loadLineups(){
    const base = await jget(`/assets/data/lineups.json?t=${Date.now()}`).catch(()=>({version:1,teams:{}}));
    try{
      const ov = JSON.parse(localStorage.getItem('lineups_override') || 'null');
      if (ov && ov.teams) base.teams = Object.assign(base.teams||{}, ov.teams);
    }catch{}
    return base;
  }
  function saveOverrideTeams(teams){
    const cur = JSON.parse(localStorage.getItem('lineups_override') || '{"teams":{}}');
    cur.teams = teams;
    localStorage.setItem('lineups_override', JSON.stringify(cur));
  }

  // aplica troca no modelo + DOM
function applySwap({pitch, teamKey, fromId, toId, slot}){
  const CURRENT = window.CURRENT_LINEUPS || {teams:{}};
  const team = CURRENT.teams?.[teamKey];
  if (!team) return;

  const list = Array.isArray(team.titulares) ? team.titulares : [];
  const wantSlot = String(slot||'MEI-C').toUpperCase();
  let updated = false;

  // 1) tenta pelo id atual
  for (const p of list){
    if (+p.id === +fromId){
      p.id = +toId;
      p.slot = wantSlot;
      updated = true;
      break;
    }
  }
  // 2) se não achou, substitui quem ocupa o mesmo slot
  if (!updated){
    const tgt = list.find(p => String(p.slot||'').toUpperCase() === wantSlot);
    if (tgt){ tgt.id = +toId; tgt.slot = wantSlot; updated = true; }
  }
  // 3) fallback: inclui
  if (!updated) list.push({ id:+toId, slot:wantSlot, sit:'provavel' });

  CURRENT.teams[teamKey].titulares = list;
  window.CURRENT_LINEUPS = CURRENT;
  saveOverrideTeams(CURRENT.teams);

  transferSavedPos(teamKey, fromId, toId); // mantém posição
  drawPitch(pitch, CURRENT.teams[teamKey]);
}


  // ===== toolbar por time (Reset) =====
  function ensureToolbar(pitch, teamKey, team){
    let tb = pitch.querySelector('.pitch-toolbar');
    if (!tb){
      tb = document.createElement('div');
      tb.className = 'pitch-toolbar';
      pitch.appendChild(tb);
    }
    tb.innerHTML = '';
    // Reset por time
    const bReset = document.createElement('button');
    bReset.textContent = 'Reset time';
    bReset.title = 'Zerar posições salvas deste time';
  bReset.addEventListener('click', ()=>{
  const scope = pitch.dataset.scope || pitch.getAttribute('data-team') || '';
  try{
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    let changed = false;
    for (const k of Object.keys(saved)){
      if (k.startsWith(scope + ':')){ delete saved[k]; changed = true; }
    }
    if (changed) localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
  }catch{}
  // redesenha nas posições padrão
  drawPitch(pitch, team);
});

    tb.appendChild(bReset);
  }

  // ===== modal de troca =====
  let modal, input, listBox, pendingSwap;
  function buildModal(){
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'swap-modal';
    modal.innerHTML = `
      <div class="swap-box">
        <h3>Trocar jogador</h3>
        <input type="text" placeholder="Digite o nome...">
        <div class="swap-list"></div>
      </div>`;
    document.body.appendChild(modal);
    input = modal.querySelector('input');
    listBox = modal.querySelector('.swap-list');

    modal.addEventListener('click', (e)=>{ if (e.target === modal) closeSwapModal(); });
    input.addEventListener('input', renderSearch);
    input.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeSwapModal(); });
  }
  function openSwapModal({pitch, teamKey, fromId, slot}){
    buildModal();
    pendingSwap = {pitch, teamKey, fromId, slot};
    input.value = '';
    renderSearch();
    modal.style.display = 'flex';
    setTimeout(()=>input.focus(), 0);
  }
  function closeSwapModal(){
    modal.style.display = 'none';
    pendingSwap = null;
  }
  function renderSearch(){
    const q = input.value.trim().toLowerCase();
    const arr = Array.from(window.MERCADO?.byId?.values() || []);
    const filt = q ? arr.filter(a => (a.apelido_abreviado||a.apelido||a.nome||'').toLowerCase().includes(q)) : arr;
    // ordem: maior média primeiro
    filt.sort((a,b)=> (b.media_num||0) - (a.media_num||0));
    const top = filt.slice(0, 50);

    listBox.innerHTML = '';
    for (const a of top){
      const it = document.createElement('div');
      it.className = 'swap-item';
      it.innerHTML = `<img src="${(a.foto||'').trim() || '/assets/img/escudos/cartola/'+(a.clube_id||0)+'.jpg'}" alt="">
        <div>
          <div style="font-weight:700">${a.apelido_abreviado||a.apelido||a.nome}</div>
          <div style="font-size:12px;color:#555">Média ${Number(a.media_num||0).toFixed(2)} · Clube ${a.clube_id}</div>
        </div>`;
      it.addEventListener('click', ()=>{
        const toId = a.atleta_id;
        const {pitch, teamKey, fromId, slot} = pendingSwap || {};
        closeSwapModal();
        if (pitch && teamKey) applySwap({pitch, teamKey, fromId, toId, slot});
      });
      listBox.appendChild(it);
    }
  }

  // ===== render =====
  function drawPitch(pitch, team){
    // limpar apenas jogadores
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
      const teamKey = pitch.getAttribute('data-team');
      const team = CURRENT?.teams?.[teamKey];
      if (!team) { pitch.innerHTML = ''; return; }

      pitch.classList.add('pitch');
      if (!pitch.style.position) pitch.style.position = 'relative';
      if (!pitch.dataset.scope)  pitch.dataset.scope = teamKey;

      ensureToolbar(pitch, teamKey, team);
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
