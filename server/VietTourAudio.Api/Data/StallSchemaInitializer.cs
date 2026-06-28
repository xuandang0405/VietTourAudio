using Microsoft.EntityFrameworkCore;

namespace VietTourAudio.Api.Data;

public static class StallSchemaInitializer
{
  public static async Task InitializeAsync(AppDbContext db)
  {
    var conn = db.Database.GetDbConnection();
    var wasClosed = conn.State == System.Data.ConnectionState.Closed;
    if (wasClosed) await conn.OpenAsync();
    try
    {
      using var cmd = conn.CreateCommand();

      // 1. Drop foreign key constraint fk_tours_vendor
      cmd.CommandText = "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'tours' AND constraint_name = 'fk_tours_vendor' AND constraint_type = 'FOREIGN KEY'";
      var fkCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
      if (fkCount > 0)
      {
        cmd.CommandText = "ALTER TABLE tours DROP FOREIGN KEY fk_tours_vendor";
        await cmd.ExecuteNonQueryAsync();
      }

      // 2. Drop unique index uq_tours_vendor_slug
      cmd.CommandText = "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'tours' AND index_name = 'uq_tours_vendor_slug'";
      var uqIndexCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
      if (uqIndexCount > 0)
      {
        cmd.CommandText = "ALTER TABLE tours DROP INDEX uq_tours_vendor_slug";
        await cmd.ExecuteNonQueryAsync();
      }

      // 3. Drop unique index uq_tours_vendor_id_slug
      cmd.CommandText = "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'tours' AND index_name = 'uq_tours_vendor_id_slug'";
      var indexCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
      if (indexCount > 0)
      {
        cmd.CommandText = "ALTER TABLE tours DROP INDEX uq_tours_vendor_id_slug";
        await cmd.ExecuteNonQueryAsync();
      }

      // 4. Drop index idx_tours_vendor_id
      cmd.CommandText = "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'tours' AND index_name = 'idx_tours_vendor_id'";
      var idxVendorCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
      if (idxVendorCount > 0)
      {
        cmd.CommandText = "ALTER TABLE tours DROP INDEX idx_tours_vendor_id";
        await cmd.ExecuteNonQueryAsync();
      }

      // 5. Drop column vendor_id
      cmd.CommandText = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tours' AND column_name = 'vendor_id'";
      var columnCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
      if (columnCount > 0)
      {
        cmd.CommandText = "ALTER TABLE tours DROP COLUMN vendor_id";
        await cmd.ExecuteNonQueryAsync();
      }
    }
    catch (Exception ex)
    {
      Console.WriteLine($"[StallSchemaInitializer] Schema check failed: {ex.Message}");
    }
    finally
    {
      if (wasClosed) await conn.CloseAsync();
    }

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE pois
        ADD COLUMN IF NOT EXISTS vendor_id BIGINT UNSIGNED NULL AFTER stall_id
      """);

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE pois
        ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500) NULL AFTER description
      """);

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE pois
        ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' AFTER status
      """);

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE zones
        ADD COLUMN IF NOT EXISTS vendor_id BIGINT UNSIGNED NULL AFTER stall_id
      """);

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE zones
        ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500) NULL AFTER description
      """);

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE stalls
        ADD COLUMN IF NOT EXISTS is_premium_priority TINYINT(1) NOT NULL DEFAULT 0
        AFTER is_premium
      """);

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE stalls
        ADD COLUMN IF NOT EXISTS premium_activation_date TIMESTAMP NULL DEFAULT NULL
        AFTER is_premium_priority
      """);

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE stalls
        ADD COLUMN IF NOT EXISTS premium_expiry_date TIMESTAMP NULL DEFAULT NULL
        AFTER premium_activation_date
      """);

    // Backfill existing premium stalls with 30-day expiry window
    await db.Database.ExecuteSqlRawAsync("""
      UPDATE stalls
      SET premium_activation_date = NOW(),
          premium_expiry_date = DATE_ADD(NOW(), INTERVAL 30 DAY)
      WHERE is_premium = 1 AND premium_activation_date IS NULL
      """);

    await db.Database.ExecuteSqlRawAsync("""
      UPDATE stalls ranked
      JOIN (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY vendor_id ORDER BY id) AS position
        FROM stalls
      ) ordering ON ordering.id = ranked.id
      SET ranked.is_premium_priority = IF(ordering.position = 1, 1, 0),
          ranked.activation_radius = IF(ordering.position = 1, 10, 3)
      """);

    // Unification: Backfill Pois & Zones tables with VendorIds and approval statuses from Stalls
    await db.Database.ExecuteSqlRawAsync("""
      UPDATE pois p
      JOIN stalls s ON s.id = p.stall_id
      SET p.vendor_id = s.vendor_id
      WHERE p.vendor_id IS NULL
      """);

    await db.Database.ExecuteSqlRawAsync("""
      UPDATE pois p
      JOIN stalls s ON s.id = p.stall_id
      SET p.approval_status = s.approval_status
      WHERE p.approval_status = 'PENDING' AND s.approval_status != 'PENDING'
      """);

    await db.Database.ExecuteSqlRawAsync("""
      UPDATE zones z
      JOIN stalls s ON s.id = z.stall_id
      SET z.vendor_id = s.vendor_id
      WHERE z.vendor_id IS NULL
      """);

    await db.Database.ExecuteSqlRawAsync("""
      UPDATE zones z
      JOIN stalls s ON s.id = z.stall_id
      SET z.approval_status = s.approval_status
      WHERE z.approval_status = 'PENDING' AND s.approval_status != 'PENDING'
      """);

    var uniqueVendorIndex = await DatabaseSql.QueryRowsAsync(db, """
      SELECT index_name
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'stalls'
        AND index_name = 'uq_stalls_vendor_id'
      LIMIT 1
      """);
    if (uniqueVendorIndex.Count > 0)
      await db.Database.ExecuteSqlRawAsync("ALTER TABLE stalls DROP INDEX uq_stalls_vendor_id");

    await db.Database.ExecuteSqlRawAsync("""
      INSERT INTO stalls
        (vendor_id,name,slug,description,latitude,longitude,activation_radius,status,
         is_premium,is_premium_priority,priority_score,zone_code,approval_status)
      SELECT v.id,v.trade_name,CONCAT(v.slug,'-primary'),
        'Vui lòng cập nhật mô tả sạp hàng của bạn.',
        COALESCE(t.latitude,10.776076),COALESCE(t.longitude,106.700948),
        10,'PENDING',0,1,100,CONCAT('STALL-',v.id),'PENDING'
      FROM vendors v
      LEFT JOIN tours t ON t.id=v.assigned_tour_id
      WHERE NOT EXISTS (SELECT 1 FROM stalls s WHERE s.vendor_id=v.id)
      """);

    await db.Database.ExecuteSqlRawAsync("""
      INSERT INTO zones
        (tour_id,stall_id,name,slug,description,latitude,longitude,
         activation_radius,status,approval_status)
      SELECT COALESCE((SELECT id FROM tours WHERE id = v.assigned_tour_id),(SELECT id FROM tours WHERE status!='ARCHIVED' ORDER BY id LIMIT 1)),
        s.id,s.name,CONCAT(s.slug,'-poi'),s.description,s.latitude,s.longitude,
        s.activation_radius,'ACTIVE','PENDING'
      FROM stalls s
      JOIN vendors v ON v.id=s.vendor_id
      WHERE NOT EXISTS (SELECT 1 FROM zones z WHERE z.stall_id=s.id)
        AND COALESCE((SELECT id FROM tours WHERE id = v.assigned_tour_id),(SELECT id FROM tours WHERE status!='ARCHIVED' ORDER BY id LIMIT 1)) IS NOT NULL
      """);
  }
}
