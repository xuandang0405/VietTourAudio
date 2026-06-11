# Phan cong Backend cho 3 nguoi

## 1. Hien trang sau khi cap nhat frontend

- Frontend moi nhat: commit `79d5103` (`update frontend`).
- Frontend build thanh cong, 2.068 modules; bundle JS khoang 539 kB.
- Visitor flow moi gom: landing, ban do, danh sach POI, cai dat ngon ngu, GPS, audio/TTS va Premium 24 gio.
- Du lieu POI hien van nam trong `client/src/data/visitorPois.js`.
- Premium va trang thai audio hien luu bang `localStorage`.
- Thanh toan hien chi la QR va nut gia lap thanh cong.
- Backend co route, entity va DTO scaffold, nhung service van tra du lieu demo bang `Task.FromResult`.

## 2. Nguyen tac lam chung truoc khi tach nhanh

1. Mot nguoi tach cac class trong `Services/AppServices.cs` thanh file rieng, khong doi logic.
2. Thong nhat response API: `{ success, message, data, errors }`.
3. Thong nhat role: `ADMIN`, `STALL_OWNER`, `TOURIST`.
4. Dung async EF Core, `CancellationToken`, validation va HTTP status code dung.
5. Moi module phai co it nhat unit test service va integration test endpoint chinh.
6. Khong commit password, JWT key, connection string that hoac file upload.

## 3. Nguoi 1 - Identity, User va Merchant Core

Branch de xuat: `feature/backend-identity-stalls`

### Ownership

- `AuthController`, `UserController`, `StallController`.
- `AuthService`, `UserService`, `StallService`.
- Cau hinh JWT, policy/role va current-user claims.
- EF Core foundation: mapping, migration, seed va transaction convention.
- User, stall va `stall_subscriptions`.

### Cong viec

- Register/login bang MySQL, hash password bang BCrypt hoac Argon2.
- JWT access token, endpoint `/api/auth/me`, role authorization.
- CRUD user can thiet; khoa/mo tai khoan.
- CRUD stall theo owner; approve/suspend chi danh cho admin.
- Quan ly goi dich vu cua chu sap (`stall_subscriptions`).
- Them unique validation cho email va stall slug.
- Bo sung pagination/filter cho danh sach user va stall.

