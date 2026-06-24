using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
  private readonly IMediaStorageService _mediaStorageService;

  public MediaController(IMediaStorageService mediaStorageService)
  {
    _mediaStorageService = mediaStorageService;
  }

  [Authorize(Roles = "STALL_OWNER,ADMIN")]
  [HttpPost("upload")]
  [RequestSizeLimit(100_000_000)]
  public async Task<IActionResult> Upload(
    IFormFile file,
    [FromForm] string fileType,
    [FromForm] ulong ownerId,
    [FromForm] ulong? stallId,
    [FromForm] ulong? poiId
  )
  {
    if (file.Length == 0)
    {
      return BadRequest(ApiResponseFactory.Fail("File upload không hợp lệ."));
    }

    var result = await _mediaStorageService.SaveAsync(file, fileType, ownerId, stallId, poiId);
    return Ok(ApiResponseFactory.Ok(result, "Upload media thành công."));
  }
}
