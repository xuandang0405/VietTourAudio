-- Computes the current MAX(id) inside the 'pois' table and automatically advances the table's internal AUTO_INCREMENT pointer counter safely.
SET @max_id = 1;
SELECT IFNULL(MAX(id), 0) + 1 INTO @max_id FROM pois;
SET @query = CONCAT('ALTER TABLE pois AUTO_INCREMENT = ', @max_id);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Computes the current MAX(id) inside the 'zones' table and automatically advances the table's internal AUTO_INCREMENT pointer counter safely.
SET @max_zone_id = 1;
SELECT IFNULL(MAX(id), 0) + 1 INTO @max_zone_id FROM zones;
SET @query_zone = CONCAT('ALTER TABLE zones AUTO_INCREMENT = ', @max_zone_id);
PREPARE stmt_zone FROM @query_zone;
EXECUTE stmt_zone;
DEALLOCATE PREPARE stmt_zone;
