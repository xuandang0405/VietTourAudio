using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/wallets")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,FINANCE")]
public sealed class AdminWalletCompatibilityController(AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<VietTourAudio.Api.Hubs.NotificationHub> hubContext) : ControllerBase
{
  [HttpGet]
  public async Task<IActionResult> List() => Ok(ApiResponseFactory.Ok(await DatabaseSql.QueryRowsAsync(db, """
    SELECT CAST(v.id AS CHAR) id,v.trade_name businessName,v.email ownerEmail,
      v.status verificationStatus,CAST(vw.id AS CHAR) walletId,vw.balance,vw.total_top_up totalTopUp,
      'ACTIVE' AS subscriptionStatus, NULL AS periodEnd, 'VTA Premium' AS planName, 199000.00 AS monthlyPrice,
      (SELECT COUNT(*) FROM Pois p WHERE p.vendor_id=v.id) stallCount
    FROM Vendors v LEFT JOIN vendor_wallets vw ON vw.vendor_id=v.id ORDER BY v.created_at DESC
    """)));

  [HttpGet("{vendorId}")]
  public async Task<IActionResult> Detail(string vendorId)
  {
    var vendor = (await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(v.id AS CHAR) id,v.trade_name businessName,v.email ownerEmail,
        v.contact_name ownerDisplayName,v.status verificationStatus,CAST(vw.id AS CHAR) walletId,
        vw.balance,vw.total_top_up totalTopUp, 'ACTIVE' AS subscriptionStatus, NULL AS periodEnd,
        'VTA Premium' AS planName, 199000.00 AS monthlyPrice
      FROM Vendors v LEFT JOIN vendor_wallets vw ON vw.vendor_id=v.id WHERE v.id=@id
      """, new Dictionary<string, object?> { ["@id"] = vendorId })).SingleOrDefault();
    if (vendor is null) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));
    vendor["transactions"] = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(id AS CHAR) id,transaction_category type,direction,amount,balance_after balanceAfter,
        description,created_at createdAt FROM wallet_transactions WHERE vendor_id=@id ORDER BY created_at DESC
      """, new Dictionary<string, object?> { ["@id"] = vendorId });
    vendor["topUpRequests"] = await DatabaseSql.QueryRowsAsync(db, """
      SELECT id,amount,provider,status,proof_url proofImageUrl,note rejectReason,created_at createdAt
      FROM top_up_requests WHERE vendor_id=@id ORDER BY created_at DESC
      """, new Dictionary<string, object?> { ["@id"] = vendorId });
    return Ok(ApiResponseFactory.Ok(vendor));
  }

  [HttpPost("{vendorId}/credit")]
  public Task<IActionResult> Credit(string vendorId, [FromBody] WalletAdjustment request) => Adjust(vendorId, request, "CREDIT");
  [HttpPost("{vendorId}/debit")]
  public Task<IActionResult> Debit(string vendorId, [FromBody] WalletAdjustment request) => Adjust(vendorId, request, "DEBIT");

