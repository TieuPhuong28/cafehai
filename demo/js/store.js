// ===== Lưu đơn hàng (demo): localStorage, đồng bộ giữa các tab cùng máy =====
const Store = (() => {
  const KEY = 'cafehai.orders';
  const SEQ = 'cafehai.seq';
  const listeners = [];

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = list => {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
    listeners.forEach(fn => fn(list));
  };

  window.addEventListener('storage', e => {
    if (e.key === KEY) { const list = read(); listeners.forEach(fn => fn(list)); }
  });

  return {
    all: read,
    get: id => read().find(o => o.id === id),
    create(order) {
      let seq = 0;
      try { seq = (+localStorage.getItem(SEQ) || 0) + 1; localStorage.setItem(SEQ, seq); } catch {}
      const o = {
        ...order,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        code: 'H' + String(seq).padStart(3, '0'),
        status: 'moi',
        createdAt: Date.now(),
        history: [{ status: 'moi', at: Date.now() }],
      };
      write([o, ...read()]);
      return o;
    },
    setStatus(id, status) {
      write(read().map(o => o.id === id ? { ...o, status, history: [...o.history, { status, at: Date.now() }] } : o));
    },
    clear() { try { localStorage.removeItem(KEY); localStorage.removeItem(SEQ); } catch {} write([]); },
    subscribe(fn) { listeners.push(fn); },
  };
})();

const STATUS = {
  moi:  { label: 'Chờ quán xác nhận', short: 'Mới' },
  pha:  { label: 'Đang pha chế',       short: 'Đang pha' },
  giao: { label: 'Đang giao hàng',     short: 'Đang giao' },
  san:  { label: 'Sẵn sàng, mời bạn đến lấy', short: 'Chờ lấy' },
  xong: { label: 'Hoàn tất',           short: 'Xong' },
  huy:  { label: 'Đơn đã bị hủy',      short: 'Đã hủy' },
};
