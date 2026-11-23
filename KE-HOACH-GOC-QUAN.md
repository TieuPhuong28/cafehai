# Kế hoạch: "Góc quán của tôi"

> Phiên bản 0.2, ngày 23/11/2026. Trạng thái: **đã làm phần code Giai đoạn 1 (Bản đầu)**, chưa chạy thật với khách. Đây là phần mở rộng của app Cafe Hải (xem `KE-HOACH.md`).

## 1. Mục tiêu

Mỗi khách có một **góc quán Cafe Hải của riêng mình** để trang trí và nâng cấp. Góc quán **chỉ lớn lên khi khách mua hàng thật**, nên game kéo khách đặt thêm chứ không giữ họ ở lại chơi không.

**Thành công nghĩa là:**
- Khách có góc quán **đặt hàng thường xuyên hơn** khách không có (mục tiêu: +20% số đơn mỗi tháng).
- Khách quay lại app **hằng ngày** dù chưa đặt (mở app 10–30 giây để nhận tip, ngắm quán).
- Góc quán thành **kênh giới thiệu**: khách gửi link "quán của tôi" cho bạn bè.
- Chi phí quà thật **không quá 5–7% doanh thu** từ nhóm khách chơi.

## 2. Nguyên tắc thiết kế

1. **Mua thật mới lớn nhanh.** Phần lớn xu đến từ đơn thật; chơi chỉ được thêm một ít, có giới hạn mỗi ngày.
2. **Không bao giờ chặn đặt hàng.** Ở bất kỳ màn nào cũng có nút "Đặt món"; khách quen vẫn đặt "Như mọi khi" trong 1 chạm.
3. **Mỗi lần ghé chỉ 10–30 giây.** Không bắt chơi lâu, không có "năng lượng" hay chờ đợi gây khó chịu.
4. **Quà thật dựa trên cấp quán**, không đổi trực tiếp từ xu, để quán kiểm soát được chi phí.
5. **Đồ trong game gắn với món thật của quán**: máy ép, quầy hoa quả, phin, ly in logo H…, để mỗi món đồ nhắc khách nhớ tới một món có bán.

## 3. Vòng lặp chính

```
Đặt món thật ──▶ quán hoàn tất đơn ──▶ nhận XU (+ mở khóa đồ theo món đã mua)
      ▲                                              │
      │                                              ▼
Quà thật ở mốc cấp ◀── quán lên cấp ◀── mua đồ, bày biện góc quán
      │
      └── Khoe quán / mời bạn ghé ──▶ bạn đặt đơn đầu ──▶ cả hai nhận thưởng
```

Mỗi ngày có thêm một vòng nhỏ: **mở app → nhận tip khách ảo → (tùy chọn) làm 1 ca 2 phút → ngắm quán → nút "Đặt món"**.

## 4. Các hệ thống

### 4.1 Hai loại "tiền" tách biệt
| | **Điểm** (đã có) | **Xu** (mới) |
|---|---|---|
| Dùng để | Xếp hạng bảng vàng | Mua đồ cho góc quán |
| Có tiêu được không | Không | Có |
| Nguồn chính | Đơn hàng, theo độ chuẩn khi pha | Đơn hàng hoàn tất |

Tách riêng để bảng xếp hạng không bị ảnh hưởng khi khách tiêu xu.

### 4.2 Nguồn xu
| Nguồn | Mức (ví dụ) | Giới hạn |
|---|---|---|
| Đơn hàng hoàn tất | **1 xu / 1.000đ** (ly 20K = 20 xu) | Không giới hạn |
| Món đầu tiên của một loại (lần đầu mua nước ép, hộp quả…) | +30 xu | 1 lần mỗi loại |
| Tip khách ảo hằng ngày (quán càng đẹp tip càng cao) | 5–15 xu | 1 lần/ngày |
| Ca làm 2 phút | 5–10 xu | 1 ca/ngày |
| Bạn được mời đặt đơn đầu tiên | +50 xu cho người mời | 10 bạn/tháng |

