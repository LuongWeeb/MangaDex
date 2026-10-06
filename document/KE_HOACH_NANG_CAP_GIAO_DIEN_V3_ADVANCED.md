# KẾ HOẠCH NÂNG CẤP GIAO DIỆN & TÍNH NĂNG V3 (MANGADEX PRO MAX)
**Dự án:** MangaDex - Nền tảng Đọc Truyện Online  
**Dành cho:** Codex / Fullstack Developer tiếp nhận triển khai  
**Mục tiêu:**  
1. Triển khai **Trang Tìm Kiếm Nâng Cao (Advanced Search)** với bộ lọc đa điều kiện & Tri-state checkbox theo ảnh mẫu.  
2. Cập nhật **Avatar người dùng hình tròn** trên Header và xây dựng **Trang Quản Lý Hồ Sơ Cá Nhân (User Profile Studio)** theo ảnh mẫu.  
3. Nâng cấp trải nghiệm **Giao diện Di Động (Mobile Web App UI/UX)** lấy cảm hứng từ video `demo.mp4` (Thanh điều hướng đáy Bottom Nav Bar, Side Drawer menu, trình đọc tối ưu chạm vuốt).

---

## 1. MODULE 1: TRANG TÌM KIẾM NÂNG CAO (ADVANCED SEARCH PAGE)
*Tham chiếu: Ảnh mẫu 1 (Bộ lọc đa năng chuẩn TruyenQQ / MangaDex).*

### 1.1. Cấu trúc Giao diện (`#advancedSearchPageView`)
Tạo một trang giao diện riêng toàn màn hình khi người dùng bấm vào nút "Tìm Truyện" trên thanh Navigation bar:

1. **Thanh Tiêu Đề & Nút Điều Khiển:**
   - Tiêu đề: `🔍 Tìm Kiếm Truyện Nâng Cao`
   - Nút `Ẩn / Hiện khung bộ lọc` (Toggle Filter Box).
   - Nút `Reset` (Làm mới tất cả lựa chọn về mặc định).
2. **Khung Hướng Dẫn Chọn Thể Loại (Tri-state Checkbox Guide):**
   - Hướng dẫn rõ ràng 3 trạng thái:
     - `✔` (Xanh lá): *Tìm trong những thể loại này (Bắt buộc chứa)*.
     - `❌` (Đỏ): *Loại trừ những thể loại này (Không được chứa)*.
     - `⬜` (Trắng): *Có thể thuộc hoặc không thuộc thể loại này (Bỏ qua)*.
3. **Lưới Danh Sách Thể Loại (3 Cột Checkbox):**
   - Render động 47 thể loại (Action, Adventure, Anime, Chuyển Sinh, Cổ Đại, Comedy, Comic, Doujinshi, Drama, Fantasy, Harem, Historical, Huyền Huyễn, Isekai, Manga, Manhua, Manhwa, Martial Arts, Ngôn Tình, Romance, Sci-fi, Shounen, Slice of life, Webtoon, Xuyên Không...).
   - Mỗi thể loại là 1 nút bấm/ô có thể click xoay vòng 3 trạng thái: `⬜ (Trống) -> ✔ (Include) -> ❌ (Exclude) -> ⬜ (Trống)`.
4. **Hàng Dropdown Bộ Lọc Bổ Sung:**
   - **Quốc gia:** Tất cả | Trung Quốc (Manhua) | Nhật Bản (Manga) | Hàn Quốc (Manhwa) | Việt Nam.
   - **Tình trạng:** Tất cả | Đang tiến hành | Hoàn thành.
   - **Số lượng chương:** Tất cả | > 0 | ≥ 10 chương | ≥ 50 chương | ≥ 100 chương.
   - **Sắp xếp theo:** Ngày cập nhật giảm dần | Lượt xem nhiều nhất | Lượt theo dõi | Lượt thích | Tên A-Z.
