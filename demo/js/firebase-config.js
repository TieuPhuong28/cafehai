// ===== Cấu hình Firebase của quán =====
// Dán đoạn firebaseConfig lấy ở Firebase Console → ⚙ Project settings → Your apps → Web app.
// Để null thì app chạy chế độ DEMO (dữ liệu chỉ lưu trong trình duyệt, không đồng bộ giữa các máy).
// Đoạn cấu hình web này không phải mật khẩu: bảo mật nằm ở file firestore.rules.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDCXk4Iz9qwged60HFHD6iaJ8lXYkIgKO0",
  authDomain: "cafe-hai.firebaseapp.com",
  projectId: "cafe-hai",
  storageBucket: "cafe-hai.firebasestorage.app",
  messagingSenderId: "436875379685",
  appId: "1:436875379685:web:29fb044f53f6c17c5fe50c",
};

/* Ví dụ:
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "cafe-hai.firebaseapp.com",
  projectId: "cafe-hai",
  storageBucket: "cafe-hai.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef",
};
*/
