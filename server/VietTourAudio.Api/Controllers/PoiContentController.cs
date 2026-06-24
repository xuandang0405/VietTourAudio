using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

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

  [HttpGet("poi/{poiId:long}")]
  public async Task<IActionResult> GetByPoi(ulong poiId)
  {
    var result = await _poiContentService.GetByPoiAsync(poiId);
    return Ok(ApiResponseFactory.Ok(result, "Nội dung thuyết minh của POI."));
  }

  [Authorize(Roles = "STALL_OWNER,ADMIN")]
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] PoiContentRequestDto request)
  {
    var result = await _poiContentService.CreateAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Tạo nội dung thuyết minh thành công."));
  }
}
