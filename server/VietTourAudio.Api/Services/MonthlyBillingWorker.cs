using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Services;

public sealed class MonthlyBillingWorker(
  IServiceScopeFactory scopes,
  ILogger<MonthlyBillingWorker> logger) : BackgroundService
{
  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    while (!stoppingToken.IsCancellationRequested)
    {
      try
      {
        using (var scope = scopes.CreateScope())
        {
          var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
          await ProcessExpiredPremiumsInternal(context, stoppingToken);
        }
      }
      catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
      {
        break;
      }
      catch (Exception exception)
      {
        logger.LogError(exception, "Premium validation pass failed");
      }
      try
      {
        await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
      }
      catch (OperationCanceledException)
      {
        break;
      }
    }
  }

  private async Task ProcessExpiredPremiumsInternal(AppDbContext db, CancellationToken cancellationToken)
  {
    var expiredVendors = await DatabaseSql.QueryRowsAsync(db, """
      SELECT CAST(id AS CHAR) vendorId FROM Vendors
      WHERE is_premium = 1 AND premium_expiry_date IS NOT NULL AND premium_expiry_date < NOW()
      """);

    foreach (var row in expiredVendors)
    {
      cancellationToken.ThrowIfCancellationRequested();
      var vendorId = (string)row["vendorId"]!;
      
      await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
      try
      {
        await DatabaseSql.ExecuteAsync(db, "UPDATE Vendors SET is_premium = 0 WHERE id = @vendorId",
          new Dictionary<string, object?> { ["@vendorId"] = vendorId });
        await DatabaseSql.ExecuteAsync(db, "UPDATE Pois SET is_premium_priority = 0, trigger_radius = 3.0 WHERE vendor_id = @vendorId",
          new Dictionary<string, object?> { ["@vendorId"] = vendorId });
        
        await transaction.CommitAsync(cancellationToken);
        logger.LogInformation("Downgraded expired premium vendor: {VendorId}", vendorId);
      }
      catch (Exception ex)
      {
        await transaction.RollbackAsync(cancellationToken);
        logger.LogError(ex, "Failed to downgrade premium status for vendor: {VendorId}", vendorId);
      }
    }
  }
}
