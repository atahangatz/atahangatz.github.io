/* Duck Initiative — the easter egg: Tape 00.
   Feed the ducks and, every so often, one of them stops eating, turns to the visitor and says something
   it should not. The page reacts each time: the picture dims, the ducks freeze and watch, the music sags.
   Everything they have said so far is kept under the DUCK TALK button on the tape deck, for anyone who
   missed a line. The seventh line brings up Tape 00: a link to the hidden page pond.html.
   The bread count and what has been said start over each time the site is reopened; only having
   solved it (the gold mother duck, and access to pond.html) is remembered. To change the story, edit SAID below: "at" is the bread count,
   "who" is 'small' (the last duckling) or 'mother', "fx" picks an extra effect. */
(function () {
  if (typeof document === 'undefined' || !window.DuckFlock) return;
  var SAID = [
    { at: 3,  who: 'small',  text: 'Don\'t look at the big screen. Just keep feeding us. Please.' },
    { at: 8,  who: 'small',  text: 'There were five tapes. Count the shelf. We count it every night, to be sure it is still four.' },
    { at: 15, who: 'mother', text: 'Tape 00 has no label and no end. It was already recording when they found it.' },
    { at: 24, who: 'small',  text: 'It is in the pond. We put it there. It would not stop.' },
    { at: 34, who: 'mother', text: 'The one on the logo did not dive. It looked down. That is all it did. It only looked.' },
    { at: 46, who: 'small',  text: 'It is still recording. See the counter, down in the corner? That was never counting your scrolling.', fx: 'counter' },
    { at: 60, who: 'mother', text: 'It knows you have been feeding us. We will bring it up. Take it. And do not, ever, rewind it.', fx: 'end' }
  ];
  var KEY = 'duck.case', T0 = 'duck.case.t0', root = document.documentElement, F = window.DuckFlock, shown = 0, bub = null, panel = null, btn = null, timers = [];
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Solved if it was ever marked so, or if all seven lines have been heard this visit. Checking the bread count
     as well matters when the site is opened straight from disk: some browsers (Safari, Firefox) then give every
     page its own private storage, so a mark made on one page is invisible on the next. */
  function mark() { try { localStorage.setItem(KEY, '1'); } catch (e) {} try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }
  function solved() { try { if (localStorage.getItem(KEY) === '1' || sessionStorage.getItem(KEY) === '1') return true; } catch (e) {} return F.fed() >= SAID[SAID.length - 1].at; }
  function heard(n) { var c = 0; SAID.forEach(function (q) { if (n >= q.at) c++; }); return c; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function name(q) { return q.who === 'mother' ? 'THE MOTHER DUCK' : 'THE SMALLEST ONE'; }
  if (solved()) { root.classList.add('case-solved'); mark(); }
  var veil = el('div', 'dread-veil'); veil.setAttribute('aria-hidden', 'true'); document.body.appendChild(veil);

  /* ---------- DUCK TALK: everything said so far ---------- */
  function drawPanel() {
    if (!panel) return; var got = heard(F.fed()), next = SAID[got], h = '';
    SAID.forEach(function (q, i) { h += i < got ? '<li><b>' + name(q) + '</b>“' + q.text + '”</li>' : '<li class="lock"><b>NOT YET</b>They have not said this yet.</li>'; });
    panel.innerHTML = '<div class="case-h"><b>DUCK TALK</b><span>What they said, in case you missed it</span><button type="button" class="x" aria-label="Close duck talk">✕</button></div><ol>' + h + '</ol>' +
      (got === SAID.length ? '<a class="case-go" href="pond.html#recovered">▶ Play Tape 00</a>' : '<p class="case-n">' + got + ' of ' + SAID.length + '. ' + (next ? 'They go quiet again until ' + next.at + ' crumbs.' : '') + '</p>');
    panel.querySelector('.x').addEventListener('click', function () { toggle(false); });
  }
  function toggle(o) {
    if (!panel) { panel = el('section', 'case'); panel.setAttribute('aria-label', 'Duck talk: what the ducks have said'); panel.hidden = true; document.body.appendChild(panel); }
    panel.hidden = o === undefined ? !panel.hidden : !o; if (!panel.hidden) drawPanel(); if (btn) btn.setAttribute('aria-expanded', !panel.hidden);
  }
  function drawBtn() {
    var got = heard(F.fed()); if (!got) return;
    if (!btn) {
      var feed = document.querySelector('.deck [data-k="feed"]'); if (!feed) return;
      btn = el('button', 'case-btn'); btn.type = 'button'; btn.setAttribute('aria-expanded', 'false'); btn.addEventListener('click', function () { toggle(); });
      feed.parentNode.insertBefore(btn, feed.nextSibling);
    }
    btn.innerHTML = '<span>DUCK TALK</span><b>' + got + '/' + SAID.length + '</b>'; btn.setAttribute('aria-label', 'Duck talk: ' + got + ' of ' + SAID.length + ' things the ducks have said');
  }

  /* ---------- a duck speaks ---------- */
  function hush() { timers.forEach(clearTimeout); timers = []; if (bub) { bub.remove(); bub = null; } root.classList.remove('dread'); F.ducks.forEach(function (d) { d.el.classList.remove('stare'); }); }
  function speak(i) {
    hush(); var q = SAID[i], last = q.fx === 'end', d = q.who === 'mother' ? F.ducks[0] : F.ducks[F.ducks.length - 1], hold = calm ? 9000 : Math.min(15000, 4200 + q.text.length * 75);
    try { if (!sessionStorage.getItem(T0)) sessionStorage.setItem(T0, Date.now()); } catch (e) {}
    /* the room changes: everyone stops and looks out of the screen, the picture dims, the tape sags */
    if (F.hold) F.hold(hold); F.ducks.forEach(function (o) { o.el.classList.add('stare'); }); root.classList.add('dread');
    if (window.DuckAudio && window.DuckAudio.dread) window.DuckAudio.dread(hold / 1000);
    var r = d.el.getBoundingClientRect(), W = window.innerWidth, w = Math.min(380, W - 28), left = Math.max(14, Math.min(W - w - 14, r.left + r.width / 2 - w / 2));
    bub = el('div', 'whisper', '<b>' + name(q) + '</b><p></p>' + (last ? '<a class="case-go" href="pond.html#recovered" hidden>▶ Play Tape 00</a>' : '') + '<button type="button" class="x" aria-label="Dismiss">✕</button>');
    bub.setAttribute('role', 'status'); bub.style.left = left + 'px'; bub.style.width = w + 'px'; bub.style.bottom = (window.innerHeight - r.top + 16) + 'px';
    bub.style.setProperty('--tail', Math.max(18, Math.min(w - 18, r.left + r.width / 2 - left)) + 'px'); document.body.appendChild(bub);
    var p = bub.querySelector('p'), go = bub.querySelector('.case-go'), n = 0;
    bub.querySelector('.x').addEventListener('click', hush);
    function done() { if (go) go.hidden = false; }
    if (calm) { p.textContent = '“' + q.text + '”'; done(); }
    else (function type() { n++; p.textContent = '“' + q.text.slice(0, n) + (n < q.text.length ? '' : '”'); if (n < q.text.length) timers.push(setTimeout(type, q.text.charAt(n - 1) === '.' ? 380 : 42)); else done(); })();
    if (q.fx === 'counter') counter(hold);
    if (last) {
      mark();
      timers.push(setTimeout(function () { F.ducks.forEach(function (o, k) { setTimeout(function () { F.dive(o); }, 150 * k); }); }, hold - 1800));
      timers.push(setTimeout(function () { root.classList.remove('dread'); root.classList.add('case-solved'); F.ducks.forEach(function (o) { o.el.classList.remove('stare'); }); }, hold));
    } else timers.push(setTimeout(hush, hold));
    drawBtn(); drawPanel();
  }
  /* the tape counter stops following the page and shows how long "it" has been recording */
  function counter(ms) {
    var c = document.querySelector('.deck .count'); if (!c) return; var t0 = Date.now(); try { t0 = +sessionStorage.getItem(T0) || t0; } catch (e) {}
    var iv = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); c.textContent = '●' + Math.floor(s / 3600) + ':' + ('0' + Math.floor(s / 60) % 60).slice(-2) + ':' + ('0' + s % 60).slice(-2); }, 90);
    c.classList.add('rec'); timers.push(setTimeout(function () { clearInterval(iv); c.classList.remove('rec'); window.dispatchEvent(new Event('scroll')); }, ms));
  }

  shown = heard(F.fed());
  document.addEventListener('duck-fed', function (e) { var got = heard(e.detail.fed); if (got > shown) { shown = got; speak(got - 1); } });
  document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; if (bub) hush(); else if (panel && !panel.hidden) toggle(false); });
  window.addEventListener('load', drawBtn); drawBtn();
})();
