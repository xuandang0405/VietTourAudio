using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
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
  public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string? folder)
  {
    if (file.Length is <= 0 or > 5 * 1024 * 1024) return BadRequest(ApiResponseFactory.Fail("upload.invalid_size"));
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    var allowed = new Dictionary<string, string[]>
    {
      [".png"] = ["image/png", "application/octet-stream"],
      [".jpg"] = ["image/jpeg", "application/octet-stream"],
      [".jpeg"] = ["image/jpeg", "application/octet-stream"],
      [".jfif"] = ["image/jpeg", "image/jfif", "application/octet-stream"],
      [".webp"] = ["image/webp", "application/octet-stream"],
      [".mp3"] = ["audio/mpeg", "application/octet-stream"],
      [".wav"] = ["audio/wav", "audio/x-wav", "application/octet-stream"]
    };
    if (!allowed.TryGetValue(extension, out var mimes) || !mimes.Contains(file.ContentType))
      return BadRequest(ApiResponseFactory.Fail("upload.invalid_type"));
    if (!await FileSignatureValidator.IsValidAsync(file, extension))
      return BadRequest(ApiResponseFactory.Fail("upload.invalid_signature"));

    var subfolder = "media";
    if (!string.IsNullOrEmpty(folder))
    {
      var clean = folder.Trim().ToLowerInvariant();
      if (clean is "zones" or "vendor" or "settings" or "qr" or "receipts" or "media" or "pois")
      {
        subfolder = clean == "pois" ? "vendor" : clean;
      }
      else
      {
        return BadRequest(ApiResponseFactory.Fail("upload.invalid_folder"));
      }
    }

    var fileName = $"{Guid.NewGuid():N}{extension}";
    var folderPath = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads", subfolder);
    Directory.CreateDirectory(folderPath);
    var physicalPath = Path.Combine(folderPath, fileName);

    if (new[] { ".png", ".jpg", ".jpeg", ".jfif", ".webp" }.Contains(extension))
    {
      try
      {
        using var stream = file.OpenReadStream();
        using var image = await Image.LoadAsync(stream);
        
        // 1. Auto rotate according to EXIF orientation metadata
        image.Mutate(x => x.AutoOrient());
        
        // 2. Resize keeping original aspect ratio if width exceeds 1920
        if (image.Width > 1920)
        {
          image.Mutate(x => x.Resize(new ResizeOptions
          {
            Size = new Size(1920, 0),
            Mode = ResizeMode.Max
          }));
        }
        
        // 3. Strip all EXIF / GPS / IPTC metadata to remove location details
        image.Metadata.ExifProfile = null;
        image.Metadata.IptcProfile = null;
        image.Metadata.XmpProfile = null;
        
        // 4. Save with appropriate compression encoder
        IImageEncoder encoder = extension switch
        {
          ".jpg" or ".jpeg" or ".jfif" => new JpegEncoder { Quality = 75 },
          ".webp" => new WebpEncoder { Quality = 75 },
          _ => new PngEncoder()
        };
        
        await image.SaveAsync(physicalPath, encoder);
      }
      catch (Exception)
      {
        // Fallback to saving raw file if processing fails
        await using var fallbackStream = System.IO.File.Create(physicalPath);
        await file.CopyToAsync(fallbackStream);
      }
    }
    else
    {
      // Non-image files saved directly
      await using var saveStream = System.IO.File.Create(physicalPath);
      await file.CopyToAsync(saveStream);
    }

    return Ok(ApiResponseFactory.Ok(new { fileName, url = $"/uploads/{subfolder}/{fileName}", size = file.Length }));
  }
}
