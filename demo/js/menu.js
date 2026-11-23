// ===== Dữ liệu menu Cafe Hải (lấy từ ảnh menu quán) =====
// Mỗi món có danh sách "bước pha". Kết quả từng bước được quy về tùy chọn thật của quán.

const ING = {
  coldbrew: { name: 'Coldbrew',    color: '#4a2a17', dim: 'Độ đậm',      levels: ['Nhạt', 'Vừa', 'Đậm'], vessel: 'bottle' },
  suadac:   { name: 'Sữa đặc',     color: '#ecdcb8', dim: 'Độ ngọt',     levels: ['Ít ngọt', 'Vừa', 'Ngọt'], vessel: 'can' },
  suatuoi:  { name: 'Sữa tươi',    color: '#f7f2e8', dim: 'Sữa tươi',    levels: ['Ít sữa', 'Vừa', 'Nhiều sữa'], vessel: 'carton' },
  duong:    { name: 'Nước đường',  color: '#efe3bf', dim: 'Đường',       levels: ['Ít ngọt', 'Vừa', 'Ngọt'], sugar: true, alpha: .55, vessel: 'bottle' },
  kemmuoi:  { name: 'Kem muối',    color: '#fbf4e4', dim: 'Kem muối',    levels: ['Ít kem', 'Vừa', 'Nhiều kem'], vessel: 'pitcher' },
  caramel:  { name: 'Caramel',     color: '#c8792b', dim: 'Caramel',     levels: ['Ít', 'Vừa', 'Nhiều'], vessel: 'bottle' },
  cotdua:   { name: 'Cốt dừa',     color: '#fffaf0', dim: 'Cốt dừa',     levels: ['Ít', 'Vừa', 'Nhiều'], vessel: 'pitcher' },
  kakao:    { name: 'Kakao',       color: '#5a3020', dim: 'Độ đậm',      levels: ['Nhạt', 'Vừa', 'Đậm'], vessel: 'pitcher' },
  suachua:  { name: 'Sữa chua',    color: '#fbf7ef', dim: 'Sữa chua',    levels: ['Ít', 'Vừa', 'Nhiều'], vessel: 'pitcher' },
  matcha:   { name: 'Matcha',      color: '#7fa650', dim: 'Độ đậm',      levels: ['Nhạt', 'Vừa', 'Đậm'], vessel: 'pitcher' },
  tra:      { name: 'Trà',         color: '#c98a3a', dim: 'Độ đậm trà',  levels: ['Nhạt', 'Vừa', 'Đậm'], alpha: .85, vessel: 'teapot' },
  nhadam:   { name: 'Nha đam',     color: '#e3efd2', dim: 'Nha đam',     levels: ['Ít', 'Vừa', 'Nhiều'], vessel: 'pitcher' },
};

// Topping thả bằng muôi
const TOP = {
  chanh: { name: 'Lát chanh', icon: '🍋', dim: 'Chanh', levels: ['Ít chanh', 'Vừa', 'Nhiều chanh'] },
  sau:   { name: 'Quả sấu',   icon: '🫒', dim: 'Sấu',   levels: ['Ít sấu', 'Vừa', 'Nhiều sấu'] },
  quat:  { name: 'Quả quất',  icon: '🟠', dim: 'Quất',  levels: ['Ít quất', 'Vừa', 'Nhiều quất'] },
};

const FRUIT = {
  dua:      { name: 'Dứa',       icon: '🍍', color: '#f2c200' },
  cam:      { name: 'Cam',       icon: '🍊', color: '#f39a12' },
  tao:      { name: 'Táo',       icon: '🍎', color: '#e9d27a' },
  oi:       { name: 'Ổi',        icon: '🍏', color: '#f0b3a0', svg: 'oi' },
  chanhleo: { name: 'Chanh leo', icon: '🟣', color: '#e3a400', svg: 'chanhleo' },
  carot:    { name: 'Cà rốt',    icon: '🥕', color: '#f07b1d' },
  duahau:   { name: 'Dưa hấu',   icon: '🍉', color: '#e8434f' },
  quyt:     { name: 'Quýt',      icon: '🍊', color: '#f5a623' },
  duavang:  { name: 'Dưa vàng',  icon: '🍈', color: '#f1d36b' },
};

