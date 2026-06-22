# Database Guide

## Database name

Tên database bắt buộc:

```sql
viettuoraudio
```

Không dùng tên database khác trong code, Docker, README hoặc script.

## Tạo database

Từ thư mục root:

```bash
mysql -u root -p < database/schema.sql
```

Lệnh này sẽ:

- `CREATE DATABASE IF NOT EXISTS viettuoraudio`.
- `USE viettuoraudio`.
- Drop bảng cũ theo đúng thứ tự.
- Tạo bảng InnoDB với charset `utf8mb4`.
- Tạo khóa chính, khóa ngoại, index và spatial index.

## Import seed

```bash
mysql -u root -p viettuoraudio < database/seed.sql
```

Seed tạo admin, chủ sạp, tourist, sạp mẫu, POI mẫu, nội dung thuyết minh tiếng Việt/Anh, QR mẫu, analytics mẫu và payment mẫu.

## Kiểm tra bảng

```sql
USE viettuoraudio;
SHOW TABLES;
DESCRIBE users;
DESCRIBE stalls;
DESCRIBE pois;
SHOW INDEX FROM stalls;
SHOW INDEX FROM pois;
```

## Reset database khi lỗi

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p viettuoraudio < database/seed.sql
```

`schema.sql` đã có `DROP TABLE IF EXISTS` theo đúng thứ tự phụ thuộc nên có thể chạy lại trong môi trường dev.

## Nhóm bảng

- User: `users`.
- Sạp/gian hàng: `stalls`, `stall_subscriptions`.
- POI và nội dung audio: `pois`, `poi_contents`.
- Media và QR: `media_files`, `qr_codes`.
- Analytics: `qr_scan_events`, `visit_events`, `play_history`.
- Thanh toán: `payments`, `cash_reports`, `commissions`.
- Admin/system: `admin_logs`, `app_settings`.

## Spatial data

`stalls.location` và `pois.location` dùng `POINT NOT NULL` để tương thích cả MariaDB và MySQL.

Khi insert, dùng thứ tự:

```sql
ST_GeomFromText('POINT(longitude latitude)')
```

Ví dụ:

```sql
ST_GeomFromText('POINT(106.698278 10.772112)')
```

Lý do không dùng `POINT NOT NULL SRID 4326`: MariaDB báo lỗi cú pháp tại `SRID 4326`. Dự án vẫn giữ `latitude`, `longitude`, `POINT` và `SPATIAL INDEX` để hỗ trợ spatial query.

## Media storage

Không lưu binary vào MySQL. File ảnh/video/audio/QR lưu ở server storage, database chỉ lưu metadata và `file_path`.