→ Khách mua 2 ly/tuần nhận ~40 xu từ đơn, cộng tối đa ~150 xu từ chơi mỗi tuần. **Mua thật vẫn là cách nhanh nhất để mở khóa đồ "xịn"** (xem 4.3).

### 4.3 Đồ đạc & mở khóa
Khoảng **30 món đồ** cho bản đầu, chia 4 nhóm:

| Nhóm | Ví dụ | Mở khóa |
|---|---|---|
| Bàn ghế | ghế xếp đen (như trước quán thật), bàn gỗ nhỏ, ghế đẩu, sofa | Mua bằng xu |
| Trang trí | cây xanh, hoa giấy, poster cờ, đèn treo, khung ảnh | Mua bằng xu |
| Máy móc | phin, máy xay, **máy ép**, tủ lạnh trái cây, máy pha cold brew | **Cần mua món thật tương ứng** + xu |
| Đặc biệt | quầy hoa quả, biển H phát sáng, bảng vàng mini, đồ Tết/Trung thu | Mốc thành tích / sự kiện |

Ví dụ mở khóa theo món thật:
- **Máy ép:** đã mua 3 ly nước ép.
- **Quầy hoa quả:** đã mua 1 túi/hộp quả.
- **Máy pha cold brew:** đã mua 2 ly Coldbrew.
- **Bảng vàng mini:** lọt top 10 bảng vàng tuần.

### 4.4 Cấp quán & diện tích
- Mỗi món đồ có điểm **"Phong cách"**; tổng phong cách quyết định **cấp quán (1–10)**.
- Lên cấp thì **mở rộng diện tích**: 4×4 ô → 5×5 → 6×6 → mở thêm vỉa hè → mở tầng 2.
- Quán cấp cao thu hút nhiều khách ảo hơn, nên tip hằng ngày cao hơn.

### 4.5 Quà thật ở mốc cấp (VÍ DỤ, quán quyết)
| Cấp | Ước lượng khách đã chi* | Quà |
|---|---|---|
| 3 | ~200K | Thêm topping / size miễn phí 1 lần |
| 5 | ~400K | 1 ly Nâu miễn phí |
| 7 | ~700K | Giảm 20K cho 1 túi quả |
| 10 | ~1.200K | 1 túi quả mix nhỏ + tên lên "Tường danh dự" trong quán ảo |

\*Ước lượng khi khách chơi đều mỗi ngày. Quà được trao qua mã gắn vào đơn kế tiếp, quầy xác nhận.
Tổng chi phí quà ≈ 5% số tiền khách đã chi, tương đương các chương trình tích điểm thông thường.

### 4.6 Ca làm 2 phút (tùy chọn)
- Khách ảo lần lượt vào gọi món; người chơi pha nhanh bằng **phiên bản rút gọn** của game pha chế đã có (1–2 bước mỗi ly).
- Khách ảo **gọi món theo menu thật**, ưu tiên món mới và món đang khuyến mãi (quảng cáo khéo).
- 1 ca/ngày có thưởng; chơi thêm được nhưng không có xu.

### 4.7 Ghé thăm & giới thiệu bạn
- Mỗi góc quán có **link chia sẻ** "Quán của Minh Anh". Người nhận mở link thấy quán ảo, thả tim, và có nút **"Đặt thử – đơn đầu được [quà]"**.
- Bạn đặt đơn đầu và quán hoàn tất thì người mời được +50 xu.
- Bảng **"Quán đẹp nhất tuần"** theo số tim, đăng fanpage hằng tuần.

### 4.8 Sự kiện theo mùa
Đồ trang trí giới hạn thời gian: Tết, Valentine, 8/3, Trung thu, 20/10, Noel. Mỗi sự kiện có một món đồ chỉ mở khóa khi mua **món/hộp quả theo chủ đề** trong thời gian đó.

## 5. Giao diện

