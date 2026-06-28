using System.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Infrastructure;
using System.Globalization;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/vendor")]
[Authorize(Roles = "VENDOR")]
public sealed class VendorController(AppDbContext db, IWebHostEnvironment environment, Microsoft.AspNetCore.SignalR.IHubContext<VietTourAudio.Api.Hubs.NotificationHub> hubContext, System.Net.Http.IHttpClientFactory clients) : ControllerBase
{
  private ulong VendorId => ulong.Parse(User.FindFirstValue("vendor_id") ?? throw new UnauthorizedAccessException());

  [HttpGet("profile")]
  public async Task<IActionResult> Profile()
  {
    var vendor = await db.Vendors.AsNoTracking().SingleAsync(x => x.Id == VendorId);
    return Ok(ApiResponseFactory.Ok(new
    {
      id = vendor.Id.ToString(), businessName = vendor.TradeName, vendorCode = vendor.VendorCode,
      ownerEmail = vendor.ContactEmail, verificationStatus = vendor.Status,
      assignedTourId = vendor.FestivalZoneId?.ToString()
    }));
  }

  [HttpPost("translate")]
  public async Task<IActionResult> Translate([FromBody] VendorTranslationRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Text) || request.TargetLangs.Length == 0)
      return BadRequest(ApiResponseFactory.Fail("translation.invalid"));
    var supported = new HashSet<string>(["vi", "en", "ja", "ko", "zh"]);
    var result = new Dictionary<string, string>();
    var client = clients.CreateClient();
    foreach (var language in request.TargetLangs.Distinct())
    {
      if (!supported.Contains(language)) continue;
      var url = $"https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl={Uri.EscapeDataString(language)}&dt=t&q={Uri.EscapeDataString(request.Text)}";
      using var response = await client.GetAsync(url);
      if (!response.IsSuccessStatusCode) { result[language] = ""; continue; }
      using var document = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
      result[language] = string.Concat(document.RootElement[0].EnumerateArray()
        .Select(item => item[0].ValueKind == System.Text.Json.JsonValueKind.String ? item[0].GetString() : ""));
    }
    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpGet("dashboard")]
  public async Task<IActionResult> Dashboard()
  {
    var vendor = await db.Vendors.AsNoTracking().SingleAsync(x => x.Id == VendorId);
    var wallet = await db.Wallets.AsNoTracking().SingleAsync(x => x.VendorId == VendorId);
    var stallId = await PrimaryStallIdAsync();
    var totalPois = await db.Pois.CountAsync(x => x.StallId == stallId);
    var metrics = (await DatabaseSql.QueryRowsAsync(db, """
      SELECT COALESCE(SUM(qr_scans),0) totalQrScans,COALESCE(SUM(visits),0) totalVisits,
        COALESCE(SUM(audio_plays),0) totalAudioPlays,COALESCE(SUM(unique_visitors),0) totalUniqueVisitors,
        COALESCE(SUM(premium_conversions),0) totalPremiumConversions,COALESCE(SUM(total_revenue),0) totalRevenue
      FROM analytics_daily_stall WHERE vendor_id=@vendorId
      """, new Dictionary<string, object?> { ["@vendorId"] = VendorId })).Single();
    metrics["totalPois"] = totalPois;
    var daily = await DatabaseSql.QueryRowsAsync(db, """
      SELECT date,qr_scans qrScans,visits,audio_plays audioPlays,unique_visitors uniqueVisitors,
        premium_conversions premiumConversions,total_revenue totalRevenue
      FROM analytics_daily_stall WHERE vendor_id=@vendorId ORDER BY date DESC LIMIT 30
      """, new Dictionary<string, object?> { ["@vendorId"] = VendorId });
    var topPois = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(z.id AS CHAR) id,z.name,COUNT(DISTINCT ph.id) audioPlays,COUNT(DISTINCT ve.id) visits
      FROM zones z LEFT JOIN play_history ph ON ph.poi_id=z.id LEFT JOIN visit_events ve ON ve.poi_id=z.id
      WHERE z.stall_id=@stallId GROUP BY z.id,z.name ORDER BY audioPlays DESC,visits DESC LIMIT 10
      """, new Dictionary<string, object?> { ["@stallId"] = stallId });
    return Ok(ApiResponseFactory.Ok(new
    {
      vendor = new { id = vendor.Id.ToString(), businessName = vendor.TradeName, ownerEmail = vendor.ContactEmail,
        status = vendor.Status, walletBalance = wallet.Balance },
      metrics, daily, topPois
    }));
  }

  [HttpGet("pois")]
  public async Task<IActionResult> Pois()
  {
    var stallId = await PrimaryStallIdAsync();
    var rows = await db.Pois.AsNoTracking().Where(x => x.StallId == stallId).OrderBy(x => x.Id)
      .Select(x => new { id = x.Id.ToString(), x.Name, x.Slug, x.Description, x.Status,
        isPremiumContent = false, approvalStatus = x.ApprovalStatus.ToString(),
        pendingName = (string?)null, pendingDescription = (string?)null, pendingCoverImageUrl = (string?)null,
        languageCount = 0, audioPlays = 0 }).ToListAsync();
    return Ok(ApiResponseFactory.Ok(new { pois = rows }));
  }

  [HttpGet("revenue")]
  public async Task<IActionResult> Revenue()
  {
    var wallet = await db.Wallets.AsNoTracking().SingleAsync(x => x.VendorId == VendorId);
    var transactions = await db.WalletTransactions.AsNoTracking().Where(x => x.VendorId == VendorId)
      .OrderByDescending(x => x.CreatedAt).Take(50)
      .Select(x => new { id = x.Id.ToString(), type = x.TransactionType, category = x.TransactionCategory,
        direction = x.Direction, x.Amount, balanceBefore = x.BalanceBefore, balanceAfter = x.BalanceAfter,
        x.Description, createdAt = x.CreatedAt }).ToListAsync();
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT vs.status,vs.next_billing_date,sp.price premium_price,
        EXISTS(SELECT 1 FROM stalls WHERE vendor_id=@vendorId AND is_premium=1) is_premium
      FROM vendor_subscriptions vs
      LEFT JOIN subscription_plans sp ON sp.code='PREMIUM_MONTHLY'
      WHERE vs.vendor_id=@vendorId ORDER BY vs.id DESC LIMIT 1
      """;
    command.AddParameter("@vendorId", VendorId);
    await using var reader = await command.ExecuteReaderAsync();
    await reader.ReadAsync();

    var topUps = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(id AS CHAR) id,amount,provider,status,proof_url proofImageUrl,note rejectReason,created_at createdAt
      FROM top_up_requests WHERE vendor_id=@vendorId ORDER BY created_at DESC
      """, new Dictionary<string, object?> { ["@vendorId"] = VendorId });

    return Ok(ApiResponseFactory.Ok(new
    {
      summary = new { wallet.Balance, wallet.TotalTopUp, wallet.TotalSpent, totalCommission = 0,
        pendingCommission = 0, approvedCommission = 0, isPremium = reader.Boolean("is_premium"),
        premiumPrice = reader.Decimal("premium_price"), nextBillingDate = reader.GetValue(reader.GetOrdinal("next_billing_date")),
        subscriptionStatus = reader.GetString(reader.GetOrdinal("status")) },
      transactions, topUps, commissions = Array.Empty<object>(), timeline = Array.Empty<object>()
    }));
  }

  [HttpGet("content")]
  public async Task<IActionResult> Content()
  {
    var stallId = await PrimaryStallIdAsync();
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT pc.*,z.name poi_name FROM poi_contents pc JOIN zones z ON z.id=pc.poi_id
      WHERE z.stall_id=@stallId ORDER BY pc.updated_at DESC
      """;
    command.AddParameter("@stallId", stallId);
    var rows = new List<object>();
    await using var reader = await command.ExecuteReaderAsync();
    while (await reader.ReadAsync()) rows.Add(new { id = reader.UInt64("id").ToString(),
      poiId = reader.UInt64("poi_id").ToString(), poiName = reader.GetString(reader.GetOrdinal("poi_name")),
      language = reader.GetString(reader.GetOrdinal("lang")), title = reader.GetString(reader.GetOrdinal("title")),
      ttsScript = reader.GetString(reader.GetOrdinal("tts_script")),
      approvalStatus = reader.GetString(reader.GetOrdinal("approval_status")), updatedAt = reader.GetValue(reader.GetOrdinal("updated_at")) });
    return Ok(ApiResponseFactory.Ok(new { contents = rows }));
  }

  [HttpPost("content")]
  public async Task<IActionResult> SubmitContent([FromBody] VendorContentRequest request)
  {
    var stallId = await PrimaryStallIdAsync();
    var poiId = await db.Pois.Where(x => x.StallId == stallId).OrderBy(x => x.Id).Select(x => x.Id).FirstAsync();
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      INSERT INTO poi_contents(poi_id,lang,title,tts_script,approval_status)
      VALUES(@poiId,@lang,@title,@script,'pending')
      ON DUPLICATE KEY UPDATE tts_script=VALUES(tts_script),approval_status='pending',updated_at=NOW()
      """;
    command.AddParameter("@poiId", poiId); command.AddParameter("@lang", request.Language);
    command.AddParameter("@title", $"TTS Content - {request.Language}"); command.AddParameter("@script", request.TtsScript.Trim());
    await command.ExecuteNonQueryAsync();
    return Ok(ApiResponseFactory.Ok(new { submitted = true, approvalStatus = "pending" }));
  }

  [HttpGet("stall/qr")]
  public async Task<IActionResult> StallQr()
  {
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = "SELECT zone_code FROM stalls WHERE vendor_id=@vendorId ORDER BY id LIMIT 1";
    command.AddParameter("@vendorId", VendorId);
    return Ok(ApiResponseFactory.Ok(new { zoneCode = (await command.ExecuteScalarAsync())?.ToString() }));
  }

  [HttpGet("pois/{poiId:long}/products")]
  public async Task<IActionResult> PoiProducts(ulong poiId)
  {
    await EnsureOwnedPoiAsync(poiId);
    var products = await db.PoiProducts.AsNoTracking().Where(x => x.PoiId == poiId)
      .Select(x => new { id = x.Id.ToString(), x.Name, x.Price }).ToListAsync();
    return Ok(ApiResponseFactory.Ok(new { products }));
  }

  [HttpPut("pois/{poiId:long}")]
  public async Task<IActionResult> UpdatePoi(ulong poiId, [FromBody] PoiUpdateRequest request)
  {
    await EnsureOwnedPoiAsync(poiId);
    await QueuePoiUpdate(poiId, request);
    return Ok(ApiResponseFactory.Ok(new { id = poiId.ToString(), submitted = true, approvalStatus = "PENDING" }));
  }

  [HttpPost("poi/request-update")]
  public async Task<IActionResult> RequestPoiUpdate([FromBody] PoiUpdateRequest request)
  {
    if (!request.PoiId.HasValue) return BadRequest(ApiResponseFactory.Fail("poi.id_required"));
    await EnsureOwnedPoiAsync(request.PoiId.Value);
    await QueuePoiUpdate(request.PoiId.Value, request);
    return Ok(ApiResponseFactory.Ok(new { id = request.PoiId.Value.ToString(), submitted = true, approvalStatus = "PENDING" }));
  }

  [HttpPost("pois/{poiId:long}/products")]
  public async Task<IActionResult> AddPoiProduct(ulong poiId, ProductRequest request)
  {
    await EnsureOwnedPoiAsync(poiId);
    var product = new PoiProduct { PoiId = poiId, Name = request.Name.Trim(), Price = request.Price };
    db.PoiProducts.Add(product); await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = product.Id.ToString(), product.Name, product.Price }));
  }

  [HttpPut("pois/{poiId:long}/products/{id:long}")]
  public async Task<IActionResult> UpdatePoiProduct(ulong poiId, ulong id, ProductRequest request)
  {
    await EnsureOwnedPoiAsync(poiId);
    var product = await db.PoiProducts.SingleAsync(x => x.Id == id && x.PoiId == poiId);
    product.Name = request.Name.Trim(); product.Price = request.Price; await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = product.Id.ToString(), product.Name, product.Price }));
  }

  [HttpDelete("pois/{poiId:long}/products/{id:long}")]
  public async Task<IActionResult> DeletePoiProduct(ulong poiId, ulong id)
  {
    await EnsureOwnedPoiAsync(poiId);
    var product = await db.PoiProducts.SingleAsync(x => x.Id == id && x.PoiId == poiId);
    db.PoiProducts.Remove(product); await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(true));
  }

  [HttpPut("profile")]
  public async Task<IActionResult> UpdateProfile([FromBody] VendorProfileRequest request)
  {
    var vendor = await db.Vendors.SingleAsync(x => x.Id == VendorId);
    vendor.TradeName = request.TradeName.Trim();
    vendor.ContactEmail = request.ContactEmail.Trim().ToLowerInvariant();
    await db.SaveChangesAsync();
    return await Profile();
  }

  [HttpGet("my-stalls")]
  public async Task<IActionResult> MyStalls()
  {
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT s.*, t.name AS assigned_zone_name,
        (SELECT file_name FROM media_files mf WHERE mf.stall_id=s.id AND mf.file_type='IMAGE'
         AND mf.moderation_status='APPROVED' ORDER BY mf.id DESC LIMIT 1) AS image_file
      FROM stalls s JOIN vendors v ON v.id=s.vendor_id
      LEFT JOIN tours t ON t.id=v.assigned_tour_id
      WHERE s.vendor_id=@vendorId ORDER BY s.id
      """;
    command.AddParameter("@vendorId", VendorId);
    await using var reader = await command.ExecuteReaderAsync();
    var list = new List<object>();
    while (await reader.ReadAsync())
    {
      string? pendingFile = reader.NullableString("pending_cover_image_url");
      string? imageFile = reader.NullableString("image_file");
      var premiumActivationOrd = reader.GetOrdinal("premium_activation_date");
      var premiumExpiryOrd = reader.GetOrdinal("premium_expiry_date");
      list.Add(new
      {
        id = reader.UInt64("id").ToString(),
        name = reader.GetString(reader.GetOrdinal("name")),
        description = reader.NullableString("description"),
        latitude = reader.Decimal("latitude"),
        longitude = reader.Decimal("longitude"),
        activationRadius = reader.Int32("activation_radius"),
        status = reader.GetString(reader.GetOrdinal("status")),
        isPremium = reader.Boolean("is_premium"),
        isPremiumPriority = reader.Boolean("is_premium_priority"),
        premiumActivationDate = reader.IsDBNull(premiumActivationOrd) ? (DateTime?)null : reader.GetDateTime(premiumActivationOrd),
        premiumExpiryDate = reader.IsDBNull(premiumExpiryOrd) ? (DateTime?)null : reader.GetDateTime(premiumExpiryOrd),
        zoneCode = reader.NullableString("zone_code"),
        assignedZoneName = reader.NullableString("assigned_zone_name"),
        imageUrl = imageFile is null ? null : $"/uploads/vendor/{imageFile}",
        pendingName = reader.NullableString("pending_name"),
        pendingDescription = reader.NullableString("pending_description"),
        pendingLatitude = reader.IsDBNull(reader.GetOrdinal("pending_latitude")) ? null : (decimal?)reader.Decimal("pending_latitude"),
        pendingLongitude = reader.IsDBNull(reader.GetOrdinal("pending_longitude")) ? null : (decimal?)reader.Decimal("pending_longitude"),
        pendingCoverImageUrl = pendingFile is null ? null : $"/uploads/vendor/{pendingFile}",
        approvalStatus = reader.GetString(reader.GetOrdinal("approval_status")),
        stallLimit = 3
      });
    }
    return Ok(ApiResponseFactory.Ok(list));
  }

  [HttpGet("stall")]
  public async Task<IActionResult> Stall()
  {
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT s.*, t.name AS assigned_zone_name,
        (SELECT file_name FROM media_files mf WHERE mf.stall_id=s.id AND mf.file_type='IMAGE'
         AND mf.moderation_status='APPROVED' ORDER BY mf.id DESC LIMIT 1) AS image_file
      FROM stalls s JOIN vendors v ON v.id=s.vendor_id
      LEFT JOIN tours t ON t.id=v.assigned_tour_id
      WHERE s.vendor_id=@vendorId ORDER BY s.id LIMIT 1
      """;
    command.AddParameter("@vendorId", VendorId);
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) return Ok(ApiResponseFactory.Ok(new { stall = (object?)null }));
    string? pendingFile = reader.NullableString("pending_cover_image_url");
    string? imageFile = reader.NullableString("image_file");
    var pActivationOrd = reader.GetOrdinal("premium_activation_date");
    var pExpiryOrd = reader.GetOrdinal("premium_expiry_date");
    return Ok(ApiResponseFactory.Ok(new
    {
      stall = new
      {
        id = reader.UInt64("id").ToString(),
        name = reader.GetString(reader.GetOrdinal("name")),
        description = reader.NullableString("description"),
        latitude = reader.Decimal("latitude"), longitude = reader.Decimal("longitude"),
        activationRadius = reader.Int32("activation_radius"),
        status = reader.GetString(reader.GetOrdinal("status")),
        isPremium = reader.Boolean("is_premium"),
        isPremiumPriority = reader.Boolean("is_premium_priority"),
        premiumActivationDate = reader.IsDBNull(pActivationOrd) ? (DateTime?)null : reader.GetDateTime(pActivationOrd),
        premiumExpiryDate = reader.IsDBNull(pExpiryOrd) ? (DateTime?)null : reader.GetDateTime(pExpiryOrd),
        zoneCode = reader.NullableString("zone_code"),
        assignedZoneName = reader.NullableString("assigned_zone_name"),
        imageUrl = imageFile is null ? null : $"/uploads/vendor/{imageFile}",
        pendingName = reader.NullableString("pending_name"),
        pendingDescription = reader.NullableString("pending_description"),
        pendingLatitude = reader.IsDBNull(reader.GetOrdinal("pending_latitude")) ? null : (decimal?)reader.Decimal("pending_latitude"),
        pendingLongitude = reader.IsDBNull(reader.GetOrdinal("pending_longitude")) ? null : (decimal?)reader.Decimal("pending_longitude"),
        pendingCoverImageUrl = pendingFile is null ? null : $"/uploads/vendor/{pendingFile}",
        approvalStatus = reader.GetString(reader.GetOrdinal("approval_status")),
        stallLimit = 3
      }
    }));
  }

  [HttpPut("stall/submit")]
  [RequestSizeLimit(10 * 1024 * 1024 + 32_768)]
  public async Task<IActionResult> UpdateStall([FromForm] VendorStallRequest request)
  {
    if (!decimal.TryParse(request.Latitude, NumberStyles.Float, CultureInfo.InvariantCulture, out var latitude) ||
        !decimal.TryParse(request.Longitude, NumberStyles.Float, CultureInfo.InvariantCulture, out var longitude) ||
        latitude is < -90 or > 90 || longitude is < -180 or > 180)
      return BadRequest(ApiResponseFactory.Fail("stall.invalid_coordinates"));

    string? storedName = null;
    if (request.Image is not null)
    {
      storedName = await StoreFileAsync(request.Image, ["image/png", "image/jpeg"], [".png", ".jpg", ".jpeg"], "vendor");
    }

    var stallId = await PrimaryStallIdAsync();
    var poi = await db.Pois.FirstOrDefaultAsync(p => p.VendorId == VendorId);
    if (poi == null)
    {
      poi = new Poi
      {
        VendorId = VendorId,
        StallId = stallId,
        Name = request.Name.Trim(),
        Description = request.Description,
        Latitude = latitude,
        Longitude = longitude,
        Status = "ACTIVE",
        ApprovalStatus = ApprovalStatus.PENDING,
        CoverUrl = storedName is null ? null : $"/uploads/vendor/{storedName}",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
      };
      db.Pois.Add(poi);
    }
    else
    {
      poi.Name = request.Name.Trim();
      poi.Description = request.Description;
      poi.Latitude = latitude;
      poi.Longitude = longitude;
      poi.ApprovalStatus = ApprovalStatus.PENDING;
      if (storedName is not null)
      {
        poi.CoverUrl = $"/uploads/vendor/{storedName}";
      }
      poi.UpdatedAt = DateTime.UtcNow;
    }
    await db.SaveChangesAsync();
    await DatabaseSql.ExecuteAsync(db, """
      UPDATE stalls
      SET pending_name=@name,pending_description=@description,
          pending_latitude=@latitude,pending_longitude=@longitude,
          pending_cover_image_url=COALESCE(@image,pending_cover_image_url),
          approval_status='PENDING',updated_at=NOW()
      WHERE id=@stallId AND vendor_id=@vendorId
      """, new Dictionary<string, object?>
    {
      ["@name"] = request.Name.Trim(),
      ["@description"] = request.Description,
      ["@latitude"] = latitude,
      ["@longitude"] = longitude,
      ["@image"] = storedName,
      ["@stallId"] = stallId,
      ["@vendorId"] = VendorId
    });

    if (storedName is not null)
    {
      var config = (IConfiguration)HttpContext.RequestServices.GetService(typeof(IConfiguration))!;
      var publicBaseUrl = (config["Storage:PublicBaseUrl"]
        ?? $"{Request.Scheme}://{Request.Host}/uploads").TrimEnd('/');
      var publicUrl = $"{publicBaseUrl}/vendor/{storedName}";
      var relativePath = $"/uploads/vendor/{storedName}";

      await DatabaseSql.ExecuteAsync(db, """
        INSERT INTO media_files
          (vendor_id, stall_id, poi_id, file_type, file_name, file_path, public_url, mime_type, file_size, moderation_status)
        VALUES
          (@vendorId, @stallId, @poiId, 'IMAGE', @fileName, @filePath, @publicUrl, @mimeType, @fileSize, 'PENDING')
        """, new Dictionary<string, object?>
      {
        ["@vendorId"] = VendorId,
        ["@stallId"] = stallId,
        ["@poiId"] = poi.Id,
        ["@fileName"] = request.Image!.FileName,
        ["@filePath"] = relativePath,
        ["@publicUrl"] = publicUrl,
        ["@mimeType"] = request.Image.ContentType,
        ["@fileSize"] = (ulong)request.Image.Length
      });
    }

    // Background auto-translation chain
    try
    {
      var connection = await DatabaseSql.OpenConnectionAsync(db);
      // 1. Save Vietnamese content
      await using var viCmd = connection.CreateCommand();
      viCmd.CommandText = """
        INSERT INTO poi_contents(poi_id,lang,title,tts_script,approval_status)
        VALUES(@poiId,'vi',@title,@script,'pending')
        ON DUPLICATE KEY UPDATE title=VALUES(title),tts_script=VALUES(tts_script),approval_status='pending',updated_at=NOW()
        """;
      viCmd.AddParameter("@poiId", poi.Id);
      viCmd.AddParameter("@title", request.Name.Trim());
      viCmd.AddParameter("@script", request.Description ?? "");
      await viCmd.ExecuteNonQueryAsync();

      // 2. Generate and save translations for en, ja, ko, zh
      var langs = new[] { "en", "ja", "ko", "zh" };
      foreach (var lang in langs)
      {
        var translatedName = await TranslateTextAsync(request.Name, lang);
        var translatedDesc = await TranslateTextAsync(request.Description ?? "", lang);
        
        await using var transCmd = connection.CreateCommand();
        transCmd.CommandText = """
          INSERT INTO poi_contents(poi_id,lang,title,tts_script,approval_status)
          VALUES(@poiId,@lang,@title,@script,'pending')
          ON DUPLICATE KEY UPDATE title=VALUES(title),tts_script=VALUES(tts_script),approval_status='pending',updated_at=NOW()
          """;
        transCmd.AddParameter("@poiId", poi.Id);
        transCmd.AddParameter("@lang", lang);
        transCmd.AddParameter("@title", string.IsNullOrWhiteSpace(translatedName) ? $"Stall - {lang}" : translatedName);
        transCmd.AddParameter("@script", translatedDesc);
        await transCmd.ExecuteNonQueryAsync();
      }
    }
    catch (Exception ex)
    {
      System.Console.WriteLine($"Stall translation failure: {ex.Message}");
    }

    await hubContext.Clients.All.SendAsync("VendorStallUpdateSubmitted", new
    {
      stallId = stallId.ToString(),
      vendorId = VendorId.ToString(),
      approvalStatus = "PENDING",
      submittedAt = DateTime.UtcNow
    });
    await hubContext.Clients.All.SendAsync("ReceiveNotification", new
    {
      type = "STALL_UPDATE_PENDING",
      title = "Yêu cầu cập nhật sạp mới",
      message = $"Vendor #{VendorId} vừa gửi sạp #{stallId} để duyệt.",
      stallId = stallId.ToString()
    });

    return Ok(ApiResponseFactory.Ok(new { submitted = true, approvalStatus = "PENDING", pendingImageUrl = storedName is null ? null : $"/uploads/vendor/{storedName}" }));
  }

  [HttpPost("stalls")]
  public async Task<IActionResult> CreateStall([FromBody] VendorStallCreateRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Name) ||
        request.Latitude is < -90 or > 90 ||
        request.Longitude is < -180 or > 180)
      return BadRequest(ApiResponseFactory.Fail("stall.invalid_coordinates"));

    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var transaction = await connection.BeginTransactionAsync();
    await using var countCommand = connection.CreateCommand();
    countCommand.Transaction = transaction;
    countCommand.CommandText = "SELECT COUNT(*) FROM stalls WHERE vendor_id=@vendorId FOR UPDATE";
    countCommand.AddParameter("@vendorId", VendorId);
    var existingCount = Convert.ToInt32(await countCommand.ExecuteScalarAsync());
    if (existingCount >= 3)
    {
      await transaction.RollbackAsync();
      return Conflict(new
      {
        success = false,
        message = "Tài khoản Premium chỉ cho phép tạo tối đa 3 sạp hàng!"
      });
    }
    await using var premiumCommand = connection.CreateCommand();
    premiumCommand.Transaction = transaction;
    premiumCommand.CommandText = "SELECT COALESCE(MAX(is_premium),0) FROM stalls WHERE vendor_id=@vendorId";
    premiumCommand.AddParameter("@vendorId", VendorId);
    var vendorIsPremium = Convert.ToBoolean(await premiumCommand.ExecuteScalarAsync());
    if (existingCount >= 1 && !vendorIsPremium)
    {
      await transaction.RollbackAsync();
      return StatusCode(StatusCodes.Status403Forbidden, new
      {
        success = false,
        message = "Chỉ tài khoản Premium mới có thể tạo thêm sạp phụ."
      });
    }

    var isPrimary = existingCount == 0;
    var slug = $"{Slugify(request.Name)}-{Guid.NewGuid():N}"[..Math.Min(80, Slugify(request.Name).Length + 33)];
    var zoneCode = Guid.NewGuid().ToString("N");
    await using var insert = connection.CreateCommand();
    insert.Transaction = transaction;
    insert.CommandText = """
      INSERT INTO stalls
        (vendor_id,name,slug,description,latitude,longitude,activation_radius,status,
         is_premium,is_premium_priority,priority_score,zone_code,approval_status)
      VALUES
        (@vendorId,@name,@slug,@description,@latitude,@longitude,@radius,'PENDING',
         @priority,@priority,@score,@zoneCode,'PENDING')
      """;
    insert.AddParameter("@vendorId", VendorId);
    insert.AddParameter("@name", request.Name.Trim());
    insert.AddParameter("@slug", slug);
    insert.AddParameter("@description", request.Description);
    insert.AddParameter("@latitude", request.Latitude);
    insert.AddParameter("@longitude", request.Longitude);
    insert.AddParameter("@radius", isPrimary ? 10 : 3);
    insert.AddParameter("@priority", isPrimary);
    insert.AddParameter("@score", isPrimary ? 100 : 0);
    insert.AddParameter("@zoneCode", zoneCode);
    await insert.ExecuteNonQueryAsync();
    await using var createPoi = connection.CreateCommand();
    createPoi.Transaction = transaction;
    createPoi.CommandText = """
      INSERT INTO zones
        (tour_id,stall_id,name,slug,description,latitude,longitude,
         activation_radius,status,approval_status)
      SELECT COALESCE(v.assigned_tour_id,(SELECT id FROM tours WHERE status!='ARCHIVED' ORDER BY id LIMIT 1)),
        LAST_INSERT_ID(),@name,CONCAT(@slug,'-poi'),@description,@latitude,@longitude,
        @radius,'ACTIVE','PENDING'
      FROM vendors v
      WHERE v.id=@vendorId
        AND COALESCE(v.assigned_tour_id,(SELECT id FROM tours WHERE status!='ARCHIVED' ORDER BY id LIMIT 1)) IS NOT NULL
      """;
    createPoi.AddParameter("@vendorId", VendorId);
    createPoi.AddParameter("@name", request.Name.Trim());
    createPoi.AddParameter("@slug", slug);
    createPoi.AddParameter("@description", request.Description);
    createPoi.AddParameter("@latitude", request.Latitude);
    createPoi.AddParameter("@longitude", request.Longitude);
    createPoi.AddParameter("@radius", isPrimary ? 10 : 3);
    await createPoi.ExecuteNonQueryAsync();
    await transaction.CommitAsync();
    return Ok(ApiResponseFactory.Ok(new
    {
      created = true,
      approvalStatus = "PENDING",
      isPremiumPriority = isPrimary,
      triggerRadius = isPrimary ? 10 : 3,
      zoneCode
    }));
  }

  [HttpPut("location")]
  public async Task<IActionResult> Location([FromBody] LocationRequest request)
  {
    if (request.Latitude is < -90 or > 90 || request.Longitude is < -180 or > 180)
      return BadRequest(ApiResponseFactory.Fail("stall.invalid_coordinates"));
    await DatabaseSql.ExecuteAsync(db, """
      UPDATE stalls SET pending_latitude=@lat,pending_longitude=@lng,approval_status='PENDING',updated_at=NOW()
      WHERE vendor_id=@vendorId ORDER BY id LIMIT 1
      """, new Dictionary<string, object?> { ["@lat"] = request.Latitude, ["@lng"] = request.Longitude, ["@vendorId"] = VendorId });
    return Ok(ApiResponseFactory.Ok(new { submitted = true, approvalStatus = "PENDING" }));
  }

  [HttpGet("wallet")]
  public async Task<IActionResult> Wallet()
  {
    var wallet = await db.Wallets.AsNoTracking().SingleAsync(x => x.VendorId == VendorId);
    return Ok(ApiResponseFactory.Ok(new { id = wallet.Id.ToString(), balance = wallet.Balance, totalTopUp = wallet.TotalTopUp, totalSpent = wallet.TotalSpent }));
  }

  [HttpGet("wallet/transactions")]
  public async Task<IActionResult> Transactions()
  {
    var rows = await db.WalletTransactions.AsNoTracking().Where(x => x.VendorId == VendorId)
      .OrderByDescending(x => x.CreatedAt).Take(100)
      .Select(x => new { id = x.Id.ToString(), type = x.TransactionType, category = x.TransactionCategory,
        direction = x.Direction, x.Amount, x.BalanceBefore, x.BalanceAfter, x.Description, x.CreatedAt }).ToListAsync();
    return Ok(ApiResponseFactory.Ok(rows));
  }

  [HttpGet("products")]
  public async Task<IActionResult> Products()
  {
    var stallId = await PrimaryStallIdAsync();
    var rows = await db.PoiProducts.AsNoTracking().Where(x => x.Poi.StallId == stallId)
      .Select(x => new { id = x.Id.ToString(), poiId = x.PoiId.ToString(), x.Name, x.Price }).ToListAsync();
    return Ok(ApiResponseFactory.Ok(rows));
  }

  [HttpPost("products")]
  public async Task<IActionResult> AddProduct([FromBody] ProductRequest request)
  {
    var stallId = await PrimaryStallIdAsync();
    var poiId = await db.Pois.Where(x => x.StallId == stallId).OrderBy(x => x.Id).Select(x => x.Id).FirstAsync();
    var product = new PoiProduct { PoiId = poiId, Name = request.Name.Trim(), Price = request.Price };
    db.PoiProducts.Add(product); await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = product.Id.ToString(), product.Name, product.Price }));
  }

  [HttpPost("pay-subscription")]
  public async Task<IActionResult> PaySubscription() =>
    Ok(ApiResponseFactory.Ok(await DebitWalletAsync("WEBAPP_MONTHLY_RENT")));

  [HttpPost("premium/request")]
  public async Task<IActionResult> Premium() =>
    Ok(ApiResponseFactory.Ok(await DebitWalletAsync("PREMIUM_UPGRADE")));

  [HttpPost("topups")]
  [RequestSizeLimit(5 * 1024 * 1024 + 32_768)]
  public async Task<IActionResult> TopUp([FromForm] TopUpRequest request)
  {
    var fileName = await StoreFileAsync(request.Proof, ["image/png", "image/jpeg"], [".png", ".jpg", ".jpeg"], "vendor");
    var wallet = await db.Wallets.SingleAsync(x => x.VendorId == VendorId);
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      INSERT INTO top_up_requests(vendor_id,wallet_id,provider,status,amount,proof_url,note)
      VALUES(@vendorId,@walletId,'BANK_QR','PENDING',@amount,@fileName,@note)
      """;
    command.AddParameter("@vendorId", VendorId); command.AddParameter("@walletId", wallet.Id);
    command.AddParameter("@amount", request.Amount); command.AddParameter("@fileName", fileName); command.AddParameter("@note", request.Note);
    await command.ExecuteNonQueryAsync();

    try
    {
      await hubContext.Clients.All.SendAsync("ReceiveNotification", new
      {
        type = "TOPUP_NEW",
        title = "Yêu cầu nạp tiền mới",
        message = $"Vendor #{VendorId} đã yêu cầu nạp {request.Amount:N0} VND."
      });
    }
    catch (Exception ex)
    {
      System.Console.WriteLine($"SignalR push error: {ex.Message}");
    }

    return Ok(ApiResponseFactory.Ok(new { status = "PENDING", amount = request.Amount, proofFileName = fileName }));
  }

  private async Task<object> DebitWalletAsync(string category)
  {
    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    var wallet = await db.Wallets.SingleAsync(x => x.VendorId == VendorId);
    decimal fee;
    if (category == "PREMIUM_UPGRADE")
      fee = await db.Database.SqlQuery<decimal>($"SELECT price AS Value FROM subscription_plans WHERE code='PREMIUM_MONTHLY' LIMIT 1").SingleAsync();
    else
      fee = await db.Database.SqlQuery<decimal>($"SELECT price_snapshot AS Value FROM vendor_subscriptions WHERE vendor_id={VendorId} ORDER BY id DESC LIMIT 1").SingleAsync();
    if (wallet.Balance < fee) throw new InvalidOperationException("wallet.insufficient_balance");
    var before = wallet.Balance; wallet.Balance -= fee; wallet.TotalSpent += fee;
    db.WalletTransactions.Add(new WalletTransaction
    {
      WalletId = wallet.Id, VendorId = VendorId, TransactionType = "FEE", TransactionCategory = category,
      Direction = "DEBIT", Amount = fee, BalanceBefore = before, BalanceAfter = wallet.Balance,
      Description = category == "PREMIUM_UPGRADE" ? "Phí nâng cấp Premium" : "Phí thuê WebApp hàng tháng",
      CreatedAt = DateTime.UtcNow
    });
    if (category == "PREMIUM_UPGRADE")
      await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE stalls SET is_premium=1,activation_radius=GREATEST(activation_radius,10),priority_score=100,premium_activation_date=NOW(),premium_expiry_date=DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE vendor_id={VendorId}");
    else
      await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE vendor_subscriptions SET status='ACTIVE',payment_status='paid',next_billing_date=DATE_ADD(COALESCE(next_billing_date,CURDATE()),INTERVAL 1 MONTH) WHERE vendor_id={VendorId} ORDER BY id DESC LIMIT 1");
    await db.SaveChangesAsync(); await transaction.CommitAsync();
    return new { paid = true, category, amount = fee, balanceAfter = wallet.Balance };
  }

  private async Task<ulong> PrimaryStallIdAsync() =>
    await db.Database.SqlQuery<ulong>($"SELECT id AS Value FROM stalls WHERE vendor_id={VendorId} ORDER BY id LIMIT 1").SingleAsync();

  private static string Slugify(string value) => string.Join('-',
    value.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries))
    .Replace("đ", "d");

  private async Task EnsureOwnedPoiAsync(ulong poiId)
  {
    var stallId = await PrimaryStallIdAsync();
    if (!await db.Pois.AnyAsync(x => x.Id == poiId && x.StallId == stallId)) throw new UnauthorizedAccessException();
  }

  private Task<int> QueuePoiUpdate(ulong poiId, PoiUpdateRequest request) => DatabaseSql.ExecuteAsync(db, """
    UPDATE zones SET pending_name=COALESCE(@name,name),pending_description=COALESCE(@description,description),
      pending_latitude=COALESCE(@latitude,latitude),pending_longitude=COALESCE(@longitude,longitude),
      approval_status='PENDING',updated_at=NOW() WHERE id=@id
    """, new Dictionary<string, object?> { ["@id"] = poiId, ["@name"] = request.Name,
      ["@description"] = request.Description, ["@latitude"] = request.Latitude, ["@longitude"] = request.Longitude });

  private async Task<string> StoreFileAsync(IFormFile file, string[] mimeTypes, string[] extensions, string folder)
  {
    if (file.Length is <= 0 or > 5 * 1024 * 1024) throw new InvalidOperationException("upload.invalid_size");
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!mimeTypes.Contains(file.ContentType) || !extensions.Contains(extension)) throw new InvalidOperationException("upload.invalid_type");
    if (!await FileSignatureValidator.IsValidAsync(file, extension)) throw new InvalidOperationException("upload.invalid_signature");
    var name = $"{Guid.NewGuid():N}{extension}";
    var target = Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", folder);
    Directory.CreateDirectory(target);
    await using var stream = System.IO.File.Create(Path.Combine(target, name));
    await file.CopyToAsync(stream);
    return name;
  }

  private async Task<string> TranslateTextAsync(string text, string targetLang)
  {
    try
    {
      if (string.IsNullOrWhiteSpace(text)) return "";
      var client = clients.CreateClient();
      var url = $"https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl={Uri.EscapeDataString(targetLang)}&dt=t&q={Uri.EscapeDataString(text)}";
      using var response = await client.GetAsync(url);
      if (!response.IsSuccessStatusCode) return "";
      using var document = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
      return string.Concat(document.RootElement[0].EnumerateArray()
        .Select(item => item[0].ValueKind == System.Text.Json.JsonValueKind.String ? item[0].GetString() : ""));
    }
    catch
    {
      return "";
    }
  }
}

public sealed record VendorProfileRequest(string TradeName, string ContactEmail);
public sealed record VendorStallRequest(string Name, string? Description, string Latitude, string Longitude, IFormFile? Image);
public sealed record VendorStallCreateRequest(string Name, string? Description, decimal Latitude, decimal Longitude);
public sealed record ProductRequest(string Name, decimal Price);
public sealed record TopUpRequest(decimal Amount, string? Note, IFormFile Proof);
public sealed record VendorContentRequest(string TtsScript, string Language = "vi");
public sealed record LocationRequest(decimal Latitude, decimal Longitude);
public sealed record PoiUpdateRequest(ulong? PoiId, string? Name, string? Description, decimal? Latitude, decimal? Longitude);
public sealed record VendorTranslationRequest(string Text, string[] TargetLangs);
