using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/guest")]
public sealed class GuestController(
  AppDbContext db,
  IHttpClientFactory clients,
  Microsoft.AspNetCore.Hosting.IWebHostEnvironment env,
  Microsoft.AspNetCore.SignalR.IHubContext<VietTourAudio.Api.Hubs.NotificationHub> hubContext) : ControllerBase
{
  [HttpGet("payment-gateways")]
  public async Task<IActionResult> GetPublicGateways()
  {
    var activeConfigs = await db.AdminPaymentConfigs
      .Where(config => config.IsActive)
      .AsNoTracking()
      .OrderBy(config => config.Id)
      .ToListAsync();
    return Ok(new { success = true, data = activeConfigs });
  }

  [HttpGet("resolve-code/{param}")]
  public async Task<IActionResult> ResolveZoneOrSlug(
    [FromRoute] string param,
    [FromQuery] string? lang)
  {
    if (string.IsNullOrWhiteSpace(param))
      return BadRequest(new { success = false, message = "Param is missing." });

    var normalizedParam = param.Trim().ToLowerInvariant();
    var publicZones = db.FestivalZones
      .Include(zone => zone.Pois.Where(poi =>
        poi.Status == "ACTIVE" && poi.ApprovalStatus == "APPROVED"))
        .ThenInclude(poi => poi.Products)
      .AsNoTracking();

    var activeZone = await publicZones.FirstOrDefaultAsync(zone =>
        (zone.Status == "ACTIVE" || zone.Status == "PUBLISHED") &&
        zone.Slug.ToLower() == normalizedParam);

    if (activeZone is null)
    {
      var qrTour = (await DatabaseSql.QueryRowsAsync(db, """
        SELECT tour_id AS tourId
        FROM qr_codes
        WHERE qr_type = 'TOUR'
          AND tour_id IS NOT NULL
          AND (
            (LOWER(REPLACE(code, '-', '')) = REPLACE(@param, '-', '') AND is_active = 1)
            OR (
              LOWER(SUBSTRING_INDEX(TRIM(TRAILING '/' FROM target_url), '/', -1)) = @param
              AND is_active = 1
            )
          )
        ORDER BY is_active DESC, id DESC
        LIMIT 1
        """, new Dictionary<string, object?> { ["@param"] = normalizedParam }))
        .SingleOrDefault();

      if (qrTour is not null)
      {
        var tourId = qrTour["tourId"]?.ToString() ?? "";
        activeZone = await publicZones.FirstOrDefaultAsync(zone => zone.Id == tourId);
      }
    }

    if (activeZone is null)
    {
      var stall = (await DatabaseSql.QueryRowsAsync(db, """
        SELECT id, stall_name AS name, slug, description, status, vendor_id AS zoneCode
        FROM Pois
        WHERE (LOWER(vendor_id) = @param OR LOWER(slug) = @param)
          AND approval_status = 'APPROVED'
        LIMIT 1
        """, new Dictionary<string, object?> { ["@param"] = normalizedParam }))
        .SingleOrDefault();

      if (stall is not null)
      {
        var stallId = stall["id"]?.ToString() ?? "";
        var stallPois = await db.Pois
          .Where(poi =>
            poi.VendorId == stallId &&
            poi.Status == "ACTIVE" &&
            poi.ApprovalStatus == "APPROVED")
          .Include(poi => poi.Products)
          .AsNoTracking()
          .ToListAsync();

        return Ok(ApiResponseFactory.Ok(new
        {
          stall,
          pois = stallPois.Select(poi => new
          {
            poi.Id,
            Name = poi.StallName,
            stallName = poi.StallName,
            stallName_EN = poi.StallNameEn,
            description_EN = poi.DescriptionEn,
            stallName_JA = poi.StallNameJa,
            description_JA = poi.DescriptionJa,
            stallName_KO = poi.StallNameKo,
            description_KO = poi.DescriptionKo,
            stallName_ZH = poi.StallNameZh,
            description_ZH = poi.DescriptionZh,
            poi.Slug,
            poi.Description,
            coverUrl = poi.CoverUrl,
            imageUrl = poi.CoverUrl,
            poi.Latitude,
            poi.Longitude,
            ActivationRadius = poi.TriggerRadius,
            StallId = poi.VendorId,
            TourId = poi.FestivalZoneId,
            poi.Status,
            approvalStatus = poi.ApprovalStatus,
            audioUrl = (string?)null,
            ttsScript = poi.Description,
            products = poi.Products.Select(product => new
            {
              product.Id,
              Name = product.ProductName,
              product.Price
            })
          })
        }));
      }
    }

    if (activeZone is null)
      return NotFound(new { success = false, message = "Zone not found." });

    var data = new
    {
      stall = new
      {
        activeZone.Id,
        activeZone.Name,
        activeZone.Slug,
        activeZone.Description,
        activeZone.Status,
        tourId = activeZone.Id,
        tourSlug = activeZone.Slug,
        isTour = true
      },
      pois = activeZone.Pois.Select(poi => new
      {
        poi.Id,
        Name = poi.StallName,
        stallName = poi.StallName,
        stallName_EN = poi.StallNameEn,
        description_EN = poi.DescriptionEn,
        stallName_JA = poi.StallNameJa,
        description_JA = poi.DescriptionJa,
        stallName_KO = poi.StallNameKo,
        description_KO = poi.DescriptionKo,
        stallName_ZH = poi.StallNameZh,
        description_ZH = poi.DescriptionZh,
        poi.Slug,
        poi.Description,
        coverUrl = poi.CoverUrl,
        imageUrl = poi.CoverUrl,
        poi.Latitude,
        poi.Longitude,
        ActivationRadius = poi.TriggerRadius,
        StallId = poi.VendorId,
        TourId = poi.FestivalZoneId,
        poi.Status,
        approvalStatus = poi.ApprovalStatus,
        audioUrl = (string?)null,
        ttsScript = poi.Description,
        products = poi.Products.Select(product => new
        {
          product.Id,
          Name = product.ProductName,
          product.Price
        })
      })
    };

    return Ok(ApiResponseFactory.Ok(data));
  }

  [HttpGet("zones")]
  [HttpGet("tours")]
  public async Task<IActionResult> Zones()
  {
    var zones = await db.FestivalZones
      .Include(z => z.Pois)
      .ThenInclude(p => p.Products)
      .AsNoTracking()
      .Where(x => x.Status == "PUBLISHED")
      .OrderBy(x => x.SortOrder)
      .ToListAsync();

    var result = zones.Select(x => new
    {
      id = x.Id,
      x.Name,
      x.Slug,
      x.Description,
      coverImage = x.CoverUrl,
      coverUrl = x.CoverUrl,
      poi_count = x.Pois.Count(p => p.Status == "ACTIVE" && p.ApprovalStatus == "APPROVED"),
      latitude = x.Latitude,
      longitude = x.Longitude,
      pois = x.Pois.Where(p => p.Status == "ACTIVE" && p.ApprovalStatus == "APPROVED")
        .Select(p => new { id = p.Id, name = p.StallName, title = p.StallName, stallName = p.StallName,
          stallName_EN = p.StallNameEn, description_EN = p.DescriptionEn,
          stallName_JA = p.StallNameJa, description_JA = p.DescriptionJa,
          stallName_KO = p.StallNameKo, description_KO = p.DescriptionKo,
          stallName_ZH = p.StallNameZh, description_ZH = p.DescriptionZh, p.Slug, p.Description,
          coverUrl = p.CoverUrl, imageUrl = p.CoverUrl, p.Latitude, p.Longitude,
          activationRadius = p.TriggerRadius, stallId = p.VendorId })
    });

    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpGet("pois")]
  public async Task<IActionResult> PoisByZone([FromQuery(Name = "zone_code")] string zoneCode, [FromQuery] string lang = "vi")
  {
    if (string.IsNullOrWhiteSpace(zoneCode)) return BadRequest(ApiResponseFactory.Fail("error.zone_code_required"));
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT p.id, p.stall_name AS name, p.stall_name AS stallName,
             p.stall_name_en AS stallName_EN, p.description_en AS description_EN,
             p.stall_name_ja AS stallName_JA, p.description_ja AS description_JA,
             p.stall_name_ko AS stallName_KO, p.description_ko AS description_KO,
             p.stall_name_zh AS stallName_ZH, p.description_zh AS description_ZH,
             p.slug, p.description, p.cover_url AS imageUrl, p.latitude, p.longitude,
             p.trigger_radius AS activationRadius, p.is_premium_priority AS isPremiumContent,
             p.vendor_id AS stallId, p.stall_name AS stallName, NULL AS audioUrl,
             p.festival_zone_id AS tourId, f.slug AS tourSlug
      FROM Pois p
      JOIN FestivalZones f ON f.id = p.festival_zone_id
      WHERE (LOWER(p.vendor_id) = @code OR LOWER(p.slug) = @code)
        AND p.approval_status = 'APPROVED'
        AND p.status = 'ACTIVE'
      ORDER BY p.sort_order, p.id
      """, new Dictionary<string, object?> { ["@code"] = zoneCode.Trim() });
    return Ok(ApiResponseFactory.Ok(rows));
  }

  [HttpGet("audio/trigger")]
  public async Task<IActionResult> TriggerAudio(
    [FromQuery] string zone,
    [FromQuery] double latitude,
    [FromQuery] double longitude,
    [FromQuery] string lang = "vi")
  {
    if (string.IsNullOrWhiteSpace(zone) ||
        latitude is < -90 or > 90 ||
        longitude is < -180 or > 180)
      return BadRequest(ApiResponseFactory.Fail("stall.invalid_coordinates"));

    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT p.id, p.stall_name AS name, p.latitude, p.longitude,
             NULL AS audioUrl, p.vendor_id AS stallId, p.stall_name AS stallName,
             p.trigger_radius AS triggerRadius, p.is_premium_priority AS isPremiumPriority
      FROM Pois p
      WHERE (LOWER(p.vendor_id) = LOWER(@zone) OR LOWER(p.slug) = LOWER(@zone))
        AND p.approval_status = 'APPROVED'
        AND p.status = 'ACTIVE'
      """, new Dictionary<string, object?>
    {
      ["@zone"] = zone.Trim()
    });

    var candidates = rows.Select(row =>
    {
      var distance = HaversineMeters(
        latitude,
        longitude,
        Convert.ToDouble(row["latitude"]),
        Convert.ToDouble(row["longitude"]));
      return new
      {
        Row = row,
        Distance = distance,
        TriggerRadius = Convert.ToDouble(row["triggerRadius"]),
        IsPremiumPriority = Convert.ToBoolean(row["isPremiumPriority"])
      };
    })
    .Where(candidate => candidate.Distance <= candidate.TriggerRadius)
    .OrderByDescending(candidate => candidate.IsPremiumPriority)
    .ThenBy(candidate => candidate.Distance)
    .FirstOrDefault();

    if (candidates is null)
      return Ok(ApiResponseFactory.Ok(new { triggered = false, poi = (object?)null }));

    return Ok(ApiResponseFactory.Ok(new
    {
      triggered = true,
      poi = candidates.Row,
      computedDistanceToUser = Math.Round(candidates.Distance, 2)
    }));
  }

  [HttpGet("favorites/{guestId}")]
  public async Task<IActionResult> Favorites(string guestId)
  {
    var favoriteIds = await db.GuestFavorites
      .Where(f => f.GuestId == guestId)
      .Select(f => f.PoiId.ToString())
      .ToListAsync();

    return Ok(favoriteIds);
  }

  [HttpPost("favorites/sync")]
  public async Task<IActionResult> SyncFavorites([FromBody] FavoriteSyncRequest request)
  {
    foreach (var operation in request.Ops)
    {
      var poiId = operation.StallId;
      var poi = await db.Pois.FirstOrDefaultAsync(p => p.Id == operation.StallId || p.Slug == operation.StallId || p.VendorId == operation.StallId);
      if (poi != null)
      {
        poiId = poi.Id;
      }

      var existing = await db.GuestFavorites
        .FirstOrDefaultAsync(f => f.GuestId == request.GuestId && f.PoiId == poiId);

      if (operation.Action == "add")
      {
        if (existing == null)
        {
          db.GuestFavorites.Add(new GuestFavorite
          {
            GuestId = request.GuestId,
            PoiId = poiId,
            CreatedAt = DateTime.UtcNow
          });
        }
      }
      else if (operation.Action == "remove")
      {
        if (existing != null)
        {
          db.GuestFavorites.Remove(existing);
        }
      }
    }

    await db.SaveChangesAsync();
    return await Favorites(request.GuestId);
  }

  [HttpPost("favorites")]
  public async Task<IActionResult> AddFavorite([FromBody] AddFavoriteRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.GuestId) || string.IsNullOrWhiteSpace(request.PoiId))
      return BadRequest(ApiResponseFactory.Fail("GuestId and PoiId are required."));

    var poiId = request.PoiId;
    var poi = await db.Pois.FirstOrDefaultAsync(p => p.Id == request.PoiId || p.Slug == request.PoiId || p.VendorId == request.PoiId);
    if (poi != null)
    {
      poiId = poi.Id;
    }

    var existing = await db.GuestFavorites
      .FirstOrDefaultAsync(f => f.GuestId == request.GuestId && f.PoiId == poiId);

    if (existing != null)
    {
      db.GuestFavorites.Remove(existing);
    }
    else
    {
      db.GuestFavorites.Add(new GuestFavorite
      {
        GuestId = request.GuestId,
        PoiId = poiId,
        CreatedAt = DateTime.UtcNow
      });
    }

    await db.SaveChangesAsync();
    return await Favorites(request.GuestId);
  }

  [HttpPost("favorites/toggle")]
  public async Task<IActionResult> ToggleFavorite([FromBody] AddFavoriteRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.GuestId) || string.IsNullOrWhiteSpace(request.PoiId))
      return BadRequest("GuestId and PoiId are required.");

    var resolvedPoiId = request.PoiId;
    var poi = await db.Pois.FirstOrDefaultAsync(p => p.Id == request.PoiId || p.Slug == request.PoiId || p.VendorId == request.PoiId);
    if (poi != null)
    {
      resolvedPoiId = poi.Id;
    }

    var existing = await db.GuestFavorites
      .FirstOrDefaultAsync(f => f.GuestId == request.GuestId && f.PoiId == resolvedPoiId);

    if (existing != null)
    {
      db.GuestFavorites.Remove(existing);
    }
    else
    {
      db.GuestFavorites.Add(new GuestFavorite
      {
        GuestId = request.GuestId,
        PoiId = resolvedPoiId,
        CreatedAt = DateTime.UtcNow
      });
    }

    await db.SaveChangesAsync();

    var favoriteIds = await db.GuestFavorites
      .Where(f => f.GuestId == request.GuestId)
      .Select(f => f.PoiId.ToString())
      .ToListAsync();

    return Ok(favoriteIds);
  }

  [HttpDelete("favorites/{guestId}/{poiId}")]
  public async Task<IActionResult> DeleteFavorite(string guestId, string poiId)
  {
    if (string.IsNullOrWhiteSpace(guestId) || string.IsNullOrWhiteSpace(poiId))
      return BadRequest(ApiResponseFactory.Fail("GuestId and PoiId are required."));

    var resolvedPoiId = poiId;
    var poi = await db.Pois.FirstOrDefaultAsync(p => p.Id == poiId || p.Slug == poiId || p.VendorId == poiId);
    if (poi != null)
    {
      resolvedPoiId = poi.Id;
    }

    var existingList = await db.GuestFavorites
      .Where(f => f.GuestId == guestId && f.PoiId == resolvedPoiId)
      .ToListAsync();

    if (existingList.Any())
    {
      db.GuestFavorites.RemoveRange(existingList);
      await db.SaveChangesAsync();
    }

    return await Favorites(guestId);
  }



  [HttpGet("tours/{id}/unlocked-status")]
  public async Task<IActionResult> Unlocked(string id, [FromQuery] string guestId = "")
  {
    return Ok(ApiResponseFactory.Ok(new { unlocked = true, price = 0m }));
  }

  private static bool IsValidCoordinate(double lat, double lng)
  {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  [HttpGet("routing")]
  public async Task<IActionResult> GetRouting(
      [FromQuery] double startLng, 
      [FromQuery] double startLat, 
      [FromQuery] double endLng, 
      [FromQuery] double endLat)
  {
      if (!IsValidCoordinate(startLat, startLng) || !IsValidCoordinate(endLat, endLng))
      {
          return BadRequest(new
          {
              success = false,
              message = "Invalid coordinates."
          });
      }

      if (env.EnvironmentName == "Development")
      {
          System.Console.WriteLine($"[Routing API] Query started: ({startLat}, {startLng}) -> ({endLat}, {endLng})");
      }

      var client = clients.CreateClient();
      client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 VietTourAudio/1.0");

      var startLngStr = startLng.ToString(System.Globalization.CultureInfo.InvariantCulture);
      var startLatStr = startLat.ToString(System.Globalization.CultureInfo.InvariantCulture);
      var endLngStr = endLng.ToString(System.Globalization.CultureInfo.InvariantCulture);
      var endLatStr = endLat.ToString(System.Globalization.CultureInfo.InvariantCulture);

      try
      {
          var orsKey = System.Environment.GetEnvironmentVariable("ORS_API_KEY") ?? "5b3ce3597851110001cf62483861fb85ea4f4d22bb42c55452eb8c15";
          var orsUrl = $"http://api.openrouteservice.org/v2/directions/foot-walking?api_key={orsKey}&start={startLngStr},{startLatStr}&end={endLngStr},{endLatStr}";

          using var response = await client.GetAsync(orsUrl);
          if (response.IsSuccessStatusCode)
          {
              var body = await response.Content.ReadAsStringAsync();
              using var doc = JsonDocument.Parse(body);
              var root = doc.RootElement;
              if (root.TryGetProperty("features", out var features) && features.GetArrayLength() > 0)
              {
                  var feature = features[0];
                  var geometry = feature.GetProperty("geometry");
                  
                  double distance = 0;
                  double duration = 0;
                  if (feature.TryGetProperty("properties", out var props) && props.TryGetProperty("summary", out var summary))
                  {
                      if (summary.TryGetProperty("distance", out var distProp)) distance = distProp.GetDouble();
                      if (summary.TryGetProperty("duration", out var durProp)) duration = durProp.GetDouble();
                  }

                  var routeObject = new
                  {
                      geometry = new
                      {
                          type = geometry.GetProperty("type").GetString(),
                          coordinates = geometry.GetProperty("coordinates").Clone()
                      },
                      distance,
                      duration
                  };

                  return Ok(ApiResponseFactory.Ok(new
                  {
                      source = "ors",
                      routes = new[] { routeObject }
                  }));
              }
          }
      }
      catch (Exception ex)
      {
          System.Console.WriteLine($"[Routing API] ORS provider warning: {ex.Message}");
      }

      try
      {
          var osrmUrl = $"http://router.project-osrm.org/route/v1/foot/{startLngStr},{startLatStr};{endLngStr},{endLatStr}?overview=full&geometries=geojson";

          using var response = await client.GetAsync(osrmUrl);
          var body = await response.Content.ReadAsStringAsync();

          if (response.IsSuccessStatusCode)
          {
              using var doc = JsonDocument.Parse(body);
              var root = doc.RootElement;
              if (root.TryGetProperty("routes", out var routes) && routes.GetArrayLength() > 0)
              {
                  return Ok(ApiResponseFactory.Ok(new
                  {
                      source = "osrm",
                      routes = routes.Clone()
                  }));
              }
          }

          return StatusCode(502, new
          {
              success = false,
              message = "Both routing services failed.",
              providerStatus = (int)response.StatusCode
          });
      }
      catch (Exception ex)
      {
          if (env.EnvironmentName == "Development")
          {
              System.Console.WriteLine($"[Routing API] Fallback OSRM failed: {ex}");
          }
          return StatusCode(500, new
          {
              success = false,
              message = "Routing API failed.",
              error = env.EnvironmentName == "Development" ? ex.Message : null
          });
      }
  }

  [HttpGet("pois/{id}")]
  public async Task<IActionResult> Poi(string id)
  {
    var poi = await db.Pois.AsNoTracking().Where(x => x.Id == id && x.Status == "ACTIVE" && x.ApprovalStatus == "APPROVED")
      .Select(x => new { id = x.Id, name = x.StallName, stallName = x.StallName,
        stallName_EN = x.StallNameEn, description_EN = x.DescriptionEn,
        stallName_JA = x.StallNameJa, description_JA = x.DescriptionJa,
        stallName_KO = x.StallNameKo, description_KO = x.DescriptionKo,
        stallName_ZH = x.StallNameZh, description_ZH = x.DescriptionZh,
        x.Slug, x.Description, coverUrl = x.CoverUrl, imageUrl = x.CoverUrl, x.Latitude, x.Longitude,
        activationRadius = x.TriggerRadius, tourId = x.FestivalZoneId, products = x.Products.Select(p => new { id = p.Id.ToString(), name = p.ProductName, p.Price }) })
      .SingleOrDefaultAsync();
    return poi is null ? NotFound(ApiResponseFactory.Fail("poi.not_found")) : Ok(ApiResponseFactory.Ok(poi));
  }

  [HttpPost("tickets")]
  public async Task<IActionResult> Ticket([FromBody] TicketRequest request)
  {
    var ticket = new SystemTicket { UserId = null, SenderType = "GUEST",
      SenderEmail = request.Email.Trim(), Subject = request.Subject.Trim(),
      Message = request.Message.Trim(), Status = TicketStatus.PENDING, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
    db.SystemTickets.Add(ticket); await db.SaveChangesAsync();

    try
    {
      await hubContext.Clients.All.SendAsync("ReceiveNotification", new
      {
        type = "TICKET_NEW",
        title = "Hỗ trợ khách hàng",
        message = $"Ticket mới từ {ticket.SenderEmail}: {ticket.Subject}"
      });
    }
    catch (Exception ex)
    {
      System.Console.WriteLine($"SignalR push error: {ex.Message}");
    }
    
    return Ok(ApiResponseFactory.Ok(new { id = ticket.Id, status = ticket.Status.ToString() }));
  }

  private static string SupportedLanguage(string lang) =>
    new[] { "vi", "en", "ja", "ko", "zh" }.Contains(lang) ? lang : "vi";

  private static double HaversineMeters(double lat1, double lng1, double lat2, double lng2)
  {
    const double earthRadius = 6_371_000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.Pow(Math.Sin(dLat / 2), 2) +
      Math.Cos(lat1 * Math.PI / 180) *
      Math.Cos(lat2 * Math.PI / 180) *
      Math.Pow(Math.Sin(dLng / 2), 2);
    return earthRadius * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
  }

  [HttpPost("pois/{id}/track")]
  public async Task<IActionResult> TrackPoi(string id, [FromQuery] string action)
  {
    if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(action))
      return BadRequest(ApiResponseFactory.Fail("POI ID and action are required."));

    var poi = await db.Pois.FirstOrDefaultAsync(p => p.Id == id || p.Slug == id);
    if (poi == null)
      return NotFound(ApiResponseFactory.Fail("POI not found."));

    var normalizedAction = action.ToLowerInvariant();
    if (normalizedAction == "visit")
    {
      poi.TotalVisits++;
    }
    else if (normalizedAction == "listen")
    {
      poi.TotalListens++;
    }
    else
    {
      return BadRequest(ApiResponseFactory.Fail("Invalid action. Must be 'visit' or 'listen'."));
    }

    poi.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { visits = poi.TotalVisits, listens = poi.TotalListens }));
  }
}

public sealed record TicketRequest(string Email, string Subject, string Message);
public sealed record FavoriteOperation(
  [property: JsonPropertyName("stallId")] string StallId,
  [property: JsonPropertyName("action")] string Action
);
public sealed record FavoriteSyncRequest(
  [property: JsonPropertyName("guestId")] string GuestId,
  [property: JsonPropertyName("ops")] FavoriteOperation[] Ops
);
public sealed record AddFavoriteRequest(
  [property: JsonPropertyName("guestId")] string GuestId,
  [property: JsonPropertyName("poiId")] string PoiId
);

