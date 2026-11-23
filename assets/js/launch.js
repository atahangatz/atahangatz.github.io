/* Duck Initiative — launch day, the cube, and links to the Polygraph folder.
   Loaded after site.js on every page. */
(function () {
  /* Launch: Tuesday, December 8, 2026 at 18:00 Istanbul time (15:00 UTC, 9:00 in Chicago, 10:00 in New York).
     Gumroad is published by hand a few minutes before. From that minute every dated line switches to its
     data-after text and the store buttons open. polygraph/pg.js keeps the same moment, so change both together.
     Superhive publishes the listing by itself at 9am Central; its buttons wait ten more minutes, so a slow publish
     never sends anyone to a missing page. Blender Extensions goes live when its review passes, not on a date:
     set EXTENSIONS_LIVE to true once https://extensions.blender.org/add-ons/polygraph/ opens for everyone. */
  var LAUNCH = Date.UTC(2026, 11, 8, 15), SUPERHIVE_OPENS = LAUNCH + 10 * 60 * 1000, EXTENSIONS_LIVE = false;
  var now = Date.now(), launched = now >= LAUNCH;
  if (launched) {
    [].forEach.call(document.querySelectorAll('[data-after]'), function (el) { el.textContent = el.getAttribute('data-after'); });
  }

  /* Before launch a store link leads to the email sign-up under "Polygraph comes out on December 8" on the home page.
     After launch a store that isn't open yet loses its button for now; the Gumroad button beside it sells the same edition. */
  [].forEach.call(document.querySelectorAll('a[href*="gumroad.com/l/"], a[href*="superhivemarket.com/products/"], a[href*="extensions.blender.org/add-ons/"]'), function (a) {
    var h = a.href;
    var open = h.indexOf('extensions.blender.org') > -1 ? launched && EXTENSIONS_LIVE : h.indexOf('superhivemarket.com') > -1 ? now >= SUPERHIVE_OPENS : launched;
    if (open) return;
    if (launched) { a.style.display = 'none'; return; }
    a.setAttribute('href', '/#news');
    a.title = 'On sale from December 8. Leave your email and we\'ll tell you the moment it is out.';
  });

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
