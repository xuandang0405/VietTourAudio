using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
  [HttpPost("register")]
  public async Task<IActionResult> Register([FromBody] RegisterRequestDto request) =>
    Ok(ApiResponseFactory.Ok(await auth.RegisterAsync(request)));

  [HttpPost("login")]
  public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
  {
    try
    {
      return Ok(ApiResponseFactory.Ok(await auth.LoginAsync(request)));
    }
    catch (UnauthorizedAccessException ex) when (ex.Message == "auth.account_locked")
    {
      return StatusCode(StatusCodes.Status403Forbidden, new {
        success = false,
        error = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.",
        message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin."
      });
    }
  }

  [HttpPost("refresh")]
  public async Task<IActionResult> Refresh([FromBody] RefreshRequest request) =>
    Ok(ApiResponseFactory.Ok(await auth.RefreshAsync(request.RefreshToken)));

  [Authorize]
  [HttpGet("me")]
  public async Task<IActionResult> Me() =>
    Ok(ApiResponseFactory.Ok(await auth.GetCurrentUserAsync()));
}
