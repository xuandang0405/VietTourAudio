using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
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
    else if (!string.IsNullOrEmpty(request.QrCodeUrl))
      config.QrCodeUrl = request.QrCodeUrl;

    if (config.Id == 0) db.AdminPaymentConfigs.Add(config);
    var affected = await db.SaveChangesAsync();
    if (affected == 0) return StatusCode(500, ApiResponseFactory.Fail("payment.config_not_saved"));

    if (gateway == "BANK" && !string.IsNullOrEmpty(config.QrCodeUrl))
    {
      await DatabaseSql.ExecuteAsync(db, @"
          INSERT INTO app_settings (kkey, vvalue) VALUES ('BANK_QR_URL', @url)
          ON DUPLICATE KEY UPDATE vvalue=@url", new Dictionary<string, object?> { ["@url"] = config.QrCodeUrl });
    }

    return Ok(ApiResponseFactory.Ok(config));
  }

  [HttpGet("transactions/pending")]
  public async Task<IActionResult> Pending([FromQuery] string? senderType)
  {
    var query = db.PaymentTransactions.AsNoTracking().Where(x => x.Status == "PENDING");
    if (!string.IsNullOrEmpty(senderType))
    {
      var norm = senderType.Trim().ToUpperInvariant();
      query = query.Where(x => x.SenderType == norm);
    }
    return Ok(ApiResponseFactory.Ok(await query.OrderByDescending(x => x.CreatedAt).ToListAsync()));
  }

  [HttpPost("transactions/{id}/verify")]
  public async Task<IActionResult> Verify(string id, [FromBody] VerifyPaymentRequest request)
  {
    if (!Guid.TryParse(id, out var transactionGuid))
      return BadRequest(ApiResponseFactory.Fail("Mã định danh hóa đơn giao dịch không đúng định dạng GUID."));

    var status = request.Status.Trim().ToUpperInvariant();
    if (status is not ("APPROVED" or "FAILED"))
      return BadRequest(ApiResponseFactory.Fail("Status must be APPROVED or FAILED."));

    await using var transaction = await db.Database.BeginTransactionAsync();
    try
    {
      var normalizedId = transactionGuid.ToString("N");
      var ledger = await db.PaymentTransactions.SingleOrDefaultAsync(payment =>
        payment.Id == id || payment.Id == normalizedId);
      if (ledger is null)
        return NotFound(ApiResponseFactory.Fail("Không tìm thấy hồ sơ giao dịch tương ứng trong Database."));
      if (ledger.Status != "PENDING")
        return Conflict(ApiResponseFactory.Fail("Transaction has already been processed."));

      if (status == "APPROVED")
      {
        var applied = await entitlements.ApplyAsync(ledger);
        if (!applied)
        {
          await transaction.RollbackAsync();
          logger.LogWarning(
            "Payment {PaymentId} approval was rejected because sender {SenderType}/{SenderId} could not receive its entitlement.",
            ledger.Id,
            ledger.SenderType,
            ledger.SenderId);
          return BadRequest(ApiResponseFactory.Fail(
            "Phê duyệt thất bại: giao dịch không gắn với User, phiên khách hoặc Vendor hợp lệ."));
        }
      }

      ledger.Status = status;
      ledger.PendingKey = null;
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
          ledger.Id,
          ledger.Status);
      }
      catch (Exception notificationException)
      {
        logger.LogWarning(
          notificationException,
          "Payment {PaymentId} committed but real-time broadcast failed.",
          ledger.Id);
      }
      return Ok(ApiResponseFactory.Ok(ledger));
    }
    catch (InvalidOperationException exception)
    {
      await transaction.RollbackAsync();
      logger.LogWarning(exception, "Payment {PaymentId} verification was rejected.", id);
      return BadRequest(ApiResponseFactory.Fail(exception.Message));
    }
    catch (Exception exception)
    {
      await transaction.RollbackAsync();
      logger.LogError(exception, "Payment {PaymentId} verification failed safely.", id);
      return StatusCode(500, ApiResponseFactory.Fail(
        "Không thể xác minh giao dịch lúc này. Trạng thái giao dịch chưa bị thay đổi."));
    }
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
  IFormFile? QrCode,
  string? QrCodeUrl);
public sealed record VerifyPaymentRequest(string Status);

internal static class PaymentRules
{
  internal static readonly HashSet<string> Methods = ["MOMO", "BANK", "VISA"];
  internal static readonly HashSet<string> Types =
    ["USER_PREMIUM", "VENDOR_SUBSCRIPTION", "VENDOR_PREMIUM", "VENDOR_TOPUP"];
}
