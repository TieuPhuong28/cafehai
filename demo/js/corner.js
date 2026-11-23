// ===== Góc quán của tôi (app khách) =====
// Phòng 4×4 ô nhìn nghiêng: mua đồ bằng xu, bày biện, lên cấp, nhận quà thật ở mốc cấp.
// Xu chỉ đến từ đơn thật đã hoàn tất (quầy cộng), xem CornerData.credit.
const Corner = (() => {
  const C = CornerData;
  const num = n => Math.round(n || 0).toLocaleString('vi-VN');
  let tab = 'shop', group = 'seat', sel = null, introSeen = false;
  // sel: { mode: 'place', id } | { mode: 'item', k } | { mode: 'move', k }

  const online = () => Cloud.enabled;
  const enabled = () => C.cfg().enabled;
  const key = () => (online() ? Cloud.uid : C.phoneKey(state.customer.phone));
  function doc() {
    if (online()) return Cloud.uid && Cloud.corner ? C.normalize(Cloud.corner) : null;
    return key() ? C.localGet(key()) : null;
  }

  // ---------- hình vẽ ----------
  const W0 = 200, Y0 = 130, TW = 40, TH = 20;          // gốc lưới, nửa rộng / nửa cao một ô
  const cellXY = n => { const r = Math.floor(n / C.GRID), c = n % C.GRID; return [W0 + (c - r) * TW, Y0 + (c + r + 1) * TH]; };
  const wallXY = k => {
    const t = ((k % 4) + .5) / 4;
    return k < 4 ? [40 + 160 * t, 210 - 80 * t - 62, -1] : [200 + 160 * t, 130 + 80 * t - 62, 1];
  };
  const diamond = (x, y) => `${x},${y - TH} ${x + TW},${y} ${x},${y + TH} ${x - TW},${y}`;
  const cube = (H, left, right, top) => `
    <polygon points="-22,-11 0,0 0,-${H} -22,-${11 + H}" fill="${left}"/>
    <polygon points="22,-11 0,0 0,-${H} 22,-${11 + H}" fill="${right}"/>
    <polygon points="0,-${22 + H} 22,-${11 + H} 0,-${H} -22,-${11 + H}" fill="${top}"/>`;
  const cab = inner => `${cube(16, '#8a5a36', '#6b4226', '#b07a4d')}<g transform="translate(0,-27)">${inner}</g>`;
  const emo = (e, size = 36, y = -2) => `<text y="${y}" font-size="${size}" text-anchor="middle">${e}</text>`;

  const SPRITES = {
    ghe_xep: `<g stroke="#1d1d1d" stroke-width="3" stroke-linecap="round" fill="none"><path d="M-12 0 L8 -18 M8 0 L-12 -18 M-12 -18 L-12 -44"/></g>
      <rect x="-15" y="-21" width="26" height="5" rx="2" fill="#2a2a2a"/><rect x="-16" y="-47" width="8" height="19" rx="2" fill="#2a2a2a"/>`,
    ban_go: `<path d="M-6 0 V-22 M6 0 V-22 M-20 -6 V-25 M20 -6 V-25" stroke="#5b3a22" stroke-width="3"/>
      <polygon points="-26,-27 0,-16 0,-12 -26,-23" fill="#8a5a36"/><polygon points="26,-27 0,-16 0,-12 26,-23" fill="#6b4226"/>
      <polygon points="0,-38 26,-27 0,-16 -26,-27" fill="#c08a5a" stroke="#6b4226" stroke-width="1.5"/>`,
    ghe_dau: `<polygon points="-12,0 -8,-22 8,-22 12,0" fill="#d23a2a"/><ellipse cx="0" cy="-22" rx="11" ry="4" fill="#ef5a45"/><ellipse cx="0" cy="-9" rx="5" ry="3.5" fill="#8e2014" opacity=".55"/>`,
    ban_tron: `<rect x="-2" y="-26" width="4" height="26" fill="#555"/><ellipse cx="0" cy="0" rx="10" ry="4" fill="#3d3d3d"/><ellipse cx="0" cy="-27" rx="23" ry="9" fill="#ece7df" stroke="#a9a196" stroke-width="2"/>`,
    quay_bar: `${cube(30, '#6b4226', '#4a2a17', '#c8956a')}<text x="-11" y="-14" font-size="11" font-weight="900" fill="#f3e3c3">H</text>${emo('☕', 13, -44)}`,
    xich_du: `<path d="M-24 0 L-16 -58 L-8 0 M8 0 L16 -58 L24 0 M-17 -58 H17" stroke="#7a4a2c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M-10 -58 V-20 M10 -58 V-20" stroke="#bfa27a" stroke-width="1.5"/><rect x="-14" y="-22" width="28" height="5" rx="2" fill="#a06a3c"/>`,
    phin: cab(`<path d="M-9 0 L-10 -15 H10 L9 0 Z" fill="#fff" stroke="#bbb"/><rect x="-9" y="-11" width="18" height="10" fill="#3b2116"/>
      <rect x="-12" y="-18" width="24" height="3" fill="#c9ccd1"/><path d="M-8 -18 L-7 -32 H7 L8 -18 Z" fill="#d9dce0" stroke="#9aa0a6"/><rect x="-9" y="-35" width="18" height="4" rx="2" fill="#b8bcc2"/>`),
    am_tra: cab(emo('🫖', 26, -1)),
    may_xay: cab(`<rect x="-8" y="-22" width="16" height="22" rx="2" fill="#8b1e1e"/><polygon points="-11,-37 11,-37 5,-22 -5,-22" fill="#e6dccb" stroke="#999"/>
      <ellipse cx="0" cy="-37" rx="11" ry="3" fill="#4a2a17"/><rect x="-5" y="-8" width="10" height="6" fill="#222"/>`),
    may_ep: cab(`<rect x="-11" y="-21" width="22" height="21" rx="4" fill="#f39a12"/><path d="M-8 -21 Q0 -38 8 -21 Z" fill="#ffd36b" stroke="#e08a00"/>
      <rect x="9" y="-13" width="7" height="3" fill="#ccc"/><text x="0" y="-6" font-size="9" text-anchor="middle">🍊</text>`),
    coldbrew: cab(`<rect x="-9" y="-34" width="18" height="34" rx="4" fill="rgba(255,255,255,.4)" stroke="#9ab"/><rect x="-7" y="-27" width="14" height="25" rx="2" fill="#3a2013"/>
      <rect x="-10" y="-38" width="20" height="5" rx="2" fill="#333"/><rect x="9" y="-8" width="5" height="3" fill="#888"/>`),
    tu_chai: `${cube(50, '#5b3a22', '#3b2418', '#8a5a36')}<g transform="skewY(-26.565)"><rect x="3" y="-45" width="16" height="38" fill="rgba(190,220,230,.35)" stroke="#a88"/>
      ${[-40, -27, -14].map(y => [6, 11, 16].map(x => `<rect x="${x - 1.5}" y="${y}" width="3" height="9" rx="1" fill="${['#2a1810', '#7a4a30', '#b68a62'][(x + y) % 3 < 0 ? 0 : (x + y) % 3]}"/>`).join('')).join('')}</g>`,
    tu_qua: `${cube(50, '#e9eef2', '#cfd8de', '#f7fafc')}<g transform="skewY(-26.565)"><rect x="3" y="-46" width="16" height="40" fill="rgba(170,220,240,.45)" stroke="#9bb"/>
      <text x="11" y="-32" font-size="8" text-anchor="middle">🍉🍍</text><text x="11" y="-18" font-size="8" text-anchor="middle">🍊🍎</text></g>`,
    quay_qua: `${cube(20, '#6b8a3a', '#4e6b28', '#a5c46a')}<text x="0" y="-30" font-size="12" text-anchor="middle">🍉🍍🍊</text><text x="0" y="-22" font-size="10" text-anchor="middle">🥭🍎</text>`,
    // --- đồ treo tường (tâm ở 0,0) ---
    poster_co: `<rect x="-12" y="-16" width="24" height="32" fill="#da251d" stroke="#f6e3c0" stroke-width="2"/><polygon points="0,-8 2.4,-1.5 9,-1.5 3.6,2.5 5.6,9 0,5 -5.6,9 -3.6,2.5 -9,-1.5 -2.4,-1.5" fill="#ffde00"/>`,
    ke_ly: `<rect x="-22" y="6" width="44" height="4" fill="#8a5a36"/>${[-14, 0, 14].map(x => `<path d="M${x - 5} -8 L${x - 4} 6 H${x + 4} L${x + 5} -8 Z" fill="#fff" stroke="#ccc"/><text x="${x}" y="2" font-size="7" font-weight="900" text-anchor="middle" fill="#7a2e1f">H</text>`).join('')}`,
    bang_vang: `<rect x="-17" y="-14" width="34" height="28" rx="3" fill="#c9971f"/><rect x="-14" y="-11" width="28" height="22" rx="2" fill="#2e1a10"/>
      <text x="0" y="-4" font-size="5.5" font-weight="900" text-anchor="middle" fill="#f6d36b">BẢNG VÀNG</text>
      <path d="M-10 1 H10 M-10 5 H6 M-10 9 H8" stroke="#f6d36b" stroke-width="1.2" opacity=".7"/>`,
    bien_h: `<rect x="-17" y="-17" width="34" height="34" rx="3" fill="#1c110c" stroke="#6b4226" stroke-width="2"/>
      <g class="cn-glow"><rect x="-12" y="-12" width="24" height="24" fill="none" stroke="#ffcf6b" stroke-width="2"/><path d="M-5 -8v16M5 -8v16M-5 0h10" stroke="#ffcf6b" stroke-width="3.5"/></g>`,
  };
  const SEAT_Y = { ghe_xep: -27, ghe_dau: -30, ghe_may: -24, sofa: -16, xich_du: -27 };
  const GUESTS = ['🧑', '👩', '👨', '👧', '🧔', '👵'];

  function sprite(it) {
    if (SPRITES[it.id]) return SPRITES[it.id];
    if (it.place === 'wall') return emo(it.emoji, 28, 10);
    if (it.group === 'machine') return cab(emo(it.emoji, 24, -1));
    return emo(it.emoji || '📦');
  }
  const thumb = it => it.place === 'wall'
    ? `<svg class="cn-thumb" viewBox="-26 -26 52 52" aria-hidden="true">${sprite(it)}</svg>`
    : `<svg class="cn-thumb" viewBox="-32 -66 64 72" aria-hidden="true">${sprite(it)}</svg>`;

  function roomSVG(d) {
    const lv = C.level(d);
    const placing = sel && (sel.mode === 'place' || sel.mode === 'move');
    const moving = sel && sel.mode === 'move' ? d.layout[sel.k] : null;
    const pItem = placing ? C.ITEM[sel.mode === 'place' ? sel.id : moving.i] : null;
    const taken = new Set(d.layout.map((x, k) => (moving && k === sel.k ? null : x.s)));
    let tiles = '';
    for (let n = 0; n < C.GRID * C.GRID; n++) {
      const [x, y] = cellXY(n), s = 'f' + n;
      const ok = pItem && pItem.place === 'floor' && !taken.has(s);
      tiles += `<polygon class="cn-tile ${(Math.floor(n / 4) + n) % 2 ? 'b' : ''} ${ok ? 'ok' : ''}" points="${diamond(x, y)}" data-act="cn" data-a="cell" data-s="${s}"/>`;
    }
    let slots = '';
    if (pItem && pItem.place === 'wall') {
      for (let k = 0; k < C.WALL_SLOTS; k++) {
        const s = 'w' + k;
        if (taken.has(s)) continue;
        const [x, y, side] = wallXY(k);
        slots += `<g transform="translate(${x},${y}) skewY(${side * 26.565})"><rect class="cn-slot" x="-17" y="-19" width="34" height="38" rx="4" data-act="cn" data-a="cell" data-s="${s}"/></g>`;
      }
    }
    // đồ: tường trước, sàn theo thứ tự xa → gần
    const list = d.layout.map((x, k) => ({ ...x, k, it: C.ITEM[x.i] })).filter(x => x.it);
    const depth = x => x.s[0] === 'w' ? -1 : (() => { const n = +x.s.slice(1); return Math.floor(n / 4) + n % 4; })();
    list.sort((a, b) => depth(a) - depth(b));
    let seats = 0;
    const items = list.map(x => {
      const on = sel && sel.k === x.k && sel.mode !== 'place';
      let tr;
      if (x.s[0] === 'w') { const [wx, wy, side] = wallXY(+x.s.slice(1)); tr = `translate(${wx},${wy}) skewY(${side * 26.565})`; }
      else { const [cx, cy] = cellXY(+x.s.slice(1)); tr = `translate(${cx},${cy + 8}) scale(1.2)`; }
      const guest = x.it.seat && seats < lv ? GUESTS[(seats++ + x.k) % GUESTS.length] : '';
      return `<g class="cn-it ${on ? 'on' : ''} ${moving && sel.k === x.k ? 'ghost' : ''}" transform="${tr}" data-act="cn" data-a="item" data-k="${x.k}">
        <g transform="scale(${x.f ? -1 : 1},1)">${sprite(x.it)}</g>
        ${guest ? `<g class="cn-guest" style="animation-delay:-${x.k * .4}s"><text y="${SEAT_Y[x.i] + 4}" font-size="20" text-anchor="middle">${guest}</text></g>` : ''}
      </g>`;
    }).join('');
    return `
    <svg class="cn-room" viewBox="0 0 400 304" role="img" aria-label="Góc quán của bạn">
      <defs><linearGradient id="cnWallL" x1="0" x2="1"><stop offset="0" stop-color="#e8d6b4"/><stop offset="1" stop-color="#f3e6cc"/></linearGradient>
        <linearGradient id="cnWallR" x1="0" x2="1"><stop offset="0" stop-color="#e4cfa9"/><stop offset="1" stop-color="#d6bf96"/></linearGradient></defs>
      <polygon points="40,210 200,130 200,18 40,98" fill="url(#cnWallL)"/>
      <polygon points="200,130 360,210 360,98 200,18" fill="url(#cnWallR)"/>
      <path d="M40 98 L200 18 L360 98" fill="none" stroke="#7a2e1f" stroke-width="5"/>
      <path d="M40 196 L200 116 L360 196" fill="none" stroke="#b9925f" stroke-width="3" opacity=".6"/>
      <g transform="translate(118,66) skewY(-26.565)"><rect x="-26" y="-14" width="52" height="28" fill="#87b4d6" stroke="#fff" stroke-width="3"/><path d="M0 -14 V14 M-26 0 H26" stroke="#fff" stroke-width="2"/></g>
      ${tiles}${slots}${items}
    </svg>`;
  }

  // ---------- giao diện ----------
  function view() {
    const head = d => topbar('🏠 Góc quán của tôi', d ? `Cấp ${C.level(d)} · ${num(C.balance(d))} xu` : 'Mỗi đơn thật = xu để trang trí');
    if (!enabled()) return `${head()}<div class="empty"><div>🏠</div>Quán đang tạm tắt Góc quán.<br>Bạn vẫn đặt món bình thường nhé!</div>${orderFab()}`;
    if (online() && !Cloud.ready) return `${head()}<div class="empty"><div>⏳</div>Đang tải…</div>`;
    if (online() && !Cloud.uid) return `${head()}${pitch()}
      <div class="panel"><p class="muted-p">Góc quán lưu theo tài khoản, đổi điện thoại không mất. Đăng nhập để nhận xu từ mỗi đơn hoàn tất.</p>
        <button class="btn primary block" data-act="acc" data-a="login">Đăng nhập / Tạo tài khoản</button></div>${orderFab()}`;
    if (!online() && !key()) return `${head()}${pitch()}
      <form class="panel" id="cnPhone"><h3>Góc quán của bạn</h3>
        <p class="muted-p">Bản demo lưu góc quán theo số điện thoại bạn dùng khi đặt hàng.</p>
        <label class="field"><span>Số điện thoại</span><input name="phone" inputmode="tel" required placeholder="09xx xxx xxx"></label>
        <button class="btn primary block" type="submit">Mở góc quán</button></form>${orderFab()}`;
    const d = doc();
    if (!d) {
      const st = Cloud.cornerState;
      return `${head()}<div class="empty"><div>${st === 'error' ? '⚠️' : '⏳'}</div>${st === 'error'
        ? 'Chưa mở được góc quán trên bản online.<br><small>Quán cần cập nhật quy tắc Firestore (xem HUONG-DAN-FIREBASE.md).</small>' : 'Đang dọn góc quán cho bạn…'}</div>${orderFab()}`;
    }
    const p = C.progress(d);
    const intro = !introSeen && !LS.get('cafehai.cornerIntro', false);
    if (intro) { introSeen = true; LS.set('cafehai.cornerIntro', true); }
    const nInv = C.ITEMS.reduce((a, it) => a + Math.max(0, C.free(d, it.id)), 0);
    return `
    ${head(d)}
    <div class="cn-stats">
      <div class="cn-lv"><small>Cấp</small><b>${p.lv}</b></div>
      <div class="cn-prog">
        <div class="cn-prog-t"><span>✨ Phong cách <b>${num(p.style)}</b>${p.next ? ` / ${p.next}` : ''}</span><span>${p.next ? `còn ${p.left} lên cấp ${p.lv + 1}` : 'Cấp cao nhất bản đầu'}</span></div>
        <div class="cn-bar"><i style="width:${p.pct}%"></i></div>
      </div>
      <div class="cn-xu"><small>Xu</small><b>🪙 ${num(C.balance(d))}</b></div>
    </div>
    ${intro ? host('Anh để dành cho bạn một góc này, bày biện tùy thích nhé! Mỗi đơn quán giao xong là bạn có xu mua đồ. Mua món nào thì mở khóa máy móc món đó.', true) : ''}
    <div class="cn-stage">
      ${roomSVG(d)}
      ${selBar(d)}
    </div>
    <nav class="cn-tabs">
      <button class="${tab === 'shop' ? 'on' : ''}" data-act="cn" data-a="tab" data-v="shop">🛒 Cửa hàng</button>
      <button class="${tab === 'inv' ? 'on' : ''}" data-act="cn" data-a="tab" data-v="inv">📦 Kho${nInv ? ` <small>${nInv}</small>` : ''}</button>
      <button class="${tab === 'gift' ? 'on' : ''}" data-act="cn" data-a="tab" data-v="gift">🎁 Quà cấp${giftReady(d) ? ' <small>!</small>' : ''}</button>
    </nav>
    ${tab === 'shop' ? shopHTML(d) : tab === 'inv' ? invHTML(d) : giftHTML(d)}
    ${earnHTML(d)}
    ${orderFab()}`;
  }

  const orderFab = () => `<button class="cn-fab" data-act="go" data-to="scene">☕ Đặt món</button>`;
  const pitch = () => `
    <div class="cn-pitch">
      <span class="cn-pitch-ic">🏠</span>
      <b>Một góc Cafe Hải của riêng bạn</b>
      <span>Đặt món thật → quán giao xong → nhận xu → mua bàn ghế, cây xanh, máy ép… → quán lên cấp → nhận quà thật.</span>
    </div>`;

  function selBar(d) {
    if (!sel) return '';
    if (sel.mode === 'place' || sel.mode === 'move') {
      const it = C.ITEM[sel.mode === 'place' ? sel.id : d.layout[sel.k]?.i];
      if (!it) return '';
      return `<div class="cn-sel"><span>👆 Chạm ${it.place === 'wall' ? 'chỗ trên tường' : 'ô sáng'} để ${sel.mode === 'move' ? 'chuyển' : 'đặt'} <b>${esc(it.name)}</b></span>
        <button class="btn ghost sm" data-act="cn" data-a="cancel">Hủy</button></div>`;
    }
    const x = d.layout[sel.k], it = x && C.ITEM[x.i];
    if (!it) return '';
    return `<div class="cn-sel"><span><b>${esc(it.name)}</b></span>
      ${it.place === 'floor' ? '<button class="btn light sm" data-act="cn" data-a="flip">↔ Xoay</button>' : ''}
      <button class="btn light sm" data-act="cn" data-a="move">✥ Chuyển</button>
      <button class="btn light sm" data-act="cn" data-a="store">📦 Cất</button>
      <button class="btn ghost sm" data-act="cn" data-a="cancel">✕</button></div>`;
  }

  function shopHTML(d) {
    const g = C.GROUPS.find(x => x.id === group);
    return `
    <div class="cn-chips">${C.GROUPS.map(x => `<button class="chip ${x.id === group ? 'on' : ''}" data-act="cn" data-a="group" data-v="${x.id}">${x.icon} ${x.name}</button>`).join('')}</div>
    ${g.note ? `<p class="cn-note">${g.note}</p>` : ''}
    <div class="cn-list">${C.ITEMS.filter(it => it.group === group).map(it => {
      const can = C.canBuy(d, it), lock = !C.unlocked(d, it), have = C.count(d, it.id);
      return `
      <div class="cn-row ${lock ? 'locked' : ''}">
        ${thumb(it)}
        <div class="cn-info"><b>${esc(it.name)}</b>
          <small>${lock ? '🔒 ' + C.lockText(d, it) : esc(it.desc || (it.place === 'wall' ? 'Treo tường' : 'Đặt trên sàn'))}</small>
          <em>+${it.style} phong cách · đã có ${have}/${it.max}</em></div>
        <button class="btn ${can.ok ? 'primary' : 'ghost'} sm" data-act="cn" data-a="buy" data-id="${it.id}" ${can.ok ? '' : 'disabled'} title="${esc(can.why || '')}">${lock ? '🔒' : have >= it.max ? 'Đủ' : `🪙 ${it.price}`}</button>
      </div>`;
    }).join('')}</div>`;
  }

  function invHTML(d) {
    const rows = C.ITEMS.filter(it => C.count(d, it.id) > 0);
    return `<div class="cn-list">${rows.map(it => {
      const f = C.free(d, it.id);
      return `
      <div class="cn-row">
        ${thumb(it)}
        <div class="cn-info"><b>${esc(it.name)}</b><small>Đang bày ${C.placed(d, it.id)} · trong kho ${f}</small></div>
        <button class="btn ${f ? 'primary' : 'ghost'} sm" data-act="cn" data-a="place" data-id="${it.id}" ${f ? '' : 'disabled'}>Đặt vào quán</button>
      </div>`;
    }).join('')}</div>
    <p class="cn-note">Chạm vào món đồ trong quán để xoay, chuyển chỗ hoặc cất vào kho.</p>`;
  }

  // ----- quà ở mốc cấp -----
  const myOpen = () => Store.all().filter(o => (state.myOrders.includes(o.id) || (Cloud.uid && o.uid === Cloud.uid)) && !['xong', 'huy'].includes(o.status));
  function giftStatus(d, L) {
    if (d.gifts[L]) return 'done';
    if (state.cart.some(it => it.gift === L) || myOpen().some(o => (o.cornerGifts || []).includes(L))) return 'pending';
    return C.level(d) >= L ? 'ready' : 'locked';
  }
  const giftItem = L => { const id = C.cfg().gifts[L]; return id ? D(id) || null : null; };
  const giftReady = d => C.GIFT_LEVELS.some(L => giftItem(L) && giftStatus(d, L) === 'ready');

  function giftHTML(d) {
    const lv = C.level(d);
    return `<div class="cn-levels">${C.LEVELS.map((need, k) => {
      const L = k + 1, gd = C.GIFT_LEVELS.includes(L) ? giftItem(L) : null, st = gd ? giftStatus(d, L) : '';
      return `
      <div class="cn-lvrow ${lv >= L ? 'reached' : ''}">
        <span class="cn-lvn">${L}</span>
        <div class="cn-info"><b>Cấp ${L}</b><small>${need ? `Từ ${need} phong cách` : 'Khởi đầu'}${gd ? ` · 🎁 ${esc(gd.name)} miễn phí` : ''}</small></div>
        ${gd ? (st === 'done' ? '<span class="pill xong">Đã nhận</span>'
          : st === 'pending' ? '<span class="pill moi">Đang chờ giao</span>'
          : st === 'ready' ? `<button class="btn primary sm" data-act="cn" data-a="gift" data-v="${L}" ${gd.soldOut ? 'disabled' : ''}>${gd.soldOut ? 'Tạm hết' : 'Nhận quà'}</button>`
          : '<span class="pill">🔒</span>') : lv >= L ? '<span class="cn-ok">✓</span>' : ''}
      </div>`;
    }).join('')}</div>
    <p class="cn-note">Quà được thêm vào giỏ với giá 0đ và giao cùng đơn kế tiếp; quầy xác nhận khi hoàn tất đơn. Cấp 6–10 và mở rộng tầng 2 sẽ có ở bản sau.</p>`;
  }

  function earnHTML(d) {
    const c = C.cfg();
    const left = C.FIRST_KINDS.filter(k => !d.firsts[k]);
    return `<div class="panel cn-earn"><h3>🪙 Cách nhận xu</h3>
      <div class="sum-row"><span>Mỗi đơn quán giao xong</span><b>${c.rate} xu / 1.000đ</b></div>
      <div class="sum-row"><span>Lần đầu mua một loại món</span><b>+${c.firstBonus} xu</b></div>
      ${left.length ? `<p class="cn-note">Còn thưởng lần đầu: ${left.map(k => C.KINDS[k]).join(', ')}.</p>` : ''}
    </div>`;
  }

  // ---------- thao tác ----------
  function write(next, prev) {
    if (online()) {
      return Cloud.saveCornerLayout(next.layout).catch(e => toast('⚠️ ' + Cloud.niceError(e)));
    }
    const all = C.localAll()[key()] || {};
    C.localSet(key(), { ...all, ...next });
    render();
  }

  function cellClick(s) {
    const d = doc();
    if (!d) return;
    const at = d.layout.findIndex(x => x.s === s);
    if (!sel || sel.mode === 'item') {
      if (at >= 0) { sel = { mode: 'item', k: at }; render(); }
      else if (sel) { sel = null; render(); }
      return;
    }
    const id = sel.mode === 'place' ? sel.id : d.layout[sel.k].i, it = C.ITEM[id];
    if ((it.place === 'wall') !== (s[0] === 'w')) { toast(it.place === 'wall' ? 'Món này treo trên tường' : 'Món này đặt trên sàn'); return; }
    if (at >= 0 && !(sel.mode === 'move' && at === sel.k)) { toast('Chỗ này có đồ rồi, chọn chỗ khác nhé'); return; }
    const layout = d.layout.map(x => ({ ...x }));
    if (sel.mode === 'place') {
      if (C.free(d, id) <= 0) { toast('Trong kho hết món này'); sel = null; render(); return; }
      layout.push({ i: id, s });
    } else layout[sel.k].s = s;
    Sfx.tap();
    sel = null;
    write({ ...d, layout });
    render();
  }

  function buy(id) {
    const d = doc(), it = C.ITEM[id];
    if (!d || !it) return;
    const can = C.canBuy(d, it);
    if (!can.ok) { toast(can.why); return; }
    const lv0 = C.level(d);
    const next = { ...d, spent: (d.spent || 0) + it.price, owned: { ...d.owned, [id]: (d.owned[id] || 0) + 1 } };
    const done = () => {
      Sfx.ding();
      const lv = C.level(next);
      if (lv > lv0) {
        confetti(); Sfx.fanfare();
        const gift = C.GIFT_LEVELS.includes(lv) && giftItem(lv);
        toast(`🎉 Góc quán lên cấp ${lv}!${gift ? ` Nhận ${gift.name} miễn phí ở mục Quà cấp` : ''}`);
      } else toast(`Đã mua ${it.name}. Chạm ${it.place === 'wall' ? 'tường' : 'ô sáng'} để đặt`);
      sel = { mode: 'place', id };
      render();
      document.querySelector('.cn-stage')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    if (online()) {
      Cloud.buyCorner(id, it.price).then(done).catch(e => toast('⚠️ Chưa mua được: ' + Cloud.niceError(e)));
    } else {
      const all = C.localAll()[key()] || {};
      C.localSet(key(), { ...all, ...next, layout: d.layout });
      done();
    }
  }

  function claimGift(L) {
    const d = doc(), gd = giftItem(L);
    if (!d || !gd) return;
    if (giftStatus(d, L) !== 'ready') { toast('Quà này chưa nhận được'); return; }
    if (gd.soldOut) { toast(`${gd.name} đang tạm hết`); return; }
    state.cart.push({
      uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      id: gd.id, name: gd.name, price: 0, qty: 1,
      opts: defaultOptions(gd).map(o => ({ label: o.label, value: o.value })),
      played: false, stars: null, note: '', points: 0, reward: 'corner' + L, cost: 0, gift: L,
    });
    saveCart();
    Sfx.fanfare();
    toast(`🎁 Đã thêm ${gd.name} (quà cấp ${L}) vào giỏ`);
    go('cart');
  }

  function handle(el) {
    const a = el.dataset.a, d = doc();
    switch (a) {
      case 'tab': tab = el.dataset.v; sel = sel && sel.mode === 'place' ? null : sel; render(); break;
      case 'group': group = el.dataset.v; render(); break;
      case 'buy': buy(el.dataset.id); break;
      case 'place': sel = { mode: 'place', id: el.dataset.id }; render(); document.querySelector('.cn-stage')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); break;
      case 'cell': cellClick(el.dataset.s); break;
      case 'item': {
        const k = +el.dataset.k;
        if (sel && (sel.mode === 'place' || sel.mode === 'move')) cellClick(d.layout[k].s);
        else { sel = sel && sel.k === k ? null : { mode: 'item', k }; Sfx.tap(); render(); }
        break;
      }
      case 'flip': { const layout = d.layout.map((x, k) => (k === sel.k ? { ...x, f: x.f ? 0 : 1 } : x)); write({ ...d, layout }); render(); break; }
      case 'move': sel = { mode: 'move', k: sel.k }; render(); break;
      case 'store': { const layout = d.layout.filter((x, k) => k !== sel.k); sel = null; write({ ...d, layout }); render(); toast('Đã cất vào kho'); break; }
      case 'cancel': sel = null; render(); break;
      case 'gift': claimGift(+el.dataset.v); break;
    }
  }

  function submitPhone(form) {
    const phone = String(new FormData(form).get('phone') || '').replace(/\s/g, '');
    if (!/^0\d{9}$/.test(phone)) { toast('Số điện thoại gồm 10 số, bắt đầu bằng 0'); return; }
    state.customer.phone = phone;
    LS.set('cafehai.customer', state.customer);
    seenInit();
    render();
  }

  // ---------- báo xu mới / mở khóa (kể cả khi đang ở màn khác) ----------
  const seenKey = () => 'cafehai.cornerSeen.' + (key() || '');
  function seenInit() {
    const d = doc();
    if (d && !LS.get(seenKey(), null)) LS.set(seenKey(), { xu: d.xu || 0, un: C.unlockedIds(d) });
  }
  function check() {
    const d = doc();
    if (!d || !key()) return;
    const seen = LS.get(seenKey(), null);
    const un = C.unlockedIds(d);
    if (!seen) { LS.set(seenKey(), { xu: d.xu || 0, un }); return; }
    const gain = (d.xu || 0) - seen.xu, fresh = un.filter(id => !seen.un.includes(id));
    if (gain > 0 || fresh.length) {
      const it = fresh.map(id => C.ITEM[id]);
      toast(`${gain > 0 ? `+${num(gain)} xu cho góc quán!` : ''}${it.length ? ` Bạn vừa mở khóa ${it.map(x => `${x.name} ${x.icon || ''}`.trim()).join(', ')}` : ''}`.trim());
      if (it.length) Sfx.fanfare(); else Sfx.ding();
    }
    LS.set(seenKey(), { xu: d.xu || 0, un });
  }

  function init() {
    if (online()) {
      Cloud.on('corner', () => { check(); if (state.view === 'corner') render(); });
      Cloud.on('auth', () => { sel = null; if (state.view === 'corner') render(); });
    } else {
      seenInit();
      window.addEventListener('storage', e => {
        if (e.key === 'cafehai.corners') { check(); if (state.view === 'corner') render(); }
      });
    }
  }
  const leave = () => { sel = null; };

  return { view, handle, submitPhone, init, leave, enabled, estimate: C.estimate };
})();
