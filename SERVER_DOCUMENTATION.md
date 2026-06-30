# TÀI LIỆU CHI TIẾT HỆ THỐNG BACKEND (SERVER) - VIETTOURAUDIO

Tài liệu này giải thích chi tiết chức năng và vai trò của từng thư mục, từng file code C# bên trong dự án Backend ASP.NET Core API (`server/VietTourAudio.Api`).

---

## 1. Bản đồ tổng quát các thư mục Backend
Mã nguồn server được tổ chức theo kiến trúc phân lớp sạch sẽ (Clean Architecture dạng rút gọn):
*   `Domain`: Định nghĩa các thực thể (Entities) trong cơ sở dữ liệu.
*   `Data`: Quản lý kết nối Database (Entity Framework Core) và di chuyển dữ liệu (Migrations).
*   `Interfaces`: Các giao diện trừu tượng hóa để phân tách tầng Controller và tầng Service.
*   `Services`: Nơi xử lý toàn bộ logic nghiệp vụ (business logic) của hệ thống.
*   `Controllers`: Nơi tiếp nhận yêu cầu từ client (HTTP Request), điều phối dịch vụ và trả về kết quả (HTTP Response).
*   `Hubs`: Xử lý giao tiếp thời gian thực hai chiều qua giao thức WebSockets (SignalR).
*   `Middlewares`: Các bộ lọc trung gian chặn yêu cầu đầu vào để phân quyền, xử lý lỗi toàn cục và kiểm tra phiên làm việc.
*   `DTOs`: Các cấu trúc dữ liệu gửi nhận giữa Client và Server (Data Transfer Objects).
*   `Helpers` & `Infrastructure`: Các lớp công cụ tiện ích phụ trợ (quản lý file, validate chữ ký ảnh/audio, repository dùng chung).

---

## 2. Chi tiết vai trò của từng File Code

### 📂 THƯ MỤC: `Controllers` (API Endpoints)
Đây là các bộ điều hướng API. Mỗi file chịu trách nhiệm xử lý các yêu cầu HTTP cụ thể:

1.  **[`AdminController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminController.cs):**
    *   API tổng quan cho Admin: Thống kê số lượng bài viết, lượt nghe, lượt quét QR, doanh thu hệ thống và biểu đồ tăng trưởng người dùng phục vụ trang Dashboard của Admin.
2.  **[`AdminFinanceCompatibilityController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminFinanceCompatibilityController.cs):**
    *   Xử lý quản lý tài chính nâng cao cho Admin: Tra cứu lịch sử giao dịch, quản lý số dư ví, duyệt yêu cầu rút tiền của Vendor và cấu hình phí dịch vụ hàng tháng.
3.  **[`AdminModerationCompatibilityController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminModerationCompatibilityController.cs):**
    *   Phân hệ kiểm duyệt nội dung của Admin: Phê duyệt/từ chối các điểm tham quan (POI) mới, các gian hàng (Stalls) hoặc kịch bản thuyết minh giọng đọc nói (TTS) do Vendor gửi lên.
4.  **[`AdminOperationsCompatibilityController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminOperationsCompatibilityController.cs):**
    *   Các tác vụ vận hành hệ thống của Admin: Tra cứu nhật ký hệ thống (Audit Logs), quản lý và phản hồi các yêu cầu hỗ trợ (System Tickets) từ du khách.
5.  **[`AdminPoiController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminPoiController.cs):**
    *   API CRUD (Thêm, sửa, xóa, lấy chi tiết) điểm tham quan (POI) dành riêng cho quyền Admin.
6.  **[`AdminStallController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminStallController.cs):**
    *   API quản trị và giám sát danh sách các gian hàng (Stalls) của các Vendor trong hệ thống.
7.  **[`AdminTopUpController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminTopUpController.cs):**
    *   Dành cho Admin nạp tiền thủ công vào ví của một Vendor cụ thể khi họ nộp tiền mặt hoặc qua tài khoản trực tiếp ngoài hệ thống.
8.  **[`AdminVendorCompatibilityController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminVendorCompatibilityController.cs):**
    *   Quản lý danh sách tài khoản Vendor: khóa/mở khóa tài khoản, duyệt hồ sơ đăng ký kinh doanh của Vendor mới.
