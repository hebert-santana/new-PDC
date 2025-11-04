// /assets/js/pitch-render-influencers.js
// Render do campinho para a área de Influenciadores
(() => {
  'use strict';

  /* =========================================================================
     FLAGS E UTILIDADES BÁSICAS
     ========================================================================= */
  const SAVE_KEY  = 'pitch_positions_v6';
  const IS_MOBILE = matchMedia('(max-width: 430px)').matches;
  const clamp = (v,a=0,b=100)=>Math.max(a,Math.min(b,v));
  const PCT   = v => `${v}%`;

  // Bloqueia qualquer persistência de drag nesta página
  try{
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('pitch_drag_positions');
    sessionStorage.removeItem('pitch_drag_positions');
    const __set = localStorage.setItem.bind(localStorage);
    const __get = localStorage.getItem.bind(localStorage);
    localStorage.setItem = (k,v)=> (k===SAVE_KEY ? void 0 : __set(k,v));
    localStorage.getItem = (k)=> (k===SAVE_KEY ? null : __get(k));
  }catch{}

  /* =========================================================================
     CSS INJETADO
     - Balões de média com gradiente direcional, glow por faixa e por valor
     - Tipografia Inter Tight
     - Micro animação de entrada
     - Preserva aparência do marcador “P”
     ========================================================================= */
  
   // CSS INJETADO — sempre atualiza o <style id="pitch-view-style">
(() => {
  const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&display=swap');

:root{
  --img:120px; --img-coach:56px; --gap-label:26px;
  --cap-fs:11px; --altcap-fs:10px; --chip-fs:11px;
  --cap-py:.3em; --cap-px:.6em; --altcap-py:.25em; --altcap-px:.6em;
  --chip-py:.14em; --chip-px:.16em;
  --cap-max:calc(var(--img) * 1.6);
  --ring-w:.18em; --ring-ok:#16a34a; --ring-duv:#f59e0b;
  --chip-size:26px; --chip-ring:#ffd54a; --chip-fg:#0b192b;
}

.pitch{ container-type:inline-size; }
@supports (width:1cqi){
  .pitch{
    --img:       clamp(76px, 11cqi, 100px);
    --img-coach: clamp(44px, 7.5cqi, 66px);
    --gap-label: clamp(24px, 3.5cqi, 30px);
    --cap-fs:    clamp(12px, 1.5cqi, 16px);
    --altcap-fs: clamp(12px, 1.5cqi, 16px);
    --chip-fs:   clamp(10px, 1.4cqi, 14px);
    --chip-size: clamp(22px, 3.2cqi, 28px);
  }
}

/* Avatar */
.pitch .player,.pitch .jogador{ cursor:grab }
.pitch .player:active,.pitch .jogador:active{ cursor:grabbing }
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
@media (hover:hover){ .pitch .player:hover img{ transform:scale(1.03) } }
.player.ok img{   box-shadow:0 0 0 var(--ring-w) var(--ring-ok), 0 .6em .9em rgba(0,0,0,.28) }
.player.doubt img{box-shadow:0 0 0 var(--ring-w) var(--ring-duv), 0 .6em .9em rgba(0,0,0,.28) }
.player.coach{ width:var(--img-coach); height:var(--img-coach) }
.player.coach img{ width:var(--img-coach); height:var(--img-coach) }

/* Pílulas base */
.player .cap,.player .stat,.player .alt-cap,.player .alt-stat{
  position:absolute; left:50%; transform:translateX(-50%);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  max-width:var(--cap-max); pointer-events:none;
}
.player .cap{
  top:calc(100% + 0px);
  padding:var(--cap-py) var(--cap-px);
  font-size:var(--cap-fs); font-weight:600; line-height:1.05; letter-spacing:.015em;
  color:#0a1324; background:rgba(255,255,255,.98);
  border:1px solid rgba(15,23,42,.14); border-radius:16px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.6), 0 .35em .8em rgba(2,6,23,.18);
  backdrop-filter:saturate(120%) blur(2px);
}

/* ===== Balões de MÉDIA — DARK GLASS, SEM BORDA ===== */
.player .stat,
.player .alt-stat{
  --fg:#e7edf3;     /* texto */
  --dot:#9fe870;    /* ponto padrão */
  --glow:8px;       /* raio do brilho */
  position:absolute; left:50%; transform:translateX(-50%);
  top:calc(100% + var(--gap-label));
  display:inline-flex; align-items:center; gap:.45em;
  padding:calc(var(--chip-py) + 2px) calc(var(--chip-px) + 8px);
  font-family:"Inter Tight",system-ui,sans-serif;
  font-size:var(--chip-fs); font-weight:700; letter-spacing:.02em;
  color:var(--fg); font-variant-numeric:tabular-nums;
  background:radial-gradient(120% 140% at 30% 20%, #1b2430 0%, #0f141b 55%, #0b1016 100%);
  border:none;                          /* sem contorno colorido */
  border-radius:14px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 10px 22px rgba(0,0,0,.40);        /* sombra externa suave */
  backdrop-filter:saturate(120%) blur(2px);
  text-shadow:0 1px 0 rgba(0,0,0,.35);
  opacity:0; transform:translate(-50%,6px);
  animation:fadeUp .35s ease forwards;
}
.player .stat:hover,.player .alt-stat:hover{ transform:translate(-50%,4px) }

/* Glow por faixa (sem borda) */
.player .stat:not(.amber):not(.red),
.player .alt-stat:not(.amber):not(.red){
  --dot:#9fe870;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 10px 22px rgba(0,0,0,.40),
    0 0 var(--glow) rgba(159,232,112,.35);
}
.player .stat.amber,.player .alt-stat.amber{
  --dot:#ffd166;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 10px 22px rgba(0,0,0,.40),
    0 0 var(--glow) rgba(255,209,102,.28);
}
.player .stat.red,.player .alt-stat.red{
  --dot:#ff6767;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 10px 22px rgba(0,0,0,.40),
    0 0 var(--glow) rgba(255,103,103,.25);
}

/* Ponto de status */
.player .stat::before,.player .alt-stat::before{
  content:"";
  inline-size:.55em; block-size:.55em; border-radius:50%;
  background:var(--dot);
  box-shadow:0 0 0 2px rgba(255,255,255,.08) inset, 0 0 8px var(--dot);
}

/* Filete luminoso superior */
.player .stat::after,.player .alt-stat::after{
  content:""; position:absolute; inset:1px 2px auto 2px; height:28%;
  border-radius:12px; background:linear-gradient(#ffffff14,#ffffff03);
}


/* Toggle M */
.pitch.hide-stat .player .stat,
.pitch.hide-stat .player .alt-stat{ display:none }
.pitch.hide-stat .player .alt-cap{ top:calc(100% + var(--gap-label)) }

/* Alt-cap e posição quando há alt-stat */
.player .alt-cap{
  top:calc(100% + (var(--gap-label) * 1.8));
  padding:var(--altcap-py) var(--altcap-px);
  font-size:var(--altcap-fs); font-weight:600; line-height:1.05; color:#111;
  background:rgba(255,255,255,.96);
  border:1px solid rgba(15,23,42,.12); border-radius:10px;
  box-shadow:0 3px 8px rgba(2,6,23,.14);
}
.player .alt-stat{ display:none }
.pitch:not(.hide-stat):not(.hide-doubt) .player .alt-cap + .alt-stat{
  display:block; top:calc(100% + (var(--gap-label) * 2.55));
}

/* Toolbar */
/* ===== Chips compactos com botão Reset extra ===== */
.pitch-toolbar{
  position:absolute; right:.5rem; top:.2rem; z-index:9;
  display:flex; align-items:center; gap:.38rem;
}
.pitch-toolbar .btn-chip{
  width:25px; height:25px;
  border-radius:999px;
  display:inline-flex; align-items:center; justify-content:center;
  font:700 10px/1 Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  letter-spacing:.2px;
  color:#1e293b;
  background:#fff;
  border:1px solid #d9dee6;
  box-shadow:0 1px 2px rgba(0,0,0,.05);
  cursor:pointer; user-select:none;
  transition:background .15s ease, color .15s ease,
             border-color .15s ease, box-shadow .15s ease, transform .04s;
}
.pitch-toolbar .btn-chip:hover{
  background:#f3f6fa; border-color:#cdd5df;
}
.pitch-toolbar .btn-chip:active{ transform:translateY(1px); }

.pitch-toolbar .btn-chip.active{
  color:#fff;
  background:var(--laranja, #FB5904);
  border-color:transparent;
  box-shadow:0 2px 6px rgba(251,89,4,.22);
}

/* Botão Reset vermelho fixo */
.pitch-toolbar .btn-reset{
  background:#dc2626;
  border-color:#dc2626;
  color:#fff;
}
.pitch-toolbar .btn-reset:hover{
  background:#b91c1c;
  border-color:#b91c1c;
}
.pitch-toolbar .btn-reset i{
  font-size:13px;
  line-height:1;
}

/* Mobile */
@media (max-width:430px){
  .pitch-toolbar .btn-chip{ width:23px; height:23px; font-size:9.5px; }
  .pitch-toolbar .btn-reset i{ font-size:12px; }
}


/* Marcador de Pênalti (P) */
.pen-marker{
  box-sizing:border-box; user-select:none; touch-action:none;
  font:800 clamp(10px,.9vw,12px)/1 system-ui;
}
.pitch-toolbar .pen-marker.docked{
  width:var(--chip-size); height:var(--chip-size);
  display:inline-flex; align-items:center; justify-content:center;
  border-radius:999px; color:#0b192b;
  background:radial-gradient(circle at 30% 30%, #fff, #ffe68a);
  border:2px solid rgba(11,25,43,.22);
  box-shadow:0 1px 4px rgba(2,6,23,.14), 0 0 0 2px rgba(255,255,255,.6) inset;
  cursor:grab;
}
.pen-marker:not(.docked){
  position:absolute; z-index:4; transform:translate(-50%,-50%);
  width:clamp(24px,2.6vw,30px); height:clamp(24px,2.6vw,30px);
  display:flex; align-items:center; justify-content:center;
  border-radius:50%; color:#111;
  background:radial-gradient(circle at 30% 30%, #fffab0, #ffd54a);
  border:2px solid #111;
  box-shadow:0 6px 16px rgba(0,0,0,.30), 0 0 0 2px var(--chip-ring) inset;
  cursor:grab;
}
.pen-marker.attached{
  box-shadow:0 6px 16px rgba(0,0,0,.30), 0 0 0 2px var(--chip-ring) inset, 0 0 10px rgba(255,213,74,.55);
}
.pen-marker:active{ cursor:grabbing }

/* Popover */
.games-pop{
  position:absolute; z-index:20; transform:translate(-50%,-8px);
  min-width:180px; max-width:260px;
  background:#fff; color:#0b192b;
  border:1px solid rgba(15,23,42,.14); border-radius:10px;
  padding:8px; font:600 12px/1.35 system-ui;
  box-shadow:0 10px 24px rgba(0,0,0,.25); max-height:60vh; overflow:auto;
}
.games-pop h4{ margin:0 0 6px 0; font:800 12px/1 system-ui }
.games-pop ul{ margin:0; padding:0; list-style:none }
.games-pop li{ padding:3px 0; border-top:1px solid rgba(2,6,23,.06) }
.games-pop li:first-child{ border-top:0 }
.games-pop .loc{ font-weight:800 } .games-pop .neg{ color:#b91c1c } .games-pop .pos{ color:#15803d }

.games-pop .pos   { color:#16a34a; font-weight:700; }  /* verde >5 */
.games-pop .amber { color:#f59e0b; font-weight:700; }  /* 0–5 */
.games-pop .neg   { color:#ef4444; font-weight:700; }  /* abaixo de 0 */


/* Micro-anim */
@keyframes fadeUp{ to{ opacity:1; transform:translate(-50%,0); } }
`;

  let s = document.getElementById('pitch-view-style');
  if (!s) {
    s = document.createElement('style');
    s.id = 'pitch-view-style';
    document.head.appendChild(s);
  }
  s.textContent = css;
})();
  




  /* =========================================================================
     PRESETS / LAYOUT DO CAMPO
     ========================================================================= */
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
    '3-4-3':{'GOL':[50,89],'ZAG-L':[26,70],'ZAG-C':[50,68],'ZAG-R':[74,70],'LAT-L':[12,47],'LAT-R':[88,47],
             'MEI-L':[36,47],'VOL':[50,46],'MEI-R':[64,47],'ATA-L':[22,25],'ATA-C':[50,13],'ATA-R':[78,25],'TEC':[12,91]}
  };

  /* =========================================================================
     HELPERS DE DADOS
     ========================================================================= */

     function resetPitchToOriginal(pitch){
  pitch.querySelectorAll('.player').forEach(el=>{
    // apaga qualquer coord livre do drag
    el.removeAttribute('data-free-x');
    el.removeAttribute('data-free-y');

    const x0 = parseFloat(el.dataset.x0);
    const y0 = parseFloat(el.dataset.y0);
    if (Number.isFinite(x0) && Number.isFinite(y0)){
      el.style.left = `${x0}%`;
      el.style.top  = `${y0}%`;
    }
  });
}
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

  async function loadMMMV(){
    try{
      const data = await jget('/assets/data/mandante_visitante_by_atleta.json');
      window.MMV = data || {};
    }catch{ window.MMV = {}; }
  }

  const getA     = id => window.MERCADO?.byId?.get(+id) || null;
  const nome     = id => getA(id)?.apelido_abreviado || getA(id)?.apelido || getA(id)?.nome || String(id);
  const clubIdOf = id => getA(id)?.clube_id ?? 0;
  const foto     = id => (getA(id)?.foto || '').trim() || `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`;
  const mediaNum = id => Number(getA(id)?.media_num ?? NaN);
  const statClass = v => !Number.isFinite(v) ? '' : (v > 5 ? '' : (v >= 3 ? 'amber' : 'red'));

  /* =========================================================================
     ESTATÍSTICA 5 ÚLTIMOS JOGOS
     ========================================================================= */
  function avgLastN(pack, mode, n=5){
    if (!pack?.ultimos?.geral) return NaN;
    let rows = pack.ultimos.geral;
    if (mode === 'MM') rows = rows.filter(r => r.local === true);
    if (mode === 'MV') rows = rows.filter(r => r.local === false);
    rows = rows.filter(r => Number.isFinite(+r.pontos));
    rows.sort((a,b)=>{
      const ra = Number.isFinite(+a.rodada) ? +a.rodada : -Infinity;
      const rb = Number.isFinite(+b.rodada) ? +b.rodada : -Infinity;
      return ra - rb;
    });
    const take = rows.slice(-n).map(r => +r.pontos);
    if (!take.length) return NaN;
    const sum = take.reduce((a,b)=>a+b,0);
    return sum / take.length;
  }

  /* =========================================================================
     POSICIONAMENTO
     ========================================================================= */
function resolvePos(slot, xy, formacao){
  // 1) Se o admin mandou x/y válidos, use-os e pronto
  if (xy && Number.isFinite(+xy.x) && Number.isFinite(+xy.y)){
    return { x: clamp(+xy.x), y: clamp(+xy.y) };
  }
  // 2) Caso contrário, caia nos presets
  let p = POS[slot] || POS['MEI-C'];
  if (IS_MOBILE){
    const mp = (MPRESETS[formacao] || {})[slot];
    if (Array.isArray(mp)) p = { x:+mp[0], y:+mp[1] };
  }
  return { x: clamp(+p.x), y: clamp(+p.y) };
}


function place(el, slot, xy, formacao, remember=false){
  const p = resolvePos(slot, xy, formacao);
  el.style.left = `${p.x}%`;
  el.style.top  = `${p.y}%`;
  if (remember && (el.dataset.x0 == null || el.dataset.y0 == null)){
    el.dataset.x0 = String(p.x);
    el.dataset.y0 = String(p.y);
  }
}


  /* =========================================================================
     LÓGICA DE ESTATÍSTICAS
     ========================================================================= */
  function currentStatValue(pitch, atletaId, mode){
    const use5 = pitch?.dataset?.last5 === '1';
    if (use5){
      const pack = window.MMV?.[atletaId];
      return pack ? avgLastN(pack, mode, 5) : NaN;
    }
    const mmv = window.MMV?.[atletaId];
    if (mode === 'MM') return (mmv && mmv.MM != null) ? Number(mmv.MM) : NaN;
    if (mode === 'MV') return (mmv && mmv.MV != null) ? Number(mmv.MV) : NaN;
    return mediaNum(atletaId);
  }

function setStatVisual(statEl, value){
  statEl.classList.remove('amber','red');
  if (Number.isFinite(value)){
    const cls = value > 5 ? '' : (value >= 3 ? 'amber' : 'red');
    if (cls) statEl.classList.add(cls);
    statEl.dataset.val = value.toFixed(1);
    // intensidade do glow: 4px a 14px
    const g = Math.max(4, Math.min(14, 2 + value * 1.6));
    statEl.style.setProperty('--g', `${g}px`);
  }else{
    statEl.style.removeProperty('--g');
    statEl.removeAttribute('data-val');
  }
}

function updateCardStat(pitch, el, mode){
  const id = +el.dataset.id;
  const stat = el.querySelector('.stat');
  if (!stat) return;

  const m = currentStatValue(pitch, id, mode);
  const is5 = pitch.dataset.last5 === '1';

  // sem "5J" no texto, mas preserva no title
  stat.textContent = Number.isFinite(m)
    ? `Média: ${m.toFixed(1).replace('.', ',')}`
    : `Média: —`;
  stat.title = Number.isFinite(m)
    ? (is5 ? `Média (últimos 5 jogos): ${m.toFixed(1)}` : `Média: ${m.toFixed(1)}`)
    : 'Sem média';

  setStatVisual(stat, m);
}

function updateAltStat(pitch, el){
  const alt = el.querySelector('.alt-stat');
  if (!alt) return;

  const mode  = pitch.dataset.modeStat || 'ALL';
  const altId = +el.dataset.altId || NaN;
  const m     = Number.isFinite(altId) ? currentStatValue(pitch, altId, mode) : NaN;
  const is5   = pitch.dataset.last5 === '1';

  // sem "5J" no texto, mas preserva no title
  alt.textContent = Number.isFinite(m)
    ? `Média: ${m.toFixed(1).replace('.', ',')}`
    : `Média: —`;
  alt.title = Number.isFinite(m)
    ? (is5 ? `Média (últimos 5 jogos): ${m.toFixed(1)}` : `Média: ${m.toFixed(1)}`)
    : 'Sem média';

  setStatVisual(alt, m);
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

const li = rows.map(r => {
  const s   = Number.isFinite(+r.pontos) ? +r.pontos : null;
  let cls = '';
if (s !== null) {
  if (s < 0) cls = 'neg';          // vermelho
  else if (s < 5) cls = 'amber';   // amarelo
  else cls = 'pos';                // verde
}

  const loc = r.local === true ? 'M' : 'V';
  const adv = r.adv_id != null ? ` x ${r.adv_id}` : '';
  return `<li><span class="loc">${loc}</span> R${r.rodada ?? '—'}${adv} · <span class="${cls}">${s === null ? '—' : s.toFixed(2)}</span></li>`;
}).join('');

pop.innerHTML = `<h4>${title}</h4><ul>${li || '<li>Sem dados</li>'}</ul>`;

const pr     = el.getBoundingClientRect();
const pitchR = pitch.getBoundingClientRect();
pop.style.left = `${(pr.left + pr.width / 2) - pitchR.left}px`;
pop.style.top  = `${(pr.top) - pitchR.top}px`;
pitch.appendChild(pop);
  }

  /* =========================================================================
     CRIA/ATUALIZA NÓ DO JOGADOR
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
      img.loading = 'lazy'; img.decoding = 'async';
      img.width = 92; img.height = 92;
      img.alt = nome(id);
      img.src = foto(id);
      img.onerror = () => { img.onerror = null; img.src = `/assets/img/escudos/cartola/${clubIdOf(id)}.jpg`; };

      const cap = document.createElement('figcaption');
      cap.className = 'cap'; cap.textContent = nome(id);

      const stat = document.createElement('div');
      stat.className = 'stat';

      el.appendChild(img); el.appendChild(cap); el.appendChild(stat);
      pitch.appendChild(el);
    } else {
      el.className = `${clsBase} ${clsSit}` + (slot === 'TEC' ? ' coach' : '');
      const cap = el.querySelector('.cap'); if (cap) cap.textContent = nome(id);
      const img = el.querySelector('img'); if (img){ img.alt = nome(id); img.src = foto(id); }
    }

    // seção de dúvida
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

    updateCardStat(pitch, el, pitch.dataset.modeStat || 'ALL');

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
    m.textContent = '⚽';
    m.title = 'Arraste para o cobrador. Duplo clique para voltar para a barra.';
    toolbar.appendChild(m);

    const on = (t,ev,fn,opts)=>t.addEventListener(ev,fn,opts||false);
    let dragging=false, moved=false, offX=0, offY=0, sx=0, sy=0;
    const THRESH=4;

    function pctFromClient(x,y){
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
      m.classList.add('attached'); m.dataset.to = playerEl.id || '';
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
      detach(); m.removeAttribute('style');
      m.classList.add('docked'); toolbar.prepend(m);
    }

    on(m,'pointerdown',e=>{
      e.preventDefault();
      dragging=true; moved=false; sx=e.clientX; sy=e.clientY;
      const r = m.getBoundingClientRect();
      offX = e.clientX - r.left; offY = e.clientY - r.top;
      m.setPointerCapture?.(e.pointerId);
    });
    on(window,'pointermove',e=>{
      if (!dragging) return;
      if (!moved){
        const dx=Math.abs(e.clientX-sx), dy=Math.abs(e.clientY-sy);
        if (dx<THRESH && dy<THRESH) return;
        moved=true; if (m.classList.contains('docked')) undockAtPointer(sx, sy);
      }
      const r = pitch.getBoundingClientRect();
      const x = Math.max(r.left, Math.min(r.right, e.clientX - offX + m.offsetWidth/2));
      const y = Math.max(r.top , Math.min(r.bottom, e.clientY - offY + m.offsetHeight/2));
      const {x:xp,y:yp}=pctFromClient(x,y);
      m.style.left = xp + '%'; m.style.top = yp + '%'; detach();
    });
    on(window,'pointerup',()=>{
      if (!dragging) return; dragging=false;
      if (!moved) return; if (m.classList.contains('docked')) return;
      const {el,d}=findNearestPlayer(); const SNAP=(IS_MOBILE?70:92)*1.3;
      if (d <= SNAP) snapAbove(el);
    });
    on(m,'dblclick', redock);
    return m;
  }

  /* =========================================================================
     TOOLBAR SUPERIOR
     ========================================================================= */
  function ensureToolbar(pitch){
    let tb = pitch.querySelector('.pitch-toolbar');
    if (!tb){ tb = document.createElement('div'); tb.className = 'pitch-toolbar'; pitch.appendChild(tb); }
    tb.innerHTML = '';

    // P primeiro
    const marker = ensurePenaltyMarker(pitch, tb);
    tb.prepend(marker);

    // Helpers
    const refreshAll = () => {
      const mode = pitch.dataset.modeStat || 'ALL';
      pitch.querySelectorAll('.player').forEach(el=>{
        updateCardStat(pitch, el, mode);
        updateAltStat(pitch, el);
      });
      closeAnyPop();
    };
    const setMode = (mode) => { pitch.dataset.modeStat = mode; refreshAll(); };
    const toggleAdv = () => {
      pitch.dataset.adv = (pitch.dataset.adv==='1'?'0':'1');
      aBtn.classList.toggle('active', pitch.dataset.adv==='1'); closeAnyPop();
    };

    // M — mostrar/ocultar média
    const bStat = document.createElement('button');
    bStat.type='button'; bStat.className='btn-chip stat'; bStat.textContent='M';
    bStat.title='Mostrar/ocultar média';
    bStat.onclick = ()=>{
      pitch.classList.toggle('hide-stat');
      bStat.classList.toggle('active', !pitch.classList.contains('hide-stat'));
    };
    tb.appendChild(bStat);
    bStat.classList.toggle('active', !pitch.classList.contains('hide-stat'));

    // MM
    const mmBtn = document.createElement('button');
    mmBtn.type='button'; mmBtn.className='btn-chip'; mmBtn.textContent='MM';
    mmBtn.title='Média Mandante';
    mmBtn.onclick=()=>{ mmBtn.classList.add('active'); mvBtn.classList.remove('active'); setMode('MM'); };
    tb.appendChild(mmBtn);

    // MV
    const mvBtn = document.createElement('button');
    mvBtn.type='button'; mvBtn.className='btn-chip'; mvBtn.textContent='MV';
    mvBtn.title='Média Visitante';
    mvBtn.onclick=()=>{ mvBtn.classList.add('active'); mmBtn.classList.remove('active'); setMode('MV'); };
    tb.appendChild(mvBtn);

    // Duplo clique no botão ativo → ALL
    const resetIfActive = btn => btn.addEventListener('dblclick', ()=>{ btn.classList.remove('active'); setMode('ALL'); });
    resetIfActive(mmBtn); resetIfActive(mvBtn);

    // 5J
    const j5Btn = document.createElement('button');
    j5Btn.type='button'; j5Btn.className='btn-chip'; j5Btn.textContent='5J';
    j5Btn.title='Usar média dos últimos 5 jogos (respeita MM/MV)';
    j5Btn.onclick=()=>{
      const on = pitch.dataset.last5 === '1';
      pitch.dataset.last5 = on ? '0' : '1';
      j5Btn.classList.toggle('active', pitch.dataset.last5 === '1');
      refreshAll();
    };
    tb.appendChild(j5Btn);

       // A — modo avançado
    const aBtn = document.createElement('button');
    aBtn.type='button';
    aBtn.className='btn-chip';
    aBtn.textContent='A';
    aBtn.title='Modo avançado: duplo clique mostra últimos jogos';
    aBtn.onclick = ()=>{
      pitch.dataset.adv = pitch.dataset.adv==='1' ? '0' : '1';
      aBtn.classList.toggle('active', pitch.dataset.adv==='1');
      closeAnyPop();
    };
    tb.appendChild(aBtn);

    // 🔁 Novo botão Reset (voltar posições originais)
    const rBtn = document.createElement('button');
    rBtn.type = 'button';
    rBtn.className = 'btn-chip btn-reset';
    rBtn.innerHTML = '<i class="bi bi-arrow-repeat" aria-hidden="true"></i>';
    rBtn.title = 'Resetar posições originais';
   rBtn.onclick = () => {
  // só este campinho
  pitch.querySelectorAll('.player').forEach(el=>{
    // limpar coords livres de drag
    el.removeAttribute('data-free-x');
    el.removeAttribute('data-free-y');

    const x0 = parseFloat(el.dataset.x0);
    const y0 = parseFloat(el.dataset.y0);

    if (Number.isFinite(x0) && Number.isFinite(y0)){
      el.style.left = `${x0}%`;
      el.style.top  = `${y0}%`;
    } else {
      // fallback raro: resolve pela formação atual
      const slot = el.dataset.slot;
      place(el, slot, null, pitch.dataset.formacao || '');
    }
  });
  // feedback sutil opcional (1s)
  pitch.classList.add('reset-blink');
  setTimeout(()=>pitch.classList.remove('reset-blink'), 600);
};

    tb.appendChild(rBtn);

    // Estado inicial
    pitch.dataset.modeStat = 'ALL';
    pitch.dataset.adv = '0';
    pitch.dataset.last5 = '0';

  }

  /* =========================================================================
     RESET DE POSIÇÃO VIA CLIQUE NO NOME
     ========================================================================= */
function bindCapReset(pitch){
  pitch.querySelectorAll('.player .cap').forEach(cap=>{
    cap.onclick = (e)=>{
      const el = e.currentTarget.closest('.player');
      el.removeAttribute('data-free-x'); el.removeAttribute('data-free-y');

      const x0 = parseFloat(el.dataset.x0);
      const y0 = parseFloat(el.dataset.y0);
      if (Number.isFinite(x0) && Number.isFinite(y0)){
        el.style.left = `${x0}%`;
        el.style.top  = `${y0}%`;
      }else{
        // fallback extremo (se não houver x0/y0 por algum motivo)
        const slot = el.dataset.slot;
        const pos  = resolvePos(slot, null, pitch.dataset.formacao || '');
        el.style.left = `${pos.x}%`;
        el.style.top  = `${pos.y}%`;
      }

      updateCardStat(pitch, el, pitch.dataset.modeStat || 'ALL');
      updateAltStat(pitch, el);
      closeAnyPop();
    };
  });
}


  /* =========================================================================
     DESENHA TIME
     ========================================================================= */
function drawPitch(pitch, team){
  // limpa apenas os jogadores deste pitch
  pitch.querySelectorAll('.player[id^="p-"]').forEach(n=>n.remove());

  const lista   = Array.isArray(team.titulares) ? team.titulares : [];
  const seenIds = new Set();

  for (const p of lista){
    const id   = Number(p.id); if (!Number.isFinite(id)) continue;
    const slot = String(p.slot || 'MEI-C').toUpperCase();
    const sit  = (p.sit || 'provavel').toLowerCase();

    const el = ensurePlayerEl(pitch, { id, slot, sit, duvidaCom: p.duvida_com });

    // coords do admin, se existirem
    const xyAdmin = (p.x != null && p.y != null) ? { x:+p.x, y:+p.y } : null;

    // resolve posição e grava originais
    const pos = resolvePos(slot, xyAdmin, team.formacao || '');
    el.dataset.x0 = String(pos.x);
    el.dataset.y0 = String(pos.y);

    // aplica posição atual
    el.style.left = `${pos.x}%`;
    el.style.top  = `${pos.y}%`;

    seenIds.add(`p-${id}`);
  }

  // técnico (sem variáveis vazando)
  const hasCoach = lista.some(p => String(p.slot||'').toUpperCase() === 'TEC');
  if (!hasCoach && Number.isFinite(+team.tecnico)){
    const idTec = +team.tecnico;
    const el = ensurePlayerEl(pitch, { id:idTec, slot:'TEC', sit:'normal' });

    const pos = resolvePos('TEC', null, team.formacao || '');
    el.dataset.x0 = String(pos.x);
    el.dataset.y0 = String(pos.y);
    el.style.left = `${pos.x}%`;
    el.style.top  = `${pos.y}%`;

    seenIds.add(`p-${idTec}`);
  }

  // remove restos
  pitch.querySelectorAll('.player[id^="p-"]').forEach(el=>{
    if (!seenIds.has(el.id)) el.remove();
  });

  bindCapReset(pitch);
}


  /* =========================================================================
     LINEUPS + OVERRIDES LOCAIS
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
     ORQUESTRAÇÃO
     ========================================================================= */
async function drawAll() {
  const CURRENT = await loadLineups();
  window.CURRENT_LINEUPS = CURRENT;

  await new Promise(res=>{
    const tick = ()=> document.querySelectorAll('.pitch[data-team]').length ? res() : setTimeout(tick,40);
    tick();
  });

  const pitches = document.querySelectorAll('.pitch[data-team]');

  // 1. desenha normalmente
  pitches.forEach(pitch=>{
    const rawKey = pitch.getAttribute('data-team') || '';
    const team = CURRENT?.teams?.[rawKey];
    const key  = team ? rawKey : (Object.keys(CURRENT.teams || {})[0] || rawKey);

    pitch.dataset.scope = key;
    pitch.dataset.formacao = team?.formacao || '';

    if (!team){ pitch.innerHTML=''; return; }

    pitch.classList.add('pitch');
    pitch.classList.add('hide-stat');
    if (!pitch.style.position) pitch.style.position = 'relative';

    ensureToolbar(pitch);
    drawPitch(pitch, team);

    pitch.addEventListener('click', e=>{
      if (!e.target.closest('.games-pop') && !e.target.closest('.player')) closeAnyPop();
    });
  });

  // 2. AGORA sim: depois de tudo renderizado, reseta todos
  setTimeout(()=>{
    document.querySelectorAll('.pitch[data-team]').forEach(p=>resetPitchToOriginal(p));
  }, 250);

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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
})();