5. **Nút "Tìm Kiếm" (Primary CTA Button):** Nằm chính giữa, màu cam MangaDex nổi bật.
6. **Lưới Kết Quả Tìm Kiếm (Results Grid):**
   - Hiển thị danh sách truyện tìm được kèm số lượng kết quả (`Tìm thấy 24 bộ truyện phù hợp`).
   - Có thanh phân trang (Pagination).

### 1.2. Nâng cấp API Backend (`controllers/storiesController.js`)
- Cập nhật hàm `getStories` để nhận thêm query parameters:
  - `include_cats`: Danh sách slug/id thể loại bắt buộc có.
  - `exclude_cats`: Danh sách slug/id thể loại cần loại trừ.
  - `status`: `Đang ra` / `Hoàn thành`.
  - `min_chapters`: Số chương tối thiểu (dùng `HAVING COUNT(ch.id) >= ?`).
  - `sort`: `latest`, `views`, `likes`, `follows`, `title`.

---

## 2. MODULE 2: AVATAR TRÒN & TRANG QUẢN LÝ HỒ SƠ CÁ NHÂN (USER PROFILE)
*Tham chiếu: Ảnh mẫu 2 (Giao diện Quản lý tài khoản cá nhân).*

### 2.1. Nâng cấp Header Góc Phải
- Khi chưa đăng nhập: Hiển thị nút "Đăng Nhập".
- Khi đã đăng nhập:
  - Thay thế chữ hiển thị bằng **Khối Avatar Tròn** (`width: 38px, height: 38px, border-radius: 50%`, viền cam tinh tế).
  - Bấm vào Avatar mở **Dropdown Menu nhanh**:
    - `👤 Hồ Sơ Của Tôi` (Chuyển sang trang Profile).
    - `🔖 Tủ Truyện & Lịch Sử` (Chuyển sang trang Library).
    - `✍️ Kênh Đăng Truyện` (Nếu là Uploader/Admin).
    - `👑 Trang Quản Trị` (Nếu là Admin).
    - `🚪 Đăng Xuất`.

### 2.2. Xây dựng Trang Hồ Sơ Cá Nhân (`#profilePageView`)
Bố cục 2 cột chuyên nghiệp:
1. **Cột Trái (Sidebar Tabs):**
   - `👤 Quản lý tài khoản` (Tab 1: Thông tin cá nhân).
   - `🔑 Đổi mật khẩu` (Tab 2: Nhập mật khẩu cũ, mật khẩu mới, xác nhận).
   - `🏆 Cấp độ & Thành tựu` (Tab 3: Hiển thị Level người đọc dựa trên số chương đã xem, thanh Exp tiến độ).
   - `📚 Tủ truyện của tôi` (Liên kết nhanh đến danh sách theo dõi).
2. **Cột Phải (Nội dung Quản lý tài khoản):**
   - **Khối Ảnh Đại Diện (Avatar Box):**
     - Avatar tròn lớn (100x100px).
     - Nút "Chọn hình" (Upload ảnh từ máy tính hoặc nhập URL ảnh mới).
     - Dòng nhắc nhở văn minh: *"Ảnh đại diện hợp lệ, không vi phạm tiêu chuẩn cộng đồng."*
   - **Form Thông Tin:**
     - `Email`: Hiển thị email đăng ký (chỉ đọc hoặc cho phép cập nhật).
     - `Tên hiển thị / Họ & Tên`: Input text sửa đổi.
     - `Giới tính`: Radio button [Nam] / [Nữ] / [Khác].
     - Nút `💾 Lưu Thay Đổi` (Nút màu cam MangaDex bo góc đẹp).

### 2.3. Backend API Bổ Sung (`routes/meRoute.js` & `controllers/meController.js`)
- `PUT /api/me/profile`: Cập nhật `full_name`, `avatar_url`, `gender`.
- `PUT /api/me/change-password`: Kiểm tra mật khẩu cũ với `bcryptjs.compare`, sau đó băm mật khẩu mới và lưu vào MySQL.

---

