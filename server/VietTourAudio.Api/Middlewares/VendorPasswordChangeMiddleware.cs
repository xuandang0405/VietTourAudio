using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Middlewares;

public sealed class VendorPasswordChangeMiddleware(RequestDelegate next)
{
  public async Task InvokeAsync(HttpContext context, AppDbContext db)
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

    if (isVendorApi && context.User.IsInRole("VENDOR"))
    {
      var vendorIdClaim = context.User.FindFirstValue("vendor_id");
      if (!string.IsNullOrEmpty(vendorIdClaim))
      {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
        var isAllowedRoute = path.Contains("/change-password") || 
                             path.EndsWith("/revenue") || 
                             path.EndsWith("/dashboard") ||
                             path.Contains("/pay-subscription") || 
                             path.Contains("/premium/request");

        if (!isAllowedRoute)
        {
          var vendor = await db.Vendors.AsNoTracking().FirstOrDefaultAsync(x => x.Id == vendorIdClaim);
          if (vendor != null && vendor.SubscriptionExpiryDate.HasValue && vendor.SubscriptionExpiryDate.Value < DateTime.UtcNow)
          {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(ApiResponseFactory.Fail(
              "Tài khoản của bạn đã bị khóa do hết hạn thuê sạp hàng. Vui lòng gia hạn để tiếp tục.", "SUBSCRIPTION_EXPIRED"));
            return;
          }
        }
      }
    }

    await next(context);
  }
}
