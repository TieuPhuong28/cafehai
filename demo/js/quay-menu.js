// ===== Quầy: quản lý menu =====
// 4 mục con: Món · Hoa quả hôm nay · Khuyến mãi · Điểm số
(() => {
  const $m = document.getElementById('menuView');
  const escM = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svgSrc = s => 'data:image/svg+xml,' + encodeURIComponent(s);
  const ss = { get: (k, d) => { try { return sessionStorage.getItem(k) || d; } catch { return d; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} } };

  // trạng thái giao diện
  let sub = ss.get('cafehai.qsub', 'items');
  let filter = 'all', query = '', modal = null, promoType = 'discount';
  const collapsed = new Set();

  // ----- tab lớn: Đơn hàng / Quản lý menu -----
  document.querySelectorAll('.qtabs button').forEach(b => b.addEventListener('click', () => {
    const t = b.dataset.tab;
    document.querySelectorAll('.qtabs button').forEach(x => x.classList.toggle('on', x === b));
    document.getElementById('ordersView').classList.toggle('hidden', t !== 'orders');
    $m.classList.toggle('hidden', t !== 'menu');
    document.getElementById('stats').classList.toggle('hidden', t !== 'orders');
    ss.set('cafehai.qtab', t);
    if (t === 'menu') render();
  }));

  // ----- tiện ích -----
  const sw = (on, act, id, label) =>
    `<button class="sw ${on ? 'on' : ''}" data-m="${act}" data-id="${id}" role="switch" aria-checked="${on}"><i></i><span>${label}</span></button>`;
  const ic = (on, act, id, icon, title) =>
    `<button class="ic ${on ? 'on' : ''}" data-m="${act}" data-id="${id}" title="${title}" aria-label="${title}" aria-pressed="${on}">${icon}</button>`;
  const pct = x => Math.round(x * 100);
  const num = n => Math.round(n).toLocaleString('vi-VN');
  const fruitIcon = (f, size = 22) => (f.svg ? `<img src="${svgSrc(f.svg)}" width="${size}" height="${size}" alt="">` : f.icon);

  function stats() {
    const list = MenuAdmin.adminList();
    const vis = list.filter(d => !d.hidden);
    return {
      list,
      total: list.length,
      selling: vis.filter(d => !d.outReason).length,
      out: vis.filter(d => d.outReason).length,
      hidden: list.filter(d => d.hidden).length,
      sale: vis.filter(d => d.sale && d.sale < d.price).length,
      featured: vis.filter(d => d.featured).length,
      isNew: vis.filter(d => d.isNew).length,
      fruitOut: Object.keys(MenuAdmin.load().fruitOut).length,
      promos: Promo.load().filter(p => p.active).length,
    };
  }

  // ===================== khung chính =====================
  function render() {
    const s = stats();
    const tabs = [
      ['items', '🍽️ Món', `${s.selling}/${s.total - s.hidden}`],
      ['fruits', '🍊 Hoa quả hôm nay', s.fruitOut ? `${s.fruitOut} hết` : 'đủ'],
      ['promos', '🎁 Khuyến mãi', `${s.promos} bật`],
      ['points', '🏆 Điểm số', POINT_CFG === null ? '' : (MenuAdmin.load().points ? 'tùy chỉnh' : 'mặc định')],
      ['corner', '🏠 Góc quán', CornerData.cfg().enabled ? 'bật' : 'tắt'],
      ['notes', '💬 Lời nhắn', QuanData.pending().length ? QuanData.pending().length + ' chờ duyệt' : ''],
    ];
    $m.innerHTML = `
    <div class="mm-top">
      <div class="mm-sum">
        <span class="pill-s ok">🟢 ${s.selling} đang bán</span>
        ${s.out ? `<span class="pill-s bad">🔴 ${s.out} hết hàng</span>` : ''}
        ${s.hidden ? `<span class="pill-s mute">🙈 ${s.hidden} đang ẩn</span>` : ''}
        ${s.sale ? `<span class="pill-s sale">🏷️ ${s.sale} giảm giá</span>` : ''}
        ${s.promos ? `<span class="pill-s sale">🎁 ${s.promos} khuyến mãi</span>` : ''}
      </div>
      <button class="btn green" data-m="newDay" title="Bỏ tất cả đánh dấu hết hàng và hết quả">🌅 Mở ca mới</button>
    </div>
    <nav class="subnav">${tabs.map(([id, label, badge]) => `
      <button class="${sub === id ? 'on' : ''}" data-m="sub" data-id="${id}">${label}${badge ? `<small>${badge}</small>` : ''}</button>`).join('')}
    </nav>
    <div id="mmBody">${sub === 'items' ? itemsHTML(s) : sub === 'fruits' ? fruitsHTML() : sub === 'promos' ? promosHTML() : sub === 'corner' ? cornerHTML() : sub === 'notes' ? notesHTML() : pointsHTML()}</div>
    ${modal ? modalHTML() : ''}`;
    if (sub === 'points') updatePreview();
    if (modal) setTimeout(() => $m.querySelector('.modal input, .modal select')?.focus(), 30);
  }

  // ===================== MÓN =====================
  const FILTERS = [
    ['all', 'Tất cả'], ['selling', 'Đang bán'], ['out', 'Hết hàng'], ['hidden', 'Đang ẩn'],
    ['sale', 'Giá giảm'], ['featured', 'Trên bảng tin'], ['new', 'Món mới'], ['custom', 'Tự thêm'],
  ];
  const match = d => {
    if (query && !d.name.toLowerCase().includes(query.toLowerCase())) return false;
    switch (filter) {
      case 'selling': return !d.hidden && !d.outReason;
      case 'out': return !d.hidden && !!d.outReason;
      case 'hidden': return d.hidden;
      case 'sale': return d.sale && d.sale < d.price;
      case 'featured': return d.featured;
      case 'new': return d.isNew;
      case 'custom': return d.custom;
    }
    return true;
  };

  function itemsHTML(s) {
    const counts = Object.fromEntries(FILTERS.map(([id]) => { const f0 = filter; filter = id; const q0 = query; query = ''; const n = s.list.filter(match).length; filter = f0; query = q0; return [id, n]; }));
    return `
    <div class="toolbar">
      <label class="search">🔍<input id="mmSearch" type="search" placeholder="Tìm món…" value="${escM(query)}"></label>
      <button class="btn primary" data-m="openAdd">＋ Thêm món mới</button>
    </div>
    <div class="chips">${FILTERS.map(([id, label]) => counts[id] || id === 'all' ? `
      <button class="chip ${filter === id ? 'on' : ''}" data-m="filter" data-id="${id}">${label} <b>${counts[id]}</b></button>` : '').join('')}
    </div>
    <div class="legend">Bấm công tắc để báo <b>còn / hết hàng</b> · 📣 hiện trên bảng tin · ✨ gắn nhãn MỚI · 👁 ẩn khỏi menu · ô <b>Giảm</b> để nhập giá giảm</div>
    <div id="mmItems">${itemsListHTML(s.list)}</div>`;
  }

  function itemsListHTML(list) {
    const shown = list.filter(match);
    if (!shown.length) return `<div class="mm-empty">Không có món nào khớp. <button class="linkbtn" data-m="filter" data-id="all">Xem tất cả</button></div>`;
    return CATS.map(c => {
      const items = shown.filter(d => d.cat === c.id);
      if (!items.length) return '';
      const all = list.filter(d => d.cat === c.id);
      const open = !collapsed.has(c.id) || query || filter !== 'all';
      return `
      <section class="cat ${open ? '' : 'closed'}">
        <button class="cat-h" data-m="fold" data-id="${c.id}">
          <span class="caret">▾</span><b>${c.name}</b>
          <small>${all.filter(d => !d.hidden && !d.outReason).length}/${all.length} đang bán</small>
        </button>
        ${open ? `<div class="cat-b">${items.map(rowHTML).join('')}</div>` : ''}
      </section>`;
    }).join('');
  }

  function rowHTML(d) {
    const onSale = d.sale && d.sale < d.price;
    const state = d.hidden ? 'hidden' : d.outReason ? 'out' : 'ok';
    const base = d.custom && d.base && d.base !== 'plain' ? MenuAdmin.BASE.find(b => b.id === d.base) : null;
    return `
    <div class="item ${state}">
      <div class="it-name">
        <span class="dot ${state}" title="${state === 'ok' ? 'Đang bán' : state === 'out' ? d.outReason : 'Đang ẩn'}"></span>
        <div>
          <b>${escM(d.name)}</b>
          <div class="it-tags">
            ${d.featured ? '<em class="t feat">📣 Bảng tin</em>' : ''}
            ${d.isNew ? '<em class="t new">MỚI</em>' : ''}
            ${onSale ? `<em class="t sale">−${d.price - d.sale}K</em>` : ''}
            ${d.custom ? '<em class="t custom">Tự thêm</em>' : ''}
            ${base ? `<em class="t game">🎮 pha như ${escM(base.name)}</em>` : ''}
            ${d.outReason && !d.soldOutManual ? `<em class="t warn">⚠ ${escM(d.outReason)}</em>` : ''}
          </div>
        </div>
      </div>
      <div class="it-price">
        <label>Giá<input type="number" min="5" max="500" value="${d.price}" data-m="price" data-id="${d.id}" aria-label="Giá ${escM(d.name)}"><span>K</span></label>
        <label class="sale ${onSale ? 'has' : ''}">Giảm<input type="number" min="1" max="500" value="${onSale ? d.sale : ''}" placeholder="—" data-m="sale" data-id="${d.id}" aria-label="Giá giảm ${escM(d.name)}"><span>K</span></label>
      </div>
      <div class="it-act">
        ${sw(!d.soldOutManual, 'sold', d.id, d.soldOutManual ? 'Hết hàng' : 'Còn hàng')}
        <span class="ics">
          ${ic(d.featured, 'feat', d.id, '📣', d.featured ? 'Gỡ khỏi bảng tin' : 'Đưa lên bảng tin')}
          ${ic(d.isNew, 'new', d.id, '✨', d.isNew ? 'Bỏ nhãn MỚI' : 'Gắn nhãn MỚI')}
          ${ic(d.hidden, 'hide', d.id, d.hidden ? '🙈' : '👁', d.hidden ? 'Hiện lại trên menu' : 'Ẩn khỏi menu')}
          ${d.custom ? ic(false, 'del', d.id, '🗑', 'Xóa món') : ''}
        </span>
      </div>
    </div>`;
  }

  function refreshItems() {
    const box = document.getElementById('mmItems');
    if (box) box.innerHTML = itemsListHTML(MenuAdmin.adminList());
  }

  // ===================== HOA QUẢ =====================
  function fruitsHTML() {
    const fruits = MenuAdmin.allFruits(), st = MenuAdmin.load();
    const uses = k => {
      const drinks = MenuAdmin.BASE.filter(d => d.steps.some(s => s.type === 'fruit' && !s.free && s.fruits.includes(k))).length;
      const box = typeof CUT_FRUIT !== 'undefined' && CUT_FRUIT[k];
      return [drinks ? `${drinks} món nước ép` : '', box ? 'hộp quả' : ''].filter(Boolean).join(' · ') || 'mix tự chọn';
    };
    const outN = Object.keys(st.fruitOut).length;
    return `
    <div class="toolbar">
      <p class="lead">Bấm vào loại quả <b>đã hết hôm nay</b>. Các món dùng loại đó sẽ tự báo hết, khách cũng không chọn được khi tự mix hay cắt quả.</p>
      ${outN ? '<button class="btn ghost dark" data-m="fruitsAll">Còn đủ tất cả</button>' : ''}
    </div>
    <div class="fruit-grid">${Object.entries(fruits).map(([k, f]) => {
      const out = !!st.fruitOut[k];
      return `
      <button class="fcard ${out ? 'out' : ''}" data-m="fruit" data-id="${k}" aria-pressed="${out}">
        <span class="fi-big">${fruitIcon(f, 36)}</span>
        <b>${f.name}</b>
        <small>${uses(k)}</small>
        <em>${out ? '⛔ Hết hôm nay' : '✅ Còn'}</em>
      </button>`;
    }).join('')}</div>`;
  }

  // ===================== KHUYẾN MÃI =====================
  const PTYPE = { discount: ['🏷️', 'Giảm giá'], combo: ['🔥', 'Combo'], info: ['📣', 'Thông báo'] };
  function promosHTML() {
    const list = Promo.load();
    return `
    <div class="toolbar">
      <p class="lead">Khuyến mãi đang bật hiện ở <b>quầy thông tin</b> trong quán ảo và tự trừ tiền trong giỏ hàng.</p>
      <button class="btn primary" data-m="openPromo">＋ Tạo khuyến mãi</button>
    </div>
    ${list.length ? `<div class="promo-grid">${list.map(p => `
      <div class="pcard ${p.active ? '' : 'off'} ${p.type}">
        <div class="pc-top">
          <span class="pc-emoji">${p.emoji || PTYPE[p.type][0]}</span>
          <span class="pc-type">${PTYPE[p.type].join(' ')}${p.sample ? ' · mẫu' : ''}</span>
          ${sw(p.active, 'pToggle', p.id, p.active ? 'Đang bật' : 'Đang tắt')}
        </div>
        <b class="pc-title">${escM(p.title)}</b>
        <p class="pc-desc">${escM(Promo.describe(p))}</p>
        <div class="pc-foot"><span>${p.type === 'info' ? '' : '🕒 ' + Promo.status(p)}</span>${ic(false, 'pDel', p.id, '🗑', 'Xóa khuyến mãi')}</div>
      </div>`).join('')}</div>`
      : `<div class="mm-empty">Chưa có khuyến mãi nào.<br><button class="btn ghost dark" data-m="pSamples" style="margin-top:10px">Thêm khuyến mãi mẫu để xem thử</button></div>`}`;
  }

  // ===================== ĐIỂM SỐ =====================
  function pointsHTML() {
    const c = POINT_CFG, custom = !!MenuAdmin.load().points;
    return `
    <div class="pts-wrap">
      <form id="pointsForm" class="pts-form" autocomplete="off">
        <fieldset>
          <legend>Điểm tối đa của mỗi món</legend>
          <label class="inline"><span>Mỗi 1.000đ được</span><input name="perK" type="number" min="1" max="1000" value="${c.perK}"><span>điểm</span></label>
          <label class="inline"><span>Tính theo</span><select name="basis"><option value="base" ${c.basis === 'base' ? 'selected' : ''}>giá gốc</option><option value="sale" ${c.basis === 'sale' ? 'selected' : ''}>giá bán sau giảm</option></select></label>
        </fieldset>
        <fieldset>
          <legend>Khách tự pha / tự cắt (chế độ Thử thách)</legend>
          <div class="split">
            <label><span>Độ chuẩn</span><input name="base" type="number" min="0" max="100" value="${pct(c.base)}"><i>%</i></label>
            <label><span>Thưởng hoàn hảo</span><input name="perfect" type="number" min="0" max="100" value="${pct(c.perfect)}"><i>%</i></label>
            <label><span>Thưởng tốc độ</span><input name="speed" type="number" min="0" max="100" value="${pct(c.speed)}"><i>%</i></label>
          </div>
          <p class="sumline" id="splitSum"></p>
          <label class="inline"><span>Điểm sàn (pha kém vẫn được ít nhất)</span><input name="floor" type="number" min="0" max="100" value="${pct(c.floor)}"><span>% điểm tối đa</span></label>
        </fieldset>
        <fieldset>
          <legend>Khách không chơi game</legend>
          <label class="inline"><span>Đặt nhanh, Như mọi khi, deal, tự do sáng tạo được</span><input name="quick" type="number" min="0" max="100" value="${pct(c.quick)}"><span>% điểm tối đa</span></label>
        </fieldset>
        <p class="hint" id="floorHint"></p>
        <div class="pts-actions">
          <button class="btn primary" type="submit">Lưu cấu hình điểm</button>
          ${custom ? '<button class="btn ghost dark" type="button" data-m="ptReset">Về mặc định</button>' : ''}
          <span class="muted">${custom ? 'Đang dùng cấu hình riêng' : 'Đang dùng mặc định'} · áp dụng cho các ly đặt từ lúc lưu</span>
        </div>
      </form>
      <section class="pts-form rewards-box">
        <h4>🎁 Đổi điểm lấy quà <small>khách tự đổi trong mục Tài khoản (bản online)</small></h4>
        ${MenuAdmin.rewards().map(r => {
          const d = MENU.find(x => x.id === r.itemId) || MenuAdmin.adminList().find(x => x.id === r.itemId);
          return `<div class="rw-row"><span>${d ? escM(d.name) : '(món đã xóa)'}<small>${d ? d.price + 'K' : ''}</small></span>
            <label><input type="number" min="100" step="100" value="${r.cost}" data-m="rwCost" data-id="${r.id}" aria-label="Điểm đổi">điểm</label>
            ${ic(false, 'rwDel', r.id, '🗑', 'Xóa quà')}</div>`;
        }).join('') || '<p class="hint">Chưa có quà nào.</p>'}
        <div class="rw-add">
          <select id="rwItem">${itemOptions(false)}</select>
          <input id="rwNewCost" type="number" min="100" step="100" placeholder="Số điểm">
          <button class="btn light" type="button" data-m="rwAdd">＋ Thêm quà</button>
        </div>
        <p class="hint">Gợi ý: với 1.000đ = ${POINT_CFG.perK} điểm, đặt quà bằng khoảng 10 lần giá món (ly 20K ≈ ${(20 * POINT_CFG.perK * 10).toLocaleString('vi-VN')} điểm) là khách được ~10% giá trị.</p>
      </section>
      <aside class="pts-preview">
        <h4>Xem trước <small>tự tính theo số đang nhập</small></h4>
        <div id="ptsPreview"></div>
      </aside>
    </div>`;
  }

  // ===================== GÓC QUÁN =====================
  let cnStats = null, cnLoading = false;
  function cornerHTML() {
    const C = CornerData, c = C.cfg();
    const giftSel = L => `<select name="gift${L}"><option value="">(không có quà)</option>${CATS.map(cat => `<optgroup label="${cat.name}">${MenuAdmin.adminList().filter(d => d.cat === cat.id && !d.hidden).map(d => `<option value="${d.id}" ${c.gifts[L] === d.id ? 'selected' : ''}>${escM(d.name)} (${d.price}K)</option>`).join('')}</optgroup>`).join('')}</select>`;
    const st = cnStats;
    return `
    <div class="pts-wrap">
      <form id="cornerForm" class="pts-form" autocomplete="off">
        <fieldset>
          <legend>Bật / tắt</legend>
          <label class="inline"><input type="checkbox" name="enabled" ${c.enabled ? 'checked' : ''}><span>Bật "Góc quán của tôi" cho khách (cầu thang trong quán, nút 🏠)</span></label>
        </fieldset>
        <fieldset>
          <legend>Xu (chỉ cộng khi quầy bấm hoàn tất đơn)</legend>
          <label class="inline"><span>Mỗi 1.000đ đơn hàng được</span><input name="rate" type="number" min="0" max="10" step="0.5" value="${c.rate}"><span>xu</span></label>
          <label class="inline"><span>Lần đầu mua một loại món (cà phê, nước ép, hoa quả, chai, trà & khác)</span><input name="firstBonus" type="number" min="0" max="200" value="${c.firstBonus}"><span>xu</span></label>
        </fieldset>
        <fieldset>
          <legend>Quà thật ở mốc cấp</legend>
          ${C.GIFT_LEVELS.map(L => `<label class="inline"><span>Cấp ${L} (từ ${C.LEVELS[L - 1]} phong cách)</span>${giftSel(L)}</label>`).join('')}
          <p class="hint">Khách bấm "Nhận quà" → món được thêm vào đơn với giá 0đ. Khi quầy hoàn tất đơn, hệ thống kiểm tra cấp góc quán và chỉ cho nhận mỗi mốc một lần.</p>
        </fieldset>
        <div class="pts-actions">
          <button class="btn primary" type="submit">Lưu cấu hình Góc quán</button>
          <span class="muted">Ước lượng: ly 20K = ${C.estimate(20)} xu · khách mua 2 ly/tuần ≈ ${C.estimate(40)} xu/tuần</span>
        </div>
      </form>
      <section class="pts-form rewards-box">
        <h4>📊 Số liệu <small>${Store.online() ? 'bản online' : 'bản demo trên máy này'}</small></h4>
        ${st ? `
          <div class="rw-row"><span>Khách đã mở góc quán<small>Mục tiêu giai đoạn 1: ≥ 30% khách dùng app</small></span><b>${num(st.opened)} / ${num(st.customers)} khách · ${pctOf(st.opened, st.customers)}</b></div>
          <div class="rw-row"><span>Khách đã có xu (có đơn hoàn tất)</span><b>${num(st.active)}</b></div>
          <div class="rw-row"><span>Xu đã phát / đã tiêu</span><b>${num(st.xu)} / ${num(st.spent)}</b></div>
          <div class="rw-row"><span>Khách theo cấp</span><b>${st.levels.map((n, k) => `C${k + 1}: ${n}`).join(' · ')}</b></div>
          <div class="rw-row"><span>Quà mốc cấp đã giao</span><b>${num(st.gifts)} phần · ~${num(st.giftCost)}K</b></div>
          <div class="rw-row"><span>Chi phí quà / doanh thu của khách có góc quán<small>Mục tiêu: ≤ 5–7% · doanh thu tính trên ${num(st.orders)} đơn hoàn tất gần đây</small></span><b class="${st.revenue && st.giftCost / st.revenue > .07 ? 'bad' : ''}">${num(st.giftCost)}K / ${num(st.revenue)}K · ${pctOf(st.giftCost, st.revenue)}</b></div>`
          : '<p class="hint">Bấm "Tải số liệu" để xem.</p>'}
        <div class="pts-actions"><button class="btn light" type="button" data-m="cnStats" ${cnLoading ? 'disabled' : ''}>${cnLoading ? 'Đang tải…' : '↻ Tải số liệu'}</button></div>
      </section>
      <aside class="pts-preview">
        <h4>Cấp quán & đồ <small>bản đầu: 4×4 ô, cấp 1–5, ${C.ITEMS.length} món đồ</small></h4>
        <table>
          <thead><tr><th>Đồ</th><th>Giá</th><th>Phong<br>cách</th><th>Mở khóa</th></tr></thead>
          <tbody>${C.ITEMS.map(it => `<tr><td>${escM(it.name)}<small>${C.GROUPS.find(g => g.id === it.group).name}${C.STARTER[it.id] ? ' · có sẵn ' + C.STARTER[it.id] : ''}</small></td><td>${it.price}</td><td>${it.style}</td><td>${it.need ? `${it.needN} ${C.KINDS[it.need]}` : '—'}</td></tr>`).join('')}</tbody>
        </table>
        <p class="hint">Cấp: ${C.LEVELS.map((s, k) => `cấp ${k + 1} từ ${s}`).join(' · ')} phong cách.</p>
      </aside>
    </div>`;
  }
  const pctOf = (a, b) => (b ? (Math.round(a / b * 1000) / 10).toLocaleString('vi-VN') + '%' : '—');
  async function loadCornerStats() {
    const C = CornerData;
    cnLoading = true; render();
    try {
      const online = Store.online();
      // bản online: khóa = uid; bản demo: khóa = số điện thoại
      const docs = online ? await Cloud.listCorners() : Object.entries(C.localAll()).map(([id, d]) => ({ ...d, id }));
      const done = Store.all().filter(o => o.status === 'xong');
      const keyOf = o => (online ? o.uid : C.phoneKey(o.customer && o.customer.phone));
      const customers = online ? await Cloud.countCustomers() : new Set(Store.all().map(keyOf).filter(Boolean)).size;
      const opened = new Set(docs.filter(d => d.seenAt).map(d => d.id));
      const mine = done.filter(o => opened.has(keyOf(o)));
      const st = { n: docs.length, opened: opened.size, customers, active: 0, xu: 0, spent: 0, levels: C.LEVELS.map(() => 0), gifts: 0, giftCost: 0,
        orders: mine.length, revenue: mine.reduce((a, o) => a + (o.total || 0), 0) };
      docs.map(C.normalize).forEach(d => {
        if (d.xu) st.active++;
        st.xu += d.xu || 0; st.spent += d.spent || 0;
        st.levels[C.level(d) - 1]++;
        Object.keys(d.gifts).forEach(L => { st.gifts++; const it = MenuAdmin.adminList().find(x => x.id === C.cfg().gifts[L]); st.giftCost += it ? it.price : 0; });
      });
      cnStats = st;
    } catch (e) { toast('⚠️ ' + (typeof Cloud !== 'undefined' ? Cloud.niceError(e) : e)); }
    cnLoading = false; render();
  }
  function submitCorner(f) {
    const rate = +f.get('rate'), firstBonus = Math.round(+f.get('firstBonus'));
    if (!(rate >= 0 && rate <= 10)) { toast('Xu mỗi 1.000đ: từ 0 đến 10'); return; }
    if (!(firstBonus >= 0 && firstBonus <= 200)) { toast('Thưởng lần đầu: từ 0 đến 200 xu'); return; }
    const gifts = {};
    CornerData.GIFT_LEVELS.forEach(L => { gifts[L] = f.get('gift' + L) || ''; });
    MenuAdmin.setCorner({ enabled: !!f.get('enabled'), rate, firstBonus, gifts });
    toast('Đã lưu cấu hình Góc quán');
  }

  function formCfg() {
    const f = document.getElementById('pointsForm');
    if (!f) return null;
    const n = k => Math.round(+f.elements[k].value || 0);
    return { perK: n('perK'), basis: f.elements.basis.value, base: n('base') / 100, perfect: n('perfect') / 100, speed: n('speed') / 100, quick: n('quick') / 100, floor: n('floor') / 100 };
  }
  function updatePreview() {
    const c = formCfg();
    if (!c) return;
    const sum = Math.round((c.base + c.perfect + c.speed) * 100);
    const el = document.getElementById('splitSum');
    el.textContent = sum === 100 ? '✓ Tổng 100%' : `Tổng đang là ${sum}% — cần đúng 100%`;
    el.className = 'sumline ' + (sum === 100 ? 'ok' : 'bad');
    document.getElementById('floorHint').innerHTML = c.floor < c.quick
      ? `⚠️ Điểm sàn (${pct(c.floor)}%) đang <b>thấp hơn</b> mức không chơi game (${pct(c.quick)}%): khách pha kém có thể ít điểm hơn người không chơi.`
      : '✓ Khách tự pha luôn được ít nhất bằng người không chơi game.';
    document.getElementById('floorHint').className = 'hint ' + (c.floor < c.quick ? 'bad' : 'ok');
    const price = d => (c.basis === 'sale' ? Promo.unitPrice(d).price : d.price);
    const ex = ['nau', 'xiumuoi', 'mix', 'chaiden', 'hoplon'].map(id => MENU.find(d => d.id === id)).filter(Boolean);
    document.getElementById('ptsPreview').innerHTML = `
      <table>
        <thead><tr><th>Món</th><th>Tự pha<br>tối đa</th><th>Tự pha<br>tối thiểu</th><th>Không<br>chơi</th></tr></thead>
        <tbody>${ex.map(d => {
          const max = Math.round(price(d) * c.perK), game = d.steps.length || d.box;
          return `<tr><td>${escM(d.name)}<small>${price(d)}K</small></td><td>${game ? num(max) : '—'}</td><td>${game ? num(max * c.floor) : '—'}</td><td>${num(max * c.quick)}</td></tr>`;
        }).join('')}</tbody>
      </table>`;
  }

  // ===================== CỬA SỔ (thêm món / khuyến mãi) =====================
  function itemOptions(withCats) {
    const items = MenuAdmin.adminList().filter(d => !d.hidden);
    return (withCats ? `<optgroup label="Cả nhóm">${CATS.map(c => `<option value="cat:${c.id}">Cả nhóm ${c.name}</option>`).join('')}</optgroup>` : '')
      + CATS.map(c => `<optgroup label="${c.name}">${items.filter(d => d.cat === c.id).map(d => `<option value="${d.id}">${escM(d.name)} (${d.price}K)</option>`).join('')}</optgroup>`).join('');
  }

  function modalHTML() {
    const templates = MenuAdmin.BASE.filter(d => d.steps.length && !d.box);
    const body = modal === 'add' ? `
      <h3>＋ Thêm món mới</h3>
      <form id="addForm" class="mform" autocomplete="off">
        <label class="w"><span>Tên món</span><input name="name" required maxlength="40" placeholder="VD: Bạc xỉu dừa"></label>
        <label><span>Nhóm</span><select name="cat">${CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
        <label><span>Giá (K)</span><input name="price" type="number" min="5" max="500" required placeholder="25"></label>
        <label class="w"><span>Khách đặt món này thế nào?</span>
          <select name="base">
            <option value="">Đặt nhanh, khách chọn đường & đá</option>
            <option value="plain">Đặt nhanh, không tùy chọn (đồ chai, đồ ăn…)</option>
            <optgroup label="Có game pha chế, cách pha giống món:">${templates.map(d => `<option value="${d.id}">🎮 ${d.name}</option>`).join('')}</optgroup>
          </select>
        </label>
        <label class="w"><span>Anh Hải giới thiệu (không bắt buộc)</span><input name="intro" maxlength="120" placeholder="VD: Món mới tuần này, béo thơm vị dừa!"></label>
        <label class="w check"><input type="checkbox" name="isNew" checked> Gắn nhãn <b class="newb">MỚI</b> và để anh Hải mời khách thử</label>
        <label class="w check"><input type="checkbox" name="featured"> Đưa lên 📣 bảng tin</label>
        <div class="w mactions"><button class="btn ghost dark" type="button" data-m="close">Hủy</button><button class="btn primary" type="submit">Thêm vào menu</button></div>
      </form>`
      : `
      <h3>＋ Tạo khuyến mãi</h3>
      <div class="seg3">${Object.entries(PTYPE).map(([k, [e, n]]) => `<button class="${promoType === k ? 'on' : ''}" data-m="pType" data-id="${k}">${e} ${n}</button>`).join('')}</div>
      <p class="hint">${promoType === 'discount' ? 'Giảm giá một món hoặc cả nhóm, có thể giới hạn khung giờ (giờ vàng).' : promoType === 'combo' ? 'Khách mua đủ bộ món thì tính giá combo. Giá combo phải rẻ hơn giá thường.' : 'Chỉ hiện thông báo ở quầy thông tin, không trừ tiền.'}</p>
      <form id="promoForm" class="mform" autocomplete="off">
        <label class="w"><span>Tiêu đề</span><input name="title" required maxlength="40" placeholder="${promoType === 'combo' ? 'VD: Combo sáng tỉnh táo' : promoType === 'info' ? 'VD: Nghỉ Tết từ 28/1' : 'VD: Giờ vàng cà phê'}"></label>
        ${promoType === 'discount' ? `
          <label class="w"><span>Áp dụng cho</span><select name="target">${itemOptions(true)}</select></label>
          <label><span>Mức giảm</span><input name="value" type="number" min="1" max="100" required placeholder="5"></label>
          <label><span>Đơn vị</span><select name="mode"><option value="k">nghìn đồng (K)</option><option value="pct">phần trăm (%)</option></select></label>
          <label><span>Từ giờ <i>(tùy chọn)</i></span><input name="from" type="time"></label>
          <label><span>Đến giờ</span><input name="to" type="time"></label>` : ''}
        ${promoType === 'combo' ? [0, 1, 2].map(i => `
          <label class="w2"><span>Món ${i + 1}${i ? ' <i>(tùy chọn)</i>' : ''}</span><select name="item${i}">${i ? '<option value="">—</option>' : ''}${itemOptions(false)}</select></label>
          <label class="qty"><span>SL</span><input name="qty${i}" type="number" min="1" max="5" value="1"></label>`).join('') + `
          <label><span>Giá combo (K)</span><input name="price" type="number" min="5" max="1000" required placeholder="45"></label>
          <label><span>Khung giờ <i>(tùy chọn)</i></span><span class="row2"><input name="from" type="time"><input name="to" type="time"></span></label>` : ''}
        ${promoType === 'info' ? `<label class="w"><span>Nội dung</span><input name="desc" required maxlength="120" placeholder="VD: Quán nghỉ Tết từ 28/1 đến hết mùng 4"></label>` : ''}
        <label><span>Biểu tượng</span><select name="emoji">${['🎁', '🔥', '⏰', '🍹', '☕', '🍉', '👯', '📣', '🎉', '💝'].map(e => `<option>${e}</option>`).join('')}</select></label>
        <div class="w mactions"><button class="btn ghost dark" type="button" data-m="close">Hủy</button><button class="btn primary" type="submit">Tạo ${PTYPE[promoType][1].toLowerCase()}</button></div>
      </form>`;
    return `<div class="modal-ov" data-m="closeBg"><div class="modal" role="dialog" aria-modal="true">${body}</div></div>`;
  }

  // ===================== lời nhắn Quán chung =====================
  function notesHTML() {
    if (Store.online()) return '<section class="pts-form rewards-box"><h4>💬 Lời nhắn</h4><p class="hint">Bản thử: tường lời nhắn mới chạy ở chế độ demo. Bản online làm ở bước sau.</p></section>';
    const Q = QuanData, pend = Q.pending();
    const ok = Q.notes().filter(n => n.status === 'ok').sort((a, b) => b.pin - a.pin || b.at - a.at);
    const hidden = Q.notes().filter(n => n.status === 'an');
    const when = t => new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    const row = (n, acts) => `<div class="rw-row nt-row"><span><i class="nt-dot nt-${n.color}">${n.icon}</i> “${escM(n.text)}”<small>${escM(n.name)} · ${when(n.at)}${n.reply ? ' · Trả lời: ' + escM(n.reply) : ''}${n.pin ? ' · 📌 đang ghim' : ''}</small></span>${acts}</div>`;
    return `
      <section class="pts-form rewards-box">
        <h4>⏳ Chờ duyệt <small>${pend.length} lời nhắn</small></h4>
        <p class="hint">Chỉ lời nhắn được duyệt mới hiện trên tường Quán chung. Lời nhắn thường tự gỡ sau 2 tuần, lời nhắn được ghim thì giữ lại.</p>
        ${pend.map(n => row(n, `<button class="btn green sm" data-m="ntOk" data-id="${n.id}">Duyệt</button><button class="btn danger sm" data-m="ntHide" data-id="${n.id}">Ẩn</button>`)).join('') || '<p class="hint">Không có lời nhắn nào đang chờ 👍</p>'}
      </section>
      <section class="pts-form rewards-box">
        <h4>📌 Đang trên tường <small>${ok.length}</small></h4>
        ${ok.map(n => row(n, `<button class="btn sm" data-m="ntPin" data-id="${n.id}">${n.pin ? 'Bỏ ghim' : 'Ghim'}</button><button class="btn sm" data-m="ntReply" data-id="${n.id}">Trả lời</button><button class="btn danger sm" data-m="ntHide" data-id="${n.id}">Gỡ</button>`)).join('') || '<p class="hint">Tường đang trống.</p>'}
      </section>
      ${hidden.length ? `<section class="pts-form rewards-box"><h4>🙈 Đã ẩn <small>${hidden.length}</small></h4>${hidden.map(n => row(n, `<button class="btn sm" data-m="ntOk" data-id="${n.id}">Đăng lại</button>`)).join('')}</section>` : ''}`;
  }

  // ===================== thao tác =====================
  $m.addEventListener('click', e => {
    const b = e.target.closest('[data-m]');
    if (!b || b.tagName === 'INPUT') return;
    const act = b.dataset.m, id = b.dataset.id;
    const d = id ? MenuAdmin.adminList().find(x => x.id === id) : null;
    switch (act) {
      case 'sub': sub = id; modal = null; ss.set('cafehai.qsub', sub); render(); return;
      case 'filter': filter = id; render(); return;
      case 'fold': collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); refreshItems(); return;
      case 'openAdd': modal = 'add'; render(); return;
      case 'openPromo': modal = 'promo'; render(); return;
      case 'close': modal = null; render(); return;
      case 'closeBg': if (e.target === b) { modal = null; render(); } return;
      case 'pType': promoType = id; render(); return;
      case 'sold': MenuAdmin.setSoldOut(id, !d.soldOutManual); toast(`${d.name}: ${d.soldOutManual ? 'có hàng lại' : 'đã báo hết'}`); return;
      case 'feat': MenuAdmin.setFeatured(id, !d.featured); toast(`${d.name}: ${d.featured ? 'gỡ khỏi bảng tin' : 'đã lên bảng tin'}`); return;
      case 'new': MenuAdmin.setNew(id, !d.isNew); return;
      case 'hide': MenuAdmin.setHidden(id, !d.hidden); toast(`${d.name}: ${d.hidden ? 'hiện lại trên menu' : 'đã ẩn khỏi menu'}`); return;
      case 'del': if (confirm(`Xóa món "${d.name}" khỏi menu?`)) { MenuAdmin.removeItem(id); toast('Đã xóa món'); } return;
      case 'fruit': MenuAdmin.setFruitOut(id, !MenuAdmin.load().fruitOut[id]); return;
      case 'fruitsAll': MenuAdmin.update(s => { s.fruitOut = {}; }); toast('Đã đánh dấu còn đủ tất cả loại quả'); return;
      case 'newDay': if (confirm('Mở ca mới: bỏ tất cả đánh dấu "hết hàng" và "hết quả"?')) { MenuAdmin.resetDay(); toast('Đã mở ca mới, tất cả món đang bán'); } return;
      case 'pToggle': Promo.toggle(id); return;
      case 'pDel': if (confirm('Xóa khuyến mãi này?')) Promo.remove(id); return;
      case 'pSamples': Promo.addSamples(); toast('Đã thêm khuyến mãi mẫu'); return;
      case 'rwDel': if (confirm('Xóa quà này?')) MenuAdmin.setRewards(MenuAdmin.rewards().filter(r => r.id !== id)); return;
      case 'rwAdd': {
        const itemId = document.getElementById('rwItem').value, cost = Math.round(+document.getElementById('rwNewCost').value);
        if (!(cost >= 100)) { toast('Nhập số điểm (từ 100)'); return; }
        MenuAdmin.setRewards(MenuAdmin.rewards().concat([{ id: 'r' + Date.now().toString(36), itemId, cost }]));
        toast('Đã thêm quà');
        return;
      }
      case 'cnStats': loadCornerStats(); return;
      case 'ntOk': QuanData.setNote(id, { status: 'ok', at: Date.now() }); toast('Đã đăng lời nhắn lên tường'); render(); return;
      case 'ntHide': QuanData.setNote(id, { status: 'an', pin: false }); toast('Đã ẩn lời nhắn'); render(); return;
      case 'ntPin': { const n = QuanData.notes().find(x => x.id === id); QuanData.setNote(id, { pin: !n.pin }); render(); return; }
      case 'ntReply': {
        const n = QuanData.notes().find(x => x.id === id);
        const r = prompt('Anh Hải trả lời (để trống để xóa trả lời):', n.reply || '');
        if (r !== null) { QuanData.setNote(id, { reply: r.trim().slice(0, 80) }); render(); }
        return;
      }
      case 'ptReset': if (confirm('Khôi phục cấu hình điểm mặc định?')) { MenuAdmin.resetPoints(); toast('Đã về cấu hình điểm mặc định'); } return;
    }
  });

  $m.addEventListener('input', e => {
    if (e.target.id === 'mmSearch') { query = e.target.value; refreshItems(); }
    if (e.target.closest('#pointsForm')) updatePreview();
  });

  $m.addEventListener('change', e => {
    const t = e.target, id = t.dataset.id;
    if (t.dataset.m === 'sale') {
      const d = MenuAdmin.adminList().find(x => x.id === id), v = String(t.value).trim();
      if (!v) { MenuAdmin.setSale(id, null); toast(`${d.name}: bỏ giá giảm`); return; }
      const k = Math.round(+v);
      if (!(k >= 1 && k < d.price)) { toast(`Giá giảm phải thấp hơn giá bán (${d.price}K)`); refreshItems(); return; }
      MenuAdmin.setSale(id, k); toast(`${d.name}: giảm còn ${k}K`);
    }
    if (t.dataset.m === 'rwCost') {
      const c = Math.round(+t.value);
      if (!(c >= 100)) { toast('Số điểm từ 100'); render(); return; }
      MenuAdmin.setRewards(MenuAdmin.rewards().map(r => (r.id === id ? { ...r, cost: c } : r)));
      toast('Đã đổi số điểm');
    }
    if (t.dataset.m === 'price') {
      const p = Math.round(+t.value);
      if (!(p >= 5 && p <= 500)) { toast('Giá từ 5K đến 500K'); refreshItems(); return; }
      const cur = MenuAdmin.adminList().find(x => x.id === id);
      if (cur && cur.sale && cur.sale >= p) MenuAdmin.setSale(id, null);
      MenuAdmin.setPrice(id, p); toast(`${cur.name}: giá ${p}K`);
    }
  });

  $m.addEventListener('keydown', e => { if (e.key === 'Escape' && modal) { modal = null; render(); } });

  $m.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target, f = new FormData(form);
    if (form.id === 'addForm') {
      const name = String(f.get('name') || '').trim(), price = Math.round(+f.get('price'));
      if (!name) { toast('Nhập tên món'); return; }
      if (!(price >= 5 && price <= 500)) { toast('Giá từ 5K đến 500K'); return; }
      if (MenuAdmin.adminList().some(d => d.name.toLowerCase() === name.toLowerCase())) { toast('Đã có món trùng tên'); return; }
      modal = null;
      MenuAdmin.addItem({ name, price, cat: f.get('cat'), base: f.get('base') || '', intro: String(f.get('intro') || '').trim(), isNew: !!f.get('isNew') });
      if (f.get('featured')) { const added = MenuAdmin.load().custom.slice(-1)[0]; if (added) MenuAdmin.setFeatured(added.id, true); }
      filter = 'all'; query = '';
      toast(`Đã thêm "${name}" vào menu`);
    } else if (form.id === 'promoForm') submitPromo(f);
    else if (form.id === 'pointsForm') submitPoints();
    else if (form.id === 'cornerForm') submitCorner(f);
  });

  function submitPromo(f) {
    const title = String(f.get('title') || '').trim(), from = f.get('from') || '', to = f.get('to') || '';
    if (!title) { toast('Nhập tiêu đề'); return; }
    if ((from && !to) || (!from && to)) { toast('Nhập đủ cả giờ bắt đầu và kết thúc'); return; }
    const base = { type: promoType, title, emoji: f.get('emoji'), from, to };
    let p;
    if (promoType === 'discount') {
      const t = f.get('target'), value = Math.round(+f.get('value')), mode = f.get('mode');
      if (!(value > 0) || (mode === 'pct' && value > 90)) { toast('Mức giảm không hợp lệ (tối đa 90%)'); return; }
      p = { ...base, mode, value, ...(t.startsWith('cat:') ? { cat: t.slice(4) } : { items: [t] }) };
    } else if (promoType === 'combo') {
      const merged = [];
      [0, 1, 2].map(i => ({ id: f.get('item' + i), qty: Math.max(1, Math.round(+f.get('qty' + i) || 1)) })).filter(x => x.id)
        .forEach(x => { const m = merged.find(y => y.id === x.id); m ? (m.qty += x.qty) : merged.push({ ...x }); });
      const price = Math.round(+f.get('price'));
      const normal = merged.reduce((a, x) => a + (MenuAdmin.adminList().find(d => d.id === x.id)?.price || 0) * x.qty, 0);
      if (merged.reduce((a, x) => a + x.qty, 0) < 2) { toast('Combo cần ít nhất 2 phần'); return; }
      if (!(price > 0) || price >= normal) { toast(`Giá combo phải rẻ hơn giá thường (${normal}K)`); return; }
      p = { ...base, items: merged, price };
    } else {
      const desc = String(f.get('desc') || '').trim();
      if (!desc) { toast('Nhập nội dung thông báo'); return; }
      p = { ...base, desc, from: '', to: '' };
    }
    modal = null;
    Promo.add(p);
    toast(`Đã tạo "${title}"`);
  }

  function submitPoints() {
    const c = formCfg();
    if (!(c.perK >= 1 && c.perK <= 1000)) { toast('Mỗi 1.000đ: từ 1 đến 1000 điểm'); return; }
    if (Math.round((c.base + c.perfect + c.speed) * 100) !== 100) { toast('Chia điểm phải cộng lại đúng 100%'); return; }
    if ([c.base, c.perfect, c.speed, c.quick, c.floor].some(x => !(x >= 0 && x <= 1))) { toast('Các tỷ lệ phải từ 0 đến 100%'); return; }
    MenuAdmin.setPoints(c);
    toast('Đã lưu cấu hình điểm');
  }

  // cập nhật khi dữ liệu đổi (kể cả từ tab khác), giữ chỗ đang gõ
  const live = () => {
    if ($m.classList.contains('hidden')) return;
    const a = document.activeElement;
    if (a && $m.contains(a) && (a.id === 'mmSearch' || a.closest('#pointsForm') || a.closest('#cornerForm') || a.closest('.modal'))) {
      if (sub === 'items') refreshItems();
      return;
    }
    render();
  };
  MenuAdmin.onChange(live);
  QuanData.onChange(() => { if (sub === 'notes') live(); });
  Promo.onChange(live);

  if (ss.get('cafehai.qtab', 'orders') === 'menu') document.querySelector('.qtabs [data-tab="menu"]').click();
})();
