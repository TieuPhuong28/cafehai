// ===== Khuyến mãi & deal: quầy tạo, app khách tự áp giá =====
// Loại: discount (giảm giá món/nhóm, có thể theo khung giờ), combo (mua đủ bộ → giá combo), info (chỉ thông báo).
const Promo = (() => {
  const findItem = id => MENU.find(d => d.id === id);
  const KEY = 'cafehai.promos';
  const listeners = [];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = list => {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
    listeners.forEach(fn => fn(false));
    if (typeof Cloud !== 'undefined' && Cloud.enabled) Cloud.saveConfig('promos', list);
  };
  if (typeof Cloud !== 'undefined' && Cloud.enabled) {
    Cloud.watchConfig('promos', v => {
      try { localStorage.setItem(KEY, JSON.stringify(v || [])); } catch {}
      listeners.forEach(fn => fn(true));
    });
  }
  window.addEventListener('storage', e => { if (e.key === KEY) listeners.forEach(fn => fn(true)); });

  // ----- khung giờ -----
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  function inHours(p, now = new Date()) {
    if (!p.from || !p.to) return true;
    const m = now.getHours() * 60 + now.getMinutes(), a = toMin(p.from), b = toMin(p.to);
    return a <= b ? m >= a && m < b : m >= a || m < b;
  }
  const live = p => p.active && inHours(p);
  function status(p) {
    if (!p.active) return 'Đang tắt';
    if (!p.from || !p.to) return 'Cả ngày';
    return inHours(p) ? `Đang diễn ra · đến ${p.to}` : `Khung giờ ${p.from}–${p.to}`;
  }

  // ----- mô tả -----
  function targetName(p) {
    if (p.cat) return `cả nhóm ${CATS.find(c => c.id === p.cat)?.name || p.cat}`;
    return (p.items || []).map(id => findItem(id)?.name || MenuAdmin.adminList().find(d => d.id === id)?.name || id).join(', ');
  }
  const offText = p => (p.mode === 'pct' ? `giảm ${p.value}%` : `giảm ${p.value}K`);
  const comboBase = p => p.items.reduce((a, x) => a + (findItem(x.id)?.price || 0) * x.qty, 0);
  function describe(p) {
    if (p.type === 'discount') return `${targetName(p)} ${offText(p)}`;
    if (p.type === 'combo') return `${p.items.map(x => `${x.qty > 1 ? x.qty + '× ' : ''}${findItem(x.id)?.name || '?'}`).join(' + ')} chỉ ${p.price}K (thường ${comboBase(p)}K)`;
    return p.desc || '';
  }

  // ----- giá -----
  const appliesTo = (p, d) => p.type === 'discount' && (p.cat ? p.cat === d.cat : (p.items || []).includes(d.id));
  function unitPrice(d) {
    let best = d.price, promo = null;
    if (d.sale && d.sale < best) { best = d.sale; promo = { title: 'Giá giảm của quán' }; }
    load().filter(p => live(p) && appliesTo(p, d)).forEach(p => {
      const v = Math.max(0, p.mode === 'pct' ? Math.round(d.price * (100 - p.value) / 100) : d.price - p.value);
      if (v < best) { best = v; promo = p; }
    });
    return { price: best, base: d.price, promo };
  }

  // Tính giá cả giỏ: combo trước (tiết kiệm nhiều nhất trước), phần còn lại áp giảm giá món
  function price(cart) {
    const pool = cart.filter(it => !it.reward).map(it => ({ it, d: findItem(it.id), left: it.qty }));
    const combos = [];
    load().filter(p => p.type === 'combo' && live(p) && p.items.every(x => findItem(x.id) && !findItem(x.id).soldOut))
      .map(p => ({ p, saving: comboBase(p) - p.price }))
      .filter(x => x.saving > 0)
      .sort((a, b) => b.saving - a.saving)
      .forEach(({ p, saving }) => {
        const times = Math.min(...p.items.map(x => Math.floor(pool.filter(e => e.it.id === x.id).reduce((a, e) => a + e.left, 0) / x.qty)));
        if (times <= 0) return;
        p.items.forEach(x => {
          let need = x.qty * times;
          pool.filter(e => e.it.id === x.id).forEach(e => { const take = Math.min(e.left, need); e.left -= take; need -= take; });
        });
        combos.push({ id: p.id, title: p.title, times, saving: saving * times });
      });
    let subtotal = 0, itemDiscount = 0;
    const lines = {};
    pool.forEach(e => {
      const base = e.d ? e.d.price : e.it.price;
      const u = e.d ? unitPrice(e.d) : { price: base, promo: null };
      const disc = (base - u.price) * e.left;
      subtotal += base * e.it.qty;
      itemDiscount += disc;
      lines[e.it.uid] = { base, unit: u.price, promo: disc > 0 ? u.promo.title : null, inCombo: e.it.qty - e.left, total: base * e.it.qty - disc };
    });
    cart.filter(it => it.reward).forEach(it => { lines[it.uid] = { base: 0, unit: 0, promo: null, inCombo: 0, total: 0 }; });
    const comboDiscount = combos.reduce((a, c) => a + c.saving, 0);
    return { lines, combos, subtotal, itemDiscount, comboDiscount, discount: itemDiscount + comboDiscount, total: subtotal - itemDiscount - comboDiscount };
  }

  // ----- mẫu cho bản demo -----
  function addSamples() {
    const list = load();
    const id = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    list.push(
      { id: id(), type: 'discount', title: 'Giờ vàng cà phê', emoji: '⏰', items: ['nau', 'den'], mode: 'k', value: 5, from: '14:00', to: '16:00', active: true, sample: true },
      { id: id(), type: 'discount', title: 'Nước ép giảm 10%', emoji: '🍹', cat: 'ep', mode: 'pct', value: 10, active: true, sample: true },
      { id: id(), type: 'combo', title: 'Combo Nâu + Túi quả', emoji: '🍉', items: [{ id: 'nau', qty: 1 }, { id: 'tuinho', qty: 1 }], price: 45, active: true, sample: true },
      { id: id(), type: 'combo', title: 'Rủ bạn: 2 Xỉu Muối', emoji: '👯', items: [{ id: 'xiumuoi', qty: 2 }], price: 45, active: true, sample: true },
      { id: id(), type: 'info', title: 'Hộp quả gọt mới', emoji: '📣', desc: 'Đặt hộp quả trước 30–60 phút để quán gọt mới cho bạn nhé!', active: true, sample: true },
    );
    save(list);
  }

  return {
    load, save, live, status, describe, offText, comboBase, unitPrice, price, inHours, addSamples,
    onChange: fn => listeners.push(fn),
    add: p => save(load().concat([{ id: 'p' + Date.now().toString(36), active: true, ...p }])),
    toggle: id => save(load().map(p => (p.id === id ? { ...p, active: !p.active } : p))),
    remove: id => save(load().filter(p => p.id !== id)),
    // những gì hiện ở quầy thông tin
    board() {
      const all = load().filter(p => p.active);
      return {
        featured: MENU.filter(d => d.featured && !d.soldOut),
        news: MENU.filter(d => d.isNew && !d.soldOut && !d.featured),
        discounts: all.filter(p => p.type === 'discount'),
        combos: all.filter(p => p.type === 'combo' && p.items.every(x => findItem(x.id))),
        infos: all.filter(p => p.type === 'info'),
      };
    },
  };
})();
