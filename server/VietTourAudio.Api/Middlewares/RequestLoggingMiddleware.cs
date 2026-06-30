using System.Diagnostics;

namespace VietTourAudio.Api.Middlewares;

public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
  public async Task InvokeAsync(HttpContext context)
  {
    var timer = Stopwatch.StartNew();
    await next(context);
    logger.LogInformation("{Method} {Path} => {StatusCode} in {ElapsedMs}ms",
      context.Request.Method, context.Request.Path, context.Response.StatusCode, timer.ElapsedMilliseconds);
  }
}
