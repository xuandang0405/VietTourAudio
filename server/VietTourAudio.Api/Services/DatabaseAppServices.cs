using System;
using System.Collections.Generic;
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Services;

public sealed class DatabaseStallService : IStallService
{
  private readonly AppDbContext _db;

  public DatabaseStallService(AppDbContext db) => _db = db;

  public async Task<IReadOnlyList<StallResponseDto>> GetStallsAsync()
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT p.*, v.is_premium
      FROM Pois p
      LEFT JOIN Vendors v ON v.id = p.vendor_id
      WHERE p.vendor_id IS NOT NULL
      ORDER BY p.is_premium_priority DESC, p.created_at DESC
      """;
    await using var reader = await command.ExecuteReaderAsync();
    var results = new List<StallResponseDto>();
    while (await reader.ReadAsync()) results.Add(Map(reader));
    return results;
  }

  public async Task<StallResponseDto> GetByIdAsync(string id)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT p.*, v.is_premium
      FROM Pois p
      LEFT JOIN Vendors v ON v.id = p.vendor_id
      WHERE p.id = @id LIMIT 1
      """;
    command.AddParameter("@id", id);
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) throw new KeyNotFoundException($"Không tìm thấy sạp {id}.");
    return Map(reader);
  }

  public async Task<StallResponseDto> CreateAsync(StallRequestDto request)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    var id = Guid.NewGuid().ToString("N");

    // Look up festival_zone_id for this vendor
    string festivalZoneId = "";
    await using (var lookup = connection.CreateCommand())
    {
      lookup.CommandText = "SELECT festival_zone_id FROM Vendors WHERE id = @vendorId LIMIT 1";
      lookup.AddParameter("@vendorId", request.OwnerId);
      var val = await lookup.ExecuteScalarAsync();
      if (val is not null) festivalZoneId = val.ToString()!;
    }

    await using (var command = connection.CreateCommand())
    {
      command.CommandText = """
        INSERT INTO Pois
          (id, festival_zone_id, vendor_id, stall_name, description, latitude, longitude, cover_url, approval_status, is_premium_priority, trigger_radius, status)
        VALUES
          (@id, @festivalZoneId, @vendorId, @name, @description, @latitude, @longitude, @address, 'PENDING', 0, 3.0, 'ACTIVE')
        """;
      command.AddParameter("@id", id);
      command.AddParameter("@festivalZoneId", festivalZoneId);
      command.AddParameter("@vendorId", request.OwnerId);
      command.AddParameter("@name", request.Name);
      command.AddParameter("@description", request.Description);
      command.AddParameter("@latitude", request.Latitude);
      command.AddParameter("@longitude", request.Longitude);
      command.AddParameter("@address", request.Address); // use address for cover_url or other field
      await command.ExecuteNonQueryAsync();
    }
    return await GetByIdAsync(id);
  }

  public async Task<StallResponseDto> UpdateStatusAsync(string id, string status)
  {
    string approvalStatus = status == "ACTIVE" || status == "APPROVED" ? "APPROVED" : "PENDING";
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = "UPDATE Pois SET approval_status = @status WHERE id = @id";
    command.AddParameter("@status", approvalStatus);
    command.AddParameter("@id", id);
    if (await command.ExecuteNonQueryAsync() == 0) throw new KeyNotFoundException($"Không tìm thấy sạp {id}.");
    return await GetByIdAsync(id);
  }

  public async Task<StallResponseDto?> GetByZoneCodeAsync(string zoneCode)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT p.*, v.is_premium
      FROM Pois p
      LEFT JOIN Vendors v ON v.id = p.vendor_id
      WHERE p.vendor_id = @zoneCode LIMIT 1
      """;
    command.AddParameter("@zoneCode", zoneCode);
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) return null;
    return Map(reader);
  }

  private static StallResponseDto Map(DbDataReader reader)
  {
    var id = reader.GetString(reader.GetOrdinal("id"));
    var vendorId = reader.IsDBNull(reader.GetOrdinal("vendor_id")) ? "" : reader.GetString(reader.GetOrdinal("vendor_id"));
    var name = reader.GetString(reader.GetOrdinal("stall_name"));
    var desc = reader.NullableString("description");
    var cover = reader.NullableString("cover_url");
    var lat = reader.GetDouble(reader.GetOrdinal("latitude"));
    var lng = reader.GetDouble(reader.GetOrdinal("longitude"));
    var status = reader.GetString(reader.GetOrdinal("approval_status"));
    var isPremium = !reader.IsDBNull(reader.GetOrdinal("is_premium")) && Convert.ToBoolean(reader["is_premium"]);
    var priority = Convert.ToInt32(reader["is_premium_priority"]);

    return new StallResponseDto(
      id, vendorId, name,
      string.Join('-', name.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries)),
      desc, cover, (decimal)lat, (decimal)lng, status, isPremium, priority, vendorId);
  }
}

public sealed class DatabasePoiService : IPoiService
{
  private readonly AppDbContext _db;
  private readonly IGeofenceService _geofence;

  public DatabasePoiService(AppDbContext db, IGeofenceService geofence)
  {
    _db = db;
    _geofence = geofence;
  }

  public async Task<IReadOnlyList<PoiResponseDto>> GetPoisAsync(string? stallId = null, string? tourId = null, string? tourSlug = null)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    var filters = new List<string> { "p.status = 'ACTIVE'" };
    if (!string.IsNullOrEmpty(stallId))
    {
      filters.Add("p.vendor_id = @stallId");
      command.AddParameter("@stallId", stallId);
    }
    if (!string.IsNullOrEmpty(tourId))
    {
      filters.Add("p.festival_zone_id = @tourId");
      command.AddParameter("@tourId", tourId);
    }
    if (!string.IsNullOrEmpty(tourSlug))
    {
      filters.Add("f.slug = @tourSlug");
      command.AddParameter("@tourSlug", tourSlug);
    }
    var whereClause = "WHERE " + string.Join(" AND ", filters);
    command.CommandText = $"""
      SELECT p.*, f.name AS zone_name, f.slug AS tour_slug_fk
      FROM Pois p
      JOIN FestivalZones f ON f.id = p.festival_zone_id
      {whereClause}
      ORDER BY p.sort_order, p.created_at
      """;
    
    await using var reader = await command.ExecuteReaderAsync();
    var results = new List<PoiResponseDto>();
    while (await reader.ReadAsync()) results.Add(Map(reader));
    return results;
  }

  public async Task<PoiResponseDto> GetByIdAsync(string id)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT p.*, f.name AS zone_name, f.slug AS tour_slug_fk
      FROM Pois p
      JOIN FestivalZones f ON f.id = p.festival_zone_id
      WHERE p.id = @id LIMIT 1
      """;
    command.AddParameter("@id", id);
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) throw new KeyNotFoundException($"Không tìm thấy POI {id}.");
    return Map(reader);
  }

  public async Task<IReadOnlyList<PoiResponseDto>> GetNearbyAsync(decimal latitude, decimal longitude, int radiusMeters, string? tourId = null, string? tourSlug = null)
  {
    var pois = await GetPoisAsync(stallId: null, tourId: tourId, tourSlug: tourSlug);
    return pois.Select(poi =>
      {
        var distance = _geofence.EstimateDistanceMeters(latitude, longitude, poi.Latitude, poi.Longitude);
        return poi with { DistanceMeters = decimal.Round(distance, 1), IsInsideGeofence = distance <= poi.ActivationRadius };
      })
      .Where(poi => poi.DistanceMeters <= radiusMeters)
      .OrderBy(poi => poi.DistanceMeters)
      .ToList();
  }

  public async Task<PoiResponseDto> CreateAsync(PoiRequestDto request)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    var id = Guid.NewGuid().ToString("N");
    var slug = string.Join('-', request.Name.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));

    // Look up festival_zone_id from the stall's vendor
    string festivalZoneId = "";
    await using (var lookup = connection.CreateCommand())
    {
      lookup.CommandText = "SELECT festival_zone_id FROM Vendors WHERE id = @vendorId LIMIT 1";
      lookup.AddParameter("@vendorId", request.StallId);
      var val = await lookup.ExecuteScalarAsync();
      if (val is not null) festivalZoneId = val.ToString()!;
    }

    await using (var command = connection.CreateCommand())
    {
      command.CommandText = """
        INSERT INTO Pois
          (id, festival_zone_id, vendor_id, stall_name, description, latitude, longitude, cover_url, approval_status, is_premium_priority, trigger_radius, status)
        VALUES
          (@id, @festivalZoneId, @vendorId, @name, @description, @latitude, @longitude, NULL, 'PENDING', @isPremium, @radius, 'ACTIVE')
        """;
      command.AddParameter("@id", id);
      command.AddParameter("@festivalZoneId", festivalZoneId);
      command.AddParameter("@vendorId", request.StallId);
      command.AddParameter("@name", request.Name);
      command.AddParameter("@description", request.Description);
      command.AddParameter("@latitude", request.Latitude);
      command.AddParameter("@longitude", request.Longitude);
      command.AddParameter("@isPremium", request.IsPremium ? 1 : 0);
      command.AddParameter("@radius", (double)request.ActivationRadius);
      await command.ExecuteNonQueryAsync();
    }
    return await GetByIdAsync(id);
  }

  private static PoiResponseDto Map(DbDataReader reader)
  {
    var id = reader.GetString(reader.GetOrdinal("id"));
    var festivalZoneId = reader.GetString(reader.GetOrdinal("festival_zone_id"));
    var vendorId = reader.IsDBNull(reader.GetOrdinal("vendor_id")) ? "" : reader.GetString(reader.GetOrdinal("vendor_id"));
    var stallName = reader.GetString(reader.GetOrdinal("stall_name"));
    var desc = reader.NullableString("description");
    var stallNameEn = reader.NullableString("stall_name_en");
    var descriptionEn = reader.NullableString("description_en");
    var stallNameJa = reader.NullableString("stall_name_ja");
    var descriptionJa = reader.NullableString("description_ja");
    var stallNameKo = reader.NullableString("stall_name_ko");
    var descriptionKo = reader.NullableString("description_ko");
    var stallNameZh = reader.NullableString("stall_name_zh");
    var descriptionZh = reader.NullableString("description_zh");
    var cover = reader.NullableString("cover_url");
    var lat = reader.GetDouble(reader.GetOrdinal("latitude"));
    var lng = reader.GetDouble(reader.GetOrdinal("longitude"));
    var status = reader.GetString(reader.GetOrdinal("status"));
    var isPremium = Convert.ToBoolean(reader["is_premium_priority"]);
    var radius = Convert.ToInt32(reader["trigger_radius"]);
    var zoneName = reader.GetString(reader.GetOrdinal("zone_name"));
    var tourSlug = reader.GetString(reader.GetOrdinal("tour_slug_fk"));

    return new PoiResponseDto(
      id, vendorId,
      string.Join('-', stallName.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries)),
      stallName, desc, zoneName, "Điểm tham quan", cover, (decimal)lat, (decimal)lng, radius, isPremium, status, null, false,
      null, festivalZoneId, tourSlug,
      stallNameEn, descriptionEn, stallNameJa, descriptionJa,
      stallNameKo, descriptionKo, stallNameZh, descriptionZh);
  }
}

