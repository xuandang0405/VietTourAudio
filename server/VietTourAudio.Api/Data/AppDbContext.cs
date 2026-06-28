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
  public DbSet<AdminPaymentConfig> AdminPaymentConfigs => Set<AdminPaymentConfig>();
  public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<User>(entity =>
    {
      entity.ToTable("users");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(255);
      entity.Property(x => x.PasswordHash).HasColumnName("pass_hash").HasMaxLength(255);
      entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(160);
      entity.Property(x => x.Role).HasColumnName("role").HasConversion<string>();
      entity.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
      entity.Property(x => x.AssignedZoneId).HasColumnName("assigned_zone_id");
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");
      entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
      entity.HasIndex(x => x.Email).IsUnique();
    });
    modelBuilder.Entity<VendorProfile>(entity =>
    {
      entity.ToTable("vendors");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.TradeName).HasColumnName("trade_name");
      entity.Property(x => x.Slug).HasColumnName("slug");
      entity.Property(x => x.VendorCode).HasColumnName("vendor_code");
      entity.Property(x => x.ContactEmail).HasColumnName("contact_email");
      entity.Property(x => x.Status).HasColumnName("status");
      entity.Property(x => x.FestivalZoneId).HasColumnName("assigned_tour_id");
      entity.HasIndex(x => x.VendorCode).IsUnique();
      entity.HasOne(x => x.Wallet).WithOne(x => x.Vendor).HasForeignKey<Wallet>(x => x.VendorId).OnDelete(DeleteBehavior.Cascade);
      entity.HasOne(x => x.FestivalZone).WithMany(x => x.Vendors).HasForeignKey(x => x.FestivalZoneId).OnDelete(DeleteBehavior.Cascade);
    });
    modelBuilder.Entity<FestivalZone>(entity =>
    {
      entity.ToTable("tours");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.Name).HasColumnName("name");
      entity.Property(x => x.Slug).HasColumnName("slug");
      entity.Property(x => x.Description).HasColumnName("description");
      entity.Property(x => x.CoverImageUrl).HasColumnName("cover_image_url");
      entity.Property(x => x.Latitude).HasColumnName("latitude");
      entity.Property(x => x.Longitude).HasColumnName("longitude");
      entity.Property(x => x.Status).HasColumnName("status");
      entity.Property(x => x.SortOrder).HasColumnName("sort_order");
      entity.HasIndex(x => x.Slug).IsUnique();
    });
    modelBuilder.Entity<Poi>(entity =>
    {
      entity.ToTable("zones");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.TourId).HasColumnName("tour_id");
      entity.Property(x => x.StallId).HasColumnName("stall_id");
      entity.Property(x => x.VendorId).HasColumnName("vendor_id");
      entity.Property(x => x.Name).HasColumnName("name");
      entity.Property(x => x.Slug).HasColumnName("slug");
      entity.Property(x => x.Description).HasColumnName("description");
      entity.Property(x => x.Latitude).HasColumnName("latitude");
      entity.Property(x => x.Longitude).HasColumnName("longitude");
      entity.Property(x => x.ActivationRadius).HasColumnName("activation_radius");
      entity.Property(x => x.IsPremiumContent).HasColumnName("is_premium_content");
      entity.Property(x => x.CoverUrl).HasColumnName("cover_url");
      entity.Property(x => x.Status).HasColumnName("status");
      entity.Property(x => x.ApprovalStatus).HasColumnName("approval_status").HasConversion<string>();
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");
      entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
      entity.HasIndex(x => new { x.StallId, x.Slug }).IsUnique();
      entity.HasOne(x => x.FestivalZone).WithMany(x => x.Pois).HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Cascade);
    });
    modelBuilder.Entity<PoiProduct>(entity =>
    {
      entity.ToTable("poi_products");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.PoiId).HasColumnName("poi_id");
      entity.Property(x => x.Name).HasColumnName("name");
      entity.Property(x => x.Price).HasColumnName("price");
      entity.HasOne(x => x.Poi).WithMany(x => x.Products).HasForeignKey(x => x.PoiId).OnDelete(DeleteBehavior.Cascade);
    });
    modelBuilder.Entity<Wallet>(entity =>
    {
      entity.ToTable("vendor_wallets");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.VendorId).HasColumnName("vendor_id");
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
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.WalletId).HasColumnName("wallet_id");
      entity.Property(x => x.VendorId).HasColumnName("vendor_id");
      entity.Property(x => x.TransactionType).HasColumnName("transaction_type");
      entity.Property(x => x.TransactionCategory).HasColumnName("transaction_category");
      entity.Property(x => x.Direction).HasColumnName("direction");
      entity.Property(x => x.Amount).HasColumnName("amount").HasPrecision(14, 2);
      entity.Property(x => x.BalanceBefore).HasColumnName("balance_before").HasPrecision(14, 2);
      entity.Property(x => x.BalanceAfter).HasColumnName("balance_after").HasPrecision(14, 2);
      entity.Property(x => x.Description).HasColumnName("description");
      entity.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
      entity.Property(x => x.Metadata).HasColumnName("metadata");
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");
      entity.HasOne(x => x.Wallet).WithMany(x => x.Transactions).HasForeignKey(x => x.WalletId).OnDelete(DeleteBehavior.Cascade);
      entity.HasIndex(x => new { x.VendorId, x.CreatedAt });
    });
    modelBuilder.Entity<SystemTicket>(entity =>
    {
      entity.ToTable("system_tickets");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id");
      entity.Property(x => x.SenderEmail).HasColumnName("sender_email");
      entity.Property(x => x.Subject).HasColumnName("subject");
      entity.Property(x => x.Message).HasColumnName("message");
      entity.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");
      entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
      entity.HasIndex(x => x.Status);
    });
    modelBuilder.Entity<AdminPaymentConfig>(entity =>
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
    modelBuilder.Entity<PaymentTransaction>(entity =>
    {
      entity.ToTable("payment_transactions");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Id).HasColumnName("id").HasColumnType("char(36)");
      entity.Property(x => x.SenderId).HasColumnName("sender_id").HasMaxLength(160);
      entity.Property(x => x.SenderType).HasColumnName("sender_type").HasMaxLength(20);
      entity.Property(x => x.PaymentMethod).HasColumnName("payment_method").HasMaxLength(20);
      entity.Property(x => x.TransactionType).HasColumnName("transaction_type").HasMaxLength(40);
      entity.Property(x => x.Amount).HasColumnName("amount").HasPrecision(14, 2);
      entity.Property(x => x.TransferMemo).HasColumnName("transfer_memo").HasMaxLength(255);
      entity.Property(x => x.ProofAttachmentUrl).HasColumnName("proof_attachment_url").HasMaxLength(600);
      entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
      entity.Property(x => x.CreatedAt).HasColumnName("created_at");
      entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
      entity.HasIndex(x => new { x.Status, x.CreatedAt });
      entity.HasIndex(x => x.TransferMemo).IsUnique();
    });
  }
}
