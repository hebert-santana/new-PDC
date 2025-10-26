// /assets/js/pitch-render-influencers.js
// Render do campinho para a área de Influenciadores
(() => {
  'use strict';

  /* =========================================================================
     FLAGS E UTILIDADES BÁSICAS
     ========================================================================= */
  const SAVE_KEY   = 'pitch_positions_v6';                  // chave de drag (desativado nesta página)
  const IS_MOBILE  = matchMedia('(max-width: 430px)').matches;
  const clamp = (v, a=0, b=100) => Math.max(a, Math.min(b, v));
  const PCT   = v => `${v}%`;

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
 // /assets/js/pitch-render-influencers.js
// Injeta TODO o CSS necessário para o pitch de influenciadores.
(() => {
  if (document.getElementById('pitch-view-style')) return;

  const css = `
/* =========================================================
   VARS GERAIS — escalonamento e aparência
   ========================================================= */
:root{
  /* Avatares fluidos */
  --img: clamp(56px, 4.5vw, 92px);      /* jogador */
  --img-coach: clamp(44px, 2vw, 70px);  /* técnico */

  /* Distâncias verticais entre avatar e pílulas */
  --gap-label: 26px;

  /* Font-sizes das pílulas */
  --cap-fs:     clamp(8.5px, .7vw, 13px);  /* nome principal */
  --altcap-fs:  clamp(8px,   .7vw, 12px);  /* pílula secundária */
  --chip-fs:    clamp(9.5px, .7vw, 11.5px);

  /* Paddings relativos ao texto */
  --cap-py:.35em;  --cap-px:.8em;
  --altcap-py:.3em;--altcap-px:.7em;
  --chip-py:.2em;  --chip-px:.6em;

  /* Largura máx. do nome: proporcional ao avatar */
  --cap-max: calc(var(--img) * 1.6);

  /* Anéis de status */
  --ring-w:.18em; --ring-ok:#16a34a; --ring-duv:#f59e0b;

  /* Toolbar chips */
  --chip-size: clamp(22px, 2.4vw, 26px);
  --chip-ring:#ffd54a; --chip-fg:#0b192b;
}

/* =========================================================
   DICA FIXA PARA INFLUENCIADORES
   ========================================================= */
.influ-hint{
  position:sticky; top:8px;
  background:#0b192b; color:#fff;
  padding:6px 10px; border-radius:8px;
  font-size:.9rem;
}

/* =========================================================
   AVATAR E INTERAÇÃO
   ========================================================= */
.pitch .player,
.pitch .jogador{ cursor:grab; }
.pitch .player:active,
.pitch .jogador:active{ cursor:grabbing; }

.player{
  position:absolute; transform:translate(-50%,-50%);
  text-align:center; width:var(--img); height:var(--img);
  overflow:visible; touch-action:manipulation;
}
.player img{
  display:block; width:var(--img); height:var(--img);
  border-radius:50%; background:#fff; border:.12em solid #fff;
  outline:1px solid rgba(15,23,42,.08);
  box-shadow:0 .35em .9em rgba(0,0,0,.28);
  pointer-events:none; user-select:none; transition:transform .12s ease;
}
@media (hover:hover){
  .pitch .player:hover img{ transform:scale(1.03); }
}

/* Status ring */
.player.ok img{   box-shadow:0 0 0 var(--ring-w) var(--ring-ok), 0 .6em .9em rgba(0,0,0,.28) }
.player.doubt img{box-shadow:0 0 0 var(--ring-w) var(--ring-duv), 0 .6em .9em rgba(0,0,0,.28) }

/* Técnico com tamanho próprio */
.player.coach{ width:var(--img-coach); height:var(--img-coach) }
.player.coach img{ width:var(--img-coach); height:var(--img-coach) }

/* =========================================================
   PÍLULAS E CHIPS
   - pointer-events:none => arraste inicia mesmo clicando no texto
   ========================================================= */
.player .cap,
.player .stat,
.player .alt-cap,
.player .alt-stat{
  position:absolute; left:50%; transform:translateX(-50%);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  max-width: var(--cap-max);
  pointer-events:none;
}

/* Nome principal */
.player .cap{
  top:calc(100% + 0px);
  padding:var(--cap-py) var(--cap-px);
  font-size:var(--cap-fs); font-weight:600; line-height:1.05; letter-spacing:.015em;
  color:#0a1324; background:rgba(255,255,255,.98);
  border:1px solid rgba(15,23,42,.14); border-radius:12px;
  box-shadow:0 1px 0 rgba(255,255,255,.6) inset, 0 .35em .8em rgba(2,6,23,.18);
  backdrop-filter:saturate(120%) blur(2px);
}

/* Chip primário (média/MM/MV) */
.player .stat{
  top:calc(100% + var(--gap-label));
  font-size:var(--chip-fs); font-weight:800; letter-spacing:.01em;
  color:#fff; background:#16a34a; border:1px solid rgba(22,163,74,.6);
  border-radius:10px; padding:var(--chip-py) var(--chip-px);
  box-shadow:0 2px 6px rgba(2,6,23,.12);
}
.player .stat.amber{ background:#f59e0b; border-color:rgba(245,158,11,.6) }
.player .stat.red{   background:#ef4444; border-color:rgba(239,68,68,.6) }

/* Pílula secundária (ex.: “dúvida com”) */
.player .alt-cap{
  top:calc(100% + (var(--gap-label) * 1.8));
  padding:var(--altcap-py) var(--altcap-px);
  font-size:var(--altcap-fs); font-weight:600; line-height:1.05; color:#111;
  background:rgba(255,255,255,.96);
  border:1px solid rgba(15,23,42,.12); border-radius:10px;
  box-shadow:0 3px 8px rgba(2,6,23,.14);
}

/* Chip secundário (aparece quando cap + stat existem) */
.player .alt-stat{
  top:calc(100% + (var(--gap-label) * 2.55));
  font-size:var(--chip-fs); font-weight:800; letter-spacing:.01em;
  color:#fff; background:#16a34a; border:1px solid rgba(22,163,74,.6);
  border-radius:10px; padding:var(--chip-py) var(--chip-px);
  box-shadow:0 2px 6px rgba(2,6,23,.12);
  display:none;
}
.player .alt-stat.amber{ background:#f59e0b; border-color:rgba(245,158,11,.6) }
.player .alt-stat.red{   background:#ef4444; border-color:rgba(239,68,68,.6) }

/* Estados dirigidos pela <div class="pitch"> */
.pitch.hide-stat .player .stat{ display:none }
.pitch.hide-stat .player .alt-cap{ top:calc(100% + var(--gap-label)) }
.pitch.hide-doubt .player .alt-cap,
.pitch.hide-doubt .player .alt-stat{ display:none }
.pitch:not(.hide-stat):not(.hide-doubt) .player .alt-cap + .alt-stat{ display:block }

/* =========================================================
   TOOLBAR (chips e marcador de pênalti)
   ========================================================= */
.pitch-toolbar{
  position:absolute; right:.5rem; top:.5rem;
  display:flex; align-items:center; gap:.5rem; z-index:9;
}

/* Botões circulares */
.pitch-toolbar .btn-chip{
  width:var(--chip-size); height:var(--chip-size);
  border-radius:999px; display:inline-flex; align-items:center; justify-content:center;
  font:800 clamp(10px, .9vw, 12px)/1 system-ui; color:var(--chip-fg);
  background:rgba(255,255,255,.96);
  border:2px solid rgba(11,25,43,.22);
  box-shadow:0 1px 4px rgba(2,6,23,.14), 0 0 0 2px rgba(255,255,255,.6) inset;
  cursor:pointer; user-select:none; padding:0;
  transition:transform .05s ease, background .12s ease, box-shadow .12s ease, border-color .12s ease;
}
.pitch-toolbar .btn-chip:hover{ background:#fff }
.pitch-toolbar .btn-chip:active{ transform:translateY(1px) }
.pitch-toolbar .btn-chip.active{
  color:#111;
  background:linear-gradient(135deg,#ffd37a,#ffb24e 60%,#ffa34a);
  border-color:rgba(251,89,4,.35);
  box-shadow:0 2px 10px rgba(251,89,4,.22), 0 0 0 2px var(--chip-ring) inset;
}

/* Marcador "P" docked */
.pen-marker.docked{
  position:static; transform:none; box-sizing:border-box;
  width:var(--chip-size); height:var(--chip-size);
  margin:0; padding:0;
  display:inline-flex; align-items:center; justify-content:center; vertical-align:middle;
  border-radius:999px; font:800 clamp(10px, .9vw, 12px)/1 system-ui; color:#0b192b;
  background:radial-gradient(circle at 30% 30%, #fff, #ffe68a);
  border:2px solid rgba(11,25,43,.22);
  box-shadow:0 1px 4px rgba(2,6,23,.14), 0 0 0 2px rgba(255,255,255,.6) inset;
  cursor:grab; user-select:none; touch-action:none;
}

/* Marcador "P" solto no campo */
.pen-marker:not(.docked){
  position:absolute; transform:translate(-50%,-50%); z-index:4;
  width:clamp(24px, 2.6vw, 30px); height:clamp(24px, 2.6vw, 30px);
  border-radius:50%;
  background:radial-gradient(circle at 30% 30%, #f8fc07ff, #ffe68a);
  border:2px solid #111; color:#111;
  font:900 clamp(12px, 1.1vw, 14px)/1 system-ui;
  display:flex; align-items:center; justify-content:center;
  user-select:none; touch-action:none; cursor:grab;
  box-shadow:0 6px 16px rgba(0,0,0,.30), 0 0 0 2px var(--chip-ring) inset;
}
.pen-marker:active{ cursor:grabbing }

/* =========================================================
   POPOVER: últimos jogos
   ========================================================= */
.games-pop{
  position:absolute; z-index:20; transform:translate(-50%,-8px);
  min-width:180px; max-width:260px;
  background:#fff; color:#0b192b;
  border:1px solid rgba(15,23,42,.14); border-radius:10px;
  padding:8px; font:600 12px/1.35 system-ui;
  box-shadow:0 10px 24px rgba(0,0,0,.25);
  max-height:60vh; overflow:auto;
}
.games-pop h4{ margin:0 0 6px 0; font:800 12px/1 system-ui }
.games-pop ul{ margin:0; padding:0; list-style:none }
.games-pop li{ padding:3px 0; border-top:1px solid rgba(2,6,23,.06) }
.games-pop li:first-child{ border-top:0 }
.games-pop .loc{ font-weight:800 }
.games-pop .neg{ color:#b91c1c } .games-pop .pos{ color:#15803d }

/* =========================================================
   RESPONSIVO
   ========================================================= */
@media (max-width: 900px){
  :root{ --cap-max: calc(var(--img) * 1.35); }
}
@media (max-width:768px){
  :root{
    --gap-label: 20px;
    --cap-max: calc(var(--img) * 1.2);
  }
}
@media (max-width:520px){
  :root{
    --gap-label: 18px;
    --cap-max: calc(var(--img) * 1.05);
  }
}
@media (max-width:420px){
  :root{ --cap-max: calc(var(--img) * 1.15); }
}
`;

  const s = document.createElement('style');
  s.id = 'pitch-view-style';
  s.textContent = css;
  document.head.appendChild(s);
})();


 /* =========================================================================
     PRESETS / LAYOUT DO CAMPO
     - Sistema de coordenadas em porcentagem (0–100): x = largura, y = altura
     - POS: posições padrão (desktop)
     - MPRESETS: presets específicos de MOBILE por formação
     ========================================================================= */
  
     /** Posições base (desktop) por slot */
  const POS = {
    GOL:{x:50,y:90},
    'ZAG-L':{x:35,y:75}, 'ZAG-C':{x:50,y:75}, 'ZAG-R':{x:65,y:75},
    'LAT-L':{x:20,y:78}, 'LAT-R':{x:80,y:78},
    VOL:{x:50,y:65},
    'MEI-L':{x:30,y:58}, 'MEI-C':{x:50,y:55}, 'MEI-R':{x:70,y:58},
    'ATA-L':{x:35,y:30}, 'ATA-C':{x:50,y:25}, 'ATA-R':{x:65,y:30},
    TEC:{x:92,y:96}
  };
   /** Presets MOBILE por formação (arrays [x,y]; place() converte para objeto) */
  const MPRESETS = {
    '4-3-3': {'GOL':[50,88],'ZAG-L':[33,72],'ZAG-C':[50,72],'ZAG-R':[67,72],'LAT-L':[12,66],'LAT-R':[88,66],
              'MEI-L':[26,48],'MEI-C':[50,35],'MEI-R':[74,48],'ATA-L':[22,20],'ATA-C':[50,10],'ATA-R':[78,20],'TEC':[12,92]},
    '4-4-2': {'GOL':[50,88],'ZAG-L':[33,72],'ZAG-C':[50,72],'ZAG-R':[67,72],'LAT-L':[12,66],'LAT-R':[88,66],
              'VOL':[50,55],'MEI-L':[26,46],'MEI-C':[50,30],'MEI-R':[74,46],'ATA-L':[36,10],'ATA-R':[64,10],'TEC':[12,92]},
    '3-5-2': {'GOL':[50,88],'ZAG-L':[26,70],'ZAG-C':[50,68],'ZAG-R':[74,70],'LAT-L':[12,47],'LAT-R':[88,47],
              'VOL':[50,57],'MEI-L':[36,47],'MEI-C':[50,30],'MEI-R':[64,47],'ATA-L':[36,10],'ATA-R':[64,10],'TEC':[12,92]},
    '4-2-3-1': {'GOL':[50,92],'ZAG-L':[40,77],'ZAG-R':[60,77],'LAT-L':[22,79],'LAT-R':[78,79],
                'VOL':[40,66],'VOL2':[60,66],'MEI-L':[36,57],'MEI-C':[50,54],'MEI-R':[64,57],'ATA-C':[50,32],'TEC':[10,92]},
    '3-4-3':{'GOL': [50, 89],'ZAG-L': [26, 70],'ZAG-C': [50, 68],'ZAG-R': [74, 70], 'LAT-L':[12,47],'LAT-R':[88,47],
            'MEI-L': [36, 47],'VOL': [50, 46],'MEI-R': [64, 47],'ATA-L': [22, 25],'ATA-C': [50, 13],'ATA-R': [78, 25],'TEC': [12, 91]}           
};

  /* =========================================================================
     HELPERS DE DADOS
     - fetch JSON sem cache
     - carregamento de mercado (imagens, nomes) e médias MM/MV
     - acessores rápidos (nome, foto, clube, média)
     ========================================================================= */

  /** GET JSON simples com desativação de cache */
  async function jget(url){
    const r = await fetch(url, { cache:'no-store' });
    if(!r.ok) throw new Error(`fetch ${url} ${r.status}`);
    return r.json();
  }

  /** Carrega mercado e indexa por atleta_id */
  async function loadMercado(){
    try{
      const arr = await jget('/assets/data/mercado.images.json');
      window.MERCADO = { byId: new Map(arr.map(a => [a.atleta_id, a])) };
    }catch{
      window.MERCADO = { byId: new Map() };
    }
  }

  /** Carrega médias Mandante/Visitante por atleta */
  async function loadMMMV(){
    try{
      const data = await jget('/assets/data/mandante_visitante_by_atleta.json');
      window.MMV = data || {};
    }catch{
      window.MMV = {};
    }
  }

  /* Acessores rápidos do mercado */
  const getA     = id => window.MERCADO?.byId?.get(+id) || null;
  const nome     = id => getA(id)?.apelido_abreviado || getA(id)?.apelido || getA(id)?.nome || String(id);
  const clubIdOf = id => getA(id)?.clube_id ?? 0;
  const foto     = id => (getA(id)?.foto || '').trim() || `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`;
  const mediaNum = id => Number(getA(id)?.media_num ?? NaN);

  /** Classe visual por faixa de média ('' | 'amber' | 'red') */
  const statClass = v => !Number.isFinite(v) ? '' : (v > 5 ? '' : (v >= 3 ? 'amber' : 'red'));

  /* =========================================================================
     POSICIONAMENTO NO CAMPO
     - place(el, slot, xy, formacao)
       -> usa xy explícito; senão usa POS; em mobile tenta MPRESETS[formacao][slot]
     ========================================================================= */
  function place(el, slot, xy, formacao){
    let p = xy || POS[slot] || POS['MEI-C'];
    if (IS_MOBILE) {
      const mp = (MPRESETS[formacao] || {})[slot];
      if (Array.isArray(mp)) p = { x: clamp(+mp[0]), y: clamp(+mp[1]) };
    }
    el.style.left = PCT(p.x);
    el.style.top  = PCT(p.y);
  }

  /* =========================================================================
     LÓGICA DE ESTATÍSTICAS
     - currentStatValue: devolve média conforme modo (ALL | MM | MV)
     - updateCardStat:   atualiza chip principal do atleta
     - updateAltStat:    atualiza chip do "duvidaCom"
     ========================================================================= */

  /** Retorna média do atleta conforme o modo */
  function currentStatValue(atletaId, mode){
    const mmv = window.MMV?.[atletaId];
    if (mode === 'MM') return (mmv && mmv.MM != null) ? Number(mmv.MM) : NaN;
    if (mode === 'MV') return (mmv && mmv.MV != null) ? Number(mmv.MV) : NaN;
    return mediaNum(atletaId); // ALL
  }

  /** Atualiza a pílula de média principal */
  function updateCardStat(el, mode){
    const id = +el.dataset.id;
    const stat = el.querySelector('.stat');
    if (!stat) return;

    const m = currentStatValue(id, mode);
    stat.textContent = Number.isFinite(m) ? `Média: ${m.toFixed(1).replace('.', ',')}` : 'Média: —';

    stat.classList.remove('amber','red');
    if (Number.isFinite(m)) {
      const sc = statClass(m);
      if (sc) stat.classList.add(sc);
    }
  }

  /** Atualiza a pílula de média do jogador alternativo (duvidaCom) */
  function updateAltStat(pitch, el){
    const alt = el.querySelector('.alt-stat');
    if (!alt) return;

    const mode  = pitch.dataset.modeStat || 'ALL';
    const altId = +el.dataset.altId || NaN;
    const m     = Number.isFinite(altId) ? currentStatValue(altId, mode) : NaN;

    alt.textContent = Number.isFinite(m) ? `Média: ${m.toFixed(1).replace('.', ',')}` : 'Média: —';

    alt.classList.remove('amber','red');
    if (Number.isFinite(m)) {
      const sc = statClass(m);
      if (sc) alt.classList.add(sc);
    }
  }

  /* =========================================================================
     POPOVER "ÚLTIMOS JOGOS"
     ========================================================================= */
  function closeAnyPop(){ document.querySelectorAll('.games-pop').forEach(n=>n.remove()); }

  function showLastGames(pitch, el){
    const mode = pitch.dataset.modeStat || 'ALL';
    const id   = +el.dataset.id;
    const pack = window.MMV?.[id];
    if (!pack) return;

    let rows = (pack.ultimos?.geral || []);
    if (mode === 'MM') rows = rows.filter(r => r.local === true);
    if (mode === 'MV') rows = rows.filter(r => r.local === false);

    closeAnyPop();
    const pop = document.createElement('div');
    pop.className = 'games-pop';
    const title = mode==='ALL' ? 'Últimos jogos' : (mode==='MM'?'Últimos Mandante':'Últimos Visitante');

    const li = rows.map(r=>{
      const s = Number.isFinite(+r.pontos) ? +r.pontos : null;
      const cls = s==null ? '' : (s>=0?'pos':'neg');
      const loc = r.local===true?'M':'V';
      const adv = r.adv_id!=null ? ` x ${r.adv_id}` : '';
      return `<li><span class="loc">${loc}</span> R${r.rodada ?? '—'}${adv} · <span class="${cls}">${s==null?'—':s.toFixed(2)}</span></li>`;
    }).join('');

    pop.innerHTML = `<h4>${title}</h4><ul>${li || '<li>Sem dados</li>'}</ul>`;

    const pr = el.getBoundingClientRect();
    const pitchR = pitch.getBoundingClientRect();
    pop.style.left = ((pr.left + pr.width/2) - pitchR.left) + 'px';
    pop.style.top  = ((pr.top) - pitchR.top) + 'px';
    pitch.appendChild(pop);
  }

  /* =========================================================================
     CRIAÇÃO/ATUALIZAÇÃO DO NÓ DO JOGADOR
     - inclui imagem, nome, chips e suporte a "duvidaCom"
     ========================================================================= */
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
      stat.className = 'stat';

      el.appendChild(img);
      el.appendChild(cap);
      el.appendChild(stat);
      pitch.appendChild(el);
    } else {
      el.className = `${clsBase} ${clsSit}` + (slot === 'TEC' ? ' coach' : '');
      const cap = el.querySelector('.cap'); if (cap) cap.textContent = nome(id);
      const img = el.querySelector('img'); if (img){ img.alt = nome(id); img.src = foto(id); }
    }

    /* seção de dúvida: remove antes e recria se necessário */
    el.querySelectorAll('.alt-cap, .alt-stat').forEach(n => n.remove());
    delete el.dataset.altId;

    if (sit === 'duvida' && Number.isFinite(+duvidaCom)) {
      const altId = +duvidaCom;
      el.dataset.altId = String(altId);

      const altCap = document.createElement('div');
      altCap.className = 'alt-cap';
      altCap.textContent = nome(altId);
      el.appendChild(altCap);

      const altStat = document.createElement('div');
      altStat.className = 'alt-stat';
      el.appendChild(altStat);

      updateAltStat(pitch, el);
    }

    // Atualiza estatística conforme modo atual
    updateCardStat(el, pitch.dataset.modeStat || 'ALL');

    // Duplo clique: popover (se modo avançado estiver ativo)
    el.ondblclick = () => {
      if (pitch.dataset.adv !== '1') return;
      showLastGames(pitch, el);
    };

    return el;
  }

  /* =========================================================================
     MARCADOR DE PÊNALTI (P) — DOCKABLE
     ========================================================================= */
  function ensurePenaltyMarker(pitch, toolbar){
    let m = pitch.querySelector('.pen-marker, .pitch-toolbar .pen-marker');
    if (m) return m;

    m = document.createElement('div');
    m.className = 'pen-marker docked';
    m.textContent = 'P';
    m.title = 'Arraste para o cobrador. Duplo clique para voltar para a barra.';
    toolbar.appendChild(m);

    const on = (t,ev,fn,opts)=>t.addEventListener(ev,fn,opts||false);
    let dragging = false, moved = false, offX=0, offY=0, sx=0, sy=0;
    const THRESH = 4;

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
      toolbar.prepend(m);
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
      if (!moved) return;
      if (m.classList.contains('docked')) return;
      const {el,d} = findNearestPlayer();
      const SNAP = (IS_MOBILE ? 70 : 92) * 1.3;
      if (d <= SNAP) snapAbove(el);
    });

    on(m,'dblclick', redock);
    return m;
  }

  /* =========================================================================
     TOOLBAR SUPERIOR (chips M / MM / MV / A + Pênalti)
     ========================================================================= */
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

    // Helpers de estado
    const setMode = (mode) => {
      pitch.dataset.modeStat = mode; // 'ALL' | 'MM' | 'MV'
      pitch.querySelectorAll('.player').forEach(el=>{
        updateCardStat(el, mode);
        updateAltStat(pitch, el);
      });
      closeAnyPop();
    };
    const toggleAdv = () => {
      pitch.dataset.adv = (pitch.dataset.adv==='1'?'0':'1');
      aBtn.classList.toggle('active', pitch.dataset.adv==='1');
      closeAnyPop();
    };

    // M — mostrar/ocultar média geral
    const bStat = document.createElement('button');
    bStat.type = 'button';
    bStat.className = 'btn-chip stat active';
    bStat.textContent = 'M';
    bStat.title = 'Mostrar/ocultar média';
    bStat.onclick = ()=>{
      pitch.classList.toggle('hide-stat');
      bStat.classList.toggle('active', !pitch.classList.contains('hide-stat'));
    };
    tb.appendChild(bStat);

    // MM — Média Mandante
    const mmBtn = document.createElement('button');
    mmBtn.type = 'button';
    mmBtn.className = 'btn-chip';
    mmBtn.textContent = 'MM';
    mmBtn.title = 'Média Mandante';
    mmBtn.onclick = ()=>{ mmBtn.classList.add('active'); mvBtn.classList.remove('active'); setMode('MM'); };
    tb.appendChild(mmBtn);

    // MV — Média Visitante
    const mvBtn = document.createElement('button');
    mvBtn.type = 'button';
    mvBtn.className = 'btn-chip';
    mvBtn.textContent = 'MV';
    mvBtn.title = 'Média Visitante';
    mvBtn.onclick = ()=>{ mvBtn.classList.add('active'); mmBtn.classList.remove('active'); setMode('MV'); };
    tb.appendChild(mvBtn);

    // Duplo clique no botão ativo volta para ALL
    const resetIfActive = (btn) => {
      btn.addEventListener('dblclick', ()=>{ btn.classList.remove('active'); setMode('ALL'); });
    };
    resetIfActive(mmBtn); resetIfActive(mvBtn);

    // A — modo avançado: duplo clique no jogador mostra "Últimos jogos"
    const aBtn = document.createElement('button');
    aBtn.type = 'button';
    aBtn.className = 'btn-chip';
    aBtn.textContent = 'A';
    aBtn.title = 'Modo avançado: duplo clique mostra últimos jogos';
    aBtn.onclick = toggleAdv;
    tb.appendChild(aBtn);

    // estado inicial
    pitch.dataset.modeStat = 'ALL';
    pitch.dataset.adv = '0';
  }

  /* =========================================================================
     RESET DE POSIÇÃO VIA CLIQUE NO NOME
     ========================================================================= */
  function bindCapReset(pitch){
    pitch.querySelectorAll('.player .cap').forEach(cap=>{
      cap.onclick = (e)=>{
        const el = e.currentTarget.closest('.player');
        el.removeAttribute('data-free-x');
        el.removeAttribute('data-free-y');
        const slot = el.dataset.slot;
        place(el, slot, null, pitch.dataset.formacao||'');
        updateCardStat(el, pitch.dataset.modeStat || 'ALL');
        updateAltStat(pitch, el);
        closeAnyPop();
      };
    });
  }

  /* =========================================================================
     DESENHA TIME NO CAMPO
     - cria ou atualiza nós .player
     - considera técnico ausente
     ========================================================================= */
  function drawPitch(pitch, team){
    // limpa anteriores
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

    // remove quaisquer restos não utilizados
    pitch.querySelectorAll('.player[id^="p-"]').forEach(el=>{
      if (!seenIds.has(el.id)) el.remove();
    });

    bindCapReset(pitch);
  }

  /* =========================================================================
     CARREGAMENTO DE LINEUPS + OVERRIDES LOCAIS
     ========================================================================= */
  async function loadLineups(){
    const base = await jget(`/assets/data/lineups.json?t=${Date.now()}`).catch(()=>({version:1,teams:{}}));
    try{
      const ov = JSON.parse(localStorage.getItem('lineups_override') || 'null');
      if (ov && ov.teams) base.teams = Object.assign(base.teams||{}, ov.teams);
    }catch{}
    return base;
  }

  /* =========================================================================
     ORQUESTRAÇÃO GERAL
     - aguarda os contêineres .pitch[data-team]
     - injeta toolbar, desenha times e prepara interações
     ========================================================================= */
  async function drawAll() {
    const CURRENT = await loadLineups();
    window.CURRENT_LINEUPS = CURRENT;

    // aguarda os pitches existirem no DOM
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
      pitch.classList.add('hide-stat');                 // médias ocultas por padrão
      if (!pitch.style.position) pitch.style.position = 'relative';

      ensureToolbar(pitch);
      drawPitch(pitch, team);

      pitch.addEventListener('click', (e)=>{
        if (!e.target.closest('.games-pop') && !e.target.closest('.player')) closeAnyPop();
      });
    });

    // desativa qualquer persistência de drag nesta página
    try{
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem('pitch_drag_positions');
      sessionStorage.removeItem('pitch_drag_positions');
    }catch{}

    window.dispatchEvent(new Event('pitch:ready'));
  }

  /* =========================================================================
     BOOTSTRAP
     ========================================================================= */
  async function bootstrap(){
    await Promise.all([loadMercado(), loadMMMV()]);
    await drawAll();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();