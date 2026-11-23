/* Duck Initiative — the soundtrack. A small lo-fi loop made in the browser (no audio file), played as if
   off a worn tape: slow wobble, hiss, and the pitch bends when you scroll fast, like fast-forward.
   Browsers only allow sound after a click, so it starts from the MUSIC button on the tape deck.
   To use your own track instead, set DuckAudio.SRC = 'assets/audio/your-file.mp3' below. */
var DuckAudio = (function () {
  var SRC = '';                       /* optional: path to an audio file to loop instead of the built-in tune */
  var KEY = 'duck.music', ctx = null, master, tone, wob, warp, on = false, timer = 0, step = 0, nextT = 0, vol = 0.5, tag = null, raf = 0, noiseBuf;
  var BPM = 76, S16 = 60 / BPM / 4;
  /* four bars: Fmaj7, Em7, Dm9, Cmaj7 */
  var CH = [[174.61, 220.0, 261.63, 329.63], [164.81, 196.0, 246.94, 293.66], [146.83, 174.61, 220.0, 329.63], [130.81, 164.81, 196.0, 246.94]];
  var LEAD = [[0, 2], [3, 3], [6, 1], [10, 2], [12, 3], [14, 0]];
  function saved() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function save(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }
  function build() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2100; tone.Q.value = 0.6; tone.connect(master);
    /* tape wobble (always on) and scroll warp (follows scroll speed), both in cents on every voice */
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.55; wob = ctx.createGain(); wob.gain.value = 9; lfo.connect(wob); lfo.start();
    warp = ctx.createConstantSource ? ctx.createConstantSource() : null; if (warp) { warp.offset.value = 0; warp.start(); }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var hiss = ctx.createBufferSource(); hiss.buffer = noiseBuf; hiss.loop = true; var hf = ctx.createBiquadFilter(); hf.type = 'bandpass'; hf.frequency.value = 5200; hf.Q.value = 0.4;
    var hg = ctx.createGain(); hg.gain.value = 0.018; hiss.connect(hf); hf.connect(hg); hg.connect(master); hiss.start();
    return true;
  }
  function osc(type, f, t, dur, peak, att, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; wob.connect(o.detune); if (warp) warp.connect(o.detune);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || tone); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function noise(t, dur, peak, type, freq) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function kick(t) { var o = osc('sine', 120, t, 0.26, 0.5, 0.004, master); o.frequency.exponentialRampToValueAtTime(42, t + 0.16); }
  function sched(i, t) {
    var bar = Math.floor(i / 16) % 4, s = i % 16, c = CH[bar];
    if (s === 0) c.forEach(function (f, k) { osc(k % 2 ? 'triangle' : 'sawtooth', f, t, S16 * 17, k % 2 ? 0.07 : 0.035, 0.35); });
    if (s === 0 || s === 6 || s === 10) osc('triangle', c[0] / 2, t, S16 * 3.4, 0.2, 0.01);
    if (s === 0 || s === 8 || (s === 11 && bar % 2)) kick(t);
    if (s === 4 || s === 12) noise(t, 0.16, 0.11, 'bandpass', 1700);
    if (s % 2 === 0) noise(t + (s % 4 ? 0.012 : 0), 0.045, s % 4 ? 0.05 : 0.028, 'highpass', 7000);
    LEAD.forEach(function (n) { if (n[0] === s && (bar + n[0]) % 3 !== 1) osc('square', c[n[1]] * 2, t, S16 * 2.6, 0.028, 0.01); });
  }
  function pump() { if (!on) return; while (nextT < ctx.currentTime + 0.25) { sched(step++, nextT); nextT += S16 * (step % 2 ? 1.14 : 0.86); } }   /* light swing */
  function follow() {
    raf = requestAnimationFrame(follow); if (!on || !ctx) return;
    var vd = parseFloat(document.documentElement.style.getPropertyValue('--vd')) || 0, trk = parseFloat(document.documentElement.style.getPropertyValue('--trk'));
    if (warp) warp.offset.setTargetAtTime(vd * 520, ctx.currentTime, 0.08);
    if (!isNaN(trk)) wob.gain.setTargetAtTime(3 + trk * 26, ctx.currentTime, 0.2);
    if (tag) tag.playbackRate = Math.max(0.5, Math.min(1.6, 1 + vd * 0.5));
  }
  function start() {
    if (SRC) { if (!tag) { tag = new Audio(SRC); tag.loop = true; tag.preservesPitch = false; } tag.volume = vol; tag.play().catch(function () {}); on = true; }
    else {
      if (!ctx && !build()) return false; ctx.resume(); on = true; step = 0; nextT = ctx.currentTime + 0.08;
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(vol, ctx.currentTime, 0.25); clearInterval(timer); timer = setInterval(pump, 60); pump();
    }
    if (!raf) follow(); save(true); emit(); return true;
  }
  function stop() {
    on = false; clearInterval(timer); if (tag) tag.pause(); if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.12); save(false); emit();
  }
  function emit() { document.dispatchEvent(new CustomEvent('duck-music', { detail: { on: on } })); }
  /* little sound effects, only while the music is on */
  function quack() { if (!on || !ctx) return; var t = ctx.currentTime, o = osc('sawtooth', 520, t, 0.16, 0.16, 0.008, master); o.frequency.exponentialRampToValueAtTime(260, t + 0.14); var o2 = osc('square', 300, t + 0.02, 0.12, 0.05, 0.005, master); o2.frequency.exponentialRampToValueAtTime(180, t + 0.12); }
  function dread(sec) { if (!on || !ctx) return; var t = ctx.currentTime; sec = sec || 5; tone.frequency.cancelScheduledValues(t); tone.frequency.setTargetAtTime(420, t, 0.5); tone.frequency.setTargetAtTime(2100, t + sec, 0.8); wob.gain.setTargetAtTime(38, t, 0.4); wob.gain.setTargetAtTime(9, t + sec, 0.8); var o = osc('sine', 55, t, Math.min(sec, 9), 0.16, 1.2, master); o.frequency.linearRampToValueAtTime(49, t + Math.min(sec, 9)); }
  function nom() { if (!on || !ctx) return; var t = ctx.currentTime; osc('square', 660, t, 0.06, 0.07, 0.003, master); osc('square', 990, t + 0.06, 0.08, 0.07, 0.003, master); }
  /* if the visitor had music on, start it again on their first click or key press on the next page */
  if (typeof document !== 'undefined' && saved()) {
    var arm = function (e) { document.removeEventListener('pointerdown', arm); document.removeEventListener('keydown', arm); if (e.target && e.target.closest && e.target.closest('[data-k="music"]')) return; if (!on) start(); };
    document.addEventListener('pointerdown', arm); document.addEventListener('keydown', arm);
  }
  return { start: start, stop: stop, toggle: function () { return on ? (stop(), false) : start(); }, isOn: function () { return on; }, wanted: saved,
    volume: function (v) { vol = v; if (tag) tag.volume = v; if (ctx && on) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05); }, quack: quack, nom: nom, dread: dread };
})();
