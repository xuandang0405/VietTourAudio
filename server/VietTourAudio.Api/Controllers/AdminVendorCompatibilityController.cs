using System.Data;
using System.Security.Claims;
using System.Text.Json;
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
    SELECT CAST(v.id AS CHAR) id,v.trade_name businessName,v.contact_email ownerEmail,
      v.contact_name ownerDisplayName,v.phone contactPhone,v.status verificationStatus,v.created_at createdAt,
      vw.balance walletBalance,vw.total_top_up totalTopUp,
      vs.status subscriptionStatus,vs.period_end periodEnd,
      CAST(sp.id AS CHAR) planId,sp.name planName,sp.price monthlyPrice,
      (SELECT COUNT(*) FROM stalls s WHERE s.vendor_id=v.id) stallCount,
      v.vendor_code vendorCode, CAST(v.assigned_tour_id AS CHAR) assignedTourId
    FROM vendors v
    LEFT JOIN vendor_wallets vw ON vw.vendor_id=v.id
    LEFT JOIN vendor_subscriptions vs ON vs.id=(
      SELECT latest_vs.id FROM vendor_subscriptions latest_vs
      WHERE latest_vs.vendor_id=v.id ORDER BY latest_vs.id DESC LIMIT 1
    )
    LEFT JOIN subscription_plans sp ON sp.id=vs.plan_id
    """;

  [HttpGet]
  public async Task<IActionResult> List([FromQuery] string status = "ALL", [FromQuery] string search = "")
  {
    var rows = await DatabaseSql.QueryRowsAsync(db, VendorSelect + "\n" + """
      WHERE (@status='ALL' OR v.status=@status)
        AND (@search='' OR v.trade_name LIKE CONCAT('%',@search,'%') OR v.contact_email LIKE CONCAT('%',@search,'%'))
      ORDER BY v.created_at DESC
      """, new Dictionary<string, object?> { ["@status"] = status, ["@search"] = search.Trim() });
    return Ok(ApiResponseFactory.Ok(rows.Select(MapVendor)));
  }

  [HttpGet("tours-list")]
  public async Task<IActionResult> Tours() => Ok(ApiResponseFactory.Ok(await DatabaseSql.QueryRowsAsync(db,
    "SELECT CAST(id AS CHAR) id,name,slug,status FROM tours WHERE status!='ARCHIVED' ORDER BY name")));

  [HttpGet("{id:long}")]
  public async Task<IActionResult> Detail(ulong id)
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
        proof_url proofImageUrl,note rejectReason,created_at createdAt,updated_at updatedAt
      FROM top_up_requests WHERE vendor_id=@id ORDER BY created_at DESC
      """, new Dictionary<string, object?> { ["@id"] = id });
    var stalls = (await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(id AS CHAR) id, name, description, latitude, longitude,
        activation_radius activationRadius, status, approval_status approvalStatus,
        zone_code zoneCode, is_premium isPremium,
        is_premium_priority isPremiumPriority
      FROM stalls WHERE vendor_id=@id ORDER BY id
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
      var maxIdRow = await DatabaseSql.QueryRowsAsync(db, "SELECT MAX(id) AS maxId FROM vendors");
      var nextId = 1ul;
      if (maxIdRow.Count > 0 && maxIdRow[0]["maxId"] != null && maxIdRow[0]["maxId"] != DBNull.Value)
      {
        nextId = Convert.ToUInt64(maxIdRow[0]["maxId"]) + 1;
      }
      vendorCode = $"VND-{nextId:D4}";
    }
    var assignedTourId = OptionalUlong(body, "assignedTourId");
    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var insert = connection.CreateCommand();
    insert.Transaction = transaction.GetDbTransaction();
    insert.CommandText = """
      INSERT INTO vendors(legal_name,trade_name,slug,vendor_code,assigned_tour_id,contact_name,contact_email,status)
      VALUES(@name,@name,@slug,@code,@tour,@name,@email,'APPROVED')
      """;
    insert.AddParameter("@name", tradeName); insert.AddParameter("@slug", Slugify(tradeName));
    insert.AddParameter("@code", vendorCode); insert.AddParameter("@tour", assignedTourId); insert.AddParameter("@email", email);
    var insertedVendorRows = await insert.ExecuteNonQueryAsync();
    if (insertedVendorRows == 0)
    {
      await transaction.RollbackAsync();
      return StatusCode(500, ApiResponseFactory.Fail("vendor.create_failed"));
    }
    await using var identity = connection.CreateCommand();
    identity.Transaction = transaction.GetDbTransaction();
    identity.CommandText = "SELECT LAST_INSERT_ID()";
    var id = Convert.ToUInt64(await identity.ExecuteScalarAsync());

    await using var provision = connection.CreateCommand();
    provision.Transaction = transaction.GetDbTransaction();
    provision.CommandText = """
      INSERT INTO vendor_portal_users(vendor_id,email,pass_hash,full_name,status) VALUES(@id,@email,@hash,@name,'ACTIVE');
      INSERT INTO vendor_wallets(vendor_id,balance,total_top_up,total_spent,total_commission) VALUES(@id,0,0,0,0);
      INSERT INTO stalls
        (vendor_id,name,slug,description,latitude,longitude,activation_radius,status,
         is_premium,is_premium_priority,priority_score,zone_code,approval_status)
      VALUES
        (@id,@name,@slug,'Vui lòng cập nhật mô tả sạp hàng của bạn.',
         COALESCE((SELECT latitude FROM tours WHERE id=@tour),10.776076),
         COALESCE((SELECT longitude FROM tours WHERE id=@tour),106.700948),
         10,'PENDING',0,1,100,CONCAT('STALL-',@id),'PENDING');

      SET @stallId = LAST_INSERT_ID();

      INSERT INTO zones(tour_id,stall_id,name,slug,description,latitude,longitude,activation_radius,status,approval_status)
      SELECT COALESCE(@tour,(SELECT id FROM tours WHERE status!='ARCHIVED' ORDER BY id LIMIT 1)),
        @stallId,@name,@slug,'Vui lòng cập nhật mô tả sạp hàng của bạn.',
        COALESCE(t.latitude,(SELECT AVG(z.latitude) FROM zones z WHERE z.tour_id=t.id)),
        COALESCE(t.longitude,(SELECT AVG(z.longitude) FROM zones z WHERE z.tour_id=t.id)),
        10,'ACTIVE','PENDING'
      FROM tours t
      WHERE t.id=COALESCE(@tour,(SELECT id FROM tours WHERE status!='ARCHIVED' ORDER BY id LIMIT 1));
      """;
    provision.AddParameter("@id", id);
    provision.AddParameter("@email", email);
    provision.AddParameter("@hash", BCrypt.Net.BCrypt.HashPassword(password, 12));
    provision.AddParameter("@name", tradeName);
    provision.AddParameter("@slug", Slugify(tradeName));
    provision.AddParameter("@tour", assignedTourId);
    var provisionRows = await provision.ExecuteNonQueryAsync();
    if (provisionRows == 0)
    {
      await transaction.RollbackAsync();
      return StatusCode(500, ApiResponseFactory.Fail("vendor.provision_failed"));
    }
    await transaction.CommitAsync();
    return await Detail(id);
  }

  [HttpPut("{id:long}")]
  public async Task<IActionResult> Update(ulong id, [FromBody] JsonElement body)
  {
    var affected = await DatabaseSql.ExecuteAsync(db, """
      UPDATE vendors SET legal_name=COALESCE(@legal,legal_name),trade_name=COALESCE(@trade,trade_name),
        contact_email=COALESCE(@email,contact_email),vendor_code=COALESCE(@code,vendor_code),
        assigned_tour_id=@tour WHERE id=@id
      """, new Dictionary<string, object?> { ["@id"] = id, ["@legal"] = Optional(body, "legalName") ?? Optional(body, "tradeName"),
        ["@trade"] = Optional(body, "tradeName"), ["@email"] = Optional(body, "contactEmail"),
        ["@code"] = Optional(body, "vendorCode"), ["@tour"] = OptionalUlong(body, "assignedTourId") });
    if (affected == 0) return NotFound(ApiResponseFactory.Fail("vendor.not_found"));
    return await Detail(id);
  }

  [HttpPost("{id:long}/approve")] public Task<IActionResult> Approve(ulong id) => SetStatus(id, "APPROVED", null);
  [HttpPost("{id:long}/reject")] public Task<IActionResult> Reject(ulong id, [FromBody] ReasonRequest request) => SetStatus(id, "REJECTED", request.Reason);
  [HttpPost("{id:long}/suspend")] public Task<IActionResult> Suspend(ulong id, [FromBody] ReasonRequest request) => SetStatus(id, "SUSPENDED", request.Reason);
  [HttpPost("{id:long}/force-cancel")] public Task<IActionResult> Cancel(ulong id, [FromBody] ReasonRequest request) => SetStatus(id, "SUSPENDED", request.Reason);
  [HttpPost("{id:long}/unsuspend")] public Task<IActionResult> Unsuspend(ulong id) => SetStatus(id, "APPROVED", null);
  [HttpPut("{id:long}/status")]
  public Task<IActionResult> Status(ulong id, [FromBody] VendorStatusRequest request) => SetStatus(id, request.Status, request.Reason);

  private async Task<IActionResult> SetStatus(ulong id, string status, string? reason)
  {
    if (!new[] { "PENDING", "APPROVED", "REJECTED", "SUSPENDED" }.Contains(status))
      return BadRequest(ApiResponseFactory.Fail("vendor.invalid_status"));
    var actor = ulong.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
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

  private static string Required(JsonElement body, string key) =>
    body.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(value.GetString())
      ? value.GetString()! : throw new ArgumentException($"{key}.required");
  private static string? Optional(JsonElement body, string key) =>
    body.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
  private static ulong? OptionalUlong(JsonElement body, string key) =>
    body.TryGetProperty(key, out var value) && value.ValueKind is not JsonValueKind.Null and not JsonValueKind.Undefined &&
    ulong.TryParse(value.ToString(), out var result) ? result : null;
  private static string Slugify(string value) => StringHelpers.Slugify(value);
}

public sealed record ReasonRequest(string? Reason);
public sealed record VendorStatusRequest(string Status, string? Reason);
