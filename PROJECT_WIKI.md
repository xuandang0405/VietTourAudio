# TÀI LIỆU TOÀN TẬP HỆ THỐNG - VIETTOURAUDIO (PROJECT WIKI)

## 1. FULL PROJECT STRUCTURE & FILE MAP

### 📂 Client (Frontend React/Vite)
- `client/src/App.jsx`: Root component khởi tạo layout, routes và các global state provider.
- `client/src/main.jsx`: Entry point gắn (mount) React app vào DOM của trình duyệt.
- `client/src/utils/geo.js`: Chứa hàm `getDistanceMeters` sử dụng công thức Haversine để tính khoảng cách tọa độ GPS.
- `client/src/services/realtimeClient.js`: Khởi tạo và quản lý kết nối WebSockets tới SignalR server (`HubConnectionBuilder`).
- `client/src/features/geofence-audio/hooks/useGeofenceAudio.js`: Custom hook giám sát vị trí GPS và tự động phát audio khi khách vào vùng bán kính kích hoạt.
- `client/src/features/geofence-audio/hooks/useGeolocation.js`: Xin quyền truy cập vị trí và theo dõi tọa độ thiết bị liên tục qua `navigator.geolocation`.
- `client/src/features/poi/hooks/useQrScanner.js`: Bật luồng camera `getUserMedia` và dùng `BarcodeDetector` API để đọc mã QR.
- `client/src/features/payment/paymentApi.js`: Chứa các hàm gọi lên backend (Axios) để khởi tạo và xử lý quy trình thanh toán Checkout.
- `client/src/config/appConfig.js`: Chứa các biến cấu hình toàn cục (như API Base URL) được đọc từ `import.meta.env`.

### 📂 Server (Backend C# ASP.NET Core)
- `server/VietTourAudio.Api/Program.cs`: Entry point khởi tạo server, cấu hình Dependency Injection, Middlewares, và SignalR Hub.
- `server/VietTourAudio.Api/Domain/DomainModels.cs`: Định nghĩa schema cơ sở dữ liệu (các class đại diện cho các bảng).
- `server/VietTourAudio.Api/Data/AppDbContext.cs`: Mapping giữa Domain Models và các bảng thực tế trong MySQL thông qua Entity Framework Core.
- `server/VietTourAudio.Api/Controllers/GuestController.cs`: Cung cấp API công khai cho khách lấy danh sách POI, thông tin Zone và chỉ đường.
- `server/VietTourAudio.Api/Controllers/VendorController.cs`: Chứa toàn bộ các nghiệp vụ cho Vendor (quản lý quầy hàng, vị trí GPS, đăng sản phẩm).
- `server/VietTourAudio.Api/Controllers/CheckoutPaymentController.cs`: Xử lý logic khởi tạo giao dịch mua Premium, xác thực thẻ Visa ảo và nộp ảnh biên lai.
- `server/VietTourAudio.Api/Controllers/PaymentController.cs`: Cổng Webhook/IPN tiếp nhận trạng thái giao dịch bất đồng bộ từ cổng thanh toán.
- `server/VietTourAudio.Api/Controllers/QrCodeController.cs`: Sinh mã QR hình ảnh động cho từng điểm POI hoặc Stall.
- `server/VietTourAudio.Api/Services/PaymentEntitlementService.cs`: Service cốt lõi xử lý cộng ngày Premium, nâng cấp gói dịch vụ và cập nhật số dư Wallet.
- `server/VietTourAudio.Api/Services/MonthlyBillingWorker.cs`: Background worker tự động quét và trừ phí duy trì hệ thống của Vendor hàng tháng.
- `server/VietTourAudio.Api/Hubs/NotificationHub.cs`: Trạm Websocket SignalR phân phối thông báo đẩy theo thời gian thực và quản lý Zone.
- `server/VietTourAudio.Api/Services/PresenceTracker.cs`: Dịch vụ lưu trữ trên RAM danh sách các Users đang online và vị trí.

---

## 2. CORE FEATURES DEEP-DIVE

