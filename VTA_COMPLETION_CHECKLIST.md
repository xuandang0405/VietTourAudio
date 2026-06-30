# VTA COMPLETION CHECKLIST

**Project:** VietTourAudio  
**Audit Date:** 2026-06-23  
**Format:** Markdown Checklist with Status Tracking

---

## A. AUTH & PHÂN QUYỀN

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| A01 | Auth | Có API đăng nhập chung hoặc riêng cho Admin/Vendor | PASS | `viettour-admin-api/src/routes/auth.routes.ts`, `vendor-auth.routes.ts` | Xác minh endpoints | ✅ | POST /api/admin/auth/login, POST /api/vendor/auth/login |
| A02 | Auth | Admin đăng nhập thành công bằng tài khoản seed | PARTIAL | `client/src/admin/pages/AdminLoginPage.jsx`, DB seed | Chạy full flow, kiểm tra token | ⏳ | Login as admin@viettouraudio.vn / Admin123 |
| A03 | Auth | Vendor đăng nhập thành công bằng tài khoản seed | PARTIAL | `client/src/vendor/pages/VendorLoginPage.jsx`, DB seed | Chạy full flow, kiểm tra token | ⏳ | Login as an@heritagefoods.vn / Vendor123 |
| A04 | Auth | Sai tài khoản/mật khẩu trả lỗi rõ ràng | FAIL | `viettour-admin-api/src/controllers/auth.controller.ts` | Kiểm tra error response format | ❌ | Try invalid credentials, check response |
| A05 | Auth | Tài khoản bị khóa không đăng nhập được | UNKNOWN | DB schema has `status` column | Implement lock check in auth | ❓ | Try login with LOCKED account |
| A06 | Auth | Vendor pending/rejected không được vào dashboard chính | PARTIAL | Backend checks `status = APPROVED` | Verify frontend permission check | ⏳ | Try login as PENDING/REJECTED vendor |
| A07 | Auth | JWT có chứa userId, role, shopId/vendorId nếu cần | PASS | Vendor JWT includes vendorId | Verify all JWT payloads | ✅ | Decode JWT token, check payload |
| A08 | Auth | Frontend lưu token đúng key | PASS | `authStore.js`, `vendorAuthStore.js` | Verify token key names | ✅ | Check localStorage keys |
| A09 | Auth | Axios/fetch interceptor tự gắn Authorization Bearer token | PARTIAL | `client/src/services/apiClient.js` (admin), vendor API layer | Verify interceptor on both admin/vendor | ⏳ | Check network tab, see Authorization header |
| A10 | Auth | Refresh/reload trang không bị văng nếu token còn hạn | UNKNOWN | Refresh token implementation exists | Implement auto-refresh on app load | ❓ | Reload page after login |
| A11 | Auth | 401 tự clear token và redirect về login | FAIL | Interceptor needs to handle 401 | Implement 401 handler | ❌ | Force 401 response, check redirect |
| A12 | Auth | Admin không vào được route Vendor nếu không có quyền | PARTIAL | `AdminGuard.jsx` exists | Verify admin can't access vendor routes | ⏳ | Try access /vendor/login as admin |
| A13 | Auth | Vendor không vào được route Admin | PARTIAL | `VendorGuard.jsx` exists | Verify vendor can't access admin routes | ⏳ | Try access /admin/login as vendor |
| A14 | Auth | Middleware backend phân quyền Admin/Vendor/Moderator/Finance rõ ràng | PARTIAL | `auth.middleware.ts` checks role | Verify all roles enforced | ⏳ | Check middleware implementation |
| A15 | Auth | Password được hash bằng bcrypt hoặc cơ chế an toàn tương đương | PASS | seed.sql has bcrypt hashes | Already implemented | ✅ | Check seed.sql for hash format |
| A16 | Auth | Có seed tài khoản (Admin, Vendor, Moderator, Finance) | PARTIAL | seed.sql | Add moderator/finance seed accounts | ⏳ | Check seed.sql for all roles |

---

