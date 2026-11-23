# Kế hoạch: Game pha chế & đặt món cho quán cafe

> Phiên bản 0.1, ngày 23/11/2026. Giai đoạn hiện tại: **demo / prototype**.

## 1. Tóm tắt ý tưởng

Khách mở web app trên điện thoại của mình, **tự pha ly nước trong game**, và **ly vừa pha trở thành đơn hàng thật** gửi về màn hình ở quầy. Mỗi lần chơi được chấm sao theo độ chuẩn công thức. Sau này (bản MVP) sao sẽ quy ra điểm, và điểm đổi được đồ uống.

Quán chủ yếu bán **ship và mang đi**, nên game là **lý do để khách quay lại đặt lần sau**, không phải trò giải trí lúc ngồi tại bàn.

## 2. Các quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Thiết bị | Điện thoại của khách (web app, không cần cài) |
| Kênh vào | Link trên Facebook / Zalo OA · QR dán trên ly/túi giao hàng · QR tại quầy |
| Game chính | Pha chế = gọi món, sau này thêm mini game |
| Tài khoản | Số điện thoại + mật khẩu, mỗi khách một tài khoản riêng |
| Điểm | Chơi game ra điểm, có giới hạn mỗi ngày; điểm đổi đồ uống |
| Nhận đơn | Màn hình web ở quầy |
| Thanh toán | COD (trả khi nhận hàng) hoặc trả tại quầy với khách mang đi |
| Quy mô | Quán nhỏ, chủ yếu ship/mang đi |
| Giai đoạn đầu | Chỉ demo: game pha chế → đặt món, và màn hình quầy |

## 3. Luồng chính

```
Khách mở link / quét QR
   → Chọn món gốc (Cà phê sữa, Bạc xỉu, Trà đào...)
   → MÀN CHƠI PHA CHẾ
        chọn size ly → rót cà phê/trà → rót sữa → thêm đá → syrup/topping
        (giữ nút để rót, buông đúng vạch mục tiêu)
   → Kết quả: 1–3 sao + "ly của bạn": 70% đường, ít đá, thêm trân châu
   → Giỏ hàng: chọn Giao hàng (nhập tên, SĐT, địa chỉ) hoặc Đến lấy
   → Gửi đơn (COD)
   → Màn hình theo dõi: Mới → Đang pha → Đang giao/Chờ lấy → Hoàn tất

Màn hình quầy
   → Đơn mới hiện lên kèm chuông báo
   → Xem chi tiết công thức khách tự pha (đường %, đá %, topping)
   → Bấm chuyển trạng thái / hủy đơn
```

**Điểm then chốt:** lượng rót trong game được quy về **tùy chọn thật** của quán (đường 0/30/50/70/100%, đá ít/vừa/nhiều, topping), để nhân viên pha được đúng ly khách đã "pha".

## 4. Thiết kế game pha chế

- **Chế độ Theo công thức:** game hiện vạch mục tiêu của món. Rót càng sát vạch càng nhiều sao.
- **Chế độ Tự sáng tạo:** không có vạch, khách rót tùy ý. Lượng rót được làm tròn về tùy chọn gần nhất. Đây cũng là cách đặt món theo khẩu vị riêng.
- **Thao tác:** giữ để rót, buông để dừng; kéo topping thả vào ly. Một ly mất khoảng 30–60 giây.
- **Phản hồi:** ly đầy dần có hiệu ứng, chấm sao, có thể đặt tên cho "ly của tôi" để lần sau đặt lại nhanh.
- **Bỏ qua game:** luôn có nút "Đặt nhanh" cho khách vội, để game không cản trở việc bán hàng.

## 5. Phạm vi bản demo (giai đoạn hiện tại)

**Có trong demo:**
1. Menu mẫu 4–6 món, giá mẫu.
2. Game pha chế với 2 chế độ, chấm sao, quy đổi ra tùy chọn món.
3. Giỏ hàng + form giao hàng/đến lấy (COD), gửi đơn.
4. Màn hình theo dõi đơn cho khách.
5. Màn hình quầy: danh sách đơn realtime, chuông báo, đổi trạng thái.

**Chưa có trong demo:** đăng nhập thật, điểm và đổi quà, mini game, backend/database, trang quản lý menu.

**Kỹ thuật demo:** web tĩnh HTML/CSS/JS thuần, thiết kế cho màn hình điện thoại. Dữ liệu lưu trong trình duyệt (localStorage), và **hai tab trên cùng một máy đồng bộ với nhau** (BroadcastChannel): một tab giả lập điện thoại khách, một tab là màn hình quầy. Không cần server; sau này có thể đưa lên Netlify/GitHub Pages để mở thử trên điện thoại.

## 6. Lộ trình sau demo

| Giai đoạn | Nội dung |
|---|---|
| **MVP** | Backend + database thật; tài khoản SĐT + mật khẩu; ví điểm, giới hạn điểm mỗi ngày, đổi đồ uống; 1–2 mini game (hứng hạt cafe, lật hình); trang quản lý menu/giá/phí ship |
| **Tăng trưởng** | Mã trên ly/túi để nhận điểm theo đơn; thông báo qua Zalo OA; bảng xếp hạng tuần; sự kiện theo mùa |
| **Mở rộng** | Chuyển khoản VietQR trước; in bill tự động; báo cáo doanh thu từ game |

## 7. Rủi ro cần lưu ý (cho bản MVP)

Đăng ký chỉ bằng SĐT + mật khẩu, cộng với "chơi game ra điểm", dễ bị **tạo tài khoản ảo để cày đồ uống miễn phí**. Đề xuất:
- Điểm từ game là **điểm chờ**: chỉ được kích hoạt khi tài khoản đã có ít nhất 1 đơn hoàn tất.
- Giới hạn điểm game mỗi ngày (ví dụ tối đa 3 lượt có điểm).
- Đồ uống đổi bằng điểm **chỉ được thêm vào một đơn có trả tiền** (tránh ship 1 ly miễn phí lỗ phí giao).
- Bom hàng COD: cho phép quán gọi xác nhận đơn đầu tiên của khách mới, và chặn SĐT bom hàng.

## 8. Còn cần anh/chị cung cấp

- Tên quán, logo/màu thương hiệu (nếu muốn demo mang dáng dấp quán).
- Menu thật: tên món, giá, các tùy chọn đường/đá/topping quán đang có.
- Khu vực giao hàng và cách tính phí ship.
- (MVP) Tỷ lệ quy đổi điểm, ví dụ bao nhiêu điểm thì được 1 ly.
