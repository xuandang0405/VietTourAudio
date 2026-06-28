using VietTourAudio.Api.DTOs;

namespace VietTourAudio.Api.Interfaces;

public interface IAuthService
{
  Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
  Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
  Task<AuthResponseDto> RefreshAsync(string refreshToken);
  Task<UserResponseDto> GetCurrentUserAsync();
}

public interface IUserService
{
  Task<IReadOnlyList<UserResponseDto>> GetUsersAsync();
  Task<UserResponseDto> GetByIdAsync(ulong id);
}

public interface IStallService
{
  Task<IReadOnlyList<StallResponseDto>> GetStallsAsync();
  Task<StallResponseDto> GetByIdAsync(ulong id);
  Task<StallResponseDto> CreateAsync(StallRequestDto request);
  Task<StallResponseDto> UpdateStatusAsync(ulong id, string status);
  Task<StallResponseDto?> GetByZoneCodeAsync(string zoneCode);
}

public interface IPoiService
{
  Task<IReadOnlyList<PoiResponseDto>> GetPoisAsync(ulong? stallId = null, ulong? tourId = null, string? tourSlug = null);
  Task<PoiResponseDto> GetByIdAsync(ulong id);
  Task<IReadOnlyList<PoiResponseDto>> GetNearbyAsync(decimal latitude, decimal longitude, int radiusMeters, ulong? tourId = null, string? tourSlug = null);
  Task<PoiResponseDto> CreateAsync(PoiRequestDto request);
}

public interface IPoiContentService
{
  Task<IReadOnlyList<PoiContentResponseDto>> GetByPoiAsync(ulong poiId);
  Task<PoiContentResponseDto> CreateAsync(PoiContentRequestDto request);
}

public interface IMediaStorageService
{
  Task<MediaUploadResponseDto> SaveAsync(IFormFile file, string fileType, ulong ownerId, ulong? stallId, ulong? poiId);
}

public interface IQrTrackingService
{
  Task<QrCodeResponseDto> CreateQrCodeAsync(QrCodeRequestDto request);
  Task<object> TrackScanAsync(QrScanRequestDto request, string? ipAddress, string? userAgent);
}

public interface IAnalyticsService
{
  Task<AnalyticsSummaryDto> GetSummaryAsync();
  Task<object> TrackVisitAsync(VisitEventRequestDto request);
  Task<object> TrackAudioPlayAsync(AudioPlayRequestDto request);
}

public interface IPaymentService
{
  Task<PaymentResponseDto> CreateAsync(PaymentRequestDto request);
  Task<object> HandleWebhookAsync(object payload);
  Task<PaymentResponseDto> RecordManualCashAsync(PaymentRequestDto request);
  Task<string?> GetPremiumPaymentQrAsync();
}

public interface ICommissionService
{
  Task<object> CalculateForPaymentAsync(ulong paymentId);
}

public interface IAdminLogService
{
  Task<IReadOnlyList<AdminLogResponseDto>> GetLogsAsync();
  Task<object> WriteAsync(ulong adminId, string action, string targetType, ulong? targetId, string? description);
}

public interface IGeofenceService
{
  decimal EstimateDistanceMeters(decimal lat1, decimal lon1, decimal lat2, decimal lon2);
}
