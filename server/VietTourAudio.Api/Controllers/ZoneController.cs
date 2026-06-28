using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/zones")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,ZONE_ADMIN")]
public sealed class ZoneController(AppDbContext db) : ControllerBase
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
    
    var pois = z.Pois.Where(p => p.Status != "ARCHIVED")
      .OrderBy(p => p.Id).Select(p => new { id = p.Id.ToString(), p.Name, p.Status }).ToList();
      
    var qrRow = (await DatabaseSql.QueryRowsAsync(db, 
      "SELECT code FROM qr_codes WHERE tour_id=@id AND qr_type='TOUR' AND is_active=1 LIMIT 1",
      new Dictionary<string, object?> { ["@id"] = id })).SingleOrDefault();
    var qrCode = qrRow != null ? qrRow["code"]?.ToString() : null;

    var item = new {
      id = z.Id.ToString(),
      z.VendorId,
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
  public async Task<IActionResult> Create([FromBody] ZoneRequest request)
  {
    var slug = string.IsNullOrWhiteSpace(request.Slug) ? Slugify(request.Name) : request.Slug;
    var entity = new FestivalZone { VendorId = request.VendorId, Name = request.Name.Trim(), Slug = slug.Trim(),
      Description = request.Description, CoverImageUrl = request.CoverImageUrl, Latitude = request.Latitude,
      Longitude = request.Longitude, Status = request.Status, SortOrder = request.SortOrder };
    db.FestivalZones.Add(entity); await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = entity.Id.ToString(), entity.Name, entity.Slug }));
  }

  [HttpPut("{id:long}")]
  public async Task<IActionResult> Update(ulong id, [FromBody] ZoneRequest request)
  {
    var entity = await db.FestivalZones.SingleAsync(x => x.Id == id);
    var slug = string.IsNullOrWhiteSpace(request.Slug) ? Slugify(request.Name) : request.Slug;
    entity.Name = request.Name.Trim(); entity.Slug = slug.Trim(); entity.Description = request.Description;
    entity.CoverImageUrl = request.CoverImageUrl; entity.Latitude = request.Latitude; entity.Longitude = request.Longitude;
    entity.Status = request.Status; entity.SortOrder = request.SortOrder; await db.SaveChangesAsync();
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

  [HttpDelete("{id:long}")]
  public async Task<IActionResult> Delete([FromRoute] ulong id)
  {
    var zone = await db.FestivalZones.Include(z => z.Pois).SingleOrDefaultAsync(x => x.Id == id);
    if (zone is null) return NotFound(ApiResponseFactory.Fail("zone.not_found"));
    if (zone.Pois.Any(p => p.Status != "ARCHIVED"))
    {
      return BadRequest(new { success = false, message = "Không thể xóa khu vực này vì hiện tại vẫn đang chứa các sạp hàng hoạt động." });
    }
    db.FestivalZones.Remove(zone);
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(true));
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

  private static string Slugify(string value) => string.Join('-', value.Trim().ToLowerInvariant()
    .Split(' ', StringSplitOptions.RemoveEmptyEntries)).Replace("đ", "d");
}

public sealed record ZoneRequest(ulong VendorId, string Name, string? Slug = null, string? Description = null, string? CoverImageUrl = null,
  decimal? Latitude = null, decimal? Longitude = null, string Status = "DRAFT", int SortOrder = 0);
