# KẾ HOẠCH PHÁT TRIỂN & HOÀN THIỆN DỰ ÁN (DÀNH CHO CODEX / DEVELOPER)
**Dự án:** MangaDex - Nền tảng Đọc Truyện Online  
**Mục tiêu:** Tiếp nhận codebase hiện tại, triển khai các tính năng còn thiếu, tối ưu hiệu năng và chuẩn bị sẵn sàng cho mobile app & bảo vệ đồ án.

---

## 1. TỔNG QUAN HIỆN TRẠNG DỰ ÁN

### 1.1. Công nghệ đang sử dụng (Tech Stack)
- **Backend:** Node.js (v18+), Express (v4.16+), mô hình MVC chuẩn (`routes/`, `controllers/`, `models/`, `middlewares/`, `common/`).
- **Database:** MySQL 8.0 (`mysql2`), thiết kế chuẩn 12 bảng liên kết khóa ngoại (`database/schema.sql`).
- **Xác thực & Bảo mật:** JSON Web Token (JWT), `bcryptjs`, RBAC 3 vai trò (`Admin: 1`, `Uploader: 2`, `Reader: 3`).
- **Frontend:** SPA thuần (Vanilla JS, CSS3 Modern Flex/Grid, HTML5 Semantic), Dark/Light/Sepia Mode, Responsive.
- **Dữ liệu mẫu:** Có sẵn script seed tài khoản, truyện chữ và truyện tranh manga Comic SVG (`database/seed.js`, `database/seed_comic.js`).

### 1.2. Cấu trúc thư mục chính
```text
Ứng dụng đọc truyện online/
├── app.js                          # Express app entry & middleware cấu hình
├── bin/www                         # HTTP Server listener
├── common/
│   └── db.js                       # MySQL Connection Pool
├── controllers/                    # 16 controllers xử lý logic nghiệp vụ
│   ├── authController.js           # Đăng nhập, đăng ký, JWT
│   ├── storiesController.js        # Lấy danh sách truyện, chi tiết, top views
│   ├── chaptersController.js       # Danh sách & chi tiết chương
│   ├── uploaderController.js       # CMS Dịch giả: đăng truyện, sửa chương
│   ├── adminController.js          # CMS Quản trị: thống kê, duyệt truyện, ban user
│   └── meController.js             # Tủ truyện: follow, lịch sử đọc cá nhân
├── middlewares/
│   └── authMiddleware.js           # Xác thực Token & RBAC
├── models/                         # 12 models truy vấn SQL
├── public/
│   ├── index.html                  # Giao diện chính (SPA chứa tất cả views & modal)
│   ├── javascripts/main.js         # Toàn bộ logic frontend, call API, render UI
│   ├── stylesheets/style.css       # Toàn bộ CSS giao diện, dark mode, animation
│   └── images/                     # Ảnh bìa mặc định & các chương manga SVG
├── database/
│   ├── schema.sql                  # Cấu trúc 12 bảng cơ sở dữ liệu
│   ├── seed.js                     # Script nạp dữ liệu mẫu
│   ├── seed_comic.js               # Script tạo manga SVG & chương truyện tranh
│   └── migrate_opt.js              # Script migration bổ sung cột
└── document/
    └── PRD - Nen tang Doc Truyen Online (Web & Mobile App).docx
```

---

## 2. LỘ TRÌNH THỰC HIỆN DÀNH CHO CODEX (ACTION PLAN)

Codex hãy triển khai tuần tự theo 5 giai đoạn (Phases) dưới đây. Mỗi task đều có tiêu chí hoàn thành (Acceptance Criteria) cụ thể.

---

### 🟢 GIAI ĐOẠN 1: TÍCH HỢP UPLOAD FILE ẢNH VẬT LÝ (MULTER)
*Mục tiêu: Thay thế việc nhập link ảnh tĩnh bằng tính năng kéo thả / chọn file ảnh từ máy tính.*

#### Task 1.1: Cài đặt thư viện & Cấu hình Upload Middleware
- **Thư viện cần thêm:** `npm install multer`
- **File cần tạo mới:** `middlewares/uploadMiddleware.js`
- **Yêu cầu kỹ thuật:**
  - Sử dụng `multer.diskStorage` lưu vào thư mục `public/uploads/covers/` (cho ảnh bìa truyện) và `public/uploads/chapters/` (cho ảnh chương tranh).
  - Tự động tạo thư mục nếu chưa tồn tại (`fs.mkdirSync(..., { recursive: true })`).
  - Đổi tên file duy nhất tránh trùng lặp: `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`.
  - Giới hạn file: Chỉ cho phép định dạng ảnh (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), dung lượng tối đa 5MB/ảnh.

#### Task 1.2: Cập nhật API Uploader
- **File cần sửa:** `routes/uploaderRoute.js` & `controllers/uploaderController.js`
- **Endpoints:**
  1. `POST /api/uploader/stories`: Hỗ trợ `upload.single('cover_file')` để upload ảnh bìa trực tiếp khi tạo mới hoặc cập nhật.
  2. `POST /api/uploader/chapters`: Hỗ trợ `upload.array('chapter_images', 50)` để upload hàng loạt tối đa 50 trang truyện tranh.
- **Tiêu chí hoàn thành (Acceptance Criteria):**
  - Uploader có thể chọn file ảnh từ máy tính hoặc giữ nguyên tùy chọn nhập link URL.
  - File ảnh được lưu an toàn trong `public/uploads/` và lưu đường dẫn `/uploads/...` vào MySQL.

---

