// ===== Mini game: Cắt hoa quả → hộp quả mix =====
// Chọn quả + kiểu tỉa → vuốt để cắt quả tung lên (tránh con sâu) → mở hộp → đặt hàng.
const FruitCut = (() => {
  const W = 360, H = 460, ROUND = 35, BOARD_Y = 380;
  const BUG = 'bug';

  let g = null, cv = null, ctx = null, raf = 0, last = 0, onFinish = () => {};
  const imgs = {};

  // ---------- dữ liệu ----------
  function icon(k, size) {
    if (k === BUG) return '🐛';
    const f = CUT_FRUIT[k];
    return f.svg ? `<img class="fi" src="${svgSrc(f.svg)}" width="${size}" height="${size}" alt="${f.name}">` : f.icon;
  }
  const svgSrc = s => 'data:image/svg+xml,' + encodeURIComponent(s);
  function drawIcon(k, x, y, size) {
    const f = k === BUG ? null : CUT_FRUIT[k];
    if (f && f.svg) {
      let im = imgs[k];
      if (!im) { im = imgs[k] = new Image(); im.src = svgSrc(f.svg); }
      if (im.complete) ctx.drawImage(im, x - size / 2, y - size / 2, size, size);
    } else {
      ctx.font = `${Math.round(size)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(k === BUG ? '🐛' : f.icon, x, y);
    }
  }

  function start(id, cb) {
    const d = D(id);
    onFinish = cb;
    g = { id, d, phase: 'setup', fruits: [], shape: 'hoa' };
  }

  // ---------- giao diện ----------
  function html() {
    const d = g.d;
    const top = `
    <div class="topbar brew-top">
      <button class="icon-btn" data-act="back" data-to="scene" aria-label="Quay lại">←</button>
      <div class="title">${d.name}<div class="sub">${d.price}K · ${d.box.kinds} loại quả · tối đa ${maxPoints(d).toLocaleString('vi-VN')} điểm</div></div>
      <button class="icon-btn" data-act="mute" aria-label="Âm thanh">${Sfx.muted ? '🔇' : '🔊'}</button>
    </div>`;
    if (g.phase === 'setup') {
      const n = d.box.kinds;
      return `${top}
      ${host(TALK.cut.intro(n), true)}
      <div class="panel">
        <h3>1. Chọn ${n} loại quả <small class="muted">(${g.fruits.length}/${n})</small></h3>
        <div class="fruit-pick cut-pick">${Object.keys(CUT_FRUIT).map(k => `
          <button data-c="fruit" data-k="${k}" ${MenuAdmin.fruitOut(k) ? 'disabled' : ''} class="${g.fruits.includes(k) ? 'on' : ''} ${MenuAdmin.fruitOut(k) ? 'out' : ''}"><span>${icon(k, 34)}</span>${CUT_FRUIT[k].name}${MenuAdmin.fruitOut(k) ? '<em>Hết</em>' : ''}</button>`).join('')}
        </div>
        <p class="muted small">🍃 Hoa quả theo ngày. Nếu hôm nay hết loại bạn chọn, quán sẽ gọi để đổi loại khác.</p>
      </div>
      <div class="panel">
        <h3>2. Kiểu tỉa</h3>
        <div class="shape-pick">${SHAPES.map(s => `
          <button data-c="shape" data-s="${s.id}" class="${g.shape === s.id ? 'on' : ''}"><span>${s.icon}</span>${s.name}</button>`).join('')}
        </div>
      </div>
      <div style="padding:0 16px 20px">
        <button class="btn primary block" data-c="go" ${g.fruits.length === n ? '' : 'disabled'}>🔪 Bắt đầu cắt quả!</button>
      </div>`;
    }
    return `${top}
      <div class="host"><div class="avatar sm" id="fAva"></div><div class="bubble"><b class="name">Anh Hải · Chủ quán</b><span id="fSay"></span></div></div>
      <div class="game">
        <div class="canvas-wrap cut-wrap"><canvas id="fCanvas"></canvas></div>
        <div class="controls" id="fCtrl" style="margin-top:10px"></div>
      </div>`;
  }

  function mount() {
    const root = document.getElementById('app');
    root.addEventListener('click', onClick);
    if (g.phase === 'setup') return;
    cv = document.getElementById('fCanvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(e => cv.addEventListener(e, up));
    ctrl();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function unmount() {
    cancelAnimationFrame(raf);
    document.getElementById('app').removeEventListener('click', onClick);
  }

  function ctrl() {
    const el = document.getElementById('fCtrl');
    if (!el) return;
    el.innerHTML = g.phase === 'play'
      ? `<button class="btn ghost block" data-c="stop">Dừng & đóng hộp</button>`
      : g.phase === 'reveal' && g.revealT > 1.6
        ? `<button class="btn primary block" data-c="done">Đặt hộp này ➜</button><button class="btn ghost block" data-c="again">↺ Cắt lại</button>`
        : '';
  }

  let sayTimer = 0;
  function say(text) {
    const el = document.getElementById('fSay'), ava = document.getElementById('fAva');
    if (!el) return;
    clearInterval(sayTimer);
    let n = 0;
    ava?.classList.add('talking');
    sayTimer = setInterval(() => {
      n += 2; el.textContent = text.slice(0, n);
      if (n >= text.length) { clearInterval(sayTimer); ava?.classList.remove('talking'); }
    }, 22);
  }

  function onClick(e) {
    const b = e.target.closest('[data-c]');
    if (!b || !g) return;
    const c = b.dataset.c;
    Sfx.unlock();
    if (c === 'fruit') {
      const k = b.dataset.k, i = g.fruits.indexOf(k);
      if (i >= 0) g.fruits.splice(i, 1);
      else if (g.fruits.length < g.d.box.kinds) g.fruits.push(k);
      else { toast(`Túi này ${g.d.box.kinds} loại thôi, bỏ bớt một loại nhé`); return; }
      Sfx.tap(); rerender();
    } else if (c === 'shape') { g.shape = b.dataset.s; Sfx.tap(); rerender(); }
    else if (c === 'go') { beginPlay(); }
    else if (c === 'stop') { endRound('stop'); }
    else if (c === 'again') { g.phase = 'setup'; rerender(); }
    else if (c === 'done') { finish(); }
  }
  function rerender() { unmount(); render(); }

  // ---------- vòng chơi ----------
  function beginPlay() {
    Object.assign(g, {
      phase: 'play', time: ROUND, elapsed: 0, spawnT: .6,
      objs: [], halves: [], parts: [], stains: [], pops: [], trail: [],
      counts: Object.fromEntries(g.fruits.map(k => [k, 0])),
      target: g.d.box.per, sliced: 0, missed: 0, bugs: 0, combos: 0, cutting: false, stroke: null,
      shake: 0, revealT: 0, endReason: '',
    });
    rerender();
    say(TALK.cut.start);
  }

  const full = k => g.counts[k] >= g.target;
  const allFull = () => g.fruits.every(full);

  function spawn() {
    const wave = g.elapsed > 18 ? 2 + (Math.random() < .3 ? 1 : 0) : g.elapsed > 8 ? 1 + (Math.random() < .5 ? 1 : 0) : 1;
    for (let n = 0; n < wave; n++) {
      const need = g.fruits.filter(k => !full(k));
      let k;
      if (g.elapsed > 4 && Math.random() < .14) k = BUG;
      else k = (need.length ? need : g.fruits)[Math.floor(Math.random() * (need.length || g.fruits.length))];
      const x = 50 + Math.random() * (W - 100);
      g.objs.push({
        k, x, y: H + 30, r: k === BUG ? 22 : 28,
        vx: (W / 2 - x) * (.35 + Math.random() * .5), vy: -(600 + Math.random() * 120),
        rot: Math.random() * 6, vr: (Math.random() - .5) * 4, dead: false,
      });
    }
    Sfx.scoop();
  }

  function down(e) {
    if (g.phase !== 'play') return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch {}
    g.cutting = true;
    g.stroke = { hits: 0 };
    const p = pt(e);
    g.trail = [{ ...p, t: performance.now() }];
  }
  function move(e) {
    if (!g.cutting || g.phase !== 'play') return;
    const p = pt(e), prev = g.trail[g.trail.length - 1];
    g.trail.push({ ...p, t: performance.now() });
    if (!prev) return; // vệt dao đã mờ hết (giữ tay đứng yên) → bắt đầu vệt mới
    if (Math.hypot(p.x - prev.x, p.y - prev.y) < 2) return;
    g.objs.forEach(o => {
      if (!o.dead && segDist(o.x, o.y, prev.x, prev.y, p.x, p.y) < o.r) slice(o, Math.atan2(p.y - prev.y, p.x - prev.x));
    });
  }
  function up() {
    if (!g || !g.cutting) return;
    g.cutting = false;
    if (g.stroke && g.stroke.hits >= 2) {
      g.combos += g.stroke.hits - 1;
      pop(`COMBO x${g.stroke.hits}!`, '#f2b632', 28, W / 2, 140);
      Sfx.rate('great');
      if (g.stroke.hits >= 3) say(pick(TALK.cut.combo));
    }
  }
  function pt(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function slice(o, ang) {
    o.dead = true;
    if (o.k === BUG) {
      g.bugs++;
      const have = g.fruits.filter(k => g.counts[k] > 0);
      if (have.length) g.counts[have[Math.floor(Math.random() * have.length)]]--;
      pop('CÓ SÂU! −1', '#ff6b5a', 26, o.x, o.y - 30);
      burst(o.x, o.y, ['#7cb342', '#c5e1a5'], 12);
      g.shake = 1;
      Sfx.rate('miss');
      say(pick(TALK.cut.bug));
      return;
    }
    g.sliced++;
    if (g.stroke) g.stroke.hits++;
    const wasFull = full(o.k);
    g.counts[o.k] = Math.min(g.target, g.counts[o.k] + 1);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    [-1, 1].forEach(side => g.halves.push({
      k: o.k, x: o.x, y: o.y, r: o.r, ang, side,
      vx: o.vx * .4 + nx * 110 * side, vy: Math.min(o.vy, 0) * .3 + ny * 110 * side - 60,
      rot: 0, vr: side * 4, life: 1.6,
    }));
    const col = CUT_FRUIT[o.k].flesh;
    burst(o.x, o.y, [col, col, '#fff'], 14);
    g.stains.push({ x: o.x, y: Math.max(o.y, 60), r: 18 + Math.random() * 14, c: col, life: 3 });
    Sfx.slice();
    if (!wasFull) {
      if (full(o.k)) { pop(`ĐỦ NGĂN ${CUT_FRUIT[o.k].name.toUpperCase()}!`, '#9fe39a', 20, W / 2, 110); Sfx.ding(); }
      else pop(`${g.counts[o.k]}/${g.target}`, '#fff', 18, o.x, o.y - 26);
    }
    if (allFull()) endRound('full');
  }

  function endRound(reason) {
    if (g.phase !== 'play') return;
    g.phase = 'ending'; g.endReason = reason; g.cutting = false;
    pop(reason === 'full' ? 'HỘP ĐẦY! 🎉' : reason === 'time' ? 'HẾT GIỜ!' : 'ĐÓNG HỘP!', reason === 'full' ? '#f2b632' : '#fff', 34, W / 2, H / 2 - 40);
    say(reason === 'full' ? pick(TALK.cut.full) : TALK.cut.time);
    if (reason === 'full') Sfx.fanfare(); else Sfx.rate('good');
    ctrl();
    setTimeout(() => { if (g && g.phase === 'ending') { g.phase = 'reveal'; g.revealT = 0; computeResult(); say(resultLine()); } }, 1300);
  }

  function computeResult() {
    const d = g.d, max = maxPoints(d);
    const fill = g.fruits.reduce((a, k) => a + Math.min(g.counts[k], g.target), 0) / (g.fruits.length * g.target);
    const shots = g.sliced + g.missed;
    let acc = shots ? g.sliced / shots : 0;
    acc *= Math.max(0, 1 - .15 * g.bugs);
    const stars = fill >= 1 && acc >= .8 && g.bugs === 0 ? 3 : fill >= .7 ? 2 : 1;
    const base = Math.round(max * POINT_SPLIT.base * fill);
    const perfectBonus = Math.round(max * POINT_SPLIT.perfect * acc);
    const bonus = fill >= 1 ? Math.round(max * POINT_SPLIT.speed * Math.max(0, g.time) / ROUND) : 0;
    let total = Math.min(max, base + perfectBonus + bonus);
    const floorBonus = Math.max(0, Math.round(max * POINT_CFG.floor) - total);
    total += floorBonus;
    let bests = {};
    try { bests = JSON.parse(localStorage.getItem('cafehai.best2')) || {}; } catch {}
    const best = bests[d.id] || 0, skill = total - floorBonus, newBest = skill > best;
    if (newBest) { bests[d.id] = skill; try { localStorage.setItem('cafehai.best2', JSON.stringify(bests)); } catch {} }
    g.result = { fill, acc, stars, base, perfectBonus, bonus, floorBonus, total, max, best, newBest, elapsed: Math.round(g.elapsed) };
  }
  function resultLine() {
    const r = g.result;
    return r.stars === 3 ? pick(TALK.cut.final[3]) : r.stars === 2 ? pick(TALK.cut.final[2]) : pick(TALK.cut.final[1]);
  }

  function finish() {
    const r = g.result, d = g.d;
    const image = cv.toDataURL('image/png');
    unmount();
    onFinish({
      id: d.id, opts: boxOptions(d, g.fruits, g.shape), values: [], image,
      stars: r.stars, points: r.base, perfectBonus: r.perfectBonus, bonus: r.bonus, floorBonus: r.floorBonus, total: r.total, max: r.max,
      best: r.best, newBest: r.newBest, elapsed: r.elapsed,
      labels: { base: `Độ đầy hộp (${Math.round(r.fill * 100)}%)`, perfect: `Thưởng cắt chuẩn (${Math.round(r.acc * 100)}%)` },
    });
  }

  // ---------- cập nhật ----------
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    update(dt); draw();
    if (g.phase !== 'setup') raf = requestAnimationFrame(frame);
  }

  function update(dt) {
    if (g.phase === 'play') {
      g.time -= dt; g.elapsed += dt;
      if (g.time <= 0) { g.time = 0; endRound('time'); }
      g.spawnT -= dt;
      if (g.spawnT <= 0 && g.phase === 'play') { spawn(); g.spawnT = Math.max(.55, 1.15 - g.elapsed * .02); }
    }
    if (g.phase === 'reveal') {
      const before = g.revealT;
      g.revealT += dt;
      if (before <= 1.6 && g.revealT > 1.6) ctrl();
    }
    g.objs.forEach(o => {
      o.vy += 720 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
      if (!o.dead && o.vy > 0 && o.y > H + 40) {
        o.dead = true;
        if (o.k !== BUG && g.phase === 'play') { g.missed++; if (Math.random() < .35) say(pick(TALK.cut.miss)); }
      }
    });
    g.objs = g.objs.filter(o => !o.dead);
    g.halves.forEach(h => { h.vy += 720 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; h.life -= dt; });
    g.halves = g.halves.filter(h => h.life > 0 && h.y < H + 60);
    g.parts.forEach(p => { p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.6; });
    g.parts = g.parts.filter(p => p.life > 0);
    g.stains.forEach(s => { s.life -= dt; });
    g.stains = g.stains.filter(s => s.life > 0);
    g.pops.forEach(p => { p.t += dt; });
    g.pops = g.pops.filter(p => p.t < 1.2);
    const now = performance.now();
    g.trail = g.trail.filter(p => now - p.t < 140);
    g.shake = Math.max(0, g.shake - dt * 4);
  }

  // ---------- vẽ ----------
  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (g.phase === 'reveal') return drawReveal();
    ctx.save();
    if (g.shake) ctx.translate((Math.random() - .5) * 8 * g.shake, 0);
    // thớt gỗ
    const wood = ctx.createLinearGradient(0, 0, 0, H);
    wood.addColorStop(0, '#e6c79c'); wood.addColorStop(1, '#cfa673');
    ctx.fillStyle = wood; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120, 80, 40, .12)'; ctx.lineWidth = 2;
    for (let y = 14; y < H; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * .3, y + 6, W * .6, y - 6, W, y + 3); ctx.stroke(); }
    ctx.globalAlpha = .08; ctx.fillStyle = '#7a2e1f'; ctx.font = '900 150px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('H', W / 2, H / 2 - 20); ctx.globalAlpha = 1;
    // vết nước quả
    g.stains.forEach(s => { ctx.globalAlpha = Math.min(.35, s.life / 6); ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;
    // quả & sâu
    g.objs.forEach(o => {
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(4, o.r * .9, o.r * .7, o.r * .2, 0, 0, Math.PI * 2); ctx.fill();
      drawIcon(o.k, 0, 0, o.r * 2);
      ctx.restore();
    });
    // nửa quả bị cắt
    g.halves.forEach(h => {
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot); ctx.globalAlpha = Math.min(1, h.life);
      ctx.rotate(h.ang);
      ctx.beginPath(); h.side > 0 ? ctx.rect(-h.r * 1.6, 0, h.r * 3.2, h.r * 1.6) : ctx.rect(-h.r * 1.6, -h.r * 1.6, h.r * 3.2, h.r * 1.6); ctx.clip();
      ctx.rotate(-h.ang);
      drawIcon(h.k, 0, 0, h.r * 2);
      ctx.rotate(h.ang);
      ctx.fillStyle = CUT_FRUIT[h.k].flesh; ctx.beginPath(); ctx.ellipse(0, 0, h.r * .82, h.r * .2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    // hạt nước
    g.parts.forEach(p => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;
    // vệt dao
    if (g.trail.length > 1) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < g.trail.length; i++) {
        const a = g.trail[i - 1], b = g.trail[i], k = i / g.trail.length;
        ctx.strokeStyle = `rgba(255,255,255,${.25 + .7 * k})`; ctx.lineWidth = 2 + 7 * k;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.restore();
    drawHud();
    drawPops();
  }

  function drawHud() {
    // thanh thời gian
    const f = Math.max(0, g.time / ROUND);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(12, 10, W - 24, 10, 5); ctx.fill();
    ctx.fillStyle = f > .3 ? '#5fbf5a' : '#ff6b5a'; rr(12, 10, (W - 24) * f, 10, 5); ctx.fill();
    ctx.fillStyle = '#4a2016'; ctx.font = '800 13px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(`⏱ ${Math.ceil(g.time)}s`, 14, 26);
    ctx.textAlign = 'right';
    ctx.fillText(`🔪 ${g.sliced}  ·  🐛 ${g.bugs}`, W - 14, 26);
    // các ngăn hộp
    const n = g.fruits.length, cw = (W - 24 - (n - 1) * 6) / n, y = BOARD_Y + 30;
    g.fruits.forEach((k, i) => {
      const x = 12 + i * (cw + 6), p = Math.min(1, g.counts[k] / g.target);
      ctx.fillStyle = 'rgba(30,20,15,.75)'; rr(x, y, cw, 42, 8); ctx.fill();
      ctx.fillStyle = CUT_FRUIT[k].flesh; rr(x + 3, y + 42 - 3 - 36 * p, cw - 6, 36 * p, 6); ctx.fill();
      drawIcon(k, x + cw / 2, y + 21, 22);
      if (p >= 1) { ctx.fillStyle = '#fff'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('✓', x + cw - 5, y + 3); }
    });
  }

  function drawReveal() {
    const t = g.revealT, n = g.fruits.length;
    const cols = n === 4 ? 2 : 3, rows = Math.ceil(n / cols);
    const cellW = 96, cellH = 104, gap = 6;
    const bw = cols * cellW + (cols - 1) * gap + 24, bh = rows * cellH + (rows - 1) * gap + 24;
    const bx = (W - bw) / 2, by = 60 + Math.max(0, 1 - t * 2) * 40;
    // nền
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#f6ead6'); bg.addColorStop(1, '#e8d3b4');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#4a2016'; ctx.font = '900 20px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Hộp quả của bạn', W / 2, 18);
    // hộp giấy trắng
    ctx.globalAlpha = Math.min(1, t * 3);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(bx + 4, by + 8, bw, bh, 10); ctx.fill();
    ctx.fillStyle = '#fbfaf6'; rr(bx, by, bw, bh, 10); ctx.fill();
    const cells = cols * rows;
    for (let i = 0; i < cells; i++) {
      const cx = bx + 12 + (i % cols) * (cellW + gap), cy = by + 12 + Math.floor(i / cols) * (cellH + gap);
      ctx.fillStyle = '#1e1a18'; rr(cx, cy, cellW, cellH, 6); ctx.fill();
      const k = g.fruits[i];
      if (!k) { // ô trống → logo quán
        ctx.strokeStyle = '#f3e3c3'; ctx.lineWidth = 3; ctx.strokeRect(cx + cellW / 2 - 18, cy + cellH / 2 - 18, 36, 36);
        ctx.fillStyle = '#f3e3c3'; ctx.font = '900 26px "Be Vietnam Pro", sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText('H', cx + cellW / 2, cy + cellH / 2 + 1);
        continue;
      }
      const pieces = Math.min(g.counts[k], g.target) * 2, maxP = g.target * 2;
      const pc = 3, pr = 13;
      for (let p = 0; p < pieces; p++) {
        const appear = Math.min(1, Math.max(0, (t - .3 - i * .12 - p * .04) * 5));
        if (appear <= 0) continue;
        const px = cx + 18 + (p % pc) * 30 + (Math.floor(p / pc) % 2) * 6, py = cy + 18 + Math.floor(p / pc) * (cellH - 30) / Math.ceil(maxP / pc);
        ctx.save(); ctx.translate(px, py); ctx.scale(appear, appear); ctx.rotate((p * 37 % 30 - 15) * Math.PI / 180);
        shapePath(g.shape, pr);
        ctx.fillStyle = CUT_FRUIT[k].flesh; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(-pr * .3, -pr * .3, pr * .25, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      if (pieces && t > .8 + i * .12) daisy(cx + cellW - 24, cy + cellH / 2 + 6, 9);
      if (pieces < maxP) {
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '700 10px "Be Vietnam Pro", sans-serif'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${Math.round(pieces / maxP * 100)}%`, cx + cellW / 2, cy + cellH - 4);
      }
    }
    ctx.globalAlpha = 1;
    // nhãn
    ctx.fillStyle = '#4a2016'; ctx.font = '700 13px "Be Vietnam Pro", sans-serif'; ctx.textBaseline = 'top';
    ctx.fillText(g.fruits.map(k => CUT_FRUIT[k].name).join(' · '), W / 2, by + bh + 14);
    ctx.fillStyle = '#7d6a5c'; ctx.font = '600 12px "Be Vietnam Pro", sans-serif';
    ctx.fillText(`Kiểu tỉa: ${SHAPES.find(s => s.id === g.shape).name}`, W / 2, by + bh + 34);
    if (g.result && t > 1) {
      const r = g.result;
      ctx.font = '30px serif';
      ctx.fillText([1, 2, 3].map(s => (s <= r.stars ? '⭐' : '☆')).join(' '), W / 2, by + bh + 56);
    }
    drawPops();
  }

  function shapePath(s, r) {
    ctx.beginPath();
    if (s === 'tim') {
      ctx.moveTo(0, r * .9);
      ctx.bezierCurveTo(-r * 1.3, -r * .1, -r * .7, -r * 1.1, 0, -r * .45);
      ctx.bezierCurveTo(r * .7, -r * 1.1, r * 1.3, -r * .1, 0, r * .9);
    } else if (s === 'sao') {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .45 : r;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
    } else if (s === 'hoa') {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        ctx.moveTo(Math.cos(a) * r * .5 + r * .5, Math.sin(a) * r * .5);
        ctx.arc(Math.cos(a) * r * .5, Math.sin(a) * r * .5, r * .5, 0, Math.PI * 2);
      }
    } else {
      ctx.roundRect ? ctx.roundRect(-r * .8, -r * .8, r * 1.6, r * 1.6, 3) : ctx.rect(-r * .8, -r * .8, r * 1.6, r * 1.6);
    }
  }

  function daisy(x, y, r) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6, r * .5, r * .22, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.arc(x, y, r * .3, 0, Math.PI * 2); ctx.fill();
  }

  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, Math.max(0, h), r) : ctx.rect(x, y, w, Math.max(0, h)); }
  function burst(x, y, colors, n) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 180;
      g.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: 1, r: 2 + Math.random() * 3, c: colors[k % colors.length] });
    }
  }
  function pop(text, color, size, x, y) { g.pops.push({ text, color, size, x, y, t: 0 }); }
  function drawPops() {
    g.pops.forEach(p => {
      const a = p.t < .9 ? 1 : 1 - (p.t - .9) / .3;
      ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(p.x, p.y - p.t * 30);
      ctx.font = `900 ${p.size}px "Be Vietnam Pro", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(40,15,8,.85)'; ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
      ctx.restore();
    });
  }

  return { start, html, mount, unmount, icon, get active() { return g; } };
})();
