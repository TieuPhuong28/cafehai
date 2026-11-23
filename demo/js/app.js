// ===== Cafe Hải – app cho khách (demo) =====
const $app = document.getElementById('app');
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const D = id => MENU.find(d => d.id === id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));


const state = {
  view: 'scene',
  scene: { phase: 'outside', board: false }, // mỗi lần mở app đều bắt đầu từ ngoài cửa quán
  dlg: null,
  cat: 'cafe',
  cart: LS.get('cafehai.cart', []),
  customer: { name: '', phone: '', address: '', nick: '', hide: false, ...LS.get('cafehai.customer', {}) },
  myOrders: LS.get('cafehai.my', []),
  ship: 'ship',
  note: '',
  errors: {},
  custom: null,
  trackId: null,
  lbPeriod: 'week',
};
const saveCart = () => LS.set('cafehai.cart', state.cart);

const LOGO = (color = '#7a2e1f') => `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <rect x="2.5" y="2.5" width="35" height="35" fill="none" stroke="${color}" stroke-width="3"/>
  <path d="M12 8v24M28 8v24M12 20h16" stroke="${color}" stroke-width="6" fill="none"/>
</svg>`;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

// ===== Ly nước (bản xem trước, dùng cho danh sách & kết quả) =====
function mixColor(fruits) {
  if (!fruits || !fruits.length) return '#f39a12';
  const rgb = fruits.map(f => FRUIT[f].color.match(/\w\w/g).map(h => parseInt(h, 16)));
  const avg = [0, 1, 2].map(i => Math.round(rgb.reduce((a, c) => a + c[i], 0) / rgb.length));
  return `rgb(${avg.join(',')})`;
}

function cupHTML(drink, values) {
  const scoopK = drink.steps.findIndex(s => s.type === 'scoop');
  const fruitK = drink.steps.findIndex(s => s.type === 'fruit');
  const coffee = COFFEE_COLORS[scoopK >= 0 ? Math.min(4, values[scoopK]) : 2];
  const juice = mixColor(fruitK >= 0 ? values[fruitK] : []);
  let y = 0, layers = '', extras = '';
  drink.steps.forEach((s, i) => {
    let h = 0, color, alpha = 1;
    if (s.type === 'pour') { h = values[i] / 100 * s.s * 100; color = ING[s.ing].color; alpha = ING[s.ing].alpha || 1; }
    else if (s.type === 'phin') { h = values[i] / 100 * s.s * 100; color = coffee; }
    else if (s.type === 'press') { h = values[i] / 100 * s.s * 100; color = juice; }
    if (h > 0) {
      const hh = Math.min(h, 97 - y);
      if (hh > 0) layers += `<div class="layer" style="bottom:${y}%;height:${hh}%;background:${color};opacity:${alpha}"></div>`;
      y += Math.max(0, hh);
    }
  });
  const top = y;
  drink.steps.forEach((s, i) => {
    if (s.type === 'ice') {
      const L = [14, 52, 32, 62, 22, 44];
      for (let k = 0; k < Math.min(6, values[i]); k++)
        extras += `<div class="ice" style="left:${L[k]}%;bottom:${Math.max(3, top - 15 - (k % 3) * 9)}%;transform:rotate(${(k * 23) % 30 - 15}deg)"></div>`;
    }
    if (s.type === 'tap') {
      const L = [20, 56, 38, 66, 28, 48];
      for (let k = 0; k < Math.min(6, values[i]); k++)
        extras += `<div class="topping" style="left:${L[k]}%;bottom:${Math.max(3, top - 8 - (k % 2) * 7)}%">${TOP[s.top].icon}</div>`;
    }
  });
  return `
  <div class="cup-wrap">
    ${drink.hot ? '<div class="steam">♨️</div>' : ''}
    <div class="cup">${layers}${extras}<div class="shine"></div><div class="brand">${LOGO('rgba(122,46,31,.85)')}</div></div>
    <svg class="cup-outline" viewBox="0 0 150 200" preserveAspectRatio="none">
      <polygon points="1.5,1.5 148.5,1.5 128.5,198.5 21.5,198.5" fill="none" stroke="rgba(74,32,22,.35)" stroke-width="3"/>
      <line x1="0" y1="2" x2="150" y2="2" stroke="rgba(74,32,22,.5)" stroke-width="4"/>
    </svg>
  </div>`;
}

function bottleHTML(d) {
  return `<div class="bottle"><div class="neck"></div><div class="body" style="background:${d.bottle}"><span>H</span></div></div>`;
}

