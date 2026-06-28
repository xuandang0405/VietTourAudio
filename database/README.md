# Database VietTourAudio

## Cài đặt đầy đủ bằng một lệnh

Từ thư mục gốc của dự án, chạy:

```bash
mysql -u root -p < database/full_database.sql
```

`full_database.sql` là điểm vào duy nhất, lần lượt dựng toàn bộ schema và dữ
liệu nền. Lệnh này reset database `viettuoraudio`; hãy backup dữ liệu thật
trước khi chạy.

Database bắt buộc của dự án là `viettuoraudio`.

## File chính

- `schema.sql`: tạo database, drop bảng cũ theo đúng thứ tự, tạo toàn bộ bảng, khóa ngoại, index và spatial index.
- `seed.sql`: dữ liệu mẫu cho admin, chủ sạp, khách du lịch, sạp, POI, audio content, QR, analytics và payment.
- `spatial-index.sql`: file tương thích cũ, chỉ kiểm tra spatial index vì index đã nằm trong `schema.sql`.
- `backup/`: nơi lưu backup database.

## Import database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p viettuoraudio < database/seed.sql
```

## Kiểm tra bảng

```sql
USE viettuoraudio;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM stalls;
SELECT COUNT(*) FROM pois;
```

## Reset khi lỗi

Chạy lại:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p viettuoraudio < database/seed.sql
```

`schema.sql` đã có `DROP TABLE IF EXISTS` theo đúng thứ tự nên có thể chạy lại khi cần reset dữ liệu dev.

## Tương thích MariaDB

MariaDB không hỗ trợ cú pháp column `POINT NOT NULL SRID 4326` giống MySQL 8. Vì vậy schema dùng:

```sql
location POINT NOT NULL
```

và vẫn tạo:

```sql
SPATIAL INDEX idx_stalls_location (location)
SPATIAL INDEX idx_pois_location (location)
```

Tọa độ chuẩn vẫn được lưu thêm ở `latitude` và `longitude`, còn `location` dùng cho truy vấn không gian.

## Tài khoản demo local

Seed local hiện tạo các tài khoản có thể đăng nhập trực tiếp vào stack cũ:

- Admin portal: `admin@viettouraudio.vn` / `Admin123`
- Vendor portal: `an@heritagefoods.vn` / `Vendor123`

Password trong seed được lưu bằng BCrypt để môi trường dev có thể chạy auth end-to-end ngay sau khi import database.

## Nguyên tắc media

Không lưu ảnh, video, audio trực tiếp trong MySQL. File được lưu trong server storage, database chỉ lưu `file_path`, `file_name`, `mime_type`, `file_size` và metadata liên quan.
