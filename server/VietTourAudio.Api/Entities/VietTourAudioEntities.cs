using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace VietTourAudio.Api.Entities;

[Table("users")]
public class User
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("email")]
  [MaxLength(255)]
  public string Email { get; set; } = string.Empty;

  [Column("pass_hash")]
  [MaxLength(255)]
  public string PassHash { get; set; } = string.Empty;

  [Column("full_name")]
  [MaxLength(160)]
  public string FullName { get; set; } = string.Empty;

  [Column("role")]
  [MaxLength(50)]
  public string Role { get; set; } = "ADMIN";

  [Column("status")]
  [MaxLength(30)]
  public string Status { get; set; } = "ACTIVE";

  [Column("last_login_at")]
  public DateTime? LastLoginAt { get; set; }

  [Column("premium_expires_at")]
  public DateTime? PremiumExpiresAt { get; set; }

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }

  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; }
}

[Table("stalls")]
public class Stall
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("vendor_id")]
  public ulong VendorId { get; set; }

  [Column("name")]
  [MaxLength(255)]
  public string Name { get; set; } = string.Empty;

  [Column("slug")]
  [MaxLength(255)]
  public string Slug { get; set; } = string.Empty;

  [Column("description")]
  public string? Description { get; set; }

  [Column("address")]
  [MaxLength(500)]
  public string? Address { get; set; }

  [Column("latitude")]
  public decimal Latitude { get; set; }

  [Column("longitude")]
  public decimal Longitude { get; set; }

  [Column("activation_radius")]
  public int ActivationRadius { get; set; } = 30;

  [Column("status")]
  [MaxLength(30)]
  public string Status { get; set; } = "PENDING";

  [Column("opening_hours")]
  public string? OpeningHours { get; set; }

  [Column("is_featured")]
  public bool IsFeatured { get; set; }

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }

  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; }
}

[Table("stall_subscriptions")]
public class StallSubscription
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("stall_id")]
  public ulong StallId { get; set; }

  [Column("plan_name")]
  [MaxLength(100)]
  public string PlanName { get; set; } = string.Empty;

  [Column("price")]
  public decimal Price { get; set; }

  [Column("start_date")]
  public DateOnly StartDate { get; set; }

  [Column("end_date")]
  public DateOnly EndDate { get; set; }

  [Column("status")]
  [MaxLength(30)]
  public string Status { get; set; } = "ACTIVE";

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }
}

[Table("pois")]
public class Poi
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("stall_id")]
  public ulong StallId { get; set; }

  [Column("name")]
  [MaxLength(255)]
  public string Name { get; set; } = string.Empty;

  [Column("slug")]
  [MaxLength(255)]
  public string Slug { get; set; } = string.Empty;

  [Column("description")]
  public string? Description { get; set; }

  [Column("latitude")]
  public decimal Latitude { get; set; }

  [Column("longitude")]
  public decimal Longitude { get; set; }

  [Column("activation_radius")]
  public int ActivationRadius { get; set; } = 25;

  [Column("is_premium_content")]
  public bool IsPremiumContent { get; set; }

  [Column("status")]
  [MaxLength(30)]
  public string Status { get; set; } = "ACTIVE";

  [Column("sort_order")]
  public int SortOrder { get; set; }

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }

  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; }
}

[Table("poi_contents")]
public class PoiContent
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("poi_id")]
  public ulong PoiId { get; set; }

  [Column("lang")]
  [MaxLength(10)]
  public string Lang { get; set; } = "vi";

  [Column("title")]
  [MaxLength(255)]
  public string Title { get; set; } = string.Empty;

  [Column("short_text")]
  [MaxLength(500)]
  public string? ShortText { get; set; }

  [Column("tts_script")]
  public string TtsScript { get; set; } = string.Empty;

  [Column("audio_url")]
  [MaxLength(500)]
  public string? AudioUrl { get; set; }

  [Column("voice_profile")]
  [MaxLength(120)]
  public string? VoiceProfile { get; set; }

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }

  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; }
}

[Table("media_files")]
public class MediaFile
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("owner_id")]
  public ulong OwnerId { get; set; }

  [Column("stall_id")]
  public ulong? StallId { get; set; }

  [Column("poi_id")]
  public ulong? PoiId { get; set; }

  [Column("file_type")]
  [MaxLength(30)]
  public string FileType { get; set; } = "IMAGE";

  [Column("file_name")]
  [MaxLength(255)]
  public string FileName { get; set; } = string.Empty;

  [Column("file_path")]
  [MaxLength(500)]
  public string FilePath { get; set; } = string.Empty;

  [Column("mime_type")]
  [MaxLength(120)]
  public string MimeType { get; set; } = string.Empty;

  [Column("file_size")]
  public ulong FileSize { get; set; }

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }
}

[Table("qr_codes")]
public class QrCode
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("stall_id")]
  public ulong? StallId { get; set; }

  [Column("poi_id")]
  public ulong? PoiId { get; set; }

  [Column("qr_type")]
  [MaxLength(50)]
  public string QrType { get; set; } = "APP";

  [Column("qr_code_url")]
  [MaxLength(500)]
  public string QrCodeUrl { get; set; } = string.Empty;

  [Column("target_url")]
  [MaxLength(500)]
  public string TargetUrl { get; set; } = string.Empty;

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }
}

