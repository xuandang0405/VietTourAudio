using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Services;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,FINANCE")]
public sealed class AdminWalletController(
  AppDbContext db,
  IWebHostEnvironment environment,
  PaymentEntitlementService entitlements,
  IHubContext<VietTourAudio.Api.Hubs.NotificationHub> hubContext,
  ILogger<AdminWalletController> logger) : ControllerBase
{
  [HttpGet("payment-config")]
  public async Task<IActionResult> Configs() =>
    Ok(ApiResponseFactory.Ok(await db.AdminPaymentConfigs.AsNoTracking()
      .OrderBy(x => x.Id).ToListAsync()));

  [HttpPost("payment-config/update")]
  [RequestSizeLimit(5 * 1024 * 1024)]
  public async Task<IActionResult> UpdateConfig([FromForm] PaymentConfigForm request)
  {
    var gateway = request.GatewayType.Trim().ToUpperInvariant();
    if (!PaymentRules.Methods.Contains(gateway))
      return BadRequest(ApiResponseFactory.Fail("Invalid gateway type."));

    var config = await db.AdminPaymentConfigs.SingleOrDefaultAsync(x => x.GatewayType == gateway)
      ?? new AdminPaymentConfig { GatewayType = gateway };
    config.AccountName = request.AccountName?.Trim() ?? "";
    config.AccountNumber = request.AccountNumber?.Trim() ?? "";
    config.TransferMemoPattern = string.IsNullOrWhiteSpace(request.TransferMemoPattern)
      ? "VTA [Type] [Id]"
      : request.TransferMemoPattern.Trim();
    config.IsActive = request.IsActive;

    if (request.QrCode is not null)
      config.QrCodeUrl = await SaveImageAsync(request.QrCode, "admin");

    if (config.Id == 0) db.AdminPaymentConfigs.Add(config);
    var affected = await db.SaveChangesAsync();
    if (affected == 0) return StatusCode(500, ApiResponseFactory.Fail("payment.config_not_saved"));
    return Ok(ApiResponseFactory.Ok(config));
  }

  [HttpGet("transactions/pending")]
  public async Task<IActionResult> Pending() =>
    Ok(ApiResponseFactory.Ok(await db.PaymentTransactions.AsNoTracking()
      .Where(x => x.Status == "PENDING")
      .OrderByDescending(x => x.CreatedAt).ToListAsync()));

  [HttpPost("transactions/{id:guid}/verify")]
  public async Task<IActionResult> Verify(Guid id, [FromBody] VerifyPaymentRequest request)
  {
    var status = request.Status.Trim().ToUpperInvariant();
    if (status is not ("APPROVED" or "FAILED"))
      return BadRequest(ApiResponseFactory.Fail("Status must be APPROVED or FAILED."));

    await using var transaction = await db.Database.BeginTransactionAsync();
    var ledger = await db.PaymentTransactions.SingleOrDefaultAsync(x => x.Id == id);
    if (ledger is null) return NotFound(ApiResponseFactory.Fail("Transaction not found."));
    if (ledger.Status != "PENDING")
      return Conflict(ApiResponseFactory.Fail("Transaction has already been processed."));

    if (status == "APPROVED") await entitlements.ApplyAsync(ledger);
    ledger.Status = status;
    ledger.UpdatedAt = DateTime.UtcNow;
    var affected = await db.SaveChangesAsync();
    if (affected == 0)
    {
      await transaction.RollbackAsync();
      return StatusCode(500, ApiResponseFactory.Fail("payment.transaction_not_saved"));
    }
    await transaction.CommitAsync();
    try
    {
      await hubContext.Clients.All.SendAsync(
        "ReceivePaymentUpdate",
        ledger.Id.ToString(),
        ledger.Status);
    }
    catch (Exception exception)
    {
      logger.LogWarning(exception, "Payment {PaymentId} committed but real-time broadcast failed", ledger.Id);
    }
    return Ok(ApiResponseFactory.Ok(ledger));
  }

  private async Task<string> SaveImageAsync(IFormFile file, string folder)
  {
    if (file.Length == 0 || file.Length > 5 * 1024 * 1024 || !file.ContentType.StartsWith("image/"))
      throw new InvalidOperationException("Invalid image.");
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!new[] { ".png", ".jpg", ".jpeg", ".webp" }.Contains(extension))
      throw new InvalidOperationException("Invalid image extension.");
    var relative = $"/uploads/{folder}/{Guid.NewGuid():N}{extension}";
    var target = Path.Combine(environment.WebRootPath!, relative.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
    Directory.CreateDirectory(Path.GetDirectoryName(target)!);
    await using var stream = System.IO.File.Create(target);
    await file.CopyToAsync(stream);
    return relative;
  }
}

public sealed record PaymentConfigForm(
  string GatewayType,
  string? AccountName,
  string? AccountNumber,
  string? TransferMemoPattern,
  bool IsActive,
  IFormFile? QrCode);
public sealed record VerifyPaymentRequest(string Status);

internal static class PaymentRules
{
  internal static readonly HashSet<string> Methods = ["MOMO", "BANK", "VISA"];
  internal static readonly HashSet<string> Types =
    ["USER_PREMIUM", "VENDOR_SUBSCRIPTION", "VENDOR_PREMIUM"];
}
