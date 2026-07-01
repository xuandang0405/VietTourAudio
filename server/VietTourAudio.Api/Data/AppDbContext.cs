using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Domain;

namespace VietTourAudio.Api.Data;

public class AppDbContext : DbContext
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
  {
  }

  public DbSet<User> Users => Set<User>();
  public DbSet<VendorProfile> Vendors => Set<VendorProfile>();
  public DbSet<FestivalZone> FestivalZones => Set<FestivalZone>();
  public DbSet<Poi> Pois => Set<Poi>();
  public DbSet<PoiProduct> PoiProducts => Set<PoiProduct>();
  public DbSet<Wallet> Wallets => Set<Wallet>();
  public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
  public DbSet<SystemTicket> SystemTickets => Set<SystemTicket>();
  public DbSet<VisitEvent> VisitEvents => Set<VisitEvent>();
  public DbSet<AudioPlayEvent> AudioPlayEvents => Set<AudioPlayEvent>();
  public DbSet<CauHinhThanhToan> AdminPaymentConfigs => Set<CauHinhThanhToan>();
  public DbSet<GiaoDichThanhToan> PaymentTransactions => Set<GiaoDichThanhToan>();
  public DbSet<GuestFavorite> GuestFavorites => Set<GuestFavorite>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<User>(entity =>
    {
      entity.ToTable("users");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(255);
      entity.Property(x => x.PasswordHash).HasColumnName("pass_hash").HasMaxLength(255);
      entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(160);
      entity.Property(x => x.Role).HasColumnName("role").HasConversion<string>();
      entity.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
      entity.Property(x => x.IsPremiumActive).HasColumnName("is_premium_active");
      entity.Property(x => x.PremiumExpiryDate).HasColumnName("premium_expiry_date");
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");
      entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
      entity.HasIndex(x => x.Email).IsUnique();
    });

    modelBuilder.Entity<VendorProfile>(entity =>
    {
      entity.ToTable("Vendors");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.FestivalZoneId).HasColumnName("festival_zone_id").HasMaxLength(36);
      entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(255);
      entity.Property(x => x.TradeName).HasColumnName("trade_name").HasMaxLength(255);
      entity.Property(x => x.IsPremium).HasColumnName("is_premium");
      entity.Property(x => x.PremiumActivationDate).HasColumnName("premium_activation_date");
      entity.Property(x => x.PremiumExpiryDate).HasColumnName("premium_expiry_date");
      entity.Property(x => x.SubscriptionExpiryDate).HasColumnName("subscription_expiry_date");
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");

      entity.HasIndex(x => x.Email).IsUnique();
      entity.HasOne(x => x.Wallet).WithOne(x => x.Vendor).HasForeignKey<Wallet>(x => x.VendorId).OnDelete(DeleteBehavior.Cascade);
      entity.HasOne(x => x.FestivalZone).WithMany(x => x.Vendors).HasForeignKey(x => x.FestivalZoneId).OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<FestivalZone>(entity =>
    {
      entity.ToTable("FestivalZones");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.ZoneCode).HasColumnName("zone_code").HasMaxLength(50);
      entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255);
      entity.Property(x => x.Slug).HasColumnName("slug").HasMaxLength(255);
      entity.Property(x => x.Latitude).HasColumnName("latitude");
      entity.Property(x => x.Longitude).HasColumnName("longitude");
      entity.Property(x => x.CoverUrl).HasColumnName("cover_url").HasMaxLength(500);
      entity.Property(x => x.Description).HasColumnName("description");
      entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(50);
      entity.Property(x => x.SortOrder).HasColumnName("sort_order");
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");

      entity.HasIndex(x => x.ZoneCode).IsUnique();
      entity.HasIndex(x => x.Slug).IsUnique();
    });

    modelBuilder.Entity<Poi>(entity =>
    {
      entity.ToTable("Pois");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.FestivalZoneId).HasColumnName("festival_zone_id").HasMaxLength(36);
      entity.Property(x => x.VendorId).HasColumnName("vendor_id").HasMaxLength(36);
      entity.Property(x => x.StallName).HasColumnName("stall_name").HasMaxLength(255);
      entity.Property(x => x.StallNameEn).HasColumnName("stall_name_en").HasMaxLength(255);
      entity.Property(x => x.StallNameJa).HasColumnName("stall_name_ja").HasMaxLength(255);
      entity.Property(x => x.StallNameKo).HasColumnName("stall_name_ko").HasMaxLength(255);
      entity.Property(x => x.StallNameZh).HasColumnName("stall_name_zh").HasMaxLength(255);
      entity.Property(x => x.Slug).HasColumnName("slug").HasMaxLength(255);
      entity.Property(x => x.Description).HasColumnName("description");
      entity.Property(x => x.DescriptionEn).HasColumnName("description_en");
      entity.Property(x => x.DescriptionJa).HasColumnName("description_ja");
      entity.Property(x => x.DescriptionKo).HasColumnName("description_ko");
      entity.Property(x => x.DescriptionZh).HasColumnName("description_zh");
      entity.Property(x => x.Latitude).HasColumnName("latitude");
      entity.Property(x => x.Longitude).HasColumnName("longitude");
      entity.Property(x => x.CoverUrl).HasColumnName("cover_url").HasMaxLength(500);
      entity.Property(x => x.PendingName).HasColumnName("pending_name").HasMaxLength(255);
      entity.Property(x => x.PendingDescription).HasColumnName("pending_description");
      entity.Property(x => x.PendingCoverUrl).HasColumnName("pending_cover_image_url").HasMaxLength(500);
      entity.Property(x => x.PendingLatitude).HasColumnName("pending_latitude");
      entity.Property(x => x.PendingLongitude).HasColumnName("pending_longitude");
      entity.Property(x => x.PendingNameEn).HasColumnName("pending_name_en").HasMaxLength(255);
      entity.Property(x => x.PendingNameJa).HasColumnName("pending_name_ja").HasMaxLength(255);
      entity.Property(x => x.PendingNameKo).HasColumnName("pending_name_ko").HasMaxLength(255);
      entity.Property(x => x.PendingNameZh).HasColumnName("pending_name_zh").HasMaxLength(255);
      entity.Property(x => x.PendingDescriptionEn).HasColumnName("pending_description_en");
      entity.Property(x => x.PendingDescriptionJa).HasColumnName("pending_description_ja");
      entity.Property(x => x.PendingDescriptionKo).HasColumnName("pending_description_ko");
      entity.Property(x => x.PendingDescriptionZh).HasColumnName("pending_description_zh");
      entity.Property(x => x.ApprovalStatus).HasColumnName("approval_status").HasMaxLength(50);
      entity.Property(x => x.IsPremiumPriority).HasColumnName("is_premium_priority");
      entity.Property(x => x.TriggerRadius).HasColumnName("trigger_radius");
      entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(50);
      entity.Property(x => x.SortOrder).HasColumnName("sort_order");
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");
      entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");

      entity.HasOne(x => x.FestivalZone).WithMany(x => x.Pois).HasForeignKey(x => x.FestivalZoneId).OnDelete(DeleteBehavior.Cascade);
      entity.HasOne(x => x.Vendor).WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<PoiProduct>(entity =>
    {
      entity.ToTable("StallProducts");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.PoiId).HasColumnName("poi_id").HasMaxLength(36);
      entity.Property(x => x.ProductName).HasColumnName("product_name").HasMaxLength(255);
      entity.Property(x => x.ProductNameEn).HasColumnName("product_name_en").HasMaxLength(255);
      entity.Property(x => x.ProductNameJa).HasColumnName("product_name_ja").HasMaxLength(255);
      entity.Property(x => x.ProductNameKo).HasColumnName("product_name_ko").HasMaxLength(255);
      entity.Property(x => x.ProductNameZh).HasColumnName("product_name_zh").HasMaxLength(255);
      entity.Property(x => x.Price).HasColumnName("price").HasPrecision(18, 2);
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");

      entity.HasOne(x => x.Poi).WithMany(x => x.Products).HasForeignKey(x => x.PoiId).OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<Wallet>(entity =>
    {
      entity.ToTable("vendor_wallets");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.VendorId).HasColumnName("vendor_id").HasMaxLength(36);
      entity.Property(x => x.Balance).HasColumnName("balance").HasPrecision(14, 2);
      entity.Property(x => x.PromoBalance).HasColumnName("promo_balance").HasPrecision(14, 2);
      entity.Property(x => x.TotalTopUp).HasColumnName("total_top_up").HasPrecision(14, 2);
      entity.Property(x => x.TotalSpent).HasColumnName("total_spent").HasPrecision(14, 2);

      entity.HasIndex(x => x.VendorId).IsUnique();
    });

    modelBuilder.Entity<WalletTransaction>(entity =>
    {
      entity.ToTable("wallet_transactions");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.WalletId).HasColumnName("wallet_id").HasMaxLength(36);
      entity.Property(x => x.VendorId).HasColumnName("vendor_id").HasMaxLength(36);
      entity.Property(x => x.TransactionType).HasColumnName("transaction_type").HasMaxLength(20);
      entity.Property(x => x.TransactionCategory).HasColumnName("transaction_category").HasMaxLength(40);
      entity.Property(x => x.Direction).HasColumnName("direction").HasMaxLength(10);
      entity.Property(x => x.Amount).HasColumnName("amount").HasPrecision(14, 2);
      entity.Property(x => x.BalanceBefore).HasColumnName("balance_before").HasPrecision(14, 2);
      entity.Property(x => x.BalanceAfter).HasColumnName("balance_after").HasPrecision(14, 2);
      entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(600);
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");

      entity.HasOne(x => x.Wallet).WithMany(x => x.Transactions).HasForeignKey(x => x.WalletId).OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<SystemTicket>(entity =>
    {
      entity.ToTable("system_tickets");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.UserId).HasColumnName("user_id").HasMaxLength(36);
      entity.Property(x => x.SenderType).HasColumnName("sender_type").HasMaxLength(20);
      entity.Property(x => x.SenderEmail).HasColumnName("sender_email").HasMaxLength(255);
      entity.Property(x => x.Subject).HasColumnName("subject").HasMaxLength(255);
      entity.Property(x => x.Message).HasColumnName("message");
      entity.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20);
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");
      entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
      entity.HasIndex(x => x.UserId);
    });

    modelBuilder.Entity<VisitEvent>(entity =>
    {
      entity.ToTable("visit_events");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.PoiId).HasColumnName("poi_id").HasMaxLength(36);
      entity.Property(x => x.VendorId).HasColumnName("vendor_id").HasMaxLength(36);
      entity.Property(x => x.UserId).HasColumnName("user_id").HasMaxLength(36);
      entity.Property(x => x.SessionId).HasColumnName("session_id").HasMaxLength(160);
      entity.Property(x => x.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
      entity.Property(x => x.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
      entity.Property(x => x.DistanceMeters).HasColumnName("distance_meters").HasPrecision(10, 2);
      entity.Property(x => x.Source).HasColumnName("source").HasMaxLength(20);
      entity.Property(x => x.VisitedAt).HasColumnName("visited_at");
      entity.HasIndex(x => new { x.PoiId, x.VisitedAt });
      entity.HasIndex(x => new { x.VendorId, x.VisitedAt });
      entity.HasIndex(x => new { x.SessionId, x.VisitedAt });
    });

    modelBuilder.Entity<AudioPlayEvent>(entity =>
    {
      entity.ToTable("audio_play_events");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.PoiId).HasColumnName("poi_id").HasMaxLength(36);
      entity.Property(x => x.VendorId).HasColumnName("vendor_id").HasMaxLength(36);
      entity.Property(x => x.UserId).HasColumnName("user_id").HasMaxLength(36);
      entity.Property(x => x.SessionId).HasColumnName("session_id").HasMaxLength(160);
      entity.Property(x => x.LanguageCode).HasColumnName("language_code").HasMaxLength(10);
      entity.Property(x => x.Source).HasColumnName("source").HasMaxLength(20);
      entity.Property(x => x.PlayedAt).HasColumnName("played_at");
      entity.HasIndex(x => new { x.PoiId, x.PlayedAt });
      entity.HasIndex(x => new { x.VendorId, x.PlayedAt });
      entity.HasIndex(x => new { x.SessionId, x.PlayedAt });
    });

    modelBuilder.Entity<CauHinhThanhToan>(entity =>
    {
      entity.ToTable("admin_payment_configs");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.GatewayType).HasColumnName("gateway_type").HasMaxLength(20);
      entity.Property(x => x.AccountName).HasColumnName("account_name").HasMaxLength(255);
      entity.Property(x => x.AccountNumber).HasColumnName("account_number").HasMaxLength(120);
      entity.Property(x => x.QrCodeUrl).HasColumnName("qr_code_url").HasMaxLength(600);
      entity.Property(x => x.TransferMemoPattern).HasColumnName("transfer_memo_pattern").HasMaxLength(255);
      entity.Property(x => x.IsActive).HasColumnName("is_active");
      entity.HasIndex(x => x.GatewayType).IsUnique();
    });

    modelBuilder.Entity<GiaoDichThanhToan>(entity =>
    {
      entity.ToTable("payment_transactions");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
      entity.Property(x => x.SenderId).HasColumnName("sender_id").HasMaxLength(160);
      entity.Property(x => x.SenderType).HasColumnName("sender_type").HasMaxLength(20);
      entity.Property(x => x.PaymentMethod).HasColumnName("payment_method").HasMaxLength(20);
      entity.Property(x => x.TransactionType).HasColumnName("transaction_type").HasMaxLength(40);
      entity.Property(x => x.Amount).HasColumnName("amount").HasPrecision(14, 2);
      entity.Property(x => x.TransferMemo).HasColumnName("transfer_memo").HasMaxLength(255);
      entity.Property(x => x.PendingKey).HasColumnName("pending_key").HasMaxLength(64);
      entity.Property(x => x.ProofAttachmentUrl).HasColumnName("proof_attachment_url").HasMaxLength(600);
      entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");
      entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
      entity.HasIndex(x => x.TransferMemo).IsUnique();
      entity.HasIndex(x => x.PendingKey).IsUnique();
    });

    modelBuilder.Entity<GuestFavorite>(entity =>
    {
      entity.ToTable("favorites");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.GuestId).HasColumnName("guest_id").HasMaxLength(255);
      entity.Property(x => x.PoiId).HasColumnName("poi_id").HasMaxLength(36);
      entity.Property(x => x.CreatedAt).HasColumnName("added_at");
      entity.HasOne(x => x.Poi).WithMany().HasForeignKey(x => x.PoiId).OnDelete(DeleteBehavior.Cascade);
    });
  }
}