[Table("qr_scan_events")]
public class QrScanEvent
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("qr_code_id")]
  public ulong QrCodeId { get; set; }

  [Column("stall_id")]
  public ulong? StallId { get; set; }

  [Column("poi_id")]
  public ulong? PoiId { get; set; }

  [Column("user_id")]
  public ulong? UserId { get; set; }

  [Column("session_id")]
  [MaxLength(100)]
  public string SessionId { get; set; } = string.Empty;

  [Column("ip_address")]
  [MaxLength(45)]
  public string? IpAddress { get; set; }

  [Column("user_agent")]
  [MaxLength(500)]
  public string? UserAgent { get; set; }

  [Column("country_code")]
  [MaxLength(2)]
  public string? CountryCode { get; set; }

  [Column("scanned_at")]
  public DateTime ScannedAt { get; set; }
}

[Table("visit_events")]
public class VisitEvent
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("stall_id")]
  public ulong StallId { get; set; }

  [Column("poi_id")]
  public ulong? PoiId { get; set; }

  [Column("user_id")]
  public ulong? UserId { get; set; }

  [Column("session_id")]
  [MaxLength(100)]
  public string SessionId { get; set; } = string.Empty;

  [Column("latitude")]
  public decimal Latitude { get; set; }

  [Column("longitude")]
  public decimal Longitude { get; set; }

  [Column("distance_meters")]
  public decimal? DistanceMeters { get; set; }

  [Column("visited_at")]
  public DateTime VisitedAt { get; set; }
}

[Table("play_history")]
public class PlayHistory
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("user_id")]
  public ulong? UserId { get; set; }

  [Column("session_id")]
  [MaxLength(100)]
  public string SessionId { get; set; } = string.Empty;

  [Column("poi_id")]
  public ulong PoiId { get; set; }

  [Column("language_code")]
  [MaxLength(10)]
  public string LanguageCode { get; set; } = "vi";

  [Column("played_at")]
  public DateTime PlayedAt { get; set; }
}

[Table("payments")]
public class Payment
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("vendor_id")]
  public ulong? VendorId { get; set; }

  [Column("visitor_session_id")]
  public ulong? VisitorSessionId { get; set; }

  [Column("vendor_subscription_id")]
  public ulong? VendorSubscriptionId { get; set; }

  [Column("amount")]
  public decimal Amount { get; set; }

  [Column("currency")]
  [MaxLength(3)]
  public string Currency { get; set; } = "VND";

  [Column("provider")]
  [MaxLength(30)]
  public string Provider { get; set; } = "BANK_QR";

  [Column("payment_type")]
  [MaxLength(50)]
  public string PaymentType { get; set; } = "OTHER";

  [Column("status")]
  [MaxLength(30)]
  public string Status { get; set; } = "PENDING";

  [Column("transaction_code")]
  [MaxLength(255)]
  public string? TransactionCode { get; set; }

  [Column("provider_payload")]
  public string? ProviderPayload { get; set; }

  [Column("paid_at")]
  public DateTime? PaidAt { get; set; }

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }

  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; }
}

[Table("cash_reports")]
public class CashReport
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("stall_id")]
  public ulong StallId { get; set; }

  [Column("reported_by")]
  public ulong ReportedBy { get; set; }

  [Column("amount")]
  public decimal Amount { get; set; }

  [Column("note")]
  [MaxLength(1000)]
  public string? Note { get; set; }

  [Column("report_date")]
  public DateOnly ReportDate { get; set; }

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }
}

[Table("commissions")]
public class Commission
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("stall_id")]
  public ulong StallId { get; set; }

  [Column("payment_id")]
  public ulong PaymentId { get; set; }

  [Column("commission_rate")]
  public decimal CommissionRate { get; set; }

  [Column("commission_amount")]
  public decimal CommissionAmount { get; set; }

  [Column("status")]
  [MaxLength(30)]
  public string Status { get; set; } = "PENDING";

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }

  [Column("paid_at")]
  public DateTime? PaidAt { get; set; }
}

[Table("admin_logs")]
public class AdminLog
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("admin_id")]
  public ulong AdminId { get; set; }

  [Column("action")]
  [MaxLength(100)]
  public string Action { get; set; } = string.Empty;

  [Column("target_type")]
  [MaxLength(100)]
  public string TargetType { get; set; } = string.Empty;

  [Column("target_id")]
  public ulong? TargetId { get; set; }

  [Column("description")]
  [MaxLength(1000)]
  public string? Description { get; set; }

  [Column("created_at")]
  public DateTime CreatedAt { get; set; }
}

[Table("app_settings")]
public class AppSetting
{
  [Column("id")]
  public ulong Id { get; set; }

  [Column("setting_key")]
  [MaxLength(150)]
  public string SettingKey { get; set; } = string.Empty;

  [Column("setting_value")]
  public string? SettingValue { get; set; }

  [Column("description")]
  [MaxLength(500)]
  public string? Description { get; set; }

  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; }
}
