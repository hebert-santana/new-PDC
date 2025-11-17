(function(){
  const ad = document.querySelector('#ads-bottom');
  const btn = document.querySelector('#close-ad');

  if (!ad || !btn) return;

  btn.addEventListener('click', () => {
    ad.remove();                         // remove anúncio
    document.body.classList.add('ad-closed'); // mostra navbar mobile
  });
})();
