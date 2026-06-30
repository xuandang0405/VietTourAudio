ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_premium_active TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN IF NOT EXISTS premium_expiry_date DATETIME(6) NULL DEFAULT NULL AFTER is_premium_active;

CREATE TABLE IF NOT EXISTS visitor_sessions (
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

CREATE TABLE IF NOT EXISTS user_poi_audio_plays (
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
