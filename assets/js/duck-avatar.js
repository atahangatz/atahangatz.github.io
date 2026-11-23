/*! Duck Avatar engine — "Tape Block" (v1), Duck Initiative.
 * Forked from the SiteCall "Site Block" engine (v35): same geometry, poses and spec format,
 * re-inked and re-coloured for a VHS look, with tape effects in the SVG renderer.
 * One file, no dependencies. Browser: window.DuckAvatar. Node: require().
 * DuckAvatar.renderSVG(spec, options) -> a finished <svg> string
 * DuckAvatar.build(spec, mode, mood, ground, pose, facing) -> layered path data
 * DuckAvatar.OPTIONS / TABS / STATUS / PALETTE
 */
/* ---- THE PALETTE: the one place to retune colours (e.g. to match the logo). [id, label, hex] ---- */
var DUCK_PALETTE = {
  /* VHS signal colours, used by effects, badges and backgrounds */
  vhs: { tape: '#0A052E', ink: '#0A052E', cream: '#ECEBF5', yellow: '#FFE600', cyan: '#19E3FF', green: '#2BF0A0', magenta: '#FF2E93', red: '#E63F0A', blue: '#2B3BFF', purple: '#8B3DFF', orange: '#E63F0A' },
  skin: [['s1', 'Porcelain', '#FFE1D2'], ['s2', 'Peach', '#FBC7AC'], ['s3', 'Warm', '#F0A982'], ['s4', 'Golden', '#DB8A5C'], ['s5', 'Tan', '#BC6B42'], ['s6', 'Brown', '#944F31'], ['s7', 'Deep', '#6C3823'], ['s8', 'Ebony', '#48251A']],
  hair: [['black', 'Black', '#16141B'], ['dark', 'Dark brown', '#3D2519'], ['brown', 'Brown', '#7D4523'], ['auburn', 'Auburn', '#B5361C'], ['ginger', 'Ginger', '#FF8A1F'], ['red', 'Red', '#FF3B30'], ['blonde', 'Blonde', '#FFD95A'], ['grey', 'Grey', '#B5B1BC'], ['white', 'White', '#ECEBF5'], ['teal', 'Teal', '#12C9B5'], ['blue', 'Blue', '#2B3BFF'], ['pink', 'Pink', '#FF2E93'], ['purple', 'Purple', '#8B3DFF'], ['signal', 'Duck yellow', '#FFE600'], ['cyan', 'Cyan', '#19E3FF'], ['green', 'Slime', '#2BF0A0']],
  top: [['navy', 'Video blue', '#2B3BFF'], ['charcoal', 'Tape black', '#1D1933'], ['denim', 'Denim', '#3D8BFF'], ['olive', 'Lime', '#B6E01E'], ['forest', 'Mint', '#12C98A'], ['rust', 'Orange', '#FF5A1F'], ['red', 'Red', '#FF2E5C'], ['sky', 'Cyan', '#19D3FF'], ['teal', 'Teal', '#0FB5B5'], ['purple', 'Purple', '#8B3DFF'], ['sand', 'Duck yellow', '#FFE600'], ['white', 'Cream', '#ECEBF5'], ['magenta', 'Magenta', '#FF2E93']],
  hat: [['white', 'Cream', '#ECEBF5'], ['yellow', 'Duck yellow', '#FFE600'], ['orange', 'Orange', '#FF7A1A'], ['blue', 'Video blue', '#2B3BFF'], ['green', 'Mint', '#16D988'], ['red', 'Red', '#FF2E5C'], ['black', 'Tape black', '#1D1933'], ['gold', 'Gold', '#F2B824'], ['navy', 'Navy', '#2430B8'], ['pink', 'Magenta', '#FF2E93'], ['purple', 'Purple', '#8B3DFF'], ['cyan', 'Cyan', '#19E3FF']],
  eye: [['ink', 'Dark', '#1B1A20'], ['brown', 'Brown', '#5A341C'], ['hazel', 'Hazel', '#76592A'], ['green', 'Green', '#1F8F5F'], ['blue', 'Blue', '#2B5BE0'], ['grey', 'Grey', '#5D697D']],
  pants: [['work', 'Tape grey', '#2E2A47'], ['navy', 'Navy', '#2430B8'], ['khaki', 'Mustard', '#F2B824'], ['denim', 'Denim', '#3D7BFF'], ['black', 'Black', '#17142A'], ['olive', 'Lime', '#8FCC1F'], ['purple', 'Purple', '#6A2BD9'], ['pink', 'Magenta', '#FF2E93'], ['cream', 'Cream', '#ECEBF5']],
  shoe: [['tan', 'Tan', '#C97A2B'], ['brown', 'Brown', '#5E3A1F'], ['black', 'Black', '#1D1933'], ['grey', 'Grey', '#7A7C93'], ['olive', 'Lime', '#8FCC1F'], ['sand', 'Cream', '#ECEBF5'], ['signal', 'Duck yellow', '#FFE600'], ['pink', 'Magenta', '#FF2E93'], ['cyan', 'Cyan', '#19E3FF'], ['red', 'Red', '#FF2E5C']],
  wrap: [['navy', 'Navy', '#2430B8'], ['black', 'Black', '#1D1933'], ['rust', 'Orange', '#FF5A1F'], ['olive', 'Lime', '#B6E01E'], ['sand', 'Duck yellow', '#FFE600'], ['teal', 'Teal', '#12C9B5'], ['plum', 'Plum', '#A12A8C'], ['forest', 'Mint', '#12C98A'], ['white', 'Cream', '#ECEBF5'], ['red', 'Red', '#FF2E5C'], ['purple', 'Purple', '#8B3DFF'], ['pink', 'Magenta', '#FF2E93']],
  /* plate backgrounds: [id, label, base colour]; the graphic on top is drawn by the engine */
  bg: [['bars', 'Colour bars', '#ECEBF5'], ['bluescreen', 'Blue screen', '#2B3BFF'], ['static', 'Static', '#1D1933'], ['tracking', 'Tracking', '#FF2E93'], ['concrete', 'Cream dots', '#ECEBF5'], ['steel', 'Cyan rings', '#19D3FF'], ['sand', 'Sunset', '#FFE600'], ['olive', 'Lime stripes', '#B6E01E'], ['signal', 'Orange burst', '#FF5A1F'], ['hazard', 'Hazard', '#FFE600'], ['blueprint', 'Grid', '#2B3BFF'], ['ink', 'Tape black', '#17142A'], ['mint', 'Mint', '#3DF0B4'], ['pink', 'Pink halftone', '#FF8AC8'], ['dusk', 'Magenta dusk', '#FF4FA3'], ['night', 'Night', '#1A1147'], ['drafting', 'Paper', '#ECEBF5']]
};
var SCA = (function () {
  var P = DUCK_PALETTE, V = P.vhs;
  var INK = V.ink, RIM = V.cyan, INKTF = 'translate(1.3 1.6)', SOFT = '#3E3850';
  function LC(c) { return mix(c, V.ink, luma(c) > 0.75 ? 0.7 : 0.76); }
  var LW = 2.6;
  function hx(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b), o = '#'; for (var i = 0; i < 3; i++) { var v = Math.round(x[i] + (y[i] - x[i]) * t); o += (v < 16 ? '0' : '') + v.toString(16); } return o; }
  function luma(c) { var x = hx(c); return (0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]) / 255; }
  function shadeOf(c) { return mix(c, '#4A14B8', 0.3); }
  function skinShade(c) { var l = luma(c), k = Math.max(0, Math.min(1, (l - 0.3) / 0.4)); return mix(c, mix('#2A1420', '#D0305E', k), 0.2 + 0.1 * (1 - k)); }
  function noseInk(skin, ss) { return mix(ss, INK, Math.max(0, Math.min(0.62, (0.62 - luma(skin)) * 1.5))); }
  function f1(v) { return Math.round(v * 10) / 10; }
  function E(cx, cy, rx, ry) { return 'M' + f1(cx - rx) + ' ' + f1(cy) + 'A' + rx + ' ' + ry + ' 0 1 0 ' + f1(cx + rx) + ' ' + f1(cy) + 'A' + rx + ' ' + ry + ' 0 1 0 ' + f1(cx - rx) + ' ' + f1(cy) + 'Z'; }
  function RR(x, y, w, h, r) { return 'M' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w) + ' ' + (y + r) + 'V' + (y + h - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w - r) + ' ' + (y + h) + 'H' + (x + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + x + ' ' + (y + h - r) + 'V' + (y + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' ' + y + 'Z'; }
  function CH(x, y, w, h, c) { return 'M' + f1(x + c) + ' ' + f1(y) + 'H' + f1(x + w - c) + 'L' + f1(x + w) + ' ' + f1(y + c) + 'V' + f1(y + h - c) + 'L' + f1(x + w - c) + ' ' + f1(y + h) + 'H' + f1(x + c) + 'L' + f1(x) + ' ' + f1(y + h - c) + 'V' + f1(y + c) + 'Z'; }
  /* path tools: M mirrors across x=100, SH moves */
  function walk(d, fx, fy, arc) {
    var out = '', re = /([MLCQSHVAZT])([^MLCQSHVAZT]*)/g, m;
    while ((m = re.exec(d))) {
      var c = m[1], n = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
      if (c === 'H') n = n.map(fx); else if (c === 'V') n = n.map(fy);
      else if (c === 'A') { for (var i = 0; i < n.length; i += 7) { if (arc) n[i + 4] = n[i + 4] ? 0 : 1; n[i + 5] = fx(n[i + 5]); n[i + 6] = fy(n[i + 6]); } }
      else if (c !== 'Z') { for (var j = 0; j < n.length; j += 2) { n[j] = fx(n[j]); n[j + 1] = fy(n[j + 1]); } }
      out += c + n.join(' ');
    }
    return out;
  }
  /* map every point of an absolute path through f([x, y]) -> [x, y] (H/V become L so the warp can bend them) */
  function warpD(d, f) {
    var out = '', re = /([MLCQSHVAZT])([^MLCQSHVAZT]*)/g, m, cx = 0, cy = 0, sx = 0, sy = 0;
    var P = function (x, y) { var q = f([x, y]); return f1(q[0]) + ' ' + f1(q[1]); };
    while ((m = re.exec(d))) {
      var c = m[1], n = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [], i;
      if (c === 'Z') { out += 'Z'; cx = sx; cy = sy; continue; }
      if (c === 'H') { for (i = 0; i < n.length; i++) { cx = n[i]; out += 'L' + P(cx, cy); } continue; }
      if (c === 'V') { for (i = 0; i < n.length; i++) { cy = n[i]; out += 'L' + P(cx, cy); } continue; }
      if (c === 'A') { for (i = 0; i < n.length; i += 7) { cx = n[i + 5]; cy = n[i + 6]; out += 'A' + n.slice(i, i + 5).join(' ') + ' ' + P(cx, cy); } continue; }
      var pts = []; for (i = 0; i + 1 < n.length; i += 2) pts.push(P(n[i], n[i + 1]));
      if (n.length >= 2) { cx = n[n.length - 2]; cy = n[n.length - 1]; }
      if (c === 'M') { sx = n[0]; sy = n[1]; }
      out += c + pts.join(' ');
    }
    return out;
  }
  /* hair is drawn round the standard (square) head; on any other head each height is opened out so the
     standard head's edge lands on THIS head's edge (never narrower than the crown fit), and below the jaw the
     curtains carry straight on. So cheekbones, temples and jaws never poke out past the hair. */
  function halfAt(P, y) {
    var m = 0;
    for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) m = Math.max(m, Math.abs(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) - 100)); }
    return m;
  }
  var SQHALF = null;
  function hairFit(head) {
    if ('_fit' in head) return head._fit;
    if (!SQHALF) { var S = sampleD(HEAD.square.d); SQHALF = []; for (var y0 = 40; y0 <= 112; y0 += 2) SQHALF.push(halfAt(S, y0)); }
    var P = sampleD(head.d), s0 = head.hw / 61, tab = [], y, k;
    for (y = 40, k = 0; y <= 112; y += 2, k++) { var fh = halfAt(P, y) + 0.6, sh = SQHALF[k]; tab.push(sh > 30 ? Math.max(1, Math.min(1.4, fh / sh / s0)) : 1); }
    for (k = 1; k < tab.length; k++) tab[k] = Math.max(tab[k], tab[k - 1] - 0.02);   /* only eases back in slowly: no pinch */
    var sm = tab.map(function (v, i) { return (tab[Math.max(0, i - 1)] + 2 * v + tab[Math.min(tab.length - 1, i + 1)]) / 4; });
    var any = sm.some(function (v) { return v > 1.005; });
    return head._fit = !any ? null : function (yy) {
      var f = Math.max(0, Math.min(sm.length - 1, (yy - 40) / 2)), a = Math.floor(f), t = f - a, v = sm[a] * (1 - t) + sm[Math.min(sm.length - 1, a + 1)] * t;
      return 1 + (v - 1) * smooth01(38, 50, yy);
    };
  }
  function widenHair(hs, fit) {
    var f = function (p) { var k = fit(p[1]); return [100 + (p[0] - 100) * k, p[1]]; };
    var w = function (d) { return d ? warpD(d, f) : d; }, o = Object.assign({}, hs);
    ['front', 'back', 'fade', 'bdet', 'bfill'].forEach(function (k) { if (typeof o[k] === 'string') o[k] = w(o[k]); });
    if (o.det) o.det = o.det.map(function (q) { return [q[0], w(q[1])]; });
    return o;
  }
  function M(d) { return walk(d, function (v) { return f1(200 - v); }, function (v) { return v; }, true); }
  function SH(d, dx, dy) { return walk(d, function (v) { return f1(v + dx); }, function (v) { return f1(v + dy); }, false); }
  function both(d) { return d + M(d); }
  function bboxD(d) {
    var xs = [], ys = [];
    walk(d, function (v) { xs.push(v); return v; }, function (v) { ys.push(v); return v; }, false);
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return [x0, y0, x1 - x0, y1 - y0];
  }
  function mb(b) { return [200 - b[0] - b[2], b[1], b[2], b[3]]; }

  /* ---------- palettes ---------- */
  var SKIN = P.skin;
  var HAIRC = P.hair;
  var TOPC = P.top;
  var HATC = P.hat;
  var EYEC = P.eye;
  var PANTS = P.pants;
  var SHOEC = P.shoe;
  var WRAPC = P.wrap;
  var BGC = {}; P.bg.forEach(function (b) { BGC[b[0]] = b[2]; });
  function col(list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i][2]; return list[0][2]; }
  var DEFAULTS = { skin: 's3', face: 'square', eyes: 'sharp', eyeColor: 'ink', brows: 'soft', mouth: 'smile', hair: 'crop', hairColor: 'dark', beard: 'none', glasses: 'none', hat: 'none', hatColor: 'yellow', sticker: 'none', top: 'hoodie', topColor: 'purple', pants: 'black', pantsStyle: 'jeans', shoes: 'sneaker', shoeColor: 'sand', acc: 'none', bg: 'bars', age: 'none', marks: 'none', earwear: 'none', badge: 'none', pose: 'stand', turn: 'front', wrapColor: 'navy', mous: 'auto' };
  var FACE_ALIAS = { oval: 'long' };
  function fill(spec) {
    var o = {}, k; spec = spec || {};
    for (k in DEFAULTS) o[k] = spec[k] != null ? spec[k] : DEFAULTS[k];
    if (FACE_ALIAS[o.face]) o.face = FACE_ALIAS[o.face];
    if (o.beard === 'long') o.beard = 'full';
    /* retired styles keep a close look: a chinstrap becomes the short beard, mutton chops a classic moustache */
    if (o.beard === 'chin') o.beard = 'boxed';
    if (o.beard === 'mutton') { o.beard = 'none'; if (o.mous === 'auto') o.mous = 'classic'; }
    /* the moustache used to be a beard option: old specs keep their look */
    if (o.beard === 'mous' || o.beard === 'handlebar') { if (o.mous === 'auto') o.mous = o.beard === 'mous' ? 'classic' : 'handlebar'; o.beard = 'none'; }
    if (o.mous === 'auto') o.mous = BEARD_MOUS[o.beard] ? 'classic' : 'none';
    if (!HEAD[o.face]) o.face = 'square';
    if (o.hat === 'hijab') { o.hair = 'hijab'; o.wrapColor = spec.wrapColor || spec.hatColor || 'navy'; o.hat = 'none'; }
    return o;
  }

  /* ---------- builder ---------- */
  function Bld(w) { this.p = []; this.w = w || 3; }
  Bld.prototype.raw = function (d, fill, o) { o = o || {}; this.p.push({ d: d, fill: fill || 'none', stroke: o.stroke || 'none', sw: o.sw || 0, tf: o.tf || '', op: o.op == null ? 1 : o.op, fr: o.fr || 'nonzero' }); return this; };
  Bld.prototype.line = function (d, w, c) { return this.raw(d, 'none', { stroke: c || INK, sw: w || 2.4 }); };
  /* flat shade on the lower right: the lit colour is the shape scaled toward its upper-left */
  Bld.prototype.vol = function (d, c, b, o) {
    o = o || {};
    var k = o.k == null ? 6 : o.k;
    if (b && k > 0) {
      var ax = b[0] + b[2] * 0.12, ay = b[1] + b[3] * 0.1, s = Math.max(0.6, 1 - k / (b[2] * 0.88));
      this.raw(d, o.sc || shadeOf(c), { fr: o.fr });
      this.raw(d, c, { tf: 'translate(' + f1(ax) + ' ' + f1(ay) + ') scale(' + s.toFixed(3) + ') translate(' + f1(-ax) + ' ' + f1(-ay) + ')', fr: o.fr });
    } else this.raw(d, c, { fr: o.fr });
    if (o.line !== false) this.raw(d, 'none', { stroke: LC(c), sw: Math.min(o.w || this.w, LW), fr: o.fr });
    return this;
  };
  /* side light: lit plane, a shade plane down the right side and a thin cool rim on the far right edge.
     Each plane is the same shape squeezed toward its left edge, so it can never leave the outline. */
  Bld.prototype.side = function (d, c, b, o) {
    o = o || {};
    var L = b[0], w = b[2], sh = o.sh == null ? 0.17 : o.sh, rim = o.rim == null ? 2.6 : o.rim;
    function sq(px) { var s = Math.max(0.5, 1 - px / w); return 'translate(' + f1(L) + ' 0) scale(' + s.toFixed(4) + ' 1) translate(' + f1(-L) + ' 0)'; }
    if (rim > 0) this.raw(d, o.rc || mix(c, RIM, 0.55), { fr: o.fr });
    this.raw(d, o.sc || shadeOf(c), { tf: rim > 0 ? sq(rim) : '', fr: o.fr });
    this.raw(d, c, { tf: sq(rim + w * sh), fr: o.fr });
    if (o.line !== false) this.raw(d, 'none', { stroke: LC(c), sw: Math.min(o.w || this.w, LW), fr: o.fr });
    return this;
  };
  Bld.prototype.gside = function (g, d, c, b, o) {
    o = o || {};
    g.out.push({ d: d, fill: 'none', stroke: LC(c), sw: LW * 2, tf: '', op: 1, fr: o.fr || 'nonzero' });
    var keep = this.p; this.p = g.fill; this.side(d, c, b, Object.assign({}, o, { line: false })); this.p = keep;
  };
  Bld.prototype.grp = function () { return { out: [], fill: [] }; };
  Bld.prototype.gvol = function (g, d, c, b, o) {
    o = o || {};
    g.out.push({ d: d, fill: 'none', stroke: LC(c), sw: LW * 2, tf: '', op: 1, fr: o.fr || 'nonzero' });
    var keep = this.p; this.p = g.fill; this.vol(d, c, b, Object.assign({}, o, { line: false })); this.p = keep;
  };
  Bld.prototype.graw = function (g, d, fill, o) { var keep = this.p; this.p = g.fill; this.raw(d, fill, o); this.p = keep; };
  Bld.prototype.gflush = function (g) { this.p = this.p.concat(g.out, g.fill); };
  /* prepend a transform to every part (procedural turn) */
  function moved(list, pre) { return list.map(function (q) { return Object.assign({}, q, { tf: (pre + ' ' + q.tf).trim() || 'translate(0 0)' }); }); }
  function fin(list) { return list.map(function (q) { return q.tf ? q : Object.assign({}, q, { tf: 'translate(0 0)' }); }); }
  /* line weight: silhouettes a touch lighter than a sticker outline, feature lines unchanged */
  var LINEK = 0.74;
  function thin(list, keep) { return list.map(function (q) { if (q.stroke !== INK || keep) return q; return Object.assign({}, q, { stroke: SOFT, sw: f1(Math.min(q.sw, LW) * (q.sw >= 2.6 ? 1 : 0.9)) }); }); }

  /* ---------- head ---------- */
  /* eleven head shapes, each a clear silhouette; hair, hats and wraps scale to the head's temple width (hw) */
  var HEAD = {
    /* built geometry: straight cheeks, jaw corners lifted high, a clean chin plane. No jowls. */
    round: { d: 'M100 20C138 20 162 42 162 74C162 104 142 129 100 131C58 129 38 104 38 74C38 42 62 20 100 20Z', b: [38, 20, 124, 111], ear: -1, hw: 62, mw: 62 },
    square: { d: 'M100 20C138 20 161 40 161 70V104C161 110 159 115 155 119L131 132C127 134 122 135 116 135H84C78 135 73 134 69 132L45 119C41 115 39 110 39 104V70C39 40 62 20 100 20Z', b: [39, 20, 122, 115], ear: 0, hw: 61, mw: 61 },
    long: { d: 'M100 15C134 15 155 35 155 67V103C155 111 151 119 144 125L118 141C112 144 106 145 100 145C94 145 88 144 82 141L56 125C49 119 45 111 45 103V67C45 35 66 15 100 15Z', b: [45, 15, 110, 130], ear: 6, hw: 55, mw: 55 },
    wide: { d: 'M100 24C142 24 167 44 167 76V99C167 107 163 113 156 117L131 129C123 132 112 133 100 133C88 133 77 132 69 129L44 117C37 113 33 107 33 99V76C33 44 58 24 100 24Z', b: [33, 24, 134, 109], ear: -6, hw: 67, mw: 67 },
    heart: { d: 'M100 19C141 19 165 40 165 70C165 91 158 106 142 120L113 140C109 142.6 104.6 143.6 100 143.6C95.4 143.6 91 142.6 87 140L58 120C42 106 35 91 35 70C35 40 59 19 100 19Z', b: [35, 19, 130, 125], ear: -3, hw: 65, mw: 65 },
    jaw: { d: 'M100 22C131 22 151 40 154 66L161 98C162.4 105 161.4 112 158 118L149 131C146 135 141 137 135 137H65C59 137 54 135 51 131L42 118C38.6 112 37.6 105 39 98L46 66C49 40 69 22 100 22Z', b: [38, 22, 124, 115], ear: 0, hw: 54, mw: 61.5 },
    /* narrower heads: the same features on a slimmer skull, so the face reads lean rather than chubby */
    slim: { d: 'M100 16C131 16 152 36 152 67V90C152 101 149 110 143 118L122 139C116 144 108 146 100 146C92 146 84 144 78 139L57 118C51 110 48 101 48 90V67C48 36 69 16 100 16Z', b: [48, 16, 104, 130], ear: 7, hw: 52, mw: 52 },
    lean: { d: 'M100 15C130 15 151 34 151 64V112C151 119 148 125 142 129L126 139C121 142 115 143 109 143H91C85 143 79 142 74 139L58 129C52 125 49 119 49 112V64C49 34 70 15 100 15Z', b: [49, 15, 102, 128], ear: 8, hw: 51, mw: 51 },
    diamond: { d: 'M100 18C124 18 142 32 148 56L156 88C157.4 94 157 100 154 106L132 136C124 145 112 148 100 148C88 148 76 145 68 136L46 106C43 100 42.6 94 44 88L52 56C58 32 76 18 100 18Z', b: [42.6, 18, 114.8, 130], ear: 2, hw: 48, mw: 57 },
    chisel: { d: 'M100 17C127 17 147 33 150 58L153 84C154 92 153 100 150 107L138 130C133 138 125 142 116 143L100 144.5L84 143C75 142 67 138 62 130L50 107C47 100 46 92 47 84L50 58C53 33 73 17 100 17Z', b: [46.5, 17, 107, 127.5], ear: 5, hw: 50, mw: 53.5 },
    petite: { d: 'M100 22C128 22 148 40 148 68V96C148 108 144 118 136 126L118 138C113 141 107 142 100 142C93 142 87 141 82 138L64 126C56 118 52 108 52 96V68C52 40 72 22 100 22Z', b: [52, 22, 96, 120], ear: 10, hw: 49, mw: 48 }
  };
  var EAR = 'M42 86C34.5 84.4 30 89 30 95.5C30 102.4 34.5 106.6 42 104.8Z', EAR_IN = 'M38.5 91C35 91 33.6 94 34.2 96.4C34.8 98.6 36.2 99.6 37.8 99';
  var BULK = { full: 'M46 94C42 106 44 122 54 132L66 141.5C72 145.5 80 147 88 147H112C120 147 128 145.5 134 141.5L146 132C156 122 158 106 154 94Z', goatee: 'M90 127.5C94 126.5 106 126.5 110 127.5L108.5 138C106.5 143 103 145 100 145C97 145 93.5 143 91.5 138Z' };
  var BRIMY = { hardhat: 70, fullbrim: 72, beanie: 72, cap: 70 };
  var EY = 92, EXL = 80, EXR = 120;

  /* Hair: every style is ONE silhouette (fringe, crown and sideburns together), drawn for the standard head
     and scaled to the head's width. Under a hat the same silhouette is clipped below the brim line, so what
     shows is always a real part of that haircut. hl = filled shine, clumps = tuft breaks, part = parting. */
  /* ---------- hair ----------
     Every style is one bold silhouette that sits ON the skull with real volume (crown above the head line,
     sides puffing past it, sideburns tapering to a point), cut into a few big locks with pointed tips.
     Inside it, clipped to the silhouette: shade planes, tapered flow strands and a broken shine band.
     Under a hat a style switches to its own covered cut: only the parts that really show below a brim
     (sideburns, side puffs, long lengths), and they start inside the brim's width, so a hat never leaves
     a hard cut edge. */
  function tp(x0, y0, cx, cy, x1, y1, w) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L * w, ny = dx / L * w;
    return 'M' + x0 + ' ' + y0 + 'Q' + f1(cx + nx) + ' ' + f1(cy + ny) + ' ' + x1 + ' ' + y1 + 'Q' + f1(cx - nx) + ' ' + f1(cy - ny) + ' ' + x0 + ' ' + y0 + 'Z';
  }
  function ept(cx, cy, rx, ry, a) { a *= Math.PI / 180; return [f1(cx + rx * Math.cos(a)), f1(cy + ry * Math.sin(a))]; }
  /* broken shine band along an ellipse arc */
  function ring(cx, cy, rx, ry, a0, a1, n, fillF, w) {
    var d = '', sp = (a1 - a0) / n;
    for (var i = 0; i < n; i++) {
      var s = a0 + i * sp, e = s + sp * fillF, m = (s + e) / 2, k = 1 / Math.cos((e - s) / 2 * Math.PI / 180);
      var p0 = ept(cx, cy, rx, ry, s), p1 = ept(cx, cy, rx, ry, e), pc = ept(cx, cy, rx * k, ry * k, m);
      d += tp(p0[0], p0[1], pc[0], pc[1], p1[0], p1[1], w * (i === 0 || i === n - 1 ? 0.75 : 1));
    }
    return d;
  }
  /* a row of round bumps along an ellipse arc (curl / afro outlines) */
  function scal(cx, cy, rx, ry, a0, a1, n, k) {
    var d = '';
    for (var i = 0; i < n; i++) {
      var am = a0 + (a1 - a0) * (i + 0.5) / n, ae = a0 + (a1 - a0) * (i + 1) / n;
      var c = ept(cx, cy, rx * (1 + k), ry * (1 + k), am), e = ept(cx, cy, rx, ry, ae);
      d += 'Q' + c[0] + ' ' + c[1] + ' ' + e[0] + ' ' + e[1];
    }
    return d;
  }
  /* curl ends hanging along a hairline, from x0 to x1 */
  function curlEdge(x0, x1, y, n, drop) {
    var d = '', st = (x1 - x0) / n;
    for (var i = 0; i < n; i++) d += 'Q' + f1(x0 + st * (i + 0.5)) + ' ' + f1(y + drop * 2) + ' ' + f1(x0 + st * (i + 1)) + ' ' + y;
    return d;
  }
  function curl(x, y, s) { return 'M' + f1(x + s) + ' ' + f1(y - s * 0.6) + 'C' + f1(x + s * 0.2) + ' ' + f1(y - s * 1.5) + ' ' + f1(x - s * 1.2) + ' ' + f1(y - s * 0.8) + ' ' + f1(x - s) + ' ' + y + 'C' + f1(x - s * 0.9) + ' ' + f1(y + s * 0.8) + ' ' + f1(x + s * 0.1) + ' ' + f1(y + s) + ' ' + f1(x + s * 0.5) + ' ' + f1(y + s * 0.4); }
  /* curl marks: a dark crescent under each curl, a light one on top */
  function cres(pts, s, up) {
    return pts.map(function (p) { var x = p[0], y = p[1], k = p[2] || s; return up ? tp(f1(x - k), f1(y + k * 0.3), x, f1(y - k * 1.1), f1(x + k), f1(y + k * 0.1), f1(k * 0.42)) : tp(f1(x - k), f1(y - k * 0.4), x, f1(y + k * 1.05), f1(x + k), f1(y - k * 0.6), f1(k * 0.5)); }).join('');
  }
  function sideburn(x) { return both('M' + x + ' 64C42 68 39 76 39 86L43 97C45 91 47 84 48 77V64Z'); }

  function hairShapes(id) {
    var A, S;
    switch (id) {
      case 'buzz': return {
        front: 'M38 88C34 48 62 20 100 20C138 20 166 48 162 88L157 87C156 76 153 67 148 61L134 58C123 55 111 54 100 56C89 54 77 55 66 58L52 61C47 67 44 76 43 87Z', flat: true,
        det: [['shine', ring(100, 60, 50, 36, 214, 250, 2, 0.7, 3.4)]],
        cov: { front: sideburn(46), flat: true }
      };
      case 'crop': return {
        front: 'M42 97L38 82C35 74 34 66 35 58C36 34 54 14 80 10L88 3L94 9C100 7 106 6 112 7L120 2L124 9C146 14 164 32 165 58C166 66 165 74 162 82L158 97C155 90 154 82 153 74L151 63Q148 68 140 70Q136 62 130 56Q127 66 118 70Q114 61 108 55Q105 65 96 70Q92 61 86 56Q83 64 74 69Q70 61 64 58Q60 64 52 66L50 64C47 72 46 82 46 90Z',
        det: [['shade', 'M20 62C34 64 46 66 54 74V110H20ZM180 62C166 64 154 66 146 74V110H180Z'],
          ['strand', tp(96, 12, 90, 34, 86, 54, 3.2) + tp(114, 12, 113, 34, 108, 53, 3.2) + tp(134, 20, 136, 40, 130, 54, 3) + tp(80, 16, 70, 36, 64, 56, 3)],
          ['shine', ring(100, 62, 50, 42, 206, 262, 3, 0.68, 4)]],
        cov: { front: sideburn(46) }
      };
      case 'spiky': return {
        front: 'M42 97L38 82C35 74 34 66 35 60L26 46L38 42L34 27L52 29L56 12L72 19L86 5L100 16L114 5L128 19L144 12L148 29L166 27L162 42L174 46L165 60C166 66 165 74 162 82L158 97C155 90 154 82 153 74L151 64L146 72L138 58L128 72L120 56L110 72L100 56L90 72L82 56L72 70L66 58L56 68L50 64C47 72 46 82 46 90Z',
        det: [['shade', 'M20 64C34 64 46 66 54 74V110H20ZM180 64C166 64 154 66 146 74V110H180Z'],
          ['strand', tp(100, 26, 96, 42, 90, 60, 3) + tp(118, 28, 118, 44, 112, 60, 3) + tp(80, 28, 76, 44, 72, 60, 3) + tp(136, 30, 138, 44, 132, 60, 2.8)],
          ['shine', ring(100, 62, 50, 42, 204, 262, 3, 0.66, 4)]],
        cov: { front: sideburn(46) }
      };
      case 'quiff': return {
        front: 'M43 95L39 82C37 74 36 66 37 58C38 48 42 40 50 34C48 22 58 8 76 4C92 0 118 -1 136 3C154 8 166 20 165 34C165 40 163 46 162 52C164 62 164 72 161 82L157 95C155 88 154 80 153 72L151 63C144 58 132 56 120 57C108 58 96 61 86 61C72 61 60 58 51 62L49 64C47 72 46 82 46 90Z',
        det: [['shade', 'M20 66C44 46 80 40 112 42C134 43 152 46 180 56V110H20Z'],
          ['strand', tp(58, 46, 78, 18, 116, 8, 3.4) + tp(78, 44, 102, 22, 138, 12, 3.4) + tp(102, 44, 126, 28, 154, 26, 3)],
          ['shine', ring(104, 40, 52, 34, 202, 252, 2, 0.74, 4.4)]],
        cov: { front: sideburn(46) }
      };
      case 'part': return {
        front: 'M43 95L39 82C36 74 35 66 36 58C37 32 58 12 90 10C124 8 154 20 163 46C167 58 166 70 162 82L158 95C155 88 154 80 153 72L147 76Q141 64 131 61Q129 66 123 68Q112 53 94 50L76 48Q66 52 59 62L50 64C47 72 46 82 46 90Z',
        det: [['shade', 'M20 64C34 64 44 66 52 72V110H20ZM180 60C168 62 158 66 152 74V110H180Z'],
          ['line', 'M76 48Q75 30 84 12'],
          ['strand', tp(86, 18, 132, 22, 148, 70, 3.2) + tp(80, 32, 112, 32, 124, 62, 3) + tp(74, 22, 56, 30, 52, 58, 2.8)],
          ['shine', ring(100, 64, 54, 46, 248, 300, 3, 0.66, 4)]],
        cov: { front: sideburn(46) }
      };
      case 'curly':
        A = ept(100, 70, 66, 62, 150);
        return {
          front: 'M' + A[0] + ' ' + A[1] + scal(100, 70, 66, 62, 150, 390, 13, 0.1) + 'C154 92 153 82 152 74' + curlEdge(152, 48, 62, 7, 5) + 'C47 82 46 92 ' + A[0] + ' ' + A[1] + 'Z',
          det: [['strand', cres([[86, 20], [114, 20], [70, 32], [100, 34], [130, 32], [54, 46], [84, 48], [116, 48], [146, 46], [40, 64, 4.5], [160, 64, 4.5]], 6)],
            ['shine', cres([[64, 26, 4.5], [92, 14, 4.5], [50, 40, 4]], 4.5, true)]],
          cov: { front: both('M49 66C45 69 41 73 38 79C31 82 31 92 38 95C41 96 44 95 46 93C47 86 48 76 50 70Z'), det: [['strand', cres([[40, 82, 3.6], [160, 82, 3.6], [38, 91, 3], [162, 91, 3]], 3.6)]] }
        };
      case 'afro':
        A = ept(100, 62, 74, 58, 158);
        return {
          front: 'M40 100C34 98 31 92 ' + A[0] + ' ' + A[1] + scal(100, 62, 74, 58, 158, 382, 12, 0.08) + 'C169 92 166 98 160 100C158 88 155 76 148 68C132 60 68 60 52 68C45 76 42 88 40 100Z',
          det: [['strand', cres([[80, 20], [120, 20], [56, 34], [100, 34], [144, 34], [76, 48], [124, 48], [38, 58, 4.6], [162, 58, 4.6], [100, 54, 4.6]], 5.6)],
            ['shine', cres([[64, 24, 4.4], [90, 12, 4.4], [44, 42, 4]], 4.4, true)]],
          cov: {
            back: 'M46 70C38 68 30 72 27 78C20 80 16 88 18 95C14 102 17 112 24 115C26 122 34 126 42 124L50 122ZM154 70C162 68 170 72 173 78C180 80 184 88 182 95C186 102 183 112 176 115C174 122 166 126 158 124L150 122Z',
            front: both('M47 66C43 72 41 82 42 92L48 96Z'), bfill: cres([[28, 92, 4.4], [34, 110, 4.4], [172, 92, 4.4], [166, 110, 4.4], [26, 104, 3.6], [174, 104, 3.6]], 4.4)
          }
        };
      /* wavy: ear-to-jaw length, side part, each side falling in two soft S-waves to pointed tips */
      case 'wavy': return {
        front: 'M38 122C31 112 35 104 31 94C28 84 31 74 33 64C38 32 64 12 100 12C138 12 164 32 167 62C169 72 172 82 169 92C166 104 171 112 166 122L161 128L157 120L151 125C153 114 148 106 150 96C151 88 152 80 150 72Q144 62 134 56Q124 52 116 60Q106 68 94 58Q84 50 74 52Q64 56 56 64C50 72 51 84 50 94C49 104 53 114 50 124L44 119L40 127Z',
        back: 'M30 92C28 48 58 12 100 12C142 12 172 48 170 92C168 104 174 114 170 124L164 132L158 124L152 130H48L42 124L36 132L30 124C26 114 32 104 30 92Z', noEar: true,
        det: [['shade', 'M20 60C34 62 46 68 52 76V140H20ZM180 60C166 62 154 68 148 76V140H180Z'],
          ['strand', tp(40, 76, 33, 88, 39, 100, 2.8) + tp(39, 100, 45, 110, 40, 120, 2.4) + tp(160, 76, 167, 88, 161, 100, 2.8) + tp(161, 100, 155, 110, 160, 120, 2.4) + tp(76, 18, 104, 22, 118, 50, 3) + tp(98, 14, 128, 20, 142, 52, 3) + tp(70, 24, 58, 36, 56, 58, 2.6)],
          ['line', 'M74 52Q76 34 86 16'],
          ['shine', ring(100, 62, 56, 46, 236, 300, 3, 0.64, 4.2)]],
        cov: {
          back: 'M44 68C36 80 30 100 32 124L38 132L44 126L100 128L156 126L162 132L168 124C170 100 164 80 156 68Z', noEar: true,
          front: both('M37.5 67C34 80 33 100 37 120L40 127L44 119L50 124C53 114 49 104 50 94C51 84 52 76 56 68Z'),
          det: [['shade', 'M20 60C34 62 46 68 52 76V140H20ZM180 60C166 62 154 68 148 76V140H180Z'], ['strand', tp(40, 80, 34, 92, 39, 104, 2.6) + tp(39, 104, 45, 112, 40, 120, 2.2) + tp(160, 80, 166, 92, 161, 104, 2.6) + tp(161, 104, 155, 112, 160, 120, 2.2)]]
        }
      };
      /* long waves: centre part, a face-framing curtain that waves all the way past the shoulders */
      case 'longwavy': return {
        front: 'M34 176C26 160 32 148 28 134C24 118 32 106 28 92C26 80 28 70 31 62C36 34 64 14 100 14C136 14 164 34 169 62C172 70 174 80 172 92C168 106 176 118 172 134C168 148 174 160 166 176L160 184L156 174L148 180C152 166 146 154 150 140C154 126 148 112 150 98C152 80 140 60 100 52C60 60 48 80 50 98C52 112 46 126 50 140C54 154 48 166 52 180L44 174L40 184Z',
        back: 'M28 92C26 46 58 12 100 12C142 12 174 46 172 92C170 108 178 122 174 138C170 152 178 166 172 180L164 188L156 180L100 182L44 180L36 188L28 180C22 166 30 152 26 138C22 122 30 108 28 92Z', noEar: true,
        det: [['line', 'M100 52V16'],
          ['shade', 'M20 62C34 66 46 78 50 92V190H20ZM180 62C166 66 154 78 150 92V190H180Z'],
          ['strand', tp(39, 96, 33, 108, 39, 121, 3) + tp(39, 121, 45, 133, 39, 146, 2.8) + tp(39, 146, 33, 158, 39, 170, 2.4) + tp(161, 96, 167, 108, 161, 121, 3) + tp(161, 121, 155, 133, 161, 146, 2.8) + tp(161, 146, 167, 158, 161, 170, 2.4) + tp(97, 20, 78, 30, 58, 64, 2.8) + tp(103, 20, 122, 30, 142, 64, 2.8)],
          ['shine', ring(100, 64, 62, 46, 202, 338, 5, 0.58, 4.4)]],
        cov: {
          back: 'M44 68C33 84 30 110 26 138C22 152 30 166 28 180L36 188L44 180L100 182L156 180L164 188L172 180C170 166 178 152 174 138C170 110 167 84 156 68Z', noEar: true,
          front: both('M37.5 67C33 82 31 104 28 134C24 148 32 160 34 176L40 184L44 174L52 180C48 166 54 154 50 140C46 126 52 112 50 98C51 84 53 74 56 68Z'),
          det: [['shade', 'M20 62C34 66 46 78 50 92V190H20ZM180 62C166 66 154 78 150 92V190H180Z'], ['strand', tp(39, 100, 33, 112, 39, 124, 2.8) + tp(39, 124, 45, 136, 39, 148, 2.6) + tp(39, 148, 33, 160, 39, 170, 2.2) + tp(161, 100, 167, 112, 161, 124, 2.8) + tp(161, 124, 155, 136, 161, 148, 2.6) + tp(161, 148, 167, 160, 161, 170, 2.2)]]
        }
      };
      /* loose curls: a low crown of big curls, ringlets tumbling onto the forehead, short tapered sides */
      case 'curls':
        A = ept(100, 64, 64, 50, 160);
        return {
          front: 'M' + A[0] + ' ' + A[1] + scal(100, 64, 64, 50, 160, 380, 10, 0.17) + 'C162 88 158 94 156 98C153 90 153 82 152 76' + 'Q147 84 140 78Q137 70 130 72Q126 82 118 76Q114 66 106 70Q100 80 92 74Q88 64 80 68Q74 78 66 72Q62 64 56 68L50 70C48 80 47 88 44 98C42 94 38 88 ' + A[0] + ' ' + A[1] + 'Z',
          det: [['shade', 'M20 60C32 62 42 66 48 72V110H20ZM180 60C168 62 158 66 152 72V110H180Z'],
            ['line', curl(68, 34, 5) + curl(98, 24, 5.4) + curl(128, 32, 5) + curl(82, 50, 4.4) + curl(114, 50, 4.4) + curl(52, 52, 4) + curl(146, 50, 4)],
            ['shine', cres([[60, 28, 4.2], [88, 16, 4.4], [48, 44, 3.6]], 4.2, true)]],
          cov: { front: both('M49 66C45 69 41 73 38 79C31 82 31 92 38 95C41 96 44 95 46 93C47 86 48 76 50 70Z'), det: [['strand', cres([[40, 82, 3.6], [160, 82, 3.6], [38, 91, 3], [162, 91, 3]], 3.6)]] }
        };
      /* curly bob: jaw-length volume of curls, widest at the jaw, a curl fringe */
      case 'curlybob':
        A = ept(100, 80, 72, 68, 140);
        return {
          front: 'M' + A[0] + ' ' + A[1] + scal(100, 80, 72, 68, 140, 400, 17, 0.09) + 'Q162 136 151 130C152 114 151 94 150 76' + curlEdge(150, 50, 66, 6, 4) + 'C49 94 48 114 49 130Q38 136 ' + A[0] + ' ' + A[1] + 'Z',
          back: 'M' + ept(100, 84, 74, 66, 130).join(' ') + scal(100, 84, 74, 66, 130, 410, 16, 0.08) + 'Z', noEar: true,
          det: [['shade', 'M18 64C32 66 44 72 50 82V150H18ZM182 64C168 66 156 72 150 82V150H182Z'],
            ['strand', cres([[80, 22], [120, 22], [58, 36], [100, 36], [142, 36], [40, 62, 4.6], [160, 62, 4.6], [36, 84, 4.6], [164, 84, 4.6], [38, 106, 4.4], [162, 106, 4.4], [44, 124, 4], [156, 124, 4]], 5.4)],
            ['shine', cres([[66, 26, 4.4], [92, 16, 4.4], [46, 48, 4]], 4.4, true)]],
          cov: {
            back: 'M46 68C34 72 28 84 28 98C26 112 30 128 40 136H160C170 128 174 112 172 98C172 84 166 72 154 68Z', noEar: true,
            front: both('M37 67C33 74 31 84 31 98C30 112 33 126 42 132L50 130C48 112 48 92 52 74Z'),
            det: [['strand', cres([[36, 86, 4.4], [34, 106, 4.4], [42, 124, 4], [164, 86, 4.4], [166, 106, 4.4], [158, 124, 4]], 4.4)]]
          }
        };
      case 'fade': return {
        front: 'M45 72L45 50C45 28 52 12 68 7C88 2 112 2 132 7C148 12 155 28 155 50L155 72L148 62H52Z',
        fade: both('M45 60V72L49 75V91L42 96C37 86 37 70 45 60Z'),
        det: [['shade', 'M140 0H180V80H140Z'],
          ['strand', tp(68, 12, 66, 36, 64, 60, 2.6) + tp(86, 8, 85, 34, 84, 60, 2.6) + tp(104, 7, 104, 34, 104, 60, 2.6) + tp(122, 8, 123, 34, 124, 60, 2.6) + tp(140, 14, 141, 36, 142, 60, 2.4)],
          ['shine', tp(54, 26, 62, 12, 80, 8, 3.6) + tp(86, 7, 94, 5, 104, 5, 3)]],
        cov: {}
      };
      case 'bun': return {
        front: 'M44 102C40 90 37 76 37 62C37 36 64 16 100 16C136 16 163 36 163 62C163 76 160 90 156 102C153 92 152 80 151 70C140 60 120 52 100 55C80 52 60 60 49 70C48 80 47 92 44 102Z',
        back: E(100, 13, 17, 14), bdet: 'M88 8C94 2 106 2 112 8M86 16C92 22 108 22 114 16',
        det: [['line', 'M100 55V18'],
          ['strand', tp(66, 62, 74, 30, 98, 17, 2.8) + tp(84, 56, 90, 32, 99, 18, 2.4) + tp(134, 62, 126, 30, 102, 17, 2.8) + tp(116, 56, 110, 32, 101, 18, 2.4) + tp(42, 74, 40, 88, 44, 100, 2) + tp(158, 74, 160, 88, 156, 100, 2)],
          ['shine', ring(100, 62, 58, 44, 212, 256, 2, 0.7, 4)]],
        cov: { front: both('M47 64C42 70 40 82 41 93L44 102C46 92 48 80 49 72Z') }
      };
      case 'bob': return {
        front: 'M33 136C29 112 28 92 30 74C32 40 60 14 100 14C140 14 168 40 170 74C172 92 171 112 167 136L149 138C151 118 151 98 149 80L148 68Q136 70 126 69L122 64L118 69.5Q100 71 88 69.5L84 64L80 69Q66 70 52 68L51 80C49 98 49 118 51 138Z',
        back: 'M30 92C28 48 58 12 100 12C142 12 172 48 170 92L169 134H31Z', noEar: true,
        det: [['shade', 'M20 60C34 62 46 66 52 72V140H20ZM180 60C166 62 154 66 148 72V140H180Z'],
          ['strand', tp(38, 84, 36, 110, 40, 134, 3) + tp(162, 84, 164, 110, 160, 134, 3) + tp(72, 30, 70, 50, 68, 66, 2.6) + tp(100, 20, 100, 46, 100, 66, 2.6) + tp(128, 30, 130, 50, 132, 66, 2.6)],
          ['shine', ring(100, 64, 62, 46, 202, 338, 5, 0.6, 4.4)]],
        cov: {
          back: 'M44 68C34 82 29 106 29 134H171C171 106 166 82 156 68Z', noEar: true,
          front: both('M37.5 67C34 84 33 106 34 136L51 138C49 118 49 98 51 80C52 74 54 70 56 68Z'),
          det: [['shade', 'M20 60C34 62 46 66 52 72V140H20ZM180 60C166 62 154 66 148 72V140H180Z'], ['strand', tp(40, 90, 38, 112, 41, 134, 2.8) + tp(160, 90, 162, 112, 159, 134, 2.8)]]
        }
      };
      case 'long': return {
        front: 'M33 172C28 140 28 104 31 78C34 40 62 14 100 14C138 14 166 40 169 78C172 104 172 140 167 172L161 182L155 173L149 178C151 146 151 112 149 92C147 70 128 56 100 52C72 56 53 70 51 92C49 112 49 146 51 178L45 173L39 182Z',
        back: 'M28 92C26 46 58 12 100 12C142 12 174 46 172 92L176 176L168 186L160 178L150 182L100 180L50 182L40 178L32 186L24 176Z', noEar: true,
        det: [['line', 'M100 52V16'],
          ['shade', 'M20 62C34 66 46 78 50 92V190H20ZM180 62C166 66 154 78 150 92V190H180Z'],
          ['strand', tp(38, 96, 36, 130, 40, 168, 3) + tp(162, 96, 164, 130, 160, 168, 3) + tp(97, 20, 78, 30, 58, 64, 2.8) + tp(103, 20, 122, 30, 142, 64, 2.8)],
          ['shine', ring(100, 64, 62, 46, 202, 338, 5, 0.58, 4.4)]],
        cov: {
          back: 'M44 68C33 84 28 116 26 172L34 182L42 174L100 176L158 174L166 182L174 172C172 116 167 84 156 68Z', noEar: true,
          front: both('M37.5 67C34 86 32 120 33 172L39 182L45 173L51 178C49 146 49 112 51 90C52 80 54 72 56 68Z'),
          det: [['shade', 'M20 62C34 66 46 78 50 92V190H20ZM180 62C166 66 154 78 150 92V190H180Z'], ['strand', tp(40, 100, 37, 134, 40, 168, 2.8) + tp(160, 100, 163, 134, 160, 168, 2.8)]]
        }
      };
      case 'locs':
        S = 'M33 160C28 130 28 100 31 78C34 40 62 14 100 14C138 14 166 40 169 78C172 100 172 130 167 160Q164 168 159 162Q156 170 151 162Q149 168 148 160C150 130 150 104 148 88C146 76 140 68 132 64' + curlEdge(132, 68, 62, 5, 2.6) + 'C60 68 54 76 52 88C50 104 50 130 52 160Q51 168 49 162Q44 170 41 162Q36 168 33 160Z';
        return {
          front: S,
          back: 'M28 92C26 46 58 12 100 12C142 12 174 46 172 92L176 162Q172 172 166 164Q160 172 154 164H46Q40 172 34 164Q28 172 24 162Z', noEar: true,
          det: [['line', 'M40 92V156M46 94V160M160 92V156M154 94V160M100 16V60M84 18Q74 40 78 62M116 18Q126 40 122 62M68 26Q56 46 60 66M132 26Q144 46 140 66'],
            ['shine', ring(100, 64, 62, 46, 210, 250, 2, 0.6, 3.6) + ring(100, 64, 62, 46, 290, 330, 2, 0.6, 3.6)]],
          cov: {
            back: 'M44 68C33 84 28 114 26 162Q30 172 36 164Q42 172 48 164H152Q158 172 164 164Q170 172 174 162C172 114 167 84 156 68Z', noEar: true,
            front: both('M37.5 67C34 86 32 116 33 160Q36 168 41 162Q44 170 49 162Q51 168 52 160C50 130 50 104 52 88C53 78 54 72 56 68Z'),
            det: [['line', 'M40 94V156M46 96V160M160 94V156M154 96V160']]
          }
        };
      case 'mohawk': return {
        front: 'M87 62C85 48 82 36 78 24L86 27L87 8L95 20L100 1L105 20L113 8L114 27L122 24C118 36 115 48 113 62C107 58 93 58 87 62Z',
        fade: 'M39.5 84C37.5 58 54 34 84.5 27L86.5 60C70 61.5 56.5 67.5 47.5 79Z' + 'M160.5 84C162.5 58 146 34 115.5 27L113.5 60C130 61.5 143.5 67.5 152.5 79Z',
        det: [['shade', 'M106 0H130V70H106Z'], ['strand', tp(94, 56, 92, 40, 92, 22, 2.2) + tp(104, 56, 104, 36, 101, 12, 2.2)], ['shine', tp(88, 46, 88, 34, 92, 22, 2.8)]],
        cov: {}
      };
      default: return {};
    }
  }

  /* ---------- face ---------- */
  function eyes(B, id, ec, skin, look) {
    var iris = mix(ec, INK, 0.25), lx = look * 1.8;
    function mir(d, i) { return i ? M(d) : d; }
    [0, 1].forEach(function (i) {
      var x = i ? EXR : EXL, y = EY, t = id;
      if (id === 'wink') t = i ? 'happy' : 'sharp';
      if (t === 'happy') { B.raw(mir('M72 95Q80 84 88 95Q80 89.6 72 95Z', i), INK); return; }
      if (t === 'calm') { B.raw(mir('M72 91Q80 99 88 91Q80 95.2 72 91Z', i), INK); B.line(mir('M72.5 91.5L69.5 90', i), 2.2); return; }
      if (t === 'dot') { B.raw(E(x, y, 4, 5), iris); B.raw(E(x - 1.2, y - 1.8, 1.2, 1.2), '#FFFFFF'); return; }
      var white, lid, ir = 4.7, iy = 92.6, cover = 0;
      if (t === 'open' || t === 'wide' || t === 'side') {
        var r = t === 'wide' ? 8.4 : 7.6;
        white = E(80, 92, r, r); lid = 'M' + (80 - r - 0.6) + ' 91C' + (80 - r) + ' ' + (92 - r * 1.25) + ' ' + (80 + r) + ' ' + (92 - r * 1.25) + ' ' + (80 + r + 0.6) + ' 91';
        ir = t === 'wide' ? 3.4 : 4.4; iy = 92.4;
      } else {
        /* sharp (house eye): almond, iris tucked under a heavy lid; focus: the lid tips down to the nose */
        white = RR(71.6, 88, 16.8, 9.2, 4.6); ir = 3.5; iy = 92.6; lid = 'M71.8 91.6C72.6 89.2 74.2 88 76.4 88H83.6C85.8 88 87.4 89.2 88.2 91.6';
        if (t === 'focus') lid = 'M70.4 88.6L89.6 92';
        cover = t === 'focus' ? 1 : 0;
      }
      var px = 80 + (i ? -lx : lx) * 1.6 + (t === 'side' ? (i ? -4.2 : 4.2) : 0);
      var g = new Bld();
      B.raw(mir(white, i), '#FFFFFF', { stroke: INK, sw: 1.8 });
      B.raw(mir(E(px, iy, ir, ir), i), iris);
      if (iris !== INK) B.raw(mir(E(px, iy, ir * 0.48, ir * 0.48), i), INK);
      B.raw(mir(E(f1(px - ir * 0.34), f1(iy - ir * 0.38), f1(ir * (t === 'sharp' || t === 'focus' ? 0.22 : 0.3)), f1(ir * (t === 'sharp' || t === 'focus' ? 0.22 : 0.3))), i), '#FFFFFF');
      if (cover) B.raw(mir('M69 80H91V92.2L69 88.4Z', i), skin);
      if (lid) B.line(mir(lid, i), 3);
    });
  }
  /* brows: filled, thick at the inner end, tapering out (left brow given; mirrored for the right) */
  function browShape(x0, y0, x1, y1, arch, th) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy), h = th / 2, nx = -dy / L * h, ny = dx / L * h;
    var bx = (x0 + x1) / 2 - dy / L * arch * 0.4, by = (y0 + y1) / 2 + dx / L * -arch * 0.4;
    return 'M' + f1(x0 + nx) + ' ' + f1(y0 + ny) + 'Q' + f1(bx + nx) + ' ' + f1(by + ny) + ' ' + f1(x1 + nx) + ' ' + f1(y1 + ny) + 'A' + f1(h) + ' ' + f1(h) + ' 0 0 0 ' + f1(x1 - nx) + ' ' + f1(y1 - ny) + 'Q' + f1(bx - nx) + ' ' + f1(by - ny) + ' ' + f1(x0 - nx) + ' ' + f1(y0 - ny) + 'A' + f1(h) + ' ' + f1(h) + ' 0 0 0 ' + f1(x0 + nx) + ' ' + f1(y0 + ny) + 'Z';
  }
  function browTaper(x0, y0, x1, y1, arch, th) {
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy), nx = dy / L, ny = -dx / L;
    var cx = mx + nx * arch, cy = my + ny * arch;
    return 'M' + f1(x0) + ' ' + f1(y0) + 'Q' + f1(cx + nx * th * 0.35) + ' ' + f1(cy + ny * th * 0.35) + ' ' + f1(x1 + nx * th * 0.5) + ' ' + f1(y1 + ny * th * 0.5) +
      'Q' + f1(x1 + dx / L * th * 0.6) + ' ' + f1(y1 + dy / L * th * 0.6) + ' ' + f1(x1 - nx * th * 0.5) + ' ' + f1(y1 - ny * th * 0.5) +
      'Q' + f1(cx - nx * th * 0.35) + ' ' + f1(cy - ny * th * 0.35) + ' ' + f1(x0) + ' ' + f1(y0) + 'Z';
  }
  var BROW = { soft: [70.5, 81.6, 89, 80, 1.6, 5.2], flat: [71, 78, 88.5, 78, 0, 4.4], arch: [71, 80, 88.5, 77, 6, 4.2], bold: [71, 78.8, 88.5, 77, 2.4, 6.4], angle: [71, 75.2, 88.5, 80.4, 0.6, 5], worry: [71, 80.4, 88.5, 74.6, 1.4, 4.4], high: [71, 73.6, 88.5, 72, 3.4, 4.4] };
  function brows(B, id, c) {
    if (id === 'none') return;
    var l = BROW[id] || BROW.soft, r = id === 'raise' ? BROW.high : l;
    if (id === 'raise') l = BROW.soft;
    B.raw(browShape.apply(null, l) + M(browShape.apply(null, r)), c);
  }
  function nose(B, c, t) {
    /* a shaded wedge on the shadow side of the nose, tip lifted clear of the moustache line */
    if (Math.abs(t) < 0.25) { B.raw('M100.6 93C103.4 97.8 105.8 101.4 105.2 103.6C104.6 105.6 101.6 106.2 97.8 105.4C101.2 104.4 102.5 103 102.3 101.2C102.1 98.6 101.4 95.6 100.6 93Z', c); return; }
    var d = 'M100 91.5L106.4 102.6C107 104.6 104.6 106.4 98.4 105.6C101.6 104.2 103 103.2 102.8 102C102.4 99 101.4 95.4 100 91.5Z';
    B.raw(t > 0 ? d : M(d), c);
  }
  function mouth(B, id) {
    switch (id) {
      case 'grin': B.raw('M89 113H111C110 122 105 126 100 126C95 126 90 122 89 113Z', '#FFFFFF', { stroke: INK, sw: 2.4 }); B.line('M89.6 118H110.4M96 113V125.6M104 113V125.6', 1.6); break;
      case 'beam': B.raw('M89 113H111C110 121 105 124 100 124C95 124 90 121 89 113Z', INK); B.raw('M91 114H109V116.6C103 118 97 118 91 116.6Z', '#FFFFFF'); break;
      case 'flat': B.line('M92 118H108', 2.8); break;
      case 'smirk': B.line('M91 119Q100 120 109 113', 2.8); break;
      case 'o': B.raw(E(100, 119, 3.6, 4.4), INK); break;
      case 'wavy': B.line('M90 119L94 116L98 119L102 116L106 119L110 116', 2.6); break;
      case 'open': B.raw('M91 114H109L105 123H95Z', INK); B.raw('M95 121H105L104.4 123H95.6Z', '#E8707E'); break;
      default: B.raw('M92.6 116.4C96.6 118.8 103.4 118.6 107.6 114.6C108.3 114 109.3 114.6 108.9 115.4C105.4 121.2 96.4 121.8 92 117.6C91.4 117 91.9 116 92.6 116.4Z', INK);
    }
  }
  function glasses(B, id) {
    if (id === 'round') { B.raw(E(80, 93, 11, 11) + E(120, 93, 11, 11), 'none', { stroke: INK, sw: 2.8 }); B.line('M91 92Q100 88 109 92M69 91L40 88M131 91L160 88', 2.8); }
    if (id === 'square') { B.raw(CH(68, 84, 24, 18, 4) + CH(108, 84, 24, 18, 4), 'none', { stroke: INK, sw: 3 }); B.line('M92 91H108M68 90L40 88M132 90L160 88', 3); }
    if (id === 'safety') { var v = 'M62 84H138L136 100C132 106 120 106 112 102L104 98H96L88 102C80 106 68 106 64 100Z'; B.raw(v, '#7DC8E6', { op: 0.4 }); B.raw(v, 'none', { stroke: INK, sw: 2.6 }); B.line('M68 88L84 87', 2, '#FFFFFF'); B.line('M62 90L40 88M138 90L160 88', 3); }
    if (id === 'shades') { var s = 'M68 86H92V92C92 100 86 103 80 103C73 103 68 99 68 92Z'; B.raw(s + M(s), INK); B.line('M92 88H108M68 88L40 86M132 88L160 86', 3); B.line('M72 92L76 89M112 92L116 89', 1.8, '#6A6676'); }
  }
  function faceDetails(F, sp, skin, ss) {
    if (sp.age === 'lines' || sp.age === 'senior') F.line(both('M66 90L62 88M66 95L62 96M86 110Q82 116 85 122'), 1.8, ss);
    if (sp.age === 'senior') { F.line(both('M73 102Q80 105 87 102'), 1.8, ss); F.line('M84 56H116M88 62H112', 1.8, ss); }
    if (sp.marks === 'freckles') { var fr = ''; [[70, 104], [75, 108], [80, 104], [85, 108], [72, 112]].forEach(function (p) { fr += E(p[0], p[1], 1.2, 1.2) + E(200 - p[0], p[1], 1.2, 1.2); }); F.raw(fr + E(97, 100, 1.1, 1.1) + E(103, 100, 1.1, 1.1), mix(skin, '#6E3517', 0.45)); }
    if (sp.marks === 'mole') F.raw(E(114, 126, 1.8, 1.8), mix(skin, INK, 0.6));
  }
  /* ---------- facial hair, fitted to the head ----------
     Beards are built from the head's own jawline (sampled from its path), so one design fits all eleven
     heads: a cheek line from the sideburn to the mouth corner, volume added outward along the jaw normals,
     and a notch round the lower lip so the mouth always shows. Points tied to the features (mouth, chin
     patch) follow the face turn; points tied to the skull stay put. Moustaches are their own choice. */
  function sampleD(d) {
    var tk = d.match(/[MLHVCQZ]|-?\d*\.?\d+/g) || [], i = 0, P = [], cur = [0, 0], cmd = '', n = function () { return +tk[i++]; };
    while (i < tk.length) {
      if (/[MLHVCQZ]/.test(tk[i])) { cmd = tk[i++]; if (cmd === 'Z') continue; }
      if (cmd === 'M' || cmd === 'L') { cur = [n(), n()]; P.push(cur); }
      else if (cmd === 'H') { cur = [n(), cur[1]]; P.push(cur); }
      else if (cmd === 'V') { cur = [cur[0], n()]; P.push(cur); }
      else if (cmd === 'C') { var c1 = [n(), n()], c2 = [n(), n()], e = [n(), n()]; P = P.concat(bezPts(cur, [c1[0], c1[1], c2[0], c2[1], e[0], e[1]], 0, 1, 12).slice(1)); cur = e; }
      else if (cmd === 'Q') { var q = [n(), n()], e2 = [n(), n()]; for (var k = 1; k <= 10; k++) { var tq = k / 10, u = 1 - tq; P.push([u * u * cur[0] + 2 * u * tq * q[0] + tq * tq * e2[0], u * u * cur[1] + 2 * u * tq * q[1] + tq * tq * e2[1]]); } cur = e2; }
      else i++;
    }
    return P;
  }
  function resampOpen(P, st) {
    var o = [P[0]];
    for (var i = 0; i < P.length - 1; i++) {
      var a = P[i], b = P[i + 1], L = v_len(v_sub(b, a)); if (L < 1e-6) continue;
      for (var k = 1, n = Math.max(1, Math.ceil(L / st)); k <= n; k++) o.push(v_lerp(a, b, k / n));
    }
    return o;
  }
  function smoothOpen(P, it) { for (var r = 0; r < (it || 1); r++) P = P.map(function (p, i) { return i === 0 || i === P.length - 1 ? p : [(P[i - 1][0] + 2 * p[0] + P[i + 1][0]) / 4, (P[i - 1][1] + 2 * p[1] + P[i + 1][1]) / 4]; }); return P; }
  /* the jaw from the left face edge at height ys, round the chin, to the right edge; with outward normals and
     arc position s (0..1) */
  function jawOf(head, ys) {
    var P = resamp(sampleD(head.d), 0.6), N = P.length, iR = -1, iL = -1, i;
    for (i = 0; i < N; i++) { var a = P[i], b = P[(i + 1) % N]; if ((a[1] - ys) * (b[1] - ys) <= 0 && a[1] !== b[1]) { if (a[0] > 100 && iR < 0) iR = i; else if (a[0] < 100 && iR >= 0) iL = i; } }
    var J = [], cr = function (k) { var a = P[k], b = P[(k + 1) % N]; return v_lerp(a, b, (ys - a[1]) / (b[1] - a[1])); };
    J.push(cr(iR)); for (i = iR + 1; i <= iL; i++) J.push(P[i]); J.push(cr(iL));
    J.reverse();
    var L = [0]; for (i = 1; i < J.length; i++) L.push(L[i - 1] + v_len(v_sub(J[i], J[i - 1])));
    var tot = L[L.length - 1];
    return J.map(function (p, k) { var d = v_unit(v_sub(J[Math.min(k + 2, J.length - 1)], J[Math.max(k - 2, 0)])); return { p: p, n: v_perp(d), s: L[k] / tot }; });
  }
  function offJ(J, f) { return smoothOpen(J.map(function (q) { return v_add(q.p, v_mul(q.n, f(q.s, q))); }), 2); }
  function cub(a, c1, c2, b, n) { return bezPts(a, [c1[0], c1[1], c2[0], c2[1], b[0], b[1]], 0, 1, n || 10); }
  function jawAtX(J, x, from) { var best = 0, bd = 1e9; J.forEach(function (q, k) { if (q.p[1] < 100) return; var d = Math.abs(q.p[0] - x); if (d < bd) { bd = d; best = k; } }); return best; }

  var MOUS = {
    classic: 'M84 111.4C86.4 106.4 91.6 104.6 96.4 105.8C98 106.2 99.2 106.8 100 107.6C100.8 106.8 102 106.2 103.6 105.8C108.4 104.6 113.6 106.4 116 111.4C112.4 113.2 107 113.2 100 111.8C93 113.2 87.6 113.2 84 111.4Z',
    chevron: 'M83 112.6L87.4 106.8C88.8 105.2 90.8 104.4 93 104.4H107C109.2 104.4 111.2 105.2 112.6 106.8L117 112.6C111.6 114.2 106 114.4 100 113.4C94 114.4 88.4 114.2 83 112.6Z',
    walrus: 'M80 116.4C80.4 109 86 104 93 104C96 104 98.4 104.8 100 106.2C101.6 104.8 104 104 107 104C114 104 119.6 109 120 116.4C118.4 118.6 115.6 118 114.2 115.8C111.2 117.4 107.6 116.6 105.4 114.8C103.6 115.8 101.8 116 100 115.4C98.2 116 96.4 115.8 94.6 114.8C92.4 116.6 88.8 117.4 85.8 115.8C84.4 118 81.6 118.6 80 116.4Z',
    pencil: 'M86.4 111.6C90.6 109.4 95.6 108.8 99.2 109.4V111C95.4 110.6 91 111.2 87.4 112.6C86.6 112.8 86 112 86.4 111.6ZM113.6 111.6C109.4 109.4 104.4 108.8 100.8 109.4V111C104.6 110.6 109 111.2 112.6 112.6C113.4 112.8 114 112 113.6 111.6Z',
    handlebar: 'M100 107.6C96.6 105.4 91 105.4 88 108.4C86.6 109.8 84.8 110.2 83.4 109.4C82 108.6 81.8 106.6 83.2 105.6C80.8 105.2 79.4 107 79.6 109.2C80 112.6 84.2 114.2 88.2 112.4C92 110.8 96.4 110.6 100 111.6C103.6 110.6 108 110.8 111.8 112.4C115.8 114.2 120 112.6 120.4 109.2C120.6 107 119.2 105.2 116.8 105.6C118.2 106.6 118 108.6 116.6 109.4C115.2 110.2 113.4 109.8 112 108.4C109 105.4 103.4 105.4 100 107.6Z',
    horseshoe: 'M84.2 111C86.6 106 91.8 104.6 96.4 105.6C97.8 106 99.2 106.6 100 107.4C100.8 106.6 102.2 106 103.6 105.6C108.2 104.6 113.4 106 115.8 111L116 129.4C116 131.4 114.8 132.6 113 132.6C111.2 132.6 110.2 131.4 110.2 129.6V114.2C106.8 113.2 103.4 112.6 100 112.6C96.6 112.6 93.2 113.2 89.8 114.2V129.6C89.8 131.4 88.8 132.6 87 132.6C85.2 132.6 84 131.4 84 129.4Z',
    fumanchu: 'M100 107.4C96 105.4 90 105.8 87.6 109.2C86 111.4 85.6 115.8 85.8 121.8C86 127.8 85.4 133.8 84.2 138.4C84 139.4 85 139.8 85.6 139C87.6 134.4 88.6 127.8 88.8 121.8C89 116.2 89.4 112.4 91 110.8C93.4 108.8 97 109.4 100 110.4C103 109.4 106.6 108.8 109 110.8C110.6 112.4 111 116.2 111.2 121.8C111.4 127.8 112.4 134.4 114.4 139C115 139.8 116 139.4 115.8 138.4C114.6 133.8 114 127.8 114.2 121.8C114.4 115.8 114 111.4 112.4 109.2C110 105.8 104 105.4 100 107.4Z'
  };
  function moustache(B, id, hc) {
    var d = MOUS[id]; if (!d) return;
    if (id === 'pencil') { B.raw(d, hc, { stroke: LC(hc), sw: 0.6 }); return; }
    var b = bboxD(d);
    B.raw(d, shadeOf(hc)); B.raw(d, hc, { tf: 'translate(' + f1(b[0] + b[2] * 0.2) + ' ' + f1(b[1]) + ') scale(0.93 0.8) translate(' + f1(-b[0] - b[2] * 0.2) + ' ' + f1(-b[1]) + ')' });
    B.raw(d, 'none', { stroke: LC(hc), sw: id === 'fumanchu' ? 1.6 : 2 });
    if (id !== 'fumanchu') B.line('M98.4 108.4L99.2 110.4M101.6 108.4L100.8 110.4', 0.8, mix(hc, LC(hc), 0.6));
  }
  var BEARD_MOUS = { full: 1, boxed: 1, goatee: 1, bushy: 1, anchor: 1 };
  /* returns { d (fill), clip (true: keep inside the face), strands } in head space, or null */
  function beardGeo(head, id, t) {
    var at = Math.abs(t), fx = function (x) { return 100 + 12 * t + (x - 100) * (1 - 0.1 * at); }, F = function (x, y) { return [fx(x), y]; };
    var notch = function () { return cub(F(111.6, 113), F(111.2, 121.8), F(105.6, 126.2), F(100, 126.2), 6).concat(cub(F(100, 126.2), F(94.4, 126.2), F(88.8, 121.8), F(88.4, 113), 6).slice(1)); };
    var cheeks = function (J, ys, k1, k2) {
      var SL = J[0].p, SR = J[J.length - 1].p, CL = F(84.6, 112.8), CR = F(115.4, 112.8);
      return { L: cub(CL, [CL[0] - k2[0], CL[1] - k2[1]], [SL[0] + k1[0], SL[1] + k1[1]], SL, 10), R: cub(SR, [SR[0] - k1[0], SR[1] + k1[1]], [CR[0] + k2[0], CR[1] - k2[1]], CR, 10) };
    };
    var J, O, ch, P, sw = function (p) { return Math.sin(Math.PI * p); };
    if (id === 'stubble' || id === 'full' || id === 'boxed' || id === 'bushy') {
      var ys = id === 'boxed' ? 91 : id === 'bushy' ? 85 : 87;
      J = jawOf(head, ys);
      var oc = id === 'boxed' ? 4.2 : id === 'full' ? 11 : id === 'bushy' ? 22 : 0, pw = id === 'bushy' ? 2.6 : 2;
      O = offJ(J, function (s) { var o = oc * Math.pow(sw(s), pw); if (id === 'bushy') o += 5 * Math.exp(-Math.pow((s - 0.5) / 0.07, 2)); return o; });
      ch = id === 'boxed' ? cheeks(J, ys, [6, 12], [6, 4]) : cheeks(J, ys, [7, 7], [9, 5]);
      P = O.concat(ch.R.slice(1), notch().slice(1), ch.L.slice(1, -1));
      var lo = J[jawAtX(J, fx(100))].p, sd = [];
      if (id === 'full' || id === 'bushy') {
        var ln = id === 'bushy' ? 14 : 7, y0 = Math.max(128, lo[1] - 4);
        [[-8, 0.8], [0, 0], [8, -0.8], [-15, 1.6], [15, -1.6]].forEach(function (q, k) { if (k > 2 && id !== 'bushy') return; var x = fx(100 + q[0]); sd.push(tp(f1(x), f1(y0 + (k > 2 ? -2 : 0)), f1(x + q[1]), f1(y0 + ln * 0.5), f1(x + q[1] * 1.6), f1(y0 + ln), 1.3)); });
      }
      return { P: P, clip: id === 'stubble', strands: sd.join(''), stub: id === 'stubble' };
    }
    if (id === 'anchor') {
      /* anchor: a full chin beard that runs along the jaw to two points under the mouth corners, joined to the
         lower lip by a broad soul patch; two small notches of skin sit between the patch and the points */
      J = jawOf(head, 100);
      var cx = fx(100), xl = fx(85.4), xr = fx(114.6), ia = jawAtX(J, xl), ib = jawAtX(J, xr);
      var segA = J.slice(Math.min(ia, ib), Math.max(ia, ib) + 1), half = (xr - xl) / 2;
      var bell = function (q) { return Math.pow(Math.max(0, 1 - Math.abs(q.p[0] - cx) / half), 1.6); };
      var out = offJ(segA, function (s, q) { return 1 + 2.2 * bell(q); });
      if (out[0][0] > out[out.length - 1][0]) out.reverse();
      var chinY = J[jawAtX(J, cx)].p[1], pk = Math.max(128.2, chinY - 6.4);
      var oL = out[0], oR = out[out.length - 1];
      var tipL = [oL[0] + 1.6, oL[1] - 3.2], tipR = [oR[0] - 1.6, oR[1] - 3.2];
      var top = cub(tipR, [tipR[0] - 2.4, tipR[1] + 2.2], F(107.6, pk), F(105.6, pk), 6)
        .concat(cub(F(105.6, pk), F(104.4, pk - 0.4), F(104, 127.4), F(103.8, 126.4), 4).slice(1))
        .concat(cub(F(103.8, 126.4), F(101.6, 125.4), F(98.4, 125.4), F(96.2, 126.4), 4).slice(1))
        .concat(cub(F(96.2, 126.4), F(96, 127.4), F(95.6, pk - 0.4), F(94.4, pk), 4).slice(1))
        .concat(cub(F(94.4, pk), F(92.4, pk), [tipL[0] + 2.4, tipL[1] + 2.2], tipL, 6).slice(1));
      var capR = cub(oR, [oR[0] + 0.2, oR[1] - 2], [tipR[0] + 0.8, tipR[1] + 0.4], tipR, 4);
      var capL = cub(tipL, [tipL[0] - 0.8, tipL[1] + 0.4], [oL[0] - 0.2, oL[1] - 2], oL, 4);
      P = out.concat(capR.slice(1), top.slice(1), capL.slice(1, -1));
      return { P: P, clip: false };
    }
    if (id === 'goatee' || id === 'anchor') {
      J = jawOf(head, 100);
      var wide = id === 'anchor', xl = fx(wide ? 86.4 : 89.6), xr = fx(wide ? 113.6 : 110.4);
      var a2 = jawAtX(J, xl), b2 = jawAtX(J, xr);
      var seg2 = J.slice(Math.min(a2, b2), Math.max(a2, b2) + 1);
      /* goatee: narrow under the lip, flaring to a full rounded chin that hangs a little below the jaw */
      var bot = offJ(seg2, function (s, q) { var m = Math.min(1, Math.abs(q.p[0] - fx(100)) / Math.max(4, (xr - xl) / 2)); return wide ? 2.6 + 8 * Math.pow(1 - m, 2) : 1.6 + 3.2 * Math.pow(1 - m, 1.6); });
      if (bot[0][0] > bot[bot.length - 1][0]) bot.reverse();
      var tl = wide ? F(88.4, 113) : F(94.6, 125.6), tr = wide ? F(111.6, 113) : F(105.4, 125.6);
      var left = cub(tl, [tl[0] - (wide ? 2.6 : 1.4), tl[1] + (wide ? 8 : 3)], [bot[0][0] + (wide ? -0.4 : 0.6), bot[0][1] - (wide ? 6 : 5)], bot[0], 8);
      var right = cub(bot[bot.length - 1], [bot[bot.length - 1][0] - (wide ? -0.4 : 0.6), bot[bot.length - 1][1] - (wide ? 6 : 5)], [tr[0] + (wide ? 2.6 : 1.4), tr[1] + (wide ? 8 : 3)], tr, 8);
      var top = wide ? notch().reverse() : cub(tr, F(104.6, 125), F(95.4, 125), tl, 6);
      return { P: left.concat(bot.slice(1), right.slice(1), top.slice(1, -1)), clip: false };
    }
    if (id === 'soul') { var sp2 = [F(96.8, 126.8), F(103.2, 126.8), F(101.4, 132), F(98.6, 132)]; return { P: cub(sp2[0], F(98.8, 126.2), F(101.2, 126.2), sp2[1], 4).concat(cub(sp2[1], F(103, 129), F(102, 131.6), F(100, 132.4), 4).slice(1), cub(F(100, 132.4), F(98, 131.6), F(97, 129), sp2[0], 4).slice(1, -1)), clip: false }; }
    return null;
  }

  /* ---------- headwear ---------- */
  function star(cx, cy, R, r) { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + f1(cx + rr * Math.cos(a)) + ' ' + f1(cy + rr * Math.sin(a)); } return d + 'Z'; }
  var STICKERS = {
    hazard: function (B, x, y) { B.raw(CH(x - 9, y - 7, 18, 14, 3), '#FFC21F', { stroke: INK, sw: 2 }); B.raw('M' + (x - 7) + ' ' + (y + 5.5) + 'L' + (x - 2) + ' ' + (y - 5.5) + 'H' + (x + 1.5) + 'L' + (x - 3.5) + ' ' + (y + 5.5) + 'ZM' + (x + 0.5) + ' ' + (y + 5.5) + 'L' + (x + 5.5) + ' ' + (y - 5.5) + 'H' + (x + 8) + 'V' + (y - 2) + 'L' + (x + 4.5) + ' ' + (y + 5.5) + 'Z', INK); },
    star: function (B, x, y) { B.raw(CH(x - 8.5, y - 8.5, 17, 17, 4), INK); B.raw(star(x, y + 0.4, 6, 2.6), '#FF6A1A'); },
    bolt: function (B, x, y) { B.raw(CH(x - 8.5, y - 8.5, 17, 17, 4), '#F3F1EC', { stroke: INK, sw: 2 }); B.raw('M' + (x + 1.5) + ' ' + (y - 6.5) + 'L' + (x - 4) + ' ' + (y + 1) + 'H' + x + 'L' + (x - 1.5) + ' ' + (y + 6.5) + 'L' + (x + 4) + ' ' + (y - 1) + 'H' + x + 'Z', '#2E62E6'); },
    cross: function (B, x, y) { B.raw(CH(x - 8.5, y - 8.5, 17, 17, 4), '#23A05C', { stroke: INK, sw: 2 }); B.raw('M' + (x - 2) + ' ' + (y - 5.5) + 'H' + (x + 2) + 'V' + (y - 2) + 'H' + (x + 5.5) + 'V' + (y + 2) + 'H' + (x + 2) + 'V' + (y + 5.5) + 'H' + (x - 2) + 'V' + (y + 2) + 'H' + (x - 5.5) + 'V' + (y - 2) + 'H' + (x - 2) + 'Z', '#FFFFFF'); },
    crane: function (B, x, y) { B.raw(CH(x - 8.5, y - 8.5, 17, 17, 4), '#2A51BA', { stroke: INK, sw: 2 }); B.line('M' + (x - 3) + ' ' + (y + 6) + 'V' + (y - 4.5) + 'H' + (x + 5.5) + 'M' + (x - 6) + ' ' + (y - 4.5) + 'H' + (x - 3) + 'M' + (x + 4) + ' ' + (y - 4.5) + 'V' + (y + 1), 1.8, '#FFFFFF'); },
    rank: function (B, x, y) { B.raw(CH(x - 8.5, y - 8.5, 17, 17, 4), INK); B.line('M' + (x - 4.5) + ' ' + (y + 1) + 'L' + x + ' ' + (y - 3) + 'L' + (x + 4.5) + ' ' + (y + 1) + 'M' + (x - 4.5) + ' ' + (y + 5) + 'L' + x + ' ' + (y + 1) + 'L' + (x + 4.5) + ' ' + (y + 5), 2.2, '#D9A43A'); },
    none: function () {}
  };
  var BRIM = {
    hardhat: 'M26 66C26 61 31 59 38 59H162C169 59 174 61 174 66C174 71 169 73 162 73C140 73 122 75 100 75C78 75 60 73 38 73C31 73 26 71 26 66Z',
    fullbrim: 'M14 68C14 62 22 60 32 60H168C178 60 186 62 186 68C186 74 178 76 168 76C142 76 124 78 100 78C76 78 58 76 32 76C22 76 14 74 14 68Z',
    beanie: CH(36, 54, 128, 21, 6),
    cap: 'M40 64C60 57 140 57 160 64L156 78C126 72 74 72 44 78Z'
  };
  var TURBAN = 'M38 78C32 40 60 6 100 6C140 6 168 40 162 78C142 68 120 68 100 80C80 68 58 68 38 78Z';
  function headwear(B, D, sp, c) {
    /* B = shell (small parallax), D = details that sit on the front of the shell (bigger parallax) */
    var id = sp.hat, dk = mix(c, INK, 0.12);
    if (id === 'hardhat' || id === 'fullbrim') {
      B.raw('M38 66C36 30 64 6 100 6C136 6 164 30 162 66Z', c); B.raw('M128 11C150 20 163 40 162 66H144C146 44 140 24 128 11Z', shadeOf(c)); B.raw('M146 22C156 33 162 48 162 66H158.6C158.6 50 154 35 146 22Z', mix(c, RIM, 0.55)); B.line('M38 66C36 30 64 6 100 6C136 6 164 30 162 66Z', LW, LC(c));
      D.vol('M92 7C96 6 104 6 108 7L110 64H90Z', dk, null, { k: 0, w: 2.4 });
      D.line('M52 46C54 30 64 20 78 15', 3.4, mix(c, '#FFFFFF', 0.55));
      B.vol(BRIM[id], c, id === 'fullbrim' ? [14, 60, 172, 18] : [26, 59, 148, 16], { k: 3 });
      (STICKERS[sp.sticker] || STICKERS.none)(D, 64, 40);
      return;
    }
    if (id === 'beanie') {
      B.raw('M40 70C38 34 64 10 100 10C136 10 162 34 160 70Z', c); B.raw('M128 15C149 24 162 44 160 70H143C145 48 139 28 128 15Z', shadeOf(c)); B.raw('M145 26C155 37 161 52 160 70H156.6C156.6 54 152 39 145 26Z', mix(c, RIM, 0.55)); B.line('M40 70C38 34 64 10 100 10C136 10 162 34 160 70Z', LW, LC(c));
      B.vol(BRIM.beanie, dk, [36, 54, 128, 21], { k: 3 });
      var r = ''; for (var x = 46; x < 158; x += 9) r += 'M' + x + ' 58V71'; B.line(r, 2, mix(c, INK, 0.4));
      D.raw(CH(89, 58, 22, 12, 2), '#FF6A1A', { stroke: INK, sw: 2 });
      return;
    }
    if (id === 'cap') {
      B.raw('M40 70C40 34 66 10 100 10C134 10 160 34 160 70Z', c); B.raw('M127 15C148 24 160 44 160 70H143C145 48 139 28 127 15Z', shadeOf(c)); B.raw('M144 26C154 37 160 52 160 70H156.6C156.6 54 152 39 144 26Z', mix(c, RIM, 0.55)); B.line('M40 70C40 34 66 10 100 10C134 10 160 34 160 70Z', LW, LC(c));
      D.line('M100 12V62M74 18C66 32 64 50 66 66M126 18C134 32 136 50 134 66', 2, mix(c, INK, 0.35));
      D.raw(E(100, 12, 4, 3), dk, { stroke: INK, sw: 2 });
      D.raw(CH(88, 30, 24, 16, 3), luma(c) > 0.55 ? '#263552' : '#FF6A1A', { stroke: INK, sw: 2 });
      D.vol(BRIM.cap, dk, [40, 57, 120, 21], { k: 3 });
      return;
    }
    if (id === 'turban') {
      B.vol(TURBAN, c, [32, 6, 136, 74], { k: 8 });
      D.line('M48 60C64 42 98 34 140 42M58 38C76 24 110 20 138 26M100 80L90 34', 2.4, mix(c, INK, 0.3));
    }
  }
  function earwear(T, id, hat, xl, xr, far) {
    var hh = hat === 'hardhat' || hat === 'fullbrim';
    if (id === 'earpiece') { T.raw(E(xl + 34, 96, 3.6, 4.4), '#2C2B31', { stroke: INK, sw: 1.8 }); T.line('M' + (xl + 34) + ' 100C' + (xl + 31) + ' 110 ' + (xl + 37) + ' 118 ' + (xl + 35) + ' 130', 2, '#2C2B31'); }
    if (id === 'earbuds') { T.raw(E(xl + 34, 96, 3.6, 4), '#F3F1EC', { stroke: INK, sw: 1.8 }); if (far !== 'R') T.raw(E(xr - 34, 96, 3.6, 4), '#F3F1EC', { stroke: INK, sw: 1.8 }); }
    if (id === 'defenders') {
      if (hh) T.line('M' + (xl + 33) + ' 84L' + (xl + 38) + ' 74M' + (xr - 33) + ' 84L' + (xr - 38) + ' 74', 3.4);
      else { var band = 'M' + (xl + 33) + ' 86C' + (xl + 30) + ' 32 ' + (xr - 30) + ' 32 ' + (xr - 33) + ' 86'; T.line(band, 7); T.line(band, 3.6, '#3A3842'); }
      T.vol(CH(xl + 21, 82, 24, 28, 6), '#FFC21F', [xl + 21, 82, 24, 28], { k: 3, w: 2.6 });
      T.vol(CH(xr - 45, 82, 24, 28, 6), '#FFC21F', [xr - 45, 82, 24, 28], { k: 3, w: 2.6 });
    }
  }

  /* ---------- body ---------- */
  /* ======================= BODY 7: adult proportions =======================
     About five heads tall on the 200 x 262 board. The head keeps its own coordinates and is placed with
     HEADTF; everything below the chin is drawn here in board units with a fine tonal line (LWB).
     Built like a character sheet: the shoulder line runs off the neck and rolls over the deltoid into the
     arm; the arm hangs from that point, elbow at the waist, wrist at the crotch, fingertips mid thigh.
     Torso + sleeves are one silhouette (one outline, no seams); where an arm lies over the body a single
     tonal line, fading in at the armpit, separates them. Hands continue the wrist, thumbs sit on top. */
  var HEADTF = 'translate(0 -42.5) translate(100 134) scale(0.74) translate(-100 -134)', UT7 = 'translate(-10 26.34) scale(1.1)', SWK7 = 1.7, HK7 = 1.08, LWB = 1;
  function v_add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function v_sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function v_mul(a, k) { return [a[0] * k, a[1] * k]; }
  function v_len(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1]); }
  function v_unit(a) { var l = v_len(a) || 1; return [a[0] / l, a[1] / l]; }
  function v_perp(a) { return [-a[1], a[0]]; }
  function v_dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function v_lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function PT(p) { return f1(p[0]) + ' ' + f1(p[1]); }
  function pe(d, fill, stroke, sw, tf, op) { return { d: d, fill: fill || 'none', stroke: stroke || 'none', sw: sw || 0, tf: tf || '', op: op == null ? 1 : op, fr: 'nonzero' }; }
  /* segment lists: [[x,y], [x,y] (line) | [c1x,c1y,c2x,c2y,x,y] (cubic), ...] */
  function sD(S, close) { var d = 'M' + PT(S[0]); for (var i = 1; i < S.length; i++) d += S[i].length === 2 ? 'L' + PT(S[i]) : 'C' + S[i].map(f1).join(' '); return d + (close ? 'Z' : ''); }
  function sEnd(s) { return s.length === 2 ? s : [s[4], s[5]]; }
  function sMir(S) { return S.map(function (s) { return s.map(function (v, i) { return i % 2 ? v : f1(200 - v); }); }); }
  function sRev(S) { var o = [sEnd(S[S.length - 1]).slice()]; for (var i = S.length - 1; i >= 1; i--) { var s = S[i], pv = i === 1 ? S[0] : sEnd(S[i - 1]); o.push(s.length === 2 ? pv.slice() : [s[2], s[3], s[0], s[1], pv[0], pv[1]]); } return o; }
  function sSym(L) { return L.concat(sRev(sMir(L)).slice(1)); }
  function sPoly(S) {
    var pts = [S[0].slice()], cur = S[0];
    for (var i = 1; i < S.length; i++) {
      var s = S[i];
      if (s.length === 2) { pts.push(s.slice()); cur = s; continue; }
      for (var k = 1; k <= 8; k++) { var t = k / 8, u = 1 - t; pts.push([u * u * u * cur[0] + 3 * u * u * t * s[0] + 3 * u * t * t * s[2] + t * t * t * s[4], u * u * u * cur[1] + 3 * u * u * t * s[1] + 3 * u * t * t * s[3] + t * t * t * s[5]]); }
      cur = [s[4], s[5]];
    }
    return pts;
  }
  function inPoly(p, poly) { var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) { var a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  /* affine map of a path made of M/L/C/Q/Z only: m = [a, b, c, d, e, f] */
  function xform(d, m) { return d.replace(/(-?\d*\.?\d+)[ ,]+(-?\d*\.?\d+)/g, function (_, x, y) { x = +x; y = +y; return f1(m[0] * x + m[2] * y + m[4]) + ' ' + f1(m[1] * x + m[3] * y + m[5]); }); }
  function mpt(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
  function capsule(a, b, ra, rb) {
    var n = v_perp(v_unit(v_sub(b, a)));
    return 'M' + PT(v_add(a, v_mul(n, ra))) + 'L' + PT(v_add(b, v_mul(n, rb))) + 'A' + f1(rb) + ' ' + f1(rb) + ' 0 0 0 ' + PT(v_sub(b, v_mul(n, rb))) + 'L' + PT(v_sub(a, v_mul(n, ra))) + 'A' + f1(ra) + ' ' + f1(ra) + ' 0 0 0 ' + PT(v_add(a, v_mul(n, ra))) + 'Z';
  }
  /* open outline of a capsule from a point part-way along it: both sides + the far end cap (no line across the cut) */
  function capsuleOpen(a, b, ra, rb) {
    var n = v_perp(v_unit(v_sub(b, a)));
    return 'M' + PT(v_add(a, v_mul(n, ra))) + 'L' + PT(v_add(b, v_mul(n, rb))) + 'A' + f1(rb) + ' ' + f1(rb) + ' 0 0 0 ' + PT(v_sub(b, v_mul(n, rb))) + 'L' + PT(v_sub(a, v_mul(n, ra)));
  }
  var LIGHT = v_unit([-0.8, -0.6]);
  function sqT(x0, w, px) { var s = Math.max(0.5, 1 - px / w); return 'translate(' + f1(x0) + ' 0) scale(' + s.toFixed(4) + ' 1) translate(' + f1(-x0) + ' 0)'; }
  /* silhouette groups: every outline (double width) goes behind every fill, so a group reads as one shape */
  function grp() { return { out: [], fill: [] }; }
  function gflush(list, g) { return list.concat(g.out, g.fill); }
  function litCap(a, b, ra, rb, w) { var n = v_perp(v_unit(v_sub(b, a))), s = v_mul(n, (v_dot(LIGHT, n) >= 0 ? 1 : -1) * w / 2); return capsule(v_add(a, s), v_add(b, s), Math.max(0.8, ra - w / 2), Math.max(0.8, rb - w / 2)); }
  function gcap(g, a, b, ra, rb, c, sc, w) {
    var d = capsule(a, b, ra, rb); w = w || 2;
    g.out.push(pe(d, 'none', LC(c), LWB * 2)); g.fill.push(pe(d, sc || shadeOf(c))); g.fill.push(pe(litCap(a, b, ra, rb, w), c));
  }
  function gchain(g, segs, c, sc, w) {
    var lits = [];
    segs.forEach(function (q) { var d = capsule(q[0], q[1], q[2], q[3]); g.out.push(pe(d, 'none', LC(c), LWB * 2)); g.fill.push(pe(d, sc || shadeOf(c))); lits.push(pe(litCap(q[0], q[1], q[2], q[3], w || 2), c)); });
    Array.prototype.push.apply(g.fill, lits);
  }
  function gside(g, d, c, bb, w, rim, sc, rc) {
    g.out.push(pe(d, 'none', LC(c), LWB * 2));
    if (rim) g.fill.push(pe(d, rc || mix(c, RIM, 0.45)));
    g.fill.push(pe(d, sc || shadeOf(c), null, 0, rim ? sqT(bb[0], bb[2], rim) : ''));
    g.fill.push(pe(d, c, null, 0, sqT(bb[0], bb[2], (rim || 0) + w)));
  }
  function litScale(d, k) { var b = bboxD(d), ax = b[0] + b[2] * 0.2, ay = b[1] + b[3] * 0.15, s = Math.max(0.62, 1 - (k || 1.5) / Math.max(5, Math.min(b[2], b[3]))); return 'translate(' + f1(ax) + ' ' + f1(ay) + ') scale(' + s.toFixed(3) + ') translate(' + f1(-ax) + ' ' + f1(-ay) + ')'; }
  function sqDir(edge, nn, s) { var a = Math.atan2(nn[1], nn[0]) * 180 / Math.PI; return 'translate(' + PT(edge) + ') rotate(' + f1(a) + ') scale(' + s.toFixed(3) + ' 1) rotate(' + f1(-a) + ') translate(' + f1(-edge[0]) + ' ' + f1(-edge[1]) + ')'; }
  function gvolp(g, d, c, sc, k) { g.out.push(pe(d, 'none', LC(c), LWB * 2)); g.fill.push(pe(d, sc || shadeOf(c))); g.fill.push(pe(d, c, null, 0, litScale(d, k))); }

  /* held items: drawn at the old scale around (x, y), then placed in the hand */
  function itemAt(B, id, x, y) {
    if (id === 'coffee') { B.vol('M' + (x - 11) + ' ' + (y - 16) + 'H' + (x + 11) + 'L' + (x + 8.5) + ' ' + (y + 16) + 'H' + (x - 8.5) + 'Z', '#F3F1EC', [x - 11, y - 16, 22, 32], { k: 3 }); B.raw('M' + (x - 10.2) + ' ' + (y - 5) + 'H' + (x + 10.2) + 'L' + (x + 9.3) + ' ' + (y + 5) + 'H' + (x - 9.3) + 'Z', '#A85A30', { stroke: INK, sw: 1.8 }); B.vol(RR(x - 13, y - 22, 26, 6, 2), '#2C2B31', null, { k: 0 }); }
    if (id === 'radio') { B.line('M' + (x + 5) + ' ' + (y - 30) + 'V' + (y - 16), 3); B.vol(CH(x - 8, y - 18, 16, 32, 3), '#2C2B31', [x - 8, y - 18, 16, 32], { k: 2 }); B.raw(RR(x - 5, y - 14, 10, 6, 1.5), '#FF6A1A'); }
    if (id === 'tape') { B.vol(CH(x - 11, y - 10, 22, 20, 4), '#FFC21F', [x - 11, y - 10, 22, 20], { k: 3 }); B.raw(E(x, y, 4.4, 4.4), '#2C2B31'); }
    if (id === 'tablet') { B.vol(CH(x - 13, y - 22, 24, 34, 3), '#2C2B31', [x - 13, y - 22, 24, 34], { k: 2 }); B.raw(CH(x - 10, y - 19, 18, 24, 2), '#9ADBC8'); B.line('M' + (x - 7) + ' ' + (y - 13) + 'H' + (x + 5) + 'M' + (x - 7) + ' ' + (y - 8) + 'H' + (x + 3), 1.6, '#2A7F68'); }
    if (id === 'duck') { y -= 17; x -= 2; B.vol('M' + (x - 13) + ' ' + (y + 3) + 'C' + (x - 13) + ' ' + (y - 3) + ' ' + (x - 6) + ' ' + (y - 2) + ' ' + (x - 3) + ' ' + (y + 1) + 'H' + (x + 6) + 'C' + (x + 13) + ' ' + (y + 1) + ' ' + (x + 14) + ' ' + (y + 15) + ' ' + (x + 3) + ' ' + (y + 15) + 'H' + (x - 4) + 'C' + (x - 11) + ' ' + (y + 15) + ' ' + (x - 13) + ' ' + (y + 9) + ' ' + (x - 13) + ' ' + (y + 3) + 'Z', V.yellow, [x - 13, y - 3, 27, 18], { k: 3 }); B.vol('M' + (x + 12) + ' ' + (y - 9) + 'H' + (x + 20) + 'C' + (x + 21) + ' ' + (y - 6) + ' ' + (x + 17) + ' ' + (y - 4) + ' ' + (x + 12) + ' ' + (y - 5) + 'Z', V.orange, null, { k: 0 }); B.vol(E(x + 6, y - 9, 8.6, 8.6), V.yellow, [x - 3, y - 18, 17, 17], { k: 2.4 }); B.raw(E(x + 8.6, y - 11, 1.7, 1.7), INK); B.line('M' + (x - 7) + ' ' + (y + 6) + 'C' + (x - 4) + ' ' + (y + 10) + ' ' + (x + 2) + ' ' + (y + 10) + ' ' + (x + 4) + ' ' + (y + 6), 1.6, mix(V.yellow, V.orange, 0.7)); }
    if (id === 'vhs') { y -= 12; B.vol(CH(x - 16, y - 11, 32, 22, 2.5), '#1D1933', [x - 16, y - 11, 32, 22], { k: 2 }); B.raw(RR(x - 13, y - 8, 26, 9, 1.5), V.cream); B.raw('M' + (x - 13) + ' ' + (y - 3.2) + 'H' + (x + 13) + 'V' + (y - 1) + 'H' + (x - 13) + 'Z', V.magenta); B.raw('M' + (x - 13) + ' ' + (y - 5.4) + 'H' + (x + 4) + 'V' + (y - 3.2) + 'H' + (x - 13) + 'Z', V.cyan); B.raw(E(x - 7, y + 5.4, 3.4, 3.4) + E(x + 7, y + 5.4, 3.4, 3.4), V.cream); B.raw(E(x - 7, y + 5.4, 1.3, 1.3) + E(x + 7, y + 5.4, 1.3, 1.3), '#1D1933'); }
    if (id === 'pad') { y -= 11; B.vol('M' + (x - 15) + ' ' + (y - 7) + 'C' + (x - 15) + ' ' + (y - 11) + ' ' + (x + 15) + ' ' + (y - 11) + ' ' + (x + 15) + ' ' + (y - 7) + 'L' + (x + 17) + ' ' + (y + 7) + 'C' + (x + 17) + ' ' + (y + 12) + ' ' + (x + 10) + ' ' + (y + 12) + ' ' + (x + 8) + ' ' + (y + 5) + 'H' + (x - 8) + 'C' + (x - 10) + ' ' + (y + 12) + ' ' + (x - 17) + ' ' + (y + 12) + ' ' + (x - 17) + ' ' + (y + 7) + 'Z', V.cream, [x - 17, y - 10, 34, 22], { k: 2.4 }); B.line('M' + (x - 9) + ' ' + (y - 5) + 'V' + (y + 1) + 'M' + (x - 12) + ' ' + (y - 2) + 'H' + (x - 6), 2.2); B.raw(E(x + 7, y - 4, 2, 2), V.magenta); B.raw(E(x + 11, y - 0.5, 2, 2), V.cyan); }
    if (id === 'roll') { B.vol('M' + (x - 5) + ' ' + (y - 36) + 'H' + (x + 5) + 'V' + (y + 16) + 'H' + (x - 5) + 'Z', '#78A6E6', [x - 5, y - 36, 10, 52], { k: 2 }); B.raw(E(x, y - 36, 5, 2.4), '#CADCF7', { stroke: INK, sw: 2 }); B.line('M' + (x - 5) + ' ' + (y - 20) + 'H' + (x + 5) + 'M' + (x - 5) + ' ' + (y + 4) + 'H' + (x + 5), 1.6, '#2A51BA'); }
  }

  /* ---------- contour shading: one band along the parts of an outline that turn away from the light ----------
     Shapes are filled flat; the shade is a band that hugs the outline, fades in as the outline turns from the light,
     and is switched off where a part is covered (a forearm over an upper arm) or where a joint must stay clean
     (the shoulder above the armpit). No squeezed copies, no rim stripes. */
  function smooth01(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function resamp(P, st) {
    var o = [];
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length], L = v_len(v_sub(b, a));
      if (L < 1e-6) continue;
      for (var k = 0, n = Math.max(1, Math.ceil(L / st)); k < n; k++) o.push(v_lerp(a, b, k / n));
    }
    return o;
  }
  function polyArea(P) { var s = 0; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function polyD(P) { return 'M' + P.map(PT).join('L') + 'Z'; }
  function lineD(P) { return P.length > 1 ? 'M' + P.map(PT).join('L') : ''; }
  function mirP(P) { return P.map(function (p) { return [200 - p[0], p[1]]; }); }
  /* outline of capsule() as points; flat = straight cut at the start instead of a round end */
  function capPoly(a, b, ra, rb, flat) {
    var d = v_unit(v_sub(b, a)), n = v_perp(d), o = [], i, f, st = 0.5;
    var p0 = v_add(a, v_mul(n, ra)), p1 = v_add(b, v_mul(n, rb)), k = Math.max(2, Math.ceil(v_len(v_sub(p1, p0)) / st));
    for (i = 0; i < k; i++) o.push(v_lerp(p0, p1, i / k));
    var kb = Math.max(8, Math.ceil(Math.PI * rb / st));
    for (i = 0; i < kb; i++) { f = Math.PI * i / kb; o.push(v_add(b, v_add(v_mul(n, rb * Math.cos(f)), v_mul(d, rb * Math.sin(f))))); }
    var q0 = v_sub(b, v_mul(n, rb)), q1 = v_sub(a, v_mul(n, ra));
    for (i = 0; i < k; i++) o.push(v_lerp(q0, q1, i / k));
    if (flat) { var kf = Math.max(2, Math.ceil(2 * ra / st)); for (i = 0; i < kf; i++) o.push(v_lerp(q1, p0, i / kf)); }
    else { var ka = Math.max(8, Math.ceil(Math.PI * ra / st)); for (i = 0; i < ka; i++) { f = Math.PI * i / ka; o.push(v_sub(a, v_add(v_mul(n, ra * Math.cos(f)), v_mul(d, ra * Math.sin(f))))); } }
    return o;
  }
  /* signed distance to a capsule [a, b, ra, rb] (< 0 inside) */
  function capDist(p, c) {
    var a = c[0], ab = v_sub(c[1], a), L2 = v_dot(ab, ab), t = L2 ? Math.max(0, Math.min(1, v_dot(v_sub(p, a), ab) / L2)) : 0;
    return v_len(v_sub(p, v_add(a, v_mul(ab, t)))) - (c[2] + (c[3] - c[2]) * t);
  }
  function cband(P, W, o) { return cbandPolys(P, W, o).map(function (Q) { return 'M' + Q.map(PT).join('L') + 'Z'; }).join(''); }
  function cbandPolys(P, W, o) {
    o = o || {};
    var N = P.length; if (N < 6) return [];
    var sg = polyArea(P) > 0 ? 1 : -1, nn = [], w = [], sk = [], ws = [], i, j;
    for (i = 0; i < N; i++) { var t = v_unit(v_sub(P[(i + 2) % N], P[(i - 2 + N) % N])); nn.push(sg > 0 ? [t[1], -t[0]] : [-t[1], t[0]]); }
    for (i = 0; i < N; i++) {
      var f = -v_dot(nn[i], LIGHT), k = smooth01(o.f0 == null ? 0.12 : o.f0, o.f1 == null ? 0.52 : o.f1, f);
      if (o.aniso) k *= 1 - o.aniso * (1 - Math.abs(nn[i][0]));
      if (k > 0 && o.gate) k *= o.gate(P[i], nn[i]);
      w.push(W * k); sk.push(o.skip ? !!o.skip(P[i]) : false);
    }
    for (i = 0; i < N; i++) {
      if (sk[i]) { ws.push(0); continue; }
      var s = 0, c = 0; for (j = -2; j <= 2; j++) { var q = (i + j + N) % N; if (!sk[q]) { s += w[q]; c++; } }
      ws.push(s / c);
    }
    /* never wider than the bend allows: a band round a tight corner thins instead of folding over itself */
    for (i = 0; i < N; i++) {
      if (ws[i] < 0.03) continue;
      var pa = P[(i - 3 + N) % N], pb = P[i], pc = P[(i + 3) % N], ea = v_len(v_sub(pb, pa)), eb = v_len(v_sub(pc, pb)), ec = v_len(v_sub(pc, pa));
      var ar = Math.abs((pb[0] - pa[0]) * (pc[1] - pa[1]) - (pc[0] - pa[0]) * (pb[1] - pa[1])) / 2;
      if (ar > 1e-6) ws[i] = Math.min(ws[i], 0.8 * ea * eb * ec / (4 * ar));
    }
    var s0 = -1; for (i = 0; i < N; i++) if (ws[i] < 0.03) { s0 = i; break; }
    if (s0 < 0) s0 = 0;
    var runs = [], cur = [];
    for (j = 1; j <= N; j++) { i = (s0 + j) % N; if (ws[i] >= 0.03) cur.push(i); else if (cur.length) { runs.push(cur); cur = []; } }
    if (cur.length) runs.push(cur);
    return runs.filter(function (r) { return r.length > 2; }).map(function (r) {
      var idx = [(r[0] - 1 + N) % N].concat(r, [(r[r.length - 1] + 1) % N]), A = [], Q = [];
      idx.forEach(function (q) { var wq = ws[q] < 0.03 ? 0 : ws[q]; A.push(P[q]); Q.push(v_sub(P[q], v_mul(nn[q], wq))); });
      return A.concat(deloop(Q).reverse());
    });
  }
  /* an offset line folds over itself inside a concave corner (an elbow crease): cut the little loop out */
  function deloop(Q) {
    var o = Q.slice(), i, j;
    function hit(a, b, c, d) {
      var r = v_sub(b, a), s = v_sub(d, c), den = r[0] * s[1] - r[1] * s[0];
      if (Math.abs(den) < 1e-9) return null;
      var w = v_sub(c, a), t = (w[0] * s[1] - w[1] * s[0]) / den, u = (w[0] * r[1] - w[1] * r[0]) / den;
      return t > 0 && t < 1 && u > 0 && u < 1 ? v_add(a, v_mul(r, t)) : null;
    }
    for (i = 0; i < o.length - 3; i++) {
      for (j = Math.min(o.length - 2, i + 30); j >= i + 2; j--) {
        var x = hit(o[i], o[i + 1], o[j], o[j + 1]);
        if (x) { o = o.slice(0, i + 1).concat([x], o.slice(j + 1)); break; }
      }
    }
    return o;
  }
  /* the runs of an outline that are not dropped, as open lines (an outline that stops where a part tucks into another) */
  function openD(P, drop) {
    var N = P.length, s0 = -1, i, j, out = '', cur = [];
    for (i = 0; i < N; i++) if (drop(P[i])) { s0 = i; break; }
    if (s0 < 0) return polyD(P);
    for (j = 1; j <= N; j++) { i = (s0 + j) % N; if (!drop(P[i])) cur.push(P[i]); else { if (cur.length > 1) out += lineD(cur); cur = []; } }
    if (cur.length > 1) out += lineD(cur);
    return out;
  }
  function bez(p0, s, t) { var u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * s[0] + 3 * u * t * t * s[2] + t * t * t * s[4], u * u * u * p0[1] + 3 * u * u * t * s[1] + 3 * u * t * t * s[3] + t * t * t * s[5]]; }
  function bezPts(p0, s, t0, t1, n) { var o = []; for (var i = 0; i <= n; i++) o.push(bez(p0, s, t0 + (t1 - t0) * i / n)); return o; }
  /* rightmost x where a polygon / polyline crosses the height y */
  function crossX(P, y, closed) {
    var m = -1e9, n = P.length;
    for (var i = 0; i < (closed ? n : n - 1); i++) { var a = P[i], b = P[(i + 1) % n]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) { var x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); if (x > m) m = x; } }
    return m;
  }
  function centreGate(p) { return smooth01(5, 9, Math.abs(p[0] - 100)); }

  /* ======================= BODY 9: Site Block =======================
     Board units, no transform. The accent every avatar speaks (DESIGN_LANGUAGE.md):
     boxy workwear on a slim frame. Garments are rounded blocks with straight sides; the body that shows
     (neck, wrists, hands, bare arms) is slim and organic. Straight against curve, nothing parallel,
     crisp elbows, the shoulder corner IS the sleeve head (no ball joints).
     Proportion (H = 85, skull to chin): head 1.00 · neck 0.10 · torso 0.81 · legs 0.93. */
  var B9 = { K: [64.6, 116], RK: 8, NS: [87.6, 100.8], HC: [61.8, 168.4], HEM: 170.2, LW: 3.6, IL: 1.3 };
  function lineDist(p, L) {
    var m = 1e9;
    for (var i = 0; i < L.length - 1; i++) {
      var a = L[i], ab = v_sub(L[i + 1], a), L2 = v_dot(ab, ab), t = L2 ? Math.max(0, Math.min(1, v_dot(v_sub(p, a), ab) / L2)) : 0;
      m = Math.min(m, v_len(v_sub(p, v_add(a, v_mul(ab, t)))));
    }
    return m;
  }
  function polyEdgeDist(p, P) {
    var m = 1e9;
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length], ab = v_sub(b, a), L2 = v_dot(ab, ab), t = L2 ? Math.max(0, Math.min(1, v_dot(v_sub(p, a), ab) / L2)) : 0;
      m = Math.min(m, v_len(v_sub(p, v_add(a, v_mul(ab, t)))));
    }
    return m;
  }
  function stripD(P, w, off) {
    var Lp = [], Rp = [];
    for (var i = 0; i < P.length; i++) {
      var dir = v_unit(v_sub(P[Math.min(i + 1, P.length - 1)], P[Math.max(i - 1, 0)])), n = v_perp(dir), c = v_add(P[i], v_mul(n, off || 0));
      Lp.push(v_add(c, v_mul(n, w / 2))); Rp.push(v_sub(c, v_mul(n, w / 2)));
    }
    return P.length > 1 ? 'M' + Lp.map(PT).join('L') + 'L' + Rp.reverse().map(PT).join('L') + 'Z' : '';
  }
  /* an open outline as a filled band with square ends, so where a part is cut (a forearm going into a pocket,
     an arm passing in front of the head) the outline stops exactly at the cut instead of a round cap poking past it */
  function strokeStrip(P, w, cut) {
    var N = P.length, h = w / 2, Lp = [], Rp = [];
    if (N < 2) return '';
    for (var i = 0; i < N; i++) {
      var na = i > 0 ? v_perp(v_unit(v_sub(P[i], P[i - 1]))) : null, nb = i < N - 1 ? v_perp(v_unit(v_sub(P[i + 1], P[i]))) : null, n, s = 1;
      if (!na) n = nb; else if (!nb) n = na;
      else { var m = v_add(na, nb); if (v_len(m) < 1e-6) n = na; else { n = v_unit(m); s = Math.min(2, 1 / Math.max(0.5, v_dot(n, na))); } }
      if (cut && (i === 0 || i === N - 1)) {
        /* the end lies along the cut itself: offset along the cut so the band is still h from the edge */
        var cr = Math.abs(n[0] * cut[0] + n[1] * cut[1]);
        n = v_dot(cut, n) > 0 ? cut : v_mul(cut, -1); s = 1 / Math.max(0.3, cr);
      }
      Lp.push(v_add(P[i], v_mul(n, h * s))); Rp.push(v_sub(P[i], v_mul(n, h * s)));
    }
    return 'M' + Lp.map(PT).join('L') + 'L' + Rp.reverse().map(PT).join('L') + 'Z';
  }
  /* an open outline that ends on cuts: square-ended bands for the last 2.6 units at each cut end, a normal
     round-joined stroke for the rest (a mitred band spikes at sharp corners such as a thumb) */
  function openOutline(P, w, cut, c) {
    var N = P.length, a = 0, b = N - 1, L = 0;
    while (a < N - 2 && L < 2.6) { L += v_len(v_sub(P[a + 1], P[a])); a++; }
    L = 0; while (b > a + 1 && L < 2.6) { L += v_len(v_sub(P[b], P[b - 1])); b--; }
    return [pe(lineD(P.slice(a, b + 1)), 'none', c, w), pe(strokeStrip(P.slice(0, a + 1), w, cut) + strokeStrip(P.slice(b), w, cut), c)];
  }
  function tangentPt(J, r, P, upper) {
    var v = v_sub(P, J), D = v_len(v), a0 = Math.atan2(v[1], v[0]), da = Math.acos(Math.min(1, r / D)), a = upper ? a0 - da : a0 + da;
    return { p: [J[0] + r * Math.cos(a), J[1] + r * Math.sin(a)], a: a };
  }
  function arcPts(C, r, a1, a2, n) { var o = []; for (var k = 0; k <= n; k++) { var a = a1 + (a2 - a1) * k / n; o.push([C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)]); } return o; }
  /* where a polyline first crosses x = v (axis 0) or y = v (axis 1), from index i0: { i: segment start, p: point } */
  function crossAt(P, v, axis, i0) {
    for (var i = i0 || 0; i < P.length - 1; i++) {
      var a = P[i][axis] - v, b = P[i + 1][axis] - v;
      if (a === 0) return { i: i, p: P[i].slice() };
      if ((a < 0) !== (b < 0)) return { i: i, p: v_lerp(P[i], P[i + 1], a / (a - b)) };
    }
    return null;
  }
  /* the first crossing of polyline A with polyline B */
  function polyX(A, B) {
    for (var i = 0; i < A.length - 1; i++) for (var j = 0; j < B.length - 1; j++) {
      var x = segX(A[i], A[i + 1], B[j], B[j + 1]);
      if (x && x.t >= 0 && x.t <= 1 && x.u >= 0 && x.u <= 1) return { ia: i, ib: j, p: x.p };
    }
    return null;
  }
  /* the part of a polygon on the near side of the line through a with normal n (dot(p - a, n) <= 0) */
  function clipHalf(P, a, n) {
    var o = [], N = P.length;
    for (var i = 0; i < N; i++) {
      var p = P[i], q = P[(i + 1) % N], dp = v_dot(v_sub(p, a), n), dq = v_dot(v_sub(q, a), n);
      if (dp <= 0) o.push(p);
      if ((dp <= 0) !== (dq <= 0)) o.push(v_lerp(p, q, dp / (dp - dq)));
    }
    return o;
  }
  /* the garment block, left half: crew neck, a firm shoulder line onto the corner, straight tapering side, square hem */
  function blockHalf(o) {
    o = o || {};
    var K = B9.K, r = B9.RK, NS = B9.NS, HC = o.hc || B9.HC, hem = o.hem || B9.HEM;
    var t1 = tangentPt(K, r, NS, true), t2 = tangentPt(K, r, HC, false), a1 = t1.a, a2 = t2.a;
    /* round the outside of the corner: from the top tangent, anticlockwise on screen, to the side tangent */
    while (a2 > a1) a2 -= 2 * Math.PI;
    while (a2 < a1 - 2 * Math.PI) a2 += 2 * Math.PI;
    var dir = v_unit(v_sub(t1.p, NS)), c2 = v_sub(t1.p, v_mul(dir, 8.5));
    var P = bezPts([100, o.neck || 106], [95.2, o.neck || 106, 90.6, (o.neck || 106) - 1.6, NS[0], NS[1]], 0, 1, 10);
    P = P.concat(bezPts(NS, [80.6, 101.6, c2[0], c2[1], t1.p[0], t1.p[1]], 0, 1, 22).slice(1));
    var side = [], k, top = t2.p;
    if (o.pit) {
      /* a raised arm: the corner gives way to the hollow of the armpit */
      var sy = Math.min(o.pit[1] + 13, HC[1] - 12), sx = t2.p[0] + (HC[0] - t2.p[0]) * (sy - t2.p[1]) / (HC[1] - t2.p[1]);
      P.push(o.pit);
      P = P.concat(bezPts(o.pit, [o.pit[0] - 2.4, o.pit[1] + 6.6, sx + 0.6, sy - 6.4, sx, sy], 0, 1, 12).slice(1));
      top = [sx, sy];
    } else P = P.concat(arcPts(K, r, a1, a2, 16).slice(1));
    for (k = 1; k <= 16; k++) side.push(v_lerp(top, [HC[0], HC[1] - 2.4], k / 16));
    P = P.concat(side);
    P = P.concat(bezPts([HC[0], HC[1] - 2.4], [HC[0] + 0.1, HC[1] - 0.6, HC[0] + 1, HC[1], HC[0] + 2.6, HC[1]], 0, 1, 5).slice(1));
    P = P.concat(bezPts([HC[0] + 2.6, HC[1]], [76, HC[1] + 0.9, 90, hem, 100, hem], 0, 1, 12).slice(1));
    return P;
  }
  function sym(H) { return H.concat(mirP(H).reverse().slice(1, -1)); }
  var BLOCK9 = sym(blockHalf()), BLOCK9D = polyD(BLOCK9), BLOCK9R = resamp(BLOCK9, 0.6);

  /* ---- limbs: polygons from two profiles; the elbow is a crisp corner outside and a clean crease inside ---- */
  function segEdge(a, b, n, wf, k) {
    var o = [], d = v_sub(b, a);
    for (var i = 0; i <= k; i++) { var t = i / k; o.push(v_add(v_add(a, v_mul(d, t)), v_mul(n, wf(t)))); }
    return o;
  }
  function segX(p, p2, q, q2) {
    var r = v_sub(p2, p), s = v_sub(q2, q), den = r[0] * s[1] - r[1] * s[0];
    if (Math.abs(den) < 1e-9) return null;
    var w = v_sub(q, p), t = (w[0] * s[1] - w[1] * s[0]) / den, u = (w[0] * r[1] - w[1] * r[0]) / den;
    return { t: t, u: u, p: v_add(p, v_mul(r, t)) };
  }
  function joinEdges(A, B, rad) {
    var i, j, x;
    for (i = A.length - 2; i >= 0; i--) {
      for (j = 0; j < B.length - 1; j++) {
        x = segX(A[i], A[i + 1], B[j], B[j + 1]);
        if (x && x.t >= 0 && x.t <= 1 && x.u >= 0 && x.u <= 1) return { P: A.slice(0, i + 1).concat([x.p], B.slice(j + 1)), crease: x.p };
      }
    }
    var a0 = A[A.length - 2], a1 = A[A.length - 1], b0 = B[0], b1 = B[1];
    x = segX(a0, a1, b0, b1);
    if (x && x.t > 1 && x.u < 0) {
      var X = x.p, da = v_len(v_sub(X, a1)), db = v_len(v_sub(X, b0));
      if (da < 10 && db < 10) {
        var c = Math.min(rad, da + 0.01, db + 0.01), p = v_add(X, v_mul(v_unit(v_sub(a1, X)), c)), q = v_add(X, v_mul(v_unit(v_sub(b0, X)), c)), arc = [];
        for (var k = 0; k <= 6; k++) { var t = k / 6, u = 1 - t; arc.push([u * u * p[0] + 2 * u * t * X[0] + t * t * q[0], u * u * p[1] + 2 * u * t * X[1] + t * t * q[1]]); }
        return { P: A.concat(da > c + 0.05 ? arc : arc.slice(1), db > c + 0.05 ? B : B.slice(1)), corner: X };
      }
    }
    return { P: A.concat(B) };
  }
  /* sleeve: boxy, the outer side drapes a touch, the inner side is straight; bare arm: slim, a curve on the outer side */
  var PROF9 = {
    sleeve: { ua: [function (t) { return 8 + 0.2 * t + 0.5 * Math.sin(Math.PI * t); }, function (t) { return 8 - 0.3 * t; }],
      fa: [function (t) { return 8.1 - 0.7 * t + 0.35 * Math.sin(Math.PI * t); }, function (t) { return 7.7 - 0.6 * t; }] },
    bare: { ua: [function (t) { return 4.6 - 0.4 * t + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.25)); }, function (t) { return 4.6 - 0.35 * t; }],
      fa: [function (t) { return 3.4 + 0.9 * (1 - t) + 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.8)); }, function (t) { return 3.3 + 0.85 * (1 - t); }] }
  };
  /* one arm as one polygon: root cap (inside the shoulder corner), upper part, elbow, forearm, square cut at the wrist */
  function limb9(A, prof, t0, rootR, cutEnd, flat) {
    var side = A.s === 'L' ? 1 : -1, J0 = v_lerp(A.J, A.E, t0 || 0);
    var d1 = v_unit(v_sub(A.E, A.J)), d2 = v_unit(v_sub(A.W, A.E)), n1 = v_mul(v_perp(d1), side), n2 = v_mul(v_perp(d2), side);
    var W = v_sub(A.W, v_mul(d2, cutEnd || 0)), tt = t0 || 0;
    var ua = function (f) { return function (t) { return f(tt + (1 - tt) * t); }; };
    var latA = segEdge(J0, A.E, n1, ua(prof.ua[0]), 22), medA = segEdge(J0, A.E, v_mul(n1, -1), ua(prof.ua[1]), 22);
    var latB = segEdge(A.E, W, n2, prof.fa[0], 20), medB = segEdge(A.E, W, v_mul(n2, -1), prof.fa[1], 20);
    var lat = joinEdges(latA, latB, 1.5), med = joinEdges(medA, medB, 1.5);
    var r = rootR || prof.ua[0](tt), s0 = v_sub(medA[0], J0), s1 = v_sub(latA[0], J0), b0 = Math.atan2(s0[1], s0[0]), b1 = Math.atan2(s1[1], s1[0]), mid = Math.atan2(-d1[1], -d1[0]);
    var dd = b1 - b0; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI;
    var via = mid - b0; while (via > Math.PI) via -= 2 * Math.PI; while (via < -Math.PI) via += 2 * Math.PI;
    if ((dd > 0) !== (via > 0)) dd = dd > 0 ? dd - 2 * Math.PI : dd + 2 * Math.PI;
    var cap = [];
    if (!flat) {
      /* a raised arm: no round under the root (the armpit is a hollow), the cap only rounds the top */
      var a0 = b0, span = dd;
      if (d1[1] < 0.62 && !tt) { var back = mid - b0; while (back > Math.PI) back -= 2 * Math.PI; while (back < -Math.PI) back += 2 * Math.PI; a0 = b0 + back; span = dd - back; }
      for (var k = a0 === b0 ? 1 : 0; k < 16; k++) { var a = a0 + span * k / 16; cap.push([J0[0] + r * Math.cos(a), J0[1] + r * Math.sin(a)]); }
    }
    return { P: lat.P.concat(med.P.slice().reverse(), cap), nLat: lat.P.length, J0: J0, crease: lat.crease || med.crease, corner: lat.corner || med.corner, W: W, d2: d2, n2: n2 };
  }
  /* a short sleeve: boxy tube from the corner to mid upper arm, flared hem */
  function shortSleeve9(A) {
    var side = A.s === 'L' ? 1 : -1, d = v_unit(v_sub(A.E, A.J)), n = v_mul(v_perp(d), side), S = v_lerp(A.J, A.E, 0.5);
    var lat = segEdge(A.J, S, n, function (t) { return 8 + 1.3 * t + 0.3 * Math.sin(Math.PI * t); }, 12), med = segEdge(A.J, S, v_mul(n, -1), function (t) { return 8 + 0.9 * t; }, 12);
    var hc = v_add(S, v_mul(d, 1.2)), h0 = lat[lat.length - 1], h1 = med[med.length - 1], hem = [];
    for (var k = 1; k < 10; k++) { var t = k / 10, u = 1 - t; hem.push([u * u * h0[0] + 2 * u * t * hc[0] + t * t * h1[0], u * u * h0[1] + 2 * u * t * hc[1] + t * t * h1[1]]); }
    var s0 = v_sub(med[0], A.J), b0 = Math.atan2(s0[1], s0[0]), mid = Math.atan2(-d[1], -d[0]), dd = mid - b0;
    while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI;
    var cap = []; for (k = 1; k < 16; k++) { var a = b0 + 2 * dd * k / 16; cap.push([A.J[0] + B9.RK * Math.cos(a), A.J[1] + B9.RK * Math.sin(a)]); }
    return { P: lat.concat(hem, med.slice().reverse(), cap), hem: [h0].concat(hem, [h1]) };
  }

  /* hands, in hand space: +y from the wrist to the fingertips, +x the thumb side (board units) */
  /* hands, in hand space: +y from the wrist to the fingertips, +x the thumb side (board units).
     Every hand grows out of the wrist at the bare forearm's own width (3.35 a side at y = 0) and starts inside
     the forearm, which is drawn over it: arm and hand are one silhouette, no cut line, no mitten step.
     Fingertips are scalloped and split by short lines; the thumb is its own lobe. */
  var WR = 'M-3.35 -2.5L-3.35 0', WRE = 'L3.35 0L3.35 -2.5Z';
  var TIPS = 'C-4.9 13.4 -4.2 14.8 -3.2 15.2Q-2.6 16.6 -1.2 16.9Q-0.2 17.9 1.2 17.6Q2.4 17.9 3.3 16.6C4.3 16.2 4.9 15 5 13.6';
  var HAND9 = {
    relax: { b: WR + 'C-3.4 1.8 -4.4 3 -4.7 5.2L-4.9 11.6' + TIPS + 'L5.1 12.2C6.4 12.4 7.6 11.6 7.9 9.8C8.2 7.6 7.4 5 5.6 3.6C4.6 2.8 3.5 1.6 3.35 0' + WRE,
      l: 'M5.1 12.2C4.4 10.2 4.4 7.6 5.4 5.6M-3.2 15.2L-3 12.6M-1.2 16.9L-1.1 13.8M1.2 17.6L1.1 14.4',
      t: 'M3.4 2.4C6.2 3 7.8 6 7.4 9.2C7.1 11.2 5.6 12 4.4 11.2C3.5 10.6 3.2 9.4 3.3 8Z' },
    hold: { b: WR + 'C-3.4 1.8 -4.4 3 -4.7 5.2L-4.9 11.6' + TIPS + 'L5.1 7.6C5 5 3.6 2.4 3.35 0' + WRE,
      l: 'M-3.2 15.2L-3 12.6M-1.2 16.9L-1.1 13.8M1.2 17.6L1.1 14.4' },
    open: { b: WR + 'C-3.5 2 -4.6 3.6 -4.9 6L-5.3 13.4Q-5.4 15.8 -4 15.9Q-2.8 15.9 -2.8 14.2L-2.8 16.6Q-2.8 18.6 -1.4 18.6Q0 18.6 -0.1 16.8L0 17.2Q0 19.2 1.5 19.2Q3 19.2 2.9 17.2L2.9 16.2Q3 18 4.3 18Q5.6 17.9 5.6 15.9L5.4 8.4Q6.4 9.6 7.4 11Q8.4 12.2 9.4 11.4Q10.2 10.6 9.4 9.2Q8.2 6.6 6.8 4.4Q5.6 2.2 4.6 1.4Q3.5 0.8 3.35 0' + WRE,
      l: 'M-2.8 14.2L-2.8 11.4M-0.1 16.8L0 13.4M2.9 16.2L2.9 13M5.4 8.4C4.8 6.8 4.6 5 5 3.6' },
    point: { b: WR + 'C-3.5 1.8 -4.6 3 -4.8 5.2L-5 9.4Q-5 12.2 -3.6 13.6Q-2.6 14.6 -1.2 14.4Q0 14.8 0.8 14.2L1 21.6Q1.1 23.8 2.8 23.8Q4.6 23.8 4.6 21.6L4.8 8.4Q6.4 7.8 7.2 6.4Q7.8 4.8 7 3.4Q6 2.2 4.6 2.6Q3.5 1.4 3.35 0' + WRE,
      l: 'M-2.4 13.9L-2.4 11.2M0.8 14.2L0.8 11.6M4.6 8.2C3.8 7 3.6 5.2 4.2 3.8' },
    fist: { b: WR + 'C-3.5 1.8 -4.6 3 -4.8 5.2L-5 9.6Q-5 12.4 -3.6 13.8Q-2.6 14.8 -1.2 14.6Q0 15.2 1.2 14.6Q2.6 15 3.6 13.8Q5 12.4 5.1 10L5.1 8.4Q6.6 8 7.4 6.6Q8 5 7.2 3.6Q6.2 2.2 4.6 2.6Q3.5 1.4 3.35 0' + WRE,
      l: 'M-2.4 14.2L-2.4 11.6M0 14.9L0 12M2.4 14.4L2.4 11.8M5.1 8.4C4.2 7.2 4 5.4 4.6 4' },
    grip: { b: WR + 'C-3.5 2 -4.6 3.6 -4.9 6.2L-5 10.2Q-5 13.4 -3.4 14.8Q-2.4 15.6 -1 15.4Q0.2 16 1.4 15.4Q2.8 15.6 3.8 14.4Q5 12.8 5 10.4L4.8 6Q4.6 2.6 3.35 0' + WRE,
      l: 'M-2.6 14.8L-2.6 11.6M0.2 15.6L0.2 12.2M2.8 15L2.8 11.8' }
  };
  /* a bare arm and its hand as ONE polygon: the hand's outline replaces the square end of the forearm,
     so fill, outline, shade and overlap lines all run round a single silhouette (no wrist seam) */
  function withHand(L, A) {
    var hd = HAND9[A.hand]; if (!hd) return L.P;
    var H = pathPts(xform(hd.b, A.m)).filter(function (p) { return v_dot(v_sub(p, A.W), A.d) > -0.05; });
    var le = L.P[L.nLat - 1];
    if (v_len(v_sub(H[0], le)) > v_len(v_sub(H[H.length - 1], le))) H.reverse();
    return L.P.slice(0, L.nLat).concat(H, L.P.slice(L.nLat));
  }
  function hmat9(W, d, hint) { d = v_unit(d); var p = v_perp(d); if (v_dot(p, hint) < 0) p = v_mul(p, -1); return [p[0], p[1], d[0], d[1], W[0], W[1]]; }

  /* poses: K is the shoulder pivot (the centre of the shoulder corner), E elbow, W wrist; L = viewer's left */
  var K9L = B9.K, K9R = [200 - B9.K[0], B9.K[1]];
  var STAND9 = { L: [K9L[0], K9L[1], 63.4, 145.6, 65.6, 172.6], R: [K9R[0], K9R[1], 137.4, 145.8, 131.6, 171.8] };
  var POSE9 = {
    stand: {},
    wave: { R: { j: [K9R[0], K9R[1], 163.2, 127.4, 168.6, 100.6], hand: 'open' } },
    point: { R: { j: [K9R[0], K9R[1], 156.4, 136.6, 180.6, 129.6], hand: 'point', hint: [0, -1] } },
    phone: { R: { j: [K9R[0], K9R[1], 161.4, 110.6, 150.4, 86.4], fore: 'over', hand: 'fist', hint: [-1, 0] } },
    arms: { L: { j: [K9L[0], K9L[1], 66.4, 147.4, 131.4, 138.7], hand: 'none' }, R: { j: [K9R[0], K9R[1], 133.6, 147.4, 78.6, 140.2], hand: 'grip', hint: [0, -1] }, cross: true },
    tablet: { L: { j: [K9L[0], K9L[1], 59.6, 145.2, 82.6, 154.6], hand: 'relax', hint: [0, -1] }, R: { j: [K9R[0], K9R[1], 140.4, 145.2, 117.4, 154.6], hand: 'relax', hint: [0, -1] }, prop: 'tablet' },
    pockets: { L: { j: [K9L[0], K9L[1], 55.4, 145.2, 71.6, 176.4], hand: 'none' }, R: { j: [K9R[0], K9R[1], 144.6, 145.2, 128.4, 176.4], hand: 'none' }, pockets: true }
  };

  /* lines where a part lies over parts already drawn, just outside the part's edge.
     o.mute(p) drops soft points and o.fade(p) tapers them (a crease that grows out of the armpit);
     o.hard: polygons of another colour under the part (a vest) - over them the line is the boundary of two
     garments, so it runs at full width with square ends, and when only shoulder (o.lead) comes before it
     the line starts exactly there, continuing that garment's own edge;
     o.min drops soft runs shorter than this (a stray tick where an arm leaves the body); o.w width */
  function overLines(list, P, under, c, o) {
    o = o || {};
    var Q = resamp(P, 0.5), N = Q.length, W = o.w || B9.IL, hard = o.hard || [], i, j, k;
    var sg = polyArea(Q) > 0 ? 1 : -1, NO = [];
    for (i = 0; i < N; i++) { var t = v_unit(v_sub(Q[(i + 1) % N], Q[(i - 1 + N) % N])); NO.push(sg > 0 ? [t[1], -t[0]] : [-t[1], t[0]]); }
    var hd = Q.map(function (p, i) { var q = v_add(p, v_mul(NO[i], 0.9)); for (var k = 0; k < hard.length; k++) if (inPoly(q, hard[k])) return true; return false; });
    var ins = Q.map(function (p, i) {
      if (!hd[i] && o.mute && o.mute(p)) return false;
      for (var k = 0; k < under.length; k++) if (inPoly(p, under[k]) && polyEdgeDist(p, under[k]) > 0.7) return true;
      return false;
    });
    var s0 = -1;
    for (i = 0; i < N; i++) if (!ins[i]) { s0 = i; break; }
    if (s0 < 0) { list.push(pe(polyD(Q), 'none', c, W)); return; }
    var run = [];
    function flush() {
      if (run.length < 3) { run = []; return; }
      var h = -1;
      for (k = 0; k < run.length; k++) if (hd[run[k]]) { h = k; break; }
      if (h > 0 && o.lead && run.slice(0, h).every(function (q) { return o.lead(Q[q]); })) run = run.slice(h);
      var tot = 0;
      for (k = 1; k < run.length; k++) tot += v_len(v_sub(Q[run[k]], Q[run[k - 1]]));
      var crease = !o.tick || o.tick(Q[run[0]]) || o.tick(Q[run[run.length - 1]]);
      if (run.length < 3 || (h < 0 && o.min && crease && tot < o.min)) { run = []; return; }
      var h0 = hd[run[0]], h1 = hd[run[run.length - 1]], Lp = [], Rp = [], acc = 0;
      for (k = 0; k < run.length; k++) {
        var q = run[k], p = Q[q];
        if (k) acc += v_len(v_sub(p, Q[run[k - 1]]));
        var e = Math.min(1, h0 ? 1 : acc / 1.2 + 0.5, h1 ? 1 : (tot - acc) / 1.2 + 0.5), f = hd[q] || !o.fade ? 1 : o.fade(p);
        Lp.push(p); Rp.push(v_add(p, v_mul(NO[q], W * e * f)));
      }
      list.push(pe('M' + Lp.map(PT).join('L') + 'L' + Rp.reverse().map(PT).join('L') + 'Z', c));
      run = [];
    }
    for (j = 1; j <= N; j++) { i = (s0 + j) % N; if (ins[i]) run.push(i); else flush(); }
    flush();
  }
  var NECK9 = 'M89.6 76C90 84 90.2 90 89.8 94.2C89.5 97.4 88.6 99.8 87.2 101.8L112.8 101.8C111.4 99.8 110.5 97.4 110.2 94.2C109.8 90 110 84 110.4 76Z';
  var NECK9SH = 'M104.8 76L110.4 76C110 84 109.8 90 110.2 94.2C110.5 97.4 111.4 99.8 112.8 101.8L105.8 101.8C106.2 93.6 105.8 84.6 104.8 76Z';
  var NECK9JAW = 'M89.8 85.6L110.2 85.6L110.2 91C104.4 93.4 95.6 93.4 89.8 91Z';
  /* straight trousers: the outer side straight, the inner side curved; an easy A stance */
  var LEG9 = (function () {
    var P = [[62.8, 160], [99.8, 160], [99.8, 173.4]];
    P = P.concat(bezPts([99.8, 173.4], [98.8, 189, 92, 209, 89, 230.6], 0, 1, 20).slice(1));
    P.push([65.2, 230.6]);
    return P;
  })();
  var BOOT9 = (function () {
    var P = [[64.6, 226.6], [89.4, 226.6], [89.8, 234.2]];
    P = P.concat(bezPts([89.8, 234.2], [91.2, 237.4, 94, 238.8, 94.2, 243.8], 0, 1, 8).slice(1));
    P.push([60.2, 243.8]);
    P = P.concat(bezPts([60.2, 243.8], [60.2, 239.6, 62.6, 237.4, 64.2, 234.2], 0, 1, 8).slice(1));
    return P;
  })();
  var SOLE9 = [[59.4, 243.2], [95, 243.2], [95, 248.2], [94, 249.4], [60.4, 249.4], [59.4, 248.2]];

  /* sample an absolute M/L/C/Q/Z path into a polygon */
  function pathPts(d) {
    var tk = d.match(/[MLCQZ]|-?\d*\.?\d+/g) || [], i = 0, P = [], cur = [0, 0], cmd = '', n = function () { return +tk[i++]; };
    while (i < tk.length) {
      if (/[MLCQZ]/.test(tk[i])) cmd = tk[i++];
      if (cmd === 'Z') { continue; }
      if (cmd === 'M' || cmd === 'L') { cur = [n(), n()]; P.push(cur); }
      else if (cmd === 'C') { var c1 = [n(), n()], c2 = [n(), n()], e = [n(), n()]; P = P.concat(bezPts(cur, [c1[0], c1[1], c2[0], c2[1], e[0], e[1]], 0, 1, 8).slice(1)); cur = e; }
      else if (cmd === 'Q') { var q = [n(), n()], e2 = [n(), n()]; for (var k = 1; k <= 8; k++) { var t = k / 8, u = 1 - t; P.push([u * u * cur[0] + 2 * u * t * q[0] + t * t * e2[0], u * u * cur[1] + 2 * u * t * q[1] + t * t * e2[1]]); } cur = e2; }
      else i++;
    }
    return P;
  }
  var BLOCK9L = sym(blockHalf({ hem: 174, hc: [61.2, 172.4] })), BLOCK9S = sym(blockHalf({ hem: 160.6, hc: [62.6, 159.6] }));
  /* the hi-vis vest, left half, cut from the pose's own block: the strap lies on the shoulder line, the armhole
     drops clear of the sleeve head in every pose (it meets a hanging sleeve at the armpit, r = 11), the side and
     hem ARE the block's (no slivers of the shirt at the side or the hem), then the opening and the V */
  var VARM9 = bezPts([76.6, 103.5], [76.4, 110.5, 75.2, 119.4, 70.8, 126.6], 0, 1, 14).concat(bezPts([70.8, 126.6], [66.4, 133.8, 60, 136.6, 48, 138.6], 0, 1, 14).slice(1));
  function vest9(H) {
    var a = crossAt(H, 90.4, 0), b = crossAt(H, 76.6, 0);
    var top = [a.p].concat(H.slice(a.i + 1, b.i + 1), [b.p]);
    var arm = [b.p].concat(VARM9.slice(1)), rest = H.slice(b.i + 1), x = polyX(arm, rest);
    var hole = arm.slice(0, x.ia + 1).concat([x.p]);
    var down = rest.slice(x.ib + 1), hc = crossAt(down, 95.6, 0);
    var side = [x.p].concat(down.slice(0, hc.i + 1), [hc.p]);
    var V = bezPts([95.6, 121.4], [95.4, 113.4, 93.6, 106.6, a.p[0], a.p[1]], 0, 1, 10);
    return { P: top.concat(hole.slice(1), side.slice(1), [[95.6, 121.4]], V.slice(1, -1)), hole: hole, open: [hc.p].concat(V), side: side };
  }
  /* the overall: a straight bib on the chest, and below the waist a panel that IS the block (side and hem) */
  function bib9(BL) {
    var l = crossAt(BL, 150.4, 1), r = crossAt(BL, 150.4, 1, l.i + 1);
    var low = [l.p].concat(BL.slice(l.i + 1, r.i + 1), [r.p]);
    var P = [[79.4, 127.4], [120.6, 127.4], [121.4, 148.6], [121.6, 149.7], [122.2, 150.3], [123.2, 150.4]];
    P = P.concat(low.slice().reverse(), [[76.8, 150.4], [77.8, 150.3], [78.4, 149.7], [78.6, 148.6]]);
    return { P: P, low: low };
  }
  var DRAPE9 = 'M74.4 104.4C79 95.6 89 90.4 100 90.4C111 90.4 121 95.6 125.6 104.4L129.4 117.4C122.6 125.8 112 130.2 100 130.2C88 130.2 77.4 125.8 70.6 117.4Z';
  function garment9(g, top, tc, F, H) {
    var lc = LC(tc), lt = mix(tc, '#FFFFFF', 0.14), dk = shadeOf(tc), W = 0.9;
    function two(d, fill, stroke, sw) { F.push(pe(d + M(d), fill, stroke || 'none', sw || 0)); }
    if (top === 'tee') { two('M86.4 100.4C89.6 105.6 94.6 107.8 100 107.8', 'none', dk, 2.4); two('M86.4 100.4C89.6 105.6 94.6 107.8 100 107.8', 'none', lc, 0.7); }
    if (top === 'polo') {
      F.push(pe('M97.6 107.2H102.4V122.6H97.6Z', dk, lc, 0.7));
      F.push(pe(E(100, 112.4, 0.85, 0.85) + E(100, 118, 0.85, 0.85), mix(tc, '#FFFFFF', 0.55)));
      two('M87.2 100.2C89.2 104.6 94 107.8 99.8 108.8L94.8 115C91 113.4 87.6 110 85.6 105.6Z', lt, lc, W);
    }
    if (top === 'jacket') {
      F.push(pe('M100 109V166', 'none', lc, W));
      F.push(pe(RR(99, 110.2, 2, 3.6, 0.6), '#C9CDD3', lc, 0.5));
      two(RR(72.4, 123, 15, 13, 1.6), mix(tc, '#20182E', 0.04), lc, W);
      two('M72.4 123H87.4V128H72.4Z', dk, lc, W);
      F.push(pe(E(79.9, 125.6, 0.75, 0.75) + E(120.1, 125.6, 0.75, 0.75), mix(tc, '#20182E', 0.45)));
      F.push(pe('M62.6 164.4C80 165.8 120 165.8 137.4 164.4', 'none', lc, 0.8));
      two('M87.4 100C90.4 104.4 95.6 107.8 100.4 109L93.4 117.6C89.2 115.4 86 111.2 84.6 105.8Z', lt, lc, W);
    }
    if (top === 'hoodie') {
      F.push(pe('M79.6 141.4H120.4L124.4 161H75.6Z', mix(tc, '#20182E', 0.07), lc, W));
      two('M79.6 141.4L75.6 161', 'none', lc, 1.5);
      F.push(pe('M62.6 164.6C80 166 120 166 137.4 164.6', 'none', lc, 0.8));
      var hood = 'M84.2 100.2C81.8 106.6 85.4 113.2 92.6 116.6C95.2 117.8 97.6 118.4 100 118.4C102.4 118.4 104.8 117.8 107.4 116.6C114.6 113.2 118.2 106.6 115.8 100.2L111.6 101C112.2 106 107 111 100 111C93 111 87.8 106 88.4 101Z';
      F.push(pe(hood, mix(tc, '#20182E', 0.1), lc, W));
      var ds = mix(tc, '#FFFFFF', 0.6);
      two('M95.4 113.4C95.2 118 94.8 123 95 129', 'none', ds, 0.9);
      two(RR(94.2, 128.4, 1.6, 3, 0.6), ds, LC(ds), 0.4);
    }
    if (top === 'overalls') {
      var bb = bib9(H.BL), bd = polyD(bb.P);
      F.push(pe(bd, tc)); F.push(pe(cband(resamp(bb.P, 0.6), 4, { aniso: 0.5, gate: centreGate }), dk));
      /* only the edges that lie inside the silhouette get a line: the bib and the top of the waist panel */
      F.push(pe(lineD(bb.P.slice(bb.P.length - 5).concat(bb.P.slice(0, 7))), 'none', lc, B9.IL));
      F.push(pe('M80.2 130.2H119.8', 'none', mix(tc, '#FFFFFF', 0.3), 0.5));
      two('M80.6 103.4L86.2 101.8L86.4 128L80.6 128Z', tc, lc, 0.8);
      two(E(83.5, 128.6, 1.4, 1.4), '#E2B23E', LC('#E2B23E'), 0.6);
      F.push(pe(RR(91.2, 134.2, 17.6, 11.4, 1.4), dk, lc, 0.8));
      F.push(pe('M92.8 136.4H107.2', 'none', mix(tc, '#FFFFFF', 0.3), 0.5));
      two(E(65.4, 155.6, 1, 1), '#E2B23E', LC('#E2B23E'), 0.5);
    }
    if (top === 'shirt') {
      F.push(pe('M100 147.6V160', 'none', LC('#F3F0EA'), 0.6));
      F.push(pe(E(100, 153.6, 0.7, 0.7), mix('#F3F0EA', '#20182E', 0.25)));
      F.push(pe('M98.6 111.6H101.4L103.8 143.4L100 147.8L96.2 143.4Z', tc, lc, 0.7));
      F.push(pe('M100 111.8H101.3L103.5 143.4L100 147.4Z', dk));
      F.push(pe('M97.6 107.2H102.4L101.4 111.8H98.6Z', tc, lc, 0.7));
      two('M87.6 100.4C89.6 103.8 94 106.8 99.6 108.2L95 113.6L86.8 105.2Z', '#FFFFFF', LC('#F3F0EA'), W);
    }
    if (top === 'blazer') {
      two('M88 100.6C90 103.8 94.6 106.4 99.8 107.6L96.2 111.8L87.4 104.4Z', '#FFFFFF', LC('#F3F0EA'), 0.7);
      /* the panels are cut from the pose's block, so a raised arm's armpit hollow is the panel's too */
      var panelOf = function (h) { return [[88.6, 101.2]].concat(h.slice(10).filter(function (p) { return p[0] < 99; }), [[100.6, 173.6], [100.6, 141.2]]); };
      var panel = panelOf(H.L), panelR = mirP(panelOf(H.R)), PL = polyD(panel), PR = polyD(panelR);
      F.push(pe(PR, tc)); F.push(pe(cband(resamp(panelR, 0.6), 4.4, { aniso: 0.5, gate: function (p) { return centreGate(p) * H.gate(p); } }), dk)); F.push(pe(lineD([[100.6, 173.6], [100.6, 141.2], [88.6, 101.2]].map(function (p) { return [200 - p[0], p[1]]; })), 'none', lc, W));
      F.push(pe(PL, tc)); F.push(pe(cband(resamp(panel, 0.6), 4.4, { aniso: 0.5, gate: function (p) { return centreGate(p) * H.gate(p); } }), dk)); F.push(pe(lineD([[100.6, 173.6], [100.6, 141.2], [88.6, 101.2]]), 'none', lc, W));
      two('M88.6 101.2L84 114L87.6 115.8L100.4 141C98 132 95.6 120.4 93.4 111C92.4 107 90.8 103.8 88.6 101.2Z', lt, lc, 0.8);
      F.push(pe(E(100.6, 147.6, 1.2, 1.2), dk, lc, 0.6));
      two('M72.6 158.4H88.2', 'none', lc, W);
    }
    if (top === 'hivis' || top === 'hivis-lime') {
      var vc = top === 'hivis' ? '#FF7A10' : '#C8F02A', vdk = shadeOf(vc), vlc = LC(vc), tape = '#E3E8EB';
      var vL = H.vest.L, vR = H.vest.R, vRP = mirP(vR.P);
      F.push(pe(polyD(vL.P) + polyD(vRP), vc));
      /* the vest's shade lies on the far side of the body (its side and hem), never along the armhole */
      /* (the hem's shade runs right up to the opening; only the opening's own edges stay clear) */
      var vg = function (hole) { return function (p, n) { var og = 1 - smooth01(0.4, 0.7, Math.abs(n[0])) * (1 - smooth01(6, 9, Math.abs(p[0] - 100)));
        return og * smooth01(110, 122, p[1]) * H.gate(p) * smooth01(0.4, 2.4, lineDist(p, hole)); }; };
      F.push(pe(cband(resamp(vRP, 0.6), 4, { aniso: 0.5, gate: vg(mirP(vR.hole)) }), vdk));
      F.push(pe(cband(resamp(vL.P, 0.6), 4, { aniso: 0.5, gate: vg(vL.hole) }), vdk));
      /* reflective tapes run from the block's side (the silhouette) to the opening */
      [[138.6, 143.4], [150.4, 155.2]].forEach(function (y) {
        [[vL, function (p) { return p; }], [vR, function (p) { return [200 - p[0], p[1]]; }]].forEach(function (v) {
          var a = crossAt(v[0].side, y[0], 1), b = crossAt(v[0].side, y[1], 1);
          var p0 = a ? a.p : [60.9, y[0]], p1 = b ? b.p : [61.1, y[1]], m = v[1];
          F.push(pe(polyD([m(p0), m([95.6, y[0]]), m([95.6, y[1]]), m(p1)]), tape));
          F.push(pe(lineD([m(p0), m([95.6, y[0]])]) + lineD([m([95.6, y[1]]), m(p1)]), 'none', LC(tape), 0.6));
        });
      });
      /* only the vest's edges that lie inside the silhouette are drawn: armholes, opening, V */
      F.push(pe(lineD(vL.hole) + lineD(mirP(vR.hole)) + lineD(vL.open) + lineD(mirP(vR.open)), 'none', vlc, B9.IL));
    }
  }
  function badge9(F) {
    F.push(pe(RR(110.2, 106.4, 2.2, 5, 0.4), '#FF6A1A', LC('#FF6A1A'), 0.5));
    F.push(pe(RR(107.2, 110.4, 8.2, 10.6, 1.1), '#F7F5F0', '#2B2838', 0.7));
    F.push(pe('M108.3 110.4H114.3A1.1 1.1 0 0 1 115.4 111.5V112.8H107.2V111.5A1.1 1.1 0 0 1 108.3 110.4Z', '#FF6A1A'));
    F.push(pe(RR(108.2, 114, 3.3, 3.9, 0.5), '#2E2D36'));
    F.push(pe('M112.4 115H114.4M112.4 117H113.8', 'none', '#B3AEA4', 0.6));
    F.push(pe(E(111.3, 111.3, 0.8, 0.55), '#2B2838'));
  }
  /* trousers by style (left leg; the right is its mirror) */
  function legs9(B, style, pc, skin, ss, out) {
    var dk = shadeOf(pc), lc = LC(pc), lt = mix(pc, '#FFFFFF', 0.22), g = grp();
    ['L', 'R'].forEach(function (s) {
      var m = s === 'L' ? function (P) { return P; } : mirP, mD = s === 'L' ? function (d) { return d; } : M;
      var leg = LEG9;
      if (style === 'joggers') leg = LEG9J;
      if (style === 'shorts') {
        var shin = m(SHIN9), sd = polyD(shin);
        out(g, sd, skin); g.fill.push(pe(sd, skin)); g.fill.push(pe(cband(resamp(shin, 0.6), 2.6), ss));
        leg = SHORT9;
      }
      var P = m(leg), d = polyD(P);
      out(g, d, pc); g.fill.push(pe(d, pc)); g.fill.push(pe(cband(resamp(P, 0.6), 3.6, { aniso: 0.55 }), dk));
      var F = g.fill;
      if (style === 'work') F.push(pe(mD('M81.6 178L80.4 226'), 'none', mix(lc, pc, 0.45), 0.8));
      if (style === 'cargo') { F.push(pe(mD(RR(63.6, 186, 13, 15.6, 1.8)), dk, lc, 0.9)); F.push(pe(mD('M63.6 190.6H76.6'), 'none', lc, 0.9)); }
      if (style === 'jeans') { F.push(pe(mD('M70.2 176L70.6 224'), 'none', lt, 0.8)); F.push(pe(mD('M65 224.4L88.9 224.4L89 230.6L65.2 230.6Z'), lt, lc, 0.8)); }
      if (style === 'kneepad') { F.push(pe(mD(RR(66.2, 192.4, 21.4, 14, 3.4)), '#2C2B31', LC('#2C2B31'), 0.9)); F.push(pe(mD('M68.6 199.4H85.4'), 'none', '#4A4954', 0.8)); }
      if (style === 'reflective') F.push(pe(mD('M65.1 208.6L91.2 208.6L90.9 212.6L65.1 212.6ZM65.1 216.6L90.4 216.6L90.1 220.6L65.2 220.6Z'), '#E3E8EB', LC('#E3E8EB'), 0.6));
      if (style === 'joggers') F.push(pe(mD('M66.2 223.2L86.4 223.2L86.4 230.6L66.4 230.6Z'), dk, lc, 0.8));
      if (style === 'shorts') F.push(pe(mD('M64.4 197.8L91.4 197.8'), 'none', lc, 0.8));
    });
    return gflush(B, g);
  }
  var LEG9J = (function () { var P = [[62.8, 160], [99.8, 160], [99.8, 173.4]]; P = P.concat(bezPts([99.8, 173.4], [98.8, 189, 90.4, 208, 86.6, 230.6], 0, 1, 20).slice(1)); P.push([66.2, 230.6]); P = P.concat(bezPts([66.2, 230.6], [65.6, 212, 63.4, 190, 62.8, 172], 0, 1, 10).slice(1, -1)); return P; })();
  var SHORT9 = (function () { var P = [[62.6, 160], [99.8, 160], [99.8, 173.4]]; P = P.concat(bezPts([99.8, 173.4], [99.4, 182, 96.6, 192, 92.6, 202.2], 0, 1, 10).slice(1)); P.push([63.6, 202.2]); return P; })();
  var SHIN9 = (function () { var P = [[67.4, 198], [89.6, 198]]; P = P.concat(bezPts([89.6, 198], [89.4, 210, 87.6, 220, 86.6, 231], 0, 1, 10).slice(1)); P.push([69.4, 231]); P = P.concat(bezPts([69.4, 231], [68.8, 220, 67.4, 208, 67.4, 198], 0, 1, 8).slice(1, -1)); return P; })();
  /* footwear: a chunky block on a slab sole */
  function shoes9(B, style, c, out) {
    var g = grp(), dk = mix(c, INK, 0.38), lt = mix(c, '#FFFFFF', 0.35), sole = '#2C2B31';
    ['L', 'R'].forEach(function (s) {
      var m = s === 'L' ? function (P) { return P; } : mirP, mD = s === 'L' ? function (d) { return d; } : M;
      var top = style === 'rigger' ? 210.6 : style === 'wellies' ? 204.6 : style === 'sneaker' ? 233.4 : 226.6;
      var P = [[64.6, top], [89.4, top], [89.8, 234.2]];
      if (style === 'wellies' || style === 'rigger') P = [[65.4, top], [89.6, top], [90, 234.2]];
      P = P.concat(bezPts([89.8, 234.2], [91.2, 237.4, 94, 238.8, 94.2, 243.8], 0, 1, 8).slice(1));
      P.push([60.2, 243.8]);
      P = P.concat(bezPts([60.2, 243.8], [60.2, 239.6, 62.6, 237.4, 64.2, 234.2], 0, 1, 8).slice(1));
      if (style === 'sneaker') P = [[64.8, 233.4], [89.2, 233.4]].concat(bezPts([89.2, 233.4], [92.6, 235.6, 94.4, 239, 94.2, 243.8], 0, 1, 8).slice(1), [[60.2, 243.8]], bezPts([60.2, 243.8], [60.2, 239, 61.8, 235.6, 64.8, 233.4], 0, 1, 8).slice(1, -1));
      P = m(P);
      var d = polyD(P), so = polyD(m(SOLE9)), sc = style === 'sneaker' ? '#F0EDE6' : sole;
      out(g, d, c); out(g, so, sc);
      g.fill.push(pe(d, c)); g.fill.push(pe(cband(resamp(P, 0.5), 2.6, { aniso: 0.2 }), shadeOf(c)));
      if (style === 'safety') g.fill.push(pe(mD('M60.4 243.4C60.4 239.6 62.6 237.4 66 236.6H88.6C91.6 237.4 94.2 239.6 94.2 243.4Z'), mix(c, '#FFC21F', 0.55), LC(mix(c, '#FFC21F', 0.55)), 0.8));
      if (style === 'hiker') { g.fill.push(pe(mD(RR(64.4, 226.4, 25.2, 4.6, 1.6)), dk, LC(c), 0.8)); g.fill.push(pe(mD('M70.6 233.4L83.6 233.4M70.2 237L84 237'), 'none', '#F0EDE6', 0.9)); }
      if (style === 'boots') g.fill.push(pe(mD('M64.2 234.4C72 233.4 82 233.4 89.8 234.4'), 'none', LC(c), 0.8));
      if (style === 'rigger') g.fill.push(pe(mD('M70 210.6V205.4H75.4V210.6M80 210.6V205.4H85.4V210.6'), 'none', dk, 1.4));
      if (style === 'wellies') { g.fill.push(pe(mD(RR(65.2, 204.6, 24.6, 5.2, 1.6)), dk, LC(c), 0.8)); g.fill.push(pe(mD('M69.4 212L69.6 232.6'), 'none', lt, 1.6)); }
      if (style === 'sneaker') g.fill.push(pe(mD('M69 237.6L82.6 235.8L81.4 238.8L68.6 240.4Z'), '#FF6A1A'));
      g.fill.push(pe(so, sc));
    });
    return gflush(B, g);
  }

  function body9(sp, PO, C) {
    var B = [], O = [], skin = C.skin, ss = C.ss, tc = C.tc, pc = C.pc;
    var top = sp.top, short = /^(tee|polo|overalls)$/.test(top), torso = tc, sleeve = tc;
    if (top === 'overalls') { torso = sleeve = '#ECE7DC'; pc = tc; }
    if (top === 'shirt') torso = sleeve = '#F3F0EA';
    if (top === 'blazer') torso = '#F3F0EA';
    var LW = B9.LW, tucked = /^(rigger|wellies)$/.test(sp.shoes), bc = col(SHOEC, sp.shoeColor);
    function out(g, d, c) { g.out.push(pe(d, 'none', LC(c), LW)); }

    /* ---------- ground, footwear, trousers ---------- */
    if (C.ground) B.push(pe(E(100, 250, 52, 6.2), INK, null, 0, '', 0.15));
    if (!tucked) B = shoes9(B, sp.shoes, bc, out);
    B = legs9(B, sp.pantsStyle, pc, skin, ss, out);
    if (tucked) B = shoes9(B, sp.shoes, bc, out);

    /* ---------- neck ---------- */
    if (!C.hijab) {
      var ng = grp(); out(ng, NECK9, skin); ng.fill.push(pe(NECK9, skin)); ng.fill.push(pe(NECK9SH, ss)); ng.fill.push(pe(NECK9JAW, mix(ss, INK, 0.12)));
      B = gflush(B, ng);
    }

    /* ---------- arms ---------- */
    var arms = {}, kanga = PO.pockets && top === 'hoodie';
    if (kanga) PO = { L: { j: [K9L[0], K9L[1], 57.8, 143.8, 81.4, 152.8], hand: 'none' }, R: { j: [K9R[0], K9R[1], 142.2, 143.8, 118.6, 152.8], hand: 'none' }, kanga: true };
    ['L', 'R'].forEach(function (s) {
      var a = PO[s] || {}, j = a.j || STAND9[s];
      var A = { s: s, J: [j[0], j[1]], E: [j[2], j[3]], W: [j[4], j[5]], fore: a.fore || 'torso', hand: a.hand || 'relax', hint: a.hint };
      if (!PO[s] && s === 'L' && sp.acc && sp.acc !== 'none' && !PO.prop) A.hand = 'hold';
      A.d = v_unit(v_sub(A.W, A.E));
      if (!A.hint) A.hint = [A.W[0] <= 100 ? 1 : -1, 0];
      A.m = hmat9(A.W, A.d, A.hint);
      arms[s] = A;
    });

    /* ---------- one silhouette: block, garment, arms ---------- */
    var bo9 = top === 'blazer' ? { hem: 174, hc: [61.2, 172.4] } : top === 'shirt' ? { hem: 160.6, hc: [62.6, 159.6] } : {};
    /* a raised sleeve covers the whole shoulder corner in every pose, so the block keeps its corner and its
       straight side runs up into a clean armpit V (an armpit curve here bowed the side out into a bump) */
    function pitOf(A) {
      return null;
      var d1 = v_unit(v_sub(A.E, A.J)); if (d1[1] > 0.62) return null;
      var Lc = A.s === 'L' ? d1 : [-d1[0], d1[1]], n1 = v_perp(Lc), p = v_sub(B9.K, v_mul(n1, B9.RK * 0.96));
      return [p[0], p[1]];
    }
    var pitL = pitOf(arms.L), pitR = pitOf(arms.R);
    var hL = blockHalf(Object.assign({ pit: pitL }, bo9)), hR = blockHalf(Object.assign({ pit: pitR }, bo9));
    var BL = hL.concat(mirP(hR).reverse().slice(1, -1)), BLD = polyD(BL);
    var tg = grp(), under = [BL];
    /* the armpit is flat colour: the torso's shade fades in below it, whatever the arm does */
    var tGate = function (p) { return smooth01(18, 24, v_len(v_sub(p, K9L))) * smooth01(18, 24, v_len(v_sub(p, K9R))); };
    var HS = { L: hL, R: hR, BL: BL, gate: tGate };
    if (/^hivis/.test(top)) HS.vest = { L: vest9(hL), R: vest9(hR) };
    out(tg, BLD, top === 'blazer' ? tc : torso);
    if (top === 'overalls') tg.out.push(pe(stripD(bib9(BL).low, LW), LC(tc)));
    tg.fill.push(pe(BLD, torso));
    tg.fill.push(pe(cband(resamp(BL, 0.6), 4.8, { aniso: 0.6, gate: tGate }), shadeOf(torso)));
    garment9(tg, top, tc, tg.fill, HS);
    var hardP = HS.vest ? [HS.vest.L.P, mirP(HS.vest.R.P)] : [];
    if (top === 'shirt') {
      tg.fill.push(pe('M62.4 157.8C80 158.8 120 158.8 137.6 157.8L137.9 163.4C120 164.4 80 164.4 62.1 163.4Z', '#3A2C26', LC('#3A2C26'), 0.8));
      tg.fill.push(pe(RR(96.2, 157.4, 7.6, 6.8, 1.2), '#C9CDD3', LC('#C9CDD3'), 0.7));
      tg.fill.push(pe(RR(98.4, 159.4, 3.2, 2.8, 0.6), '#3A2C26'));
    }
    if (sp.badge !== 'none') badge9(tg.fill);
    /* the armpit rule, one for every sleeve: the crease line and the shade both begin at the armpit, r = 11 from
       the shoulder pivot (the corner itself is the sleeve head: no line, no shade); a crease shorter than a
       finger is a tick and is not drawn; over another garment (the vest) the line is that garment's edge */
    var rK = function (A, p) { return v_len(v_sub(p, A.J)); };
    var bandGate = function (A, r0) { return function (p) { return smooth01(r0 + 0.3, r0 + 2.1, rK(A, p)); }; };
    var lineO = function (A, r0, min) {
      return { mute: function (p) { return rK(A, p) < r0; }, fade: function (p) { return smooth01(r0, r0 + 2.2, rK(A, p)); },
        lead: function (p) { return rK(A, p) < 16; }, tick: function (p) { return rK(A, p) < r0 + 1.2; }, hard: hardP, min: min };
    };
    function hand(A, list, g, noThumb) {
      var hd = HAND9[A.hand]; if (!hd) return;
      var hb = xform(hd.b, A.m), HP = pathPts(hb);
      /* one cel band on the far side, like every other form (no shaded copy, so no line where it meets the wrist) */
      out(g, hb, skin); list.push(pe(hb, skin)); list.push(pe(cband(resamp(HP, 0.35), 1.7, { aniso: 0.1 }), ss));
      overLines(list, HP, under, LC(skin));
      if (hd.l) list.push(pe(xform(hd.l, A.m), 'none', mix(LC(skin), skin, 0.15), 0.7));
    }
    /* hands in pockets: the trouser pocket opening slants from the waist down to the side seam, across the
       forearm; the forearm is cut on it and the opening is drawn over the cut (the hand is inside) */
    var pockets = PO.pockets && !PO.kanga, pk = {};
    if (pockets) ['L', 'R'].forEach(function (s) {
      var h = s === 'L' ? hL : hR, i0 = 0; while (i0 < h.length - 1 && h[i0][1] < 165) i0++;
      var c = crossAt(h, 82.2, 0, i0), hy = top === 'shirt' ? 164.3 : c ? c.p[1] : 170.2;
      var T = [82.2, hy + 2.3], dir = v_unit([-18.3, 14.2]);
      var u = (63.4 + 0.034 * (T[1] - 160) - T[0]) / (dir[0] - 0.034 * dir[1]), O = v_add(T, v_mul(dir, u)), n = [dir[1], -dir[0]];
      if (s === 'R') { T = [200 - T[0], T[1]]; O = [200 - O[0], O[1]]; n = [-n[0], n[1]]; }
      var A = arms[s], d2 = v_unit(v_sub(A.W, A.E)), t = -v_dot(v_sub(A.E, T), n) / v_dot(d2, n);
      pk[s] = { T: T, O: O, n: n, W: v_add(A.E, v_mul(d2, t + 5.5)) };
    });
    function cutArm(s, P) {
      var c = pk[s], on = function (p) { return Math.abs(v_dot(v_sub(p, c.T), c.n)) < 1e-6; };
      var Pc = clipHalf(P, c.T, c.n), k = 0;
      for (var i = 0; i < Pc.length; i++) if (on(Pc[i]) && on(Pc[(i + 1) % Pc.length])) { k = i; break; }
      return { P: Pc, open: Pc.slice(k + 1).concat(Pc.slice(0, k + 1)), dir: v_unit(v_sub(c.O, c.T)), skip: function (p) { return Math.abs(v_dot(v_sub(p, c.T), c.n)) < 0.4; } };
    }
    function pocketLine(s) {
      var c = pk[s], sh2 = v_mul(c.n, 1.1);
      tg.fill.push(pe(polyD([c.T, c.O, v_add(c.O, sh2), v_add(c.T, sh2)]), shadeOf(pc)));
      tg.fill.push(pe(lineD([c.T, c.O]), 'none', LC(pc), 1.4));
    }
    var holdsTop = PO.prop === 'tablet';
    ['L', 'R'].forEach(function (s) {
      var A = arms[s], cut = null;
      if (pockets) A = Object.assign({}, A, { W: pk[s].W });
      if (!short) {
        if (!pockets) hand(A, tg.fill, tg, holdsTop);
        var sl = limb9(A, PROF9.sleeve, 0, B9.RK, 0), SP = sl.P;
        if (pockets) { cut = cutArm(s, SP); SP = cut.P; }
        var d = polyD(SP);
        if (cut) tg.out.push.apply(tg.out, openOutline(cut.open, LW, cut.dir, LC(sleeve))); else tg.out.push(pe(d, 'none', LC(sleeve), LW)); tg.fill.push(pe(d, sleeve));
        tg.fill.push(pe(cband(resamp(SP, 0.5), 2.6, { gate: bandGate(A, 11), skip: cut && cut.skip }), shadeOf(sleeve)));
        overLines(tg.fill, SP, under, LC(sleeve), lineO(A, 11, 9));
        arms[s].full = SP; arms[s].bw = 2.6;
        if (!pockets) { var c0 = v_sub(sl.W, v_mul(sl.d2, 3.4)), cn = sl.n2; tg.fill.push(pe('M' + PT(v_add(c0, v_mul(cn, 7.5))) + 'L' + PT(v_sub(c0, v_mul(cn, 7.3))), 'none', LC(sleeve), 0.9)); }
        under = under.concat([SP]);
      } else {
        var ba = limb9(A, PROF9.bare, 0.22, 0, 0), hd0 = !pockets && HAND9[A.hand], BP = hd0 ? withHand(ba, A) : ba.P;
        if (pockets) { cut = cutArm(s, BP); BP = cut.P; }
        var db = polyD(BP);
        if (cut) tg.out.push.apply(tg.out, openOutline(cut.open, LW, cut.dir, LC(skin))); else tg.out.push(pe(db, 'none', LC(skin), LW)); tg.fill.push(pe(db, skin));
        tg.fill.push(pe(cband(resamp(BP, 0.4), 2, { gate: bandGate(A, 11), skip: cut && cut.skip }), ss));
        overLines(tg.fill, BP, under, LC(skin), lineO(A, 11, 9));
        if (hd0 && hd0.l) tg.fill.push(pe(xform(hd0.l, A.m), 'none', mix(LC(skin), skin, 0.15), 0.7));
        arms[s].full = BP; arms[s].bw = 2;
        under = under.concat([BP]);
        var sh = shortSleeve9(A), ds = polyD(sh.P);
        out(tg, ds, sleeve); tg.fill.push(pe(ds, sleeve));
        /* a short sleeve keeps its shade on the hem and the outer side, never on the side against the body */
        var inward = v_mul(v_perp(v_unit(v_sub(A.E, A.J))), A.s === 'L' ? -1 : 1);
        tg.fill.push(pe(cband(resamp(sh.P, 0.5), 2.6, { gate: function (p, n) { return bandGate(A, 10.5)(p) * (1 - smooth01(0.35, 0.7, v_dot(n, inward))); }, aniso: 0.4 }), shadeOf(sleeve)));
        overLines(tg.fill, sh.P, under, LC(sleeve), lineO(A, 10.5, 9));
        under = under.concat([sh.P]);
      }
      if (pockets) pocketLine(s);
    });
    B = gflush(B, tg);

    /* ---------- hijab drape over the shoulders ---------- */
    if (C.hijab) {
      var hg = grp(), DP = pathPts(DRAPE9);
      out(hg, DRAPE9, C.wc); hg.fill.push(pe(DRAPE9, C.wc)); hg.fill.push(pe(cband(resamp(DP, 0.6), 3.4, { aniso: 0.5 }), shadeOf(C.wc)));
      B = gflush(B, hg); B.push(pe('M80.4 114.6C86.6 121 93.6 123.8 100 124.4', 'none', mix(C.wc, '#20182E', 0.3), 0.8));
    }

    /* ---------- props and pockets ---------- */
    if (PO.prop === 'tablet') {
      B.push(pe(RR(81.6, 139.4, 36.8, 25.4, 2.8), '#2C2B31', LC('#2C2B31'), 1));
      B.push(pe(RR(84, 141.8, 32, 20.6, 1.4), '#9ADBC8'));
      B.push(pe('M87.4 146.6H106M87.4 150.6H102M87.4 154.6H97.6', 'none', '#2A7F68', 0.9));
      B.push(pe(RR(104.6, 153.2, 8.2, 6, 1), '#FFC21F'));
      var th = 'M82.6 160.4C81.8 156.6 82.6 152.2 84.8 150.2C86.6 148.8 88.2 149.6 88 151.8C87.8 154.6 86.6 158.2 84.8 160.8Z';
      B.push(pe(th + M(th), skin, LC(skin), 0.9));
    }
    if (PO.kanga) {
      var kp = 'M79.6 141.4H120.4L124.4 161H75.6Z';
      B.push(pe(kp, mix(tc, '#20182E', 0.07), LC(tc), 0.9)); B.push(pe('M79.6 141.4L75.6 161M120.4 141.4L124.4 161', 'none', LC(tc), 1.5));
      B.push(pe('M76.6 156.4C88 158.4 112 158.4 123.4 156.4L124.4 161H75.6Z', mix(tc, '#20182E', 0.16)));
    }
    if (arms.L.hand === 'hold') {
      var AL = arms.L, ct = mpt(AL.m, 0.6, 9.4), IB = new Bld(1.6); itemAt(IB, sp.acc, 0, 0);
      Array.prototype.push.apply(B, moved(IB.p, 'translate(' + f1(ct[0]) + ' ' + f1(ct[1]) + ') scale(0.66)'));
      B.push(pe(xform(HAND9.relax.t, AL.m), skin, LC(skin), 0.9));
    }

    /* ---------- a phone at the ear: the forearm, hand and phone come over the head ---------- */
    if (arms.R.fore === 'over') {
      var AR = arms.R, pm = AR.m, og = grp(), par = short ? 0.66 : 0.45;
      var oP = short ? limb9(AR, PROF9.bare, par, 0, 0, true) : limb9(AR, PROF9.sleeve, par, 0, 0, true), M0 = oP.J0, ud = v_unit(v_sub(AR.E, AR.J));
      if (short) oP.P = withHand(oP, AR);
      var near = function (p) { return Math.abs(v_dot(v_sub(p, M0), ud)) < 0.3; };
      var cc = short ? skin : sleeve;
      var cutP = oP.P.filter(function (p) { return !near(p); });
      og.out.push.apply(og.out, openOutline(oP.P, LW, v_perp(ud), LC(cc)));
      O.push(pe(xform('M-3.9 7.6L3.9 7.6L3.9 25.6L-3.9 25.6Z', pm), '#2C2B31', '#14131A', 0.8));
      O.push(pe(xform('M2.2 8.4L3.1 8.4L3.1 24.8L2.2 24.8Z', pm), '#5D5B6B'));
      if (!short) { var hb2 = xform(HAND9.fist.b, pm); out(og, hb2, skin); og.fill.push(pe(hb2, skin)); og.fill.push(pe(cband(resamp(pathPts(hb2), 0.35), 1.7, { aniso: 0.1 }), ss)); }
      /* the fill reaches a hair behind the cut (same colour as the arm beneath), so no seam shows at the join */
      var fP = oP.P.slice(), bk = v_mul(ud, -0.4); fP[0] = v_add(fP[0], bk); fP[fP.length - 1] = v_add(fP[fP.length - 1], bk);
      og.fill.push(pe(polyD(fP), cc));
      /* its shade is the whole arm's shade, kept beyond the cut: one band, no step at the join */
      var cA = v_sub(M0, v_mul(ud, 0.4)), nU = v_mul(ud, -1);
      og.fill.push(pe(cbandPolys(resamp(AR.full, 0.5), AR.bw, { gate: bandGate(AR, 11) }).map(function (Q) { var C = clipHalf(Q, cA, nU); return C.length > 2 ? polyD(C) : ''; }).join(''), short ? ss : shadeOf(sleeve)));
      if (!short) { var c4 = v_sub(oP.W, v_mul(oP.d2, 3.4)); og.fill.push(pe('M' + PT(v_add(c4, v_mul(oP.n2, 7.5))) + 'L' + PT(v_sub(c4, v_mul(oP.n2, 7.3))), 'none', LC(sleeve), 0.9)); }
      O = gflush(O, og);
      O.push(pe(xform(HAND9.fist.l, pm), 'none', mix(LC(skin), skin, 0.2), 0.7));
    }
    return { body: B, over: O };
  }
  /* an outline as open lines that skip the dropped points */
  function openRuns(P, drop) {
    var N = P.length, s0 = -1, i, j, out = '', cur = [];
    for (i = 0; i < N; i++) if (drop(P[i])) { s0 = i; break; }
    if (s0 < 0) return polyD(P);
    for (j = 1; j <= N; j++) { i = (s0 + j) % N; if (!drop(P[i])) cur.push(P[i]); else { if (cur.length > 1) out += lineD(cur); cur = []; } }
    if (cur.length > 1) out += lineD(cur);
    return out;
  }
  var MOODS = { happy: { eyes: 'happy', mouth: 'grin' }, proud: { eyes: 'sharp', mouth: 'beam', brows: 'raise' }, shock: { eyes: 'wide', mouth: 'o', brows: 'arch' }, think: { eyes: 'side', mouth: 'smirk', brows: 'raise' }, stern: { eyes: 'focus', mouth: 'flat', brows: 'angle' }, worried: { eyes: 'open', mouth: 'wavy', brows: 'worry' }, calm: { eyes: 'calm', mouth: 'smile' }, cheeky: { eyes: 'wink', mouth: 'smirk' } };
  var TURN = { front: 0, right: 0.7, left: -0.7 };

  /* turn: number -1..1 or 'front' | 'right' | 'left' (falls back to the spec's own turn) */
  function build(spec, mode, mood, ground, pose, turn) {
    var sp = fill(spec), md = MOODS[mood] || {};
    var t = typeof turn === 'number' ? turn : TURN[turn != null && TURN[turn] != null ? turn : sp.turn] || 0, at = Math.abs(t);
    var BG = new Bld(), K = new Bld(), B = new Bld(), EA = new Bld(), H = new Bld(), FB = new Bld(), CS = new Bld(), F = new Bld(), HO = new Bld(), HF = new Bld(), HS = new Bld(), HD = new Bld(), T2 = new Bld(), O = new Bld();
    var skin = col(SKIN, sp.skin), ss = skinShade(skin), hc = col(HAIRC, sp.hairColor), tc = col(TOPC, sp.topColor), hatc = col(HATC, sp.hatColor), ec = col(EYEC, sp.eyeColor), pc = col(PANTS, sp.pants), wc = col(WRAPC, sp.wrapColor);
    var head = HEAD[sp.face], hat = sp.hat, covered = hat !== 'none', hijab = sp.hair === 'hijab', wrap = hijab || hat === 'turban';
    var hs0 = hijab ? {} : hairShapes(sp.hair), hs = covered && hat !== 'turban' && hs0.cov ? Object.assign({ fade: hs0.fade }, hs0.cov) : hs0;
    var fitH = !hijab && hairFit(head); if (fitH) hs = widenHair(hs, fitH);
    mode = mode || 'full';
    var vb = mode === 'full' ? '-2 -12 204 267' : mode === 'head' ? '40.8 -12.1 118.4 118.4' : mode === 'legs' ? '44 158 112 112' : mode === 'torso' ? '40 84 120 120' : '35 -4 130 130';
    if (mode !== 'full' && sp.bg !== 'none') {
      BG.raw('M-200 -200H400V800H-200Z', BGC[sp.bg] || BGC.concrete);
      if (sp.bg === 'blueprint') { var g = ''; for (var gx = 4; gx < 200; gx += 12) g += 'M' + gx + ' 0V300'; for (var gy = 4; gy < 300; gy += 12) g += 'M0 ' + gy + 'H200'; BG.line(g, 0.8, '#4A6FD0'); BG.line('M30 30H60V14M160 120V140H186', 1.6, '#9DB5F2'); }
      if (sp.bg === 'hazard') { var hz = ''; for (var x2 = -80; x2 < 220; x2 += 20) hz += 'M' + x2 + ' 300L' + (x2 + 80) + ' 110H' + (x2 + 90) + 'L' + (x2 + 10) + ' 300Z'; BG.raw(hz, INK); }
      if (sp.bg === 'skyline') { BG.raw('M0 300V100H20V82H38V110H50V74H70V300ZM130 300V90H146V60H162V94H176V80H200V300Z', '#80A7D1'); BG.line('M150 60V16H78M86 16V28M158 16H180V24', 3, '#6E97C1'); }
      /* poster plates: one bold graphic behind the head, printed-matter feel */
      var bgc = BGC[sp.bg] || BGC.concrete, lt = mix(bgc, '#FFFFFF', 0.38), dkc = mix(bgc, INK, 0.14);
      var dots = function (x0, y0, x1, y1, st, r, fx) { var d = ''; for (var yy = y0; yy <= y1; yy += st) for (var xx = x0 + ((yy / st) % 2 ? st / 2 : 0); xx <= x1; xx += st) { var rr = fx ? fx(xx, yy) : r; if (rr > 0.2) d += E(f1(xx), f1(yy), f1(rr), f1(rr)); } return d; };
      if (sp.bg === 'concrete') { BG.raw(E(100, 76, 70, 70), lt); BG.raw(dots(6, 8, 196, 196, 9, 0.9), dkc); }
      if (sp.bg === 'steel') { BG.raw(E(100, 84, 78, 78), lt); BG.line(E(100, 84, 60, 60) + E(100, 84, 42, 42), 1.4, mix(bgc, INK, 0.12)); }
      if (sp.bg === 'sand') { BG.raw(E(150, 40, 34, 34), '#FFC94D'); BG.raw('M0 118H200V300H0Z', mix(bgc, '#E8A55A', 0.35)); BG.line('M0 118H200', 1.6, mix(bgc, INK, 0.2)); }
      if (sp.bg === 'signal') { var rays = ''; for (var a = 0; a < 360; a += 20) { var r0 = a * Math.PI / 180, r1 = (a + 9) * Math.PI / 180; rays += 'M100 80L' + f1(100 + 260 * Math.cos(r0)) + ' ' + f1(80 + 260 * Math.sin(r0)) + 'L' + f1(100 + 260 * Math.cos(r1)) + ' ' + f1(80 + 260 * Math.sin(r1)) + 'Z'; } BG.raw(rays, mix(bgc, '#FFFFFF', 0.16)); }
      if (sp.bg === 'olive') { var st2 = ''; for (var x3 = -200; x3 < 220; x3 += 18) st2 += 'M' + x3 + ' 300L' + (x3 + 200) + ' 0H' + (x3 + 207) + 'L' + (x3 + 7) + ' 300Z'; BG.raw(st2, mix(bgc, '#FFFFFF', 0.16)); }
      if (sp.bg === 'mint') { BG.raw(E(100, 78, 72, 72), lt); BG.raw(E(162, 30, 14, 14), mix(bgc, '#FFFFFF', 0.6)); }
      if (sp.bg === 'pink') BG.raw(dots(4, 6, 198, 200, 8, 0, function (x, y) { return Math.max(0, 2.6 - y / 70); }), mix(bgc, '#FFFFFF', 0.5));
      if (sp.bg === 'ink') { BG.line(E(100, 80, 66, 66), 2, '#FF7A10'); BG.raw(dots(6, 8, 196, 196, 12, 0.8), '#3D3B46'); }
      /* brick: running bond, mortar a lighter tone of the brick */
      if (sp.bg === 'brick') { var bk = ''; for (var by = -2, row = 0; by < 200; by += 12, row++) { bk += 'M0 ' + by + 'H200'; for (var bx = (row % 2) * 12 - 12; bx < 200; bx += 24) bk += 'M' + bx + ' ' + by + 'V' + (by + 12); } BG.line(bk, 1.4, mix(bgc, '#FFFFFF', 0.36)); BG.raw(E(100, 76, 64, 64), mix(bgc, '#FFFFFF', 0.08)); }
      /* tower crane against a warm sky: mast, jib, counter-jib, hook */
      if (sp.bg === 'crane') { var cc = '#3B3542', lat = ''; for (var my = 8; my < 200; my += 9) lat += 'M38 ' + my + 'L48 ' + (my + 9) + 'M48 ' + my + 'L38 ' + (my + 9);
        BG.raw(E(150, 52, 17, 17), '#FFB86B'); BG.line(lat, 1.1, cc); BG.raw('M37 6H49V200H37ZM14 1H176V6.4H14ZM43 -12L49 1H37ZM14 6.4H26V15H14Z', cc); BG.line('M150 6.4V30M146 30H154', 1.5, cc); }
      /* survey contours */
      if (sp.bg === 'topo') { var tp2 = ''; [[154, 26], [36, 112]].forEach(function (c, ci) { for (var k = 1; k <= 6; k++) { var rx = 12 * k + (ci ? 4 : 0), ry = 9 * k; tp2 += 'M' + f1(c[0] - rx) + ' ' + c[1] + 'C' + f1(c[0] - rx) + ' ' + f1(c[1] - ry * 1.3) + ' ' + f1(c[0] + rx * 0.9) + ' ' + f1(c[1] - ry * 1.1) + ' ' + f1(c[0] + rx) + ' ' + f1(c[1] + ry * 0.2) + 'C' + f1(c[0] + rx * 1.05) + ' ' + f1(c[1] + ry * 1.2) + ' ' + f1(c[0] - rx * 0.8) + ' ' + f1(c[1] + ry * 1.3) + ' ' + f1(c[0] - rx) + ' ' + c[1]; } }); BG.line(tp2, 1.3, mix(bgc, '#3E6B3A', 0.32)); BG.raw(E(154, 26, 3, 3), mix(bgc, '#3E6B3A', 0.5)); }
      /* rebar mesh: bars with a lit edge, tied at the crossings */
      if (sp.bg === 'rebar') { var rb = ''; for (var rx2 = 8; rx2 < 200; rx2 += 18) rb += 'M' + rx2 + ' -10V210'; for (var ry2 = 6; ry2 < 200; ry2 += 18) rb += 'M-10 ' + ry2 + 'H210'; BG.line(rb, 3, mix(bgc, INK, 0.28)); BG.line(rb.replace(/M(\d+) -10V210/g, function (m0, x) { return 'M' + (+x - 0.8) + ' -10V210'; }).replace(/M-10 (\d+)H210/g, function (m0, y) { return 'M-10 ' + (+y - 0.8) + 'H210'; }), 0.8, mix(bgc, '#FFFFFF', 0.28)); }
      /* night shift: moon, stars, two floodlights */
      if (sp.bg === 'night') { BG.raw(E(156, 24, 11, 11), '#FFE3A1'); BG.raw(E(161, 20, 9, 9), bgc); BG.raw(dots(10, 10, 190, 120, 26, 0, function (x, y) { return ((x * 7 + y * 13) % 5) < 2 ? 0.9 : 0; }), '#AFC0F0'); BG.raw('M42 200V64H46V200ZM154 200V58H158V200Z', '#141B33'); BG.raw('M38 58H50V65H38ZM150 52H162V59H150Z', '#FFE3A1'); }
      /* drafting paper: fine grid, a margin rule */
      if (sp.bg === 'drafting') { var dg = ''; for (var gx2 = 2; gx2 < 200; gx2 += 8) dg += 'M' + gx2 + ' -10V210'; for (var gy2 = 2; gy2 < 200; gy2 += 8) dg += 'M-10 ' + gy2 + 'H210'; BG.line(dg, 0.5, '#C8D8EE'); BG.line('M50 -10V210', 1.2, '#E46A5A'); }
      /* VHS plates: SMPTE-style colour bars, VCR blue screen, static, tracking error */
      if (sp.bg === 'bars') { var bc = [V.cream, V.yellow, V.cyan, V.green, V.magenta, V.red, V.blue]; for (var bi = 0; bi < 7; bi++) BG.raw('M' + f1(30 + bi * 20) + ' -40H' + f1(50.4 + bi * 20) + 'V96H' + f1(30 + bi * 20) + 'Z', bc[bi]); var b2 = [V.blue, V.tape, V.magenta, V.tape, V.cyan, V.tape, V.cream]; for (bi = 0; bi < 7; bi++) BG.raw('M' + f1(30 + bi * 20) + ' 96H' + f1(50.4 + bi * 20) + 'V106H' + f1(30 + bi * 20) + 'Z', b2[bi]); BG.raw('M-200 106H400V400H-200Z', V.tape); BG.raw('M30 106H64V400H30Z', '#2A1F6B'); BG.raw('M64 106H98V400H64Z', V.cream); BG.raw('M98 106H132V400H98Z', '#3A1C8E'); }
      if (sp.bg === 'bluescreen') { BG.raw('M44 8L54 14L44 20Z', V.cream); BG.raw('M60 9H66V19H60ZM69 9H80V12H72V19H69ZM83 9H94V19H91V16H86V19H83ZM86 12V13.4H91V12ZM97 9H100V13H104V9H107V19H100V16H97Z', V.cream); BG.raw('M126 9H156V12H126ZM126 15H148V18H126Z', mix(bgc, '#FFFFFF', 0.45)); var sl = ''; for (var sy = -4; sy < 140; sy += 5) sl += 'M-10 ' + sy + 'H210'; BG.line(sl, 1.2, mix(bgc, '#000000', 0.16)); BG.raw('M-10 98H210V104H-10Z', mix(bgc, '#FFFFFF', 0.3)); }
      if (sp.bg === 'static') { BG.raw(dots(30, -4, 170, 130, 5, 0, function (x, y) { var h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; h -= Math.floor(h); return h > 0.55 ? 0.6 + h * 1.5 : 0; }), '#8E86C9'); BG.raw(dots(32, -2, 170, 130, 7, 0, function (x, y) { var h = Math.sin(x * 4.898 + y * 7.23) * 9158.5453; h -= Math.floor(h); return h > 0.8 ? 1.6 : 0; }), V.cream); BG.raw('M-10 40H210V46H-10Z', V.cyan); BG.raw('M-10 48H210V50H-10Z', V.magenta); }
      if (sp.bg === 'tracking') { var tb = [[-4, 22, V.magenta], [18, 9, V.yellow], [27, 26, V.cyan], [53, 6, V.tape], [59, 24, V.blue], [83, 10, V.cream], [93, 30, V.purple], [123, 8, V.yellow]]; tb.forEach(function (q, qi) { BG.raw('M' + (qi % 2 ? 20 : 30) + ' ' + q[0] + 'H' + (qi % 2 ? 190 : 180) + 'V' + (q[0] + q[1]) + 'H' + (qi % 2 ? 20 : 30) + 'Z', q[2]); }); }
      if (sp.bg === 'dusk') { BG.raw(E(160, 40, 20, 20), '#FFC690'); BG.raw('M0 300V110H24V94H40V118H56V300ZM150 300V100H170V86H200V300Z', '#C77050'); }
    }

    /* hair that falls behind the head and shoulders */
    var dark = luma(hc) < 0.2, strandC = dark ? mix(hc, '#C9D4F2', 0.26) : mix(hc, '#2A1638', 0.4), shineC = dark ? mix(hc, '#DCE6FF', 0.42) : mix(hc, '#FFFFFF', luma(hc) > 0.6 ? 0.55 : 0.36), shadeC = mix(hc, '#7A2E5E', dark ? 0.1 : 0.28);
    if (hs.back && !wrap) { K.vol(hs.back, mix(hc, '#3A1C6E', dark ? 0.06 : 0.2), [22, 0, 156, 186], { k: 4, w: 3.2 }); if (hs.bdet) K.line(hs.bdet, 2, strandC); if (hs.bfill) K.raw(hs.bfill, strandC); }

    /* body, in board units (see BODY 7) */
    var BD = body9(sp, POSE9[pose || sp.pose] || POSE9.stand, { skin: skin, ss: ss, tc: tc, pc: pc, wc: wc, hijab: hijab, ground: mode === 'full' && ground !== false });
    B.p = B.p.concat(BD.body); O.p = O.p.concat(BD.over);

    /* head: ears swing with the turn, the near one stays, the far one tucks behind */
    var eL = t >= 0 ? 8 * t : -14 * t, eR = t <= 0 ? 8 * t : -14 * t;
    var exl = 0 + head.ear, exr = 200 - head.ear;
    if (!hijab && !hs.noEar && hat !== 'turban') {
      var ear = SH(EAR, head.ear, 0), earIn = SH(EAR_IN, head.ear, 0);
      var eb = new Bld(); eb.vol(ear, skin, [30 + head.ear, 84, 12, 23], { k: 3, sc: ss }); eb.line(earIn, 2, mix(ss, INK, 0.2));
      EA.p = EA.p.concat(moved(eb.p, 'translate(' + f1(eL) + ' 0)'));
      var er = new Bld(); er.vol(M(ear), skin, mb([30 + head.ear, 84, 12, 23]), { k: 3, sc: ss }); er.line(M(earIn), 2, mix(ss, INK, 0.2));
      EA.p = EA.p.concat(moved(er.p, 'translate(' + f1(eR) + ' 0)'));
    }
    H.side(head.d, skin, head.b, { sc: ss, rc: mix(skin, RIM, 0.42), sh: 0.14, rim: 0 });
    var faceTf = 'translate(' + f1(12 * t) + ' 0) translate(100 0) scale(' + (1 - 0.1 * at).toFixed(3) + ' 1) translate(-100 0)';
    var HW = 'translate(100 0) scale(' + (head.hw / 61).toFixed(3) + ' 1) translate(-100 0)';
    var HV = Math.abs(head.b[1] - 20) > 0.2 ? ' translate(0 70) scale(1 ' + ((70 - head.b[1]) / 50).toFixed(3) + ') translate(0 -70)' : '';
    var hairDx = 'translate(' + f1(4 * t) + ' 0) ' + HW + HV, hatDx = 'translate(' + f1(3 * t) + ' 0) ' + HW, detDx = 'translate(' + f1(10 * t) + ' 0) ' + HW;
    if (hs.fade) H.p = H.p.concat(moved(new Bld().raw(hs.fade, mix(skin, mix(hc, INK, 0.55), 0.34)).p, HW + HV));
    /* cast shadows onto the face: brim or fringe, dropped down-right */
    if (covered && hat !== 'turban' && BRIM[hat]) CS.p = moved([].concat(new Bld().raw(SH(BRIM[hat], 2, 6), ss).p), hatDx);
    else if (hat === 'turban') CS.p = moved(new Bld().raw(SH(TURBAN, 2, 6), ss).p, hatDx);
    else if (!wrap && hs.front && !covered && !hs.flat) CS.p = moved(new Bld().raw(SH(hs.front, 2, 6), ss).p, hairDx);
    faceDetails(F, sp, skin, ss);
    var NB = new Bld(); nose(NB, noseInk(skin, ss), t);
    mouth(F, md.mouth || sp.mouth);
    var MB = new Bld(); moustache(MB, sp.mous, hc);
    eyes(F, md.eyes || sp.eyes, ec, skin, t);
    var browC = luma(hc) > 0.6 ? mix(hc, INK, 0.5) : mix(hc, INK, 0.25);
    if (hijab || sp.hair === 'none') browC = mix(skin, INK, 0.62);
    brows(F, md.brows || sp.brows, browC);
    /* top: outline (only the upper arc when a beard covers the jaw), one-piece hair (clipped under a hat), wraps, hats, ear gear */
    /* the jaw line is redrawn over every beard at full weight, except where the beard hangs below the chin;
       there the beard's own chin line takes over, so the silhouette never breaks */
    /* facial hair: built on this head's jawline (see beardGeo) */
    var bg9 = beardGeo(head, sp.beard, t), beardD = '', faceTfS = 'translate(' + f1(12 * t) + ' 0) translate(100 0) scale(' + (1 - 0.1 * at).toFixed(3) + ' 1) translate(-100 0)';
    if (bg9 && bg9.stub) { var tint = mix(skin, hc, 0.3); FB.raw(polyD(bg9.P), tint); FB.raw(MOUS.chevron, tint, { tf: faceTfS }); }
    else if (bg9) {
      var polys = bg9.multi || [bg9.P]; beardD = polys.map(polyD).join('');
      FB.raw(beardD, hc);
      polys.forEach(function (Q) { FB.raw(cband(resamp(Q, 0.5), 3.2, { aniso: 0.3 }), shadeOf(hc)); });
      if (bg9.strands) FB.raw(bg9.strands, strandC);
      FB.raw(beardD, 'none', { stroke: LC(hc), sw: bg9.sw || LW });
    }
    var WORLD = 'M-60 -60H260V420H-60Z';
    HO.raw(head.d, 'none', { stroke: LC(skin), sw: LW });
    var HI = new Bld(), HL = new Bld();
    if (!wrap && hs.front && hs.flat) {
      /* a buzz lies flat on the skull: drawn a little oversize in the face layer, which is clipped by the head,
         so its edge IS the skull edge on every head shape (no rim of scalp above it) */
      var FL = new Bld(), fc = mix(hc, skin, 0.3), big = ' translate(100 70) scale(1.07) translate(-100 -70)';
      FL.raw(hs.front, fc); (hs.det || []).forEach(function (q) { if (q[0] === 'shine') FL.raw(q[1], mix(fc, '#FFFFFF', 0.3)); else if (q[0] === 'line') FL.line(q[1], 2.2, mix(hc, skin, 0.1)); });
      H.p = H.p.concat(moved(FL.p, 'translate(' + f1(4 * t) + ' 0) ' + HW + HV + big));
    }
    if (!wrap && hs.front && !hs.flat) {
      HF.raw(hs.front, hc);
      if (hs.flat) HF.raw(hs.front, mix(hc, skin, 0.3)); else HI.side(hs.front, hc, bboxD(hs.front), { line: false, sh: 0.15, rim: 0, sc: shadeC, rc: mix(hc, RIM, dark ? 0.32 : 0.48) });
      (hs.det || []).forEach(function (q) {
        if (q[0] === 'line') HI.line(q[1], 2.2, hs.flat ? mix(hc, skin, 0.1) : strandC);
        else HI.raw(q[1], q[0] === 'shade' ? shadeC : q[0] === 'shine' ? (hs.flat ? mix(mix(hc, skin, 0.3), '#FFFFFF', 0.3) : shineC) : strandC);
      });
      HL.raw(hs.front, 'none', { stroke: LC(hs.flat ? mix(hc, skin, 0.3) : hc), sw: LW });
    }
    var HJ = new Bld();
    if (hijab) {
      HJ.vol('M100 14C140 14 168 42 168 82C168 116 150 146 124 156C114 160 86 160 76 156C50 146 32 116 32 82C32 42 60 14 100 14ZM100 46C128 46 148 64 148 90C148 116 130 136 100 138C70 136 52 116 52 90C52 64 72 46 100 46Z', wc, [32, 14, 136, 146], { k: 6, fr: 'evenodd' });
      HJ.line('M44 112C54 132 74 146 96 150M60 30C72 22 86 18 100 18', 2.2, mix(wc, INK, 0.3));
    }
    headwear(HS, HD, sp, hatc);
    if (sp.earwear === 'defenders' || !(hs.noEar || hijab || hat === 'turban')) earwear(T2, sp.earwear, hat, exl + eL, exr + eR, t > 0.3 ? 'R' : t < -0.3 ? 'L' : null);
    var under = covered && BRIMY[hat] ? 'M-60 ' + BRIMY[hat] + 'H260V420H-60Z' : 'M-60 -60H260V420H-60Z';
    var GL = new Bld(); glasses(GL, sp.glasses);
    var face = [].concat(CS.p, moved(F.p, faceTf), moved(NB.p, 'translate(' + f1(5 * t) + ' 0) ' + faceTf), moved(MB.p, faceTf), moved(GL.p, faceTf));
    var R = {
      vb: vb, headTf: HEADTF, faceTf: 'translate(0 0)', clipFace: head.d, clipBeard: bg9 && !bg9.clip ? WORLD : head.d, clipJaw: WORLD + beardD, clipOut: WORLD + head.d, chin: [], clipUnder: under,
      bg: moved(BG.p, mode === 'head' ? 'translate(26 -7.66) scale(0.74)' : 'translate(26 10.47) scale(0.74)'), back: moved(K.p, 'translate(' + f1(-4 * t) + ' 0) ' + HW + HV), body: fin(B.p), hb: fin(EA.p), base: fin(H.p),
      beard: fin(FB.p),
      face: face, top: fin(HO.p), hair: moved(HF.p, hairDx), clipHair: hs.front && !wrap ? hs.front : 'M0 0Z', hairTf: hairDx, hairIn: moved(HI.p, hairDx), hairLine: moved(HL.p, hairDx), top2: [].concat(moved(HJ.p, 'translate(100 0) scale(' + (head.mw / 61).toFixed(3) + ' 1) translate(-100 0)'), moved(HS.p, hatDx), moved(HD.p, detDx), fin(T2.p)), over: fin(O.p)
    };
    ['back', 'body', 'hb', 'base', 'beard', 'face', 'top', 'hair', 'hairIn', 'hairLine', 'top2', 'over', 'chin'].forEach(function (k) { R[k] = thin(R[k], k === 'face'); });
    /* adult proportions on the full figure: a longer body, the head smaller and riding on the neck */
    return R;
  }
  return { build: build, SKIN: SKIN, HAIRC: HAIRC, TOPC: TOPC, HATC: HATC, PANTS: PANTS, SHOEC: SHOEC, WRAPC: WRAPC, BGC: BGC };
})();