const hasFreeFruit = d => d.steps.some(s => s.type === 'fruit' && s.free);

// ===== Điều hướng =====
function go(view, extra = {}) {
  if (state.view === 'game' && view !== 'game') Brew.unmount();
  if (state.view === 'cut' && view !== 'cut') FruitCut.unmount();
  Object.assign(state, extra, { view });
  render();
  window.scrollTo(0, 0);
}

function render() {
  const v = state.view;
  document.body.classList.toggle('in-scene', v === 'scene');
  $app.innerHTML =
    v === 'scene' ? Scene.html() :
    v === 'list' ? listView() :
    v === 'game' ? Brew.html() :
    v === 'cut' ? FruitCut.html() :
    v === 'custom' ? customView() :
    v === 'cart' ? cartView() :
    v === 'track' ? trackView() :
    v === 'orders' ? ordersView() :
    v === 'rank' ? Board.html(state.lbPeriod) : '';
  if (v === 'game') Brew.mount();
  if (v === 'cut') FruitCut.mount();
  if (v === 'scene') Scene.after();
}

const cartCount = () => state.cart.reduce((a, c) => a + c.qty, 0);
const cartPrice = () => Promo.price(state.cart);
const cartTotal = () => cartPrice().total;

function topbar(title, sub, back = 'scene') {
  return `
  <div class="topbar">
    <button class="icon-btn" data-act="back" data-to="${back}" aria-label="Quay lại">←</button>
    <div class="title">${title}${sub ? `<div class="sub">${sub}</div>` : ''}</div>
    ${cartIcon()}
  </div>`;
}
const cartIcon = () => `<button class="icon-btn" data-act="go" data-to="cart" aria-label="Giỏ hàng">🛒${cartCount() ? `<span class="badge">${cartCount()}</span>` : ''}</button>`;

function host(text, sm = false) {
  return `<div class="host"><div class="avatar ${sm ? 'sm' : ''}"></div><div class="bubble"><b class="name">Anh Hải · Chủ quán</b>${text}</div></div>`;
}

// ===== Menu dạng danh sách (đặt nhanh) =====
function listView() {
  const items = MENU.filter(d => d.cat === state.cat);
  const cat = CATS.find(c => c.id === state.cat);
  return `
  <div class="topbar">
    <button class="icon-btn" data-act="back" data-to="scene" aria-label="Vào quán">🏠</button>
    <div class="logo">${LOGO()}<div><b>CAFE HẢI</b><small>Cà phê đậm vị – Ngon đúng gu!</small></div></div>
    <button class="icon-btn" data-act="go" data-to="orders" aria-label="Đơn của tôi">📋</button>
    ${cartIcon()}
  </div>
  <div class="hero"><div class="txt"><b>🎮 Tự pha – Tự gọi</b><span>Bấm "Pha" để vào quầy pha chế, ly bạn pha chính là đơn bạn đặt</span></div></div>
  <div class="tabs">${CATS.map(c => `<button class="tab ${c.id === state.cat ? 'on' : ''}" data-act="cat" data-id="${c.id}">${c.name}</button>`).join('')}</div>
  <div class="section-title">${cat.name}</div>
  <div class="grid">${items.map(cardHTML).join('')}</div>
  <div class="promo" data-act="promoCut" style="cursor:pointer"><div class="img"></div><div class="txt"><b>🍉 Hoa quả cắt mới có rồi!</b>Tự tay cắt hộp quả trong game, quán gọt mới và tỉa đúng kiểu bạn chọn.</div></div>
  <div class="footer-note">Cảm ơn bạn đã ủng hộ Cafe Hải ♥ · Bản demo</div>
  ${cartBar()}`;
}

