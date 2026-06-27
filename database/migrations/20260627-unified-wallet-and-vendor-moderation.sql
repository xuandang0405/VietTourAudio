USE viettuoraudio;

ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS price DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER is_premium;

ALTER TABLE stalls
  ADD COLUMN IF NOT EXISTS billing_suspended TINYINT(1) NOT NULL DEFAULT 0 AFTER priority_score;

ALTER TABLE zones
  ADD COLUMN IF NOT EXISTS pending_latitude DECIMAL(10,7) NULL AFTER pending_cover_image_url,
  ADD COLUMN IF NOT EXISTS pending_longitude DECIMAL(10,7) NULL AFTER pending_latitude;

ALTER TABLE pois
  ADD COLUMN IF NOT EXISTS pending_latitude DECIMAL(10,7) NULL AFTER pending_cover_image_url,
  ADD COLUMN IF NOT EXISTS pending_longitude DECIMAL(10,7) NULL AFTER pending_latitude;

ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS transaction_category
    ENUM('WALLET_TOP_UP', 'WEBAPP_MONTHLY_RENT', 'PREMIUM_UPGRADE', 'MANUAL_ADJUSTMENT')
    NULL AFTER transaction_type;

UPDATE wallet_transactions
SET transaction_category = CASE
  WHEN transaction_type = 'TOP_UP' THEN 'WALLET_TOP_UP'
  WHEN transaction_type = 'FEE' THEN 'WEBAPP_MONTHLY_RENT'
  ELSE 'MANUAL_ADJUSTMENT'
END
WHERE transaction_category IS NULL;

ALTER TABLE wallet_transactions
  MODIFY transaction_category
    ENUM('WALLET_TOP_UP', 'WEBAPP_MONTHLY_RENT', 'PREMIUM_UPGRADE', 'MANUAL_ADJUSTMENT')
    NOT NULL;

CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NULL,
  notification_type ENUM('WEBAPP_RENT_PAID', 'WEBAPP_RENT_OVERDUE', 'PREMIUM_UPGRADE', 'WALLET_TOP_UP_REQUEST') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message VARCHAR(600) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_notifications_vendor_id (vendor_id),
  KEY idx_admin_notifications_is_read (is_read),
  KEY idx_admin_notifications_created_at (created_at),
  CONSTRAINT fk_admin_notifications_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
