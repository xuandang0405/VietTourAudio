using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
  private readonly IAnalyticsService _analyticsService;
  private readonly IAdminLogService _adminLogService;
  private readonly IStallService _stallService;

  public AdminController(IAnalyticsService analyticsService, IAdminLogService adminLogService, IStallService stallService)
  {
    _analyticsService = analyticsService;
    _adminLogService = adminLogService;
    _stallService = stallService;
  }

  [HttpGet("dashboard")]
  public async Task<IActionResult> Dashboard()
  {
    var result = await _analyticsService.GetSummaryAsync();
    return Ok(ApiResponseFactory.Ok(result, "Dashboard admin."));
  }

  [HttpGet("logs")]
  public async Task<IActionResult> Logs()
  {
    var result = await _adminLogService.GetLogsAsync();
    return Ok(ApiResponseFactory.Ok(result, "Nhật ký thao tác admin."));
  }

  [HttpPost("stalls/{id:long}/approve")]
  public async Task<IActionResult> ApproveStall(ulong id)
  {
    var result = await _stallService.UpdateStatusAsync(id, "APPROVED");
    await _adminLogService.WriteAsync(1, "APPROVE_STALL", "STALL", id, "Duyệt sạp từ API admin.");
    return Ok(ApiResponseFactory.Ok(result, "Admin đã duyệt sạp."));
  }

  [HttpPost("stalls/{id:long}/cancel")]
  public async Task<IActionResult> CancelStall(ulong id)
  {
    var result = await _stallService.UpdateStatusAsync(id, "SUSPENDED");
    await _adminLogService.WriteAsync(1, "SUSPEND_STALL", "STALL", id, "Tạm khóa sạp từ API admin.");
    return Ok(ApiResponseFactory.Ok(result, "Admin đã tạm khóa sạp."));
  }
}
