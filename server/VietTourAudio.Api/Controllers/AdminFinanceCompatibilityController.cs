using System.Data;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
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
    SELECT CAST(v.id AS CHAR) id,v.trade_name businessName,v.contact_email ownerEmail,
      v.status verificationStatus,CAST(vw.id AS CHAR) walletId,vw.balance,vw.total_top_up totalTopUp,
      vs.status subscriptionStatus,vs.period_end periodEnd,sp.name planName,sp.price monthlyPrice,
      (SELECT COUNT(*) FROM stalls s WHERE s.vendor_id=v.id) stallCount
    FROM vendors v LEFT JOIN vendor_wallets vw ON vw.vendor_id=v.id
    LEFT JOIN vendor_subscriptions vs ON vs.vendor_id=v.id
    LEFT JOIN subscription_plans sp ON sp.id=vs.plan_id ORDER BY v.created_at DESC
    """)));

  [HttpGet("{vendorId:long}")]
  public async Task<IActionResult> Detail(ulong vendorId)
  {
    var vendor = (await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(v.id AS CHAR) id,v.trade_name businessName,v.contact_email ownerEmail,
        v.contact_name ownerDisplayName,v.status verificationStatus,CAST(vw.id AS CHAR) walletId,
        vw.balance,vw.total_top_up totalTopUp,vs.status subscriptionStatus,vs.period_end periodEnd,
        sp.name planName,sp.price monthlyPrice
      FROM vendors v LEFT JOIN vendor_wallets vw ON vw.vendor_id=v.id
      LEFT JOIN vendor_subscriptions vs ON vs.vendor_id=v.id
      LEFT JOIN subscription_plans sp ON sp.id=vs.plan_id WHERE v.id=@id
      """, new Dictionary<string, object?> { ["@id"] = vendorId })).SingleOrDefault();
    if (vendor is null) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));
    vendor["transactions"] = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(id AS CHAR) id,transaction_category type,direction,amount,balance_after balanceAfter,
        description,created_at createdAt FROM wallet_transactions WHERE vendor_id=@id ORDER BY created_at DESC
      """, new Dictionary<string, object?> { ["@id"] = vendorId });
    vendor["topUpRequests"] = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(id AS CHAR) id,amount,provider,status,proof_url proofImageUrl,note rejectReason,created_at createdAt
      FROM top_up_requests WHERE vendor_id=@id ORDER BY created_at DESC
      """, new Dictionary<string, object?> { ["@id"] = vendorId });
    return Ok(ApiResponseFactory.Ok(vendor));
  }

  [HttpPost("{vendorId:long}/credit")]
  public Task<IActionResult> Credit(ulong vendorId, [FromBody] WalletAdjustment request) => Adjust(vendorId, request, "CREDIT");
  [HttpPost("{vendorId:long}/debit")]
  public Task<IActionResult> Debit(ulong vendorId, [FromBody] WalletAdjustment request) => Adjust(vendorId, request, "DEBIT");

  private async Task<IActionResult> Adjust(ulong vendorId, WalletAdjustment request, string direction)
  {
    if (request.Amount <= 0 || string.IsNullOrWhiteSpace(request.Description) || string.IsNullOrWhiteSpace(request.Reason))
      return BadRequest(ApiResponseFactory.Fail("wallet.invalid_adjustment"));
    await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    var wallet = await db.Wallets.SingleOrDefaultAsync(x => x.VendorId == vendorId);
    if (wallet is null)
    {
      wallet = new Wallet { VendorId = vendorId };
      db.Wallets.Add(wallet); await db.SaveChangesAsync();
    }
    var before = wallet.Balance;
    var after = direction == "CREDIT" ? before + request.Amount : before - request.Amount;
    if (after < 0) return Conflict(ApiResponseFactory.Fail("wallet.insufficient_balance"));
    wallet.Balance = after;
    if (direction == "CREDIT") wallet.TotalTopUp += request.Amount; else wallet.TotalSpent += request.Amount;

    ulong? adminId = null;
    var adminIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!string.IsNullOrEmpty(adminIdStr) && ulong.TryParse(adminIdStr, out var parsedAdminId))
    {
      adminId = parsedAdminId;
    }

    var finalDescription = $"{request.Description} (Lý do: {request.Reason})";
    var metadataJson = System.Text.Json.JsonSerializer.Serialize(new { reason = request.Reason });

    var entry = new WalletTransaction
    {
      WalletId = wallet.Id, VendorId = vendorId, TransactionType = "MANUAL",
      TransactionCategory = "MANUAL_ADJUSTMENT", Direction = direction, Amount = request.Amount,
      BalanceBefore = before, BalanceAfter = after, Description = finalDescription,
      CreatedByUserId = adminId, Metadata = metadataJson,
      CreatedAt = DateTime.UtcNow
    };
    db.WalletTransactions.Add(entry); await db.SaveChangesAsync(); await tx.CommitAsync();

    try
    {
      await hubContext.Clients.All.SendAsync("ReceiveNotification", new
      {
        type = "WALLET_ADJUST",
        title = "Điều chỉnh ví",
        message = $"Số dư của Vendor #{vendorId} đã được điều chỉnh {direction}: {request.Amount:N0} VND."
      });
    }
    catch (Exception ex)
    {
      System.Console.WriteLine($"SignalR push error: {ex.Message}");
    }

    return Ok(ApiResponseFactory.Ok(new { wallet = new { id = wallet.Id.ToString(), vendorId = vendorId.ToString(),
      balance = wallet.Balance, totalTopUp = wallet.TotalTopUp }, transaction = new { id = entry.Id.ToString(),
      walletId = wallet.Id.ToString(), type = direction == "CREDIT" ? "MANUAL_CREDIT" : "MANUAL_DEBIT",
      amount = direction == "CREDIT" ? request.Amount : -request.Amount, balanceAfter = after,
      description = finalDescription, createdAt = entry.CreatedAt } }));
  }

  [HttpGet("bank-qr")]
  [AllowAnonymous]
  public async Task<IActionResult> GetBankQr()
  {
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

    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
    if (!Directory.Exists(uploadsDir))
    {
      Directory.CreateDirectory(uploadsDir);
    }

    var filePath = Path.Combine(uploadsDir, "bank_qr.png");
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
      await file.CopyToAsync(stream);
    }

    return Ok(ApiResponseFactory.Ok(new { url = "/uploads/bank_qr.png" }));
  }

  [HttpPost("update-admin-qr")]
  [Authorize(Roles = "SUPER_ADMIN,ADMIN,FINANCE")]
  public async Task<IActionResult> UpdateAdminQr([FromForm] IFormFile file)
  {
    if (file == null || file.Length == 0)
      return BadRequest(ApiResponseFactory.Fail("file.invalid"));

    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
    if (!Directory.Exists(uploadsDir))
    {
      Directory.CreateDirectory(uploadsDir);
    }

    var filePath = Path.Combine(uploadsDir, "bank-qr.png");
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
      await file.CopyToAsync(stream);
    }

    return Ok(ApiResponseFactory.Ok(new { url = "/uploads/bank-qr.png" }));
  }
}