9.  **[`AdminWalletController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AdminWalletController.cs):**
    *   Quản lý số dư, xem chi tiết dòng tiền trong ví của từng tài khoản.
10. **[`AnalyticsController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AnalyticsController.cs):**
    *   Ghi nhận dữ liệu thống kê từ hành vi du khách: Tự động ghi lại nhật ký khi khách quét mã QR (`trackQrScan`), khi phát âm thanh thuyết minh (`trackAudioPlay`) hoặc truy cập vị trí địa lý.
11. **[`AuthController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/AuthController.cs):**
    *   Xử lý đăng nhập (`/login`), đăng xuất (`/logout`) và cấp lại mã JWT Token (`/refresh`) cho tài khoản quản trị và khách hàng nói chung.
12. **[`CheckoutPaymentController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/CheckoutPaymentController.cs):**
    *   Hạt nhân xử lý thanh toán: Khởi tạo giao dịch mua Premium hoặc trả phí thuê phần mềm (`/initialize`), tải lên biên lai chuyển khoản ngân hàng dạng ảnh (`/upload-proof`), và xử lý thanh toán tự động qua thẻ Visa giả lập (`/visa-process`).
13. **[`CompatibilityAuthControllers.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/CompatibilityAuthControllers.cs):**
    *   Cung cấp các cổng đăng nhập phụ tương thích ngược riêng biệt cho từng phân hệ `/api/admin/auth/login` và `/api/vendor/auth/login`.
14. **[`GuestController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/GuestController.cs):**
    *   Chứa toàn bộ API công khai không cần đăng nhập cho du khách: Lấy danh sách khu du lịch (`/tours`), thông tin chi tiết một điểm POI, và API chỉ đường ngắn nhất (`/routing`).
15. **[`GuestPaymentCompatibilityController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/GuestPaymentCompatibilityController.cs):**
    *   Lấy cấu hình hiển thị thông tin chuyển khoản (Tài khoản ngân hàng, ví MoMo, cú pháp chuyển tiền) để hiển thị lên giao diện thanh toán của khách.
16. **[`MediaController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/MediaController.cs):**
    *   API phục vụ việc đọc và truyền tải luồng (stream) các file âm thanh thuyết minh và hình ảnh tải lên.
17. **[`NotificationController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/NotificationController.cs):**
    *   Gửi thông báo đẩy từ hệ thống.
18. **[`PaymentController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/PaymentController.cs):**
    *   API webhook tiếp nhận tín hiệu xác thực giao dịch từ các cổng thanh toán bên thứ ba (giả lập).
19. **[`PoiContentController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/PoiContentController.cs):**
    *   Truy xuất các nội dung kịch bản thuyết minh/âm thanh theo từng ngôn ngữ tương ứng của một điểm POI.
20. **[`PoiController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/PoiController.cs):**
    *   Quản lý danh sách và tọa độ các điểm du lịch.
21. **[`PremiumController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/PremiumController.cs):**
    *   Xem trạng thái Premium hiện tại của thiết bị khách và kiểm tra hạn sử dụng.
22. **[`QrCodeController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/QrCodeController.cs):**
    *   API sinh mã QR động cho các điểm POI và gian hàng (Stalls). Khi quét QR này, trình duyệt sẽ tự động dẫn đến đúng trang thuyết minh.
23. **[`StallController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/StallController.cs):**
    *   Xem danh sách các quầy bán hàng và thực đơn sản phẩm của người bán tại điểm du lịch.
24. **[`SystemTicketController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/SystemTicketController.cs):**
    *   Du khách gửi phiếu yêu cầu hỗ trợ hoặc báo cáo lỗi kỹ thuật.
25. **[`UploadController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/UploadController.cs):**
    *   Tiếp nhận các file đa phương tiện tải lên (ảnh POI, file audio ghi âm, hóa đơn thanh toán).
26. **[`UserController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/UserController.cs):**
    *   Lấy và chỉnh sửa thông tin hồ sơ cá nhân của người dùng hiện tại.