public sealed class DatabasePoiContentService : IPoiContentService
{
  private readonly AppDbContext _db;

  public DatabasePoiContentService(AppDbContext db) => _db = db;

  public async Task<IReadOnlyList<PoiContentResponseDto>> GetByPoiAsync(string poiId)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = "SELECT id, stall_name, description FROM Pois WHERE id = @poiId LIMIT 1";
    command.AddParameter("@poiId", poiId);
    await using var reader = await command.ExecuteReaderAsync();
    var results = new List<PoiContentResponseDto>();
    if (await reader.ReadAsync())
    {
      var name = reader.GetString(1);
      var desc = reader.NullableString("description") ?? "";
      results.Add(new PoiContentResponseDto(
        poiId + "_vi",
        poiId,
        "vi",
        $"Thuyết minh {name}",
        desc,
        null,
        "BROWSER_TTS"
      ));
    }
    return results;
  }

  public Task<PoiContentResponseDto> CreateAsync(PoiContentRequestDto request)
  {
    // Content is directly stored in Pois.description in the new unified table.
    return Task.FromResult(new PoiContentResponseDto(request.PoiId + "_" + request.LanguageCode, request.PoiId, request.LanguageCode, request.Title, request.TtsScript, request.AudioFileUrl, request.VoiceType));
  }
}

