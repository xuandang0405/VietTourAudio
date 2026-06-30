# Module khách du lịch, POI và bản đồ

## Luồng chính

1. Khách chọn **Bắt đầu trải nghiệm**.
2. Trình duyệt xin quyền GPS thật và tiếp tục theo dõi vị trí.
3. Bản đồ Leaflet hiển thị POI, vị trí khách, khoảng cách và bán kính geofence.
4. Khi khách đi vào bán kính POI, hệ thống ghi nhận lượt ghé và mở POI gần nhất.
5. POI miễn phí phát bằng Browser TTS. POI Premium yêu cầu mở khóa trước khi phát.
6. Mỗi lần phát được ghi nhận qua API analytics.

Chế độ **Trải nghiệm Demo** chỉ là phương án trình diễn. Sau khi bật Demo, hai nút điều hướng nhỏ trên bản đồ cho phép giả lập di chuyển lần lượt qua các POI.

## QR mở POI

Mỗi màn chi tiết POI có nút **Hiện QR mở đúng POI**. QR sử dụng dạng đường dẫn:

```text
/map?poi={poi-slug}&source=qr&qr={qr-code-id}
```

Khi mở đường dẫn, frontend chọn đúng POI và gửi sự kiện quét QR một lần trong phiên.

Để điện thoại quét QR từ laptop, tạo `client/.env` với địa chỉ IP LAN của máy chạy frontend:

```env
VITE_API_BASE_URL=http://192.168.1.10:5000/api
VITE_PUBLIC_APP_URL=http://192.168.1.10:5173
```

Thay `192.168.1.10` bằng IP LAN thực tế của máy.

## API sử dụng

- `GET /api/pois`
- `GET /api/pois/{id}`
- `GET /api/pois/nearby?latitude=&longitude=&radiusMeters=`
- `GET /api/poi-contents/poi/{poiId}`
- `POST /api/analytics/visit`
- `POST /api/analytics/audio-play`
- `POST /api/analytics/qr-scan`
- `GET /api/analytics/summary`

Backend hiện lưu số liệu analytics trong bộ nhớ để phù hợp mức prototype. Số liệu được đặt lại khi backend khởi động lại.

## Ngôn ngữ

Nội dung và Browser TTS hỗ trợ: Việt (`vi`), Anh (`en`), Nhật (`ja`), Hàn (`ko`) và Trung (`zh`). Nếu trình duyệt không có giọng tương ứng, hệ điều hành sẽ chọn giọng gần nhất hoặc báo không thể phát.
