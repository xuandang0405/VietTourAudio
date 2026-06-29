using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Infrastructure;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/vendor")]
[Authorize(Roles = "VENDOR")]
public sealed class VendorController(
  AppDbContext db,
  IWebHostEnvironment environment,
  Microsoft.AspNetCore.SignalR.IHubContext<VietTourAudio.Api.Hubs.NotificationHub> hubContext,
  System.Net.Http.IHttpClientFactory clients,
  VietTourAudio.Api.Services.PoiTranslationService translationService,
  ILogger<VendorController> logger) : ControllerBase
{
  private string VendorId => User.FindFirstValue("vendor_id") ?? throw new UnauthorizedAccessException();

  [HttpPost("change-password")]
  public async Task<IActionResult> ChangePassword([FromBody] VendorChangePasswordRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 10)
      return BadRequest(ApiResponseFactory.Fail("Mật khẩu mới phải có ít nhất 10 ký tự."));

    var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? throw new UnauthorizedAccessException();
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT pass_hash FROM vendor_portal_users
      WHERE id=@accountId AND vendor_id=@vendorId LIMIT 1
      """, new Dictionary<string, object?>
    {
      ["@accountId"] = accountId,
      ["@vendorId"] = VendorId
    });
    if (rows.Count == 0) return NotFound(ApiResponseFactory.Fail("vendor.account_not_found"));
    if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, Convert.ToString(rows[0]["pass_hash"])))
      return BadRequest(ApiResponseFactory.Fail("Mật khẩu tạm hiện tại không chính xác."));

    await DatabaseSql.ExecuteAsync(db, """
      UPDATE vendor_portal_users
      SET pass_hash=@hash,must_change_password=0,password_reset_at=NULL,updated_at=@updatedAt
      WHERE id=@accountId AND vendor_id=@vendorId
      """, new Dictionary<string, object?>
    {
      ["@hash"] = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, 12),
      ["@updatedAt"] = DateTime.UtcNow,
      ["@accountId"] = accountId,
      ["@vendorId"] = VendorId
    });
    return Ok(ApiResponseFactory.Ok(new { changed = true, mustChangePassword = false }));
  }

  [HttpPost("tickets")]
  public async Task<IActionResult> CreateSupportTicket([FromBody] VendorTicketRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.Message))
      return BadRequest(ApiResponseFactory.Fail("ticket.required_fields"));
    var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? throw new UnauthorizedAccessException();
    var email = User.FindFirstValue(ClaimTypes.Email) ?? "";
    var ticket = new SystemTicket
    {
      UserId = accountId,
      SenderType = "VENDOR",
      SenderEmail = email,
      Subject = request.Subject.Trim(),
      Message = request.Message.Trim(),
      Status = TicketStatus.PENDING,
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };
    db.SystemTickets.Add(ticket);
    await db.SaveChangesAsync();
    try
    {
      await hubContext.Clients.Group(VietTourAudio.Api.Hubs.NotificationHub.AdminPresenceGroup)
        .SendAsync("ReceiveNotification", new
        {
          type = "TICKET_NEW",
          title = "Hỗ trợ Vendor",
          message = $"Ticket mới từ {email}: {ticket.Subject}"
        });
    }
    catch (Exception notificationError)
    {
      Console.WriteLine($"SignalR ticket notification failed: {notificationError.Message}");
    }
    return Ok(ApiResponseFactory.Ok(new { id = ticket.Id, status = ticket.Status.ToString() }));
  }

  [HttpGet("profile")]
  public async Task<IActionResult> Profile()
  {
    var vendor = await db.Vendors.AsNoTracking().SingleAsync(x => x.Id == VendorId);
    return Ok(ApiResponseFactory.Ok(new
    {
      id = vendor.Id,
      businessName = vendor.TradeName,
      vendorCode = vendor.Id[..8],
      ownerEmail = vendor.Email,
      verificationStatus = "APPROVED",
      assignedTourId = vendor.FestivalZoneId
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
    var totalPois = await db.Pois.CountAsync(x => x.VendorId == VendorId);
    var totalVisits = await db.VisitEvents.CountAsync(x => x.VendorId == VendorId);
    var totalAudioPlays = await db.AudioPlayEvents.CountAsync(x => x.VendorId == VendorId);
    var totalUniqueVisitors = await db.VisitEvents.Where(x => x.VendorId == VendorId)
      .Select(x => x.SessionId).Distinct().CountAsync();

    var metrics = new Dictionary<string, object?>
    {
      ["totalQrScans"] = "0",
      ["totalVisits"] = totalVisits,
      ["totalAudioPlays"] = totalAudioPlays,
      ["totalUniqueVisitors"] = totalUniqueVisitors,
      ["totalPremiumConversions"] = "0",
      ["totalRevenue"] = "0",
      ["totalPois"] = totalPois
    };

    var since = DateTime.UtcNow.Date.AddDays(-13);
    var visitsByDay = await db.VisitEvents.AsNoTracking()
      .Where(x => x.VendorId == VendorId && x.VisitedAt >= since)
      .GroupBy(x => x.VisitedAt.Date)
      .Select(group => new { Date = group.Key, Count = group.Count() })
      .ToDictionaryAsync(x => x.Date, x => x.Count);
    var playsByDay = await db.AudioPlayEvents.AsNoTracking()
      .Where(x => x.VendorId == VendorId && x.PlayedAt >= since)
      .GroupBy(x => x.PlayedAt.Date)
      .Select(group => new { Date = group.Key, Count = group.Count() })
      .ToDictionaryAsync(x => x.Date, x => x.Count);
    var daily = Enumerable.Range(0, 14).Select(offset =>
    {
      var date = since.AddDays(offset);
      return new
      {
        date,
        visitors = visitsByDay.GetValueOrDefault(date),
        audioPlays = playsByDay.GetValueOrDefault(date),
        revenue = 0m
      };
    }).ToArray();

    var visitCounts = await db.VisitEvents.AsNoTracking().Where(x => x.VendorId == VendorId)
      .GroupBy(x => x.PoiId).Select(group => new { PoiId = group.Key, Count = group.Count() })
      .ToDictionaryAsync(x => x.PoiId, x => x.Count);
    var playCounts = await db.AudioPlayEvents.AsNoTracking().Where(x => x.VendorId == VendorId)
      .GroupBy(x => x.PoiId).Select(group => new { PoiId = group.Key, Count = group.Count() })
      .ToDictionaryAsync(x => x.PoiId, x => x.Count);
    var topPois = (await db.Pois.AsNoTracking().Where(x => x.VendorId == VendorId)
      .Select(x => new { x.Id, name = x.StallName }).ToListAsync())
      .Select(x => new { x.Id, x.name, visits = visitCounts.GetValueOrDefault(x.Id),
        audioPlays = playCounts.GetValueOrDefault(x.Id) })
      .OrderByDescending(x => x.audioPlays).ThenByDescending(x => x.visits).Take(10).ToArray();
    
    return Ok(ApiResponseFactory.Ok(new
    {
      businessName = vendor.TradeName,
      walletBalance = wallet.Balance,
      metrics,
      daily,
      topPois
    }));
  }

  [HttpGet("revenue")]
  public async Task<IActionResult> GetVendorRevenue()
  {
    try
    {
      var vendor = await db.Vendors.AsNoTracking()
        .SingleOrDefaultAsync(x => x.Id == VendorId);
      if (vendor is null)
        return NotFound(ApiResponseFactory.Fail("vendor.not_found"));

      var wallet = await db.Wallets.AsNoTracking()
        .SingleOrDefaultAsync(x => x.VendorId == VendorId);
      var transactions = wallet is null
        ? []
        : await db.WalletTransactions.AsNoTracking()
          .Where(x => x.VendorId == VendorId)
          .OrderByDescending(x => x.CreatedAt)
          .Take(200)
          .Select(x => new
          {
            id = x.Id,
            type = x.TransactionType,
            category = x.TransactionCategory,
            direction = x.Direction,
            x.Amount,
            x.BalanceBefore,
            x.BalanceAfter,
            x.Description,
            x.CreatedAt
          })
          .ToListAsync();

      var topUps = await DatabaseSql.QueryRowsAsync(db, """
        SELECT id,amount,provider,status,proof_url proofUrl,note,created_at createdAt,reviewed_at reviewedAt
        FROM top_up_requests
        WHERE vendor_id=@vendorId
        ORDER BY created_at DESC
        LIMIT 100
        """, new Dictionary<string, object?> { ["@vendorId"] = VendorId });

      var data = new
      {
        summary = new
        {
          balance = wallet?.Balance ?? 0m,
          totalTopUp = wallet?.TotalTopUp ?? 0m,
          totalSpent = wallet?.TotalSpent ?? 0m,
          subscriptionStatus = vendor.SubscriptionExpiryDate.HasValue && vendor.SubscriptionExpiryDate.Value < DateTime.UtcNow ? "EXPIRED" : "ACTIVE",
          nextBillingDate = vendor.SubscriptionExpiryDate,
          isPremium = vendor.IsPremium,
          premiumExpiryDate = vendor.PremiumExpiryDate,
          premiumPrice = 599000m
        },
        stats = new
        {
          totalRevenue = 0m,
          todayRevenue = 0m,
          totalOrders = 0,
          pendingOrders = 0
        },
        transactions,
        topUps
      };

      return Ok(ApiResponseFactory.Ok(data, "Lấy dữ liệu doanh thu thành công."));
    }
    catch (Exception exception)
    {
      logger.LogError(exception, "Revenue retrieval failed for Vendor {VendorId}.", VendorId);
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        success = false,
        errorCode = "REVENUE_RETRIEVAL_FAILED",
        message = "Lỗi máy chủ khi truy xuất doanh thu."
      });
    }
  }

  [HttpGet("pois")]
  public async Task<IActionResult> GetPois()
  {
    var stallId = await PrimaryStallIdAsync();
    var rows = await db.Pois.AsNoTracking().Where(x => x.VendorId == VendorId).OrderBy(x => x.Id).ToListAsync();
    return Ok(ApiResponseFactory.Ok(rows.Select(x => new
    {
      id = x.Id,
      name = x.StallName,
      x.Slug,
      x.Description,
      latitude = (decimal)x.Latitude,
      longitude = (decimal)x.Longitude,
      activationRadius = (int)x.TriggerRadius,
      isPremiumContent = x.IsPremiumPriority,
      x.Status,
      approvalStatus = x.ApprovalStatus
    })));
  }

  [HttpPut("poi/request-update")]
  public async Task<IActionResult> RequestPoiUpdate([FromBody] UnifiedStallUpdateDto request)
  {
    if (string.IsNullOrWhiteSpace(request.Id) || string.IsNullOrWhiteSpace(request.StallName))
      return BadRequest(ApiResponseFactory.Fail("stall.name_required"));
    if (request.Latitude is < -90 or > 90 || request.Longitude is < -180 or > 180)
      return BadRequest(ApiResponseFactory.Fail("stall.invalid_coordinates"));

    var poi = await db.Pois.FirstOrDefaultAsync(candidate =>
      candidate.Id == request.Id && candidate.VendorId == VendorId);
    if (poi is null)
      return NotFound(ApiResponseFactory.Fail("Không tìm thấy sạp hàng."));

    // Vendor edits remain pending until an admin approves them. In particular,
    // never replace the pending or published cover with a blank request value.
    poi.PendingName = request.StallName.Trim();
    poi.PendingDescription = request.Description;
    poi.PendingLatitude = request.Latitude;
    poi.PendingLongitude = request.Longitude;
    poi.PendingCoverUrl = string.IsNullOrWhiteSpace(request.CoverUrl)
      ? poi.PendingCoverUrl ?? poi.CoverUrl
      : request.CoverUrl.Trim();
    
    // Save pending translation overrides
    poi.PendingNameEn = request.StallNameEn;
    poi.PendingNameJa = request.StallNameJa;
    poi.PendingNameKo = request.StallNameKo;
    poi.PendingNameZh = request.StallNameZh;
    poi.PendingDescriptionEn = request.DescriptionEn;
    poi.PendingDescriptionJa = request.DescriptionJa;
    poi.PendingDescriptionKo = request.DescriptionKo;
    poi.PendingDescriptionZh = request.DescriptionZh;

    poi.ApprovalStatus = "PENDING";
    poi.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new
    {
      success = true,
      approvalStatus = poi.ApprovalStatus,
      coverUrl = poi.PendingCoverUrl ?? poi.CoverUrl
    }));
  }

  [HttpGet("content")]
  public async Task<IActionResult> GetContent()
  {
    var stallId = await PrimaryStallIdAsync();
    var poi = await db.Pois.FirstOrDefaultAsync(p => p.VendorId == VendorId);
    if (poi == null) return NotFound(ApiResponseFactory.Fail("poi.not_found"));
    // Return localized content with multi-language translations
    var contents = new List<object>
    {
      new { language = "vi", title = poi.StallName, ttsScript = poi.Description ?? "", approvalStatus = poi.ApprovalStatus },
      new { language = "en", title = poi.StallNameEn ?? "", ttsScript = poi.DescriptionEn ?? "", approvalStatus = poi.ApprovalStatus },
      new { language = "ja", title = poi.StallNameJa ?? "", ttsScript = poi.DescriptionJa ?? "", approvalStatus = poi.ApprovalStatus },
      new { language = "ko", title = poi.StallNameKo ?? "", ttsScript = poi.DescriptionKo ?? "", approvalStatus = poi.ApprovalStatus },
      new { language = "zh", title = poi.StallNameZh ?? "", ttsScript = poi.DescriptionZh ?? "", approvalStatus = poi.ApprovalStatus }
    };
    return Ok(ApiResponseFactory.Ok(new { poiId = poi.Id, language = "vi", ttsScript = poi.Description ?? "", isApproved = poi.ApprovalStatus == "APPROVED", contents }));
  }

  [HttpPost("content")]
  public async Task<IActionResult> SaveContent([FromBody] VendorContentRequest request)
  {
    var stallId = await PrimaryStallIdAsync();
    var poi = await db.Pois.FirstOrDefaultAsync(p => p.VendorId == VendorId);
    if (poi == null) return NotFound(ApiResponseFactory.Fail("poi.not_found"));
    
    // Save to pending columns to go through approval queue
    poi.PendingDescription = request.TtsScript.Trim();
    poi.PendingName ??= poi.StallName;
    poi.PendingLatitude ??= poi.Latitude;
    poi.PendingLongitude ??= poi.Longitude;
    poi.PendingCoverUrl ??= poi.CoverUrl;

    poi.ApprovalStatus = "PENDING";
    poi.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { saved = true, isApproved = false }));
  }

  [HttpGet("my-stalls")]
  public async Task<IActionResult> MyStalls()
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(p.id AS CHAR) id, p.stall_name AS name, p.slug, p.description, p.cover_url coverImageUrl,
        p.latitude, p.longitude, p.status, p.approval_status approvalStatus,
        p.trigger_radius activationRadius, v.is_premium isPremium, v.premium_expiry_date premiumExpiryDate,
        p.pending_name pendingName, p.pending_description pendingDescription, p.pending_cover_image_url pendingCoverImageUrl,
        p.pending_latitude pendingLatitude, p.pending_longitude pendingLongitude,
        p.stall_name_en, p.stall_name_ja, p.stall_name_ko, p.stall_name_zh,
        p.description_en, p.description_ja, p.description_ko, p.description_zh,
        p.pending_name_en, p.pending_name_ja, p.pending_name_ko, p.pending_name_zh,
        p.pending_description_en, p.pending_description_ja, p.pending_description_ko, p.pending_description_zh
      FROM Pois p JOIN vendors v ON v.id=p.vendor_id WHERE p.vendor_id=@vendorId
      """, new Dictionary<string, object?> { ["@vendorId"] = VendorId });
    return Ok(ApiResponseFactory.Ok(rows.Select(x => new
    {
      id = x["id"],
      name = x["name"],
      slug = x["slug"],
      description = x["description"],
      coverUrl = x["coverImageUrl"],
      coverImageUrl = x["coverImageUrl"],
      latitude = x["latitude"] != null ? Convert.ToDecimal(x["latitude"]) : 0m,
      longitude = x["longitude"] != null ? Convert.ToDecimal(x["longitude"]) : 0m,
      status = x["status"],
      approvalStatus = x["approvalStatus"],
      activationRadius = x["activationRadius"] != null ? Convert.ToInt32(x["activationRadius"]) : 10,
      isPremium = x["isPremium"] != null && Convert.ToBoolean(x["isPremium"]),
      premiumExpiryDate = x["premiumExpiryDate"],
      pendingName = x["pendingName"],
      pendingDescription = x["pendingDescription"],
      pendingCoverImageUrl = x["pendingCoverImageUrl"],
      pendingLatitude = x["pendingLatitude"] != null ? Convert.ToDecimal(x["pendingLatitude"]) : (decimal?)null,
      pendingLongitude = x["pendingLongitude"] != null ? Convert.ToDecimal(x["pendingLongitude"]) : (decimal?)null,
      stallNameEn = x["stall_name_en"],
      stallNameJa = x["stall_name_ja"],
      stallNameKo = x["stall_name_ko"],
      stallNameZh = x["stall_name_zh"],
      descriptionEn = x["description_en"],
      descriptionJa = x["description_ja"],
      descriptionKo = x["description_ko"],
      descriptionZh = x["description_zh"],
      pendingNameEn = x["pending_name_en"],
      pendingNameJa = x["pending_name_ja"],
      pendingNameKo = x["pending_name_ko"],
      pendingNameZh = x["pending_name_zh"],
      pendingDescriptionEn = x["pending_description_en"],
      pendingDescriptionJa = x["pending_description_ja"],
      pendingDescriptionKo = x["pending_description_ko"],
      pendingDescriptionZh = x["pending_description_zh"]
    })));
  }

  [HttpGet("stall")]
  public async Task<IActionResult> GetStall()
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(p.id AS CHAR) id, p.stall_name AS name, p.slug, p.description, p.cover_url coverImageUrl,
        p.latitude, p.longitude, p.status, p.approval_status approvalStatus,
        p.trigger_radius activationRadius, v.is_premium isPremium, v.premium_expiry_date premiumExpiryDate,
        p.pending_name pendingName, p.pending_description pendingDescription, p.pending_cover_image_url pendingCoverImageUrl,
        p.pending_latitude pendingLatitude, p.pending_longitude pendingLongitude,
        p.stall_name_en, p.stall_name_ja, p.stall_name_ko, p.stall_name_zh,
        p.description_en, p.description_ja, p.description_ko, p.description_zh,
        p.pending_name_en, p.pending_name_ja, p.pending_name_ko, p.pending_name_zh,
        p.pending_description_en, p.pending_description_ja, p.pending_description_ko, p.pending_description_zh
      FROM Pois p JOIN vendors v ON v.id=p.vendor_id WHERE p.vendor_id=@vendorId LIMIT 1
      """, new Dictionary<string, object?> { ["@vendorId"] = VendorId });
    if (rows.Count == 0) return NotFound(ApiResponseFactory.Fail("stall.not_found"));
    var x = rows[0];
    return Ok(ApiResponseFactory.Ok(new
    {
      id = x["id"],
      name = x["name"],
      slug = x["slug"],
      description = x["description"],
      coverUrl = x["coverImageUrl"],
      coverImageUrl = x["coverImageUrl"],
      latitude = x["latitude"] != null ? Convert.ToDecimal(x["latitude"]) : 0m,
      longitude = x["longitude"] != null ? Convert.ToDecimal(x["longitude"]) : 0m,
      status = x["status"],
      approvalStatus = x["approvalStatus"],
      activationRadius = x["activationRadius"] != null ? Convert.ToInt32(x["activationRadius"]) : 10,
      isPremium = x["isPremium"] != null && Convert.ToBoolean(x["isPremium"]),
      premiumExpiryDate = x["premiumExpiryDate"],
      pendingName = x["pendingName"],
      pendingDescription = x["pendingDescription"],
      pendingCoverImageUrl = x["pendingCoverImageUrl"],
      pendingLatitude = x["pendingLatitude"] != null ? Convert.ToDecimal(x["pendingLatitude"]) : (decimal?)null,
      pendingLongitude = x["pendingLongitude"] != null ? Convert.ToDecimal(x["pendingLongitude"]) : (decimal?)null,
      stallNameEn = x["stall_name_en"],
      stallNameJa = x["stall_name_ja"],
      stallNameKo = x["stall_name_ko"],
      stallNameZh = x["stall_name_zh"],
      descriptionEn = x["description_en"],
      descriptionJa = x["description_ja"],
      descriptionKo = x["description_ko"],
      descriptionZh = x["description_zh"],
      pendingNameEn = x["pending_name_en"],
      pendingNameJa = x["pending_name_ja"],
      pendingNameKo = x["pending_name_ko"],
      pendingNameZh = x["pending_name_zh"],
      pendingDescriptionEn = x["pending_description_en"],
      pendingDescriptionJa = x["pending_description_ja"],
      pendingDescriptionKo = x["pending_description_ko"],
      pendingDescriptionZh = x["pending_description_zh"]
    }));
  }

  [HttpGet("stall/qr")]
  public async Task<IActionResult> GetStallQr()
  {
    var poi = await db.Pois.FirstOrDefaultAsync(x => x.VendorId == VendorId);
    if (poi == null) return NotFound(ApiResponseFactory.Fail("poi.not_found"));

    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT code FROM qr_codes WHERE poi_id = @poiId AND qr_type = 'STALL' AND is_active = 1 LIMIT 1
      """, new Dictionary<string, object?> { ["@poiId"] = poi.Id });

    if (rows.Count > 0 && rows[0]["code"] is string existingCode)
    {
      return Ok(ApiResponseFactory.Ok(new { zoneCode = existingCode }));
    }

    var prefix = poi.Id.Length >= 4 ? poi.Id[..4] : poi.Id;
    var newCode = $"STALL-{prefix}-{Guid.NewGuid():N}".ToUpperInvariant();
    var targetUrl = $"/stalls/{poi.Slug}";

    await DatabaseSql.ExecuteAsync(db, """
      INSERT INTO qr_codes(vendor_id, poi_id, code, qr_type, target_url, is_active)
      VALUES(@vendorId, @poiId, @code, 'STALL', @targetUrl, 1)
      """, new Dictionary<string, object?>
      {
        ["@vendorId"] = VendorId,
        ["@poiId"] = poi.Id,
        ["@code"] = newCode,
        ["@targetUrl"] = targetUrl
      });

    return Ok(ApiResponseFactory.Ok(new { zoneCode = newCode }));
  }

  [HttpGet("pois/{poiId}/products")]
  public async Task<IActionResult> GetPoiProducts(string poiId)
  {
    var rows = await db.PoiProducts.AsNoTracking().Where(x => x.PoiId == poiId)
      .Select(x => new {
        id = x.Id.ToString(),
        poiId = x.PoiId,
        name = x.ProductName,
        price = x.Price,
        nameEn = x.ProductNameEn,
        nameJa = x.ProductNameJa,
        nameKo = x.ProductNameKo,
        nameZh = x.ProductNameZh
      }).ToListAsync();
    return Ok(ApiResponseFactory.Ok(new { products = rows }));
  }

  [HttpPost("pois/{poiId}/products")]
  public async Task<IActionResult> AddPoiProduct(string poiId, [FromBody] ProductRequest request)
  {
    var product = new PoiProduct
    {
      PoiId = poiId,
      ProductName = request.Name.Trim(),
      Price = request.Price,
      ProductNameEn = request.NameEn,
      ProductNameJa = request.NameJa,
      ProductNameKo = request.NameKo,
      ProductNameZh = request.NameZh
    };
    db.PoiProducts.Add(product); 
    await translationService.AutoLocalizeProductAsync(product);
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new {
      id = product.Id.ToString(),
      name = product.ProductName,
      price = product.Price,
      nameEn = product.ProductNameEn,
      nameJa = product.ProductNameJa,
      nameKo = product.ProductNameKo,
      nameZh = product.ProductNameZh
    }));
  }

  [HttpPut("pois/{poiId}/products/{productId:int}")]
  public async Task<IActionResult> UpdatePoiProduct(string poiId, int productId, [FromBody] ProductRequest request)
  {
    var product = await db.PoiProducts.FirstOrDefaultAsync(x => x.Id == productId && x.PoiId == poiId);
    if (product == null) return NotFound(ApiResponseFactory.Fail("product.not_found"));
    product.ProductName = request.Name.Trim();
    product.Price = request.Price;
    product.ProductNameEn = request.NameEn;
    product.ProductNameJa = request.NameJa;
    product.ProductNameKo = request.NameKo;
    product.ProductNameZh = request.NameZh;
    await translationService.AutoLocalizeProductAsync(product);
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new {
      id = product.Id.ToString(),
      name = product.ProductName,
      price = product.Price,
      nameEn = product.ProductNameEn,
      nameJa = product.ProductNameJa,
      nameKo = product.ProductNameKo,
      nameZh = product.ProductNameZh
    }));
  }

  [HttpDelete("pois/{poiId}/products/{productId:int}")]
  public async Task<IActionResult> DeletePoiProduct(string poiId, int productId)
  {
    var product = await db.PoiProducts.FirstOrDefaultAsync(x => x.Id == productId && x.PoiId == poiId);
    if (product == null) return NotFound(ApiResponseFactory.Fail("product.not_found"));
    db.PoiProducts.Remove(product);
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(true));
  }

  [HttpPost("stall")]
  [HttpPut("stall/submit")]
  [RequestSizeLimit(5 * 1024 * 1024 + 32_768)]
  public async Task<IActionResult> UpdateStall([FromForm] VendorStallRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Name))
      return BadRequest(ApiResponseFactory.Fail("stall.name_required"));
    if (!decimal.TryParse(request.Latitude, NumberStyles.Float, CultureInfo.InvariantCulture, out var latitude) ||
        !decimal.TryParse(request.Longitude, NumberStyles.Float, CultureInfo.InvariantCulture, out var longitude) ||
        latitude is < -90 or > 90 || longitude is < -180 or > 180)
      return BadRequest(ApiResponseFactory.Fail("stall.invalid_coordinates"));

    string? storedName = null;
    if (request.Image is not null)
    {
      storedName = await StoreFileAsync(request.Image, ["image/png", "image/jpeg", "image/webp"], [".png", ".jpg", ".jpeg", ".webp"], "vendor");
    }
    var submittedCoverUrl = string.IsNullOrWhiteSpace(request.CoverUrl)
      ? null
      : request.CoverUrl.Trim();

    var vendor = await db.Vendors.SingleOrDefaultAsync(v => v.Id == VendorId);
    if (vendor == null) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));

    var poi = string.IsNullOrWhiteSpace(request.PoiId)
      ? await db.Pois.FirstOrDefaultAsync(p => p.VendorId == VendorId)
      : await db.Pois.FirstOrDefaultAsync(p => p.Id == request.PoiId && p.VendorId == VendorId);
    if (!string.IsNullOrWhiteSpace(request.PoiId) && poi is null)
      return NotFound(ApiResponseFactory.Fail("poi.not_found"));
    var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
    if (poi == null)
    {
      poi = new Poi
      {
        Id = Guid.NewGuid().ToString("N"),
        VendorId = VendorId,
        FestivalZoneId = vendor.FestivalZoneId,
        StallName = "", // Empty for new stall until approved
        Description = "",
        CoverUrl = null,
        Latitude = (double)latitude,
        Longitude = (double)longitude,
        Status = "ACTIVE",
        ApprovalStatus = "PENDING",
        PendingName = request.Name.Trim(),
        PendingDescription = request.Description,
        PendingCoverUrl = storedName is null ? submittedCoverUrl : $"/uploads/vendor/{storedName}",
        PendingLatitude = (double)latitude,
        PendingLongitude = (double)longitude,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
      };
      db.Pois.Add(poi);
    }
    else
    {
      poi.PendingName = request.Name.Trim();
      poi.PendingDescription = request.Description;
      poi.PendingLatitude = (double)latitude;
      poi.PendingLongitude = (double)longitude;
      if (storedName is not null)
      {
        var oldPendingCover = poi.PendingCoverUrl;
        poi.PendingCoverUrl = $"/uploads/vendor/{storedName}";
        if (!string.IsNullOrEmpty(oldPendingCover) && oldPendingCover != poi.CoverUrl)
        {
          FileCleanupHelper.DeletePhysicalFile(oldPendingCover, webRoot);
        }
      }
      else
      {
        // An empty file input must never erase an already persisted image path.
        poi.PendingCoverUrl = submittedCoverUrl ?? poi.PendingCoverUrl ?? poi.CoverUrl;
      }
      poi.ApprovalStatus = "PENDING";
      poi.UpdatedAt = DateTime.UtcNow;
    }
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new
    {
      submitted = true,
      approvalStatus = "PENDING",
      coverUrl = poi.PendingCoverUrl ?? poi.CoverUrl
    }));
  }

  [HttpPost("stalls")]
  public async Task<IActionResult> CreateStall([FromBody] VendorStallCreateRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Name))
      return BadRequest(ApiResponseFactory.Fail("stall.name_required"));
    if (request.Latitude is < -90 or > 90 || request.Longitude is < -180 or > 180)
      return BadRequest(ApiResponseFactory.Fail("stall.invalid_coordinates"));

    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    await DatabaseSql.QueryRowsAsync(db, "SELECT id FROM Vendors WHERE id=@vendorId FOR UPDATE",
      new Dictionary<string, object?> { ["@vendorId"] = VendorId });
    var vendor = await db.Vendors.SingleOrDefaultAsync(x => x.Id == VendorId);
    if (vendor is null) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));
    var currentCount = await db.Pois.CountAsync(x => x.VendorId == VendorId);
    if (currentCount >= 3)
      return Conflict(ApiResponseFactory.Fail("Mỗi Vendor chỉ được quản lý tối đa 3 POI."));

    var poi = new Poi
    {
      Id = Guid.NewGuid().ToString("N"),
      FestivalZoneId = vendor.FestivalZoneId,
      VendorId = VendorId,
      StallName = request.Name.Trim(),
      Slug = $"stall-{Guid.NewGuid():N}",
      Description = request.Description?.Trim(),
      Latitude = (double)request.Latitude,
      Longitude = (double)request.Longitude,
      TriggerRadius = vendor.IsPremium ? 10 : 3,
      ApprovalStatus = "PENDING",
      Status = "ACTIVE",
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };
    db.Pois.Add(poi);
    await db.SaveChangesAsync();
    await transaction.CommitAsync();
    return Ok(ApiResponseFactory.Ok(new
    {
      id = poi.Id,
      stallCount = currentCount + 1,
      maxStalls = 3,
      approvalStatus = poi.ApprovalStatus
    }));
  }

  [HttpGet("wallet")]
  public async Task<IActionResult> Wallet()
  {
    var wallet = await db.Wallets.AsNoTracking().SingleAsync(x => x.VendorId == VendorId);
    return Ok(ApiResponseFactory.Ok(new { id = wallet.Id, balance = wallet.Balance, totalTopUp = wallet.TotalTopUp, totalSpent = wallet.TotalSpent }));
  }

  [HttpGet("wallet/transactions")]
  public async Task<IActionResult> Transactions()
  {
    var rows = await db.WalletTransactions.AsNoTracking().Where(x => x.VendorId == VendorId)
      .OrderByDescending(x => x.CreatedAt).Take(100)
      .Select(x => new { id = x.Id, type = x.TransactionType, category = x.TransactionCategory,
        direction = x.Direction, x.Amount, x.BalanceBefore, x.BalanceAfter, x.Description, x.CreatedAt }).ToListAsync();
    return Ok(ApiResponseFactory.Ok(rows));
  }

  [HttpGet("products")]
  public async Task<IActionResult> Products()
  {
    var rows = await db.PoiProducts.AsNoTracking().Where(x => x.Poi.VendorId == VendorId)
      .Select(x => new {
        id = x.Id.ToString(),
        poiId = x.PoiId,
        name = x.ProductName,
        price = x.Price,
        nameEn = x.ProductNameEn,
        nameJa = x.ProductNameJa,
        nameKo = x.ProductNameKo,
        nameZh = x.ProductNameZh
      }).ToListAsync();
    return Ok(ApiResponseFactory.Ok(rows));
  }

  [HttpPost("products")]
  public async Task<IActionResult> AddProduct([FromBody] ProductRequest request)
  {
    var poi = await db.Pois.FirstOrDefaultAsync(x => x.VendorId == VendorId);
    if (poi == null) return NotFound(ApiResponseFactory.Fail("poi.not_found"));
    var product = new PoiProduct
    {
      PoiId = poi.Id,
      ProductName = request.Name.Trim(),
      Price = request.Price,
      ProductNameEn = request.NameEn,
      ProductNameJa = request.NameJa,
      ProductNameKo = request.NameKo,
      ProductNameZh = request.NameZh
    };
    db.PoiProducts.Add(product);
    await translationService.AutoLocalizeProductAsync(product);
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new {
      id = product.Id.ToString(),
      name = product.ProductName,
      price = product.Price,
      nameEn = product.ProductNameEn,
      nameJa = product.ProductNameJa,
      nameKo = product.ProductNameKo,
      nameZh = product.ProductNameZh
    }));
  }

  [HttpDelete("products/{id:int}")]
  public async Task<IActionResult> DeleteProduct(int id)
  {
    var product = await db.PoiProducts.Include(p => p.Poi).SingleOrDefaultAsync(x => x.Id == id && x.Poi.VendorId == VendorId);
    if (product == null) return NotFound(ApiResponseFactory.Fail("product.not_found"));
    db.PoiProducts.Remove(product); await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(true));
  }

  [HttpPost("pay-subscription")]
  [HttpPost("stalls/pay-subscription")]
  public async Task<IActionResult> PaySubscription()
  {
    try
    {
      var result = await DebitWalletAsync("WEBAPP_MONTHLY_RENT");
      return Ok(new
      {
        success = true,
        message = "Thanh toán gói gia hạn sạp hàng thành công!",
        data = result
      });
    }
    catch (InvalidOperationException exception) when (exception.Message == "wallet.insufficient_balance")
    {
      logger.LogWarning(
        "[WALLET BOUNDARY ENFORCED] Vendor {VendorId} attempted a subscription purchase with insufficient balance.",
        VendorId);
      return StatusCode(StatusCodes.Status402PaymentRequired, new
      {
        success = false,
        errorCode = "INSUFFICIENT_BALANCE",
        message = "Số dư tài khoản trong ví không đủ. Vui lòng nạp thêm tiền để thực hiện giao dịch này!"
      });
    }
    catch (Exception exception)
    {
      logger.LogError(exception, "Subscription payment failed safely for Vendor {VendorId}.", VendorId);
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        success = false,
        errorCode = "PAYMENT_PROCESSING_FAILED",
        message = "Hệ thống thanh toán đang bận. Vui lòng thử lại sau."
      });
    }
  }

  [HttpPost("premium/request")]
  public async Task<IActionResult> Premium() =>
    Ok(ApiResponseFactory.Ok(await DebitWalletAsync("PREMIUM_UPGRADE")));

  [HttpPost("topups")]
  [RequestSizeLimit(5 * 1024 * 1024 + 32_768)]
  public async Task<IActionResult> TopUp([FromForm] TopUpRequest request)
  {
    if (request.Amount <= 0)
      return BadRequest(ApiResponseFactory.Fail("topup.invalid_amount"));

    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    await DatabaseSql.QueryRowsAsync(db,
      "SELECT id FROM Vendors WHERE id=@vendorId FOR UPDATE",
      new Dictionary<string, object?> { ["@vendorId"] = VendorId });
    var pending = await DatabaseSql.QueryRowsAsync(db, """
      SELECT id FROM top_up_requests
      WHERE vendor_id=@vendorId AND status='PENDING'
      ORDER BY created_at DESC LIMIT 1
      """, new Dictionary<string, object?> { ["@vendorId"] = VendorId });
    if (pending.Count > 0)
      return Conflict(ApiResponseFactory.Fail(
        "Hệ thống đang xử lý giao dịch nạp tiền trước đó. Vui lòng chờ Admin xác minh."));

    var fileName = await StoreFileAsync(request.Proof, ["image/png", "image/jpeg", "image/webp"], [".png", ".jpg", ".jpeg", ".webp"], "vendor");
    var wallet = await db.Wallets.SingleAsync(x => x.VendorId == VendorId);
    await DatabaseSql.ExecuteAsync(db, """
      INSERT INTO top_up_requests(id, vendor_id,wallet_id,provider,status,amount,proof_url,note)
      VALUES(@id, @vendorId,@walletId,'BANK_QR','PENDING',@amount,@fileName,@note)
      """, new Dictionary<string, object?>
      {
        ["@id"] = Guid.NewGuid().ToString("N"),
        ["@vendorId"] = VendorId,
        ["@walletId"] = wallet.Id,
        ["@amount"] = request.Amount,
        ["@fileName"] = $"/uploads/vendor/{fileName}",
        ["@note"] = request.Note
      });
    await transaction.CommitAsync();

    try
    {
      await hubContext.Clients.All.SendAsync("ReceiveNotification", new
      {
        type = "TOPUP_NEW",
        title = "Yêu cầu nạp tiền mới",
        message = $"Vendor đã yêu cầu nạp {request.Amount:N0} VND."
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
    var wallet = await db.Wallets
      .FromSqlInterpolated($"SELECT * FROM vendor_wallets WHERE vendor_id={VendorId} FOR UPDATE")
      .SingleAsync();
    decimal fee = category == "PREMIUM_UPGRADE" ? 599000m : 199000m;

    Console.WriteLine(
      $"[WALLET DEBIT EVALUATION]: Vendor: {VendorId} | Current Balance: {wallet.Balance} | Required Cost: {fee}");
    if (wallet.Balance < fee)
    {
      throw new InvalidOperationException("wallet.insufficient_balance");
    }
    var before = wallet.Balance; wallet.Balance -= fee; wallet.TotalSpent += fee;
    db.WalletTransactions.Add(new WalletTransaction
    {
      Id = Guid.NewGuid().ToString("N"),
      WalletId = wallet.Id, VendorId = VendorId, TransactionType = "FEE", TransactionCategory = category,
      Direction = "DEBIT", Amount = fee, BalanceBefore = before, BalanceAfter = wallet.Balance,
      Description = category == "PREMIUM_UPGRADE" ? "Phí nâng cấp Premium" : "Phí thuê WebApp hàng tháng",
      CreatedAt = DateTime.UtcNow
    });
    
    if (category == "PREMIUM_UPGRADE")
    {
      await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE Vendors SET is_premium=1, premium_activation_date=NOW(), premium_expiry_date=DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id={VendorId}");
      await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE Pois SET is_premium_priority=1, trigger_radius=10.0 WHERE vendor_id={VendorId}");
    }
    else if (category == "WEBAPP_MONTHLY_RENT")
    {
      await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE Vendors SET subscription_expiry_date=DATE_ADD(COALESCE(subscription_expiry_date, NOW()), INTERVAL 30 DAY) WHERE id={VendorId}");
    }
    
    var saved = await db.SaveChangesAsync();
    if (saved == 0)
    {
      throw new InvalidOperationException("wallet.transaction_not_saved");
    }
    await transaction.CommitAsync();
    return new { paid = true, category, amount = fee, balanceAfter = wallet.Balance };
  }

  private async Task<string> PrimaryStallIdAsync()
  {
    var stall = await db.Pois.AsNoTracking().FirstOrDefaultAsync(x => x.VendorId == VendorId);
    return stall?.Id ?? "";
  }

  private async Task<string> StoreFileAsync(IFormFile file, string[] mimeTypes, string[] extensions, string folder)
  {
    if (file.Length is <= 0 or > 5 * 1024 * 1024) throw new InvalidOperationException("upload.invalid_size");
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!mimeTypes.Contains(file.ContentType) || !extensions.Contains(extension)) throw new InvalidOperationException("upload.invalid_type");
    if (!await FileSignatureValidator.IsValidAsync(file, extension)) throw new InvalidOperationException("upload.invalid_signature");
    var name = $"{Guid.NewGuid():N}{extension}";
    var target = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads", folder);
    Directory.CreateDirectory(target);
    await using var stream = System.IO.File.Create(Path.Combine(target, name));
    await file.CopyToAsync(stream);
    return name;
  }
}

public sealed record VendorProfileRequest(string TradeName, string ContactEmail);
public sealed record VendorStallRequest(
  string Name,
  string? Description,
  string Latitude,
  string Longitude,
  string? CoverUrl,
  IFormFile? Image,
  string? PoiId = null);
public sealed record VendorStallCreateRequest(string Name, string? Description, decimal Latitude, decimal Longitude);
public sealed record ProductRequest(
  string Name,
  decimal Price,
  string? NameEn = null,
  string? NameJa = null,
  string? NameKo = null,
  string? NameZh = null);
public sealed record TopUpRequest(decimal Amount, string? Note, IFormFile Proof);
public sealed record VendorContentRequest(string TtsScript, string Language = "vi");
public sealed record LocationRequest(decimal Latitude, decimal Longitude);
public sealed record VendorChangePasswordRequest(string CurrentPassword, string NewPassword);
public sealed record VendorTicketRequest(string Subject, string Message);
public sealed record PoiUpdateRequest(string? PoiId, string? Name, string? Description, decimal? Latitude, decimal? Longitude);
public sealed record UnifiedStallUpdateDto(
  string Id,
  string StallName,
  string? Description,
  double Latitude,
  double Longitude,
  string? CoverUrl,
  string? StallNameEn = null,
  string? StallNameJa = null,
  string? StallNameKo = null,
  string? StallNameZh = null,
  string? DescriptionEn = null,
  string? DescriptionJa = null,
  string? DescriptionKo = null,
  string? DescriptionZh = null);
public sealed record VendorTranslationRequest(string Text, string[] TargetLangs);
