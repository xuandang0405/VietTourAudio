using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/qr-codes")]
public class QrCodeController : ControllerBase
{
  private readonly IQrTrackingService _qrTrackingService;

  public QrCodeController(IQrTrackingService qrTrackingService)
  {
    _qrTrackingService = qrTrackingService;
  }

  [Authorize(Roles = "STALL_OWNER,ADMIN")]
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] QrCodeRequestDto request)
  {
    var result = await _qrTrackingService.CreateQrCodeAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Tạo QR thành công."));
  }

  [HttpPost("scan")]
  public async Task<IActionResult> Scan([FromBody] QrScanRequestDto request)
  {
    var result = await _qrTrackingService.TrackScanAsync(
      request,
      HttpContext.Connection.RemoteIpAddress?.ToString(),
      Request.Headers.UserAgent.ToString()
    );
    return Ok(ApiResponseFactory.Ok(result, "Đã ghi nhận lượt quét QR."));
  }
}