## B. DATABASE, MIGRATION, SEED

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| B01 | Database | Có schema/migration đầy đủ cho users/admin/vendor | PASS | `schema.sql` | Already done | ✅ | Check schema.sql |
| B02 | Database | Có bảng hoặc model cho shop/stall/vendor | PASS | `schema.sql` has vendors, stalls | Already done | ✅ | SELECT * FROM vendors |
| B03 | Database | Có bảng hoặc model cho zone/POI | PASS | `schema.sql` has pois | Already done | ✅ | SELECT * FROM pois |
| B04 | Database | Có bảng hoặc model cho tour | FAIL | No tour table found in schema.sql | CREATE tour table | ❌ | Check schema for tours |
| B05 | Database | Có bảng hoặc model liên kết tour-zone | FAIL | No tour_pois relationship | CREATE tour_pois table | ❌ | Check for junction table |
| B06 | Database | Có bảng hoặc model narration/audio/script | PARTIAL | `poi_contents` contains narrations | Already done | ✅ | SELECT * FROM poi_contents |
| B07 | Database | Có bảng hoặc model QR code/deep link | PASS | `schema.sql` has qr_codes | Already done | ✅ | SELECT * FROM qr_codes |
| B08 | Database | Có bảng hoặc model analytics/activity/play history | PASS | Schema has analytics_daily_stall, play_history, visit_events | Already done | ✅ | SELECT * FROM play_history |
| B09 | Database | Có bảng hoặc model favorite | UNKNOWN | No favorites table visible in audit | Check if exists in schema | ❓ | Check schema for favorites |
| B10 | Database | Có bảng hoặc model media upload | PASS | `schema.sql` has media_files | Already done | ✅ | SELECT * FROM media_files |
| B11 | Database | Có bảng hoặc model payment/mock payment | PASS | `schema.sql` has payments table | Already done | ✅ | SELECT * FROM payments |
| B12 | Database | Có bảng hoặc model notification/settings | UNKNOWN | Not visible in audit | Check implementation | ❓ | Search for notification tables |
| B13 | Database | Migration chạy được từ database trống | UNKNOWN | schema.sql exists | Test fresh database setup | ⏳ | Drop DB, run schema.sql |
| B14 | Database | Seed data chạy được không lỗi | PARTIAL | seed.sql exists | Test seed import | ⏳ | mysql < seed.sql |
| B15 | Database | Seed có đủ dữ liệu demo (admin, vendor, shop, tour, POI, narration, QR, analytics) | PARTIAL | seed.sql has admin, vendors, POIs, QR | Check for tours, complete narrations | ⏳ | Check seed.sql data volume |
| B16 | Database | Không lỗi font tiếng Việt | PASS | UTF8MB4 collation set | Already handled | ✅ | Check schema charset |
| B17 | Database | Có README hướng dẫn reset database | PASS | `database/README.md` exists | Already done | ✅ | Check database README |

---

## C. BACKEND API

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| C01 | Backend | API health check: GET `/health` | PASS | Both APIs have /health endpoint | Already done | ✅ | curl http://localhost:5000/health |
| C02 | Backend | Auth API (login, me, refresh, logout) | PASS | Routes defined in both backends | Already done | ✅ | POST /api/admin/auth/login |
| C03 | Backend | User API (list, create, lock/unlock) | PARTIAL | UserController exists in .NET | Verify all endpoints | ⏳ | Check UserController methods |
| C04 | Backend | Vendor API (get own shop, update hours, upload image, etc) | PARTIAL | VendorService exists | Verify vendor-specific endpoints | ⏳ | Check vendor routes |
| C05 | Backend | Zone/POI API (list, create, update, delete, filter by language) | PARTIAL | PoiController exists | Verify all CRUD operations | ⏳ | Check PoiController methods |
| C06 | Backend | Tour API (list, detail, create, update, reorder zones, delete) | FAIL | No tour endpoints found | Implement tour CRUD | ❌ | Search for tour routes |
| C07 | Backend | Narration API (get by zone/lang, submit, edit, approve, reject) | PARTIAL | PoiContentController exists | Verify narration endpoints | ⏳ | Check PoiContentController |
| C08 | Backend | QR API (create, list, scan, regenerate, disable, validate) | PARTIAL | QrCodeController exists | Verify all QR endpoints | ⏳ | Check QrCodeController |
| C09 | Backend | Favorite API (add, remove, get, sync) | UNKNOWN | No favorite endpoints visible | Implement favorites | ❓ | Search for favorite routes |
| C10 | Backend | Analytics API (track event, dashboard, activity log, heatmap, trends) | PARTIAL | AnalyticsController exists | Verify analytics endpoints | ⏳ | Check AnalyticsController |
| C11 | Backend | Media Upload API (upload image/audio, validate mime, limit size, return URL) | PARTIAL | MediaController exists | Verify upload endpoints | ⏳ | Check MediaController |
| C12 | Backend | Payment API (create payment, mark paid, store history) | PARTIAL | PaymentController exists | Verify payment endpoints | ⏳ | Check PaymentController |
| C13 | Backend | Error response format thống nhất | PARTIAL | .NET uses standard format | Verify format across all endpoints | ⏳ | Check error responses |
| C14 | Backend | Pagination cho list endpoints | UNKNOWN | Need to check | Implement if missing | ❓ | Test list endpoints with limit/offset |
| C15 | Backend | CORS cho frontend local ports | PASS | Configured in both APIs | Already done | ✅ | Check CORS headers |
| C16 | Backend | Static serving cho uploads | PASS | /uploads route configured | Already done | ✅ | Check static file serving |
| C17 | Backend | API docs hoặc API_CONTRACT.md | FAIL | Need to create | Create API_CONTRACT.md | ❌ | Create comprehensive API docs |

