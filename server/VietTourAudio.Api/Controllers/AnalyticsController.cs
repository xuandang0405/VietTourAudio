using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
  private readonly IAnalyticsService _analyticsService;
  private readonly IQrTrackingService _qrTrackingService;

  public AnalyticsController(IAnalyticsService analyticsService, IQrTrackingService qrTrackingService)
  {
    _analyticsService = analyticsService;
    _qrTrackingService = qrTrackingService;
  }

  [Authorize(Roles = "ADMIN,STALL_OWNER")]
  [HttpGet("summary")]
  public async Task<IActionResult> Summary()
  {
    var result = await _analyticsService.GetSummaryAsync();
    return Ok(ApiResponseFactory.Ok(result, "Tổng quan thống kê."));
  }

  [Authorize(Roles = "STALL_OWNER")]
  [HttpGet("stall-owner-dashboard")]
  public async Task<IActionResult> StallOwnerDashboard()
  {
    try
    {
      var result = await _analyticsService.GetStallOwnerDashboardAsync();
      return Ok(ApiResponseFactory.Ok(result, "Dashboard chủ sạp."));
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [HttpPost("visit")]
  public async Task<IActionResult> Visit([FromBody] VisitEventRequestDto request)
  {
    var result = await _analyticsService.TrackVisitAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Đã ghi nhận lượt truy cập."));
  }

  [HttpPost("qr-scan")]
  public async Task<IActionResult> QrScan([FromBody] QrScanRequestDto request)
  {
    var result = await _qrTrackingService.TrackScanAsync(
      request,
      HttpContext.Connection.RemoteIpAddress?.ToString(),
      Request.Headers.UserAgent.ToString()
    );
    return Ok(ApiResponseFactory.Ok(result, "Đã ghi nhận lượt quét QR."));
  }

  [HttpPost("audio-play")]
  public async Task<IActionResult> AudioPlay([FromBody] AudioPlayRequestDto request)
  {
    var result = await _analyticsService.TrackAudioPlayAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Đã ghi nhận lượt nghe audio."));
  }
}
