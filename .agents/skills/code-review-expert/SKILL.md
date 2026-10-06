---
name: code-review-expert
description: "Chuyên gia đánh giá code (Code Review), rà soát bảo mật SQL Injection, XSS, kiểm tra cấu trúc MVC trong Express & MySQL và tối ưu hiệu năng."
---

# Code Review Expert cho Ứng Dụng Node.js + Express + MySQL

## Danh mục kiểm tra chính (Review Checklist)

### 1. Bảo mật Database & SQL Injection (Bắt buộc)
- Tuyệt đối **KHÔNG** ghép chuỗi câu truy vấn thô: `SELECT * FROM users WHERE username = '` + name + `'`
- Luôn sử dụng Prepared Statements / Parameterized Queries:
  ```javascript
  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, hashPassword], callback);
  ```
- Không lưu mật khẩu dạng plain text. Phải sử dụng `bcrypt` hoặc `argon2` với salt rounds >= 10.

### 2. Bảo mật Web Application
- Chống XSS: Thoát (escape) dữ liệu đầu vào người dùng trước khi hiển thị ra View.
- Session & Cookie: Đặt cờ `httpOnly: true`, `secure: true` (trên production), `sameSite: 'lax'`.
- Phân quyền (RBAC): Middleware kiểm tra token/session và role (Admin vs User) trước khi cho phép vào các trang quản trị `/admin/*`.

### 3. Cấu trúc mã nguồn MVC & Clean Code
- **Routes (`routes/`):** Chỉ định tuyến đường dẫn HTTP tới controller tương ứng, không viết logic CSDL ở route.
- **Controllers (`controllers/`):** Nhận request, validate dữ liệu đầu vào, gọi models và render view hoặc trả về JSON.
- **Models (`models/`):** Tập trung toàn bộ câu lệnh truy vấn CSDL MySQL.
- **Common / Utils (`common/`):** Hàm kết nối CSDL (`db.js`), mã hóa, format ngày giờ.

### 4. Xử lý lỗi & Tối ưu truy vấn
- Luôn xử lý callback error hoặc dùng async/await với try/catch.
- Đóng kết nối hoặc sử dụng Connection Pool (`mysql.createPool`) thay vì tạo một kết nối đơn lẻ (`mysql.createConnection`) để tránh bị crash server khi có nhiều người truy cập đồng thời.
- Thêm Index cho các cột thường xuyên tìm kiếm hoặc sắp xếp (`slug`, `view_count`, `category_id`, `created_at`).
