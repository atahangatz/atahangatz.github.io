/* Duck Initiative — scroll story engine. Sets --p (0..1) on each [data-scene] as it is scrolled through,
   --v / --vd (scroll speed, unsigned / signed) and --tp (whole-page progress) on <html>,
   and runs the per-scene hooks below. Phones, short windows and reduced motion get the finished state. */
(function () {
  var root = document.documentElement, S = window.DuckSite || { workers: {} };
  var scenes = [].slice.call(document.querySelectorAll('[data-scene]'));
  var mq = window.matchMedia('(max-width: 760px), (max-height: 560px), (prefers-reduced-motion: reduce)');
  var off = false, ly = window.scrollY, lt = performance.now(), v = 0, dir = 1, raf = 0, draf = 0, cur = -1;
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function mk(cls, html) { var e = document.createElement('div'); e.className = cls; e.setAttribute('aria-hidden', 'true'); e.innerHTML = html || ''; document.body.appendChild(e); return e; }
  mk('tape-bar', ['#ECEBF5', '#FFE600', '#19E3FF', '#2BF0A0', '#FF2E93', '#E63F0A', '#2B3BFF'].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join(''));
  mk('tear');
  var osdL = mk('osd-fix', 'PAUSE ❚❚'), osdR = mk('osd-fix r', '');

  var W = S.workers, courier = W.courier, needle = document.querySelector('#polygraph [data-needle]'), meter = document.querySelector('#polygraph .meter'), inserted = false;
  if (courier) courier.look = false;
  var hooks = {
    's-run': function (p) {
      if (!courier) return; var lane = courier.el.parentNode, max = lane.clientWidth - courier.el.offsetWidth;
      courier.el.style.left = (off ? max * 0.08 : Math.round(p * max)) + 'px';
    }
  };

  function update() {
    raf = 0; var H = window.innerHeight, now = -1;
    scenes.forEach(function (s, i) {
      var r = s.getBoundingClientRect(), p = off ? 1 : clamp(-r.top / Math.max(1, r.height - H));
      s.style.setProperty('--p', p.toFixed(4)); if (r.top <= H * 0.5 && r.bottom > H * 0.5) now = i; if (hooks[s.id]) hooks[s.id](p, s);
    });
    root.style.setProperty('--tp', clamp(window.scrollY / Math.max(1, root.scrollHeight - H)).toFixed(4));
    if (now !== cur) { cur = now; document.body.classList.toggle('past-intro', now > 1 || (now < 0 && window.scrollY > H)); document.body.classList.toggle('rail-min', now > 0 || (now < 0 && window.scrollY > H)); osdR.innerHTML = now < 0 ? 'END OF TAPE' : 'SC ' + ('0' + (now + 1)).slice(-2) + ' / ' + ('0' + scenes.length).slice(-2) + '<br>' + scenes[now].getAttribute('data-scene'); }
  }
  function mode() {
    var t = v > 0.45 ? (dir > 0 ? 'FF ▶▶' : '◀◀ REW') : v > 0.015 ? (dir > 0 ? 'PLAY ▶' : '◀ REVIEW') : 'PAUSE ❚❚';
    if (osdL.textContent !== t) osdL.textContent = t;
  }
  function decay() {
    draf = 0; v *= 0.88; if (v < 0.004) v = 0;
    root.style.setProperty('--v', off ? 0 : v.toFixed(3)); root.style.setProperty('--vd', off ? 0 : (v * dir).toFixed(3)); mode();
    if (courier) { var moving = v > 0.015 && !off; courier.el.classList.toggle('is-walk', moving); var f = dir > 0 ? 'right' : 'left'; if (courier.base.facing !== f) { courier.base.facing = f; courier.el.classList.toggle('faces-left', f === 'left'); courier.draw(); } }
    /* the needle: scrolling is the disturbance, stopping is the truth */
    if (needle && needle._kick && cur >= 0 && scenes[cur].id === 'polygraph') { if (v > 0.03) needle._kick(v * 7); if (meter) meter.textContent = v > 0.03 ? '≈ you are moving. The needle knows.' : '= you stopped. It settles.'; }
    if (v > 0) draf = requestAnimationFrame(decay);
  }
  window.addEventListener('scroll', function () {
    var y = window.scrollY, t = performance.now(), dt = Math.max(8, t - lt), d = y - ly; ly = y; lt = t;
    if (d) { dir = d > 0 ? 1 : -1; v = Math.max(v, clamp(Math.abs(d) / dt / 5)); }
    if (!raf) raf = requestAnimationFrame(update); if (!draf) draf = requestAnimationFrame(decay);
  }, { passive: true });
  window.addEventListener('resize', function () { if (!raf) raf = requestAnimationFrame(update); });
  function setOff() { off = mq.matches; root.classList.toggle('story-off', off); update(); }
  if (mq.addEventListener) mq.addEventListener('change', setOff); else if (mq.addListener) mq.addListener(setOff);
  setOff(); mode();
})();
