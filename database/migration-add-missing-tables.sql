-- Database Migration: Add Missing Tables
-- Run this script if you have an existing viettuoraudio database
-- It will add tours, tour_pois, and favorites tables

USE viettuoraudio;

-- Check and add tours table if it doesn't exist
CREATE TABLE IF NOT EXISTS tours (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  cover_image_url VARCHAR(500) NULL,
  status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tours_vendor_slug (vendor_id, slug),
  KEY idx_tours_vendor_id (vendor_id),
  KEY idx_tours_status (status),
  KEY idx_tours_created_at (created_at),
  CONSTRAINT fk_tours_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Check and add tour_pois junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS tour_pois (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tour_id BIGINT UNSIGNED NOT NULL,
  poi_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tour_pois_tour_poi (tour_id, poi_id),
  KEY idx_tour_pois_tour_id (tour_id),
  KEY idx_tour_pois_poi_id (poi_id),
  CONSTRAINT fk_tour_pois_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_tour_pois_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Check and add favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  guest_id VARCHAR(255) NOT NULL,
  poi_id BIGINT UNSIGNED NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites_guest_poi (guest_id, poi_id),
  KEY idx_favorites_guest_id (guest_id),
  KEY idx_favorites_poi_id (poi_id),
  KEY idx_favorites_added_at (added_at),
  CONSTRAINT fk_favorites_poi
    FOREIGN KEY (poi_id) REFERENCES pois(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migration complete!' AS status;
SELECT COUNT(*) AS tours_count FROM tours;
SELECT COUNT(*) AS tour_pois_count FROM tour_pois;
SELECT COUNT(*) AS favorites_count FROM favorites;
