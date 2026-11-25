// ===== Quán chung Cafe Hải: dữ liệu (dùng chung cho app khách và màn hình quầy) =====
// Bản thử: lời nhắn, kỷ lục mini game và khách mẫu lưu localStorage (chế độ demo).
// Bản online: khách ngồi trong quán lấy từ bảng xếp hạng (scores) hôm nay; lời nhắn & kỷ lục làm ở bước sau.
const QuanData = (() => {
  const K_NOTES = 'cafehai.notes', K_REC = 'cafehai.quanRec', K_SEED = 'cafehai.quanSeed';
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const online = () => typeof Cloud !== 'undefined' && Cloud.enabled;
  const phoneKey = p => String(p || '').replace(/\D/g, '');
  const DAY = 864e5;

  // Bàn trong quán: mỗi bàn một trò. Tên bàn sửa theo quán thật.
  const TABLES = [
    { id: 'bar',    name: 'Quầy bar',     game: 'brew', icon: '☕', title: 'Tự pha một ly',     desc: 'Pha món thật trong menu, điểm lên bảng vàng' },
    { id: 'window', name: 'Bàn cửa sổ',   game: 'quiz', icon: '❓', title: 'Đố vui Cafe Hải',   desc: '6 câu về menu quán, trả lời càng nhanh càng nhiều điểm' },
    { id: 'long',   name: 'Bàn dài',      game: 'memo', icon: '🃏', title: 'Lật thẻ ghép món',  desc: 'Ghép 6 cặp món, càng ít lượt càng cao điểm' },
    { id: 'fruit',  name: 'Góc trái cây', game: 'cut',  icon: '🍉', title: 'Cắt hoa quả',       desc: 'Chọn hộp hoa quả rồi tự tay cắt' },
  ];
  const SEATS = 3;
  const SCORED = ['quiz', 'memo'];

  // Hạng VIP theo tổng chi tiêu thật (đơn vị nghìn đồng), không mua bằng xu
  const VIP = [
    { id: 'dong', name: 'Đồng', min: 200,  color: '#b87333', hat: 'cap' },
    { id: 'bac',  name: 'Bạc',  min: 1000, color: '#8f9aa3', hat: 'beret' },
    { id: 'vang', name: 'Vàng', min: 3000, color: '#e0a800', hat: 'crown' },
  ];
  const vipOf = spend => VIP.filter(v => spend >= v.min).pop() || null;
  const nextVip = spend => VIP.find(v => spend < v.min) || null;

  const dayStart = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const weekStart = () => { const d = new Date(dayStart()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const hash = s => Array.from(String(s)).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const HIDDEN = 'Khách bí ẩn 🕶️';
  const nameOf = c => (c.hide ? HIDDEN : (c.nick || c.name || 'Khách'));

  // ---------- khách mẫu (demo) ----------
  const seed = () => get(K_SEED, null);
  // Trang phục khách mẫu (mã đồ trong Outfit.ITEMS)
  const SEED_WEAR = {
    s1: { hat: 'vuong_mien', top: 'ao_dai', bottom: 'quan_lua', shoes: 'guoc', acc: 'hoa_cai' },
    s2: { hat: 'mu_phot', top: 'khoac_h', bottom: 'kaki', shoes: 'giay_vai', acc: 'kinh_ram' },
    s3: { hat: 'cap_dong', top: 'thun_cam', bottom: 'vay_xoe', shoes: 'sneaker', acc: 'tui_tote' },
    s4: { hat: 'mu_len', top: 'hoodie', bottom: 'jean', shoes: 'sneaker', acc: 'tai_nghe' },
    s5: { hat: 'non_la', top: 'ao_soc', bottom: 'short', shoes: 'dep_to_ong', acc: null },
    s6: { hat: 'mu_noi', top: 'tap_de', bottom: 'ong_rong', shoes: 'boot', acc: 'khan' },
    s7: { hat: null, top: 'so_mi', bottom: 'vay_xoe', shoes: 'guoc', acc: 'hoa_cai' },
  };
  function addSeeds() {
    const t0 = dayStart(), now = Date.now();
    const at = k => Math.min(now - 60e3, t0 + 7 * 36e5 + k * 47 * 60e3);
    const g = [
      ['s1', 'Minh Anh', 'xiumuoi', 3400], ['s2', 'Tuấn', 'den', 1250], ['s3', 'Hoa', 'cam', 420], ['s4', 'Quang Huy', 'cbchanh', 260],
      ['s5', 'Thảo', 'xiucotdua', 90], ['s6', 'Long', 'nau', 1800], ['s7', 'Ngọc', 'kakaomuoi', 30],
    ].map(([key, name, drink, spend], k) => ({ key, name, drink, spend, at: at(k), seed: true, wear: SEED_WEAR[key] }));
    put(K_SEED, { guests: g, at: now });
    const notes = get(K_NOTES, []).filter(n => !n.seed);
    const N = (id, key, name, text, color, icon, ago, extra = {}) => ({ id, key, name, text, color, icon, at: now - ago, status: 'ok', pin: false, reply: '', likes: {}, seed: true, ...extra });
    notes.push(
      N('n1', 's1', 'Minh Anh', 'Xỉu muối ở đây là chân ái, tuần nào cũng phải có 1 ly!', 'yellow', '😍', 2 * DAY, { pin: true, reply: 'Cảm ơn em, mai anh để phần ly to nhé ☕', likes: { s2: 1, s3: 1, s6: 1 } }),
      N('n2', 's6', 'Long', 'Ship nhanh, ly còn lạnh tới tận văn phòng 👍', 'blue', '👍', 5 * 36e5, { likes: { s1: 1 } }),
      N('n3', 's3', 'Hoa', 'Quán ra thêm nước ép ổi đi anh ơi', 'pink', '🍏', 26 * 36e5),
      N('n4', 's2', 'Tuấn', 'Cà phê đen đậm đúng gu, chúc quán đông khách', 'green', '☕', 3 * DAY),
      N('n5', 's5', 'Thảo', 'Lần đầu thử xỉu cốt dừa, ngon bất ngờ', 'yellow', '🥥', 8 * 36e5),
      N('n6', 's7', 'Ngọc', 'Bao giờ quán có bánh ngọt ạ?', 'pink', '🍰', 30 * 60e3, { status: 'cho' }),
    );
    put(K_NOTES, notes);
    const rec = get(K_REC, []).filter(r => !r.seed);
    [['quiz', 's1', 'Minh Anh', 1180], ['quiz', 's2', 'Tuấn', 940], ['quiz', 's4', 'Quang Huy', 720],
      ['memo', 's6', 'Long', 1320], ['memo', 's3', 'Hoa', 1010], ['memo', 's5', 'Thảo', 860]]
      .forEach(([game, key, name, score], k) => rec.push({ game, key, name, score, at: at(k) + 5 * 60e3, seed: true }));
    put(K_REC, rec);
  }
  function clearSeeds() {
    try { localStorage.removeItem(K_SEED); } catch {}
    put(K_NOTES, get(K_NOTES, []).filter(n => !n.seed));
    put(K_REC, get(K_REC, []).filter(r => !r.seed));
  }

  // ---------- chi tiêu, VIP ----------
  function spendOf(key) {
    if (!key) return 0;
    const s = seed();
    const sg = s && s.guests.find(g => g.key === key);
    if (sg) return sg.spend;
    if (online()) return 0; // bản online: cần "cổng" tóm tắt khách do quầy cập nhật (bước sau)
    return Store.all().filter(o => o.status === 'xong' && phoneKey(o.customer.phone) === key).reduce((a, o) => a + (o.total || 0), 0);
  }
  const hasDone = key => !!key && (online() ? false : Store.all().some(o => o.status === 'xong' && phoneKey(o.customer.phone) === key));

  // ---------- khách đang ngồi trong quán hôm nay ----------
  // [{ key, name, drink (id món), at, spend, table, me }]
  function guests(meKey) {
    const t0 = dayStart(), map = new Map();
    const add = g => { const p = map.get(g.key); if (!p || g.at > p.at) map.set(g.key, { ...p, ...g }); };
    if (online()) {
      Cloud.scores.filter(s => s.at >= t0).forEach(s => add({ key: s.pid, name: nameOf(s), drink: null, at: s.at, spend: 0 }));
    } else {
      Store.all().filter(o => o.createdAt >= t0 && o.status !== 'huy').forEach(o => {
        const it = (o.items || []).find(i => !i.reward) || o.items[0];
        add({ key: phoneKey(o.customer.phone), name: nameOf(o.customer), drink: it && it.id, at: o.createdAt });
      });
      (seed() || { guests: [] }).guests.forEach(g => add({ ...g }));
    }
    // ai vừa chơi mini game hôm nay thì ngồi ở bàn đó
    const played = {};
    records().filter(r => r.at >= t0).sort((a, b) => a.at - b.at).forEach(r => { played[r.key] = TABLES.find(t => t.game === r.game).id; });
    const list = [...map.values()].map(g => ({
      ...g, spend: g.spend != null ? g.spend : spendOf(g.key), me: !!meKey && g.key === meKey,
      table: played[g.key] || TABLES[hash(g.key) % TABLES.length].id,
    }));
    return list.sort((a, b) => b.me - a.me || b.at - a.at);
  }

  // ---------- lời nhắn ----------
  // { id, key, name, text, color, icon, at, status: 'cho'|'ok'|'an', pin, reply, likes }
  const COLORS = ['yellow', 'pink', 'blue', 'green'];
  const ICONS = ['☕', '😍', '👍', '🎉', '🙏', '🌿'];
  const MAX_LEN = 80, KEEP = 14 * DAY;
  const notes = () => get(K_NOTES, []);
  const wall = () => notes().filter(n => n.status === 'ok' && (n.pin || Date.now() - n.at < KEEP))
    .sort((a, b) => b.pin - a.pin || b.at - a.at);
  const pending = () => notes().filter(n => n.status === 'cho').sort((a, b) => a.at - b.at);
  const mine = key => notes().filter(n => n.key === key).sort((a, b) => b.at - a.at);
  function addNote(key, name, text, color, icon) {
    text = String(text || '').trim().slice(0, MAX_LEN);
    if (text.length < 3) throw new Error('Lời nhắn ngắn quá');
    const today = notes().filter(n => n.key === key && n.at >= dayStart()).length;
    if (today >= 2) throw new Error('Mỗi ngày viết tối đa 2 lời nhắn');
    const n = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), key, name, text,
      color: COLORS.includes(color) ? color : 'yellow', icon: ICONS.includes(icon) ? icon : '☕',
      at: Date.now(), status: 'cho', pin: false, reply: '', likes: {} };
    put(K_NOTES, [...notes(), n]);
    return n;
  }
  const setNote = (id, patch) => put(K_NOTES, notes().map(n => (n.id === id ? { ...n, ...patch } : n)));
  function like(id, key) {
    const n = notes().find(x => x.id === id);
    if (!n || !key) return;
    const likes = { ...n.likes };
    likes[key] ? delete likes[key] : (likes[key] = 1);
    setNote(id, { likes });
  }

  // ---------- kỷ lục mini game (theo tuần) ----------
  const records = () => get(K_REC, []);
  function addRecord(game, key, name, score) {
    put(K_REC, [...records(), { game, key, name, score: Math.round(score), at: Date.now() }].slice(-500));
  }
  function top(game, n = 3) {
    const w = weekStart(), best = new Map();
    records().filter(r => r.game === game && r.at >= w).forEach(r => {
      const p = best.get(r.key);
      if (!p || r.score > p.score) best.set(r.key, r);
    });
    return [...best.values()].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, n);
  }
  const myBest = (game, key) => Math.max(0, ...records().filter(r => r.game === game && r.key === key && r.at >= weekStart()).map(r => r.score));

  const KEYS = [K_NOTES, K_REC, K_SEED];
  function onChange(fn) { window.addEventListener('storage', e => { if (KEYS.includes(e.key)) fn(e.key); }); }

  return {
    TABLES, SEATS, SCORED, VIP, COLORS, ICONS, MAX_LEN, HIDDEN,
    vipOf, nextVip, spendOf, hasDone, guests, nameOf, phoneKey, hash, dayStart, weekStart,
    notes, wall, pending, mine, addNote, setNote, like,
    records, addRecord, top, myBest,
    seed, addSeeds, clearSeeds, onChange,
  };
})();
