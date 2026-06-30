using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Threading.Tasks;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public class AdminController(
  IAnalyticsService analyticsService,
  IAdminLogService adminLogService,
  IStallService stallService,
  AppDbContext db,
  IWebHostEnvironment environment,
  VietTourAudio.Api.Services.PoiTranslationService translationService) : ControllerBase
{
  [HttpGet("dashboard")]
  public async Task<IActionResult> Dashboard()
  {
    var result = await analyticsService.GetSummaryAsync();
    return Ok(ApiResponseFactory.Ok(result, "Dashboard admin."));
  }

  [HttpGet("logs")]
  public async Task<IActionResult> Logs()
  {
    var result = await adminLogService.GetLogsAsync();
    return Ok(ApiResponseFactory.Ok(result, "Nhật ký thao tác admin."));
  }

  [HttpPost("stalls/{id}/approve")]
  public async Task<IActionResult> ApproveStall(string id)
  {
    var stall = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (stall == null)
      return NotFound(ApiResponseFactory.Fail("Không tìm thấy sạp hàng cần duyệt."));

    var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
    var oldCoverUrl = stall.CoverUrl;
    var newCoverUrl = stall.PendingCoverUrl;

    stall.StallName = stall.PendingName ?? stall.StallName;
    stall.Description = stall.PendingDescription ?? stall.Description;
    if (stall.PendingLatitude.HasValue) stall.Latitude = stall.PendingLatitude.Value;
    if (stall.PendingLongitude.HasValue) stall.Longitude = stall.PendingLongitude.Value;
    
    if (!string.IsNullOrEmpty(newCoverUrl) && newCoverUrl != oldCoverUrl)
    {
      stall.CoverUrl = newCoverUrl;
    }

    stall.ApprovalStatus = "APPROVED";
    stall.Status = "ACTIVE";
    stall.UpdatedAt = DateTime.UtcNow;

    // Reset pending fields
    stall.PendingName = null;
    stall.PendingDescription = null;
    stall.PendingCoverUrl = null;
    stall.PendingLatitude = null;
    stall.PendingLongitude = null;

    // Run translations
    await translationService.AutoLocalizeAsync(stall);

    await db.SaveChangesAsync();

    if (!string.IsNullOrEmpty(newCoverUrl) && newCoverUrl != oldCoverUrl)
    {
      FileCleanupHelper.DeletePhysicalFile(oldCoverUrl, webRoot);
    }

    await adminLogService.WriteAsync("1", "APPROVE_STALL", "STALL", id, "Duyệt sạp từ API admin.");
    return Ok(ApiResponseFactory.Ok(new { success = true, id = id, approvalStatus = "APPROVED", imageUrl = stall.CoverUrl }));
  }

  [HttpPost("stalls/{id}/cancel")]
  public async Task<IActionResult> CancelStall(string id)
  {
    var result = await stallService.UpdateStatusAsync(id, "SUSPENDED");
    await adminLogService.WriteAsync("1", "SUSPEND_STALL", "STALL", id, "Tạm khóa sạp từ API admin.");
    return Ok(ApiResponseFactory.Ok(result, "Admin đã tạm khóa sạp."));
  }
}
