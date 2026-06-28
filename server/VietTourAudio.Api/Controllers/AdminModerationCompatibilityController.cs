using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/content")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,MODERATOR")]
public sealed class AdminContentCompatibilityController(AppDbContext db) : ControllerBase
{
  [HttpGet("queue")]
  public async Task<IActionResult> Queue([FromQuery] string status = "PENDING")
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(m.id AS CHAR) id,CAST(m.vendor_id AS CHAR) vendorId,CAST(m.stall_id AS CHAR) stallId,
        CAST(m.poi_id AS CHAR) poiId,
        CASE WHEN m.file_type IN('LOGO','QR') THEN 'IMAGE' ELSE m.file_type END mediaType,
        m.file_path storagePath,COALESCE(m.public_url,m.file_path) publicUrl,m.mime_type mimeType,
        m.file_size sizeBytes,m.moderation_status moderationStatus,m.rejection_reason rejectionReason,
        m.created_at createdAt,v.trade_name vendorName,s.name stallName,p.name poiName
      FROM media_files m JOIN vendors v ON v.id=m.vendor_id
      LEFT JOIN stalls s ON s.id=m.stall_id LEFT JOIN pois p ON p.id=m.poi_id
      WHERE (@status='ALL' OR m.moderation_status=@status) ORDER BY m.created_at DESC
      """, new Dictionary<string, object?> { ["@status"] = status });
    foreach (var row in rows)
    {
      row["vendor"] = row["vendorName"] is null ? null : new { businessName = row["vendorName"] };
      row["stall"] = row["stallName"] is null ? null : new { name = row["stallName"] };
      row["poi"] = row["poiName"] is null ? null : new { name = row["poiName"] };
      row.Remove("vendorName"); row.Remove("stallName"); row.Remove("poiName");
    }
    return Ok(ApiResponseFactory.Ok(rows));
  }

  [HttpPost("{id:long}/approve")] public Task<IActionResult> Approve(ulong id) => Moderate(id, "APPROVED", null);
  [HttpPost("{id:long}/reject")] public Task<IActionResult> Reject(ulong id, [FromBody] ReasonRequest request) => Moderate(id, "REJECTED", request.Reason);
  [HttpPost("{id:long}/hide")] public Task<IActionResult> Hide(ulong id, [FromBody] ReasonRequest request) => Moderate(id, "HIDDEN", request.Reason);

  [HttpPatch("bulk-approve")]
  public async Task<IActionResult> Bulk([FromBody] IdListRequest request)
  {
    if (request.Ids.Length == 0) return BadRequest(ApiResponseFactory.Fail("content.ids_required"));
    var count = 0;
    foreach (var id in request.Ids)
      count += await SetModeration(id, "APPROVED", null);
    return Ok(ApiResponseFactory.Ok(new { count }));
  }

  private async Task<IActionResult> Moderate(ulong id, string status, string? reason)
  {
    var count = await SetModeration(id, status, reason);
    if (count == 0) return NotFound(ApiResponseFactory.Fail("content.not_found"));
    var result = (await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(id AS CHAR) id,moderation_status moderationStatus,rejection_reason rejectionReason,
        moderated_at moderatedAt FROM media_files WHERE id=@id
      """, new Dictionary<string, object?> { ["@id"] = id })).Single();
    return Ok(ApiResponseFactory.Ok(result));
  }

  private Task<int> SetModeration(ulong id, string status, string? reason) => DatabaseSql.ExecuteAsync(db, """
    UPDATE media_files SET moderation_status=@status,rejection_reason=@reason,
      moderated_by_user_id=@actor,moderated_at=NOW() WHERE id=@id
    """, new Dictionary<string, object?> { ["@status"] = status, ["@reason"] = reason,
      ["@actor"] = ulong.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), ["@id"] = id });
}