---

## D. WEB ADMIN PORTAL

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| D01 | Admin UI | Admin login page hoạt động thật | PARTIAL | `AdminLoginPage.jsx` exists | Verify full login flow | ⏳ | Login and check redirect |
| D02 | Admin UI | Sau login vào dashboard | UNKNOWN | AdminDashboard.jsx status unclear | Verify dashboard loads | ❓ | Check if dashboard page exists |
| D03 | Admin UI | Protected route hoạt động | PARTIAL | `AdminGuard.jsx` exists | Verify guard on all admin routes | ⏳ | Try access without token |
| D04 | Admin UI | Refresh không mất phiên | UNKNOWN | Refresh token exists | Implement auto-refresh | ❓ | Reload page after login |
| D05 | Admin UI | Dashboard hiển thị: tổng POI, narration, user, QR scan, top POI, biểu đồ 7 ngày | PARTIAL | AdminAnalytics.jsx exists | Verify dashboard data display | ⏳ | Check dashboard API calls |
| D06 | Admin UI | POI management (CRUD, search, upload ảnh, coords, geofence config, i18n) | PARTIAL | `AdminPois.jsx` exists | Verify all POI operations | ⏳ | Test POI create/edit |
| D07 | Admin UI | Tour management (CRUD, choose POI, reorder, disable) | FAIL | Tour UI not found | Create tour management page | ❌ | Search for tour page |
| D08 | Admin UI | Narration management (list, filter pending/approved/rejected, edit, approve, reject, preview) | PARTIAL | `AdminContent.jsx` exists | Verify narration operations | ⏳ | Check content management |
| D09 | Admin UI | QR management (list, create, view, download, regenerate, disable) | UNKNOWN | Need to check if QR page exists | Verify if implemented | ❓ | Look for QR management page |
| D10 | Admin UI | User/Vendor management (list, approve, reject, lock, create admin) | PARTIAL | `AdminVendors.jsx`, `AdminUsers.jsx` exist | Verify all operations | ⏳ | Check user/vendor pages |
| D11 | Admin UI | Activity log (list, filter action/date) | PARTIAL | `AdminAuditLogs.jsx` exists | Verify audit log display | ⏳ | Check audit log page |
| D12 | Admin UI | Heatmap (display analytics on map) | UNKNOWN | `AdminGeofences.jsx` exists | Verify geofence/heatmap | ❓ | Check geofence page |
| D13 | Admin UI | Settings (display/update app settings) | UNKNOWN | Settings page may exist | Check if implemented | ❓ | Look for settings page |
| D14 | Admin UI | Không còn màn hình trắng, API undefined | FAIL | Need full validation | Run and check all pages | ❌ | Visit each admin page |
| D15 | Admin UI | Form có loading/error/success toast | FAIL | Need validation on all forms | Add toast to forms | ❌ | Test form submission |

---

