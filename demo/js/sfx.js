// ===== Âm thanh (tự tổng hợp bằng WebAudio, không cần file) & rung =====
const Sfx = (() => {
  let ctx = null, noiseBuf = null, loop = null;
  let muted = false;
  try { muted = localStorage.getItem('cafehai.muted') === '1'; } catch {}

  function ac() {
    if (muted) return null;
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, { type = 'sine', vol = .2, delay = 0, slide = 0 } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + .05);
  }

  function noise(dur, { freq = 1000, q = 1, vol = .2, type = 'bandpass' } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    s.connect(f).connect(g).connect(c.destination);
    s.start(t); s.stop(t + dur + .05);
  }

  // Âm thanh lặp khi giữ nút: rót, đun, ép
  function startLoop(kind) {
    stopLoop();
    const c = ac(); if (!c) return;
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = c.createBiquadFilter();
    const g = c.createGain(); g.gain.value = 0;
    const cfg = {
      pour:  { type: 'bandpass', freq: 900,  q: .8, vol: .16 },
      boil:  { type: 'lowpass',  freq: 380,  q: 1,  vol: .22 },
      press: { type: 'bandpass', freq: 260,  q: 3,  vol: .3 },
    }[kind];
    f.type = cfg.type; f.frequency.value = cfg.freq; f.Q.value = cfg.q;
    s.connect(f).connect(g).connect(c.destination);
    g.gain.linearRampToValueAtTime(cfg.vol, c.currentTime + .08);
    let lfo = null;
    if (kind === 'press') {
      lfo = c.createOscillator(); const lg = c.createGain();
      lfo.frequency.value = 18; lg.gain.value = 120;
      lfo.connect(lg).connect(f.frequency); lfo.start();
    }
    s.start();
    loop = { s, g, f, lfo, kind };
  }
  function setLoopLevel(x) { // 0..1, ví dụ nhiệt độ nước
    if (!loop || !ctx) return;
    if (loop.kind === 'boil') loop.f.frequency.value = 300 + x * 900;
    if (loop.kind === 'pour') loop.f.frequency.value = 700 + x * 900;
  }
  function stopLoop() {
    if (!loop || !ctx) { loop = null; return; }
    const { s, g, lfo } = loop;
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + .08);
    s.stop(ctx.currentTime + .1); lfo?.stop(ctx.currentTime + .1);
    loop = null;
  }

  const vib = p => { if (!muted && navigator.vibrate) try { navigator.vibrate(p); } catch {} };

  return {
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem('cafehai.muted', muted ? '1' : '0'); } catch {}
      if (muted) stopLoop();
      return muted;
    },
    unlock: ac,
    startLoop, stopLoop, setLoopLevel,
    clink() { tone(2400, .18, { vol: .12 }); tone(3500, .12, { vol: .07, delay: .02 }); vib(15); },
    splash() { noise(.3, { freq: 1300, q: .7, vol: .25 }); },
    thud() { tone(140, .15, { type: 'triangle', vol: .25, slide: .6 }); noise(.12, { freq: 400, vol: .15 }); vib(30); },
    scoop() { noise(.18, { freq: 2500, q: .5, vol: .12, type: 'highpass' }); },
    plop() { tone(320, .12, { vol: .2, slide: 2.2 }); },
    tap() { tone(660, .06, { type: 'triangle', vol: .12 }); },
    rate(r) {
      if (r === 'perfect') { [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, { vol: .16, delay: i * .07 })); vib([20, 40, 20]); }
      else if (r === 'great') { [587, 880].forEach((f, i) => tone(f, .22, { vol: .15, delay: i * .08 })); vib(20); }
      else if (r === 'good') tone(523, .2, { vol: .14 });
      else { tone(300, .3, { type: 'triangle', vol: .18, slide: .6 }); vib(80); }
    },
    slice() { noise(.12, { freq: 4200, q: .6, vol: .22, type: 'highpass' }); noise(.18, { freq: 700, q: 1.2, vol: .18 }); vib(12); },
    ding() { [880, 1320].forEach((f, i) => tone(f, .3, { vol: .15, delay: i * .1 })); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .35, { vol: .14, delay: i * .09, type: 'triangle' })); vib([30, 50, 30, 50, 60]); },
    door() { tone(1250, .5, { vol: .1 }); tone(1660, .6, { vol: .08, delay: .12 }); },
  };
})();
