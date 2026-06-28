using System;
using System.Globalization;
using System.Text;

namespace VietTourAudio.Api.Helpers;

public static class StringHelpers
{
  public static string Slugify(string value)
  {
    if (string.IsNullOrWhiteSpace(value)) return "";
    
    // Replace custom letters first (like đ, Đ)
    var text = value.Replace("đ", "d").Replace("Đ", "D");
    
    var normalizedString = text.Normalize(NormalizationForm.FormD);
    var stringBuilder = new StringBuilder();

    foreach (var c in normalizedString)
    {
      var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
      if (unicodeCategory != UnicodeCategory.NonSpacingMark)
      {
        stringBuilder.Append(c);
      }
    }

    var clean = stringBuilder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
    var parts = clean.Split(new[] { ' ', '-', '_', '/' }, StringSplitOptions.RemoveEmptyEntries);
    var slug = string.Join('-', parts);
    
    // Remove any remaining non-alphanumeric characters except hyphens
    var sb = new StringBuilder();
    foreach (var c in slug)
    {
      if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-')
      {
        sb.Append(c);
      }
    }
    return sb.ToString();
  }
}