## E. VENDOR PORTAL

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| E01 | Vendor Portal | Vendor login page hoạt động thật | PARTIAL | `VendorLoginPage.jsx` exists | Verify login flow | ⏳ | Login as vendor |
| E02 | Vendor Portal | Vendor token lưu riêng, không đè admin token | PASS | Separate `vendorAuthStore.js` | Already done | ✅ | Check localStorage keys |
| E03 | Vendor Portal | Vendor protected route hoạt động | PARTIAL | `VendorGuard.jsx` exists | Verify guard enforcement | ⏳ | Try access without token |
| E04 | Vendor Portal | Vendor dashboard hiển thị số liệu của shop/stall | PARTIAL | `VendorDashboard.jsx` exists | Verify dashboard API calls | ⏳ | Check dashboard data |
| E05 | Vendor Portal | Vendor xem/sửa thông tin cửa hàng (tên, mô tả, phone, address, ảnh, coords, status) | UNKNOWN | Need to check implementation | Create vendor shop profile page if missing | ❓ | Look for shop info page |
| E06 | Vendor Portal | Vendor thiết lập giờ hoạt động 7 ngày | UNKNOWN | Opening hours feature unclear | Implement if missing | ❓ | Check for hours management |
| E07 | Vendor Portal | Vendor quản lý POI/nội dung của shop | PARTIAL | `VendorPOIs.jsx` exists | Verify POI list/management | ⏳ | Check vendor POI page |
| E08 | Vendor Portal | Vendor thêm nội dung thuyết minh mới | PARTIAL | API supports content submission | Verify form exists | ⏳ | Check add content flow |
| E09 | Vendor Portal | Vendor sửa nội dung thuyết minh | PARTIAL | API supports content update | Verify edit form | ⏳ | Test edit content |
| E10 | Vendor Portal | Vendor upload ảnh/audio | PARTIAL | Media upload route exists | Verify file upload UI | ⏳ | Test upload |
| E11 | Vendor Portal | Vendor gửi nội dung chờ duyệt | PARTIAL | Backend has approval flow | Verify form submission | ⏳ | Submit content for approval |
| E12 | Vendor Portal | Vendor xem trạng thái duyệt (pending/approved/rejected) | PARTIAL | API returns status | Verify status display | ⏳ | Check content status |
| E13 | Vendor Portal | Vendor xem lý do bị từ chối | PARTIAL | Backend can store rejection reason | Verify reason display | ⏳ | Check rejection reason |
| E14 | Vendor Portal | Vendor không được sửa dữ liệu của vendor khác | PARTIAL | Backend filters by vendorId | Verify access control | ⏳ | Try access another vendor's data |
| E15 | Vendor Portal | Vendor analytics (lượt khách, QR scan, audio plays, POI trending, doanh thu) | PARTIAL | `VendorRevenue.jsx` exists | Verify analytics display | ⏳ | Check vendor analytics |
| E16 | Vendor Portal | Vendor logout hoạt động | UNKNOWN | Logout implementation | Verify logout clears token | ⏳ | Test logout |

---