- **Lối vào:** trong quán ảo có **cầu thang "Góc quán của tôi ⬆"** và một nút trên thanh trên cùng. Lần đầu vào, anh Hải dẫn: *"Anh để dành cho bạn một góc này, bày biện tùy thích nhé!"*
- **Màn góc quán:** lưới ô nhìn nghiêng (isometric) đơn giản, chạm đồ để đặt, xoay, cất. Khách ảo nhỏ đi lại ngồi uống.
- **Thanh dưới:** 🛒 Cửa hàng đồ · 📦 Kho · ☕ Ca làm · 👥 Bạn bè · và luôn có nút **"Đặt món"** nổi.
- **Thông báo nhỏ khi đơn hoàn tất:** *"+20 xu! Bạn vừa mở khóa Máy ép 🍹"*.

## 6. Phía quầy (quản lý)
Thêm mục **"🏠 Góc quán"** trong Quản lý menu:
- Bật/tắt tính năng.
- Tỷ lệ xu (xu / 1.000đ), giới hạn tip và ca làm mỗi ngày.
- Danh sách quà ở mốc cấp (sửa được), duyệt mã quà khi khách dùng.
- Bật sự kiện mùa.
- Thống kê: số khách có góc quán, số đơn của họ so với khách khác, quà đã phát, chi phí quà.

## 7. Kỹ thuật & điều kiện cần

1. **Bắt buộc có dữ liệu online (Firebase)** trước khi làm:
   - Xu, đồ đạc, cấp quán lưu theo **tài khoản khách** (số điện thoại), không mất khi đổi máy.
   - **Xu chỉ được cộng phía server khi quầy bấm hoàn tất đơn**, chống sửa dữ liệu trong trình duyệt để gian lận.
2. **Đăng nhập khách** bằng số điện thoại (và đăng nhập cho quầy).
3. **Hình ảnh** là phần tốn công nhất (~30 món đồ + nền + khách ảo). Hai cách:
   - Tự vẽ đơn giản bằng SVG theo phong cách hiện tại (rẻ, đồng bộ, đơn giản).
   - Thuê họa sĩ vẽ bộ đồ theo đúng không gian quán thật (đẹp hơn, tốn chi phí).
4. Tái sử dụng: game pha chế (ca làm), bảng xếp hạng, khuyến mãi, quản lý menu.

## 8. Lộ trình

| Giai đoạn | Nội dung | Thời gian ước tính | Điều kiện để sang bước sau |
|---|---|---|---|
| **0. Nền móng** | Firebase + đăng nhập SĐT + chốt phần thưởng điểm; chạy thử app đặt hàng 4 tuần | 2–3 tuần + 4 tuần chạy | ≥ 25% đơn của khách quen đi qua app |
| **1. Bản đầu** | Góc quán 4×4, ~30 đồ, xu từ đơn thật, mở khóa theo món, cấp 1–5, 1–2 quà mốc | 2–3 tuần | ≥ 30% khách dùng app mở góc quán; chi phí quà trong ngân sách |
| **2. Thói quen hằng ngày** | Tip khách ảo, ca làm 2 phút, link ghé thăm + mời bạn | 2 tuần | Khách có góc quán đặt nhiều hơn ≥ 15% |
| **3. Cộng đồng & mùa vụ** | Quán đẹp nhất tuần, sự kiện mùa, mở rộng tầng 2, cấp 6–10 | Liên tục | — |

Nếu số liệu ở bước nào không đạt, **dừng lại sửa** chứ không làm tiếp phần sau.

