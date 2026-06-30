using System;
using System.IO;

namespace VietTourAudio.Api.Helpers;

public static class FileCleanupHelper
{
  public static void DeletePhysicalFile(string? relativeUrl, string webRootPath)
  {
    if (string.IsNullOrEmpty(relativeUrl)) return;

    // Do not delete default images or fallbacks
    if (relativeUrl.Contains("default-poi.png", StringComparison.OrdinalIgnoreCase) ||
        relativeUrl.Contains("qr_fallback.svg", StringComparison.OrdinalIgnoreCase))
    {
      return;
    }

    // Only allow deleting files residing inside '/uploads/'
    if (!relativeUrl.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
    {
      return;
    }

    try
    {
      var relativePath = relativeUrl.TrimStart('/');
      var physicalPath = Path.Combine(webRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));
      if (File.Exists(physicalPath))
      {
        File.Delete(physicalPath);
      }
    }
    catch (Exception ex)
    {
      Console.WriteLine($"[Warning] Failed to delete physical file {relativeUrl}: {ex.Message}");
    }
  }
}
