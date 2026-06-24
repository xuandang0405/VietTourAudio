# API CONTRACT: VietTourAudio

**Last Updated:** 2026-06-23  
**Version:** 1.0  
**Status:** In Progress - Being validated against actual implementation

---

## BASE URLS

- **Visitor API:** `http://localhost:5000`
- **Admin API:** `http://localhost:5001`
- **Frontend Dev:** `http://localhost:5173`

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Admin Login

**Endpoint:** `POST /api/admin/auth/login`  
**Port:** 5001 (Admin API)  
**Auth Required:** No  
**Role Required:** None

**Request:**
```json
{
  "email": "admin@viettouraudio.vn",
  "password": "Admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "1",
      "email": "admin@viettouraudio.vn",
      "role": "ADMIN",
      "displayName": "Admin User",
      "status": "ACTIVE"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "AUTH_INVALID_CREDENTIALS"
}
```

---

### 1.2 Vendor Login

**Endpoint:** `POST /api/vendor/auth/login`  
**Port:** 5001 (Admin API)  
**Auth Required:** No  
**Role Required:** None

**Request:**
```json
{
  "email": "an@heritagefoods.vn",
  "password": "Vendor123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "1",
      "email": "an@heritagefoods.vn",
      "role": "VENDOR",
      "vendorId": "1",
      "vendorName": "Hội An Heritage Foods",
      "displayName": "Nguyễn Minh An"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "AUTH_INVALID_CREDENTIALS"
}
```

---

### 1.3 Get Current User

**Endpoint:** `GET /api/admin/auth/me`  
**Port:** 5001 (Admin API)  
**Auth Required:** Yes (Bearer Token)  
**Role Required:** ADMIN, MODERATOR, FINANCE

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "email": "admin@viettouraudio.vn",
    "role": "ADMIN",
    "displayName": "Admin User",
    "status": "ACTIVE",
    "lastLoginAt": "2026-06-23T12:00:00Z"
  }
}
```

---

### 1.4 Refresh Token

**Endpoint:** `POST /api/admin/auth/refresh`  
**Port:** 5001 (Admin API)  
**Auth Required:** Yes  
**Role Required:** ADMIN, MODERATOR, FINANCE

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 1.5 Logout

**Endpoint:** `POST /api/admin/auth/logout`  
**Port:** 5001 (Admin API)  
**Auth Required:** Yes  
**Role Required:** ADMIN, MODERATOR, FINANCE

**Success Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

---

## 2. VENDOR ENDPOINTS (Admin API)

### 2.1 List All Vendors

**Endpoint:** `GET /api/admin/vendors`  
**Port:** 5001  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Query Params:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): PENDING, APPROVED, REJECTED, SUSPENDED

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": "1",
        "legalName": "Hội An Heritage Foods",
        "tradeName": "Heritage Foods",
        "status": "APPROVED",
        "contactEmail": "an@heritagefoods.vn",
        "approvedAt": "2026-06-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

---

### 2.2 Get Vendor Detail

**Endpoint:** `GET /api/admin/vendors/:vendorId`  
**Port:** 5001  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN, VENDOR (own only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "legalName": "Hội An Heritage Foods",
    "tradeName": "Heritage Foods",
    "slug": "heritage-foods",
    "contactName": "Nguyễn Minh An",
    "contactEmail": "an@heritagefoods.vn",
    "phone": "0905123456",
    "address": "Hội An, Quảng Nam",
    "status": "APPROVED",
    "walletBalance": "450000.00",
    "subscriptionStatus": "ACTIVE",
    "createdAt": "2026-06-01T00:00:00Z"
  }
}
```

---

### 2.3 Approve Vendor

**Endpoint:** `PATCH /api/admin/vendors/:vendorId/approve`  
**Port:** 5001  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Request:**
```json
{}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "status": "APPROVED",
    "approvedAt": "2026-06-23T12:00:00Z"
  }
}
```

---

### 2.4 Reject Vendor

**Endpoint:** `PATCH /api/admin/vendors/:vendorId/reject`  
**Port:** 5001  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Request:**
```json
{
  "reason": "Chứng chỉ không hợp lệ"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "status": "REJECTED",
    "rejectionReason": "Chứng chỉ không hợp lệ"
  }
}
```

---