27. **[`VendorController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/VendorController.cs):**
    *   File điều khiển trung tâm cực kỳ lớn cho Vendor: Quản lý đăng ký gian hàng, tạo sản phẩm bán kèm, chỉnh sửa tọa độ của quầy trên bản đồ, nộp văn bản yêu cầu Admin chuyển thành file nói thuyết minh (TTS).
28. **[`ZoneController.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Controllers/ZoneController.cs):**
    *   Quản lý các vùng/tuyến du lịch tổng quát (Ví dụ: Tuyến Nguyễn Huệ, Tuyến Chợ Lớn).

---

### 📂 THƯ MỤC: `Services` (Logic Nghiệp Vụ)
Nơi trực tiếp tính toán, truy vấn cơ sở dữ liệu và xử lý nghiệp vụ chính:

1.  **[`AppServices.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Services/AppServices.cs):**
    *   Định nghĩa các DTO và các lớp hỗ trợ trung gian cho các dịch vụ ứng dụng.
2.  **[`DatabaseAppServices.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Services/DatabaseAppServices.cs):**
    *   File triển khai (implement) thực tế của hầu hết các nghiệp vụ lưu trữ cơ sở dữ liệu: Tạo POI, sửa quầy hàng, quản lý danh sách sản phẩm, quản lý ảnh tải lên.
3.  **[`IdentityServices.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Services/IdentityServices.cs):**
    *   Xử lý bảo mật: Kiểm tra mật khẩu băm BCrypt, tạo JWT Token kèm thời gian hết hạn, xác minh quyền hạn truy cập của Admin/Vendor.
4.  **[`MonthlyBillingWorker.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Services/MonthlyBillingWorker.cs):**
    *   Một Service chạy ngầm tuần kỳ (Background Hosted Service): Mỗi giờ/ngày sẽ tự quét cơ sở dữ liệu, trừ phí dịch vụ hàng tháng từ ví Vendor, tự động khóa gian hàng nếu Vendor hết tiền trong ví hoặc hết hạn sử dụng.
5.  **[`PaymentEntitlementService.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Services/PaymentEntitlementService.cs):**
    *   Giải quyết nghiệp vụ kế toán: Cập nhật số dư ví, lưu vết lịch sử giao dịch (Ledger) và cộng ngày gia hạn Premium trực tiếp cho khách du lịch.
6.  **[`PoiTranslationService.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Services/PoiTranslationService.cs):**
    *   Dịch thuật đa ngôn ngữ: Tự động phát hiện ngôn ngữ yêu cầu (Vi/En/Ja/Ko/Zh) từ header `Accept-Language` của trình duyệt khách, nạp các trường tiêu đề và mô tả tương ứng để trả về đúng ngôn ngữ của khách du lịch.
7.  **[`PresenceTracker.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Services/PresenceTracker.cs):**
    *   Theo dõi trạng thái trực tuyến: Lưu trữ trong bộ nhớ RAM danh sách những người dùng đang kết nối vào bản đồ theo thời gian thực.

---

### 📂 THƯ MỤC: `Data` (Cơ Sở Dữ Liệu)
1.  **[`AppDbContext.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Data/AppDbContext.cs):**
    *   Cấu hình chính của Entity Framework Core. Ánh xạ các class C# thành các bảng tương ứng trong database MySQL (Users, Pois, StallProducts, PaymentTransactions,...).
2.  **[`DatabaseSql.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Data/DatabaseSql.cs):**
    *   Lớp tiện ích để kết nối trực tiếp bằng ADO.NET (Raw SQL) hỗ trợ chạy các câu lệnh SQL thô phức tạp trong quá trình khởi tạo.
3.  **[`OperationalSchemaInitializer.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Data/OperationalSchemaInitializer.cs) & `PaymentSchemaInitializer.cs` & `StallSchemaInitializer.cs`:**
    *   Các bộ khởi tạo cấu trúc bảng tự động khi chạy dự án lần đầu (Auto Migrations): Nếu các bảng dữ liệu bổ sung hoặc bảng lõi chưa tồn tại trong MySQL, các file này sẽ tự động tạo bảng mới.

---

