# HƯỚNG DẪN CHẠY DỰ ÁN VIETTOURAUDIO

VietTourAudio là ứng dụng Web/PWA thuyết minh du lịch tự động theo tọa độ GPS, mã QR và âm thanh đa ngôn ngữ. Dự án bao gồm các thành phần:
1. **Backend API (.NET 8):** Xử lý nghiệp vụ chính, thanh toán và quản trị tập trung.
2. **Frontend Client (React/Vite):** Giao diện cho khách du lịch (Visitor) và đối tác (Vendor).
3. **Web-Admin (React/Vite):** Giao diện dành riêng cho quản trị viên (Admin).
4. **Cơ sở dữ liệu (MySQL):** Lưu trữ dữ liệu hệ thống.

---

## 🛠️ YÊU CẦU HỆ THỐNG (PREREQUISITES)

Trước khi khởi động dự án, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
* **Node.js:** Phiên bản 18+ (Kèm theo `npm`)
* **.NET SDK:** Phiên bản 8.0+
* **MySQL:** Phiên bản 8.0+ (Khuyên dùng MySQL đi kèm trong **XAMPP** để tương thích cấu hình tự động).

---

## ⚡ CÁCH KHỞI ĐỘNG NHANH TRÊN WINDOWS (KHUYÊN DÙNG)

Để thuận tiện nhất, dự án đã tích hợp sẵn 2 script tự động hóa: `run.bat` (khởi động) và `stop.bat` (tắt hệ thống).

### Bước 1: Khởi động hệ thống
Bạn chỉ cần **nhấp đúp chuột** vào file [run.bat](file:///c:/Users/UNITY/Desktop/VietTourAudio-project-ready-database-integration/run.bat). Một giao diện điều khiển sẽ hiện ra với các lựa chọn:

* **[1] Khởi động chế độ Staging (Tự động chọn sau 5s):**
  * Chạy trên tên miền thực `bkpvp.top` (Cổng API: `8443` HTTPS qua Cloudflare, Client: Cổng `80`).
  * Phù hợp khi muốn test môi trường thực tế hoặc kết nối thiết bị di động bên ngoài.
* **[2] Khởi động chế độ Local (Phát triển):**
  * Khởi chạy toàn bộ dịch vụ dưới dạng localhost cục bộ (Client: `5173`, API: `5000`, Web-Admin: `5174`).
* **[3] Cài đặt / Cập nhật thư viện:**
  * Tự động chạy `npm install` cho tất cả các thư mục frontend khi chạy lần đầu hoặc khi cập nhật mã nguồn.
* **[4] Khởi tạo lại Cơ sở dữ liệu (Database Reset & Seed):**
  * Tự động tạo cơ sở dữ liệu `viettuoraudio`, cài đặt cấu trúc bảng (schema) và nạp dữ liệu mẫu (seed). **Chọn mục này nếu đây là lần đầu tiên bạn chạy dự án.**
* **[5] Tắt toàn bộ dịch vụ:** Gọi file tắt hệ thống.
* **[6] Thoát.**

*Sau khi các dịch vụ khởi động hoàn tất, chương trình sẽ tự động mở trình duyệt web dẫn đến giao diện sử dụng.*

### Bước 2: Tắt hệ thống
Khi không sử dụng nữa, bạn nhấp đúp chuột vào file [stop.bat](file:///c:/Users/UNITY/Desktop/VietTourAudio-project-ready-database-integration/stop.bat). Script sẽ tắt toàn bộ các cửa sổ lệnh CMD và các tiến trình chạy ngầm của dự án một cách an toàn.

---

## 💻 CÁCH KHỞI ĐỘNG THỦ CÔNG (CHO MACOS/LINUX HOẶC DEBUG)

Nếu bạn không sử dụng Windows hoặc muốn chạy từng thành phần độc lập bằng dòng lệnh:

### 1. Khởi tạo Cơ sở dữ liệu
Đảm bảo dịch vụ MySQL đang chạy trên cổng `3306`.
```bash
cd database
npm install
node apply_db.js
```

### 2. Khởi chạy Backend API (.NET)
```bash
cd server/VietTourAudio.Api
dotnet restore
dotnet run --urls "http://*:5000"
```
* Kiểm tra trạng thái API tại: <http://localhost:5000/health>
* Tài liệu Swagger API tại: <http://localhost:5000/swagger>

### 3. Khởi chạy Frontend Client (Khách / Đối tác)
```bash
cd client
npm install
npm run dev
```
* Truy cập ứng dụng tại: <http://localhost:5173>

### 4. Khởi chạy Web-Admin (Trang quản trị)
```bash
cd client/web-admin
npm install
npm run dev -- --port 5174
```
* Truy cập trang quản trị tại: <http://localhost:5174>

---

## 🔑 TÀI KHOẢN ĐĂNG NHẬP MẪU (DEMO ACCOUNTS)

Dữ liệu mẫu sau khi khởi tạo DB bao gồm các tài khoản thử nghiệm sau:

| Vai trò | Email đăng nhập | Mật khẩu | Giao diện đăng nhập |
|---|---|---|---|
| **Super Admin** | `admin@viettouraudio.vn` | `Admin123` | `/admin/login` hoặc cổng `5174` |
| **Vendor (Đối tác)** | `an@heritagefoods.vn` | `Vendor123` | `/vendor/login` |

---

## 🌐 DANH SÁCH ĐƯỜNG DẪN KHI CHẠY LOCAL

* **Giao diện chính (Khách):** <http://localhost:5173>
* **Giao diện Quản lý Đối tác:** <http://localhost:5173/vendor/login>
* **Giao diện Quản trị viên (Cách 1):** <http://localhost:5173/admin/login>
* **Giao diện Quản trị viên (Cách 2 - Standalone):** <http://localhost:5174>
* **Tài liệu Backend Swagger:** <http://localhost:5000/swagger>
* **Đường dẫn API chính:** <http://localhost:5000/api>
