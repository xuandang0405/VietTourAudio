using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/topup")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,FINANCE")]
public sealed class AdminTopUpController(AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<VietTourAudio.Api.Hubs.NotificationHub> hubContext) : ControllerBase
{
  [HttpGet("requests")]
  public async Task<IActionResult> List([FromQuery] string status = "PENDING")
  {
    var rows = await db.Database.SqlQuery<TopUpRow>($"""
      SELECT tur.id Id,tur.vendor_id VendorId,tur.wallet_id WalletId,tur.amount Amount,
        tur.status Status,tur.proof_url ProofImageUrl,tur.note Note,tur.created_at CreatedAt
      FROM top_up_requests tur WHERE ({status}='ALL' OR tur.status={status}) ORDER BY tur.created_at DESC
      """).ToListAsync();
    return Ok(ApiResponseFactory.Ok(rows.Select(x => new { id = x.Id, vendorId = x.VendorId,
      x.Amount, x.Status, proofImageUrl = FileUrl(x.ProofImageUrl), x.Note, x.CreatedAt })));
  }

  [HttpPost("requests/{id}/approve")]
  public async Task<IActionResult> Approve(string id)
  {
    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    var request = await db.Database.SqlQuery<TopUpRow>($"""
      SELECT id Id,vendor_id VendorId,wallet_id WalletId,amount Amount,status Status,
        proof_url ProofImageUrl,note Note,created_at CreatedAt FROM top_up_requests WHERE id={id} FOR UPDATE
      """).SingleAsync();
    if (request.Status != "PENDING") return Conflict(ApiResponseFactory.Fail("topup.not_pending"));
    var wallet = await db.Wallets.SingleAsync(x => x.Id == request.WalletId);
    var before = wallet.Balance; wallet.Balance += request.Amount; wallet.TotalTopUp += request.Amount;
    db.WalletTransactions.Add(new WalletTransaction { 
      Id = Guid.NewGuid().ToString("N"),
      WalletId = wallet.Id, VendorId = request.VendorId,
      TransactionType = "TOP_UP", TransactionCategory = "WALLET_TOP_UP", Direction = "CREDIT",
      Amount = request.Amount, BalanceBefore = before, BalanceAfter = wallet.Balance,
      Description = "Admin approved wallet top-up", CreatedAt = DateTime.UtcNow });
    
    var requestUpdateRows = await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE top_up_requests SET status='APPROVED',reviewed_at=NOW() WHERE id={id} AND status='PENDING'");
    if (requestUpdateRows == 0)
    {
      await transaction.RollbackAsync();
      return Conflict(ApiResponseFactory.Fail("topup.not_pending"));
    }
    await db.SaveChangesAsync(); await transaction.CommitAsync();

    try
    {
      await hubContext.Clients.All.SendAsync("ReceiveNotification", new
      {
        type = "TOPUP_APPROVED",
        title = "Nạp tiền được duyệt",
        message = $"Yêu cầu nạp tiền {request.Amount:N0} VND của Vendor đã được phê duyệt."
      });
    }
    catch (Exception ex)
    {
      System.Console.WriteLine($"SignalR push error: {ex.Message}");
    }

    return Ok(ApiResponseFactory.Ok(new { id = id, status = "APPROVED", balance = wallet.Balance }));
  }

  [HttpPost("requests/{id}/reject")]
  public async Task<IActionResult> Reject(string id, [FromBody] RejectRequest request)
  {
    var affected = await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE top_up_requests SET status='REJECTED',note={request.Reason},reviewed_at=NOW() WHERE id={id} AND status='PENDING'");
    if (affected == 0) return Conflict(ApiResponseFactory.Fail("topup.not_pending"));

    try
    {
      await hubContext.Clients.All.SendAsync("ReceiveNotification", new
      {
        type = "TOPUP_REJECTED",
        title = "Nạp tiền bị từ chối",
        message = $"Yêu cầu nạp tiền đã bị từ chối. Lý do: {request.Reason}"
      });
    }
    catch (Exception ex)
    {
      System.Console.WriteLine($"SignalR push error: {ex.Message}");
    }

    return Ok(ApiResponseFactory.Ok(new { id = id, status = "REJECTED" }));
  }

  private static string? FileUrl(string? name) => name is null ? null : name.StartsWith("/") ? name : $"/uploads/vendor/{name}";
}

public sealed class TopUpRow 
{ 
  public string Id { get; set; } = ""; 
  public string VendorId { get; set; } = ""; 
  public string WalletId { get; set; } = "";
  public decimal Amount { get; set; } 
  public string Status { get; set; } = ""; 
  public string? ProofImageUrl { get; set; }
  public string? Note { get; set; } 
  public DateTime CreatedAt { get; set; } 
}

public sealed record RejectRequest(string Reason);