## 3. MODULE 3: GIAO DIỆN DI ĐỘNG CHUẨN APP (LẤY CẢM HỨNG TỪ VIDEO DEMO.MP4)
*Lưu ý: Chỉ kế thừa BỐ CỤC & TRẢI NGHIỆM MOBILE HIỆN ĐẠI, loại trừ toàn bộ nội dung không phù hợp.*

### 3.1. Header Mobile & Drawer Navigation (Vuốt trượt từ cạnh trái)
- Trên màn hình di động (`@media (max-width: 768px)`):
  - Ẩn thanh menu ngang dài rườm rà.
  - Header thu gọn:
    - Nút **Hamburger (3 gạch)** bên trái -> Bấm vào mở **Side Drawer Menu** trượt mượt mà từ cạnh trái ra chứa: Danh mục thể loại, Xếp hạng, Chế độ ban đêm 🌙/☀️, Kênh uploader.
    - Logo MangaDex ở giữa (gọn gàng, tỉ lệ đẹp).
    - Cụm icon Kính lúp (Search) + Avatar người dùng ở góc phải.

### 3.2. Thanh Điều Hướng Đáy Kiểu Ứng Dụng (Mobile Bottom Navigation Bar)
Cố định ở đáy màn hình điện thoại (`position: fixed; bottom: 0; left: 0; right: 0; z-index: 100`):
- Gồm 5 nút biểu tượng SVG kèm nhãn chữ nhỏ bên dưới:
  1. `🏠 Trang Chủ`
  2. `🔍 Tìm Kiếm` (Mở nhanh trang Tìm kiếm nâng cao).
  3. `🔖 Tủ Truyện` (Lịch sử đọc & Truyện theo dõi).
  4. `🏆 Xếp Hạng` (Top ngày, tuần, tháng).
  5. `👤 Cá Nhân` (Trang Profile cá nhân).
- Nền mờ kính cao cấp: `backdrop-filter: blur(16px); background: rgba(25, 26, 28, 0.95);` (Dark) hoặc `rgba(255, 255, 255, 0.95);` (Light).

### 3.3. Tối ưu Lưới Truyện & Trình Đọc Trên Mobile
1. **Lưới truyện:** Chuyển sang bố cục 2 cột hoặc 3 cột (`grid-template-columns: repeat(2, 1fr)` hoặc `repeat(3, 1fr)`), ảnh bìa tỷ lệ 2:3, bo tròn `10px`, chữ tự động co giãn.
2. **Trình đọc trên điện thoại (Mobile Reader Mode):**
   - Khử hoàn toàn viền trắng 2 bên, ảnh truyện tranh rộng trọn vẹn 100% màn hình điện thoại.
   - Cơ chế chạm 1 chạm vào màn hình (Tap to Toggle HUD) để ẩn/hiện thanh điều khiển trên và dưới giúp người đọc tập trung thưởng thức tác phẩm.
   - Nút chuyển chương trước/sau thiết kế to bản, dễ bấm bằng một ngón tay cái.

---

## 4. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)
- [ ] Bấm "Tìm Truyện" chuyển sang **Trang Tìm Kiếm Nâng Cao** có đầy đủ bộ lọc 3 trạng thái (✔, ❌, ⬜), hoạt động lọc ra kết quả chính xác.
- [ ] Header hiển thị **Avatar tròn**, bấm vào mở được **Trang Quản Lý Hồ Sơ Cá Nhân** với đầy đủ các tab và form cập nhật.
- [ ] Trên thiết bị di động (hoặc khi thu nhỏ trình duyệt):
  - Xuất hiện **Thanh Bottom Navigation Bar** ở đáy màn hình.
  - Bấm Menu Hamburger mở ra thanh trượt danh mục mượt mà.
  - Trình đọc truyện tranh cuộn mượt, tràn viền màn hình, không bị giật lag.
- [ ] Chạy `npm test` và `npm start` hệ thống chạy hoàn hảo, không có lỗi console.
