using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Domain;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/stalls")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminStallController(
  AppDbContext db,
  IWebHostEnvironment environment,
  VietTourAudio.Api.Services.PoiTranslationService translationService) : ControllerBase
{
  [HttpPost("grant-multi-premium")]
  public async Task<IActionResult> GrantMultiPremium([FromBody] GrantMultiPremiumRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.VendorId))
      return BadRequest(ApiResponseFactory.Fail("vendor_id is required"));

    await DatabaseSql.ExecuteAsync(db, """
      UPDATE Vendors
      SET is_premium = 1,
          premium_activation_date = NOW(),
          premium_expiry_date = DATE_ADD(NOW(), INTERVAL 30 DAY),
          updated_at = NOW()
      WHERE id = @vendorId
      """, new Dictionary<string, object?> { ["@vendorId"] = request.VendorId });

    var affected = await DatabaseSql.ExecuteAsync(db, """
      UPDATE Pois
      SET is_premium_priority = 1,
          trigger_radius = 10.0,
          updated_at = NOW()
      WHERE vendor_id = @vendorId
      """, new Dictionary<string, object?> { ["@vendorId"] = request.VendorId });

    return Ok(ApiResponseFactory.Ok(new
    {
      updated = affected,
      vendorId = request.VendorId,
      message = $"Đã cấp Premium cho {affected} sạp hàng với thời hạn 30 ngày."
    }));
  }

  [HttpPut("{stallId}/premium-priority")]
  public async Task<IActionResult> SetPremiumPriority(string stallId, [FromBody] PremiumPriorityRequest request)
  {
    await DatabaseSql.ExecuteAsync(db, """
      UPDATE Pois
      SET is_premium_priority = 0,
          trigger_radius = 3.0,
          updated_at = NOW()
      WHERE vendor_id = @vendorId
      """, new Dictionary<string, object?> { ["@vendorId"] = request.VendorId });

    var setPriority = await DatabaseSql.ExecuteAsync(db, """
      UPDATE Pois
      SET is_premium_priority = 1,
          trigger_radius = 10.0,
          updated_at = NOW()
      WHERE id = @stallId AND vendor_id = @vendorId
      """, new Dictionary<string, object?>
      {
        ["@stallId"] = stallId,
        ["@vendorId"] = request.VendorId
      });
    if (setPriority == 0)
      return NotFound(ApiResponseFactory.Fail("stall.not_found"));

    return Ok(ApiResponseFactory.Ok(new
    {
      stallId = stallId,
      isPremiumPriority = true,
      triggerRadius = 10,
      message = "Đã chuyển đặc quyền phát Premium sang sạp được chọn."
    }));
  }

  [HttpPost("create-for-vendor")]
  public async Task<IActionResult> CreateStallForVendor([FromBody] AdminCreateStallRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Name))
      return BadRequest(ApiResponseFactory.Fail("Tên sạp không được để trống"));

    var currentCount = await db.Pois.CountAsync(x => x.VendorId == request.VendorId);
    if (currentCount >= 3)
      return Conflict(ApiResponseFactory.Fail("Vendor đã đạt giới hạn tối đa 3 sạp hàng."));

    var vendor = await db.Vendors.SingleOrDefaultAsync(x => x.Id == request.VendorId);
    if (vendor == null) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));

    string tourId = vendor.FestivalZoneId ?? "";
    if (string.IsNullOrEmpty(tourId))
    {
      var zone = await db.FestivalZones.FirstOrDefaultAsync();
      tourId = zone?.Id ?? "";
    }

    var slug = $"{Slugify(request.Name)}-{Guid.NewGuid():N}"[..Math.Min(80, Slugify(request.Name).Length + 33)];
    var poi = new Poi
    {
      Id = Guid.NewGuid().ToString("N"),
      FestivalZoneId = tourId,
      VendorId = request.VendorId,
      StallName = request.Name.Trim(),
      Slug = slug,
      Description = request.Description ?? "Sạp phụ được Admin tạo.",
      Latitude = (double)request.Latitude,
      Longitude = (double)request.Longitude,
      TriggerRadius = 3.0,
      ApprovalStatus = "APPROVED",
      Status = "ACTIVE",
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };

    db.Pois.Add(poi);
    await db.SaveChangesAsync();

    return Ok(ApiResponseFactory.Ok(new
    {
      created = true,
      vendorId = request.VendorId,
      stallCount = currentCount + 1,
      message = "Admin đã tạo sạp phụ thành công cho vendor."
    }));
  }

  [HttpGet("pending")]
  public async Task<IActionResult> GetPendingStallsForReview()
  {
    var pendingStalls = await db.Pois
      .Where(p => p.ApprovalStatus == "PENDING")
      .AsNoTracking()
      .ToListAsync();

    return Ok(ApiResponseFactory.Ok(pendingStalls.Select(x => new
    {
      id = x.Id,
      vendorId = x.VendorId,
      name = x.StallName,
      slug = x.Slug,
      description = x.Description,
      latitude = x.Latitude,
      longitude = x.Longitude,
      coverUrl = x.CoverUrl,
      approvalStatus = x.ApprovalStatus,
      isPremium = x.IsPremiumPriority,
      triggerRadius = x.TriggerRadius,
      status = x.Status,
      createdAt = x.CreatedAt,
      updatedAt = x.UpdatedAt
    })));
  }

  [HttpGet("{id}")]
  public async Task<IActionResult> GetStallDetailForAdminEdit([FromRoute] string id)
  {
    var stall = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (stall == null) 
      return NotFound(ApiResponseFactory.Fail("Không tìm thấy sạp hàng."));
    return Ok(ApiResponseFactory.Ok(new
    {
      id = stall.Id,
      vendorId = stall.VendorId,
      name = stall.StallName,
      slug = stall.Slug,
      description = stall.Description,
      latitude = stall.Latitude,
      longitude = stall.Longitude,
      coverUrl = stall.CoverUrl,
      approvalStatus = stall.ApprovalStatus,
      isPremium = stall.IsPremiumPriority,
      triggerRadius = stall.TriggerRadius,
      status = stall.Status,
      createdAt = stall.CreatedAt,
      updatedAt = stall.UpdatedAt
    }));
  }

  [HttpPost("{id}/approve")]
  public async Task<IActionResult> ApproveStall([FromRoute] string id)
  {
    var stall = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (stall == null)
      return NotFound(ApiResponseFactory.Fail("Không tìm thấy sạp hàng."));

    var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
    var oldCoverUrl = stall.CoverUrl;
    var newCoverUrl = stall.PendingCoverUrl;

    stall.StallName = stall.PendingName ?? stall.StallName;
    stall.Description = stall.PendingDescription ?? stall.Description;
    if (stall.PendingLatitude.HasValue) stall.Latitude = stall.PendingLatitude.Value;
    if (stall.PendingLongitude.HasValue) stall.Longitude = stall.PendingLongitude.Value;
    
    // Copy pending translation overrides
    stall.StallNameEn = stall.PendingNameEn ?? stall.StallNameEn;
    stall.StallNameJa = stall.PendingNameJa ?? stall.StallNameJa;
    stall.StallNameKo = stall.PendingNameKo ?? stall.StallNameKo;
    stall.StallNameZh = stall.PendingNameZh ?? stall.StallNameZh;

    stall.DescriptionEn = stall.PendingDescriptionEn ?? stall.DescriptionEn;
    stall.DescriptionJa = stall.PendingDescriptionJa ?? stall.DescriptionJa;
    stall.DescriptionKo = stall.PendingDescriptionKo ?? stall.DescriptionKo;
    stall.DescriptionZh = stall.PendingDescriptionZh ?? stall.DescriptionZh;

    if (!string.IsNullOrEmpty(newCoverUrl) && newCoverUrl != oldCoverUrl)
    {
      stall.CoverUrl = newCoverUrl;
    }

    stall.ApprovalStatus = "APPROVED";
    stall.UpdatedAt = DateTime.UtcNow;

    // Reset pending fields
    stall.PendingName = null;
    stall.PendingDescription = null;
    stall.PendingCoverUrl = null;
    stall.PendingLatitude = null;
    stall.PendingLongitude = null;
    stall.PendingNameEn = null;
    stall.PendingNameJa = null;
    stall.PendingNameKo = null;
    stall.PendingNameZh = null;
    stall.PendingDescriptionEn = null;
    stall.PendingDescriptionJa = null;
    stall.PendingDescriptionKo = null;
    stall.PendingDescriptionZh = null;

    // Run translations (fills in blanks dynamically)
    await translationService.AutoLocalizeAsync(stall);

    var saved = await db.SaveChangesAsync();
    if (saved > 0)
    {
      if (!string.IsNullOrEmpty(newCoverUrl) && newCoverUrl != oldCoverUrl)
      {
        FileCleanupHelper.DeletePhysicalFile(oldCoverUrl, webRoot);
      }
    }

    return Ok(ApiResponseFactory.Ok(new { success = true, id = id, approvalStatus = "APPROVED" }));
  }

  [HttpPost("{id}/reject")]
  public async Task<IActionResult> RejectStall([FromRoute] string id)
  {
    var stall = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (stall == null)
      return NotFound(ApiResponseFactory.Fail("Không tìm thấy sạp hàng."));

    stall.ApprovalStatus = "REJECTED";
    stall.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Ok(ApiResponseFactory.Ok(new { success = true, id = id, approvalStatus = "REJECTED" }));
  }

  private static string Slugify(string value) => StringHelpers.Slugify(value);
}

public sealed record GrantMultiPremiumRequest(string VendorId);
public sealed record PremiumPriorityRequest(string VendorId);
public sealed record AdminCreateStallRequest(string VendorId, string Name, string? Description, decimal Latitude, decimal Longitude);