function cardHTML(d) {
  const visual = d.simpleOpts || (d.custom && !d.steps.length) ? '<div class="newdish">🥤</div>' : d.bottle ? bottleHTML(d) : d.box ? `<div class="minibox">${['duahau', 'nho', 'xoai', 'dualuoi', 'mangcut', 'kiwi'].slice(0, d.box.kinds).map(k => `<i>${FruitCut.icon(k, 20)}</i>`).join('')}</div>` : cupHTML(d, previewValues(d));
  const best = LS.get('cafehai.best2', {})[d.id];
  let actions;
  if (d.soldOut) actions = `<button class="btn sm out-btn" disabled>${d.outReason}</button>`;
  else if (d.box) actions = `<button class="btn primary sm" data-act="play" data-id="${d.id}">🔪 Cắt</button><button class="btn light sm" data-act="quick" data-id="${d.id}">Đặt nhanh</button>`;
  else if (!d.steps.length) actions = `<button class="btn green sm" data-act="quick" data-id="${d.id}">${d.simpleOpts ? 'Đặt' : '+ Thêm'}</button>`;
  else if (hasFreeFruit(d)) actions = `<button class="btn primary sm" data-act="play" data-id="${d.id}">🎮 Tự mix</button>`;
  else actions = `<button class="btn primary sm" data-act="play" data-id="${d.id}">🎮 Pha</button><button class="btn light sm" data-act="quick" data-id="${d.id}">Đặt nhanh</button>`;
  return `
  <div class="card ${d.soldOut ? 'soldout' : ''}">
    ${Promo.unitPrice(d).price < d.price && !d.soldOut ? `<span class="tag sale">−${d.price - Promo.unitPrice(d).price}K</span>` : d.isNew ? '<span class="tag new">MỚI</span>' : d.star ? '<span class="tag">Sáng tạo</span>' : best ? `<span class="tag">🏆 ${best.toLocaleString('vi-VN')}</span>` : ''}
    <div class="mini">${visual}</div>
    <div class="name">${d.name}</div>
    <div class="price">${Scene.priceTag(d)}</div>
    <div class="actions">${actions}</div>
  </div>`;
}

function cartBar() {
  if (!state.cart.length) return '';
  return `
  <div class="cartbar">
    <div class="info">${cartCount()} món<b>${fmt(cartTotal())}</b></div>
    <button class="btn" data-act="go" data-to="cart">Xem giỏ ➜</button>
  </div>`;
}

// ===== Vào quầy pha chế =====
function startGame(id) {
  Sfx.unlock();
  if (!D(id) || D(id).soldOut) { toast(`${D(id) ? D(id).name + ': ' + D(id).outReason : 'Món này không còn bán'}`); return; }
  if (D(id).box) {
    FruitCut.start(id, res => {
      state.custom = { ...res, played: true, qty: 1, note: '' };
      go('custom');
      if (res.stars === 3) { confetti(); Sfx.fanfare(); } else Sfx.ding();
    });
    go('cut');
    return;
  }
  Brew.start(id, res => {
    state.custom = { ...res, played: true, qty: 1, note: '' };
    go('custom');
    if (res.stars === 3) { confetti(); Sfx.fanfare(); }
    else Sfx.ding();
  });
  go('game');
}

// ===== Màn kết quả / tùy chỉnh =====
function openQuick(id) {
  const d = D(id);
  if (!d || d.soldOut) { toast(d ? `${d.name}: ${d.outReason}` : 'Món này không còn bán'); return; }
  if (!d.steps.length && !d.box && !d.simpleOpts) { addToCart({ id, opts: [], played: false, qty: 1, note: '' }); afterAdd(d); return; }
  go('custom', { custom: { id, opts: defaultOptions(d), played: false, stars: null, values: previewValues(d), qty: 1, note: '' } });
}

