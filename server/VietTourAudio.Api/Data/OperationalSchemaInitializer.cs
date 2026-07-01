using Microsoft.EntityFrameworkCore;

namespace VietTourAudio.Api.Data;

public static class OperationalSchemaInitializer
{
  public static async Task InitializeAsync(AppDbContext db)
  {
    await db.Database.ExecuteSqlRawAsync("""
      CREATE TABLE IF NOT EXISTS visit_events (
        id CHAR(36) NOT NULL,
        poi_id CHAR(36) NOT NULL,
        vendor_id CHAR(36) NULL,
        user_id CHAR(36) NULL,
        session_id VARCHAR(160) NOT NULL,
        latitude DECIMAL(10,7) NULL,
        longitude DECIMAL(10,7) NULL,
        distance_meters DECIMAL(10,2) NULL,
        source VARCHAR(20) NOT NULL DEFAULT 'GPS',
        visited_at DATETIME(6) NOT NULL,
        PRIMARY KEY (id),
        KEY idx_visit_events_poi_time (poi_id, visited_at),
        KEY idx_visit_events_vendor_time (vendor_id, visited_at),
        KEY idx_visit_events_session_time (session_id, visited_at),
        CONSTRAINT fk_visit_events_poi FOREIGN KEY (poi_id) REFERENCES Pois(id) ON DELETE CASCADE,
        CONSTRAINT fk_visit_events_vendor FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      """);

    await db.Database.ExecuteSqlRawAsync("""
      CREATE TABLE IF NOT EXISTS audio_play_events (
        id CHAR(36) NOT NULL,
        poi_id CHAR(36) NOT NULL,
        vendor_id CHAR(36) NULL,
        user_id CHAR(36) NULL,
        session_id VARCHAR(160) NOT NULL,
        language_code VARCHAR(10) NOT NULL DEFAULT 'vi',
        source VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
        played_at DATETIME(6) NOT NULL,
        PRIMARY KEY (id),
        KEY idx_audio_play_events_poi_time (poi_id, played_at),
        KEY idx_audio_play_events_vendor_time (vendor_id, played_at),
        KEY idx_audio_play_events_session_time (session_id, played_at),
        CONSTRAINT fk_audio_play_events_poi FOREIGN KEY (poi_id) REFERENCES Pois(id) ON DELETE CASCADE,
        CONSTRAINT fk_audio_play_events_vendor FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      """);

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE system_tickets
        ADD COLUMN IF NOT EXISTS user_id CHAR(36) NULL AFTER id,
        ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20) NOT NULL DEFAULT 'GUEST' AFTER user_id
      """);

    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE vendor_portal_users
        ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER pass_hash,
        ADD COLUMN IF NOT EXISTS password_reset_at DATETIME(6) NULL AFTER must_change_password
      """);
    await db.Database.ExecuteSqlRawAsync("""
      ALTER TABLE Pois
        ADD COLUMN IF NOT EXISTS total_visits INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_listens INT NOT NULL DEFAULT 0
      """);
  }
}
