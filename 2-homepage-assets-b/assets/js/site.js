/* Duck Initiative — shared page behaviour: workers, VCR deck, tape effects, shelf, Polygraph needle. */
(function () {
  var D = window.DuckAvatar, ALL = window.DuckWorkers.get();
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement, body = document.body;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---------- tape effects ---------- */
  var fx = el('div', 'tape-fx'); fx.setAttribute('aria-hidden', 'true'); body.appendChild(fx);
  var burst = el('div', 'static-burst'); burst.setAttribute('aria-hidden', 'true'); body.appendChild(burst);
  function flash(cls, ms) { if (calm) return; body.classList.remove(cls); void body.offsetWidth; body.classList.add(cls); setTimeout(function () { body.classList.remove(cls); }, ms || 300); }
  function staticBurst(then) { if (calm) { if (then) then(); return; } burst.classList.remove('on'); void burst.offsetWidth; burst.classList.add('on'); setTimeout(function () { burst.classList.remove('on'); if (then) then(); }, 240); }

  /* boot screen, once per visit */
  try {
    if (!calm && !body.hasAttribute('data-no-boot') && !sessionStorage.getItem('duck.booted')) {
      sessionStorage.setItem('duck.booted', '1');
      var boot = el('div', '', '<div><b>NO SIGNAL</b><br>INSERT TAPE ▮</div><div class="bars">' + ['#ECEBF5', '#FFE600', '#19E3FF', '#2BF0A0', '#FF2E93', '#E63F0A', '#2B3BFF'].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div><div>PLAY ▶ &nbsp; SP</div>');
      boot.id = 'boot'; boot.setAttribute('aria-hidden', 'true'); body.appendChild(boot); setTimeout(function () { boot.remove(); }, 1500);
    }
  } catch (e) {}

  /* ---------- top bar, Waddle edge tab, Polygraph notification ---------- */
  (function () {
    var page = body.getAttribute('data-page') || 'home', B = 'assets/brand/', inW = page === 'waddle' || page === 'addons';
    var bar = el('header', 'bar',
      '<a class="bar-home" href="index.html" data-ch aria-label="Duck Initiative, home"><img class="logo" src="' + B + 'duck-initiative-logo-128.png" alt="" width="44" height="44" decoding="async"><img class="word" src="' + B + 'duck-initiative-wordmark-light.svg" alt="Duck Initiative"></a>' +
      '<a class="bar-lcd" href="addons.html" data-ch aria-label="Now playing: Polygraph, a Blender add-on, sold at Waddle. Recording next: Dancefloor, Abandonify and Proxyforge"><span aria-hidden="true"><b>▶ NOW PLAYING</b> &nbsp;POLYGRAPH · BLENDER ADD-ON · TAPE 01 &nbsp;●&nbsp; SOLD AT WADDLE &nbsp;●&nbsp; RECORDING NEXT: DANCEFLOOR · ABANDONIFY · PROXYFORGE &nbsp;●&nbsp;</span></a>' +
      '<nav class="bar-nav" aria-label="Main">' +
        '<a class="bar-btn" href="index.html" data-ch' + (page === 'home' ? ' aria-current="page"' : '') + '>Home</a>' +
        '<div class="bar-w"><a class="bar-btn waddle" href="waddle.html" data-ch' + (page === 'waddle' ? ' aria-current="page"' : '') + '><img src="' + B + 'waddle-mark-site-yellow.svg" alt=""><span>Waddle</span><small>THE SHOP</small></a>' +
        '<button class="bar-btn bar-more" type="button" aria-expanded="false" aria-label="Waddle aisles">▾</button>' +
        '<div class="bar-menu"><a href="waddle.html" data-ch>The shop floor<small>WADDLE</small></a><hr>' +
          '<a href="addons.html" data-ch' + (page === 'addons' ? ' aria-current="page"' : '') + '>Add-ons<small>1 TAPE · 3 RECORDING</small></a>' +
          '<a href="polygraph/">Polygraph guide<small>TAPE 01</small></a>' +
          '<span>Assets<small>RECORDING</small></span><span>Mobile<small>RECORDING</small></span></div></div>' +
      '</nav>');
    body.insertBefore(bar, body.firstChild);
    /* Waddle menu. Opens on hover, focus or the arrow button, and stays open while the pointer travels
       to it: leaving starts a short timer, and a pointer heading into the "safe triangle" between where it
       left and the menu's near edge keeps the menu open. Arrow keys move through it, Escape closes it. */
    var wrap = $('.bar-w', bar), more = $('.bar-more', bar), menu = $('.bar-menu', bar), main = $('.bar-btn.waddle', bar), shut = 0, exit = null;
    menu.id = 'waddle-menu'; more.setAttribute('aria-controls', 'waddle-menu'); more.setAttribute('aria-haspopup', 'true');
    function links() { return $$('a', menu); }
    function setOpen(o) { clearTimeout(shut); wrap.classList.toggle('open', o); more.setAttribute('aria-expanded', o); if (!o) exit = null; }
    function isOpen() { return wrap.classList.contains('open'); }
    function later(ms) { clearTimeout(shut); shut = setTimeout(function () { setOpen(false); }, ms); }
    function side(p, a, b) { return (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y); }
    function inTri(p, a, b, c) { var d1 = side(p, a, b), d2 = side(p, b, c), d3 = side(p, c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); }
    wrap.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') setOpen(true); });
    /* Leaving from the button: allow a moment to reach the list, but only while heading for it.
       Leaving from the list itself, or heading anywhere else: close straight away. The timer is set once
       and never pushed back by further movement, so the menu cannot linger. */
    wrap.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch' || !isOpen()) return;
      var r = menu.getBoundingClientRect(), fromBtn = e.clientY < r.top + 2;
      exit = { x: e.clientX, y: e.clientY, btn: fromBtn, fast: !fromBtn }; later(fromBtn ? 380 : 160);
    });
    document.addEventListener('pointermove', function (e) {
      if (!exit || exit.fast || !isOpen() || wrap.contains(e.target)) return;
      var r = menu.getBoundingClientRect(), p = { x: e.clientX, y: e.clientY };
      if (!inTri(p, exit, { x: r.left - 16, y: r.top }, { x: r.right + 16, y: r.top })) { exit.fast = true; later(90); }
    }, { passive: true });
    var pd = null;   /* was it open when the mouse went down? (focus opens it before the click arrives) */
    more.addEventListener('pointerdown', function () { pd = isOpen(); });
    more.addEventListener('click', function () { var key = pd === null, o = key ? true : !pd; pd = null; setOpen(o); if (o && key) { var l = links(); if (l[0]) l[0].focus(); } });
    wrap.addEventListener('focusin', function (e) { if (e.target.matches(':focus-visible')) setOpen(true); });   /* keyboard focus only: a mouse click must not pin it open */
    wrap.addEventListener('focusout', function (e) { if (!wrap.contains(e.relatedTarget)) later(120); });
    wrap.addEventListener('keydown', function (e) {
      var l = links(), i = l.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); (l[i + 1] || l[0]).focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); (l[i - 1] || l[l.length - 1]).focus(); }
      else if (e.key === 'Home' && i >= 0) { e.preventDefault(); l[0].focus(); }
      else if (e.key === 'End' && i >= 0) { e.preventDefault(); l[l.length - 1].focus(); }
      else if (e.key === 'Escape') { var back = i >= 0; setOpen(false); if (back) main.focus(); }
    });
    document.addEventListener('pointerdown', function (e) { if (!wrap.contains(e.target)) setOpen(false); });

    /* find-us drawer (right edge) and the same links in the footer: socials, then the shops that carry Waddle.
       Closed it is a slim column of icons; hover, focus or the tab opens it to show every name. */
    (function () {
      var L = window.DUCK_LINKS; if (!L) return;
      var BR = window.DUCK_ICONS || {}, HOT = ['#FFE600', '#19E3FF', '#FF2E93', '#2BF0A0', '#E63F0A'], n = 0;
      function glyph(o) {
        var g = BR[o.id]; if (g) return '<svg viewBox="' + g.vb + '" aria-hidden="true">' + g.body + '</svg>';
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="16.4" text-anchor="middle" class="mono">' + (o.mono || o.label.slice(0, 2)) + '</text></svg>';
      }
      function item(o) {
        var st = ' style="--hot:' + HOT[n++ % HOT.length] + '"', inner = '<span class="lk-i">' + glyph(o) + '</span><span class="lk-t">' + o.label + '</span><span class="lk-g" aria-hidden="true">' + (o.url ? '↗' : 'SOON') + '</span>';
        if (!o.url) return '<span class="lk off"' + st + '>' + inner.replace(' aria-hidden="true">SOON', '><span class="sr">coming </span>SOON') + '</span>';
        return '<a class="lk"' + st + ' href="' + o.url + '" target="_blank" rel="noopener" aria-label="' + o.label + (o.home ? '' : ', Waddle by Duck Initiative') + '">' + inner + '</a>';
      }
      function group(title, list) { return list && list.length ? '<div class="lk-grp"><span class="lk-h">' + title + '</span>' + list.map(item).join('') + '</div>' : ''; }
      var html = group('Follow', L.social) + group('Waddle is sold at', L.shops);
      var rail = el('nav', 'rail', '<button class="rail-tab" type="button" aria-expanded="false"><span>FIND US</span></button><div class="rail-in">' + html + '</div>');
      rail.setAttribute('aria-label', 'Social and shop links'); body.appendChild(rail);
      var tab = $('.rail-tab', rail);
      function open(o) { rail.classList.toggle('open', o); tab.setAttribute('aria-expanded', o); }
      tab.addEventListener('click', function () { open(!rail.classList.contains('open')); });
      document.addEventListener('click', function (e) { if (!rail.contains(e.target)) open(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
      /* pages without the scroll story: fold the drawer once the first screen is scrolled away (story.js does this on the home page) */
      if (!$('[data-scene]')) { var fold = function () { body.classList.toggle('rail-min', window.scrollY > window.innerHeight * 0.6); }; window.addEventListener('scroll', fold, { passive: true }); fold(); }
      var end = $('footer.end .meta'); if (end) { var row = el('nav', 'links-row', html); row.setAttribute('aria-label', 'Social and shop links'); end.parentNode.insertBefore(row, end); }
    })();

    var seen = false; try { seen = sessionStorage.getItem('duck.note') === 'x'; } catch (e) {}
    if (body.hasAttribute('data-notify') && !seen) {
      var note = el('aside', 'note', (window.DuckSVG ? '<span class="note-duck"><span class="dk-in">' + window.DuckSVG() + '</span></span>' : '') +
        '<img src="' + B + 'polygraph-app-icon.svg" alt=""><div><b>New tape at Waddle</b><p data-after="Polygraph, our first Blender add-on, is out now.">Polygraph, our first Blender add-on, comes out on December 8.</p><a href="addons.html" data-ch>Watch it ▶</a></div><button class="x" type="button" aria-label="Dismiss">✕</button>');
      note.setAttribute('aria-label', 'New product');
      body.appendChild(note);
      $('.x', note).addEventListener('click', function () { note.remove(); try { sessionStorage.setItem('duck.note', 'x'); } catch (e) {} });
    }
  })();

  /* channel change between pages */
  $$('a[data-ch]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (calm || e.metaKey || e.ctrlKey || e.shiftKey || e.button || a.getAttribute('aria-current') === 'page') return;
      var href = a.getAttribute('href'); if (href.charAt(0) === '#') return;
      e.preventDefault(); staticBurst(function () { window.location.href = href; });
    });
  });

  /* ---------- workers ---------- */
  var cache = {}, workers = {}, list = [], ptr = null, raf = 0;
  function svg(spec, o) { var k = JSON.stringify([spec, o]); return cache[k] || (cache[k] = D.renderSVG(spec, o)); }
  function Worker(host) {
    var w = this, id = host.getAttribute('data-worker'), def = ALL[id] || ALL[Object.keys(ALL)[0]];
    w.id = id; w.def = def; w.el = host; w.n = 0;
    w.base = { pose: host.getAttribute('data-pose') || 'stand', facing: host.getAttribute('data-facing') || 'front', mood: 'none' };
    w.look = host.getAttribute('data-look') !== 'off'; w.lookF = null; w.over = null;
    host.classList.add('wk'); host.type = 'button'; host.setAttribute('data-job', def.job); host.setAttribute('aria-label', def.job + '. Press to hear them.');
    host.style.setProperty('--d', (-list.length * 0.53) + 's');
    w.fig = el('span', 'wk-fig'); host.appendChild(w.fig);
    host.addEventListener('pointerenter', function () { w.hover = true; w.draw(); });
    host.addEventListener('pointerleave', function () { w.hover = false; w.draw(); });
    host.addEventListener('pointerdown', function (e) { w.down = { x: e.clientX, y: e.clientY }; try { host.setPointerCapture(e.pointerId); } catch (x) {} });
    host.addEventListener('pointermove', function (e) {
      if (!w.down) return; var dx = e.clientX - w.down.x, dy = e.clientY - w.down.y;
      if (!w.drag && Math.abs(dx) + Math.abs(dy) < 7) return;
      if (!w.drag) { w.drag = true; host.classList.remove('is-back'); host.classList.add('is-drag'); w.hush(); w.draw(); }
      host.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    });
    function up() { if (w.drag) { w.drag = false; w.dragged = true; host.classList.remove('is-drag'); host.classList.add('is-back'); host.style.transform = ''; w.glitch(); w.say('Back to work.', 1400); w.draw(); } w.down = null; }
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    host.addEventListener('click', function () { if (w.dragged) { w.dragged = false; return; } w.glitch(); w.say(def.lines[w.n++ % def.lines.length]); w.set({ mood: ['happy', 'cheeky', 'proud'][w.n % 3] }, 2400); });
    w.draw();
  }
  Worker.prototype.state = function () {
    var s = Object.assign({}, this.base, this.over || {});
    if (this.look && this.lookF && !(this.over && this.over.facing)) s.facing = this.lookF;
    if (this.hover && !this.over) { s.pose = 'wave'; s.mood = 'happy'; }
    if (this.drag) { s.pose = 'stand'; s.mood = 'shock'; }
    return s;
  };
  Worker.prototype.draw = function () {
    var s = this.state(), h = svg(this.def.spec, { mode: 'full', size: 220, pose: s.pose, facing: s.facing, mood: s.mood, title: this.def.job });
    if (h !== this.html) { this.html = h; this.fig.innerHTML = h; }
  };
  /* take over pose / facing / mood for a while (ms), or until set(null) */
  Worker.prototype.set = function (o, ms) { var w = this; clearTimeout(w.ot); w.over = o; w.draw(); if (o && ms) w.ot = setTimeout(function () { w.over = null; w.draw(); }, ms); };
  Worker.prototype.glitch = function () { var e = this.el; if (calm) return; e.classList.remove('is-glitch'); void e.offsetWidth; e.classList.add('is-glitch'); setTimeout(function () { e.classList.remove('is-glitch'); }, 450); };
  Worker.prototype.say = function (text, ms) { var w = this; w.hush(); w.bub = el('span', 'wk-say'); w.bub.textContent = text; w.el.appendChild(w.bub); w.st = setTimeout(function () { w.hush(); }, ms || 2600); };
  Worker.prototype.hush = function () { clearTimeout(this.st); if (this.bub) { this.bub.remove(); this.bub = null; } };
  $$('[data-worker]').forEach(function (h) { var w = new Worker(h); workers[w.id] = w; list.push(w); });
  function everyone(o, ms) { list.forEach(function (w) { w.set(o, ms); }); }

  function lookAll() {
    raf = 0; if (!ptr) return;
    list.forEach(function (w) { if (!w.look) return; var r = w.el.getBoundingClientRect(); if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      var dx = ptr.x - (r.left + r.width / 2), f = Math.abs(dx) < r.width * 0.5 ? 'front' : dx > 0 ? 'right' : 'left'; if (f !== w.lookF) { w.lookF = f; w.draw(); } });
  }
  window.addEventListener('pointermove', function (e) { ptr = { x: e.clientX, y: e.clientY }; if (!raf) raf = requestAnimationFrame(lookAll); }, { passive: true });

  /* the courier walks the strip, carrying a tape from one side to the other */
  (function () {
    var w = workers.courier; if (!w || !w.el.closest('.strip')) return; var lane = w.el.parentNode, x = 0, dir = 1, last = 0;
    w.look = false; w.base.facing = 'right';
    if (calm) { w.el.style.left = '12%'; return; }
    w.el.classList.add('is-walk');
    function step(t) {
      requestAnimationFrame(step); if (!last) last = t; var dt = Math.min(60, t - last); last = t;
      var r = lane.getBoundingClientRect(); if (r.bottom < -300 || r.top > window.innerHeight + 300) return;
      var max = lane.clientWidth - w.el.offsetWidth, moving = !(w.hover || w.drag || w.bub);
      w.el.classList.toggle('is-walk', moving); if (!moving) return;
      x += dir * dt * 0.07; if (x > max) { x = max; dir = -1; w.base.facing = 'left'; w.draw(); } if (x < 0) { x = 0; dir = 1; w.base.facing = 'right'; w.draw(); }
      w.el.style.left = Math.round(x / 3) * 3 + 'px';
    }
    requestAnimationFrame(step);
  })();

  /* ---------- VCR deck ---------- */
  var ICON = { rew: 'M12 3L4 8L12 13ZM20 3L12 8L20 13Z', play: 'M5 2L15 8L5 14Z', pause: 'M4 2H7V14H4ZM10 2H13V14H10Z', ff: 'M2 3L10 8L2 13ZM10 3L18 8L10 13Z' };
  function ic(k, w) { return '<svg viewBox="0 0 ' + (w || 16) + ' 16" aria-hidden="true"><path d="' + ICON[k] + '"/></svg>'; }
  var deck = el('div', 'deck',
    '<button type="button" data-k="rew" aria-label="Rewind to the top">' + ic('rew', 22) + '<span>REW</span></button>' +
    '<button type="button" data-k="play" aria-pressed="false" aria-label="Play: scroll the page for me">' + ic('play') + '<span>PLAY</span></button>' +
    '<button type="button" data-k="ff" aria-label="Fast forward to the next section">' + ic('ff', 20) + '<span>FF</span></button>' +
    '<span class="mode" aria-live="polite">STOP</span>' +
    '<label>Tracking <input type="range" min="0" max="100" value="50" aria-label="Tracking: how rough the tape looks"></label>' +
    '<button type="button" data-k="music" aria-pressed="false" aria-label="Music"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2.5L14 1V11.2A2.3 2.3 0 1 1 12.4 9V4.2L7.6 5.1V12.8A2.3 2.3 0 1 1 6 10.6Z"/></svg><span>MUSIC</span></button>' +
    (window.DuckFlock ? '<button type="button" data-k="feed" aria-label="Feed the ducks"><svg viewBox="0 0 18 16" aria-hidden="true"><path d="M4.5 2H13.5A3.5 3.5 0 0 1 15 8.4V14H3V8.4A3.5 3.5 0 0 1 4.5 2Z"/></svg><span>FEED</span><b data-fed>0</b></button>' : '') +
    '<span class="count" aria-hidden="true">0:00:00</span>');
  deck.setAttribute('role', 'group'); deck.setAttribute('aria-label', 'Tape controls'); body.appendChild(deck);
  var playBtn = $('[data-k="play"]', deck), modeEl = $('.mode', deck), countEl = $('.count', deck), playing = false, pr = 0, py = 0, plast = 0;
  function mode(m) { modeEl.textContent = m; }
  function count() { var max = Math.max(1, root.scrollHeight - window.innerHeight), s = Math.round(window.scrollY / max * 360), f = Math.round(window.scrollY) % 30; countEl.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2) + ':' + ('0' + f).slice(-2); }
  function stop() { if (!playing) return; playing = false; cancelAnimationFrame(pr); playBtn.setAttribute('aria-pressed', 'false'); playBtn.innerHTML = ic('play') + '<span>PLAY</span>'; mode('STOP'); }
  function play() {
    playing = true; py = window.scrollY; plast = 0; playBtn.setAttribute('aria-pressed', 'true'); playBtn.innerHTML = ic('pause') + '<span>PAUSE</span>'; mode('PLAY ▶');
    (function tick(t) { if (!playing) return; if (!plast) plast = t; py += (t - plast) * 0.24; plast = t; window.scrollTo(0, py); if (py >= root.scrollHeight - window.innerHeight - 1) { stop(); return; } pr = requestAnimationFrame(tick); })(performance.now());
  }
  playBtn.addEventListener('click', function () { playing ? stop() : play(); });
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest('.deck')) return; stop(); }, { passive: true }); });
  function rewind() { stop(); mode('◀◀ REW'); flash('is-rew', 320); everyone({ mood: 'shock' }, 900); window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); setTimeout(function () { mode('STOP'); }, 1200); }
  $('[data-k="rew"]', deck).addEventListener('click', rewind);
  $('[data-k="ff"]', deck).addEventListener('click', function () {
    stop(); var secs = $$('main > section, footer.end'), y = window.scrollY + 90, next = secs.filter(function (s) { return s.getBoundingClientRect().top + window.scrollY > y; })[0];
    mode('FF ▶▶'); flash('is-ff', 320); everyone({ mood: 'shock' }, 900);
    window.scrollTo({ top: next ? next.getBoundingClientRect().top + window.scrollY : root.scrollHeight, behavior: calm ? 'auto' : 'smooth' }); setTimeout(function () { mode('STOP'); }, 1200);
  });
  $('input', deck).addEventListener('input', function () { var v = this.value / 100; root.style.setProperty('--trk', v.toFixed(2)); flash('is-jolt', 300); if (v > 0.9 || v < 0.1) list.forEach(function (w) { w.glitch(); }); });
  var musicBtn = $('[data-k="music"]', deck), feedBtn = $('[data-k="feed"]', deck), A = window.DuckAudio;
  if (A) {
    musicBtn.addEventListener('click', function () { A.toggle(); });
    document.addEventListener('duck-music', function (e) { musicBtn.setAttribute('aria-pressed', e.detail.on); if (e.detail.on) list.forEach(function (w, i) { if (i % 2) w.set({ mood: 'happy' }, 1500); }); });
    if (A.wanted()) musicBtn.classList.add('armed');
  } else musicBtn.remove();
  if (feedBtn) { feedBtn.addEventListener('click', function () { var r = feedBtn.getBoundingClientRect(); window.DuckFlock.feed(3, r.left + r.width / 2 + (Math.random() - 0.5) * Math.min(600, window.innerWidth * 0.7)); }); [].forEach.call(document.querySelectorAll('[data-fed]'), function (e) { e.textContent = window.DuckFlock.fed(); }); }
  window.addEventListener('scroll', count, { passive: true }); count();
  $$('[data-rewind]').forEach(function (b) { b.addEventListener('click', function () { rewind(); if (workers.rewinder) workers.rewinder.say('Rewinding. Hold on.', 1600); }); });

  /* ---------- hero: tap the screen, get a quack ---------- */
  (function () {
    var hero = $('.hero'); if (!hero) return; var n = 0, osd = $('.osd.tr', hero), words = ['QUACK', 'QUACK!', 'SPLASH', 'QUACK?'];
    hero.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return; var r = hero.getBoundingClientRect(), q = el('span', 'quack'); n++;
      q.textContent = words[n % words.length]; q.style.left = (e.clientX - r.left) + 'px'; q.style.top = (e.clientY - r.top) + 'px'; q.style.setProperty('--r', (Math.random() * 24 - 12).toFixed(1) + 'deg');
      hero.appendChild(q); setTimeout(function () { q.remove(); }, calm ? 500 : 820);
      if (osd) osd.innerHTML = 'SP<br>QUACK ' + ('0' + n).slice(-2);
      if (workers.operator) { workers.operator.set({ mood: n % 5 === 0 ? 'shock' : 'happy', pose: 'point' }, 1200); if (n === 5) workers.operator.say('That is five. The duck is fine.', 2200); }
    });
  })();

  /* ---------- shelf: pick a tape, the TV changes channel ---------- */
  (function () {
    var tv = $('.tv'), tapes = $$('.tape'); if (!tv || !tapes.length) return; var clerk = workers.clerk;
    function show(t, quiet) {
      tapes.forEach(function (x) { x.setAttribute('aria-pressed', x === t ? 'true' : 'false'); });
      var tpl = document.getElementById('ch-' + t.getAttribute('data-tape'));
      function swap() { tv.classList.remove('is-static'); tv.innerHTML = tpl.innerHTML; tv.setAttribute('data-osd', t.getAttribute('data-osd')); }
      if (quiet || calm) swap(); else { tv.classList.add('is-static'); setTimeout(swap, 220); }
      if (!quiet) tv.classList.add('is-picked');   /* a picked tape always shows the finished TV, even mid-scroll */
      if (clerk && !quiet) { clerk.glitch(); clerk.say(t.getAttribute('data-say'), 2200); }
    }
    tapes.forEach(function (t) {
      function point() { if (!clerk) return; var a = t.getBoundingClientRect(), b = clerk.el.getBoundingClientRect(); clerk.set({ pose: 'point', facing: a.left > b.left ? 'right' : 'left', mood: 'happy' }); }
      t.addEventListener('pointerenter', point); t.addEventListener('focus', point);
      t.addEventListener('pointerleave', function () { if (clerk) clerk.set(null); }); t.addEventListener('blur', function () { if (clerk) clerk.set(null); });
      t.addEventListener('click', function () { show(t); });
    });
    show(tapes[0], true);
  })();

  /* ---------- Polygraph needle: jumps while the pointer moves, settles to two still lines ---------- */
  $$('[data-needle]').forEach(function (box) {
    var W = 600, H = 200, pen = $('.pen', box), ink = $('.ink', box), read = $('.read b', box), amp = calm ? 0 : 30, t = 0, on = false, lx = null, ly = null, settled = null;
    function line(y0, ph) {
      var d = '', a = Math.max(amp, 3);
      for (var x = 30; x <= W - 30; x += 6) { var u = (x - 30) / (W - 60), env = Math.exp(-u * (amp > 3 ? 2.6 : 5.2)), y = y0 + a * 1.25 * Math.sin(u * 13 - t * 0.16 + ph) * env; d += (d ? 'L' : 'M') + x + ' ' + y.toFixed(1); }
      return d;
    }
    function paint() {
      pen.setAttribute('d', line(72, 0)); ink.setAttribute('d', line(132, 0.5));
      var s = amp <= 3; if (s !== settled) { settled = s; read.textContent = s ? '= settled' : '≈ reading'; var w = workers.inspector; if (w) w.set(s ? { mood: 'happy', pose: 'arms' } : { mood: 'think', pose: 'phone' }, s ? 1800 : 0); }
    }
    function tick() { if (!on) return; t++; amp *= 0.955; paint(); if (amp > 3) requestAnimationFrame(tick); else { amp = 0; on = false; paint(); } }
    function kick(v) { if (calm) return; amp = Math.min(46, amp + v); if (!on) { on = true; requestAnimationFrame(tick); } }
    box.addEventListener('pointermove', function (e) { if (lx != null) kick(Math.min(9, (Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly)) * 0.22)); lx = e.clientX; ly = e.clientY; });
    box.addEventListener('pointerleave', function () { lx = null; });
    box.addEventListener('click', function () { kick(40); });
    box._kick = kick; paint();
    if (!calm && 'IntersectionObserver' in window) new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { kick(30); ob.disconnect(); } }, { threshold: 0.5 }).observe(box);
  });

  /* fast scrolling rattles everyone */
  var sy = window.scrollY, st = 0;
  window.addEventListener('scroll', function () { var now = performance.now(), v = Math.abs(window.scrollY - sy) / Math.max(1, now - st); sy = window.scrollY; st = now; if (v > 9 && !playing) { flash('is-jolt', 300); } }, { passive: true });

  window.DuckSite = { workers: workers, list: list, everyone: everyone, burst: staticBurst, flash: flash, calm: calm };
})();
