---
name: seo-audit
description: "Tối ưu hóa công cụ tìm kiếm (SEO) cho web đọc truyện: URL Slug thân thiện, thẻ Open Graph, meta tags động, sitemap và cấu trúc ngữ nghĩa HTML5."
---

# SEO Audit & Best Practices cho Web Truyện Online

## Quy tắc tối ưu SEO

### 1. Cấu trúc URL thân thiện (Friendly URLs / Slugs)
- Chuẩn hóa URL không dấu, ngăn cách bằng dấu gạch ngang `-`:
  - Trang chi tiết truyện: `/truyen/tien-nghich` (thay vì `/story?id=12`)
  - Trang đọc chương: `/truyen/tien-nghich/chuong-1` (thay vì `/chapter?id=451`)
  - Danh mục: `/the-loai/tien-hiep`

### 2. Thẻ Meta Động (Dynamic Meta Tags)
Trong từng trang cần truyền dữ liệu vào header template:
```html
<title><%= story.title %> - Đọc Truyện Online Hay Nhất</title>
<meta name="description" content="Đọc truyện <%= story.title %> tác giả <%= story.author %>. <%= story.short_description %>">
<!-- Open Graph cho chia sẻ Facebook / Zalo -->
<meta property="og:title" content="<%= story.title %>">
<meta property="og:image" content="<%= story.cover_image %>">
<meta property="og:type" content="book">
```

### 3. Cấu trúc HTML & Semantic
- Mỗi trang chỉ duy nhất một thẻ `<h1>` (tên truyện hoặc tên chương).
- Sử dụng thẻ ngữ nghĩa: `<header>`, `<main>`, `<article>`, `<nav>`, `<aside>`, `<footer>`.
- Hình ảnh bìa truyện luôn có thuộc tính `alt="<%= story.title %>"` và `loading="lazy"`.
