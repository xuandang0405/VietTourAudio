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
    try
    {
      var result = await Auth.LoginAsync(request);
      if (requiredRole == "VENDOR" && result.User.Role != "VENDOR") return Forbid();
      if (requiredRole == "ADMIN" && !new[] { "SUPER_ADMIN", "ADMIN", "ZONE_ADMIN", "MODERATOR", "FINANCE" }.Contains(result.User.Role)) return Forbid();
      return Ok(ApiResponseFactory.Ok(new { token = result.AccessToken, accessToken = result.AccessToken,
        refreshToken = result.RefreshToken, user = result.User }));
    }
    catch (UnauthorizedAccessException ex)
    {
      Console.ForegroundColor = ConsoleColor.Yellow;
      Console.WriteLine($"[AUTH FAILED]: Invalid login attempt for email: {request.Email}");
      Console.ResetColor();

      if (ex.Message == "auth.account_locked")
      {
        return StatusCode(StatusCodes.Status403Forbidden, new { 
          success = false, 
          errorCode = "ACCOUNT_LOCKED", 
          error = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.",
          message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin." 
        });
      }

      return Unauthorized(new { 
        success = false, 
        errorCode = "INVALID_CREDENTIALS", 
        error = "Tài khoản hoặc mật khẩu không chính xác.",
        message = "Tài khoản hoặc mật khẩu không chính xác." 
      });
    }
    catch (System.Exception ex)
    {
      Console.WriteLine($"[AUTH ERROR]: {ex.Message}");
      return StatusCode(500, new { success = false, message = "Lỗi máy chủ nội bộ. Vui lòng thử lại sau." });
    }
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
