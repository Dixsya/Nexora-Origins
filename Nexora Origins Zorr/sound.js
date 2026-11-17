'use strict';
/* Zorr Sound — efek suara & musik latar bergaya Harvest Moon (SNES / pertanian santai).
   Semua disintesis dengan WebAudio (tanpa file audio): lonceng lembut, seruling, bunyi kayu/tanah. */
(() => {
const K_SFX = 'zorr.snd.sfx', K_MUS = 'zorr.snd.music';
let ctx = null, comp = null, sfxG = null, musG = null, noiseBuf = null, musTimer = null, phrase = 0;
const read = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
let sfxOn = read(K_SFX, true), musOn = read(K_MUS, true);
const listeners = [];

function init() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try {
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
    sfxG = newBus(0.6); musG = newBus(0.16);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ctx = null; return false; }
  return true;
}

function newBus(v) { const g = ctx.createGain(); g.gain.value = v; g.connect(comp); return g; }
/* matikan seketika semua suara yang sudah terjadwal di bus itu (nada yang dijadwalkan ke depan ikut hilang) */
function killBus(which) {
  if (!ctx) return;
  const old = which === 'mus' ? musG : sfxG, v = which === 'mus' ? 0.16 : 0.6, t = ctx.currentTime;
  try { old.gain.cancelScheduledValues(t); old.gain.setValueAtTime(old.gain.value, t); old.gain.linearRampToValueAtTime(0, t + 0.04); } catch (e) {}
  setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 120);
  if (which === 'mus') musG = newBus(v); else sfxG = newBus(v);
}
/* nada dasar: freq, durasi, gelombang, volume, slide ke freq lain, jeda mulai, tujuan, attack */
function tone(f, dur, type, vol, slide, delay, dest, att) {
  const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain(), a = att || 0.012;
  o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol || 0.3, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.03);
}
/* lonceng lembut ala SNES: sinus + overtone, peluruhan panjang */
function bell(f, dur, vol, delay, dest) {
  tone(f, dur, 'sine', vol, null, delay, dest, 0.008);
  tone(f * 2, dur * 0.5, 'sine', vol * 0.35, null, delay, dest, 0.008);
  tone(f * 3.01, dur * 0.25, 'sine', vol * 0.12, null, delay, dest, 0.008);
}
/* seruling / ocarina: sinus + sedikit vibrato */
function flute(f, dur, vol, delay, dest) {
  const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f, t);
  lfo.frequency.value = 5; lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
  g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.06, dur - 0.12));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || sfxG);
  o.start(t); lfo.start(t); o.stop(t + dur + 0.03); lfo.stop(t + dur + 0.03);
}
function noise(dur, vol, freq, q, delay, type) {
  const t = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = type || 'lowpass'; f.frequency.value = freq || 1200; f.Q.value = q || 0.8;
  g.gain.setValueAtTime(vol || 0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxG); s.start(t); s.stop(t + dur + 0.03);
}
const N = {B3: 246.9, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, B5: 987.8, C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568};
const arp = (notes, step, fn) => notes.forEach((f, i) => fn(f, i * step));

