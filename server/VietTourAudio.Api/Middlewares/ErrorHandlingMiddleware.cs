using System.Text.Json;

namespace VietTourAudio.Api.Middlewares;

public sealed class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
  public async Task InvokeAsync(HttpContext context)
  {
    try
    {
      await next(context);
    }
    catch (Exception exception)
    {
      logger.LogError(exception, "Unhandled API error");
      context.Response.StatusCode = exception switch
      {
        UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
        KeyNotFoundException => StatusCodes.Status404NotFound,
        ArgumentException => StatusCodes.Status400BadRequest,
        InvalidOperationException when exception.Message.Contains("insufficient") => StatusCodes.Status409Conflict,
        InvalidOperationException => StatusCodes.Status400BadRequest,
        _ => StatusCodes.Status500InternalServerError
      };
      context.Response.ContentType = "application/json";
      var message = context.Response.StatusCode == 500 ? "error.internal_server" : exception.Message;
      await context.Response.WriteAsync(JsonSerializer.Serialize(new { success = false, error = message }));
    }
  }
}
