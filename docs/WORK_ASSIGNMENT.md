# Work Assignment

| Người | Vai trò | Công việc | Folder phụ trách |
|------|---------|-----------|------------------|
| Người 1 | Frontend Developer | Thiết kế UI React, landing page, map page, dashboard chủ sạp, admin dashboard, tích hợp logo | client/ |
| Người 2 | Backend .NET Developer | API C#, auth, user, stall, POI, QR, payment, upload, analytics | server/ |
| Người 3 | Database + DevOps + Tester | MySQL schema, seed data, docs, deploy, test GPS/QR/payment | database/, docs/, scripts/ |

## Phase đề xuất

| Phase | Người 1 | Người 2 | Người 3 |
|-------|---------|---------|---------|
| 1. Foundation | Hoàn thiện responsive UI | Kết nối service với MySQL | Import schema/seed, kiểm tra Docker |
| 2. Auth | Login/register UI | JWT thật, hash password, role | Seed account và test phân quyền |
| 3. Map/GPS | Map page và audio player | API nearby/geofence | Test GPS giả lập và spatial query |
| 4. Stall | Dashboard chủ sạp | Stall, subscription, upload | Test số liệu dashboard |
| 5. Admin | Admin dashboard | API quản trị, admin logs | Test quyền admin và backup |
| 6. Payment/QR | UI payment/premium | Webhook, QR tracking, commission | Test sandbox payment |
| 7. Deploy | Build frontend | Publish backend | Ubuntu, Nginx, HTTPS, backup |
