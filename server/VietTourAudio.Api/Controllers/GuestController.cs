using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;
using System.Net.Http;
using System.Text.Json;
using System.Linq;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/guest")]
public sealed class GuestController(AppDbContext db, IHttpClientFactory clients, Microsoft.AspNetCore.Hosting.IWebHostEnvironment env, Microsoft.AspNetCore.SignalR.IHubContext<VietTourAudio.Api.Hubs.NotificationHub> hubContext) : ControllerBase
{
  [HttpGet("zones")]
  [HttpGet("tours")]
  public async Task<IActionResult> Zones()
  {
    var publicStalls = await db.Database.SqlQuery<ulong>(
      $"SELECT id AS Value FROM stalls WHERE status='APPROVED' AND billing_suspended=0").ToListAsync();
    
    var zones = await db.FestivalZones
      .Include(z => z.Pois)
      .ThenInclude(p => p.Products)
      .AsNoTracking()
      .Where(x => x.Status == "PUBLISHED")
      .OrderBy(x => x.SortOrder).ThenBy(x => x.Id)
      .ToListAsync();

    var result = zones.Select(x => new
    {
      id = x.Id,
      x.Name,
      x.Slug,
      x.Description,
      coverImage = x.CoverImageUrl,
      latitude = x.Latitude,
      longitude = x.Longitude,
      pois = x.Pois.Where(p => p.Status == "ACTIVE" && p.ApprovalStatus == ApprovalStatus.APPROVED && publicStalls.Contains(p.StallId))
        .Select(p => new { id = p.Id, p.Name, title = p.Name, p.Slug, p.Description,
          p.Latitude, p.Longitude, activationRadius = p.ActivationRadius, stallId = p.StallId })
    });

    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpGet("pois")]
  public async Task<IActionResult> PoisByZone([FromQuery(Name = "zone_code")] string zoneCode, [FromQuery] string lang = "vi")
  {
    if (string.IsNullOrWhiteSpace(zoneCode)) return BadRequest(ApiResponseFactory.Fail("error.zone_code_required"));
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(z.id AS CHAR) id,COALESCE(pc.title,z.name) name,z.slug,
        COALESCE(pc.tts_script,z.description) description,z.latitude,z.longitude,
        z.activation_radius activationRadius,z.is_premium_content isPremiumContent,
        CAST(z.stall_id AS CHAR) stallId,s.name stallName,pc.audio_url audioUrl,
        CAST(z.tour_id AS CHAR) tourId, t.slug tourSlug
      FROM zones z 
      JOIN stalls s ON s.id=z.stall_id
      JOIN tours t ON t.id=z.tour_id
      LEFT JOIN poi_contents pc ON pc.poi_id=z.id AND pc.lang=@lang AND pc.approval_status='approved'
      WHERE (s.zone_code=@code OR s.slug=@code) AND s.status='APPROVED' AND s.billing_suspended=0
        AND z.status='ACTIVE' AND z.approval_status='APPROVED' ORDER BY z.sort_order,z.id
      """, new Dictionary<string, object?> { ["@code"] = zoneCode.Trim(), ["@lang"] = SupportedLanguage(lang) });
    return Ok(ApiResponseFactory.Ok(rows));
  }

  [HttpGet("favorites/{guestId}")]
  public async Task<IActionResult> Favorites(string guestId)
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT DISTINCT CAST(p.stall_id AS CHAR) stallId FROM favorites f
      JOIN pois p ON p.id=f.poi_id WHERE f.guest_id=@guestId
      """, new Dictionary<string, object?> { ["@guestId"] = guestId });
    return Ok(ApiResponseFactory.Ok(new { favorites = rows.Select(x => x["stallId"]).ToArray() }));
  }

  [HttpPost("favorites/sync")]
  public async Task<IActionResult> SyncFavorites([FromBody] FavoriteSyncRequest request)
  {
    foreach (var operation in request.Ops)
    {
      if (operation.Action == "add")
        await DatabaseSql.ExecuteAsync(db, """
          INSERT INTO favorites(guest_id,poi_id)
          SELECT @guestId,id FROM pois WHERE stall_id=@stallId ORDER BY id LIMIT 1
          ON DUPLICATE KEY UPDATE added_at=NOW()
          """, new Dictionary<string, object?> { ["@guestId"] = request.GuestId, ["@stallId"] = operation.StallId });
      else if (operation.Action == "remove")
        await DatabaseSql.ExecuteAsync(db, """
          DELETE f FROM favorites f JOIN pois p ON p.id=f.poi_id WHERE f.guest_id=@guestId AND p.stall_id=@stallId
          """, new Dictionary<string, object?> { ["@guestId"] = request.GuestId, ["@stallId"] = operation.StallId });
    }
    return await Favorites(request.GuestId);
  }

  [HttpGet("tours/{id:long}/unlocked-status")]
  public async Task<IActionResult> Unlocked(ulong id, [FromQuery] string guestId = "")
  {
    var tour = (await DatabaseSql.QueryRowsAsync(db,
      "SELECT is_premium isPremium,price FROM tours WHERE id=@id",
      new Dictionary<string, object?> { ["@id"] = id })).SingleOrDefault();
    if (tour is null) return NotFound(ApiResponseFactory.Fail("tour.not_found"));
    var premium = Convert.ToBoolean(tour["isPremium"]); var price = Convert.ToDecimal(tour["price"]);
    if (!premium || price == 0) return Ok(ApiResponseFactory.Ok(new { unlocked = true, price = 0m }));
    var unlocked = !string.IsNullOrWhiteSpace(guestId) && (await DatabaseSql.QueryRowsAsync(db,
      "SELECT id FROM unlocked_tours WHERE guest_id=@guestId AND tour_id=@id LIMIT 1",
      new Dictionary<string, object?> { ["@guestId"] = guestId, ["@id"] = id })).Count > 0;
    return Ok(ApiResponseFactory.Ok(new { unlocked, price }));
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

      // Secure logging of request coordinates in Dev mode
      if (env.EnvironmentName == "Development")
      {
          System.Console.WriteLine($"[Routing API] Query started: ({startLat}, {startLng}) -> ({endLat}, {endLng})");
      }

      var client = clients.CreateClient();
      // Ensure we pass a realistic User-Agent header because public APIs filter out anonymous .NET HttpClient requests
      client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 VietTourAudio/1.0");

      var startLngStr = startLng.ToString(System.Globalization.CultureInfo.InvariantCulture);
      var startLatStr = startLat.ToString(System.Globalization.CultureInfo.InvariantCulture);
      var endLngStr = endLng.ToString(System.Globalization.CultureInfo.InvariantCulture);
      var endLatStr = endLat.ToString(System.Globalization.CultureInfo.InvariantCulture);

      // 1. Try OpenRouteService first
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

      // 2. Fallback to OSRM
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

  [HttpGet("pois/{id:long}")]
  public async Task<IActionResult> Poi(ulong id)
  {
    var poi = await db.Pois.AsNoTracking().Where(x => x.Id == id && x.Status == "ACTIVE" && x.ApprovalStatus == ApprovalStatus.APPROVED)
      .Select(x => new { id = x.Id.ToString(), x.Name, x.Slug, x.Description, x.Latitude, x.Longitude,
        activationRadius = x.ActivationRadius, tourId = x.TourId.ToString(), products = x.Products.Select(p => new { id = p.Id.ToString(), p.Name, p.Price }) })
      .SingleOrDefaultAsync();
    return poi is null ? NotFound(ApiResponseFactory.Fail("poi.not_found")) : Ok(ApiResponseFactory.Ok(poi));
  }

  [HttpPost("tickets")]
  public async Task<IActionResult> Ticket([FromBody] TicketRequest request)
  {
    var ticket = new SystemTicket { SenderEmail = request.Email.Trim(), Subject = request.Subject.Trim(),
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
    
    return Ok(ApiResponseFactory.Ok(new { id = ticket.Id.ToString(), status = ticket.Status.ToString() }));
  }

  private static string SupportedLanguage(string lang) =>
    new[] { "vi", "en", "ja", "ko", "zh" }.Contains(lang) ? lang : "vi";
}

public sealed record TicketRequest(string Email, string Subject, string Message);
public sealed record FavoriteOperation(ulong StallId, string Action);
public sealed record FavoriteSyncRequest(string GuestId, FavoriteOperation[] Ops);
