-- ============================================================
--  Migration: 20260623-add-zones-freemium
--  Mô tả: Thêm bảng zones để hỗ trợ Deep Link /zone/:code
--         và cột zone_code trên bảng pois
-- ============================================================

USE viettuoraudio;

-- ── 1. Bảng zones ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  zone_code       VARCHAR(100) NOT NULL COMMENT 'Mã vùng dùng trong URL, VD: PHODIBONGUYENHUE',
  name            VARCHAR(255) NOT NULL,
  description     TEXT NULL,
  cover_image_url VARCHAR(500) NULL,
  latitude        DECIMAL(10, 7) NULL,
  longitude       DECIMAL(10, 7) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_zones_code (zone_code),
  KEY idx_zones_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Thêm cột zone_code vào bảng pois (nếu chưa có) ────────
ALTER TABLE pois
  ADD COLUMN IF NOT EXISTS zone_code VARCHAR(100) NULL
    COMMENT 'FK đến zones.zone_code'
    AFTER stall_id,
  ADD INDEX IF NOT EXISTS idx_pois_zone_code (zone_code);

-- ── 3. Seed dữ liệu zone PHODIBONGUYENHUE ────────────────────
INSERT INTO zones (zone_code, name, description, latitude, longitude, is_active)
VALUES (
  'PHODIBONGUYENHUE',
  'Phố đi bộ Nguyễn Huệ',
  'Tuyến phố đi bộ trung tâm TP.HCM với nhiều điểm tham quan lịch sử, văn hóa và ẩm thực đặc sắc.',
  10.7758200,
  106.7020800,
  1
)
ON DUPLICATE KEY UPDATE
  name        = VALUES(name),
  description = VALUES(description),
  latitude    = VALUES(latitude),
  longitude   = VALUES(longitude),
  is_active   = VALUES(is_active);

-- ── 4. Gán zone_code cho các POI hiện tại thuộc khu vực NHue ─
UPDATE pois
SET zone_code = 'PHODIBONGUYENHUE'
WHERE zone_code IS NULL
  AND (
    (latitude  BETWEEN 10.7740 AND 10.7780)
    AND (longitude BETWEEN 106.6990 AND 106.7060)
  );

-- ── 5. Cột free_listens_allowed trên pois (tùy chọn) ─────────
-- Cho phép admin cấu hình số lần nghe miễn phí theo từng POI
ALTER TABLE pois
  ADD COLUMN IF NOT EXISTS free_listens_allowed TINYINT UNSIGNED NOT NULL DEFAULT 2
    COMMENT 'Số lần nghe miễn phí trước khi yêu cầu Premium'
    AFTER zone_code;
