using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
  private readonly IAuthService _authService;

  public AuthController(IAuthService authService)
  {
    _authService = authService;
  }

  [HttpPost("register")]
  public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
  {
    var result = await _authService.RegisterAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Đăng ký tài khoản thành công."));
  }

  [HttpPost("login")]
  public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
  {
    var result = await _authService.LoginAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Đăng nhập thành công."));
  }

  [Authorize]
  [HttpGet("me")]
  public async Task<IActionResult> Me()
  {
    var result = await _authService.GetCurrentUserAsync();
    return Ok(ApiResponseFactory.Ok(result, "Thông tin người dùng hiện tại."));
  }
}
