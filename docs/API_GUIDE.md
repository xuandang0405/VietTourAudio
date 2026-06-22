# API Guide

## Base URL

Local backend:

```text
http://localhost:5000/api
```

Swagger:

```text
http://localhost:5000/swagger
```

## Response format

API trả JSON thống nhất:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Khi lỗi server:

```json
{
  "success": false,
  "message": "Server error",
  "errors": {}
}
```

## Nhóm endpoint scaffold

| Nhóm | Endpoint |
|------|----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| User | `GET /api/users`, `GET /api/users/{id}` |
| Stall | `GET /api/stalls`, `POST /api/stalls`, `POST /api/stalls/{id}/approve` |
| POI | `GET /api/pois`, `GET /api/pois/nearby`, `POST /api/pois` |
| POI Content | `GET /api/poi-contents/poi/{poiId}`, `POST /api/poi-contents` |
| Media | `POST /api/media/upload` |
| QR | `POST /api/qr-codes`, `POST /api/qr-codes/scan` |
| Analytics | `GET /api/analytics/summary`, `POST /api/analytics/visit`, `POST /api/analytics/audio-play` |
| Payment | `POST /api/payments`, `POST /api/payments/webhook`, `POST /api/payments/manual-cash` |
| Admin | `GET /api/admin/dashboard`, `GET /api/admin/logs` |

## JWT

Project đã có JWT scaffold trong `Program.cs`. Khi triển khai thật cần:

- Hash password bằng BCrypt/Argon2.
- Kiểm tra user trong MySQL.
- Sinh access token và refresh token.
- Bảo vệ route admin/chủ sạp bằng role.

## CORS

Frontend local `http://localhost:5173` đã được allow trong `appsettings.json`.
