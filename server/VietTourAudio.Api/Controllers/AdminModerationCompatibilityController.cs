using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/content")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,MODERATOR")]
public sealed class AdminContentCompatibilityController(
  AppDbContext db,
  IWebHostEnvironment environment,
  VietTourAudio.Api.Services.PoiTranslationService translationService,
  IHubContext<VietTourAudio.Api.Hubs.NotificationHub> hubContext) : ControllerBase
{
  [HttpGet("queue")]
  public async Task<IActionResult> Queue([FromQuery] string status = "PENDING")
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT * FROM (
        SELECT CAST(m.id AS CHAR) id,CAST(m.vendor_id AS CHAR) vendorId,CAST(m.poi_id AS CHAR) stallId,
          CAST(m.poi_id AS CHAR) poiId,
          CASE WHEN m.file_type IN('LOGO','QR') THEN 'IMAGE' ELSE m.file_type END mediaType,
          m.file_path storagePath,COALESCE(m.public_url,m.file_path) publicUrl,COALESCE(m.public_url,m.file_path) coverUrl,m.mime_type mimeType,
          m.file_size sizeBytes,m.moderation_status moderationStatus,m.rejection_reason rejectionReason,
          m.created_at createdAt,v.trade_name vendorName,p.stall_name stallName,p.stall_name poiName
        FROM media_files m 
        JOIN vendors v ON v.id=m.vendor_id
        LEFT JOIN Pois p ON p.id=m.poi_id
        WHERE (@status='ALL' OR m.moderation_status=@status)

        UNION ALL

        SELECT CAST(p.id AS CHAR) id,CAST(p.vendor_id AS CHAR) vendorId,CAST(p.id AS CHAR) stallId,
          NULL poiId,
          'STALL' mediaType,
          COALESCE(p.pending_cover_image_url, p.cover_url, '') storagePath,
          COALESCE(p.pending_cover_image_url, p.cover_url, '') publicUrl,
          COALESCE(p.pending_cover_image_url, p.cover_url, '') coverUrl,
          'text/plain' mimeType,
          CAST(0 AS UNSIGNED) sizeBytes,
          p.approval_status moderationStatus,
          NULL rejectionReason,
          p.updated_at createdAt,
          v.trade_name vendorName,
          p.stall_name stallName,
          NULL poiName
        FROM Pois p
        JOIN vendors v ON v.id=p.vendor_id
        WHERE p.vendor_id IS NOT NULL AND (@status='ALL' OR p.approval_status=@status)
      ) q ORDER BY q.createdAt DESC
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

  [HttpPost("{id}/approve")] public Task<IActionResult> Approve(string id) => Moderate(id, "APPROVED", null);
  [HttpPost("{id}/reject")] public Task<IActionResult> Reject(string id, [FromBody] ReasonRequest request) => Moderate(id, "REJECTED", request.Reason);
  [HttpPost("{id}/hide")] public Task<IActionResult> Hide(string id, [FromBody] ReasonRequest request) => Moderate(id, "HIDDEN", request.Reason);

  [HttpPatch("bulk-approve")]
  public async Task<IActionResult> Bulk([FromBody] IdListRequest request)
  {
    if (request.Ids.Length == 0) return BadRequest(ApiResponseFactory.Fail("content.ids_required"));
    var count = 0;
    foreach (var id in request.Ids)
    {
      var mediaAffected = await DatabaseSql.ExecuteAsync(db, """
        UPDATE media_files SET moderation_status='APPROVED' WHERE id=@id
        """, new Dictionary<string, object?> { ["@id"] = id });
      if (mediaAffected > 0)
      {
        count++;
        continue;
      }

      var poiApproved = await ApprovePoiInternalAsync(id);
      if (poiApproved)
      {
        count++;
        try
        {
          await hubContext.Clients.All.SendAsync("StallStatusUpdated", id, "APPROVED");
        }
        catch {}
      }
    }
    return Ok(ApiResponseFactory.Ok(new { count }));
  }

  private async Task<bool> ApprovePoiInternalAsync(string id)
  {
    var poi = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (poi == null) return false;

    var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
    var oldCoverUrl = poi.CoverUrl;
    var newCoverUrl = poi.PendingCoverUrl;

    poi.StallName = poi.PendingName ?? poi.StallName;
    poi.Description = poi.PendingDescription ?? poi.Description;
    if (poi.PendingLatitude.HasValue) poi.Latitude = poi.PendingLatitude.Value;
    if (poi.PendingLongitude.HasValue) poi.Longitude = poi.PendingLongitude.Value;
    
    if (!string.IsNullOrEmpty(newCoverUrl) && newCoverUrl != oldCoverUrl)
    {
      poi.CoverUrl = newCoverUrl;
    }

    poi.ApprovalStatus = "APPROVED";
    poi.Status = "ACTIVE";
    poi.UpdatedAt = DateTime.UtcNow;

    // Reset pending fields
    poi.PendingName = null;
    poi.PendingDescription = null;
    poi.PendingCoverUrl = null;
    poi.PendingLatitude = null;
    poi.PendingLongitude = null;

    // Run translations
    await translationService.AutoLocalizeAsync(poi);
    
    var saved = await db.SaveChangesAsync();
    if (saved > 0)
    {
      if (!string.IsNullOrEmpty(newCoverUrl) && newCoverUrl != oldCoverUrl)
      {
        FileCleanupHelper.DeletePhysicalFile(oldCoverUrl, webRoot);
      }
      return true;
    }
    return false;
  }

  private async Task<bool> RejectPoiInternalAsync(string id, string? reason)
  {
    var poi = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (poi == null) return false;

    poi.ApprovalStatus = "REJECTED";
    poi.Status = "INACTIVE";
    poi.UpdatedAt = DateTime.UtcNow;

    var saved = await db.SaveChangesAsync();
    return saved > 0;
  }

  private async Task<IActionResult> Moderate(string id, string status, string? reason)
  {
    var mediaAffected = await DatabaseSql.ExecuteAsync(db, """
      UPDATE media_files SET moderation_status=@status, rejection_reason=@reason WHERE id=@id
      """, new Dictionary<string, object?> { ["@status"] = status, ["@reason"] = reason, ["@id"] = id });
    if (mediaAffected > 0)
    {
      return Ok(ApiResponseFactory.Ok(new
      {
        id = id,
        moderationStatus = status,
        rejectionReason = reason,
        moderatedAt = DateTime.UtcNow
      }));
    }

    bool poiAffected = false;
    if (status == "APPROVED")
    {
      poiAffected = await ApprovePoiInternalAsync(id);
    }
    else
    {
      poiAffected = await RejectPoiInternalAsync(id, reason);
    }

    if (poiAffected)
    {
      try
      {
        await hubContext.Clients.All.SendAsync("StallStatusUpdated", id, status);
      }
      catch {}

      return Ok(ApiResponseFactory.Ok(new
      {
        id = id,
        moderationStatus = status,
        rejectionReason = reason,
        moderatedAt = DateTime.UtcNow
      }));
    }

    return NotFound(ApiResponseFactory.Fail("content.not_found"));
  }
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
      SELECT CAST(p.id AS CHAR) id,p.stall_name AS name,CAST(p.id AS CHAR) stallId,v.trade_name stallName,
        p.latitude,p.longitude,p.trigger_radius activationRadius,p.status
      FROM Pois p LEFT JOIN vendors v ON v.id=p.vendor_id WHERE p.vendor_id IS NULL ORDER BY p.stall_name
      """);
    var tours = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(t.id AS CHAR) id,t.name,t.description,
        COALESCE(AVG(p.latitude),t.latitude) latitude,COALESCE(AVG(p.longitude),t.longitude) longitude,
        GREATEST(150,COALESCE(MAX(p.trigger_radius)+50,150)) radius
      FROM FestivalZones t LEFT JOIN Pois p ON p.festival_zone_id=t.id
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
      SELECT CAST(p.id AS CHAR) id,CAST(p.vendor_id AS CHAR) vendorId,p.stall_name AS name,p.slug,p.latitude,p.longitude,
        p.trigger_radius activationRadius,IF(p.approval_status='APPROVED','ACTIVE',p.status) status,
        p.created_at createdAt,p.updated_at updatedAt,v.trade_name businessName,v.email ownerEmail
      FROM Pois p JOIN vendors v ON v.id=p.vendor_id ORDER BY p.stall_name
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

public sealed record IdListRequest(string[] Ids);
public sealed record GeofenceRequest(double Latitude, double Longitude, double? ActivationRadius, double? Radius);
