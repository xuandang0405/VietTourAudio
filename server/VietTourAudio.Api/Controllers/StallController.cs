using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/stalls")]
public class StallController : ControllerBase
{
  private readonly IStallService _stallService;
  private readonly IPoiService _poiService;

  public StallController(IStallService stallService, IPoiService poiService)
  {
    _stallService = stallService;
    _poiService = poiService;
  }

  [HttpGet]
  public async Task<IActionResult> GetAll()
  {
    var result = await _stallService.GetStallsAsync();
    return Ok(ApiResponseFactory.Ok(result, "Danh sách sạp."));
  }

  [HttpGet("{id:long}")]
  public async Task<IActionResult> GetById(ulong id)
  {
    var result = await _stallService.GetByIdAsync(id);
    return Ok(ApiResponseFactory.Ok(result, "Chi tiết sạp."));
  }

  [HttpPost]
  public async Task<IActionResult> Create([FromBody] StallRequestDto request)
  {
    var result = await _stallService.CreateAsync(request);
    return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponseFactory.Ok(result, "Tạo sạp thành công."));
  }

  [HttpPost("{id:long}/approve")]
  public async Task<IActionResult> Approve(ulong id)
  {
    var result = await _stallService.UpdateStatusAsync(id, "APPROVED");
    return Ok(ApiResponseFactory.Ok(result, "Đã duyệt sạp."));
  }

  [HttpPost("{id:long}/suspend")]
  public async Task<IActionResult> Suspend(ulong id)
  {
    var result = await _stallService.UpdateStatusAsync(id, "SUSPENDED");
    return Ok(ApiResponseFactory.Ok(result, "Đã tạm khóa sạp."));
  }

  [HttpGet("/api/guest/resolve-code/{code}")]
  public async Task<IActionResult> ResolveCode(string code)
  {
    var stall = await _stallService.GetByZoneCodeAsync(code);
    if (stall == null)
    {
      return NotFound(ApiResponseFactory.Fail("Mã khu vực không hợp lệ hoặc không tồn tại."));
    }
    var pois = await _poiService.GetPoisAsync(stall.Id);
    return Ok(ApiResponseFactory.Ok(new { Stall = stall, Pois = pois }, "Tìm thấy thông tin sạp và điểm tham quan."));
  }
}
