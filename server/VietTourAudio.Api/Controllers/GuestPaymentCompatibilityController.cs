using System;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/payment")]
public sealed class GuestPaymentCompatibilityController(AppDbContext db) : ControllerBase
{
  [HttpPost("create-request")]
  public async Task<IActionResult> Create([FromBody] PaymentUnlockRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.GuestId)) return BadRequest(ApiResponseFactory.Fail("payment.guest_required"));
    var tour = (await DatabaseSql.QueryRowsAsync(db,
      "SELECT name, 0.00 AS price, 0 AS isPremium FROM FestivalZones WHERE id=@id AND status='PUBLISHED'",
      new Dictionary<string, object?> { ["@id"] = request.TourId })).SingleOrDefault();
    if (tour is null) return NotFound(ApiResponseFactory.Fail("tour.not_found"));
    var clean = new string(request.GuestId.Where(char.IsLetterOrDigit).ToArray());
    var suffix = clean.Length <= 8 ? clean : clean[^8..];
    var reference = $"VTAG{suffix}T{request.TourId}".ToUpperInvariant();
    await DatabaseSql.ExecuteAsync(db, """
      INSERT INTO payment_requests(guest_id,tour_id,reference_code,status)
      VALUES(@guestId,@tourId,@reference,'PENDING')
      ON DUPLICATE KEY UPDATE status='PENDING',created_at=NOW()
      """, new Dictionary<string, object?> { ["@guestId"] = request.GuestId, ["@tourId"] = request.TourId, ["@reference"] = reference });
    var setting = (await DatabaseSql.QueryRowsAsync(db,
      "SELECT vvalue AS value FROM app_settings WHERE kkey='PREMIUM_PAYMENT_QR' LIMIT 1")).SingleOrDefault();
    if (setting?["value"] is not string bankValue) return StatusCode(503, ApiResponseFactory.Fail("payment.bank_not_configured"));
    var parts = bankValue.Split(':');
    if (parts.Length < 4) return StatusCode(503, ApiResponseFactory.Fail("payment.bank_not_configured"));
    var price = Convert.ToDecimal(tour["price"]);
    var qrUrl = $"https://img.vietqr.io/image/{Uri.EscapeDataString(parts[0])}-{Uri.EscapeDataString(parts[1])}-compact2.jpg" +
      $"?amount={price:0}&addInfo={Uri.EscapeDataString(reference)}&accountName={Uri.EscapeDataString(parts[3])}";
    return Ok(ApiResponseFactory.Ok(new { referenceCode = reference, amount = price,
      bankBin = parts[0], accountNumber = parts[1], accountName = parts[3], qrUrl }));
  }

  [HttpGet("status")]
  public async Task<IActionResult> Status([FromQuery] string reference)
  {
    var row = (await DatabaseSql.QueryRowsAsync(db,
      "SELECT status FROM payment_requests WHERE UPPER(reference_code)=UPPER(@reference) LIMIT 1",
      new Dictionary<string, object?> { ["@reference"] = reference })).SingleOrDefault();
    return row is null ? NotFound(ApiResponseFactory.Fail("payment.not_found")) : Ok(ApiResponseFactory.Ok(row));
  }

  [HttpPost("sepay-webhook")]
  public async Task<IActionResult> Webhook([FromBody] JsonElement body)
  {
    var content = body.TryGetProperty("content", out var value) ? value.GetString() :
      body.TryGetProperty("description", out value) ? value.GetString() : "";
    var match = Regex.Match(content ?? "", @"VTAG[A-Z0-9]+T[A-Z0-9\-]+",
      RegexOptions.IgnoreCase);
    if (!match.Success) return Ok(new { success = false, message = "payment.reference_invalid" });
    var reference = match.Value.ToUpperInvariant();
    var payment = (await DatabaseSql.QueryRowsAsync(db,
      "SELECT guest_id guestId,tour_id tourId FROM payment_requests WHERE UPPER(reference_code)=@reference LIMIT 1",
      new Dictionary<string, object?> { ["@reference"] = reference })).SingleOrDefault();
    if (payment is null) return NotFound(ApiResponseFactory.Fail("payment.not_found"));
    var transactionReference = body.TryGetProperty("id", out var id) ? id.ToString() :
      body.TryGetProperty("transactionId", out id) ? id.ToString() : Guid.NewGuid().ToString("N");
    await DatabaseSql.ExecuteAsync(db, """
      UPDATE payment_requests SET status='PAID' WHERE UPPER(reference_code)=@reference;
      INSERT INTO unlocked_tours(guest_id,tour_id,transaction_reference)
      VALUES(@guestId,@tourId,@transaction)
      ON DUPLICATE KEY UPDATE transaction_reference=VALUES(transaction_reference),unlocked_at=NOW()
      """, new Dictionary<string, object?> { ["@reference"] = reference, ["@guestId"] = payment["guestId"],
        ["@tourId"] = payment["tourId"], ["@transaction"] = transactionReference });
    return Ok(new { success = true, message = "payment.processed" });
  }
}

public sealed record PaymentUnlockRequest(string GuestId, string TourId);
