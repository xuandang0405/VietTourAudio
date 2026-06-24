USE viettuoraudio;

-- 1. Add start_date, end_date, type, price, and code columns to tours table
ALTER TABLE tours
ADD COLUMN start_date DATETIME NULL,
ADD COLUMN end_date DATETIME NULL,
ADD COLUMN type ENUM('NORMAL', 'FESTIVAL') NOT NULL DEFAULT 'NORMAL',
ADD COLUMN price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
ADD COLUMN code VARCHAR(100) UNIQUE NULL;

-- 2. Modify qr_type enum in qr_codes and add tour_id reference
ALTER TABLE qr_codes
MODIFY COLUMN qr_type ENUM('GLOBAL_APP', 'VENDOR', 'STALL', 'POI', 'PAYMENT', 'PREMIUM', 'TOUR') NOT NULL,
ADD COLUMN tour_id BIGINT UNSIGNED NULL,
ADD CONSTRAINT fk_qr_codes_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON UPDATE CASCADE ON DELETE CASCADE;
