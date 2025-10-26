(() => {
  'use strict';

  // ===== Estilo mínimo injetado para o index (pílula branca do nome) =====
(function injectOnce(){
  // evita injetar o estilo duas vezes
  if (document.getElementById('pitch-view-style')) return;

  const css = `
/* ===================== VARIÁVEIS GERAIS ===================== */
:root{
  /* Fonte padrão */
  --font-ui: system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,Arial,sans-serif;

  /* Tamanho fluido dos avatares (camisas dos jogadores) */
  --img: clamp(56px, 4.5vw, 92px);          /* jogador */
  --img-coach: clamp(44px, 2vw, 70px);      /* técnico */

  /* Tamanhos de fonte das pílulas (nome e subtítulo) */
  --cap-fs: clamp(8.5px, 0.8vw, 13px);     /* nome principal */
  --altcap-fs: clamp(8px, .8vw, 12px);     /* subtítulo abaixo */

  /* Espaçamento interno das pílulas (em unidades relativas ao texto) */
  --cap-pad-y: .35em;   --cap-pad-x: .8em;
  --altcap-pad-y: .3em; --altcap-pad-x: .7em;

  /* Largura máxima das pílulas baseada no tamanho do avatar */
  --cap-max: calc(var(--img) * 1.6);

  /* Espessura e cores do anel (contorno de status) */
  --ring-w: .18em;
  --ring-ok:#16a34a;     /* provável */
  --ring-duv:#f59e0b;    /* dúvida */
  --ring:#16a34a;        /* default */
}

/* ===================== BASE GLOBAL ===================== */
html,body,.player .cap,.player .alt-cap,.status-card{
  font-family:var(--font-ui);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

/* ===================== AVATAR (IMAGEM DO JOGADOR) ===================== */
.player{
  position:absolute;
  transform:translate(-50%,-50%);
  text-align:center;
  width:var(--img);
  height:var(--img);
  overflow:visible;
}

/* Círculo da camisa */
.player img{
  display:block;
  width:var(--img);
  height:var(--img);
  border-radius:50%;
  background:#fff;
  border:.12em solid #fff;
  outline:1px solid rgba(15,23,42,.08);
  box-shadow:0 .35em .9em rgba(0,0,0,.28);
  transition:transform .12s ease;
}

/* ===================== SOMBRA OVAL (EFEITO 3D ABAIXO DO JOGADOR) ===================== */
.player::before{
  content:"";
  position:absolute;
  left:50%;
  top:100%;
  transform:translate(-50%,-38%);
  width:76%;
  height:clamp(6px, 2.2vw, 18px);
  background:radial-gradient(ellipse at center, rgba(0,0,0,.28) 0%, rgba(0,0,0,0) 70%);
  filter:blur(clamp(2px, .6vw, 5px));
  opacity:.55;
  pointer-events:none;
  z-index:0;
}

/* Garante que nome e imagem fiquem acima da sombra */
.player img,.player .cap,.player .alt-cap{
  position:relative;
  z-index:1;
}

/* ===================== PÍLULA PRINCIPAL (NOME DO JOGADOR) ===================== */
.player .cap{
  position:absolute;
  left:50%;
  top:100%;
  transform:translateX(-50%);
  margin-top:.45em;
  padding:var(--cap-pad-y) var(--cap-pad-x);
  font-size:var(--cap-fs);
  font-weight:600;
  line-height:1.05;
  letter-spacing:.015em;
  color:#0a1324;
  background:rgba(255,255,255,.98);
  border:1px solid rgba(15,23,42,.14);
  border-radius:12px;
  box-shadow:0 1px 0 rgba(255,255,255,.6) inset, 0 .35em .8em rgba(2,6,23,.18);
  white-space:nowrap;
  max-width:var(--cap-max);
  overflow:hidden;
  text-overflow:ellipsis;
  backdrop-filter:saturate(120%) blur(2px);
}

/* ===================== PÍLULA SECUNDÁRIA (MÉDIA, POSIÇÃO ETC.) ===================== */
.player .alt-cap{
  position:absolute;
  left:50%;
  top:calc(100% + 2.2em);
  transform:translateX(-50%);
  padding:var(--altcap-pad-y) var(--altcap-pad-x);
  font-size:var(--altcap-fs);
  font-weight:500;
  line-height:1.05;
  color:#111;
  background:rgba(255,255,255,.96);
  border:1px solid rgba(15,23,42,.12);
  border-radius:10px;
  box-shadow:0 .25em .7em rgba(2,6,23,.14);
  white-space:nowrap;
}

/* ===================== STATUS (ANEL COLORIDO EM VOLTA DO JOGADOR) ===================== */
.player.ok img{
  box-shadow:0 0 0 var(--ring-w) var(--ring-ok), 0 .6em .9em rgba(0,0,0,.28);
}
.player.doubt img{
  box-shadow:0 0 0 var(--ring-w) var(--ring-duv), 0 .6em .9em rgba(0,0,0,.28);
}

/* ===================== TÉCNICO (AVATAR MENOR) ===================== */
.player.coach{
  width:var(--img-coach);
  height:var(--img-coach);
}
.player.coach img{
  width:var(--img-coach);
  height:var(--img-coach);
  margin:0 auto;
}

/* ===================== HOVER (EFEITO AO PASSAR MOUSE) ===================== */
@media (hover:hover){
  .pitch .player:hover img{ transform:scale(1.03); }
}

/* ===================== CHIPS DE STATUS (OUTRAS INFORMAÇÕES NA TELA) ===================== */
.status-card .sg-title{ font-weight:700 }
.status-card .tag-list{
  display:flex;
  flex-wrap:wrap;
  gap:.4em;
}
.status-card .tag-list>*{
  display:inline-block;
  padding:.35em .75em;
  font-size:clamp(11px, .95vw, 13px);
  font-weight:600;
  line-height:1.05;
  letter-spacing:.01em;
  color:#0a1324;
  background:#fff;
  border:1px solid rgba(15,23,42,.12);
  border-radius:12px;
  box-shadow:0 .25em .6em rgba(2,6,23,.10);
}

/* ===================== AJUSTES RESPONSIVOS ===================== */
/* Tablets e telas médias */
@media (max-width:768px){
  :root{
    --cap-fs: clamp(9px, 1.9vw, 11px);
    --altcap-fs: clamp(8px, 1.7vw, 10px);
    --cap-max: calc(var(--img) * 1.8);
  }
  .player .alt-cap{ top:calc(100% + 1.8em); }
}

/* Celulares pequenos */
@media (max-width:480px){
  :root{
    --img: clamp(40px,9vw,56px); } /* avatar menor */
    --cap-fs: clamp(8px, 1.6vw, 10px);
    --altcap-fs: clamp(7.8px, 2.4vw, 9.5px);
    --cap-max: calc(var(--img) * 1.05);
  }
  .player .cap{ margin-top:.2em; }
  .player .alt-cap{ top:calc(100% + 1.2em); }
}

/* Ajuste final para telas muito estreitas */
@media (max-width:420px){
  :root{ --cap-max: calc(var(--img) * 1.3); }
}
`;

  // injeta no documento
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

  // Presets específicos para mobile (ajuste como preferir)
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
const IS_MOBILE = matchMedia('(max-width: 430px)').matches;
const clamp = (v,a=0,b=100)=>Math.max(a,Math.min(b,v));


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

 function place(el, slot, xy, formacao){
   let p = xy || POS[slot] || POS['MEI-C'];
   if (IS_MOBILE) {
     const mp = (MPRESETS[formacao] || {})[slot];
     if (Array.isArray(mp)) p = { x: clamp(+mp[0]), y: clamp(+mp[1]) };
   }
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
        place(el, slot, xy, team.formacao || '');
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
