using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;
using System.Threading.Tasks;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/poi-contents")]
public class PoiContentController : ControllerBase
{
  private readonly IPoiContentService _poiContentService;

  public PoiContentController(IPoiContentService poiContentService)
  {
    _poiContentService = poiContentService;
  }

  [HttpGet("poi/{poiId}")]
  public async Task<IActionResult> GetByPoi(string poiId)
  {
    var result = await _poiContentService.GetByPoiAsync(poiId);
    return Ok(ApiResponseFactory.Ok(result, "Nội dung thuyết minh của POI."));
  }

  [HttpPost]
  public async Task<IActionResult> Create([FromBody] PoiContentRequestDto request)
  {
    var result = await _poiContentService.CreateAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Tạo nội dung thuyết minh thành công."));
  }
}
