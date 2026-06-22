# Cau hinh database dung chung

`database/schema.sql` la schema chuan duy nhat cho ca hai backend.

- API khach .NET: `http://localhost:5000/api`
- Admin API Node.js: `http://localhost:5001/api/admin`
- Frontend: `http://localhost:5173`
- Database: `viettuoraudio` tren MySQL 8.x

Tai khoan database mac dinh trong du an:

```text
user: viettour_user
password: viettour_password
database: viettuoraudio
```

## Tao database moi

Tren Windows co the double-click `CAI_DATABASE.bat` va nhap mat khau root MySQL.

`schema.sql` va `seed.sql` co lenh xoa/reset du lieu. Chi dung voi database dev moi hoac sau khi da backup.

```text
mysql -u root -p < database/schema.sql
mysql -u root -p viettuoraudio < database/seed.sql
```

Neu schema moi tu nhanh `main` da duoc import truoc ban cap nhat nay, chay mot lan:

```text
mysql -u root -p viettuoraudio < database/migrations/20260614-add-media-moderation.sql
```

Khong chay migration tren database vua tao bang `schema.sql`, vi cac cot moderation da co san.

Tai khoan Admin demo:

```text
superadmin@viettouraudio.vn
Admin123
```
