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

function clearArrows(pitch){
  const g = pitch.querySelector('.draw-layer .paths');
  if (g) g.innerHTML = '';
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

    // ✏️ Desenhar setas
const drawBtn = document.createElement('button');
drawBtn.type='button';
drawBtn.className='btn-chip';
drawBtn.innerHTML = '<i class="bi bi-arrow-up-right"></i>';
drawBtn.title='Desenhar setas (clique e arraste)';
drawBtn.onclick = ()=> toggleDrawMode(pitch, drawBtn);
tb.appendChild(drawBtn);


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

    clearArrows(pitch);             // limpa as setas também
  pitch.classList.add('reset-blink');
  setTimeout(()=>pitch.classList.remove('reset-blink'), 600);
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


// Layer SVG e controle do modo

function getDrawLayer(pitch){
  let layer = pitch.querySelector('.draw-layer');
  if (!layer){
    layer = document.createElement('div');
    layer.className = 'draw-layer';
 layer.innerHTML = `
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    <g class="paths"></g>
  </svg>`;
    pitch.appendChild(layer);
  }
  return layer;
}

function toggleDrawMode(pitch, btn){
  const on = !pitch.classList.contains('draw-on');
  pitch.classList.toggle('draw-on', on);
  btn.classList.toggle('active', on);
  if (on) enableDraw(pitch); else disableDraw(pitch);
}

function pctFromClientInPitch(pitch, cx, cy){
  const r = pitch.getBoundingClientRect();
  const x = ((cx - r.left) / r.width ) * 100;
  const y = ((cy - r.top ) / r.height) * 100;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}




function enableDraw(pitch){
  // evita mover jogadores enquanto desenha
  pitch.querySelectorAll('.player').forEach(p=>p.style.pointerEvents='none');

  // impedir menu do botão direito durante desenho
  const stopCtx = e => { if (pitch.classList.contains('draw-on')) e.preventDefault(); };
  pitch.addEventListener('contextmenu', stopCtx);

  // SVG
  const svg = getDrawLayer(pitch).querySelector('svg');
  const g   = svg.querySelector('.paths');

  /* ======================================
     COR ATUAL  (white / red / green)
     ====================================== */
  let currentColor = 'white';

  function handleKeyDown(e){
    if (e.key === 'r' || e.key === 'R') currentColor = 'red';
    if (e.key === 'g' || e.key === 'G') currentColor = 'green';
  }
  function handleKeyUp(e){
    if (e.key === 'r' || e.key === 'R') currentColor = 'white';
    if (e.key === 'g' || e.key === 'G') currentColor = 'white';
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup',   handleKeyUp);

  let drawing=false, pathEl=null, pts=[];

  /* converter mouse → % dentro do pitch */
  const pct = (cx, cy)=>{
    const r = pitch.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((cx-r.left)/r.width )*100)),
      y: Math.max(0, Math.min(100, ((cy-r.top )/r.height)*100))
    };
  };

  // suavização da curva
  function smoothPath(points, tension=0.5){
    if (points.length < 2) return '';
    if (points.length === 2){
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
    }
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i=0;i<points.length-1;i++){
      const p0 = points[i-1] || points[i];
      const p1 = points[i];
      const p2 = points[i+1];
      const p3 = points[i+2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  function down(e){
    if (!pitch.classList.contains('draw-on')) return;
    if (e.button !== 2) return; // somente botão direito
    e.preventDefault();

    drawing=true;
    pts=[pct(e.clientX, e.clientY)];

    pathEl=document.createElementNS('http://www.w3.org/2000/svg','path');
    pathEl.setAttribute('class', `draw-path ${currentColor}`);
    g.appendChild(pathEl);
  }

  function move(e){
    if (!drawing) return;
    const p = pct(e.clientX, e.clientY);
    const last = pts[pts.length-1];

    if (!last || Math.hypot(p.x-last.x, p.y-last.y) > 0.6){
      pts.push(p);
      if (pts.length > 400) pts.shift();
      pathEl.setAttribute('d', smoothPath(pts, 0.6));
    }
  }

  function up(){
    if (!drawing) return;
    drawing=false;
    if ((pts?.length || 0) < 2 && pathEl){
      pathEl.remove();
    }
  }

  // salvar handlers para remoção posterior
  pitch.__drawHandlers = {
    down, move, up, stopCtx, handleKeyDown, handleKeyUp
  };

  pitch.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup',   up);
}

function disableDraw(pitch){
  // reativa drag dos jogadores
  pitch.querySelectorAll('.player').forEach(p=>p.style.pointerEvents='');

  const h = pitch.__drawHandlers;
  if (!h) return;

  pitch.removeEventListener('pointerdown', h.down);
  window.removeEventListener('pointermove', h.move);
  window.removeEventListener('pointerup',   h.up);

  pitch.removeEventListener('contextmenu', h.stopCtx);

  window.removeEventListener('keydown', h.handleKeyDown);
  window.removeEventListener('keyup',   h.handleKeyUp);

  pitch.__drawHandlers = null;
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
