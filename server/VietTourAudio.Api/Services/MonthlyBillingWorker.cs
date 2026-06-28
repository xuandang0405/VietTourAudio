using System.Data;
using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;

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
          await ProcessDueSubscriptionsInternal(context, stoppingToken);
        }
      }
      catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
      {
        // Graceful shutdown — exit the loop cleanly without logging as an error
        break;
      }
      catch (Exception exception)
      {
        logger.LogError(exception, "Monthly vendor billing pass failed");
      }
      try
      {
        await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
      }
      catch (OperationCanceledException)
      {
        // Host is stopping — exit cleanly
        break;
      }
    }
  }

  private async Task ProcessDueSubscriptionsInternal(AppDbContext discoveryDb, CancellationToken cancellationToken)
  {
    var due = await DatabaseSql.QueryRowsAsync(discoveryDb, """
      SELECT CAST(vs.vendor_id AS CHAR) vendorId FROM vendor_subscriptions vs
      WHERE vs.status IN('ACTIVE','OVERDUE') AND vs.next_billing_date IS NOT NULL
        AND vs.next_billing_date<=CURDATE()
      """);
    foreach (var row in due)
    {
      cancellationToken.ThrowIfCancellationRequested();
      await ProcessVendor(ulong.Parse((string)row["vendorId"]!));
    }
  }

  private async Task ProcessVendor(ulong vendorId)
  {
    using var scope = scopes.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    var state = (await DatabaseSql.QueryRowsAsync(db, """
      SELECT vs.id subscriptionId,vs.status subscriptionStatus,vs.next_billing_date nextBillingDate,
        vs.price_snapshot fee,vw.id walletId,vw.balance
      FROM vendor_subscriptions vs JOIN vendor_wallets vw ON vw.vendor_id=vs.vendor_id
      WHERE vs.vendor_id=@vendorId AND vs.status IN('ACTIVE','OVERDUE')
        AND vs.next_billing_date<=CURDATE() ORDER BY vs.id DESC LIMIT 1 FOR UPDATE
      """, new Dictionary<string, object?> { ["@vendorId"] = vendorId })).SingleOrDefault();
    if (state is null) { await transaction.RollbackAsync(); return; }

    var subscriptionId = ulong.Parse((string)state["subscriptionId"]!);
    var walletId = ulong.Parse((string)state["walletId"]!);
    var balance = Convert.ToDecimal(state["balance"]);
    var fee = Convert.ToDecimal(state["fee"]);
    if (balance >= fee)
    {
      var after = balance - fee;
      await DatabaseSql.ExecuteAsync(db, """
        UPDATE vendor_wallets SET balance=@after,total_spent=total_spent+@fee WHERE id=@walletId;
        INSERT INTO wallet_transactions(wallet_id,vendor_id,transaction_type,transaction_category,direction,
          amount,balance_before,balance_after,description)
        VALUES(@walletId,@vendorId,'FEE','WEBAPP_MONTHLY_RENT','DEBIT',@fee,@before,@after,'Monthly WebApp rental fee');
        UPDATE vendor_subscriptions SET status='ACTIVE',payment_status='paid',
          period_start=next_billing_date,period_end=DATE_ADD(next_billing_date,INTERVAL 1 MONTH),
          next_billing_date=DATE_ADD(next_billing_date,INTERVAL 1 MONTH) WHERE id=@subscriptionId;
        UPDATE stalls SET status=IF(billing_suspended=1,'APPROVED',status),billing_suspended=0 WHERE vendor_id=@vendorId;
        INSERT INTO admin_notifications(vendor_id,notification_type,title,message,metadata)
        VALUES(@vendorId,'WEBAPP_RENT_PAID','Monthly rental paid','Vendor monthly WebApp fee was deducted',
          JSON_OBJECT('amount',@fee,'balanceAfter',@after));
        """, new Dictionary<string, object?> { ["@after"] = after, ["@fee"] = fee, ["@before"] = balance,
          ["@walletId"] = walletId, ["@vendorId"] = vendorId, ["@subscriptionId"] = subscriptionId });
    }
    else
    {
      var wasOverdue = string.Equals(state["subscriptionStatus"]?.ToString(), "OVERDUE", StringComparison.OrdinalIgnoreCase);
      await DatabaseSql.ExecuteAsync(db, """
        UPDATE vendor_subscriptions SET status=IF(CURDATE()>DATE_ADD(next_billing_date,INTERVAL 7 DAY),'SUSPENDED','OVERDUE'),
          payment_status='unpaid' WHERE id=@subscriptionId;
        UPDATE stalls SET status=IF(CURDATE()>DATE_ADD((SELECT next_billing_date FROM vendor_subscriptions WHERE id=@subscriptionId),
          INTERVAL 7 DAY),'SUSPENDED',status),
          billing_suspended=IF(CURDATE()>DATE_ADD((SELECT next_billing_date FROM vendor_subscriptions WHERE id=@subscriptionId),
          INTERVAL 7 DAY),1,billing_suspended) WHERE vendor_id=@vendorId;
        """, new Dictionary<string, object?> { ["@subscriptionId"] = subscriptionId, ["@vendorId"] = vendorId });
      if (!wasOverdue)
        await DatabaseSql.ExecuteAsync(db, """
          INSERT INTO admin_notifications(vendor_id,notification_type,title,message,metadata)
          VALUES(@vendorId,'WEBAPP_RENT_OVERDUE','Monthly rental overdue',
            'Vendor wallet balance is insufficient; stall will be hidden after the 7-day grace period',
            JSON_OBJECT('required',@fee,'balance',@balance,'graceDays',7))
          """, new Dictionary<string, object?> { ["@vendorId"] = vendorId, ["@fee"] = fee, ["@balance"] = balance });
    }
    await transaction.CommitAsync();
  }
}
