// ===== Đồng bộ online bằng Firebase (Auth + Firestore) =====
// Có FIREBASE_CONFIG → đơn hàng, menu, khuyến mãi, bảng xếp hạng, tài khoản khách lưu online.
// Không có → Cloud.enabled = false, app chạy chế độ demo như cũ.
const Cloud = (() => {
  const cfg = window.FIREBASE_CONFIG;
  const enabled = !!(cfg && cfg.apiKey && window.firebase);
  const PHONE_DOMAIN = 'khach.cafehai.app';
  const ev = {};
  const on = (name, fn) => { (ev[name] = ev[name] || []).push(fn); };
  const emit = (name, data) => (ev[name] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } });

  let auth = null, db = null, FV = null;
  let user = null, profile = null, isStaff = false, ready = false;
  let unsubProfile = null;
  let scores = [];

  const phoneEmail = phone => `${String(phone).replace(/\D/g, '')}@${PHONE_DOMAIN}`;
  const isCustomerEmail = email => String(email || '').endsWith('@' + PHONE_DOMAIN);

  if (enabled) {
    try {
      firebase.initializeApp(cfg);
      auth = firebase.auth();
      db = firebase.firestore();
      FV = firebase.firestore.FieldValue;
      auth.onAuthStateChanged(async u => {
        user = u; profile = null; isStaff = false;
        if (unsubProfile) { unsubProfile(); unsubProfile = null; }
        if (u && !isCustomerEmail(u.email)) {
          try { isStaff = (await db.doc('staff/' + u.uid).get()).exists; } catch { isStaff = false; }
        }
        if (u && isCustomerEmail(u.email)) {
          unsubProfile = db.doc('customers/' + u.uid).onSnapshot(s => { profile = s.exists ? s.data() : null; emit('profile', profile); }, err => console.warn('profile', err));
        }
        ready = true;
        emit('auth', u);
      });
    } catch (e) {
      console.error('Firebase lỗi khởi tạo', e);
    }
  }

  // ----- lỗi dễ hiểu -----
  function niceError(e) {
    const c = e && e.code || '';
    if (c.includes('email-already-in-use')) return 'Số điện thoại này đã có tài khoản, bạn đăng nhập nhé.';
    if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-login')) return 'Sai số điện thoại / email hoặc mật khẩu.';
    if (c.includes('weak-password')) return 'Mật khẩu cần ít nhất 6 ký tự.';
    if (c.includes('too-many-requests')) return 'Thử sai nhiều lần quá, đợi một lát rồi thử lại nhé.';
    if (c.includes('network')) return 'Mất kết nối mạng, kiểm tra lại giúp mình.';
    if (c.includes('permission-denied')) return 'Không có quyền thực hiện thao tác này.';
    if (c.includes('api-key') || c.includes('configuration-not-found') || c.includes('operation-not-allowed')) return 'Cấu hình Firebase chưa đúng hoặc chưa bật đăng nhập Email/Password. Báo người làm web kiểm tra.';
    return (e && e.message) || 'Có lỗi xảy ra, thử lại nhé.';
  }

  // ----- tài khoản khách -----
  async function register({ name, phone, password, nick = '', hide = false }) {
    const cred = await auth.createUserWithEmailAndPassword(phoneEmail(phone), password);
    await db.doc('customers/' + cred.user.uid).set({
      name, phone: String(phone).replace(/\D/g, ''), nick, hide: !!hide, points: 0, earned: 0, createdAt: Date.now(),
    });
  }
  const login = (phone, password) => auth.signInWithEmailAndPassword(phoneEmail(phone), password);
  const staffLogin = (email, password) => auth.signInWithEmailAndPassword(email, password);
  const logout = () => auth.signOut();
  const updateProfile = patch => db.doc('customers/' + user.uid).update(patch);

  // ----- cấu hình chung (menu, khuyến mãi): ai cũng đọc, chỉ quầy ghi -----
  function watchConfig(name, fn) {
    if (!enabled) return;
    db.doc('config/' + name).onSnapshot(
      s => { let v = null; try { v = s.exists ? JSON.parse(s.data().json) : null; } catch {} fn(v); },
      err => console.warn('config/' + name, err),
    );
  }
  function saveConfig(name, value) {
    if (!enabled || !isStaff) return Promise.resolve();
    return db.doc('config/' + name).set({ json: JSON.stringify(value), at: Date.now() })
      .catch(e => { console.warn(e); emit('error', niceError(e)); });
  }

  // ----- đơn hàng -----
  const newOrderId = () => db.collection('orders').doc().id;
  const clean = o => JSON.parse(JSON.stringify(o)); // bỏ undefined
  const createOrder = o => db.doc('orders/' + o.id).set(clean(o));
  const updateOrder = (id, patch) => db.doc('orders/' + id).update(clean(patch));

  // Hoàn tất đơn: cộng điểm (trừ điểm đổi quà) và ghi bảng xếp hạng trong cùng một giao dịch
  async function completeOrder(o, patch) {
    const earned = (o.items || []).reduce((a, it) => a + (it.points || 0) * it.qty, 0);
    const redeem = o.redeem || 0;
    const orderRef = db.doc('orders/' + o.id);
    if (!o.uid) return orderRef.update(clean({ ...patch, credited: false }));
    const custRef = db.doc('customers/' + o.uid);
    return db.runTransaction(async t => {
      const [ord, cust] = await Promise.all([t.get(orderRef), t.get(custRef)]);
      if (ord.exists && ord.data().credited) { t.update(orderRef, clean(patch)); return; }
      const c = cust.exists ? cust.data() : null;
      if (redeem && (!c || (c.points || 0) < redeem)) {
        const err = new Error(`Khách không đủ điểm để đổi quà (còn ${((c && c.points) || 0).toLocaleString('vi-VN')}, cần ${redeem.toLocaleString('vi-VN')}).`);
        err.code = 'not-enough-points';
        throw err;
      }
      t.update(orderRef, clean({ ...patch, credited: true, earned }));
      if (c) t.update(custRef, { points: FV.increment(earned - redeem), earned: FV.increment(earned) });
      if (earned > 0) {
        const cups = o.items.reduce((a, it) => a + (it.points ? it.qty : 0), 0);
        const best = Math.max(0, ...o.items.map(it => it.points || 0));
        t.set(db.collection('scores').doc(), {
          pid: o.uid, name: (c && c.name) || o.customer.name, nick: (c && c.nick) || o.customer.nick || '',
          hide: !!((c && c.hide) || o.customer.hide), points: earned, cups, best, at: Date.now(), order: o.id,
        });
      }
    });
  }

  // Quầy: theo dõi các đơn gần nhất
  function watchAllOrders(fn) {
    return db.collection('orders').orderBy('createdAt', 'desc').limit(300)
      .onSnapshot(s => fn(s.docs.map(d => d.data())), err => { console.warn(err); emit('error', niceError(err)); });
  }

  // Khách: đơn theo tài khoản + các đơn đặt khi chưa đăng nhập (theo mã đơn lưu trên máy)
  let custUnsubs = [];
  function watchCustomerOrders(ids, fn) {
    custUnsubs.forEach(u => u()); custUnsubs = [];
    const byId = new Map();
    const push = () => fn([...byId.values()].sort((a, b) => b.createdAt - a.createdAt));
    if (user && isCustomerEmail(user.email)) {
      custUnsubs.push(db.collection('orders').where('uid', '==', user.uid).limit(100).onSnapshot(s => {
        s.docs.forEach(d => byId.set(d.id, d.data())); push();
      }, err => console.warn(err)));
    }
    ids.slice(0, 15).forEach(id => custUnsubs.push(db.doc('orders/' + id).onSnapshot(s => {
      if (s.exists) byId.set(id, s.data()); else byId.delete(id);
      push();
    }, () => {})));
    if (!ids.length && !user) push();
  }

  // ----- bảng xếp hạng -----
  function watchScores() {
    if (!enabled) return;
    db.collection('scores').orderBy('at', 'desc').limit(2000).onSnapshot(s => {
      scores = s.docs.map(d => d.data());
      emit('scores', scores);
    }, err => console.warn('scores', err));
  }

  return {
    enabled, on, niceError,
    get ready() { return ready; },
    get user() { return user; },
    get uid() { return user && isCustomerEmail(user.email) ? user.uid : null; },
    get profile() { return profile; },
    get isStaff() { return isStaff; },
    get scores() { return scores; },
    register, login, staffLogin, logout, updateProfile,
    watchConfig, saveConfig,
    newOrderId, createOrder, updateOrder, completeOrder, watchAllOrders, watchCustomerOrders,
    watchScores,
  };
})();
