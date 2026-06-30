const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.sql');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Remove old `zones` table completely
schema = schema.replace(/CREATE TABLE zones \([\s\S]*?\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n/g, '');

// 2. Remove `tour_pois` table completely
schema = schema.replace(/CREATE TABLE tour_pois \([\s\S]*?\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n/g, '');

// 3. Extract `tours` table and place it before `pois`
const toursMatch = schema.match(/CREATE TABLE tours \([\s\S]*?\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n/);
if (toursMatch) {
  schema = schema.replace(toursMatch[0], '');
  // Insert before `CREATE TABLE pois`
  schema = schema.replace('CREATE TABLE pois (', toursMatch[0] + 'CREATE TABLE zones (\n  tour_id BIGINT UNSIGNED NOT NULL,\n');
}

// 4. Transform `pois` to `zones`
// Since we already replaced `CREATE TABLE pois` with `CREATE TABLE zones`, we just need to handle the rest of it.
schema = schema.replace(/  zone_code VARCHAR\(100\) NULL COMMENT 'FK đến zones\.zone_code',\n/g, '');
// Add constraint for tour_id
schema = schema.replace(/  CONSTRAINT fk_pois_stall/g, '  KEY idx_zones_tour_id (tour_id),\n  CONSTRAINT fk_zones_tour\n    FOREIGN KEY (tour_id) REFERENCES tours(id)\n    ON UPDATE CASCADE ON DELETE CASCADE,\n  CONSTRAINT fk_zones_stall');

// Replace `pois_` with `zones_` inside the table definition
// We need to be careful. The table was `pois` so the keys were like `idx_pois_stall_id`.
// Let's replace the whole table definition of `pois` manually.
const oldPoisStart = 'CREATE TABLE zones ('; // We already replaced this
// Actually, it's easier to just use string replacements on the whole file.

fs.writeFileSync(schemaPath + '.bak', fs.readFileSync(schemaPath, 'utf8')); // backup

let newSchema = fs.readFileSync(schemaPath, 'utf8');

// A better approach: 
// We will replace the entire block from CREATE TABLE stalls to the end of tour_pois with a newly written block.
const blockStart = 'CREATE TABLE stalls (';
const blockEnd = 'CREATE TABLE favorites (';
const oldBlock = newSchema.substring(newSchema.indexOf(blockStart), newSchema.indexOf(blockEnd));

const newBlock = `CREATE TABLE tours (
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

CREATE TABLE stalls (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  address VARCHAR(500) NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  activation_radius INT UNSIGNED NOT NULL DEFAULT 3,
  status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  opening_hours JSON NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  priority_score INT NOT NULL DEFAULT 0,
  zone_code VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stalls_vendor_slug (vendor_id, slug),
  UNIQUE KEY uq_stalls_zone_code (zone_code),
  KEY idx_stalls_vendor_id (vendor_id),
  KEY idx_stalls_status (status),
  KEY idx_stalls_lat_lng (latitude, longitude),
  KEY idx_stalls_is_premium (is_premium),
  KEY idx_stalls_priority_score (priority_score),
  KEY idx_stalls_created_at (created_at),
  CONSTRAINT fk_stalls_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE zones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tour_id BIGINT UNSIGNED NOT NULL,
  stall_id BIGINT UNSIGNED NOT NULL,
  free_listens_allowed TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT 'Số lần nghe miễn phí trước khi yêu cầu Premium',
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
  UNIQUE KEY uq_zones_stall_slug (stall_id, slug),
  KEY idx_zones_tour_id (tour_id),
  KEY idx_zones_stall_id (stall_id),
  KEY idx_zones_status (status),
  KEY idx_zones_lat_lng (latitude, longitude),
  KEY idx_zones_created_at (created_at),
  CONSTRAINT fk_zones_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_zones_stall
    FOREIGN KEY (stall_id) REFERENCES stalls(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

newSchema = newSchema.replace(oldBlock, newBlock);

// 5. Delete the old `zones` table at the end
const oldZonesStart = 'CREATE TABLE zones (\n  id              BIGINT';
if (newSchema.indexOf(oldZonesStart) > -1) {
  const nextTable = 'CREATE TABLE app_settings';
  const toDelete = newSchema.substring(newSchema.indexOf(oldZonesStart), newSchema.indexOf(nextTable));
  newSchema = newSchema.replace(toDelete, '');
}

// 6. Update all Foreign Keys referencing `pois(id)` to `zones(id)`
newSchema = newSchema.replace(/REFERENCES pois\(id\)/g, 'REFERENCES zones(id)');

// 7. Add `tour_id` to `qr_codes`
newSchema = newSchema.replace(
  '  stall_id BIGINT UNSIGNED NULL,\n  poi_id BIGINT UNSIGNED NULL,',
  '  tour_id BIGINT UNSIGNED NULL,\n  stall_id BIGINT UNSIGNED NULL,\n  poi_id BIGINT UNSIGNED NULL,'
);
newSchema = newSchema.replace(
  '  KEY idx_qr_codes_stall_id (stall_id),',
  '  KEY idx_qr_codes_tour_id (tour_id),\n  KEY idx_qr_codes_stall_id (stall_id),'
);
newSchema = newSchema.replace(
  '  CONSTRAINT fk_qr_codes_stall',
  '  CONSTRAINT fk_qr_codes_tour\n    FOREIGN KEY (tour_id) REFERENCES tours(id)\n    ON UPDATE CASCADE ON DELETE CASCADE,\n  CONSTRAINT fk_qr_codes_stall'
);

// 8. Add `tour_id` to `qr_scan_events`
newSchema = newSchema.replace(
  '  vendor_id BIGINT UNSIGNED NULL,\n  stall_id BIGINT UNSIGNED NULL,',
  '  vendor_id BIGINT UNSIGNED NULL,\n  tour_id BIGINT UNSIGNED NULL,\n  stall_id BIGINT UNSIGNED NULL,'
);
newSchema = newSchema.replace(
  '  KEY idx_qr_scan_events_vendor_id (vendor_id),',
  '  KEY idx_qr_scan_events_vendor_id (vendor_id),\n  KEY idx_qr_scan_events_tour_id (tour_id),'
);
newSchema = newSchema.replace(
  '  CONSTRAINT fk_qr_scan_events_vendor',
  '  CONSTRAINT fk_qr_scan_events_tour\n    FOREIGN KEY (tour_id) REFERENCES tours(id)\n    ON UPDATE CASCADE ON DELETE SET NULL,\n  CONSTRAINT fk_qr_scan_events_vendor'
);

// 9. qr_type ENUM in qr_codes: add 'TOUR'
newSchema = newSchema.replace(
  "qr_type ENUM('GLOBAL_APP', 'VENDOR', 'STALL', 'POI', 'PAYMENT', 'PREMIUM')",
  "qr_type ENUM('GLOBAL_APP', 'VENDOR', 'TOUR', 'STALL', 'POI', 'PAYMENT', 'PREMIUM')"
);


fs.writeFileSync(schemaPath, newSchema);
console.log('Schema updated successfully.');