// Màu cà phê phin theo số muỗng
const COFFEE_COLORS = ['#8a6248', '#6b4630', '#3b2116', '#24140c', '#1a0e08'];

// Các loại bước pha:
//  boil  : giữ để đun nước, canh nhiệt độ (t = khoảng °C chuẩn)
//  scoop : múc cà phê vào phin (t = số muỗng chuẩn) → Độ đậm
//  phin  : giữ để rót nước sôi vào phin, phin nhỏ giọt xuống ly (s = phần chiều cao ly)
//  pour  : giữ để rót nguyên liệu (s = phần chiều cao ly khi rót đầy thanh, t = vạch mục tiêu 0-100)
//  ice   : thả đá bằng muôi đang lắc
//  tap   : thả topping bằng muôi đang lắc
//  fruit : cho trái cây vào máy ép (free = khách tự chọn)
//  press : giữ để ép, nước ép chảy xuống ly
const BOIL = (t = [90, 96]) => ({ type: 'boil', t });
const SCOOP = (t = [2, 2]) => ({ type: 'scoop', t });
const PHIN = (s, t = [55, 75]) => ({ type: 'phin', s, t });
const P = (ing, s, t = [40, 60]) => ({ type: 'pour', ing, s, t });
const ICE = { type: 'ice', t: [3, 4] };
const TAP = (top, t = [2, 3]) => ({ type: 'tap', top, t });
const FR = (fruits, free = false) => ({ type: 'fruit', fruits, free });
const PRESS = { type: 'press', s: .75, t: [70, 85] };

const CATS = [
  { id: 'cafe', name: 'Cà phê' },
  { id: 'ep',   name: 'Nước ép nguyên chất' },
  { id: 'ketp', name: 'Nước ép kết hợp' },
  { id: 'khac', name: 'Khác' },
  { id: 'chai', name: 'Cà phê chai' },
];

const juice = (id, name, price, fruits, cat) => ({
  id, name, price, cat, steps: [FR(fruits), PRESS, P('duong', .1, [38, 54]), ICE],
});