## 3. POI ENDPOINTS

### 3.1 List POIs (Visitor)

**Endpoint:** `GET /api/pois`  
**Port:** 5000 (Visitor API)  
**Auth Required:** No  
**Role Required:** None

**Query Params:**
- `language` (optional): en, vi
- `stall_id` (optional): Filter by stall
- `status` (optional): ACTIVE, INACTIVE, DRAFT

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "pois": [
      {
        "id": "1",
        "name": "Lò nướng bánh mì",
        "slug": "lo-nuong-banh-mi",
        "stallId": "1",
        "stallName": "Sạp Bánh Mì Phố Cổ",
        "latitude": 15.8801,
        "longitude": 108.3268,
        "radius": 10,
        "description": "Lò nướng bánh mì truyền thống",
        "imageUrl": "http://localhost:5000/uploads/poi-1.jpg",
        "status": "ACTIVE"
      }
    ],
    "total": 15
  }
}
```

---

### 3.2 Get POI Detail

**Endpoint:** `GET /api/pois/:poiId`  
**Port:** 5000  
**Auth Required:** No  

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Lò nướng bánh mì",
    "slug": "lo-nuong-banh-mi",
    "stallId": "1",
    "description": "Lò nướng bánh mì truyền thống",
    "latitude": 15.8801,
    "longitude": 108.3268,
    "radius": 10,
    "imageUrl": "http://localhost:5000/uploads/poi-1.jpg",
    "status": "ACTIVE"
  }
}
```

---

### 3.3 Create POI (Admin)

**Endpoint:** `POST /api/admin/pois`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Request:**
```json
{
  "stallId": "1",
  "name": "Lò nướng bánh mì",
  "slug": "lo-nuong-banh-mi",
  "description": "Lò nướng bánh mì truyền thống",
  "latitude": 15.8801,
  "longitude": 108.3268,
  "radius": 10,
  "imageFile": "<binary data or URL>"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Lò nướng bánh mì",
    "slug": "lo-nuong-banh-mi",
    "status": "ACTIVE",
    "createdAt": "2026-06-23T12:00:00Z"
  }
}
```

---

### 3.4 Update POI

**Endpoint:** `PUT /api/admin/pois/:poiId`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated Description",
  "radius": 15,
  "imageFile": "<optional>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Updated Name",
    "updatedAt": "2026-06-23T12:30:00Z"
  }
}
```

---

### 3.5 Delete POI (Soft Delete)

**Endpoint:** `DELETE /api/admin/pois/:poiId`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "status": "DELETED"
  }
}
```

---

## 4. NARRATION/CONTENT ENDPOINTS

### 4.1 Get Narration by POI & Language

**Endpoint:** `GET /api/pois/:poiId/contents`  
**Port:** 5000  
**Auth Required:** No  

