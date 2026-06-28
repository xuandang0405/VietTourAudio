using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "SUPER_ADMIN,ADMIN")]
public sealed class UserController(IUserService users, AppDbContext db) : ControllerBase
{
  [HttpGet]
  public async Task<IActionResult> GetAll() =>
    Ok(ApiResponseFactory.Ok(await users.GetUsersAsync()));

  [HttpGet("{id:long}")]
  public async Task<IActionResult> GetById(ulong id) =>
    Ok(ApiResponseFactory.Ok(await users.GetByIdAsync(id)));

  [HttpPost]
  public async Task<IActionResult> Create([FromBody] AdminUserRequest request)
  {
    var email = request.Email.Trim().ToLowerInvariant();
    if (await db.Users.AnyAsync(x => x.Email == email))
      return Conflict(ApiResponseFactory.Fail("auth.email_exists"));
    var user = new User
    {
      Email = email, FullName = request.FullName.Trim(),
      PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
      Role = ParseRole(request.Role), Status = request.Status, AssignedZoneId = request.AssignedZoneId,
      CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
    };
    db.Users.Add(user); await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(Map(user)));
  }

  [HttpPut("{id:long}")]
  public async Task<IActionResult> Update(ulong id, [FromBody] AdminUserRequest request)
  {
    var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id);
    if (user is null) return NotFound(ApiResponseFactory.Fail("user.not_found"));
    user.Email = request.Email.Trim().ToLowerInvariant(); user.FullName = request.FullName.Trim();
    user.Role = ParseRole(request.Role); user.Status = request.Status; user.AssignedZoneId = request.AssignedZoneId;
    if (!string.IsNullOrWhiteSpace(request.Password))
      user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12);
    user.UpdatedAt = DateTime.UtcNow; await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(Map(user)));
  }

  [HttpDelete("{id:long}")]
  public async Task<IActionResult> Delete(ulong id)
  {
    var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id);
    if (user is null) return NotFound(ApiResponseFactory.Fail("user.not_found"));
    user.Status = UserStatus.DISABLED; user.UpdatedAt = DateTime.UtcNow; await db.SaveChangesAsync();
    return Ok(ApiResponseFactory.Ok(true));
  }

  private static object Map(User user) => new { id = user.Id.ToString(), user.FullName, user.Email,
    role = user.Role.ToString(), status = user.Status.ToString(), user.AssignedZoneId };

  private static UserRole ParseRole(string role) =>
    Enum.TryParse<UserRole>(role, true, out var value) && value is not UserRole.VENDOR and not UserRole.USER
      ? value : throw new ArgumentException("user.invalid_role");
}

public sealed record AdminUserRequest(string FullName, string Email, string Password, string Role,
  UserStatus Status = UserStatus.ACTIVE, ulong? AssignedZoneId = null);
