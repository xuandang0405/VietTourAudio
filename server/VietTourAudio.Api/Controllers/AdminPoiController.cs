using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/pois")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminPoiController(
  AppDbContext db,
  IWebHostEnvironment environment,
  IHttpClientFactory clients,
  IHubContext<NotificationHub> hubContext,
  VietTourAudio.Api.Services.PoiTranslationService translationService) : ControllerBase
{
  [HttpGet]
  public async Task<IActionResult> List()
  {
    var pois = await db.Pois.AsNoTracking().OrderBy(x => x.Id).ToListAsync();
    var result = pois.Select(p => new {
      id = p.Id,
      stallId = p.VendorId,
      tourId = p.FestivalZoneId,
      name = p.StallName,
      p.Slug,
      p.Description,
      latitude = (decimal)p.Latitude,
      longitude = (decimal)p.Longitude,
      activationRadius = (int)p.TriggerRadius,
      p.Status,
      approvalStatus = p.ApprovalStatus,
      translations = new List<object>
      {
        new { lang = "vi", title = p.StallName ?? "", ttsScript = p.Description ?? "" },
        new { lang = "en", title = p.StallNameEn ?? "", ttsScript = p.DescriptionEn ?? "" },
        new { lang = "ja", title = p.StallNameJa ?? "", ttsScript = p.DescriptionJa ?? "" },
        new { lang = "ko", title = p.StallNameKo ?? "", ttsScript = p.DescriptionKo ?? "" },
        new { lang = "zh", title = p.StallNameZh ?? "", ttsScript = p.DescriptionZh ?? "" }
      }
    }).ToList();

    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpGet("stalls")]
  public async Task<IActionResult> Stalls()
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT p.id, p.vendor_id AS vendorId, p.stall_name AS name, p.slug, p.status, p.latitude, p.longitude,
             p.trigger_radius AS activationRadius, v.trade_name AS vendorBusinessName
      FROM Pois p
      JOIN Vendors v ON v.id = p.vendor_id
      ORDER BY p.stall_name
      """);

    var result = rows.Select(row => new {
      id = row["id"],
      vendorId = row["vendorId"],
      name = row["name"],
      slug = row["slug"],
      status = row["status"],
      latitude = row["latitude"],
      longitude = row["longitude"],
      activationRadius = row["activationRadius"],
      vendor = new {
        businessName = row["vendorBusinessName"]
      }
    });

    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpGet("zones")]
  public async Task<IActionResult> Zones() => Ok(ApiResponseFactory.Ok(await DatabaseSql.QueryRowsAsync(db,
    "SELECT id,name,slug,status FROM FestivalZones WHERE status!='ARCHIVED' ORDER BY name")));

  [HttpGet("distance")]
  public async Task<IActionResult> Distance([FromQuery(Name = "poi1_id")] string first, [FromQuery(Name = "poi2_id")] string second)
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT 6371000*2*ASIN(SQRT(POWER(SIN(RADIANS(b.latitude-a.latitude)/2),2)+
        COS(RADIANS(a.latitude))*COS(RADIANS(b.latitude))*POWER(SIN(RADIANS(b.longitude-a.longitude)/2),2))) distanceMeters
      FROM Pois a JOIN Pois b ON b.id=@second WHERE a.id=@first
      """, new Dictionary<string, object?> { ["@first"] = first, ["@second"] = second });
    return rows.Count == 0 ? NotFound(ApiResponseFactory.Fail("poi.not_found")) : Ok(ApiResponseFactory.Ok(rows[0]));
  }

  [HttpPost]
  public async Task<IActionResult> Create([FromForm] AdminPoiRequest request)
  {
    var name = request.Name?.Trim() ?? throw new ArgumentException("poi.name_required");
    var slug = !string.IsNullOrWhiteSpace(request.Slug) ? request.Slug : Slugify(name);
    var tourId = request.TourId ?? "";
    var stallId = request.StallId;
    var latitude = request.Latitude;
    var longitude = request.Longitude;
    var radius = request.ActivationRadius;
    var status = request.Status ?? "ACTIVE";
    var description = request.Description;
    var premium = request.IsPremiumContent;

    if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
      return BadRequest(ApiResponseFactory.Fail("poi.invalid_coordinates"));
    if (!await db.FestivalZones.AsNoTracking().AnyAsync(tour => tour.Id == tourId))
      return BadRequest(ApiResponseFactory.Fail("zone.not_found"));
    
    if (!string.IsNullOrEmpty(stallId))
    {
      var vendor = await db.Vendors.SingleOrDefaultAsync(x => x.Id == stallId);
      if (vendor == null) return BadRequest(ApiResponseFactory.Fail("stall.not_found"));
    }

    if (!string.IsNullOrEmpty(stallId) && await db.Pois.AsNoTracking().AnyAsync(poi => poi.VendorId == stallId && poi.Slug == slug))
      return Conflict(ApiResponseFactory.Fail("poi.slug_exists"));

    var coverUrl = await SaveUploadedFileAsync(request.CoverFile) ?? request.CoverUrl;
    var entity = new Poi
    {
      Id = Guid.NewGuid().ToString("N"),
      FestivalZoneId = tourId,
      VendorId = stallId,
      StallName = name,
      Slug = slug,
      Description = description,
      Latitude = (double)latitude,
      Longitude = (double)longitude,
      TriggerRadius = radius,
      IsPremiumPriority = premium,
      Status = status,
      ApprovalStatus = "APPROVED",
      CoverUrl = coverUrl,
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };
    db.Pois.Add(entity);
    MapTranslations(entity, request.TranslationsJson);
    // Auto-translate before saving to database
    await translationService.AutoLocalizeAsync(entity);
    await db.SaveChangesAsync();

    return Ok(ApiResponseFactory.Ok(new { id = entity.Id, name, slug }));
  }

  [HttpPut("{id}")]
  public async Task<IActionResult> Update(string id, [FromForm] AdminPoiRequest request)
  {
    var name = request.Name?.Trim() ?? throw new ArgumentException("poi.name_required");
    var description = request.Description;

    var poi = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (poi == null) return NotFound(ApiResponseFactory.Fail("poi.not_found"));

    var oldCoverUrl = poi.CoverUrl;
    var uploadedCoverUrl = await SaveUploadedFileAsync(request.CoverFile);
    var newCoverUrl = uploadedCoverUrl ?? request.CoverUrl;

    poi.FestivalZoneId = request.TourId ?? "";
    poi.VendorId = request.StallId;
    poi.StallName = name;
    poi.Slug = !string.IsNullOrWhiteSpace(request.Slug) ? request.Slug : Slugify(name);
    poi.Description = description;
    poi.Latitude = (double)request.Latitude;
    poi.Longitude = (double)request.Longitude;
    poi.TriggerRadius = request.ActivationRadius;
    poi.IsPremiumPriority = request.IsPremiumContent;
    poi.Status = request.Status;

    if (request.CoverFile != null || request.CoverUrl != null || string.IsNullOrEmpty(newCoverUrl))
    {
      poi.CoverUrl = newCoverUrl;
    }
    poi.UpdatedAt = DateTime.UtcNow;

    MapTranslations(poi, request.TranslationsJson);

    await translationService.AutoLocalizeAsync(poi);
    var affected = await db.SaveChangesAsync();
    if (affected == 0) return StatusCode(500, ApiResponseFactory.Fail("poi.not_saved"));

    if (poi.CoverUrl != oldCoverUrl)
    {
      var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
      FileCleanupHelper.DeletePhysicalFile(oldCoverUrl, webRoot);
    }

    return Ok(ApiResponseFactory.Ok(new { id = id, name }));
  }

  [HttpDelete("{id}")]
  public async Task<IActionResult> Delete(string id)
  {
    var count = await DatabaseSql.ExecuteAsync(db, "UPDATE Pois SET status='ARCHIVED' WHERE id=@id",
      new Dictionary<string, object?> { ["@id"] = id });
    return count == 0 ? NotFound(ApiResponseFactory.Fail("poi.not_found")) : Ok(ApiResponseFactory.Ok(true));
  }

  [HttpPost("tours/{id}/qr/reset")]
  public async Task<IActionResult> ResetTourQr(string id)
  {
    var code = $"TOUR-{id[..4]}-{Guid.NewGuid():N}".ToUpperInvariant();
    await DatabaseSql.ExecuteAsync(db, """
      UPDATE qr_codes SET is_active=0 WHERE tour_id=@id AND qr_type='TOUR';
      INSERT INTO qr_codes(vendor_id,tour_id,code,qr_type,target_url,is_active)
      SELECT NULL,id,@code,'TOUR',CONCAT('/tours/',slug),1 FROM FestivalZones WHERE id=@id
      """, new Dictionary<string, object?> { ["@id"] = id, ["@code"] = code });
    return Ok(ApiResponseFactory.Ok(new { id = id, code }));
  }

  [HttpGet("approvals")]
  public async Task<IActionResult> Approvals()
  {
    var pending = await db.Pois
      .Include(p => p.Vendor)
      .Where(p => p.ApprovalStatus == "PENDING")
      .AsNoTracking()
      .ToListAsync();

    var result = pending.Select(p => new {
      id = p.Id,
      name = p.StallName,
      pendingName = p.StallName,
      pendingDescription = p.Description,
      pendingCoverImageUrl = p.CoverUrl,
      pendingLatitude = (decimal)p.Latitude,
      pendingLongitude = (decimal)p.Longitude,
      vendorName = p.Vendor?.TradeName ?? "",
      entityType = "POI",
      approvalStatus = "PENDING"
    }).ToList();

    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpPatch("{id}/approve")]
  [HttpPost("{id}/approve")]
  public Task<IActionResult> Approve(string id) => Moderate(id, true);
  
  [HttpPatch("{id}/reject")]
  [HttpPost("{id}/reject")]
  public Task<IActionResult> Reject(string id) => Moderate(id, false);

  private async Task<IActionResult> Moderate(string id, bool approve)
  {
    var poi = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (poi == null) return NotFound(ApiResponseFactory.Fail("poi.not_found"));

    var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
    var oldCoverUrl = poi.CoverUrl;
    var newCoverUrl = poi.PendingCoverUrl;

    if (approve)
    {
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

      // Reset pending fields
      poi.PendingName = null;
      poi.PendingDescription = null;
      poi.PendingCoverUrl = null;
      poi.PendingLatitude = null;
      poi.PendingLongitude = null;

      // Run translations
      await translationService.AutoLocalizeAsync(poi);
    }
    else
    {
      poi.ApprovalStatus = "REJECTED";
    }

    poi.UpdatedAt = DateTime.UtcNow;
    var saved = await db.SaveChangesAsync();
    if (saved > 0 && approve)
    {
      if (!string.IsNullOrEmpty(newCoverUrl) && newCoverUrl != oldCoverUrl)
      {
        FileCleanupHelper.DeletePhysicalFile(oldCoverUrl, webRoot);
      }
    }

    try
    {
      await hubContext.Clients.All.SendAsync(
        "StallStatusUpdated",
        id,
        approve ? "APPROVED" : "REJECTED");
    }
    catch (Exception ex)
    {
      System.Console.WriteLine($"SignalR error: {ex.Message}");
    }

    return Ok(ApiResponseFactory.Ok(new { id, approved = approve }));
  }

  private static string Slugify(string value) => StringHelpers.Slugify(value);

  private static void MapTranslations(Poi poi, string? translationsJson)
  {
    if (string.IsNullOrEmpty(translationsJson)) return;
    try
    {
      using var doc = JsonDocument.Parse(translationsJson);
      if (doc.RootElement.ValueKind == JsonValueKind.Array)
      {
        foreach (var item in doc.RootElement.EnumerateArray())
        {
          var lang = item.GetProperty("lang").GetString();
          var title = item.TryGetProperty("title", out var tVal) ? tVal.GetString() : null;
          var ttsScript = item.TryGetProperty("ttsScript", out var tsVal) ? tsVal.GetString() : null;

          if (lang == "en")
          {
            poi.StallNameEn = title;
            poi.DescriptionEn = ttsScript;
          }
          else if (lang == "ja")
          {
            poi.StallNameJa = title;
            poi.DescriptionJa = ttsScript;
          }
          else if (lang == "ko")
          {
            poi.StallNameKo = title;
            poi.DescriptionKo = ttsScript;
          }
          else if (lang == "zh")
          {
            poi.StallNameZh = title;
            poi.DescriptionZh = ttsScript;
          }
        }
      }
    }
    catch (Exception ex)
    {
      System.Console.WriteLine($"Error parsing translations: {ex.Message}");
    }
  }

  private async Task<string?> SaveUploadedFileAsync(Microsoft.AspNetCore.Http.IFormFile? coverFile)
  {
    if (coverFile == null || coverFile.Length == 0) return null;
    if (coverFile.Length > 5 * 1024 * 1024) return null;

    var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".webp" };
    var extension = Path.GetExtension(coverFile.FileName).ToLowerInvariant();
    if (!allowedExtensions.Contains(extension)) return null;

    var uniqueFileName = $"poi_{Guid.NewGuid():N}{extension}";
    
    var uploadsFolder = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads", "pois");
    if (!Directory.Exists(uploadsFolder))
    {
      Directory.CreateDirectory(uploadsFolder);
    }
    
    var filePath = Path.Combine(uploadsFolder, uniqueFileName);
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
      await coverFile.CopyToAsync(stream);
    }

    return $"/uploads/pois/{uniqueFileName}";
  }
}

public sealed record AdminPoiRequest(
  string Name,
  string? Slug = null,
  string? TourId = null,
  string? StallId = null,
  decimal Latitude = 0,
  decimal Longitude = 0,
  int ActivationRadius = 25,
  string Status = "ACTIVE",
  string? Description = null,
  bool IsPremiumContent = false,
  string? CoverUrl = null,
  string? TranslationsJson = null,
  Microsoft.AspNetCore.Http.IFormFile? CoverFile = null
);
