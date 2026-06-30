using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;
using System.Threading.Tasks;

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
  public async Task<IActionResult> GetAll([FromQuery] string? stallId, [FromQuery] string? tourId, [FromQuery] string? tourSlug)
  {
    var result = await _poiService.GetPoisAsync(stallId, tourId, tourSlug);
    return Ok(ApiResponseFactory.Ok(result, "Danh sách POI."));
  }

  [HttpGet("nearby")]
  public async Task<IActionResult> GetNearby([FromQuery] decimal latitude, [FromQuery] decimal longitude, [FromQuery] int radiusMeters = 100, [FromQuery] string? tourId = null, [FromQuery] string? tourSlug = null)
  {
    var result = await _poiService.GetNearbyAsync(latitude, longitude, radiusMeters, tourId, tourSlug);
    return Ok(ApiResponseFactory.Ok(result, "Danh sách POI gần vị trí GPS."));
  }

  [HttpGet("{id}")]
  public async Task<IActionResult> GetById(string id)
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
