// ===== Flags rápidas (padrão) =====
window.INDICADOS_FLAGS = Object.assign({
  captain: true,   // bolinha do capitão
  luxBadge: false, // selo em bolinha p/ luxo (se você usar)
  luxTag: true     // chip "Reserva de luxo" no banco
}, window.INDICADOS_FLAGS || {});

// ===== Ativa classes na <html> =====
(function () {
  const root = document.documentElement;

  function set(flag, className){
    root.classList.toggle(className, !!flag);
  }

  // 1) aplica padrão do objeto
  set(INDICADOS_FLAGS.captain,  'has-captain');
  set(INDICADOS_FLAGS.luxBadge, 'has-lux-badge');
  set(INDICADOS_FLAGS.luxTag,   'has-lux-tag');

  // 2) overrides por querystring (ex.: ?captain=0&luxTag=1)
  const qs = new URLSearchParams(location.search);
  if (qs.has('captain'))  set(qs.get('captain')  !== '0', 'has-captain');
  if (qs.has('luxBadge')) set(qs.get('luxBadge') !== '0', 'has-lux-badge');
  if (qs.has('luxTag'))   set(qs.get('luxTag')   !== '0', 'has-lux-tag');
})();
