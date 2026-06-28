namespace VietTourAudio.Api.Domain;

public enum UserRole { SUPER_ADMIN, ADMIN, ZONE_ADMIN, MODERATOR, FINANCE, VENDOR, USER }
public enum UserStatus { ACTIVE, LOCKED, PENDING, DISABLED }
public enum ApprovalStatus { PENDING, APPROVED, REJECTED }
public enum TicketStatus { PENDING, IN_PROGRESS, PROCESSED, CLOSED }

public interface IEntity
{
  ulong Id { get; set; }
}

public sealed class User : IEntity
{
  public ulong Id { get; set; }
  public string Email { get; set; } = "";
  public string PasswordHash { get; set; } = "";
  public string FullName { get; set; } = "";
  public UserRole Role { get; set; }
  public UserStatus Status { get; set; }
  public ulong? AssignedZoneId { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime UpdatedAt { get; set; }
}

public sealed class VendorProfile : IEntity
{
  public ulong Id { get; set; }
  public string TradeName { get; set; } = "";
  public string Slug { get; set; } = "";
  public string VendorCode { get; set; } = "";
  public string ContactEmail { get; set; } = "";
  public string Status { get; set; } = "PENDING";
  public ulong? AssignedTourId { get; set; }
  public Wallet? Wallet { get; set; }
}

public sealed class FestivalZone : IEntity
{
  public ulong Id { get; set; }
  public ulong VendorId { get; set; }
  public string Name { get; set; } = "";
  public string Slug { get; set; } = "";
  public string? Description { get; set; }
  public string? CoverImageUrl { get; set; }
  public decimal? Latitude { get; set; }
  public decimal? Longitude { get; set; }
  public string Status { get; set; } = "DRAFT";
  public int SortOrder { get; set; }
  public ICollection<Poi> Pois { get; set; } = [];
}

public sealed class Poi : IEntity
{
  public ulong Id { get; set; }
  public ulong TourId { get; set; }
  public ulong StallId { get; set; }
  public ulong? VendorId { get; set; }
  public string Name { get; set; } = "";
  public string Slug { get; set; } = "";
  public string? Description { get; set; }
  public decimal Latitude { get; set; }
  public decimal Longitude { get; set; }
  public int ActivationRadius { get; set; }
  public string? CoverUrl { get; set; }
  public string Status { get; set; } = "ACTIVE";
  public ApprovalStatus ApprovalStatus { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
  public FestivalZone FestivalZone { get; set; } = null!;
  public ICollection<PoiProduct> Products { get; set; } = [];
}

public sealed class PoiProduct : IEntity
{
  public ulong Id { get; set; }
  public ulong PoiId { get; set; }
  public string Name { get; set; } = "";
  public decimal Price { get; set; }
  public Poi Poi { get; set; } = null!;
}

public sealed class Wallet : IEntity
{
  public ulong Id { get; set; }
  public ulong VendorId { get; set; }
  public decimal Balance { get; set; }
  public decimal PromoBalance { get; set; }
  public decimal TotalTopUp { get; set; }
  public decimal TotalSpent { get; set; }
  public VendorProfile Vendor { get; set; } = null!;
  public ICollection<WalletTransaction> Transactions { get; set; } = [];
}

public sealed class WalletTransaction : IEntity
{
  public ulong Id { get; set; }
  public ulong WalletId { get; set; }
  public ulong VendorId { get; set; }
  public string TransactionType { get; set; } = "";
  public string TransactionCategory { get; set; } = "";
  public string Direction { get; set; } = "";
  public decimal Amount { get; set; }
  public decimal BalanceBefore { get; set; }
  public decimal BalanceAfter { get; set; }
  public string? Description { get; set; }
  public ulong? CreatedByUserId { get; set; }
  public string? Metadata { get; set; }
  public DateTime CreatedAt { get; set; }
  public Wallet Wallet { get; set; } = null!;
}

public sealed class SystemTicket : IEntity
{
  public ulong Id { get; set; }
  public string SenderEmail { get; set; } = "";
  public string Subject { get; set; } = "";
  public string Message { get; set; } = "";
  public TicketStatus Status { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime UpdatedAt { get; set; }
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
  public Guid Id { get; set; }
  public string SenderId { get; set; } = "";
  public string SenderType { get; set; } = "";
  public string PaymentMethod { get; set; } = "";
  public string TransactionType { get; set; } = "";
  public decimal Amount { get; set; }
  public string TransferMemo { get; set; } = "";
  public string? ProofAttachmentUrl { get; set; }
  public string Status { get; set; } = "PENDING";
  public DateTime CreatedAt { get; set; }
  public DateTime UpdatedAt { get; set; }
}
