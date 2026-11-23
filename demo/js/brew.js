// ===== Quầy pha chế (canvas) =====
// Đun nước, múc cà phê, rót phin, rót sữa, thả đá bằng muôi lắc, ép trái cây.
const Brew = (() => {
  const W = 360, H = 340;
  const CX = 180, CT = 150, CB = 318, TW = 66, BW = 48, FH = (CB - CT) * .95;
  const RATE_LABEL = { perfect: 'HOÀN HẢO!', great: 'TUYỆT!', good: 'ỔN', miss: 'TRƯỢT' };
  const RATE_COLOR = { perfect: '#f2b632', great: '#5fbf5a', good: '#e9dcc0', miss: '#ff6b5a' };

  let g = null, cv = null, ctx = null, raf = 0, last = 0, wallImg = null, hudT = 0;
  let onFinish = () => {};

  // ---------- Khởi tạo ----------
  function start(id, finishCb) {
    const d = MENU.find(x => x.id === id);
    onFinish = finishCb;
    g = {
      id, d, i: 0, guided: true,
      values: d.steps.map(s => (s.type === 'fruit' ? [] : s.type === 'boil' ? 30 : 0)),
      shown: d.steps.map(() => 0),
      items: d.steps.map(() => []),
      points: 0, combo: 0, scores: [], t0: performance.now(), started: false,
      holding: false, holdT: 0, rate: 0, mom: 0, busy: false,
      drops: [], parts: [], pops: [], spoons: [], flyers: [],
      phase: 0, speed: 1.3, cooldown: 0, flame: 0, angle: .35, shake: 0, dripTalk: false,
      readout: '', canNext: null,
    };
  }

  const step = () => g.d.steps[g.i];
  const val = () => g.values[g.i];

  // ---------- Giao diện ----------
  function html() {
    const d = g.d, s = step();
    const hasTargets = d.steps.some(x => x.type !== 'fruit');
    return `
    <div class="topbar brew-top">
      <button class="icon-btn" data-act="back" data-to="scene" aria-label="Quay lại">←</button>
      <div class="title">Pha ${d.name}<div class="sub" id="gSub"></div></div>
      <button class="icon-btn" data-act="mute" aria-label="Âm thanh">${Sfx.muted ? '🔇' : '🔊'}</button>
    </div>
    <div class="game">
      <div class="progress" id="gProg"></div>
      <div class="hud" id="gHud"></div>
      ${hasTargets ? `<div class="mode-switch" id="gMode">
        <button data-b="mode" data-g="1" class="${g.guided ? 'on' : ''}">🎯 Thử thách</button>
        <button data-b="mode" data-g="0" class="${!g.guided ? 'on' : ''}">🎨 Tự do sáng tạo</button>
      </div>` : ''}
    </div>
    <div class="host"><div class="avatar sm" id="gAva"></div><div class="bubble"><b class="name">Anh Hải · Chủ quán</b><span id="gSay"></span></div></div>
    <div class="game">
      <div class="canvas-wrap"><canvas id="gCanvas"></canvas></div>
      <div class="readout" id="gRead"></div>
      <div class="controls" id="gCtrl"></div>
    </div>`;
  }

  function mount() {
    cv = document.getElementById('gCanvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!wallImg) wallImg = makeWall();
    document.getElementById('gCtrl').addEventListener('click', onCtrl);
    document.getElementById('gMode')?.addEventListener('click', onCtrl);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    stepUI(true);
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function unmount() {
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
    Sfx.stopLoop();
    if (g) g.holding = false;
  }

  // Lời thoại kiểu gõ chữ
  let sayTimer = 0;
  function say(text) {
    const el = document.getElementById('gSay'), ava = document.getElementById('gAva');
    if (!el) return;
    clearInterval(sayTimer);
    let n = 0;
    ava?.classList.add('talking');
    sayTimer = setInterval(() => {
      n += 2;
      el.textContent = text.slice(0, n);
      if (n >= text.length) { clearInterval(sayTimer); ava?.classList.remove('talking'); }
    }, 24);
  }

  function stepUI(intro) {
    const d = g.d, s = step();
    document.getElementById('gSub').textContent = `Bước ${g.i + 1}/${d.steps.length} · ${stepName(s)}`;
    document.getElementById('gProg').innerHTML = d.steps.map((_, k) => `<i class="${k < g.i ? 'done' : k === g.i ? 'now' : ''}"></i>`).join('');
    const mode = document.getElementById('gMode');
    if (mode) {
      mode.classList.toggle('hidden', g.started);
      mode.querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.g === '1') === g.guided));
    }
    document.getElementById('gCtrl').innerHTML = controlsHTML();
    g.canNext = null;
    bindHold();
    if (intro && g.i === 0) {
      const line = TALK.drink[d.id] || '';
      say(`${line} ${TALK.step(s, g.guided)}`.trim());
    } else say(TALK.step(s, g.guided));
    hud();
  }

  function stepName(s) {
    return { boil: 'Đun nước', scoop: 'Múc cà phê', phin: 'Rót phin', ice: 'Thả đá', fruit: 'Trái cây', press: 'Ép' }[s.type]
      || (s.type === 'pour' ? ING[s.ing].name : TOP[s.top].name);
  }

  function controlsHTML() {
    const s = step(), last = g.i === g.d.steps.length - 1;
    let main = '';
    if (['boil', 'phin', 'pour', 'press'].includes(s.type)) {
      const label = s.type === 'boil' ? '🔥 Giữ để đun nước' : s.type === 'phin' ? '🫖 Giữ để rót nước vào phin'
        : s.type === 'press' ? '⚙️ Giữ để ép' : `Giữ để rót ${ING[s.ing].name.toLowerCase()}`;
      main = `<button class="hold-btn" id="holdBtn">${label}</button>`;
    } else if (s.type === 'scoop') {
      main = `<div class="row"><button class="btn ghost" data-b="unscoop">− Bớt</button><button class="btn primary block" data-b="scoop">🥄 Múc cà phê</button></div>`;
    } else if (s.type === 'ice' || s.type === 'tap') {
      const lbl = s.type === 'ice' ? '🧊 Thả đá!' : `${TOP[s.top].icon} Thả ${TOP[s.top].name.toLowerCase()}!`;
      main = `<button class="hold-btn drop" data-b="drop">${lbl}</button>`;
    } else if (s.type === 'fruit') {
      const list = s.free ? Object.keys(FRUIT) : s.fruits, v = val();
      main = `<div class="fruit-pick">${list.map(f => `<button data-b="fruit" data-f="${f}" ${s.free && MenuAdmin.fruitOut(f) ? 'disabled title="Hết hôm nay"' : ''} class="${v.includes(f) ? (s.free ? 'on' : 'used') : ''} ${s.free && MenuAdmin.fruitOut(f) ? 'out' : ''}"><span>${fruitHTML(f, 34)}</span>${FRUIT[f].name}</button>`).join('')}</div>`;
    }
    return `${main}
    <div class="row">
      <button class="btn ghost" data-b="reset">↺ Làm lại bước</button>
      <button class="btn green" data-b="next" id="gNext">${last ? 'Hoàn thành ly ✓' : 'Xong bước này ➜'}</button>
    </div>`;
  }

  function hud() {
    const t = Math.floor((performance.now() - g.t0) / 1000);
    const el = document.getElementById('gHud');
    if (!el) return;
    el.innerHTML = g.guided
      ? `<span>⭐ <b>${g.points.toLocaleString('vi-VN')}</b> / ${maxPoints(g.d).toLocaleString('vi-VN')} điểm</span>${g.combo >= 2 ? `<span class="combo">🔥 Combo x${g.combo}</span>` : ''}<span>⏱ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</span>`
      : `<span>🎨 Chế độ tự do: pha theo ý bạn, được ${Math.round(POINT_CFG.quick * 100)}% điểm (${quickPoints(g.d).toLocaleString('vi-VN')} điểm)</span>`;
  }

  // ---------- Điều khiển ----------
  function bindHold() {
    const b = document.getElementById('holdBtn');
    if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {} holdStart(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, holdEnd));
    b.addEventListener('contextmenu', e => e.preventDefault());
  }

  function onKey(e) {
    if (e.code !== 'Space' || !g || state.view !== 'game') return;
    e.preventDefault();
    const s = step();
    if (['boil', 'phin', 'pour', 'press'].includes(s.type)) {
      if (e.type === 'keydown' && !e.repeat) holdStart();
      if (e.type === 'keyup') holdEnd();
    } else if (e.type === 'keydown' && !e.repeat && (s.type === 'ice' || s.type === 'tap')) drop();
  }

  function holdStart() {
    if (g.busy || g.holding) return;
    const s = step();
    if (s.type !== 'boil' && val() >= 100) { pop('ĐẦY RỒI', '#ff6b5a'); return; }
    Sfx.unlock();
    g.started = true;
    document.getElementById('gMode')?.classList.add('hidden');
    g.holding = true; g.holdT = 0;
    document.getElementById('holdBtn')?.classList.add('on');
    Sfx.startLoop(s.type === 'boil' ? 'boil' : s.type === 'press' ? 'press' : 'pour');
  }

  function holdEnd() {
    if (!g || !g.holding) return;
    g.holding = false;
    document.getElementById('holdBtn')?.classList.remove('on');
    Sfx.stopLoop();
    const s = step();
    if (s.type === 'boil') g.mom = g.rate * .15;
    else g.values[g.i] = Math.min(100, val() + g.rate * .06); // còn vài giọt sau khi buông
  }

  function onCtrl(e) {
    const b = e.target.closest('[data-b]');
    if (!b || g.busy) return;
    const s = step(), act = b.dataset.b;
    Sfx.unlock();
    if (act === 'mode') {
      g.guided = b.dataset.g === '1';
      stepUI(true);
      return;
    }
    if (act !== 'reset' && act !== 'next') { g.started = true; document.getElementById('gMode')?.classList.add('hidden'); }
    if (act === 'scoop') {
      if (val() >= 4) { say('Phin đầy rồi, múc nữa là tràn đấy!'); return; }
      g.values[g.i]++;
      g.spoons.push({ t: 0 });
      Sfx.scoop();
    } else if (act === 'unscoop') {
      if (val() > 0) { g.values[g.i]--; Sfx.tap(); }
    } else if (act === 'drop') drop();
    else if (act === 'fruit') {
      const v = val(), f = b.dataset.f;
      if (s.free) {
        if (v.includes(f)) { v.splice(v.indexOf(f), 1); Sfx.tap(); }
        else if (v.length >= 3) { say('Tối đa 3 loại thôi bạn ơi, nhiều quá mất vị!'); return; }
        else { v.push(f); g.flyers.push({ f, t: 0, x0: 40 + Math.random() * 280 }); Sfx.plop(); }
      } else if (!v.includes(f)) { v.push(f); g.flyers.push({ f, t: 0, x0: 40 + Math.random() * 280 }); Sfx.plop(); }
      document.getElementById('gCtrl').innerHTML = controlsHTML();
      g.canNext = null;
    } else if (act === 'reset') resetStep();
    else if (act === 'next') next();
  }

  function resetStep() {
    const s = step();
    g.values[g.i] = s.type === 'fruit' ? [] : s.type === 'boil' ? 30 : 0;
    g.shown[g.i] = 0; g.items[g.i] = []; g.mom = 0; g.speed = 1.3; g.dripTalk = false;
    g.drops = [];
    if (s.type === 'fruit') document.getElementById('gCtrl').innerHTML = controlsHTML();
    g.canNext = null;
    Sfx.tap();
  }

  function drop() {
    if (g.cooldown > 0 || g.busy) return;
    const s = step();
    if (g.items[g.i].length + g.drops.length >= 6) { say('Ly đầy rồi, thả nữa là tràn!'); return; }
    const x = scoopX();
    g.drops.push({ x, y: 72, vy: 0, vx: 0, kind: s.type === 'ice' ? 'ice' : s.top, state: 'fall', hit: null, bounces: 0, life: 1, rot: Math.random() * .6 - .3 });
    g.cooldown = .38;
    Sfx.tap();
  }

  function canNext() {
    if (g.busy) return false;
    const s = step(), v = val();
    switch (s.type) {
      case 'boil': return !g.holding && g.mom < .3 && v > 35;
      case 'phin': return !g.holding && v > 0 && v - g.shown[g.i] < .8;
      case 'press': return !g.holding && v > 0;
      case 'pour': return !g.holding;
      case 'scoop': return v >= 1 && !g.spoons.length;
      case 'ice': case 'tap': return !g.drops.length;
      case 'fruit': return (s.free ? v.length >= 1 : v.length === s.fruits.length) && !g.flyers.length;
    }
    return true;
  }

  function next() {
    if (!canNext()) return;
    const s = step(), v = val();
    if (g.guided && s.type !== 'fruit') {
      const sc = stepScore(s, v);
      const r = sc === 100 ? 'perfect' : sc >= 80 ? 'great' : sc >= 50 ? 'good' : 'miss';
      g.combo = r === 'perfect' ? g.combo + 1 : 0;
      // Mỗi bước chiếm một phần bằng nhau của phần "độ chuẩn" trong điểm tối đa
      const pts = Math.round(maxPoints(g.d) * POINT_SPLIT.base / scoredSteps(g.d) * sc / 100);
      g.points += pts; g.scores.push(sc);
      pop(RATE_LABEL[r], RATE_COLOR[r], 30);
      pop(`+${pts.toLocaleString('vi-VN')}`, '#fff', 22, 30);
      if (r === 'perfect') burst(CX, 120, ['#f2b632', '#fff', '#5fbf5a'], 26);
      Sfx.rate(r);
      say(g.combo >= 2 ? TALK.combo(g.combo) : pick(TALK.react[r]));
      g.busy = true;
      hud();
      setTimeout(advance, 1100);
    } else {
      Sfx.tap();
      advance();
    }
  }

  function advance() {
    g.busy = false;
    if (g.i >= g.d.steps.length - 1) return finish();
    g.i++;
    g.holdT = 0; g.mom = 0; g.rate = 0; g.phase = 0; g.speed = 1.3; g.dripTalk = false; g.drops = [];
    stepUI(false);
  }

  function finish() {
    const d = g.d;
    const elapsed = (performance.now() - g.t0) / 1000;
    const avg = g.scores.length ? g.scores.reduce((a, b) => a + b, 0) / g.scores.length : 100;
    const max = maxPoints(d), n = scoredSteps(d);
    let stars = null, bonus = 0, perfectBonus = 0, floorBonus = 0, total = 0, best = 0, newBest = false;
    if (g.guided) {
      const worst = g.scores.length ? Math.min(...g.scores) : 100;
      // 3 sao: trung bình ≥ 90 và không bước nào dưới mức "Tuyệt"
      stars = avg >= 90 && worst >= 80 ? 3 : avg >= 70 ? 2 : 1;
      const perfects = g.scores.filter(x => x === 100).length;
      perfectBonus = Math.round(max * POINT_SPLIT.perfect * perfects / n);
      // tốc độ: nhanh (≤ 6 giây/bước) được đủ thưởng, chậm (≥ 14 giây/bước) không có
      const steps = d.steps.length;
      const speed = Math.max(0, Math.min(1, (steps * 14 - elapsed) / (steps * 8)));
      bonus = avg >= 60 ? Math.round(max * POINT_SPLIT.speed * speed) : 0;
      total = Math.min(max, g.points + perfectBonus + bonus);
      floorBonus = Math.max(0, Math.round(max * POINT_CFG.floor) - total);
      total += floorBonus;
      let bests = {};
      try { bests = JSON.parse(localStorage.getItem('cafehai.best2')) || {}; } catch {}
      best = bests[d.id] || 0;
      const skill = total - floorBonus; // kỷ lục chỉ tính điểm tay nghề, không tính điểm sàn
      if (skill > best) {
        newBest = true;
        bests[d.id] = skill;
        try { localStorage.setItem('cafehai.best2', JSON.stringify(bests)); } catch {}
      }
    }
    unmount();
    onFinish({
      id: d.id,
      opts: d.steps.map((s, i) => stepOption(s, g.values[i])).filter(Boolean),
      values: g.values.map(v => (Array.isArray(v) ? [...v] : v)),
      stars, points: g.points, perfectBonus, bonus, floorBonus, total, max, best, newBest, elapsed: Math.round(elapsed),
    });
  }

  // ---------- Vòng lặp ----------
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    hudT += dt;
    if (hudT > .25) { hudT = 0; hud(); }
    raf = requestAnimationFrame(frame);
  }

  function update(dt) {
    const s = step(), i = g.i;
    if (g.holding) g.holdT += dt;

    if (s.type === 'boil') {
      let t = g.values[i];
      if (g.holding) {
        g.rate = Math.min(40, 5 + 14 * g.holdT);
        t += g.rate * dt;
      } else if (g.mom > .05) {
        t += g.mom * dt * 2;
        g.mom *= Math.max(0, 1 - 2 * dt);
      } else if (t > 30) t -= .6 * dt;
      if (t >= 100) {
        t = 100;
        if (g.holding) { holdEnd(); g.mom = 0; pop('SÔI TRÀO!', '#ff6b5a'); say(TALK.boilTooHot); Sfx.rate('miss'); }
        g.mom = 0;
      }
      g.values[i] = t;
      g.flame += ((g.holding ? 1 : 0) - g.flame) * Math.min(1, dt * 8);
      Sfx.setLoopLevel((t - 30) / 70);
      if (t > 65 && Math.random() < (t - 60) / 40 * dt * 25)
        g.parts.push({ x: CX + 64 + Math.random() * 8, y: 178, vx: 10 + Math.random() * 15, vy: -40 - Math.random() * 30, life: 1, r: 6 + Math.random() * 6, c: 'steam' });
      if (t > 92 && Math.random() < dt * 20) g.shake = 1.5;
    }

    if (['pour', 'phin', 'press'].includes(s.type)) {
      if (g.holding) {
        g.rate = Math.min(75, 14 + 30 * g.holdT);
        g.values[i] = Math.min(100, g.values[i] + g.rate * dt);
        Sfx.setLoopLevel(g.values[i] / 100);
        if (g.values[i] >= 100) { holdEnd(); pop('TRÀN!', '#ff6b5a'); say(TALK.overflow); Sfx.splash(); burst(CX, CT, ['#fff', '#cfe5f0'], 16); }
      }
      g.angle += ((g.holding ? 1.9 : .35) - g.angle) * Math.min(1, dt * 10);
    }

    // Phin nhỏ giọt từ từ; các bước khác hiện ngay
    g.d.steps.forEach((st, k) => {
      if (st.type === 'phin') {
        const rem = g.values[k] - g.shown[k];
        if (rem > 0) {
          g.shown[k] = Math.min(g.values[k], g.shown[k] + 16 * dt);
          if (k === i && Math.random() < dt * 14)
            g.parts.push({ x: CX + (Math.random() * 6 - 3), y: 150, vx: 0, vy: 60, life: 1, r: 2.4, c: COFFEE_COLORS[scoopCount()], drop: true });
          if (k === i && !g.holding && rem > 5 && !g.dripTalk) { g.dripTalk = true; setTimeout(() => g && g.i === k && say(pick(TALK.drip)), 600); }
        }
      } else if (st.type !== 'fruit') g.shown[k] = typeof g.values[k] === 'number' ? g.values[k] : 0;
    });

    // Muôi lắc qua lại
    if (s.type === 'ice' || s.type === 'tap') {
      if (g.guided) g.phase += g.speed * dt;
      g.cooldown = Math.max(0, g.cooldown - dt);
    }

    // Vật rơi (đá, topping)
    const surf = surfaceY();
    g.drops.forEach(o => {
      o.vy += 900 * dt;
      o.y += o.vy * dt; o.x += o.vx * dt;
      if (o.hit === null && o.y >= CT - 4) {
        o.hit = Math.abs(o.x - CX) < TW - 16;
        if (!o.hit) o.vx = (o.x < CX ? -1 : 1) * 40;
      }
      if (o.hit && o.y >= Math.min(CB - 14, surf + 4)) {
        o.state = 'in';
        g.items[g.i].push({ x: o.x, depth: 4 + Math.random() * 10, kind: o.kind, rot: o.rot, ph: Math.random() * 6 });
        g.values[g.i] = g.items[g.i].length;
        Sfx.clink(); Sfx.splash();
        burst(o.x, Math.min(CB - 14, surf), ['#ffffff', '#d6ecf6'], 8);
        pop(pick(TALK.iceHit), '#9fe39a', 18, 0, o.x, CT - 20);
        g.speed += .2;
      }
      if (o.hit === false && o.y >= CB - 8) {
        o.y = CB - 8;
        if (o.bounces === 0) {
          Sfx.thud();
          pop('TRƯỢT', '#ff6b5a', 18, 0, o.x, CB - 40);
          say(pick(TALK.iceMiss));
        }
        o.vy = -o.vy * .35; o.bounces++;
        o.vx *= 1.6;
        if (o.bounces > 2) o.state = 'gone';
      }
      if (o.x < -30 || o.x > W + 30) o.state = 'gone';
    });
    g.drops = g.drops.filter(o => o.state === 'fall');

    g.spoons.forEach(sp => { sp.t += dt / .45; });
    g.spoons = g.spoons.filter(sp => sp.t < 1);
    g.flyers.forEach(f => { f.t += dt / .5; });
    g.flyers = g.flyers.filter(f => f.t < 1);

    g.parts.forEach(p => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.c !== 'steam') p.vy += (p.drop ? 300 : 500) * dt;
      p.life -= dt * (p.c === 'steam' ? .8 : p.drop ? 1.4 : 1.6);
      if (p.drop && p.y >= surfaceY()) p.life = 0;
    });
    g.parts = g.parts.filter(p => p.life > 0);
    g.pops.forEach(p => { p.t += dt; });
    g.pops = g.pops.filter(p => p.t < 1.2);
    g.shake = Math.max(0, g.shake - dt * 6);

    // Cập nhật chữ & nút
    const ro = readout();
    if (ro !== g.readout) { g.readout = ro; document.getElementById('gRead').innerHTML = ro; }
    const cn = canNext();
    if (cn !== g.canNext) { g.canNext = cn; const nb = document.getElementById('gNext'); if (nb) nb.disabled = !cn; }
  }

  function readout() {
    const s = step(), v = val();
    const inT = s.t && v >= s.t[0] && v <= s.t[1];
    const mark = (lo, hi, ok = ' ✓ chuẩn') => !g.guided ? '' : inT ? ok : v < s.t[0] ? lo : hi;
    const cls = !g.guided ? '' : inT ? 'good' : 'warn';
    const opt = stepOption(s, v);
    const will = opt && !opt.fixed ? `Quán sẽ pha: <b class="inl">${opt.value}</b>` : '';
    switch (s.type) {
      case 'boil': return `<b class="${cls}">${Math.round(v)}°C${v > 35 ? mark(' · còn nguội', ' · nóng quá') : ''}</b>${g.mom > .3 ? 'Nước vẫn đang nóng thêm…' : g.guided ? `Chuẩn: ${s.t[0]}–${s.t[1]}°C` : ''}`;
      case 'scoop': return `<b class="${cls}">${v} muỗng${v ? mark(' · hơi ít', ' · hơi nhiều') : ''}</b>${will}`;
      case 'phin': {
        const drip = v - g.shown[g.i] > .8;
        return `<b class="${v ? cls : ''}">Nước: ${Math.round(v)}%${v ? mark(' · hơi ít', ' · hơi nhiều') : ''}</b>${drip ? 'Phin đang nhỏ giọt… ☕' : v ? 'Đã nhỏ giọt xong!' : ''}`;
      }
      case 'pour': return `<b class="${v ? cls : ''}">${Math.round(v)}%${v ? mark(' · hơi ít', ' · hơi nhiều') : ''}</b>${will}`;
      case 'press': return `<b class="${v ? cls : ''}">Đã ép: ${Math.round(v)}%${v ? mark(' · hơi ít', ' · hơi nhiều') : ''}</b>`;
      case 'ice': case 'tap': {
        const unit = s.type === 'ice' ? 'viên đá' : TOP[s.top].name.toLowerCase();
        return `<b class="${v ? cls : ''}">${v} ${unit} trong ly${v ? mark(' · hơi ít', ' · hơi nhiều') : ''}</b>${will}`;
      }
      case 'fruit':
        return v.length ? `<b>${v.map(f => fruitHTML(f, 18) + ' ' + FRUIT[f].name).join(' + ')}</b>${s.free ? `${v.length}/3 loại` : `${v.length}/${s.fruits.length}`}` : 'Chạm trái cây bên dưới để cho vào máy ép';
    }
    return '';
  }

  // ---------- Hiệu ứng ----------
  function pop(text, color, size = 26, dy = 0, x = CX, y = 105) { g.pops.push({ text, color, size, x, y: y + dy, t: 0 }); }
  function burst(x, y, colors, n) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160;
      g.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: 1, r: 2 + Math.random() * 3, c: colors[k % colors.length] });
    }
  }

  // ---------- Hình học ly ----------
  function scoopCount() {
    const k = g.d.steps.findIndex(s => s.type === 'scoop');
    return k < 0 ? 2 : Math.max(0, Math.min(4, g.values[k]));
  }
  function juiceColor() {
    const k = g.d.steps.findIndex(s => s.type === 'fruit');
    return k < 0 ? '#f39a12' : mixColor(g.values[k]);
  }
  function layers() {
    const out = [];
    g.d.steps.forEach((s, k) => {
      let h = 0, color, alpha = 1;
      if (s.type === 'pour') { h = g.shown[k] / 100 * s.s * FH; color = ING[s.ing].color; alpha = ING[s.ing].alpha || 1; }
      else if (s.type === 'phin') { h = g.shown[k] / 100 * s.s * FH; color = COFFEE_COLORS[scoopCount()]; }
      else if (s.type === 'press') { h = g.shown[k] / 100 * s.s * FH; color = juiceColor(); }
      if (h > 0) out.push({ h, color, alpha });
    });
    return out;
  }
  function surfaceY() {
    const tot = layers().reduce((a, l) => a + l.h, 0);
    return CB - Math.min(tot, (CB - CT) - 4);
  }
  function halfWidthAt(y) { return BW + (TW - BW) * (CB - y) / (CB - CT); }
  function scoopX() { return g.guided ? CX + 118 * Math.sin(g.phase) : CX; }

  // ---------- Vẽ ----------
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(wallImg, 0, 0, W, CB);
    // Đèn treo phát sáng
    const glow = ctx.createRadialGradient(CX, 0, 10, CX, 0, 260);
    glow.addColorStop(0, 'rgba(255,214,150,.28)'); glow.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, CB);
    // Mặt quầy gỗ
    const wood = ctx.createLinearGradient(0, CB, 0, H);
    wood.addColorStop(0, '#a8744a'); wood.addColorStop(.15, '#8a5a36'); wood.addColorStop(1, '#5b3a22');
    ctx.fillStyle = wood; ctx.fillRect(0, CB, W, H - CB);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, CB, W, 2);

    const s = step();
    ctx.save();
    if (g.shake) ctx.translate((Math.random() - .5) * g.shake * 3, 0);

    if (s.type === 'boil') drawStove();
    else {
      if (s.type === 'scoop') drawJar();
      drawCup();
      if (s.type === 'scoop' || s.type === 'phin') drawPhin(s.type === 'phin');
      if (s.type === 'phin') drawVessel('kettle', '#c0c6cc', 'phin');
      if (s.type === 'pour') drawVessel(ING[s.ing].vessel, ING[s.ing].color, ING[s.ing].name);
      if (s.type === 'ice' || s.type === 'tap') drawScoop();
      if (s.type === 'fruit' || s.type === 'press') drawJuicer();
    }
    ctx.restore();

    drawSide();
    drawDrops();
    drawSpoons();
    drawFlyers();
    drawParts();
    drawPops();
  }

  function makeWall() {
    const c = document.createElement('canvas');
    c.width = W * 2; c.height = CB * 2;
    const x = c.getContext('2d');
    x.scale(2, 2);
    x.fillStyle = '#2a1a13'; x.fillRect(0, 0, W, CB);
    for (let r = 0; r < 8; r++) for (let q = 0; q < 8; q++) {
      const px = q * 48 + (r % 2 ? 24 : 0) - 12, py = r * 44 - 6;
      x.fillStyle = '#33211a'; x.fillRect(px + 2, py + 2, 44, 40);
      x.strokeStyle = 'rgba(230,210,180,.08)'; x.lineWidth = 2; x.strokeRect(px + 10, py + 8, 28, 28);
      x.fillStyle = 'rgba(230,210,180,.07)';
      x.fillRect(px + 15, py + 12, 5, 20); x.fillRect(px + 28, py + 12, 5, 20); x.fillRect(px + 15, py + 19, 18, 5);
    }
    return c;
  }

  function cupPath() {
    ctx.beginPath();
    ctx.moveTo(CX - TW, CT); ctx.lineTo(CX + TW, CT); ctx.lineTo(CX + BW, CB); ctx.lineTo(CX - BW, CB); ctx.closePath();
  }

  function drawCup() {
    const now = performance.now() / 1000;
    // bóng dưới ly
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(CX, CB + 3, BW + 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    cupPath(); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(CX - TW, CT, TW * 2, CB - CT);
    let y = CB;
    const ls = layers();
    const pouringNow = g.holding && ['pour', 'phin', 'press'].includes(step().type);
    ls.forEach((l, k) => {
      const top = Math.max(CT + 4, y - l.h);
      ctx.globalAlpha = l.alpha;
      ctx.fillStyle = l.color;
      if (k === ls.length - 1 && pouringNow) {
        ctx.beginPath(); ctx.moveTo(CX - TW, y);
        for (let xx = CX - TW; xx <= CX + TW; xx += 6) ctx.lineTo(xx, top + Math.sin(xx / 9 + now * 14) * 2);
        ctx.lineTo(CX + TW, y); ctx.closePath(); ctx.fill();
      } else ctx.fillRect(CX - TW, top, TW * 2, y - top + .5);
      ctx.globalAlpha = 1;
      y = top;
    });
    if (ls.length) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(CX - TW, y, TW * 2, 1.5); }
    // đá & topping trong ly
    const surf = surfaceY();
    g.items.forEach(arr => arr.forEach(it => {
      const yy = Math.min(CB - 16, surf + it.depth) + Math.sin(now * 2 + it.ph) * 1.5;
      drawItem(it.kind, it.x, yy, it.rot, .9);
    }));
    // logo H in trên ly
    ctx.globalAlpha = .55;
    ctx.strokeStyle = '#7a2e1f'; ctx.lineWidth = 3;
    const ly = CT + (CB - CT) * .48;
    ctx.strokeRect(CX - 22, ly - 22, 44, 44);
    ctx.fillStyle = '#7a2e1f';
    ctx.fillRect(CX - 14, ly - 15, 7, 30); ctx.fillRect(CX + 7, ly - 15, 7, 30); ctx.fillRect(CX - 14, ly - 3, 28, 7);
    ctx.globalAlpha = 1;
    // vệt sáng thủy tinh
    const sh = ctx.createLinearGradient(CX - TW, 0, CX + TW, 0);
    sh.addColorStop(0, 'rgba(255,255,255,.28)'); sh.addColorStop(.18, 'rgba(255,255,255,0)');
    sh.addColorStop(.8, 'rgba(255,255,255,0)'); sh.addColorStop(.9, 'rgba(255,255,255,.15)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(CX - TW, CT, TW * 2, CB - CT);
    ctx.restore();
    cupPath();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(CX - TW - 3, CT - 3, TW * 2 + 6, 4);
    if (g.d.hot && layers().length) {
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = `rgba(255,255,255,${.25 + .15 * Math.sin(now * 2 + k)})`; ctx.lineWidth = 3;
        ctx.beginPath();
        const bx = CX - 20 + k * 20;
        ctx.moveTo(bx, CT - 8);
        ctx.bezierCurveTo(bx - 8, CT - 25, bx + 8, CT - 35, bx, CT - 50 - Math.sin(now * 3 + k) * 4);
        ctx.stroke();
      }
    }
  }

  function drawItem(kind, x, y, rot, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
    if (kind === 'ice') {
      ctx.fillStyle = 'rgba(214,236,246,.75)'; ctx.strokeStyle = 'rgba(150,200,225,1)'; ctx.lineWidth = 1.5;
      rr(-11, -11, 22, 22, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; rr(-7, -8, 7, 5, 2); ctx.fill();
    } else {
      ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(TOP[kind].icon, 0, 0);
    }
    ctx.restore();
  }

  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

  function drawStove() {
    // bếp ga
    ctx.fillStyle = '#1f1f22'; rr(CX - 90, CB - 30, 180, 30, 6); ctx.fill();
    ctx.fillStyle = '#3a3a40'; rr(CX - 90, CB - 32, 180, 6, 3); ctx.fill();
    ctx.fillStyle = '#c33'; ctx.beginPath(); ctx.arc(CX + 70, CB - 14, 6, 0, Math.PI * 2); ctx.fill();
    // lửa
    const now = performance.now() / 1000, fl = g.flame;
    if (fl > .03) {
      for (let k = -3; k <= 3; k++) {
        const fx = CX + k * 11, fh = (14 + 22 * fl) * (0.8 + .3 * Math.sin(now * 25 + k * 2));
        const gr = ctx.createLinearGradient(fx, CB - 32, fx, CB - 32 - fh);
        gr.addColorStop(0, 'rgba(70,120,255,.95)'); gr.addColorStop(.6, 'rgba(120,170,255,.7)'); gr.addColorStop(1, 'rgba(255,170,60,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(fx - 5, CB - 32); ctx.quadraticCurveTo(fx, CB - 32 - fh * 1.2, fx + 5, CB - 32); ctx.fill();
      }
    }
    // ấm đun
    ctx.save();
    ctx.translate(CX + (g.shake ? (Math.random() - .5) * 3 : 0), CB - 34);
    const body = ctx.createLinearGradient(-60, 0, 60, 0);
    body.addColorStop(0, '#8d949b'); body.addColorStop(.35, '#e7ebee'); body.addColorStop(1, '#7c838a');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-58, 0); ctx.bezierCurveTo(-66, -60, -40, -96, 0, -96); ctx.bezierCurveTo(40, -96, 66, -60, 58, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6d747b'; ctx.lineWidth = 2; ctx.stroke();
    // vòi
    ctx.fillStyle = '#9aa1a8';
    ctx.beginPath(); ctx.moveTo(48, -40); ctx.lineTo(78, -70); ctx.lineTo(84, -64); ctx.lineTo(56, -26); ctx.closePath(); ctx.fill();
    // quai
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(0, -96, 42, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.arc(0, -98, 7, 0, Math.PI * 2); ctx.fill();
    // chữ H
    ctx.globalAlpha = .6; ctx.fillStyle = '#7a2e1f'; ctx.font = '900 26px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('H', 0, -36); ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawJar() {
    const x = 52, y = CB;
    ctx.fillStyle = '#4b2c1c'; rr(x - 28, y - 70, 56, 70, 8); ctx.fill();
    ctx.fillStyle = '#c9a77c'; rr(x - 30, y - 78, 60, 12, 4); ctx.fill();
    ctx.fillStyle = '#f3e7cf'; rr(x - 22, y - 50, 44, 26, 3); ctx.fill();
    ctx.fillStyle = '#4a2016'; ctx.font = '800 9px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CÀ PHÊ', x, y - 39); ctx.fillText('HẢI', x, y - 29);
  }

  function drawPhin(withWater) {
    const top = 96, bot = 142;
    // đế phin
    ctx.fillStyle = '#9aa1a8';
    ctx.beginPath(); ctx.ellipse(CX, bot + 4, 46, 6, 0, 0, Math.PI * 2); ctx.fill();
    // thân
    const gr = ctx.createLinearGradient(CX - 34, 0, CX + 34, 0);
    gr.addColorStop(0, '#80878e'); gr.addColorStop(.4, '#e4e8eb'); gr.addColorStop(1, '#7a8188');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(CX - 34, top); ctx.lineTo(CX + 34, top); ctx.lineTo(CX + 30, bot); ctx.lineTo(CX - 30, bot); ctx.closePath(); ctx.fill();
    // bên trong (nhìn thấy cà phê & nước)
    const grounds = Math.min(4, withWater ? scoopCount() : val()) * 6;
    ctx.fillStyle = '#2a170e';
    ctx.fillRect(CX - 28, bot - 4 - grounds, 56, grounds);
    if (withWater) {
      const rem = Math.max(0, val() - g.shown[g.i]);
      const wh = Math.min(bot - 8 - grounds - top, rem / 100 * 60);
      if (wh > 0) { ctx.fillStyle = 'rgba(120,70,40,.85)'; ctx.fillRect(CX - 28, bot - 4 - grounds - wh, 56, wh); }
    }
    ctx.strokeStyle = '#6d747b'; ctx.lineWidth = 2;
    ctx.strokeRect(CX - 34, top, 68, bot - top);
    ctx.fillStyle = '#c3c9ce'; ctx.fillRect(CX - 37, top - 4, 74, 5);
  }

  // Bình/ấm/lon nghiêng để rót
  function drawVessel(kind, color, label) {
    const px = CX - 72, py = 62;
    const a = g.angle;
    ctx.save();
    ctx.translate(px, py); ctx.rotate(a);
    if (kind === 'kettle') {
      const gr = ctx.createLinearGradient(-22, 0, 22, 0);
      gr.addColorStop(0, '#8d949b'); gr.addColorStop(.4, '#eef1f3'); gr.addColorStop(1, '#7c838a');
      ctx.fillStyle = gr; rr(-22, -40, 44, 62, 10); ctx.fill();
      ctx.fillStyle = '#9aa1a8'; ctx.fillRect(-4, -58, 8, 20);
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-24, -8, 14, Math.PI * .5, Math.PI * 1.5); ctx.stroke();
    } else if (kind === 'can') {
      ctx.fillStyle = '#e9edf2'; rr(-20, -46, 40, 66, 6); ctx.fill();
      ctx.fillStyle = '#2f5aa8'; ctx.fillRect(-20, -30, 40, 30);
      ctx.fillStyle = '#fff'; ctx.font = '700 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SỮA', 0, -13);
      ctx.fillStyle = '#c9ced4'; ctx.fillRect(-20, -50, 40, 6);
    } else if (kind === 'carton') {
      ctx.fillStyle = '#fafafa'; rr(-20, -40, 40, 62, 3); ctx.fill();
      ctx.fillStyle = '#3c8fd6'; ctx.fillRect(-20, -10, 40, 18);
      ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(0, -58); ctx.lineTo(20, -40); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MILK', 0, 2);
    } else if (kind === 'teapot') {
      ctx.fillStyle = '#e8e1d3'; ctx.beginPath(); ctx.ellipse(0, -8, 26, 24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7a2e1f'; ctx.fillRect(-26, -10, 52, 5);
      ctx.fillStyle = '#e8e1d3'; ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(6, -30); ctx.lineTo(3, -56); ctx.lineTo(-3, -56); ctx.fill();
    } else if (kind === 'pitcher') {
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.moveTo(-20, -50); ctx.lineTo(20, -50); ctx.lineTo(24, 20); ctx.lineTo(-24, 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-19, -24); ctx.lineTo(19, -24); ctx.lineTo(23, 18); ctx.lineTo(-23, 18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-20, -50); ctx.lineTo(20, -50); ctx.lineTo(24, 20); ctx.lineTo(-24, 20); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, -50); ctx.lineTo(0, -58); ctx.lineTo(4, -50); ctx.stroke();
    } else { // bottle
      ctx.fillStyle = color === '#efe3bf' ? '#f4ead0' : color;
      rr(-18, -30, 36, 52, 8); ctx.fill();
      ctx.fillRect(-7, -54, 14, 26);
      ctx.fillStyle = '#fff'; rr(-14, -16, 28, 18, 3); ctx.fill();
      ctx.fillStyle = '#4a2016'; ctx.font = '800 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label.toUpperCase().slice(0, 8), 0, -4);
    }
    ctx.restore();
    // dòng chảy
    if (g.holding && a > 1.5) {
      const mx = px + 55 * Math.sin(a), my = py - 55 * Math.cos(a);
      const tx = step().type === 'phin' ? CX - 6 : CX - 10;
      const ty = step().type === 'phin' ? 110 : surfaceY();
      const c = step().type === 'phin' ? 'rgba(220,235,245,.85)' : color;
      ctx.strokeStyle = c; ctx.lineCap = 'round';
      ctx.lineWidth = 3 + Math.min(5, g.rate / 12);
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(tx - 4, my + 4, tx, ty); ctx.stroke();
      if (Math.random() < .5) g.parts.push({ x: tx + (Math.random() * 10 - 5), y: ty, vx: Math.random() * 60 - 30, vy: -40 - Math.random() * 40, life: .5, r: 2, c });
    }
  }

  function drawScoop() {
    const x = scoopX(), y = 60, s = step();
    // tay cầm
    ctx.strokeStyle = '#8d949b'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 22, y); ctx.lineTo(x + 70, y - 22); ctx.stroke();
    // muôi
    const gr = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
    gr.addColorStop(0, '#8d949b'); gr.addColorStop(.5, '#eef1f3'); gr.addColorStop(1, '#7c838a');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(x, y, 26, 14, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#c3c9ce'; ctx.fillRect(x - 26, y - 2, 52, 4);
    if (g.cooldown <= .05) drawItem(s.type === 'ice' ? 'ice' : s.top, x, y - 8, 0);
    // vạch canh giữa (chế độ thử thách)
    if (g.guided) {
      ctx.strokeStyle = 'rgba(95,191,90,.5)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(CX - TW + 16, 84); ctx.lineTo(CX - TW + 16, CT - 6); ctx.moveTo(CX + TW - 16, 84); ctx.lineTo(CX + TW - 16, CT - 6); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawJuicer() {
    const pressing = g.holding && step().type === 'press';
    const sx = pressing ? (Math.random() - .5) * 4 : 0;
    const k = g.d.steps.findIndex(s => s.type === 'fruit');
    const fruits = g.values[k] || [];
    const pk = g.d.steps.findIndex(s => s.type === 'press');
    const pressed = pk >= 0 ? g.values[pk] : 0;
    ctx.save(); ctx.translate(sx, 0);
    // cối
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.moveTo(CX - 56, 10); ctx.lineTo(CX + 56, 10); ctx.lineTo(CX + 44, 88); ctx.lineTo(CX - 44, 88); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke();
    // nước trong cối
    const juiceLeft = Math.max(0, 1 - pressed / 100);
    if (fruits.length) {
      ctx.fillStyle = juiceColor(); ctx.globalAlpha = .55;
      const jh = 30 * juiceLeft * Math.min(1, fruits.length / 2);
      ctx.fillRect(CX - 44, 88 - jh, 88, jh); ctx.globalAlpha = 1;
    }
    // trái cây trong cối
    const sc = Math.max(.25, 1 - pressed / 110);
    ctx.font = `${Math.round(30 * sc)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const pos = [[-22, 62], [20, 64], [0, 40], [-28, 36], [26, 38], [0, 66]];
    const show = fruits.length === 1 ? [fruits[0], fruits[0], fruits[0]] : fruits.length === 2 ? [fruits[0], fruits[1], fruits[0], fruits[1]] : fruits.concat(fruits);
    show.slice(0, 6).forEach((f, n) => {
      const jiggle = pressing ? Math.sin(performance.now() / 30 + n) * 3 : 0;
      drawFruit(ctx, f, CX + pos[n][0] + jiggle, pos[n][1], 30 * sc);
    });
    // thân máy
    ctx.fillStyle = '#7a2e1f'; rr(CX - 50, 88, 100, 26, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 14px "Be Vietnam Pro", sans-serif'; ctx.fillText('H', CX, 102);
    ctx.fillStyle = pressing ? '#5fbf5a' : '#3a1810'; ctx.beginPath(); ctx.arc(CX + 36, 101, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa1a8'; ctx.fillRect(CX - 5, 114, 10, 12);
    ctx.restore();
    if (pressing) {
      ctx.strokeStyle = juiceColor(); ctx.lineWidth = 3 + Math.min(4, g.rate / 15); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(CX, 126); ctx.lineTo(CX, surfaceY()); ctx.stroke();
    }
  }

  // Thước đo bên phải
  function drawSide() {
    const s = step(), v = val();
    const gx = 326, gy = 60, gh = 230;
    if (['pour', 'phin', 'press'].includes(s.type)) {
      ctx.fillStyle = 'rgba(255,255,255,.12)'; rr(gx, gy, 20, gh, 10); ctx.fill();
      if (g.guided) {
        ctx.fillStyle = 'rgba(95,191,90,.35)';
        ctx.fillRect(gx, gy + gh * (1 - s.t[1] / 100), 20, gh * (s.t[1] - s.t[0]) / 100);
        ctx.strokeStyle = '#5fbf5a'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5;
        ctx.strokeRect(gx, gy + gh * (1 - s.t[1] / 100), 20, gh * (s.t[1] - s.t[0]) / 100); ctx.setLineDash([]);
      }
      ctx.fillStyle = s.type === 'phin' ? '#8ec9e6' : s.type === 'press' ? juiceColor() : ING[s.ing].color;
      const fh = gh * v / 100;
      ctx.save(); rr(gx + 3, gy + gh - fh, 14, fh, 6); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; rr(gx, gy, 20, gh, 10); ctx.stroke();
    } else if (s.type === 'boil') {
      // nhiệt kế
      const tFrac = t => (t - 20) / 82;
      ctx.fillStyle = 'rgba(255,255,255,.85)'; rr(gx + 2, gy, 16, gh, 8); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 10, gy + gh + 6, 13, 0, Math.PI * 2); ctx.fill();
      if (g.guided) {
        ctx.fillStyle = 'rgba(95,191,90,.55)';
        ctx.fillRect(gx + 2, gy + gh * (1 - tFrac(s.t[1])), 16, gh * (tFrac(s.t[1]) - tFrac(s.t[0])));
      }
      ctx.fillStyle = '#e0412b';
      const fh = gh * Math.max(0, tFrac(v));
      rr(gx + 6, gy + gh - fh, 8, fh + 4, 4); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 10, gy + gh + 6, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '800 13px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(v)}°`, gx - 4, gy + gh - fh + 4);
    } else if (['scoop', 'ice', 'tap'].includes(s.type)) {
      const max = s.type === 'scoop' ? 4 : 6;
      for (let k = 1; k <= max; k++) {
        const y = gy + gh - k * 30;
        const tgt = g.guided && k >= s.t[0] && k <= s.t[1];
        ctx.fillStyle = k <= v ? (tgt ? '#5fbf5a' : '#cfe5f0') : 'rgba(255,255,255,.08)';
        rr(gx, y, 20, 22, 5); ctx.fill();
        ctx.strokeStyle = tgt ? '#5fbf5a' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.setLineDash(k <= v ? [] : [3, 3]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  }

  function drawDrops() {
    g.drops.forEach(o => drawItem(o.kind, o.x, o.y, o.rot + o.y / 80));
  }
  function drawSpoons() {
    g.spoons.forEach(sp => {
      const t = sp.t, x0 = 52, y0 = CB - 80, x1 = CX, y1 = 92;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * 60;
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.3 + t * (t > .8 ? 2 : 0));
      ctx.strokeStyle = '#b9bec4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-34, 6); ctx.lineTo(-6, 0); ctx.stroke();
      ctx.fillStyle = '#d5d9dc'; ctx.beginPath(); ctx.ellipse(4, 0, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a170e'; ctx.beginPath(); ctx.ellipse(4, -2, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }
  function drawFlyers() {
    ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    g.flyers.forEach(f => {
      const t = f.t, x = f.x0 + (CX - f.x0) * t, y = H + 10 + (40 - H - 10) * t - Math.sin(Math.PI * t) * 60;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 6); drawFruit(ctx, f.f, 0, 0, 30); ctx.restore();
    });
  }
  function drawParts() {
    g.parts.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life) * (p.c === 'steam' ? .35 : 1);
      ctx.fillStyle = p.c === 'steam' ? '#fff' : p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.c === 'steam' ? p.r * (2 - p.life) : p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  function drawPops() {
    g.pops.forEach(p => {
      const a = p.t < .9 ? 1 : 1 - (p.t - .9) / .3;
      const sc = p.t < .12 ? .6 + p.t / .12 * .5 : 1.1 - Math.min(.1, (p.t - .12));
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.translate(p.x, p.y - p.t * 30); ctx.scale(sc, sc);
      ctx.font = `900 ${p.size}px "Be Vietnam Pro", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(40,15,8,.85)'; ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
      ctx.restore();
    });
  }

  return { start, html, mount, unmount, get active() { return g; } };
})();

// Pháo giấy toàn màn hình
function confetti() {
  const c = document.createElement('canvas');
  c.className = 'confetti';
  c.width = innerWidth; c.height = innerHeight;
  document.body.appendChild(c);
  const x = c.getContext('2d');
  const cols = ['#f2b632', '#7a2e1f', '#3e5b2c', '#ffffff', '#e8434f', '#5fbf5a'];
  const ps = Array.from({ length: 140 }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5,
    vx: Math.random() * 120 - 60, vy: 120 + Math.random() * 200,
    r: Math.random() * 6, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)],
  }));
  let lastT = performance.now(), t0 = lastT;
  (function f(now) {
    const dt = (now - lastT) / 1000; lastT = now;
    x.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 6;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore();
    });
    if (now - t0 < 3200) requestAnimationFrame(f); else c.remove();
  })(t0);
}
