# 📑 MangaDex - Nền Tảng Đọc Truyện Online Đa Nền Tảng (Web & Mobile App)

> **Đồ án chuyên ngành Công nghệ thông tin - Kỹ thuật phần mềm**  
> **Sinh viên thực hiện:** Trần Đức Lương (MSV: 10123216 - Lớp: 12523W.4)  
> **GVHD:** TS. Hoàng Quốc Việt  
> **Trường:** Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY)

---

## 🌟 Giới Thiệu Dự Án

**MangaDex** là nền tảng đọc truyện tranh (Manga, Manhwa, Manhua, Webtoon) và tiểu thuyết trực tuyến toàn diện, được xây dựng theo kiến trúc hiện đại gồm cả **Website Fullstack (Single Page Application)** và **Ứng dụng Di Động (React Native Expo)**.

Hệ thống kết nối trực tiếp với cơ sở dữ liệu MySQL thông qua chuẩn RESTful API, cung cấp trải nghiệm đọc mượt mà, tối ưu tốc độ tải ảnh, loại bỏ hoàn toàn quảng cáo rác và hỗ trợ chuyển đổi linh hoạt giữa giao diện Dark Mode / Light Mode.

---

## 🚀 Tính Năng Nổi Bật

### 1. Phân Hệ Độc Giả (Reader Portal)
- **Giao diện hiện đại (Web & Mobile):** Thiết kế chuẩn MangaDex Dark theme sang trọng (`#131416` kết hợp màu cam `#FF6740`), hỗ trợ chuyển đổi Dark / Light / Sepia Mode.
- **Tìm kiếm nâng cao (Advanced Search):** Bộ lọc đa năng với cơ chế **Tri-state Checkbox (3 trạng thái: `✔` Include / `❌` Exclude / `⬜` Ignore)** cho 47 thể loại, lọc theo quốc gia, trạng thái và số chương.
- **Trình đọc chuyên nghiệp (Pro Reader):**
  - **Truyện tranh (Manga/Webtoon):** Cuộn dọc vô tận (Vertical Stream), không viền đen, chạm 1 chạm để ẩn/hiện thanh điều hướng (Immersive Mode).
  - **Truyện chữ (Novel):** Tùy chỉnh kích thước font chữ (A+/A-), đổi màu nền dịu mắt.
  - Phím tắt bàn phím trên máy tính (`← / →` đổi chương, `F` toàn màn hình).
- **Tủ truyện cá nhân (Library):** Tự động đồng bộ tiến độ đọc dở, lưu danh sách truyện theo dõi (Follow) và truyện yêu thích (Like).
- **Cộng đồng & Tương tác:** Bình luận theo từng bộ truyện, thảo luận độc giả.

### 2. Kênh Tác Giả & Dịch Giả (Uploader Studio)
- Khai báo tác phẩm mới với đầy đủ thông tin: Tác giả, Thể loại, Tình trạng, Giới hạn độ tuổi (0+, 13+, 16+, 18+).
- Tải lên ảnh bìa và **tải lên hàng loạt ảnh chương truyện tranh** qua `multer`.
- Chỉnh sửa thông tin tác phẩm, quản lý và sửa link ảnh chương lỗi.

### 3. Bảng Quản Trị Hệ Thống (Admin Control Panel)
- **Dashboard Thống kê:** Tổng số truyện, tổng lượt đọc, thành viên, bình luận, chương đã đăng.
- **Kiểm duyệt nội dung:** Phê duyệt hoặc từ chối các bộ truyện mới do uploader gửi lên.
- **Quản lý người dùng & Phân quyền:** Phân quyền vai trò (Admin, Uploader, Reader), Khóa/Mở khóa tài khoản (Ban/Unban).
- **Kiểm duyệt bình luận:** Xóa các bình luận vi phạm tiêu chuẩn cộng đồng.

### 4. Ứng Dụng Di Động Đa Nền Tảng (React Native Expo)
- Thanh **Bottom Tab Bar với nút Thư viện hình tròn nổi bật ở giữa (Floating Center Tab)**.
- Bảng **Bottom Sheet** trượt từ đáy màn hình lên để quản lý hồ sơ cá nhân và cài đặt đọc truyện.
- Chạy thử nghiệm trực tiếp trên cả Android và iOS thông qua ứng dụng **Expo Go**.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện |
| :--- | :--- |
| **Backend API** | Node.js (v18+), Express.js (MVC Pattern), `mysql2` Pool, `multer`, `dotenv` |
| **Cơ sở dữ liệu** | MySQL 8.0 (12 bảng quan hệ chuẩn hóa 3NF, charset `utf8mb4`) |
| **Bảo mật & Auth** | JSON Web Token (JWT), `bcryptjs`, `express-rate-limit`, Input Sanitization |
| **Kiểm thử tự động** | Jest, Supertest (5 test suites, 10 unit/integration tests pass 100%) |
| **Giao diện Web** | HTML5 Semantic, CSS3 Modern (Custom Tokens), Vanilla JavaScript (SPA View Routing) |
| **Ứng dụng Mobile** | React Native, Expo SDK, `@react-navigation`, `expo-image`, Axios |

