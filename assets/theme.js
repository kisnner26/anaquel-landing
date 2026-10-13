(function(){
  var root=document.documentElement,btn=document.querySelector('[data-theme-toggle]');
  function apply(dark){root.classList.toggle('dark',dark);if(btn){btn.setAttribute('aria-pressed',String(dark));btn.setAttribute('title',dark?'Cambiar a tema claro':'Cambiar a tema oscuro')}}
  var saved=null;try{saved=localStorage.getItem('anaquel-theme')}catch(e){}
  var dark=saved?saved==='dark':window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  apply(dark);
  if(btn)btn.addEventListener('click',function(){dark=!dark;apply(dark);try{localStorage.setItem('anaquel-theme',dark?'dark':'light')}catch(e){}});
})();
