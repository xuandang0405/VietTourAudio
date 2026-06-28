namespace VietTourAudio.Api.Infrastructure;

public static class FileSignatureValidator
{
  public static async Task<bool> IsValidAsync(IFormFile file, string extension)
  {
    var header = new byte[Math.Min(12, (int)file.Length)];
    await using var input = file.OpenReadStream();
    var read = await input.ReadAsync(header);
    if (read < 3) return false;
    return extension.ToLowerInvariant() switch
    {
      ".png" => read >= 8 && header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
      ".jpg" or ".jpeg" => header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
      ".mp3" => header[..3].SequenceEqual("ID3"u8.ToArray()) || (header[0] == 0xFF && (header[1] & 0xE0) == 0xE0),
      ".wav" => read >= 12 && header[..4].SequenceEqual("RIFF"u8.ToArray()) && header[8..12].SequenceEqual("WAVE"u8.ToArray()),
      _ => false
    };
  }
}
