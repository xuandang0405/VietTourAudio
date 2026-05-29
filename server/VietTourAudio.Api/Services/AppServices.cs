using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Services;

public class AuthService : IAuthService
{
  private readonly IConfiguration _configuration;

  public AuthService(IConfiguration configuration)
  {
    _configuration = configuration;
  }

  public Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
  {
    var user = new UserResponseDto(1, "Admin VietTourAudio", request.Email, null, "ADMIN", "ACTIVE");
    return Task.FromResult(CreateAuthResponse(user));
  }

  public Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
  {
    var user = new UserResponseDto(10, request.FullName, request.Email, request.Phone, request.Role, "PENDING");
    return Task.FromResult(CreateAuthResponse(user));
  }

  public Task<UserResponseDto> GetCurrentUserAsync()
  {
    return Task.FromResult(new UserResponseDto(1, "Admin VietTourAudio", "admin@viettouraudio.local", "0900000001", "ADMIN", "ACTIVE"));
  }

  private AuthResponseDto CreateAuthResponse(UserResponseDto user)
  {
    var expiresMinutes = int.TryParse(_configuration["Jwt:ExpiresMinutes"], out var minutes)
      ? minutes
      : 120;
    var expiresAt = DateTime.UtcNow.AddMinutes(expiresMinutes);
    var key = _configuration["Jwt:Key"] ?? "VietTourAudio-Development-Jwt-Key-Change-Me-At-Least-32-Chars";
    var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
    var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

    var claims = new List<Claim>
    {
      new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
      new(JwtRegisteredClaimNames.Email, user.Email),
      new(ClaimTypes.Name, user.FullName),
      new(ClaimTypes.Role, user.Role)
    };

    var token = new JwtSecurityToken(
      issuer: _configuration["Jwt:Issuer"] ?? "VietTourAudio",
      audience: _configuration["Jwt:Audience"] ?? "VietTourAudioClient",
      claims: claims,
      expires: expiresAt,
      signingCredentials: credentials
    );

    return new AuthResponseDto(new JwtSecurityTokenHandler().WriteToken(token), expiresAt, user);
  }
}

public class UserService : IUserService
{
  public Task<IReadOnlyList<UserResponseDto>> GetUsersAsync()
  {
    IReadOnlyList<UserResponseDto> users =
    [
      new(1, "Admin VietTourAudio", "admin@viettouraudio.local", "0900000001", "ADMIN", "ACTIVE"),
      new(2, "Chủ sạp Bến Thành", "owner.benthanh@viettouraudio.local", "0900000002", "STALL_OWNER", "ACTIVE"),
      new(4, "Khách du lịch Demo", "tourist@viettouraudio.local", "0900000004", "TOURIST", "ACTIVE")
    ];

    return Task.FromResult(users);
  }

  public Task<UserResponseDto> GetByIdAsync(ulong id)
  {
    return Task.FromResult(new UserResponseDto(id, "User Demo", $"user{id}@viettouraudio.local", null, "TOURIST", "ACTIVE"));
  }
}

public class StallService : IStallService
{
  public Task<IReadOnlyList<StallResponseDto>> GetStallsAsync()
  {
    IReadOnlyList<StallResponseDto> stalls =
    [
      new(1, 2, "Sạp Cà Phê Bến Thành", "sap-ca-phe-ben-thanh", "Cà phê Việt Nam cho khách quốc tế.", "Chợ Bến Thành, Quận 1", 10.7721120m, 106.6982780m, "APPROVED", true, 10),
      new(2, 3, "Gốm Thủ Công Hội An", "gom-thu-cong-hoi-an", "Gian hàng gốm thủ công.", "Phố cổ Hội An", 15.8800580m, 108.3380470m, "APPROVED", false, 0)
    ];

    return Task.FromResult(stalls);
  }

  public Task<StallResponseDto> GetByIdAsync(ulong id)
  {
    return Task.FromResult(new StallResponseDto(id, 2, "Sạp Demo", "sap-demo", "Thông tin sạp demo.", "Địa chỉ demo", 10.7721120m, 106.6982780m, "APPROVED", false, 0));
  }

