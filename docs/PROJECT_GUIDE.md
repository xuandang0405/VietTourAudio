# Project Guide

## Mục tiêu

VietTourAudio là nền tảng PWA giúp khách du lịch nghe thuyết minh tự động theo GPS, QR và audio đa ngôn ngữ. Hệ thống gồm frontend React, backend .NET Web API và MySQL database `viettuoraudio`.

## Luồng chính

1. Khách quét QR tại sạp hoặc POI.
2. Frontend mở đúng màn hình và xin quyền GPS.
3. App gọi API tìm POI gần vị trí hiện tại.
4. Khi vào bán kính kích hoạt, app phát audio theo ngôn ngữ.
5. Hệ thống ghi nhận lượt quét QR, lượt ghé và lượt nghe.
6. Chủ sạp xem thống kê trên dashboard.
7. Admin quản trị người dùng, sạp, payment, premium và media.

## Thành phần

- `client/`: React PWA.
- `server/VietTourAudio.Api/`: .NET 8 Web API scaffold, namespace `VietTourAudio.Api`.
- `database/`: SQL schema, seed data và tài liệu MySQL.
- `docs/`: tài liệu hướng dẫn phát triển.
- `assets/`: kho asset dùng chung.
- `scripts/`: script dev/build/deploy.

## Nguyên tắc phát triển

- Backend .NET là trung tâm nghiệp vụ.
- Không hard-code secret hoặc API URL.
- Database name luôn là `viettuoraudio`.
- Không lưu ảnh/video/audio trực tiếp trong database.
- Tất cả response API dùng format JSON thống nhất.
- UI ưu tiên mobile-first vì khách dùng điện thoại khi đi du lịch.
