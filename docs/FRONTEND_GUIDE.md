# Frontend Guide

## Chạy React

```bash
cd client
npm install
npm run dev
```

Mở:

```text
http://localhost:5173
```

Nếu chạy trên Windows trong đường dẫn có ký tự `#`, ví dụ `Desktop/c#/viettouraudio`, hãy dùng `run-windows.bat` ở root. Script này tạo junction tạm trong `%TEMP%` để Vite dev server resolve `/src/main.jsx` ổn định.

## Logo

Frontend dùng:

- `client/src/assets/logo/logo.png`: favicon, app icon, navbar icon, loading screen.
- `client/src/assets/logo/logo-text.png`: navbar, landing page, footer.

Nếu thay logo thật, giữ nguyên tên file để import không bị lỗi.

## API base URL

Tạo `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_DEFAULT_LANGUAGE=vi
```

Config nằm ở:

```text
client/src/config/appConfig.js
```

## Build frontend

```bash
cd client
npm run build
```

Output nằm trong:

```text
client/dist/
```

## Cấu trúc UI

- `src/layouts/AppLayout.jsx`: navbar, footer và layout chung.
- `src/pages/Home`: landing page.
- `src/pages/Map`: bản đồ và POI gần vị trí.
- `src/pages/Login`, `src/pages/Register`: auth UI.
- `src/pages/StallDashboard`: dashboard chủ sạp.
- `src/pages/AdminDashboard`: dashboard admin.
- `src/pages/Premium`: gói premium.
- `src/pages/Payment`: thanh toán QR.

## Responsive

- Mobile-first.
- Navbar tự wrap trên tablet/mobile.
- Button đủ lớn cho thao tác cảm ứng.
- Không hard-code API URL trong component.
- Không dùng ảnh/logo bằng link sai path, luôn import từ `src/assets`.