  private async Task<IActionResult> Adjust(string vendorId, WalletAdjustment request, string direction)
  {
    if (request.Amount <= 0 || string.IsNullOrWhiteSpace(request.Description) || string.IsNullOrWhiteSpace(request.Reason))
      return BadRequest(ApiResponseFactory.Fail("wallet.invalid_adjustment"));
    await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    var wallet = await db.Wallets.SingleOrDefaultAsync(x => x.VendorId == vendorId);
    if (wallet is null)
    {
      wallet = new Wallet { Id = Guid.NewGuid().ToString("N"), VendorId = vendorId };
      db.Wallets.Add(wallet); await db.SaveChangesAsync();
    }
    var before = wallet.Balance;
    var after = direction == "CREDIT" ? before + request.Amount : before - request.Amount;
    if (after < 0) return Conflict(ApiResponseFactory.Fail("wallet.insufficient_balance"));
    wallet.Balance = after;
    if (direction == "CREDIT") wallet.TotalTopUp += request.Amount; else wallet.TotalSpent += request.Amount;

    var finalDescription = $"{request.Description} (Lý do: {request.Reason})";

    var entry = new WalletTransaction
    {
      Id = Guid.NewGuid().ToString("N"),
      WalletId = wallet.Id, VendorId = vendorId, TransactionType = "MANUAL",
      TransactionCategory = "MANUAL_ADJUSTMENT", Direction = direction, Amount = request.Amount,
      BalanceBefore = before, BalanceAfter = after, Description = finalDescription,
      CreatedAt = DateTime.UtcNow
    };
    db.WalletTransactions.Add(entry); await db.SaveChangesAsync(); await tx.CommitAsync();

    try
    {
      await hubContext.Clients.All.SendAsync("ReceiveNotification", new
      {
        type = "WALLET_ADJUST",
        title = "Điều chỉnh ví",
        message = $"Số dư của Vendor đã được điều chỉnh {direction}: {request.Amount:N0} VND."
      });
    }
    catch (Exception ex)
    {
      System.Console.WriteLine($"SignalR push error: {ex.Message}");
    }

    return Ok(ApiResponseFactory.Ok(new { wallet = new { id = wallet.Id, vendorId = vendorId,
      balance = wallet.Balance, totalTopUp = wallet.TotalTopUp }, transaction = new { id = entry.Id,
      walletId = wallet.Id, type = direction == "CREDIT" ? "MANUAL_CREDIT" : "MANUAL_DEBIT",
      amount = direction == "CREDIT" ? request.Amount : -request.Amount, balanceAfter = after,
      description = finalDescription, createdAt = entry.CreatedAt } }));
  }

  [HttpGet("bank-qr")]
  [AllowAnonymous]
  public async Task<IActionResult> GetBankQr()
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, "SELECT vvalue FROM app_settings WHERE kkey='BANK_QR_URL' LIMIT 1");
    if (rows.Count > 0 && rows[0]["vvalue"] != null)
    {
      var dbUrl = rows[0]["vvalue"] as string;
      if (!string.IsNullOrEmpty(dbUrl))
      {
        return Ok(ApiResponseFactory.Ok(new { url = dbUrl }));
      }
    }

    var pathHyphen = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "bank-qr.png");
    if (System.IO.File.Exists(pathHyphen))
    {
      return Ok(ApiResponseFactory.Ok(new { url = "/uploads/bank-qr.png" }));
    }
    var pathUnderscore = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "bank_qr.png");
    if (System.IO.File.Exists(pathUnderscore))
    {
      return Ok(ApiResponseFactory.Ok(new { url = "/uploads/bank_qr.png" }));
    }
    return Ok(ApiResponseFactory.Ok(new { url = "/qr_fallback.svg" }));
  }

  [HttpPost("bank-qr")]
  [Authorize(Roles = "SUPER_ADMIN,ADMIN,FINANCE")]
  public async Task<IActionResult> UploadBankQr(IFormFile file)
  {
    if (file == null || file.Length == 0)
      return BadRequest(ApiResponseFactory.Fail("file.invalid"));

    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "settings");
    Directory.CreateDirectory(uploadsDir);

    var fileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
    var filePath = Path.Combine(uploadsDir, fileName);
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
      await file.CopyToAsync(stream);
    }

    var url = $"/uploads/settings/{fileName}";
    await DatabaseSql.ExecuteAsync(db, @"
        INSERT INTO app_settings (kkey, vvalue) VALUES ('BANK_QR_URL', @url)
        ON DUPLICATE KEY UPDATE vvalue=@url", new Dictionary<string, object?> { ["@url"] = url });

    return Ok(ApiResponseFactory.Ok(new { url }));
  }

  [HttpPost("update-admin-qr")]
  [Authorize(Roles = "SUPER_ADMIN,ADMIN,FINANCE")]
  public async Task<IActionResult> UpdateAdminQr([FromForm] IFormFile file)
  {
    if (file == null || file.Length == 0)
      return BadRequest(ApiResponseFactory.Fail("file.invalid"));

    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "settings");
    Directory.CreateDirectory(uploadsDir);

    var fileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
    var filePath = Path.Combine(uploadsDir, fileName);
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
      await file.CopyToAsync(stream);
    }

    var url = $"/uploads/settings/{fileName}";
    await DatabaseSql.ExecuteAsync(db, @"
        INSERT INTO app_settings (kkey, vvalue) VALUES ('BANK_QR_URL', @url)
        ON DUPLICATE KEY UPDATE vvalue=@url", new Dictionary<string, object?> { ["@url"] = url });

    return Ok(ApiResponseFactory.Ok(new { url }));
  }
}

