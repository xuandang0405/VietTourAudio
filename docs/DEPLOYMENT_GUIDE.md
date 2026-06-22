# Deployment Guide

## Mục tiêu

Triển khai VietTourAudio gồm React static build, .NET Web API, MySQL `viettuoraudio`, Nginx và HTTPS.

## Build frontend

```bash
cd client
npm install
npm run build
```

Copy `client/dist/` lên server hoặc để Nginx phục vụ trực tiếp.

## Publish backend

```bash
cd server/VietTourAudio.Api
dotnet restore
dotnet publish -c Release -o ../publish
```

## Database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p viettuoraudio < database/seed.sql
```

Production nên tạo user riêng:

```sql
CREATE USER 'viettour_prod'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON viettuoraudio.* TO 'viettour_prod'@'localhost';
FLUSH PRIVILEGES;
```

## Nginx gợi ý

```nginx
server {
  listen 80;
  server_name your-domain.com;

  root /var/www/viettouraudio/client;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:5000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## HTTPS

```bash
sudo certbot --nginx -d your-domain.com
```

## Backup MySQL

```bash
mysqldump -u root -p viettuoraudio > backup-viettuoraudio.sql
```

## Lưu ý production

- Không dùng JWT key trong `appsettings.json` dev.
- Không public thư mục upload nếu chưa kiểm soát file type.
- Cấu hình CORS theo domain thật.
- Bật log và monitoring.
- Test payment sandbox trước khi mở payment thật.
