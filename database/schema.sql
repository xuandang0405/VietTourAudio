-- =============================================================================
-- VietTourAudio — Re-Architected Clean Schema Definition
-- Database: viettuoraudio
-- Engine: MySQL 8.0+ / MariaDB
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- =============================================================================

DROP DATABASE IF EXISTS viettuoraudio;
CREATE DATABASE viettuoraudio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE viettuoraudio;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop all existing tables
DROP TABLE IF EXISTS StallProducts;
DROP TABLE IF EXISTS Pois;
DROP TABLE IF EXISTS vendor_portal_users;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS vendor_wallets;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS system_tickets;
DROP TABLE IF EXISTS media_files;
DROP TABLE IF EXISTS qr_codes;
DROP TABLE IF EXISTS admin_payment_configs;
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS Vendors;
DROP TABLE IF EXISTS FestivalZones;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. FESTIVAL ZONES (Cấp cha tối cao - Khu vực lễ hội)
-- =============================================================================
CREATE TABLE FestivalZones (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  zone_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  cover_url VARCHAR(500) NULL,
  description LONGTEXT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_festival_zones_zone_code (zone_code),
  UNIQUE KEY uq_festival_zones_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. VENDORS (Nhà cung cấp - Thuộc khu vực)
-- =============================================================================
CREATE TABLE Vendors (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  festival_zone_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255) NOT NULL,
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  premium_activation_date DATETIME NULL DEFAULT NULL,
  premium_expiry_date DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendors_email (email),
  CONSTRAINT fk_vendors_festival_zone FOREIGN KEY (festival_zone_id) REFERENCES FestivalZones (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. POIS (Nhất thể hóa 100% Sạp hàng và Điểm thuyết minh)
-- =============================================================================
CREATE TABLE Pois (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  festival_zone_id CHAR(36) NOT NULL,
  vendor_id CHAR(36) NULL DEFAULT NULL,
  stall_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description LONGTEXT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  cover_url VARCHAR(500) NULL,
  approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  is_premium_priority TINYINT(1) NOT NULL DEFAULT 0,
  trigger_radius DOUBLE NOT NULL DEFAULT 3.0,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pois_festival_zone FOREIGN KEY (festival_zone_id) REFERENCES FestivalZones (id) ON DELETE CASCADE,
  CONSTRAINT fk_pois_vendor FOREIGN KEY (vendor_id) REFERENCES Vendors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. STALL PRODUCTS (Danh mục sản phẩm bên trong sạp hàng)
-- =============================================================================
CREATE TABLE StallProducts (
  id INT NOT NULL AUTO_INCREMENT,
  poi_id CHAR(36) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_stall_products_poi FOREIGN KEY (poi_id) REFERENCES Pois (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. USERS (Admin / Platform users)
-- =============================================================================
CREATE TABLE users (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL,
  pass_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'USER',
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  is_premium_active TINYINT(1) NOT NULL DEFAULT 0,
  premium_expiry_date DATETIME(6) NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE visitor_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token VARCHAR(160) NOT NULL,
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  premium_24h_expiry DATETIME(6) NULL DEFAULT NULL,
  first_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_visitor_sessions_token (token),
  KEY idx_visitor_sessions_premium (is_premium, premium_24h_expiry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_poi_audio_plays (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_key VARCHAR(200) NOT NULL,
  poi_id CHAR(36) NOT NULL,
  first_played_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_poi_audio_play (subject_key, poi_id),
  KEY idx_user_poi_audio_plays_poi (poi_id),
  CONSTRAINT fk_user_poi_audio_plays_poi
    FOREIGN KEY (poi_id) REFERENCES Pois(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. VENDOR PORTAL USERS (Login accounts for vendors)
-- =============================================================================
CREATE TABLE vendor_portal_users (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  vendor_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  pass_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_portal_users_email (email),
  UNIQUE KEY uq_vendor_portal_users_vendor_id (vendor_id),
  CONSTRAINT fk_vendor_portal_users_vendor FOREIGN KEY (vendor_id) REFERENCES Vendors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. REFRESH TOKENS
-- =============================================================================
CREATE TABLE refresh_tokens (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  created_by_ip VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token_hash (token_hash),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. FAVORITES (Guest bookmarks)
-- =============================================================================
CREATE TABLE favorites (
  id INT NOT NULL AUTO_INCREMENT,
  guest_id VARCHAR(255) NOT NULL,
  poi_id CHAR(36) NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites_guest_poi (guest_id, poi_id),
  CONSTRAINT fk_favorites_poi FOREIGN KEY (poi_id) REFERENCES Pois(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. VENDOR WALLETS
-- =============================================================================
CREATE TABLE vendor_wallets (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  vendor_id CHAR(36) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  promo_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_top_up DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_spent DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_wallets_vendor_id (vendor_id),
  CONSTRAINT fk_vendor_wallets_vendor FOREIGN KEY (vendor_id) REFERENCES Vendors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. WALLET TRANSACTIONS
-- =============================================================================
CREATE TABLE wallet_transactions (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  wallet_id CHAR(36) NOT NULL,
  vendor_id CHAR(36) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  transaction_category VARCHAR(40) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  balance_before DECIMAL(14,2) NOT NULL,
  balance_after DECIMAL(14,2) NOT NULL,
  description VARCHAR(600) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_wallet_transactions_wallet FOREIGN KEY (wallet_id) REFERENCES vendor_wallets(id) ON DELETE CASCADE,
  CONSTRAINT fk_wallet_transactions_vendor FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. SYSTEM TICKETS (Support contacts)
-- =============================================================================
CREATE TABLE system_tickets (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  sender_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 12. MEDIA FILES
-- =============================================================================
CREATE TABLE media_files (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  vendor_id CHAR(36) NOT NULL,
  poi_id CHAR(36) NULL DEFAULT NULL,
  file_type VARCHAR(20) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(600) NOT NULL,
  public_url VARCHAR(600) NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  moderation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  rejection_reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_media_files_vendor FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_files_poi FOREIGN KEY (poi_id) REFERENCES Pois(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 13. QR CODES
-- =============================================================================
CREATE TABLE qr_codes (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  vendor_id CHAR(36) NULL DEFAULT NULL,
  tour_id CHAR(36) NULL DEFAULT NULL,
  poi_id CHAR(36) NULL DEFAULT NULL,
  code VARCHAR(150) NOT NULL,
  qr_type VARCHAR(20) NOT NULL,
  target_url VARCHAR(500) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qr_codes_code (code),
  CONSTRAINT fk_qr_codes_vendor FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_qr_codes_tour FOREIGN KEY (tour_id) REFERENCES FestivalZones(id) ON DELETE CASCADE,
  CONSTRAINT fk_qr_codes_poi FOREIGN KEY (poi_id) REFERENCES Pois(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 13.5 TOP UP REQUESTS (Yêu cầu nạp tiền)
-- =============================================================================
CREATE TABLE top_up_requests (
  id CHAR(36) NOT NULL,
  vendor_id CHAR(36) NOT NULL,
  wallet_id CHAR(36) NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'BANK_QR',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  amount DECIMAL(14,2) NOT NULL,
  proof_url VARCHAR(500) NULL,
  note VARCHAR(600) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_top_up_requests_vendor FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_top_up_requests_wallet FOREIGN KEY (wallet_id) REFERENCES vendor_wallets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 14. ADMIN PAYMENT CONFIGS (Ví Admin)
-- =============================================================================
CREATE TABLE admin_payment_configs (
  id INT NOT NULL AUTO_INCREMENT,
  gateway_type VARCHAR(20) NOT NULL,
  account_name VARCHAR(255) NOT NULL DEFAULT '',
  account_number VARCHAR(120) NOT NULL DEFAULT '',
  qr_code_url VARCHAR(600) NULL,
  transfer_memo_pattern VARCHAR(255) NOT NULL DEFAULT 'VTA PREMIUM [Id]',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_payment_configs_gateway_type (gateway_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 15. PAYMENT TRANSACTIONS (Nhật ký giao dịch)
-- =============================================================================
CREATE TABLE payment_transactions (
  id CHAR(36) NOT NULL,
  sender_id VARCHAR(160) NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  transaction_type VARCHAR(40) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  transfer_memo VARCHAR(255) NOT NULL,
  pending_key VARCHAR(64) NULL,
  proof_attachment_url VARCHAR(600) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_transactions_transfer_memo (transfer_memo),
  UNIQUE KEY uq_payment_transactions_pending_key (pending_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
