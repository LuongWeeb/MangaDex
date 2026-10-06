# KẾ HOẠCH TINH CHỈNH & ĐỒNG NHẤT GIAO DIỆN CHUẨN MANGADEX
**Dành cho:** Codex / Developer tiếp quản dự án  
**Dự án:** MangaDex - Nền tảng Đọc Truyện Online  
**Mục tiêu:** Đồng nhất 100% nhận diện thương hiệu sang **MangaDex** và tái thiết kế giao diện (UI/UX) theo phong cách MangaDex hiện đại, chuyên nghiệp, tối ưu trải nghiệm đọc truyện tranh & truyện chữ.

---

## 1. TỔNG QUAN YÊU CẦU & BẢNG MÀU CHUẨN MANGADEX

### 1.1. Tinh thần thiết kế (Design Philosophy)
- **Tên thương hiệu chính thức:** **MangaDex** (Xóa bỏ hoàn toàn các tên tạm cũ như "MêTruyện", "Mê Đọc Truyện").
- **Phong cách:** Hiện đại, tối giản, đậm chất truyện tranh quốc tế (Dark Mode sang trọng kết hợp màu Cam Accent đặc trưng).

### 1.2. Design System Tokens (CSS Variables)
Áp dụng bảng màu chuẩn MangaDex vào `:root` và `[data-theme="dark"]` trong `public/stylesheets/style.css`:
```css
:root {
  /* MangaDex Brand Orange */
  --accent-primary: #FF6740;
  --accent-hover: #FF7C5C;
  --accent-subtle: rgba(255, 103, 64, 0.12);
  --accent-gradient: linear-gradient(135deg, #FF6740 0%, #FF8A65 100%);
  
  /* MangaDex Dark Palette (Mặc định) */
  --bg-body: #191A1C;
  --bg-surface: #24262B;
  --bg-card: #1F2024;
  --bg-card-hover: #2B2D33;
  --border-color: #2F3238;
  --border-subtle: #24262B;
  
  /* Typography Colors */
  --text-primary: #F3F4F6;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --text-on-accent: #FFFFFF;

  /* Tag & Status Badges */
  --badge-bg: rgba(255, 103, 64, 0.15);
  --badge-text: #FF7C5C;
  --badge-completed: #10B981;
  --badge-ongoing: #3B82F6;
}
```

---

## 2. DANH SÁCH NHIỆM VỤ CHI TIẾT (ACTION TASKS CHO CODEX)

Codex hãy triển khai tuần tự theo 4 giai đoạn cụ thể sau:

---

### 🟢 GIAI ĐOẠN 1: ĐỒNG NHẤT NHẬN DIỆN THƯƠNG HIỆU (BRAND ALIGNMENT)
*Mục tiêu: Quét sạch mọi chữ "Mê Đọc Truyện" / "MêTruyện" và thay thế bằng "MangaDex".*

#### Task 1.1: Cập nhật Header & SEO Meta
- **File cần sửa:** `public/index.html`
  - Đổi thẻ `<title>`: `MangaDex - Đọc Truyện Tranh & Tiểu Thuyết Online Hàng Đầu`
  - Đổi thẻ `og:title` & `description`: Cập nhật theo thương hiệu MangaDex.
  - Logo thương hiệu (dòng ~26):
    - Đổi icon `📚` sang icon MangaDex hiện đại `📑` hoặc logo SVG MangaDex.
    - Đổi chữ `<span class="brand-text">MêTruyện</span>` thành `<span class="brand-text">MangaDex</span>`.
  - Footer bản quyền (dòng ~789): Đổi thành `📑 MangaDex - Nền tảng Đọc Truyện Online Hiện Đại`.

#### Task 1.2: Cập nhật Logic Frontend & Dynamic Titles
- **File cần sửa:** `public/javascripts/main.js`
  - Tìm và thay thế tất cả chuỗi `| MêTruyện` thành `| MangaDex`.
  - Đổi tiêu đề mặc định khi chuyển trang về `MangaDex - Đọc Truyện Online`.

#### Task 1.3: Cập nhật Watermark trong Seed Truyện Tranh & SVG
- **File cần sửa:** `database/seed_comic.js` và các file `public/images/chapters/op_*.svg`
  - Đổi dòng chữ bản quyền chân trang trong SVG:
    `MangaDex Reader • Đọc Truyện Tranh Webtoon Bản Quyền`.
  - Chạy lại lệnh tạo ảnh mẫu: `node database/seed_comic.js`.

#### Task 1.4: Cập nhật Tài liệu API Collection
- **File cần sửa:** `document/API_COLLECTION.json`
  - Đổi tên bộ sưu tập thành `"MangaDex API v1"`.

---

### 🟢 GIAI ĐOẠN 2: THIẾT KẾ LẠI HEADER & THANH ĐIỀU HƯỚNG THEO PHONG CÁCH MANGADEX
*Mục tiêu: Biến thanh menu cam cũ thành thanh điều hướng Dark Theme tối giản, cao cấp.*