  public Task<StallResponseDto> CreateAsync(StallRequestDto request)
  {
    return Task.FromResult(new StallResponseDto(100, request.OwnerId, request.Name, request.Slug, request.Description, request.Address, request.Latitude, request.Longitude, "PENDING", false, 0));
  }

  public Task<StallResponseDto> UpdateStatusAsync(ulong id, string status)
  {
    return Task.FromResult(new StallResponseDto(id, 2, "Sạp Demo", "sap-demo", "Thông tin sạp demo.", "Địa chỉ demo", 10.7721120m, 106.6982780m, status, false, 0));
  }
}

public class PoiService : IPoiService
{
  public Task<IReadOnlyList<PoiResponseDto>> GetPoisAsync(ulong? stallId = null)
  {
    IReadOnlyList<PoiResponseDto> pois =
    [
      new(1, 1, "Góc rang cà phê phin", "Câu chuyện cà phê phin Việt Nam.", 10.7722100m, 106.6983100m, 35, true, "ACTIVE"),
      new(2, 1, "Kệ quà tặng cà phê", "Gợi ý quà tặng và QR thanh toán.", 10.7720300m, 106.6981900m, 25, false, "ACTIVE"),
      new(3, 2, "Bàn xoay gốm thủ công", "Quy trình tạo hình gốm Hội An.", 15.8801200m, 108.3381200m, 30, false, "ACTIVE")
    ];

    if (stallId.HasValue)
    {
      pois = pois.Where(x => x.StallId == stallId.Value).ToList();
    }

    return Task.FromResult(pois);
  }

  public Task<PoiResponseDto> GetByIdAsync(ulong id)
  {
    return Task.FromResult(new PoiResponseDto(id, 1, "POI Demo", "Nội dung POI demo.", 10.7722100m, 106.6983100m, 30, false, "ACTIVE"));
  }

  public Task<IReadOnlyList<PoiResponseDto>> GetNearbyAsync(decimal latitude, decimal longitude, int radiusMeters)
  {
    IReadOnlyList<PoiResponseDto> nearby =
    [
      new(1, 1, "Góc rang cà phê phin", "POI gần vị trí demo.", latitude, longitude, radiusMeters, true, "ACTIVE")
    ];

    return Task.FromResult(nearby);
  }

  public Task<PoiResponseDto> CreateAsync(PoiRequestDto request)
  {
    return Task.FromResult(new PoiResponseDto(100, request.StallId, request.Name, request.Description, request.Latitude, request.Longitude, request.ActivationRadius, request.IsPremium, "ACTIVE"));
  }
}

public class PoiContentService : IPoiContentService
{
  public Task<IReadOnlyList<PoiContentResponseDto>> GetByPoiAsync(ulong poiId)
  {
    IReadOnlyList<PoiContentResponseDto> contents =
    [
      new(1, poiId, "vi", "Thuyết minh tiếng Việt", "/uploads/audios/demo-vi.mp3", "NORMAL"),
      new(2, poiId, "en", "English narration", "/uploads/audios/demo-en.mp3", "NORMAL")
    ];

    return Task.FromResult(contents);
  }

  public Task<PoiContentResponseDto> CreateAsync(PoiContentRequestDto request)
  {
    return Task.FromResult(new PoiContentResponseDto(100, request.PoiId, request.LanguageCode, request.Title, request.AudioFileUrl, request.VoiceType));
  }
}

public class MediaStorageService : IMediaStorageService
{
  public Task<MediaUploadResponseDto> SaveAsync(IFormFile file, string fileType, ulong ownerId, ulong? stallId, ulong? poiId)
  {
    var safeFileName = Path.GetFileName(file.FileName);
    var relativePath = $"/uploads/{fileType.ToLowerInvariant()}s/{safeFileName}";
    var response = new MediaUploadResponseDto(100, fileType.ToUpperInvariant(), safeFileName, relativePath, file.ContentType, file.Length);
    return Task.FromResult(response);
  }
}

public class QrTrackingService : IQrTrackingService
{
  public Task<QrCodeResponseDto> CreateQrCodeAsync(QrCodeRequestDto request)
  {
    var url = $"/uploads/qr/{request.QrType.ToLowerInvariant()}-{Guid.NewGuid():N}.png";
    return Task.FromResult(new QrCodeResponseDto(100, request.StallId, request.PoiId, request.QrType, url, request.TargetUrl));
  }

