using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Entities;
using VietTourAudio.Api.Domain;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/stalls")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class AdminStallController(AppDbContext db) : ControllerBase
{
  /// <summary>
  /// Grant multi-premium to ALL stalls of a vendor (paid expansion pipeline).
  /// Sets IsPremium=1, IsPremiumPriority=1, TriggerRadius=10, and 30-day expiry on all stalls.
  /// </summary>
  [HttpPost("grant-multi-premium")]
  public async Task<IActionResult> GrantMultiPremium([FromBody] GrantMultiPremiumRequest request)
  {
    if (request.VendorId <= 0)
      return BadRequest(ApiResponseFactory.Fail("vendor_id is required"));

    var affected = await DatabaseSql.ExecuteAsync(db, """
      UPDATE stalls
      SET is_premium = 1,
          is_premium_priority = 1,
          activation_radius = 10,
          priority_score = 100,
          premium_activation_date = NOW(),
          premium_expiry_date = DATE_ADD(NOW(), INTERVAL 30 DAY),
          updated_at = NOW()
      WHERE vendor_id = @vendorId
      """, new Dictionary<string, object?> { ["@vendorId"] = request.VendorId });
    if (affected == 0)
      return NotFound(ApiResponseFactory.Fail("stall.not_found"));

    return Ok(ApiResponseFactory.Ok(new
    {
      updated = affected,
      vendorId = request.VendorId,
      message = $"Đã cấp Premium cho {affected} sạp hàng với thời hạn 30 ngày."
    }));
  }

  /// <summary>
  /// Switch premium priority to a specific stall (and unset others for the same vendor).
  /// The selected stall gets IsPremiumPriority=true + TriggerRadius=10.
  /// </summary>
  [HttpPut("{stallId:long}/premium-priority")]
  public async Task<IActionResult> SetPremiumPriority(ulong stallId, [FromBody] PremiumPriorityRequest request)
  {
    // First, unset priority on all stalls for this vendor
    var cleared = await DatabaseSql.ExecuteAsync(db, """
      UPDATE stalls
      SET is_premium_priority = 0,
          activation_radius = 3,
          updated_at = NOW()
      WHERE vendor_id = @vendorId
      """, new Dictionary<string, object?> { ["@vendorId"] = request.VendorId });
    if (cleared == 0)
      return NotFound(ApiResponseFactory.Fail("stall.not_found"));

    // Then set priority on the selected stall
    var setPriority = await DatabaseSql.ExecuteAsync(db, """
      UPDATE stalls
      SET is_premium_priority = 1,
          activation_radius = 10,
          updated_at = NOW()
      WHERE id = @stallId AND vendor_id = @vendorId
      """, new Dictionary<string, object?>
    {
      ["@stallId"] = stallId,
      ["@vendorId"] = request.VendorId
    });
    if (setPriority == 0)
      return NotFound(ApiResponseFactory.Fail("stall.not_found"));

    return Ok(ApiResponseFactory.Ok(new
    {
      stallId = stallId.ToString(),
      isPremiumPriority = true,
      triggerRadius = 10,
      message = "Đã chuyển đặc quyền phát Premium sang sạp được chọn."
    }));
  }

  /// <summary>
  /// Admin-only stall creation for a vendor, bypassing the standard premium/count blockers.
  /// Max 3 stalls total per vendor.
  /// </summary>
  [HttpPost("create-for-vendor")]
  public async Task<IActionResult> CreateStallForVendor([FromBody] AdminCreateStallRequest request)
  {
    if (string.IsNullOrWhiteSpace(request.Name))
      return BadRequest(ApiResponseFactory.Fail("Tên sạp không được để trống"));

    var connection = await DatabaseSql.OpenConnectionAsync(db);

    // Check current stall count
    await using var countCmd = connection.CreateCommand();
    countCmd.CommandText = "SELECT COUNT(*) FROM stalls WHERE vendor_id=@vendorId";
    countCmd.AddParameter("@vendorId", request.VendorId);
    var currentCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());

    if (currentCount >= 3)
      return Conflict(ApiResponseFactory.Fail("Vendor đã đạt giới hạn tối đa 3 sạp hàng."));

    var slug = $"{Slugify(request.Name)}-{Guid.NewGuid():N}"[..Math.Min(80, Slugify(request.Name).Length + 33)];
    var zoneCode = $"STALL-ADM-{Guid.NewGuid():N}"[..30];

    await using var insert = connection.CreateCommand();
    insert.CommandText = """
      INSERT INTO stalls
        (vendor_id,name,slug,description,latitude,longitude,activation_radius,status,
         is_premium,is_premium_priority,priority_score,zone_code,approval_status)
      VALUES
        (@vendorId,@name,@slug,@description,@latitude,@longitude,3,'APPROVED',
         0,0,0,@zoneCode,'APPROVED')
      """;
    insert.AddParameter("@vendorId", request.VendorId);
    insert.AddParameter("@name", request.Name.Trim());
    insert.AddParameter("@slug", slug);
    insert.AddParameter("@description", request.Description ?? "Sạp phụ được Admin tạo.");
    insert.AddParameter("@latitude", request.Latitude);
    insert.AddParameter("@longitude", request.Longitude);
    insert.AddParameter("@zoneCode", zoneCode);
    var inserted = await insert.ExecuteNonQueryAsync();
    if (inserted == 0)
    {
      return StatusCode(500, ApiResponseFactory.Fail("stall.create_failed"));
    }

    // Auto-create a POI (zone) for the new stall
    await using var createPoi = connection.CreateCommand();
    createPoi.CommandText = """
      INSERT INTO zones
        (tour_id,stall_id,name,slug,description,latitude,longitude,
         activation_radius,status,approval_status)
      SELECT COALESCE(v.assigned_tour_id,(SELECT id FROM tours WHERE status!='ARCHIVED' ORDER BY id LIMIT 1)),
        LAST_INSERT_ID(),@name,CONCAT(@slug,'-poi'),@description,@latitude,@longitude,
        3,'ACTIVE','APPROVED'
      FROM vendors v
      WHERE v.id=@vendorId
        AND COALESCE(v.assigned_tour_id,(SELECT id FROM tours WHERE status!='ARCHIVED' ORDER BY id LIMIT 1)) IS NOT NULL
      """;
    createPoi.AddParameter("@vendorId", request.VendorId);
    createPoi.AddParameter("@name", request.Name.Trim());
    createPoi.AddParameter("@slug", slug);
    createPoi.AddParameter("@description", request.Description ?? "Sạp phụ được Admin tạo.");
    createPoi.AddParameter("@latitude", request.Latitude);
    createPoi.AddParameter("@longitude", request.Longitude);
    var poiCreated = await createPoi.ExecuteNonQueryAsync();
    if (poiCreated == 0)
    {
      return StatusCode(500, ApiResponseFactory.Fail("poi.create_failed"));
    }

    return Ok(ApiResponseFactory.Ok(new
    {
      created = true,
      vendorId = request.VendorId,
      stallCount = currentCount + 1,
      message = "Admin đã tạo sạp phụ thành công cho vendor."
    }));
  }

  /// <summary>
  /// Get all pending stalls/POIs for Admin review.
  /// Queries from the same Pois table where ApprovalStatus == "PENDING".
  /// </summary>
  [HttpGet("pending")]
  public async Task<IActionResult> GetPendingStallsForReview()
  {
    var pendingStalls = await db.Pois
      .Where(p => p.ApprovalStatus == ApprovalStatus.PENDING)
      .AsNoTracking()
      .ToListAsync();

    return Ok(ApiResponseFactory.Ok(pendingStalls));
  }

  /// <summary>
  /// Get detail of a specific stall/POI.
  /// </summary>
  [HttpGet("{id:long}")]
  public async Task<IActionResult> GetStallDetailForAdminEdit([FromRoute] ulong id)
  {
    var stall = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (stall == null) 
      return NotFound(ApiResponseFactory.Fail("Không tìm thấy sạp hàng."));
    return Ok(ApiResponseFactory.Ok(stall));
  }

  /// <summary>
  /// Approve a pending stall/POI request.
  /// </summary>
  [HttpPost("{id:long}/approve")]
  public async Task<IActionResult> ApproveStall([FromRoute] ulong id)
  {
    var stall = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (stall == null)
      return NotFound(ApiResponseFactory.Fail("Không tìm thấy sạp hàng."));

    stall.ApprovalStatus = ApprovalStatus.APPROVED;
    stall.UpdatedAt = DateTime.UtcNow;
    var saved = await db.SaveChangesAsync();
    if (saved == 0)
      return StatusCode(500, ApiResponseFactory.Fail("stall.approve_failed"));

    return Ok(ApiResponseFactory.Ok(new { success = true, id = id.ToString(), approvalStatus = "APPROVED" }));
  }

  /// <summary>
  /// Reject a pending stall/POI request.
  /// </summary>
  [HttpPost("{id:long}/reject")]
  public async Task<IActionResult> RejectStall([FromRoute] ulong id)
  {
    var stall = await db.Pois.FirstOrDefaultAsync(p => p.Id == id);
    if (stall == null)
      return NotFound(ApiResponseFactory.Fail("Không tìm thấy sạp hàng."));

    stall.ApprovalStatus = ApprovalStatus.REJECTED;
    stall.UpdatedAt = DateTime.UtcNow;
    var saved = await db.SaveChangesAsync();
    if (saved == 0)
      return StatusCode(500, ApiResponseFactory.Fail("stall.reject_failed"));

    return Ok(ApiResponseFactory.Ok(new { success = true, id = id.ToString(), approvalStatus = "REJECTED" }));
  }

  private static string Slugify(string value) => StringHelpers.Slugify(value);
}

public sealed record GrantMultiPremiumRequest(ulong VendorId);
public sealed record PremiumPriorityRequest(ulong VendorId);
public sealed record AdminCreateStallRequest(ulong VendorId, string Name, string? Description, decimal Latitude, decimal Longitude);