#### Task 2.1: Tinh chỉnh Main Navigation Bar
- **File cần sửa:** `public/stylesheets/style.css` & `public/index.html`
- **Yêu cầu kỹ thuật:**
  - Chuyển `site-header` và `main-nav-bar` sang nền tối sâu `var(--bg-surface)` hoặc nền mờ `backdrop-filter: blur(12px)`.
  - Nút bấm menu chính: Chữ màu xám nhạt `var(--text-secondary)`, khi active hoặc hover sẽ có màu cam `var(--accent-primary)` với hiệu ứng gạch chân cam thanh mảnh (accent underline).
  - Tích hợp ô Search box bo tròn hiện đại với icon phóng đại tinh tế.

#### Task 2.2: Tối ưu Dropdown Thể loại (Mega Menu)
- **File cần sửa:** `public/stylesheets/style.css`
- Làm nền mega-menu tối mờ sang trọng (`#1F2024` bo góc 12px, viền mảnh `#2F3238`), các thẻ thể loại hiển thị theo dạng chip tinh tế, hiệu ứng hover chuyển sang màu cam MangaDex nhẹ nhàng.

---

### 🟢 GIAI ĐOẠN 3: TÁI THIẾT KẾ LƯỚI TRUYỆN (MANGA CARDS GRID) & HERO BANNER
*Mục tiêu: Đưa bố cục hiển thị truyện về chuẩn Manga quốc tế.*

#### Task 3.1: Thẻ Truyện Tranh Chuẩn Tỷ Lệ 2:3
- **File cần sửa:** `public/stylesheets/style.css` & hàm render `renderStories()` trong `public/javascripts/main.js`
- **Yêu cầu kỹ thuật:**
  - Tỷ lệ ảnh bìa chuẩn: `aspect-ratio: 2 / 3` với `object-fit: cover`.
  - Tag hiển thị góc ảnh bìa:
    - Góc trên trái: Badge tình trạng (Đang ra / Hoàn thành).
    - Góc dưới: Lớp gradient đen mờ hiển thị số chương mới nhất (VD: `Ch. 120`).
  - Tiêu đề truyện hiển thị tối đa 2 dòng (`-webkit-line-clamp: 2`), font chữ rõ nét.
  - Hiệu ứng hover card: Phóng nhẹ ảnh bìa (`transform: scale(1.03)`) kèm bóng đổ màu cam mờ `box-shadow: 0 10px 25px -5px rgba(255, 103, 64, 0.25)`.

#### Task 3.2: Banner Tiêu Điểm Hero
- **File cần sửa:** `public/stylesheets/style.css` & `public/index.html`
- Banner chuyển sang nền tối kết hợp lớp phủ gradient cam - tím mờ huyền ảo, nút bấm kêu gọi hành động CTA "Đọc Ngay" sử dụng nút cam gradient MangaDex nổi bật.

---

### 🟢 GIAI ĐOẠN 4: TINH CHỈNH TRÌNH ĐỌC (MANGADEX READER EXPERIENCE)
*Mục tiêu: Nâng cao trải nghiệm đọc truyện tranh và truyện chữ.*

#### Task 4.1: Thanh Điều Khiển Đọc Thông Minh (Reader HUD)
- **File cần sửa:** `public/stylesheets/style.css` & `public/javascripts/main.js`
- **Yêu cầu kỹ thuật:**
  - Thanh công cụ phía trên (`reader-toolbar`) có độ trong suốt kính mờ (`background: rgba(25, 26, 28, 0.92)`).
  - Nút chuyển chương trước/sau thiết kế công thái học (Floating Bottom Controls).
  - Hiển thị badge: `📑 MangaDex Reader`.

#### Task 4.2: Tối ưu Trình Cuộn Truyện Tranh (Comic Webtoon Stream)
- Khử hoàn toàn khoảng trắng dư thừa giữa các trang ảnh truyện tranh để cuộn liền mạch như đọc webtoon trên MangaDex thật.
- Thanh đo tiến trình cuộn trang (`readerProgressBar`) chuyển sang dải gradient cam MangaDex: `linear-gradient(90deg, #FF6740, #FFA270)`.

---

## 3. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

- [ ] Toàn bộ hệ thống không còn bất kỳ chữ "Mê Đọc Truyện" hay "MêTruyện" nào.
- [ ] Tên website, logo, thẻ title, meta tag, watermark ảnh đều hiển thị **MangaDex**.
- [ ] Giao diện mang tông màu tối sang trọng kết hợp màu cam MangaDex `#FF6740`.
- [ ] Thẻ truyện hiển thị chuẩn tỉ lệ 2:3 với tag chương mới sắc nét.
- [ ] Trình đọc hoạt động mượt mà, Dark Theme dịu mắt, cuộn trang không bị giật lag.
- [ ] Kiểm tra responsive trên cả màn hình máy tính và thiết bị di động hiển thị hoàn hảo.
