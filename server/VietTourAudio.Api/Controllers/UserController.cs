using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
  private readonly IUserService _userService;

  public UserController(IUserService userService)
  {
    _userService = userService;
  }

  [HttpGet]
  public async Task<IActionResult> GetAll()
  {
    var result = await _userService.GetUsersAsync();
    return Ok(ApiResponseFactory.Ok(result, "Danh sách người dùng."));
  }

  [HttpGet("{id:long}")]
  public async Task<IActionResult> GetById(ulong id)
  {
    var result = await _userService.GetByIdAsync(id);
    return Ok(ApiResponseFactory.Ok(result, "Chi tiết người dùng."));
  }
}