const MENU = [
  // --- Cà phê ---
  { id: 'nau',        name: 'Nâu',              price: 20, cat: 'cafe', steps: [BOIL(), P('suadac', .25), SCOOP(), PHIN(.55), ICE] },
  { id: 'den',        name: 'Đen',              price: 20, cat: 'cafe', steps: [BOIL(), SCOOP(), PHIN(.65), P('duong', .12, [38, 54]), ICE] },
  { id: 'xiu',        name: 'Xỉu',              price: 20, cat: 'cafe', steps: [BOIL(), P('suadac', .22), P('suatuoi', .35), SCOOP([1, 1]), PHIN(.3), ICE] },
  { id: 'kakao',      name: 'Kakao',            price: 25, cat: 'cafe', hot: true, steps: [BOIL([85, 92]), P('kakao', .45), P('suatuoi', .45)] },
  { id: 'xiumuoi',    name: 'Xỉu Muối',         price: 25, cat: 'cafe', steps: [BOIL(), P('suadac', .2), P('suatuoi', .28), SCOOP([1, 1]), PHIN(.3), P('kemmuoi', .18), ICE] },
  { id: 'caramel',    name: 'Cafe Caramel',     price: 25, cat: 'cafe', steps: [BOIL(), P('caramel', .14, [30, 55]), P('suadac', .2), SCOOP(), PHIN(.45), ICE] },
  { id: 'xiucotdua',  name: 'Xỉu Cốt Dừa',      price: 25, cat: 'cafe', steps: [BOIL(), P('cotdua', .32), P('suadac', .18), SCOOP([1, 1]), PHIN(.35), ICE] },
  { id: 'kakaomuoi',  name: 'Kakao Muối',       price: 30, cat: 'cafe', steps: [P('kakao', .42), P('suatuoi', .3), P('kemmuoi', .18), ICE] },
  { id: 'cbchanh',    name: 'Coldbrew Chanh Vàng', price: 25, cat: 'cafe', steps: [P('coldbrew', .7, [50, 70]), P('duong', .12, [38, 54]), TAP('chanh'), ICE] },
  { id: 'cbsau',      name: 'Coldbrew Sấu',     price: 25, cat: 'cafe', steps: [P('coldbrew', .7, [50, 70]), P('duong', .12, [38, 54]), TAP('sau'), ICE] },
  { id: 'suachuacf',  name: 'Sữa Chua Cafe',    price: 30, cat: 'cafe', steps: [BOIL(), P('suachua', .45), SCOOP(), PHIN(.4), ICE] },
  { id: 'matcha',     name: 'Matcha Latte',     price: 30, cat: 'cafe', steps: [P('suatuoi', .5), P('matcha', .4), ICE] },

  // --- Nước ép nguyên chất ---
  juice('epdua',     'Ép Dứa',       35, ['dua'], 'ep'),
  juice('epcam',     'Ép Cam',       35, ['cam'], 'ep'),
  juice('eptao',     'Ép Táo',       35, ['tao'], 'ep'),
  juice('epoi',      'Ép Ổi',        30, ['oi'], 'ep'),
  juice('epchanhleo','Ép Chanh Leo', 30, ['chanhleo'], 'ep'),
  juice('epcarot',   'Ép Cà Rốt',    30, ['carot'], 'ep'),
  juice('epduahau',  'Ép Dưa Hấu',   30, ['duahau'], 'ep'),
  juice('epquyt',    'Ép Quýt',      35, ['quyt'], 'ep'),
  juice('epduavang', 'Ép Dưa Vàng',  30, ['duavang'], 'ep'),

  // --- Nước ép kết hợp ---
  juice('camdua',     'Cam Dứa',       40, ['cam', 'dua'], 'ketp'),
  juice('camcarot',   'Cam Cà Rốt',    40, ['cam', 'carot'], 'ketp'),
  juice('duacarot',   'Dứa Cà Rốt',    40, ['dua', 'carot'], 'ketp'),
  juice('camtao',     'Cam Táo',       40, ['cam', 'tao'], 'ketp'),
  juice('oitao',      'Ổi Táo',        40, ['oi', 'tao'], 'ketp'),
  juice('taodua',     'Táo Dứa',       40, ['tao', 'dua'], 'ketp'),
  juice('camchanhleo','Cam Chanh Leo', 40, ['cam', 'chanhleo'], 'ketp'),

  // --- Khác ---
  { id: 'mix',      name: 'Mix theo yêu cầu',  price: 45, cat: 'khac', star: true, steps: [FR([], true), PRESS, P('duong', .1, [38, 54]), ICE] },
  { id: 'trachanh', name: 'Trà Chanh',          price: 15, cat: 'khac', steps: [BOIL([80, 90]), P('tra', .6, [45, 65]), P('duong', .12, [38, 54]), TAP('chanh'), ICE] },
  { id: 'traquat',  name: 'Trà Quất Nha Đam',   price: 20, cat: 'khac', steps: [BOIL([80, 90]), P('tra', .5, [45, 65]), P('nhadam', .18), TAP('quat'), ICE] },

  // --- Cà phê chai (chỉ đặt nhanh) ---
  { id: 'chaiden',  name: 'Chai Đen',  price: 70, cat: 'chai', bottle: '#2a1810', steps: [] },
  { id: 'chainau',  name: 'Chai Nâu',  price: 65, cat: 'chai', bottle: '#7a4a30', steps: [] },
  { id: 'chaixiu',  name: 'Chai Xỉu',  price: 60, cat: 'chai', bottle: '#b68a62', steps: [] },
  { id: 'chaimuoi', name: 'Chai Muối', price: 50, cat: 'chai', bottle: '#d9c7ad', steps: [] },
];

