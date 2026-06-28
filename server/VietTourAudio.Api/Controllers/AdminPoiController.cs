using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
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
  IHttpClientFactory clients,
  IHubContext<NotificationHub> hubContext) : ControllerBase
{
  [HttpGet]
  public async Task<IActionResult> List()
  {
    var pois = await db.Pois.AsNoTracking().OrderBy(x => x.Id)
      .Select(x => new { id = x.Id.ToString(), stallId = x.StallId.ToString(), tourId = x.TourId.ToString(),
        x.Name, x.Slug, x.Description, x.Latitude, x.Longitude, activationRadius = x.ActivationRadius,
        x.Status, approvalStatus = x.ApprovalStatus.ToString() }).ToListAsync();

    var transRows = await DatabaseSql.QueryRowsAsync(db, "SELECT CAST(poi_id AS CHAR) poiId, lang, title, tts_script ttsScript, approval_status approvalStatus FROM poi_contents");
    var transGrouped = transRows.GroupBy(r => r["poiId"]!.ToString()!)
      .ToDictionary(g => g.Key, g => g.Select(r => (object)new { lang = r["lang"]!.ToString(), title = r["title"]?.ToString() ?? "", ttsScript = r["ttsScript"]?.ToString() ?? "", approvalStatus = r["approvalStatus"]?.ToString() ?? "pending" }).ToList());

    var result = pois.Select(p => new {
      p.id,
      p.stallId,
      p.tourId,
      p.Name,
      p.Slug,
      p.Description,
      p.Latitude,
      p.Longitude,
      p.activationRadius,
      p.Status,
      p.approvalStatus,
      translations = transGrouped.TryGetValue(p.id, out var trs) ? trs : new List<object>()
    }).ToList();

    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpGet("stalls")]
  public async Task<IActionResult> Stalls()
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(s.id AS CHAR) id, CAST(s.vendor_id AS CHAR) vendorId, s.name, s.slug, s.status, s.latitude, s.longitude,
             s.activation_radius AS activationRadius, v.trade_name AS vendorBusinessName
      FROM stalls s
      JOIN vendors v ON v.id = s.vendor_id
      ORDER BY s.name
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
    "SELECT CAST(id AS CHAR) id,name,slug,status FROM tours WHERE status!='ARCHIVED' ORDER BY name")));

  [HttpGet("distance")]
  public async Task<IActionResult> Distance([FromQuery(Name = "poi1_id")] ulong first, [FromQuery(Name = "poi2_id")] ulong second)
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT 6371000*2*ASIN(SQRT(POWER(SIN(RADIANS(b.latitude-a.latitude)/2),2)+
        COS(RADIANS(a.latitude))*COS(RADIANS(b.latitude))*POWER(SIN(RADIANS(b.longitude-a.longitude)/2),2))) distanceMeters
      FROM zones a JOIN zones b ON b.id=@second WHERE a.id=@first
      """, new Dictionary<string, object?> { ["@first"] = first, ["@second"] = second });
    return rows.Count == 0 ? NotFound(ApiResponseFactory.Fail("poi.not_found")) : Ok(ApiResponseFactory.Ok(rows[0]));
  }

  [HttpPost]
  public async Task<IActionResult> Create([FromBody] JsonElement body)
  {
    var name = body.GetProperty("name").GetString()?.Trim() ?? throw new ArgumentException("poi.name_required");
    var slug = body.TryGetProperty("slug", out var slugValue) && !string.IsNullOrWhiteSpace(slugValue.GetString())
      ? slugValue.GetString()! : Slugify(name);
    var tourId = ulong.Parse(body.GetProperty("tourId").ToString());
    var stallId = ulong.Parse(body.GetProperty("stallId").ToString());
    var latitude = body.GetProperty("latitude").GetDecimal();
    var longitude = body.GetProperty("longitude").GetDecimal();
    var radius = body.TryGetProperty("activationRadius", out var radiusValue) ? radiusValue.GetInt32() : 25;
    var status = body.TryGetProperty("status", out var statusValue) ? statusValue.GetString() ?? "ACTIVE" : "ACTIVE";
    var description = body.TryGetProperty("description", out var descriptionValue) && descriptionValue.ValueKind != JsonValueKind.Null
      ? descriptionValue.GetString() : null;
    var premium = body.TryGetProperty("isPremiumContent", out var premiumValue) && premiumValue.GetBoolean();

    if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
      return BadRequest(ApiResponseFactory.Fail("poi.invalid_coordinates"));
    if (!await db.FestivalZones.AsNoTracking().AnyAsync(tour => tour.Id == tourId))
      return BadRequest(ApiResponseFactory.Fail("zone.not_found"));
    var stallRows = await DatabaseSql.QueryRowsAsync(db,
      "SELECT vendor_id vendorId FROM stalls WHERE id=@id LIMIT 1",
      new Dictionary<string, object?> { ["@id"] = stallId });
    if (stallRows.Count == 0) return BadRequest(ApiResponseFactory.Fail("stall.not_found"));
    if (await db.Pois.AsNoTracking().AnyAsync(poi => poi.StallId == stallId && poi.Slug == slug))
      return Conflict(ApiResponseFactory.Fail("poi.slug_exists"));

    var entity = new Poi
    {
      TourId = tourId,
      StallId = stallId,
      VendorId = Convert.ToUInt64(stallRows[0]["vendorId"]),
      Name = name,
      Slug = slug,
      Description = description,
      Latitude = latitude,
      Longitude = longitude,
      ActivationRadius = radius,
      IsPremiumContent = premium,
      Status = status,
      ApprovalStatus = ApprovalStatus.APPROVED,
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };
    db.Pois.Add(entity);
    var created = await db.SaveChangesAsync();
    if (created == 0)
      return StatusCode(500, ApiResponseFactory.Fail("poi.create_failed"));
    var poiId = entity.Id;

    var translationsList = ParseTranslations(body);
    await SavePoiTranslationsAsync(poiId, name, description ?? "", translationsList);

    return Ok(ApiResponseFactory.Ok(new { id = poiId.ToString(), name, slug }));
  }

  [HttpPut("{id:long}")]
  public async Task<IActionResult> Update(ulong id, [FromBody] JsonElement body)
  {
    var name = body.GetProperty("name").GetString()?.Trim() ?? throw new ArgumentException("poi.name_required");
    var description = body.TryGetProperty("description", out var desc) && desc.ValueKind != JsonValueKind.Null ? desc.GetString() : null;

    var updated = await DatabaseSql.ExecuteAsync(db, """
      UPDATE zones SET tour_id=@tour,stall_id=@stall,name=@name,slug=@slug,description=@description,
        latitude=@lat,longitude=@lng,activation_radius=@radius,is_premium_content=@premium,status=@status
      WHERE id=@id
      """, new Dictionary<string, object?> {
        ["@id"] = id, ["@tour"] = ulong.Parse(body.GetProperty("tourId").ToString()),
        ["@stall"] = ulong.Parse(body.GetProperty("stallId").ToString()), ["@name"] = name,
        ["@slug"] = body.TryGetProperty("slug", out var slugValue) ? slugValue.GetString() : Slugify(name),
        ["@description"] = description,
        ["@lat"] = body.GetProperty("latitude").GetDecimal(), ["@lng"] = body.GetProperty("longitude").GetDecimal(),
        ["@radius"] = body.GetProperty("activationRadius").GetInt32(),
        ["@premium"] = body.GetProperty("isPremiumContent").GetBoolean(), ["@status"] = body.GetProperty("status").GetString()
      });
    if (updated == 0)
      return NotFound(ApiResponseFactory.Fail("poi.not_found"));

    var translationsList = ParseTranslations(body);
    await SavePoiTranslationsAsync(id, name, description ?? "", translationsList);

    return Ok(ApiResponseFactory.Ok(new { id = id.ToString(), name }));
  }

  private List<TranslationDto> ParseTranslations(JsonElement body)
  {
    var translationsList = new List<TranslationDto>();
    if (body.TryGetProperty("translations", out var transElem) && transElem.ValueKind == JsonValueKind.Array)
    {
      foreach (var item in transElem.EnumerateArray())
      {
        var lang = item.GetProperty("lang").GetString()!;
        var title = item.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "" : "";
        var ttsScript = item.TryGetProperty("ttsScript", out var tsEl) ? tsEl.GetString() ?? "" : "";
        translationsList.Add(new TranslationDto(lang, title, ttsScript));
      }
    }
    return translationsList;
  }

  private async Task SavePoiTranslationsAsync(ulong poiId, string viName, string viDesc, List<TranslationDto> submittedTranslations)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    var existingRows = await DatabaseSql.QueryRowsAsync(db, 
      "SELECT lang, title, tts_script ttsScript FROM poi_contents WHERE poi_id = @poiId",
      new Dictionary<string, object?> { ["@poiId"] = poiId });
    var existingMap = existingRows.ToDictionary(
      r => r["lang"]!.ToString()!, 
      r => new { Title = r["title"]?.ToString() ?? "", Desc = r["ttsScript"]?.ToString() ?? "" }
    );

    existingMap.TryGetValue("vi", out var oldVi);
    var viChanged = oldVi == null || oldVi.Title != viName || oldVi.Desc != viDesc;

    var langs = new[] { "vi", "en", "ja", "ko", "zh" };
    foreach (var lang in langs)
    {
      var sub = submittedTranslations.FirstOrDefault(t => t.Lang == lang);
      var subTitle = sub?.Title?.Trim() ?? "";
      var subTts = sub?.TtsScript?.Trim() ?? "";

      if (lang == "vi")
      {
        await SaveTranslationRowAsync(connection, poiId, "vi", viName, viDesc, "approved");
        continue;
      }

      existingMap.TryGetValue(lang, out var oldLang);

      var shouldTranslate = oldLang == null || 
                            (string.IsNullOrEmpty(subTitle) && string.IsNullOrEmpty(subTts)) ||
                            (viChanged && (oldLang.Title == subTitle && oldLang.Desc == subTts));

      if (shouldTranslate)
      {
        var transTitle = await TranslateTextAsync(viName, lang);
        var transDesc = await TranslateTextAsync(viDesc, lang);
        if (!string.IsNullOrWhiteSpace(transTitle) || !string.IsNullOrWhiteSpace(transDesc))
        {
          await SaveTranslationRowAsync(connection, poiId, lang, transTitle, transDesc, "approved");
        }
      }
      else
      {
        await SaveTranslationRowAsync(connection, poiId, lang, subTitle, subTts, "approved");
      }
    }
  }

  private async Task SaveTranslationRowAsync(System.Data.Common.DbConnection connection, ulong poiId, string lang, string title, string script, string approvalStatus)
  {
    await using var command = connection.CreateCommand();
    command.CommandText = """
      INSERT INTO poi_contents (poi_id, lang, title, tts_script, audio_url, voice_profile, approval_status)
      VALUES (@poiId, @lang, @title, @script, @audioUrl, @voiceProfile, @approvalStatus)
      ON DUPLICATE KEY UPDATE title = VALUES(title), tts_script = VALUES(tts_script),
        audio_url = VALUES(audio_url), voice_profile = VALUES(voice_profile), approval_status = VALUES(approval_status)
      """;
    command.AddParameter("@poiId", poiId);
    command.AddParameter("@lang", lang);
    command.AddParameter("@title", title);
    command.AddParameter("@script", script);
    command.AddParameter("@audioUrl", DBNull.Value);
    command.AddParameter("@voiceProfile", "BROWSER_TTS");
    command.AddParameter("@approvalStatus", approvalStatus);
    var rows = await command.ExecuteNonQueryAsync();
    if (rows == 0)
      throw new InvalidOperationException("poi.translation_failed");
  }

  private async Task<string> TranslateTextAsync(string text, string targetLang)
  {
    if (string.IsNullOrWhiteSpace(text)) return "";
    try
    {
      var client = clients.CreateClient();
      var url = $"https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl={Uri.EscapeDataString(targetLang)}&dt=t&q={Uri.EscapeDataString(text)}";
      using var response = await client.GetAsync(url);
      if (!response.IsSuccessStatusCode) return "";
      using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
      return string.Concat(document.RootElement[0].EnumerateArray()
        .Select(item => item[0].ValueKind == JsonValueKind.String ? item[0].GetString() : ""));
    }
    catch
    {
      return "";
    }
  }

  private sealed record TranslationDto(string Lang, string Title, string TtsScript);

  [HttpDelete("{id:long}")]
  public async Task<IActionResult> Delete(ulong id)
  {
    var count = await DatabaseSql.ExecuteAsync(db, "UPDATE zones SET status='ARCHIVED' WHERE id=@id",
      new Dictionary<string, object?> { ["@id"] = id });
    return count == 0 ? NotFound(ApiResponseFactory.Fail("poi.not_found")) : Ok(ApiResponseFactory.Ok(true));
  }

  [HttpPost("tours/{id:long}/qr/reset")]
  public async Task<IActionResult> ResetTourQr(ulong id)
  {
    var code = $"TOUR-{id}-{Guid.NewGuid():N}".ToUpperInvariant();
    await DatabaseSql.ExecuteAsync(db, """
      UPDATE qr_codes SET is_active=0 WHERE tour_id=@id AND qr_type='TOUR';
      INSERT INTO qr_codes(vendor_id,tour_id,code,qr_type,target_url,is_active)
      SELECT vendor_id,id,@code,'TOUR',CONCAT('/tours/',slug),1 FROM tours WHERE id=@id
      """, new Dictionary<string, object?> { ["@id"] = id, ["@code"] = code });
    return Ok(ApiResponseFactory.Ok(new { id = id.ToString(), code }));
  }

  [HttpGet("approvals")]
  public async Task<IActionResult> Approvals()
  {
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT CONCAT('stall-',s.id) id,s.name,s.pending_name,s.pending_description,s.pending_cover_image_url,
        s.pending_latitude,s.pending_longitude,v.trade_name vendor_name,'STALL' entity_type
      FROM stalls s JOIN vendors v ON v.id=s.vendor_id WHERE s.approval_status='PENDING'
      UNION ALL
      SELECT CAST(z.id AS CHAR),z.name,z.pending_name,z.pending_description,z.pending_cover_image_url,
        z.pending_latitude,z.pending_longitude,v.trade_name,'POI'
      FROM zones z JOIN stalls s ON s.id=z.stall_id JOIN vendors v ON v.id=s.vendor_id
      WHERE z.approval_status='PENDING'
      """;
    var result = new List<object>();
    await using var reader = await command.ExecuteReaderAsync();
    while (await reader.ReadAsync()) result.Add(new { id = reader.GetString(0), name = reader.GetString(1),
      pendingName = reader.NullableString("pending_name"), pendingDescription = reader.NullableString("pending_description"),
      pendingCoverImageUrl = reader.NullableString("pending_cover_image_url"),
      pendingLatitude = reader.IsDBNull(5) ? null : (decimal?)reader.GetDecimal(5),
      pendingLongitude = reader.IsDBNull(6) ? null : (decimal?)reader.GetDecimal(6),
      vendorName = reader.GetString(7), entityType = reader.GetString(8), approvalStatus = "PENDING" });
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
    var isStall = id.StartsWith("stall-");
    var numericId = ulong.Parse(isStall ? id[6..] : id);
    var table = isStall ? "stalls" : "zones";
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    var mediaModeration = isStall
      ? approve
        ? """
          UPDATE media_files m JOIN stalls s ON s.id=m.stall_id
          SET m.moderation_status='APPROVED',m.moderated_at=NOW()
          WHERE s.id=@id AND m.file_name=s.pending_cover_image_url AND m.moderation_status='PENDING';
          """
        : """
          UPDATE media_files m JOIN stalls s ON s.id=m.stall_id
          SET m.moderation_status='REJECTED',m.moderated_at=NOW(),m.rejection_reason='stall_update_rejected'
          WHERE s.id=@id AND m.file_name=s.pending_cover_image_url AND m.moderation_status='PENDING';
          """
      : "";
    command.CommandText = mediaModeration + (approve
      ? $"""
        UPDATE {table} SET name=COALESCE(pending_name,name),description=COALESCE(pending_description,description),
          latitude=COALESCE(pending_latitude,latitude),longitude=COALESCE(pending_longitude,longitude),
          pending_name=NULL,pending_description=NULL,pending_cover_image_url=NULL,pending_latitude=NULL,pending_longitude=NULL,
          approval_status='APPROVED',status={(
            isStall ? "'APPROVED'" : "status"
          )},updated_at=NOW() WHERE id=@id
        """
      : $"""
        UPDATE {table} SET pending_name=NULL,pending_description=NULL,pending_cover_image_url=NULL,
          pending_latitude=NULL,pending_longitude=NULL,approval_status='REJECTED',updated_at=NOW() WHERE id=@id
        """);
    command.AddParameter("@id", numericId);
    var rows = await command.ExecuteNonQueryAsync();
    if (rows == 0)
      return NotFound(ApiResponseFactory.Fail("poi.not_found"));
    if (isStall)
      await hubContext.Clients.All.SendAsync(
        "StallStatusUpdated",
        numericId.ToString(),
        approve ? "APPROVED" : "REJECTED");
    return Ok(ApiResponseFactory.Ok(new { id, approved = approve }));
  }

  private static string Slugify(string value) => StringHelpers.Slugify(value);
}