### 📍 GPS & Geofencing (Tự động phát âm thanh)
- **Theo dõi vị trí**: File `useGeolocation.js` gọi hàm `navigator.geolocation.watchPosition` để liên tục lấy `latitude` và `longitude` mới nhất của thiết bị khách và đẩy dữ liệu vào `locationStore`.
- **Tính toán khoảng cách**: File `utils/geo.js` sử dụng thuật toán **Haversine** (hàm `getDistanceMeters`) để tính khoảng cách tính bằng mét (đường chim bay) giữa tọa độ của khách và tọa độ của từng POI.
- **Kích hoạt Audio**: Hook `useGeofenceAudio.js` sẽ lọc danh sách các điểm tham quan. Nếu `distanceMeters <= poi.activationRadius`, nó xác định người dùng đã bước vào vùng an toàn (Geofence) và sẽ gọi hàm `enqueuePoi` của `audioStore.js` để tự động bật phát file audio mà không cần khách phải thao tác tay.

### 🟢 Real-Time Presence (SignalR)
- **Frontend**: `realtimeClient.js` sử dụng thư viện `@microsoft/signalr` thiết lập kết nối WebSockets bảo mật đến cổng `VITE_SIGNALR_BASE_URL`. Khi khách vào 1 vùng, frontend gọi hàm `JoinZone`.
- **Backend**: Tại `NotificationHub.cs`, server đón kết nối này. Service `PresenceTracker.cs` sẽ lưu `ConnectionId` của khách vào trong bộ nhớ RAM, tăng biến đếm người online.
- **Cập nhật dữ liệu**: Hệ thống gọi `BroadcastUpdate` để gửi bảng thống kê lượng người dùng đang truy cập về trực tiếp cho màn hình Admin Dashboard của quản trị viên theo thời gian thực (không cần F5 trang).

### 📷 QR Code Generation & Scanning
- **Tạo mã QR**: `QrCodeController.cs` dưới backend dùng thư viện tạo ảnh mã QR chứa URL định danh ID của điểm tham quan.
- **Quét mã**: File `useQrScanner.js` gọi API trình duyệt `navigator.mediaDevices.getUserMedia` để xin quyền bật camera sau. Luồng video được chuyển qua `window.BarcodeDetector` để bóc tách chuỗi URL ẩn trong hình ảnh QR với tốc độ 400ms mỗi khung hình.
- **Xử lý**: Khi chuỗi URL được nhận diện, component UI sẽ bóc tách lấy tham số ID của điểm, cập nhật state để hiển thị nội dung thuyết minh và gọi hàm `visitorTrackingService.trackQrScan` bắn API lên server để ghi nhận dữ liệu Analytics (khách đã quét mã).

### 💳 Payment Gateway Flow (Thanh toán & Cấp quyền)
1. Khách hàng chọn gói cước và bấm "Buy" tại giao diện `CheckoutMatrix.jsx`.
2. File `paymentApi.js` gửi request `POST /initialize` tới `CheckoutPaymentController.cs` để tạo record `PaymentTransaction` với trạng thái `PENDING`.
3. Nếu trả qua thẻ Visa giả lập, `paymentApi.js` gọi `processVisa`. Nếu chuyển khoản, khách tải ảnh lên qua API `uploadProof`.
4. Nếu kết nối với cổng thanh toán thực tế (MoMo/VnPay), cổng thanh toán sẽ tự động gọi ngược về webhook tại `PaymentController.cs`.
5. Backend xác thực chữ ký an toàn, cập nhật `PaymentTransaction` thành `SUCCESS`.
6. Logic được chuyển giao cho `PaymentEntitlementService.cs`. Class này truy cập Database cập nhật cột `IsPremiumActive = true` và gia hạn `PremiumExpiryDate`.
7. Cuối cùng, `NotificationHub.cs` đẩy thẳng một sự kiện WebSocket (`PremiumActivated`) xuống thiết bị khách, UI frontend tự động mở khóa tính năng Premium ngay lập tức.

---

## 3. DATABASE SCHEMA & PURPOSE

Các bảng chính (Tables) trong MySQL, ánh xạ từ `DomainModels.cs`:

- **`Users`**: Bảng lõi quản lý thông tin tài khoản (Admin, Vendor, User).
  * *Cột quan trọng*: `Role` (Quyền), `PasswordHash`, `IsPremiumActive` (Cờ hiệu xem khách đang có Premium không), `PremiumExpiryDate`.