const ICE_LEVELS = ['Không đá', 'Ít đá', 'Vừa đá', 'Nhiều đá'];
const STRENGTH = ['Nhạt', 'Vừa', 'Đậm'];
const SUGAR = ['0% đường', '30% đường', '50% đường', '70% đường', '100% đường', '120% đường'];

// ===== Điểm thưởng: tối đa tỷ lệ với giá ly =====
// Mặc định: 1.000đ = 100 điểm → ly 20K tối đa 2.000 điểm. Mua nhiều ly thì nhân theo số lượng.
// Quầy chỉnh được trong "Quản lý menu → Cấu hình điểm số" (MenuAdmin ghi đè các giá trị này).
const POINT_CFG = {
  perK: 100,      // điểm cho mỗi 1.000đ
  basis: 'base',  // tính theo giá gốc ('base') hay giá sau giảm ('sale')
  base: .8, perfect: .1, speed: .1, // chia điểm ly tự pha: độ chuẩn / thưởng hoàn hảo / thưởng tốc độ
  quick: .8,      // không chơi game được bao nhiêu % điểm tối đa
  floor: 0,       // điểm sàn cho ly tự pha ở chế độ Thử thách (% điểm tối đa)
};
const POINT_DEFAULT = { ...POINT_CFG };
const POINT_SPLIT = POINT_CFG;
const pointPrice = d => (POINT_CFG.basis === 'sale' && typeof Promo !== 'undefined' ? Promo.unitPrice(d).price : d.price);
const maxPoints = d => Math.round(pointPrice(d) * POINT_CFG.perK);
const quickPoints = d => Math.round(maxPoints(d) * POINT_CFG.quick);
const scoredSteps = d => Math.max(1, d.steps.filter(s => s.type !== 'fruit').length);

// Sai lệch nhỏ (trong khoảng "Tuyệt") vẫn được quy về mức chuẩn, để sao và công thức khớp nhau
const MARGIN = { pour: 5, phin: 5, press: 5, scoop: 0, tap: 0, ice: 0 };
const level3 = (v, t, levels, m = 0) => (v < t[0] - m ? levels[0] : v <= t[1] + m ? levels[1] : levels[2]);

function sugarLevel(v, t) {
  if (v >= t[0] && v <= t[1]) return SUGAR[4]; // đúng vạch = 100% (chuẩn quán)
  if (v > t[1]) return SUGAR[5];
  const r = v / ((t[0] + t[1]) / 2);
  return r < .15 ? SUGAR[0] : r < .45 ? SUGAR[1] : r < .65 ? SUGAR[2] : SUGAR[3];
}

// ===== Quy đổi kết quả bước → tùy chọn thật =====
function stepOption(step, value) {
  switch (step.type) {
    case 'pour': {
      const ing = ING[step.ing];
      if (ing.sugar) return { label: 'Đường', value: sugarLevel(value, step.t), choices: SUGAR };
      const level = level3(value, step.t, ing.levels, MARGIN.pour);
      return { label: ing.dim, value: level, choices: ing.levels };
    }
    case 'scoop':
      return { label: 'Độ đậm', value: level3(value, step.t, STRENGTH, MARGIN.scoop), choices: STRENGTH };
    case 'tap': {
      const top = TOP[step.top];
      return { label: top.dim, value: level3(value, step.t, top.levels), choices: top.levels };
    }
    case 'ice': {
      const level = value === 0 ? ICE_LEVELS[0] : value <= 2 ? ICE_LEVELS[1] : value <= 4 ? ICE_LEVELS[2] : ICE_LEVELS[3];
      return { label: 'Đá', value: level, choices: ICE_LEVELS };
    }
    case 'fruit':
      return step.free ? { label: 'Trái cây', value: value.map(f => FRUIT[f].name).join(' + ') || 'Chưa chọn', fixed: true } : null;
    default:
      return null; // boil, phin, press: chỉ tính điểm
  }
}

