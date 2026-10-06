# KẾ HOẠCH MASTER: HOÀN THIỆN 100% CHỨC NĂNG APP MOBILE (MANGADEX EXPO)
**Dự án:** MangaDex Mobile App (React Native Expo)  
**Dành cho:** Codex / React Native Developer  
**Mục tiêu:** Xóa bỏ toàn bộ dữ liệu giả, hoàn thiện tất cả các luồng tương tác thực tế từ Đăng nhập, Tủ truyện, Trình đọc, Theo dõi, Yêu thích đến Bình luận để ứng dụng trở thành một App thương mại hoàn chỉnh.

---

## 1. BẢNG DANH MỤC TOÀN BỘ CHỨC NĂNG (FULL FEATURE MATRIX)

---

### 🟢 PHẦN 1: DỮ LIỆU THẬT & HỆ THỐNG XÁC THỰC (AUTH & USER PROFILE)

1. **Xóa bỏ 100% Mock Data:**
   - Xóa bỏ tài khoản giả `LuongWibi` và các con số ảo `12 / 48 / 7`.
   - Xóa bỏ công thức tính chương ảo `84 - index * 7` trong màn hình Thư viện.
2. **Khắc phục lỗi đếm số lượng thể loại (Fix 0 truyện):**
   - Cập nhật backend `controllers/categoriesController.js` đếm `COUNT(DISTINCT sc.story_id) AS story_count` qua `LEFT JOIN story_categories`.
   - Mobile `ExploreScreen` đọc trường `category.story_count` thật để hiển thị đúng số truyện.
3. **Hệ thống Đăng Nhập / Đăng Ký / Đăng Xuất hoàn chỉnh (`AuthModal.js`):**
   - Quản lý Token với `@react-native-async-storage/async-storage`.
   - Có Modal Đăng nhập/Đăng ký khi người dùng bấm vào Avatar hoặc nút Đăng nhập.
   - Hỗ trợ đăng nhập nhanh với 3 tài khoản demo: `admin`, `dichgia_vip`, `docgia_01` (mật khẩu `123456`).
   - Gọi `POST /api/v1/auth/login`, lưu JWT token, gọi `GET /api/v1/me` để lấy thông tin tài khoản thật từ MySQL.
   - Nút **Đăng xuất**: Xóa token, đặt lại trạng thái khách (Guest).
4. **Trang Profile Cá Nhân & Hoạt Động Thật:**
   - Đọc số liệu thật từ database: Số truyện theo dõi thật (`GET /api/v1/me/follows`), số truyện đã thích thật (`GET /api/v1/me/likes`), số chương đã đọc (`GET /api/v1/me/history`).
   - Đổi họ tên, đổi ảnh đại diện (`PUT /api/v1/me/profile`).
   - Đổi mật khẩu (`PUT /api/v1/me/change-password`).

---

### 🟢 PHẦN 2: CHI TIẾT TRUYỆN (`StoryDetailScreen`) - THÊM CÁC NÚT TƯƠNG TÁC CÒN THIẾU

1. **Nút "⭐ Theo Dõi Truyện":**
   - Kiểm tra trạng thái đang theo dõi hay chưa (`GET /api/v1/me/follows/check/:id`).
   - Bấm nút: Gọi `POST /api/v1/me/follows/:id` để bật/tắt theo dõi (Toggle Follow), đổi icon và màu nút ngay lập tức.
2. **Nút "❤️ Yêu Thích":**
   - Kiểm tra trạng thái đã thích hay chưa (`GET /api/v1/me/likes/check/:id`).
   - Bấm nút: Gọi `POST /api/v1/me/likes/:id` để tăng/giảm lượt thích.
3. **Danh Sách Chương:**
   - Hiển thị danh sách đầy đủ từ `GET /api/v1/chapters?story_id=...`, sắp xếp từ chương 1 đến chương mới nhất.
   - Bấm vào chương bất kỳ sẽ mở thẳng chương đó trong `ReaderScreen`.