function customView() {
  const c = state.custom, d = D(c.id);
  const comment = c.played ? (c.stars ? pick(TALK.final[c.stars]) : pick(TALK.final.free)) : '';
  if (c.played && !c.comment) c.comment = comment;
  const head = c.played
    ? `<div class="result-head">
        <div class="pop">${c.image ? `<img class="box-shot" src="${c.image}" alt="Hộp quả của bạn">` : cupHTML(d, c.values)}</div>
        ${c.stars ? `<div class="stars">${[1, 2, 3].map(k => `<span class="${k <= c.stars ? 'on' : ''}">★</span>`).join('')}</div>
        <div class="score-box">
          <div><span>${c.labels?.base || 'Độ chuẩn công thức'}</span><b>${c.points.toLocaleString('vi-VN')}</b></div>
          <div><span>${c.labels?.perfect || 'Thưởng bước hoàn hảo'}</span><b>+${c.perfectBonus.toLocaleString('vi-VN')}</b></div>
          <div><span>Thưởng tốc độ (${c.elapsed}s)</span><b>+${c.bonus.toLocaleString('vi-VN')}</b></div>
          ${c.floorBonus ? `<div><span>Nâng lên điểm sàn (${Math.round(POINT_CFG.floor * 100)}%)</span><b>+${c.floorBonus.toLocaleString('vi-VN')}</b></div>` : ''}
          <div class="tot"><span>Điểm ${d.box ? 'hộp' : 'ly'} này</span><b>${c.total.toLocaleString('vi-VN')}<small> / ${c.max.toLocaleString('vi-VN')}</small></b></div>
          <div class="lb-note">🏆 ${d.box ? 'Hộp' : 'Ly'} ${D(c.id).price}K tối đa ${c.max.toLocaleString('vi-VN')} điểm · mua ${c.qty} ${d.box ? 'hộp' : 'ly'} = ${(c.total * c.qty).toLocaleString('vi-VN')} điểm, cộng khi quán hoàn tất đơn</div>
          ${c.newBest ? `<div class="best">🏆 ${TALK.newBest}</div>` : `<div class="best dim">Kỷ lục món này: ${c.best.toLocaleString('vi-VN')}</div>`}
        </div>` : '<div class="pill" style="display:inline-block;margin-top:8px">🎨 Ly sáng tạo</div>'}
      </div>
      ${host(c.comment, true)}`
    : `<div class="result-head">${d.simpleOpts || (d.custom && !d.steps.length) ? '<div class="newdish big">🥤</div>' : d.box ? '<img class="box-photo" src="assets/hop-qua-2.webp" alt="Hộp quả Cafe Hải">' : cupHTML(d, c.values)}</div>`;
  return `
  ${topbar(c.played ? 'Ly của bạn' : d.name, `${d.name} · ${d.price}K`)}
  ${head}
  <div class="panel">
    <h3>${c.played ? '☕ Quán sẽ pha theo ly bạn vừa làm' : 'Tùy chọn'}</h3>
    ${c.opts.map((o, k) => `
      <div class="opt">
        <label>${o.label}${c.played && !o.fixed ? '<span class="from-game">từ ly bạn pha</span>' : ''}</label>
        ${o.fixed ? `<span class="fixed">${o.value}</span>` :
        `<select data-opt="${k}">${o.choices.map(ch => `<option ${ch === o.value ? 'selected' : ''}>${ch}</option>`).join('')}</select>`}
      </div>`).join('')}
    <div class="opt"><label>Số lượng</label>
      <span class="qty"><button data-act="cqty" data-d="-1">−</button><b>${c.qty}</b><button data-act="cqty" data-d="1">+</button></span>
    </div>
    <div class="field" style="margin:10px 0 0"><input id="cNote" placeholder="Ghi chú cho quán (không bắt buộc)" value="${esc(c.note)}"></div>
  </div>
  ${!c.played || !c.stars ? `<div class="quick-pts">🏆 Đặt ${c.played ? 'ly sáng tạo' : 'không chơi game'}: <b>+${(quickPoints(d) * c.qty).toLocaleString('vi-VN')} điểm</b> (${Math.round(POINT_CFG.quick * 100)}%)${d.steps.length || d.box ? `<br><span>${d.box ? 'Tự tay cắt' : 'Tự tay pha'} ở chế độ Thử thách để có tới <b>${(maxPoints(d) * c.qty).toLocaleString('vi-VN')} điểm</b>!</span>` : ''}</div>` : ''}
  <div style="padding:0 16px;display:flex;flex-direction:column;gap:10px">
    <button class="btn primary block" data-act="add">Thêm vào giỏ · ${Promo.unitPrice(d).price < d.price ? `<s style="opacity:.6;font-weight:600">${fmt(d.price * c.qty)}</s> ` : ''}${fmt(Promo.unitPrice(d).price * c.qty)}</button>
    ${c.played ? `<button class="btn ghost block" data-act="play" data-id="${d.id}">${d.box ? '↺ Cắt lại hộp khác' : '↺ Pha lại ly khác'}</button>` : (d.box ? `<button class="btn ghost block" data-act="play" data-id="${d.id}">🔪 Hay tự tay cắt?</button>` : d.steps.length ? `<button class="btn ghost block" data-act="play" data-id="${d.id}">🎮 Hay tự tay pha?</button>` : '')}
  </div>`;
}

function addToCart(c) {
  const d = D(c.id);
  state.cart.push({
    uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    id: d.id, name: d.name, price: d.price, qty: c.qty,
    opts: c.opts.map(o => ({ label: o.label, value: o.value })),
    played: c.played, stars: c.stars ?? null, note: c.note || '',
    points: c.played && c.stars ? c.total : quickPoints(d),
  });
  saveCart();
  Sfx.ding();
}

// Đặt lại các món cũ (không chơi lại → điểm như đặt nhanh)
function reorderItems(items) {
  const gone = items.filter(it => !D(it.id) || D(it.id).soldOut);
  if (gone.length) toast(`Hôm nay hết: ${gone.map(it => it.name).join(', ')}`);
  items = items.filter(it => !gone.includes(it));
  items.forEach(it => state.cart.push({
    ...it, uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    played: false, stars: null, points: D(it.id) ? quickPoints(D(it.id)) : 0,
  }));
  saveCart();
  Sfx.ding();
}