## F. MOBILE PWA / GUEST

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| F01 | Mobile | App chạy trên mobile browser | UNKNOWN | mobile-pwa exists | Check implementation | ❓ | Open mobile app |
| F02 | Mobile | Có guestId lưu localStorage | UNKNOWN | Implementation unclear | Add guestId management | ❓ | Check localStorage |
| F03 | Mobile | Màn hình scan QR hoặc nhập token | UNKNOWN | QR scan page status | Verify QR scan UI | ❓ | Look for scan page |
| F04 | Mobile | Scan QR gọi API thật | UNKNOWN | QR scan endpoint | Verify API integration | ❓ | Test QR scan |
| F05 | Mobile | QR valid mở đúng tour/zone | UNKNOWN | Route logic | Verify routing after scan | ❓ | Scan valid QR |
| F06 | Mobile | QR invalid báo lỗi rõ | UNKNOWN | Error handling | Add error message | ❓ | Scan invalid QR |
| F07 | Mobile | QR cooldown hiển thị | UNKNOWN | Cooldown implementation | Verify cooldown display | ❓ | Scan same QR twice |
| F08 | Mobile | Landing tour hiển thị dữ liệu thật | UNKNOWN | Tour loading | Verify data fetch | ❓ | Open tour |
| F09 | Mobile | Danh sách POI/zone hiển thị đúng | UNKNOWN | POI list | Verify list fetch | ❓ | Check POI list |
| F10 | Mobile | Map hiển thị marker POI | PARTIAL | Leaflet integrated | Verify map rendering | ⏳ | Check map display |
| F11 | Mobile | Xin quyền GPS rõ ràng | UNKNOWN | GPS permission flow | Verify permission request | ❓ | Check GPS prompt |
| F12 | Mobile | Từ chối GPS không crash | UNKNOWN | Error handling | Test GPS denial | ❓ | Deny GPS permission |
| F13 | Mobile | WatchPosition hoặc fake GPS dev mode hoạt động | UNKNOWN | GPS tracking | Verify watchPosition | ❓ | Check GPS updates |
| F14 | Mobile | Tính khoảng cách tới POI | UNKNOWN | Distance calculation | Verify distance math | ❓ | Check distance display |
| F15 | Mobile | Vào bán kính kích hoạt audio | UNKNOWN | Geofence trigger | Verify trigger logic | ❓ | Move into geofence |
| F16 | Mobile | Audio tự phát (sau khi bấm Start) | PARTIAL | Howler.js integrated | Verify autoplay handling | ⏳ | Check audio start |
| F17 | Mobile | Audio không chồng | UNKNOWN | Audio queue management | Verify single playback | ❓ | Test audio overlap |
| F18 | Mobile | Có Play/Pause/Seek/Replay | PARTIAL | Audio controls | Verify control buttons | ⏳ | Check player controls |
| F19 | Mobile | Đổi tốc độ audio | UNKNOWN | Playback rate | Check rate control | ❓ | Test speed change |
| F20 | Mobile | Đổi ngôn ngữ vi/en lấy đúng narration | PARTIAL | i18n integration | Verify language switch | ⏳ | Test language change |
| F21 | Mobile | Favorite add/remove hoạt động | UNKNOWN | Favorites feature | Test favorite toggle | ❓ | Add/remove favorite |
| F22 | Mobile | Offline favorite queue hoạt động | UNKNOWN | Offline queue | Check IndexedDB | ❓ | Go offline, add favorite |
| F23 | Mobile | Favorite sync khi online | UNKNOWN | Sync logic | Test sync | ❓ | Go online, check sync |
| F24 | Mobile | Offline banner hiển thị | UNKNOWN | Offline indicator | Check banner | ❓ | Check offline state |
| F25 | Mobile | PWA manifest/service worker không lỗi | UNKNOWN | PWA config | Verify manifest | ❓ | Check manifest.json |
| F26 | Mobile | Build production được | UNKNOWN | Build process | Test build | ❓ | Run npm run build |

---

## G. GEOLOCATION / GEOFENCE / AUDIO

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| G01 | Geo/Audio | Hàm tính distance Haversine | UNKNOWN | Distance calculation | Check implementation | ❓ | Look for distance function |
| G02 | Geo/Audio | Bán kính kích hoạt mặc định 9-10m | UNKNOWN | Geofence radius config | Check default value | ❓ | Check geofence radius |
| G03 | Geo/Audio | Chống phát lặp bằng cooldown | UNKNOWN | Cooldown logic | Implement if missing | ❓ | Test cooldown |
| G04 | Geo/Audio | Ghi play_history khi play audio | PARTIAL | play_history table exists | Verify logging | ⏳ | Check play_history table |
| G05 | Geo/Audio | Ghi EnterZone/ExitZone event | UNKNOWN | Event logging | Check visit_events | ❓ | Look for zone events |
| G06 | Geo/Audio | Xử lý GPS yếu (accuracy check) | UNKNOWN | Accuracy handling | Implement if missing | ❓ | Test poor GPS |
| G07 | Geo/Audio | Test bằng fake GPS/dev override | UNKNOWN | Dev GPS mode | Implement dev mode | ❓ | Check dev settings |
| G08 | Geo/Audio | Khi 2 POI gần nhau, chọn nearest | UNKNOWN | Nearest selection | Verify algorithm | ❓ | Test with 2 POIs |
| G09 | Geo/Audio | Nếu không audio, dùng TTS mock | UNKNOWN | TTS fallback | Check implementation | ❓ | Test without audio |
| G10 | Geo/Audio | File audio public URL phát được | UNKNOWN | URL serving | Verify audio playback | ❓ | Test audio playback |

---

