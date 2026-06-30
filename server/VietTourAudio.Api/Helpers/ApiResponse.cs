namespace VietTourAudio.Api.Helpers;

public sealed record ApiResponse<T>(
  bool Success,
  string Message,
  T? Data = default,
  object? Errors = null
);

public static class ApiResponseFactory
{
  public static ApiResponse<T> Ok<T>(T data, string message = "Success")
  {
    return new ApiResponse<T>(true, message, data);
  }

  public static ApiResponse<object> Ok(string message = "Success")
  {
    return new ApiResponse<object>(true, message, new { });
  }

  public static ApiResponse<object> Fail(string message, object? errors = null)
  {
    return new ApiResponse<object>(false, message, null, errors);
  }
}