  public Task<object> TrackScanAsync(QrScanRequestDto request, string? ipAddress, string? userAgent)
  {
    return Task.FromResult<object>(new
    {
      request.QrCodeId,
      request.SessionId,
      IpAddress = ipAddress,
      UserAgent = userAgent,
      ScannedAt = DateTime.UtcNow
    });
  }
}

public class AnalyticsService : IAnalyticsService
{
  public Task<AnalyticsSummaryDto> GetSummaryAsync()
  {
    return Task.FromResult(new AnalyticsSummaryDto(
      TotalStalls: 2,
      TotalPois: 3,
      QrScansToday: 128,
      VisitsToday: 64,
      AudioPlaysToday: 92,
      RevenueToday: 548000m
    ));
  }

  public Task<object> TrackVisitAsync(VisitEventRequestDto request)
  {
    return Task.FromResult<object>(new { request.StallId, request.PoiId, request.SessionId, VisitedAt = DateTime.UtcNow });
  }

  public Task<object> TrackAudioPlayAsync(AudioPlayRequestDto request)
  {
    return Task.FromResult<object>(new { request.PoiId, request.LanguageCode, request.SessionId, PlayedAt = DateTime.UtcNow });
  }
}

public class PaymentService : IPaymentService
{
  public Task<PaymentResponseDto> CreateAsync(PaymentRequestDto request)
  {
    var response = new PaymentResponseDto(
      100,
      request.UserId,
      request.StallId,
      request.Amount,
      request.Currency,
      request.PaymentMethod,
      request.PaymentType,
      "PENDING",
      $"VTA-{DateTime.UtcNow:yyyyMMddHHmmss}"
    );

    return Task.FromResult(response);
  }

  public Task<object> HandleWebhookAsync(object payload)
  {
    return Task.FromResult<object>(new { Received = true, Payload = payload, ProcessedAt = DateTime.UtcNow });
  }

  public Task<PaymentResponseDto> RecordManualCashAsync(PaymentRequestDto request)
  {
    return Task.FromResult(new PaymentResponseDto(
      101,
      request.UserId,
      request.StallId,
      request.Amount,
      request.Currency,
      "CASH_MANUAL",
      request.PaymentType,
      "PAID",
      $"CASH-{DateTime.UtcNow:yyyyMMddHHmmss}"
    ));
  }
}

public class CommissionService : ICommissionService
{
  public Task<object> CalculateForPaymentAsync(ulong paymentId)
  {
    return Task.FromResult<object>(new
    {
      PaymentId = paymentId,
      CommissionRate = 10,
      CommissionAmount = 9900,
      Status = "PENDING"
    });
  }
}

public class AdminLogService : IAdminLogService
{
  public Task<IReadOnlyList<AdminLogResponseDto>> GetLogsAsync()
  {
    IReadOnlyList<AdminLogResponseDto> logs =
    [
      new(1, 1, "APPROVE_STALL", "STALL", 1, "Duyệt sạp demo.", DateTime.UtcNow.AddHours(-2)),
      new(2, 1, "UPDATE_SETTING", "APP_SETTING", 1, "Cập nhật tỷ lệ hoa hồng.", DateTime.UtcNow.AddHours(-1))
    ];

    return Task.FromResult(logs);
  }

  public Task<object> WriteAsync(ulong adminId, string action, string targetType, ulong? targetId, string? description)
  {
    return Task.FromResult<object>(new { AdminId = adminId, Action = action, TargetType = targetType, TargetId = targetId, Description = description, CreatedAt = DateTime.UtcNow });
  }
}

public class GeofenceService : IGeofenceService
{
  public decimal EstimateDistanceMeters(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
  {
    const double earthRadiusMeters = 6371000;
    var dLat = ToRadians((double)(lat2 - lat1));
    var dLon = ToRadians((double)(lon2 - lon1));
    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
      + Math.Cos(ToRadians((double)lat1)) * Math.Cos(ToRadians((double)lat2))
      * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
    var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    return (decimal)(earthRadiusMeters * c);
  }

  private static double ToRadians(double degree)
  {
    return degree * Math.PI / 180;
  }
}
