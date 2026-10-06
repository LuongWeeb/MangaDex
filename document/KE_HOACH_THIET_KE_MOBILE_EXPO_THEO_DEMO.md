# KẾ HOẠCH THIẾT KẾ APP MOBILE EXPO (DỰA THEO UI/UX VIDEO DEMO)
**Dự án:** MangaDex Mobile App (React Native Expo)  
**Tham chiếu thiết kế:** `document/demo.mp4` (Chắt lọc 100% tinh hoa bố cục & trải nghiệm người dùng di động hiện đại).  
**Dành cho:** Codex / React Native Developer  

---

## 1. THÔNG SỐ DESIGN SYSTEM (THEME TOKENS)

```javascript
export const COLORS = {
  background: '#121214',        // Nền tối sâu sang trọng
  surface: '#1A1A1E',           // Nền card/sheet
  surfaceLight: '#24242A',      // Nền nút bấm, pill
  border: '#2E2E36',            // Viền mờ
  borderActive: '#FF6740',      // Viền cam MangaDex (hoặc #FF3377 Neon)
  primary: '#FF6740',           // Màu chủ đạo nổi bật
  primaryGradient: ['#FF6740', '#FF8A65'],
  textPrimary: '#FFFFFF',
  textSecondary: '#9E9EA8',
  textMuted: '#686874',
  tagBg: 'rgba(255, 103, 64, 0.15)',
  tagText: '#FF7C5C',
};
```

---

## 2. KIẾN TRÚC MÀN HÌNH & GIAO DIỆN (UI/UX SPECIFICATION)

---

### 🟢 MÀN HÌNH 1: THANH ĐIỀU HƯỚNG ĐÁY VỚI NÚT NỔI Ở CHÍNH GIỮA (FLOATING TAB BAR)
*Tham chiếu: Frame đáy màn hình trong video demo.*

1. **Cấu trúc Tab Bar (5 Tabs):**
   - Tab 1: 🏠 **Trang chủ** (`HomeScreen`)
   - Tab 2: 🧭 **Khám phá** (`ExploreScreen` - Danh mục thể loại)
   - Tab 3: 📖 **Thư viện** (`LibraryScreen` - **Nút tròn to nổi bật ở chính giữa**, viền phát sáng, icon cuốn sách mở nổi cao hơn mặt bằng tab bar)
   - Tab 4: 🏆 **Xếp hạng** (`RankingScreen`)
   - Tab 5: 👤 **Tài khoản** (`ProfileScreen`)
2. **Hiệu ứng:**
   - Bo tròn góc phía trên (`borderTopLeftRadius: 20`, `borderTopRightRadius: 20`).
   - Nền mờ kính: `backgroundColor: 'rgba(18, 18, 20, 0.95)'`.

---

### 🟢 MÀN HÌNH 2: TRANG CHỦ (`HomeScreen.js`)
*Tham chiếu: Frame 1 trong video demo.*

1. **Header trên cùng:**
   - Góc trái: Logo Mascot nhỏ xinh hoặc chữ MangaDex.
   - Góc phải: Bộ đôi icon Kính lúp (Search) + Bánh răng (Cài đặt) + **Avatar tròn** có viền phát sáng.
2. **Phần "Dành Cho Bạn" (Quick Stories Circles):**
   - Hàng avatar tròn vuốt ngang hiển thị các bộ truyện đề xuất nhanh có vòng viền lửa cam.
3. **Lưới Truyện 2 Cột (2-Columns Story Grid):**
   - Thẻ truyện bo tròn góc `14px`, tỷ lệ ảnh bìa 2:3.
   - **Lớp thông số trên ảnh bìa:**
     - Góc dưới bên trái: `🤍 Lượt thích`
     - Góc dưới bên phải: `👁 Lượt xem`
     - Dải **Tag Pills** nổi góc dưới: `[Thể loại 1] [Thể loại 2] [+3]` bo góc tròn mềm.
   - Tiêu đề truyện 2 dòng rõ nét, bên dưới là tên tác giả/dịch giả.

---

### 🟢 MÀN HÌNH 3: KHÁM PHÁ & THỂ LOẠI (`ExploreScreen.js`)
*Tham chiếu: Frame 4 trong video demo.*

- Phân nhóm thể loại theo ký tự chữ cái: `# #`, `# A`, `# B`...
- Mỗi thể loại là một Card dài nằm ngang bo tròn `12px` với viền mảnh:
  - Cột số thứ tự: `01`, `02`...
  - Tên thể loại: `Action`, `Manhwa`, `Romance`...
  - Số lượng truyện: `82 truyện`, `159 truyện`...
  - Bấm vào mở danh sách truyện thuộc thể loại đó.

---

### 🟢 MÀN HÌNH 4: MENU BOTTOM SHEET TRƯỢT TỪ DƯỚI LÊN (`AccountBottomSheet.js`)
*Tham chiếu: Frame 5 & 6 trong video demo.*

Khi người dùng bấm vào Avatar hoặc Bánh răng cài đặt ở Header:
- Trượt một tấm **Bottom Sheet** từ đáy màn hình lên mượt mà (dùng `react-native-reanimated` hoặc Modal trượt lên):
  - Thanh gạt xám ở đỉnh (Drag handle bar).
  - Khối Avatar tròn lớn + Tên hiển thị người dùng (VD: `LuongWibi`, badge `User`) + Nút đăng xuất.
  - Lưới các nút chức năng bo góc bo cong hiện đại:
    - `🔔 Thông báo`
    - `⚙️ Cài đặt đọc truyện` (Tùy chỉnh cỡ chữ, cuộn dọc/lật trang)
    - `🛡️ Bảo mật & Đổi mật khẩu`
    - `📖 Hướng dẫn sử dụng`

---

### 🟢 MÀN HÌNH 5: CHI TIẾT TRUYỆN & TRÌNH ĐỌC MANGA (`ReaderScreen.js`)

1. **Chi tiết truyện:** Bìa truyện lớn, tóm tắt, bảng danh sách chương hiển thị rõ ràng.
2. **Trình đọc Manga:**
   - Cuộn dọc liền mạch 100% chiều rộng màn hình, không viền đen.
   - Chạm 1 chạm vào màn hình để ẩn/hiện thanh Header và Footer nổi.

---

## 3. KẾT NỐI API VỚI BACKEND

File `mobile/src/services/api.js`:
```javascript
import axios from 'axios';

// Dùng IP Wi-Fi của máy tính host
export const BASE_URL = 'http://192.168.1.17:3000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export default api;
```

---

## 4. HƯỚNG DẪN TEST BẰNG EXPO GO CHO BẠN

Sau khi Codex khởi tạo xong thư mục `mobile/`:
1. Mở terminal gõ:
   ```bash
   cd mobile
   npx expo start
   ```
2. Mở app **Expo Go** trên điện thoại:
   - Quét mã QR trên màn hình.
   - Trải nghiệm ngay giao diện App di động chuẩn 100% theo video demo!