const SFX = {
  click() { tone(N.A5, 0.05, 'triangle', 0.14); },
  select() { tone(N.E5, 0.05, 'triangle', 0.13); tone(N.A5, 0.05, 'triangle', 0.1, null, 0.04); },
  hit() { noise(0.08, 0.3, 500 + Math.random() * 250, 1); tone(120 + Math.random() * 30, 0.08, 'triangle', 0.22, 80); },          /* tok kayu / tanah */
  break() { noise(0.22, 0.45, 600, 0.7); tone(110, 0.18, 'triangle', 0.3, 55); bell(N.C5, 0.2, 0.06, 0.05); },
  place() { tone(200, 0.09, 'triangle', 0.3, 120); noise(0.05, 0.14, 420); },
  plant() { noise(0.1, 0.12, 2200, 0.8, 0, 'highpass'); bell(N.G5, 0.2, 0.2, 0.03); bell(N.C6, 0.3, 0.2, 0.1); },                 /* tabur benih */
  harvest() { noise(0.1, 0.14, 2500, 1, 0, 'highpass'); arp([N.C5, N.E5, N.G5, N.C6], 0.075, (f, d) => { bell(f, 0.32, 0.22, 0.03 + d); }); }, /* dapat item */
  gem() { bell(N.E6, 0.4, 0.2); bell(N.G6, 0.5, 0.18, 0.08); bell(N.C6, 0.4, 0.1, 0.16); },
  jump() { tone(280, 0.16, 'sine', 0.22, 560); },
  land() { noise(0.1, 0.26, 380, 0.7); tone(85, 0.1, 'sine', 0.3, 55); },
  step() { noise(0.045, 0.09, 380 + Math.random() * 260, 1); },                                                                  /* rumput */
  climb() { tone(330 + Math.random() * 30, 0.05, 'triangle', 0.12); noise(0.03, 0.07, 900); },
  buy() { bell(N.E6, 0.18, 0.2); bell(N.A5 * 2, 0.5, 0.2, 0.09); noise(0.05, 0.08, 6000, 1, 0.02, 'highpass'); },                 /* koin */
  error() { tone(N.A4, 0.1, 'triangle', 0.22); tone(N.E4, 0.2, 'triangle', 0.22, null, 0.1); },
  wrong() { tone(N.G4, 0.16, 'triangle', 0.24); tone(N.E4, 0.2, 'triangle', 0.24, null, 0.15); tone(N.C4, 0.35, 'triangle', 0.24, null, 0.32); },
  hint() { flute(N.A5, 0.16, 0.2); flute(N.D6, 0.3, 0.2, 0.13); },
  correct() { arp([N.C5, N.E5, N.G5, N.C6], 0.1, (f, d) => { flute(f, 0.24, 0.2, d); bell(f, 0.3, 0.1, d); }); },
  fanfare() {                                                                                                                      /* jingle festival panen */
    const m = [[N.G5, 0], [N.G5, .14], [N.A5, .28], [N.G5, .5], [N.C6, .72], [N.B5, 1.1], [N.G5, 1.4], [N.G5, 1.54], [N.A5, 1.68], [N.G5, 1.9], [N.D6, 2.12], [N.C6, 2.5]];
    m.forEach(([f, d], i) => { flute(f, i === m.length - 1 ? 0.9 : 0.24, 0.2, d); bell(f / 2, 0.5, 0.08, d); });
    tone(N.C4, 1.2, 'triangle', 0.2, null, 0); tone(N.G4, 1.2, 'triangle', 0.14, null, 1.4);
  },
  secret() { arp([N.E4, N.A4, N.E5, N.A5, N.E6], 0.09, (f, d) => bell(f, 0.6, 0.16, d)); },
  enter() { bell(N.C5, 0.3, 0.2); bell(N.G5, 0.45, 0.2, 0.1); bell(N.E6, 0.5, 0.12, 0.2); },
  torch() { noise(0.2, 0.16, 3000, 1, 0, 'highpass'); tone(300, 0.15, 'sine', 0.14, 700); },
  ladder() { tone(200, 0.06, 'triangle', 0.22); tone(250, 0.06, 'triangle', 0.22, null, 0.07); },
  levelup() { arp([N.G4, N.C5, N.E5, N.G5, N.C6], 0.09, (f, d) => { flute(f, 0.26, 0.18, d); bell(f, 0.4, 0.1, d); }); }
};

