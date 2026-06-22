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

  [HttpGet("nearby")]
  public async Task<IActionResult> GetNearby([FromQuery] decimal latitude, [FromQuery] decimal longitude, [FromQuery] int radiusMeters = 100)
  {
    var result = await _poiService.GetNearbyAsync(latitude, longitude, radiusMeters);
    return Ok(ApiResponseFactory.Ok(result, "Danh sách POI gần vị trí GPS."));
  }

  [HttpGet("{id:long}")]
  public async Task<IActionResult> GetById(ulong id)
  {
    var result = await _poiService.GetByIdAsync(id);
    return Ok(ApiResponseFactory.Ok(result, "Chi tiết POI."));
  }

  [HttpPost]
  public async Task<IActionResult> Create([FromBody] PoiRequestDto request)
  {
    var result = await _poiService.CreateAsync(request);
    return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponseFactory.Ok(result, "Tạo POI thành công."));
  }
}