public sealed class DatabaseTrackingService : IQrTrackingService, IAnalyticsService
{
  private readonly AppDbContext _db;
  private readonly IHttpContextAccessor _httpContextAccessor;

  public DatabaseTrackingService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
  {
    _db = db;
    _httpContextAccessor = httpContextAccessor;
  }

  public async Task<QrCodeResponseDto> CreateQrCodeAsync(QrCodeRequestDto request)
  {
    var poiId = request.PoiId ?? request.StallId;
    if (string.IsNullOrEmpty(poiId))
      throw new ArgumentException("QR phải thuộc về một sạp hoặc POI.");

    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    string vendorId = "";
    string festivalZoneId = "";

    await using (var lookup = connection.CreateCommand())
    {
      lookup.CommandText = "SELECT vendor_id, festival_zone_id FROM Pois WHERE id = @id LIMIT 1";
      lookup.AddParameter("@id", poiId);
      await using var reader = await lookup.ExecuteReaderAsync();
      if (!await reader.ReadAsync()) throw new KeyNotFoundException($"Không tìm thấy POI/Stall {poiId}.");
      vendorId = reader.IsDBNull(0) ? "" : reader.GetString(0);
      festivalZoneId = reader.GetString(1);
    }

    var code = $"VTA-{Guid.NewGuid():N}";
    var qrType = "POI";
    var imageUrl = $"/uploads/qr/{code}.png";
    await using (var command = connection.CreateCommand())
    {
      command.CommandText = """
        INSERT INTO qr_codes (vendor_id, tour_id, poi_id, code, qr_type, target_url)
        VALUES (NULLIF(@vendorId, ''), @tourId, @poiId, @code, @qrType, @targetUrl)
        """;
      command.AddParameter("@vendorId", vendorId);
      command.AddParameter("@tourId", festivalZoneId);
      command.AddParameter("@poiId", poiId);
      command.AddParameter("@code", code);
      command.AddParameter("@qrType", qrType);
      command.AddParameter("@targetUrl", request.TargetUrl);
      await command.ExecuteNonQueryAsync();
    }

    return new QrCodeResponseDto(code, vendorId, poiId, qrType, imageUrl, request.TargetUrl);
  }

