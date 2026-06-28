using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Infrastructure;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/uploads")]
[Authorize]
public sealed class UploadController(IWebHostEnvironment environment) : ControllerBase
{
  [HttpPost]
  [RequestSizeLimit(5 * 1024 * 1024 + 32_768)]
  public async Task<IActionResult> Upload(IFormFile file)
  {
    if (file.Length is <= 0 or > 5 * 1024 * 1024) return BadRequest(ApiResponseFactory.Fail("upload.invalid_size"));
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    var allowed = new Dictionary<string, string[]>
    {
      [".png"] = ["image/png"], [".jpg"] = ["image/jpeg"], [".jpeg"] = ["image/jpeg"],
      [".mp3"] = ["audio/mpeg"], [".wav"] = ["audio/wav", "audio/x-wav"]
    };
    if (!allowed.TryGetValue(extension, out var mimes) || !mimes.Contains(file.ContentType))
      return BadRequest(ApiResponseFactory.Fail("upload.invalid_type"));
    if (!await FileSignatureValidator.IsValidAsync(file, extension))
      return BadRequest(ApiResponseFactory.Fail("upload.invalid_signature"));
    var fileName = $"{Guid.NewGuid():N}{extension}";
    var folder = Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "media");
    Directory.CreateDirectory(folder);
    await using (var stream = System.IO.File.Create(Path.Combine(folder, fileName))) await file.CopyToAsync(stream);
    return Ok(ApiResponseFactory.Ok(new { fileName, url = $"/uploads/media/{fileName}", size = file.Length }));
  }
}
