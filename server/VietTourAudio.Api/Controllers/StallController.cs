using Microsoft.AspNetCore.Authorization;
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
    try
    {
      var result = await _stallService.GetByIdAsync(id);
      return Ok(ApiResponseFactory.Ok(result, "Chi tiết sạp."));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize(Roles = "STALL_OWNER")]
  [HttpGet("my-stalls")]
  public async Task<IActionResult> GetMine()
  {
    var result = await _stallService.GetMyStallsAsync();
    return Ok(ApiResponseFactory.Ok(result, "Danh sách sạp của tôi."));
  }

  [Authorize(Roles = "STALL_OWNER")]
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] StallRequestDto request)
  {
    try
    {
      var result = await _stallService.CreateAsync(request);
      return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponseFactory.Ok(result, "Đã tạo sạp thành công."));
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ApiResponseFactory.Fail(ex.Message));
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize(Roles = "STALL_OWNER")]
  [HttpPut("{id:long}")]
  public async Task<IActionResult> Update(ulong id, [FromBody] StallRequestDto request)
  {
    try
    {
      var result = await _stallService.UpdateAsync(id, request);
      return Ok(ApiResponseFactory.Ok(result, "Đã cập nhật sạp thành công."));
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ApiResponseFactory.Fail(ex.Message));
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(ApiResponseFactory.Fail(ex.Message));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize(Roles = "STALL_OWNER")]
  [HttpPost("{id:long}/submit-review")]
  public async Task<IActionResult> SubmitForReview(ulong id)
  {
    try
    {
      var result = await _stallService.SubmitForReviewAsync(id);
      return Ok(ApiResponseFactory.Ok(result, "Đã gửi sạp cho admin duyệt."));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize(Roles = "ADMIN")]
  [HttpPost("{id:long}/approve")]
  public async Task<IActionResult> Approve(ulong id)
  {
    try
    {
      var result = await _stallService.UpdateStatusAsync(id, "APPROVED");
      return Ok(ApiResponseFactory.Ok(result, "Đã duyệt sạp."));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize(Roles = "ADMIN")]
  [HttpPost("{id:long}/suspend")]
  public async Task<IActionResult> Suspend(ulong id)
  {
    try
    {
      var result = await _stallService.UpdateStatusAsync(id, "SUSPENDED");
      return Ok(ApiResponseFactory.Ok(result, "Đã tạm khóa sạp."));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
  }
}
