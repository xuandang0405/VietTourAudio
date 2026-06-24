namespace VietTourAudio.Api.DTOs;

public sealed record LoginRequestDto(string Email, string Password);

public sealed record RegisterRequestDto(
  string DisplayName,
  string Email,
  string Password,
  string? Phone,
  string Role
);

public sealed record AuthResponseDto(
  string AccessToken,
  DateTime ExpiresAt,
  UserResponseDto User
);

public sealed record LoginResponseDto(
  string Token,
  string Role
);

public sealed record UserResponseDto(
  ulong Id,
  string FullName,
  string Email,
  string Role,
  string Status
);

public sealed record PremiumStatusDto(
  ulong UserId,
  bool IsPremium,
  DateTime? PremiumExpiresAt,
  int RemainingMinutes
);

public sealed record StallRequestDto(
  string Name,
  string Slug,
  string? Description,
  string? Address,
  decimal Latitude,
  decimal Longitude,
  string? OpeningHours
);

public sealed record StallResponseDto(
  ulong Id,
  ulong VendorId,
  string Name,
  string Slug,
  string? Description,
  string? Address,
  decimal Latitude,
  decimal Longitude,
  string Status,
  bool IsFeatured
);

public sealed record PoiRequestDto(
  ulong StallId,
  string Name,
  string? Description,
  decimal Latitude,
  decimal Longitude,
  int ActivationRadius,
  bool IsPremiumContent
);

public sealed record UpdatePoiRequestDto(
  ulong StallId,
  string Name,
  string? Description,
  decimal Latitude,
  decimal Longitude,
  int ActivationRadius,
  bool IsPremiumContent
);

public sealed record PoiResponseDto(
  ulong Id,
  ulong StallId,
  string Name,
  string? Description,
  decimal Latitude,
  decimal Longitude,
  int ActivationRadius,
  bool IsPremiumContent,
  string Status
);

public sealed record PoiContentRequestDto(
  ulong PoiId,
  string Lang,
  string Title,
  string? TtsScript,
  string? AudioUrl,
  string? VoiceProfile
);

public sealed record PoiContentResponseDto(
  ulong Id,
  ulong PoiId,
  string Lang,
  string Title,
  string? AudioUrl,
  string? VoiceProfile
);

public sealed record MediaUploadResponseDto(
  ulong Id,
  string FileType,
  string FileName,
  string FilePath,
  string MimeType,
  long FileSize
);

public sealed record QrCodeRequestDto(
  ulong? StallId,
  ulong? PoiId,
  string QrType,
  string TargetUrl
);

public sealed record QrCodeResponseDto(
  ulong Id,
  ulong? StallId,
  ulong? PoiId,
  string QrType,
  string QrCodeUrl,
  string TargetUrl
);

public sealed record QrScanRequestDto(
  ulong QrCodeId,
  ulong? StallId,
  ulong? PoiId,
  ulong? UserId,
  string SessionId,
  string? CountryCode
);

public sealed record VisitEventRequestDto(
  ulong StallId,
  ulong? PoiId,
  ulong? UserId,
  string SessionId,
  decimal Latitude,
  decimal Longitude,
  decimal? DistanceMeters
);

public sealed record AudioPlayRequestDto(
  ulong? UserId,
  string SessionId,
  ulong PoiId,
  string Lang
);

public sealed record PaymentRequestDto(
  ulong? VendorId,
  ulong? VisitorSessionId,
  decimal Amount,
  string Currency,
  string Provider,
  string PaymentType
);

public sealed record MockPaymentRequestDto(
  decimal Amount
);

public sealed record PaymentResponseDto(
  ulong Id,
  ulong? VendorId,
  ulong? VisitorSessionId,
  decimal Amount,
  string Currency,
  string Provider,
  string PaymentType,
  string Status,
  string? TransactionCode
);

public sealed record StallSubscriptionResponseDto(
  ulong Id,
  ulong StallId,
  string PlanName,
  decimal Price,
  DateOnly StartDate,
  DateOnly EndDate,
  string Status
);

public sealed record AnalyticsSummaryDto(
  int TotalStalls,
  int TotalPois,
  int QrScansToday,
  int VisitsToday,
  int AudioPlaysToday,
  decimal RevenueToday
);

public sealed record StallOwnerDashboardDto(
  ulong OwnerId,
  int TotalStalls,
  int ApprovedStalls,
  int PendingStalls,
  int SuspendedStalls,
  int TotalPois,
  int ActivePois,
  int PendingPois,
  int RejectedPois,
  string SubscriptionStatus,
  DateOnly? SubscriptionEndDate,
  int QrScansToday,
  int VisitsToday,
  int AudioPlaysToday,
  decimal RevenueToday,
  int PaidTransactions,
  int PendingTransactions,
  IReadOnlyList<StallResponseDto> Stalls,
  IReadOnlyList<PaymentResponseDto> RecentPayments
);

public sealed record AdminLogResponseDto(
  ulong Id,
  ulong AdminId,
  string Action,
  string TargetType,
  ulong? TargetId,
  string? Description,
  DateTime CreatedAt
);
