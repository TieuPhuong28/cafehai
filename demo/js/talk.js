// ===== Lời thoại của anh Hải (chủ quán) – sửa thoải mái cho đúng giọng của anh =====
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const TALK = {
  greetFirst: [
    'Ơ, chào bạn! Vào đây, vào đây! Mình là Hải, chủ quán kiêm thợ pha chế 😄',
    'Quán mình có trò này vui lắm: bạn tự tay pha ly của mình. Bạn pha thế nào, quán làm y như thế rồi giao tận nơi!',
  ],
  greetBack: [
    'Lại là bạn à! Hôm nay uống gì nào?',
    'Chào bạn quay lại! Tay nghề pha chế dạo này thế nào rồi? 😄',
    'A, khách quen đây rồi! Vào pha một ly đi bạn.',
  ],
  ask: [
    'Menu treo trên tường kia kìa, chạm vào để xem nhé. Hay muốn mình gợi ý?',
    'Bạn xem menu trên tường, hoặc để mình gợi ý cho một món nhé!',
  ],
  afterAdd: name => pick([
    `Đã ghi ${name} vào đơn rồi nhé! Gọi thêm gì nữa không bạn?`,
    `${name} đây! Uống một mình hay mua thêm cho cả hội?`,
    `Ok ${name}! Còn gì nữa không, hay mình chốt đơn luôn?`,
  ]),

  // Gợi ý theo giờ trong ngày
  recommend() {
    const h = new Date().getHours();
    if (h < 11) return { id: 'nau', line: 'Sáng sớm thì phải một ly Nâu cho tỉnh người. Đậm vị, đúng gu!' };
    if (h < 14) return { id: 'xiumuoi', line: 'Giờ trưa làm ly Xỉu Muối đi bạn, béo béo mặn mặn, uống là hết buồn ngủ.' };
    if (h < 18) return pick([
      { id: 'epduahau', line: 'Chiều nóng thế này mà làm ly Ép Dưa Hấu thì mát hết cả người!' },
      { id: 'cbchanh', line: 'Chiều rồi thử Coldbrew Chanh Vàng đi, chua chua thơm thơm, tỉnh táo cả buổi.' },
    ]);
    return { id: 'kakaomuoi', line: 'Tối rồi uống ít cà phê thôi, làm ly Kakao Muối nhẹ nhàng nhé!' };
  },

  // Nhận xét khi chọn món
  drink: {
    nau: 'Nâu là món "quốc dân" của quán. Phin truyền thống, sữa đặc, đá – chuẩn bài!',
    den: 'Đen đá không đường mới là dân sành. Nhưng bạn thích ngọt thì cứ thêm đường nhé!',
    xiu: 'Xỉu là nhiều sữa ít cà phê, nhẹ nhàng dễ uống. Nhớ múc ít cà phê thôi đấy!',
    kakao: 'Kakao nóng – uống ấm bụng lắm. Món này không bỏ đá nhé.',
    xiumuoi: 'Xỉu Muối đang hot nhất quán đấy! Phần khó nhất là lớp kem muối trên cùng.',
    caramel: 'Cafe Caramel – thơm mùi đường cháy, ngọt ngào. Đừng rót caramel tay quá nhé!',
    xiucotdua: 'Xỉu Cốt Dừa béo ngậy, uống là nghiện. Cốt dừa rót trước, cà phê nhỏ giọt sau.',
    kakaomuoi: 'Kakao Muối: kakao đậm + kem muối béo. Một món "chữa lành" đấy bạn!',
    cbchanh: 'Coldbrew ủ lạnh nên không cần đun nước. Thả lát chanh vàng vào là thơm lừng.',
    cbsau: 'Coldbrew Sấu – vị chua của sấu với cà phê ủ lạnh, lạ mà cuốn lắm!',
    suachuacf: 'Sữa Chua Cafe – chua nhẹ của sữa chua với đắng của cà phê, hợp lắm luôn.',
    matcha: 'Matcha Latte: sữa tươi trước, matcha sau cho đẹp lớp nhé!',
    mix: 'Mix theo yêu cầu: bạn chọn 2–3 loại trái cây, mình ép mix cho. Sáng tạo đi!',
    trachanh: 'Trà Chanh – rẻ mà vui, ngồi tám chuyện cả buổi không chán.',
    traquat: 'Trà Quất Nha Đam: thanh mát, giải nhiệt cực tốt. Nha đam giòn giòn vui miệng.',
    tuinho: 'Túi nhỏ 3 loại quả, ăn vặt buổi chiều là vừa xinh. Quả gọt mới, đặt trước 30–60 phút nhé!',
    tuivua: 'Túi vừa 4 loại, chia cho cả nhóm bạn là đẹp. Bạn có muốn tự tay cắt không?',
    hoplon: 'Hộp lớn 5 loại, tỉa hoa tỉa tim đẹp lắm, mang đi biếu tặng là nhất!',
  },
  drinkGeneric: {
    ep: ['Nước ép nguyên chất, ép đến đâu uống đến đó mới ngon!', 'Món này nhiều vitamin lắm, uống vào da đẹp hẳn 😄'],
    ketp: ['Nước ép kết hợp là hai vị bổ sung cho nhau, ngon hơn hẳn uống riêng!'],
    chai: ['Cà phê chai tiện lắm, để tủ lạnh uống dần cả tuần. Món này quán đóng sẵn nhé!'],
  },

  // Mẹo cho từng bước
  step(s, guided) {
    switch (s.type) {
      case 'boil': return guided
        ? `Đầu tiên đun nước nhé. Nước khoảng ${s.t[0]}–${s.t[1]}°C là chuẩn. Cẩn thận, buông tay rồi nước vẫn còn nóng thêm một chút đấy!`
        : 'Đun nước đến độ bạn thích nhé.';
      case 'scoop': return guided
        ? `Múc cà phê vào phin. Mỗi muỗng là một nấc đậm – món này ${s.t[0]} muỗng là chuẩn vị quán.`
        : 'Thích đậm thì múc nhiều, thích nhạt thì múc ít.';
      case 'phin': return guided
        ? 'Giữ để rót nước sôi vào phin. Rót đến vạch xanh rồi buông, chờ phin nhỏ giọt nhé!'
        : 'Rót nước vào phin rồi chờ nhỏ giọt nhé.';
      case 'pour': return guided
        ? `Giữ để rót ${ING[s.ing].name.toLowerCase()}. Rót càng lâu càng chảy nhanh, canh vạch xanh mà buông!`
        : `Rót ${ING[s.ing].name.toLowerCase()} theo khẩu vị của bạn.`;
      case 'ice': return guided
        ? 'Muôi đá đang lắc qua lại đấy. Canh lúc nó ở ngay trên miệng ly rồi hãy thả! 3–4 viên là vừa.'
        : 'Thả đá vào ly, bao nhiêu tùy bạn.';
      case 'tap': return guided
        ? `Thả ${TOP[s.top].name.toLowerCase()} vào ly, cũng phải canh như thả đá nhé. ${s.t[0]}–${s.t[1]} là chuẩn.`
        : `Thả ${TOP[s.top].name.toLowerCase()} bao nhiêu tùy bạn.`;
      case 'fruit': return s.free
        ? 'Chọn 2–3 loại trái cây bạn thích cho vào máy ép nào!'
        : 'Cho trái cây vào máy ép đi bạn.';
      case 'press': return guided
        ? 'Giữ nút để ép. Nước ép chảy xuống ly, đến vạch xanh thì buông!'
        : 'Giữ để ép, ép bao nhiêu tùy bạn.';
    }
    return '';
  },

  // Nói chuyện trong lúc chờ phin nhỏ giọt
  drip: [
    'Chờ chút nhé, cà phê ngon là phải kiên nhẫn ☕',
    'Nhìn từng giọt rơi xuống là thấy thư giãn rồi đúng không?',
    'Phin nhỏ giọt chậm mới đậm, sốt ruột là hỏng đấy 😄',
    'Mùi cà phê lên rồi đấy, thơm chưa!',
  ],

  // Phản ứng theo kết quả từng bước
  react: {
    perfect: ['Chuẩn không cần chỉnh!', 'Tay nghề đấy! 👏', 'Đỉnh! Mình cũng chỉ pha được thế thôi.', 'Hoàn hảo! Bạn đi làm barista được rồi.'],
    great: ['Ngon lắm, lệch xíu thôi!', 'Ổn áp! Gần chuẩn rồi.', 'Khá lắm bạn ơi!'],
    good: ['Tạm được, bước sau cố hơn nhé!', 'Hơi lệch rồi, nhưng không sao.', 'Ừm… cũng được, uống theo gu riêng mà 😄'],
    miss: ['Ơ kìa 😅 Lệch hơi xa rồi!', 'Không sao, lần sau làm lại nhé!', 'Haha, ly này "độc lạ" phết đấy!'],
  },
  boilTooHot: 'Sôi quá rồi! Mẹo nhỏ: buông tay sớm một chút vì ấm vẫn nóng thêm. Bấm "Làm lại bước" nhé.',
  overflow: 'Tràn rồi tràn rồi! 😆',
  iceMiss: ['Hụt mất rồi, không sao, thả viên khác nhé!', 'Suýt nữa thì vào! Canh lúc muôi ở giữa ly là chuẩn.', 'Không sao, mình còn nhiều đá lắm, thử lại nha!'],
  iceHit: ['Vào!', 'Chuẩn!', 'Đẹp!'],
  combo: n => `Combo x${n}! Đang vào phom đấy!`,

  final: {
    3: ['Xuất sắc! Ly này mình chấm 10 điểm, không có nhưng!', 'Trời ơi, chuẩn vị Cafe Hải luôn! Có muốn về quán làm không? 😄'],
    2: ['Ngon đấy! Lệch chút xíu thôi, quán sẽ pha đúng như ly bạn vừa làm.', 'Khá lắm! Thêm vài ly nữa là thành cao thủ.'],
    1: ['Ly này hơi "độc lạ" đó 😄 Bạn chỉnh lại bên dưới nếu muốn nhé!', 'Không sao, lần đầu ai cũng thế! Chỉnh lại khẩu vị bên dưới nha.'],
    free: ['Công thức riêng của bạn! Quán sẽ pha y như vậy.', 'Sáng tạo đấy! Mình sẽ làm đúng y công thức này.'],
  },
  newBest: 'Kỷ lục mới cho món này! 🏆',

  // Mini game cắt hoa quả
  cut: {
    pick: 'Hôm nay làm túi quả cỡ nào bạn? Quả gọt mới, nhớ đặt trước 30–60 phút nhé!',
    intro: n => `Hoa quả quán có theo ngày đấy! Bạn chọn ${n} loại rồi chọn kiểu tỉa, xong vào thớt cắt cùng mình.`,
    start: 'Quả tung lên thì vuốt tay để cắt! Cẩn thận con sâu nhé, cắt trúng là mất miếng đấy.',
    bug: ['Ơ có sâu! Quán mình không bán quả sâu đâu 😅', 'Né con sâu ra bạn ơi!', 'Sâu đấy! Mất một miếng rồi.'],
    miss: ['Rơi mất một quả rồi!', 'Nhanh tay lên bạn ơi!', 'Quả rơi kìa!'],
    combo: ['Một nhát mấy quả luôn, đỉnh thật!', 'Dao pháp siêu đấy! 🔪'],
    full: ['Hộp đầy rồi, đẹp quá! Mình tỉa y như vậy cho bạn nhé.', 'Xong! Nhìn hộp này ai mà không thèm.'],
    time: 'Hết giờ rồi! Phần còn thiếu mình sẽ tự gọt bù cho đủ hộp nhé.',
    final: {
      3: ['Hộp quả này đem đi tặng người yêu là chuẩn bài! 💝', 'Cắt khéo thế này mình phải mời về quán làm mất!'],
      2: ['Hộp khá đẹp rồi đấy! Quán sẽ gọt mới và tỉa đúng kiểu bạn chọn.', 'Ổn lắm! Lần sau né sâu giỏi hơn là 3 sao luôn.'],
      1: ['Không sao, phần thiếu mình gọt bù đủ hộp cho bạn nhé!', 'Lần đầu cầm dao ai cũng thế, quán vẫn làm đủ hộp cho bạn!'],
    },
  },
};
