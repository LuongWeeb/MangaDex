# KẾ HOẠCH TỐI ƯU HÓA NÂNG CAO (ADVANCED OPTIMIZATION - PHASE 6)
**Dự án:** MangaDex - Nền tảng Đọc Truyện Online  
**Dành cho:** Codex / Developer hoàn thiện sản phẩm đạt chuẩn Release Candidate  
**Mục tiêu:** Nâng cấp tính năng Pro Reader, tối ưu hiệu năng tìm kiếm, cấu hình bảo mật biến môi trường và hiệu ứng tải trang mượt mà.

---

## 1. DANH SÁCH 4 MODULE TỐI ƯU CẦN TRIỂN KHAI

---

### 🟢 MODULE 1: BẢO MẬT BIẾN MÔI TRƯỜNG VỚI DOTENV (ENVIRONMENT CONFIG)
*Mục tiêu: Đưa toàn bộ cấu hình nhạy cảm ra file `.env` theo chuẩn 12-Factor App.*

#### Yêu cầu:
1. Cài đặt thư viện: `npm install dotenv`
2. Tạo file `.env` ở thư mục gốc:
   ```env
   PORT=3000
   NODE_ENV=development
   
   # Database MySQL
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=doc_truyen_online
   DB_PORT=3306
   
   # JWT Secret Key
   JWT_SECRET=mangadex_super_secret_jwt_key_2026
   JWT_EXPIRES_IN=7d
   ```
3. Tạo file mẫu `.env.example` (không chứa mật khẩu thật) để nộp đồ án.
4. Cập nhật `common/db.js` và `controllers/authController.js`, `middlewares/authMiddleware.js` để đọc từ `process.env`.
5. Đảm bảo `app.js` require `dotenv` ngay dòng đầu tiên: `require('dotenv').config();`.

---

### 🟢 MODULE 2: TÌM KIẾM THỜI GIAN THỰC THÔNG MINH (LIVE SEARCH POPOVER + DEBOUNCE)
*Mục tiêu: Gõ vào ô tìm kiếm là hiện ngay popover xem nhanh kết quả với thumbnail bìa truyện.*

#### Yêu cầu:
1. **Kỹ thuật Debounce:** Thêm hàm `debounce(fn, delay = 300)` trong `public/javascripts/main.js` để chỉ gọi API sau khi người dùng ngừng gõ 300ms (tránh spam server).
2. **Search Dropdown Popover:**
   - Tạo container popup ngay dưới thanh tìm kiếm `#searchInput`: `#searchQuickResults`.
   - Hiển thị tối đa 5 kết quả đầu tiên gồm: Ảnh bìa nhỏ, Tên truyện, Tác giả, và Badge số chương mới nhất.
   - Khi click vào truyện thì mở thẳng modal chi tiết truyện hoặc chuyển trang, khi click ra ngoài thì tự ẩn popup.

---

### 🟢 MODULE 3: NÂNG CẤP TRÌNH ĐỌC CHUYÊN NGHIỆP (PRO READER EXPERIENCE)
*Mục tiêu: Bổ sung các tính năng tiện ích dành riêng cho độc giả truyện tranh/truyện chữ.*

#### Yêu cầu:
1. **Phím tắt bàn phím (Keyboard Navigation):**
   - Khi đang mở Trình đọc (`#readerModal` active):
     - Phím `ArrowRight` (hoặc `D`): Chuyển sang chương tiếp theo.
     - Phím `ArrowLeft` (hoặc `A`): Quay lại chương trước.
     - Phím `F`: Bật/Tắt chế độ Toàn màn hình (`document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()`).
     - Phím `Escape`: Đóng trình đọc về trang chủ.
2. **Khôi phục vị trí cuộn trang chính xác (Exact Scroll Position Memory):**
   - Khi đang đọc truyện chữ hoặc cuộn manga, lưu vị trí cuộn `scrollTop` vào `localStorage` theo key `mangadex_scroll_{storyId}_{chapterId}`.
   - Khi mở lại chương đó, tự động cuộn mượt về đúng vị trí người đọc vừa dừng lại.

---

### 🟢 MODULE 4: SKELETON LOADING & XỬ LÝ LỖI ẢNH (IMAGE FALLBACK)
*Mục tiêu: Giao diện luôn mượt mà và không bao giờ bị vỡ layout khi mạng chậm hoặc ảnh hỏng.*

#### Yêu cầu:
1. **Hiệu ứng Skeleton Placeholder:**
   - Trong lúc gọi API `GET /stories`, hiển thị 8 thẻ skeleton dạng nhấp nháy ánh sáng (shimmer animation) trong `#storiesGrid`.
2. **Xử lý ảnh lỗi (Image Error Fallback):**
   - Tất cả thẻ `<img>` bìa truyện và ảnh chương đều có `onerror="this.onerror=null; this.src='/images/covers/default-cover.svg';"` tránh hiện biểu tượng ảnh vỡ.

---

## 2. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)
- [ ] Chạy `npm start` kết nối CSDL trơn tru qua biến môi trường `.env`.
- [ ] Tìm kiếm có popup xem nhanh kèm ảnh thumbnail, mượt mà không bị delay.
- [ ] Đọc truyện chuyển chương được bằng phím mũi tên `←` và `→`, nhấn `F` phóng to toàn màn hình.
- [ ] Mở lại chương cũ tự động cuộn về vị trí đang đọc dở.
- [ ] Giao diện có hiệu ứng skeleton loading khi tải trang.
- [ ] Chạy lại bộ kiểm thử `npm test` vẫn pass 100%.
