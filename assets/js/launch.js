/* Duck Initiative — launch day, the cube, and links to the Polygraph folder.
   Loaded after site.js on every page. */
(function () {
  /* After launch (December 8, 2026, Istanbul time) every dated line switches to its data-after text by itself. */
  if (Date.now() >= Date.UTC(2026, 11, 7, 21)) {
    [].forEach.call(document.querySelectorAll('[data-after]'), function (el) { el.textContent = el.getAttribute('data-after'); });
  }

  /* Opened straight from a folder (file://), a link to "polygraph/" shows a file listing instead of the page.
     Point those links at the index.html inside. On the web the addresses stay clean. */
  if (location.protocol === 'file:') {
    [].forEach.call(document.querySelectorAll('a[href^="polygraph/"]'), function (a) {
      var m = a.getAttribute('href').match(/^([^#]*\/)(#.*)?$/); if (m) a.setAttribute('href', m[1] + 'index.html' + (m[2] || ''));
    });
  }

  /* The hero film is 0.7 MB. It is fetched only once its scene is one screen away, never for people who asked
     for less motion or less data (they get the still), so the first paint does not wait on it. */
  [].forEach.call(document.querySelectorAll('video[data-src]'), function (v) {
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches, saving = navigator.connection && navigator.connection.saveData;
    function go() { v.poster = v.getAttribute('data-poster'); if (calm || saving) return; v.src = v.getAttribute('data-src'); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    if (!('IntersectionObserver' in window)) return go();
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { rootMargin: '100% 0px' });
    io.observe(v);
  });

  /* The cube: count it as Blender does, or as an engine does. */
  var demo = document.getElementById('demo'); if (!demo) return;
  var label = document.getElementById('vlabel'), count = document.getElementById('vcount'), note = document.getElementById('vnote');
  demo.addEventListener('change', function (e) {
    var engine = e.target.value, split = engine !== 'blender';
    demo.classList.toggle('split', split);
    label.textContent = split ? 'Vertices in ' + engine : 'Vertices';
    count.textContent = split ? '24' : '8';
    note.textContent = split ? 'Hard edges and UV seams add 16 vertices: every corner is three corners now.' : 'One vertex per corner. This is the number Blender shows you.';
  });
})();
