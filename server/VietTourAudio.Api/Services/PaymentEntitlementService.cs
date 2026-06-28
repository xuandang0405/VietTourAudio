using Microsoft.EntityFrameworkCore;
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
      await DatabaseSql.ExecuteAsync(db, """
        INSERT INTO visitor_sessions(token,is_premium,premium_24h_expiry)
        VALUES(@senderId,1,DATE_ADD(NOW(),INTERVAL 30 DAY))
        ON DUPLICATE KEY UPDATE
          is_premium=1,
          premium_24h_expiry=DATE_ADD(
            GREATEST(COALESCE(premium_24h_expiry,NOW()),NOW()),INTERVAL 30 DAY)
        """, new Dictionary<string, object?> { ["@senderId"] = transaction.SenderId });
      return;
    }

    if (transaction.SenderType != "VENDOR" ||
        !ulong.TryParse(transaction.SenderId, out var vendorId))
      throw new InvalidOperationException("Invalid payment sender.");

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
