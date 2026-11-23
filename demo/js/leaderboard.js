// ===== Bảng xếp hạng khách hàng: tuần / tháng / mọi thời đại =====
// Quy tắc: điểm thử thách của mỗi ly khách tự pha chỉ được cộng khi quầy bấm "hoàn tất" đơn.
// Đặt không chơi game (hoặc chế độ Tự do sáng tạo) được POINT_CFG.quick điểm tối đa. Xếp theo tổng điểm trong kỳ.
const Board = (() => {
  const SEED_KEY = 'cafehai.lbSeed';

  // Phần thưởng: VÍ DỤ, quán tự quyết định rồi sửa ở đây
  const REWARDS = {
    week: 'Top 1 tuần: tặng 1 ly bất kỳ (ví dụ)',
    month: 'Top 3 tháng: tặng 1 chai cà phê (ví dụ)',
    all: 'Huyền thoại pha chế của Cafe Hải 👑',
  };

  const PERIODS = [
    { id: 'week', label: 'Tuần này' },
    { id: 'month', label: 'Tháng này' },
    { id: 'all', label: 'Mọi thời đại' },
  ];

  function startOf(period, now = new Date()) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    if (period === 'week') { d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); } // tuần bắt đầu thứ Hai
    if (period === 'month') { d.setDate(1); return d.getTime(); }
    return 0;
  }

  function periodLabel(period) {
    const f = t => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    if (period === 'week') { const s = startOf('week'); return `${f(s)} – ${f(s + 6 * 864e5)}`; }
    if (period === 'month') { const n = new Date(); return `Tháng ${n.getMonth() + 1}/${n.getFullYear()}`; }
    return 'Từ ngày khai trương game';
  }

  const orderPoints = o => o.items.reduce((a, it) => a + (it.points || 0) * it.qty, 0);
  const orderCups = o => o.items.reduce((a, it) => a + (it.points ? it.qty : 0), 0);
  const HIDDEN = 'Khách bí ẩn 🕶️';
  const displayName = c => (c.hide ? HIDDEN : (c.nick || c.name));

  // Mỗi bản ghi: { phone, name, points, cups, best, at }
  function entries() {
    if (typeof Cloud !== 'undefined' && Cloud.enabled) {
      return Cloud.scores.map(s => ({ phone: s.pid, name: displayName(s), points: s.points, cups: s.cups || 0, best: s.best || 0, at: s.at }));
    }
    const out = [];
    Store.all().forEach(o => {
      if (o.status !== 'xong') return;
      const pts = orderPoints(o);
      if (!pts) return;
      const done = o.history.find(h => h.status === 'xong');
      out.push({
        phone: o.customer.phone, name: displayName(o.customer), points: pts, cups: orderCups(o),
        best: Math.max(...o.items.map(it => it.points || 0)), at: done ? done.at : o.createdAt,
      });
    });
    return out.concat(seeds());
  }

  function rank(period) {
    const from = startOf(period);
    const map = new Map();
    entries().filter(e => e.at >= from).forEach(e => {
      const p = map.get(e.phone) || { phone: e.phone, name: e.name, points: 0, cups: 0, best: 0, last: 0 };
      p.points += e.points; p.cups += e.cups; p.best = Math.max(p.best, e.best);
      if (e.at >= p.last) { p.last = e.at; p.name = e.name; }
      map.set(e.phone, p);
    });
    return [...map.values()].sort((a, b) => b.points - a.points || b.best - a.best || a.last - b.last);
  }

  // Điểm đang chờ (đơn chưa hoàn tất) của một khách
  function pending(phone) {
    const online = typeof Cloud !== 'undefined' && Cloud.enabled;
    return Store.all()
      .filter(o => (online ? o.uid === phone : o.customer.phone === phone) && !['xong', 'huy'].includes(o.status))
      .reduce((a, o) => a + orderPoints(o), 0);
  }

  // ----- Khách mẫu cho bản demo -----
  function seeds() { try { return JSON.parse(localStorage.getItem(SEED_KEY)) || []; } catch { return []; } }
  function addSeeds() {
    const names = ['Minh Anh', 'Tuấn', 'Hoa', 'Quang Huy', 'Thảo', 'Long', 'Ngọc', 'Bảo', 'Linh', 'Khoa'];
    const now = Date.now(), wk = startOf('week'), mo = startOf('month');
    const list = [];
    names.forEach((name, k) => {
      const phone = '09' + String(10000000 + Math.floor(Math.random() * 89999999));
      const n = 2 + Math.floor(Math.random() * 6);
      for (let j = 0; j < n; j++) {
        // trải đều: tuần này, đầu tháng, các tháng trước
        const r = Math.random();
        const at = r < .45 ? wk + Math.random() * (now - wk) : r < .75 ? mo + Math.random() * Math.max(1, wk - mo) : mo - Math.random() * 90 * 864e5;
        const pts = 1200 + Math.floor(Math.random() * 2800);
        list.push({ phone, name, points: pts, cups: 1, best: pts, at: Math.min(at, now) });
      }
    });
    try { localStorage.setItem(SEED_KEY, JSON.stringify(list)); } catch {}
  }
  function clearSeeds() { try { localStorage.removeItem(SEED_KEY); } catch {} }

  const mask = p => p ? `${p.slice(0, 4)} xxx ${p.slice(-3)}` : '';
  const num = n => Math.round(n).toLocaleString('vi-VN');
  const initial = name => name === HIDDEN ? '?' : (Array.from(name.trim().split(/\s+/).pop() || '?')[0] || '?').toUpperCase();

  // ----- Giao diện -----
  function html(period) {
    const list = rank(period);
    const online = typeof Cloud !== 'undefined' && Cloud.enabled;
    const me = online ? (Cloud.uid || '') : state.customer.phone ? state.customer.phone.replace(/\s/g, '') : '';
    const myIdx = list.findIndex(p => p.phone === me);
    const top = list.slice(0, 3);
    const podiumOrder = [top[1], top[0], top[2]];
    const medal = ['🥇', '🥈', '🥉'];
    const pend = me ? pending(me) : 0;
    const hasSeeds = !online && seeds().length > 0;

    const podium = top.length ? `
      <div class="podium">
        ${podiumOrder.map(p => {
          if (!p) return '<div class="pd empty"></div>';
          const r = list.indexOf(p);
          return `<div class="pd r${r + 1} ${p.phone === me ? 'me' : ''}">
            <div class="pd-ava">${initial(p.name)}<span>${medal[r]}</span></div>
            <div class="pd-name">${esc(p.name)}${p.phone === me ? ' (bạn)' : ''}</div>
            <div class="pd-pts">${num(p.points)}</div>
            <div class="pd-base">${r + 1}</div>
          </div>`;
        }).join('')}
      </div>` : '';

    const rows = list.slice(3, 20).map((p, k) => `
      <div class="lb-row ${p.phone === me ? 'me' : ''}">
        <span class="rk">${k + 4}</span>
        <span class="av">${initial(p.name)}</span>
        <span class="nm">${esc(p.name)}${p.phone === me ? ' (bạn)' : ''}<small>${p.cups} ly · ly cao nhất ${num(p.best)} điểm</small></span>
        <b>${num(p.points)}</b>
      </div>`).join('');

    const mine = me ? `
      <div class="lb-me">
        <div>${myIdx >= 0 ? `Hạng của bạn: <b>#${myIdx + 1}</b> · ${num(list[myIdx].points)} điểm` : 'Bạn chưa có điểm trong kỳ này'}</div>
        ${pend ? `<small>⏳ ${num(pend)} điểm đang chờ, sẽ cộng khi đơn hoàn tất</small>` : ''}
        ${myIdx > 0 ? `<small>Còn ${num(list[myIdx - 1].points - list[myIdx].points + 1)} điểm nữa để vượt ${esc(list[myIdx - 1].name)}!</small>` : ''}
      </div>` : online ? `<div class="lb-me"><small>Đăng nhập rồi đặt đơn để có tên trên bảng vàng!</small><button class="btn sm" style="margin-top:6px;background:#f2b632;color:#4a2016" data-act="acc" data-a="login">Đăng nhập / Tạo tài khoản</button></div>` : `<div class="lb-me"><small>Đặt đơn đầu tiên để có tên trên bảng nhé!</small></div>`;

    return `
    ${topbar('🏆 Bảng xếp hạng', 'Cao thủ pha chế Cafe Hải')}
    <div class="tabs lb-tabs">${PERIODS.map(p => `<button class="tab ${p.id === period ? 'on' : ''}" data-act="lbPeriod" data-id="${p.id}">${p.label}</button>`).join('')}</div>
    <div class="lb-head"><span>${periodLabel(period)}</span><span class="rw">🎁 ${REWARDS[period]}</span></div>
    ${mine}
    ${list.length ? podium + `<div class="panel lb-list">${rows || '<div class="lb-empty-sm">Chưa có ai khác, mời bạn bè vào đua nhé!</div>'}</div>`
      : `<div class="empty"><div>🏆</div>Chưa có ai trên bảng ${PERIODS.find(p => p.id === period).label.toLowerCase()}.<br>Hãy là người đầu tiên!</div>`}
    <div class="panel lb-rules">
      <h3>Cách tính điểm</h3>
      <ul>
        <li>Điểm tối đa mỗi ly <b>tỷ lệ với giá ${POINT_CFG.basis === 'sale' ? 'bán (sau giảm)' : 'gốc'}</b>: 1.000đ = ${POINT_CFG.perK} điểm (ly 20K tối đa ${(20 * POINT_CFG.perK).toLocaleString('vi-VN')} điểm). Mua 2 ly thì nhân đôi.</li>
        <li>Chơi chế độ <b>🎯 Thử thách</b> khi tự pha: ${Math.round(POINT_CFG.base * 100)}% điểm cho độ chuẩn, ${Math.round(POINT_CFG.perfect * 100)}% thưởng hoàn hảo, ${Math.round(POINT_CFG.speed * 100)}% thưởng tốc độ.${POINT_CFG.floor ? ` Pha kém vẫn được ít nhất ${Math.round(POINT_CFG.floor * 100)}%.` : ''}</li>
        <li>Điểm của ly được <b>cộng khi quán hoàn tất đơn</b> (đã giao hoặc khách đã lấy).</li>
        <li><b>Không chơi game vẫn có điểm:</b> đặt nhanh, "Anh pha giúp", "Như mọi khi", lấy deal hay pha Tự do sáng tạo đều được <b>${Math.round(POINT_CFG.quick * 100)}% điểm tối đa</b> (ly 20K = ${Math.round(20 * POINT_CFG.perK * POINT_CFG.quick).toLocaleString('vi-VN')} điểm).</li>
        <li>Không muốn hiện tên? Đặt biệt danh hoặc chọn ẩn tên khi đặt hàng.</li>
        <li>Bảng tuần bắt đầu thứ Hai, bảng tháng bắt đầu ngày 1.</li>
      </ul>
    </div>
    <div style="padding:0 16px 20px;display:flex;flex-direction:column;gap:8px">
      <button class="btn primary block" data-act="go" data-to="scene">🎮 Vào quán pha kiếm điểm</button>
      ${online ? '' : `<button class="btn ghost" data-act="${hasSeeds ? 'lbClear' : 'lbSeed'}">${hasSeeds ? 'Xóa khách mẫu (demo)' : 'Thêm khách mẫu để xem thử (demo)'}</button>`}
    </div>`;
  }

  return { html, rank, pending, addSeeds, clearSeeds, PERIODS };
})();