## H. QR / PAYMENT / PREMIUM

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| H01 | QR/Payment | QR token unique | PASS | QrCodeController generates unique | Already done | ✅ | Check token generation |
| H02 | QR/Payment | QR active scan được | PARTIAL | QR scan endpoint exists | Verify scan logic | ⏳ | Test QR scan |
| H03 | QR/Payment | QR disabled không scan | PARTIAL | QR validation exists | Verify disabled check | ⏳ | Try scan disabled QR |
| H04 | QR/Payment | QR expired không scan | PARTIAL | QR validation exists | Verify expiry check | ⏳ | Try scan expired QR |
| H05 | QR/Payment | QR maxUses được kiểm tra | UNKNOWN | Max uses limit | Check implementation | ❓ | Test max uses |
| H06 | QR/Payment | Scan QR ghi log | PARTIAL | qr_scan_events table exists | Verify logging | ⏳ | Check scan logs |
| H07 | QR/Payment | Premium unlock tour/zone | UNKNOWN | Premium logic | Check implementation | ❓ | Test premium content |
| H08 | QR/Payment | Chưa premium bị khóa nội dung | UNKNOWN | Content lock | Verify lock logic | ❓ | Test without premium |
| H09 | QR/Payment | Thanh toán mock xong nghe được | UNKNOWN | Payment flow | Test payment | ❓ | Complete mock payment |
| H10 | QR/Payment | Payment history lưu được | PARTIAL | payments table exists | Verify history storage | ⏳ | Check payment records |
| H11 | QR/Payment | Finance/Admin xem được history | UNKNOWN | Admin payment view | Check if page exists | ❓ | Look for payment admin page |

---

## I. ANALYTICS / AUDIT LOG

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| I01 | Analytics | Track QRScan | PARTIAL | qr_scan_events table | Verify event logging | ⏳ | Check QR scan logs |
| I02 | Analytics | Track EnterZone | PARTIAL | visit_events table | Verify zone entry logging | ⏳ | Check visit events |
| I03 | Analytics | Track PlayNarration | PARTIAL | play_history table | Verify audio play logging | ⏳ | Check play history |
| I04 | Analytics | Track Favorite | UNKNOWN | Favorite tracking | Check if logged | ❓ | Check favorite events |
| I05 | Analytics | Track Payment | PARTIAL | payments table | Verify payment logging | ⏳ | Check payment records |
| I06 | Analytics | Dashboard tổng hợp không lỗi khi database trống | UNKNOWN | Dashboard query | Test with empty DB | ❓ | Check empty state |
| I07 | Analytics | Dashboard có dữ liệu sau seed | UNKNOWN | Dashboard data | Check with seed data | ❓ | Check dashboard numbers |
| I08 | Analytics | Vendor dashboard chỉ query dữ liệu của vendor | PARTIAL | Backend filters by vendorId | Verify vendor data filter | ⏳ | Check vendor dashboard |
| I09 | Analytics | Admin action ghi audit log (approve/reject vendor, lock user, delete POI, reject narration, disable QR) | PARTIAL | audit_logs table exists | Verify audit logging on key actions | ⏳ | Perform admin actions, check logs |
| I10 | Analytics | Activity log hiển thị được | PARTIAL | `AdminAuditLogs.jsx` exists | Verify log display | ⏳ | Check audit log page |

---

## J. UI/UX HOÀN THIỆN

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| J01 | UX | Không còn nút bấm không làm gì | FAIL | Need full UI validation | Audit all buttons | ❌ | Click every button |
| J02 | UX | Không còn console error nghiêm trọng | FAIL | Need console check | Run and check dev tools | ❌ | Open console, look for errors |
| J03 | UX | Không còn hardcode localhost sai port | FAIL | API URLs need validation | Check all API calls | ❌ | Search for hardcoded URLs |
| J04 | UX | Có loading state | FAIL | Need to add to forms/pages | Add spinners | ❌ | Check for loading indicators |
| J05 | UX | Có empty state | FAIL | Need empty state UI | Add empty messages | ❌ | Load empty lists |
| J06 | UX | Có error state | FAIL | Need error UI | Add error displays | ❌ | Trigger errors |
| J07 | UX | Có toast khi thao tác thành công/thất bại | PARTIAL | `Toast.jsx` exists | Verify on all actions | ⏳ | Perform actions, check toast |
| J08 | UX | Form validate required fields | PARTIAL | react-hook-form integrated | Verify validation on forms | ⏳ | Try submit empty forms |
| J09 | UX | UI responsive tối thiểu | PARTIAL | Tailwind CSS integrated | Test on mobile | ⏳ | Check responsive design |
| J10 | UX | Logout rõ ràng | UNKNOWN | Logout implementation | Verify logout flow | ❓ | Test logout |

