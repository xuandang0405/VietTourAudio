using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/tickets")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class SystemTicketController(AppDbContext db) : ControllerBase
{
  [HttpGet]
  public async Task<IActionResult> List() =>
    Ok(ApiResponseFactory.Ok(await db.SystemTickets.AsNoTracking().OrderByDescending(x => x.CreatedAt)
      .Select(x => new { id = x.Id, email = x.SenderEmail, x.Subject, x.Message,
        status = x.Status.ToString(), x.CreatedAt, x.UpdatedAt }).ToListAsync()));

  [HttpPatch("{id}/resolve")]
  [HttpPost("{id}/resolve")]
  public async Task<IActionResult> Resolve(string id)
  {
    var ticket = await db.SystemTickets.SingleAsync(x => x.Id == id);
    ticket.Status = TicketStatus.PROCESSED; ticket.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(new { id = id, status = ticket.Status.ToString() }));
  }
}
