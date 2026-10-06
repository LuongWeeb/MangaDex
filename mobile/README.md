# MangaDex Mobile

Ứng dụng React Native Expo dành cho Expo Go. URL API lấy từ `EXPO_PUBLIC_API_ORIGIN` trong file `.env`; máy hiện tại dùng `http://192.168.1.4:3000`.

## Chạy trên điện thoại

```bash
cd mobile
npx expo start
```

Quét QR bằng Expo Go khi điện thoại và máy chạy backend dùng chung Wi-Fi. Nếu PowerShell báo chính sách chặn `npx.ps1`, dùng lệnh tương đương:

```powershell
npx.cmd expo start
```

Ứng dụng vẫn có dữ liệu minh hoạ nếu API tạm thời không truy cập được; khi API sẵn sàng, truyện và thể loại sẽ được nạp tự động.
