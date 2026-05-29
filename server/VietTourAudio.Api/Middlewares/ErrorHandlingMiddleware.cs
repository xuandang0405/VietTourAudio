using System.Net;
using System.Text.Json;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Middlewares;

public class ErrorHandlingMiddleware
{
  private readonly RequestDelegate _next;
  private readonly ILogger<ErrorHandlingMiddleware> _logger;

  public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
  {
    _next = next;
    _logger = logger;
  }

  public async Task InvokeAsync(HttpContext context)
  {
    try
    {
      await _next(context);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Unhandled API error");

      context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
      context.Response.ContentType = "application/json";

      var payload = ApiResponseFactory.Fail(
        "Server error",
        new { detail = "Lỗi hệ thống. Vui lòng kiểm tra log server." }
      );

      await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
  }
}
