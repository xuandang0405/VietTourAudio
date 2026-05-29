# Backend .NET/C# Guide

Backend .NET/C# là phần chính của VietTourAudio. Project hiện nằm ở `server/VietTourAudio.Api/`, namespace code là `VietTourAudio.Api`.

## Mở project

### Visual Studio

1. Mở Visual Studio.
2. Chọn `Open a project or solution`.
3. Chọn file `server/VietTourAudio.Api/VietTourAudio.Api.csproj`.
4. Restore NuGet nếu Visual Studio hỏi.
5. Chạy profile mặc định hoặc dùng terminal `dotnet run`.

### Rider

1. Chọn `Open`.
2. Trỏ tới thư mục `server/VietTourAudio.Api`.
3. Rider sẽ nhận diện `.csproj`.
4. Restore package và chạy project.

### VS Code

1. Mở root repo `VietTourAudio`.
2. Cài extension C# Dev Kit nếu cần.
3. Mở terminal:

```bash
cd server/VietTourAudio.Api
dotnet restore
dotnet run
```

## Restore package

```bash
cd server/VietTourAudio.Api
dotnet restore
```

Package chính:

- `Microsoft.AspNetCore.Authentication.JwtBearer`
- `Pomelo.EntityFrameworkCore.MySql`
- `Microsoft.EntityFrameworkCore.Design`
- `NetTopologySuite`
- `Swashbuckle.AspNetCore`

## Cấu hình appsettings.json

File:

```text
server/VietTourAudio.Api/appsettings.json
```

Connection string bắt buộc dùng database `viettuoraudio`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;database=viettuoraudio;user=root;password=your_password;"
  }
}
```

JWT:

```json
{
  "Jwt": {
    "Issuer": "VietTourAudio",
    "Audience": "VietTourAudioClient",
    "Key": "replace-with-secure-key-at-least-32-characters",
    "ExpiresMinutes": 120
  }
}
```

Production không commit secret vào Git. Dùng biến môi trường:

```bash
ConnectionStrings__DefaultConnection="server=localhost;port=3306;database=viettuoraudio;user=prod_user;password=secret;"
Jwt__Key="real-production-secret"
```

## Chạy migration

Hiện dự án ưu tiên SQL thủ công trong `database/schema.sql`. Chưa có EF Core migration production.

Nếu team muốn dùng migration ở phase sau:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Trước khi bật migration thật, cần rà lại mapping entity, enum, spatial `POINT` tương thích MariaDB/MySQL và convention snake_case.

## Chạy API

```bash
cd server/VietTourAudio.Api
dotnet run
```

Swagger:

```text
http://localhost:5000/swagger
https://localhost:5001/swagger
```

Nếu terminal hiển thị port khác, dùng đúng port đó.

## Cấu trúc backend

```text
VietTourAudio.Api/
├── Controllers/
├── DTOs/
├── Entities/
├── Data/
├── Interfaces/
├── Services/
├── Helpers/
├── Middlewares/
├── Program.cs
└── appsettings.json
```

### Controllers

Controller chỉ nhận request, gọi service và trả `ApiResponse`.

Ví dụ:

```csharp
[HttpGet]
public async Task<IActionResult> GetAll()
{
  var result = await _stallService.GetStallsAsync();
  return Ok(ApiResponseFactory.Ok(result, "Danh sách sạp."));
}
```

### Services

Service chứa nghiệp vụ. Hiện service là scaffold trả dữ liệu demo. Phase tiếp theo sẽ inject `AppDbContext` hoặc repository để truy vấn MySQL.

### DTOs

DTO định nghĩa request/response, không trả entity trực tiếp ra frontend.

### Entities

Entity bám schema MySQL mới:

- `User`
- `Stall`
- `StallSubscription`
- `Poi`
- `PoiContent`
- `MediaFile`
- `QrCode`
- `QrScanEvent`
- `VisitEvent`
- `PlayHistory`
- `Payment`
- `CashReport`
- `Commission`
- `AdminLog`
- `AppSetting`

### Data

`AppDbContext` khai báo `DbSet` và index quan trọng. Khi chuyển sang query thật, service hoặc repository sẽ dùng context này.

### Helpers

`ApiResponseFactory` chuẩn hóa JSON response.

### Middlewares

`ErrorHandlingMiddleware` bắt exception không xử lý và trả JSON thống nhất.

## Quy tắc đặt tên C#

- Class, record, interface: `PascalCase`.
- Method: `PascalCase`.
- Biến local và parameter: `camelCase`.
- Interface bắt đầu bằng `I`, ví dụ `IStallService`.
- DTO kết thúc bằng `Dto`, ví dụ `StallResponseDto`.
- Controller kết thúc bằng `Controller`.
- Không đặt tên tiếng Việt trong class, method, folder code.

## Cách thêm API mới

1. Tạo request/response DTO trong `DTOs/`.
2. Thêm method vào interface trong `Interfaces/`.
3. Implement method trong `Services/`.
4. Tạo hoặc cập nhật controller trong `Controllers/`.
5. Trả response bằng `ApiResponseFactory`.
6. Test trên Swagger.
7. Nếu có database, thêm entity/mapping và index cần thiết.

## Kết nối MySQL

`Program.cs` đã đăng ký:

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
{
  options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 36)));
});
```

Không dùng `ServerVersion.AutoDetect` trong scaffold để tránh backend cố kết nối MySQL ngay lúc start nếu máy dev chưa bật database.

## Upload file trên server

Endpoint scaffold:

```text
POST /api/media/upload
```

Form-data:

- `file`
- `fileType`
- `ownerId`
- `stallId`
- `poiId`

Phase tiếp theo cần hoàn thiện:

- Kiểm tra MIME type.
- Kiểm tra extension.
- Giới hạn dung lượng theo `Storage` config.
- Lưu file vào `server/uploads/images`, `videos`, `audios`, `qr`.
- Ghi metadata vào `media_files`.
- Không lưu binary vào MySQL.

## Checklist backend trước khi merge

- `dotnet restore`
- `dotnet build`
- Swagger mở được.
- API trả JSON thống nhất.
- Không dùng database name khác `viettuoraudio`.
- Không commit secret production.
