# Database VietTourAudio

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

## Ghi chú mật khẩu demo

Seed tạo tài khoản:

- Admin: `admin@viettouraudio.local`
- Gợi ý password demo: `Admin@123456`

`password_hash` trong seed chỉ là hash mẫu để phục vụ dữ liệu demo. Khi implement auth thật, backend phải dùng thuật toán hash an toàn như BCrypt/Argon2 và không commit mật khẩu thật.

## Nguyên tắc media

Không lưu ảnh, video, audio trực tiếp trong MySQL. File được lưu trong server storage, database chỉ lưu `file_path`, `file_name`, `mime_type`, `file_size` và metadata liên quan.
