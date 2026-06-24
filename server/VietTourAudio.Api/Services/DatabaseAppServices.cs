using System.Data.Common;
using VietTourAudio.Api.Data;
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
    command.CommandText = $"{SelectSql} ORDER BY s.is_featured DESC, s.created_at DESC";
    await using var reader = await command.ExecuteReaderAsync();
    var results = new List<StallResponseDto>();
    while (await reader.ReadAsync()) results.Add(Map(reader));
    return results;
  }

  public async Task<StallResponseDto> GetByIdAsync(ulong id)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = $"{SelectSql} WHERE s.id = @id LIMIT 1";
    command.AddParameter("@id", id);
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) throw new KeyNotFoundException($"Không tìm thấy sạp {id}.");
    return Map(reader);
  }

  public async Task<StallResponseDto> CreateAsync(StallRequestDto request)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using (var command = connection.CreateCommand())
    {
      command.CommandText = """
        INSERT INTO stalls
          (vendor_id, name, slug, description, address, latitude, longitude, opening_hours, status)
        VALUES
          (@vendorId, @name, @slug, @description, @address, @latitude, @longitude, @openingHours, 'PENDING')
        """;
      command.AddParameter("@vendorId", request.OwnerId);
      command.AddParameter("@name", request.Name);
      command.AddParameter("@slug", request.Slug);
      command.AddParameter("@description", request.Description);
      command.AddParameter("@address", request.Address);
      command.AddParameter("@latitude", request.Latitude);
      command.AddParameter("@longitude", request.Longitude);
      command.AddParameter("@openingHours", request.OpeningHours);
      await command.ExecuteNonQueryAsync();
    }
    return await GetByIdAsync(await DatabaseSql.LastInsertIdAsync(connection));
  }

  public async Task<StallResponseDto> UpdateStatusAsync(ulong id, string status)
  {
    string[] allowed = ["DRAFT", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];
    if (!allowed.Contains(status)) throw new ArgumentException("Trạng thái sạp không hợp lệ.");

    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = "UPDATE stalls SET status = @status WHERE id = @id";
    command.AddParameter("@status", status);
    command.AddParameter("@id", id);
    if (await command.ExecuteNonQueryAsync() == 0) throw new KeyNotFoundException($"Không tìm thấy sạp {id}.");
    return await GetByIdAsync(id);
  }

  public async Task<StallResponseDto?> GetByZoneCodeAsync(string zoneCode)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = $"{SelectSql} WHERE s.zone_code = @zoneCode LIMIT 1";
    command.AddParameter("@zoneCode", zoneCode);
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) return null;
    return Map(reader);
  }

  private const string SelectSql = """
    SELECT s.*,
      EXISTS(
        SELECT 1 FROM vendor_subscriptions vs
        JOIN subscription_plans sp ON sp.id = vs.plan_id
        WHERE vs.vendor_id = s.vendor_id
          AND vs.status IN ('TRIAL', 'ACTIVE')
          AND sp.allow_premium_content = 1
      ) AS is_premium,
      COALESCE((
        SELECT MAX(sp.priority_support) FROM vendor_subscriptions vs
        JOIN subscription_plans sp ON sp.id = vs.plan_id
        WHERE vs.vendor_id = s.vendor_id AND vs.status IN ('TRIAL', 'ACTIVE')
      ), 0) AS premium_priority
    FROM stalls s
    """;

  private static StallResponseDto Map(DbDataReader reader) => new(
    reader.UInt64("id"), reader.UInt64("vendor_id"), reader.GetString(reader.GetOrdinal("name")),
    reader.GetString(reader.GetOrdinal("slug")), reader.NullableString("description"), reader.NullableString("address"),
    reader.Decimal("latitude"), reader.Decimal("longitude"), reader.GetString(reader.GetOrdinal("status")),
    reader.Boolean("is_premium"), reader.Int32("premium_priority"), reader.NullableString("zone_code"));
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

  public async Task<IReadOnlyList<PoiResponseDto>> GetPoisAsync(ulong? stallId = null)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = $"{SelectSql} WHERE p.status = 'ACTIVE' {(stallId.HasValue ? "AND p.stall_id = @stallId" : string.Empty)} ORDER BY p.sort_order, p.created_at";
    if (stallId.HasValue) command.AddParameter("@stallId", stallId.Value);
    await using var reader = await command.ExecuteReaderAsync();
    var results = new List<PoiResponseDto>();
    while (await reader.ReadAsync()) results.Add(Map(reader));
    return results;
  }

  public async Task<PoiResponseDto> GetByIdAsync(ulong id)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = $"{SelectSql} WHERE p.id = @id LIMIT 1";
    command.AddParameter("@id", id);
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) throw new KeyNotFoundException($"Không tìm thấy POI {id}.");
    return Map(reader);
  }

  public async Task<IReadOnlyList<PoiResponseDto>> GetNearbyAsync(decimal latitude, decimal longitude, int radiusMeters)
  {
    var pois = await GetPoisAsync();
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
    var slug = string.Join('-', request.Name.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using (var command = connection.CreateCommand())
    {
      command.CommandText = """
        INSERT INTO pois
          (stall_id, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status)
        VALUES
          (@stallId, @name, @slug, @description, @latitude, @longitude, @radius, @isPremium, 'ACTIVE')
        """;
      command.AddParameter("@stallId", request.StallId);
      command.AddParameter("@name", request.Name);
      command.AddParameter("@slug", slug);
      command.AddParameter("@description", request.Description);
      command.AddParameter("@latitude", request.Latitude);
      command.AddParameter("@longitude", request.Longitude);
      command.AddParameter("@radius", request.ActivationRadius);
      command.AddParameter("@isPremium", request.IsPremium);
      await command.ExecuteNonQueryAsync();
    }
    return await GetByIdAsync(await DatabaseSql.LastInsertIdAsync(connection));
  }

  private const string SelectSql = """
    SELECT p.*, s.name AS zone_name,
      (SELECT q.id FROM qr_codes q WHERE q.poi_id = p.id AND q.is_active = 1 ORDER BY q.created_at LIMIT 1) AS qr_code_id,
      (SELECT COALESCE(mf.public_url, mf.file_path)
       FROM media_files mf
       WHERE mf.poi_id = p.id AND mf.file_type = 'IMAGE' AND mf.moderation_status = 'APPROVED'
       ORDER BY mf.created_at LIMIT 1) AS image_url
    FROM pois p
    JOIN stalls s ON s.id = p.stall_id
    """;

  private static PoiResponseDto Map(DbDataReader reader) => new(
    reader.UInt64("id"), reader.UInt64("stall_id"), reader.GetString(reader.GetOrdinal("slug")),
    reader.GetString(reader.GetOrdinal("name")), reader.NullableString("description"),
    reader.GetString(reader.GetOrdinal("zone_name")), "Điểm tham quan", reader.NullableString("image_url"),
    reader.Decimal("latitude"), reader.Decimal("longitude"), reader.Int32("activation_radius"),
    reader.Boolean("is_premium_content"), reader.GetString(reader.GetOrdinal("status")), null, false,
    reader.IsDBNull(reader.GetOrdinal("qr_code_id")) ? null : reader.UInt64("qr_code_id"));
}

