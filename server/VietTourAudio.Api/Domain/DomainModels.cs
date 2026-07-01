using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace VietTourAudio.Api.Domain;

public enum UserRole { SUPER_ADMIN, ADMIN, ZONE_ADMIN, MODERATOR, FINANCE, VENDOR, USER }
public enum UserStatus { ACTIVE, LOCKED, PENDING, DISABLED }
public enum ApprovalStatus { PENDING, APPROVED, REJECTED }
public enum TicketStatus { PENDING, IN_PROGRESS, PROCESSED, CLOSED }

public interface IEntity
{
}

[Table("users")]
public sealed class User : IEntity
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("email")]
  public string Email { get; set; } = "";
  [Column("pass_hash")]
  public string PasswordHash { get; set; } = "";
  [Column("full_name")]
  public string FullName { get; set; } = "";
  [Column("role")]
  public UserRole Role { get; set; }
  [Column("status")]
  public UserStatus Status { get; set; }
  [Column("is_premium_active")]
  public bool IsPremiumActive { get; set; }
  [Column("premium_expiry_date")]
  public DateTime? PremiumExpiryDate { get; set; }
  [Column("created_at")]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("Vendors")]
public sealed class VendorProfile : IEntity
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("festival_zone_id")]
  public string FestivalZoneId { get; set; } = "";
  [Column("email")]
  public string Email { get; set; } = "";
  [Column("trade_name")]
  public string TradeName { get; set; } = "";
  [Column("is_premium")]
  public bool IsPremium { get; set; }
  [Column("premium_activation_date")]
  public DateTime? PremiumActivationDate { get; set; }
  [Column("premium_expiry_date")]
  public DateTime? PremiumExpiryDate { get; set; }
  [Column("subscription_expiry_date")]
  public DateTime? SubscriptionExpiryDate { get; set; }
  [Column("created_at")]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public FestivalZone FestivalZone { get; set; } = null!;
  public Wallet? Wallet { get; set; }
}

[Table("FestivalZones")]
public sealed class FestivalZone : IEntity
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("zone_code")]
  public string ZoneCode { get; set; } = "";
  [Column("name")]
  public string Name { get; set; } = "";
  [Column("slug")]
  public string Slug { get; set; } = "";
  [Column("latitude")]
  public double Latitude { get; set; }
  [Column("longitude")]
  public double Longitude { get; set; }
  [Column("cover_url")]
  public string? CoverUrl { get; set; }
  [Column("description")]
  public string? Description { get; set; }
  [Column("status")]
  public string Status { get; set; } = "DRAFT";
  [Column("sort_order")]
  public int SortOrder { get; set; }
  [Column("created_at")]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public ICollection<Poi> Pois { get; set; } = new List<Poi>();
  public ICollection<VendorProfile> Vendors { get; set; } = new List<VendorProfile>();
}

[Table("Pois")]
public sealed class Poi : IEntity
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("festival_zone_id")]
  public string FestivalZoneId { get; set; } = "";
  [Column("vendor_id")]
  public string? VendorId { get; set; }
  [Column("stall_name")]
  public string StallName { get; set; } = "";
  [Column("stall_name_en")]
  public string? StallNameEn { get; set; }
  [Column("stall_name_ja")]
  public string? StallNameJa { get; set; }
  [Column("stall_name_ko")]
  public string? StallNameKo { get; set; }
  [Column("stall_name_zh")]
  public string? StallNameZh { get; set; }
  [Column("slug")]
  public string Slug { get; set; } = "";
  [Column("description")]
  public string? Description { get; set; }
  [Column("description_en")]
  public string? DescriptionEn { get; set; }
  [Column("description_ja")]
  public string? DescriptionJa { get; set; }
  [Column("description_ko")]
  public string? DescriptionKo { get; set; }
  [Column("description_zh")]
  public string? DescriptionZh { get; set; }
  [Column("latitude")]
  public double Latitude { get; set; }
  [Column("longitude")]
  public double Longitude { get; set; }
  [Column("cover_url")]
  public string? CoverUrl { get; set; }
  [Column("pending_name")]
  public string? PendingName { get; set; }
  [Column("pending_description")]
  public string? PendingDescription { get; set; }
  [Column("pending_cover_image_url")]
  public string? PendingCoverUrl { get; set; }
  [Column("pending_latitude")]
  public double? PendingLatitude { get; set; }
  [Column("pending_longitude")]
  public double? PendingLongitude { get; set; }
  [Column("approval_status")]
  public string ApprovalStatus { get; set; } = "PENDING";
  [Column("is_premium_priority")]
  public bool IsPremiumPriority { get; set; }
  [Column("trigger_radius")]
  public double TriggerRadius { get; set; } = 3.0;
  [Column("status")]
  public string Status { get; set; } = "ACTIVE";
  [Column("sort_order")]
  public int SortOrder { get; set; }
  [Column("created_at")]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
  [Column("pending_name_en")]
  public string? PendingNameEn { get; set; }
  [Column("pending_name_ja")]
  public string? PendingNameJa { get; set; }
  [Column("pending_name_ko")]
  public string? PendingNameKo { get; set; }
  [Column("pending_name_zh")]
  public string? PendingNameZh { get; set; }
  [Column("pending_description_en")]
  public string? PendingDescriptionEn { get; set; }
  [Column("pending_description_ja")]
  public string? PendingDescriptionJa { get; set; }
  [Column("pending_description_ko")]
  public string? PendingDescriptionKo { get; set; }
  [Column("pending_description_zh")]
  public string? PendingDescriptionZh { get; set; }

  // Navigation properties
  public FestivalZone FestivalZone { get; set; } = null!;
  public VendorProfile? Vendor { get; set; }
  public ICollection<PoiProduct> Products { get; set; } = new List<PoiProduct>();
}

