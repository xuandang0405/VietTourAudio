using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace VietTourAudio.Api.Services;

public sealed class DatabaseIdentityService(
  AppDbContext db,
  IConfiguration configuration,
  IHttpContextAccessor httpContextAccessor) : IAuthService
{
  public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
  {
    var email = request.Email.Trim().ToLowerInvariant();
    var admin = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Email == email);
    if (admin is not null)
    {
      if (admin.Status != UserStatus.ACTIVE || !BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
        throw new UnauthorizedAccessException("auth.invalid_credentials");
      return CreateToken(new UserResponseDto(admin.Id, admin.FullName, admin.Email, null, admin.Role.ToString(), admin.Status.ToString()), null);
    }

    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = """
      SELECT vpu.id, vpu.vendor_id, vpu.email, vpu.pass_hash, vpu.full_name, vpu.status
      FROM vendor_portal_users vpu JOIN Vendors v ON v.id = vpu.vendor_id
      WHERE vpu.email = @email LIMIT 1
      """;
    command.AddParameter("@email", email);
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync() ||
        reader.GetString(reader.GetOrdinal("status")) != "ACTIVE" ||
        !BCrypt.Net.BCrypt.Verify(request.Password, reader.GetString(reader.GetOrdinal("pass_hash"))))
      throw new UnauthorizedAccessException("auth.invalid_credentials");

    var id = reader.GetString(reader.GetOrdinal("id"));
    var vendorId = reader.GetString(reader.GetOrdinal("vendor_id"));
    return CreateToken(new UserResponseDto(id, reader.GetString(reader.GetOrdinal("full_name")), email, null, "VENDOR", "ACTIVE"), vendorId);
  }

  public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
  {
    var email = request.Email.Trim().ToLowerInvariant();
    if (await db.Users.AnyAsync(x => x.Email == email)) throw new InvalidOperationException("auth.email_exists");
    var user = new User
    {
      Email = email,
      PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
      FullName = request.FullName.Trim(),
      Role = UserRole.USER,
      Status = UserStatus.PENDING,
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return CreateToken(new UserResponseDto(user.Id, user.FullName, user.Email, request.Phone, user.Role.ToString(), user.Status.ToString()), null);
  }

  public async Task<UserResponseDto> GetCurrentUserAsync()
  {
    var principal = httpContextAccessor.HttpContext?.User ?? throw new UnauthorizedAccessException();
    var id = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
    var role = principal.FindFirstValue(ClaimTypes.Role) ?? "";
    if (role == "VENDOR")
    {
      var connection = await DatabaseSql.OpenConnectionAsync(db);
      await using var command = connection.CreateCommand();
      command.CommandText = "SELECT full_name,email,status FROM vendor_portal_users WHERE id=@id LIMIT 1";
      command.AddParameter("@id", id);
      await using var reader = await command.ExecuteReaderAsync();
      if (!await reader.ReadAsync()) throw new KeyNotFoundException();
      return new UserResponseDto(id, reader.GetString(0), reader.GetString(1), null, role, reader.GetString(2));
    }
    var user = await db.Users.AsNoTracking().SingleAsync(x => x.Id == id);
    return new UserResponseDto(user.Id, user.FullName, user.Email, null, user.Role.ToString(), user.Status.ToString());
  }

  public async Task<AuthResponseDto> RefreshAsync(string refreshToken)
  {
    if (string.IsNullOrWhiteSpace(refreshToken)) throw new UnauthorizedAccessException("auth.refresh_required");
    var handler = new JwtSecurityTokenHandler();
    var secret = configuration["Jwt:RefreshKey"] ?? configuration["Jwt:Key"] + "-refresh";
    ClaimsPrincipal principal;
    try
    {
      principal = handler.ValidateToken(refreshToken, new TokenValidationParameters
      {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = configuration["Jwt:Issuer"] ?? "VietTourAudio",
        ValidAudience = configuration["Jwt:Audience"] ?? "VietTourAudioClient",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        ClockSkew = TimeSpan.FromSeconds(30)
      }, out _);
    }
    catch
    {
      throw new UnauthorizedAccessException("auth.invalid_refresh_token");
    }
    if (principal.FindFirstValue("token_type") != "refresh")
      throw new UnauthorizedAccessException("auth.invalid_refresh_token");

    var id = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
    var role = principal.FindFirstValue(ClaimTypes.Role) ?? throw new UnauthorizedAccessException();
    var email = principal.FindFirstValue(ClaimTypes.Email) ?? throw new UnauthorizedAccessException();
    var name = principal.FindFirstValue(ClaimTypes.Name) ?? email;
    var vendorId = principal.FindFirstValue("vendor_id");

    if (role == "VENDOR")
    {
      var connection = await DatabaseSql.OpenConnectionAsync(db);
      await using var command = connection.CreateCommand();
      command.CommandText = """
        SELECT vpu.status, v.id FROM vendor_portal_users vpu
        JOIN Vendors v ON v.id=vpu.vendor_id WHERE vpu.id=@id AND vpu.vendor_id=@vendorId LIMIT 1
        """;
      command.AddParameter("@id", id);
      command.AddParameter("@vendorId", vendorId);
      await using var reader = await command.ExecuteReaderAsync();
      if (!await reader.ReadAsync() || reader.GetString(0) != "ACTIVE")
        throw new UnauthorizedAccessException("auth.account_inactive");
    }
    else
    {
      var account = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
      if (account is null || account.Status != UserStatus.ACTIVE || account.Role.ToString() != role)
        throw new UnauthorizedAccessException("auth.account_inactive");
    }
    return CreateToken(new UserResponseDto(id, name, email, null, role, "ACTIVE"), vendorId);
  }

  private AuthResponseDto CreateToken(UserResponseDto user, string? vendorId)
  {
    var expiresAt = DateTime.UtcNow.AddMinutes(configuration.GetValue("Jwt:ExpiresMinutes", 15));
    var claims = new List<Claim>
    {
      new(ClaimTypes.NameIdentifier, user.Id),
      new(ClaimTypes.Email, user.Email),
      new(ClaimTypes.Name, user.FullName),
      new(ClaimTypes.Role, user.Role),
      new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
      new("token_type", "access")
    };
    if (!string.IsNullOrEmpty(vendorId)) claims.Add(new("vendor_id", vendorId));
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
    var token = new JwtSecurityToken(
      configuration["Jwt:Issuer"], configuration["Jwt:Audience"], claims,
      expires: expiresAt, signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
    var refreshClaims = claims.Where(x => x.Type != "token_type").Append(new Claim("token_type", "refresh"));
    var refreshKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
      configuration["Jwt:RefreshKey"] ?? configuration["Jwt:Key"] + "-refresh"));
    var refresh = new JwtSecurityToken(
      configuration["Jwt:Issuer"], configuration["Jwt:Audience"], refreshClaims,
      expires: DateTime.UtcNow.AddDays(configuration.GetValue("Jwt:RefreshExpiresDays", 7)),
      signingCredentials: new SigningCredentials(refreshKey, SecurityAlgorithms.HmacSha256));
    var handler = new JwtSecurityTokenHandler();
    return new AuthResponseDto(handler.WriteToken(token), handler.WriteToken(refresh), expiresAt, user);
  }
}

public sealed class DatabaseUserService(AppDbContext db) : IUserService
{
  public async Task<IReadOnlyList<UserResponseDto>> GetUsersAsync() =>
    await db.Users.AsNoTracking().OrderBy(x => x.Id)
      .Select(x => new UserResponseDto(x.Id, x.FullName, x.Email, null, x.Role.ToString(), x.Status.ToString()))
      .ToListAsync();

  public async Task<UserResponseDto> GetByIdAsync(string id)
  {
    var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id) ?? throw new KeyNotFoundException();
    return new UserResponseDto(user.Id, user.FullName, user.Email, null, user.Role.ToString(), user.Status.ToString());
  }
}
