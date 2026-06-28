using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
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
    var zones = await db.FestivalZones.Include(z => z.Pois).ThenInclude(p => p.Products).AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync();
    var list = new List<object>();
    foreach (var z in zones)
    {
      var poiCount = z.Pois.Count(p => p.Status != "ARCHIVED");
      var qrRow = (await DatabaseSql.QueryRowsAsync(db, 
        "SELECT code FROM qr_codes WHERE tour_id=@id AND qr_type='TOUR' AND is_active=1 LIMIT 1",
        new Dictionary<string, object?> { ["@id"] = z.Id })).SingleOrDefault();
      var qrCode = qrRow != null ? qrRow["code"]?.ToString() : null;

      list.Add(new {
        id = z.Id.ToString(),
        vendorId = (string?)null,
        z.Name,
        z.Slug,
        z.Description,
        coverImageUrl = z.CoverImageUrl,
        z.Latitude,
        z.Longitude,
        z.Status,
        poiCount,
        qrCode
      });
    }
    return Ok(ApiResponseFactory.Ok(list));
  }

  [HttpGet("{id:long}")]
  public async Task<IActionResult> Get(ulong id)
  {
    var z = await db.FestivalZones.Include(z => z.Pois).ThenInclude(p => p.Products).AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
    if (z is null) return NotFound(ApiResponseFactory.Fail("zone.not_found"));

    // Load full POI data directly from zones table (includes is_premium_content)
    var poiRows = await DatabaseSql.QueryRowsAsync(db,
      "SELECT CAST(id AS CHAR) id, CAST(stall_id AS CHAR) stallId, CAST(tour_id AS CHAR) tourId, name, slug, description, latitude, longitude, activation_radius activationRadius, is_premium_content isPremiumContent, status, approval_status approvalStatus FROM zones WHERE tour_id = @tourId AND status != 'ARCHIVED' ORDER BY id",
      new Dictionary<string, object?> { ["@tourId"] = id });

    var poiIds = poiRows.Select(r => r["id"]!.ToString()!).ToList();
    var transMap = new Dictionary<string, List<object>>();
    if (poiIds.Count > 0)
    {
      var idList = string.Join(',', poiIds);
      var transRows = await DatabaseSql.QueryRowsAsync(db,
        $"SELECT CAST(poi_id AS CHAR) poiId, lang, title, tts_script ttsScript, approval_status approvalStatus FROM poi_contents WHERE poi_id IN ({idList})");
      foreach (var row in transRows)
      {
        var pid = row["poiId"]!.ToString()!;
        if (!transMap.ContainsKey(pid)) transMap[pid] = new List<object>();
        transMap[pid].Add(new { lang = row["lang"]?.ToString(), title = row["title"]?.ToString() ?? "", ttsScript = row["ttsScript"]?.ToString() ?? "", approvalStatus = row["approvalStatus"]?.ToString() ?? "pending" });
      }
    }

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
      translations = transMap.TryGetValue(p["id"]!.ToString()!, out var trs) ? trs : new List<object>()
    }).ToList();
      
    var qrRow = (await DatabaseSql.QueryRowsAsync(db, 
      "SELECT code FROM qr_codes WHERE tour_id=@id AND qr_type='TOUR' AND is_active=1 LIMIT 1",
      new Dictionary<string, object?> { ["@id"] = id })).SingleOrDefault();
    var qrCode = qrRow != null ? qrRow["code"]?.ToString() : null;

    var item = new {
      id = z.Id.ToString(),
      vendorId = (string?)null,
      z.Name,
      z.Slug,
      z.Description,
      coverImageUrl = z.CoverImageUrl,
      z.Latitude,
      z.Longitude,
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
      Name = request.Name.Trim(), 
      Slug = slug,
      Description = request.Description, 
      CoverImageUrl = imageUrl, 
      Latitude = latitude,
      Longitude = longitude,
      Status = request.Status, 
      SortOrder = request.SortOrder 
    };
    db.FestivalZones.Add(entity); 
    await db.SaveChangesAsync();
    return Ok(new
    {
      success = true,
      message = "Khu vực đã được lưu trữ thành công!",
      data = new
      {
        id = entity.Id.ToString(),
        vendorId = (string?)null,
        entity.Name,
        entity.Slug,
        entity.Description,
        entity.CoverImageUrl,
        entity.Latitude,
        entity.Longitude,
        entity.Status
      }
    });
  }

  [HttpPut("{id:long}")]
  public async Task<IActionResult> Update(ulong id, [FromForm] ZoneRequest request)
  {
    var entity = await db.FestivalZones.SingleAsync(x => x.Id == id);
    if (!TryParseCoordinates(request.Latitude, request.Longitude, out var latitude, out var longitude))
      return BadRequest(new { success = false, message = "Tọa độ khu vực không hợp lệ. Hãy chọn trực tiếp trên bản đồ." });
    
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
    
    // Update imageUrl if a file was uploaded, or if coverImageUrl was supplied, or if explicitly cleared
    if (request.CoverFile != null || request.CoverImageUrl != null || string.IsNullOrEmpty(imageUrl))
    {
      entity.CoverImageUrl = imageUrl;
    }
    
    entity.Latitude = latitude; 
    entity.Longitude = longitude;
    entity.Status = request.Status; 
    entity.SortOrder = request.SortOrder; 
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = entity.Id.ToString(), entity.Name, entity.Slug }));
  }

  [HttpPatch("{id:long}/archive")]
  public async Task<IActionResult> Archive(ulong id)
  {
    var zone = await db.FestivalZones.SingleOrDefaultAsync(x => x.Id == id);
    if (zone is null) return NotFound(ApiResponseFactory.Fail("zone.not_found"));
    zone.Status = "ARCHIVED";
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(true));
  }

  [HttpDelete("{id}")]
  [Authorize(Roles = "SUPER_ADMIN,ADMIN")]
  public async Task<IActionResult> DeleteFestivalZone([FromRoute] string id)
  {
    Console.WriteLine($"[DELETE REQUEST RECEIVED]: Attempting to locate Zone ID -> {id}");

    if (Guid.TryParse(id, out Guid parsedZoneGuid))
    {
      return BadRequest(new { success = false, message = "Định dạng mã định danh ID khu vực không hợp lệ (Cơ sở dữ liệu yêu cầu ID dạng số ulong)." });
    }

    if (!ulong.TryParse(id, out ulong parsedId))
    {
      return BadRequest(new { success = false, message = "Định dạng mã định danh ID khu vực không hợp lệ." });
    }

    try
    {
      // 1. Delete associated users in the main users table by matching email with the vendor's contact email
      await db.Database.ExecuteSqlRawAsync(
        "DELETE FROM users WHERE email IN (SELECT contact_email FROM vendors WHERE assigned_tour_id = {0})", 
        parsedId);

      // 2. Explicitly delete associated vendor portal users to guarantee account deletion
      await db.Database.ExecuteSqlRawAsync(
        "DELETE FROM vendor_portal_users WHERE vendor_id IN (SELECT id FROM vendors WHERE assigned_tour_id = {0})", 
        parsedId);

      // 3. Delete vendors associated with this zone
      await db.Database.ExecuteSqlRawAsync("DELETE FROM vendors WHERE assigned_tour_id = {0}", parsedId);

      // 4. Delete the zone itself (which cascade deletes Pois and QR codes due to MySQL physical foreign keys constraint on delete cascade)
      var rowsAffected = await db.Database.ExecuteSqlRawAsync("DELETE FROM tours WHERE id = {0}", parsedId);

      if (rowsAffected == 0)
        return NotFound(new { success = false, message = "Không tìm thấy khu vực tương ứng trong hệ thống database." });

      return Ok(new { success = true, message = "Đã xóa bỏ khu vực thành công!" });
    }
    catch (Exception ex)
    {
      return StatusCode(500, new { success = false, message = $"Lỗi máy chủ khi xóa khu vực: {ex.Message}" });
    }
  }

  [HttpPost("reset-qr/{id:long}")]
  public async Task<IActionResult> ResetQr(ulong id)
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
      qrCodeStr = $"TOUR-{id}-{shortHash}";
      var count = await DatabaseSql.QueryRowsAsync(db,
        "SELECT id FROM qr_codes WHERE code = @code LIMIT 1",
        new Dictionary<string, object?> { ["@code"] = qrCodeStr });
      exists = count.Count > 0;
    } while (exists);
    await DatabaseSql.ExecuteAsync(db, """
      UPDATE qr_codes SET is_active=0 WHERE tour_id=@id AND qr_type='TOUR';
      INSERT INTO qr_codes(vendor_id,tour_id,code,qr_type,target_url,is_active)
      SELECT vendor_id,id,@code,'TOUR',CONCAT('/tours/',slug),1 FROM tours WHERE id=@id
      """, new Dictionary<string, object?> { ["@id"] = id, ["@code"] = qrCodeStr });

    return Ok(ApiResponseFactory.Ok(new { success = true, id = id.ToString(), slug = slugCode, qrCode = qrCodeStr }));
  }

  private async Task<string?> SaveUploadedFileAsync(IFormFile coverFile)
  {
    if (coverFile == null || coverFile.Length == 0) return null;

    // Validate size (verify size bounds under 5MB)
    if (coverFile.Length > 5 * 1024 * 1024) return null;

    // Validate extension compliance: .png, .jpg, .jpeg, .webp
    var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".webp" };
    var extension = Path.GetExtension(coverFile.FileName).ToLowerInvariant();
    if (!allowedExtensions.Contains(extension)) return null;

    // Generate a secure, randomized unique filename tracking schema string
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

  private static string Slugify(string value) => string.Join('-', value.Trim().ToLowerInvariant()
    .Split(' ', StringSplitOptions.RemoveEmptyEntries)).Replace("đ", "d");
}

public sealed record ZoneRequest(
  string Name,
  ulong? VendorId = null,
  string? Slug = null,
  string? Description = null,
  string? CoverImageUrl = null,
  string? Latitude = null,
  string? Longitude = null,
  string Status = "DRAFT",
  int SortOrder = 0,
  IFormFile? CoverFile = null
);
