# Hardcode audit

`hardcodes-before.csv` là ảnh chụp đầy đủ trước khi sửa: 358 kết quả gồm URL
runtime, cấu hình development, script local, tài liệu cũ và dữ liệu mock.

`hardcodes-after.csv` là lần quét lại toàn repo nguồn. Các kết quả còn lại chủ
yếu thuộc tài liệu lịch sử, lệnh phát triển local, `launchSettings`,
`appsettings.Development.json`, mock IP, chính file cấu hình trung tâm và các
script kiểm tra giá trị bị cấm. Chúng không được đóng gói làm cấu hình
production.

Tiêu chí chặn release nằm trong `scripts/Test-ProductionHardcodes.ps1`. Script
này quét trực tiếp ba bundle React, API publish, ba file env đã sinh và
`appsettings.Production.json`; build sẽ thất bại nếu còn endpoint loopback có
port, IP server dùng làm URL, custom public port, hoặc dấu vết ngrok. Lần kiểm
tra cuối đã PASS.
