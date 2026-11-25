// ===== Nhân vật & tủ đồ (Quán chung) =====
// Nhân vật toàn thân vẽ bằng SVG theo từng lớp trang phục: mũ, áo, quần/váy, giày dép, phụ kiện.
// Đồ mua bằng xu (chung ví với Góc quán). Một số món chỉ dành cho hạng VIP hoặc mở khóa theo món thật đã mua.
const Outfit = (() => {
  const SLOTS = [
    { id: 'hat',    name: 'Mũ',        icon: '🧢' },
    { id: 'top',    name: 'Áo',        icon: '👕' },
    { id: 'bottom', name: 'Quần / váy', icon: '👖' },
    { id: 'shoes',  name: 'Giày dép',  icon: '👟' },
    { id: 'acc',    name: 'Phụ kiện',  icon: '🕶️' },
  ];

  // s: kiểu vẽ; c, c2: màu. vip: hạng cần có. need: { kind, n } số món thật đã mua (theo CornerData.KINDS)
  const ITEMS = [
    // --- mũ ---
    { id: 'cap_do',     slot: 'hat', name: 'Mũ lưỡi trai đỏ', price: 40,  s: 'cap',    c: '#d23a2a' },
    { id: 'mu_len',     slot: 'hat', name: 'Mũ len xanh',     price: 60,  s: 'beanie', c: '#2f6f8f', c2: '#f4f1ea' },
    { id: 'non_la',     slot: 'hat', name: 'Nón lá',          price: 80,  s: 'nonla',  c: '#e8d39a', c2: '#b8975a' },
    { id: 'mu_noi',     slot: 'hat', name: 'Mũ nồi nâu',      price: 90,  s: 'beret',  c: '#6b3a26' },
    { id: 'mu_phot',    slot: 'hat', name: 'Mũ phớt',         price: 120, s: 'fedora', c: '#3b3b3b', c2: '#c9971f' },
    { id: 'cap_dong',   slot: 'hat', name: 'Mũ H hạng Đồng',  price: 0,   s: 'cap',    c: '#b87333', logo: true, vip: 'dong' },
    { id: 'vuong_mien', slot: 'hat', name: 'Vương miện Vàng', price: 0,   s: 'crown',  c: '#e0a800', vip: 'vang' },
    // --- áo ---
    { id: 'thun_trang', slot: 'top', name: 'Áo thun trắng',    price: 0,   s: 'tee',    c: '#f4f1ea', starter: true },
    { id: 'thun_do',    slot: 'top', name: 'Áo thun đỏ',       price: 30,  s: 'tee',    c: '#d23a2a' },
    { id: 'ao_soc',     slot: 'top', name: 'Áo sọc thủy thủ',  price: 50,  s: 'stripe', c: '#f4f1ea', c2: '#2a4f8f' },
    { id: 'so_mi',      slot: 'top', name: 'Sơ mi xanh',       price: 60,  s: 'shirt',  c: '#8fb4d8' },
    { id: 'hoodie',     slot: 'top', name: 'Hoodie vàng mù tạt', price: 80, s: 'hoodie', c: '#d9a62e' },
    { id: 'thun_cam',   slot: 'top', name: 'Áo thun cam',      price: 40,  s: 'tee',    c: '#f08a24', need: { kind: 'juice', n: 3 } },
    { id: 'tap_de',     slot: 'top', name: 'Tạp dề barista',   price: 70,  s: 'apron',  c: '#f4f1ea', c2: '#6b4226', need: { kind: 'cafe', n: 5 } },
    { id: 'ao_dai',     slot: 'top', name: 'Áo dài lụa',       price: 150, s: 'aodai',  c: '#c8324a', c2: '#f6d36b' },
    { id: 'khoac_h',    slot: 'top', name: 'Áo khoác H hạng Bạc', price: 0, s: 'jacket', c: '#6b4226', c2: '#f4f1ea', vip: 'bac' },
    // --- quần / váy ---
    { id: 'jean',       slot: 'bottom', name: 'Quần jean',     price: 0,  s: 'long',  c: '#3d5a86', starter: true },
    { id: 'kaki',       slot: 'bottom', name: 'Quần kaki be',  price: 30, s: 'long',  c: '#c9b088' },
    { id: 'short',      slot: 'bottom', name: 'Quần short',    price: 30, s: 'short', c: '#4a6b3a' },
    { id: 'vay_xoe',    slot: 'bottom', name: 'Váy xòe hoa',   price: 50, s: 'skirt', c: '#e88aa6', c2: '#fff1a8' },
    { id: 'ong_rong',   slot: 'bottom', name: 'Quần ống rộng', price: 60, s: 'wide',  c: '#2e2a26' },
    { id: 'quan_lua',   slot: 'bottom', name: 'Quần lụa trắng', price: 40, s: 'wide', c: '#f4f1ea' },
    // --- giày dép ---
    { id: 'dep_to_ong', slot: 'shoes', name: 'Dép tổ ong',     price: 0,  s: 'flip',    c: '#2f6fd0', starter: true },
    { id: 'sneaker',    slot: 'shoes', name: 'Sneaker trắng',  price: 40, s: 'sneaker', c: '#f8f8f4', c2: '#d23a2a' },
    { id: 'giay_vai',   slot: 'shoes', name: 'Giày vải đen',   price: 50, s: 'sneaker', c: '#2a2a2a', c2: '#f4f1ea' },
    { id: 'boot',       slot: 'shoes', name: 'Bốt da nâu',     price: 90, s: 'boot',    c: '#6b3a1f' },
    { id: 'guoc',       slot: 'shoes', name: 'Guốc mộc',       price: 60, s: 'clog',    c: '#b07a46', c2: '#c8324a' },
    { id: 'sneaker_vang', slot: 'shoes', name: 'Sneaker Vàng VIP', price: 0, s: 'sneaker', c: '#e0a800', c2: '#2e1a10', vip: 'vang' },
    // --- phụ kiện ---
    { id: 'kinh_ram',   slot: 'acc', name: 'Kính râm',         price: 40, s: 'glasses' },
    { id: 'khan',       slot: 'acc', name: 'Khăn quàng len',   price: 50, s: 'scarf',  c: '#c8324a' },
    { id: 'tai_nghe',   slot: 'acc', name: 'Tai nghe',         price: 60, s: 'phones', c: '#2a2a2a' },
    { id: 'tui_tote',   slot: 'acc', name: 'Túi tote Cafe Hải', price: 40, s: 'tote',  c: '#efe3c8' },
    { id: 'hoa_cai',    slot: 'acc', name: 'Hoa vàng cài tóc', price: 30, s: 'flower', c: '#f2d64b', need: { kind: 'qua', n: 1 } },
  ];
  const ITEM = Object.fromEntries(ITEMS.map(it => [it.id, it]));
  const STARTER = { top: 'thun_trang', bottom: 'jean', shoes: 'dep_to_ong' };
  const VIP_RANK = { dong: 1, bac: 2, vang: 3 };
  const VIP_NAME = { dong: 'Đồng', bac: 'Bạc', vang: 'Vàng' };

  const SKIN = ['#f6d3b3', '#eec29b', '#d9a77e', '#f3c9a6'];
  const HAIR = ['#2b1a12', '#4a2c1a', '#1d1d1d', '#7a4a2c', '#a0522d'];
  const hash = s => Array.from(String(s || 'x')).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

  // Đồ khách đang mặc. Khách chưa chọn đồ: phối ngẫu nhiên (cố định theo khách) từ đồ thường.
  function randomWear(key) {
    const h = hash(key), pick = (slot, k, none) => {
      const list = ITEMS.filter(it => it.slot === slot && !it.vip && !it.need);
      const r = (h >> k) % (list.length + (none ? 2 : 0));
      return r < list.length ? list[r].id : null;
    };
    return { hat: pick('hat', 2, true), top: pick('top', 5), bottom: pick('bottom', 8), shoes: pick('shoes', 11), acc: pick('acc', 14, true) };
  }
  const wearFrom = doc => ({ ...STARTER, ...((doc && doc.wear) || {}) });

  // ---------- vẽ ----------
  function hatSVG(it) {
    const c = it.c, c2 = it.c2 || '#00000033';
    switch (it.s) {
      case 'cap': return `<path d="M10.5 16 Q24 1 37.5 16 Z" fill="${c}"/><path d="M30 14 Q40 13 44 16 Q38 18 31 17 Z" fill="${c}" opacity=".9"/>${it.logo ? '<text x="23" y="14" font-size="7" font-weight="900" fill="#f3e3c3" text-anchor="middle">H</text>' : ''}`;
      case 'beanie': return `<path d="M10.5 17 Q11 3 24 3 Q37 3 37.5 17 Z" fill="${c}"/><rect x="10" y="13" width="28" height="5" rx="2" fill="${c2}"/><circle cx="24" cy="3" r="3.2" fill="${c2}"/>`;
      case 'nonla': return `<path d="M2 17 L24 -1 L46 17 Q24 21 2 17 Z" fill="${c}" stroke="${c2}" stroke-width=".8"/><path d="M13 12 L35 12 M8 15 L40 15 M18 8 L30 8" stroke="${c2}" stroke-width=".7"/>`;
      case 'beret': return `<ellipse cx="22" cy="10" rx="15" ry="6.5" fill="${c}"/><circle cx="22" cy="3.6" r="1.8" fill="${c}"/>`;
      case 'fedora': return `<ellipse cx="24" cy="14" rx="19" ry="3.6" fill="${c}"/><path d="M13 14 Q13 2 24 3 Q35 2 35 14 Z" fill="${c}"/><rect x="13" y="10" width="22" height="3" fill="${c2}"/>`;
      case 'crown': return `<polygon points="12,15 12,4 17.5,9.5 24,1.5 30.5,9.5 36,4 36,15" fill="${c}" stroke="#a87b00" stroke-width="1"/><circle cx="24" cy="10" r="1.8" fill="#d23a2a"/><circle cx="16" cy="12" r="1.2" fill="#2a7bd2"/><circle cx="32" cy="12" r="1.2" fill="#2a7bd2"/>`;
    }
    return '';
  }
  function accSVG(it, back) {
    switch (it.s) {
      case 'glasses': return back ? '' : `<rect x="14" y="18" width="8.5" height="5" rx="2" fill="#1d1d1d"/><rect x="25.5" y="18" width="8.5" height="5" rx="2" fill="#1d1d1d"/><path d="M22.5 19.5 H25.5" stroke="#1d1d1d" stroke-width="1.2"/>`;
      case 'scarf': return back ? '' : `<path d="M14 31 Q24 37 34 31 L34 35 Q24 40 14 35 Z" fill="${it.c}"/><rect x="27" y="34" width="5" height="12" rx="1.5" fill="${it.c}"/><path d="M27.5 44 H31.5" stroke="#fff" stroke-width=".8" opacity=".6"/>`;
      case 'phones': return back ? '' : `<path d="M10 21 Q10 5 24 5 Q38 5 38 21" stroke="${it.c}" stroke-width="2.2" fill="none"/><rect x="8" y="18" width="5" height="8" rx="2" fill="${it.c}"/><rect x="35" y="18" width="5" height="8" rx="2" fill="${it.c}"/>`;
      case 'tote': return back ? '' : `<path d="M35 34 L41 52" stroke="#a5793f" stroke-width="1.4"/><rect x="36" y="48" width="11" height="13" rx="1.5" fill="${it.c}" stroke="#a5793f" stroke-width=".8"/><text x="41.5" y="57.5" font-size="6" font-weight="900" text-anchor="middle" fill="#7a2e1f">H</text>`;
      case 'flower': return back ? '' : `<g transform="translate(33 10)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-3" rx="2" ry="3" fill="${it.c}" transform="rotate(${a})"/>`).join('')}<circle r="1.6" fill="#c98a1a"/></g>`;
    }
    return '';
  }
  function topSVG(it, skin) {
    const c = it.c, c2 = it.c2 || '#00000022';
    const longSleeve = ['shirt', 'hoodie', 'jacket', 'aodai'].includes(it.s);
    const arm = x => longSleeve
      ? `<rect x="${x}" y="34" width="6" height="21" rx="3" fill="${c}"/><circle cx="${x + 3}" cy="56" r="2.8" fill="${skin}"/>`
      : `<rect x="${x}" y="34" width="6" height="21" rx="3" fill="${skin}"/><rect x="${x - .5}" y="33" width="7" height="9" rx="3" fill="${c}"/>`;
    let body = `<path d="M13 36 Q13 32.5 18 32 H30 Q35 32.5 35 36 V60 H13 Z" fill="${c}"/>`;
    let over = '';
    if (it.s === 'stripe') over = [37, 42, 47, 52, 57].map(y => `<rect x="13" y="${y}" width="22" height="2" fill="${c2}"/>`).join('');
    if (it.s === 'shirt') over = `<path d="M20 32 L24 37 L28 32" fill="none" stroke="#fff" stroke-width="1.6"/>${[40, 45, 50, 55].map(y => `<circle cx="24" cy="${y}" r=".8" fill="#fff"/>`).join('')}`;
    if (it.s === 'hoodie') over = `<path d="M18 40 H30 V46 H18 Z" fill="#00000018"/><path d="M21 33 L22 40 M27 33 L26 40" stroke="#f4f1ea" stroke-width=".9"/>`;
    if (it.s === 'apron') over = `<path d="M17 32 L18 40 M31 32 L30 40" stroke="${c2}" stroke-width="1.4"/><path d="M17 40 H31 L32 64 H16 Z" fill="${c2}"/><rect x="20" y="46" width="8" height="5" rx="1" fill="#00000025"/><text x="24" y="58" font-size="5" font-weight="900" text-anchor="middle" fill="#f3e3c3">H</text>`;
    if (it.s === 'jacket') over = `<path d="M21 32 H27 V60 H21 Z" fill="${c2}"/><path d="M21 32 L19 40 L21 44 M27 32 L29 40 L27 44" stroke="#00000040" stroke-width="1" fill="none"/><text x="17" y="52" font-size="5" font-weight="900" fill="#f6d36b">H</text>`;
    if (it.s === 'aodai') {
      body = `<path d="M13 36 Q13 32.5 18 32 H30 Q35 32.5 35 36 V62 L33 82 H15 L13 62 Z" fill="${c}"/>`;
      over = `<path d="M20 32 Q24 35 28 32" stroke="${c2}" stroke-width="1.5" fill="none"/><path d="M13 61 L35 61" stroke="#00000020"/><circle cx="24" cy="46" r="3.5" fill="none" stroke="${c2}" stroke-width=".9"/>`;
    }
    return { arms: arm(7.5) + arm(34.5), body: body + over };
  }
  function bottomSVG(it, skin) {
    const c = it.c;
    const legs = `<rect x="15.5" y="58" width="7.5" height="27" rx="2" fill="${skin}"/><rect x="25" y="58" width="7.5" height="27" rx="2" fill="${skin}"/>`;
    switch (it.s) {
      case 'long': return legs + `<path d="M14 58 H34 V85 H25 L24 66 L23 85 H14 Z" fill="${c}"/>`;
      case 'short': return legs + `<path d="M14 58 H34 V71 H25 L24 64 L23 71 H14 Z" fill="${c}"/>`;
      case 'wide': return legs + `<path d="M14 58 H34 L36 86 H25.5 L24 66 L22.5 86 H12 Z" fill="${c}"/>`;
      case 'skirt': return legs + `<path d="M14 57 H34 L39 75 Q24 79 9 75 Z" fill="${c}"/>${[[16, 66], [24, 70], [31, 65], [20, 74], [29, 73]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${it.c2}"/>`).join('')}`;
    }
    return legs;
  }
  function shoesSVG(it) {
    const c = it.c, c2 = it.c2 || '#fff';
    const one = x => {
      switch (it.s) {
        case 'flip': return `<rect x="${x - 1}" y="87" width="11" height="2.5" rx="1.2" fill="${c}"/><path d="M${x + 2} 87 L${x + 4.5} 84.5 L${x + 7} 87" stroke="${c}" stroke-width="1.6" fill="none"/>`;
        case 'sneaker': return `<path d="M${x - 1} 89 V85 Q${x - 1} 83 ${x + 2} 83 H${x + 6} Q${x + 10} 84 ${x + 10.5} 89 Z" fill="${c}"/><rect x="${x - 1}" y="88" width="11.5" height="2" rx="1" fill="${c2}"/>`;
        case 'boot': return `<path d="M${x} 77 H${x + 7.5} V85 Q${x + 11} 86 ${x + 11} 89.5 H${x - 1} Z" fill="${c}"/>`;
        case 'clog': return `<rect x="${x - 1}" y="87" width="11" height="3" rx="1" fill="${c}"/><path d="M${x} 87 Q${x + 4.5} 83 ${x + 9} 87" fill="${c2}"/>`;
      }
      return '';
    };
    return one(14.5) + one(24.5);
  }

  // wear: { hat, top, bottom, shoes, acc }; o: { key, pose: 'stand' | 'sit', cls, title }
  function draw(wear, o = {}) {
    const h = hash(o.key), skin = SKIN[h % 4], hair = HAIR[(h >> 3) % 5], long = (h >> 9) % 3 === 0;
    const W = k => wear && wear[k] && ITEM[wear[k]];
    const top = topSVG(W('top') || ITEM.thun_trang, skin);
    const acc = W('acc'), hat = W('hat');
    const sit = o.pose === 'sit';
    return `<svg class="figure ${o.cls || ''}" viewBox="${sit ? '0 -2 48 62' : '0 -2 48 94'}" aria-hidden="true">
      ${long ? `<path d="M10.5 19 Q10 36 15 37 H33 Q38 36 37.5 19 Z" fill="${hair}"/>` : ''}
      ${W('top') && W('top').s === 'hoodie' ? `<path d="M11 30 Q10 12 24 11 Q38 12 37 30 Z" fill="${W('top').c}" opacity=".9"/>` : ''}
      ${sit ? '' : bottomSVG(W('bottom') || ITEM.jean, skin) + shoesSVG(W('shoes') || ITEM.dep_to_ong)}
      ${top.body}${top.arms}
      <rect x="21" y="29" width="6" height="5" fill="${skin}"/>
      <circle cx="24" cy="20" r="12.5" fill="${skin}"/>
      <path d="M11.5 19 Q12 6 24 6.5 Q36 6 36.5 19 Q31 12.5 24 12.5 Q17 12.5 11.5 19 Z" fill="${hair}"/>
      <circle cx="19.5" cy="21" r="1.5" fill="#2a1a12"/><circle cx="28.5" cy="21" r="1.5" fill="#2a1a12"/>
      <path d="M21 25.5 Q24 27.5 27 25.5" stroke="#2a1a12" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <circle cx="16.5" cy="24" r="1.8" fill="#f08a7a" opacity=".45"/><circle cx="31.5" cy="24" r="1.8" fill="#f08a7a" opacity=".45"/>
      ${acc ? accSVG(acc) : ''}${hat ? hatSVG(hat) : ''}
    </svg>`;
  }

  // ---------- tủ đồ ----------
  const owns = (doc, id) => !!ITEM[id] && (ITEM[id].starter || !!(doc && doc.closet && doc.closet[id]));
  // Lý do chưa mua/mặc được (chuỗi rỗng = được)
  function lockText(doc, id, vip) {
    const it = ITEM[id];
    if (it.vip && (VIP_RANK[vip && vip.id] || 0) < VIP_RANK[it.vip]) return `Dành cho VIP ${VIP_NAME[it.vip]}`;
    if (it.need && ((doc && doc.stats && doc.stats[it.need.kind]) || 0) < it.need.n) {
      const kinds = typeof CornerData !== 'undefined' ? CornerData.KINDS : {};
      return `Mua ${it.need.n} ${kinds[it.need.kind] || 'món'} để mở`;
    }
    return '';
  }
  const balance = doc => Math.max(0, ((doc && doc.xu) || 0) - ((doc && doc.spent) || 0));

  // Bản demo: mua & mặc ghi vào góc quán (corners) theo số điện thoại – dùng chung ví xu
  function buyLocal(key, id, vip) {
    const doc = CornerData.localGet(key), it = ITEM[id];
    if (owns(doc, id)) throw new Error('Bạn đã có món này');
    const lock = lockText(doc, id, vip);
    if (lock) throw new Error(lock);
    if (balance(doc) < it.price) throw new Error(`Cần ${it.price} xu, bạn còn ${balance(doc)} xu`);
    doc.spent = (doc.spent || 0) + it.price;
    doc.closet = { ...(doc.closet || {}), [id]: 1 };
    doc.wear = { ...wearFrom(doc), [it.slot]: id };
    CornerData.localSet(key, doc);
    return doc;
  }
  function wearLocal(key, slot, id, vip) {
    const doc = CornerData.localGet(key);
    if (id && !owns(doc, id) && !(ITEM[id].vip && !lockText(doc, id, vip))) throw new Error('Bạn chưa có món này');
    if (!id && ['top', 'bottom', 'shoes'].includes(slot)) id = STARTER[slot];
    doc.wear = { ...wearFrom(doc), [slot]: id || null };
    CornerData.localSet(key, doc);
    return doc;
  }

  const names = wear => SLOTS.map(s => wear[s.id] && ITEM[wear[s.id]] ? ITEM[wear[s.id]].name : null).filter(Boolean);

  return { SLOTS, ITEMS, ITEM, STARTER, VIP_NAME, draw, randomWear, wearFrom, owns, lockText, balance, buyLocal, wearLocal, names };
})();
