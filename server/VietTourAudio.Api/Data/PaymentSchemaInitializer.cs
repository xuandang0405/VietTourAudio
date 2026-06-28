using Microsoft.EntityFrameworkCore;

namespace VietTourAudio.Api.Data;

public static class PaymentSchemaInitializer
{
  public static async Task InitializeAsync(AppDbContext db)
  {
    await db.Database.ExecuteSqlRawAsync("""
      CREATE TABLE IF NOT EXISTS admin_payment_configs (
        id INT NOT NULL AUTO_INCREMENT,
        gateway_type VARCHAR(20) NOT NULL,
        account_name VARCHAR(255) NOT NULL DEFAULT '',
        account_number VARCHAR(120) NOT NULL DEFAULT '',
        qr_code_url VARCHAR(600) NULL,
        transfer_memo_pattern VARCHAR(255) NOT NULL DEFAULT 'VTA PREMIUM [Id]',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (id),
        UNIQUE KEY uq_admin_payment_configs_gateway_type (gateway_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      """);
    await db.Database.ExecuteSqlRawAsync("""
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id CHAR(36) NOT NULL,
        sender_id VARCHAR(160) NOT NULL,
        sender_type VARCHAR(20) NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        transaction_type VARCHAR(40) NOT NULL,
        amount DECIMAL(14,2) NOT NULL,
        transfer_memo VARCHAR(255) NOT NULL,
        proof_attachment_url VARCHAR(600) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at DATETIME(6) NOT NULL,
        updated_at DATETIME(6) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_payment_transactions_transfer_memo (transfer_memo),
        KEY idx_payment_transactions_status_created (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      """);
    await db.Database.ExecuteSqlRawAsync("""
      INSERT INTO admin_payment_configs
        (gateway_type, account_name, account_number, transfer_memo_pattern, is_active)
      VALUES
        ('MOMO', 'VietTourAudio MoMo', '', 'VTA [Type] [Id]', 1),
        ('BANK', 'VietTourAudio', '', 'VTA [Type] [Id]', 1),
        ('VISA', 'VietTourAudio Card Gateway', 'VISA', 'VTA VISA [Id]', 1)
      ON DUPLICATE KEY UPDATE gateway_type = VALUES(gateway_type)
      """);

    if (await db.PaymentTransactions.CountAsync() < 6)
    {
      db.PaymentTransactions.RemoveRange(db.PaymentTransactions);
      await db.SaveChangesAsync();

      var now = DateTime.UtcNow;
      var transactions = new List<Domain.PaymentTransaction>
      {
        // Today (USER)
        new Domain.PaymentTransaction
        {
          Id = Guid.NewGuid(),
          SenderId = "user1",
          SenderType = "USER",
          PaymentMethod = "MOMO",
          TransactionType = "PREMIUM_UPGRADE",
          Amount = 30000,
          TransferMemo = "VTA USER TODAY",
          Status = "APPROVED",
          CreatedAt = now,
          UpdatedAt = now
        },
        // Today (VENDOR)
        new Domain.PaymentTransaction
        {
          Id = Guid.NewGuid(),
          SenderId = "vendor1",
          SenderType = "VENDOR",
          PaymentMethod = "BANK",
          TransactionType = "STALL_RENEWAL",
          Amount = 150000,
          TransferMemo = "VTA VENDOR TODAY",
          Status = "APPROVED",
          CreatedAt = now,
          UpdatedAt = now
        },
        // Yesterday (USER - count in Month/Year/All-Time)
        new Domain.PaymentTransaction
        {
          Id = Guid.NewGuid(),
          SenderId = "user2",
          SenderType = "USER",
          PaymentMethod = "VISA",
          TransactionType = "PREMIUM_UPGRADE",
          Amount = 30000,
          TransferMemo = "VTA USER YESTERDAY",
          Status = "APPROVED",
          CreatedAt = now.AddDays(-1),
          UpdatedAt = now.AddDays(-1)
        },
        // Last Month (VENDOR - count in Year/All-Time)
        new Domain.PaymentTransaction
        {
          Id = Guid.NewGuid(),
          SenderId = "vendor2",
          SenderType = "VENDOR",
          PaymentMethod = "MOMO",
          TransactionType = "STALL_RENEWAL",
          Amount = 250000,
          TransferMemo = "VTA VENDOR LASTMONTH",
          Status = "APPROVED",
          CreatedAt = now.AddMonths(-1),
          UpdatedAt = now.AddMonths(-1)
        },
        // Last Month (USER)
        new Domain.PaymentTransaction
        {
          Id = Guid.NewGuid(),
          SenderId = "user3",
          SenderType = "USER",
          PaymentMethod = "BANK",
          TransactionType = "PREMIUM_UPGRADE",
          Amount = 30000,
          TransferMemo = "VTA USER LASTMONTH",
          Status = "APPROVED",
          CreatedAt = now.AddMonths(-1),
          UpdatedAt = now.AddMonths(-1)
        },
        // Last Year (USER - count in All-Time only)
        new Domain.PaymentTransaction
        {
          Id = Guid.NewGuid(),
          SenderId = "user4",
          SenderType = "USER",
          PaymentMethod = "VISA",
          TransactionType = "PREMIUM_UPGRADE",
          Amount = 30000,
          TransferMemo = "VTA USER LASTYEAR",
          Status = "APPROVED",
          CreatedAt = now.AddYears(-1),
          UpdatedAt = now.AddYears(-1)
        }
      };

      await db.PaymentTransactions.AddRangeAsync(transactions);
      await db.SaveChangesAsync();
    }
  }
}
