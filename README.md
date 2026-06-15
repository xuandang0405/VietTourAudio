# VietTourAudio

VietTourAudio la ung dung web/PWA thuyet minh du lich theo GPS va QR. Du an gom giao dien khach, API .NET, Admin API Node.js va MySQL.

Nhanh nay khong su dung file `.bat`. Tat ca thanh phan duoc cai dat va khoi dong bang cac lenh ben duoi, nen co the lam viec tren Windows, macOS hoac Linux.

## Thanh phan du an

| Thanh phan | Thu muc | Cong mac dinh |
| --- | --- | --- |
| Frontend React/Vite | `client/` | `5173` |
| API khach .NET | `server/VietTourAudio.Api/` | `5000` |
| Admin API Node.js | `viettour-admin-api/` | `5001` |
| MySQL | `database/` | `3306` |

## Yeu cau

- Git
- Node.js LTS va npm
- .NET SDK 10
- MySQL 8.x
- Docker Desktop (tuy chon, neu muon chay MySQL bang Docker)

Kiem tra nhanh:

```bash
node --version
npm --version
dotnet --version
mysql --version
```

## 1. Lay ma nguon

```bash
git clone https://github.com/xuandang0405/VietTourAudio.git
cd VietTourAudio
git switch project-ready-database-integration
```

## 2. Cai database

### Cach A: MySQL da cai tren may

Mo MySQL client tai thu muc goc cua du an:

```bash
mysql --default-character-set=utf8mb4 -u root -p
```

Sau khi dang nhap, chay:

```sql
SOURCE database/setup-local.sql;
```

Lenh nay se:

- Tao database `viettuoraudio`.
- Tao schema va du lieu mau UTF-8.
- Tao user `viettour_user` cho moi truong local.

Thong tin ket noi local mac dinh:

```text
Database: viettuoraudio
Host: localhost
Port: 3306
User: viettour_user
Password: viettour_password
```

Chi su dung mat khau mac dinh nay cho moi truong phat trien local.

### Cach B: Docker Compose

```bash
docker compose up -d mysql phpmyadmin
```

MySQL chay tai `localhost:3306`. phpMyAdmin chay tai <http://localhost:8080>.

Neu volume MySQL cu da ton tai va can tao lai du lieu mau:

```bash
docker compose down -v
docker compose up -d mysql phpmyadmin
```

Lenh `down -v` xoa du lieu MySQL local trong Docker, chi dung khi chac chan muon reset.

## 3. Cau hinh

Repo co file `.env.example` tai thu muc goc va `viettour-admin-api/.env.example`.

Tao file cau hinh local:

```bash
cp .env.example .env
cp viettour-admin-api/.env.example viettour-admin-api/.env
```

Tren Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item viettour-admin-api/.env.example viettour-admin-api/.env
```

Frontend co the tao `client/.env` nhu sau:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ADMIN_API_BASE_URL=http://localhost:5001/api
VITE_DEFAULT_LANGUAGE=vi
```

Khong commit cac file `.env` chua secret hoac mat khau that.

## 4. Chay API khach

Mo terminal thu nhat:

```bash
cd server/VietTourAudio.Api
dotnet restore
dotnet run --urls http://0.0.0.0:5000
```

Kiem tra:

- Health: <http://localhost:5000/health>
- Swagger: <http://localhost:5000/swagger>
- POI: <http://localhost:5000/api/pois>

## 5. Chay Admin API

Mo terminal thu hai:

```bash
cd viettour-admin-api
npm install
npm run build
npm start
```

Kiem tra health tai <http://localhost:5001/health>.

Tai khoan admin demo:

```text
Email: superadmin@viettouraudio.vn
Password: Admin123
```

Tai khoan nay chi dung cho du lieu phat trien.

## 6. Chay frontend

Mo terminal thu ba:

```bash
cd client
npm install
npm run dev
```

Mo <http://localhost:5173>.

Frontend can ca API khach va Admin API de su dung day du chuc nang.

## Build kiem tra

Frontend:

```bash
cd client
npm run build
```

Backend:

```bash
cd server/VietTourAudio.Api
dotnet build
```

Admin API:

```bash
cd viettour-admin-api
npm run build
```

## Du lieu mau

File `database/seed.sql` tao du lieu phat trien, bao gom:

- 4 tai khoan quan tri.
- 8 vendor.
- 8 sap.
- 15 POI, trong do API khach chi tra cac POI `ACTIVE`.
- Noi dung thuyet minh da ngon ngu, QR, analytics va payment mau.

Trang ban do va trang danh sach khach lay POI/sap tu API va MySQL. Anh minh hoa mac dinh duoc dung khi database chua co media da duyet.

## Cau truc chinh

```text
VietTourAudio/
|-- client/                 # React/Vite frontend
|-- server/                 # .NET API va uploads
|-- viettour-admin-api/     # Admin API Node.js/TypeScript
|-- database/               # schema, seed va setup local
|-- docs/                   # tai lieu bo sung
|-- scripts/                # script Node.js ho tro build/chay frontend
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

## Luu y bao mat

- Doi tat ca mat khau va JWT secret truoc khi deploy.
- Khong dua `.env`, backup database, log, `node_modules`, `bin`, `obj` hoac `dist` len Git.
- Khong dung tai khoan va mat khau demo trong production.
- File media duoc luu tren storage; MySQL chi luu duong dan va metadata.

## Xu ly loi nhanh

- Chu tieng Viet sai: import SQL voi `--default-character-set=utf8mb4` hoac dung `database/setup-local.sql`.
- API khong ket noi MySQL: kiem tra service MySQL, cong `3306` va thong tin trong `.env`/connection string.
- Frontend khong co du lieu: kiem tra <http://localhost:5000/health> va <http://localhost:5000/api/pois>.
- Cong da duoc su dung: dung tien trinh cu hoac doi cong khi khoi dong service.