**Query Params:**
- `language`: en or vi

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "contents": [
      {
        "id": "1",
        "poiId": "1",
        "language": "vi",
        "title": "Lò nướng bánh mì",
        "script": "Đây là lò nướng bánh mì truyền thống...",
        "audioUrl": "http://localhost:5000/uploads/audio-1.mp3",
        "audioStatus": "READY",
        "duration": 120,
        "isPremium": false,
        "approvalStatus": "APPROVED"
      }
    ]
  }
}
```

---

### 4.2 Create/Submit Narration

**Endpoint:** `POST /api/admin/pois/:poiId/contents`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN, VENDOR

**Request:**
```json
{
  "language": "vi",
  "title": "Lò nướng bánh mì",
  "script": "Đây là lò nướng bánh mì truyền thống...",
  "audioFile": "<binary data or URL>",
  "isPremium": false
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "poiId": "1",
    "language": "vi",
    "approvalStatus": "PENDING",
    "createdAt": "2026-06-23T12:00:00Z"
  }
}
```

---

### 4.3 Approve Narration

**Endpoint:** `PATCH /api/admin/pois/:poiId/contents/:contentId/approve`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN, MODERATOR

**Request:**
```json
{}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "approvalStatus": "APPROVED",
    "audioStatus": "READY",
    "approvedAt": "2026-06-23T12:30:00Z"
  }
}
```

---

### 4.4 Reject Narration

**Endpoint:** `PATCH /api/admin/pois/:poiId/contents/:contentId/reject`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN, MODERATOR

**Request:**
```json
{
  "reason": "Audio quality chưa đạt tiêu chuẩn"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "approvalStatus": "REJECTED",
    "rejectionReason": "Audio quality chưa đạt tiêu chuẩn",
    "rejectedAt": "2026-06-23T12:30:00Z"
  }
}
```

---

## 5. QR CODE ENDPOINTS

### 5.1 Create QR Code

**Endpoint:** `POST /api/admin/qr-codes`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Request:**
```json
{
  "code": "VTA-POI-001",
  "poiId": "1",
  "maxScans": 0,
  "expiresAt": "2027-06-23T00:00:00Z"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "code": "VTA-POI-001",
    "token": "unique-qr-token-xyz",
    "poiId": "1",
    "status": "ACTIVE",
    "createdAt": "2026-06-23T12:00:00Z"
  }
}
```

---

### 5.2 Scan QR Code (Guest)

**Endpoint:** `POST /api/qr-codes/scan`  
**Port:** 5000  
**Auth Required:** No  

**Request:**
```json
{
  "qrToken": "unique-qr-token-xyz",
  "guestId": "guest-uuid-here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "poiId": "1",
    "poiName": "Lò nướng bánh mì",
    "stallId": "1",
    "stallName": "Sạp Bánh Mì Phố Cổ",
    "isPremium": false,
    "contentUrl": "/tour/1?poi=1"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "QR_EXPIRED"
}
```

---

### 5.3 List QR Codes

**Endpoint:** `GET /api/admin/qr-codes`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "qrCodes": [
      {
        "id": "1",
        "code": "VTA-POI-001",
        "poiId": "1",
        "status": "ACTIVE",
        "scans": 15,
        "createdAt": "2026-06-23T12:00:00Z"
      }
    ],
    "total": 50
  }
}
```

---

### 5.4 Disable QR Code

**Endpoint:** `PATCH /api/admin/qr-codes/:qrId/disable`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "status": "DISABLED"
  }
}
```

---

## 6. VENDOR PORTAL ENDPOINTS (Admin API)

### 6.1 Vendor Dashboard

**Endpoint:** `GET /api/vendor/dashboard`  
**Port:** 5001  
**Auth Required:** Yes  
**Role Required:** VENDOR

**Headers:**
```
Authorization: Bearer <vendor_access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": "1",
      "businessName": "Hội An Heritage Foods",
      "ownerDisplayName": "Nguyễn Minh An",
      "status": "APPROVED",
      "walletBalance": "450000.00",
      "totalTopUp": "500000.00",
      "subscriptionStatus": "ACTIVE"
    },
    "metrics": {
      "totalPois": 2,
      "totalQrScans": 52,
      "totalVisits": 185,
      "totalAudioPlays": 104,
      "totalRevenue": "210000.00"
    },
    "daily": [
      {
        "date": "2026-06-21T00:00:00Z",
        "visitors": 55,
        "audioPlays": 31,
        "revenue": "60000.00"
      }
    ]
  }
}
```

---

### 6.2 Vendor POIs

**Endpoint:** `GET /api/vendor/pois`  
**Port:** 5001  
**Auth Required:** Yes  
**Role Required:** VENDOR

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "pois": [
      {
        "id": "1",
        "name": "Lò nướng bánh mì",
        "stallName": "Sạp Bánh Mì Phố Cổ",
        "status": "ACTIVE",
        "languageCount": 2,
        "audioPlays": 50,
        "isPremiumContent": true
      }
    ]
  }
}
```

---

### 6.3 Vendor Revenue

