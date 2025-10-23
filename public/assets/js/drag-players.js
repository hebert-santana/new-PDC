// drag-players.js — arrasta .player/.jogador com fallback mouse/touch
(() => {
  if (!window.DRAG_ENABLED) return;

  const SAVE_KEY = 'pitch_positions_v6';
  const SEL = '.jogador, .player';
  const saved = safeParse(localStorage.getItem(SAVE_KEY)) || {};
  const seen = new WeakSet();

  // ---------- utils
  function safeParse(s){ try{ return JSON.parse(s); } catch { return null; } }
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const pct = v => `${v}%`;
  const r2 = n => Math.round(n*100)/100;

  function getScope(el){
    const p = el.closest('.pitch');
    return String(p?.dataset.scope || p?.getAttribute('data-team') || '0');
  }
  function getId(el){
    return el.dataset.id || el.getAttribute('data-atleta_id') || el.id || '';
  }
  const keyOf = el => `${getScope(el)}:${getId(el)}`;

  function rememberInit(el){
    if (!el.dataset.initLeft) el.dataset.initLeft = el.style.left || '';
    if (!el.dataset.initTop ) el.dataset.initTop  = el.style.top  || '';
  }

  function ensurePitchRel(el){
    const pitch = el.closest('.pitch');
    if (pitch && getComputedStyle(pitch).position === 'static') pitch.style.position = 'relative';
    return pitch;
  }

  function hardenFigure(el){
    const img = el.querySelector('img');
    if (img){
      img.setAttribute('draggable','false');
      img.style.userSelect = 'none';
      img.style.webkitUserDrag = 'none';
      img.style.pointerEvents = 'none';
    }
  }

  function applySaved(el){
    if (!el || seen.has(el)) return;
    if (!getId(el)) return;
    ensurePitchRel(el);
    hardenFigure(el);

    rememberInit(el);
    const pos = saved[keyOf(el)];
    if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)){
      el.style.left = pct(pos.x);
      el.style.top  = pct(pos.y);
    }
    seen.add(el);
  }

  // ---------- reset com duplo clique
  document.addEventListener('dblclick', (e) => {
    const el = e.target.closest(SEL);
    if (!el) return;
    delete saved[keyOf(el)];
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    el.style.left = el.dataset.initLeft || el.style.left;
    el.style.top  = el.dataset.initTop  || el.style.top;
  });

  // ---------- DRAG
  let dragging = null;

  function startDrag(el, clientX, clientY){
    const pitch = ensurePitchRel(el);
    if (!pitch) return;

    rememberInit(el);
    hardenFigure(el);

    const rect = pitch.getBoundingClientRect();
    const r = el.offsetWidth/2;

    dragging = {
      el, pitch, r,
      w: rect.width, h: rect.height,
      x: (parseFloat(el.style.left)||0)/100 * rect.width,
      y: (parseFloat(el.style.top)||0)/100  * rect.height,
      px: clientX, py: clientY,
      oldZ: el.style.zIndex || ''
    };

    el.style.zIndex = '10';
    el.style.touchAction = 'none';

    window.addEventListener('pointermove', onPointerMove, { passive:true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('mousemove', onMouseMove, { passive:true });
    window.addEventListener('mouseup', onMouseUp);

    window.addEventListener('touchmove', onTouchMove, { passive:false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
  }

  function moveTo(clientX, clientY, ctrlSnap){
    if (!dragging) return;
    const d = dragging;
    let x = d.x + (clientX - d.px);
    let y = d.y + (clientY - d.py);

    x = clamp(x, d.r, d.w - d.r);
    y = clamp(y, d.r, d.h - d.r);

    let xp = x / d.w * 100;
    let yp = y / d.h * 100;

    if (ctrlSnap){
      const step = 5;
      xp = Math.round(xp/step)*step;
      yp = Math.round(yp/step)*step;
    }
    d.el.style.left = pct(r2(xp));
    d.el.style.top  = pct(r2(yp));
  }

  function finishDrag(){
    if (!dragging) return;
    const el = dragging.el;
    saved[keyOf(el)] = {
      x: r2(parseFloat(el.style.left)||0),
      y: r2(parseFloat(el.style.top)||0)
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved));

    el.style.zIndex = dragging.oldZ;
    el.style.touchAction = '';

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);

    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);

    dragging = null;
  }

  // Pointer
  function onPointerDown(e){
    const el = e.target.closest(SEL);
    if (!el) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    startDrag(el, e.clientX, e.clientY);
  }
  function onPointerMove(e){ moveTo(e.clientX, e.clientY, e.ctrlKey); }
  function onPointerUp(){ finishDrag(); }

  // Mouse fallback
  function onMouseDown(e){
    const el = e.target.closest(SEL);
    if (!el) return;
    if (e.button !== 0) return;
    e.preventDefault();
    startDrag(el, e.clientX, e.clientY);
  }
  function onMouseMove(e){ moveTo(e.clientX, e.clientY, e.ctrlKey); }
  function onMouseUp(){ finishDrag(); }

  // Touch fallback
  function onTouchStart(e){
    const t = e.touches && e.touches[0];
    if (!t) return;
    const el = e.target.closest(SEL);
    if (!el) return;
    e.preventDefault();
    startDrag(el, t.clientX, t.clientY);
  }
  function onTouchMove(e){
    const t = e.touches && e.touches[0];
    if (!t) return;
    e.preventDefault();
    moveTo(t.clientX, t.clientY, false);
  }
  function onTouchEnd(){ finishDrag(); }

  // Delegação
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('touchstart', onTouchStart, { passive:false });

  // observar DOM para aplicar posições salvas
  const mo = new MutationObserver((mut) => {
    for (const m of mut){
      for (const n of m.addedNodes){
        if (!(n instanceof Element)) continue;
        if (n.matches?.(SEL)) applySaved(n);
        n.querySelectorAll?.(SEL).forEach(applySaved);
      }
    }
  });
  mo.observe(document.body, { childList:true, subtree:true });

  // inicial
  document.querySelectorAll(SEL).forEach(applySaved);

  // helper
  window.PitchDrag = {
    clearAll(){ localStorage.removeItem(SAVE_KEY); },
    dump(){ return safeParse(localStorage.getItem(SAVE_KEY)) || {}; }
  };
})();
