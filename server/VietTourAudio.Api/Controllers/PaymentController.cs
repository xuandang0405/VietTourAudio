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

  [HttpPost]
  public async Task<IActionResult> CreatePayment([FromBody] PaymentRequestDto request)
  {
    var result = await _paymentService.CreateAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Tạo giao dịch thanh toán thành công."));
  }

  [HttpPost("webhook")]
  public async Task<IActionResult> Webhook([FromBody] object request)
  {
    var result = await _paymentService.HandleWebhookAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Đã nhận webhook thanh toán."));
  }

  [HttpPost("manual-cash")]
  public async Task<IActionResult> ManualCash([FromBody] PaymentRequestDto request)
  {
    var result = await _paymentService.RecordManualCashAsync(request);
    return Ok(ApiResponseFactory.Ok(result, "Đã ghi nhận doanh thu tiền mặt."));
  }

  [HttpGet("/api/payment/premium-qr")]
  public async Task<IActionResult> GetPremiumPaymentQr()
  {
    var code = await _paymentService.GetPremiumPaymentQrAsync();
    if (string.IsNullOrEmpty(code))
    {
      return NotFound(ApiResponseFactory.Fail("Chưa cấu hình QR thanh toán Premium."));
    }
    return Ok(ApiResponseFactory.Ok(code, "Lấy QR thanh toán Premium thành công."));
  }
}
