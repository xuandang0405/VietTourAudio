using System;
using System.Collections.Generic;

namespace VietTourAudio.Api.Domain;

public enum UserRole { SUPER_ADMIN, ADMIN, ZONE_ADMIN, MODERATOR, FINANCE, VENDOR, USER }
public enum UserStatus { ACTIVE, LOCKED, PENDING, DISABLED }
public enum ApprovalStatus { PENDING, APPROVED, REJECTED }
public enum TicketStatus { PENDING, IN_PROGRESS, PROCESSED, CLOSED }

public interface IEntity
{
}

public sealed class User : IEntity
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string Email { get; set; } = "";
  public string PasswordHash { get; set; } = "";
  public string FullName { get; set; } = "";
  public UserRole Role { get; set; }
  public UserStatus Status { get; set; }
  public bool IsPremiumActive { get; set; }
  public DateTime? PremiumExpiryDate { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class VendorProfile : IEntity
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string FestivalZoneId { get; set; } = "";
  public string Email { get; set; } = "";
  public string TradeName { get; set; } = "";
  public bool IsPremium { get; set; }
  public DateTime? PremiumActivationDate { get; set; }
  public DateTime? PremiumExpiryDate { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public FestivalZone FestivalZone { get; set; } = null!;
  public Wallet? Wallet { get; set; }
}

public sealed class FestivalZone : IEntity
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string ZoneCode { get; set; } = "";
  public string Name { get; set; } = "";
  public string Slug { get; set; } = "";
  public double Latitude { get; set; }
  public double Longitude { get; set; }
  public string? CoverUrl { get; set; }
  public string? Description { get; set; }
  public string Status { get; set; } = "DRAFT";
  public int SortOrder { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public ICollection<Poi> Pois { get; set; } = new List<Poi>();
  public ICollection<VendorProfile> Vendors { get; set; } = new List<VendorProfile>();
}

public sealed class Poi : IEntity
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string FestivalZoneId { get; set; } = "";
  public string? VendorId { get; set; }
  public string StallName { get; set; } = "";
  public string? StallNameEn { get; set; }
  public string? StallNameJa { get; set; }
  public string? StallNameKo { get; set; }
  public string? StallNameZh { get; set; }
  public string Slug { get; set; } = "";
  public string? Description { get; set; }
  public string? DescriptionEn { get; set; }
  public string? DescriptionJa { get; set; }
  public string? DescriptionKo { get; set; }
  public string? DescriptionZh { get; set; }
  public double Latitude { get; set; }
  public double Longitude { get; set; }
  public string? CoverUrl { get; set; }
  public string? PendingName { get; set; }
  public string? PendingDescription { get; set; }
  public string? PendingCoverUrl { get; set; }
  public double? PendingLatitude { get; set; }
  public double? PendingLongitude { get; set; }
  public string ApprovalStatus { get; set; } = "PENDING";
  public bool IsPremiumPriority { get; set; }
  public double TriggerRadius { get; set; } = 3.0;
  public string Status { get; set; } = "ACTIVE";
  public int SortOrder { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
  public string? PendingNameEn { get; set; }
  public string? PendingNameJa { get; set; }
  public string? PendingNameKo { get; set; }
  public string? PendingNameZh { get; set; }
  public string? PendingDescriptionEn { get; set; }
  public string? PendingDescriptionJa { get; set; }
  public string? PendingDescriptionKo { get; set; }
  public string? PendingDescriptionZh { get; set; }

  // Navigation properties
  public FestivalZone FestivalZone { get; set; } = null!;
  public VendorProfile? Vendor { get; set; }
  public ICollection<PoiProduct> Products { get; set; } = new List<PoiProduct>();
}

public sealed class PoiProduct : IEntity
{
  public int Id { get; set; }
  public string PoiId { get; set; } = "";
  public string ProductName { get; set; } = "";
  public string? ProductNameEn { get; set; }
  public string? ProductNameJa { get; set; }
  public string? ProductNameKo { get; set; }
  public string? ProductNameZh { get; set; }
  public decimal Price { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public Poi Poi { get; set; } = null!;
}

public sealed class Wallet : IEntity
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string VendorId { get; set; } = "";
  public decimal Balance { get; set; }
  public decimal PromoBalance { get; set; }
  public decimal TotalTopUp { get; set; }
  public decimal TotalSpent { get; set; }

  // Navigation properties
  public VendorProfile Vendor { get; set; } = null!;
  public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}

public sealed class WalletTransaction : IEntity
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string WalletId { get; set; } = "";
  public string VendorId { get; set; } = "";
  public string TransactionType { get; set; } = "";
  public string TransactionCategory { get; set; } = "";
  public string Direction { get; set; } = "";
  public decimal Amount { get; set; }
  public decimal BalanceBefore { get; set; }
  public decimal BalanceAfter { get; set; }
  public string? Description { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public Wallet Wallet { get; set; } = null!;
}

public sealed class SystemTicket : IEntity
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string? UserId { get; set; }
  public string SenderType { get; set; } = "GUEST";
  public string SenderEmail { get; set; } = "";
  public string Subject { get; set; } = "";
  public string Message { get; set; } = "";
  public TicketStatus Status { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class VisitEvent : IEntity
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string PoiId { get; set; } = "";
  public string? VendorId { get; set; }
  public string? UserId { get; set; }
  public string SessionId { get; set; } = "";
  public decimal? Latitude { get; set; }
  public decimal? Longitude { get; set; }
  public decimal? DistanceMeters { get; set; }
  public string Source { get; set; } = "GPS";
  public DateTime VisitedAt { get; set; } = DateTime.UtcNow;
}

public sealed class AudioPlayEvent : IEntity
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string PoiId { get; set; } = "";
  public string? VendorId { get; set; }
  public string? UserId { get; set; }
  public string SessionId { get; set; } = "";
  public string LanguageCode { get; set; } = "vi";
  public string Source { get; set; } = "MANUAL";
  public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
}

public sealed class AdminPaymentConfig
{
  public int Id { get; set; }
  public string GatewayType { get; set; } = "";
  public string AccountName { get; set; } = "";
  public string AccountNumber { get; set; } = "";
  public string? QrCodeUrl { get; set; }
  public string TransferMemoPattern { get; set; } = "VTA PREMIUM [Id]";
  public bool IsActive { get; set; } = true;
}

public sealed class PaymentTransaction
{
  public string Id { get; set; } = Guid.NewGuid().ToString("N");
  public string SenderId { get; set; } = "";
  public string SenderType { get; set; } = "";
  public string PaymentMethod { get; set; } = "";
  public string TransactionType { get; set; } = "";
  public decimal Amount { get; set; }
  public string TransferMemo { get; set; } = "";
  public string? PendingKey { get; set; }
  public string? ProofAttachmentUrl { get; set; }
  public string Status { get; set; } = "PENDING";
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
