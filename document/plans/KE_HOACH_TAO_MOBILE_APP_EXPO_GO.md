# KẾ HOẠCH XÂY DỰNG GIAO DIỆN APP MOBILE VỚI EXPO GO
**Dự án:** MangaDex Mobile App (React Native Expo)  
**Mục tiêu:** Xây dựng ứng dụng di động đa nền tảng trong thư mục `mobile/`, tập trung 100% vào giao diện UI/UX mượt mà, kết nối dữ liệu từ Backend Express hiện tại và có thể test trực tiếp bằng ứng dụng **Expo Go** trên điện thoại.

---

## 1. THÔNG SỐ & MÔI TRƯỜNG KỸ THUẬT

- **Thư mục ứng dụng:** `d:\Ứng dụng đọc truyện online\mobile`
- **Công nghệ:** React Native + Expo SDK mới nhất.
- **Màu sắc chủ đạo (MangaDex Dark Theme):**
  - Nền chính: `#131416`
  - Nền card/surface: `#1E2024`
  - Màu nhấn (Accent Orange): `#FF6740`
  - Màu chữ: `#FFFFFF` và `#9CA3AF`
- **Địa chỉ Backend API:** `http://192.168.1.17:3000/api/v1`

---

## 2. LỘ TRÌNH 4 BƯỚC THỰC HIỆN CHO CODEX

---

### 🟢 BƯỚC 1: KHỞI TẠO DỰ ÁN EXPO TRONG THƯ MỤC `mobile/`

Codex mở terminal tại thư mục gốc và chạy:
```bash
# 1. Tạo project Expo
npx -y create-expo-app mobile --template blank

# 2. Cài đặt các thư viện giao diện và điều hướng
cd mobile
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context
npx expo install expo-image
npm install axios
```

---

### 🟢 BƯỚC 2: CẤU TRÚC THƯ MỤC VÀ DỊCH VỤ GỌI API

Tạo cấu trúc thư mục trong `mobile/`:
```text
mobile/
├── App.js                          # Cấu hình Navigation (Bottom Tabs & Stacks)
├── src/
│   ├── constants/
│   │   └── theme.js                # Màu sắc, font chữ chuẩn MangaDex
│   ├── services/
│   │   └── api.js                  # Axios instance gọi tới http://192.168.1.17:3000/api/v1
│   ├── components/
│   │   ├── HeaderBar.js            # Header mobile có logo và avatar
│   │   └── StoryCard.js            # Thẻ truyện 2:3 có badge số chương
│   └── screens/
│       ├── HomeScreen.js           # Trang chủ (Banner vuốt ngang, Lưới truyện)
│       ├── SearchScreen.js         # Tìm kiếm & Lọc thể loại
│       ├── StoryDetailScreen.js    # Chi tiết bộ truyện & Danh sách chương
│       ├── ReaderScreen.js         # Màn hình đọc truyện tranh (Cuộn dọc Webtoon)
│       └── LibraryScreen.js        # Tủ truyện theo dõi & Lịch sử đọc
```

**Nội dung `src/services/api.js`:**
```javascript
import axios from 'axios';

// Dùng IP Wi-Fi máy tính để điện thoại gọi được
export const BASE_URL = 'http://192.168.1.17:3000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export default api;
```

---

### 🟢 BƯỚC 3: XÂY DỰNG 5 MÀN HÌNH GIAO DIỆN CHÍNH

#### 1. `HomeScreen.js` (Trang Chủ)
- **Header:** Logo MangaDex `📑 MangaDex` + Nút kính lúp + Avatar tròn.
- **Banner Carousel:** Danh sách truyện nổi bật vuốt ngang (Horizontal ScrollView), bo góc 14px, có nút "Đọc Ngay".
- **Lưới Truyện Mới Cập Nhật:** Bố cục 2 cột hoặc 3 cột (`FlatList` với `numColumns={2}` hoặc `3`), hiển thị ảnh bìa sắc nét qua `expo-image`, tiêu đề 2 dòng, badge màu cam `Ch. 120`.
- **Top BXH Lượt Đọc:** Danh sách top 5 truyện xem nhiều nhất.

#### 2. `SearchScreen.js` (Tìm Kiếm)
- Ô tìm kiếm từ khóa với icon kính lúp.
- Thanh lọc thể loại vuốt ngang dạng Chip (Action, Manhwa, Manga, Romance, Tiên Hiệp...).
- Lưới hiển thị kết quả truyện tìm được.

#### 3. `StoryDetailScreen.js` (Chi Tiết Truyện)
- Backdrop ảnh nền mờ mờ trên cùng, ảnh bìa truyện nổi bật bên trái.
- Tiêu đề truyện lớn, tác giả, trạng thái.
- Hàng nút bấm: **"📖 Đọc từ đầu"**, **"⭐ Theo dõi"**.
- Tóm tắt giới thiệu truyện.
- Danh sách tất cả các chương: Mỗi dòng hiển thị `Chương X` và ngày đăng, bấm vào là chuyển sang `ReaderScreen`.

#### 4. `ReaderScreen.js` (Trình Đọc Truyện)
- **Truyện tranh (Manga/Webtoon):** Dùng `FlatList` cuộn dọc danh sách ảnh (`chapter_images`), khử toàn bộ viền đen, ảnh hiển thị 100% chiều rộng màn hình.
- **Cơ chế ẩn/hiện điều hướng (Tap to toggle):** Chạm 1 chạm vào màn hình để ẩn/hiện thanh Header (nút Quay lại, tên chương) và thanh Footer (nút Chương trước / Chương sau).

#### 5. `LibraryScreen.js` (Tủ Truyện)
- 2 tab chuyển đổi: **"⭐ Truyện Theo Dõi"** và **"🕒 Lịch Sử Đọc"**.
- Danh sách các bộ truyện bạn đang theo dõi hoặc vừa đọc dở.

---

### 🟢 BƯỚC 4: CẤU HÌNH ĐIỀU HƯỚNG TẠI `App.js`

- Tạo **Bottom Tab Navigator** với 4 tab ở đáy màn hình:
  - 🏠 **Trang Chủ** (`HomeScreen`)
  - 🔍 **Tìm Kiếm** (`SearchScreen`)
  - 🔖 **Tủ Truyện** (`LibraryScreen`)
  - 👤 **Tài Khoản** (`ProfileScreen`)
- Tạo **Native Stack Navigator** lồng bên ngoài để khi bấm vào truyện hoặc bấm đọc chương sẽ mở tràn toàn màn hình (`StoryDetail` và `Reader`).

---

## 3. CÁCH CHẠY VÀ TEST TRÊN ĐIỆN THOẠI BẰNG EXPO GO

Sau khi Codex viết xong, bạn chỉ cần mở terminal chạy:

```bash
cd mobile
npx expo start
```
*(Nếu điện thoại khác mạng Wi-Fi hoặc dùng 4G, chạy lệnh: `npx expo start --tunnel`)*

- Mở app **Expo Go** trên điện thoại:
  - **Android:** Bấm "Scan QR Code" quét mã QR trên terminal.
  - **iPhone:** Mở ứng dụng Camera mặc định quét mã QR để mở bằng Expo Go.
- App sẽ tải về và chạy mượt mà ngay trên điện thoại!
