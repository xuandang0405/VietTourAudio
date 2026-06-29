using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Services;

public sealed class PaymentEntitlementService(AppDbContext db)
{
  public async Task ApplyAsync(PaymentTransaction transaction)
  {
    if (transaction.SenderType == "USER" && transaction.TransactionType == "USER_PREMIUM")
    {
      var expiry = DateTime.UtcNow.AddHours(24);
      var user = await db.Users.SingleOrDefaultAsync(candidate => candidate.Id == transaction.SenderId);
      if (user is not null)
      {
        user.IsPremiumActive = true;
        user.PremiumExpiryDate = expiry;
        user.UpdatedAt = DateTime.UtcNow;
        return;
      }

      await db.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO visitor_sessions(token,is_premium,premium_24h_expiry)
        VALUES({transaction.SenderId},1,{expiry})
        ON DUPLICATE KEY UPDATE
          is_premium=1,
          premium_24h_expiry={expiry},
          last_seen_at=UTC_TIMESTAMP()
        """);
      return;
    }

    ulong vendorId = 0;
    if (transaction.SenderType == "VENDOR")
    {
      if (!ulong.TryParse(transaction.SenderId, out vendorId))
      {
        var connection = await DatabaseSql.OpenConnectionAsync(db);
        await using var command = connection.CreateCommand();
        if (db.Database.CurrentTransaction is { } tx) command.Transaction = tx.GetDbTransaction();
        command.CommandText = "SELECT vendor_id FROM vendor_portal_users WHERE id = @id LIMIT 1";
        command.AddParameter("@id", transaction.SenderId);
        var result = await command.ExecuteScalarAsync();
        if (result == null || !ulong.TryParse(result.ToString(), out vendorId))
        {
          command.CommandText = "SELECT id FROM vendors WHERE id = @id LIMIT 1";
          var directResult = await command.ExecuteScalarAsync();
          if (directResult == null || !ulong.TryParse(directResult.ToString(), out vendorId))
          {
            throw new InvalidOperationException("Invalid payment sender.");
          }
        }
      }
    }
    else
    {
      throw new InvalidOperationException("Invalid payment sender.");
    }

    if (transaction.TransactionType == "VENDOR_PREMIUM")
    {
      await DatabaseSql.ExecuteAsync(db, """
        UPDATE vendor_subscriptions
        SET plan_id=2,status='ACTIVE',payment_status='paid',
          period_end=DATE_ADD(GREATEST(period_end,CURDATE()),INTERVAL 1 MONTH),
          next_billing_date=DATE_ADD(GREATEST(COALESCE(next_billing_date,CURDATE()),CURDATE()),INTERVAL 1 MONTH)
        WHERE vendor_id=@vendorId ORDER BY id DESC LIMIT 1
        """, new Dictionary<string, object?> { ["@vendorId"] = vendorId });
    }
    else
    {
      await DatabaseSql.ExecuteAsync(db, """
        UPDATE vendor_subscriptions
        SET status='ACTIVE',payment_status='paid',
          period_end=DATE_ADD(GREATEST(period_end,CURDATE()),INTERVAL 1 MONTH),
          next_billing_date=DATE_ADD(GREATEST(COALESCE(next_billing_date,CURDATE()),CURDATE()),INTERVAL 1 MONTH)
        WHERE vendor_id=@vendorId ORDER BY id DESC LIMIT 1;
        UPDATE stalls SET billing_suspended=0,status=IF(status='SUSPENDED','APPROVED',status)
        WHERE vendor_id=@vendorId
        """, new Dictionary<string, object?> { ["@vendorId"] = vendorId });
    }
  }
}
