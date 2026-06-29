using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
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
  Task<UserResponseDto> GetByIdAsync(string id);
}

public interface IStallService
{
  Task<IReadOnlyList<StallResponseDto>> GetStallsAsync();
  Task<StallResponseDto> GetByIdAsync(string id);
  Task<StallResponseDto> CreateAsync(StallRequestDto request);
  Task<StallResponseDto> UpdateStatusAsync(string id, string status);
  Task<StallResponseDto?> GetByZoneCodeAsync(string zoneCode);
}

public interface IPoiService
{
  Task<IReadOnlyList<PoiResponseDto>> GetPoisAsync(string? stallId = null, string? tourId = null, string? tourSlug = null);
  Task<PoiResponseDto> GetByIdAsync(string id);
  Task<IReadOnlyList<PoiResponseDto>> GetNearbyAsync(decimal latitude, decimal longitude, int radiusMeters, string? tourId = null, string? tourSlug = null);
  Task<PoiResponseDto> CreateAsync(PoiRequestDto request);
}

public interface IPoiContentService
{
  Task<IReadOnlyList<PoiContentResponseDto>> GetByPoiAsync(string poiId);
  Task<PoiContentResponseDto> CreateAsync(PoiContentRequestDto request);
}

public interface IMediaStorageService
{
  Task<MediaUploadResponseDto> SaveAsync(IFormFile file, string fileType, string ownerId, string? stallId, string? poiId);
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
  Task<object> CalculateForPaymentAsync(string paymentId);
}

public interface IAdminLogService
{
  Task<IReadOnlyList<AdminLogResponseDto>> GetLogsAsync();
  Task<object> WriteAsync(string adminId, string action, string targetType, string? targetId, string? description);
}

public interface IGeofenceService
{
  decimal EstimateDistanceMeters(decimal lat1, decimal lon1, decimal lat2, decimal lon2);
}
