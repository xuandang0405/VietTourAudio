using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/subscription")]
[Authorize(Roles = "STALL_OWNER")]
public class SubscriptionController : ControllerBase
{
  private readonly ISubscriptionService _subscriptionService;

  public SubscriptionController(ISubscriptionService subscriptionService)
  {
    _subscriptionService = subscriptionService;
  }

  [HttpPost("activate-trial")]
  public async Task<IActionResult> ActivateTrial()
  {
    try
    {
      var result = await _subscriptionService.ActivateTrialAsync();
      return Ok(ApiResponseFactory.Ok(result, "Kích hoạt trial premium thành công."));
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ApiResponseFactory.Fail(ex.Message));
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(ApiResponseFactory.Fail(ex.Message));
    }
  }
}
