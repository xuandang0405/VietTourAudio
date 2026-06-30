# VietTourAudio database

Database duy nhất của dự án là `viettuoraudio`.

## Khởi tạo đầy đủ

Chạy từ thư mục gốc:

```bash
mysql -u root -p < database/full_database.sql
```

File trên tạo đầy đủ bảng, khóa ngoại, index và trigger. Nó cố ý không tạo
tài khoản, vendor, stall, POI, giao dịch hoặc số liệu mẫu. Dữ liệu nghiệp vụ
phải được tạo bằng API thật từ Admin, Vendor và User.

Lưu ý: script sẽ reset database hiện tại. Hãy backup dữ liệu thật trước khi
chạy.

## Các file

- `full_database.sql`: entry point duy nhất.
- `schema.sql`: schema chuẩn dùng bởi entry point.
- `migrations/`: lịch sử nâng cấp cho database cũ, không cần chạy khi dựng mới.
- `backup/`: nơi lưu bản sao dữ liệu thật.

File media không lưu trực tiếp trong MySQL. Database chỉ giữ URL, đường dẫn,
MIME type, kích thước và trạng thái kiểm duyệt.

## Dữ liệu kiểm thử

Chỉ dùng ở môi trường development:

```bash
mysql -u root -p viettuoraudio < database/seed.sql
```

Seed này sẽ xóa dữ liệu nghiệp vụ hiện tại trước khi chèn bộ test.

- Admin: `admin@viettouraudio.vn` / `Admin123`
- Vendor Standard: `standard@viettouraudio.vn` / `Vendor123`
- Vendor Premium: `premium@viettouraudio.vn` / `Vendor123`
