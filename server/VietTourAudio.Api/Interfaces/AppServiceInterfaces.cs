using VietTourAudio.Api.DTOs;

namespace VietTourAudio.Api.Interfaces;

public interface IAuthService
{
  Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
  Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
  Task<UserResponseDto> GetCurrentUserAsync();
  Task<PremiumStatusDto> GetPremiumStatusAsync();
}

public interface IUserService
{
  Task<IReadOnlyList<UserResponseDto>> GetUsersAsync();
  Task<UserResponseDto> GetByIdAsync(ulong id);
}

public interface IStallService
{
  Task<IReadOnlyList<StallResponseDto>> GetStallsAsync();
  Task<IReadOnlyList<StallResponseDto>> GetMyStallsAsync();
  Task<StallResponseDto> GetByIdAsync(ulong id);
  Task<StallResponseDto> CreateAsync(StallRequestDto request);
  Task<StallResponseDto> UpdateAsync(ulong id, StallRequestDto request);
  Task<StallResponseDto> SubmitForReviewAsync(ulong id);
  Task<StallResponseDto> UpdateStatusAsync(ulong id, string status);
}

public interface IPoiService
{
  Task<IReadOnlyList<PoiResponseDto>> GetPoisAsync(ulong? stallId = null);
  Task<IReadOnlyList<PoiResponseDto>> GetMyPoisAsync();
  Task<IReadOnlyList<PoiResponseDto>> GetPendingAsync();
  Task<PoiResponseDto> GetByIdAsync(ulong id);
  Task<IReadOnlyList<PoiResponseDto>> GetNearbyAsync(decimal latitude, decimal longitude, int radiusMeters);
  Task<PoiResponseDto> CreateAsync(PoiRequestDto request);
  Task<PoiResponseDto> UpdateAsync(ulong id, UpdatePoiRequestDto request);
  Task<PoiResponseDto> SubmitForReviewAsync(ulong id);
  Task<PoiResponseDto> UpdateStatusAsync(ulong id, string status);
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
  Task<StallOwnerDashboardDto> GetStallOwnerDashboardAsync();
  Task<object> TrackVisitAsync(VisitEventRequestDto request);
  Task<object> TrackAudioPlayAsync(AudioPlayRequestDto request);
}

public interface ISubscriptionService
{
  Task<StallSubscriptionResponseDto> ActivateTrialAsync();
}

public interface IPaymentService
{
  Task<IReadOnlyList<PaymentResponseDto>> GetPaymentsAsync();
  Task<PaymentResponseDto> GetByIdAsync(ulong id);
  Task<PaymentResponseDto> CreateAsync(PaymentRequestDto request);
  Task<object> HandleWebhookAsync(object payload);
  Task<PaymentResponseDto> RecordManualCashAsync(PaymentRequestDto request);
  Task<PaymentResponseDto> SimulatePaidAsync(ulong id);
  Task<PaymentResponseDto> CreatePremium24hDemoAsync();
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
