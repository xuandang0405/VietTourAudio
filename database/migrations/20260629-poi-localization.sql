-- =============================================================================
-- MIGRATION: Add localization columns to Pois table
-- Date: 2026-06-29
-- Purpose: Store auto-translated name/description in 4 target languages
-- =============================================================================

ALTER TABLE pois
  ADD COLUMN IF NOT EXISTS stall_name_en VARCHAR(255) NULL AFTER stall_name,
  ADD COLUMN IF NOT EXISTS stall_name_ja VARCHAR(255) NULL AFTER stall_name_en,
  ADD COLUMN IF NOT EXISTS stall_name_ko VARCHAR(255) NULL AFTER stall_name_ja,
  ADD COLUMN IF NOT EXISTS stall_name_zh VARCHAR(255) NULL AFTER stall_name_ko,
  ADD COLUMN IF NOT EXISTS description_en LONGTEXT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS description_ja LONGTEXT NULL AFTER description_en,
  ADD COLUMN IF NOT EXISTS description_ko LONGTEXT NULL AFTER description_ja,
  ADD COLUMN IF NOT EXISTS description_zh LONGTEXT NULL AFTER description_ko;