[ApiController]
[Route("api/admin/revenue")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,FINANCE")]
public sealed class AdminRevenueCompatibilityController(AppDbContext db) : ControllerBase
{
  [HttpGet("commissions")]
  public async Task<IActionResult> Commissions()
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(ce.id AS CHAR) id, v.trade_name vendorName, ce.gross_amount baseAmount,
             ce.rate_percent commissionRate, ce.commission_amount commissionAmount, ce.status
      FROM commission_earnings ce
      JOIN vendors v ON v.id = ce.vendor_id
      ORDER BY ce.created_at DESC
      """);
    return Ok(ApiResponseFactory.Ok(rows));
  }

  [HttpGet("overview")]
  public async Task<IActionResult> Overview([FromQuery] string period = "month")
  {
    var start = Start(period);
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='PAID' AND paid_at>=@start) totalRevenue,
        (SELECT COALESCE(SUM(amount),0) FROM top_up_requests WHERE status='APPROVED' AND updated_at>=@start) totalTopUps,
        (SELECT COALESCE(SUM(sp.price),0) FROM vendor_subscriptions vs JOIN subscription_plans sp ON sp.id=vs.plan_id WHERE vs.status='ACTIVE') mrr,
        (SELECT COUNT(*) FROM vendor_subscriptions WHERE status='ACTIVE') activeSubscriptions,
        (SELECT COUNT(*) FROM wallet_transactions WHERE transaction_type='FEE' AND created_at>=@start) renewals
      """, new Dictionary<string, object?> { ["@start"] = start });
    var providers = await DatabaseSql.QueryRowsAsync(db, """
      SELECT provider,SUM(amount) amount FROM payments WHERE status='PAID' AND paid_at>=@start GROUP BY provider
      """, new Dictionary<string, object?> { ["@start"] = start });
    var result = rows.Single(); result["providers"] = providers;
    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpGet("timeline")]
  public async Task<IActionResult> Timeline([FromQuery] string period = "month") =>
    Ok(ApiResponseFactory.Ok(await DatabaseSql.QueryRowsAsync(db, """
      SELECT date,source,provider,gross_amount totalAmount FROM revenue_daily WHERE date>=@start ORDER BY date
      """, new Dictionary<string, object?> { ["@start"] = Start(period) })));

  [HttpGet("export")]
  public async Task<IActionResult> Export([FromQuery] string period = "month")
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT date,source,provider,gross_amount,net_amount,fees,transaction_count
      FROM revenue_daily WHERE date>=@start ORDER BY date,source,provider
      """, new Dictionary<string, object?> { ["@start"] = Start(period) });
    var csv = new StringBuilder("date,source,provider,gross_amount,net_amount,fees,transaction_count\n");
    foreach (var row in rows) csv.AppendLine(string.Join(',', row.Values.Select(x => $"\"{x?.ToString()?.Replace("\"", "\"\"")}\"")));
    return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv; charset=utf-8", "viettour-revenue.csv");
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
      activeUsers = Hubs.NotificationHub.ActiveUserCount
    }));
  }

  private static DateTime Start(string period)
  {
    var today = DateTime.Today;
    return period == "today" ? today : period == "ytd" ? new DateTime(today.Year, 1, 1) : new DateTime(today.Year, today.Month, 1);
  }
}

public sealed record WalletAdjustment(decimal Amount, string Description, string Reason);
