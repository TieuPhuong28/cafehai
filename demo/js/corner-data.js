// ===== Góc quán của tôi: dữ liệu, cửa hàng đồ, cấp quán, cộng xu =====
// Dùng chung cho app khách và màn hình quầy. Xem KE-HOACH-GOC-QUAN.md.
//
// Một góc quán (doc) gồm:
//   xu      tổng xu đã nhận (chỉ quầy cộng khi hoàn tất đơn)
//   spent   tổng xu đã tiêu mua đồ → xu còn lại = xu - spent
//   owned   { mã đồ: số lượng đã mua }  (đồ khởi điểm STARTER không nằm ở đây)
//   layout  [{ i: mã đồ, s: 'f0'..'f15' (ô sàn) | 'w0'..'w7' (ô tường), f: 1 nếu lật ngang }]
//   stats   { orders, game, cafe, juice, qua, chai, khac, coldbrew, tra, kakao }  số món thật đã mua
//   firsts  { cafe: true, ... }  đã nhận thưởng món đầu tiên của loại đó
//   gifts   { '3': mã đơn }      quà mốc cấp đã nhận
const CornerData = (() => {
  const GRID = 4;               // góc quán 4×4 ô
  const WALL_SLOTS = 8;         // 4 ô tường trái + 4 ô tường phải

  // Cấp quán theo tổng điểm "Phong cách" của đồ đã sở hữu
  const LEVELS = [0, 25, 55, 90, 130];   // cấp 1..5
  const MAX_LEVEL = LEVELS.length;

  // Các loại món thật để mở khóa đồ và thưởng "món đầu tiên"
  const KINDS = {
    cafe:     'ly cà phê',
    juice:    'ly nước ép',
    qua:      'túi/hộp hoa quả',
    chai:     'chai cà phê',
    khac:     'món trà & khác',
    coldbrew: 'ly Coldbrew',
    tra:      'ly trà',
    kakao:    'ly Kakao',
    orders:   'đơn hoàn tất',
    game:     'ly tự tay pha/cắt',
  };
  const FIRST_KINDS = ['cafe', 'juice', 'qua', 'chai', 'khac'];

  const GROUPS = [
    { id: 'seat',    name: 'Bàn ghế',   icon: '🪑' },
    { id: 'deco',    name: 'Trang trí', icon: '🪴' },
    { id: 'machine', name: 'Máy móc',   icon: '⚙️', note: 'Cần mua món thật tương ứng' },
    { id: 'special', name: 'Đặc biệt',  icon: '✨', note: 'Mở khóa theo thành tích' },
  ];

  // Cửa hàng đồ. place: floor (ô sàn) | wall (ô tường). seat: khách ảo ngồi được.
  // need/needN: cần đã mua needN món thật loại need. max: số lượng tối đa được mua.
  const ITEMS = [
    // --- Bàn ghế ---
    { id: 'ghe_xep',   name: 'Ghế xếp đen',        group: 'seat', place: 'floor', price: 10,  style: 2,  max: 4, seat: true, desc: 'Như ghế trước cửa quán thật' },
    { id: 'ban_go',    name: 'Bàn gỗ nhỏ',          group: 'seat', place: 'floor', price: 15,  style: 2,  max: 3 },
    { id: 'ghe_dau',   name: 'Ghế đẩu nhựa đỏ',     group: 'seat', place: 'floor', price: 20,  style: 4,  max: 4, seat: true },
    { id: 'ban_tron',  name: 'Bàn tròn mặt đá',     group: 'seat', place: 'floor', price: 40,  style: 8,  max: 2 },
    { id: 'ghe_may',   name: 'Ghế gỗ tựa lưng',     group: 'seat', place: 'floor', price: 50,  style: 10, max: 4, seat: true, emoji: '🪑' },
    { id: 'sofa',      name: 'Sofa nâu',            group: 'seat', place: 'floor', price: 120, style: 24, max: 1, seat: true, emoji: '🛋️' },
    { id: 'quay_bar',  name: 'Quầy bar mini',       group: 'seat', place: 'floor', price: 150, style: 30, max: 1 },
    { id: 'xich_du',   name: 'Xích đu gỗ',          group: 'seat', place: 'floor', price: 180, style: 36, max: 1, seat: true },
    // --- Trang trí ---
    { id: 'xuong_rong', name: 'Chậu xương rồng',    group: 'deco', place: 'floor', price: 10, style: 2,  max: 2, emoji: '🌵' },
    { id: 'cay_xanh',  name: 'Chậu cây xanh',       group: 'deco', place: 'floor', price: 15, style: 3,  max: 2, emoji: '🪴' },
    { id: 'huong_duong', name: 'Lọ hướng dương',    group: 'deco', place: 'floor', price: 25, style: 5,  max: 2, emoji: '🌻' },
    { id: 'hoa_giay',  name: 'Chậu hoa giấy',       group: 'deco', place: 'floor', price: 30, style: 6,  max: 2, emoji: '🌺' },
    { id: 'radio',     name: 'Radio cũ',            group: 'deco', place: 'floor', price: 45, style: 9,  max: 1, emoji: '📻' },
    { id: 'meo',       name: 'Mèo của quán',        group: 'deco', place: 'floor', price: 60, style: 12, max: 1, emoji: '🐈' },
    { id: 'ke_sach',   name: 'Chồng sách',          group: 'deco', place: 'floor', price: 70, style: 14, max: 1, emoji: '📚' },
    { id: 'poster_co', name: 'Poster cờ đỏ sao vàng', group: 'deco', place: 'wall', price: 20, style: 4,  max: 2, desc: 'Như poster trên cửa kính quán' },
    { id: 'den_treo',  name: 'Bóng đèn treo',       group: 'deco', place: 'wall',  price: 25, style: 5,  max: 2, emoji: '💡' },
    { id: 'den_long',  name: 'Đèn lồng',            group: 'deco', place: 'wall',  price: 30, style: 6,  max: 2, emoji: '🏮' },
    { id: 'khung_anh', name: 'Khung ảnh',           group: 'deco', place: 'wall',  price: 35, style: 7,  max: 2, emoji: '🖼️' },
    { id: 'dong_ho',   name: 'Đồng hồ treo tường',  group: 'deco', place: 'wall',  price: 40, style: 8,  max: 1, emoji: '🕰️' },
    { id: 'dan',       name: 'Đàn guitar',          group: 'deco', place: 'wall',  price: 55, style: 11, max: 1, emoji: '🎸' },
    // --- Máy móc: cần mua món thật ---
    { id: 'phin',      name: 'Bộ phin nhôm',        group: 'machine', place: 'floor', price: 40,  style: 10, max: 1, need: 'cafe', needN: 3 },
    { id: 'am_tra',    name: 'Ấm trà',              group: 'machine', place: 'floor', price: 50,  style: 10, max: 1, need: 'tra', needN: 2, emoji: '🫖' },
    { id: 'may_xay',   name: 'Máy xay cà phê',      group: 'machine', place: 'floor', price: 80,  style: 16, max: 1, need: 'cafe', needN: 8 },
    { id: 'may_ep',    name: 'Máy ép',              group: 'machine', place: 'floor', price: 90,  style: 18, max: 1, need: 'juice', needN: 3, icon: '🍹' },
    { id: 'coldbrew',  name: 'Bình cold brew',      group: 'machine', place: 'floor', price: 90,  style: 18, max: 1, need: 'coldbrew', needN: 2 },
    { id: 'tu_chai',   name: 'Tủ cà phê chai',      group: 'machine', place: 'floor', price: 100, style: 20, max: 1, need: 'chai', needN: 1 },
    { id: 'tu_qua',    name: 'Tủ lạnh trái cây',    group: 'machine', place: 'floor', price: 120, style: 24, max: 1, need: 'juice', needN: 6 },
    // --- Đặc biệt: theo thành tích ---
    { id: 'quay_qua',  name: 'Quầy hoa quả',        group: 'special', place: 'floor', price: 100, style: 22, max: 1, need: 'qua', needN: 1 },
    { id: 'ke_ly',     name: 'Kệ ly in logo H',     group: 'special', place: 'wall',  price: 80,  style: 16, max: 1, need: 'orders', needN: 5 },
    { id: 'bang_vang', name: 'Bảng vàng mini',      group: 'special', place: 'wall',  price: 100, style: 20, max: 1, need: 'game', needN: 10 },
    { id: 'bien_h',    name: 'Biển H phát sáng',    group: 'special', place: 'wall',  price: 150, style: 30, max: 1, need: 'orders', needN: 10 },
  ];
  const ITEM = Object.fromEntries(ITEMS.map(it => [it.id, it]));
  const STARTER = { ghe_xep: 2, ban_go: 1 };
  const STARTER_LAYOUT = [{ i: 'ban_go', s: 'f5' }, { i: 'ghe_xep', s: 'f4' }, { i: 'ghe_xep', s: 'f9', f: 1 }];

  // Cấu hình quầy chỉnh được (lưu cùng menu ở MenuAdmin)
  const CFG_DEFAULT = { enabled: true, rate: 1, firstBonus: 30, gifts: { 3: 'trachanh', 5: 'nau' } };
  const cfg = () => {
    const c = (typeof MenuAdmin !== 'undefined' && MenuAdmin.load().corner) || {};
    return { ...CFG_DEFAULT, ...c, gifts: { ...CFG_DEFAULT.gifts, ...(c.gifts || {}) } };
  };
  const GIFT_LEVELS = [3, 5];

  const emptyDoc = () => ({ xu: 0, spent: 0, owned: {}, layout: STARTER_LAYOUT.map(x => ({ ...x })), stats: {}, firsts: {}, gifts: {} });
  const normalize = d => {
    const e = emptyDoc();
    if (!d) return e;
    return { ...e, ...d, owned: { ...(d.owned || {}) }, stats: { ...(d.stats || {}) }, firsts: { ...(d.firsts || {}) }, gifts: { ...(d.gifts || {}) }, layout: Array.isArray(d.layout) ? d.layout : e.layout };
  };

  // ----- tính toán -----
  const count = (doc, id) => (doc.owned[id] || 0) + (STARTER[id] || 0);
  const placed = (doc, id) => doc.layout.filter(x => x.i === id).length;
  const free = (doc, id) => count(doc, id) - placed(doc, id);
  const balance = doc => Math.max(0, (doc.xu || 0) - (doc.spent || 0));
  const style = doc => ITEMS.reduce((a, it) => a + it.style * count(doc, it.id), 0);
  function level(doc) {
    const s = style(doc);
    let lv = 1;
    LEVELS.forEach((need, k) => { if (s >= need) lv = k + 1; });
    return lv;
  }
  function progress(doc) {
    const s = style(doc), lv = level(doc);
    if (lv >= MAX_LEVEL) return { lv, style: s, pct: 100, next: null };
    const a = LEVELS[lv - 1], b = LEVELS[lv];
    return { lv, style: s, pct: Math.round((s - a) / (b - a) * 100), next: b, left: b - s };
  }
  const unlocked = (doc, it) => !it.need || (doc.stats[it.need] || 0) >= it.needN;
  const lockText = (doc, it) => it.need ? `Cần ${it.needN} ${KINDS[it.need]} · đã có ${Math.min(it.needN, doc.stats[it.need] || 0)}/${it.needN}` : '';
  function canBuy(doc, it) {
    if (!it || !it.price) return { ok: false, why: 'Đồ khởi điểm, không bán' };
    if (!unlocked(doc, it)) return { ok: false, why: lockText(doc, it) };
    if (count(doc, it.id) >= it.max) return { ok: false, why: 'Đã đủ số lượng tối đa' };
    if (balance(doc) < it.price) return { ok: false, why: `Thiếu ${it.price - balance(doc)} xu` };
    return { ok: true };
  }
  const unlockedIds = doc => ITEMS.filter(it => it.need && unlocked(doc, it)).map(it => it.id);

  // Món thật → các loại (để mở khóa & thưởng món đầu tiên)
  const findDrink = id => (typeof MenuAdmin !== 'undefined' ? MenuAdmin.adminList().find(d => d.id === id) : null) || MENU.find(d => d.id === id);
  function kindsOf(it) {
    const d = findDrink(it.id);
    const cat = d ? d.cat : '';
    const out = [];
    if (cat === 'cafe') out.push('cafe');
    if (cat === 'ep' || cat === 'ketp' || it.id === 'mix') out.push('juice');
    else if (cat === 'khac') out.push('khac');
    if (cat === 'qua') out.push('qua');
    if (cat === 'chai') out.push('chai');
    if (['cbchanh', 'cbsau'].includes(it.id)) out.push('coldbrew');
    if (['trachanh', 'traquat'].includes(it.id)) out.push('tra');
    if (['kakao', 'kakaomuoi'].includes(it.id)) out.push('kakao');
    return out;
  }

  // Tính phần cộng cho góc quán khi quầy hoàn tất đơn. Trả về doc mới + chi tiết, hoặc ném lỗi nếu quà không hợp lệ.
  function credit(order, doc0, c = cfg()) {
    const doc = normalize(doc0);
    const paid = (order.items || []).filter(it => !it.reward);
    const gain = { xu: 0, base: 0, firsts: [], unlocked: [] };
    gain.base = Math.max(0, Math.round((order.total || 0) * c.rate));
    const before = unlockedIds(doc);
    const stats = { ...doc.stats };
    stats.orders = (stats.orders || 0) + 1;
    paid.forEach(it => {
      kindsOf(it).forEach(k => { stats[k] = (stats[k] || 0) + it.qty; });
      if (it.played) stats.game = (stats.game || 0) + it.qty;
    });
    const firsts = { ...doc.firsts };
    FIRST_KINDS.forEach(k => {
      if (!firsts[k] && (stats[k] || 0) > (doc.stats[k] || 0)) { firsts[k] = true; gain.firsts.push(k); }
    });
    const gifts = { ...doc.gifts };
    (order.cornerGifts || []).forEach(L => {
      if (gifts[L]) throw Object.assign(new Error(`Khách đã nhận quà Góc quán cấp ${L} rồi.`), { code: 'corner-gift' });
      if (level(doc) < L) throw Object.assign(new Error(`Góc quán của khách chưa đạt cấp ${L}, chưa nhận được quà.`), { code: 'corner-gift' });
      gifts[L] = order.id;
    });
    gain.xu = gain.base + gain.firsts.length * c.firstBonus;
    const next = { ...doc, xu: (doc.xu || 0) + gain.xu, stats, firsts, gifts };
    gain.unlocked = unlockedIds(next).filter(id => !before.includes(id));
    return { doc: next, gain };
  }

  // Ước lượng xu của một giỏ/đơn (hiển thị trước khi hoàn tất)
  const estimate = total => Math.max(0, Math.round((total || 0) * cfg().rate));

  // ----- lưu trữ bản demo (localStorage, đồng bộ giữa các tab) -----
  const LKEY = 'cafehai.corners';
  const localAll = () => { try { return JSON.parse(localStorage.getItem(LKEY)) || {}; } catch { return {}; } };
  const localGet = key => normalize(localAll()[key]);
  const localSet = (key, doc) => { const all = localAll(); all[key] = doc; try { localStorage.setItem(LKEY, JSON.stringify(all)); } catch {} };
  const phoneKey = phone => String(phone || '').replace(/\D/g, '');

  // Quầy (bản demo) hoàn tất đơn → cộng xu cho góc quán theo số điện thoại
  function creditLocal(order) {
    if (!cfg().enabled) return null;
    const key = phoneKey(order.customer && order.customer.phone);
    if (!key) return null;
    const all = localAll();
    if ((all[key] && all[key].done || []).includes(order.id)) return null;
    const res = credit(order, all[key]);
    res.doc.done = [...(all[key] && all[key].done || []), order.id].slice(-200);
    localSet(key, res.doc);
    return res.gain;
  }

  return {
    GRID, WALL_SLOTS, LEVELS, MAX_LEVEL, KINDS, FIRST_KINDS, GROUPS, ITEMS, ITEM, STARTER, GIFT_LEVELS, CFG_DEFAULT,
    cfg, emptyDoc, normalize, count, placed, free, balance, style, level, progress, unlocked, lockText, canBuy, unlockedIds,
    kindsOf, credit, estimate, localAll, localGet, localSet, phoneKey, creditLocal,
  };
})();
