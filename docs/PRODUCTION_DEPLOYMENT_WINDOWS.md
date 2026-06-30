# Production HTTPS trên Windows/IIS

Nguồn cấu hình duy nhất là `deployment/production.config.json`. Không sửa trực
tiếp các file `.env.production.*` hoặc `appsettings.Production.json` vì chúng
được sinh lại tự động.

## Trạng thái được xác minh ngày 2026-06-30

- Máy hiện tại là Windows 10 Home 64-bit, build 19045.
- Public IP của máy là `183.81.57.253`.
- Phiên PowerShell hiện tại không có quyền Administrator.
- IIS, ASP.NET Core Module V2, URL Rewrite và win-acme chưa được phát hiện.
- Nameserver có thẩm quyền của `bkpvp.top` là Cloudflare
  (`jocelyn.ns.cloudflare.com`, `micah.ns.cloudflare.com`), không phải DNS tại
  iNET.
- Domain gốc đang bật proxy Cloudflare nên trả về IP Cloudflare; ba subdomain
  `api`, `admin`, `vendor` đang NXDOMAIN.

Vì vậy phải sửa record tại Cloudflare DNS (iNET hiện chỉ là registrar):

| Type | Name | Content | Proxy status |
|---|---|---|---|
| A | `@` | `183.81.57.253` | DNS only |
| A | `api` | `183.81.57.253` | DNS only |
| A | `admin` | `183.81.57.253` | DNS only |
| A | `vendor` | `183.81.57.253` | DNS only |

Chế độ `DNS only` là cần thiết cho phép kiểm tra bắt buộc rằng cả bốn hostname
trả về đúng IP origin. Có thể cân nhắc bật lại proxy sau khi HTTPS origin đã
hoạt động và cấu hình SSL/TLS Cloudflare ở chế độ Full (strict), nhưng lúc đó
kiểm tra DNS sẽ chủ động báo IP Cloudflare.

## Trình tự chạy

1. Mở PowerShell bằng **Run as Administrator**.
2. Bật IIS/WebSocket và cài Hosting Bundle .NET 8, IIS URL Rewrite Module 2,
   win-acme. Script prerequisite nhận đường dẫn tới các installer đã tải từ
   trang chính thức:

   ```powershell
   .\scripts\Install-WindowsHostingPrerequisites.ps1 `
     -HostingBundleInstaller C:\Installers\dotnet-hosting-8.x-win.exe `
     -UrlRewriteInstaller C:\Installers\rewrite_amd64.msi `
     -WinAcmeZip C:\Installers\win-acme.zip
   ```

3. Chờ DNS đúng hoàn toàn:

   ```powershell
   .\scripts\Test-ProductionDns.ps1
   ```

4. Tạo secrets không commit và xoay credential Admin seed:

   ```powershell
   .\scripts\Initialize-ProductionSecrets.ps1
   ```

   Script tạo tài khoản MySQL production chỉ có quyền trên database
   `viettuoraudio`, sinh hai JWT secret khác nhau, xoay mật khẩu Admin mặc định
   và khóa ACL file secrets. File thật đã nằm trong `.gitignore`; mở file cục
   bộ để lấy bootstrap login, không gửi hoặc commit file này.

5. Sinh cấu hình và build/publish:

   ```powershell
   .\scripts\Sync-ProductionConfig.ps1
   .\scripts\Test-CentralProductionConfig.ps1
   .\scripts\Build-Production.ps1
   ```

6. Tạo bốn IIS site, app pool in-process, firewall, xin một SAN certificate
   bao phủ đủ bốn hostname và tạo renewal task:

   ```powershell
   .\scripts\Deploy-ProductionIis.ps1 -CertificateEmail admin@example.com
   ```

7. Kiểm tra từ internet:

   ```powershell
   .\scripts\Test-ProductionDeployment.ps1
   ```

Cuối cùng phải dùng điện thoại thật mở `https://bkpvp.top`, chấp nhận quyền
camera/GPS, quét QR và kiểm tra vị trí; đăng nhập Admin/Vendor tại hai subdomain
tương ứng và kiểm tra Console không có CORS; theo dõi SignalR trong Network >
WS. Đây là các kiểm thử tương tác mà script phía máy chủ không thể thay người
dùng xác nhận.
