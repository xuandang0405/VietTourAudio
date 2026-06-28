using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/notifications")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN,ZONE_ADMIN,MODERATOR,FINANCE")]
public sealed class NotificationController(AppDbContext db) : ControllerBase
{
  [HttpGet]
  public async Task<IActionResult> List()
  {
    var rows = await db.Database.SqlQuery<NotificationRow>($"""
      SELECT n.id Id,n.notification_type Type,n.title Title,n.message Message,n.is_read IsRead,
        n.created_at CreatedAt,v.trade_name VendorName
      FROM admin_notifications n LEFT JOIN vendors v ON v.id=n.vendor_id ORDER BY n.created_at DESC LIMIT 30
      """).ToListAsync();
    return Ok(ApiResponseFactory.Ok(rows.Select(x => new { id = x.Id.ToString(), x.Type, x.Title, x.Message, x.IsRead, x.CreatedAt, x.VendorName })));
  }
  [HttpPost("{id:long}/read")]
  public async Task<IActionResult> Read(ulong id)
  {
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE admin_notifications SET is_read=1 WHERE id={id}");
    return Ok(ApiResponseFactory.Ok(true));
  }
}
public sealed class NotificationRow { public ulong Id { get; set; } public string Type { get; set; } = "";
  public string Title { get; set; } = ""; public string Message { get; set; } = ""; public bool IsRead { get; set; }
  public DateTime CreatedAt { get; set; } public string? VendorName { get; set; } }