// Điểm 0-100 cho một bước
function stepScore(step, value) {
  if (step.type === 'fruit') return null;
  const [lo, hi] = step.t;
  if (value >= lo && value <= hi) return 100;
  const dist = value < lo ? lo - value : value - hi;
  const k = { boil: 6, pour: 3, phin: 3, press: 3, scoop: 40, tap: 25, ice: 25 }[step.type];
  return Math.max(0, Math.round(100 - dist * k));
}

const midValue = s =>
  s.type === 'fruit' ? (s.free ? ['duahau', 'cam', 'dua'] : [...s.fruits]) :
  ['pour', 'phin', 'press', 'boil'].includes(s.type) ? (s.t[0] + s.t[1]) / 2 : s.t[0];

// Tùy chọn mặc định cho "Đặt nhanh" (mức vừa)
function defaultOptions(drink) {
  if (drink.box) return boxOptions(drink, null, 'hoa');
  if (drink.simpleOpts) return SIMPLE_OPTS();
  return drink.steps.map(s => stepOption(s, midValue(s))).filter(Boolean);
}
const previewValues = d => d.steps.map(midValue);

const fmt = k => (k * 1000).toLocaleString('vi-VN') + 'đ';

// ===== Hình trái cây tự vẽ cho loại không có emoji (ổi, chanh leo) =====
const FRUIT_SVG = {
  oi: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><path d='M24 12c1-6 7-9 12-7-4 2-6 5-8 9z' fill='#4e8a2a'/><circle cx='24' cy='32' r='19' fill='#8cc152'/><circle cx='17' cy='25' r='4' fill='#b5dc7d'/><circle cx='30' cy='40' r='1.6' fill='#6a9e38'/><circle cx='20' cy='42' r='1.4' fill='#6a9e38'/><circle cx='44' cy='42' r='17' fill='#7cb342'/><circle cx='44' cy='42' r='14' fill='#f6c1cf'/><circle cx='44' cy='42' r='8' fill='#ef8fa8'/><g fill='#f7e3b5'><circle cx='40' cy='39' r='1.3'/><circle cx='47' cy='38' r='1.3'/><circle cx='45' cy='46' r='1.3'/><circle cx='40' cy='45' r='1.3'/><circle cx='49' cy='43' r='1.3'/></g></svg>",
  chanhleo: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='24' cy='30' r='19' fill='#5b2860'/><circle cx='17' cy='23' r='4' fill='#7d4583'/><g fill='#3f1a44'><circle cx='29' cy='36' r='1.6'/><circle cx='20' cy='39' r='1.4'/><circle cx='31' cy='24' r='1.3'/></g><circle cx='44' cy='42' r='17' fill='#4a1f4f'/><circle cx='44' cy='42' r='14' fill='#f2f0e6'/><circle cx='44' cy='42' r='12' fill='#f5b80f'/><g fill='#2a1a0e'><circle cx='40' cy='38' r='1.8'/><circle cx='47' cy='37' r='1.8'/><circle cx='50' cy='43' r='1.8'/><circle cx='45' cy='48' r='1.8'/><circle cx='39' cy='46' r='1.8'/><circle cx='44' cy='42' r='1.8'/></g></svg>",
};
const fruitSrc = f => 'data:image/svg+xml,' + encodeURIComponent(FRUIT_SVG[FRUIT[f].svg]);
const _fruitImg = {};
function fruitHTML(f, size = 30) {
  return FRUIT[f].svg
    ? '<img class="fi" src="' + fruitSrc(f) + '" width="' + size + '" height="' + size + '" alt="' + FRUIT[f].name + '">'
    : FRUIT[f].icon;
}
function drawFruit(ctx, f, x, y, size) {
  if (FRUIT[f].svg) {
    let img = _fruitImg[f];
    if (!img) { img = _fruitImg[f] = new Image(); img.src = fruitSrc(f); }
    if (img.complete) ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  } else {
    ctx.font = Math.round(size) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(FRUIT[f].icon, x, y);
  }
}
// tải sẵn ảnh
Object.keys(FRUIT).forEach(f => { if (FRUIT[f].svg && typeof Image !== 'undefined') { const i = new Image(); i.src = fruitSrc(f); _fruitImg[f] = i; } });

