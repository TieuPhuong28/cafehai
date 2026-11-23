// ===== Cafe Hải – màn hình quầy (demo) =====
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);

let audio = null;
const seen = new Set(Store.all().map(o => o.id));
const fresh = new Set();

function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2500);
}

function ding() {
  if (!audio) return;
  const now = audio.currentTime;
  [0, .18, .36].forEach((d, i) => {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.value = [880, 1175, 1568][i];
    g.gain.setValueAtTime(0, now + d);
    g.gain.linearRampToValueAtTime(.3, now + d + .02);
    g.gain.exponentialRampToValueAtTime(.001, now + d + .35);
    o.connect(g).connect(audio.destination);
    o.start(now + d); o.stop(now + d + .4);
  });
}

$('soundBtn').onclick = () => {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    $('soundBtn').textContent = '🔔 Chuông: Bật';
    $('soundBtn').classList.remove('sound-off');
    $('soundBtn').classList.add('ghost');
    ding();
  } else {
    audio.close(); audio = null;
    $('soundBtn').textContent = '🔔 Bật chuông báo đơn';
    $('soundBtn').classList.add('sound-off');
    $('soundBtn').classList.remove('ghost');
  }
};
$('clearBtn').onclick = () => {
  if (confirm('Xóa toàn bộ đơn demo?')) { Store.clear(); seen.clear(); toast('Đã xóa dữ liệu demo'); }
};