[ApiController]
[Route("api/admin/revenue")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,FINANCE")]
public sealed class AdminRevenueCompatibilityController(
  AppDbContext db,
  VietTourAudio.Api.Services.IPresenceTracker presence) : ControllerBase
{
  [HttpGet("commissions")]
  public IActionResult Commissions()
  {
    return Ok(ApiResponseFactory.Ok(new List<object>()));
  }

  [HttpGet("overview")]
  public async Task<IActionResult> Overview([FromQuery] string period = "month")
  {
    var totalRevenue = await db.PaymentTransactions.Where(x => x.Status == "APPROVED").SumAsync(x => x.Amount);
    var totalTopUps = await db.Wallets.SumAsync(x => x.TotalTopUp);
    var activeSubs = await db.Vendors.CountAsync(x => x.IsPremium);
    var mrr = activeSubs * 599000m;

    var result = new Dictionary<string, object?>
    {
      ["totalRevenue"] = totalRevenue,
      ["totalTopUps"] = totalTopUps,
      ["mrr"] = mrr,
      ["activeSubscriptions"] = activeSubs,
      ["renewals"] = 0,
      ["providers"] = new List<object>()
    };
    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpGet("timeline")]
  public IActionResult Timeline([FromQuery] string period = "month") =>
    Ok(ApiResponseFactory.Ok(new List<object>()));

  [HttpGet("export")]
  public IActionResult Export([FromQuery] string period = "month")
  {
    var csv = "date,source,provider,gross_amount,net_amount,fees,transaction_count\n";
    return File(Encoding.UTF8.GetBytes(csv), "text/csv; charset=utf-8", "viettour-revenue.csv");
  }

  [HttpGet("payment-stats")]
  public async Task<IActionResult> PaymentStats()
  {
    var now = DateTime.UtcNow;

    var allApproved = await db.PaymentTransactions
      .Where(t => t.Status == "APPROVED")
      .AsNoTracking()
      .ToListAsync();

    object CalculatePeriodMetrics(List<PaymentTransaction> transactions)
    {
      decimal tourist = transactions.Where(t => t.SenderType == "USER").Sum(t => t.Amount);
      decimal vendor = transactions.Where(t => t.SenderType == "VENDOR").Sum(t => t.Amount);
      return new
      {
        total = tourist + vendor,
        tourist,
        vendor,
        count = transactions.Count
      };
    }

    var todayStats = CalculatePeriodMetrics(allApproved.Where(t => t.CreatedAt.Date == now.Date).ToList());
    var monthStats = CalculatePeriodMetrics(allApproved.Where(t => t.CreatedAt.Month == now.Month && t.CreatedAt.Year == now.Year).ToList());
    var yearStats = CalculatePeriodMetrics(allApproved.Where(t => t.CreatedAt.Year == now.Year).ToList());
    var allTimeStats = CalculatePeriodMetrics(allApproved);

    int pendingCount = await db.PaymentTransactions
      .CountAsync(t => t.Status == "PENDING");

    var chartData = allApproved
      .GroupBy(t => t.CreatedAt.ToString("MM/yyyy"))
      .Select(g => new
      {
        period = g.Key,
        tourist = g.Where(t => t.SenderType == "USER").Sum(t => t.Amount),
        vendor = g.Where(t => t.SenderType == "VENDOR").Sum(t => t.Amount),
        total = g.Sum(t => t.Amount)
      })
      .OrderBy(g => g.period)
      .ToList();

    return Ok(ApiResponseFactory.Ok(new
    {
      today = todayStats,
      thisMonth = monthStats,
      thisYear = yearStats,
      allTime = allTimeStats,
      pendingCount,
      chartData,
      activeUsers = presence.Snapshot().TotalActive
    }));
  }
}

public sealed record WalletAdjustment(decimal Amount, string Description, string Reason);