public sealed class DatabasePoiContentService : IPoiContentService
{
  private readonly AppDbContext _db;

  public DatabasePoiContentService(AppDbContext db) => _db = db;

  public async Task<IReadOnlyList<PoiContentResponseDto>> GetByPoiAsync(ulong poiId)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = "SELECT * FROM poi_contents WHERE poi_id = @poiId ORDER BY lang";
    command.AddParameter("@poiId", poiId);
    await using var reader = await command.ExecuteReaderAsync();
    var results = new List<PoiContentResponseDto>();
    while (await reader.ReadAsync()) results.Add(Map(reader));
    return results;
  }

  public async Task<PoiContentResponseDto> CreateAsync(PoiContentRequestDto request)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using (var command = connection.CreateCommand())
    {
      command.CommandText = """
        INSERT INTO poi_contents (poi_id, lang, title, tts_script, audio_url, voice_profile)
        VALUES (@poiId, @lang, @title, @script, @audioUrl, @voiceProfile)
        ON DUPLICATE KEY UPDATE title = VALUES(title), tts_script = VALUES(tts_script),
          audio_url = VALUES(audio_url), voice_profile = VALUES(voice_profile)
        """;
      command.AddParameter("@poiId", request.PoiId);
      command.AddParameter("@lang", request.LanguageCode);
      command.AddParameter("@title", request.Title);
      command.AddParameter("@script", request.TtsScript ?? string.Empty);
      command.AddParameter("@audioUrl", request.AudioFileUrl);
      command.AddParameter("@voiceProfile", request.VoiceType);
      await command.ExecuteNonQueryAsync();
    }

    await using var select = connection.CreateCommand();
    select.CommandText = "SELECT * FROM poi_contents WHERE poi_id = @poiId AND lang = @lang LIMIT 1";
    select.AddParameter("@poiId", request.PoiId);
    select.AddParameter("@lang", request.LanguageCode);
    await using var reader = await select.ExecuteReaderAsync();
    await reader.ReadAsync();
    return Map(reader);
  }

  private static PoiContentResponseDto Map(DbDataReader reader) => new(
    reader.UInt64("id"), reader.UInt64("poi_id"), reader.GetString(reader.GetOrdinal("lang")),
    reader.GetString(reader.GetOrdinal("title")), reader.GetString(reader.GetOrdinal("tts_script")),
    reader.NullableString("audio_url"), reader.NullableString("voice_profile") ?? "BROWSER_TTS");
}

