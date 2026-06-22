USE viettuoraudio;

CREATE TABLE IF NOT EXISTS vendor_portal_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  email VARCHAR(255) NOT NULL,
  pass_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  status ENUM('ACTIVE', 'LOCKED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_portal_users_email (email),
  UNIQUE KEY uq_vendor_portal_users_vendor_id (vendor_id),
  KEY idx_vendor_portal_users_status (status),
  CONSTRAINT fk_vendor_portal_users_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

INSERT INTO vendor_portal_users (vendor_id, email, pass_hash, full_name, status)
VALUES
  (1, 'an@heritagefoods.vn', '$2b$10$4m7M4uBkB8XRSWlzYB64x.S3hNrCW3R5BtHeArtiz65f2aTNikJjG', 'Nguyễn Minh An', 'ACTIVE'),
  (2, 'lan@lantern.vn', '$2b$10$4m7M4uBkB8XRSWlzYB64x.S3hNrCW3R5BtHeArtiz65f2aTNikJjG', 'Trần Thị Lan', 'ACTIVE'),
  (3, 'binh@oldtowncoffee.vn', '$2b$10$4m7M4uBkB8XRSWlzYB64x.S3hNrCW3R5BtHeArtiz65f2aTNikJjG', 'Lê Quốc Bình', 'ACTIVE'),
  (6, 'hanh@market.vn', '$2b$10$4m7M4uBkB8XRSWlzYB64x.S3hNrCW3R5BtHeArtiz65f2aTNikJjG', 'Đặng Mỹ Hạnh', 'ACTIVE'),
  (8, 'mai@caolau.vn', '$2b$10$4m7M4uBkB8XRSWlzYB64x.S3hNrCW3R5BtHeArtiz65f2aTNikJjG', 'Bùi Ngọc Mai', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  vendor_id = VALUES(vendor_id),
  pass_hash = VALUES(pass_hash),
  full_name = VALUES(full_name),
  status = VALUES(status);