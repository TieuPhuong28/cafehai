// ===== Lưu đơn hàng =====
// Chế độ demo: localStorage, đồng bộ giữa các tab cùng máy.
// Chế độ online (có Firebase): đơn lưu trên Firestore, mọi máy thấy nhau.
const Store = (() => {
  const KEY = 'cafehai.orders';
  const SEQ = 'cafehai.seq';
  const listeners = [];
  const online = () => typeof Cloud !== 'undefined' && Cloud.enabled;
  let cache = []; // dữ liệu online gần nhất

  const local = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const read = () => (online() ? cache : local());
  const notify = list => listeners.forEach(fn => fn(list));
  const writeLocal = list => {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
    notify(list);
  };

  window.addEventListener('storage', e => {
    if (!online() && e.key === KEY) notify(local());
  });

  const reportError = e => {
    const msg = typeof Cloud !== 'undefined' ? Cloud.niceError(e) : String(e);
    if (typeof toast === 'function') toast('⚠️ ' + msg);
  };

  return {
    all: read,
    get: id => read().find(o => o.id === id),
    online,
    // Cloud gọi khi có dữ liệu mới
    setCloud(list) { cache = list; notify(list); },
    create(order) {
      const now = Date.now();
      let id, code;
      if (online()) {
        id = Cloud.newOrderId();
        code = 'H' + Math.random().toString(36).slice(2, 6).toUpperCase();
      } else {
        let seq = 0;
        try { seq = (+localStorage.getItem(SEQ) || 0) + 1; localStorage.setItem(SEQ, seq); } catch {}
        id = now.toString(36) + Math.random().toString(36).slice(2, 6);
        code = 'H' + String(seq).padStart(3, '0');
      }
      const o = { uid: null, ...order, id, code, status: 'moi', createdAt: now, history: [{ status: 'moi', at: now }] };
      if (online()) {
        cache = [o, ...cache.filter(x => x.id !== id)];
        notify(cache);
        Cloud.createOrder(o).catch(reportError);
      } else writeLocal([o, ...local()]);
      return o;
    },
    async setStatus(id, status) {
      const o = read().find(x => x.id === id);
      if (!o) return;
      const patch = { status, history: [...o.history, { status, at: Date.now() }] };
      if (online()) {
        try {
          if (status === 'xong') await Cloud.completeOrder(o, patch);
          else await Cloud.updateOrder(id, patch);
        } catch (e) { reportError(e); }
      } else writeLocal(local().map(x => (x.id === id ? { ...x, ...patch } : x)));
    },
    clear() {
      if (online()) return;
      try { localStorage.removeItem(KEY); localStorage.removeItem(SEQ); } catch {}
      writeLocal([]);
    },
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
