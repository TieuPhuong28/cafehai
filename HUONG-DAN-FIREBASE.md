# Hướng dẫn bật bản online (Firebase) cho Cafe Hải

Làm một lần, khoảng **10–15 phút**. Cần một tài khoản Gmail của quán. Gói **Spark (miễn phí)** là đủ, không cần thẻ thanh toán.

## Bước 1 – Tạo dự án
1. Vào **https://console.firebase.google.com** và đăng nhập Gmail của quán.
2. Bấm **Create a project** (Tạo dự án), đặt tên `cafe-hai`.
3. Tắt **Google Analytics** (không cần), bấm **Create project**.

## Bước 2 – Bật đăng nhập
1. Menu trái: **Build → Authentication → Get started**.
2. Tab **Sign-in method** → chọn **Email/Password** → bật **Enable** (dòng đầu tiên) → **Save**.
   *Khách đăng nhập bằng số điện thoại + mật khẩu; app tự chuyển số điện thoại thành tên đăng nhập, không gửi SMS nên không tốn phí.*
3. Tab **Settings → Authorized domains** → **Add domain** → nhập `tieuphuong28.github.io` → **Add**.

## Bước 3 – Tạo kho dữ liệu
1. Menu trái: **Build → Firestore Database → Create database**.
2. Chọn vị trí **asia-southeast1 (Singapore)** cho nhanh → **Next**.
3. Chọn **Start in production mode** → **Create**.
4. Sang tab **Rules**, xóa hết nội dung cũ, dán toàn bộ nội dung file [`firestore.rules`](firestore.rules) → **Publish**.

## Bước 4 – Lấy đoạn cấu hình web
1. Bấm biểu tượng ⚙ cạnh **Project Overview** → **Project settings**.
2. Kéo xuống **Your apps** → bấm biểu tượng web **`</>`**.
3. Đặt tên `cafehai-web`, **không** tick Firebase Hosting → **Register app**.
4. Copy đoạn `const firebaseConfig = { ... }` và **gửi cho người làm web** (hoặc tự dán vào file `demo/js/firebase-config.js`, thay dòng `window.FIREBASE_CONFIG = null;`).
   *Đoạn này không phải mật khẩu, để công khai được; bảo mật nằm ở Rules ở Bước 3.*

## Bước 5 – Tạo tài khoản cho màn hình quầy
1. **Authentication → Users → Add user**: nhập email nhân viên (ví dụ email của quán) và mật khẩu → **Add user**.
2. Copy cột **User UID** của tài khoản vừa tạo (chuỗi dạng `aBcD123...`).
3. **Firestore Database → Data → Start collection**:
   - Collection ID: `staff` → **Next**
   - Document ID: dán **User UID** vừa copy
   - Thêm 1 field: `role` kiểu *string*, giá trị `quay` → **Save**
4. Mở màn hình quầy, đăng nhập bằng email/mật khẩu ở bước 1. Muốn thêm nhân viên khác thì lặp lại bước này.

## Sau khi bật
- App khách: **https://tieuphuong28.github.io/cafehai/** — điện thoại nào đặt, máy quầy cũng nhận.
- Màn hình quầy: **https://tieuphuong28.github.io/cafehai/demo/quay.html** — cần đăng nhập nhân viên.
- Lần đầu bật, menu/khuyến mãi trên bản online **bắt đầu từ menu gốc**; vào Quản lý menu chỉnh lại (hết hàng, giá giảm, khuyến mãi…).

## Câu hỏi thường gặp
- **Khách quên mật khẩu?** Bản hiện tại chưa tự đặt lại được. Quầy vào **Authentication → Users**, tìm `0901234567@khach.cafehai.app`, xóa tài khoản đó; khách tạo lại tài khoản mới (điểm cũ quán cộng bù bằng tay nếu cần). Bản sau có thể thêm đặt lại mật khẩu.
- **Có tốn tiền không?** Gói miễn phí cho phép khoảng 50.000 lượt đọc và 20.000 lượt ghi mỗi ngày, quán nhỏ dùng không hết.
- **Đổi vị trí dữ liệu được không?** Không, chọn một lần ở Bước 3.