/* ---- musik latar: melodi pastoral santai (asli buatan sendiri), seruling + bass lembut ---- */
const BEAT = 0.6; // ~100 bpm
const BASS = {C: [130.8, 196], Am: [110, 164.8], F: [87.3, 130.8], G: [98, 146.8]};
const R = null;
/* tiap bar: [chord, [[nada, beat], ...]] (1 bar = 4 beat) */
const SONG = [
  [['C',  [[N.E5, 1], [N.G5, 1], [N.E5, .5], [N.D5, .5], [N.C5, 1]]],
   ['Am', [[N.A4, 1], [N.C5, 1], [N.E5, 1.5], [N.D5, .5]]],
   ['F',  [[N.F5, 1], [N.A5, 1], [N.G5, 1], [N.E5, 1]]],
   ['G',  [[N.D5, 1.5], [N.E5, .5], [N.D5, 2]]]],
  [['C',  [[N.G5, 1], [N.E5, 1], [N.G5, 1], [N.C6, 1]]],
   ['F',  [[N.A5, 1.5], [N.G5, .5], [N.F5, 1], [N.E5, 1]]],
   ['G',  [[N.D5, 1], [N.E5, 1], [N.D5, 1], [N.B4, 1]]],
   ['C',  [[N.C5, 3], [R, 1]]]]
];
function musicPhrase() {
  if (!ctx || ctx.state !== 'running' || !musOn || document.hidden) return;
  SONG[phrase % SONG.length].forEach(([chord, mel], bar) => {
    const t0 = bar * 4 * BEAT, b = BASS[chord];
    tone(b[0], BEAT * 1.8, 'triangle', 0.55, null, t0, musG, 0.02);
    tone(b[1], BEAT * 1.6, 'triangle', 0.4, null, t0 + BEAT * 2, musG, 0.02);
    [1, 3].forEach(x => bell(b[1] * 2, BEAT * 1.2, 0.12, t0 + x * BEAT + BEAT * 0.5, musG));  // petikan lembut
    let t = t0;
    mel.forEach(([f, beats]) => { if (f) flute(f, Math.max(0.2, beats * BEAT * 0.92), 0.5, t, musG); t += beats * BEAT; });
  });
  phrase++;
}
function startMusic() {
  if (musTimer || !musOn || !ctx) return;
  musicPhrase(); musTimer = setInterval(musicPhrase, 16 * BEAT * 1000);
}
function stopMusic() { clearInterval(musTimer); musTimer = null; killBus('mus'); }

function unlock() {
  if (!init()) return;
  const go = () => { if (musOn) startMusic(); };
  if (ctx.state === 'running') go(); else ctx.resume().then(go).catch(() => {});
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, e => {
  if (e.target && e.target.closest && e.target.closest('.snd-btn')) { init(); if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); return; }
  unlock();
}, {passive: true}));

const api = {
  play(name) {
    if (!sfxOn || !SFX[name] || !init()) return;
    if (ctx.state !== 'running') { ctx.resume(); return; }
    try { SFX[name](); } catch (e) {}
  },
  get sfx() { return sfxOn; },
  get music() { return musOn; },
  setSfx(v) { sfxOn = !!v; write(K_SFX, sfxOn); listeners.forEach(f => f()); if (sfxOn) { unlock(); api.play('click'); } else killBus('sfx'); },
  setMusic(v) { musOn = !!v; write(K_MUS, musOn); listeners.forEach(f => f()); if (musOn) unlock(); else stopMusic(); },
  /* pasang tombol 🔊 / 🎵 ke dalam elemen */
  mount(el) {
    if (!el) return;
    el.style.display = 'inline-flex'; el.style.gap = '6px'; el.style.alignItems = 'center';
    const mk = (get, set, on, off, label) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'snd-btn';
      b.style.cssText = 'font:20px VT323,monospace;line-height:1;min-width:40px;min-height:36px;padding:4px 9px;cursor:pointer;background:#52703f;color:#f8edcf;border:2px solid #2d402a;box-shadow:none;touch-action:manipulation;-webkit-user-select:none;user-select:none;';
      const paint = () => { b.textContent = get() ? on : off; b.style.opacity = get() ? '1' : '.6'; b.title = label + (get() ? ': on' : ': off'); b.setAttribute('aria-pressed', get()); b.setAttribute('aria-label', b.title); };
      b.addEventListener('click', e => { e.stopPropagation(); set(!get()); b.blur(); });
      listeners.push(paint); paint(); el.appendChild(b);
    };
    mk(() => sfxOn, v => api.setSfx(v), '🔊', '🔇', 'Sound effects');
    mk(() => musOn, v => api.setMusic(v), '🎵', '🔕', 'Music');
  }
};
document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); else if (musOn && ctx && ctx.state === 'running') startMusic(); });
window.ZorrSound = api;
})();