[ApiController]
[Route("api/admin/geofences")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminGeofenceCompatibilityController(AppDbContext db) : ControllerBase
{
  [HttpGet("all")]
  public async Task<IActionResult> All()
  {
    var stalls = await Stalls();
    AddOverlaps(stalls);
    return Ok(ApiResponseFactory.Ok(stalls));
  }

  [HttpGet("all-data")]
  public async Task<IActionResult> AllData()
  {
    var stalls = await Stalls(); AddOverlaps(stalls);
    var pois = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(p.id AS CHAR) id,p.name,CAST(p.stall_id AS CHAR) stallId,s.name stallName,
        p.latitude,p.longitude,p.activation_radius activationRadius,p.status
      FROM pois p JOIN stalls s ON s.id=p.stall_id ORDER BY p.name
      """);
    var tours = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(t.id AS CHAR) id,t.name,t.description,
        COALESCE(AVG(p.latitude),t.latitude) latitude,COALESCE(AVG(p.longitude),t.longitude) longitude,
        GREATEST(150,COALESCE(MAX(p.activation_radius)+50,150)) radius
      FROM tours t LEFT JOIN tour_pois tp ON tp.tour_id=t.id LEFT JOIN pois p ON p.id=tp.poi_id
      WHERE t.status!='ARCHIVED' GROUP BY t.id,t.name,t.description,t.latitude,t.longitude
      """);
    return Ok(ApiResponseFactory.Ok(new { stalls, pois, tours }));
  }

  [HttpPost("check-overlap")]
  public async Task<IActionResult> Check([FromBody] GeofenceRequest request)
  {
    var radius = request.ActivationRadius ?? request.Radius ?? 10;
    var stalls = await Stalls();
    var overlaps = stalls.Select(row => new { stall = row, distance = Distance(request.Latitude, request.Longitude,
        Convert.ToDouble(row["latitude"]), Convert.ToDouble(row["longitude"])) })
      .Where(x => x.distance < radius + Convert.ToDouble(x.stall["activationRadius"])).ToArray();
    return Ok(ApiResponseFactory.Ok(new { hasOverlap = overlaps.Length > 0, overlaps }));
  }

  private async Task<List<Dictionary<string, object?>>> Stalls()
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(s.id AS CHAR) id,CAST(s.vendor_id AS CHAR) vendorId,s.name,s.slug,s.latitude,s.longitude,
        s.activation_radius activationRadius,IF(s.status='APPROVED','ACTIVE',s.status) status,
        s.created_at createdAt,s.updated_at updatedAt,v.trade_name businessName,v.contact_email ownerEmail
      FROM stalls s JOIN vendors v ON v.id=s.vendor_id ORDER BY s.name
      """);
    foreach (var row in rows)
    {
      row["vendor"] = new { id = row["vendorId"], businessName = row["businessName"], ownerEmail = row["ownerEmail"] };
      row.Remove("businessName"); row.Remove("ownerEmail");
    }
    return rows;
  }

  private static void AddOverlaps(List<Dictionary<string, object?>> rows)
  {
    foreach (var row in rows)
      row["overlaps"] = rows.Where(other => !Equals(other["id"], row["id"]) &&
          Distance(Convert.ToDouble(row["latitude"]), Convert.ToDouble(row["longitude"]),
            Convert.ToDouble(other["latitude"]), Convert.ToDouble(other["longitude"])) <
          Convert.ToDouble(row["activationRadius"]) + Convert.ToDouble(other["activationRadius"]))
        .Select(other => other["id"]).ToArray();
  }

  private static double Distance(double lat1, double lon1, double lat2, double lon2)
  {
    const double earth = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180; var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.Pow(Math.Sin(dLat / 2), 2) + Math.Cos(lat1 * Math.PI / 180) *
      Math.Cos(lat2 * Math.PI / 180) * Math.Pow(Math.Sin(dLon / 2), 2);
    return 2 * earth * Math.Asin(Math.Sqrt(a));
  }
}

public sealed record IdListRequest(ulong[] Ids);
public sealed record GeofenceRequest(double Latitude, double Longitude, double? ActivationRadius, double? Radius);
