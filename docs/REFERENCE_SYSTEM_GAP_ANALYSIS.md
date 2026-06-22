# Doi chieu VietTourAudio voi he thong tham khao Quan 4 Culinary Tourism

## 1. Ket luan ngan

VietTourAudio hop le ve de tai va huong giai phap. Hai he thong cung giai quyet bai toan PWA du lich, POI tren ban do, GPS/geofence, audio thuyet minh, da ngon ngu, owner va admin.

Tuy nhien, VietTourAudio hien tai moi o muc prototype co frontend demo va backend scaffold. He thong chua dat muc offline-first, production-ready hay end-to-end nhu tai lieu tham khao.

Khong can doi VietTourAudio sang FastAPI, MongoDB, Redis hay MapLibre de duoc xem la hop le. .NET 8, MySQL va Leaflet la lua chon phu hop neu nhom mo ta ro scope va hoan thien cac luong cot loi.

## 2. Pham vi tuong dong

| Hang muc | He thong tham khao | VietTourAudio | Danh gia |
|---|---|---|---|
| PWA cho du khach | Co | Co manifest va service worker co ban | Dung huong, chua offline-first |
| Ban do POI | MapLibre GL + Turf.js | Leaflet + React Leaflet | Hop le |
| GPS/nearby | Geofence day du | GPS va tinh khoang cach phia client | Co prototype |
| Audio | Audio pack + TTS pipeline | Browser SpeechSynthesis/TTS | Co demo, chua co pipeline server |
| Da ngon ngu | Content, UI va audio fallback | Language store va narration mock | Co giao dien, chua co backend that |
| Public user | Hoan chinh | Visitor flow moi da co | Dat muc frontend demo |
| Owner | Portal, submission, KPI | Stall controller/dashboard scaffold | Chua hoan chinh |
| Admin | RBAC, CRUD, review, audit | Admin route va log scaffold | Dang phat trien |
| Analytics | Consent, batch, aggregation | DTO/route demo | Chua luu va tong hop that |
| Database | MongoDB/Redis/MinIO | MySQL + local media | Lua chon hop le, chua noi nghiep vu |

## 3. Diem phu hop cua VietTourAudio

- De tai rong hon am thuc Quan 4: co the phuc vu POI du lich, sap hang va khu vuc tai nhieu dia phuong.
- React, Vite, Zustand, Leaflet va PWA phu hop voi ung dung mobile-first.
- ASP.NET Core Web API va MySQL phu hop voi nhom 3 nguoi, de quan ly du lieu quan he nhu user, stall, POI, payment va commission.
- Schema da co cac bang cot loi: users, stalls, POIs, contents, media, QR, visit, play history, payment, commission va admin log.
- Backend da co controller, DTO, JWT scaffold, Swagger, CORS va EF Core context.
- Frontend moi da the hien duoc trai nghiem visitor: landing, map, list, GPS, audio, language, premium va payment demo.

## 4. Khoang trong bat buoc phai hoan thien

### 4.1 Backend va database

- Thay tat ca `Task.FromResult` va du lieu demo bang truy van EF Core/MySQL.
- Login/register that, hash password, current user va role authorization.
- POI, POI content, stall, QR, analytics va payment phai luu database.
- Them migration/seed co the chay lap lai va test duoc.

### 4.2 Frontend va API

- Thay `client/src/data/visitorPois.js` bang API POI/nearby.
- Sua route frontend cho khop backend: `pois`, `payments`, `media`.
- Premium khong chi luu trong localStorage; backend phai tra trang thai va thoi gian het han.
- Payment khong chi co nut gia lap; it nhat can sandbox flow va transaction record.

### 4.3 GPS, audio va ngon ngu

- Co luong trigger POI theo activation radius, debounce va cooldown de tranh phat audio lap.
- Luu audio/narration theo ngon ngu trong database.
- Uu tien audio file; fallback browser TTS khi audio khong co.
- Ghi nhan audio-play va visit event.

### 4.4 PWA/offline

- Dang ky service worker trong frontend runtime.
- Cache app shell va du lieu POI toi thieu.
- Co trang thai offline va fallback khi API khong truy cap duoc.
- Neu scope khong lam offline map/audio pack, phai ghi ro la gioi han cua do an.

### 4.5 Chat luong

- Bo sung unit test cho service va integration test cho API cot loi.
- Bo sung health endpoint cho backend va database.
- Dua secret ra environment variables.
- Validation file upload, MIME type, dung luong va authorization.
- Dong bo API contract giua frontend va backend.

## 5. Tinh nang tham khao co the de sau

Nhung muc sau rat tot nhung khong bat buoc cho ban do an 3 nguoi:

- Redis presence/rate-limit va background coordination.
- MinIO/S3 object storage; local storage du cho demo.
- PMTiles offline map pack va SHA-256 pack lifecycle.
- 50+ ngon ngu, translation on-demand va hotset warmup.
- AI Advisor Gemini.
- Audio task queue co pause/resume/cancel va SSE progress.
- Delta sync bang ETag/dataset version.
- Dynamic RBAC 32 permissions.
- Consent analytics va read-model aggregation phuc tap.

## 6. Scope toi thieu nen cam ket khi bao ve

1. Du khach mo PWA va xem POI tren ban do.
2. App lay GPS, sap xep POI gan va xac dinh khi vao ban kinh kich hoat.
3. App hien noi dung va phat audio/tts theo ngon ngu.
4. Owner dang ky, dang nhap, tao/cap nhat POI va cho admin duyet.
5. Admin quan ly user, owner, stall/POI va xem log/thong ke co ban.
6. QR scan, visit va audio-play duoc ghi vao database.
7. Premium/payment sandbox co transaction va thoi gian het han that.
8. App co offline fallback co ban va khong hien man hinh trang.

Neu hoan thanh duoc tam luong tren, VietTourAudio la mot do an hop le, co luong end-to-end ro rang va du kha nang demo. Neu van giu mock/localStorage va backend scaffold, do an chi nen duoc mo ta la prototype giao dien, chua phai he thong hoan chinh.

## 7. Danh gia hien tai

- Phu hop de tai: cao.
- Phu hop kien truc tong quan: kha.
- Frontend prototype: kha.
- Backend nghiep vu: thap, hien chu yeu la scaffold.
- Offline-first: thap.
- Bao mat, test va production readiness: thap.
- Muc do tuong duong he thong tham khao: khoang 35-45% ve implementation, nhung 75-85% ve y tuong/pham vi cot loi.

Ty le tren la uoc luong ky thuat de lap ke hoach, khong phai diem hoc vu.
