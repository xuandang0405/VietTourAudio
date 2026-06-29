using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Services;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/payment/checkout")]
public sealed class CheckoutPaymentController(
  AppDbContext db,
  IWebHostEnvironment environment,
  PaymentEntitlementService entitlements,
  Microsoft.AspNetCore.SignalR.IHubContext<VietTourAudio.Api.Hubs.NotificationHub> hubContext,
  ILogger<CheckoutPaymentController> logger) : ControllerBase
{
  [HttpPost("initialize")]
  public async Task<IActionResult> Initialize([FromBody] CheckoutIntent request)
  {
    var method = request.PaymentMethod.Trim().ToUpperInvariant();
    var senderType = request.SenderType.Trim().ToUpperInvariant();
    var transactionType = request.TransactionType.Trim().ToUpperInvariant();
    var senderId = request.SenderId.Trim();
    if (senderType == "VENDOR")
    {
      senderId = User.FindFirstValue("vendor_id") ?? "";
      if (string.IsNullOrWhiteSpace(senderId))
        return Unauthorized(ApiResponseFactory.Fail("Vendor authentication is required."));
    }
    var senderError = ValidateSender(senderId, senderType);
    if (senderError is not null) return senderError;
    if (!PaymentRules.Methods.Contains(method) || !PaymentRules.Types.Contains(transactionType))
      return BadRequest(ApiResponseFactory.Fail("Invalid payment intent."));

    var config = await db.AdminPaymentConfigs.AsNoTracking()
      .SingleOrDefaultAsync(x => x.GatewayType == method && x.IsActive);
    if (config is null) return NotFound(ApiResponseFactory.Fail("Payment gateway is not active."));

    var amount = ResolveAmount(transactionType);
    var id = Guid.NewGuid().ToString("N");
    var memo = BuildMemo(config.TransferMemoPattern, id, senderId, transactionType);
    var ledger = new PaymentTransaction
    {
      Id = id,
      SenderId = senderId,
      SenderType = senderType,
      PaymentMethod = method,
      TransactionType = transactionType,
      Amount = amount,
      TransferMemo = memo,
      Status = "PENDING",
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };
    db.PaymentTransactions.Add(ledger);
    await db.SaveChangesAsync();

    return Ok(ApiResponseFactory.Ok(new
    {
      transaction = ledger,
      gateway = config
    }));
  }

  [HttpPost("visa-process")]
  public async Task<IActionResult> ProcessVisa([FromBody] VisaPaymentRequest request)
  {
    var ledger = await db.PaymentTransactions.SingleOrDefaultAsync(x => x.Id == request.TransactionId);
    if (ledger is null) return NotFound(ApiResponseFactory.Fail("Transaction not found."));
    if (ledger.PaymentMethod != "VISA" || ledger.Status != "PENDING")
      return Conflict(ApiResponseFactory.Fail("Transaction is not payable."));
    var senderError = ValidateSender(ledger.SenderId, ledger.SenderType);
    if (senderError is not null) return senderError;
    if (string.IsNullOrWhiteSpace(request.CardholderName) ||
        !IsValidCard(request.CardNumber, request.Expiry, request.Cvv))
    {
      ledger.Status = "FAILED";
      ledger.UpdatedAt = DateTime.UtcNow;
      await db.SaveChangesAsync();
      return BadRequest(ApiResponseFactory.Fail("Invalid card details."));
    }

    await Task.Delay(1500, HttpContext.RequestAborted);
    await using var transaction = await db.Database.BeginTransactionAsync();
    await entitlements.ApplyAsync(ledger);
    ledger.Status = "APPROVED";
    ledger.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    await transaction.CommitAsync();
    return Ok(ApiResponseFactory.Ok(new { transaction = ledger, activated = true }));
  }

  [HttpGet("/api/payment/status/{id}")]
  public async Task<IActionResult> Status(string id, CancellationToken cancellationToken)
  {
    var status = await db.PaymentTransactions
      .AsNoTracking()
      .Where(transaction => transaction.Id == id)
      .Select(transaction => new
      {
        transaction.Id,
        transaction.Status,
        transaction.UpdatedAt
      })
      .SingleOrDefaultAsync(cancellationToken);
    return status is null
      ? NotFound(new { success = false, message = "Không tìm thấy giao dịch." })
      : Ok(new { success = true, data = status });
  }

  [HttpPost("upload-proof")]
  [Consumes("multipart/form-data")]
  [RequestSizeLimit(8 * 1024 * 1024)]
  public async Task<IActionResult> UploadProof(
    [FromForm] string transactionId,
    [FromForm] IFormFile? proofFile,
    CancellationToken cancellationToken)
  {
    string? savedFilePath = null;
    try
    {
      if (string.IsNullOrWhiteSpace(transactionId))
        return BadRequest(new { success = false, message = "Mã giao dịch đối chiếu không được để trống." });
      if (proofFile is null || proofFile.Length == 0)
        return BadRequest(new { success = false, message = "Tập tin minh chứng không hợp lệ hoặc trống." });
      if (proofFile.Length > 8 * 1024 * 1024)
        return BadRequest(new { success = false, message = "Ảnh minh chứng không được vượt quá 8 MB." });

      var extension = Path.GetExtension(proofFile.FileName).ToLowerInvariant();
      var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
      if (!allowedExtensions.Contains(extension) || (!proofFile.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) && !string.Equals(proofFile.ContentType, "application/octet-stream", StringComparison.OrdinalIgnoreCase)))
        return BadRequest(new { success = false, message = "Định dạng tệp không hỗ trợ. Chỉ nhận JPG, PNG, WEBP." });

      PaymentTransaction? ledger = await db.PaymentTransactions
        .SingleOrDefaultAsync(transaction => transaction.Id == transactionId.Trim(), cancellationToken);

      if (ledger is null)
      {
        var lookup = transactionId.Trim();
        ledger = await db.PaymentTransactions
          .FirstOrDefaultAsync(transaction => transaction.TransferMemo.Contains(lookup), cancellationToken);
      }

      if (ledger is null)
        return NotFound(new { success = false, message = "Không tìm thấy giao dịch cần đối chiếu." });
      var senderError = ValidateSender(ledger.SenderId, ledger.SenderType);
      if (senderError is not null) return senderError;
      if (ledger.Status != "PENDING")
        return Conflict(new { success = false, message = "Giao dịch đã được xử lý và không thể tải lại minh chứng." });

      var webRoot = environment.WebRootPath;
      if (string.IsNullOrWhiteSpace(webRoot))
        webRoot = Path.Combine(environment.ContentRootPath, "wwwroot");
      var receiptFolder = Path.GetFullPath(Path.Combine(webRoot, "uploads", "receipts"));
      Directory.CreateDirectory(receiptFolder);

      var secureUniqueName = $"proof_{Guid.NewGuid():N}{extension}";
      savedFilePath = Path.Combine(receiptFolder, secureUniqueName);
      await using (var targetStream = new FileStream(
        savedFilePath,
        FileMode.CreateNew,
        FileAccess.Write,
        FileShare.None,
        81920,
        FileOptions.Asynchronous))
      {
        await proofFile.CopyToAsync(targetStream, cancellationToken);
        await targetStream.FlushAsync(cancellationToken);
      }

      var relativePublicPath = $"/uploads/receipts/{secureUniqueName}";
      ledger.ProofAttachmentUrl = relativePublicPath;
      ledger.Status = "PENDING";
      ledger.UpdatedAt = DateTime.UtcNow;
      await db.SaveChangesAsync(cancellationToken);

      try
      {
        await hubContext.Clients.All.SendAsync("ReceiveNotification", new
        {
          type = "PAYMENT_PROOF",
          title = "Giao dịch Premium mới",
          message = $"Khách hàng {ledger.SenderId} đã tải minh chứng chuyển khoản."
        }, cancellationToken);
      }
      catch (Exception notificationError)
      {
        logger.LogWarning(notificationError, "Payment proof saved but SignalR notification failed for {TransactionId}", ledger.Id);
      }

      return Ok(new
      {
        success = true,
        message = "Tải lên minh chứng chuyển khoản thành công!",
        path = relativePublicPath,
        data = ledger
      });
    }
    catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
    {
      logger.LogWarning("Payment proof upload was cancelled for {TransactionId}", transactionId);
      return StatusCode(499, new { success = false, message = "Yêu cầu tải file đã bị hủy." });
    }
    catch (Exception exception)
    {
      if (!string.IsNullOrWhiteSpace(savedFilePath) && System.IO.File.Exists(savedFilePath))
      {
        try { System.IO.File.Delete(savedFilePath); }
        catch (Exception cleanupError) { logger.LogWarning(cleanupError, "Could not clean orphan receipt {Path}", savedFilePath); }
      }
      logger.LogError(exception, "Payment proof upload failed for {TransactionId}", transactionId);
      var detail = environment.IsDevelopment() ? $": {exception.Message}" : ".";
      return StatusCode(500, new
      {
        success = false,
        message = $"Lỗi xử lý file nội bộ trên server{detail}"
      });
    }
  }

  private IActionResult? ValidateSender(string senderId, string senderType)
  {
    if (string.IsNullOrWhiteSpace(senderId) || senderType is not ("USER" or "VENDOR"))
      return BadRequest(ApiResponseFactory.Fail("Invalid sender."));
    if (senderType == "USER")
    {
      var authenticatedUserId = User.Identity?.IsAuthenticated == true &&
        string.Equals(User.FindFirstValue(ClaimTypes.Role), "USER", StringComparison.OrdinalIgnoreCase)
          ? User.FindFirstValue(ClaimTypes.NameIdentifier)
          : null;
      var expectedSenderId = authenticatedUserId ??
        Request.Headers["X-Visitor-Session"].ToString().Trim();
      return string.Equals(expectedSenderId, senderId, StringComparison.Ordinal)
        ? null
        : Unauthorized(ApiResponseFactory.Fail("Tourist identity does not match."));
    }
    var claim = User.FindFirstValue("vendor_id");
    return User.Identity?.IsAuthenticated == true && claim == senderId
      ? null
      : Unauthorized(ApiResponseFactory.Fail("Vendor identity does not match."));
  }

  private static decimal ResolveAmount(string transactionType)
  {
    if (transactionType == "USER_PREMIUM") return 30_000m;
    if (transactionType == "VENDOR_PREMIUM") return 599_000m;
    return 299_000m;
  }

  private static string BuildMemo(string pattern, string id, string senderId, string type)
  {
    var uniqueId = id[..10].ToUpperInvariant();
    var memo = (string.IsNullOrWhiteSpace(pattern) ? "VTA [Type] [Id]" : pattern.Trim())
      .Replace("[Id]", uniqueId, StringComparison.OrdinalIgnoreCase)
      .Replace("[Type]", type, StringComparison.OrdinalIgnoreCase)
      .Replace("[SenderId]", senderId, StringComparison.OrdinalIgnoreCase)
      .Replace("[USER_ID]", senderId, StringComparison.OrdinalIgnoreCase)
      .Replace("[TÊN BẠN]", senderId, StringComparison.OrdinalIgnoreCase);

    if (!memo.Contains(uniqueId, StringComparison.OrdinalIgnoreCase))
      memo = $"{memo} {uniqueId}";
    return memo.Length <= 255 ? memo : $"{memo[..244]} {uniqueId}";
  }

  private static bool IsValidCard(string cardNumber, string expiry, string cvv)
  {
    var digits = new string(cardNumber.Where(char.IsDigit).ToArray());
    if (digits.Length is < 13 or > 19 || cvv.Length is < 3 or > 4 || !cvv.All(char.IsDigit))
      return false;
    var parts = expiry.Split('/');
    if (parts.Length != 2 || !int.TryParse(parts[0], out var month) ||
        !int.TryParse(parts[1], out var year) || month is < 1 or > 12)
      return false;
    year += year < 100 ? 2000 : 0;
    if (new DateTime(year, month, DateTime.DaysInMonth(year, month)) < DateTime.UtcNow.Date)
      return false;
    var sum = 0;
    var alternate = false;
    for (var index = digits.Length - 1; index >= 0; index--)
    {
      var value = digits[index] - '0';
      if (alternate && (value *= 2) > 9) value -= 9;
      sum += value;
      alternate = !alternate;
    }
    return sum % 10 == 0;
  }
}

public sealed record CheckoutIntent(
  string SenderId,
  string SenderType,
  string PaymentMethod,
  string TransactionType);
public sealed record VisaPaymentRequest(
  string TransactionId,
  string CardholderName,
  string CardNumber,
  string Expiry,
  string Cvv);
