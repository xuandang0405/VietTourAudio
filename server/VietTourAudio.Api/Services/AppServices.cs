using System.Collections.Concurrent;
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

    var value = new JwtSecurityTokenHandler().WriteToken(token);
    return new AuthResponseDto(value, value, expiresAt, user);
  }

  public Task<AuthResponseDto> RefreshAsync(string refreshToken)
  {
    throw new NotSupportedException();
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
      new(1, 2, "Sạp Cà Phê Bến Thành", "sap-ca-phe-ben-thanh", "Cà phê Việt Nam cho khách quốc tế.", "Chợ Bến Thành, Quận 1", 10.7721120m, 106.6982780m, "APPROVED", true, 10, "AB12CD34"),
      new(2, 3, "Gốm Thủ Công Hội An", "gom-thu-cong-hoi-an", "Gian hàng gốm thủ công.", "Phố cổ Hội An", 15.8800580m, 108.3380470m, "APPROVED", false, 0, null)
    ];

    return Task.FromResult(stalls);
  }

  public Task<StallResponseDto> GetByIdAsync(ulong id)
  {
    return Task.FromResult(new StallResponseDto(id, 2, "Sạp Demo", "sap-demo", "Thông tin sạp demo.", "Địa chỉ demo", 10.7721120m, 106.6982780m, "APPROVED", false, 0, null));
  }

  public Task<StallResponseDto> CreateAsync(StallRequestDto request)
  {
    return Task.FromResult(new StallResponseDto(100, request.OwnerId, request.Name, request.Slug, request.Description, request.Address, request.Latitude, request.Longitude, "PENDING", false, 0, null));
  }

  public Task<StallResponseDto> UpdateStatusAsync(ulong id, string status)
  {
    return Task.FromResult(new StallResponseDto(id, 2, "Sạp Demo", "sap-demo", "Thông tin sạp demo.", "Địa chỉ demo", 10.7721120m, 106.6982780m, status, false, 0, null));
  }

  public Task<StallResponseDto?> GetByZoneCodeAsync(string zoneCode)
  {
    if (zoneCode == "AB12CD34")
    {
      return Task.FromResult<StallResponseDto?>(new StallResponseDto(1, 2, "Sạp Cà Phê Bến Thành", "sap-ca-phe-ben-thanh", "Cà phê Việt Nam cho khách quốc tế.", "Chợ Bến Thành, Quận 1", 10.7721120m, 106.6982780m, "APPROVED", true, 10, "AB12CD34"));
    }
    return Task.FromResult<StallResponseDto?>(null);
  }
}

public class PoiService : IPoiService
{
  private readonly IGeofenceService _geofenceService;

  private static readonly IReadOnlyList<PoiResponseDto> Pois =
  [
    new(1, 1, "stall-antiques-nam", "Sạp Đồ Cổ Chú Năm", "Không gian lưu giữ ký ức Sài Gòn xưa qua máy ảnh, đồng hồ và các món đồ cổ.", "Phố đi bộ Nguyễn Huệ", "Di sản địa phương", null, 10.77589m, 106.70184m, 35, true, "ACTIVE", null, false),
    new(2, 1, "poi-city-hall", "Tòa nhà UBND Thành phố", "Công trình mang dấu ấn kiến trúc Pháp ở đầu phố Nguyễn Huệ.", "Phố đi bộ Nguyễn Huệ", "Kiến trúc", null, 10.77672m, 106.70102m, 45, false, "ACTIVE", null, false),
    new(3, 1, "stall-coffee-heritage", "Quầy Cà Phê Di Sản", "Câu chuyện cà phê vỉa hè và nhịp sống đô thị Việt Nam.", "Phố đi bộ Nguyễn Huệ", "Ẩm thực địa phương", null, 10.77521m, 106.70245m, 32, false, "ACTIVE", null, false),
    new(4, 1, "stall-book-memory", "Góc Sách Ký Ức", "Sách cũ, bưu thiếp và tranh in lưu giữ ký ức đô thị.", "Phố đi bộ Nguyễn Huệ", "Văn hóa", null, 10.77508m, 106.70136m, 30, true, "ACTIVE", null, false)
  ];

