# KẾ HOẠCH NÂNG CẤP GIAO DIỆN TOÀN DIỆN V2.1 (MANGADEX PRO)
**Dự án:** MangaDex - Nền tảng Đọc Truyện Online  
**Dành cho:** Codex / Frontend Developer  
**Trọng tâm nâng cấp:**  
1. Đồng bộ 100% hệ thống icon SVG chuyên nghiệp (thay thế toàn bộ emoji).  
2. Chuyển đổi từ mô hình Pop-up/Modal sang **Giao diện trang chuyên biệt (Dedicated Full-Page Views)** cho từng chức năng chính (Chi tiết truyện, Tủ truyện, Uploader Studio, Admin Dashboard).  
3. Sửa triệt để lỗi mất tương phản màu ở **Light Mode** (Hero banner chữ đen trên nền tối, menu đen cứng).

---

## 1. YÊU CẦU 1: HỆ THỐNG ICON SVG ĐỒNG NHẤT (UNIFIED SVG ICON SYSTEM)

### 1.1. Vấn đề hiện tại
- Đang dùng lẫn lộn emoji hệ điều hành (`📚`, `🔖`, `🌙`, `🏆`, `👑`, `✍️`, `🔍`...). Trên mỗi máy tính/điện thoại emoji lại hiển thị một kiểu khác nhau, màu sắc không đồng bộ với thương hiệu MangaDex.

### 1.2. Giải pháp kỹ thuật cho Codex
- Thay toàn bộ emoji bằng **Bộ SVG Icons chuẩn nét vẽ (Line/Stroke 1.75px - 2px)**:
  - Màu sắc: Dùng `currentColor` hoặc `var(--accent-primary)` để icon tự động đổi màu theo Light/Dark theme.
  - Kích thước: Chuẩn hóa 3 size (`18x18px` cho nút nhỏ/tag, `20x20px` cho thanh điều hướng, `24x24px` cho tiêu đề section).
- **Bộ icon cần tích hợp vào `public/index.html` & `public/javascripts/main.js`**:
  - Logo MangaDex: Icon trang truyện mở gập hoặc origami (`<svg class="icon-brand">...`).
  - Tìm kiếm: Icon kính lúp nét mảnh.
  - Chuyển theme: Icon Mặt trăng khuyết (Dark) / Mặt trời tỏa tia (Light).
  - Tủ truyện / Đánh dấu: Icon Bookmark ribbon sắc nét.
  - Xem nhiều: Icon Cup quán quân / Biểu đồ trending.
  - Yêu thích & Theo dõi: Icon Trái tim (Heart) & Ngôi sao (Star).
  - Đọc truyện: Icon Mở sách / Mắt đọc (Eye views).
  - Uploader / Admin: Icon Cây bút (Pen Edit) / Chiếc khiên (Shield Admin).

---

## 2. YÊU CẦU 2: CHUYỂN ĐỔI SANG GIAO DIỆN TRANG RIÊNG (DEDICATED FULL-PAGE VIEWS)

Thay vì click vào truyện lại bật lên một modal pop-up che giữa màn hình, chuyển kiến trúc Frontend sang **Mô hình Đa Trang trong SPA (Single Page View Routing)**:

### 2.1. Cấu trúc các Page Containers trong `public/index.html`
Tạo các `<div class="app-page" id="...">` hiển thị độc lập:
1. `#homePageView`: Trang chủ (Hero Banner, Lưới truyện, Bảng xếp hạng bên phải).
2. `#storyDetailPageView`: **Trang Chi Tiết Bộ Truyện toàn màn hình** (Thay thế `#storyModal`).
3. `#libraryPageView`: **Trang Tủ Truyện Cá Nhân** (Theo dõi & Lịch sử đọc - Thay thế `#libraryModal`).
4. `#uploaderPageView`: **Kênh Tác Giả & Dịch Giả Studio** (Thay thế `#uploaderModal`).
5. `#adminPageView`: **Bảng Điều Khiển Quản Trị Hệ Thống** (Thay thế `#adminModal`).
6. `#readerModal`: Giữ nguyên chế độ Trình Đọc Toàn Màn Hình (Reader Mode).

