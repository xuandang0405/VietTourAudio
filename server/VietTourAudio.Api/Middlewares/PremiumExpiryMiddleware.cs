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

    if (role == "VENDOR" && ulong.TryParse(vendorIdClaim, out var vendorId))
    {
      var now = DateTime.UtcNow;

      var expiredStalls = await db.Database
        .SqlQuery<ulong>($"""
          SELECT id AS Value FROM stalls
          WHERE vendor_id = {vendorId}
            AND is_premium = 1
            AND premium_expiry_date IS NOT NULL
            AND premium_expiry_date < {now}
          """)
        .ToListAsync();

      if (expiredStalls.Count > 0)
      {
        var stallIds = string.Join(",", expiredStalls);
#pragma warning disable EF1002
        await db.Database.ExecuteSqlRawAsync($"""
          UPDATE stalls
          SET is_premium = 0,
              is_premium_priority = 0,
              activation_radius = 3,
              premium_activation_date = NULL,
              premium_expiry_date = NULL,
              updated_at = NOW()
          WHERE id IN ({stallIds})
          """);
#pragma warning restore EF1002
      }
    }

    await next(context);
  }
}