  public PoiService(IGeofenceService geofenceService)
  {
    _geofenceService = geofenceService;
  }

  public Task<IReadOnlyList<PoiResponseDto>> GetPoisAsync(ulong? stallId = null, ulong? tourId = null, string? tourSlug = null)
  {
    IReadOnlyList<PoiResponseDto> pois = Pois;

    if (stallId.HasValue)
    {
      pois = pois.Where(x => x.StallId == stallId.Value).ToList();
    }
    if (tourId.HasValue)
    {
      pois = pois.Where(x => x.TourId == tourId.Value).ToList();
    }
    if (!string.IsNullOrEmpty(tourSlug))
    {
      pois = pois.Where(x => x.TourSlug == tourSlug).ToList();
    }

    return Task.FromResult(pois);
  }

  public Task<PoiResponseDto> GetByIdAsync(ulong id)
  {
    var poi = Pois.FirstOrDefault(item => item.Id == id)
      ?? throw new KeyNotFoundException($"Không tìm thấy POI {id}.");
    return Task.FromResult(poi);
  }

  public Task<IReadOnlyList<PoiResponseDto>> GetNearbyAsync(decimal latitude, decimal longitude, int radiusMeters, ulong? tourId = null, string? tourSlug = null)
  {
    IReadOnlyList<PoiResponseDto> nearby = Pois
      .Where(poi => (!tourId.HasValue || poi.TourId == tourId) && (string.IsNullOrEmpty(tourSlug) || poi.TourSlug == tourSlug))
      .Select(poi =>
      {
        var distance = _geofenceService.EstimateDistanceMeters(latitude, longitude, poi.Latitude, poi.Longitude);
        return poi with
        {
          DistanceMeters = decimal.Round(distance, 1),
          IsInsideGeofence = distance <= poi.ActivationRadius
        };
      })
      .Where(poi => poi.DistanceMeters <= radiusMeters)
      .OrderBy(poi => poi.DistanceMeters)
      .ToList();

    return Task.FromResult(nearby);
  }

  public Task<PoiResponseDto> CreateAsync(PoiRequestDto request)
  {
    var slug = request.Name.ToLowerInvariant().Replace(' ', '-');
    return Task.FromResult(new PoiResponseDto(100, request.StallId, slug, request.Name, request.Description, "Khu vực mới", "Điểm tham quan", null, request.Latitude, request.Longitude, request.ActivationRadius, request.IsPremium, "ACTIVE", null, false));
  }
}

public class PoiContentService : IPoiContentService
{
  public Task<IReadOnlyList<PoiContentResponseDto>> GetByPoiAsync(ulong poiId)
  {
    var scripts = GetScripts(poiId);
    IReadOnlyList<PoiContentResponseDto> contents = scripts
      .Select((item, index) => new PoiContentResponseDto(
        (ulong)(poiId * 10 + (ulong)index + 1),
        poiId,
        item.Key,
        $"Thuyết minh {item.Key.ToUpperInvariant()}",
        item.Value,
        null,
        "BROWSER_TTS"
      ))
      .ToList();

    return Task.FromResult(contents);
  }

  public Task<PoiContentResponseDto> CreateAsync(PoiContentRequestDto request)
  {
    return Task.FromResult(new PoiContentResponseDto(100, request.PoiId, request.LanguageCode, request.Title, request.TtsScript, request.AudioFileUrl, request.VoiceType));
  }

