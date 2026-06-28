using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

public abstract class CompatibilityAuthController(IAuthService auth) : ControllerBase
{
  protected IAuthService Auth { get; } = auth;
  protected async Task<IActionResult> LoginCore(LoginRequestDto request, string requiredRole)
  {
    var result = await Auth.LoginAsync(request);
    if (requiredRole == "VENDOR" && result.User.Role != "VENDOR") return Forbid();
    if (requiredRole == "ADMIN" && !new[] { "SUPER_ADMIN", "ADMIN", "ZONE_ADMIN", "MODERATOR", "FINANCE" }.Contains(result.User.Role)) return Forbid();
    return Ok(ApiResponseFactory.Ok(new { token = result.AccessToken, accessToken = result.AccessToken,
      refreshToken = result.RefreshToken, user = result.User }));
  }

  protected async Task<IActionResult> RefreshCore(RefreshRequest request, string requiredRole)
  {
    var result = await Auth.RefreshAsync(request.RefreshToken);
    if (requiredRole == "VENDOR" && result.User.Role != "VENDOR") return Forbid();
    if (requiredRole == "ADMIN" && !new[] { "SUPER_ADMIN", "ADMIN", "ZONE_ADMIN", "MODERATOR", "FINANCE" }.Contains(result.User.Role)) return Forbid();
    return Ok(ApiResponseFactory.Ok(new { token = result.AccessToken, accessToken = result.AccessToken,
      refreshToken = result.RefreshToken, user = result.User }));
  }
}

[ApiController]
[Route("api/vendor/auth")]
public sealed class VendorAuthController(IAuthService auth) : CompatibilityAuthController(auth)
{
  [HttpPost("login")] public Task<IActionResult> Login(LoginRequestDto request) => LoginCore(request, "VENDOR");
  [HttpPost("refresh")] public Task<IActionResult> Refresh(RefreshRequest request) => RefreshCore(request, "VENDOR");
  [Authorize(Roles = "VENDOR")][HttpGet("me")] public async Task<IActionResult> Me() => Ok(ApiResponseFactory.Ok(await Auth.GetCurrentUserAsync()));
  [HttpPost("logout")] public IActionResult Logout() => Ok(ApiResponseFactory.Ok(true));
}

[ApiController]
[Route("api/admin/auth")]
public sealed class AdminAuthController(IAuthService auth) : CompatibilityAuthController(auth)
{
  [HttpPost("login")] public Task<IActionResult> Login(LoginRequestDto request) => LoginCore(request, "ADMIN");
  [HttpPost("refresh")] public Task<IActionResult> Refresh(RefreshRequest request) => RefreshCore(request, "ADMIN");
  [Authorize(Roles = "SUPER_ADMIN,ADMIN,ZONE_ADMIN,MODERATOR,FINANCE")][HttpGet("me")] public async Task<IActionResult> Me() => Ok(ApiResponseFactory.Ok(await Auth.GetCurrentUserAsync()));
  [HttpPost("logout")] public IActionResult Logout() => Ok(ApiResponseFactory.Ok(true));
}

public sealed record RefreshRequest(string RefreshToken);
