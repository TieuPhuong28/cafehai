// ===== Menu do quầy quản lý: hết hàng, ẩn món, đổi giá, món mới, hoa quả hôm nay =====
// Lưu trong trình duyệt (bản demo) và đồng bộ ngay giữa màn hình quầy với app khách.
const MenuAdmin = (() => {
  const KEY = 'cafehai.menuAdmin';
  const BASE = MENU.map(d => ({ ...d })); // menu gốc trong menu.js
  const listeners = [];

  const empty = () => ({ soldOut: {}, hidden: {}, price: {}, isNew: {}, fruitOut: {}, sale: {}, featured: {}, points: null, rewards: null, custom: [] });
  function load() {
    try { return { ...empty(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return empty(); }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
    apply();
    listeners.forEach(fn => fn());
    if (typeof Cloud !== 'undefined' && Cloud.enabled) Cloud.saveConfig('menu', s);
  }
  const update = fn => { const s = load(); fn(s); save(s); };

  // Tất cả loại quả (nước ép + hoa quả cắt)
  function allFruits() {
    const out = {};
    Object.entries(FRUIT).forEach(([k, f]) => { out[k] = { name: f.name, icon: f.icon, svg: f.svg ? FRUIT_SVG[f.svg] : null }; });
    if (typeof CUT_FRUIT !== 'undefined') Object.entries(CUT_FRUIT).forEach(([k, f]) => { if (!out[k]) out[k] = { name: f.name, icon: f.icon, svg: f.svg || null }; });
    return out;
  }
  const fruitOut = k => !!load().fruitOut[k];

  // Món tự thêm → món đầy đủ
  function toItem(c) {
    const base = c.base && c.base !== 'plain' ? BASE.find(b => b.id === c.base) : null;
    return {
      id: c.id, name: c.name, price: c.price, cat: c.cat, custom: true, base: c.base || '',
      intro: c.intro || '', hot: base ? base.hot : false,
      steps: base ? base.steps : [],
      simpleOpts: !base && c.base !== 'plain',
    };
  }

  function outReason(d, s) {
    if (s.soldOut[d.id]) return 'Hết hàng';
    const fr = d.steps.find(x => x.type === 'fruit');
    if (fr && !fr.free) {
      const out = fr.fruits.filter(k => s.fruitOut[k]);
      if (out.length) return `Hết ${out.map(k => FRUIT[k].name.toLowerCase()).join(', ')}`;
    }
    if (fr && fr.free && Object.keys(FRUIT).every(k => s.fruitOut[k])) return 'Hết hoa quả';
    if (d.box) {
      const avail = Object.keys(CUT_FRUIT).filter(k => !s.fruitOut[k]).length;
      if (avail < d.box.kinds) return `Chỉ còn ${avail} loại quả`;
    }
    return '';
  }

  function apply() {
    const s = load();
    const list = [];
    BASE.concat(s.custom.map(toItem)).forEach(d0 => {
      if (s.hidden[d0.id]) return;
      const d = { ...d0 };
      if (s.price[d.id]) d.price = s.price[d.id];
      d.isNew = !!s.isNew[d.id];
      d.sale = s.sale[d.id] && s.sale[d.id] < d.price ? s.sale[d.id] : null;
      d.featured = !!s.featured[d.id];
      d.outReason = outReason(d, s);
      d.soldOut = !!d.outReason;
      list.push(d);
    });
    MENU.length = 0;
    list.forEach(d => MENU.push(d));
    Object.assign(POINT_CFG, POINT_DEFAULT, s.points || {});
  }

  // Thông tin để quầy hiển thị (gồm cả món đang ẩn)
  function adminList() {
    const s = load();
    return BASE.concat(s.custom.map(toItem)).map(d => ({
      ...d,
      price: s.price[d.id] || d.price,
      basePrice: d.price,
      hidden: !!s.hidden[d.id],
      soldOutManual: !!s.soldOut[d.id],
      isNew: !!s.isNew[d.id],
      sale: s.sale[d.id] || null,
      featured: !!s.featured[d.id],
      outReason: outReason(d, s),
    }));
  }

  window.addEventListener('storage', e => {
    if (e.key === KEY) { apply(); listeners.forEach(fn => fn(true)); }
  });

  apply();

  // Chế độ online: menu lấy từ Firestore (quầy ghi, khách đọc)
  if (typeof Cloud !== 'undefined' && Cloud.enabled) {
    Cloud.watchConfig('menu', v => {
      try { localStorage.setItem(KEY, JSON.stringify(v || empty())); } catch {}
      apply();
      listeners.forEach(fn => fn(true));
    });
  }

  // Quà đổi bằng điểm (quầy chỉnh được)
  const DEFAULT_REWARDS = [
    { id: 'r1', itemId: 'nau', cost: 20000 },
    { id: 'r2', itemId: 'xiumuoi', cost: 25000 },
    { id: 'r3', itemId: 'tuinho', cost: 30000 },
  ];
  const rewards = () => load().rewards || DEFAULT_REWARDS;

  return {
    rewards,
    setRewards: list => update(s => { s.rewards = list; }),
    load, update, apply, adminList, allFruits, fruitOut, BASE,
    onChange: fn => listeners.push(fn),
    setSoldOut: (id, v) => update(s => { v ? (s.soldOut[id] = true) : delete s.soldOut[id]; }),
    setHidden: (id, v) => update(s => { v ? (s.hidden[id] = true) : delete s.hidden[id]; }),
    setNew: (id, v) => update(s => { v ? (s.isNew[id] = true) : delete s.isNew[id]; }),
    setPrice: (id, p) => update(s => {
      const base = BASE.find(b => b.id === id);
      const c = s.custom.find(x => x.id === id);
      if (c) c.price = p;
      else if (base && base.price === p) delete s.price[id];
      else s.price[id] = p;
    }),
    setSale: (id, k) => update(s => { k ? (s.sale[id] = k) : delete s.sale[id]; }),
    setFeatured: (id, v) => update(s => { v ? (s.featured[id] = true) : delete s.featured[id]; }),
    setPoints: cfg => update(s => { s.points = cfg; }),
    resetPoints: () => update(s => { s.points = null; }),
    setFruitOut: (k, v) => update(s => { v ? (s.fruitOut[k] = true) : delete s.fruitOut[k]; }),
    addItem: item => update(s => {
      const id = 'm' + Date.now().toString(36);
      s.custom.push({ id, ...item });
      if (item.isNew) s.isNew[id] = true;
    }),
    removeItem: id => update(s => {
      s.custom = s.custom.filter(c => c.id !== id);
      delete s.isNew[id]; delete s.soldOut[id]; delete s.hidden[id]; delete s.sale[id]; delete s.featured[id];
    }),
    resetDay: () => update(s => { s.soldOut = {}; s.fruitOut = {}; }),
    resetAll: () => save(empty()),
  };
})();

// Tùy chọn cho món tự thêm không có game
const SIMPLE_OPTS = () => [
  { label: 'Đường', value: '100% đường', choices: SUGAR },
  { label: 'Đá', value: 'Vừa đá', choices: ICE_LEVELS },
];
