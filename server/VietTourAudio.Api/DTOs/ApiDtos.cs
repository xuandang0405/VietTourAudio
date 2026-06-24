namespace VietTourAudio.Api.DTOs;

public sealed record LoginRequestDto(string Email, string Password);

public sealed record RegisterRequestDto(
  string FullName,
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

public sealed record UserResponseDto(
  ulong Id,
  string FullName,
  string Email,
  string? Phone,
  string Role,
  string Status
);

public sealed record StallRequestDto(
  ulong OwnerId,
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
  ulong OwnerId,
  string Name,
  string Slug,
  string? Description,
  string? Address,
  decimal Latitude,
  decimal Longitude,
  string Status,
  bool IsPremium,
  int PremiumPriority,
  string? ZoneCode
);

public sealed record PoiRequestDto(
  ulong StallId,
  string Name,
  string? Description,
  decimal Latitude,
  decimal Longitude,
  int ActivationRadius,
  bool IsPremium
);

public sealed record PoiResponseDto(
  ulong Id,
  ulong StallId,
  string Slug,
  string Name,
  string? Description,
  string ZoneName,
  string Category,
  string? ImageUrl,
  decimal Latitude,
  decimal Longitude,
  int ActivationRadius,
  bool IsPremium,
  string Status,
  decimal? DistanceMeters,
  bool IsInsideGeofence,
  ulong? QrCodeId = null
);

public sealed record PoiContentRequestDto(
  ulong PoiId,
  string LanguageCode,
  string Title,
  string? TtsScript,
  string? AudioFileUrl,
  string VoiceType
);

public sealed record PoiContentResponseDto(
  ulong Id,
  ulong PoiId,
  string LanguageCode,
  string Title,
  string? TtsScript,
  string? AudioFileUrl,
  string VoiceType
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
  string LanguageCode
);

public sealed record PaymentRequestDto(
  ulong? UserId,
  ulong? StallId,
  decimal Amount,
  string Currency,
  string PaymentMethod,
  string PaymentType,
  string? Note
);

public sealed record PaymentResponseDto(
  ulong Id,
  ulong? UserId,
  ulong? StallId,
  decimal Amount,
  string Currency,
  string PaymentMethod,
  string PaymentType,
  string Status,
  string? TransactionCode
);

public sealed record AnalyticsSummaryDto(
  int TotalStalls,
  int TotalPois,
  int QrScansToday,
  int VisitsToday,
  int AudioPlaysToday,
  decimal RevenueToday
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