**Endpoint:** `GET /api/vendor/revenue`  
**Port:** 5001  
**Auth Required:** Yes  
**Role Required:** VENDOR

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "balance": "450000.00",
      "totalTopUp": "500000.00",
      "approvedCommission": "50000.00",
      "pendingCommission": "10000.00",
      "totalSpent": "80000.00"
    },
    "transactions": [
      {
        "id": "1",
        "type": "TOP_UP",
        "amount": "100000.00",
        "status": "COMPLETED",
        "createdAt": "2026-06-20T10:00:00Z"
      }
    ]
  }
}
```

---

## 7. ANALYTICS ENDPOINTS

### 7.1 Track Event

**Endpoint:** `POST /api/events/track`  
**Port:** 5000  
**Auth Required:** No  

**Request:**
```json
{
  "eventType": "PLAY_NARRATION",
  "guestId": "guest-uuid",
  "poiId": "1",
  "language": "vi",
  "sessionId": "session-uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "eventId": "event-uuid",
    "recorded": true
  }
}
```

---

### 7.2 Dashboard Analytics (Admin)

**Endpoint:** `GET /api/admin/analytics/dashboard`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN

**Query Params:**
- `days` (optional): 7, 30, 90

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPois": 15,
      "totalNarrations": 30,
      "totalQrScans": 1500,
      "totalVisitors": 500,
      "totalAudioPlays": 1200
    },
    "daily": [
      {
        "date": "2026-06-23T00:00:00Z",
        "qrScans": 50,
        "visitors": 40,
        "audioPlays": 100
      }
    ]
  }
}
```

---

## 8. MEDIA UPLOAD ENDPOINTS

### 8.1 Upload Image

**Endpoint:** `POST /api/media/upload`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN, VENDOR

**Content-Type:** `multipart/form-data`

**Request:**
- `file`: Binary image file (JPEG, PNG, WebP)
- `type`: "poi", "stall", "narration"

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "fileId": "1",
    "filename": "poi-1.jpg",
    "mimeType": "image/jpeg",
    "size": 102400,
    "url": "http://localhost:5000/uploads/poi-1.jpg"
  }
}
```

---

### 8.2 Upload Audio

**Endpoint:** `POST /api/media/upload-audio`  
**Port:** 5000  
**Auth Required:** Yes  
**Role Required:** SUPER_ADMIN, ADMIN, VENDOR

**Content-Type:** `multipart/form-data`

**Request:**
- `file`: Binary audio file (MP3, WAV, OGG)
- `contentId`: POI content ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "fileId": "1",
    "filename": "narration-1.mp3",
    "mimeType": "audio/mpeg",
    "duration": 120,
    "url": "http://localhost:5000/uploads/narration-1.mp3"
  }
}
```

---

## 9. ERROR CODES

### Common Error Responses

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Email/password incorrect |
| `AUTH_UNAUTHORIZED` | 401 | Missing or invalid token |
| `AUTH_FORBIDDEN` | 403 | User role not permitted |
| `AUTH_TOKEN_EXPIRED` | 401 | Token has expired |
| `AUTH_WRONG_PORTAL` | 403 | Admin trying to access vendor portal or vice versa |
| `VENDOR_NOT_APPROVED` | 403 | Vendor status not APPROVED |
| `VENDOR_NOT_FOUND` | 404 | Vendor does not exist |
| `POI_NOT_FOUND` | 404 | POI does not exist |
| `QR_EXPIRED` | 400 | QR code has expired |
| `QR_DISABLED` | 400 | QR code is disabled |
| `QR_MAX_SCANS_EXCEEDED` | 400 | QR max scans reached |
| `QR_SCAN_COOLDOWN` | 429 | Too many scans too quickly |
| `FILE_INVALID_TYPE` | 400 | File type not allowed |
| `FILE_TOO_LARGE` | 400 | File exceeds size limit |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 10. STANDARD RESPONSE FORMAT

All endpoints follow this format:

**Success:**
```json
{
  "success": true,
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

---

## 11. AUTHENTICATION HEADERS

All authenticated requests must include:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 12. PAGINATION

List endpoints support pagination:
```
GET /api/endpoint?page=1&limit=20
```

Response includes:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## 13. ENDPOINT SUMMARY BY ROLE

| Endpoint | SUPER_ADMIN | ADMIN | MODERATOR | FINANCE | VENDOR | GUEST |
|----------|:-----------:|:-----:|:---------:|:-------:|:------:|:-----:|
| GET /api/pois | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /api/admin/pois | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| POST /api/admin/vendors/*/approve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| GET /api/vendor/dashboard | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| GET /api/admin/analytics/dashboard | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| POST /api/qr-codes/scan | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /api/admin/qr-codes | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| POST /api/media/upload | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |

---

**Note:** This API contract is a working document. Endpoints will be validated and updated as implementation progresses. Any discrepancies should be immediately documented.

*Last Updated: 2026-06-23 by Audit Team*
