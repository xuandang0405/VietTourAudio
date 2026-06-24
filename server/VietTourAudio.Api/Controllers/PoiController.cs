using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/pois")]
public class PoiController : ControllerBase
{
  private readonly IPoiService _poiService;

  public PoiController(IPoiService poiService)
  {
    _poiService = poiService;
  }

  [HttpGet]
  public async Task<IActionResult> GetAll([FromQuery] ulong? stallId)
  {
    var result = await _poiService.GetPoisAsync(stallId);
    return Ok(ApiResponseFactory.Ok(result, "Danh sách POI."));
  }

  [Authorize(Roles = "ADMIN")]
  [HttpGet("pending")]
  public async Task<IActionResult> GetPending()
  {
    var result = await _poiService.GetPendingAsync();
    return Ok(ApiResponseFactory.Ok(result, "Danh sách POI chờ duyệt."));
  }

  [HttpGet("nearby")]
  public async Task<IActionResult> GetNearby([FromQuery] decimal latitude, [FromQuery] decimal longitude, [FromQuery] int radiusMeters = 100)
  {
    var result = await _poiService.GetNearbyAsync(latitude, longitude, radiusMeters);
    return Ok(ApiResponseFactory.Ok(result, "Danh sách POI gần vị trí GPS."));
  }

  [HttpGet("{id:long}")]
  public async Task<IActionResult> GetById(ulong id)
  {
    try
    {
      var result = await _poiService.GetByIdAsync(id);
      return Ok(ApiResponseFactory.Ok(result, "Chi tiết POI."));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize(Roles = "STALL_OWNER")]
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] PoiRequestDto request)
  {
    try
    {
      var result = await _poiService.CreateAsync(request);
      return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponseFactory.Ok(result, "Đã gửi POI cho admin duyệt."));
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
  [HttpGet("my-pois")]
  public async Task<IActionResult> GetMine()
  {
    var result = await _poiService.GetMyPoisAsync();
    return Ok(ApiResponseFactory.Ok(result, "Danh sách POI của tôi."));
  }

  [Authorize(Roles = "STALL_OWNER")]
  [HttpPut("{id:long}")]
  public async Task<IActionResult> Update(ulong id, [FromBody] UpdatePoiRequestDto request)
  {
    try
    {
      var result = await _poiService.UpdateAsync(id, request);
      return Ok(ApiResponseFactory.Ok(result, "Đã cập nhật POI thành công."));
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
      var result = await _poiService.SubmitForReviewAsync(id);
      return Ok(ApiResponseFactory.Ok(result, "Đã gửi POI cho admin duyệt."));
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
      var result = await _poiService.UpdateStatusAsync(id, "ACTIVE");
      return Ok(ApiResponseFactory.Ok(result, "Đã duyệt POI."));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize(Roles = "ADMIN")]
  [HttpPost("{id:long}/reject")]
  public async Task<IActionResult> Reject(ulong id)
  {
    try
    {
      var result = await _poiService.UpdateStatusAsync(id, "REJECTED");
      return Ok(ApiResponseFactory.Ok(result, "Đã từ chối POI."));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
  }
}