### 2.2. Thiết kế chi tiết: Trang Chi Tiết Truyện (`#storyDetailPageView`)
Khi người dùng bấm vào một bộ truyện bất kỳ trên lưới truyện:
- **Thanh đường dẫn (Breadcrumb Trail):** `Trang Chủ / Thể Loại / Tên Truyện`.
- **Phần Hero Banner của Truyện (Manga Hero Section):**
  - Ảnh nền mờ ảo (Backdrop blur) tạo từ chính ảnh bìa truyện.
  - **Cột trái (280px):** Ảnh bìa sắc nét (tỷ lệ 2:3), nút bấm lớn **"📖 Đọc Từ Đầu"**, nút **"⭐ Theo Dõi"** và **"❤️ Yêu Thích"**.
  - **Cột phải (Nội dung chi tiết):**
    - Tiêu đề truyện lớn (H1, 2rem, đậm chất MangaDex).
    - Tên khác / Tên gốc.
    - Hàng thẻ meta: Tác giả, Trạng thái (Đang ra / Hoàn thành), Lượt xem, Đánh giá.
    - Danh sách các thẻ Thể loại (Genre Chips - bấm vào để lọc truyện cùng thể loại).
    - Khối tóm tắt giới thiệu nội dung truyện có giãn dòng thoáng mắt.
- **Phần Thân Trang (Tabs hoặc Chia 2 Cột):**
  - **Khu vực Danh Sách Chương:** Bảng danh sách chương rõ ràng (Số chương, Tiêu đề chương, Ngày cập nhật), có ô tìm kiếm chương nhanh (`Tìm chapter...`).
  - **Khu vực Thảo Luận & Bình Luận:** Form gửi bình luận và danh sách bình luận của độc giả ngay bên dưới.

### 2.3. Điều hướng URL mượt mà (Clean Routing)
- Khi mở Trang Chi Tiết Truyện: URL cập nhật thành `/truyen/:slug` qua `history.pushState`.
- Khi người dùng bấm nút **Back** (Quay lại) trên trình duyệt hoặc bấm nút "← Trang Chủ": Trình duyệt quay về `#homePageView` mượt mà không phải reload lại trang.

---

## 3. YÊU CẦU 3: SỬA TRIỆT ĐỂ LỖI MÀU SẮC LIGHT MODE & NÂNG CẤP THẨM MỸ

### 3.1. Sửa Lỗi Tương Phản Hero Banner & Navbar
- **Hero Banner Light Mode:**
  - Nền chuyển sang: `linear-gradient(135deg, #FFF4EE 0%, #FFE9DF 50%, #FFDED2 100%)`.
  - Tiêu đề banner: `#7C2D12` (Đỏ cam đậm sang trọng, tương phản 100% trên nền sáng).
  - Mô tả banner: `#9A3412`.
- **Thanh Navigation Bar & Dropdown Menu:**
  - Bỏ màu gán cứng `#1F2024` và `#24262B`.
  - Ở Light Mode: Nền trắng tinh khôi `#FFFFFF`, viền mảnh `#E2E8F0`, bóng đổ nhẹ `0 4px 16px rgba(0,0,0,0.06)`. Chữ menu màu xám than `#334155`, hover chuyển sang màu cam `#FF6740`.

### 3.2. Nâng cấp Thẻ Truyện (Story Cards)
- Khung ảnh bìa tỷ lệ 2:3, bo góc `12px`.
- Bỏ lớp gradient đen che mất chữ ở Light Mode.
- Hiển thị badge số chương (ví dụ `Ch. 1.0`, `Ch. 2.0`) bằng pill badge màu cam nhẹ tinh tế bên dưới tiêu đề.

---

## 4. TIÊU CHÍ NGHIỆM THU CHO CODEX (ACCEPTANCE CRITERIA)

1. [ ] **Không còn bất kỳ emoji nào** ở header, navbar, thẻ truyện và các nút bấm. Toàn bộ là SVG icons đồng chuẩn nét vẽ và màu sắc.
2. [ ] Bấm vào một bộ truyện sẽ chuyển sang **Trang Chi Tiết Truyện toàn màn hình**, không còn hiện pop-up modal che giữa trang.
3. [ ] Các mục Quản lý (Tủ truyện, Uploader, Admin) đều hiển thị dưới dạng **trang giao diện riêng** thoáng đãng, chuyên nghiệp.
4. [ ] Bấm nút Back của trình duyệt hoạt động chính xác (quay lại trang trước).
5. [ ] Chuyển sang **Light Mode**: Chữ ở Hero Banner đọc rõ mồn một, thanh menu nền sáng sang trọng, không còn bất kỳ mảng đen nào bị lỗi.
6. [ ] Chạy `npm test` và `npm start` không phát sinh lỗi.
