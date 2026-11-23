/* Counts clicks on links that leave the site, so the GoatCounter dashboard shows
   which store people head for. Nothing is stored in the browser: each click is one
   event sent through count.js, GoatCounter's own script, served from this site.
   Event names: click/gumroad/polygraph, click/superhive/polygraph,
   click/extensions/polygraph, click/press-kit/<file>, click/mail/support,
   and click/out/<site> for everything else. */
(function () {
  'use strict';

  function name(a) {
    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return null; }
    if (u.protocol === 'mailto:') return 'mail/' + u.pathname.split('@')[0];
    if (!/^https?:$/.test(u.protocol) || u.host === location.host) return null;
    var host = u.host.replace(/^www\./, '');
    var p = u.pathname.split('/').filter(Boolean);
    if (host === 'waddlebyduck.gumroad.com') return 'gumroad/' + (p[0] === 'l' && p[1] ? p[1] : 'shop');
    if (host === 'superhivemarket.com') return 'superhive/' + (p[0] === 'products' && p[1] ? p[1] : 'shop');
    if (host === 'extensions.blender.org') return 'extensions/' + (p[1] || 'home');
    if (host === 'github.com' && p[2] === 'releases') return 'press-kit/' + p[p.length - 1];
    return 'out/' + host;
  }

  function onClick(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    var gc = window.goatcounter;
    if (!a || !gc || !gc.count) return;
    var n = name(a);
    if (!n) return;
    var text = (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim();
    gc.count({ path: 'click/' + n, title: text.slice(0, 80) || n, event: true });
  }

  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);
})();
