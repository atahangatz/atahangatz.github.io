/* Duck Initiative — the ducks. A mother and her ducklings waddle along the bottom of every page.
   They follow the pointer when it comes near, run when you scroll fast, dive when clicked
   (tail up, feet in the air, like the logo), and race for bread when you feed them.
   Feed enough and another duckling joins. DuckSVG() is also used by other bits of the page. */
function DuckSVG() {
  return '<svg class="dk-svg" viewBox="0 0 124 112" aria-hidden="true">' +
    '<path class="dk-foot f1" d="M44 84L34 106H58L60 84Z"/><path class="dk-foot f2" d="M66 84L62 106H86L80 84Z"/>' +
    '<path class="dk-body" d="M8 40L22 34L40 46L64 40L88 50L98 70L88 88L58 96L30 90L14 72Z"/>' +
    '<path class="dk-wing" d="M38 58L62 52L78 64L62 78L42 74Z"/>' +
    '<path class="dk-body" d="M72 18L88 8L104 14L110 30L102 44L84 46L72 34Z"/>' +
    '<path class="dk-beak" d="M106 22L122 30L108 40L102 32Z"/>' +
    '<circle class="dk-eye" cx="95" cy="24" r="3.6"/></svg>';
}
(function () {
  if (typeof document === 'undefined' || document.body.hasAttribute('data-no-ducks')) return;
  var root = document.documentElement, calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lane = document.createElement('div'); lane.className = 'duck-lane'; document.body.appendChild(lane);
  var small = window.innerWidth < 700, ducks = [], crumbs = [], ptr = null, quacks = 0, last = 0, pause = 0, MAX = small ? 5 : 9;
  var CALLS = ['Quack.', 'Quack!', 'Quack quack.', 'Honk. Sorry, quack.', 'Splash!'];
  /* The bread count lasts while you move between pages, and starts again from zero whenever the site is
     reopened or the page is reloaded. (An old permanent count from earlier versions is cleared.) */
  var fed = 0;
  try {
    localStorage.removeItem('duck.fed'); localStorage.removeItem('duck.case.t0');
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'reload') { sessionStorage.removeItem('duck.fed'); sessionStorage.removeItem('duck.case.t0'); }
    fed = +sessionStorage.getItem('duck.fed') || 0;
  } catch (e) {}
  function sfx(n) { if (window.DuckAudio && window.DuckAudio[n]) window.DuckAudio[n](); }
  function say(d, text, ms) { var b = document.createElement('span'); b.className = 'wk-say'; b.textContent = text; d.el.appendChild(b); setTimeout(function () { b.remove(); }, ms || 1300); }

  function add(s, x) {
    var el = document.createElement('button'), i = ducks.length; el.type = 'button'; el.className = 'dk'; el.style.setProperty('--s', s);
    el.setAttribute('aria-label', i ? 'Duckling. Press to make it dive.' : 'Duck. Press to make it dive.');
    el.innerHTML = '<span class="dk-in">' + DuckSVG() + '</span>';
    var d = { el: el, s: s, x: x, dir: 1, moving: false, dive: 0 };
    el.addEventListener('click', function () { quacks++; sfx('quack'); dive(d, CALLS[quacks % CALLS.length]); if (quacks % 5 === 0) ducks.forEach(function (o, k) { if (o !== d) setTimeout(function () { dive(o); }, 140 * k); }); });
    lane.appendChild(el); ducks.push(d); place(d); return d;
  }
  function dive(d, text) {
    if (d.dive) return; d.dive = 1; d.el.classList.add('dive'); if (text) say(d, text);
    setTimeout(function () { d.dive = 0; d.el.classList.remove('dive'); }, calm ? 700 : 1500);
  }
  function place(d) { d.el.style.transform = 'translateX(' + Math.round(d.x) + 'px)'; d.el.classList.toggle('walk', d.moving && !d.dive); d.el.classList.toggle('left', d.dir < 0); }
  (small ? [1, 0.62] : [1, 0.62, 0.62, 0.5]).forEach(function (s, i) { add(s, 150 - i * 62); });
  for (var k = 0; k < Math.min(Math.floor(fed / 8), MAX - ducks.length); k++) add(0.5, 20);       /* ducklings earned earlier this visit */

  /* ---------- feeding ---------- */
  function count(ate) { [].forEach.call(document.querySelectorAll('[data-fed]'), function (e) { e.textContent = fed; }); try { sessionStorage.setItem('duck.fed', fed); } catch (e) {} if (ate) document.dispatchEvent(new CustomEvent('duck-fed', { detail: { fed: fed } })); }
  function eat(d, c) {
    crumbs.splice(crumbs.indexOf(c), 1); c.el.remove(); fed++; count(true); sfx('nom');
    d.el.classList.remove('peck'); void d.el.offsetWidth; d.el.classList.add('peck'); setTimeout(function () { d.el.classList.remove('peck'); }, 380);
    if (fed % 8 === 0 && ducks.length < MAX) { var n = add(0.5, -40); say(n, 'Peep!', 1600); say(ducks[0], 'A new one!', 1600); }
    else if (fed % 5 === 0) say(d, ['Nom.', 'More.', 'Bread!'][fed % 3], 900);
  }
  function feed(n, atX) {
    var W = window.innerWidth, cx = atX != null ? atX : (ptr ? ptr.x : W * (0.25 + Math.random() * 0.5));
    for (var i = 0; i < (n || 3); i++) {
      var el = document.createElement('i'); el.className = 'bread'; lane.appendChild(el);
      var c = { el: el, x: Math.max(16, Math.min(W - 24, cx + (Math.random() - 0.5) * 260)), y: calm ? 0 : window.innerHeight * (0.35 + Math.random() * 0.25), vy: 0, r: Math.random() * 360 };
      crumbs.push(c); el.style.transform = 'translate(' + c.x + 'px,' + (-c.y) + 'px) rotate(' + c.r + 'deg)';
    }
    if (calm) setTimeout(function () { crumbs.slice().forEach(function (c, j) { eat(ducks[j % ducks.length], c); }); }, 500);
  }
  count();
  var holdUntil = 0;
  window.DuckFlock = { ducks: ducks, dive: dive, feed: feed, fed: function () { return fed; }, hold: function (ms) { holdUntil = performance.now() + ms; } };
  if (calm) return;

  window.addEventListener('pointermove', function (e) { ptr = { x: e.clientX, y: e.clientY }; }, { passive: true });
  function tick(t) {
    requestAnimationFrame(tick); if (!last) last = t; var dt = Math.min(0.05, (t - last) / 1000); last = t;
    var W = window.innerWidth, lead = ducks[0], vd = parseFloat(root.style.getPropertyValue('--vd')) || 0, run = Math.abs(vd) > 0.3, i, d;
    crumbs.forEach(function (c) { if (c.y > 0) { c.vy += 1500 * dt; c.y = Math.max(0, c.y - c.vy * dt); c.r += 300 * dt; c.el.style.transform = 'translate(' + c.x + 'px,' + (-c.y) + 'px) rotate(' + c.r + 'deg)'; } });
    if (t < holdUntil) { ducks.forEach(function (o) { o.moving = false; }); ducks.forEach(place); return; }   /* frozen: one of them is talking */
    if (crumbs.length) {
      /* bread on the ground: every duck for itself */
      for (i = 0; i < ducks.length; i++) {
        d = ducks[i]; d.moving = false; if (d.dive) continue;
        var best = null, bd = 1e9; crumbs.forEach(function (c) { var dist = Math.abs(c.x - (d.x + 32 * d.s + (d.dir > 0 ? 22 * d.s : -22 * d.s))); if (dist < bd) { bd = dist; best = c; } });
        if (!best) continue; var mouth = d.x + 32 * d.s + d.dir * 24 * d.s, dx = best.x - mouth;
        if (Math.abs(dx) < 9) { if (best.y <= 0) eat(d, best); }
        else { d.dir = dx > 0 ? 1 : -1; d.x += d.dir * Math.min(Math.abs(dx), (150 + 60 * (1 - d.s)) * dt); d.moving = true; }
      }
    } else {
      if (!lead.dive) {
        var sp = 34, near = ptr && ptr.y > window.innerHeight - 230 && Math.abs(ptr.x - (lead.x + 32)) > 46;
        if (run) { lead.dir = vd > 0 ? 1 : -1; sp = 300; pause = 0; }
        else if (near) { lead.dir = ptr.x > lead.x + 32 ? 1 : -1; sp = 70; pause = 0; }
        else if (t < pause) sp = 0;
        else if (Math.random() < 0.002) { pause = t + 900 + Math.random() * 1800; if (Math.random() < 0.5) lead.dir *= -1; }
        lead.x += lead.dir * sp * dt; lead.moving = sp > 0;
        if (lead.x > W - 76) { lead.x = W - 76; lead.dir = -1; } if (lead.x < 8) { lead.x = 8; lead.dir = 1; }
      } else lead.moving = false;
      for (i = 1; i < ducks.length; i++) {
        d = ducks[i]; var prev = ducks[i - 1], gap = 30 + 34 * prev.s, tx = prev.x - prev.dir * gap + (64 - 64 * d.s) / 2, ddx = tx - d.x;
        d.moving = false; if (d.dive) continue;
        if (Math.abs(ddx) > 6) { var st = Math.min(Math.abs(ddx), (run ? 330 : 96) * dt); d.x += st * (ddx > 0 ? 1 : -1); d.dir = ddx > 0 ? 1 : -1; d.moving = true; } else d.dir = prev.dir;
      }
    }
    ducks.forEach(place); root.classList.toggle('ducks-run', run || crumbs.length > 0);
  }
  requestAnimationFrame(tick);
})();
