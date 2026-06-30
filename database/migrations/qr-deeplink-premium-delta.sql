-- ============================================================
-- VietTourAudio: QR Deep-Link & Premium Payment Delta Migration
-- Run this MANUALLY after backing up your database.
-- Prerequisite: vendor-portal-delta.sql must be applied first.
-- ============================================================

USE viettuoraudio;

-- 1. Add zone_code to stalls (if not already present from vendor-portal-delta)
--    This is safe to run multiple times.
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'viettuoraudio'
    AND TABLE_NAME = 'stalls'
    AND COLUMN_NAME = 'zone_code'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE stalls ADD COLUMN zone_code VARCHAR(50) UNIQUE NULL AFTER priority_score',
  'SELECT ''zone_code column already exists'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Create app_settings table if not exists
CREATE TABLE IF NOT EXISTS app_settings (
  `key` VARCHAR(100) NOT NULL,
  `value` VARCHAR(500) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seed the Premium Payment QR config
INSERT INTO app_settings (`key`, `value`)
VALUES ('PREMIUM_PAYMENT_QR', 'MOMO-PAY-PREMIUM-12345')
ON DUPLICATE KEY UPDATE `value` = 'MOMO-PAY-PREMIUM-12345';

SELECT 'QR Deep-Link & Premium Payment migration complete!' AS status;