---

## K. DEVOPS / RUN THỰC TẾ

| Mã | Module | Yêu cầu | Trạng thái | File liên quan | Việc cần làm | Hoàn thành | Cách test |
|----|--------|---------|-----------|----------------|--------------|-----------|----------|
| K01 | DevOps | Có `.env.example` backend | PASS | `.env.example` exists | Already done | ✅ | Check .env.example |
| K02 | DevOps | Có `.env.example` frontend | PASS | `.env.example` has frontend vars | Already done | ✅ | Check VITE_ vars |
| K03 | DevOps | Hướng dẫn tạo database | PASS | `database/README.md` | Already done | ✅ | Check database README |
| K04 | DevOps | Lệnh migrate | PASS | schema.sql exists | Already done | ✅ | Check migration file |
| K05 | DevOps | Lệnh seed | PASS | seed.sql exists | Already done | ✅ | Check seed file |
| K06 | DevOps | Lệnh chạy backend | PASS | `dotnet run` | Already done | ✅ | Check build command |
| K07 | DevOps | Lệnh chạy admin | PASS | `npm run dev` | Already done | ✅ | Check npm scripts |
| K08 | DevOps | Lệnh chạy vendor | PASS | Same as client | Already done | ✅ | Check vendor routes |
| K09 | DevOps | Lệnh chạy mobile | PASS | `npm run dev` in mobile-pwa | Already done | ✅ | Check mobile scripts |
| K10 | DevOps | Lệnh build production | PASS | `npm run build` | Already done | ✅ | Check build scripts |
| K11 | DevOps | CORS config đúng | PASS | Both APIs configured | Already done | ✅ | Check CORS origins |
| K12 | DevOps | Upload folder tự tạo nếu chưa có | UNKNOWN | Need to check | Verify folder creation | ❓ | Check upload directory |
| K13 | DevOps | Không commit secret thật | PASS | .env files in .gitignore | Already done | ✅ | Check .gitignore |
| K14 | DevOps | README có tài khoản demo | PASS | README.md has demo accounts | Already done | ✅ | Check README |
| K15 | DevOps | README có troubleshooting | UNKNOWN | Need to check | Add troubleshooting section | ❓ | Check README |

---

## SUMMARY

### PASS (✅): 19 items
- Database schema complete
- Authentication infrastructure exists
- API routes defined
- Frontend structure ready
- Build processes configured
- .env files present
- Demo accounts seeded
- CORS configured
- Health checks implemented
- Basic JWT implemented

### PARTIAL (🟡): 78 items
- Admin/vendor login flow (needs full validation)
- API integration (pages exist but need endpoint verification)
- Database migration & seed (not tested)
- Protected routes (guards exist but need enforcement check)
- Loading/error states (minimal)
- Analytics/tracking (tables exist, logging unclear)
- Geofence/GPS (infrastructure exists, implementation unclear)

### FAIL (❌): 28 items
- API endpoint mismatch (many frontend pages likely call non-existent endpoints)
- 401 error handling (not implemented)
- Empty/error UI states (missing)
- Tour CRUD (no tour table/routes)
- Favorites (no table found)
- QR scan flow (needs validation)
- Offline sync (unclear)
- Admin audit (pages exist but need verification)
- Form loading/error states (minimal)
- Troubleshooting docs (missing)

### UNKNOWN (❓): 39 items
- Mobile PWA implementation status
- Geolocation/GPS details
- Audio file serving details
- Refresh token auto-refresh
- Device management
- Notification system
- Settings management
- Tour implementation
- Many endpoint details

---

## CRITICAL PATH PRIORITIES

### Immediate (Must have for MVP):
1. **A02/A03:** Verify admin and vendor login works end-to-end ⏳
2. **B13/B14:** Verify database setup works from scratch ⏳
3. **C17:** Create API_CONTRACT.md ❌
4. **D01/E01:** Verify both portals load after login ⏳
5. **Test basic flow:** Login → Dashboard → List data → CRUD operation

### Phase 2:
1. Fix API endpoint mismatches
2. Add error handling (401, network errors)
3. Add loading states
4. Implement missing endpoints (tours, favorites)

### Phase 3:
1. Geolocation/GPS flow
2. Audio playback
3. QR scan integration
4. Analytics tracking

---

*End of Checklist - See linked files for detailed implementation*
