(function () {
  'use strict';
  var header = document.querySelector('[data-nav]');
  if (!header) return;
  var burger = header.querySelector('[data-burger]');
  var drawer = header.querySelector('#mobile-menu');

  function setOpen(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    drawer.hidden = !open;
    document.body.classList.toggle('nav-open', open);
    if (open) { var first = drawer.querySelector('a'); if (first) first.focus({ preventScroll: true }); }
  }
  burger.addEventListener('click', function () { setOpen(drawer.hidden); });
  drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !drawer.hidden) { setOpen(false); burger.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 960 && !drawer.hidden) setOpen(false); });

  // sección activa (solo en la portada, donde existen las secciones)
  var links = header.querySelectorAll('[data-sec]');
  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute('data-sec'); var el = document.getElementById(id);
    if (el) (map[id] = map[id] || { el: el, links: [] }).links.push(a);
  });
  var ids = Object.keys(map);
  if (!ids.length || !('IntersectionObserver' in window)) return;

  function mark(id) {
    ids.forEach(function (k) {
      map[k].links.forEach(function (a) { if (k === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    });
  }
  var visible = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
    var best = null, bestV = 0;
    ids.forEach(function (k) { if ((visible[k] || 0) > bestV) { bestV = visible[k]; best = k; } });
    mark(best);
  }, { rootMargin: '-84px 0px -45% 0px', threshold: [0, .1, .25, .5, .75, 1] });
  ids.forEach(function (k) { io.observe(map[k].el); });
})();