### 🟢 GIAI ĐOẠN 2: PHÂN TRANG PHÍA SERVER (SERVER-SIDE PAGINATION) & BỘ LỌC
*Mục tiêu: Đảm bảo hiệu năng tải trang mượt mà khi dữ liệu lên đến hàng ngàn bộ truyện.*

#### Task 2.1: Phân trang danh sách truyện
- **File cần sửa:** `controllers/storiesController.js` & `models/storiesModel.js`
- **Yêu cầu kỹ thuật:**
  - Cập nhật API `GET /stories` và `GET /stories/category/:slug` hỗ trợ query params: `page` (mặc định 1), `limit` (mặc định 18), `sort` (`latest`, `views`, `likes`, `name`), `status` (`all`, `ongoing`, `completed`).
  - Response trả về chuẩn:
    ```json
    {
      "data": [...],
      "pagination": {
        "page": 1,
        "limit": 18,
        "total": 120,
        "totalPages": 7
      }
    }
    ```
#### Task 2.2: Cập nhật giao diện thanh phân trang
- **File cần sửa:** `public/javascripts/main.js` & `public/index.html`
- Thêm thanh phân trang (Pagination component: `« Đầu`, `1`, `2`, `3` ... `Cuối »`) ở cuối lưới truyện.

---

### 🟢 GIAI ĐOẠN 3: TỐI ƯU SEO & CLEAN URL SLUG ROUTING
*Mục tiêu: Chuẩn hóa đường dẫn cho công cụ tìm kiếm và chia sẻ mạng xã hội.*

#### Task 3.1: Hỗ trợ URL theo định dạng chuẩn
- Định dạng URL mong muốn:
  - Chi tiết truyện: `/truyen/:slug`
  - Đọc chương: `/truyen/:storySlug/chuong-:chapterNumber`
- **File cần sửa:** `routes/index.js`, `app.js` và `public/javascripts/main.js`
- Sử dụng `window.history.pushState` trong SPA để thay đổi URL trên thanh trình duyệt mà không cần tải lại toàn bộ trang, giúp người dùng có thể copy link chia sẻ cho bạn bè.

#### Task 3.2: Thẻ Meta SEO Động
- Khi mở modal truyện hoặc mở reader, tự động cập nhật thẻ:
  - `document.title` = `{Tên Truyện} - Chương {Số Chương} | MangaDex`
  - Meta tags: `og:title`, `og:description`, `og:image`.

---

### 🟢 GIAI ĐOẠN 4: CHUẨN BẬT API CHO MOBILE APP (FLUTTER / REACT NATIVE)
*Theo tài liệu kiến trúc PRD trong thư mục `document/`, hệ thống hướng tới cả Web & Mobile App.*

#### Task 4.1: Chuẩn hóa Response JSON & Error Handling
- Tạo helper format response tại `common/responseHelper.js`:
  ```js
  exports.success = (res, data, message = 'Success', code = 200) => {
    return res.status(code).json({ success: true, message, data });
  };
  exports.error = (res, message = 'Error', code = 500, errors = null) => {
    return res.status(code).json({ success: false, message, errors });
  };
  ```

#### Task 4.2: Tạo tài liệu API (Swagger hoặc Postman Collection)
- Tạo file `document/API_COLLECTION.json` (chuẩn Postman v2.1) bao gồm đầy đủ các request:
  - Auth: Đăng ký, Đăng nhập, Xem thông tin `/api/me`.
  - Stories: Danh sách, Chi tiết, Xếp hạng, Tìm kiếm.
  - Reader: Lấy nội dung chương, lưu lịch sử đọc.
  - Uploader & Admin: Tạo truyện, duyệt truyện, quản lý chương.

---

### 🟢 GIAI ĐOẠN 5: BẢO MẬT & KIỂM THỬ (TESTING & SECURITY AUDIT)

#### Task 5.1: Rate Limiting & Input Sanitization
- Thêm `express-rate-limit` để ngăn chặn brute-force vào API `/api/auth/login` và `/api/comments`.
- XSS Protection: Escape hoặc làm sạch nội dung bình luận (`content`) trước khi ghi vào database.

#### Task 5.2: Viết kịch bản kiểm thử (Automated Tests)
- **Thư viện đề xuất:** `jest` + `supertest`
- Viết test suite cho các tính năng trọng yếu:
  - `tests/auth.test.js`: Đăng ký, Đăng nhập thành công, Thất bại khi sai mật khẩu.
  - `tests/stories.test.js`: Lấy danh sách truyện, tìm kiếm, lọc theo thể loại.
  - `tests/rbac.test.js`: Kiểm tra quyền Reader không thể truy cập API Admin/Uploader.

---

## 3. CHECKLIST KIỂM THỬ TRƯỚC KHI BÀN GIAO (ACCEPTANCE CHECKLIST)

- [ ] Chạy lệnh `npm start` không phát sinh lỗi hoặc cảnh báo crash.
- [ ] Uploader có thể upload ảnh bìa và nhiều ảnh chương truyện thành công.
- [ ] Phân trang hoạt động mượt mà ở cả Trang chủ và trang Thể loại.
- [ ] Chế độ đọc truyện tranh (Comic/Manga) cuộn mượt và đọc truyện chữ tùy biến font chữ hoạt động tốt trên cả máy tính lẫn điện thoại.
- [ ] Đăng nhập với 3 tài khoản mẫu (`admin`, `dichgia_vip`, `docgia_01`) kiểm tra phân quyền RBAC hoạt động chính xác 100%.
- [ ] Code có chú thích rõ ràng, tuân thủ nguyên tắc Clean Code và chuẩn MVC.
