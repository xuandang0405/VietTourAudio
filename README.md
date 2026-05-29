# VietTourAudio

VietTourAudio là web app/PWA thuyết minh du lịch tự động theo GPS, QR và nội dung audio đa ngôn ngữ. Hệ thống hỗ trợ khách du lịch, chủ sạp/gian hàng, admin, gói premium, thống kê lượt quét QR, lượt ghé sạp, lượt nghe audio và doanh thu.

Repo GitHub: <https://github.com/xuandang0405/VietTourAudio>

## 1. Giới thiệu dự án

VietTourAudio giúp khách du lịch mở web app bằng QR, cấp quyền GPS và nghe thuyết minh khi đến gần sạp hoặc POI. Chủ sạp có dashboard để quản lý nội dung, media, QR, thanh toán và thống kê. Admin quản trị người dùng, duyệt sạp, kiểm tra thanh toán, premium, hoa hồng và nội dung upload.

## 2. Tính năng chính

- Khách quét QR để mở PWA nhanh trên điện thoại.
- App xin quyền GPS và tìm POI/sạp ở gần.
- Tự phát audio thuyết minh theo bán kính kích hoạt.
- Nội dung thuyết minh đa ngôn ngữ: `vi`, `en`, `ja`, `ko`, `zh`.
- Chủ sạp đăng ký tài khoản và quản lý sạp/gian hàng.
- Gói tháng và gói Premium cho chủ sạp.
- Dashboard chủ sạp: lượt ghé, lượt quét QR, lượt nghe audio, doanh thu, tiền mặt, khách Premium.
- Payment qua MoMo, Bank QR, Stripe và ghi nhận tiền mặt thủ công.
- Hoa hồng 5-10% khi khách đăng ký Premium qua QR của sạp.
- Admin dashboard quản lý người dùng, sạp, media, QR, thanh toán, premium và log thao tác.

## 3. Công nghệ sử dụng

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | ReactJS, Vite, PWA, React Router, Zustand, Axios |
| UI | CSS responsive, glassmorphism nhẹ, logo `logo.png` và `logo-text.png` |
| Backend | .NET 8 Web API, C#, Swagger/OpenAPI, JWT scaffold, CORS |
| Database | MySQL 8.x, InnoDB, utf8mb4, `POINT SRID 4326`, `SPATIAL INDEX` |
| Storage | Local file storage cho ảnh, video, audio, logo, QR |
| DevOps | Docker Compose cho MySQL/phpMyAdmin, script Windows/Linux |

## 4. Kiến trúc hệ thống

```text
React PWA
  -> Axios API client
  -> .NET Web API Controllers
  -> Services / DTOs / Helpers
  -> MySQL viettuoraudio
  -> Local uploads storage
```

Backend hiện là scaffold có route, DTO, response JSON thống nhất, Swagger, CORS, JWT scaffold và service layer. Business logic sâu như auth thật, payment webhook thật, upload thật và migration EF Core sẽ được hoàn thiện ở các phase sau.

## 5. Cấu trúc thư mục

```text
VietTourAudio/
├── README.md
├── .env.example
├── docker-compose.yml
├── run-windows.bat
├── docs/
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── README.md
├── server/
│   ├── VietTourAudio.Api/
│   └── uploads/
├── client/
│   ├── package.json
│   └── src/
├── scripts/
└── assets/
```

Backend chạy chính nằm trong `server/VietTourAudio.Api/`, namespace code là `VietTourAudio.Api`.

## 6. Yêu cầu môi trường

- NodeJS LTS.
- npm.
- .NET SDK 8.
- MySQL 8.x.
- Docker Desktop nếu muốn chạy MySQL bằng Docker Compose.
- Git nếu muốn commit/push lên GitHub.

## 7. Cài đặt database MySQL

Database bắt buộc là `viettuoraudio`.

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p viettuoraudio < database/seed.sql
```

Kiểm tra nhanh:

```sql
USE viettuoraudio;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM stalls;
SELECT COUNT(*) FROM pois;
```

`schema.sql` đã có `DROP TABLE IF EXISTS` đúng thứ tự, có khóa ngoại, index và spatial index. File media không lưu trực tiếp vào database, chỉ lưu path/url.

## 8. Cấu hình backend .NET

Sửa file `server/VietTourAudio.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;database=viettuoraudio;user=root;password=your_password;"
  }
}
```

JWT dev key nằm trong `Jwt:Key`. Khi lên production phải thay bằng secret đủ dài và không commit vào Git.

## 9. Chạy backend

```bash
cd server/VietTourAudio.Api
dotnet restore
dotnet run
```

Swagger thường mở tại:

```text
http://localhost:5000/swagger
https://localhost:5001/swagger
```

URL thực tế sẽ hiển thị trong terminal khi chạy `dotnet run`.

## 10. Chạy frontend

```bash
cd client
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

