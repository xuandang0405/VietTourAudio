# VietTourAudio API (Node.js 20 + Express 5 + MySQL 8 + Prisma + Socket.io)

Backend production-ready MVP cho Mobile PWA, Web Admin và Vendor Portal.

## 1. Stack
- Node.js 20 (ESM)
- Express 5
- Prisma ORM + MySQL 8
- JWT (jsonwebtoken + bcrypt)
- Socket.io 4
- Multer upload (MIME + extension + size validation)
- Zod validation
- QR code generation + deep link resolver
- Google TTS (optional) / fallback stub audio

## 2. Cài đặt
```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Server chạy tại: `http://localhost:3001`

## 3. Demo accounts
- Admin: `admin / Admin@123`
- Moderator: `mod / Mod@123`
- Vendor approved: `vendor1 / Vendor@123`
- Vendor pending: `vendor2 / Vendor@123`

## 4. API base
- `/api/auth`
- `/api/zones`
- `/api/tours`
- `/api/narrations`
- `/api/geofence`
- `/api/qr`
- `/api/analytics`
- `/api/favorites`
- `/api/users`
- `/api/vendor`
- `/api/payments`
- `/api/uploads`
- `/api/settings`

## 5. Socket.io events
- `shop:status-changed`
- `analytics:new-event`
- `notification:new`
- `narration:approved`

Socket auth handshake:
- Nếu có JWT token trong `auth.token` hoặc header `Authorization`, server join room:
  - `user:{id}`
  - `vendor:{shopId}` (khi payload có `shopId`)

## 6. Mock parts
### TTS
- Nếu có Google credentials (`GOOGLE_TTS_KEY` hoặc `GOOGLE_APPLICATION_CREDENTIALS`): gọi Google Cloud TTS.
- Nếu không có: ghi file stub vào `uploads/audio/narration_{id}_{lang}.mp3`.

### Payment
- Dùng mock payment gateway:
  - `POST /api/payments/mock/create`
  - `POST /api/payments/mock/:id/pay`

## 7. Security notes
- JWT secret kiểm tra bắt buộc.
- Login rate-limit: 10 req / 15 phút / IP.
- QR scan rate-limit: 120 req / phút / IP.
- Upload: check cả MIME + extension + max size.
- Không trả `passwordHash` trong endpoint list users.
- Error format chuẩn: `{ "error": "message", "details": optional }`.

## 8. Cấu trúc
```
/prisma
/src
/uploads
.env.example
package.json
README.md
```

## 9. Gợi ý Production
- Thay in-memory cooldown bằng Redis (QR scan + geofence narration cooldown).
- Bật MySQL Spatial index cho zone point để tăng tốc nearest query.
- Tách queue cho TTS generation (BullMQ/RabbitMQ) để xử lý nền.
- Dùng object storage (S3/Azure Blob) thay local uploads.
