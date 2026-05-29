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

  public StallController(IStallService stallService)
  {
    _stallService = stallService;
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
}