public sealed class DatabaseTrackingService : IQrTrackingService, IAnalyticsService
{
  private readonly AppDbContext _db;

  public DatabaseTrackingService(AppDbContext db) => _db = db;

  public async Task<QrCodeResponseDto> CreateQrCodeAsync(QrCodeRequestDto request)
  {
    if (!request.StallId.HasValue && !request.PoiId.HasValue)
      throw new ArgumentException("QR phải thuộc về một sạp hoặc POI.");

    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    ulong vendorId;
    ulong? stallId = request.StallId;

    await using (var lookup = connection.CreateCommand())
    {
      if (request.PoiId.HasValue)
      {
        lookup.CommandText = "SELECT s.vendor_id, p.stall_id FROM pois p JOIN stalls s ON s.id = p.stall_id WHERE p.id = @id LIMIT 1";
        lookup.AddParameter("@id", request.PoiId.Value);
        await using var reader = await lookup.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) throw new KeyNotFoundException($"Không tìm thấy POI {request.PoiId.Value}.");
        vendorId = reader.UInt64("vendor_id");
        stallId = reader.UInt64("stall_id");
      }
      else
      {
        lookup.CommandText = "SELECT vendor_id FROM stalls WHERE id = @id LIMIT 1";
        lookup.AddParameter("@id", request.StallId!.Value);
        var value = await lookup.ExecuteScalarAsync() ?? throw new KeyNotFoundException($"Không tìm thấy sạp {request.StallId.Value}.");
        vendorId = Convert.ToUInt64(value);
      }
    }

    var code = $"VTA-{Guid.NewGuid():N}";
    var qrType = request.PoiId.HasValue ? "POI" : "STALL";
    var imageUrl = $"/uploads/qr/{code}.png";
    await using (var command = connection.CreateCommand())
    {
      command.CommandText = """
        INSERT INTO qr_codes (vendor_id, stall_id, poi_id, code, qr_type, target_url, image_url)
        VALUES (@vendorId, @stallId, @poiId, @code, @qrType, @targetUrl, @imageUrl)
        """;
      command.AddParameter("@vendorId", vendorId);
      command.AddParameter("@stallId", stallId);
      command.AddParameter("@poiId", request.PoiId);
      command.AddParameter("@code", code);
      command.AddParameter("@qrType", qrType);
      command.AddParameter("@targetUrl", request.TargetUrl);
      command.AddParameter("@imageUrl", imageUrl);
      await command.ExecuteNonQueryAsync();
    }

