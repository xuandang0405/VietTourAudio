-- =============================================================================
-- VietTourAudio - COMPLETE DATABASE ENTRY POINT
-- Run this file from the repository root:
--   mysql -u root -p < database/full_database.sql
--
-- This is the single canonical bootstrap entry point. It creates every table,
-- foreign key, index and trigger. Business data is intentionally empty and
-- must be created through the real Admin/Vendor/User APIs.
-- =============================================================================

SOURCE database/schema.sql;