### Giai đoạn 1 đã làm (23/11/2026)
- Góc quán 4×4 ô nhìn nghiêng + 8 chỗ treo tường; vào bằng cầu thang trong quán, nút 🏠, hoặc lựa chọn "Góc quán của tôi" khi nói chuyện với anh Hải. Nút "Đặt món" luôn nổi.
- 32 món đồ (bàn ghế, trang trí, máy móc, đặc biệt), vẽ đơn giản bằng SVG/emoji. Máy móc và đồ đặc biệt mở khóa theo món thật đã mua (máy ép: 3 ly nước ép, quầy hoa quả: 1 túi/hộp quả, cold brew: 2 ly Coldbrew, kệ ly H: 5 đơn, biển H: 10 đơn, bảng vàng mini: 10 ly tự tay pha…).
- Xu: 1 xu / 1.000đ của đơn hoàn tất + 30 xu lần đầu mua mỗi loại (cà phê, nước ép, hoa quả, chai, trà & khác). **Chỉ quầy cộng xu**, trong cùng giao dịch hoàn tất đơn; khách mua đồ được quy tắc Firestore kiểm tra giá, số xu và điều kiện mở khóa.
- Cấp 1–5 theo tổng "phong cách" của đồ (25 / 55 / 90 / 130). Quà thật ví dụ: cấp 3 tặng Trà Chanh, cấp 5 tặng Nâu; quà vào giỏ giá 0đ, phải đi kèm món trả tiền, quầy kiểm tra cấp khi hoàn tất đơn.
- Khách ảo ngồi trên ghế (số khách = cấp quán); báo "+N xu! Bạn vừa mở khóa …" khi đơn hoàn tất.
- Quầy: mục **🏠 Góc quán** trong Quản lý menu (bật/tắt, tỷ lệ xu, thưởng lần đầu, quà cấp 3/5, số liệu khách theo cấp, xu đã phát/tiêu, quà đã giao).
- **Đo điều kiện sang Giai đoạn 2** ngay ở mục trên: "% khách mở góc quán" (chỉ đếm khách tự mở, không đếm góc tạo tự động khi quầy cộng xu) và "chi phí quà / doanh thu của khách có góc quán" (hiện đỏ khi vượt 7%).
- **Chưa làm (để giai đoạn sau):** tip khách ảo, ca làm 2 phút, ghé thăm/mời bạn, quán đẹp nhất tuần, sự kiện mùa, mở rộng 5×5 / tầng 2, cấp 6–10, bộ hình vẽ đẹp theo quán thật.
- Trước khi chạy với khách: dán lại `firestore.rules` lên Firebase (xem `HUONG-DAN-FIREBASE.md`), và anh Hải chốt quà thật ở mốc cấp (mục 11).

## 9. Đo lường (KPI)

- % khách dùng app có mở góc quán; % quay lại trong 7 ngày.
- Số đơn/tháng của khách có góc quán so với khách không có.
- Số lượt mở link ghé thăm, số bạn mới đặt đơn đầu qua link.
- Xu phát ra từ đơn và từ chơi (tỷ lệ mong muốn ≥ 60% từ đơn).
- Chi phí quà / doanh thu nhóm khách chơi (≤ 5–7%).

## 10. Rủi ro & cách giảm

| Rủi ro | Cách giảm |
|---|---|
| Khách chơi mà không mua | Xu từ chơi có giới hạn; đồ xịn cần mua món thật; quà theo cấp |
| Làm chậm việc đặt hàng | Nút "Đặt món" luôn có; góc quán là phần phụ, không phải lối vào bắt buộc |
| Gian lận xu | Chỉ cộng xu phía server khi đơn hoàn tất; giới hạn mời bạn |
| Chi phí quà vượt dự kiến | Quầy chỉnh được tỷ lệ xu và quà; theo dõi chi phí hằng tuần |
| Hết mới lạ sau vài tuần | Sự kiện mùa, đồ giới hạn, quán đẹp nhất tuần |
| Tốn công vẽ hình | Bản đầu vẽ đơn giản, thêm đồ đẹp dần theo sự kiện |

## 11. Cần anh Hải quyết

1. **Quà thật ở các mốc cấp** và ngân sách quà mỗi tháng.
2. **Phong cách hình ảnh:** tự vẽ đơn giản hay thuê họa sĩ vẽ theo quán thật.
3. **Quà cho bạn được mời** đặt đơn đầu (ví dụ giảm 10K).
4. Có muốn khách ảo trong game **gọi đúng món mới, món khuyến mãi** của quán (quảng cáo khéo) không.
5. Đồng ý làm **Giai đoạn 0 (Firebase + đăng nhập)** trước khi bắt đầu góc quán.
