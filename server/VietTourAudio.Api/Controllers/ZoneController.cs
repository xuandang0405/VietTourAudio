using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/zones")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,ZONE_ADMIN")]
public sealed class ZoneController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
  [HttpGet]
  public async Task<IActionResult> List()
  {
    var zones = await db.FestivalZones.Include(z => z.Pois).AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync();
    var list = new List<object>();
    foreach (var z in zones)
    {
      var poiCount = z.Pois.Count(p => p.Status != "ARCHIVED");
      var qrRow = (await DatabaseSql.QueryRowsAsync(db, 
        "SELECT code FROM qr_codes WHERE tour_id=@id AND qr_type='TOUR' AND is_active=1 LIMIT 1",
        new Dictionary<string, object?> { ["@id"] = z.Id })).SingleOrDefault();
      var qrCode = qrRow != null ? qrRow["code"]?.ToString() : null;

      list.Add(new {
        id = z.Id,
        vendorId = (string?)null,
        z.Name,
        z.Slug,
        z.Description,
        coverImageUrl = z.CoverUrl,
        latitude = (decimal)z.Latitude,
        longitude = (decimal)z.Longitude,
        z.Status,
        poiCount,
        qrCode
      });
    }
    return Ok(ApiResponseFactory.Ok(list));
  }

  [HttpGet("{id}")]
  public async Task<IActionResult> Get(string id)
  {
    var z = await db.FestivalZones.Include(z => z.Pois).AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
    if (z is null) return NotFound(ApiResponseFactory.Fail("zone.not_found"));

    // Load full POI data directly from Pois table
    var poiRows = await DatabaseSql.QueryRowsAsync(db,
      "SELECT id, vendor_id AS stallId, festival_zone_id AS tourId, stall_name AS name, slug, description, latitude, longitude, trigger_radius AS activationRadius, is_premium_priority AS isPremiumContent, status, approval_status AS approvalStatus FROM Pois WHERE festival_zone_id = @tourId AND status != 'ARCHIVED' ORDER BY is_premium_priority DESC, id",
      new Dictionary<string, object?> { ["@tourId"] = id });

    var pois = poiRows.Select(p => new {
      id = p["id"]?.ToString(),
      stallId = p["stallId"]?.ToString(),
      tourId = p["tourId"]?.ToString(),
      name = p["name"]?.ToString(),
      slug = p["slug"]?.ToString(),
      description = p["description"]?.ToString(),
      latitude = p["latitude"],
      longitude = p["longitude"],
      activationRadius = p["activationRadius"],
      isPremiumContent = Convert.ToBoolean(p["isPremiumContent"]),
      status = p["status"]?.ToString(),
      approvalStatus = p["approvalStatus"]?.ToString(),
      translations = new List<object>() // TTS scripts directly stored in Pois.description
    }).ToList();
      
    var qrRow = (await DatabaseSql.QueryRowsAsync(db, 
      "SELECT code FROM qr_codes WHERE tour_id=@id AND qr_type='TOUR' AND is_active=1 LIMIT 1",
      new Dictionary<string, object?> { ["@id"] = id })).SingleOrDefault();
    var qrCode = qrRow != null ? qrRow["code"]?.ToString() : null;

    var item = new {
      id = z.Id,
      vendorId = (string?)null,
      z.Name,
      z.Slug,
      z.Description,
      coverImageUrl = z.CoverUrl,
      latitude = (decimal)z.Latitude,
      longitude = (decimal)z.Longitude,
      z.Status,
      z.SortOrder,
      pois,
      qrCode
    };
    return Ok(ApiResponseFactory.Ok(item));
  }

  [HttpPost]
  public async Task<IActionResult> Create([FromForm] ZoneRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Name))
      return BadRequest(new { success = false, message = "Tên khu vực là bắt buộc." });
    if (!TryParseCoordinates(request.Latitude, request.Longitude, out var latitude, out var longitude))
      return BadRequest(new { success = false, message = "Tọa độ khu vực không hợp lệ. Hãy chọn trực tiếp trên bản đồ." });
    if (!new[] { "DRAFT", "PUBLISHED", "ARCHIVED" }.Contains(request.Status))
      return BadRequest(new { success = false, message = "Trạng thái khu vực không hợp lệ." });

    var slug = string.IsNullOrWhiteSpace(request.Slug) ? Slugify(request.Name) : Slugify(request.Slug);
    if (await db.FestivalZones.AsNoTracking().AnyAsync(zone => zone.Slug == slug))
      return Conflict(new { success = false, message = "Mã khu vực đã tồn tại." });

    string? imageUrl = request.CoverImageUrl;
    if (request.CoverFile != null)
    {
      imageUrl = await SaveUploadedFileAsync(request.CoverFile);
      if (imageUrl == null)
      {
        return BadRequest(ApiResponseFactory.Fail("invalid_image_file"));
      }
    }

    var entity = new FestivalZone { 
      ZoneCode = "Z-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant(),
      Name = request.Name.Trim(), 
      Slug = slug,
      Description = request.Description, 
      CoverUrl = imageUrl, 
      Latitude = (double)latitude,
      Longitude = (double)longitude,
      Status = request.Status, 
      SortOrder = request.SortOrder 
    };
    db.FestivalZones.Add(entity); 
    var created = await db.SaveChangesAsync();
    if (created == 0)
      return StatusCode(500, new { success = false, message = "Khong the luu khu vuc vao database." });
    return Ok(new
    {
      success = true,
      message = "Khu vực đã được lưu trữ thành công!",
      data = new
      {
        id = entity.Id,
        vendorId = (string?)null,
        entity.Name,
        entity.Slug,
        entity.Description,
        coverImageUrl = entity.CoverUrl,
        latitude = (decimal)entity.Latitude,
        longitude = (decimal)entity.Longitude,
        entity.Status
      }
    });
  }

  [HttpPut("{id}")]
  public async Task<IActionResult> Update(string id, [FromForm] ZoneRequest request)
  {
    var entity = await db.FestivalZones.SingleAsync(x => x.Id == id);
    if (!TryParseCoordinates(request.Latitude, request.Longitude, out var latitude, out var longitude))
      return BadRequest(new { success = false, message = "Tọa độ khu vực không hợp lệ. Hãy chọn trực tiếp trên bản đồ." });
    
    var oldCoverUrl = entity.CoverUrl;
    string? imageUrl = request.CoverImageUrl;
    if (request.CoverFile != null)
    {
      imageUrl = await SaveUploadedFileAsync(request.CoverFile);
      if (imageUrl == null)
      {
        return BadRequest(ApiResponseFactory.Fail("invalid_image_file"));
      }
    }

    var slug = string.IsNullOrWhiteSpace(request.Slug) ? Slugify(request.Name) : request.Slug;
    entity.Name = request.Name.Trim(); 
    entity.Slug = slug.Trim(); 
    entity.Description = request.Description;
    
    if (request.CoverFile != null || request.CoverImageUrl != null || string.IsNullOrEmpty(imageUrl))
    {
      entity.CoverUrl = imageUrl;
    }
    
    entity.Latitude = (double)latitude; 
    entity.Longitude = (double)longitude;
    entity.Status = request.Status; 
    entity.SortOrder = request.SortOrder; 
    var updated = await db.SaveChangesAsync();
    if (updated == 0)
      return StatusCode(500, new { success = false, message = "Khong the cap nhat khu vuc vao database." });

    if (entity.CoverUrl != oldCoverUrl)
    {
      var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
      FileCleanupHelper.DeletePhysicalFile(oldCoverUrl, webRoot);
    }

    return Ok(ApiResponseFactory.Ok(new { id = entity.Id, entity.Name, entity.Slug }));
  }

  [HttpPatch("{id}/archive")]
  public async Task<IActionResult> Archive(string id)
  {
    var zone = await db.FestivalZones.SingleOrDefaultAsync(x => x.Id == id);
    if (zone is null) return NotFound(ApiResponseFactory.Fail("zone.not_found"));
    zone.Status = "ARCHIVED";
    var archived = await db.SaveChangesAsync();
    if (archived == 0)
      return StatusCode(500, ApiResponseFactory.Fail("zone.not_archived"));
    return Ok(ApiResponseFactory.Ok(true));
  }

  [HttpDelete("{id}")]
  [Authorize(Roles = "SUPER_ADMIN,ADMIN")]
  public async Task<IActionResult> DeleteFestivalZone([FromRoute] string id)
  {
    try
    {
      var zone = await db.FestivalZones.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
      if (zone == null)
        return NotFound(new { success = false, message = "Không tìm thấy khu vực tương ứng trong hệ thống database." });

      var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
      var oldZoneCover = zone.CoverUrl;
      var poiCovers = await db.Pois.AsNoTracking()
        .Where(p => p.FestivalZoneId == id)
        .Select(p => new { p.CoverUrl, p.PendingCoverUrl })
        .ToListAsync();

      // 1. Delete associated users in the main users table by matching email with the vendor's contact email
      await db.Database.ExecuteSqlRawAsync(
        "DELETE FROM users WHERE email IN (SELECT email FROM Vendors WHERE festival_zone_id = {0})", 
        id);

      // 2. Explicitly delete associated vendor portal users to guarantee account deletion
      await db.Database.ExecuteSqlRawAsync(
        "DELETE FROM vendor_portal_users WHERE vendor_id IN (SELECT id FROM Vendors WHERE festival_zone_id = {0})", 
        id);

      // 3. Delete vendors associated with this zone
      await db.Database.ExecuteSqlRawAsync("DELETE FROM Vendors WHERE festival_zone_id = {0}", id);

      // 4. Delete the zone itself (which cascade deletes Pois and QR codes due to foreign keys)
      var rowsAffected = await db.Database.ExecuteSqlRawAsync("DELETE FROM FestivalZones WHERE id = {0}", id);

      if (rowsAffected == 0)
        return NotFound(new { success = false, message = "Không tìm thấy khu vực tương ứng trong hệ thống database." });

      FileCleanupHelper.DeletePhysicalFile(oldZoneCover, webRoot);
      foreach (var p in poiCovers)
      {
        FileCleanupHelper.DeletePhysicalFile(p.CoverUrl, webRoot);
        FileCleanupHelper.DeletePhysicalFile(p.PendingCoverUrl, webRoot);
      }

      return Ok(new { success = true, message = "Đã xóa bỏ khu vực thành công!" });
    }
    catch (Exception ex)
    {
      return StatusCode(500, new { success = false, message = $"Lỗi máy chủ khi xóa khu vực: {ex.Message}" });
    }
  }

  [HttpPost("reset-qr/{id}")]
  public async Task<IActionResult> ResetQr(string id)
  {
    var zone = await db.FestivalZones.SingleOrDefaultAsync(x => x.Id == id);
    if (zone is null)
    {
      return NotFound(ApiResponseFactory.Fail("zone.not_found"));
    }

    var slugCode = Guid.NewGuid().ToString("N");
    zone.Slug = slugCode;
    await db.SaveChangesAsync();

    string qrCodeStr;
    bool exists;
    do
    {
      var shortHash = Guid.NewGuid().ToString("N")[..4].ToUpperInvariant();
      qrCodeStr = $"TOUR-{id[..4]}-{shortHash}";
      var count = await DatabaseSql.QueryRowsAsync(db,
        "SELECT id FROM qr_codes WHERE code = @code LIMIT 1",
        new Dictionary<string, object?> { ["@code"] = qrCodeStr });
      exists = count.Count > 0;
    } while (exists);

    await DatabaseSql.ExecuteAsync(db, """
      UPDATE qr_codes SET is_active=0 WHERE tour_id=@id AND qr_type='TOUR';
      INSERT INTO qr_codes(vendor_id,tour_id,code,qr_type,target_url,is_active)
      SELECT NULL,id,@code,'TOUR',CONCAT('/tours/',slug),1 FROM FestivalZones WHERE id=@id
      """, new Dictionary<string, object?> { ["@id"] = id, ["@code"] = qrCodeStr });

    return Ok(ApiResponseFactory.Ok(new { success = true, id = id, slug = slugCode, qrCode = qrCodeStr }));
  }

  private async Task<string?> SaveUploadedFileAsync(IFormFile coverFile)
  {
    if (coverFile == null || coverFile.Length == 0) return null;
    if (coverFile.Length > 5 * 1024 * 1024) return null;

    var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".webp" };
    var extension = Path.GetExtension(coverFile.FileName).ToLowerInvariant();
    if (!allowedExtensions.Contains(extension)) return null;

    var uniqueFileName = $"zone_{Guid.NewGuid():N}{extension}";
    
    var uploadsFolder = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads", "zones");
    if (!Directory.Exists(uploadsFolder))
    {
      Directory.CreateDirectory(uploadsFolder);
    }
    
    var filePath = Path.Combine(uploadsFolder, uniqueFileName);
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
      await coverFile.CopyToAsync(stream);
    }

    return $"/uploads/zones/{uniqueFileName}";
  }

  private static bool TryParseCoordinates(
    string? latitudeText,
    string? longitudeText,
    out decimal latitude,
    out decimal longitude)
  {
    var latitudeValid = decimal.TryParse(
      latitudeText, NumberStyles.Float, CultureInfo.InvariantCulture, out latitude);
    var longitudeValid = decimal.TryParse(
      longitudeText, NumberStyles.Float, CultureInfo.InvariantCulture, out longitude);
    return latitudeValid
      && longitudeValid
      && latitude is >= -90 and <= 90
      && longitude is >= -180 and <= 180;
  }

  private static string Slugify(string value) => StringHelpers.Slugify(value);
}

public sealed record ZoneRequest(
  string Name,
  string? Slug = null,
  string? Description = null,
  string? CoverImageUrl = null,
  string? Latitude = null,
  string? Longitude = null,
  string Status = "DRAFT",
  int SortOrder = 0,
  IFormFile? CoverFile = null
);
