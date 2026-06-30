using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/analytics")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,MODERATOR,FINANCE")]
public sealed class AdminAnalyticsCompatibilityController(
  AppDbContext db,
  VietTourAudio.Api.Services.IPresenceTracker presence) : ControllerBase
{
  [HttpGet("hourly-active-users")]
  public async Task<IActionResult> Hourly()
  {
    var currentHour = DateTime.Now.Hour;
    var points = Enumerable.Range(0, currentHour + 1).Select(hour => new
      { hour = $"{hour:00}:00", activeUsers = 0 }).ToArray();
    var snapshot = presence.Snapshot();
    return Ok(ApiResponseFactory.Ok(new
    {
      points,
      activeUsersNow = snapshot.TotalActive,
      byZone = snapshot.ByZone,
      updatedAt = snapshot.UpdatedAtUtc
    }));
  }

  [HttpGet("dashboard")]
  public async Task<IActionResult> Dashboard()
  {
    var totalVendors = await db.Vendors.CountAsync();
    var activePois = await db.Pois.CountAsync(x => x.Status == "ACTIVE" && x.ApprovalStatus == "APPROVED");
    var totalRevenue = await db.PaymentTransactions.Where(x => x.Status == "APPROVED").SumAsync(x => x.Amount);

    var totalVisits = await db.VisitEvents.CountAsync();
    var totalPlays = await db.AudioPlayEvents.CountAsync();
    var kpis = new
    {
      totalVendors = totalVendors,
      activeVendors = totalVendors,
      pendingVendors = 0,
      activePois = activePois,
      totalRevenue = totalRevenue,
      totalScans = 0,
      totalVisits,
      totalAudioPlays = totalPlays
    };

    var zones = await db.FestivalZones.Include(z => z.Pois).AsNoTracking().ToListAsync();
    var tourStats = zones.Select(t => new
    {
      tourId = t.Id,
      tourName = t.Name,
      tourSlug = t.Slug,
      tourStatus = t.Status,
      scanCount = 0,
      poiCount = t.Pois.Count
    }).ToList();

    var visitCounts = await db.VisitEvents.AsNoTracking().GroupBy(x => x.PoiId)
      .Select(group => new { PoiId = group.Key, Count = group.Count() })
      .ToDictionaryAsync(x => x.PoiId, x => x.Count);
    var playCounts = await db.AudioPlayEvents.AsNoTracking().GroupBy(x => x.PoiId)
      .Select(group => new { PoiId = group.Key, Count = group.Count() })
      .ToDictionaryAsync(x => x.PoiId, x => x.Count);
    var pois = await db.Pois.Include(x => x.FestivalZone).Include(x => x.Vendor).AsNoTracking().ToListAsync();
    var poiStats = pois.Select(z => new
    {
      poiId = z.Id,
      poiName = z.StallName,
      poiSlug = z.Slug,
      poiStatus = z.Status,
      tourName = z.FestivalZone?.Name ?? "",
      tourSlug = z.FestivalZone?.Slug ?? "",
      stallName = z.StallName,
      playCount = playCounts.GetValueOrDefault(z.Id),
      visitCount = visitCounts.GetValueOrDefault(z.Id)
    }).ToList();

    return Ok(ApiResponseFactory.Ok(new { kpis, tourStats, poiStats }));
  }
}

[ApiController]
[Route("api/admin/audit-logs")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminAuditCompatibilityController : ControllerBase
{
  [HttpGet]
  public IActionResult List() => Ok(ApiResponseFactory.Ok(new List<object>()));
}

[ApiController]
[Route("api/admin/stalls")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminStallCompatibilityController(AppDbContext db) : ControllerBase
{
  [HttpPut("{id}/qr/reset")]
  public async Task<IActionResult> ResetQr(string id)
  {
    var code = $"STALL-{id[..4]}-{Guid.NewGuid():N}".ToUpperInvariant();
    await DatabaseSql.ExecuteAsync(db, """
      UPDATE qr_codes SET is_active=0 WHERE poi_id=@id AND qr_type='STALL';
      INSERT INTO qr_codes(vendor_id,poi_id,code,qr_type,target_url,is_active)
      SELECT vendor_id,id,@code,'STALL',CONCAT('/stalls/',slug),1 FROM Pois WHERE id=@id
      """, new Dictionary<string, object?> { ["@id"] = id, ["@code"] = code });
    return Ok(ApiResponseFactory.Ok(new { id = id, code }));
  }

  [HttpPut("{id}/premium")]
  public async Task<IActionResult> Premium(string id, [FromBody] PremiumRequest request)
  {
    var affected = await DatabaseSql.ExecuteAsync(db, "UPDATE Vendors SET is_premium=@premium WHERE id=@id",
      new Dictionary<string, object?> { ["@premium"] = request.IsPremium, ["@id"] = id });
    await DatabaseSql.ExecuteAsync(db, "UPDATE Pois SET is_premium_priority=@premium WHERE vendor_id=@id",
      new Dictionary<string, object?> { ["@premium"] = request.IsPremium, ["@id"] = id });
    return affected == 0 ? NotFound(ApiResponseFactory.Fail("vendor.not_found")) :
      Ok(ApiResponseFactory.Ok(new { success = true, isPremium = request.IsPremium }));
  }
}

public sealed record PremiumRequest(bool IsPremium);

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
      Status = UserStatus.ACTIVE,
      CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
    };
    db.Users.Add(user); await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = user.Id, displayName = user.FullName,
      user.Email, role = user.Role.ToString(), status = user.Status.ToString(), createdAt = user.CreatedAt }));
  }
}

public sealed record ZoneAdminRequest(string FullName, string Email, string Password, string AssignedZoneId);

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
      using var document = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
      result[language] = string.Concat(document.RootElement[0].EnumerateArray()
        .Select(item => item[0].ValueKind == System.Text.Json.JsonValueKind.String ? item[0].GetString() : ""));
    }
    return Ok(ApiResponseFactory.Ok(result));
  }
}

public sealed record TranslationRequest(string Text, string[] TargetLangs);