  private static IReadOnlyDictionary<string, string> GetScripts(ulong poiId)
  {
    var name = poiId switch
    {
      1 => "Sạp Đồ Cổ Chú Năm",
      2 => "Tòa nhà Ủy ban Nhân dân Thành phố Hồ Chí Minh",
      3 => "Quầy Cà Phê Di Sản",
      4 => "Góc Sách Ký Ức",
      _ => "điểm tham quan này"
    };

    return new Dictionary<string, string>
    {
      ["vi"] = $"Bạn đang ở gần {name}. Hãy dành một chút thời gian quan sát không gian và lắng nghe câu chuyện của điểm đến này.",
      ["en"] = $"You are now near {name}. Take a moment to observe the surroundings and listen to the story of this place.",
      ["ja"] = $"現在、{name}の近くにいます。周囲をゆっくり観察し、この場所の物語をお楽しみください。",
      ["ko"] = $"현재 {name} 근처에 있습니다. 주변을 천천히 둘러보며 이 장소의 이야기를 들어 보세요.",
      ["zh"] = $"您现在位于{name}附近。请花一点时间观察周围，并聆听这个地点的故事。"
    };
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
  private readonly PrototypeAnalyticsState _analyticsState;

  public QrTrackingService(PrototypeAnalyticsState analyticsState)
  {
    _analyticsState = analyticsState;
  }

  public Task<QrCodeResponseDto> CreateQrCodeAsync(QrCodeRequestDto request)
  {
    var url = $"/uploads/qr/{request.QrType.ToLowerInvariant()}-{Guid.NewGuid():N}.png";
    return Task.FromResult(new QrCodeResponseDto(100, request.StallId, request.PoiId, request.QrType, url, request.TargetUrl));
  }

  public Task<object> TrackScanAsync(QrScanRequestDto request, string? ipAddress, string? userAgent)
  {
    var accepted = _analyticsState.RecordQrScan(request.SessionId, request.QrCodeId);
    return Task.FromResult<object>(new
    {
      request.QrCodeId,
      request.SessionId,
      IpAddress = ipAddress,
      UserAgent = userAgent,
      Accepted = accepted,
      ScannedAt = DateTime.UtcNow
    });
  }
}

public class AnalyticsService : IAnalyticsService
{
  private readonly PrototypeAnalyticsState _analyticsState;

  public AnalyticsService(PrototypeAnalyticsState analyticsState)
  {
    _analyticsState = analyticsState;
  }

  public Task<AnalyticsSummaryDto> GetSummaryAsync()
  {
    return Task.FromResult(new AnalyticsSummaryDto(
      TotalStalls: 1,
      TotalPois: 4,
      QrScansToday: _analyticsState.QrScanCount,
      VisitsToday: _analyticsState.VisitCount,
      AudioPlaysToday: _analyticsState.AudioPlayCount,
      RevenueToday: 0m
    ));
  }

  public Task<object> TrackVisitAsync(VisitEventRequestDto request)
  {
    var accepted = _analyticsState.RecordVisit(request.SessionId, request.PoiId);
    return Task.FromResult<object>(new { request.StallId, request.PoiId, request.SessionId, Accepted = accepted, VisitedAt = DateTime.UtcNow });
  }

  public Task<object> TrackAudioPlayAsync(AudioPlayRequestDto request)
  {
    _analyticsState.RecordAudioPlay(request.SessionId, request.PoiId);
    return Task.FromResult<object>(new { request.PoiId, request.LanguageCode, request.SessionId, Accepted = true, PlayedAt = DateTime.UtcNow });
  }
}

public sealed class PrototypeAnalyticsState
{
  private readonly ConcurrentDictionary<string, byte> _visits = new();
  private readonly ConcurrentDictionary<string, byte> _qrScans = new();
  private int _audioPlayCount;

  public int VisitCount => _visits.Count;
  public int QrScanCount => _qrScans.Count;
  public int AudioPlayCount => _audioPlayCount;

  public bool RecordVisit(string sessionId, ulong? poiId)
  {
    return _visits.TryAdd($"{sessionId}:{poiId}", 0);
  }

  public bool RecordQrScan(string sessionId, ulong qrCodeId)
  {
    return _qrScans.TryAdd($"{sessionId}:{qrCodeId}", 0);
  }

  public void RecordAudioPlay(string sessionId, ulong poiId)
  {
    Interlocked.Increment(ref _audioPlayCount);
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

  public Task<string?> GetPremiumPaymentQrAsync()
  {
    return Task.FromResult<string?>("MOMO-PAY-PREMIUM-12345");
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
