// ===== Cảnh quán: ngoài cửa → trong quán, trò chuyện với anh Hải, menu trên tường =====
const Scene = (() => {
  let typing = 0;

  // ---------- Hội thoại ----------
  function talk(lines, choices = []) {
    state.dlg = { lines: [].concat(lines), idx: 0, n: 0, done: false, choices };
    if (state.view === 'scene' && state.scene.phase === 'inside') { renderDlg(); type(); }
  }

  function type() {
    clearInterval(typing);
    const d = state.dlg, el = document.getElementById('dlgText'), hai = document.querySelector('.hai');
    if (!d || !el) return;
    const full = d.lines[d.idx];
    d.done = false; d.n = 0;
    hai?.classList.add('talking');
    typing = setInterval(() => {
      d.n += 2;
      el.textContent = full.slice(0, d.n);
      if (d.n >= full.length) finishLine();
    }, 22);
  }

  function finishLine() {
    clearInterval(typing);
    const d = state.dlg;
    d.done = true; d.n = d.lines[d.idx].length;
    document.querySelector('.hai')?.classList.remove('talking');
    renderDlg();
  }

  function tapDialog() {
    const d = state.dlg;
    if (!d) return;
    if (!d.done) return finishLine();
    if (d.idx < d.lines.length - 1) { d.idx++; renderDlg(); type(); }
  }

  function dlgHTML() {
    const d = state.dlg;
    if (!d) return '';
    const last = d.idx === d.lines.length - 1;
    const text = d.lines[d.idx].slice(0, d.done ? undefined : d.n);
    const canSkip = !last || !d.done;
    return `
      <div class="dlg-name">Anh Hải · Chủ quán</div>
      ${canSkip ? '<button class="dlg-skip" data-act="dlgSkip">Bỏ qua ⏭</button>' : ''}
      <div class="dlg-text" id="dlgText">${esc(text)}</div>
      ${d.done && !last ? '<div class="dlg-more">Chạm để nghe tiếp ▼</div>' : ''}
      ${d.done && last && d.choices.length ? `<div class="choices">${d.choices.map((c, k) => `<button class="choice ${c.main ? 'main' : ''}" data-act="choice" data-i="${k}">${c.label}</button>`).join('')}</div>` : ''}`;
  }
  function renderDlg() {
    const el = document.getElementById('dlg');
    if (el) el.innerHTML = dlgHTML();
  }

  function skip() {
    const d = state.dlg;
    if (!d) return;
    d.idx = d.lines.length - 1;
    finishLine();
  }

  function choose(k) {
    const c = state.dlg?.choices[k];
    if (!c) return;
    Sfx.tap();
    c.fn();
  }

  // ---------- Các lựa chọn ----------
  function mainChoices() {
    const n = cartCount();
    const last = !n && lastOrder();
    return [
      n ? { label: `🛒 Chốt đơn · ${n} món · ${fmt(cartTotal())}`, fn: () => go('cart'), main: true } : null,
      last ? { label: `🔁 Như mọi khi: ${lastLabel(last)}`, fn: reorderLast, main: true } : null,
      { label: '📋 Xem menu trên tường', fn: openBoard, main: !n && !last },
      { label: '💡 Anh gợi ý món đi', fn: recommend },
      { label: '⚡ Đặt nhanh (không chơi)', fn: () => go('list') },
      { label: '🍉 Làm hộp quả (tự cắt)', fn: chooseBox },
      { label: '🧃 Tự mix nước ép', fn: () => pickDrink('mix') },
      { label: '🎁 Quầy thông tin: món mới & deal', fn: openInfo },
      { label: '🏆 Bảng xếp hạng', fn: () => go('rank') },
    ].filter(Boolean);
  }

  // ---------- Khách quen: "Như mọi khi" ----------
  const lastOrder = () => { const l = LS.get('cafehai.last', null); return l && l.length ? l : null; };
  function lastLabel(items) {
    const one = it => {
      const extra = it.opts.map(o => o.value).filter(v => !['Vừa', 'Vừa đá', '100% đường'].includes(v));
      return `${it.qty > 1 ? it.qty + '× ' : ''}${it.name}${extra.length ? ' (' + extra.join(', ') + ')' : ''}`;
    };
    const total = items.reduce((a, it) => a + it.price * it.qty, 0);
    return `${items.map(one).join(' + ')} – ${total}K`;
  }
  function reorderLast() {
    const items = lastOrder();
    if (!items) return;
    reorderItems(items);
    talk([pick([
      'Ok, như mọi khi! Mình cho vào giỏ rồi đấy. Chốt đơn luôn nhé?',
      'Biết ngay mà! Đúng món ruột của bạn đây. Chốt luôn không?',
    ])], mainChoices());
  }

  // Bảng vàng treo tường: top 3 của tuần
  function goldBoardHTML() {
    const top = Board.rank('week').slice(0, 3);
    const medal = ['🥇', '🥈', '🥉'];
    const short = n => { const w = n.trim().split(/\s+/); return w.length > 2 ? w.slice(-2).join(' ') : n; };
    return `
    <button class="gold-board" data-act="go" data-to="rank" aria-label="Bảng vàng – xem bảng xếp hạng">
      <span class="gb-nail"></span>
      <span class="gb-inner">
        <span class="gb-title">BẢNG VÀNG</span>
        <span class="gb-sub">Cao thủ pha chế tuần này</span>
        ${top.length ? top.map((p, k) => `<span class="gb-row"><i>${medal[k]}</i><span>${esc(short(p.name))}</span><b>${p.points.toLocaleString('vi-VN')}</b></span>`).join('')
          : '<span class="gb-empty">Chưa có ai…<br>Bạn sẽ là người đầu tiên?</span>'}
      </span>
    </button>`;
  }

  function greet() {
    let visited = false;
    try { visited = localStorage.getItem('cafehai.visited') === '1'; localStorage.setItem('cafehai.visited', '1'); } catch {}
    const last = lastOrder();
    if (visited && last && !cartCount()) {
      // khách quen: hỏi ngay món ruột, không nói dài
      talk([`Lại là bạn à! Như mọi khi nhé: ${lastLabel(last)}?`], mainChoices());
      return;
    }
    const lines = visited ? [pick(TALK.greetBack)] : [...TALK.greetFirst];
    const top = Board.rank('week')[0];
    if (top) lines.push(`Thấy bảng vàng trên tường không? Tuần này ${top.name} đang dẫn đầu với ${top.points.toLocaleString('vi-VN')} điểm. Bạn vào đua không? 😎`);
    const fresh = MENU.filter(d => d.isNew && !d.soldOut);
    let choices = mainChoices();
    if (fresh.length) {
      lines.push(`À, quán vừa có món mới: ${fresh.map(d => d.name).join(', ')}! Thử không bạn?`);
      choices = [{ label: `✨ Thử ${fresh[0].name} (${fresh[0].price}K)`, fn: () => pickDrink(fresh[0].id), main: true }].concat(choices.map(c => ({ ...c, main: false })));
    }
    const deals = Promo.load().filter(p => p.type !== 'info' && Promo.live(p));
    if (deals.length) {
      lines.push(`Hôm nay có ${deals.length} deal hời đấy: ${deals.slice(0, 2).map(p => p.title).join(', ')}${deals.length > 2 ? '…' : ''}! Xem ở quầy thông tin nhé.`);
      choices.splice(fresh.length ? 1 : 0, 0, { label: '🔥 Xem deal hôm nay', fn: openInfo, main: !fresh.length });
      if (!fresh.length) choices.forEach((c, i) => { if (i) c.main = false; });
    }
    lines.push(pick(TALK.ask));
    talk(lines, choices);
  }

  function chooseBox() {
    const boxes = MENU.filter(d => d.box);
    talk([TALK.cut.pick], boxes.map((d, i) => ({ label: `🍉 ${d.name} · ${d.box.kinds} loại · ${d.price}K`, fn: () => pickDrink(d.id), main: i === 1 }))
      .concat([{ label: '↩ Quay lại', fn: () => talk([pick(TALK.ask)], mainChoices()) }]));
  }

  function recommend() {
    let r = TALK.recommend();
    if (!D(r.id) || D(r.id).soldOut) {
      const ok = MENU.filter(d => !d.soldOut && d.steps.length && !d.box);
      const n = ok.find(d => d.isNew) || ok[Math.floor(Math.random() * ok.length)];
      if (!n) { talk(['Hôm nay quán gần hết hàng rồi, bạn ghé lại sau nhé!'], mainChoices()); return; }
      r = { id: n.id, line: n.isNew ? 'Món mới của quán đấy, thử đi bạn!' : 'Món này hôm nay ngon lắm, thử đi!' };
    }
    pickDrink(r.id, r.line);
  }

  function pickDrink(id, intro) {
    const d = D(id);
    state.scene.board = false; state.scene.info = false;
    if (!d || d.soldOut) {
      state.scene.board = false; state.scene.info = false;
      if (state.view !== 'scene') go('scene');
      render();
      talk([d ? `Tiếc quá, ${d.name} hôm nay ${d.outReason.toLowerCase()} rồi 😢 Bạn chọn món khác giúp mình nhé!` : 'Món này quán không còn bán nữa rồi.'], [{ label: '📋 Xem menu khác', fn: openBoard, main: true }, { label: '💡 Anh gợi ý món đi', fn: recommend }]);
      return;
    }
    const line = intro || d.intro || TALK.drink[id] || pick(TALK.drinkGeneric[d.cat] || ['Món này ngon lắm, thử đi bạn!']);
    let choices;
    if (d.box) choices = [
      { label: '🔪 Để mình tự cắt!', fn: () => startGame(id), main: true },
      { label: `⚡ Anh làm giúp mình (${d.price}K)`, fn: () => openQuick(id) },
    ];
    else if (!d.steps.length) choices = [{ label: `🛒 Lấy 1 ${d.name} (${d.price}K)`, fn: () => { openQuick(id); }, main: true }];
    else if (hasFreeFruit(d)) choices = [{ label: '🎮 Để mình tự mix!', fn: () => startGame(id), main: true }];
    else choices = [
      { label: '🎮 Để mình tự tay pha!', fn: () => startGame(id), main: true },
      { label: `⚡ Anh pha giúp mình (${d.price}K)`, fn: () => openQuick(id) },
    ];
    choices.push({ label: '↩ Chọn món khác', fn: openBoard });
    if (state.view !== 'scene') go('scene');
    render();
    const u = Promo.unitPrice(d);
    talk([`${d.name} – ${u.price < d.price ? `${u.price}K (đang giảm từ ${d.price}K – ${u.promo.title})` : d.price + 'K'}. ${line}`], choices);
  }

  function openBoard() {
    state.scene.board = true;
    render();
    Sfx.tap();
  }
  function openInfo() {
    state.scene.info = true; state.scene.board = false;
    if (state.view !== 'scene') go('scene');
    render();
    Sfx.tap();
  }
  function closeInfo() {
    state.scene.info = false;
    render();
    talk([pick(['Có gì ưng thì gọi mình nhé!', 'Deal ngon thế mà không lấy là tiếc lắm đấy 😄', pick(TALK.ask)])], mainChoices());
  }

  function priceTag(d) {
    const u = Promo.unitPrice(d);
    return u.price < d.price ? `<s>${d.price}K</s> ${u.price}K` : d.price + 'K';
  }

  // Bảng tin treo tường (bảng phấn)
  function infoBoardHTML() {
    const b = Promo.board();
    const lines = [];
    b.featured.slice(0, 2).forEach(d => { const u = Promo.unitPrice(d); lines.push(`⭐ ${d.name} ${u.price < d.price ? `${d.price}→${u.price}K` : d.price + 'K'}`); });
    b.news.slice(0, 1).forEach(d => lines.push(`✨ Mới: ${d.name}`));
    b.combos.filter(Promo.live).slice(0, 1).forEach(p => lines.push(`🔥 ${p.title} ${p.price}K`));
    b.discounts.filter(Promo.live).slice(0, 1).forEach(p => lines.push(`🏷️ ${p.title}`));
    if (lines.length < 3) b.discounts.filter(p => !Promo.live(p)).slice(0, 1).forEach(p => lines.push(`⏰ ${p.title} ${p.from}`));
    if (!lines.length) b.infos.slice(0, 1).forEach(p => lines.push(`📣 ${p.title}`));
    const count = b.featured.length + b.news.length + b.combos.length + b.discounts.length + b.infos.length;
    return `
    <button class="info-board" data-act="info" aria-label="Quầy thông tin: món mới, khuyến mãi, deal">
      <span class="ib-title">📣 BẢNG TIN</span>
      ${lines.length ? lines.slice(0, 3).map(l => `<span class="ib-line">${esc(l)}</span>`).join('') : '<span class="ib-line dim">Hôm nay chưa có tin mới</span>'}
      ${count ? `<span class="ib-more">Chạm xem ${count} tin ›</span>` : ''}
    </button>`;
  }

  // Quầy thông tin (mở to)
  function infoHTML() {
    const b = Promo.board();
    const save = p => Promo.comboBase(p) - p.price;
    const sec = (title, body) => body ? `<div class="bsec"><span>${title}</span></div>${body}` : '';
    const news = b.news.map(d => `
      <div class="deal">
        <span class="de">✨</span>
        <span class="dt"><b>${esc(d.name)}</b><small>${esc(d.intro || 'Món mới của quán, thử ngay!')}</small></span>
        <span class="dp">${priceTag(d)}</span>
        <button class="btn primary sm" data-act="pick" data-id="${d.id}">Thử</button>
      </div>`).join('');
    const combos = b.combos.map(p => {
      const on = Promo.live(p), out = p.items.some(x => D(x.id).soldOut);
      return `
      <div class="deal hot ${on && !out ? '' : 'off'}">
        <span class="de">${p.emoji || '🔥'}</span>
        <span class="dt"><b>${esc(p.title)}</b><small>${esc(Promo.describe(p))}</small><em>${out ? 'Tạm hết món trong combo' : Promo.status(p)} · tiết kiệm ${save(p)}K</em></span>
        <span class="dp"><s>${Promo.comboBase(p)}K</s> ${p.price}K</span>
        <button class="btn primary sm" data-act="deal" data-id="${p.id}" ${on && !out ? '' : 'disabled'}>${on ? 'Lấy deal' : 'Chưa tới giờ'}</button>
      </div>`;
    }).join('');
    const discounts = b.discounts.map(p => {
      const on = Promo.live(p);
      const first = p.items ? p.items.find(id => D(id)) : null;
      return `
      <div class="deal ${on ? '' : 'off'}">
        <span class="de">${p.emoji || '🏷️'}</span>
        <span class="dt"><b>${esc(p.title)}</b><small>${esc(Promo.describe(p))}</small><em>${Promo.status(p)}</em></span>
        <span class="dp">−${p.mode === 'pct' ? p.value + '%' : p.value + 'K'}</span>
        ${first ? `<button class="btn light sm" data-act="pick" data-id="${first}">Xem món</button>` : `<button class="btn light sm" data-act="board">Xem menu</button>`}
      </div>`;
    }).join('');
    const featured = b.featured.map(d => {
      const u = Promo.unitPrice(d);
      return `
      <div class="deal hot">
        <span class="de">⭐</span>
        <span class="dt"><b>${esc(d.name)}</b><small>${esc(d.intro || TALK.drink[d.id] || 'Quán giới thiệu món này, thử đi bạn!')}</small>${u.price < d.price ? `<em>Đang giảm ${d.price - u.price}K</em>` : ''}</span>
        <span class="dp">${priceTag(d)}</span>
        <button class="btn primary sm" data-act="pick" data-id="${d.id}">Chọn món</button>
      </div>`;
    }).join('');
    const infos = b.infos.map(p => `<div class="deal note"><span class="de">${p.emoji || '📣'}</span><span class="dt"><b>${esc(p.title)}</b><small>${esc(p.desc)}</small></span></div>`).join('');
    const empty = !featured && !news && !combos && !discounts && !infos;
    return `
    <div class="board-ov" data-act="infoBg">
      <div class="board-paper info-paper">
        <button class="board-close" data-act="closeInfo" aria-label="Đóng">✕</button>
        <div class="board-logo">${LOGO()}</div>
        <h2>QUẦY THÔNG TIN</h2>
        <p class="slogan">Món mới · Khuyến mãi · Deal hời</p>
        ${empty ? '<div class="empty" style="padding:24px 8px"><div>📭</div>Hôm nay quán chưa có khuyến mãi.<br>Quay lại sau nhé!</div>' : ''}
        ${sec('⭐ Quán giới thiệu', featured)}
        ${sec('🔥 Deal hời', combos)}
        ${sec('🏷️ Khuyến mãi', discounts)}
        ${sec('✨ Món mới', news)}
        ${sec('📣 Thông báo', infos)}
      </div>
    </div>`;
  }

  function closeBoard() {
    state.scene.board = false; state.scene.info = false;
    render();
    talk([pick(TALK.ask)], mainChoices());
  }

  function enter() {
    const door = document.querySelector('.door');
    door?.classList.add('open');
    Sfx.unlock(); Sfx.door();
    document.querySelector('.outside')?.classList.add('leaving');
    setTimeout(() => {
      state.scene.phase = 'inside';
      render(); // after() sẽ chào khách
    }, 750);
  }

  // ---------- HTML ----------
  function outsideHTML() {
    return `
    <div class="outside storefront">
      <div class="upper"><span class="rail"></span><span class="ac"></span><span class="ac a2"></span></div>
      <div class="balcony"></div>
      <div class="wall">
        <div class="sf-win left">
          <span class="h-sign"><b>H</b><small>CAFE HẢI</small></span>
          <span class="shelf s1"></span><span class="shelf s2"></span>
        </div>
        <button class="door" data-act="enter" aria-label="Bước vào quán">
          <span class="inside-glow"><i></i><i></i><i></i><i></i></span>
          <span class="open-sign">MỞ CỬA</span>
          <span class="knob"></span>
        </button>
        <div class="plate"><span class="flag">★</span><b>41</b><small>CHU VĂN AN</small></div>
        <div class="sf-win right"><span class="poster-vn"><b>★</b><small>VIỆT NAM</small></span></div>
        <div class="hh">H H<br>H H</div>
      </div>
      <div class="sidewalk">
        <span class="plant p1">🪴</span>
        <span class="chair c1"></span>
        <span class="table"><i>🥤</i><i>🥤</i></span>
        <span class="chair c2"></span>
        <span class="fan"></span>
        <span class="plant p2">🌿</span>
        <span class="flowers">🌸🌸</span>
      </div>
      <div class="curb"></div>
      <div class="street"><span>🛵</span></div>
      <div class="addr-tag">📍 41 Chu Văn An</div>
      <div class="enter-hint">👆 Chạm vào cửa để bước vào quán</div>
    </div>`;
  }

  function boardHTML() {
    const sec = cat => MENU.filter(d => d.cat === cat.id);
    const icon = d => d.cat === 'ep' || d.cat === 'ketp' ? d.steps[0].fruits.map(f => fruitHTML(f, 17)).join('') : d.cat === 'chai' ? '🍾' : d.cat === 'qua' ? '🍉' : d.id === 'mix' ? '🥤' : d.cat === 'khac' ? '🍹' : '☕';
    return `
    <div class="board-ov" data-act="boardBg">
      <div class="board-paper">
        <button class="board-close" data-act="closeBoard" aria-label="Đóng">✕</button>
        <div class="board-logo">${LOGO()}</div>
        <h2>MENU THỨC UỐNG</h2>
        <p class="slogan">☕ Cà phê đậm vị – Ngon đúng gu! ☕</p>
        ${CATS.map(c => `
          <div class="bsec"><span>${c.name}</span></div>
          ${sec(c).map(d => `
            <button class="bitem ${d.soldOut ? 'out' : ''}" data-act="pick" data-id="${d.id}">
              <i>${icon(d)}</i><span class="bn">${d.name}${d.isNew ? ' <em class="newb">MỚI</em>' : ''}</span><span class="dots"></span><b>${d.soldOut ? 'Hết' : priceTag(d)}</b>
            </button>`).join('')}
        `).join('')}
        <details class="orig"><summary>Xem ảnh menu gốc của quán</summary><img src="assets/menu.webp" alt="Menu Cafe Hải"></details>
        <p class="slogan" style="margin-top:12px">Cảm ơn bạn đã ủng hộ! ♥</p>
      </div>
    </div>`;
  }

  function html() {
    if (state.scene.phase === 'outside') return outsideHTML();
    const n = cartCount();
    return `
    <div class="scene">
      <div class="lamps"><i></i><i></i><i></i></div>
      <div class="scene-top">
        <div class="logo sm">${LOGO('#f3e3c3')}<div><b>CAFE HẢI</b></div></div>
        <button class="icon-btn dark" data-act="mute" aria-label="Âm thanh">${Sfx.muted ? '🔇' : '🔊'}</button>
        <button class="icon-btn dark" data-act="go" data-to="rank" aria-label="Bảng xếp hạng">🏆</button>
        <button class="icon-btn dark" data-act="go" data-to="account" aria-label="Tài khoản">👤</button>
        <button class="icon-btn dark" data-act="go" data-to="cart" aria-label="Giỏ hàng">🛒${n ? `<span class="badge">${n}</span>` : ''}</button>
      </div>
      <button class="wall-menu" data-act="board" aria-label="Xem menu trên tường">
        <span class="frame"><img src="assets/menu.webp" alt=""></span>
        <span class="wm-label">📋 MENU – chạm để xem</span>
      </button>
      ${goldBoardHTML()}
      ${infoBoardHTML()}
      <div class="hai" aria-label="Anh Hải, chủ quán"></div>
      <div class="bar">
        <div class="bar-top">
          <span class="cups"><i></i><i></i><i></i></span>
          <span class="deco">🪴</span>
          <span class="basket">🍊🍍🍎</span>
        </div>
        <div class="bar-front">${LOGO('rgba(243,227,195,.25)')}</div>
      </div>
      <div class="dlg" id="dlg" data-act="dlg">${dlgHTML()}</div>
      ${state.scene.board ? boardHTML() : ''}
      ${state.scene.info ? infoHTML() : ''}
    </div>`;
  }

  function after() {
    // sau khi render: chạy hiệu ứng gõ chữ nếu dòng hiện tại chưa gõ xong
    if (state.scene.phase !== 'inside') return;
    if (!state.dlg) greet();
    else if (!state.dlg.done) type();
  }

  return { html, after, talk, tapDialog, skip, choose, openInfo, closeInfo, priceTag, enter, openBoard, closeBoard, pickDrink, mainChoices, greet };
})();
