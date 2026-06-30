USE viettuoraudio;

-- 1. Create AppSettings table if not exists
CREATE TABLE IF NOT EXISTS AppSettings (
  `key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `value` VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add zone_code column to stalls table
ALTER TABLE stalls 
ADD COLUMN zone_code VARCHAR(50) UNIQUE NULL;

-- 3. Insert default PREMIUM_PAYMENT_QR configuration
INSERT INTO AppSettings (`key`, `value`) 
VALUES ('PREMIUM_PAYMENT_QR', 'MOMO-PAY-PREMIUM-12345') 
ON DUPLICATE KEY UPDATE `value`='MOMO-PAY-PREMIUM-12345';
