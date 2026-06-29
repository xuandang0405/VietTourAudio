using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MySqlConnector;

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

      var statusCode = exception switch
      {
        UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
        KeyNotFoundException => StatusCodes.Status404NotFound,
        ArgumentException => StatusCodes.Status400BadRequest,
        InvalidOperationException when exception.Message.Contains("insufficient") => StatusCodes.Status409Conflict,
        InvalidOperationException => StatusCodes.Status400BadRequest,
        _ => StatusCodes.Status500InternalServerError
      };

      var message = statusCode == 500 ? "error.internal_server" : exception.Message;

      // Extract inner MySqlException if wrapped in DbUpdateException
      var mySqlEx = exception as MySqlException 
                    ?? (exception is DbUpdateException dbEx ? dbEx.InnerException as MySqlException : null);

      if (mySqlEx is not null)
      {
        if (mySqlEx.Number == 1062) // Duplicate entry
        {
          statusCode = StatusCodes.Status409Conflict;
          message = "error.duplicate_entry";
        }
        else if (mySqlEx.Number is 1451 or 1452) // Foreign key constraint fails
        {
          statusCode = StatusCodes.Status400BadRequest;
          message = "error.foreign_key_constraint_fails";
        }
        else
        {
          statusCode = StatusCodes.Status400BadRequest;
          message = "error.database_error";
        }
      }

      context.Response.StatusCode = statusCode;
      context.Response.ContentType = "application/json";
      await context.Response.WriteAsync(JsonSerializer.Serialize(new { success = false, error = message }));
    }
  }
}
