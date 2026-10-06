---
name: brainstorming
description: "Dùng để phân tích yêu cầu, brainstorm tính năng, thiết kế kiến trúc hệ thống và sơ đồ cơ sở dữ liệu (ERD) trước khi lập trình."
---

# Brainstorming & Phân Tích Đề Tài Đồ Án

## Mục tiêu
Định hình rõ ràng luồng nghiệp vụ, kiến trúc hệ thống và thiết kế CSDL trước khi viết code cho đồ án "Ứng dụng đọc truyện online".

## Quy trình làm việc
1. **Phân tích yêu cầu & Persona:**
   - Người đọc (Guest / Member): Tìm kiếm truyện, lọc theo thể loại, đọc truyện (chương, điều hướng chương trước/sau), lưu lịch sử đọc, đánh dấu yêu thích, bình luận, đánh giá sao.
   - Người sáng tác / Dịch giả / Uploader: Đăng truyện, thêm chương mới, chỉnh sửa thông tin chương.
   - Quản trị viên (Admin): Duyệt truyện, quản lý tài khoản, báo cáo vi phạm, thống kê lượt đọc, quản lý thể loại/tác giả.

2. **Thiết kế Cơ sở dữ liệu (MySQL / Relational Database):**
   - Bảng `users` (id, username, email, password_hash, role, created_at)
   - Bảng `categories` / `genres` (id, name, slug, description)
   - Bảng `stories` (id, title, slug, author, description, cover_image, status, view_count, created_at, updated_at)
   - Bảng `story_genres` (story_id, genre_id)
   - Bảng `chapters` (id, story_id, chapter_number, title, content, view_count, created_at)
   - Bảng `bookmarks` / `reading_history` (user_id, story_id, last_chapter_id, updated_at)
   - Bảng `comments` / `ratings` (id, user_id, story_id, content, star, created_at)

3. **Luồng phê duyệt & Thống nhất phương án:**
   - Đặt câu hỏi làm rõ từng tính năng cụ thể.
   - Đưa ra 2-3 phương án triển khai với ưu/nhược điểm.
   - Chờ người dùng xác nhận trước khi tiến hành viết code.
