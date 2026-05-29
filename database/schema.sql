CREATE DATABASE IF NOT EXISTS viettuoraudio
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE viettuoraudio;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS commissions;
DROP TABLE IF EXISTS cash_reports;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS play_history;
DROP TABLE IF EXISTS visit_events;
DROP TABLE IF EXISTS qr_scan_events;
DROP TABLE IF EXISTS qr_codes;
DROP TABLE IF EXISTS media_files;
DROP TABLE IF EXISTS poi_contents;
DROP TABLE IF EXISTS pois;
DROP TABLE IF EXISTS stall_subscriptions;
DROP TABLE IF EXISTS stalls;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  role ENUM('ADMIN', 'STALL_OWNER', 'TOURIST') NOT NULL DEFAULT 'TOURIST',
  status ENUM('ACTIVE', 'LOCKED', 'PENDING') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stalls (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  address VARCHAR(500) NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  location POINT NOT NULL SRID 4326,
  opening_hours VARCHAR(255) NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  premium_priority INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stalls_slug (slug),
  KEY idx_stalls_owner_id (owner_id),
  KEY idx_stalls_status (status),
  KEY idx_stalls_premium_priority (is_premium, premium_priority),
  KEY idx_stalls_created_at (created_at),
  SPATIAL INDEX idx_stalls_location (location),
  CONSTRAINT fk_stalls_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stall_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stall_id BIGINT UNSIGNED NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  price DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stall_subscriptions_stall_id (stall_id),
  KEY idx_stall_subscriptions_status (status),
  KEY idx_stall_subscriptions_created_at (created_at),
  CONSTRAINT fk_stall_subscriptions_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pois (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stall_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  location POINT NOT NULL SRID 4326,
  activation_radius INT NOT NULL DEFAULT 30,
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('ACTIVE', 'INACTIVE', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pois_stall_id (stall_id),
  KEY idx_pois_status (status),
  KEY idx_pois_created_at (created_at),
  SPATIAL INDEX idx_pois_location (location),
  CONSTRAINT fk_pois_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE poi_contents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  poi_id BIGINT UNSIGNED NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  tts_script TEXT NULL,
  audio_file_url VARCHAR(500) NULL,
  voice_type ENUM('NORMAL', 'PREMIUM') NOT NULL DEFAULT 'NORMAL',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_poi_contents_poi_language_voice (poi_id, language_code, voice_type),
  KEY idx_poi_contents_poi_id (poi_id),
  KEY idx_poi_contents_language_code (language_code),
  KEY idx_poi_contents_created_at (created_at),
  CONSTRAINT fk_poi_contents_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE media_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  stall_id BIGINT UNSIGNED NULL,
  poi_id BIGINT UNSIGNED NULL,
  file_type ENUM('IMAGE', 'VIDEO', 'AUDIO', 'LOGO', 'QR') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_media_files_owner_id (owner_id),
  KEY idx_media_files_stall_id (stall_id),
  KEY idx_media_files_poi_id (poi_id),
  KEY idx_media_files_file_type (file_type),
  KEY idx_media_files_created_at (created_at),
  CONSTRAINT fk_media_files_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_media_files_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_media_files_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE qr_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stall_id BIGINT UNSIGNED NULL,
  poi_id BIGINT UNSIGNED NULL,
  qr_type ENUM('APP', 'STALL', 'POI', 'PREMIUM_REFERRAL', 'PAYMENT') NOT NULL,
  qr_code_url VARCHAR(500) NOT NULL,
  target_url VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qr_codes_stall_id (stall_id),
  KEY idx_qr_codes_poi_id (poi_id),
  KEY idx_qr_codes_qr_type (qr_type),
  KEY idx_qr_codes_created_at (created_at),
  CONSTRAINT fk_qr_codes_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_qr_codes_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE qr_scan_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  qr_code_id BIGINT UNSIGNED NOT NULL,
  stall_id BIGINT UNSIGNED NULL,
  poi_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  session_id VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  country_code CHAR(2) NULL,
  scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qr_scan_events_qr_code_id (qr_code_id),
  KEY idx_qr_scan_events_stall_id (stall_id),
  KEY idx_qr_scan_events_poi_id (poi_id),
  KEY idx_qr_scan_events_user_id (user_id),
  KEY idx_qr_scan_events_session_id (session_id),
  KEY idx_qr_scan_events_scanned_at (scanned_at),
  CONSTRAINT fk_qr_scan_events_qr_code
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_qr_scan_events_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_qr_scan_events_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_qr_scan_events_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE visit_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stall_id BIGINT UNSIGNED NOT NULL,
  poi_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  session_id VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  distance_meters DECIMAL(10, 2) NULL,
  visited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_visit_events_stall_id (stall_id),
  KEY idx_visit_events_poi_id (poi_id),
  KEY idx_visit_events_user_id (user_id),
  KEY idx_visit_events_session_id (session_id),
  KEY idx_visit_events_visited_at (visited_at),
  CONSTRAINT fk_visit_events_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_visit_events_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_visit_events_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE play_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  session_id VARCHAR(100) NOT NULL,
  poi_id BIGINT UNSIGNED NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  played_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_play_history_user_id (user_id),
  KEY idx_play_history_session_id (session_id),
  KEY idx_play_history_poi_id (poi_id),
  KEY idx_play_history_played_at (played_at),
  CONSTRAINT fk_play_history_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_play_history_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  stall_id BIGINT UNSIGNED NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  payment_method ENUM('MOMO', 'BANK_QR', 'STRIPE', 'CASH_MANUAL') NOT NULL,
  payment_type ENUM('APP_PREMIUM', 'STALL_SUBSCRIPTION', 'STALL_PREMIUM', 'OTHER') NOT NULL DEFAULT 'OTHER',
  status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  transaction_code VARCHAR(255) NULL,
  note VARCHAR(1000) NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_user_id (user_id),
  KEY idx_payments_stall_id (stall_id),
  KEY idx_payments_status (status),
  KEY idx_payments_created_at (created_at),
  KEY idx_payments_paid_at (paid_at),
  CONSTRAINT fk_payments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_payments_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cash_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stall_id BIGINT UNSIGNED NOT NULL,
  reported_by BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  note VARCHAR(1000) NULL,
  report_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cash_reports_stall_id (stall_id),
  KEY idx_cash_reports_reported_by (reported_by),
  KEY idx_cash_reports_report_date (report_date),
  KEY idx_cash_reports_created_at (created_at),
  CONSTRAINT fk_cash_reports_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_cash_reports_reported_by
    FOREIGN KEY (reported_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE commissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stall_id BIGINT UNSIGNED NOT NULL,
  payment_id BIGINT UNSIGNED NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(18, 2) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_commissions_stall_id (stall_id),
  KEY idx_commissions_payment_id (payment_id),
  KEY idx_commissions_status (status),
  KEY idx_commissions_created_at (created_at),
  CONSTRAINT fk_commissions_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_commissions_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id BIGINT UNSIGNED NULL,
  description VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_logs_admin_id (admin_id),
  KEY idx_admin_logs_action (action),
  KEY idx_admin_logs_target (target_type, target_id),
  KEY idx_admin_logs_created_at (created_at),
  CONSTRAINT fk_admin_logs_admin
    FOREIGN KEY (admin_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(150) NOT NULL,
  setting_value TEXT NULL,
  description VARCHAR(500) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_settings_setting_key (setting_key),
  KEY idx_app_settings_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
