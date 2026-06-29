using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;
using System.Threading.Tasks;

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

  [HttpGet("{id}")]
  public async Task<IActionResult> GetById(string id)
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

  [HttpPost("{id}/approve")]
  public async Task<IActionResult> Approve(string id)
  {
    var result = await _stallService.UpdateStatusAsync(id, "APPROVED");
    return Ok(ApiResponseFactory.Ok(result, "Đã duyệt sạp."));
  }

  [HttpPost("{id}/suspend")]
  public async Task<IActionResult> Suspend(string id)
  {
    var result = await _stallService.UpdateStatusAsync(id, "SUSPENDED");
    return Ok(ApiResponseFactory.Ok(result, "Đã tạm khóa sạp."));
  }

  [HttpGet("resolve-code/{code}")]
  public async Task<IActionResult> ResolveCode([FromRoute] string code)
  {
    var stall = await _stallService.GetByZoneCodeAsync(code);
    if (stall == null) return NotFound(ApiResponseFactory.Fail("Mã sạp không tồn tại."));
    return Ok(ApiResponseFactory.Ok(stall));
  }
}
