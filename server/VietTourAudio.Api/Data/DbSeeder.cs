using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Entities;

namespace VietTourAudio.Api.Data;

public static class DbSeeder
{
  public static async Task SeedAsync(AppDbContext db)
  {
    if (await db.Users.AnyAsync()) return;

    var now = DateTime.UtcNow;

    var admin = new User
    {
      Email = "admin@viettouraudio.com",
      FullName = "Admin VietTourAudio",
      PassHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
      Role = "ADMIN",
      Status = "ACTIVE",
      CreatedAt = now,
      UpdatedAt = now
    };

    var owner = new User
    {
      Email = "owner@viettouraudio.com",
      FullName = "Owner Demo",
      PassHash = BCrypt.Net.BCrypt.HashPassword("Owner@123"),
      Role = "STALL_OWNER",
      Status = "ACTIVE",
      CreatedAt = now,
      UpdatedAt = now
    };

    var tourist = new User
    {
      Email = "tourist@viettouraudio.com",
      FullName = "Tourist Demo",
      PassHash = BCrypt.Net.BCrypt.HashPassword("Tourist@123"),
      Role = "TOURIST",
      Status = "ACTIVE",
      CreatedAt = now,
      UpdatedAt = now
    };

    db.Users.AddRange(admin, owner, tourist);
    await db.SaveChangesAsync();

    var stall1 = new Stall
    {
      VendorId = owner.Id,
      Name = "Sạp Demo 1",
      Slug = "sap-demo-1",
      Description = "Mô tả sạp demo 1",
      Latitude = 10.7721120m,
      Longitude = 106.6982780m,
      Status = "ACTIVE",
      CreatedAt = now,
      UpdatedAt = now
    };

    var stall2 = new Stall
    {
      VendorId = owner.Id,
      Name = "Sạp Demo 2",
      Slug = "sap-demo-2",
      Description = "Mô tả sạp demo 2",
      Latitude = 15.8800580m,
      Longitude = 108.3380470m,
      Status = "ACTIVE",
      CreatedAt = now,
      UpdatedAt = now
    };

    db.Stalls.AddRange(stall1, stall2);
    await db.SaveChangesAsync();

    var poi1 = new Poi
    {
      StallId = stall1.Id,
      Name = "POI Demo 1",
      Slug = "poi-demo-1",
      Latitude = 10.7722100m,
      Longitude = 106.6983100m,
      ActivationRadius = 35,
      IsPremiumContent = false,
      Status = "ACTIVE",
      SortOrder = 1,
      CreatedAt = now,
      UpdatedAt = now
    };

    db.Pois.Add(poi1);
    await db.SaveChangesAsync();

    var poi2 = new Poi
    {
      StallId = stall1.Id,
      Name = "POI Demo 2",
      Slug = "poi-demo-2",
      Latitude = 10.7723000m,
      Longitude = 106.6983500m,
      ActivationRadius = 30,
      IsPremiumContent = false,
      Status = "ACTIVE",
      SortOrder = 2,
      CreatedAt = now,
      UpdatedAt = now
    };

    var poi3 = new Poi
    {
      StallId = stall1.Id,
      Name = "POI Demo 3",
      Slug = "poi-demo-3",
      Latitude = 10.7724000m,
      Longitude = 106.6984000m,
      ActivationRadius = 25,
      IsPremiumContent = true,
      Status = "ACTIVE",
      SortOrder = 3,
      CreatedAt = now,
      UpdatedAt = now
    };

    var poi4 = new Poi
    {
      StallId = stall2.Id,
      Name = "POI Demo 4",
      Slug = "poi-demo-4",
      Latitude = 15.8801500m,
      Longitude = 108.3381000m,
      ActivationRadius = 30,
      IsPremiumContent = false,
      Status = "ACTIVE",
      SortOrder = 1,
      CreatedAt = now,
      UpdatedAt = now
    };

    var poi5 = new Poi
    {
      StallId = stall2.Id,
      Name = "POI Demo 5",
      Slug = "poi-demo-5",
      Latitude = 15.8802500m,
      Longitude = 108.3382000m,
      ActivationRadius = 25,
      IsPremiumContent = false,
      Status = "ACTIVE",
      SortOrder = 2,
      CreatedAt = now,
      UpdatedAt = now
    };

    db.Pois.AddRange(poi2, poi3, poi4, poi5);
    await db.SaveChangesAsync();

    var subscription = new StallSubscription
    {
      StallId = stall1.Id,
      PlanName = "TRIAL",
      Price = 0m,
      StartDate = DateOnly.FromDateTime(now),
      EndDate = DateOnly.FromDateTime(now.AddHours(24)),
      Status = "TRIAL",
      CreatedAt = now
    };

    db.StallSubscriptions.Add(subscription);

    var payment1 = new Payment
    {
      VendorId = owner.Id,
      VisitorSessionId = null,
      Amount = 599000m,
      Currency = "VND",
      Provider = "DEMO",
      PaymentType = "STALL_SUBSCRIPTION",
      Status = "PAID",
      TransactionCode = "SEED-" + Guid.NewGuid().ToString("N"),
      CreatedAt = now,
      UpdatedAt = now
    };

    var payment2 = new Payment
    {
      VendorId = owner.Id,
      VisitorSessionId = null,
      Amount = 30000m,
      Currency = "VND",
      Provider = "MOMO",
      PaymentType = "VISITOR_PREMIUM",
      Status = "PAID",
      TransactionCode = "SEED-" + Guid.NewGuid().ToString("N"),
      CreatedAt = now.AddMinutes(-30),
      UpdatedAt = now.AddMinutes(-30)
    };

    var payment3 = new Payment
    {
      VendorId = owner.Id,
      VisitorSessionId = null,
      Amount = 100000m,
      Currency = "VND",
      Provider = "BANK_QR",
      PaymentType = "WALLET_TOP_UP",
      Status = "PAID",
      TransactionCode = "SEED-" + Guid.NewGuid().ToString("N"),
      CreatedAt = now.AddHours(-1),
      UpdatedAt = now.AddHours(-1)
    };

    db.Payments.AddRange(payment1, payment2, payment3);

    await db.SaveChangesAsync();
  }
}
