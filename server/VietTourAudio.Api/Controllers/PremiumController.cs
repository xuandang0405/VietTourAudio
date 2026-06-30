using System.Data;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api")]
public sealed partial class PremiumController(AppDbContext db) : ControllerBase
{
  private const decimal PremiumPrice = 30_000m;

  [HttpGet("user/premium-status")]
  public async Task<IActionResult> GetPremiumStatus([FromQuery] string? poiId = null)
  {
    var subject = await ResolveSubjectAsync();
    if (subject is null)
      return Unauthorized(ApiResponseFactory.Fail("Tourist identity is required."));

    var state = await GetCurrentStateAsync(subject);
    var normalizedPoiId = string.IsNullOrWhiteSpace(poiId) ? null : poiId.Trim();
    var hasUsedFreeListen = false;
    if (normalizedPoiId is not null)
    {
      var playRows = await DatabaseSql.QueryRowsAsync(db, """
        SELECT 1 AS found FROM user_poi_audio_plays
        WHERE subject_key=@subjectKey AND poi_id=@poiId LIMIT 1
        """, new Dictionary<string, object?>
        {
          ["@subjectKey"] = subject.SubjectKey,
          ["@poiId"] = normalizedPoiId
        });
      hasUsedFreeListen = playRows.Count > 0;
    }
    return Ok(ApiResponseFactory.Ok(new
    {
      isPremium = state.IsPremium,
      expiry = state.Expiry,
      poiId = normalizedPoiId,
      hasUsedFreeListen
    }));
  }

