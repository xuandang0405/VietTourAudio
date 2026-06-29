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
  VietTourAudio.Api.Services.PoiTranslationService translationService) : ControllerBase
{
  private string VendorId => User.FindFirstValue("vendor_id") ?? throw new UnauthorizedAccessException();

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
    var stallId = await PrimaryStallIdAsync();
    var totalPois = await db.Pois.CountAsync(x => x.VendorId == VendorId);
    
    var metrics = new Dictionary<string, object?>
    {
      ["totalQrScans"] = "0",
      ["totalVisits"] = "0",
      ["totalAudioPlays"] = "0",
      ["totalUniqueVisitors"] = "0",
      ["totalPremiumConversions"] = "0",
      ["totalRevenue"] = "0",
      ["totalPois"] = totalPois
    };

    var daily = new List<object>();
    var topPois = new List<object>();
    
    return Ok(ApiResponseFactory.Ok(new
    {
      businessName = vendor.TradeName,
      walletBalance = wallet.Balance,
      metrics,
      daily,
      topPois
    }));
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
        p.pending_latitude pendingLatitude, p.pending_longitude pendingLongitude
      FROM Pois p JOIN vendors v ON v.id=p.vendor_id WHERE p.vendor_id=@vendorId
      """, new Dictionary<string, object?> { ["@vendorId"] = VendorId });
    return Ok(ApiResponseFactory.Ok(rows.Select(x => new
    {
      id = x["id"],
      name = x["name"],
      slug = x["slug"],
      description = x["description"],
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
      pendingLongitude = x["pendingLongitude"] != null ? Convert.ToDecimal(x["pendingLongitude"]) : (decimal?)null
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
        p.pending_latitude pendingLatitude, p.pending_longitude pendingLongitude
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
      pendingLongitude = x["pendingLongitude"] != null ? Convert.ToDecimal(x["pendingLongitude"]) : (decimal?)null
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
      .Select(x => new { id = x.Id.ToString(), poiId = x.PoiId, name = x.ProductName, price = x.Price }).ToListAsync();
    return Ok(ApiResponseFactory.Ok(new { products = rows }));
  }

  [HttpPost("pois/{poiId}/products")]
  public async Task<IActionResult> AddPoiProduct(string poiId, [FromBody] ProductRequest request)
  {
    var product = new PoiProduct { PoiId = poiId, ProductName = request.Name.Trim(), Price = request.Price };
    db.PoiProducts.Add(product); 
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = product.Id.ToString(), name = product.ProductName, price = product.Price }));
  }

  [HttpPut("pois/{poiId}/products/{productId:int}")]
  public async Task<IActionResult> UpdatePoiProduct(string poiId, int productId, [FromBody] ProductRequest request)
  {
    var product = await db.PoiProducts.FirstOrDefaultAsync(x => x.Id == productId && x.PoiId == poiId);
    if (product == null) return NotFound(ApiResponseFactory.Fail("product.not_found"));
    product.ProductName = request.Name.Trim();
    product.Price = request.Price;
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = product.Id.ToString(), name = product.ProductName, price = product.Price }));
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

    var vendor = await db.Vendors.SingleOrDefaultAsync(v => v.Id == VendorId);
    if (vendor == null) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));

    var poi = await db.Pois.FirstOrDefaultAsync(p => p.VendorId == VendorId);
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
        PendingCoverUrl = storedName is null ? null : $"/uploads/vendor/{storedName}",
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
        poi.PendingCoverUrl ??= poi.CoverUrl;
      }
      poi.ApprovalStatus = "PENDING";
      poi.UpdatedAt = DateTime.UtcNow;
    }
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { submitted = true, approvalStatus = "PENDING" }));
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
      .Select(x => new { id = x.Id.ToString(), poiId = x.PoiId, name = x.ProductName, x.Price }).ToListAsync();
    return Ok(ApiResponseFactory.Ok(rows));
  }

  [HttpPost("products")]
  public async Task<IActionResult> AddProduct([FromBody] ProductRequest request)
  {
    var poi = await db.Pois.FirstOrDefaultAsync(x => x.VendorId == VendorId);
    if (poi == null) return NotFound(ApiResponseFactory.Fail("poi.not_found"));
    var product = new PoiProduct { PoiId = poi.Id, ProductName = request.Name.Trim(), Price = request.Price };
    db.PoiProducts.Add(product); await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = product.Id.ToString(), name = product.ProductName, product.Price }));
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
  public async Task<IActionResult> PaySubscription() =>
    Ok(ApiResponseFactory.Ok(await DebitWalletAsync("WEBAPP_MONTHLY_RENT")));

  [HttpPost("premium/request")]
  public async Task<IActionResult> Premium() =>
    Ok(ApiResponseFactory.Ok(await DebitWalletAsync("PREMIUM_UPGRADE")));

  [HttpPost("topups")]
  [RequestSizeLimit(5 * 1024 * 1024 + 32_768)]
  public async Task<IActionResult> TopUp([FromForm] TopUpRequest request)
  {
    var fileName = await StoreFileAsync(request.Proof, ["image/png", "image/jpeg", "image/webp"], [".png", ".jpg", ".jpeg", ".webp"], "vendor");
    var wallet = await db.Wallets.SingleAsync(x => x.VendorId == VendorId);
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      INSERT INTO top_up_requests(id, vendor_id,wallet_id,provider,status,amount,proof_url,note)
      VALUES(@id, @vendorId,@walletId,'BANK_QR','PENDING',@amount,@fileName,@note)
      """;
    command.AddParameter("@id", Guid.NewGuid().ToString("N"));
    command.AddParameter("@vendorId", VendorId); command.AddParameter("@walletId", wallet.Id);
    command.AddParameter("@amount", request.Amount); command.AddParameter("@fileName", $"/uploads/vendor/{fileName}"); command.AddParameter("@note", request.Note);
    await command.ExecuteNonQueryAsync();

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
    var wallet = await db.Wallets.SingleAsync(x => x.VendorId == VendorId);
    decimal fee = category == "PREMIUM_UPGRADE" ? 599000m : 199000m;
    
    if (wallet.Balance < fee) throw new InvalidOperationException("wallet.insufficient_balance");
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
    
    var saved = await db.SaveChangesAsync();
    if (saved == 0)
    {
      await transaction.RollbackAsync();
      return StatusCode(500, ApiResponseFactory.Fail("wallet.transaction_not_saved"));
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
public sealed record VendorStallRequest(string Name, string? Description, string Latitude, string Longitude, IFormFile? Image);
public sealed record VendorStallCreateRequest(string Name, string? Description, decimal Latitude, decimal Longitude);
public sealed record ProductRequest(string Name, decimal Price);
public sealed record TopUpRequest(decimal Amount, string? Note, IFormFile Proof);
public sealed record VendorContentRequest(string TtsScript, string Language = "vi");
public sealed record LocationRequest(decimal Latitude, decimal Longitude);
public sealed record PoiUpdateRequest(string? PoiId, string? Name, string? Description, decimal? Latitude, decimal? Longitude);
public sealed record VendorTranslationRequest(string Text, string[] TargetLangs);