/* ======================================================================================================
   Package API (added on top of the engine): option lists, status badges and an SVG renderer.
   ====================================================================================================== */
(function (SCA) {
  /* every choice the builder offers, in builder order: { id, label, color? } */
  SCA.OPTIONS = {
    "face": [
      {
        "id": "square",
        "label": "Block"
      },
      {
        "id": "round",
        "label": "Round"
      },
      {
        "id": "long",
        "label": "Long"
      },
      {
        "id": "wide",
        "label": "Wide"
      },
      {
        "id": "heart",
        "label": "V-shape"
      },
      {
        "id": "jaw",
        "label": "Strong jaw"
      },
      {
        "id": "slim",
        "label": "Slim"
      },
      {
        "id": "lean",
        "label": "Lean"
      },
      {
        "id": "diamond",
        "label": "Diamond"
      },
      {
        "id": "chisel",
        "label": "Chiselled"
      },
      {
        "id": "petite",
        "label": "Petite"
      }
    ],
    "skin": [
      {
        "id": "s1",
        "label": "Porcelain",
        "color": "#FFE1D2"
      },
      {
        "id": "s2",
        "label": "Peach",
        "color": "#FBC7AC"
      },
      {
        "id": "s3",
        "label": "Warm",
        "color": "#F0A982"
      },
      {
        "id": "s4",
        "label": "Golden",
        "color": "#DB8A5C"
      },
      {
        "id": "s5",
        "label": "Tan",
        "color": "#BC6B42"
      },
      {
        "id": "s6",
        "label": "Brown",
        "color": "#944F31"
      },
      {
        "id": "s7",
        "label": "Deep",
        "color": "#6C3823"
      },
      {
        "id": "s8",
        "label": "Ebony",
        "color": "#48251A"
      }
    ],
    "hair": [
      {
        "id": "none",
        "label": "Shaved"
      },
      {
        "id": "buzz",
        "label": "Buzz"
      },
      {
        "id": "fade",
        "label": "Fade"
      },
      {
        "id": "crop",
        "label": "Crop"
      },
      {
        "id": "spiky",
        "label": "Spiky"
      },
      {
        "id": "quiff",
        "label": "Quiff"
      },
      {
        "id": "part",
        "label": "Side part"
      },
      {
        "id": "wavy",
        "label": "Wavy"
      },
      {
        "id": "curls",
        "label": "Loose curls"
      },
      {
        "id": "curly",
        "label": "Curly"
      },
      {
        "id": "curlybob",
        "label": "Curly bob"
      },
      {
        "id": "afro",
        "label": "Afro"
      },
      {
        "id": "bun",
        "label": "Bun"
      },
      {
        "id": "bob",
        "label": "Bob"
      },
      {
        "id": "long",
        "label": "Long"
      },
      {
        "id": "longwavy",
        "label": "Long waves"
      },
      {
        "id": "locs",
        "label": "Locs"
      },
      {
        "id": "mohawk",
        "label": "Mohawk"
      },
      {
        "id": "hijab",
        "label": "Hijab"
      }
    ],
    "wrapColor": [
      {
        "id": "navy",
        "label": "Navy",
        "color": "#24377A"
      },
      {
        "id": "black",
        "label": "Black",
        "color": "#26252B"
      },
      {
        "id": "rust",
        "label": "Rust",
        "color": "#DB5626"
      },
      {
        "id": "olive",
        "label": "Olive",
        "color": "#6F8C2B"
      },
      {
        "id": "sand",
        "label": "Sand",
        "color": "#EAC98D"
      },
      {
        "id": "teal",
        "label": "Teal",
        "color": "#18A3A3"
      },
      {
        "id": "plum",
        "label": "Plum",
        "color": "#8A3A72"
      },
      {
        "id": "forest",
        "label": "Forest",
        "color": "#1C8C5B"
      },
      {
        "id": "white",
        "label": "White",
        "color": "#F7F4EC"
      },
      {
        "id": "red",
        "label": "Red",
        "color": "#E5333F"
      },
      {
        "id": "purple",
        "label": "Purple",
        "color": "#7B4CDB"
      },
      {
        "id": "pink",
        "label": "Pink",
        "color": "#FF6FA8"
      }
    ],
    "age": [
      {
        "id": "none",
        "label": "Smooth"
      },
      {
        "id": "lines",
        "label": "Laugh lines"
      },
      {
        "id": "senior",
        "label": "Seasoned"
      }
    ],
    "marks": [
      {
        "id": "none",
        "label": "None"
      },
      {
        "id": "freckles",
        "label": "Freckles"
      },
      {
        "id": "mole",
        "label": "Mole"
      }
    ],
    "earwear": [
      {
        "id": "none",
        "label": "None"
      },
      {
        "id": "earpiece",
        "label": "Radio earpiece"
      },
      {
        "id": "earbuds",
        "label": "Earbuds"
      },
      {
        "id": "defenders",
        "label": "Ear defenders"
      }
    ],
    "turn": [
      {
        "id": "front",
        "label": "Front"
      },
      {
        "id": "right",
        "label": "Look right"
      },
      {
        "id": "left",
        "label": "Look left"
      }
    ],
    "pose": [
      {
        "id": "stand",
        "label": "Standing"
      },
      {
        "id": "wave",
        "label": "Wave"
      },
      {
        "id": "phone",
        "label": "On a call"
      },
      {
        "id": "point",
        "label": "Pointing"
      },
      {
        "id": "arms",
        "label": "Arms crossed"
      },
      {
        "id": "tablet",
        "label": "Checking tablet"
      },
      {
        "id": "pockets",
        "label": "Hands in pockets"
      }
    ],
    "mood": [
      {
        "id": "none",
        "label": "Neutral"
      },
      {
        "id": "happy",
        "label": "Happy"
      },
      {
        "id": "proud",
        "label": "Proud"
      },
      {
        "id": "think",
        "label": "Thinking"
      },
      {
        "id": "shock",
        "label": "Shock"
      },
      {
        "id": "stern",
        "label": "Stern"
      },
      {
        "id": "worried",
        "label": "Worried"
      },
      {
        "id": "cheeky",
        "label": "Cheeky"
      }
    ],
    "status": [
      {
        "id": "none",
        "label": "No badge"
      },
      {
        "id": "onsite",
        "label": "On site"
      },
      {
        "id": "onway",
        "label": "On the way"
      },
      {
        "id": "approved",
        "label": "Approved"
      },
      {
        "id": "inspect",
        "label": "Inspecting"
      },
      {
        "id": "meeting",
        "label": "In a meeting"
      },
      {
        "id": "break",
        "label": "On a break"
      },
      {
        "id": "delay",
        "label": "Delayed"
      },
      {
        "id": "alert",
        "label": "Safety alert"
      },
      {
        "id": "offline",
        "label": "Offline"
      }
    ],
    "hairColor": [
      {
        "id": "black",
        "label": "Black",
        "color": "#16141B"
      },
      {
        "id": "dark",
        "label": "Dark brown",
        "color": "#3D2519"
      },
      {
        "id": "brown",
        "label": "Brown",
        "color": "#7D4523"
      },
      {
        "id": "auburn",
        "label": "Auburn",
        "color": "#A8361C"
      },
      {
        "id": "ginger",
        "label": "Ginger",
        "color": "#F28A2C"
      },
      {
        "id": "red",
        "label": "Red",
        "color": "#E8302A"
      },
      {
        "id": "blonde",
        "label": "Blonde",
        "color": "#F4D27A"
      },
      {
        "id": "grey",
        "label": "Grey",
        "color": "#B5B1BC"
      },
      {
        "id": "white",
        "label": "White",
        "color": "#F5F2EA"
      },
      {
        "id": "teal",
        "label": "Teal",
        "color": "#2C8E9E"
      },
      {
        "id": "blue",
        "label": "Blue",
        "color": "#3D6CFF"
      },
      {
        "id": "pink",
        "label": "Pink",
        "color": "#FF6FA8"
      },
      {
        "id": "purple",
        "label": "Purple",
        "color": "#7B4CDB"
      },
      {
        "id": "signal",
        "label": "Signal",
        "color": "#FF6A12"
      }
    ],
    "eyes": [
      {
        "id": "sharp",
        "label": "Alert"
      },
      {
        "id": "open",
        "label": "Open"
      },
      {
        "id": "calm",
        "label": "Calm"
      },
      {
        "id": "focus",
        "label": "Focused"
      },
      {
        "id": "side",
        "label": "Side look"
      },
      {
        "id": "happy",
        "label": "Smiling"
      },
      {
        "id": "wink",
        "label": "Wink"
      },
      {
        "id": "wide",
        "label": "Wide"
      },
      {
        "id": "dot",
        "label": "Dot"
      }
    ],
    "eyeColor": [
      {
        "id": "ink",
        "label": "Dark",
        "color": "#17161C"
      },
      {
        "id": "brown",
        "label": "Brown",
        "color": "#5A341C"
      },
      {
        "id": "hazel",
        "label": "Hazel",
        "color": "#76592A"
      },
      {
        "id": "green",
        "label": "Green",
        "color": "#2E6E4A"
      },
      {
        "id": "blue",
        "label": "Blue",
        "color": "#2F5DB8"
      },
      {
        "id": "grey",
        "label": "Grey",
        "color": "#5D697D"
      }
    ],
    "brows": [
      {
        "id": "soft",
        "label": "Natural"
      },
      {
        "id": "flat",
        "label": "Straight"
      },
      {
        "id": "arch",
        "label": "Arched"
      },
      {
        "id": "bold",
        "label": "Bold"
      },
      {
        "id": "angle",
        "label": "Angled"
      },
      {
        "id": "raise",
        "label": "Raised"
      },
      {
        "id": "none",
        "label": "None"
      }
    ],
    "mouth": [
      {
        "id": "smile",
        "label": "Smile"
      },
      {
        "id": "grin",
        "label": "Grin"
      },
      {
        "id": "beam",
        "label": "Beam"
      },
      {
        "id": "smirk",
        "label": "Smirk"
      },
      {
        "id": "flat",
        "label": "Flat"
      },
      {
        "id": "open",
        "label": "Talking"
      },
      {
        "id": "o",
        "label": "Surprised"
      },
      {
        "id": "wavy",
        "label": "Unsure"
      }
    ],
    "beard": [
      {
        "id": "none",
        "label": "Clean"
      },
      {
        "id": "stubble",
        "label": "Stubble"
      },
      {
        "id": "soul",
        "label": "Soul patch"
      },
      {
        "id": "goatee",
        "label": "Goatee"
      },
      {
        "id": "anchor",
        "label": "Anchor"
      },
      {
        "id": "boxed",
        "label": "Short beard"
      },
      {
        "id": "full",
        "label": "Full beard"
      },
      {
        "id": "bushy",
        "label": "Bushy beard"
      }
    ],
    "mous": [
      {
        "id": "auto",
        "label": "Match beard"
      },
      {
        "id": "none",
        "label": "None"
      },
      {
        "id": "classic",
        "label": "Classic"
      },
      {
        "id": "chevron",
        "label": "Chevron"
      },
      {
        "id": "pencil",
        "label": "Pencil"
      },
      {
        "id": "walrus",
        "label": "Walrus"
      },
      {
        "id": "handlebar",
        "label": "Handlebar"
      },
      {
        "id": "horseshoe",
        "label": "Horseshoe"
      },
      {
        "id": "fumanchu",
        "label": "Fu Manchu"
      }
    ],
    "glasses": [
      {
        "id": "none",
        "label": "None"
      },
      {
        "id": "round",
        "label": "Round"
      },
      {
        "id": "square",
        "label": "Square"
      },
      {
        "id": "safety",
        "label": "Safety"
      },
      {
        "id": "shades",
        "label": "Shades"
      }
    ],
    "hat": [
      {
        "id": "none",
        "label": "None"
      },
      {
        "id": "hardhat",
        "label": "Hard hat"
      },
      {
        "id": "fullbrim",
        "label": "Full-brim hard hat"
      },
      {
        "id": "beanie",
        "label": "Beanie"
      },
      {
        "id": "cap",
        "label": "Cap"
      },
      {
        "id": "turban",
        "label": "Turban"
      }
    ],
    "hatColor": [
      {
        "id": "white",
        "label": "White",
        "color": "#FBFAF6"
      },
      {
        "id": "yellow",
        "label": "Yellow",
        "color": "#FFD21E"
      },
      {
        "id": "orange",
        "label": "Orange",
        "color": "#FF7A10"
      },
      {
        "id": "blue",
        "label": "Blue",
        "color": "#2D6CFF"
      },
      {
        "id": "green",
        "label": "Green",
        "color": "#18B865"
      },
      {
        "id": "red",
        "label": "Red",
        "color": "#F03A2E"
      },
      {
        "id": "black",
        "label": "Black",
        "color": "#26252B"
      },
      {
        "id": "gold",
        "label": "Gold",
        "color": "#E9B53A"
      },
      {
        "id": "navy",
        "label": "Navy",
        "color": "#24377A"
      },
      {
        "id": "pink",
        "label": "Pink",
        "color": "#FF6FA8"
      },
      {
        "id": "purple",
        "label": "Purple",
        "color": "#7B4CDB"
      }
    ],
    "sticker": [
      {
        "id": "none",
        "label": "None"
      },
      {
        "id": "hazard",
        "label": "Hazard"
      },
      {
        "id": "bolt",
        "label": "Electrical"
      },
      {
        "id": "crane",
        "label": "Lifting"
      },
      {
        "id": "cross",
        "label": "First aid"
      },
      {
        "id": "star",
        "label": "Top contributor"
      },
      {
        "id": "rank",
        "label": "Rank chevron"
      }
    ],
    "top": [
      {
        "id": "hivis",
        "label": "Hi-vis vest"
      },
      {
        "id": "hivis-lime",
        "label": "Hi-vis, lime"
      },
      {
        "id": "jacket",
        "label": "Work jacket"
      },
      {
        "id": "tee",
        "label": "T-shirt"
      },
      {
        "id": "polo",
        "label": "Polo"
      },
      {
        "id": "hoodie",
        "label": "Hoodie"
      },
      {
        "id": "overalls",
        "label": "Overalls"
      },
      {
        "id": "shirt",
        "label": "Shirt and tie"
      },
      {
        "id": "blazer",
        "label": "Blazer"
      }
    ],
    "topColor": [
      {
        "id": "navy",
        "label": "Navy",
        "color": "#24377A"
      },
      {
        "id": "charcoal",
        "label": "Charcoal",
        "color": "#2E2D36"
      },
      {
        "id": "denim",
        "label": "Denim",
        "color": "#3E74C8"
      },
      {
        "id": "olive",
        "label": "Olive",
        "color": "#6F8C2B"
      },
      {
        "id": "forest",
        "label": "Forest",
        "color": "#1C8C5B"
      },
      {
        "id": "rust",
        "label": "Rust",
        "color": "#DB5626"
      },
      {
        "id": "red",
        "label": "Red",
        "color": "#E5333F"
      },
      {
        "id": "sky",
        "label": "Sky",
        "color": "#45A8F2"
      },
      {
        "id": "teal",
        "label": "Teal",
        "color": "#18A3A3"
      },
      {
        "id": "purple",
        "label": "Purple",
        "color": "#7B4CDB"
      },
      {
        "id": "sand",
        "label": "Sand",
        "color": "#EAC98D"
      },
      {
        "id": "white",
        "label": "White",
        "color": "#F7F4EC"
      }
    ],
    "pants": [
      {
        "id": "work",
        "label": "Work grey",
        "color": "#3B4152"
      },
      {
        "id": "navy",
        "label": "Navy",
        "color": "#22306A"
      },
      {
        "id": "khaki",
        "label": "Khaki",
        "color": "#B59A5E"
      },
      {
        "id": "denim",
        "label": "Denim",
        "color": "#3E74C8"
      },
      {
        "id": "black",
        "label": "Black",
        "color": "#232229"
      },
      {
        "id": "olive",
        "label": "Olive",
        "color": "#5F7428"
      }
    ],
    "pantsStyle": [
      {
        "id": "work",
        "label": "Work trousers"
      },
      {
        "id": "cargo",
        "label": "Cargo"
      },
      {
        "id": "kneepad",
        "label": "Knee pads"
      },
      {
        "id": "reflective",
        "label": "Hi-vis trousers"
      },
      {
        "id": "jeans",
        "label": "Jeans"
      },
      {
        "id": "joggers",
        "label": "Joggers"
      },
      {
        "id": "shorts",
        "label": "Shorts"
      }
    ],
    "shoes": [
      {
        "id": "boots",
        "label": "Work boots"
      },
      {
        "id": "safety",
        "label": "Steel toe"
      },
      {
        "id": "hiker",
        "label": "Hikers"
      },
      {
        "id": "rigger",
        "label": "Riggers"
      },
      {
        "id": "wellies",
        "label": "Wellies"
      },
      {
        "id": "sneaker",
        "label": "Trainers"
      }
    ],
    "shoeColor": [
      {
        "id": "tan",
        "label": "Tan",
        "color": "#A8682F"
      },
      {
        "id": "brown",
        "label": "Brown",
        "color": "#5E3A1F"
      },
      {
        "id": "black",
        "label": "Black",
        "color": "#26252B"
      },
      {
        "id": "grey",
        "label": "Grey",
        "color": "#727684"
      },
      {
        "id": "olive",
        "label": "Olive",
        "color": "#61762A"
      },
      {
        "id": "sand",
        "label": "Sand",
        "color": "#D3AD6C"
      },
      {
        "id": "signal",
        "label": "Signal",
        "color": "#FF6A12"
      }
    ],
    "badge": [
      {
        "id": "pass",
        "label": "SiteCall pass"
      },
      {
        "id": "none",
        "label": "No pass"
      }
    ],
    "acc": [
      {
        "id": "none",
        "label": "Hands free"
      },
      {
        "id": "tablet",
        "label": "Site tablet"
      },
      {
        "id": "coffee",
        "label": "Coffee"
      },
      {
        "id": "tape",
        "label": "Tape measure"
      },
      {
        "id": "radio",
        "label": "Radio"
      },
      {
        "id": "roll",
        "label": "Drawings"
      }
    ],
    "bg": [
      {
        "id": "concrete",
        "label": "Concrete"
      },
      {
        "id": "steel",
        "label": "Steel"
      },
      {
        "id": "sand",
        "label": "Sand"
      },
      {
        "id": "olive",
        "label": "Olive"
      },
      {
        "id": "signal",
        "label": "Signal"
      },
      {
        "id": "hazard",
        "label": "Hazard"
      },
      {
        "id": "blueprint",
        "label": "Blueprint"
      },
      {
        "id": "ink",
        "label": "Ink"
      },
      {
        "id": "skyline",
        "label": "Skyline"
      },
      {
        "id": "dusk",
        "label": "Dusk"
      },
      {
        "id": "mint",
        "label": "Mint"
      },
      {
        "id": "pink",
        "label": "Pink"
      },
      {
        "id": "brick",
        "label": "Brick"
      },
      {
        "id": "crane",
        "label": "Tower crane"
      },
      {
        "id": "topo",
        "label": "Survey"
      },
      {
        "id": "rebar",
        "label": "Rebar"
      },
      {
        "id": "night",
        "label": "Night shift"
      },
      {
        "id": "drafting",
        "label": "Drafting"
      }
    ]
  };
  /* how the builder groups them into tabs (preview: which render mode its tiles use) */
  SCA.TABS = [
    {
      "id": "face",
      "label": "FACE",
      "sections": [
        {
          "key": "skin",
          "label": "SKIN TONE",
          "preview": "s"
        },
        {
          "key": "face",
          "label": "FACE SHAPE",
          "preview": "head"
        }
      ]
    },
    {
      "id": "hair",
      "label": "HAIR",
      "sections": [
        {
          "key": "hair",
          "label": "STYLE",
          "preview": "head"
        },
        {
          "key": "hairColor",
          "label": "COLOUR",
          "preview": "s"
        }
      ]
    },
    {
      "id": "eyes",
      "label": "EYES",
      "sections": [
        {
          "key": "eyes",
          "label": "EYES",
          "preview": "head"
        },
        {
          "key": "eyeColor",
          "label": "EYE COLOUR",
          "preview": "s"
        },
        {
          "key": "brows",
          "label": "BROWS",
          "preview": "head"
        }
      ]
    },
    {
      "id": "mouth",
      "label": "MOUTH",
      "sections": [
        {
          "key": "mouth",
          "label": "EXPRESSION",
          "preview": "head"
        }
      ]
    },
    {
      "id": "beard",
      "label": "BEARD",
      "sections": [
        {
          "key": "beard",
          "label": "BEARD",
          "preview": "head"
        },
        {
          "key": "mous",
          "label": "MOUSTACHE",
          "preview": "head"
        }
      ]
    },
    {
      "id": "glasses",
      "label": "EYEWEAR",
      "sections": [
        {
          "key": "glasses",
          "label": "EYEWEAR",
          "preview": "head"
        }
      ]
    },
    {
      "id": "details",
      "label": "DETAILS",
      "sections": [
        {
          "key": "age",
          "label": "AGE LINES",
          "preview": "head"
        },
        {
          "key": "marks",
          "label": "SKIN MARKS",
          "preview": "head"
        },
        {
          "key": "earwear",
          "label": "EARWEAR",
          "preview": "head"
        }
      ]
    },
    {
      "id": "hat",
      "label": "HEADWEAR",
      "sections": [
        {
          "key": "hat",
          "label": "HEADWEAR",
          "preview": "head"
        },
        {
          "key": "hatColor",
          "label": "COLOUR",
          "preview": "s"
        },
        {
          "key": "sticker",
          "label": "HARD HAT STICKER",
          "preview": "head"
        }
      ]
    },
    {
      "id": "top",
      "label": "OUTFIT",
      "sections": [
        {
          "key": "top",
          "label": "TOP",
          "preview": "torso"
        },
        {
          "key": "topColor",
          "label": "COLOUR",
          "preview": "s"
        }
      ]
    },
    {
      "id": "legs",
      "label": "TROUSERS",
      "sections": [
        {
          "key": "pantsStyle",
          "label": "STYLE",
          "preview": "legs"
        },
        {
          "key": "pants",
          "label": "COLOUR",
          "preview": "s"
        }
      ]
    },
    {
      "id": "shoes",
      "label": "BOOTS",
      "sections": [
        {
          "key": "shoes",
          "label": "FOOTWEAR",
          "preview": "legs"
        },
        {
          "key": "shoeColor",
          "label": "COLOUR",
          "preview": "s"
        }
      ]
    },
    {
      "id": "acc",
      "label": "GEAR",
      "sections": [
        {
          "key": "acc",
          "label": "CARRY",
          "preview": "full"
        },
        {
          "key": "badge",
          "label": "SITE PASS",
          "preview": "torso"
        }
      ]
    },
    {
      "id": "bg",
      "label": "PLATE",
      "sections": [
        {
          "key": "bg",
          "label": "PLATE BACKGROUND",
          "preview": "bust"
        }
      ]
    },
    {
      "id": "pose",
      "label": "POSE",
      "sections": [
        {
          "key": "pose",
          "label": "DEFAULT POSE",
          "preview": "full"
        },
        {
          "key": "turn",
          "label": "LOOKING",
          "preview": "c"
        },
        {
          "key": "mood",
          "label": "TRY A REACTION",
          "preview": "head"
        },
        {
          "key": "status",
          "label": "STATUS BADGE (SET BY THE APP)",
          "preview": "c"
        }
      ]
    }
  ];
  /* rank / badge locks the builder applies (r = rank index into RANKS, b = badge name) */
  SCA.RANKS = ["Duckling","Quacker","Drake","Head Duck"];
  SCA.LOCKS = {};
  /* status badges: 24-unit grid, one stroke weight (2), round caps, at most three strokes */
  var V = DUCK_PALETTE.vhs;
  SCA.STATUS = {
    "rec":      { "c": V.red,     "ink": "#FFFFFF", "label": "Live",        "d": "M12 7A5 5 0 1 1 11.99 7Z", "fill": true },
    "play":     { "c": V.green,   "ink": V.tape,    "label": "Online",      "d": "M8.5 6L18 12L8.5 18Z", "fill": true },
    "pause":    { "c": V.yellow,  "ink": V.tape,    "label": "On a break",  "d": "M9 6.5V17.5M15 6.5V17.5", "sw": 3.2 },
    "ff":       { "c": V.cyan,    "ink": V.tape,    "label": "Shipping",    "d": "M4.5 7L11.5 12L4.5 17ZM12.5 7L19.5 12L12.5 17Z", "fill": true },
    "rew":      { "c": V.purple,  "ink": "#FFFFFF", "label": "Fixing bugs", "d": "M19.5 7L12.5 12L19.5 17ZM11.5 7L4.5 12L11.5 17Z", "fill": true },
    "stop":     { "c": V.magenta, "ink": "#FFFFFF", "label": "Busy",        "d": "M7.5 7.5H16.5V16.5H7.5Z", "fill": true },
    "eject":    { "c": V.orange,  "ink": V.tape,    "label": "Away",        "d": "M12 6L18 13H6ZM6.5 17H17.5", "fill": true },
    "nosignal": { "c": "#7A7C93", "ink": "#FFFFFF", "label": "Offline",     "d": "M5 5L19 19M5 19L19 5" }
  };

  var uid = 0;
  function attrs(q) {
    return ' d="' + q.d + '" fill="' + q.fill + '" stroke="' + q.stroke + '" stroke-width="' + q.sw + '"' +
      (q.tf ? ' transform="' + q.tf + '"' : '') + (q.op != null && q.op !== 1 ? ' opacity="' + q.op + '"' : '') + (q.fr ? ' fill-rule="' + q.fr + '"' : '');
  }
  function paths(list) { var s = ''; for (var i = 0; i < (list || []).length; i++) s += '<path' + attrs(list[i]) + '/>'; return s; }
  function chamfer(x, y, w, h, k) { var a = w * k, b = h * k; return [[x + a, y], [x + w - a, y], [x + w, y + b], [x + w, y + h - b], [x + w - a, y + h], [x + a, y + h], [x, y + h - b], [x, y + b]].map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' '); }
  function badgeSVG(st, x, y, bs) {
    var pts = function (o, s) { return [[0.28, 0], [1, 0], [1, 0.72], [0.72, 1], [0, 1], [0, 0.28]].map(function (p) { return (x + o + p[0] * s).toFixed(2) + ',' + (y + o + p[1] * s).toFixed(2); }).join(' '); };
    var ic = bs * 0.74 * (bs - 4) / bs, io = (bs - ic) / 2;
    return '<g role="img" aria-label="' + st.label + '"><polygon points="' + pts(0, bs) + '" fill="' + V.tape + '"/><polygon points="' + pts(2, bs - 4) + '" fill="' + st.c + '"/>' +
      '<svg x="' + (x + io).toFixed(2) + '" y="' + (y + io).toFixed(2) + '" width="' + ic.toFixed(2) + '" height="' + ic.toFixed(2) + '" viewBox="0 0 24 24" fill="' + (st.fill ? st.ink : 'none') + '" stroke="' + st.ink + '" stroke-width="' + (st.sw || 2) + '" stroke-linecap="round" stroke-linejoin="round"><path d="' + st.d + '"/></svg></g>';
  }
  /* renderSVG(spec, options) -> a complete, self-contained <svg> string.
     options: mode 'full' | 'bust' | 'head' | 'torso' | 'legs' (default 'full'); size (px width, default 200);
     mood; pose; facing ('front' | 'left' | 'right'); ground (shadow under full figures, default true);
     status (a key of SCA.STATUS); edge (plate border colour, plate modes only); title (accessible name) */
  SCA.renderSVG = function (spec, o) {
    o = o || {};
    var mode = o.mode || 'full', size = +o.size || 200, r = SCA.build(spec || {}, mode, o.mood && o.mood !== 'none' ? o.mood : null, o.ground !== false, o.pose || null, o.facing || null);
    var id = 'sca' + (++uid) + '_' + Math.random().toString(36).slice(2, 7), vb = r.vb.split(' ').map(Number), h = Math.round(size * vb[3] / vb[2]);
    var plate = mode !== 'full', bgOn = plate && (spec || {}).bg !== 'none';
    var body = paths(r.bg) +
      '<defs><clipPath id="' + id + 'f"><path d="' + r.clipFace + '"/></clipPath><clipPath id="' + id + 'b"><path d="' + r.clipBeard + '"/></clipPath><clipPath id="' + id + 'u"><path d="' + r.clipUnder + '"/></clipPath><clipPath id="' + id + 'j"><path d="' + r.clipJaw + '" clip-rule="evenodd"/></clipPath><clipPath id="' + id + 'k"><path d="' + r.clipOut + '" clip-rule="evenodd"/></clipPath><clipPath id="' + id + 'h"><path d="' + r.clipHair + '" transform="' + r.hairTf + '"/></clipPath>' +
      (bgOn ? '<clipPath id="' + id + 'p"><polygon points="' + chamfer(vb[0], vb[1], vb[2], vb[3], 0.14) + '"/></clipPath>' : '') + '</defs>' +
      '<g transform="' + r.headTf + '"><g clip-path="url(#' + id + 'u)">' + paths(r.back) + '</g></g>' + paths(r.body) +
      '<g transform="' + r.headTf + '">' + paths(r.hb) + '<g clip-path="url(#' + id + 'f)">' + paths(r.base) + '</g><g clip-path="url(#' + id + 'b)"><g transform="' + r.faceTf + '">' + paths(r.beard) + '</g></g>' +
      '<g clip-path="url(#' + id + 'f)"><g transform="' + r.faceTf + '">' + paths(r.face) + '</g></g><g clip-path="url(#' + id + 'j)">' + paths(r.top) + '</g><g clip-path="url(#' + id + 'k)">' + paths(r.chin) + '</g>' +
      '<g clip-path="url(#' + id + 'u)">' + paths(r.hair) + '<g clip-path="url(#' + id + 'h)">' + paths(r.hairIn) + '</g>' + paths(r.hairLine) + '</g>' + paths(r.top2) + '</g>' + paths(r.over);
    if (bgOn) body = '<g clip-path="url(#' + id + 'p)">' + body + '</g>';
    if (bgOn && o.edge) body += '<polygon points="' + chamfer(vb[0], vb[1], vb[2], vb[3], 0.14) + '" fill="none" stroke="' + o.edge + '" stroke-width="' + (vb[2] / size * Math.max(2, size / 40) * 2).toFixed(2) + '"/>';
    var st = SCA.STATUS[o.status], badge = '';
    if (st) { var bs = Math.max(16, Math.round(size * (plate ? 0.3 : 0.26))); badge = badgeSVG(st, size - bs, 0, bs); }
    /* ---- tape effects (fx: false switches them all off) ----
       ghost:  flat magenta / cyan silhouettes pushed out left and right behind the figure (full figures only)
       split:  red vs green+blue channel offset, the VHS colour bleed
       scan:   scanlines over the artwork only                                                         */
    var fx = o.fx !== false && o.fx !== 'none', defs = '';
    if (fx) {
      var sp2 = o.split == null ? 0.9 : +o.split, gh = bgOn ? 0 : (o.ghost == null ? 2.6 : +o.ghost), sc = o.scan == null ? 0.16 : +o.scan, m5 = '0 0 0 0 0';
      defs = '<defs><filter id="' + id + 'v" x="-12%" y="-6%" width="124%" height="112%" color-interpolation-filters="sRGB">' +
        '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  ' + m5 + '  ' + m5 + '  0 0 0 1 0" result="r"/><feOffset in="r" dx="' + (-sp2) + '" result="ro"/>' +
        '<feColorMatrix in="SourceGraphic" type="matrix" values="' + m5 + '  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/><feOffset in="gb" dx="' + sp2 + '" result="gbo"/>' +
        '<feBlend in="ro" in2="gbo" mode="screen" result="art"/>' +
        (gh ? '<feFlood flood-color="' + V.magenta + '" result="fm"/><feComposite in="fm" in2="SourceAlpha" operator="in" result="gm"/><feOffset in="gm" dx="' + (-gh) + '" dy="' + (gh * 0.3).toFixed(2) + '" result="gmo"/>' +
          '<feFlood flood-color="' + V.cyan + '" result="fc"/><feComposite in="fc" in2="SourceAlpha" operator="in" result="gc"/><feOffset in="gc" dx="' + gh + '" dy="' + (-gh * 0.3).toFixed(2) + '" result="gco"/>' +
          '<feMerge><feMergeNode in="gmo"/><feMergeNode in="gco"/><feMergeNode in="art"/></feMerge>' : '') +
        '</filter>' +
        (sc ? '<pattern id="' + id + 's" width="4" height="2.6" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="' + V.tape + '"/></pattern><mask id="' + id + 'm" style="mask-type:alpha"><use href="#' + id + 'g"/></mask>' : '') + '</defs>';
      body = defs + '<g class="duck-av-art" filter="url(#' + id + 'v)"><g id="' + id + 'g">' + body + '</g></g>' +
        (sc ? '<rect class="duck-av-scan" x="' + vb[0] + '" y="' + vb[1] + '" width="' + vb[2] + '" height="' + vb[3] + '" fill="url(#' + id + 's)" opacity="' + sc + '" mask="url(#' + id + 'm)" pointer-events="none"/>' : '');
    }
    var pad = fx && !bgOn ? 4 : 0, vbx = [vb[0] - pad, vb[1], vb[2] + pad * 2, vb[3]];
    return '<svg xmlns="http://www.w3.org/2000/svg" class="duck-av" width="' + size + '" height="' + h + '" viewBox="0 0 ' + size + ' ' + h + '" role="img" aria-label="' + (o.title || 'Avatar').replace(/"/g, '&quot;') + '">' +
      '<svg x="0" y="0" width="' + size + '" height="' + h + '" viewBox="' + vbx.join(' ') + '" style="stroke-linecap:round;stroke-linejoin:round" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>' + badge + '</svg>';
  };
  /* a random, valid spec (handy for tests and demos) */
  SCA.randomSpec = function (rnd) {
    rnd = rnd || Math.random; var s = {}, skip = { turn: 1, pose: 1, mood: 1, status: 1 };
    Object.keys(SCA.OPTIONS).forEach(function (k) { if (skip[k]) return; var l = SCA.OPTIONS[k]; s[k] = l[Math.floor(rnd() * l.length)].id; });
    return s;
  };
  /* option lists follow DUCK_PALETTE, so a palette edit shows up in a builder UI without touching anything else */
  (function () {
    var P = DUCK_PALETTE, map = { skin: 'skin', hairColor: 'hair', topColor: 'top', hatColor: 'hat', eyeColor: 'eye', pants: 'pants', shoeColor: 'shoe', wrapColor: 'wrap', bg: 'bg' };
    Object.keys(map).forEach(function (k) { SCA.OPTIONS[k] = P[map[k]].map(function (c) { return { id: c[0], label: c[1], color: c[2] }; }); });
    SCA.OPTIONS.status = [{ id: 'none', label: 'No badge' }].concat(Object.keys(SCA.STATUS).map(function (k) { return { id: k, label: SCA.STATUS[k].label }; }));
    SCA.OPTIONS.acc = [{ id: 'none', label: 'Hands free' }, { id: 'duck', label: 'Rubber duck' }, { id: 'vhs', label: 'VHS tape' }, { id: 'pad', label: 'Game pad' }, { id: 'tablet', label: 'Tablet' }, { id: 'coffee', label: 'Coffee' }, { id: 'radio', label: 'Walkie-talkie' }, { id: 'roll', label: 'Poster roll' }];
    var relabel = { badge: { pass: 'Crew pass', none: 'No pass' }, earwear: { defenders: 'Headphones', earpiece: 'Earpiece' }, top: { hivis: 'Vest, orange', 'hivis-lime': 'Vest, lime' }, glasses: { safety: 'Visor' } };
    Object.keys(relabel).forEach(function (k) { (SCA.OPTIONS[k] || []).forEach(function (op) { if (relabel[k][op.id]) op.label = relabel[k][op.id]; }); });
    /* studio wardrobe first: site gear (hard hats, hi-vis) is still valid in a spec but is not offered */
    var drop = { hat: { hardhat: 1, fullbrim: 1 }, sticker: { hazard: 1, crane: 1, cross: 1, rank: 1 }, acc: {}, pantsStyle: { kneepad: 1, reflective: 1 }, shoes: { safety: 1, rigger: 1, wellies: 1 }, top: { hivis: 1, 'hivis-lime': 1 } };
    Object.keys(drop).forEach(function (k) { if (SCA.OPTIONS[k]) SCA.OPTIONS[k] = SCA.OPTIONS[k].filter(function (op) { return !drop[k][op.id]; }); });
    SCA.PALETTE = P;
  })();
})(SCA);

if (typeof module !== 'undefined' && module.exports) module.exports = SCA;
if (typeof window !== 'undefined') window.DuckAvatar = SCA;