  [HttpPost("user/unlock-24h")]
  public async Task<IActionResult> UnlockPremium24Hours()
  {
    var subject = await ResolveSubjectAsync();
    if (subject is null)
      return Unauthorized(ApiResponseFactory.Fail("Tourist identity is required."));

    var now = DateTime.UtcNow;
    var expiry = now.AddHours(24);
    var transactionId = Guid.NewGuid().ToString("N");

    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    if (subject.User is not null)
    {
      subject.User.IsPremiumActive = true;
      subject.User.PremiumExpiryDate = expiry;
      subject.User.UpdatedAt = now;
    }
    else
    {
      await db.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO visitor_sessions(token,is_premium,premium_24h_expiry,last_seen_at)
        VALUES({subject.SenderId},1,{expiry},{now})
        ON DUPLICATE KEY UPDATE
          is_premium=1,
          premium_24h_expiry={expiry},
          last_seen_at={now}
        """);
    }

    db.PaymentTransactions.Add(new PaymentTransaction
    {
      Id = transactionId,
      SenderId = subject.SenderId,
      SenderType = "USER",
      PaymentMethod = "DIRECT",
      TransactionType = "USER_PREMIUM",
      Amount = PremiumPrice,
      TransferMemo = $"VTA-24H-{transactionId[..12].ToUpperInvariant()}",
      Status = "APPROVED",
      CreatedAt = now,
      UpdatedAt = now
    });
    await db.SaveChangesAsync();
    await transaction.CommitAsync();

    return Ok(ApiResponseFactory.Ok(new
    {
      message = "Kích hoạt gói Premium 24h thành công!",
      isPremium = true,
      expiry,
      transactionId
    }));
  }

  [HttpPost("user/audio-access")]
  public async Task<IActionResult> AuthorizeAudioPlay([FromBody] AudioAccessRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.PoiId))
      return BadRequest(ApiResponseFactory.Fail("POI is required."));

    var poiId = request.PoiId.Trim();
    var poiExists = await db.Pois.AsNoTracking().AnyAsync(poi =>
      poi.Id == poiId && poi.Status == "ACTIVE" && poi.ApprovalStatus == "APPROVED");
    if (!poiExists)
      return NotFound(ApiResponseFactory.Fail("Không tìm thấy điểm thuyết minh."));

    var subject = await ResolveSubjectAsync();
    if (subject is null)
      return Unauthorized(ApiResponseFactory.Fail("Tourist identity is required."));

    var state = await GetCurrentStateAsync(subject);
    if (state.IsPremium)
    {
      return Ok(ApiResponseFactory.Ok(new
      {
        allowed = true,
        isPremium = true,
        expiry = state.Expiry,
        freeListenConsumed = false
      }));
    }

    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    var inserted = await db.Database.ExecuteSqlInterpolatedAsync($"""
      INSERT IGNORE INTO user_poi_audio_plays(subject_key,poi_id,first_played_at)
      VALUES({subject.SubjectKey},{poiId},{DateTime.UtcNow})
      """);
    await transaction.CommitAsync();

    var allowed = inserted == 1;
    return Ok(ApiResponseFactory.Ok(new
    {
      allowed,
      isPremium = false,
      expiry = (DateTime?)null,
      freeListenConsumed = allowed,
      poiId,
      hasUsedFreeListen = true,
      reason = allowed ? null : "FREE_LISTEN_ALREADY_USED"
    }));
  }

  private async Task<PremiumSubject?> ResolveSubjectAsync()
  {
    if (User.Identity?.IsAuthenticated == true)
    {
      if (!string.Equals(User.FindFirstValue(ClaimTypes.Role), "USER", StringComparison.OrdinalIgnoreCase))
        return null;

      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrWhiteSpace(userId)) return null;
      var user = await db.Users.SingleOrDefaultAsync(candidate =>
        candidate.Id == userId && candidate.Status == UserStatus.ACTIVE);
      return user is null ? null : new PremiumSubject($"USER:{user.Id}", user.Id, user);
    }

    var visitorToken = Request.Headers["X-Visitor-Session"].ToString().Trim();
    if (!VisitorTokenPattern().IsMatch(visitorToken)) return null;

    var now = DateTime.UtcNow;
    await db.Database.ExecuteSqlInterpolatedAsync($"""
      INSERT INTO visitor_sessions(token,is_premium,last_seen_at)
      VALUES({visitorToken},0,{now})
      ON DUPLICATE KEY UPDATE last_seen_at={now}
      """);
    return new PremiumSubject($"SESSION:{visitorToken}", visitorToken, null);
  }

  private async Task<PremiumState> GetCurrentStateAsync(PremiumSubject subject)
  {
    var now = DateTime.UtcNow;
    if (subject.User is not null)
    {
      var active = subject.User.IsPremiumActive &&
        subject.User.PremiumExpiryDate.HasValue &&
        subject.User.PremiumExpiryDate.Value > now;
      if (subject.User.IsPremiumActive && !active)
      {
        subject.User.IsPremiumActive = false;
        subject.User.PremiumExpiryDate = null;
        subject.User.UpdatedAt = now;
        await db.SaveChangesAsync();
      }
      return new PremiumState(active, active ? subject.User.PremiumExpiryDate : null);
    }

    await db.Database.ExecuteSqlInterpolatedAsync($"""
      UPDATE visitor_sessions
      SET is_premium=0,premium_24h_expiry=NULL
      WHERE token={subject.SenderId}
        AND is_premium=1
        AND (premium_24h_expiry IS NULL OR premium_24h_expiry<={now})
      """);
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT is_premium AS isPremium,premium_24h_expiry AS expiry
      FROM visitor_sessions WHERE token=@token LIMIT 1
      """, new Dictionary<string, object?> { ["@token"] = subject.SenderId });
    if (rows.Count == 0) return new PremiumState(false, null);

    var isPremium = rows[0]["isPremium"] is not null && Convert.ToBoolean(rows[0]["isPremium"]);
    var expiry = rows[0]["expiry"] is null
      ? (DateTime?)null
      : DateTime.SpecifyKind(Convert.ToDateTime(rows[0]["expiry"]), DateTimeKind.Utc);
    return new PremiumState(isPremium && expiry > now, isPremium ? expiry : null);
  }

  [GeneratedRegex("^[A-Za-z0-9-]{16,160}$", RegexOptions.CultureInvariant)]
  private static partial Regex VisitorTokenPattern();

  private sealed record PremiumSubject(string SubjectKey, string SenderId, User? User);
  private sealed record PremiumState(bool IsPremium, DateTime? Expiry);
}

public sealed record AudioAccessRequest(string PoiId);
