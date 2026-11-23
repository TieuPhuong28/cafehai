# Cafe Hải – Tự pha, tự gọi ☕

Bản demo web app cho quán **Cafe Hải (41 Chu Văn An)**: khách vào một quán cafe ảo, trò chuyện với anh Hải, **tự tay pha đồ uống hoặc cắt hộp quả trong game**, và ly/hộp vừa làm trở thành **đơn hàng thật** gửi về màn hình quầy.

## Mở bản demo

- App cho khách (nên mở trên điện thoại): `https://tieuphuong28.github.io/cafehai/demo/`
- Màn hình quầy: `https://tieuphuong28.github.io/cafehai/demo/quay.html`

Chạy trên máy:

```
node demo/server.js
```

rồi mở http://localhost:5173 (khách) và http://localhost:5173/quay.html (quầy).

> **Lưu ý:** đây là bản demo, dữ liệu lưu trong trình duyệt (localStorage). App khách và màn hình quầy chỉ đồng bộ khi mở **trên cùng một trình duyệt, cùng một máy**. Để điện thoại của khách gửi đơn về máy ở quầy cần làm thêm server thật (giai đoạn MVP – xem `KE-HOACH.md`).

## Tính năng

**Khách hàng**
- Mặt tiền quán → bước vào quán ảo: menu treo tường, bảng vàng xếp hạng, bảng tin khuyến mãi, anh Hải trò chuyện
- Game pha chế: đun nước, múc cà phê, rót phin, rót sữa, thả đá, ép trái cây – chấm điểm, combo, kỷ lục
- Mini game cắt hoa quả → túi/hộp quả mix
- Đặt nhanh, "Như mọi khi", đặt lại đơn cũ; giỏ hàng tự áp khuyến mãi & combo; COD / đến lấy
- Điểm tích lũy tỷ lệ với giá món, bảng xếp hạng tuần / tháng / mọi thời đại

**Quầy**
- Nhận đơn theo 3 cột, chuông báo đơn mới
- Quản lý menu: còn/hết hàng, hoa quả hôm nay, giá & giá giảm, ẩn món, món mới, đưa món lên bảng tin, thêm món mới
- Khuyến mãi: giảm giá (theo khung giờ), combo, thông báo
- Cấu hình điểm số

Chi tiết cấu trúc mã nguồn: [`demo/README.md`](demo/README.md).