    var id = await DatabaseSql.LastInsertIdAsync(connection);
    return new QrCodeResponseDto(id, stallId, request.PoiId, qrType, imageUrl, request.TargetUrl);
  }

  public async Task<object> TrackScanAsync(QrScanRequestDto request, string? ipAddress, string? userAgent)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    var sessionId = await EnsureSessionAsync(connection, request.SessionId, ipAddress, userAgent);
    ulong? vendorId = null;
    ulong? stallId = null;
    ulong? poiId = null;
    ulong? persistedQrId = null;

    await using (var lookup = connection.CreateCommand())
    {
      lookup.CommandText = "SELECT vendor_id, stall_id, poi_id FROM qr_codes WHERE id = @id AND is_active = 1 LIMIT 1";
      lookup.AddParameter("@id", request.QrCodeId);
      await using var reader = await lookup.ExecuteReaderAsync();
      if (await reader.ReadAsync())
      {
        persistedQrId = request.QrCodeId;
        vendorId = reader.UInt64("vendor_id");
        stallId = reader.IsDBNull(reader.GetOrdinal("stall_id")) ? null : reader.UInt64("stall_id");
        poiId = reader.IsDBNull(reader.GetOrdinal("poi_id")) ? null : reader.UInt64("poi_id");
      }
    }

    if (!vendorId.HasValue && request.PoiId.HasValue)
    {
      await using var lookup = connection.CreateCommand();
      lookup.CommandText = "SELECT s.vendor_id, p.stall_id FROM pois p JOIN stalls s ON s.id = p.stall_id WHERE p.id = @id LIMIT 1";
      lookup.AddParameter("@id", request.PoiId.Value);
      await using var reader = await lookup.ExecuteReaderAsync();
      if (await reader.ReadAsync())
      {
        vendorId = reader.UInt64("vendor_id");
        stallId = reader.UInt64("stall_id");
        poiId = request.PoiId;
      }
    }

    if (!vendorId.HasValue && request.StallId.HasValue)
    {
      await using var lookup = connection.CreateCommand();
      lookup.CommandText = "SELECT vendor_id FROM stalls WHERE id = @id LIMIT 1";
      lookup.AddParameter("@id", request.StallId.Value);
      var value = await lookup.ExecuteScalarAsync();
      if (value is not null)
      {
        vendorId = Convert.ToUInt64(value);
        stallId = request.StallId;
        poiId = request.PoiId;
      }
    }

    if (!vendorId.HasValue) return new { request.QrCodeId, request.SessionId, Accepted = false };

    await using var command = connection.CreateCommand();
    command.CommandText = """
      INSERT INTO qr_scan_events
        (qr_code_id, vendor_id, stall_id, poi_id, visitor_session_id, ip_address, user_agent, country_code)
      VALUES (@qrId, @vendorId, @stallId, @poiId, @sessionId, @ip, @userAgent, @country)
      """;
    command.AddParameter("@qrId", persistedQrId);
    command.AddParameter("@vendorId", vendorId.Value);
    command.AddParameter("@stallId", stallId);
    command.AddParameter("@poiId", poiId);
    command.AddParameter("@sessionId", sessionId);
    command.AddParameter("@ip", ipAddress);
    command.AddParameter("@userAgent", userAgent);
    command.AddParameter("@country", request.CountryCode);
    await command.ExecuteNonQueryAsync();
    return new { request.QrCodeId, request.SessionId, Accepted = true, ScannedAt = DateTime.UtcNow };
  }

  public async Task<object> TrackVisitAsync(VisitEventRequestDto request)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    var sessionId = await EnsureSessionAsync(connection, request.SessionId, null, null);
    ulong vendorId;
    await using (var lookup = connection.CreateCommand())
    {
      lookup.CommandText = "SELECT vendor_id FROM stalls WHERE id = @id LIMIT 1";
      lookup.AddParameter("@id", request.StallId);
      var value = await lookup.ExecuteScalarAsync() ?? throw new KeyNotFoundException($"Không tìm thấy sạp {request.StallId}.");
      vendorId = Convert.ToUInt64(value);
    }

    await using var command = connection.CreateCommand();
    command.CommandText = """
      INSERT INTO visit_events
        (vendor_id, stall_id, poi_id, visitor_session_id, source, latitude, longitude, distance_meters)
      VALUES (@vendorId, @stallId, @poiId, @sessionId, 'GPS', @latitude, @longitude, @distance)
      """;
    command.AddParameter("@vendorId", vendorId);
    command.AddParameter("@stallId", request.StallId);
    command.AddParameter("@poiId", request.PoiId);
    command.AddParameter("@sessionId", sessionId);
    command.AddParameter("@latitude", request.Latitude);
    command.AddParameter("@longitude", request.Longitude);
    command.AddParameter("@distance", request.DistanceMeters);
    await command.ExecuteNonQueryAsync();
    return new { request.StallId, request.PoiId, request.SessionId, Accepted = true, VisitedAt = DateTime.UtcNow };
  }

  public async Task<object> TrackAudioPlayAsync(AudioPlayRequestDto request)
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    var sessionId = await EnsureSessionAsync(connection, request.SessionId, null, null);
    ulong? contentId = null;
    await using (var lookup = connection.CreateCommand())
    {
      lookup.CommandText = "SELECT id FROM poi_contents WHERE poi_id = @poiId AND lang = @lang LIMIT 1";
      lookup.AddParameter("@poiId", request.PoiId);
      lookup.AddParameter("@lang", request.LanguageCode);
      var value = await lookup.ExecuteScalarAsync();
      if (value is not null) contentId = Convert.ToUInt64(value);
    }

    await using var command = connection.CreateCommand();
    command.CommandText = """
      INSERT INTO play_history (visitor_session_id, poi_id, poi_content_id, lang, source)
      VALUES (@sessionId, @poiId, @contentId, @lang, 'MANUAL')
      """;
    command.AddParameter("@sessionId", sessionId);
    command.AddParameter("@poiId", request.PoiId);
    command.AddParameter("@contentId", contentId);
    command.AddParameter("@lang", request.LanguageCode);
    await command.ExecuteNonQueryAsync();
    return new { request.PoiId, request.LanguageCode, request.SessionId, Accepted = true, PlayedAt = DateTime.UtcNow };
  }

  public async Task<AnalyticsSummaryDto> GetSummaryAsync()
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    var stalls = await ScalarIntAsync(connection, "SELECT COUNT(*) FROM stalls");
    var pois = await ScalarIntAsync(connection, "SELECT COUNT(*) FROM pois");
    var scans = await ScalarIntAsync(connection, "SELECT COUNT(*) FROM qr_scan_events WHERE scanned_at >= UTC_DATE()");
    var visits = await ScalarIntAsync(connection, "SELECT COUNT(*) FROM visit_events WHERE visited_at >= UTC_DATE()");
    var plays = await ScalarIntAsync(connection, "SELECT COUNT(*) FROM play_history WHERE started_at >= UTC_DATE()");
    var revenue = await ScalarDecimalAsync(connection, "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'PAID' AND paid_at >= UTC_DATE()");
    return new AnalyticsSummaryDto(stalls, pois, scans, visits, plays, revenue);
  }

  private static async Task<ulong> EnsureSessionAsync(DbConnection connection, string token, string? ipAddress, string? userAgent)
  {
    await using var command = connection.CreateCommand();
    command.CommandText = """
      INSERT INTO visitor_sessions (token, ip_address, user_agent)
      VALUES (@token, @ip, @userAgent)
      ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), last_seen_at = CURRENT_TIMESTAMP,
        ip_address = COALESCE(VALUES(ip_address), ip_address), user_agent = COALESCE(VALUES(user_agent), user_agent)
      """;
    command.AddParameter("@token", token);
    command.AddParameter("@ip", ipAddress);
    command.AddParameter("@userAgent", userAgent);
    await command.ExecuteNonQueryAsync();
    return await DatabaseSql.LastInsertIdAsync(connection);
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

  public async Task<MediaUploadResponseDto> SaveAsync(IFormFile file, string fileType, ulong ownerId, ulong? stallId, ulong? poiId)
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
      await using (var command = connection.CreateCommand())
      {
        command.CommandText = """
          INSERT INTO media_files
            (vendor_id, stall_id, poi_id, file_type, file_name, file_path, public_url, mime_type, file_size)
          VALUES
            (@vendorId, @stallId, @poiId, @fileType, @fileName, @filePath, @publicUrl, @mimeType, @fileSize)
          """;
        command.AddParameter("@vendorId", ownerId);
        command.AddParameter("@stallId", stallId);
        command.AddParameter("@poiId", poiId);
        command.AddParameter("@fileType", normalizedType);
        command.AddParameter("@fileName", Path.GetFileName(file.FileName));
        command.AddParameter("@filePath", relativePath);
        command.AddParameter("@publicUrl", publicUrl);
        command.AddParameter("@mimeType", file.ContentType);
        command.AddParameter("@fileSize", file.Length);
        await command.ExecuteNonQueryAsync();
      }

      var id = await DatabaseSql.LastInsertIdAsync(connection);
      return new MediaUploadResponseDto(id, normalizedType, storedName, relativePath, file.ContentType, file.Length);
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
    SaveAsync(request with { PaymentMethod = "CASH" }, "PAID");

  public Task<object> HandleWebhookAsync(object payload) =>
    Task.FromResult<object>(new { Received = true, Payload = payload, ProcessedAt = DateTime.UtcNow });

  private async Task<PaymentResponseDto> SaveAsync(PaymentRequestDto request, string status)
  {
    var provider = NormalizeProvider(request.PaymentMethod);
    var paymentType = NormalizePaymentType(request.PaymentType);
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    ulong? vendorId = null;

    if (request.StallId.HasValue)
    {
      await using var lookup = connection.CreateCommand();
      lookup.CommandText = "SELECT vendor_id FROM stalls WHERE id = @id LIMIT 1";
      lookup.AddParameter("@id", request.StallId.Value);
      var value = await lookup.ExecuteScalarAsync() ?? throw new KeyNotFoundException($"Không tìm thấy sạp {request.StallId.Value}.");
      vendorId = Convert.ToUInt64(value);
    }

    var transactionCode = $"VTA-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..32];
    await using (var command = connection.CreateCommand())
    {
      command.CommandText = """
        INSERT INTO payments
          (vendor_id, amount, currency, provider, payment_type, status, transaction_code, provider_payload, paid_at)
        VALUES
          (@vendorId, @amount, @currency, @provider, @paymentType, @status, @transactionCode, @payload,
           CASE WHEN @status = 'PAID' THEN CURRENT_TIMESTAMP ELSE NULL END)
        """;
      command.AddParameter("@vendorId", vendorId);
      command.AddParameter("@amount", request.Amount);
      command.AddParameter("@currency", request.Currency);
      command.AddParameter("@provider", provider);
      command.AddParameter("@paymentType", paymentType);
      command.AddParameter("@status", status);
      command.AddParameter("@transactionCode", transactionCode);
      command.AddParameter("@payload", request.Note is null ? null : $"{{\"note\":{System.Text.Json.JsonSerializer.Serialize(request.Note)}}}");
      await command.ExecuteNonQueryAsync();
    }

    var id = await DatabaseSql.LastInsertIdAsync(connection);
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

  public async Task<string?> GetPremiumPaymentQrAsync()
  {
    var connection = await DatabaseSql.OpenConnectionAsync(_db);
    await using var command = connection.CreateCommand();
    command.CommandText = "SELECT value FROM AppSettings WHERE `key` = 'PREMIUM_PAYMENT_QR' LIMIT 1";
    var result = await command.ExecuteScalarAsync();
    return result?.ToString();
  }
}