// Lấy deal combo: cho đủ các món vào giỏ (mức vừa), giá combo tự áp ở giỏ hàng
function addDeal(id) {
  const p = Promo.load().find(x => x.id === id);
  if (!p || !Promo.live(p)) { toast('Deal này chưa tới giờ hoặc đã kết thúc'); return; }
  const out = p.items.filter(x => !D(x.id) || D(x.id).soldOut);
  if (out.length) { toast(`Tạm hết: ${out.map(x => D(x.id)?.name || 'món').join(', ')}`); return; }
  p.items.forEach(x => {
    const d = D(x.id);
    state.cart.push({
      uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      id: d.id, name: d.name, price: d.price, qty: x.qty,
      opts: defaultOptions(d).map(o => ({ label: o.label, value: o.value })),
      played: false, stars: null, note: '', points: quickPoints(d),
    });
  });
  saveCart();
  Sfx.ding();
  state.scene.info = false;
  Scene.talk([`Chốt deal ${p.title}! Mình cho vào giỏ rồi, giá combo ${p.price}K tự trừ khi thanh toán. Muốn tự tay pha để có điểm thì gọi thêm nhé!`], Scene.mainChoices());
  go('scene');
}

function afterAdd(d) {
  state.scene.phase = 'inside';
  state.scene.board = false;
  Scene.talk([TALK.afterAdd(d.name)], Scene.mainChoices());
  go('scene');
}

// ===== Giỏ hàng & đặt hàng =====
function cartView() {
  if (!state.cart.length) return `${topbar('Giỏ hàng')}<div class="empty"><div>🛒</div>Giỏ hàng trống.<br><br><button class="btn primary" data-act="go" data-to="scene">Vào quán chọn món</button></div>`;
  const cu = state.customer, er = state.errors, ship = state.ship === 'ship';
  const pr = cartPrice();
  return `
  ${topbar('Giỏ hàng', `${cartCount()} món`)}
  <div class="panel">
    ${state.cart.map(it => `
      <div class="cart-item">
        <div class="ci-main">
          <div class="ci-name">${it.name}${!D(it.id) || D(it.id).soldOut ? ' <span class="pill huy">Vừa hết</span>' : ''}</div>
          ${it.opts.length ? `<div class="ci-opts">${it.opts.map(o => `${o.label}: ${o.value}`).join(' · ')}</div>` : ''}
          ${it.note ? `<div class="ci-opts">📝 ${esc(it.note)}</div>` : ''}
          ${it.played ? `<div class="ci-game">🎮 Tự tay pha${it.stars ? ' · ' + '★'.repeat(it.stars) : ' · sáng tạo'}${it.points ? ` · 🏆 ${(it.points * it.qty).toLocaleString('vi-VN')} điểm` : ''}</div>` : it.points ? `<div class="ci-game quick">🏆 ${(it.points * it.qty).toLocaleString('vi-VN')} điểm (đặt nhanh, ${Math.round(POINT_CFG.quick * 100)}%)</div>` : ''}
        </div>
        <div>
          <div class="ci-price">${(() => { const l = pr.lines[it.uid]; return l && l.total < l.base * it.qty ? `<s class="was">${fmt(l.base * it.qty)}</s> ${fmt(l.total)}` : fmt((l ? l.base : it.price) * it.qty); })()}</div>
          ${pr.lines[it.uid]?.promo ? `<div class="ci-sale">🏷️ ${esc(pr.lines[it.uid].promo)}</div>` : ''}${pr.lines[it.uid]?.inCombo ? `<div class="ci-sale">🔥 ${pr.lines[it.uid].inCombo} trong combo</div>` : ''}
          <span class="qty" style="margin-top:6px"><button data-act="qty" data-uid="${it.uid}" data-d="-1">−</button><b>${it.qty}</b><button data-act="qty" data-uid="${it.uid}" data-d="1">+</button></span>
        </div>
      </div>`).join('')}
    <button class="btn light" style="margin-top:10px;width:100%" data-act="go" data-to="scene">+ Gọi thêm món</button>
  </div>
  <div class="panel">
    <h3>Nhận hàng</h3>
    <div class="seg">
      <button data-act="ship" data-v="ship" class="${ship ? 'on' : ''}">🛵 Giao tận nơi</button>
      <button data-act="ship" data-v="pickup" class="${!ship ? 'on' : ''}">🏪 Đến quán lấy</button>
    </div>
    <label class="field"><span>Tên của bạn</span><input data-cu="name" value="${esc(cu.name)}" placeholder="VD: Minh Anh">${er.name ? `<span class="err">${er.name}</span>` : ''}</label>
    <label class="field"><span>Số điện thoại</span><input data-cu="phone" inputmode="tel" value="${esc(cu.phone)}" placeholder="09xx xxx xxx">${er.phone ? `<span class="err">${er.phone}</span>` : ''}</label>
    ${ship ? `<label class="field"><span>Địa chỉ giao hàng</span><textarea data-cu="address" rows="2" placeholder="Số nhà, ngõ, đường, phường...">${esc(cu.address)}</textarea>${er.address ? `<span class="err">${er.address}</span>` : ''}</label>` : ''}
    <label class="field"><span>Biệt danh trên bảng vàng <i style="font-weight:400">(không bắt buộc)</i></span><input data-cu="nick" maxlength="20" value="${esc(cu.nick)}" placeholder="Mặc định dùng tên của bạn"></label>
    <label class="check"><input type="checkbox" data-cu="hide" ${cu.hide ? 'checked' : ''}> Ẩn tên tôi trên bảng xếp hạng (hiện là "Khách bí ẩn")</label>
    <label class="field"><span>Ghi chú đơn hàng</span><input id="oNote" value="${esc(state.note)}" placeholder="VD: gọi trước khi giao"></label>
  </div>
  <div class="panel">
    <div class="sum-row"><span>Tạm tính</span><span>${fmt(pr.subtotal)}</span></div>
    ${pr.combos.map(c => `<div class="sum-row sale"><span>🔥 ${esc(c.title)}${c.times > 1 ? ` ×${c.times}` : ''}</span><span>−${fmt(c.saving)}</span></div>`).join('')}
    ${pr.itemDiscount ? `<div class="sum-row sale"><span>🏷️ Giảm giá món</span><span>−${fmt(pr.itemDiscount)}</span></div>` : ''}
    <div class="sum-row"><span>Phí giao hàng</span><span>${ship ? 'Quán báo khi gọi xác nhận' : '0đ'}</span></div>
    <div class="sum-row total"><span>Tổng${ship ? ' (chưa gồm ship)' : ''}</span><span>${fmt(pr.total)}</span></div>
    ${pr.discount ? `<div class="sum-row sale" style="justify-content:center;font-weight:700">🎉 Bạn tiết kiệm ${fmt(pr.discount)}</div>` : ''}
    ${state.cart.some(it => D(it.id)?.box) ? '<div class="sum-row" style="font-size:13px;color:var(--maroon)">⏱ Hoa quả gọt mới khi đặt, cần 30–60 phút chuẩn bị</div>' : ''}
    <div class="sum-row" style="font-size:13px">💵 ${ship ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán tại quầy khi lấy'}</div>
  </div>
  <div style="padding:0 16px"><button class="btn primary block" data-act="order">Đặt hàng · ${fmt(cartTotal())}</button></div>`;
}