  public Task<object> TrackScanAsync(QrScanRequestDto request, string? ipAddress, string? userAgent)
  {
    return Task.FromResult<object>(new { request.QrCodeId, request.SessionId, Accepted = true, ScannedAt = DateTime.UtcNow });
  }

  public async Task<object> TrackVisitAsync(VisitEventRequestDto request)
  {
    var poiId = string.IsNullOrWhiteSpace(request.PoiId) ? request.StallId : request.PoiId;
    var sessionId = NormalizeSession(request.SessionId);
    var poi = await _db.Pois.AsNoTracking()
      .Where(candidate => candidate.Id == poiId)
      .Select(candidate => new { candidate.Id, candidate.VendorId })
      .SingleOrDefaultAsync();
    if (poi is null) throw new KeyNotFoundException("poi.not_found");

    var visitedAt = DateTime.UtcNow;
    var visit = new VisitEvent
    {
      PoiId = poi.Id,
      VendorId = poi.VendorId,
      UserId = AuthenticatedUserId(),
      SessionId = sessionId,
      Latitude = request.Latitude,
      Longitude = request.Longitude,
      DistanceMeters = request.DistanceMeters,
      Source = "GPS",
      VisitedAt = visitedAt
    };
    _db.VisitEvents.Add(visit);
    await _db.SaveChangesAsync();
    return new { request.StallId, PoiId = poi.Id, SessionId = sessionId, Accepted = true, VisitedAt = visitedAt };
  }

  public async Task<object> TrackAudioPlayAsync(AudioPlayRequestDto request)
  {
    var sessionId = NormalizeSession(request.SessionId);
    var poi = await _db.Pois.AsNoTracking()
      .Where(candidate => candidate.Id == request.PoiId)
      .Select(candidate => new { candidate.Id, candidate.VendorId })
      .SingleOrDefaultAsync();
    if (poi is null) throw new KeyNotFoundException("poi.not_found");

    var playedAt = DateTime.UtcNow;
    _db.AudioPlayEvents.Add(new AudioPlayEvent
    {
      PoiId = poi.Id,
      VendorId = poi.VendorId,
      UserId = AuthenticatedUserId(),
      SessionId = sessionId,
      LanguageCode = NormalizeLanguage(request.LanguageCode),
      Source = "MANUAL",
      PlayedAt = playedAt
    });
    await _db.SaveChangesAsync();
    return new { PoiId = poi.Id, LanguageCode = NormalizeLanguage(request.LanguageCode),
      SessionId = sessionId, Accepted = true, PlayedAt = playedAt };
  }

