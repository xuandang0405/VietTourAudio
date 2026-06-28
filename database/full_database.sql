-- =============================================================================
-- VietTourAudio - COMPLETE DATABASE ENTRY POINT
-- Run this file from the repository root:
--   mysql -u root -p < database/full_database.sql
--
-- This is the single canonical bootstrap entry point. It creates every table,
-- foreign key, index, trigger and then imports the complete baseline seed.
-- =============================================================================

SOURCE database/schema.sql;
SOURCE database/seed.sql;
