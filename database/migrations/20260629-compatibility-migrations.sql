-- =============================================================================
-- VietTourAudio: Compatibility and Alignment Migrations
-- Date: 2026-06-29
-- =============================================================================

USE viettuoraudio;

-- 1. Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id CHAR(36) NULL,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_notifications_vendor_id (vendor_id),
  KEY idx_admin_notifications_created_at (created_at),
  KEY idx_admin_notifications_is_read (is_read),
  CONSTRAINT fk_admin_notifications_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add compatibility columns to vendors table
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(600) NULL,
  ADD COLUMN IF NOT EXISTS approved_by_user_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL;

ALTER TABLE vendors
  ADD INDEX IF NOT EXISTS idx_vendors_vendor_code (vendor_code);

ALTER TABLE vendors
  ADD UNIQUE INDEX IF NOT EXISTS uq_vendors_slug (slug);

-- 3. Create payment_requests, unlocked_tours and app_settings tables for guest payments
CREATE TABLE IF NOT EXISTS payment_requests (
  id INT NOT NULL AUTO_INCREMENT,
  guest_id VARCHAR(255) NOT NULL,
  tour_id CHAR(36) NOT NULL,
  reference_code VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_requests_reference (reference_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS unlocked_tours (
  guest_id VARCHAR(255) NOT NULL,
  tour_id CHAR(36) NOT NULL,
  transaction_reference VARCHAR(255) NOT NULL,
  unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (guest_id, tour_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  kkey VARCHAR(100) NOT NULL,
  vvalue TEXT NOT NULL,
  PRIMARY KEY (kkey)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO app_settings (kkey, vvalue) 
VALUES ('PREMIUM_PAYMENT_QR', '970415:123456789:VCB:VietTourAudio Admin')
ON DUPLICATE KEY UPDATE vvalue=VALUES(vvalue);