  public async Task<AnalyticsSummaryDto> GetSummaryAsync()
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    var stalls = await ScalarIntAsync(connection, "SELECT COUNT(*) FROM Pois WHERE vendor_id IS NOT NULL");
    var pois = await ScalarIntAsync(connection, "SELECT COUNT(*) FROM Pois WHERE status = 'ACTIVE'");
    var startUtc = DateTime.UtcNow.Date;
    var scans = 0;
    var visits = await _db.VisitEvents.CountAsync(item => item.VisitedAt >= startUtc);
    var plays = await _db.AudioPlayEvents.CountAsync(item => item.PlayedAt >= startUtc);
    var revenue = await ScalarDecimalAsync(connection, "SELECT COALESCE(SUM(amount), 0) FROM payment_transactions WHERE status = 'APPROVED'");
    return new AnalyticsSummaryDto(stalls, pois, scans, visits, plays, revenue);
  }

  private string? AuthenticatedUserId() =>
    _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated == true
      ? _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
      : null;

  private static string NormalizeSession(string sessionId)
  {
    var value = sessionId?.Trim();
    if (string.IsNullOrWhiteSpace(value) || value.Length is < 8 or > 160)
      throw new ArgumentException("analytics.invalid_session");
    return value;
  }

  private static string NormalizeLanguage(string? languageCode)
  {
    var value = languageCode?.Trim().ToLowerInvariant();
    return value is "vi" or "en" or "ja" or "ko" or "zh" ? value : "vi";
  }

  private static async Task<int> ScalarIntAsync(DbConnection connection, string sql)
  {
    await using var command = connection.CreateCommand();
    command.CommandText = sql;
    return Convert.ToInt32(await command.ExecuteScalarAsync());
  }

  private static async Task<decimal> ScalarDecimalAsync(DbConnection connection, string sql)
  {
    await using var command = connection.CreateCommand();
    command.CommandText = sql;
    return Convert.ToDecimal(await command.ExecuteScalarAsync());
  }
}

public sealed class DatabaseMediaStorageService : IMediaStorageService
{
  private readonly AppDbContext _db;
  private readonly IConfiguration _configuration;
  private readonly IWebHostEnvironment _environment;

  public DatabaseMediaStorageService(AppDbContext db, IConfiguration configuration, IWebHostEnvironment environment)
  {
    _db = db;
    _configuration = configuration;
    _environment = environment;
  }

  public async Task<MediaUploadResponseDto> SaveAsync(IFormFile file, string fileType, string ownerId, string? stallId, string? poiId)
  {
    var normalizedType = fileType.Trim().ToUpperInvariant();
    string[] allowed = ["IMAGE", "VIDEO", "AUDIO", "LOGO", "QR", "DOCUMENT"];
    if (!allowed.Contains(normalizedType)) throw new ArgumentException("Loại media không hợp lệ.");

    var basePath = _configuration["Storage:BasePath"] ?? "../uploads";
    var physicalRoot = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, basePath));
    var folderName = normalizedType.ToLowerInvariant();
    var folder = Path.Combine(physicalRoot, folderName);
    Directory.CreateDirectory(folder);

    var extension = Path.GetExtension(Path.GetFileName(file.FileName));
    var storedName = $"{Guid.NewGuid():N}{extension}";
    var physicalPath = Path.Combine(folder, storedName);
    await using (var stream = File.Create(physicalPath))
    {
      await file.CopyToAsync(stream);
    }

    var relativePath = $"/uploads/{folderName}/{storedName}";
    var publicBaseUrl = (_configuration["Storage:PublicBaseUrl"] ?? "http://localhost:5000/uploads").TrimEnd('/');
    var publicUrl = $"{publicBaseUrl}/{folderName}/{storedName}";

    try
    {
      var connection = await DatabaseSql.OpenConnectionAsync(_db);
      var mediaId = Guid.NewGuid().ToString("N");
      await using (var command = connection.CreateCommand())
      {
        command.CommandText = """
          INSERT INTO media_files
            (id, vendor_id, poi_id, file_type, file_name, file_path, public_url, mime_type, file_size)
          VALUES
            (@id, @vendorId, @poiId, @fileType, @fileName, @filePath, @publicUrl, @mimeType, @fileSize)
          """;
        command.AddParameter("@id", mediaId);
        command.AddParameter("@vendorId", ownerId);
        command.AddParameter("@poiId", poiId ?? stallId);
        command.AddParameter("@fileType", normalizedType);
        command.AddParameter("@fileName", Path.GetFileName(file.FileName));
        command.AddParameter("@filePath", relativePath);
        command.AddParameter("@publicUrl", publicUrl);
        command.AddParameter("@mimeType", file.ContentType);
        command.AddParameter("@fileSize", file.Length);
        await command.ExecuteNonQueryAsync();
      }

      return new MediaUploadResponseDto(mediaId, normalizedType, storedName, relativePath, file.ContentType, file.Length);
    }
    catch
    {
      File.Delete(physicalPath);
      throw;
    }
  }
}

