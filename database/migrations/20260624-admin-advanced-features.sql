USE viettuoraudio;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS assigned_zone_id BIGINT UNSIGNED NULL AFTER role,
  ADD INDEX IF NOT EXISTS idx_users_assigned_zone_id (assigned_zone_id);

