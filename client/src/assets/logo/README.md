# Frontend Logo

Frontend dùng hai file thương hiệu chính:

- `logo.png`: favicon, app icon, navbar icon và loading screen.
- `logo-text.png`: navbar, landing page và footer.

Hai file hiện là placeholder để dự án chạy và hiển thị đúng. Khi có bộ nhận diện chính thức, thay trực tiếp bằng file thật nhưng giữ nguyên tên file để không phải sửa import.

Do workspace Windows hiện có ký tự `#` trong đường dẫn cha, Vite có thể cảnh báo khi bundle ảnh import trực tiếp. Vì vậy bản public đồng bộ cũng nằm ở `client/public/brand/` để runtime hiển thị ổn định.
