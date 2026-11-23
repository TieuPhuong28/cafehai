// ===== Tài khoản khách: đăng nhập SĐT + mật khẩu, điểm, đổi quà =====
// Chỉ hoạt động ở chế độ online (có Firebase). Khách không bắt buộc đăng nhập để đặt hàng.
const Account = (() => {
  let mode = 'login', error = '', busy = false, watching = false;
  const online = () => Cloud.enabled;
  const num = n => Math.round(n || 0).toLocaleString('vi-VN');

  // ----- điểm -----
  const myOpenOrders = () => Store.all().filter(o => Cloud.uid && o.uid === Cloud.uid && !['xong', 'huy'].includes(o.status));
  const pendingRedeem = () => myOpenOrders().reduce((a, o) => a + (o.redeem || 0), 0);
  const pendingEarn = () => myOpenOrders().reduce((a, o) => a + o.items.reduce((s, it) => s + (it.points || 0) * it.qty, 0), 0);
  const cartRedeem = () => state.cart.filter(it => it.reward).reduce((a, it) => a + it.cost * it.qty, 0);
  const cartEarn = () => state.cart.filter(it => !it.reward).reduce((a, it) => a + (it.points || 0) * it.qty, 0);
  const balance = () => ((Cloud.profile && Cloud.profile.points) || 0) - pendingRedeem() - cartRedeem();

  // ----- giao diện -----
  function view() {
    const top = topbar('Tài khoản', online() && Cloud.uid ? 'Điểm & đổi quà' : '');
    const ordersBtn = '<button class="btn ghost block" data-act="go" data-to="orders">📋 Đơn của tôi</button>';
    if (!online()) {
      return `${top}
      <div class="panel"><h3>👤 Tài khoản thành viên</h3>
        <p class="muted-p">Đăng nhập, tích điểm và đổi quà sẽ hoạt động khi quán bật bản online. Bản demo hiện tại vẫn đặt hàng bình thường.</p>
      </div>
      <div style="padding:0 16px">${ordersBtn}</div>`;
    }
    if (!Cloud.ready) return `${top}<div class="empty"><div>⏳</div>Đang tải…</div>`;
    if (Cloud.user && !Cloud.uid) {
      return `${top}<div class="panel"><h3>Đang đăng nhập tài khoản quầy</h3><p class="muted-p">${esc(Cloud.user.email)}</p>
        <button class="btn ghost block" data-act="acc" data-a="logout">Đăng xuất</button></div>`;
    }
    if (!Cloud.uid) return top + authHTML() + `<div style="padding:0 16px">${ordersBtn}</div>`;
    return top + profileHTML() + `<div style="padding:0 16px 24px;display:flex;flex-direction:column;gap:10px">${ordersBtn}<button class="btn ghost block" data-act="acc" data-a="logout">Đăng xuất</button></div>`;
  }

  function authHTML() {
    const reg = mode === 'register';
    return `
    <div class="acc-hero">
      <div class="avatar"></div>
      <div><b>Thành viên Cafe Hải</b><span>Tích điểm mỗi đơn · đổi đồ uống miễn phí · lên bảng vàng</span></div>
    </div>
    <div class="panel">
      <div class="seg">
        <button data-act="acc" data-a="mode" data-m="login" class="${!reg ? 'on' : ''}">Đăng nhập</button>
        <button data-act="acc" data-a="mode" data-m="register" class="${reg ? 'on' : ''}">Tạo tài khoản</button>
      </div>
      <form id="accForm" data-mode="${mode}" autocomplete="on">
        ${reg ? `<label class="field"><span>Tên của bạn</span><input name="name" required maxlength="40" autocomplete="name" value="${esc(state.customer.name || '')}" placeholder="VD: Minh Anh"></label>` : ''}
        <label class="field"><span>Số điện thoại</span><input name="phone" required inputmode="tel" autocomplete="tel" value="${esc(state.customer.phone || '')}" placeholder="09xx xxx xxx"></label>
        <label class="field"><span>Mật khẩu</span><input name="password" type="password" required minlength="6" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? 'Ít nhất 6 ký tự' : ''}"></label>
        ${reg ? `
          <label class="field"><span>Biệt danh trên bảng vàng <i style="font-weight:400">(không bắt buộc)</i></span><input name="nick" maxlength="20" placeholder="Mặc định dùng tên của bạn"></label>
          <label class="check"><input type="checkbox" name="hide"> Ẩn tên tôi trên bảng xếp hạng</label>
          <p class="muted-p small-p">Quán dùng số điện thoại để giao hàng và tích điểm cho bạn, không chia sẻ cho bên khác.</p>` : `
          <p class="muted-p small-p">Quên mật khẩu? Nhắn quán để được hỗ trợ đặt lại.</p>`}
        ${error ? `<p class="err-p">⚠️ ${esc(error)}</p>` : ''}
        <button class="btn primary block" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Đang xử lý…' : reg ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
      </form>
    </div>`;
  }

  function profileHTML() {
    const p = Cloud.profile;
    if (!p) return '<div class="empty"><div>⏳</div>Đang tải thông tin…</div>';
    const bal = balance();
    return `
    <div class="acc-card">
      <div class="acc-ava">${esc(Array.from(p.name.trim().split(/\s+/).pop() || '?')[0].toUpperCase())}</div>
      <div class="acc-info"><b>${esc(p.name)}</b><span>${esc(p.phone)}${p.nick ? ` · “${esc(p.nick)}”` : ''}</span></div>
      <div class="acc-pts"><small>Điểm hiện có</small><b>${num(bal)}</b></div>
    </div>
    <div class="acc-sub">
      ${pendingEarn() ? `<span>⏳ +${num(pendingEarn())} điểm chờ cộng khi đơn hoàn tất</span>` : ''}
      ${pendingRedeem() ? `<span>🎁 ${num(pendingRedeem())} điểm đang giữ cho quà chờ giao</span>` : ''}
      ${cartRedeem() ? `<span>🛒 ${num(cartRedeem())} điểm cho quà trong giỏ</span>` : ''}
      <span>🏆 Tổng đã tích: ${num(p.earned)} điểm</span>
    </div>
    <div class="panel">
      <h3>🎁 Đổi điểm lấy quà</h3>
      ${MenuAdmin.rewards().map(r => {
        const d = D(r.itemId);
        if (!d) return '';
        const can = bal >= r.cost && !d.soldOut;
        const pct = Math.min(100, Math.round(bal / r.cost * 100));
        return `
        <div class="rw">
          <div class="rw-main"><b>${esc(d.name)}</b><small>${num(r.cost)} điểm${d.soldOut ? ' · tạm hết' : ''}</small>
            <div class="rw-bar"><i style="width:${Math.max(0, pct)}%"></i></div></div>
          <button class="btn ${can ? 'primary' : 'ghost'} sm" data-act="acc" data-a="redeem" data-id="${r.id}" ${can ? '' : 'disabled'}>${can ? 'Đổi' : `Còn ${num(Math.max(0, r.cost - bal))}`}</button>
        </div>`;
      }).join('')}
      <p class="muted-p small-p">Quà được thêm vào giỏ với giá 0đ, điểm chỉ bị trừ khi quán hoàn tất đơn.</p>
    </div>
    <div class="panel">
      <h3>Bảng vàng</h3>
      <form id="profForm">
        <label class="field"><span>Biệt danh</span><input name="nick" maxlength="20" value="${esc(p.nick || '')}" placeholder="Mặc định dùng tên của bạn"></label>
        <label class="check"><input type="checkbox" name="hide" ${p.hide ? 'checked' : ''}> Ẩn tên tôi trên bảng xếp hạng</label>
        <button class="btn light block" type="submit">Lưu</button>
      </form>
    </div>`;
  }

  // ----- thao tác -----
  async function submit(form) {
    if (form.id === 'profForm') {
      const f = new FormData(form);
      try { await Cloud.updateProfile({ nick: String(f.get('nick') || '').trim(), hide: !!f.get('hide') }); toast('Đã lưu'); }
      catch (e) { toast('⚠️ ' + Cloud.niceError(e)); }
      return;
    }
    const f = new FormData(form);
    const phone = String(f.get('phone') || '').replace(/\s/g, '');
    const password = String(f.get('password') || '');
    error = '';
    if (!/^0\d{9}$/.test(phone)) error = 'Số điện thoại gồm 10 số, bắt đầu bằng 0.';
    else if (password.length < 6) error = 'Mật khẩu cần ít nhất 6 ký tự.';
    else if (mode === 'register' && !String(f.get('name') || '').trim()) error = 'Vui lòng nhập tên.';
    if (error) { render(); return; }
    busy = true; render();
    try {
      if (mode === 'register') {
        await Cloud.register({ name: String(f.get('name')).trim(), phone, password, nick: String(f.get('nick') || '').trim(), hide: !!f.get('hide') });
        toast('🎉 Tạo tài khoản thành công!');
      } else {
        await Cloud.login(phone, password);
        toast('Đăng nhập thành công');
      }
      state.customer.phone = state.customer.phone || phone;
      busy = false;
      go(state.afterLogin || 'account');
      state.afterLogin = null;
    } catch (e) {
      busy = false; error = Cloud.niceError(e); render();
    }
  }

  function addReward(id) {
    const r = MenuAdmin.rewards().find(x => x.id === id), d = r && D(r.itemId);
    if (!r || !d) return;
    if (d.soldOut) { toast(`${d.name} đang tạm hết`); return; }
    if (balance() < r.cost) { toast('Chưa đủ điểm để đổi quà này'); return; }
    state.cart.push({
      uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      id: d.id, name: d.name, price: 0, qty: 1,
      opts: defaultOptions(d).map(o => ({ label: o.label, value: o.value })),
      played: false, stars: null, note: '', points: 0, reward: r.id, cost: r.cost,
    });
    saveCart();
    Sfx.ding();
    toast(`🎁 Đã thêm ${d.name} (đổi ${num(r.cost)} điểm) vào giỏ`);
    go('cart');
  }

  function handle(el) {
    switch (el.dataset.a) {
      case 'mode': mode = el.dataset.m; error = ''; render(); break;
      case 'logout': Cloud.logout(); toast('Đã đăng xuất'); break;
      case 'redeem': addReward(el.dataset.id); break;
      case 'login': state.afterLogin = state.view; go('account'); break;
    }
  }

  // ----- đồng bộ đơn & điểm khi online -----
  function rewatch() {
    if (!online()) return;
    Cloud.watchCustomerOrders(state.myOrders, list => Store.setCloud(list));
  }
  function init() {
    if (!online()) return;
    Cloud.watchScores();
    Cloud.on('auth', () => {
      rewatch();
      if (!Cloud.uid) state.cart = state.cart.filter(it => !it.reward);
      if (['account', 'cart', 'rank', 'orders', 'custom'].includes(state.view)) render();
    });
    Cloud.on('profile', p => {
      if (p) {
        if (!state.customer.name) state.customer.name = p.name;
        if (!state.customer.phone) state.customer.phone = p.phone;
      }
      if (['account', 'cart', 'rank'].includes(state.view)) render();
    });
    Cloud.on('scores', () => { if (state.view === 'rank') render(); });
    Cloud.on('error', msg => toast('⚠️ ' + msg));
  }

  return { view, submit, handle, balance, cartRedeem, cartEarn, rewatch, init };
})();
