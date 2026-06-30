# Server VietTourAudio

Backend chính của dự án là .NET 8 Web API.

## Chạy local

```bash
cd VietTourAudio.Api
dotnet restore
dotnet run
```

## Cấu hình database

File `VietTourAudio.Api/appsettings.json` phải trỏ tới database `viettuoraudio`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;database=viettuoraudio;user=root;password=your_password;"
  }
}
```

## API scaffold

Đã có controller, DTO, service interface, service scaffold, response JSON thống nhất, Swagger, CORS và JWT scaffold.
