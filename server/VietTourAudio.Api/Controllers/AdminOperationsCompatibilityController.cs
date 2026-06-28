using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/analytics")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,MODERATOR,FINANCE")]
public sealed class AdminAnalyticsCompatibilityController(AppDbContext db) : ControllerBase
{
  [HttpGet("hourly-active-users")]
  public async Task<IActionResult> Hourly()
  {
    var databaseRows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT HOUR(visited_at) hourNumber,COUNT(DISTINCT visitor_session_id) activeUsers
      FROM visit_events WHERE DATE(visited_at)=CURDATE() GROUP BY HOUR(visited_at)
      """);
    var values = databaseRows.ToDictionary(x => Convert.ToInt32(x["hourNumber"]), x => Convert.ToInt32(x["activeUsers"]));
    var currentHour = DateTime.Now.Hour;
    var points = Enumerable.Range(0, currentHour + 1).Select(hour => new
      { hour = $"{hour:00}:00", activeUsers = values.GetValueOrDefault(hour) }).ToArray();
    var activeNow = Convert.ToInt32((await DatabaseSql.QueryRowsAsync(db,
      "SELECT COUNT(DISTINCT id) activeUsersNow FROM visitor_sessions WHERE last_seen_at>=NOW()-INTERVAL 5 MINUTE")).Single()["activeUsersNow"]);
    return Ok(ApiResponseFactory.Ok(new { points, activeUsersNow = activeNow, updatedAt = DateTime.UtcNow }));
  }

  [HttpGet("dashboard")]
  public async Task<IActionResult> Dashboard()
  {
    var kpis = (await DatabaseSql.QueryRowsAsync(db, """
      SELECT (SELECT COUNT(*) FROM vendors) totalVendors,
        (SELECT COUNT(*) FROM vendors WHERE status='APPROVED') activeVendors,
        (SELECT COUNT(*) FROM vendors WHERE status='PENDING') pendingVendors,
        (SELECT COUNT(*) FROM zones WHERE status='ACTIVE' AND approval_status='APPROVED') activePois,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='PAID' AND payment_type='VISITOR_PREMIUM') totalRevenue,
        (SELECT COUNT(*) FROM qr_scan_events) totalScans
      """)).Single();
    var tours = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(t.id AS CHAR) tourId,t.name tourName,t.slug tourSlug,t.status tourStatus,
        COUNT(DISTINCT q.id) scanCount,(SELECT COUNT(*) FROM zones z WHERE z.tour_id=t.id AND z.status='ACTIVE') poiCount
      FROM tours t LEFT JOIN qr_scan_events q ON q.tour_id=t.id WHERE t.status!='ARCHIVED'
      GROUP BY t.id,t.name,t.slug,t.status ORDER BY scanCount DESC,t.name
      """);
    var pois = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(z.id AS CHAR) poiId,z.name poiName,z.slug poiSlug,z.status poiStatus,
        t.name tourName,t.slug tourSlug,s.name stallName,
        COUNT(DISTINCT ph.id) playCount,COUNT(DISTINCT ve.id) visitCount
      FROM zones z JOIN tours t ON t.id=z.tour_id JOIN stalls s ON s.id=z.stall_id
      LEFT JOIN play_history ph ON ph.poi_id=z.id LEFT JOIN visit_events ve ON ve.poi_id=z.id
      WHERE z.status!='ARCHIVED' GROUP BY z.id,z.name,z.slug,z.status,t.name,t.slug,s.name
      ORDER BY playCount DESC,visitCount DESC,z.name
      """);
    return Ok(ApiResponseFactory.Ok(new { kpis, tourStats = tours, poiStats = pois }));
  }
}

[ApiController]
[Route("api/admin/audit-logs")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminAuditCompatibilityController(AppDbContext db) : ControllerBase
{
  [HttpGet]
  public async Task<IActionResult> List() => Ok(ApiResponseFactory.Ok(await DatabaseSql.QueryRowsAsync(db, """
    SELECT CAST(a.id AS CHAR) id,CAST(a.actor_user_id AS CHAR) actorUserId,u.full_name actorName,
      a.action,a.target_type targetType,CAST(a.target_id AS CHAR) targetId,a.before_data beforeData,
      a.after_data afterData,a.ip_address ipAddress,a.user_agent userAgent,a.created_at createdAt
    FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 500
    """)));
}

[ApiController]
[Route("api/admin/stalls")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminStallCompatibilityController(AppDbContext db) : ControllerBase
{
  [HttpPut("{id:long}/qr/reset")]
  public async Task<IActionResult> ResetQr(ulong id)
  {
    var code = $"STALL-{id}-{Guid.NewGuid():N}".ToUpperInvariant();
    await DatabaseSql.ExecuteAsync(db, """
      UPDATE qr_codes SET is_active=0 WHERE stall_id=@id AND qr_type='STALL';
      INSERT INTO qr_codes(vendor_id,stall_id,code,qr_type,target_url,is_active)
      SELECT vendor_id,id,@code,'STALL',CONCAT('/stalls/',slug),1 FROM stalls WHERE id=@id
      """, new Dictionary<string, object?> { ["@id"] = id, ["@code"] = code });
    return Ok(ApiResponseFactory.Ok(new { id = id.ToString(), code }));
  }

  [HttpPut("{id:long}/premium")]
  public async Task<IActionResult> Premium(ulong id, [FromBody] PremiumRequest request)
  {
    var count = await DatabaseSql.ExecuteAsync(db, "UPDATE stalls SET is_premium=@premium WHERE id=@id",
      new Dictionary<string, object?> { ["@premium"] = request.IsPremium, ["@id"] = id });
    return count == 0 ? NotFound(ApiResponseFactory.Fail("stall.not_found")) :
      Ok(ApiResponseFactory.Ok(new { success = true, isPremium = request.IsPremium }));
  }
}

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminUserCreateCompatibilityController(AppDbContext db) : ControllerBase
{
  [HttpPost("zone-admins")]
  public async Task<IActionResult> Create([FromBody] ZoneAdminRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email) || request.Password.Length < 6)
      return BadRequest(ApiResponseFactory.Fail("user.invalid"));
    var user = new User
    {
      FullName = request.FullName.Trim(), Email = request.Email.Trim().ToLowerInvariant(),
      PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12), Role = UserRole.ZONE_ADMIN,
      Status = UserStatus.ACTIVE, AssignedZoneId = ulong.Parse(request.AssignedZoneId),
      CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
    };
    db.Users.Add(user); await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = user.Id.ToString(), displayName = user.FullName,
      user.Email, role = user.Role.ToString(), status = user.Status.ToString(), createdAt = user.CreatedAt }));
  }
}

[ApiController]
[Route("api/admin/translate")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminTranslateCompatibilityController(IHttpClientFactory clients) : ControllerBase
{
  [HttpPost]
  public async Task<IActionResult> Translate([FromBody] TranslationRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Text) || request.TargetLangs.Length == 0)
      return BadRequest(ApiResponseFactory.Fail("translation.invalid"));
    var supported = new HashSet<string>(["vi", "en", "ja", "ko", "zh"]);
    var result = new Dictionary<string, string>();
    var client = clients.CreateClient();
    foreach (var language in request.TargetLangs.Distinct())
    {
      if (!supported.Contains(language)) continue;
      var url = $"https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl={Uri.EscapeDataString(language)}&dt=t&q={Uri.EscapeDataString(request.Text)}";
      using var response = await client.GetAsync(url);
      if (!response.IsSuccessStatusCode) { result[language] = ""; continue; }
      using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
      result[language] = string.Concat(document.RootElement[0].EnumerateArray()
        .Select(item => item[0].ValueKind == JsonValueKind.String ? item[0].GetString() : ""));
    }
    return Ok(ApiResponseFactory.Ok(result));
  }
}

public sealed record PremiumRequest(bool IsPremium);
public sealed record ZoneAdminRequest(string FullName, string Email, string Password, string AssignedZoneId);
public sealed record TranslationRequest(string Text, string[] TargetLangs);