---

## 📁 Cấu Trúc Mã Nguồn

```text
MangaDex/
├── app.js                          # Express app entry & middleware cấu hình
├── bin/www                         # HTTP Server listener (Port 3000)
├── common/                         # Kết nối DB MySQL Pool, helper response
├── controllers/                    # 16 controllers xử lý logic nghiệp vụ
├── middlewares/                    # Xác thực JWT, phân quyền RBAC, upload Multer, Rate-limit
├── models/                         # 12 models truy vấn cơ sở dữ liệu
├── routes/                         # Định tuyến RESTful API (/api/v1) & SPA fallback
├── public/                         # Giao diện Web SPA
│   ├── index.html                  # Giao diện chính (SPA chứa tất cả views & modals)
│   ├── stylesheets/style.css       # Toàn bộ CSS giao diện, Dark/Light mode
│   ├── javascripts/main.js         # Logic Frontend, gọi API, điều hướng View
│   └── uploads/                    # Thư mục lưu ảnh bìa và ảnh chương tải lên
├── database/
│   ├── schema.sql                  # Cấu trúc 12 bảng MySQL
│   ├── seed.js                     # Script nạp dữ liệu mẫu tiểu thuyết
│   ├── seed_comic.js               # Script tạo manga SVG & chương truyện tranh mẫu
│   └── migrate_opt.js              # Script migration bổ sung cột động
├── tests/                          # Bộ kiểm thử tự động (Jest & Supertest)
├── document/                       # Báo cáo Word, tài liệu kế hoạch, Postman API Collection
└── mobile/                         # Ứng dụng di động React Native Expo
    ├── App.js                      # Điều hướng chính và các màn hình Mobile
    ├── src/services/api.js         # Kết nối API Backend qua IP mạng LAN
    ├── src/components/             # Bottom Sheet, Header, Thẻ truyện
    └── package.json
```

---

## 💻 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Chuẩn bị môi trường
- Cài đặt **Node.js** (phiên bản v18 trở lên).
- Cài đặt **MySQL 8.0** (hoặc XAMPP / Laragon).

### 2. Thiết lập Cơ sở dữ liệu
1. Mở MySQL Workbench hoặc phpMyAdmin, tạo cơ sở dữ liệu mới:
   ```sql
   CREATE DATABASE doc_truyen_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Nhập file [database/schema.sql](database/schema.sql) để tạo 12 bảng quan hệ và dữ liệu ban đầu.

### 3. Cấu hình biến môi trường (`.env`)
Tạo file `.env` ở thư mục gốc (tham khảo từ file `.env.example`):
```env
PORT=3000
NODE_ENV=development

# Cấu hình kết nối MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=doc_truyen_online
DB_PORT=3306

# Khóa bí mật JWT
JWT_SECRET=mangadex_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
```

### 4. Chạy Migration và Khởi động Server Web
```bash
# Cài đặt các thư viện backend
npm install

# Chạy migration cập nhật các cột mới
node database/migrate_opt.js

# Khởi động máy chủ web
npm start
```
Truy cập giao diện Web tại địa chỉ: **`http://localhost:3000`**

### 5. Chạy Ứng dụng Di Động (Expo Go)
```bash
# Di chuyển vào thư mục mobile
cd mobile

# Cài đặt thư viện mobile
npm install

# Khởi động Metro Bundler
npx expo start
```
- Mở ứng dụng **Expo Go** trên điện thoại (tải từ CH Play hoặc App Store).
- Quét mã QR hiển thị trên màn hình terminal để chạy app ngay trên điện thoại!

---

## 🔑 Tài Khoản Thử Nghiệm (Demo Accounts)

Hệ thống có sẵn các tài khoản demo để kiểm tra phân quyền RBAC:

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` | `123456` | Toàn quyền kiểm duyệt truyện, ban user, quản lý danh mục |
| **Dịch giả (Uploader)** | `dichgia_vip` | `123456` | Đăng truyện mới, tải lên ảnh chương, sửa truyện của tôi |
| **Độc giả (Reader)** | `docgia_01` | `123456` | Đọc truyện, theo dõi, yêu thích, bình luận, quản lý hồ sơ |

---

## 🧪 Kiểm Thử Tự Động (Testing)

Chạy bộ kiểm thử tự động với Jest:
```bash
npm test
```
*Kết quả: 5 test suites (10 tests) pass 100%.*

---

## 📜 Giấy Phép (License)

Dự án được phát triển phục vụ mục đích nghiên cứu, học tập và bảo vệ đồ án tốt nghiệp tại Trường Đại học Sư phạm Kỹ thuật Hưng Yên.