### Endpoint ban giao

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`, `GET /api/users/{id}`
- `GET/POST/PUT /api/stalls`
- `POST /api/stalls/{id}/approve`
- `POST /api/stalls/{id}/suspend`
- `GET/POST /api/stalls/{id}/subscriptions`

### Dieu kien hoan thanh

- Khong con user/stall demo trong service.
- Password khong bao gio tra ve API.
- Owner khong sua duoc stall cua nguoi khac.
- Seed co 1 admin, 1 owner va 1 tourist dung duoc.

## 4. Nguoi 2 - POI, GPS, Content va Media

Branch de xuat: `feature/backend-visitor-content`

### Ownership

- `PoiController`, `PoiContentController`, `MediaController`.
- `PoiService`, `PoiContentService`, `MediaStorageService`, `GeofenceService`.
- POI, noi dung da ngon ngu, anh/audio va truy van nearby.

### Cong viec

- Thay mock `visitorPois` bang API doc tu database.
- CRUD POI va noi dung theo ngon ngu `vi`, `en`, `ja`, `ko`, `zh`.
- Implement nearby/geofence theo latitude, longitude va activation radius.
- Upload anh/audio co validate MIME, size, ten file va quyen owner.
- Tra ve `ttsScript` va `audioFileUrl`; frontend co the dung audio file, fallback TTS.
- Mo rong DTO visitor de dap ung frontend moi.

### Contract visitor de xuat

`GET /api/visitor/pois?latitude=...&longitude=...&radiusMeters=...&language=vi`

Moi POI can tra toi thieu:

- `id`, `name`, `description`, `category`.
- `latitude`, `longitude`, `distanceMeters`, `activationRadius`.
- `imageUrl`, `durationSeconds`, `rating`, `isPremium`.
- `languageCode`, `ttsScript`, `audioFileUrl`.
- `stallId`, `stallName`, `zoneName`, `status`.

### Endpoint ban giao

- `GET /api/pois`
- `GET /api/pois/{id}`
- `GET /api/pois/nearby`
- `POST/PUT/DELETE /api/pois`
- `GET/POST/PUT /api/poi-contents`
- `POST /api/media/upload`
- `GET /api/visitor/pois`
- `GET /api/visitor/pois/{id}`

### Dieu kien hoan thanh

- Ban do frontend lay POI tu API thay vi `visitorPois.js`.
- Ket qua nearby duoc sap xep theo khoang cach.
- Tourist chi thay POI/content `ACTIVE`.
- Upload sai loai hoac qua dung luong bi tu choi.

## 5. Nguoi 3 - QR, Payment, Premium, Analytics va Admin

Branch de xuat: `feature/backend-commerce-analytics`

### Ownership

- `QrCodeController`, `PaymentController`, `AnalyticsController`, `AdminController`.
- `QrTrackingService`, `PaymentService`, `CommissionService`, `AnalyticsService`, `AdminLogService`.
- QR scan, Premium 24 gio, payment sandbox, thong ke va audit log.

### Cong viec

- Tao QR va ghi nhan scan that vao MySQL.
- Payment sandbox co transaction code va webhook idempotency.
- Tao bang moi `premium_entitlements` cho quyen Premium cua tourist/session.
- Premium can ho tro ca user da login va khach an danh bang `session_id`.
- Sau payment thanh cong: cap Premium 24 gio va tra `expiresAt`.
- Ghi visit/audio-play event; tong hop dashboard theo ngay/stall/POI.
- Tinh commission tu payment, khong tinh trung khi webhook goi lai.
- Admin action phai ghi `admin_logs`.

### Endpoint ban giao

- `POST /api/qr-codes`
- `POST /api/qr-codes/scan`
- `POST /api/payments`
- `POST /api/payments/webhook`
- `GET /api/premium/status`
- `POST /api/premium/activate`
- `POST /api/analytics/visit`
- `POST /api/analytics/audio-play`
- `GET /api/analytics/summary`
- `GET /api/admin/dashboard`, `GET /api/admin/logs`

### Dieu kien hoan thanh

- Premium khong con chi luu trong `localStorage`.
- Refresh trang van lay duoc trang thai Premium tu backend.
- Webhook trung lap khong tao payment/commission trung.
- Dashboard doc du lieu that tu event va payment.

## 6. Thu tu lam va merge

### Tuan/Phase 1 - Nen tang

- Nguoi 1: database connection, migration, auth va role.
- Nguoi 2: chot visitor POI DTO va import du lieu mock vao seed.
- Nguoi 3: thiet ke `premium_entitlements`, payment/analytics contract.

### Tuan/Phase 2 - API cot loi

- Nguoi 1: user, stall, subscription.
- Nguoi 2: POI nearby, content da ngon ngu, media.
- Nguoi 3: QR scan, payment sandbox, premium status.

### Tuan/Phase 3 - Tich hop frontend

- Thay `visitorPois.js` bang visitor API.
- Thay Premium local-only bang `/api/premium/status` va payment API.
- Gui visit/audio-play event tu frontend.
- Test tren dien thoai: GPS, audio, QR va offline/online state.

### Thu tu merge de it conflict

1. Merge PR tach `AppServices.cs` va EF foundation.
2. Merge Nguoi 1.
3. Rebase Nguoi 2 va Nguoi 3 tren `main` moi.
4. Merge Nguoi 2.
5. Merge Nguoi 3.
6. Tao mot PR integration chi de noi frontend voi API va sua contract.

## 7. Phan chia khoi luong de xuat

- Nguoi 1: 30% - identity, authorization, user/stall va nen tang DB.
- Nguoi 2: 35% - POI/GPS/content/media, truc tiep phuc vu visitor frontend.
- Nguoi 3: 35% - QR/payment/premium/analytics/admin.

Nguoi 1 nen lam integrator cho cac thay doi dung chung trong `Program.cs`, `AppDbContext` va migration. Nguoi 2 va Nguoi 3 khong sua truc tiep cac file chung neu chua thong nhat contract qua PR.