[Table("StallProducts")]
public sealed class PoiProduct : IEntity
{
  [Column("id")]
  public int Id { get; set; }
  [Column("poi_id")]
  public string PoiId { get; set; } = "";
  [Column("product_name")]
  public string ProductName { get; set; } = "";
  [Column("product_name_en")]
  public string? ProductNameEn { get; set; }
  [Column("product_name_ja")]
  public string? ProductNameJa { get; set; }
  [Column("product_name_ko")]
  public string? ProductNameKo { get; set; }
  [Column("product_name_zh")]
  public string? ProductNameZh { get; set; }
  [Column("price")]
  public decimal Price { get; set; }
  [Column("created_at")]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public Poi Poi { get; set; } = null!;
}

[Table("vendor_wallets")]
public sealed class Wallet : IEntity
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("vendor_id")]
  public string VendorId { get; set; } = "";
  [Column("balance")]
  public decimal Balance { get; set; }
  [Column("promo_balance")]
  public decimal PromoBalance { get; set; }
  [Column("total_top_up")]
  public decimal TotalTopUp { get; set; }
  [Column("total_spent")]
  public decimal TotalSpent { get; set; }

  // Navigation properties
  public VendorProfile Vendor { get; set; } = null!;
  public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}

[Table("wallet_transactions")]
public sealed class WalletTransaction : IEntity
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("wallet_id")]
  public string WalletId { get; set; } = "";
  [Column("vendor_id")]
  public string VendorId { get; set; } = "";
  [Column("transaction_type")]
  public string TransactionType { get; set; } = "";
  [Column("transaction_category")]
  public string TransactionCategory { get; set; } = "";
  [Column("direction")]
  public string Direction { get; set; } = "";
  [Column("amount")]
  public decimal Amount { get; set; }
  [Column("balance_before")]
  public decimal BalanceBefore { get; set; }
  [Column("balance_after")]
  public decimal BalanceAfter { get; set; }
  [Column("description")]
  public string? Description { get; set; }
  [Column("created_at")]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public Wallet Wallet { get; set; } = null!;
}

[Table("system_tickets")]
public sealed class SystemTicket : IEntity
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("user_id")]
  public string? UserId { get; set; }
  [Column("sender_type")]
  public string SenderType { get; set; } = "GUEST";
  [Column("sender_email")]
  public string SenderEmail { get; set; } = "";
  [Column("subject")]
  public string Subject { get; set; } = "";
  [Column("message")]
  public string Message { get; set; } = "";
  [Column("status")]
  public TicketStatus Status { get; set; }
  [Column("created_at")]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("visit_events")]
public sealed class VisitEvent : IEntity
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("poi_id")]
  public string PoiId { get; set; } = "";
  [Column("vendor_id")]
  public string? VendorId { get; set; }
  [Column("user_id")]
  public string? UserId { get; set; }
  [Column("session_id")]
  public string SessionId { get; set; } = "";
  [Column("latitude")]
  public decimal? Latitude { get; set; }
  [Column("longitude")]
  public decimal? Longitude { get; set; }
  [Column("distance_meters")]
  public decimal? DistanceMeters { get; set; }
  [Column("source")]
  public string Source { get; set; } = "GPS";
  [Column("visited_at")]
  public DateTime VisitedAt { get; set; } = DateTime.UtcNow;
}

[Table("audio_play_events")]
public sealed class AudioPlayEvent : IEntity
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("poi_id")]
  public string PoiId { get; set; } = "";
  [Column("vendor_id")]
  public string? VendorId { get; set; }
  [Column("user_id")]
  public string? UserId { get; set; }
  [Column("session_id")]
  public string SessionId { get; set; } = "";
  [Column("language_code")]
  public string LanguageCode { get; set; } = "vi";
  [Column("source")]
  public string Source { get; set; } = "MANUAL";
  [Column("played_at")]
  public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
}

[Table("admin_payment_configs")]
public sealed class CauHinhThanhToan
{
  [Column("id")]
  public int Id { get; set; }
  [Column("gateway_type")]
  public string GatewayType { get; set; } = "";
  [Column("account_name")]
  public string AccountName { get; set; } = "";
  [Column("account_number")]
  public string AccountNumber { get; set; } = "";
  [Column("qr_code_url")]
  public string? QrCodeUrl { get; set; }
  [Column("transfer_memo_pattern")]
  public string TransferMemoPattern { get; set; } = "VTA PREMIUM [Id]";
  [Column("is_active")]
  public bool IsActive { get; set; } = true;
}

[Table("payment_transactions")]
public sealed class GiaoDichThanhToan
{
  [Column("id")]
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  [Column("sender_id")]
  public string SenderId { get; set; } = "";
  [Column("sender_type")]
  public string SenderType { get; set; } = "";
  [Column("payment_method")]
  public string PaymentMethod { get; set; } = "";
  [Column("transaction_type")]
  public string TransactionType { get; set; } = "";
  [Column("amount")]
  public decimal Amount { get; set; }
  [Column("transfer_memo")]
  public string TransferMemo { get; set; } = "";
  [Column("pending_key")]
  public string? PendingKey { get; set; }
  [Column("proof_attachment_url")]
  public string? ProofAttachmentUrl { get; set; }
  [Column("status")]
  public string Status { get; set; } = "PENDING";
  [Column("created_at")]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  [Column("updated_at")]
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("favorites")]
public sealed class GuestFavorite : IEntity
{
  [Column("id")]
  public int Id { get; set; }

  [Column("guest_id")]
  public string GuestId { get; set; } = "";

  [Column("poi_id")]
  public string PoiId { get; set; } = "";

  [Column("added_at")]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public Poi Poi { get; set; } = null!;
}