API base URL nằm trong `.env` của client:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 11. Tài khoản demo

Seed tạo tài khoản demo:

| Vai trò | Email | Ghi chú |
|---------|-------|---------|
| Admin | `admin@viettouraudio.local` | Password gợi ý: `Admin@123456` |
| Chủ sạp | `owner.benthanh@viettouraudio.local` | Dữ liệu demo |
| Chủ sạp | `owner.hoian@viettouraudio.local` | Dữ liệu demo |
| Tourist | `tourist@viettouraudio.local` | Dữ liệu demo |

`password_hash` trong seed chỉ là hash mẫu. Không dùng cho production.

## 12. API docs / Swagger

Sau khi chạy backend, mở `/swagger` để xem các nhóm API:

- `api/auth`
- `api/users`
- `api/stalls`
- `api/pois`
- `api/poi-contents`
- `api/media`
- `api/qr-codes`
- `api/analytics`
- `api/payments`
- `api/admin`

Response JSON dùng format:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

## 13. Hướng dẫn upload ảnh/video/audio

Upload đi qua endpoint:

```text
POST /api/media/upload
```

Form-data:

- `file`: file upload.
- `fileType`: `IMAGE`, `VIDEO`, `AUDIO`, `LOGO`, `QR`.
- `ownerId`: id người upload.
- `stallId`: optional.
- `poiId`: optional.

Nguyên tắc:

- Không lưu binary vào MySQL.
- Lưu file trên server trong `server/uploads/`.
- Database chỉ lưu `file_path`, `file_name`, `mime_type`, `file_size`.
- Phase tiếp theo cần bổ sung validate MIME type, dung lượng, virus scan và quyền upload.

## 14. Hướng dẫn deploy

Tổng quan deploy production:

1. Build frontend bằng `npm run build`.
2. Publish backend bằng `dotnet publish -c Release`.
3. Import `database/schema.sql` và `database/seed.sql` nếu cần dữ liệu mẫu.
4. Cấu hình Nginx reverse proxy.
5. Trỏ domain và bật HTTPS bằng Let's Encrypt.
6. Cấu hình backup MySQL định kỳ.
7. Đưa secret vào biến môi trường hoặc secret manager.

Xem thêm `docs/DEPLOYMENT_GUIDE.md`.

## 15. Phân công công việc

| Người | Vai trò | Công việc | Folder phụ trách |
|------|---------|-----------|------------------|
| Người 1 | Frontend Developer | Thiết kế UI React, landing page, map page, dashboard chủ sạp, admin dashboard, tích hợp logo | client/ |
| Người 2 | Backend .NET Developer | API C#, auth, user, stall, POI, QR, payment, upload, analytics | server/ |
| Người 3 | Database + DevOps + Tester | MySQL schema, seed data, docs, deploy, test GPS/QR/payment | database/, docs/, scripts/ |

## 16. Ghi chú phát triển tiếp

- Hoàn thiện auth thật với BCrypt/Argon2 và refresh token.
- Thêm EF Core migration hoặc quy trình SQL migration rõ ràng.
- Kết nối service với MySQL thay vì dữ liệu demo trong memory.
- Hoàn thiện upload file thật, validate file type và file size.
- Tích hợp cổng thanh toán sandbox trước khi production.
- Test GPS/geofence trên thiết bị thật.
- Bổ sung CI/CD, unit test, integration test và backup database.

## Chạy nhanh trên Windows

Double-click:

```bat
run-windows.bat
```

Script sẽ kiểm tra NodeJS/npm/.NET SDK, cài dependencies client nếu thiếu, restore backend, mở client và server. Nếu máy có Docker, script mở thêm MySQL/phpMyAdmin.

Trên Windows, nếu repo nằm trong đường dẫn có ký tự `#`, script sẽ tạo junction tạm trong `%TEMP%` để Vite dev server chạy ổn định.
