USE viettuoraudio;

SET @constraint_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'stalls' AND index_name = 'uq_stalls_vendor_id'
);
SET @statement = IF(
  @constraint_exists = 0,
  'ALTER TABLE stalls ADD UNIQUE KEY uq_stalls_vendor_id (vendor_id)',
  'SELECT 1'
);
PREPARE migration_statement FROM @statement;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;
