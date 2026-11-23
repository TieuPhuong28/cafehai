# Cafe Hải – Demo "Tự pha, tự gọi"

## Chạy demo

```powershell
node demo/server.js
```

- App cho khách (mở ở chế độ điện thoại): http://localhost:5173
- Màn hình quầy: http://localhost:5173/quay.html

Mở hai trang ở hai tab của **cùng một trình duyệt**. Đơn khách đặt hiện ngay ở quầy; quầy đổi trạng thái thì trang khách cập nhật theo.
Bấm "Bật chuông báo đơn" ở quầy để nghe tiếng báo khi có đơn mới.

> Bản demo lưu dữ liệu trong trình duyệt (localStorage), chưa có server thật. Điện thoại khác **không** đồng bộ với máy tính.

## Cấu trúc

| File | Nội dung |
|---|---|
| `js/menu.js` | Menu thật của quán, các bước pha từng món (đun nước, múc cà phê, phin, rót, thả đá, ép), cách quy kết quả game ra tùy chọn |
| `js/talk.js` | **Lời thoại của anh Hải** – sửa ở đây cho đúng giọng chủ quán |
| `js/scene.js` | Cảnh ngoài cửa, trong quán, hội thoại, menu trên tường |
| `js/brew.js` | Quầy pha chế (vẽ bằng canvas), điểm, combo, kỷ lục |
| `js/fruitcut.js` | Mini game cắt hoa quả → hộp quả mix (túi nhỏ 30K / vừa 50K / hộp lớn 80K) |
| `js/leaderboard.js` | Bảng xếp hạng tuần / tháng / mọi thời đại; phần thưởng ví dụ ở đầu file (`REWARDS`) |
| `js/sfx.js` | Âm thanh tự tổng hợp + rung điện thoại |
| `js/app.js` | Điều hướng, màn kết quả, giỏ hàng, đặt hàng COD, theo dõi đơn |
| `js/quay.js` | Màn hình quầy: 3 cột Mới / Đang pha / Đang giao–Chờ lấy |
| `js/quay-menu.js` | Quầy → tab "Quản lý menu": hoa quả hôm nay, hết hàng, đổi giá, ẩn món, thêm món mới |
| `js/promo.js` | Khuyến mãi & deal: giảm giá món/nhóm (theo khung giờ), combo, thông báo; tự tính giá trong giỏ |
| `js/menuadmin.js` | Lưu các thay đổi menu của quầy và áp dụng cho app khách |
| `js/firebase-config.js` | **Dán cấu hình Firebase vào đây** để bật bản online (để `null` = chế độ demo) |
| `js/cloud.js` | Kết nối Firebase: đăng nhập, đơn hàng, menu, khuyến mãi, điểm, bảng xếp hạng |
| `js/account.js` | Tài khoản khách: đăng nhập SĐT + mật khẩu, điểm, đổi quà |
| `js/quay-cloud.js` | Đăng nhập nhân viên cho màn hình quầy (bản online) |
| `js/store.js` | Lưu đơn + đồng bộ giữa các tab |
| `assets/` | Ảnh quán (menu, đồ uống, hộp quả, chủ quán) |