function placeOrder() {
  const cu = state.customer, ship = state.ship === 'ship', er = {};
  const gone = state.cart.filter(it => !D(it.id) || D(it.id).soldOut);
  if (gone.length) { toast(`Vừa hết: ${gone.map(it => it.name).join(', ')}. Bạn bỏ khỏi giỏ giúp mình nhé!`); render(); return; }
  if (!cu.name.trim()) er.name = 'Vui lòng nhập tên';
  if (!/^0\d{9}$/.test(cu.phone.replace(/\s/g, ''))) er.phone = 'Số điện thoại gồm 10 số, bắt đầu bằng 0';
  if (ship && cu.address.trim().length < 6) er.address = 'Vui lòng nhập địa chỉ cụ thể';
  state.errors = er;
  if (Object.keys(er).length) { render(); toast('Vui lòng kiểm tra lại thông tin'); return; }
  LS.set('cafehai.customer', cu);
  const priced = cartPrice();
  const o = Store.create({
    customer: { name: cu.name.trim(), phone: cu.phone.replace(/\s/g, ''), nick: (cu.nick || '').trim(), hide: !!cu.hide },
    type: state.ship,
    address: ship ? cu.address.trim() : '',
    note: state.note.trim(),
    items: state.cart.map(it => ({ ...it, price: priced.lines[it.uid]?.base ?? it.price, lineTotal: priced.lines[it.uid]?.total ?? it.price * it.qty, sale: priced.lines[it.uid]?.promo || null })),
    subtotal: priced.subtotal,
    discount: priced.discount,
    promos: priced.combos.map(c => `${c.title}${c.times > 1 ? ' ×' + c.times : ''}`).concat(priced.itemDiscount ? ['Giảm giá món'] : []),
    total: priced.total,
  });
  state.myOrders.unshift(o.id);
  LS.set('cafehai.my', state.myOrders);
  LS.set('cafehai.last', state.cart.map(({ uid, ...it }) => it));
  state.cart = []; saveCart(); state.note = '';
  lastStatus[o.id] = o.status;
  Sfx.fanfare();
  go('track', { trackId: o.id });
  toast(`Đã gửi đơn ${o.code} tới quán!`);
}