const ago = t => {
  const m = Math.floor((Date.now() - t) / 60000);
  return m < 1 ? 'vừa xong' : m < 60 ? `${m} phút trước` : new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

function actions(o) {
  const ship = o.type === 'ship';
  switch (o.status) {
    case 'moi': return `<button class="btn danger" data-id="${o.id}" data-st="huy">Hủy</button><button class="btn primary" data-id="${o.id}" data-st="pha">Nhận & pha</button>`;
    case 'pha': return `<button class="btn green" data-id="${o.id}" data-st="${ship ? 'giao' : 'san'}">${ship ? '🛵 Giao đi' : '✅ Báo khách lấy'}</button>`;
    case 'giao': case 'san': return `<button class="btn green" data-id="${o.id}" data-st="xong">${ship ? 'Đã giao & thu tiền' : 'Khách đã lấy'}</button>`;
    default: return `<span class="pill ${o.status}">${STATUS[o.status].short}</span>`;
  }
}

function card(o) {
  const ship = o.type === 'ship';
  return `
  <div class="ocard ${fresh.has(o.id) ? 'new' : ''}">
    <div class="head">
      <div><span class="code">${o.code}</span> <span class="ago">${ago(o.createdAt)}</span></div>
      <span class="type ${o.type}">${ship ? '🛵 Giao hàng' : '🏪 Đến lấy'}</span>
    </div>
    <div class="cus"><b>${esc(o.customer.name)}</b> · ${esc(o.customer.phone)}${ship ? `<small>📍 ${esc(o.address)}</small>` : ''}</div>
    <div class="items">
      ${o.items.map(it => `
        <div class="item">
          <b>${it.qty} × ${esc(it.name)}</b>${it.gift ? `<span class="g gift">🏠 quà Góc quán cấp ${it.gift}</span>` : it.reward ? '<span class="g gift">🎁 quà đổi điểm</span>' : ''}${it.played ? `<span class="g">🎮 khách tự pha${it.stars ? ' ' + '★'.repeat(it.stars) : ''}${it.points ? ` · ${(it.points * it.qty).toLocaleString('vi-VN')} điểm` : ''}</span>` : it.points ? `<span class="g q">${(it.points * it.qty).toLocaleString('vi-VN')} điểm</span>` : ''}
          ${it.opts.length ? `<div class="recipe">${it.opts.map(x => `<span>${esc(x.label)}: ${esc(x.value)}</span>`).join('')}</div>` : ''}
          ${it.note ? `<div class="nt">📝 ${esc(it.note)}</div>` : ''}
        </div>`).join('')}
    </div>
    ${o.note ? `<div class="onote">💬 ${esc(o.note)}</div>` : ''}
    ${o.discount ? `<div class="onote sale">🎁 ${esc((o.promos || []).join(', '))} · giảm ${fmt(o.discount)}</div>` : ''}
    ${memberLine(o)}
    <div class="ofoot">
      <div class="total">${fmt(o.total)}<small>${ship ? 'COD · chưa gồm ship' : 'Thu tại quầy'}</small></div>
      <div class="acts">${actions(o)}</div>
    </div>
  </div>`;
}

function cornerLine(o) {
  if (typeof CornerData === 'undefined' || !CornerData.cfg().enabled) return '';
  if (Store.online() && !o.uid) return '';
  const gifts = (o.cornerGifts || []).length ? ` · <b>🎁 quà cấp ${o.cornerGifts.join(', ')}: quầy kiểm tra cấp khi hoàn tất</b>` : '';
  if (o.status === 'xong') return o.xu != null ? `<div class="onote member-q">🏠 Góc quán · đã cộng ${o.xu.toLocaleString('vi-VN')} xu</div>` : '';
  if (o.status === 'huy') return '';
  return `<div class="onote member-q">🏠 Góc quán · +${CornerData.estimate(o.total).toLocaleString('vi-VN')} xu khi hoàn tất${gifts}</div>`;
}

function memberLine(o) {
  if (!Store.online()) return cornerLine(o);
  const earn = o.items.reduce((a, it) => a + (it.points || 0) * it.qty, 0);
  if (!o.uid) return '<div class="onote member-q guest">Khách vãng lai · không tích điểm</div>';
  if (o.status === 'xong') return `<div class="onote member-q">👤 Thành viên · ${o.credited ? `đã cộng ${(o.earned || 0).toLocaleString('vi-VN')} điểm` : 'chưa cộng điểm'}${o.redeem ? ` · đã trừ ${o.redeem.toLocaleString('vi-VN')} điểm đổi quà` : ''}</div>${cornerLine(o)}`;
  return `<div class="onote member-q">👤 Thành viên · +${earn.toLocaleString('vi-VN')} điểm khi hoàn tất${o.redeem ? ` · <b>🎁 trừ ${o.redeem.toLocaleString('vi-VN')} điểm đổi quà</b>` : ''}</div>${cornerLine(o)}`;
}

function render(list = Store.all()) {
  const by = st => list.filter(o => st.includes(o.status)).sort((a, b) => a.createdAt - b.createdAt);
  const cols = [
    { cls: 'c-moi', title: '🆕 Đơn mới', items: by(['moi']) },
    { cls: '', title: '☕ Đang pha', items: by(['pha']) },
    { cls: '', title: '🛵 Đang giao / Chờ lấy', items: by(['giao', 'san']) },
  ];
  $('board').innerHTML = cols.map(c => `
    <div class="col ${c.cls}">
      <h2>${c.title} <span class="n">${c.items.length}</span></h2>
      ${c.items.length ? c.items.map(card).join('') : '<div class="empty-col">Chưa có đơn</div>'}
    </div>`).join('');
  const done = list.filter(o => o.status === 'xong' || o.status === 'huy');
  $('doneSum').textContent = `Đơn đã xong / đã hủy (${done.length})`;
  $('doneList').innerHTML = done.map(card).join('');
  const revenue = list.filter(o => o.status === 'xong').reduce((a, o) => a + o.total, 0);
  const played = list.flatMap(o => o.items).filter(i => i.played).reduce((a, i) => a + i.qty, 0);
  $('stats').innerHTML = `
    <span>Đơn hôm nay <b>${list.length}</b></span>
    <span>Doanh thu xong <b>${fmt(revenue)}</b></span>
    <span>Ly khách tự pha <b>${played}</b></span>`;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-st]');
  if (!b) return;
  const st = b.dataset.st;
  if (st === 'huy' && !confirm('Hủy đơn này?')) return;
  fresh.delete(b.dataset.id);
  Store.setStatus(b.dataset.id, st);
});

Store.subscribe(list => {
  const news = list.filter(o => !seen.has(o.id));
  news.forEach(o => { seen.add(o.id); fresh.add(o.id); });
  if (news.length) {
    ding();
    toast(`🔔 Có ${news.length} đơn mới: ${news.map(o => o.code).join(', ')}`);
    setTimeout(() => { news.forEach(o => fresh.delete(o.id)); }, 4500);
  }
  render(list);
});

const tick = () => { $('clock').textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); };
tick(); setInterval(() => { tick(); render(); }, 30000);
render();
