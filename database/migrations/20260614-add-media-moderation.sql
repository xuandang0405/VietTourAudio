USE viettuoraudio;

-- Run this once only when database/schema.sql from main was imported before
-- the unified runtime update. Fresh databases already contain these fields.
ALTER TABLE media_files
  ADD COLUMN moderation_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN') NOT NULL DEFAULT 'PENDING' AFTER checksum_sha256,
  ADD COLUMN moderated_by_user_id BIGINT UNSIGNED NULL AFTER moderation_status,
  ADD COLUMN moderated_at TIMESTAMP NULL DEFAULT NULL AFTER moderated_by_user_id,
  ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER moderated_at,
  ADD KEY idx_media_files_moderation_status (moderation_status),
  ADD KEY idx_media_files_moderated_by_user_id (moderated_by_user_id),
  ADD CONSTRAINT fk_media_files_moderated_by
    FOREIGN KEY (moderated_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