// ===== Theo dõi đơn =====
function trackView() {
  const o = Store.get(state.trackId);
  if (!o) return `${topbar('Đơn hàng', '', 'orders')}<div class="empty"><div>🤔</div>Không tìm thấy đơn (có thể dữ liệu demo đã bị xóa).</div>`;
  const flow = o.type === 'ship' ? ['moi', 'pha', 'giao', 'xong'] : ['moi', 'pha', 'san', 'xong'];
  const cur = flow.indexOf(o.status);
  const timeOf = st => { const h = o.history.find(x => x.status === st); return h ? new Date(h.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''; };
  const hostMsg = {
    moi: 'Quán nhận được đơn rồi, chờ mình xác nhận chút nhé!',
    pha: 'Mình đang pha đúng y công thức bạn làm đây ☕',
    giao: 'Shipper đang trên đường tới, nhớ để ý điện thoại nhé!',
    san: 'Đồ uống xong rồi, bạn qua quán lấy nha!',
    xong: 'Cảm ơn bạn đã ủng hộ Cafe Hải! Lần sau lại vào pha tiếp nhé ♥',
    huy: 'Rất tiếc đơn đã bị hủy. Bạn liên hệ quán nếu cần hỗ trợ nhé.',
  }[o.status];
  return `
  ${topbar('Theo dõi đơn', o.type === 'ship' ? 'Giao tận nơi · COD' : 'Đến quán lấy', 'orders')}
  <div class="track-code">Mã đơn<br><b>${o.code}</b></div>
  ${host(hostMsg, true)}
  <div class="panel">
    ${o.status === 'huy' ? `<div class="pill huy">Đơn đã bị hủy</div>` : `
    <ul class="timeline">
      ${flow.map((st, k) => `<li class="${k < cur ? 'done' : k === cur ? 'now' : ''}"><div>${STATUS[st].label}<small>${timeOf(st)}</small></div></li>`).join('')}
    </ul>`}
  </div>
  <div class="panel">
    <h3>Chi tiết</h3>
    ${o.items.map(it => `<div class="cart-item"><div class="ci-main"><div class="ci-name">${it.qty} × ${it.name}</div>${it.opts.length ? `<div class="ci-opts">${it.opts.map(x => `${x.label}: ${x.value}`).join(' · ')}</div>` : ''}</div><div class="ci-price">${fmt(it.price * it.qty)}</div></div>`).join('')}
    ${o.discount ? `<div class="sum-row sale"><span>🎁 ${esc((o.promos || []).join(', ') || 'Khuyến mãi')}</span><span>−${fmt(o.discount)}</span></div>` : ''}
    <div class="sum-row total"><span>Tổng${o.type === 'ship' ? ' (chưa gồm ship)' : ''}</span><span>${fmt(o.total)}</span></div>
  </div>
  <div style="padding:0 16px"><button class="btn ghost block" data-act="go" data-to="scene">Về quán</button></div>`;
}

function ordersView() {
  const mine = Store.all().filter(o => state.myOrders.includes(o.id));
  return `
  ${topbar('Đơn của tôi')}
  ${mine.length ? `<div class="panel">${mine.map(o => `
    <div class="order-row" data-act="track" data-id="${o.id}" style="cursor:pointer">
      <div><b style="color:var(--maroon)">${o.code}</b> · ${o.items.reduce((a, c) => a + c.qty, 0)} món<br><small style="color:var(--muted)">${new Date(o.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })} · ${fmt(o.total)}</small></div>
      <span style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><span class="pill ${o.status}">${STATUS[o.status].short}</span><button class="btn light sm" data-act="reorder" data-id="${o.id}">🔁 Đặt lại</button></span>
    </div>`).join('')}</div>`
    : `<div class="empty"><div>📋</div>Bạn chưa có đơn nào.</div>`}`;
}

// ===== Sự kiện =====
$app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  switch (act) {
    case 'go': state.errors = {}; go(el.dataset.to); break;
    case 'back': go(el.dataset.to); break;
    case 'cat': state.cat = el.dataset.id; render(); break;
    case 'play': startGame(el.dataset.id); break;
    case 'quick': openQuick(el.dataset.id); break;
    case 'track': go('track', { trackId: el.dataset.id }); break;
    case 'promoCut': state.cat = 'qua'; render(); break;
    case 'mute': {
      const m = Sfx.toggle();
      el.textContent = m ? '🔇' : '🔊';
      toast(m ? 'Đã tắt âm thanh' : 'Đã bật âm thanh');
      break;
    }
    // --- cảnh quán ---
    case 'enter': Scene.enter(); break;
    case 'dlg': Scene.tapDialog(); break;
    case 'choice': Scene.choose(+el.dataset.i); break;
    case 'dlgSkip': Scene.skip(); break;
    case 'reorder': {
      const o = Store.get(el.dataset.id);
      if (o) { reorderItems(o.items); toast('Đã cho các món vào giỏ'); go('cart'); }
      break;
    }
    case 'board': Scene.openBoard(); break;
    case 'closeBoard': Scene.closeBoard(); break;
    case 'info': Scene.openInfo(); break;
    case 'closeInfo': Scene.closeInfo(); break;
    case 'infoBg': if (e.target === el) Scene.closeInfo(); break;
    case 'deal': addDeal(el.dataset.id); break;
    case 'boardBg': if (e.target === el) Scene.closeBoard(); break;
    case 'pick': Sfx.tap(); Scene.pickDrink(el.dataset.id); break;
    // --- kết quả ---
    case 'cqty': state.custom.qty = Math.max(1, Math.min(20, state.custom.qty + +el.dataset.d)); render(); break;
    case 'add': {
      const c = state.custom;
      c.note = document.getElementById('cNote')?.value || '';
      addToCart(c);
      afterAdd(D(c.id));
      break;
    }
    // --- giỏ ---
    case 'qty': {
      const it = state.cart.find(x => x.uid === el.dataset.uid);
      it.qty += +el.dataset.d;
      if (it.qty <= 0) state.cart = state.cart.filter(x => x !== it);
      saveCart(); render();
      break;
    }
    case 'ship': state.ship = el.dataset.v; state.errors = {}; render(); break;
    case 'order': placeOrder(); break;
    // --- bảng xếp hạng ---
    case 'lbPeriod': state.lbPeriod = el.dataset.id; Sfx.tap(); render(); break;
    case 'lbSeed': Board.addSeeds(); render(); toast('Đã thêm khách mẫu'); break;
    case 'lbClear': Board.clearSeeds(); render(); toast('Đã xóa khách mẫu'); break;
  }
});

