using System;
using System.Text.Json.Serialization;

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
  string RefreshToken,
  DateTime ExpiresAt,
  UserResponseDto User
);

public sealed record UserResponseDto(
  string Id,
  string FullName,
  string Email,
  string? Phone,
  string Role,
  string Status
);

public sealed record StallRequestDto(
  string OwnerId,
  string Name,
  string Slug,
  string? Description,
  string? Address,
  decimal Latitude,
  decimal Longitude,
  string? OpeningHours
);

public sealed record StallResponseDto(
  string Id,
  string OwnerId,
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
  string StallId,
  string Name,
  string? Description,
  decimal Latitude,
  decimal Longitude,
  int ActivationRadius,
  bool IsPremium
);

public sealed record PoiResponseDto(
  string Id,
  string StallId,
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
  string? QrCodeId = null,
  string? TourId = null,
  string? TourSlug = null,
  [property: JsonPropertyName("stallName_EN")] string? StallNameEn = null,
  [property: JsonPropertyName("description_EN")] string? DescriptionEn = null,
  [property: JsonPropertyName("stallName_JA")] string? StallNameJa = null,
  [property: JsonPropertyName("description_JA")] string? DescriptionJa = null,
  [property: JsonPropertyName("stallName_KO")] string? StallNameKo = null,
  [property: JsonPropertyName("description_KO")] string? DescriptionKo = null,
  [property: JsonPropertyName("stallName_ZH")] string? StallNameZh = null,
  [property: JsonPropertyName("description_ZH")] string? DescriptionZh = null
);

public sealed record PoiContentRequestDto(
  string PoiId,
  string LanguageCode,
  string Title,
  string? TtsScript,
  string? AudioFileUrl,
  string VoiceType
);

public sealed record PoiContentResponseDto(
  string Id,
  string PoiId,
  string LanguageCode,
  string Title,
  string? TtsScript,
  string? AudioFileUrl,
  string VoiceType
);

public sealed record MediaUploadResponseDto(
  string Id,
  string FileType,
  string FileName,
  string FilePath,
  string MimeType,
  long FileSize
);

public sealed record QrCodeRequestDto(
  string? StallId,
  string? PoiId,
  string QrType,
  string TargetUrl
);

public sealed record QrCodeResponseDto(
  string Id,
  string? StallId,
  string? PoiId,
  string QrType,
  string QrCodeUrl,
  string TargetUrl
);

public sealed record QrScanRequestDto(
  string QrCodeId,
  string? StallId,
  string? PoiId,
  string? UserId,
  string SessionId,
  string? CountryCode
);

public sealed record VisitEventRequestDto(
  string StallId,
  string? PoiId,
  string? UserId,
  string SessionId,
  decimal Latitude,
  decimal Longitude,
  decimal? DistanceMeters
);

public sealed record AudioPlayRequestDto(
  string? UserId,
  string SessionId,
  string PoiId,
  string LanguageCode
);

public sealed record PaymentRequestDto(
  string? UserId,
  string? StallId,
  decimal Amount,
  string Currency,
  string PaymentMethod,
  string PaymentType,
  string? Note
);

public sealed record PaymentResponseDto(
  string Id,
  string? UserId,
  string? StallId,
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
  string Id,
  string AdminId,
  string Action,
  string TargetType,
  string? TargetId,
  string? Description,
  DateTime CreatedAt
);