- **`FestivalZones`**: Bảng danh sách các khu/tuyến du lịch tổng.
  * *Cột quan trọng*: `ZoneCode`, `Status` (DRAFT/ACTIVE).
- **`Pois` (Points of Interest)**: Chứa danh sách các điểm tham quan hoặc gian hàng bán lẻ.
  * *Cột quan trọng*: `TriggerRadius` (Bán kính GPS phát âm thanh), `ApprovalStatus` (Trạng thái kiểm duyệt nội dung), `Latitude`/`Longitude` và các cột đa ngôn ngữ (`PendingNameEn`, `PendingDescriptionJa`,...).
- **`PoiProducts`**: Thực đơn/sản phẩm thuộc về một điểm `Poi`.
- **`VendorProfiles`**: Bảng mở rộng hồ sơ dành riêng cho các tài khoản kinh doanh (Vendor).
  * *Cột quan trọng*: `IsPremium`, `SubscriptionExpiryDate` (Ngày hết hạn thuê mặt bằng phần mềm).
- **`Wallets` & `WalletTransactions`**: Cặp bảng quản lý Ví điện tử nội bộ cho Vendor. `Wallets` chứa `Balance` (số dư hiện tại), còn `WalletTransactions` lưu lịch sử nạp/trừ tiền minh bạch (Sổ cái/Ledger).
- **`PaymentTransactions`**: Bảng cực kỳ quan trọng lưu lịch sử khách nạp tiền/mua Premium.
  * *Cột quan trọng*: `PendingKey` (Mã tham chiếu giao dịch độc nhất), `ProofAttachmentUrl` (Đường dẫn ảnh chụp biên lai chuyển khoản ngân hàng), `Status` (PENDING/SUCCESS).
- **`SystemTickets`**: Hệ thống tiếp nhận phản hồi, báo lỗi từ người dùng về cho Admin.
- **`VisitEvents` & `AudioPlayEvents`**: Dữ liệu thu thập hành vi (Analytics). Mỗi khi khách bước vào một vùng (Visit) hoặc bấm phát âm thanh (AudioPlay), hệ thống tạo 1 dòng ở đây với `SessionId` của khách để vẽ biểu đồ thống kê cho Admin.

---

## 4. ENVIRONMENT & DEPLOYMENT CONFIGURATION

### 🛠 Biến môi trường
- **`.env` / `.env.production` (Frontend Vite)**: Chứa `VITE_API_BASE_URL` (Domain API backend) và `VITE_SIGNALR_BASE_URL` (Domain WebSocket). Các biến này chỉ đường cho mã Javascript trên trình duyệt khách biết phải bắn request về máy chủ nào.
- **`appsettings.json` (Backend C#)**: Lưu trữ các cấu hình nhạy cảm tuyệt mật không thể để lộ ở Frontend, bao gồm:
  - `ConnectionStrings`: Chứa Username/Password kết nối tới MySQL Database.
  - `Jwt:Key`: Khóa bí mật mã hóa JSON Web Token để đăng nhập.
  - `AllowedCorsOrigins`: Bộ lọc bảo mật CORS, chỉ các tên miền nằm trong danh sách này (ví dụ `https://cs.bkpvp.top`) mới được phép gọi API.

### 🌐 Triển khai bảo mật qua Cloudflare Tunnel
- Trái với kiểu "port forwarding" truyền thống dễ bị hack, dự án này triển khai thông qua đường hầm **Cloudflare Tunnel** (`cloudflared`).
- Client Frontend chạy trên cổng `5173` nội bộ. Backend C# chạy trên cổng `5000` nội bộ.
- Cloudflare Tunnel tạo kết nối ngược (reverse tunnel) an toàn mã hóa 100% từ internet dẫn thẳng vào máy chủ của bạn mà không cần mở cổng trên Modem WiFi.
- Các tên miền công cộng (`cs.bkpvp.top` và `be.bkpvp.top`) được Cloudflare cấp sẵn chứng chỉ SSL tự động (**HTTPS Ổ khóa xanh**). Điều này là bắt buộc, vì các hàm như `navigator.geolocation` (Lấy GPS) và `getUserMedia` (Quét QR Code) sẽ bị trình duyệt chặn hoàn toàn nếu chạy trên HTTP thông thường.
