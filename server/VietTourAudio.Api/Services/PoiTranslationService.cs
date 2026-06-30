using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using VietTourAudio.Api.Domain;

namespace VietTourAudio.Api.Services;

/// <summary>
/// Background auto-translation service that translates Vietnamese stall names and descriptions
/// into English, Japanese, Korean, and Chinese using the Google Translate public endpoint.
/// </summary>
public sealed class PoiTranslationService(IHttpClientFactory httpClientFactory)
{
  private static readonly (string lang, string code)[] TargetLanguages =
  [
    ("en", "en"),
    ("ja", "ja"),
    ("ko", "ko"),
    ("zh", "zh-CN")
  ];

  /// <summary>
  /// Translates StallName and Description from Vietnamese into 4 target languages.
  /// Writes directly into the Poi entity's localized properties.
  /// This method is fire-and-forget safe — all exceptions are caught and logged.
  /// </summary>
  public async Task AutoLocalizeAsync(Poi poi)
  {
    if (string.IsNullOrWhiteSpace(poi.StallName) && string.IsNullOrWhiteSpace(poi.Description))
      return;

    var client = httpClientFactory.CreateClient();
    client.Timeout = TimeSpan.FromSeconds(15);

    try
    {
      // Translate StallName
      if (!string.IsNullOrWhiteSpace(poi.StallName))
      {
        if (string.IsNullOrWhiteSpace(poi.StallNameEn)) poi.StallNameEn = await FetchTranslationAsync(client, poi.StallName, "vi", "en");
        if (string.IsNullOrWhiteSpace(poi.StallNameJa)) poi.StallNameJa = await FetchTranslationAsync(client, poi.StallName, "vi", "ja");
        if (string.IsNullOrWhiteSpace(poi.StallNameKo)) poi.StallNameKo = await FetchTranslationAsync(client, poi.StallName, "vi", "ko");
        if (string.IsNullOrWhiteSpace(poi.StallNameZh)) poi.StallNameZh = await FetchTranslationAsync(client, poi.StallName, "vi", "zh-CN");
      }

      // Translate Description
      if (!string.IsNullOrWhiteSpace(poi.Description))
      {
        if (string.IsNullOrWhiteSpace(poi.DescriptionEn)) poi.DescriptionEn = await FetchTranslationAsync(client, poi.Description, "vi", "en");
        if (string.IsNullOrWhiteSpace(poi.DescriptionJa)) poi.DescriptionJa = await FetchTranslationAsync(client, poi.Description, "vi", "ja");
        if (string.IsNullOrWhiteSpace(poi.DescriptionKo)) poi.DescriptionKo = await FetchTranslationAsync(client, poi.Description, "vi", "ko");
        if (string.IsNullOrWhiteSpace(poi.DescriptionZh)) poi.DescriptionZh = await FetchTranslationAsync(client, poi.Description, "vi", "zh-CN");
      }

      Console.WriteLine($"[TRANSLATION SUCCESS]: 5-Language dictionary generated for Stall: {poi.StallName}");
    }
    catch (Exception ex)
    {
      Console.WriteLine($"[TRANSLATION WARNING]: Translation pipeline slipped, falling back to default text: {ex.Message}");
      // Fail-safe: Fallback to original Vietnamese text to prevent null display
      poi.StallNameEn ??= poi.StallName;
      poi.StallNameJa ??= poi.StallName;
      poi.StallNameKo ??= poi.StallName;
      poi.StallNameZh ??= poi.StallName;
      poi.DescriptionEn ??= poi.Description;
      poi.DescriptionJa ??= poi.Description;
      poi.DescriptionKo ??= poi.Description;
      poi.DescriptionZh ??= poi.Description;
    }
  }

  /// <summary>
  /// Auto-translates a product name if translated columns are empty.
  /// </summary>
  public async Task AutoLocalizeProductAsync(PoiProduct product)
  {
    if (string.IsNullOrWhiteSpace(product.ProductName))
      return;

    var client = httpClientFactory.CreateClient();
    client.Timeout = TimeSpan.FromSeconds(15);

    try
    {
      if (string.IsNullOrWhiteSpace(product.ProductNameEn)) product.ProductNameEn = await FetchTranslationAsync(client, product.ProductName, "vi", "en");
      if (string.IsNullOrWhiteSpace(product.ProductNameJa)) product.ProductNameJa = await FetchTranslationAsync(client, product.ProductName, "vi", "ja");
      if (string.IsNullOrWhiteSpace(product.ProductNameKo)) product.ProductNameKo = await FetchTranslationAsync(client, product.ProductName, "vi", "ko");
      if (string.IsNullOrWhiteSpace(product.ProductNameZh)) product.ProductNameZh = await FetchTranslationAsync(client, product.ProductName, "vi", "zh-CN");

      Console.WriteLine($"[TRANSLATION SUCCESS]: 5-Language dictionary generated for Product: {product.ProductName}");
    }
    catch (Exception ex)
    {
      Console.WriteLine($"[TRANSLATION WARNING]: Product translation pipeline slipped: {ex.Message}");
      product.ProductNameEn ??= product.ProductName;
      product.ProductNameJa ??= product.ProductName;
      product.ProductNameKo ??= product.ProductName;
      product.ProductNameZh ??= product.ProductName;
    }
  }

  /// <summary>
  /// Fetches a single translation from the Google Translate public endpoint.
  /// Returns translated text or falls back to the original text on failure.
  /// </summary>
  private static async Task<string> FetchTranslationAsync(HttpClient client, string text, string from, string to)
  {
    if (string.IsNullOrWhiteSpace(text)) return "";

    var url = $"https://translate.googleapis.com/translate_a/single?client=gtx&sl={from}&tl={to}&dt=t&q={Uri.EscapeDataString(text)}";
    var response = await client.GetStringAsync(url);

    // Parse the nested JSON array returned by the public translation endpoint
    // Structure: [[[translatedText, originalText, ...], ...], ...]
    var jsonArray = JsonDocument.Parse(response).RootElement;
    var translated = string.Concat(
      jsonArray[0].EnumerateArray()
        .Select(segment => segment[0].ValueKind == JsonValueKind.String ? segment[0].GetString() : "")
    );

    return string.IsNullOrWhiteSpace(translated) ? text : translated;
  }
}
