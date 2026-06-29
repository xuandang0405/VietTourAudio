using System.Security.Claims;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Middlewares;

public sealed class VendorPasswordChangeMiddleware(RequestDelegate next)
{
  public async Task InvokeAsync(HttpContext context)
  {
    var isVendorApi = context.Request.Path.StartsWithSegments("/api/vendor");
    var isChangePassword = context.Request.Path.StartsWithSegments("/api/vendor/change-password");
    var mustChange = context.User.FindFirstValue("must_change_password") == "true";

    if (isVendorApi && !isChangePassword && context.User.IsInRole("VENDOR") && mustChange)
    {
      context.Response.StatusCode = StatusCodes.Status403Forbidden;
      await context.Response.WriteAsJsonAsync(ApiResponseFactory.Fail(
        "Bạn phải đổi mật khẩu tạm trước khi tiếp tục.", "PASSWORD_CHANGE_REQUIRED"));
      return;
    }

    await next(context);
  }
}
