CREATE DATABASE IF NOT EXISTS viettuoraudio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE viettuoraudio;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS revenue_daily;
DROP TABLE IF EXISTS analytics_daily_stall;
DROP TABLE IF EXISTS commission_earnings;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS top_up_requests;
DROP TABLE IF EXISTS vendor_wallets;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS play_history;
DROP TABLE IF EXISTS visit_events;
DROP TABLE IF EXISTS qr_scan_events;
DROP TABLE IF EXISTS visitor_sessions;
DROP TABLE IF EXISTS qr_codes;
DROP TABLE IF EXISTS media_files;
DROP TABLE IF EXISTS poi_contents;
DROP TABLE IF EXISTS pois;
DROP TABLE IF EXISTS stalls;
DROP TABLE IF EXISTS vendor_subscriptions;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  pass_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  role ENUM('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'FINANCE') NOT NULL,
  status ENUM('ACTIVE', 'LOCKED', 'PENDING', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_status (status),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  created_by_ip VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token_hash (token_hash),
  KEY idx_refresh_tokens_user_id (user_id),
  KEY idx_refresh_tokens_expires_at (expires_at),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  target_type VARCHAR(120) NOT NULL,
  target_id BIGINT UNSIGNED NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_actor_user_id (actor_user_id),
  KEY idx_audit_logs_target (target_type, target_id),
  KEY idx_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscription_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  price DECIMAL(14,2) NOT NULL,
  billing_cycle ENUM('MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
  max_stalls INT UNSIGNED NOT NULL DEFAULT 1,
  max_pois_per_stall INT UNSIGNED NOT NULL DEFAULT 10,
  max_media_files INT UNSIGNED NOT NULL DEFAULT 100,
  allow_premium_content TINYINT(1) NOT NULL DEFAULT 0,
  priority_support TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscription_plans_code (code),
  KEY idx_subscription_plans_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vendors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  legal_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  contact_name VARCHAR(160) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NULL,
  address VARCHAR(500) NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  rejection_reason VARCHAR(500) NULL,
  approved_by_user_id BIGINT UNSIGNED NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendors_slug (slug),
  KEY idx_vendors_status (status),
  KEY idx_vendors_contact_email (contact_email),
  KEY idx_vendors_approved_by_user_id (approved_by_user_id),
  KEY idx_vendors_created_at (created_at),
  CONSTRAINT fk_vendors_approved_by
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vendor_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  status ENUM('TRIAL', 'ACTIVE', 'OVERDUE', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'TRIAL',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  trial_end DATE NULL,
  price_snapshot DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vendor_subscriptions_vendor_id (vendor_id),
  KEY idx_vendor_subscriptions_plan_id (plan_id),
  KEY idx_vendor_subscriptions_status (status),
  KEY idx_vendor_subscriptions_period_end (period_end),
  KEY idx_vendor_subscriptions_created_at (created_at),
  CONSTRAINT fk_vendor_subscriptions_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_vendor_subscriptions_plan
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stalls (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  address VARCHAR(500) NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  activation_radius INT UNSIGNED NOT NULL DEFAULT 30,
  status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  opening_hours JSON NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stalls_vendor_slug (vendor_id, slug),
  KEY idx_stalls_vendor_id (vendor_id),
  KEY idx_stalls_status (status),
  KEY idx_stalls_lat_lng (latitude, longitude),
  KEY idx_stalls_created_at (created_at),
  CONSTRAINT fk_stalls_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pois (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stall_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  activation_radius INT UNSIGNED NOT NULL DEFAULT 25,
  is_premium_content TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pois_stall_slug (stall_id, slug),
  KEY idx_pois_stall_id (stall_id),
  KEY idx_pois_status (status),
  KEY idx_pois_lat_lng (latitude, longitude),
  KEY idx_pois_created_at (created_at),
  CONSTRAINT fk_pois_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE poi_contents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  poi_id BIGINT UNSIGNED NOT NULL,
  lang VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  short_text VARCHAR(500) NULL,
  tts_script TEXT NOT NULL,
  audio_url VARCHAR(500) NULL,
  voice_profile VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_poi_contents_poi_lang (poi_id, lang),
  KEY idx_poi_contents_poi_id (poi_id),
  KEY idx_poi_contents_lang (lang),
  CONSTRAINT fk_poi_contents_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE media_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  stall_id BIGINT UNSIGNED NULL,
  poi_id BIGINT UNSIGNED NULL,
  uploaded_by_user_id BIGINT UNSIGNED NULL,
  file_type ENUM('IMAGE', 'VIDEO', 'AUDIO', 'LOGO', 'QR', 'DOCUMENT') NOT NULL,
  storage_provider ENUM('LOCAL', 'S3', 'GCS', 'AZURE') NOT NULL DEFAULT 'LOCAL',
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(600) NOT NULL,
  public_url VARCHAR(600) NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  checksum_sha256 CHAR(64) NULL,
  moderation_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN') NOT NULL DEFAULT 'PENDING',
  moderated_by_user_id BIGINT UNSIGNED NULL,
  moderated_at TIMESTAMP NULL DEFAULT NULL,
  rejection_reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_media_files_vendor_id (vendor_id),
  KEY idx_media_files_stall_id (stall_id),
  KEY idx_media_files_poi_id (poi_id),
  KEY idx_media_files_uploaded_by_user_id (uploaded_by_user_id),
  KEY idx_media_files_moderation_status (moderation_status),
  KEY idx_media_files_moderated_by_user_id (moderated_by_user_id),
  KEY idx_media_files_created_at (created_at),
  CONSTRAINT fk_media_files_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_media_files_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_media_files_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_media_files_uploaded_by
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_media_files_moderated_by
    FOREIGN KEY (moderated_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE qr_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  stall_id BIGINT UNSIGNED NULL,
  poi_id BIGINT UNSIGNED NULL,
  code VARCHAR(120) NOT NULL,
  qr_type ENUM('GLOBAL_APP', 'VENDOR', 'STALL', 'POI', 'PAYMENT', 'PREMIUM') NOT NULL,
  target_url VARCHAR(600) NOT NULL,
  image_url VARCHAR(600) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qr_codes_code (code),
  KEY idx_qr_codes_vendor_id (vendor_id),
  KEY idx_qr_codes_stall_id (stall_id),
  KEY idx_qr_codes_poi_id (poi_id),
  KEY idx_qr_codes_created_at (created_at),
  CONSTRAINT fk_qr_codes_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_qr_codes_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_qr_codes_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE visitor_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token VARCHAR(160) NOT NULL,
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  premium_24h_expiry TIMESTAMP NULL DEFAULT NULL,
  device_fingerprint VARCHAR(255) NULL,
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_visitor_sessions_token (token),
  KEY idx_visitor_sessions_device_fingerprint (device_fingerprint),
  KEY idx_visitor_sessions_premium (is_premium, premium_24h_expiry),
  KEY idx_visitor_sessions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE qr_scan_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  qr_code_id BIGINT UNSIGNED NULL,
  vendor_id BIGINT UNSIGNED NULL,
  stall_id BIGINT UNSIGNED NULL,
  poi_id BIGINT UNSIGNED NULL,
  visitor_session_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  device_fingerprint VARCHAR(255) NULL,
  country_code CHAR(2) NULL,
  referrer VARCHAR(600) NULL,
  scanned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qr_scan_events_qr_code_id (qr_code_id),
  KEY idx_qr_scan_events_vendor_id (vendor_id),
  KEY idx_qr_scan_events_stall_id (stall_id),
  KEY idx_qr_scan_events_poi_id (poi_id),
  KEY idx_qr_scan_events_visitor_session_id (visitor_session_id),
  KEY idx_qr_scan_events_scanned_at (scanned_at),
  KEY idx_qr_scan_events_created_at (created_at),
  CONSTRAINT fk_qr_scan_events_qr_code
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_qr_scan_events_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_qr_scan_events_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_qr_scan_events_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_qr_scan_events_visitor_session
    FOREIGN KEY (visitor_session_id) REFERENCES visitor_sessions(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE visit_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NULL,
  stall_id BIGINT UNSIGNED NULL,
  poi_id BIGINT UNSIGNED NULL,
  visitor_session_id BIGINT UNSIGNED NULL,
  source ENUM('GPS', 'QR') NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  distance_meters DECIMAL(10,2) NULL,
  visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_visit_events_vendor_id (vendor_id),
  KEY idx_visit_events_stall_id (stall_id),
  KEY idx_visit_events_poi_id (poi_id),
  KEY idx_visit_events_visitor_session_id (visitor_session_id),
  KEY idx_visit_events_visited_at (visited_at),
  KEY idx_visit_events_created_at (created_at),
  CONSTRAINT fk_visit_events_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_visit_events_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_visit_events_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_visit_events_visitor_session
    FOREIGN KEY (visitor_session_id) REFERENCES visitor_sessions(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE play_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  visitor_session_id BIGINT UNSIGNED NULL,
  poi_id BIGINT UNSIGNED NULL,
  poi_content_id BIGINT UNSIGNED NULL,
  lang VARCHAR(10) NOT NULL,
  source ENUM('AUTO_GPS', 'MANUAL', 'QR') NOT NULL DEFAULT 'MANUAL',
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  duration_seconds INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_play_history_visitor_session_id (visitor_session_id),
  KEY idx_play_history_poi_id (poi_id),
  KEY idx_play_history_poi_content_id (poi_content_id),
  KEY idx_play_history_started_at (started_at),
  KEY idx_play_history_created_at (created_at),
  CONSTRAINT fk_play_history_visitor_session
    FOREIGN KEY (visitor_session_id) REFERENCES visitor_sessions(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_play_history_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_play_history_poi_content
    FOREIGN KEY (poi_content_id) REFERENCES poi_contents(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NULL,
  visitor_session_id BIGINT UNSIGNED NULL,
  vendor_subscription_id BIGINT UNSIGNED NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  provider ENUM('MOMO', 'VNPAY', 'BANK_QR', 'STRIPE', 'CASH', 'MANUAL') NOT NULL,
  payment_type ENUM('VISITOR_PREMIUM', 'VENDOR_SUBSCRIPTION', 'WALLET_TOP_UP', 'COMMISSION_PAYOUT', 'OTHER') NOT NULL,
  status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  transaction_code VARCHAR(255) NULL,
  provider_payload JSON NULL,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_transaction_code (transaction_code),
  KEY idx_payments_vendor_id (vendor_id),
  KEY idx_payments_visitor_session_id (visitor_session_id),
  KEY idx_payments_vendor_subscription_id (vendor_subscription_id),
  KEY idx_payments_status (status),
  KEY idx_payments_provider (provider),
  KEY idx_payments_created_at (created_at),
  KEY idx_payments_paid_at (paid_at),
  CONSTRAINT fk_payments_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_payments_visitor_session
    FOREIGN KEY (visitor_session_id) REFERENCES visitor_sessions(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_payments_vendor_subscription
    FOREIGN KEY (vendor_subscription_id) REFERENCES vendor_subscriptions(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vendor_wallets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_top_up DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_spent DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_commission DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_wallets_vendor_id (vendor_id),
  KEY idx_vendor_wallets_created_at (created_at),
  CONSTRAINT fk_vendor_wallets_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE top_up_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  wallet_id BIGINT UNSIGNED NOT NULL,
  requested_by_user_id BIGINT UNSIGNED NULL,
  provider ENUM('BANK_QR', 'MOMO', 'VNPAY', 'STRIPE', 'MANUAL') NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  amount DECIMAL(14,2) NOT NULL,
  proof_url VARCHAR(600) NULL,
  note VARCHAR(600) NULL,
  reviewed_by_user_id BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_top_up_requests_vendor_id (vendor_id),
  KEY idx_top_up_requests_wallet_id (wallet_id),
  KEY idx_top_up_requests_status (status),
  KEY idx_top_up_requests_provider (provider),
  KEY idx_top_up_requests_created_at (created_at),
  CONSTRAINT fk_top_up_requests_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_top_up_requests_wallet
    FOREIGN KEY (wallet_id) REFERENCES vendor_wallets(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_top_up_requests_requested_by
    FOREIGN KEY (requested_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_top_up_requests_reviewed_by
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wallet_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  wallet_id BIGINT UNSIGNED NOT NULL,
  vendor_id BIGINT UNSIGNED NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  top_up_request_id BIGINT UNSIGNED NULL,
  transaction_type ENUM('TOP_UP', 'FEE', 'MANUAL') NOT NULL,
  direction ENUM('CREDIT', 'DEBIT') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  balance_before DECIMAL(14,2) NOT NULL,
  balance_after DECIMAL(14,2) NOT NULL,
  description VARCHAR(600) NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wallet_transactions_wallet_id (wallet_id),
  KEY idx_wallet_transactions_vendor_id (vendor_id),
  KEY idx_wallet_transactions_payment_id (payment_id),
  KEY idx_wallet_transactions_top_up_request_id (top_up_request_id),
  KEY idx_wallet_transactions_type (transaction_type),
  KEY idx_wallet_transactions_created_at (created_at),
  CONSTRAINT fk_wallet_transactions_wallet
    FOREIGN KEY (wallet_id) REFERENCES vendor_wallets(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_wallet_transactions_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_wallet_transactions_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_wallet_transactions_top_up_request
    FOREIGN KEY (top_up_request_id) REFERENCES top_up_requests(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_wallet_transactions_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE commission_earnings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  qr_code_id BIGINT UNSIGNED NULL,
  visitor_session_id BIGINT UNSIGNED NULL,
  rate_percent DECIMAL(5,2) NOT NULL,
  gross_amount DECIMAL(14,2) NOT NULL,
  commission_amount DECIMAL(14,2) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_commission_earnings_vendor_id (vendor_id),
  KEY idx_commission_earnings_payment_id (payment_id),
  KEY idx_commission_earnings_status (status),
  KEY idx_commission_earnings_earned_at (earned_at),
  KEY idx_commission_earnings_created_at (created_at),
  CONSTRAINT fk_commission_earnings_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_commission_earnings_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_commission_earnings_qr_code
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_commission_earnings_visitor_session
    FOREIGN KEY (visitor_session_id) REFERENCES visitor_sessions(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE analytics_daily_stall (
  date DATE NOT NULL,
  stall_id BIGINT UNSIGNED NOT NULL,
  vendor_id BIGINT UNSIGNED NOT NULL,
  qr_scans INT UNSIGNED NOT NULL DEFAULT 0,
  visits INT UNSIGNED NOT NULL DEFAULT 0,
  audio_plays INT UNSIGNED NOT NULL DEFAULT 0,
  unique_visitors INT UNSIGNED NOT NULL DEFAULT 0,
  premium_conversions INT UNSIGNED NOT NULL DEFAULT 0,
  total_revenue DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (date, stall_id),
  KEY idx_analytics_daily_stall_stall_id (stall_id),
  KEY idx_analytics_daily_stall_vendor_id (vendor_id),
  KEY idx_analytics_daily_stall_vendor_date (vendor_id, date),
  CONSTRAINT fk_analytics_daily_stall_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_analytics_daily_stall_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE revenue_daily (
  date DATE NOT NULL,
  source ENUM('VISITOR_PREMIUM', 'VENDOR_SUBSCRIPTION', 'WALLET_TOP_UP', 'COMMISSION', 'OTHER') NOT NULL,
  provider ENUM('MOMO', 'VNPAY', 'BANK_QR', 'STRIPE', 'CASH', 'MANUAL') NOT NULL,
  gross_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  fees DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  transaction_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (date, source, provider),
  KEY idx_revenue_daily_source_provider (source, provider),
  KEY idx_revenue_daily_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
