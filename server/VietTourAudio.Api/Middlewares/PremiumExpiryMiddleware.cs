using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;

namespace VietTourAudio.Api.Middlewares;

/// <summary>
/// Automated premium expiry verification intercept.
/// On every authenticated Vendor request, checks if any stalls have expired premium status
/// and automatically reverts them to standard tier.
/// </summary>
public sealed class PremiumExpiryMiddleware(RequestDelegate next)
{
  public async Task InvokeAsync(HttpContext context, AppDbContext db)
  {
    // Only intercept authenticated vendor requests
    var role = context.User.FindFirstValue(ClaimTypes.Role);
    var vendorIdClaim = context.User.FindFirstValue("vendor_id");
    var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

    if (role == "USER" && !string.IsNullOrWhiteSpace(userIdClaim))
    {
      var now = DateTime.UtcNow;
      await db.Users
        .Where(user => user.Id == userIdClaim &&
          user.IsPremiumActive &&
          (!user.PremiumExpiryDate.HasValue || user.PremiumExpiryDate <= now))
        .ExecuteUpdateAsync(updates => updates
          .SetProperty(user => user.IsPremiumActive, false)
          .SetProperty(user => user.PremiumExpiryDate, (DateTime?)null)
          .SetProperty(user => user.UpdatedAt, now));
    }

    if (role == "VENDOR" && !string.IsNullOrWhiteSpace(vendorIdClaim))
    {
      var now = DateTime.UtcNow;

      var expiredVendor = await db.Vendors
        .Where(v => v.Id == vendorIdClaim &&
          v.IsPremium &&
          v.PremiumExpiryDate.HasValue &&
          v.PremiumExpiryDate.Value < now)
        .FirstOrDefaultAsync();

      if (expiredVendor != null)
      {
        expiredVendor.IsPremium = false;
        expiredVendor.PremiumActivationDate = null;
        expiredVendor.PremiumExpiryDate = null;

        var pois = await db.Pois.Where(p => p.VendorId == vendorIdClaim).ToListAsync();
        foreach (var poi in pois)
        {
          poi.IsPremiumPriority = false;
          poi.TriggerRadius = 3.0;
          poi.UpdatedAt = now;
        }

        await db.SaveChangesAsync();
      }
    }

    await next(context);
  }
}
