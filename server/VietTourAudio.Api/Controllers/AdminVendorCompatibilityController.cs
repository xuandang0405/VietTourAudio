using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/vendors")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminVendorCompatibilityController(AppDbContext db) : ControllerBase
{
  private const string VendorSelect = """
    SELECT CAST(v.id AS CHAR) id, v.trade_name businessName, v.email ownerEmail,
      v.contact_name ownerDisplayName, v.phone contactPhone, v.status verificationStatus, v.created_at createdAt,
      vw.balance walletBalance, vw.total_top_up totalTopUp,
      'ACTIVE' AS subscriptionStatus, NULL AS periodEnd,
      'VTA-PREMIUM' AS planId, 'VTA Premium' AS planName, 199000.00 AS monthlyPrice,
      (SELECT COUNT(*) FROM Pois p WHERE p.vendor_id=v.id) stallCount,
      v.vendor_code vendorCode, CAST(v.festival_zone_id AS CHAR) assignedTourId
    FROM vendors v
    LEFT JOIN vendor_wallets vw ON vw.vendor_id=v.id
    """;

  [HttpGet]
  public async Task<IActionResult> List([FromQuery] string status = "ALL", [FromQuery] string search = "")
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, VendorSelect + "\n" + """
      WHERE (@status='ALL' OR v.status=@status)
        AND (@search='' OR v.trade_name LIKE CONCAT('%',@search,'%') OR v.email LIKE CONCAT('%',@search,'%'))
      ORDER BY v.created_at DESC
      """, new Dictionary<string, object?> { ["@status"] = status, ["@search"] = search.Trim() });
    return Ok(ApiResponseFactory.Ok(rows.Select(MapVendor)));
  }

  [HttpGet("tours-list")]
  public async Task<IActionResult> Tours() => Ok(ApiResponseFactory.Ok(await DatabaseSql.QueryRowsAsync(db,
    "SELECT CAST(id AS CHAR) id,name,slug,status FROM FestivalZones WHERE status!='ARCHIVED' ORDER BY name")));

  [HttpGet("{id}")]
  public async Task<IActionResult> Detail(string id)
  {
    var row = (await DatabaseSql.QueryRowsAsync(db, VendorSelect + " WHERE v.id=@id LIMIT 1",
      new Dictionary<string, object?> { ["@id"] = id })).FirstOrDefault();
    if (row is null) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));
    var result = MapVendor(row);
    var transactions = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(wt.id AS CHAR) id,CAST(wt.wallet_id AS CHAR) walletId,
        CASE WHEN wt.transaction_category='PREMIUM_UPGRADE' THEN 'PREMIUM_UPGRADE'
             WHEN wt.transaction_category='WEBAPP_MONTHLY_RENT' THEN 'SUBSCRIPTION_FEE'
             WHEN wt.direction='DEBIT' THEN 'MANUAL_DEBIT' ELSE 'TOP_UP' END type,
        CASE WHEN wt.direction='DEBIT' THEN -wt.amount ELSE wt.amount END amount,
        wt.balance_after balanceAfter,wt.description,wt.created_at createdAt
      FROM wallet_transactions wt WHERE wt.vendor_id=@id ORDER BY wt.created_at DESC
      """, new Dictionary<string, object?> { ["@id"] = id });
    var topups = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(id AS CHAR) id,CAST(vendor_id AS CHAR) vendorId,amount,provider,status,
        proof_url proofImageUrl,note rejectReason,created_at createdAt,reviewed_at updatedAt
      FROM top_up_requests WHERE vendor_id=@id ORDER BY created_at DESC
      """, new Dictionary<string, object?> { ["@id"] = id });
    var stalls = (await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(id AS CHAR) id, stall_name AS name, description, latitude, longitude,
        trigger_radius AS activationRadius, status, approval_status AS approvalStatus,
        'STALL' AS zoneCode, 1 AS isPremium,
        1 AS isPremiumPriority
      FROM Pois WHERE vendor_id=@id ORDER BY id
      """, new Dictionary<string, object?> { ["@id"] = id })).Select(s => new Dictionary<string, object?>
      {
        ["id"] = s["id"],
        ["name"] = s["name"],
        ["description"] = s["description"],
        ["latitude"] = s["latitude"],
        ["longitude"] = s["longitude"],
        ["activationRadius"] = s["activationRadius"],
        ["status"] = s["status"],
        ["approvalStatus"] = s["approvalStatus"],
        ["zoneCode"] = s["zoneCode"],
        ["isPremium"] = s["isPremium"] != null && Convert.ToBoolean(s["isPremium"]),
        ["isPremiumPriority"] = s["isPremiumPriority"] != null && Convert.ToBoolean(s["isPremiumPriority"])
      }).ToList();
    result["wallet"] = new { id = row.GetValueOrDefault("id"), balance = row.GetValueOrDefault("walletBalance"),
      totalTopUp = row.GetValueOrDefault("totalTopUp"), transactions };
    result["topUpRequests"] = topups;
    result["stalls"] = stalls;
    return Ok(ApiResponseFactory.Ok(result));
  }

  [HttpPost]
  public async Task<IActionResult> Create([FromBody] JsonElement body)
  {
    var tradeName = Required(body, "tradeName");
    var email = Required(body, "contactEmail").Trim().ToLowerInvariant();
    var password = Required(body, "password");
    var vendorCode = Optional(body, "vendorCode");
    if (string.IsNullOrWhiteSpace(vendorCode))
    {
      var countRow = await DatabaseSql.QueryRowsAsync(db, "SELECT COUNT(*) AS cnt FROM vendors");
      var nextId = 1ul;
      if (countRow.Count > 0 && countRow[0]["cnt"] != null)
      {
        nextId = Convert.ToUInt64(countRow[0]["cnt"]) + 1;
      }
      vendorCode = $"VND-{nextId:D4}";
    }
    var assignedTourId = Optional(body, "assignedTourId");
    if (string.IsNullOrWhiteSpace(assignedTourId))
    {
      // Fallback to the first active FestivalZone
      var fallbackRow = await DatabaseSql.QueryRowsAsync(db, "SELECT CAST(id AS CHAR) id FROM FestivalZones WHERE status!='ARCHIVED' ORDER BY id LIMIT 1");
      if (fallbackRow.Count > 0)
      {
        assignedTourId = fallbackRow[0]["id"] as string;
      }
      if (string.IsNullOrWhiteSpace(assignedTourId))
      {
        return BadRequest(ApiResponseFactory.Fail("assignedTourId.required"));
      }
    }

    var vendorId = Guid.NewGuid().ToString("D");
    var poiId = Guid.NewGuid().ToString("D");
    var vpuId = Guid.NewGuid().ToString("D");
    var walletId = Guid.NewGuid().ToString("D");
    var uniqueSlug = await GetUniqueSlugAsync(tradeName);

    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var insert = connection.CreateCommand();
    insert.Transaction = transaction.GetDbTransaction();
    insert.CommandText = """
      INSERT INTO vendors(id,legal_name,trade_name,slug,vendor_code,festival_zone_id,contact_name,email,status)
      VALUES(@vendorId,@name,@name,@slug,@code,@tour,@name,@email,'APPROVED')
      """;
    insert.AddParameter("@vendorId", vendorId);
    insert.AddParameter("@name", tradeName);
    insert.AddParameter("@slug", uniqueSlug);
    insert.AddParameter("@code", vendorCode);
    insert.AddParameter("@tour", assignedTourId);
    insert.AddParameter("@email", email);
    
    var insertedVendorRows = await insert.ExecuteNonQueryAsync();
    if (insertedVendorRows == 0)
    {
      await transaction.RollbackAsync();
      return StatusCode(500, ApiResponseFactory.Fail("vendor.create_failed"));
    }

    await using var provision = connection.CreateCommand();
    provision.Transaction = transaction.GetDbTransaction();
    provision.CommandText = """
      INSERT INTO vendor_portal_users(id,vendor_id,email,pass_hash,full_name,status) VALUES(@vpuId,@vendorId,@email,@hash,@name,'ACTIVE');
      INSERT INTO vendor_wallets(id,vendor_id,balance,total_top_up,total_spent,promo_balance) VALUES(@walletId,@vendorId,0,0,0,0);
      INSERT INTO Pois
        (id,festival_zone_id,vendor_id,stall_name,slug,description,latitude,longitude,trigger_radius,status,
         is_premium_priority,approval_status)
      VALUES
        (@poiId,@tour,@vendorId,@name,@slug,'Vui lòng cập nhật mô tả sạp hàng của bạn.',
         COALESCE((SELECT latitude FROM FestivalZones WHERE id=@tour),10.776076),
         COALESCE((SELECT longitude FROM FestivalZones WHERE id=@tour),106.700948),
         10,'ACTIVE',1,'PENDING');
      """;
    provision.AddParameter("@vpuId", vpuId);
    provision.AddParameter("@vendorId", vendorId);
    provision.AddParameter("@walletId", walletId);
    provision.AddParameter("@poiId", poiId);
    provision.AddParameter("@email", email);
    provision.AddParameter("@hash", BCrypt.Net.BCrypt.HashPassword(password, 12));
    provision.AddParameter("@name", tradeName);
    provision.AddParameter("@slug", uniqueSlug);
    provision.AddParameter("@tour", assignedTourId);

    var provisionRows = await provision.ExecuteNonQueryAsync();
    if (provisionRows == 0)
    {
      await transaction.RollbackAsync();
      return StatusCode(500, ApiResponseFactory.Fail("vendor.provision_failed"));
    }
    await transaction.CommitAsync();
    return await Detail(vendorId);
  }

  [HttpPut("{id}")]
  public async Task<IActionResult> Update(string id, [FromBody] JsonElement body)
  {
    var affected = await DatabaseSql.ExecuteAsync(db, """
      UPDATE vendors SET legal_name=COALESCE(@legal,legal_name),trade_name=COALESCE(@trade,trade_name),
        email=COALESCE(@email,email),vendor_code=COALESCE(@code,vendor_code),
        festival_zone_id=@tour WHERE id=@id
      """, new Dictionary<string, object?> { ["@id"] = id, ["@legal"] = Optional(body, "legalName") ?? Optional(body, "tradeName"),
        ["@trade"] = Optional(body, "tradeName"), ["@email"] = Optional(body, "contactEmail"),
        ["@code"] = Optional(body, "vendorCode"), ["@tour"] = Optional(body, "assignedTourId") });
    if (affected == 0) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));
    return await Detail(id);
  }

  [HttpPost("{id}/approve")] public Task<IActionResult> Approve(string id) => SetStatus(id, "APPROVED", null);
  [HttpPost("{id}/reject")] public Task<IActionResult> Reject(string id, [FromBody] ReasonRequest request) => SetStatus(id, "REJECTED", request.Reason);
  [HttpPost("{id}/suspend")] public Task<IActionResult> Suspend(string id, [FromBody] ReasonRequest request) => SetStatus(id, "SUSPENDED", request.Reason);
  [HttpPost("{id}/force-cancel")] public Task<IActionResult> Cancel(string id, [FromBody] ReasonRequest request) => SetStatus(id, "SUSPENDED", request.Reason);
  [HttpPost("{id}/unsuspend")] public Task<IActionResult> Unsuspend(string id) => SetStatus(id, "APPROVED", null);
  [HttpPut("{id}/status")]
  public Task<IActionResult> Status(string id, [FromBody] VendorStatusRequest request) => SetStatus(id, request.Status, request.Reason);

  private async Task<IActionResult> SetStatus(string id, string status, string? reason)
  {
    if (!new[] { "PENDING", "APPROVED", "REJECTED", "SUSPENDED" }.Contains(status))
      return BadRequest(ApiResponseFactory.Fail("vendor.invalid_status"));
    var actor = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var changed = await DatabaseSql.ExecuteAsync(db, """
      UPDATE vendors SET status=@status,rejection_reason=@reason,
        approved_by_user_id=IF(@status='APPROVED',@actor,approved_by_user_id),
        approved_at=IF(@status='APPROVED',NOW(),approved_at) WHERE id=@id
      """, new Dictionary<string, object?> { ["@status"] = status, ["@reason"] = reason,
        ["@actor"] = actor, ["@id"] = id });
    if (changed == 0) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));
    return await Detail(id);
  }

  private static Dictionary<string, object?> MapVendor(Dictionary<string, object?> row) => new()
  {
    ["id"] = row["id"], ["businessName"] = row["businessName"], ["ownerEmail"] = row["ownerEmail"],
    ["ownerDisplayName"] = row["ownerDisplayName"], ["contactPhone"] = row["contactPhone"],
    ["verificationStatus"] = row["verificationStatus"], ["createdAt"] = row["createdAt"],
    ["wallet"] = row["walletBalance"] is null ? null : new { id = row["id"], balance = row["walletBalance"], totalTopUp = row["totalTopUp"], transactions = Array.Empty<object>() },
    ["subscription"] = row["subscriptionStatus"] is null ? null : new { status = row["subscriptionStatus"], periodEnd = row["periodEnd"],
      plan = new { id = row["planId"], name = row["planName"], monthlyPrice = row["monthlyPrice"] } },
    ["stalls"] = Enumerable.Range(1, Convert.ToInt32(row["stallCount"] ?? 0)).Select(i => new { id = $"{row["id"]}-{i}" }).ToArray(),
    ["vendorCode"] = row.GetValueOrDefault("vendorCode"),
    ["assignedTourId"] = row.GetValueOrDefault("assignedTourId")
  };

  private async Task<string> GetUniqueSlugAsync(string name)
  {
    var baseSlug = Slugify(name);
    var slug = baseSlug;
    int suffix = 1;
    while (true)
    {
      var rows = await DatabaseSql.QueryRowsAsync(db,
        "SELECT COUNT(*) cnt FROM vendors WHERE slug = @slug",
        new Dictionary<string, object?> { ["@slug"] = slug });
      var exists = Convert.ToInt32(rows[0]["cnt"]) > 0;
      if (!exists) return slug;
      suffix++;
      slug = $"{baseSlug}-{suffix}";
    }
  }

  private static string Required(JsonElement body, string key) =>
    body.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(value.GetString())
      ? value.GetString()! : throw new ArgumentException($"{key}.required");
  private static string? Optional(JsonElement body, string key) =>
    body.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
  private static string Slugify(string value) => StringHelpers.Slugify(value);
}

public sealed record ReasonRequest(string? Reason);
public sealed record VendorStatusRequest(string Status, string? Reason);
