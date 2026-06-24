using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Helpers;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
  private readonly IPaymentService _paymentService;

  public PaymentController(IPaymentService paymentService)
  {
    _paymentService = paymentService;
  }

  [Authorize(Roles = "ADMIN")]
  [HttpGet]
  public async Task<IActionResult> GetAll()
  {
    var result = await _paymentService.GetPaymentsAsync();
    return Ok(ApiResponseFactory.Ok(result, "Danh sách giao dịch."));
  }

  [Authorize(Roles = "ADMIN,STALL_OWNER,TOURIST")]
  [HttpGet("{id:long}")]
  public async Task<IActionResult> GetById(ulong id)
  {
    try
    {
      var result = await _paymentService.GetByIdAsync(id);
      return Ok(ApiResponseFactory.Ok(result, "Chi tiết giao dịch."));
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

  [Authorize(Roles = "TOURIST,STALL_OWNER,ADMIN")]
  [HttpPost]
  public async Task<IActionResult> CreatePayment([FromBody] PaymentRequestDto request)
  {
    try
    {
      var result = await _paymentService.CreateAsync(request);
      return Ok(ApiResponseFactory.Ok(result, "Tạo giao dịch thanh toán thành công."));
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

  [Authorize(Roles = "TOURIST,STALL_OWNER,ADMIN")]
  [HttpPost("mock")]
  public async Task<IActionResult> CreateMock([FromBody] MockPaymentRequestDto request)
  {
    try
    {
      var paymentRequest = new PaymentRequestDto(null, null, request.Amount, "VND", "DEMO", "OTHER");
      var created = await _paymentService.CreateAsync(paymentRequest);
      var paid = await _paymentService.SimulatePaidAsync(created.Id);
      return Ok(ApiResponseFactory.Ok(paid, "Mock payment created and marked PAID."));
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ApiResponseFactory.Fail(ex.Message));
    }
    catch (UnauthorizedAccessException ex)
    {
      return Unauthorized(ApiResponseFactory.Fail(ex.Message));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize(Roles = "ADMIN")]
  [HttpPost("{id:long}/simulate-paid")]
  public async Task<IActionResult> SimulatePaid(ulong id)
  {
    try
    {
      var result = await _paymentService.SimulatePaidAsync(id);
      return Ok(ApiResponseFactory.Ok(result, "Đã mô phỏng thanh toán thành công."));
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ApiResponseFactory.Fail(ex.Message));
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ApiResponseFactory.Fail(ex.Message));
    }
  }

  [Authorize(Roles = "TOURIST")]
  [HttpPost("premium-24h-demo")]
  public async Task<IActionResult> Premium24hDemo()
  {
    var result = await _paymentService.CreatePremium24hDemoAsync();
    return Ok(ApiResponseFactory.Ok(result, "Đã kích hoạt premium demo 24 giờ."));
  }

  [HttpPost("webhook")]
  public async Task<IActionResult> Webhook([FromBody] object request)
  {
    var result = await _paymentService.HandleWebhookAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Đã nhận webhook thanh toán."));
  }

  [Authorize(Roles = "STALL_OWNER,ADMIN")]
  [HttpPost("manual-cash")]
  public async Task<IActionResult> ManualCash([FromBody] PaymentRequestDto request)
  {
    try
    {
      var result = await _paymentService.RecordManualCashAsync(request);
      return Ok(ApiResponseFactory.Ok(result, "Đã ghi nhận doanh thu tiền mặt."));
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