### 📂 THƯ MỤC: `Domain` (Mô Hình Nghiệp Vụ)
1.  **[`DomainModels.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Domain/DomainModels.cs):**
    *   Chứa các class C# đại diện cho cấu trúc bảng cơ sở dữ liệu (Ví dụ: `User` chứa Email, PassHash, Role; `Poi` chứa Latitude, Longitude, TriggerRadius; `PaymentTransaction` chứa Amount, Status, ProofUrl).

---

### 📂 THƯ MỤC: `Middlewares` (Bộ Lọc Trung Gian)
1.  **[`ErrorHandlingMiddleware.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Middlewares/ErrorHandlingMiddleware.cs):**
    *   Bắt lỗi toàn cục: Nếu có bất cứ file code nào bị lỗi crash trong quá trình chạy, middleware này sẽ bắt lại, ghi log và trả về mã lỗi JSON chuẩn hóa cho client (không làm sập server).
2.  **[`PremiumExpiryMiddleware.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Middlewares/PremiumExpiryMiddleware.cs):**
    *   Tự động kiểm tra: Khi khách gửi yêu cầu gọi API, middleware này sẽ kiểm tra xem thời gian Premium của thiết bị khách đã hết hạn chưa để tự động cập nhật trạng thái trong database.
3.  **[`RequestLoggingMiddleware.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Middlewares/RequestLoggingMiddleware.cs):**
    *   Ghi nhật ký: Đo và in ra màn hình console thời gian phản hồi (ms) của mỗi request API để lập trình viên tối ưu hóa hiệu năng.
4.  **[`VendorPasswordChangeMiddleware.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Middlewares/VendorPasswordChangeMiddleware.cs):**
    *   Bảo mật tài khoản: Nếu tài khoản Vendor được Admin cấp mật khẩu tạm thời và đánh dấu là `must_change_password`, bộ lọc này sẽ chặn mọi API của Vendor và bắt buộc họ phải gọi API đổi mật khẩu trước khi làm việc khác.

---

### 📂 THƯ MỤC: `Hubs` (SignalR - WebSockets)
1.  **[`NotificationHub.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Hubs/NotificationHub.cs):**
    *   Quản lý kết nối thời gian thực: Du khách kết nối vào Hub này để đăng ký sự diện diện trực tuyến. Khi có sự thay đổi (khách di chuyển vùng du lịch, duyệt hóa đơn Premium), Server sẽ dùng Hub này phát tín hiệu trực tiếp về điện thoại du khách để cập nhật UI ngay tức thì.

---

### 📂 THƯ MỤC: `Infrastructure` (Hạ Tầng)
1.  **[`FileSignatureValidator.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Infrastructure/FileSignatureValidator.cs):**
    *   Bảo mật file tải lên: Đọc các byte đầu tiên của file (Magic Bytes) để xác thực xem file tải lên có đúng là định dạng ảnh (JPEG, PNG) hay âm thanh (MP3, WAV) thật hay không, ngăn chặn hacker tải lên các file mã độc giả danh file ảnh.
2.  **[`Persistence.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Infrastructure/Persistence.cs):**
    *   Triển khai mẫu thiết kế **Repository & Unit of Work**: Trừu tượng hóa các thao tác cơ bản với Database (Thêm, Xóa, Cập nhật) thành các hàm dùng chung để tránh trùng lặp mã nguồn.

---

### 📂 THƯ MỤC: `DTOs` & `Helpers`
1.  **[`ApiDtos.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/DTOs/ApiDtos.cs):**
    *   Chứa các bản ghi (records) định nghĩa dữ liệu truyền nhận dạng JSON: `LoginRequest`, `RegisterRequest`, `CheckoutRequest`, v.v.
2.  **[`ApiResponse.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Helpers/ApiResponse.cs):**
    *   Chuẩn hóa định dạng JSON trả về cho mọi API bao gồm 3 thuộc tính: `{ success: bool, data: object, error: string }`.
3.  **[`FileCleanupHelper.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Helpers/FileCleanupHelper.cs):**
    *   Hỗ trợ dọn dẹp các tệp tin rác hoặc tệp tin tải lên tạm thời bị lỗi.
4.  **[`StringHelpers.cs`](file:///c:/Users/UNITY/Downloads/VietTourAudio-master/VietTourAudio-master/server/VietTourAudio.Api/Helpers/StringHelpers.cs):**
    *   Các tiện ích định dạng chuỗi: Tạo Slug không dấu tự động từ Tiếng Việt (phục vụ đường dẫn SEO đẹp).