$app.addEventListener('change', e => {
  if (e.target.dataset.cu === 'hide') state.customer.hide = e.target.checked;
  const k = e.target.dataset.opt;
  if (k !== undefined) state.custom.opts[k].value = e.target.value;
});
$app.addEventListener('input', e => {
  const k = e.target.dataset.cu;
  if (k) state.customer[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (e.target.id === 'oNote') state.note = e.target.value;
  if (e.target.id === 'cNote' && state.custom) state.custom.note = e.target.value;
});

// Cập nhật khi quầy đổi trạng thái đơn
const lastStatus = {};
Store.all().forEach(o => { lastStatus[o.id] = o.status; });
Store.subscribe(list => {
  list.filter(o => state.myOrders.includes(o.id)).forEach(o => {
    if (lastStatus[o.id] && lastStatus[o.id] !== o.status && !(state.view === 'track' && state.trackId === o.id))
      toast(`Đơn ${o.code}: ${STATUS[o.status].label}`);
    lastStatus[o.id] = o.status;
  });
  if (['track', 'orders', 'rank'].includes(state.view)) render();
});

render();

// Quầy cập nhật menu → app khách cập nhật ngay
MenuAdmin.onChange(fromOtherTab => {
  if (!fromOtherTab) return;
  if (state.view === 'game' || state.view === 'cut') return; // không làm gián đoạn khi đang chơi
  if (state.view === 'scene' && state.dlg) state.dlg.done = true;
  render();
  toast('🍽️ Quán vừa cập nhật menu');
});

// Quầy đổi khuyến mãi → app khách cập nhật
Promo.onChange(fromOtherTab => {
  if (!fromOtherTab || state.view === 'game' || state.view === 'cut') return;
  if (state.view === 'scene' && state.dlg) state.dlg.done = true;
  render();
  toast('🎁 Quán vừa cập nhật khuyến mãi');
});
