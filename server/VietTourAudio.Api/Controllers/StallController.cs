using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;
using VietTourAudio.Api.Data;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/stalls")]
public class StallController : ControllerBase
{
  private readonly IStallService _stallService;
  private readonly IPoiService _poiService;
  private readonly AppDbContext _db;

  public StallController(IStallService stallService, IPoiService poiService, AppDbContext db)
  {
    _stallService = stallService;
    _poiService = poiService;
    _db = db;
  }

  [HttpGet]
  public async Task<IActionResult> GetAll()
  {
    var result = await _stallService.GetStallsAsync();
    return Ok(ApiResponseFactory.Ok(result, "Danh sách sạp."));
  }

  [HttpGet("{id:long}")]
  public async Task<IActionResult> GetById(ulong id)
  {
    var result = await _stallService.GetByIdAsync(id);
    return Ok(ApiResponseFactory.Ok(result, "Chi tiết sạp."));
  }

  [HttpPost]
  public async Task<IActionResult> Create([FromBody] StallRequestDto request)
  {
    var result = await _stallService.CreateAsync(request);
    return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponseFactory.Ok(result, "Tạo sạp thành công."));
  }

  [HttpPost("{id:long}/approve")]
  public async Task<IActionResult> Approve(ulong id)
  {
    var result = await _stallService.UpdateStatusAsync(id, "APPROVED");
    return Ok(ApiResponseFactory.Ok(result, "Đã duyệt sạp."));
  }

  [HttpPost("{id:long}/suspend")]
  public async Task<IActionResult> Suspend(ulong id)
  {
    var result = await _stallService.UpdateStatusAsync(id, "SUSPENDED");
    return Ok(ApiResponseFactory.Ok(result, "Đã tạm khóa sạp."));
  }

  [HttpGet("/api/guest/resolve-code/{code}")]
  public async Task<IActionResult> ResolveCode(string code)
  {
    var trimmedCode = code.Trim();

    // Strategy 1: Find Tour via QR code
    var connection = await DatabaseSql.OpenConnectionAsync(_db);

    await using (var qrLookup = connection.CreateCommand())
    {
      qrLookup.CommandText = @"SELECT qr.tour_id, t.id, t.name, t.slug, t.description, t.status, t.vendor_id
                                FROM qr_codes qr
                                JOIN tours t ON t.id = qr.tour_id
                                WHERE REPLACE(qr.code, '-', '') = REPLACE(@code, '-', '') AND qr.qr_type = 'TOUR' AND qr.is_active = 1
                                LIMIT 1";
      qrLookup.AddParameter("@code", trimmedCode.ToUpperInvariant());
      await using var reader = await qrLookup.ExecuteReaderAsync();
      if (await reader.ReadAsync())
      {
        var tourId = reader.UInt64("id");
        var tourName = reader.GetString(reader.GetOrdinal("name"));
        var tourSlug = reader.GetString(reader.GetOrdinal("slug"));
        var tourDesc = reader.NullableString("description");
        var tourStatus = reader.GetString(reader.GetOrdinal("status"));
        await reader.CloseAsync();

        var pois = await GetZonesForTour(connection, tourId);
        return Ok(ApiResponseFactory.Ok(new
        {
          Stall = new { Id = tourId, Name = tourName, Slug = tourSlug, Description = tourDesc, Status = tourStatus, IsTour = true, TourId = tourId, TourSlug = tourSlug },
          Pois = pois
        }, "Tìm thấy thông tin khu vực và điểm tham quan."));
      }
    }

    // Strategy 2: Find Tour by slug
    await using (var slugLookup = connection.CreateCommand())
    {
      slugLookup.CommandText = "SELECT id, name, slug, description, status, vendor_id FROM tours WHERE slug = @slug AND status = 'PUBLISHED' LIMIT 1";
      slugLookup.AddParameter("@slug", trimmedCode.ToLowerInvariant());
      await using var reader = await slugLookup.ExecuteReaderAsync();
      if (await reader.ReadAsync())
      {
        var tourId = reader.UInt64("id");
        var tourName = reader.GetString(reader.GetOrdinal("name"));
        var tourSlug = reader.GetString(reader.GetOrdinal("slug"));
        var tourDesc = reader.NullableString("description");
        var tourStatus = reader.GetString(reader.GetOrdinal("status"));
        await reader.CloseAsync();

        var pois = await GetZonesForTour(connection, tourId);
        return Ok(ApiResponseFactory.Ok(new
        {
          Stall = new { Id = tourId, Name = tourName, Slug = tourSlug, Description = tourDesc, Status = tourStatus, IsTour = true, TourId = tourId, TourSlug = tourSlug },
          Pois = pois
        }, "Tìm thấy thông tin khu vực và điểm tham quan."));
      }
    }

    // Strategy 3: Legacy stall zone_code lookup
    var stall = await _stallService.GetByZoneCodeAsync(trimmedCode);
    if (stall == null)
    {
      return NotFound(ApiResponseFactory.Fail("Mã khu vực không hợp lệ hoặc không tồn tại."));
    }
    var stallPois = await _poiService.GetPoisAsync(stall.Id);
    return Ok(ApiResponseFactory.Ok(new { Stall = stall, Pois = stallPois }, "Tìm thấy thông tin sạp và điểm tham quan."));
  }

  private static async Task<List<object>> GetZonesForTour(System.Data.Common.DbConnection connection, ulong tourId)
  {
    var results = new List<object>();
    await using var command = connection.CreateCommand();
    command.CommandText = @"SELECT z.id, z.name, z.slug, z.description, z.latitude, z.longitude,
                                   z.activation_radius, z.is_premium_content, z.status, z.sort_order
                            FROM zones z WHERE z.tour_id = @tourId AND z.status = 'ACTIVE'
                            ORDER BY z.sort_order ASC, z.id ASC";
    command.AddParameter("@tourId", tourId);
    await using var reader = await command.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
      results.Add(new
      {
        Id = reader.UInt64("id"),
        Name = reader.GetString(reader.GetOrdinal("name")),
        Slug = reader.GetString(reader.GetOrdinal("slug")),
        Description = reader.NullableString("description"),
        Latitude = reader.Decimal("latitude"),
        Longitude = reader.Decimal("longitude"),
        ActivationRadius = reader.Int32("activation_radius"),
        IsPremium = reader.Boolean("is_premium_content"),
        Status = reader.GetString(reader.GetOrdinal("status")),
        SortOrder = reader.Int32("sort_order")
      });
    }
    return results;
  }
}
