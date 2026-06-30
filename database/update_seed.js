const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'seed.sql');
let seed = fs.readFileSync(seedPath, 'utf8');

// 1. Update TRUNCATE statements
seed = seed.replace('TRUNCATE TABLE tour_pois;\n', '');
seed = seed.replace('TRUNCATE TABLE pois;\n', '');
// Ensure 'zones' is truncated correctly (it's already there)

// 2. Insert `tours` data right before `stalls`
const stallsInsertMatch = seed.match(/INSERT INTO stalls \([\s\S]*?\) VALUES\n/);
if (stallsInsertMatch) {
  const toursInsert = `INSERT INTO tours (id, vendor_id, name, slug, description, status, sort_order, is_premium) VALUES
(1, 1, 'Khu phố đi bộ Nguyễn Huệ', 'nguyen-hue', 'Khu trung tâm sầm uất.', 'PUBLISHED', 1, 0),
(2, 2, 'Khu phố ẩm thực Vĩnh Khánh', 'vinh-khanh', 'Thiên đường ẩm thực.', 'PUBLISHED', 2, 0);

`;
  seed = seed.replace(stallsInsertMatch[0], toursInsert + stallsInsertMatch[0]);
}

// 3. Convert `pois` to `zones`
// The `pois` table was: id, stall_id, zone_code, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order
// The `zones` table is: id, tour_id, stall_id, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order
// We need to replace `zone_code` (which is 'PHODIBONGUYENHUE') with `tour_id` (which is 1)
seed = seed.replace(/INSERT INTO pois \(id, stall_id, zone_code,/g, 'INSERT INTO zones (id, stall_id, tour_id,');
// We need to replace 'PHODIBONGUYENHUE' with 1 for the tour_id. Note the order: id, stall_id, zone_code -> id, stall_id, tour_id
seed = seed.replace(/'PHODIBONGUYENHUE'/g, '1');

// Wait, the new schema is `tour_id, stall_id`. Let's check update_schema.js
// CREATE TABLE zones (
//   id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
//   tour_id BIGINT UNSIGNED NOT NULL,
//   stall_id BIGINT UNSIGNED NOT NULL,
// So `id, tour_id, stall_id`.
// In seed: INSERT INTO zones (id, stall_id, tour_id, ...) -> that's perfectly valid SQL as long as the columns map correctly!
// Let's change the columns explicitly to match the order:
seed = seed.replace(/INSERT INTO zones \(id, stall_id, tour_id,/g, 'INSERT INTO zones (id, stall_id, tour_id,'); 
// The string replacement above was: `pois (id, stall_id, zone_code,` to `zones (id, stall_id, tour_id,` which maps perfectly!

// 4. Update qr_codes
// qr_codes has: id, vendor_id, stall_id, poi_id, code, qr_type, target_url, image_url, is_active
// Now it is: id, vendor_id, tour_id, stall_id, poi_id, code, qr_type, target_url, image_url, is_active
seed = seed.replace(/INSERT INTO qr_codes \(id, vendor_id, stall_id, poi_id, code, qr_type, target_url, image_url, is_active\) VALUES/g, 
  'INSERT INTO qr_codes (id, vendor_id, tour_id, stall_id, poi_id, code, qr_type, target_url, image_url, is_active) VALUES');
// (1, 1, 1, NULL, ...) -> (1, 1, NULL, 1, NULL, ...)  (vendor_id=1, tour_id=NULL, stall_id=1)
// Let's replace the lines:
seed = seed.replace(/\(1, 1, 1, NULL, 'VTA-ST-0001',/g, "(1, 1, NULL, 1, NULL, 'VTA-ST-0001',");
seed = seed.replace(/\(2, 2, 2, NULL, 'VTA-ST-0002',/g, "(2, 2, NULL, 2, NULL, 'VTA-ST-0002',");
seed = seed.replace(/\(3, 8, 8, 13, 'VTA-POI-0013',/g, "(3, 8, NULL, 8, 13, 'VTA-POI-0013',");
seed = seed.replace(/\(4, 8, 8, NULL, 'VTA-PAY-0008',/g, "(4, 8, NULL, 8, NULL, 'VTA-PAY-0008',");

// Add a TOUR qr code
const newQr = `(5, 1, 1, NULL, NULL, 'VTA-TOUR-0001', 'TOUR', 'https://app.viettouraudio.vn/tour/nguyen-hue', '/qr/tour-1.png', 1),\n`;
seed = seed.replace(/\(1, 1, NULL, 1, NULL, 'VTA-ST-0001',/g, newQr + "(1, 1, NULL, 1, NULL, 'VTA-ST-0001',");

// 5. Update qr_scan_events
// From: INSERT INTO qr_scan_events (id, qr_code_id, vendor_id, stall_id, poi_id, visitor_session_id, country_code, scanned_at) VALUES
// To: include tour_id
seed = seed.replace(/INSERT INTO qr_scan_events \(id, qr_code_id, vendor_id, stall_id, poi_id, visitor_session_id, country_code, scanned_at\) VALUES/g,
  'INSERT INTO qr_scan_events (id, qr_code_id, vendor_id, tour_id, stall_id, poi_id, visitor_session_id, country_code, scanned_at) VALUES');
// We need to inject `NULL` for tour_id in existing ones
seed = seed.replace(/\(1, 1, 1, 1, NULL,/g, "(1, 1, 1, NULL, 1, NULL,");
seed = seed.replace(/\(2, 2, 2, 2, NULL,/g, "(2, 2, 2, NULL, 2, NULL,");
seed = seed.replace(/\(3, 3, 8, 8, 13,/g, "(3, 3, 8, NULL, 8, 13,");
// Add a TOUR scan
const newScan = `(4, 5, 1, 1, NULL, NULL, 1, 'VN', '2026-06-11 08:30:00'),\n`;
seed = seed.replace(/\(1, 1, 1, NULL, 1, NULL,/g, newScan + "(1, 1, 1, NULL, 1, NULL,");

// 6. Delete old `zones` insert at the end
const oldZonesInsert = `INSERT INTO zones (zone_code, name, description, latitude, longitude, is_active) VALUES
('PHODIBONGUYENHUE', 'Phố đi bộ Nguyễn Huệ', 'Tuyến phố đi bộ trung tâm TP.HCM với nhiều điểm tham quan lịch sử, văn hóa và ẩm thực đặc sắc.', 10.7758200, 106.7020800, 1);

`;
seed = seed.replace(oldZonesInsert, '');

fs.writeFileSync(seedPath, seed);
console.log('Seed updated successfully.');
