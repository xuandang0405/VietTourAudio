using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Entities;

namespace VietTourAudio.Api.Data;

public class AppDbContext : DbContext
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
  {
  }

  public DbSet<User> Users => Set<User>();
  public DbSet<Stall> Stalls => Set<Stall>();
  public DbSet<StallSubscription> StallSubscriptions => Set<StallSubscription>();
  public DbSet<Poi> Pois => Set<Poi>();
  public DbSet<PoiContent> PoiContents => Set<PoiContent>();
  public DbSet<MediaFile> MediaFiles => Set<MediaFile>();
  public DbSet<QrCode> QrCodes => Set<QrCode>();
  public DbSet<QrScanEvent> QrScanEvents => Set<QrScanEvent>();
  public DbSet<VisitEvent> VisitEvents => Set<VisitEvent>();
  public DbSet<PlayHistory> PlayHistory => Set<PlayHistory>();
  public DbSet<Payment> Payments => Set<Payment>();
  public DbSet<CashReport> CashReports => Set<CashReport>();
  public DbSet<Commission> Commissions => Set<Commission>();
  public DbSet<AdminLog> AdminLogs => Set<AdminLog>();
  public DbSet<AppSetting> AppSettings => Set<AppSetting>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
    modelBuilder.Entity<Stall>().HasIndex(x => x.Slug).IsUnique();
    modelBuilder.Entity<PoiContent>().HasIndex(x => new { x.PoiId, x.LanguageCode, x.VoiceType }).IsUnique();
    modelBuilder.Entity<AppSetting>().HasIndex(x => x.SettingKey).IsUnique();
  }
}
