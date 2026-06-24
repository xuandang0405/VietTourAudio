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
    try
    {
      var result = await _authService.RegisterAsync(request);
      return Ok(ApiResponseFactory.Ok(result, "Đăng ký tài khoản thành công."));
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [HttpPost("login")]
  public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
  {
    try
    {
      var result = await _authService.LoginAsync(request);
      return Ok(ApiResponseFactory.Ok(result, "Đăng nhập thành công."));
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize]
  [HttpGet("me")]
  public async Task<IActionResult> Me()
  {
    try
    {
      var result = await _authService.GetCurrentUserAsync();
      return Ok(ApiResponseFactory.Ok(result, "Thông tin người dùng hiện tại."));
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize]
  [HttpGet("premium-status")]
  public async Task<IActionResult> PremiumStatus()
  {
    try
    {
      var result = await _authService.GetPremiumStatusAsync();
      return Ok(ApiResponseFactory.Ok(result, "Trạng thái premium hiện tại."));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(ApiResponseFactory.Fail(ex.Message));
    }
  }
}
