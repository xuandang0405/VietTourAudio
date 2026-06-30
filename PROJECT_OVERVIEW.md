# TÀI LIỆU TỔNG QUAN DỰ ÁN VIETTOURAUDIO

Tài liệu này cung cấp cái nhìn toàn diện về cấu trúc, cách thức hoạt động và vị trí các file code chính chịu trách nhiệm cho từng tính năng của dự án VietTourAudio (bao gồm C# ASP.NET Core API ở Backend và React + Vite ở Frontend).

---

## 1. Giới thiệu Dự án
**VietTourAudio** là một nền tảng WebApp/PWA hỗ trợ thuyết minh du lịch tự động cho du khách. Dự án tích hợp các công nghệ định vị GPS, quét mã QR, bản đồ tương tác, thuyết minh âm thanh đa ngôn ngữ (TTS), cùng hệ thống thanh toán nâng cấp tài khoản Premium cho du khách và đăng ký thuê gian hàng cho người bán (Vendor).

### Công nghệ sử dụng:
*   **Frontend:** React (Vite), TailwindCSS, Leaflet Map (bản đồ), Axios (gọi API), Microsoft SignalR Client (giao tiếp thời gian thực), Zustand (quản lý trạng thái).
*   **Backend:** ASP.NET Core Web API (.NET 8), Entity Framework Core, Pomelo.EntityFrameworkCore.MySql.
*   **Cơ sở dữ liệu:** MySQL / MariaDB.

---

## 2. Bản đồ Cấu trúc Thư mục & Vai trò File Code

### A. FRONTEND (Thư mục `/client`)
Toàn bộ mã nguồn giao diện nằm trong thư mục [client/src](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src):

*   **[`client/src/App.jsx`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/App.jsx):** Điểm khởi đầu cấu hình định tuyến (React Router) cho cả 3 phân hệ: Khách (Visitor), Người bán (Vendor) và Quản trị (Admin). Đồng thời khởi tạo cổng kết nối SignalR Presence.
*   **[`client/src/main.jsx`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/main.jsx):** Khởi tạo ứng dụng React, nạp đa ngôn ngữ (i18n).
*   **Thư mục [`client/src/features`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/features):** Chứa các chức năng cốt lõi được chia theo mô-đun:
    *   `auth`: Quản lý đăng nhập, đăng ký cho Vendor và Admin.
    *   `geofence-audio`: Xử lý tính toán vùng địa lý (geofencing) và phát âm thanh tự động.
    *   `poi` (Points of Interest): Quản lý các điểm tham quan, bản đồ Leaflet.
    *   `payment`: Gọi các API thanh toán và quản lý trạng thái Premium.
    *   `vendor-wallet`: Quản lý ví tiền, doanh thu và thanh toán phí của Vendor.
*   **Thư mục [`client/src/visitor`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/visitor):** Chứa layout và giao diện dành riêng cho khách du lịch (Mobile Layout cho điện thoại, PC Layout cho máy tính).
*   **Thư mục [`client/src/admin`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/admin):** Chứa mã nguồn trang quản trị hệ thống của Admin.
*   **Thư mục [`client/src/services`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/services):** Chứa các dịch vụ dùng chung:
    *   [`apiClient.js`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/services/apiClient.js): Cấu hình Axios gọi API chung cho hệ thống, tự động chèn JWT Token.
    *   [`realtimeClient.js`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/services/realtimeClient.js): Kết nối SignalR Hub thời gian thực.

---

### B. BACKEND (Thư mục `/server/VietTourAudio.Api`)
*   **[`Program.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Program.cs):** File cấu hình khởi chạy chính của Server: thiết lập cổng kết nối `5000`, kích hoạt CORS, khai báo các Service Dependency Injection, đăng ký JWT Auth và SignalR Hubs.
*   **Thư mục `Controllers`:** Chứa các API endpoints:
    *   [`AuthController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AuthController.cs): API xác thực (Đăng nhập, đăng ký, refresh token).
    *   [`GuestController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/GuestController.cs): API công khai dành cho khách (Lấy danh sách điểm tham quan, tìm đường).
    *   [`CheckoutPaymentController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/CheckoutPaymentController.cs): API xử lý các giao dịch nâng cấp tài khoản, nạp tiền.
    *   [`Admin*Controller.cs`]: Các API quản trị dành cho Admin (Quản lý POI, duyệt gian hàng, duyệt bài viết thuyết minh TTS).
    *   [`Vendor*Controller.cs`]: Các API dành cho chủ gian hàng (Cập nhật tọa độ, quản lý sản phẩm).
*   **Thư mục `Services`:** Chứa logic nghiệp vụ xử lý chính (Ví dụ: `GeofenceService.cs`, `IdentityServices.cs`, `PaymentService.cs`).
*   **Thư mục `Hubs`:** Chứa [`NotificationHub.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Hubs/NotificationHub.cs) quản lý kết nối thời gian thực SignalR để đếm số người dùng trực tuyến và đẩy thông báo thanh toán tức thời.

---

## 3. Bản đồ Vị trí các Chức năng Quan trọng

### 🗺️ Chức năng Bản đồ và Tìm đường (Routing & Navigation)
Tính năng này giúp du khách tìm đường đi ngắn nhất từ vị trí hiện tại của mình (GPS) đến điểm tham quan (POI) mục tiêu.

*   **Frontend (Tính toán và Giao diện):**
    *   [`client/src/features/geofence-audio/hooks/useGeofenceAudio.js`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/features/geofence-audio/hooks/useGeofenceAudio.js): Hàm `startRouting(targetPoi)` (khoảng dòng 490) lấy vị trí GPS hiện tại và gọi API tìm đường của server, sau đó lưu tọa độ vẽ đường đi vào state `routingCoordinates`.
    *   [`client/src/features/poi/components/LeafletMap.jsx`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/features/poi/components/LeafletMap.jsx): Nhận mảng tọa độ `routingCoordinates` và sử dụng thẻ `<Polyline>` của React-Leaflet để vẽ đường chỉ đường màu xanh trực quan trên bản đồ.
*   **Backend (Xử lý thuật toán tìm đường):**
    *   [`server/VietTourAudio.Api/Controllers/GuestController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/GuestController.cs): API `GET /api/guest/routing` (hàm `GetRouting`, dòng 353). Server sẽ gọi qua các dịch vụ bản đồ nguồn mở (ORS - OpenRouteService hoặc OSRM) để tính toán lộ trình đường đi dựa trên tọa độ điểm đầu và điểm cuối rồi trả về danh sách tọa độ (kinh độ, vĩ độ) cho Frontend.

---

### 💳 Chức năng Thanh toán và Nâng cấp Premium (Checkout & Payment)
Cho phép khách du lịch thanh toán để nghe thuyết minh không giới hạn (Premium) hoặc Vendor thanh toán tiền thuê phần mềm hàng tháng. Hệ thống hỗ trợ 3 cổng thanh toán: MoMo (chuyển khoản quét QR), Chuyển khoản ngân hàng thủ công (upload bill), và Thẻ Visa/Mastercard (giả lập).

*   **Frontend (Giao diện và Tải biên lai):**
    *   [`client/src/visitor/components/CheckoutModal.jsx`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/visitor/components/CheckoutModal.jsx): Giao diện modal hiển thị các cổng thanh toán. Khi người dùng bấm xác nhận chuyển khoản:
        1.  Gọi API `/checkout/initialize` để tạo mã giao dịch tạm thời.
        2.  Hiện ảnh QR tương ứng cho khách quét.
        3.  Người dùng tải ảnh chụp màn hình bill lên, hệ thống gọi API `/checkout/upload-proof` để gửi biên lai.
*   **Backend (Xử lý giao dịch và Duyệt tự động):**
    *   [`server/VietTourAudio.Api/Controllers/CheckoutPaymentController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/CheckoutPaymentController.cs): Chứa các API endpoints để:
        *   `/initialize`: Tạo giao dịch mới lưu vào bảng `payment_transactions` ở trạng thái `PENDING`.
        *   `/upload-proof`: Lưu ảnh chụp hóa đơn vào server.
        *   `/visa-process`: Giả lập thanh toán thẻ tín dụng, nếu thông tin thẻ hợp lệ sẽ lập tức chuyển trạng thái thành `APPROVED` và kích hoạt Premium luôn.
    *   [`server/VietTourAudio.Api/Services/PaymentService.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Services/PaymentService.cs): Chứa logic nghiệp vụ cộng ngày Premium cho tài khoản người dùng hoặc Vendor khi giao dịch được chấp nhận.
*   **Duyệt giao dịch chuyển khoản thủ công (Admin duyệt):**
    *   Admin duyệt thủ công các hóa đơn chuyển khoản thông qua API trong file [`AdminPaymentController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminPaymentController.cs). Khi Admin bấm duyệt (`Approve`), SignalR sẽ bắn thông tin về client để mở khóa tài khoản ngay lập tức.

---

### 🔊 Chức năng Thuyết minh tự động theo GPS (Geofencing Audio)
Giúp tự động phát file âm thanh (Audio) thuyết minh khi du khách di chuyển vào vùng bán kính bảo vệ (Geofence) của điểm tham quan mà không cần bấm nút phát thủ công.

*   **Frontend (Tính khoảng cách & Phát):**
    *   [`client/src/features/geofence-audio/hooks/useGeofenceAudio.js`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/features/geofence-audio/hooks/useGeofenceAudio.js): Lấy vị trí GPS thực tế liên tục từ thiết bị. Tính toán khoảng cách (theo công thức Haversine) giữa vị trí hiện tại của người dùng và các điểm tham quan gần đó. Khi khoảng cách nhỏ hơn bán kính kích hoạt (`triggerRadius`), nó sẽ tự động kích hoạt trình phát âm thanh thuyết minh tương ứng.
*   **Backend (Xử lý vùng địa lý):**
    *   [`server/VietTourAudio.Api/Services/GeofenceService.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Services/GeofenceService.cs): Cung cấp các tính năng hỗ trợ tính toán tọa độ địa lý, kiểm tra xem một điểm tọa độ có nằm trong đa giác (Polygon) hoặc hình tròn (Circle) của vùng du lịch hay không.

---

### ⚡ Chức năng Kết nối Thời gian thực (SignalR Real-time Presence)
Được dùng để đếm số lượng khách tham quan trực tuyến tại mỗi khu vực theo thời gian thực và cập nhật ngay lập tức giao diện khi có thông báo mới hoặc thanh toán thành công.

*   **Frontend:**
    *   [`client/src/services/realtimeClient.js`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/client/src/services/realtimeClient.js): Quản lý vòng đời kết nối SignalR, cung cấp các hàm `subscribeRealtime` để lắng nghe các sự kiện gửi từ server.
*   **Backend:**
    *   [`server/VietTourAudio.Api/Hubs/NotificationHub.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Hubs/NotificationHub.cs): Quản lý danh sách các Connection ID trực tuyến, phân loại người dùng theo nhóm (Zone) địa lý và cập nhật số lượng người dùng cho admin/vendor.

---

## 4. Quy trình Hoạt động của một Du khách (User Flow)
1.  **Truy cập hệ thống:** Khách vào trang web, chọn ngôn ngữ thích hợp (Việt/Anh/Trung/Nhật/Hàn).
2.  **Khám phá bản đồ:** Bản đồ Leaflet hiển thị các khu vực du lịch và điểm tham quan POI.
3.  **Tự động nghe thuyết minh:** Du khách bật GPS di chuyển thực tế. Khi bước vào vùng POI, ứng dụng tự động tải file âm thanh thuyết minh (được lưu tại thư mục `/uploads/media` trên Backend) và phát ra loa.
4.  **Nâng cấp tài khoản:** Nếu muốn nghe toàn bộ các file audio giới hạn hoặc nhạc chất lượng cao, du khách bấm nút **Upgrade Premium**, chọn cổng thanh toán trong `CheckoutModal.jsx` và hoàn tất giao dịch. Admin phê duyệt giao dịch thông qua bảng điều khiển Admin, hệ thống lập tức mở khóa Premium cho tài khoản du khách.