// ===== Hoa quả cắt (theo biển giá của quán: "Quả mix túi 30K – 80K, hộp mix từ 3–5 loại, đặt trước 30–60 phút") =====
CATS.splice(4, 0, { id: 'qua', name: 'Hoa quả cắt' });
MENU.push(
  { id: 'tuinho', name: 'Túi quả mix nhỏ', price: 30, cat: 'qua', box: { kinds: 3, per: 5 }, steps: [] },
  { id: 'tuivua', name: 'Túi quả mix vừa', price: 50, cat: 'qua', box: { kinds: 4, per: 4 }, steps: [] },
  { id: 'hoplon', name: 'Hộp quả mix lớn', price: 80, cat: 'qua', box: { kinds: 5, per: 4 }, steps: [] },
);

const CUT_FRUIT = {
  duahau:  { name: 'Dưa hấu',  icon: '🍉', flesh: '#ef5466' },
  nho:     { name: 'Nho xanh', icon: '🍇', flesh: '#b9dc6e' },
  xoai:    { name: 'Xoài',     icon: '🥭', flesh: '#f7b733' },
  dualuoi: { name: 'Dưa lưới', icon: '🍈', flesh: '#f6a75e' },
  mangcut: { name: 'Măng cụt', icon: '🟣', flesh: '#f6f1e7', svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='36' r='22' fill='#4b1c3f'/><circle cx='24' cy='28' r='6' fill='#6d2b5c'/><path d='M20 16c4 4 8 5 12 5s8-1 12-5c-2 6-6 9-12 9s-10-3-12-9z' fill='#4f7f2a'/><rect x='30' y='6' width='4' height='10' rx='2' fill='#3d5e20'/></svg>" },
  cam:     { name: 'Cam',      icon: '🍊', flesh: '#f7931e' },
  tao:     { name: 'Táo',      icon: '🍎', flesh: '#f4ecd0' },
  kiwi:    { name: 'Kiwi',     icon: '🥝', flesh: '#8cc63f' },
  dua:     { name: 'Dứa',      icon: '🍍', flesh: '#f9d648' },
};

const SHAPES = [
  { id: 'hoa',   name: 'Tỉa hoa',          icon: '🌸' },
  { id: 'tim',   name: 'Cắt trái tim',     icon: '💗' },
  { id: 'sao',   name: 'Cắt ngôi sao',     icon: '⭐' },
  { id: 'mieng', name: 'Cắt miếng thường', icon: '🔪' },
];

function boxOptions(d, fruits, shape) {
  return [
    { label: 'Kích cỡ', value: `${d.name} · ${d.box.kinds} loại`, fixed: true },
    { label: 'Trái cây', value: fruits && fruits.length ? fruits.map(k => CUT_FRUIT[k].name).join(', ') : 'Quán chọn quả ngon trong ngày', fixed: true },
    { label: 'Kiểu tỉa', value: SHAPES.find(s => s.id === shape).name, choices: SHAPES.map(s => s.name) },
    { label: 'Chuẩn bị', value: 'Gọt mới, cần 30–60 phút', fixed: true },
  ];
}
