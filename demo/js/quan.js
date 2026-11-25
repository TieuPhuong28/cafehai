// ===== Quán chung Cafe Hải (app khách) – bản thử =====
// Không gian chung: tường (bảng vàng, bảng phấn, tường lời nhắn), bàn ghế có mini game,
// khách đặt đơn hôm nay "ngồi" trong quán, cầm món đã gọi, mặc đồ mua bằng xu (một số món chỉ dành cho VIP).
const Quan = (() => {
  const Q = QuanData;
  const num = n => Math.round(n || 0).toLocaleString('vi-VN');
  let open = null;      // 'gold' | 'chalk' | 'notes' | 't:<bàn>' | 'g:<khách>'
  let game = null;      // mini game đang chơi
  let draft = { text: '', color: 'yellow', icon: '☕' };

  const online = () => Cloud.enabled;
  const meKey = () => (online() ? Cloud.uid || '' : Q.phoneKey(state.customer.phone));
  const meName = () => (online() ? (Cloud.profile ? Q.nameOf(Cloud.profile) : 'Bạn') : Q.nameOf(state.customer) || 'Bạn');

  // ---------- nhân vật (toàn thân, xem Outfit) ----------
  let wdSlot = 'top', tryOn = null; // tủ đồ: ô đang xem, món đang thử
  function wearOf(key) {
    const sd = Q.seed(), sg = sd && sd.guests.find(g => g.key === key);
    if (sg && sg.wear) return sg.wear;
    if (online()) return Outfit.wearFrom(key && key === Cloud.uid ? Cloud.corner : null);
    return Outfit.wearFrom(key ? CornerData.localGet(key) : null);
  }
  const VIP_GEAR = { dong: { hat: 'cap_dong' }, bac: { hat: 'mu_noi', top: 'khoac_h' }, vang: { hat: 'vuong_mien', top: 'ao_dai', bottom: 'quan_lua', shoes: 'sneaker_vang' } };
  const vipGearText = v => Outfit.ITEMS.filter(it => it.vip === v.id).map(it => it.name).join(', ');
  const chibi = (key, spend, cls = '', pose) => Outfit.draw(wearOf(key), { key, cls, pose: pose || (cls === 'lg' ? 'stand' : 'sit') });
  const drinkIcon = id => { const d = id && D(id); if (!d) return '☕'; return d.box ? '🍉' : d.bottle ? '🍾' : d.cat === 'cafe' ? '🧋' : '🧃'; };
  const vipChip = spend => { const v = Q.vipOf(spend || 0); return v ? `<span class="qc-vip" style="--vc:${v.color}">VIP ${v.name}</span>` : ''; };

  // ---------- cảnh quán ----------
  function view() {
    if (game) return gameView();
    const me = meKey(), guests = Q.guests(me);
    const byTable = {};
    Q.TABLES.forEach(t => { byTable[t.id] = guests.filter(g => g.table === t.id); });
    const week = Board.rank('week').slice(0, 3);
    const wall = Q.wall();
    const chalk = chalkItems();
    const sel = id => (open === id ? 'on' : '');
    const seeds = !online() && Q.seed();

    return `
    ${topbar('☕ Quán chung Cafe Hải', guests.length ? `${guests.length} khách ghé hôm nay` : 'Chưa có khách hôm nay')}
    <div class="qc">
      <div class="qc-up">${upperSVG()}</div>
      <div class="qc-wall">
        <i class="qc-lamp" style="left:12%"></i><i class="qc-lamp" style="left:50%"></i><i class="qc-lamp" style="left:88%"></i>
        <div class="qc-front">
          <button class="qc-board qc-gold ${sel('gold')}" data-act="qc" data-a="open" data-id="gold">
            <b>🏆 BẢNG VÀNG</b>
            ${week.length ? week.map((p, i) => `<span>${['🥇', '🥈', '🥉'][i]} ${esc(p.name)}</span>`).join('') : '<span>Chưa có ai tuần này</span>'}
          </button>
          <div class="qc-door">
            <div class="qc-doorsign">${LOGO('#f3e3c3')}CAFE HẢI</div>
            <div class="qc-doorway">
              <div class="qc-court"><i class="qc-win"></i></div>
              <div class="qc-hai" aria-label="Anh Hải đứng ở cửa"></div>
              <i class="qc-leaf l"></i><i class="qc-leaf r"></i>
            </div>
          </div>
          <button class="qc-board qc-cork ${sel('notes')}" data-act="qc" data-a="open" data-id="notes">
            <b>💬 LỜI NHẮN</b>
            <span class="qc-mini-notes">${wall.slice(0, 4).map(n => `<i class="nt-${n.color}">${n.pin ? '📌' : ''}${n.icon}</i>`).join('') || '<em>Chưa có</em>'}</span>
            <small>${wall.length} lời nhắn</small>
          </button>
        </div>
      </div>
      <div class="qc-floor">
        <div class="qc-street">
          ${meKey() ? `<button class="qc-standme" data-act="qc" data-a="open" data-id="wardrobe" aria-label="Nhân vật của bạn, mở tủ đồ">${chibi(meKey(), 0, 'stand', 'stand')}<em>Bạn</em></button>` : '<span class="qc-plant">🪴</span>'}
          <button class="qc-aframe ${sel('chalk')}" data-act="qc" data-a="open" data-id="chalk">
            <b>Món của tuần</b>
            ${chalk.items.slice(0, 2).map(d => `<span>${esc(d.name)} · ${d.sale || d.price}K</span>`).join('')}
          </button>
          <button class="btn primary sm qc-order" data-act="go" data-to="list">☕ Gọi món</button>
          <span class="qc-plant">🌿</span>
        </div>
        <div class="qc-tables">
          ${Q.TABLES.map(t => tableHTML(t, byTable[t.id], sel('t:' + t.id))).join('')}
        </div>
      </div>
    </div>
    <div id="qcPanel">${panel(guests)}</div>
    ${meCard(guests)}
    ${online() ? '<p class="qc-note">Bản thử: lời nhắn và kỷ lục mini game đang lưu trên máy này. Bản online đầy đủ làm ở bước sau.</p>'
      : `<div class="qc-demo"><button class="btn ghost sm" data-act="qc" data-a="${seeds ? 'unseed' : 'seed'}">${seeds ? 'Xóa khách mẫu (demo)' : 'Thêm khách mẫu để xem thử (demo)'}</button></div>`}`;
  }

  // tầng trên: tường vôi, 3 cửa chớp trắng, giàn hoa vàng rủ xuống
  function upperSVG() {
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const shutter = x => {
      const leaf = lx => `<rect x="${lx}" y="8" width="27" height="54" fill="#f4f1ea" stroke="#cfc8b8" stroke-width="1.5"/>` +
        Array.from({ length: 11 }, (_, i) => `<line x1="${lx + 3}" x2="${lx + 24}" y1="${13 + i * 4.5}" y2="${13 + i * 4.5}" stroke="#d8d1c2" stroke-width="1.6"/>`).join('');
      return `<rect x="${x - 3}" y="5" width="62" height="60" fill="#e2dbcb"/>${leaf(x)}${leaf(x + 29)}`;
    };
    let vine = '';
    for (let i = 0; i < 9; i++) { // dây rủ
      const x = 10 + i * 42 + rnd() * 16, len = 24 + rnd() * 46;
      vine += `<path d="M${x} 74 q${rnd() * 10 - 5} ${len / 2} ${rnd() * 8 - 4} ${len}" stroke="#8d8a4a" stroke-width="1" fill="none"/>`;
      for (let k = 0; k < 4; k++) vine += `<circle cx="${x + rnd() * 8 - 4}" cy="${78 + k * len / 4}" r="${1.6 + rnd() * 1.4}" fill="${rnd() < .5 ? '#9db04a' : '#f0d548'}"/>`;
    }
    for (let i = 0; i < 190; i++) { // tán lá + hoa
      const x = rnd() * 372 - 6, y = 50 + rnd() * 30 + Math.sin(x / 23) * 5;
      vine += rnd() < .55
        ? `<ellipse cx="${x}" cy="${y}" rx="${3 + rnd() * 3}" ry="${1.8 + rnd() * 1.6}" fill="${['#a3b44e', '#86a03c', '#bcc864', '#6f8a32'][i % 4]}" transform="rotate(${rnd() * 180} ${x} ${y})"/>`
        : `<circle cx="${x}" cy="${y}" r="${1.6 + rnd() * 2.2}" fill="${['#f2d64b', '#e9c53a', '#f7e483'][i % 3]}"/>`;
    }
    return `<svg viewBox="0 0 360 120" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <rect width="360" height="76" fill="#ebe5d6"/><path d="M0 40 Q60 30 120 46 T250 36 T360 44 V76 H0Z" fill="#ddd5c2" opacity=".5"/>
      ${shutter(28)}${shutter(150)}${shutter(272)}
      <rect y="66" width="360" height="5" fill="#cdbfa3"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${i * 12 + 3}" y="56" width="2.5" height="11" fill="#bba98a"/>`).join('')}
      <rect y="72" width="360" height="9" fill="#a5753f"/><rect y="80" width="360" height="3" fill="#7d5530"/>
      ${vine}
    </svg>`;
  }

  function tableHTML(t, list, on) {
    const shown = list.slice(0, Q.SEATS), more = list.length - shown.length;
    const best = Q.SCORED.includes(t.game) ? Q.top(t.game, 1)[0] : null;
    const seats = Array.from({ length: Q.SEATS }, (_, i) => {
      const g = shown[i];
      return g ? `<span class="qc-seat ${g.me ? 'me' : ''}" data-act="qc" data-a="open" data-id="g:${esc(g.key)}" title="${esc(g.name)}">
          <i class="qc-chair"></i>${chibi(g.key, g.spend)}<i class="qc-cup">${drinkIcon(g.drink)}</i><em>${g.me ? 'Bạn' : esc(g.name)}</em></span>`
        : '<span class="qc-seat empty"><i class="qc-chair"></i></span>';
    }).join('');
    return `
    <div class="qc-table ${on}">
      <div class="qc-seats">${seats}</div>
      <button class="qc-top" data-act="qc" data-a="open" data-id="t:${t.id}" aria-label="${t.name}: ${t.title}">
        <span class="qc-game">${t.icon}</span><i class="qc-legs"></i>
      </button>
      <div class="qc-tname">${t.name}${more > 0 ? ` <small>+${more}</small>` : ''}</div>
      <div class="qc-trec">${best ? `🏆 ${esc(best.name)} · ${num(best.score)}` : t.title}</div>
    </div>`;
  }

  function chalkItems() {
    const live = MENU.filter(d => !d.soldOut && !d.box);
    let items = live.filter(d => d.featured);
    if (!items.length) items = live.filter(d => d.isNew || d.sale);
    if (!items.length) items = live.slice(0, 3);
    let promos = [];
    try { promos = Promo.load().filter(Promo.live).map(p => p.title || Promo.describe(p)); } catch {}
    return { items, promos };
  }

  // ---------- bảng chi tiết bên dưới cảnh ----------
  function panel(guests) {
    if (!open) return `<div class="qc-hint">Chạm vào <b>bảng trên tường</b>, <b>mặt bàn</b> hoặc <b>một vị khách</b> để xem.</div>`;
    const close = '<button class="icon-btn qc-x" data-act="qc" data-a="close" aria-label="Đóng">✕</button>';
    if (open === 'gold') return goldPanel(close);
    if (open === 'chalk') return chalkPanel(close);
    if (open === 'notes') return notesPanel(close);
    if (open === 'wardrobe') return wardrobePanel(close);
    if (open.startsWith('t:')) return tablePanel(Q.TABLES.find(t => t.id === open.slice(2)), guests, close);
    if (open.startsWith('g:')) return guestPanel(guests.find(g => g.key === open.slice(2)), close);
    return '';
  }

  function goldPanel(close) {
    const list = Board.rank('week').slice(0, 5);
    return `<div class="panel qc-p">${close}
      <h3>🏆 Bảng vàng tuần này</h3>
      ${list.length ? list.map((p, i) => `<div class="qc-row"><span class="rk">${i + 1}</span>${chibi(p.phone, Q.spendOf(p.phone), 'sm')}<span class="nm">${esc(p.name)}</span><b>${num(p.points)}</b></div>`).join('')
        : '<p class="muted">Chưa có ai. Tự pha một ly ở Quầy bar để lên bảng nhé!</p>'}
      <h4>Hạng VIP (theo tổng chi tiêu)</h4>
      <div class="qc-viprow">${Q.VIP.map(v => `<div style="--vc:${v.color}">${Outfit.draw({ ...Outfit.STARTER, ...VIP_GEAR[v.id] }, { key: 'vip' + v.id, pose: 'stand', cls: 'md' })}<b>${v.name}</b><small>từ ${num(v.min)}K</small><small>${vipGearText(v)}</small></div>`).join('')}</div>
      <button class="btn block" data-act="go" data-to="rank">Xem bảng xếp hạng đầy đủ</button>
    </div>`;
  }

  function chalkPanel(close) {
    const c = chalkItems();
    return `<div class="panel qc-p qc-chalkp">${close}
      <h3>📋 Bảng phấn</h3>
      ${c.items.slice(0, 4).map(d => `<div class="qc-row"><span class="nm">${esc(d.name)}${d.isNew ? ' <small class="tag">Mới</small>' : ''}</span>
        <b>${d.sale ? `<s>${d.price}K</s> ${d.sale}K` : d.price + 'K'}</b><button class="btn sm primary" data-act="quick" data-id="${d.id}">Gọi</button></div>`).join('')}
      ${c.promos.length ? `<h4>🎁 Đang có khuyến mãi</h4>${c.promos.slice(0, 3).map(p => `<p class="qc-promo">${esc(p)}</p>`).join('')}` : ''}
    </div>`;
  }

  function noteHTML(n, me) {
    const likes = Object.keys(n.likes || {}).length, liked = me && n.likes && n.likes[me];
    return `<div class="qc-sticky nt-${n.color} ${n.pin ? 'pin' : ''}">
      ${n.pin ? '<i class="qc-pin">📌</i>' : ''}
      <p><span>${n.icon}</span> ${esc(n.text)}</p>
      <small>— ${esc(n.name)}</small>
      ${n.reply ? `<div class="qc-reply"><b>Anh Hải:</b> ${esc(n.reply)}</div>` : ''}
      <button class="qc-like ${liked ? 'on' : ''}" data-act="qc" data-a="like" data-id="${n.id}">${liked ? '❤️' : '🤍'} ${likes || ''}</button>
    </div>`;
  }

  function notesPanel(close) {
    const me = meKey(), wall = Q.wall();
    const mine = me ? Q.mine(me).filter(n => n.status !== 'ok') : [];
    let form;
    if (online()) form = '<p class="muted">Viết lời nhắn trên bản online sẽ có ở bước sau.</p>';
    else if (!me) form = '<p class="muted">Nhập số điện thoại ở thẻ "Bạn trong quán" bên dưới để viết lời nhắn.</p>';
    else if (!Q.hasDone(me)) form = '<p class="muted">Lời nhắn dành cho khách đã nhận đơn. Đặt một đơn rồi quay lại viết cho quán nhé!</p>';
    else form = `<form id="qcNote" class="qc-form">
        <textarea name="text" maxlength="${Q.MAX_LEN}" rows="2" placeholder="Viết vài lời cho quán (tối đa ${Q.MAX_LEN} ký tự)">${esc(draft.text)}</textarea>
        <div class="qc-pick">${Q.COLORS.map(c => `<button type="button" class="sw nt-${c} ${draft.color === c ? 'on' : ''}" data-act="qc" data-a="color" data-id="${c}" aria-label="Màu ${c}"></button>`).join('')}
          <span class="sep"></span>${Q.ICONS.map(i => `<button type="button" class="ic ${draft.icon === i ? 'on' : ''}" data-act="qc" data-a="icon" data-id="${i}">${i}</button>`).join('')}</div>
        <button class="btn primary block">Dán lên tường</button>
        <small class="muted">Quầy duyệt xong lời nhắn mới hiện cho mọi người. Lời nhắn tự gỡ sau 2 tuần (trừ khi được ghim).</small>
      </form>`;
    return `<div class="panel qc-p">${close}
      <h3>💬 Tường lời nhắn</h3>
      <div class="qc-stickies">${wall.map(n => noteHTML(n, me)).join('') || '<p class="muted">Chưa có lời nhắn nào. Bạn viết lời nhắn đầu tiên nhé!</p>'}</div>
      ${mine.length ? `<div class="qc-mine">${mine.map(n => `<div>${n.status === 'cho' ? '⏳ Đang chờ quầy duyệt' : '🚫 Quầy chưa đăng'}: “${esc(n.text)}”</div>`).join('')}</div>` : ''}
      ${form}
    </div>`;
  }

  function tablePanel(t, guests, close) {
    if (!t) return '';
    const here = guests.filter(g => g.table === t.id), me = meKey();
    let body = '';
    if (Q.SCORED.includes(t.game)) {
      const top = Q.top(t.game, 3), mine = me ? Q.myBest(t.game, me) : 0;
      body = `<h4>Kỷ lục tuần này</h4>
        ${top.length ? top.map((r, i) => `<div class="qc-row"><span class="rk">${['🥇', '🥈', '🥉'][i]}</span><span class="nm">${esc(r.name)}</span><b>${num(r.score)}</b></div>`).join('') : '<p class="muted">Chưa có ai chơi tuần này.</p>'}
        ${mine ? `<p class="muted">Điểm cao nhất của bạn tuần này: <b>${num(mine)}</b></p>` : ''}
        <button class="btn primary block" data-act="qc" data-a="play" data-id="${t.game}">🪑 Ngồi xuống chơi</button>`;
    } else if (t.game === 'brew') {
      const list = MENU.filter(d => !d.soldOut && !d.box && d.steps.length && (d.featured || d.isNew)).slice(0, 3);
      const pick = list.length ? list : MENU.filter(d => !d.soldOut && !d.box && d.steps.length).slice(0, 3);
      body = `<p class="muted">Tự pha ly thật rồi đặt luôn. Điểm pha chế lên bảng vàng khi quán giao xong.</p>
        <div class="qc-chips">${pick.map(d => `<button class="btn sm" data-act="play" data-id="${d.id}">☕ ${esc(d.name)}</button>`).join('')}</div>
        <button class="btn block" data-act="go" data-to="list">Xem cả menu</button>`;
    } else {
      body = `<p class="muted">Chọn hộp rồi tự tay cắt, cắt càng chuẩn càng được thêm quả.</p>
        <div class="qc-chips">${MENU.filter(d => d.box && !d.soldOut).map(d => `<button class="btn sm" data-act="play" data-id="${d.id}">🍉 ${esc(d.name)} · ${d.price}K</button>`).join('') || '<p class="muted">Hôm nay hết hộp quả rồi.</p>'}</div>`;
    }
    return `<div class="panel qc-p">${close}
      <h3>${t.icon} ${t.name} · ${t.title}</h3>
      <p>${t.desc}</p>
      ${here.length ? `<div class="qc-here">${here.map(g => `<span>${chibi(g.key, g.spend, 'sm')}${g.me ? 'Bạn' : esc(g.name)}</span>`).join('')}</div>` : ''}
      ${body}
    </div>`;
  }

  function guestPanel(g, close) {
    if (!g) return '';
    const d = g.drink && D(g.drink);
    const ago = Math.max(1, Math.round((Date.now() - g.at) / 6e4));
    return `<div class="panel qc-p qc-guest">${close}
      ${chibi(g.key, g.spend, 'lg')}
      <div>
        <h3>${g.me ? 'Bạn' : esc(g.name)} ${vipChip(g.spend)}</h3>
        <p class="muted">Ghé quán ${ago < 60 ? ago + ' phút' : Math.round(ago / 60) + ' giờ'} trước · ngồi ${Q.TABLES.find(t => t.id === g.table).name}</p>
        ${d ? `<p>Đang uống <b>${drinkIcon(g.drink)} ${esc(d.name)}</b></p>` : ''}
        <p class="qc-wearing">👕 ${Outfit.names(wearOf(g.key)).map(esc).join(' · ')}</p>
        <div class="qc-chips">${d && !d.soldOut ? `<button class="btn primary sm" data-act="quick" data-id="${d.id}">Gọi món giống ${g.me ? 'lần trước' : 'bạn ấy'}</button>` : ''}${g.me ? '<button class="btn sm" data-act="qc" data-a="open" data-id="wardrobe">👕 Tủ đồ</button>' : ''}</div>
      </div>
    </div>`;
  }

  function meCard(guests) {
    const me = meKey();
    if (!me) {
      if (online()) return `<div class="panel qc-me"><p>Đăng nhập để có nhân vật riêng và ngồi trong quán khi bạn đặt đơn.</p><button class="btn primary sm" data-act="acc" data-a="login">Đăng nhập</button></div>`;
      return `<form class="panel qc-me" id="qcPhone"><div><b>Vào quán với tư cách của bạn</b><small>Bản demo: nhập tên và số điện thoại bạn dùng khi đặt món.</small></div>
        <input name="name" placeholder="Tên / biệt danh" value="${esc(state.customer.nick || state.customer.name)}" required>
        <input name="phone" inputmode="numeric" placeholder="Số điện thoại" required><button class="btn primary sm">Vào quán</button></form>`;
    }
    const spend = Q.spendOf(me), v = Q.vipOf(spend), nx = Q.nextVip(spend);
    const here = guests.find(g => g.me);
    const pct = nx ? Math.round(100 * (spend - (v ? v.min : 0)) / (nx.min - (v ? v.min : 0))) : 100;
    return `<div class="panel qc-me">
      ${chibi(me, spend, 'lg')}
      <div class="qc-me-i">
        <b>${esc(meName())}</b> ${vipChip(spend)}
        <small>${here ? `Bạn đang ngồi ${Q.TABLES.find(t => t.id === here.table).name}` : 'Hôm nay bạn chưa ghé, đặt một món là có chỗ ngồi ngay'}</small>
        <div class="qc-bar"><i style="width:${Math.max(4, pct)}%"></i></div>
        <small>${nx ? `Đã chi ${num(spend)}K · còn ${num(nx.min - spend)}K lên VIP ${nx.name} (mở ${vipGearText(nx)})` : 'Bạn là khách VIP Vàng của quán 👑'}</small>
      </div>
      <div class="qc-me-b"><button class="btn primary sm" data-act="qc" data-a="open" data-id="wardrobe">👕 Tủ đồ</button>
      ${Corner.enabled() ? '<button class="btn sm" data-act="go" data-to="corner">🛋️ Góc riêng</button>' : ''}</div>
    </div>`;
  }

  // ---------- tủ đồ ----------
  function wardrobePanel(close) {
    const me = meKey();
    if (!me) return `<div class="panel qc-p">${close}<h3>👕 Tủ đồ</h3><p class="muted">Nhập số điện thoại (hoặc đăng nhập) ở thẻ bên dưới để có nhân vật riêng.</p></div>`;
    const doc = online() ? (Cloud.corner || null) : CornerData.localGet(me);
    const vip = Q.vipOf(Q.spendOf(me)), wear = wearOf(me), xu = Outfit.balance(doc);
    const preview = tryOn ? { ...wear, [Outfit.ITEM[tryOn].slot]: tryOn } : wear;
    const t = tryOn && Outfit.ITEM[tryOn];
    const has = id => Outfit.owns(doc, id) || (!!Outfit.ITEM[id].vip && !Outfit.lockText(doc, id, vip));
    const items = Outfit.ITEMS.filter(it => it.slot === wdSlot);
    let act = '';
    if (t) {
      const lock = Outfit.lockText(doc, t.id, vip);
      act = wear[t.slot] === t.id ? `<button class="btn block" disabled>Đang mặc ${esc(t.name)}</button>`
        : has(t.id) ? `<button class="btn primary block" data-act="qc" data-a="wear" data-id="${t.id}">Mặc ${esc(t.name)}</button>`
        : lock ? `<button class="btn block" disabled>🔒 ${lock}</button>`
        : online() ? '<button class="btn block" disabled>Mua đồ trên bản online sẽ có ở bước sau</button>'
        : `<button class="btn primary block" data-act="qc" data-a="buy" data-id="${t.id}" ${xu < t.price ? 'disabled' : ''}>Mua ${esc(t.name)} · ${num(t.price)} xu</button>
           ${xu < t.price ? `<small class="muted">Còn thiếu ${num(t.price - xu)} xu. Mỗi 1.000đ đơn hàng = ${CornerData.cfg().rate} xu.</small>` : ''}`;
    }
    const slotOff = !['top', 'bottom', 'shoes'].includes(wdSlot) && wear[wdSlot];
    return `<div class="panel qc-p qc-wd">${close}
      <h3>👕 Tủ đồ của ${esc(meName())} ${vipChip(Q.spendOf(me))}</h3>
      <div class="wd-top">
        <div class="wd-stage">${Outfit.draw(preview, { key: me, pose: 'stand', cls: 'xl' })}${t ? '<span class="wd-try">Đang thử</span>' : ''}</div>
        <div class="wd-info">
          <div class="wd-xu">🪙 <b>${num(xu)}</b> xu</div>
          ${Outfit.SLOTS.map(sl => `<div class="wd-slot ${sl.id === wdSlot ? 'on' : ''}" data-act="qc" data-a="slot" data-id="${sl.id}"><span>${sl.icon}</span>${preview[sl.id] ? esc(Outfit.ITEM[preview[sl.id]].name) : '<em>Trống</em>'}</div>`).join('')}
        </div>
      </div>
      <div class="wd-tabs">${Outfit.SLOTS.map(sl => `<button class="${sl.id === wdSlot ? 'on' : ''}" data-act="qc" data-a="slot" data-id="${sl.id}">${sl.icon} ${sl.name}</button>`).join('')}</div>
      <div class="wd-grid">${items.map(it => {
        const lock = Outfit.lockText(doc, it.id, vip), owned = has(it.id), worn = wear[it.slot] === it.id;
        const mini = Outfit.draw({ ...Outfit.STARTER, [it.slot]: it.id }, { key: me, pose: it.slot === 'shoes' || it.slot === 'bottom' ? 'stand' : 'sit', cls: 'thumb' });
        return `<button class="wd-item ${tryOn === it.id ? 'on' : ''} ${lock && !owned ? 'locked' : ''}" data-act="qc" data-a="try" data-id="${it.id}">
          ${mini}<b>${esc(it.name)}</b>
          <small>${worn ? '✅ Đang mặc' : owned ? 'Đã có' : lock ? '🔒 ' + lock : it.price + ' xu'}</small></button>`;
      }).join('')}</div>
      <div class="wd-act">${act}${slotOff ? `<button class="btn ghost block" data-act="qc" data-a="off">Bỏ ${Outfit.SLOTS.find(x => x.id === wdSlot).name.toLowerCase()}</button>` : ''}</div>
      <p class="muted">Xu dùng chung với Góc riêng. Đồ VIP tự mở khi đủ hạng (tính theo tổng chi tiêu), không mua bằng xu.</p>
    </div>`;
  }
  function wdDo(fn, msg, party) {
    try { fn(); tryOn = null; Sfx.ding(); render(); if (msg) toast(msg); if (party) confetti(); }
    catch (e) { toast(e.message); }
  }

  // ---------- mini game: Đố vui ----------
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickN = (a, n) => shuffle(a).slice(0, n);
  function quizQuestions() {
    const drinks = MENU.filter(d => !d.box && !d.custom);
    const qs = [];
    const catName = id => (CATS.find(c => c.id === id) || {}).name;
    const prices = [...new Set(MENU.map(d => d.price))];
    const ings = Object.keys(ING).filter(k => drinks.some(d => d.steps.some(s => s.ing === k)) && drinks.some(d => !d.steps.some(s => s.ing === k)));
    const fruitDrinks = drinks.filter(d => d.steps.some(s => s.type === 'fruit' && s.fruits && s.fruits.length));
    const makers = [
      () => { const d = pickN(drinks, 1)[0]; const wrong = pickN(prices.filter(p => p !== d.price).concat([d.price + 5, d.price - 5].filter(p => p > 0 && !prices.includes(p))), 3);
        return { q: `Một ly ${d.name} giá bao nhiêu?`, a: d.price + 'K', opts: shuffle([d.price, ...wrong].map(p => p + 'K')) }; },
      () => { const d = pickN(drinks.filter(x => catName(x.cat)), 1)[0]; const wrong = pickN(CATS.filter(c => c.id !== d.cat).map(c => c.name), 3);
        return { q: `${d.name} nằm trong nhóm nào của menu?`, a: catName(d.cat), opts: shuffle([catName(d.cat), ...wrong]) }; },
      () => { if (!ings.length) return null; const k = pickN(ings, 1)[0]; const yes = pickN(drinks.filter(d => d.steps.some(s => s.ing === k)), 1)[0];
        const no = pickN(drinks.filter(d => !d.steps.some(s => s.ing === k)), 3);
        return { q: `Món nào có ${ING[k].name.toLowerCase()}?`, a: yes.name, opts: shuffle([yes, ...no].map(d => d.name)) }; },
      () => { if (!fruitDrinks.length) return null; const d = pickN(fruitDrinks, 1)[0]; const fr = d.steps.find(s => s.type === 'fruit').fruits;
        const right = FRUIT[fr[0]].name; const wrong = pickN(Object.keys(FRUIT).filter(k => !fr.includes(k)).map(k => FRUIT[k].name), 3);
        return { q: `${d.name} có loại quả nào?`, a: right, opts: shuffle([right, ...wrong]) }; },
    ];
    let guard = 0;
    while (qs.length < 6 && guard++ < 60) {
      const q = makers[qs.length % makers.length]() || makers[0]();
      if (q && q.opts.length === 4 && new Set(q.opts).size === 4 && !qs.some(x => x.q === q.q)) qs.push(q);
    }
    return qs;
  }

  // ---------- mini game: Lật thẻ ----------
  function memoCards() {
    const pool = pickN(MENU.filter(d => !d.custom), 6);
    return shuffle(pool.flatMap(d => [{ id: d.id, name: d.name, ic: drinkIcon(d.id) }, { id: d.id, name: d.name, ic: drinkIcon(d.id) }]))
      .map((c, i) => ({ ...c, k: i, up: false, done: false }));
  }

  const QUIZ_T = 10;
  function startGame(kind) {
    Sfx.unlock(); Sfx.tap();
    if (kind === 'quiz') game = { kind, qs: quizQuestions(), i: 0, score: 0, right: 0, t0: Date.now(), picked: null };
    else game = { kind, cards: memoCards(), flips: [], moves: 0, t0: Date.now(), lock: false };
    render(); window.scrollTo(0, 0);
    if (kind === 'quiz') tickQuiz();
  }
  function tickQuiz() {
    cancelAnimationFrame(tickQuiz.r);
    const step = () => {
      if (!game || game.kind !== 'quiz' || game.done) return;
      const left = QUIZ_T - (Date.now() - game.t0) / 1000;
      const bar = document.getElementById('qzBar');
      if (bar) bar.style.width = Math.max(0, left / QUIZ_T * 100) + '%';
      if (left <= 0 && game.picked == null) { answer(-1); return; }
      tickQuiz.r = requestAnimationFrame(step);
    };
    tickQuiz.r = requestAnimationFrame(step);
  }
  function answer(k) {
    const q = game.qs[game.i];
    if (game.picked != null) return;
    const ok = k >= 0 && q.opts[k] === q.a;
    const left = Math.max(0, QUIZ_T - (Date.now() - game.t0) / 1000);
    game.picked = k;
    if (ok) { game.right++; game.score += 100 + Math.round(left / QUIZ_T * 100); Sfx.ding(); } else Sfx.tap();
    render();
    setTimeout(() => {
      if (!game) return;
      if (game.i + 1 >= game.qs.length) return finish(game.score, `${game.right}/${game.qs.length} câu đúng`);
      game.i++; game.picked = null; game.t0 = Date.now(); render(); tickQuiz();
    }, ok ? 700 : 1300);
  }
  function flip(k) {
    const c = game.cards[k];
    if (game.lock || c.up || c.done) return;
    c.up = true; game.flips.push(c); Sfx.tap();
    if (game.flips.length === 2) {
      game.moves++;
      const [a, b] = game.flips;
      if (a.id === b.id) {
        a.done = b.done = true; game.flips = []; Sfx.ding();
        if (game.cards.every(x => x.done)) {
          const secs = (Date.now() - game.t0) / 1000;
          const score = Math.max(100, 1500 - (game.moves - 6) * 70 - Math.round(secs) * 6);
          render();
          return setTimeout(() => finish(score, `${game.moves} lượt · ${Math.round(secs)} giây`), 500);
        }
      } else {
        game.lock = true;
        setTimeout(() => { if (!game) return; a.up = b.up = false; game.flips = []; game.lock = false; render(); }, 800);
      }
    }
    render();
  }
  function finish(score, line) {
    const me = meKey(), prev = me ? Q.myBest(game.kind, me) : 0;
    const before = Q.top(game.kind, 1)[0];
    if (me) Q.addRecord(game.kind, me, meName(), score);
    const isTop = me && (!before || score > before.score);
    game = { ...game, done: true, score, line, prev, isTop, saved: !!me };
    if (isTop || score > prev) { confetti(); Sfx.fanfare(); } else Sfx.ding();
    render();
  }

  function gameView() {
    const g = game, t = Q.TABLES.find(x => x.game === g.kind);
    const head = `<div class="topbar"><button class="icon-btn" data-act="qc" data-a="quit" aria-label="Rời bàn">←</button>
      <div class="title">${t.icon} ${t.title}<div class="sub">${t.name}</div></div><span></span></div>`;
    if (g.done) {
      return `${head}<div class="panel qc-p qc-result">
        <div class="qc-big">${num(g.score)}</div><p>${g.line}</p>
        ${g.isTop ? '<p class="qc-win">🏆 Kỷ lục mới của bàn tuần này! Tên bạn đã lên mặt bàn.</p>' : g.score > g.prev && g.prev ? `<p class="qc-win">Điểm cao nhất của bạn (trước: ${num(g.prev)})</p>` : ''}
        ${g.saved ? '' : '<p class="muted">Nhập số điện thoại trong Quán chung để lưu kỷ lục lần sau.</p>'}
        <button class="btn primary block" data-act="qc" data-a="play" data-id="${g.kind}">Chơi lại</button>
        <button class="btn block" data-act="qc" data-a="quit">Về quán</button>
        <button class="btn ghost block" data-act="go" data-to="list">☕ Gọi một ly cho đỡ khát</button>
      </div>`;
    }
    if (g.kind === 'quiz') {
      const q = g.qs[g.i];
      return `${head}<div class="qc-quiz">
        <div class="qz-top"><span>Câu ${g.i + 1}/${g.qs.length}</span><b>${num(g.score)} điểm</b></div>
        <div class="qz-time"><i id="qzBar"></i></div>
        <h3>${esc(q.q)}</h3>
        <div class="qz-opts">${q.opts.map((o, k) => {
          const cls = g.picked == null ? '' : o === q.a ? 'ok' : k === g.picked ? 'bad' : 'dim';
          return `<button class="qz-opt ${cls}" data-act="qc" data-a="ans" data-id="${k}">${esc(o)}</button>`;
        }).join('')}</div>
      </div>`;
    }
    const found = g.cards.filter(c => c.done).length / 2;
    return `${head}<div class="qc-memo">
      <div class="qz-top"><span>${found}/6 cặp</span><b>${g.moves} lượt</b></div>
      <div class="mm-grid">${g.cards.map(c => `<button class="mm-card ${c.up || c.done ? 'up' : ''} ${c.done ? 'done' : ''}" data-act="qc" data-a="flip" data-id="${c.k}">
        <span class="mm-back">H</span><span class="mm-face"><i>${c.ic}</i>${esc(c.name)}</span></button>`).join('')}</div>
    </div>`;
  }

  // ---------- sự kiện ----------
  function handle(el) {
    const a = el.dataset.a, id = el.dataset.id;
    switch (a) {
      case 'open': Sfx.tap(); open = open === id ? null : id; tryOn = null; render(); scrollPanel(); break;
      case 'close': open = null; render(); break;
      case 'like': {
        if (!meKey()) { toast('Nhập số điện thoại để thả tim nhé'); break; }
        if (online()) { toast('Bản online chưa thả tim được'); break; }
        Q.like(id, meKey()); render(); break;
      }
      case 'color': saveDraft(); draft.color = id; render(); break;
      case 'icon': saveDraft(); draft.icon = id; render(); break;
      case 'play': startGame(id); break;
      case 'slot': Sfx.tap(); wdSlot = id; tryOn = null; render(); break;
      case 'try': Sfx.tap(); tryOn = tryOn === id ? null : id; render(); break;
      case 'buy': { const me = meKey(); wdDo(() => Outfit.buyLocal(me, id, Q.vipOf(Q.spendOf(me))), 'Đã mua ' + Outfit.ITEM[id].name + ' 🎉', true); break; }
      case 'wear': { const me = meKey(); if (online()) { toast('Bản online chưa đổi đồ được'); break; } wdDo(() => Outfit.wearLocal(me, Outfit.ITEM[id].slot, id, Q.vipOf(Q.spendOf(me)))); break; }
      case 'off': { const me = meKey(); if (online()) break; wdDo(() => Outfit.wearLocal(me, wdSlot, null)); break; }
      case 'ans': answer(+id); break;
      case 'flip': flip(+id); break;
      case 'quit': game = null; cancelAnimationFrame(tickQuiz.r); render(); scrollPanel(); break;
      case 'seed': Q.addSeeds(); render(); toast('Đã thêm khách mẫu vào quán'); break;
      case 'unseed': Q.clearSeeds(); open = null; render(); toast('Đã xóa khách mẫu'); break;
    }
  }
  function saveDraft() { const t = document.querySelector('#qcNote textarea'); if (t) draft.text = t.value; }
  function scrollPanel() { requestAnimationFrame(() => { const p = document.getElementById('qcPanel'); if (p && open) p.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }); }

  function submit(form) {
    if (form.id === 'qcPhone') {
      const phone = form.phone.value.replace(/\s/g, ''), name = form.name.value.trim();
      if (!/^0\d{9}$/.test(phone)) { toast('Số điện thoại gồm 10 số, bắt đầu bằng 0'); return; }
      state.customer.phone = phone;
      if (!state.customer.name) state.customer.name = name; else if (name !== state.customer.name) state.customer.nick = name;
      LS.set('cafehai.customer', state.customer);
      render(); toast('Chào mừng bạn vào quán ☕');
    }
    if (form.id === 'qcNote') {
      try {
        Q.addNote(meKey(), meName(), form.text.value, draft.color, draft.icon);
        draft.text = ''; render(); toast('Đã gửi lời nhắn, chờ quầy duyệt nhé 💬');
      } catch (e) { toast(e.message); }
    }
  }

  function leave() { game = null; open = null; cancelAnimationFrame(tickQuiz.r); }
  function init() {
    Q.onChange(() => { if (state.view === 'quan' && !game) render(); });
    if (Cloud.enabled) Cloud.on('scores', () => { if (state.view === 'quan' && !game) render(); });
  }
  const playing = () => !!game && !game.done;

  return { view, handle, submit, leave, init, playing, chibi };
})();