public sealed class DatabasePaymentService : IPaymentService
{
  private readonly AppDbContext _db;

  public DatabasePaymentService(AppDbContext db) => _db = db;

  public Task<PaymentResponseDto> CreateAsync(PaymentRequestDto request) => SaveAsync(request, "PENDING");

  public Task<PaymentResponseDto> RecordManualCashAsync(PaymentRequestDto request) =>
    SaveAsync(request with { PaymentMethod = "CASH" }, "APPROVED");

  public Task<object> HandleWebhookAsync(object payload) =>
    Task.FromResult<object>(new { Received = true, Payload = payload, ProcessedAt = DateTime.UtcNow });

  private async Task<PaymentResponseDto> SaveAsync(PaymentRequestDto request, string status)
  {
    var provider = NormalizeProvider(request.PaymentMethod);
    var paymentType = NormalizePaymentType(request.PaymentType);
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    var id = Guid.NewGuid().ToString("N");
    string vendorId = request.StallId ?? "";

    var transactionCode = $"VTA-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..32];
    await using (var command = connection.CreateCommand())
    {
      command.CommandText = """
        INSERT INTO payment_transactions
          (id, sender_id, sender_type, payment_method, transaction_type, amount, transfer_memo, proof_attachment_url, status)
        VALUES
          (@id, @vendorId, 'VENDOR', @provider, @paymentType, @amount, @transactionCode, NULL, @status)
        """;
      command.AddParameter("@id", id);
      command.AddParameter("@vendorId", vendorId);
      command.AddParameter("@provider", provider);
      command.AddParameter("@paymentType", paymentType);
      command.AddParameter("@amount", request.Amount);
      command.AddParameter("@transactionCode", transactionCode);
      command.AddParameter("@status", status);
      await command.ExecuteNonQueryAsync();
    }

    return new PaymentResponseDto(id, request.UserId, request.StallId, request.Amount, request.Currency, provider, paymentType, status, transactionCode);
  }

  private static string NormalizeProvider(string provider) => provider.Trim().ToUpperInvariant() switch
  {
    "MOMO" => "MOMO",
    "VNPAY" => "VNPAY",
    "BANK_QR" => "BANK_QR",
    "STRIPE" => "STRIPE",
    "CASH" => "CASH",
    _ => "MANUAL"
  };

  private static string NormalizePaymentType(string paymentType) => paymentType.Trim().ToUpperInvariant() switch
  {
    "VISITOR_PREMIUM" or "APP_PREMIUM" => "VISITOR_PREMIUM",
    "VENDOR_SUBSCRIPTION" or "VENDOR_MONTHLY" => "VENDOR_SUBSCRIPTION",
    "WALLET_TOP_UP" => "WALLET_TOP_UP",
    "COMMISSION_PAYOUT" => "COMMISSION_PAYOUT",
    _ => "OTHER"
  };

  public Task<string?> GetPremiumPaymentQrAsync()
  {
    return Task.FromResult<string?>("MOMO-PAY-PREMIUM-12345");
  }
}