4. **Khu Vực Bình Luận Độc Giả (Comments Section):**
   - Hiển thị danh sách bình luận của bộ truyện từ `GET /comments/story/:storyId`.
   - Cho phép nhập nội dung và bấm gửi bình luận qua `POST /comments`.

---

### 🟢 PHẦN 3: TRÌNH ĐỌC TRUYỆN (`ReaderScreen`) - HOÀN THIỆN ĐIỀU HƯỚNG CHƯƠNG

1. **Hoạt Hóa 3 Nút Bấm Điều Hướng Ở Footer:**
   - **`‹ Chương trước`:** Lấy chương liền trước trong danh sách và chuyển ngay sang chương đó (disabled nếu đang ở chương 1).
   - **`Danh sách chương`:** Bấm vào mở Bottom Sheet hiển thị danh sách tất cả các chương để người đọc nhảy nhanh đến chương mong muốn mà không cần thoát ra ngoài.
   - **`Chương sau ›`:** Chuyển ngay sang chương kế tiếp (disabled nếu đã ở chương mới nhất).
2. **Tự Động Lưu Lịch Sử Đọc (Reading Progress Tracking):**
   - Khi người dùng mở đọc một chương: Tự động gọi API `POST /api/v1/me/history` (với `story_id` và `chapter_id`) và lưu vào `AsyncStorage` để đồng bộ tiến độ đọc.
   - Tăng lượt xem chương: Gọi `POST /chapters/:id/views`.

---

### 🟢 PHẦN 4: MÀN HÌNH THƯ VIỆN (`LibraryScreen`) - HIỂN THỊ DỮ LIỆU ĐỌC THẬT

1. **Tab 1: Lịch Sử Đọc (Reading History):**
   - Hiển thị danh sách các bộ truyện vừa đọc dở lấy từ `GET /api/v1/me/history` (gồm: Ảnh bìa, Tên truyện, Tên chương đang đọc dở, thanh tiến trình % đọc).
   - Bấm vào truyện sẽ mở thẳng vào chương đang đọc dở để đọc tiếp.
2. **Tab 2: Truyện Đang Theo Dõi (Followed Stories):**
   - Hiển thị các bộ truyện người dùng đã bấm nút "⭐ Theo Dõi" từ `GET /api/v1/me/follows`.
   - Có badge hiển thị số chương mới nhất.

---

### 🟢 PHẦN 5: MENU CÀI ĐẶT TRONG `AccountBottomSheet.js`

Gắn hàm `onPress` cho tất cả các nút:
1. **`⚙️ Cài đặt đọc`:** Modal tùy chọn chế độ đọc: *Cuộn dọc vô tận (Webtoon)* hoặc *Lật từng trang*.
2. **`🛡️ Bảo mật`:** Modal đổi mật khẩu.
3. **`👤 Chỉnh sửa hồ sơ`:** Modal cập nhật Họ tên, Giới tính, Ảnh đại diện.
4. **`🔔 Thông báo` & `📖 Hướng dẫn`:** Hiển thị popup thông tin giới thiệu phiên bản MangaDex v1.0.0.
5. **`Đăng xuất`:** Xóa token, đặt lại trạng thái khách.

---

## 2. TIÊU CHÍ NGHIỆM THU CUỐI CÙNG (FINAL ACCEPTANCE CRITERIA)

- [ ] Toàn bộ app không còn bất kỳ dữ liệu mockup ảo nào.
- [ ] Đăng nhập, đăng xuất, đổi mật khẩu, đổi avatar hoạt động 100% với MySQL.
- [ ] Màn hình Chi tiết truyện có đầy đủ nút Like, Follow, Đọc từ đầu, xem bình luận và gửi bình luận.
- [ ] Trình đọc chuyển chương Trước/Sau và mở mục lục nhảy chương mượt mà, tự động lưu lịch sử đọc vào Tủ truyện.
- [ ] Màn hình Thư viện hiển thị chính xác các truyện đang theo dõi và truyện đọc dở.
- [ ] Màn hình Khám phá hiển thị số lượng truyện thực tế của từng thể loại.
