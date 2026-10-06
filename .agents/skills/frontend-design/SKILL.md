---
name: frontend-design
description: "Thiết kế giao diện web đọc truyện online hiện đại, chuẩn thẩm mỹ cao, Dark/Light mode, typography dịu mắt, mượt mà và responsive."
---

# Frontend Design System cho Ứng Dụng Đọc Truyện Online

## Nguyên tắc thiết kế
1. **Trải nghiệm đọc (Reader Experience):**
   - Chế độ màu nền: Dark Mode (nền tối `#121212`, chữ xám nhạt `#E0E0E0`), Sepia (vàng dịu `#FBF0D9`, chữ `#5F4B32`), Light Mode (nền trắng `#FFFFFF`, chữ `#212121`).
   - Thanh công cụ đọc (Reading Toolbar): Tùy chỉnh kích thước chữ (font-size: 16px - 28px), giãn dòng (line-height: 1.6 - 2.0), đổi font chữ (Sans-serif, Serif như Merriweather, Georgia, Roboto).
   - Thanh cuộn tiến độ đọc (Reading Progress Bar) dính ở đầu trang.
   - Nút chuyển chương trước/sau (`Pre / Next Chapter`) cố định hoặc dễ bấm trên mobile.

2. **Giao diện trang chủ & Khám phá:**
   - Banner truyện nổi bật (Featured Slider) với hiệu ứng chuyển cảnh mượt.
   - Thẻ truyện (Story Card): Bìa truyện tỉ lệ 3:4, tiêu đề, số chương mới nhất, nhãn trạng thái (Full / Đang ra), thể loại nổi bật.
   - Bảng xếp hạng (Top ngày / tuần / tháng) hiển thị rõ ràng, trực quan.

3. **Responsive & Mobile First:**
   - Tối ưu chạm (touch targets tối thiểu 44x44px).
   - Menu trượt (Drawer / Bottom Sheet) trên thiết bị di động.
