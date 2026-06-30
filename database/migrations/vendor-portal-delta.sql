-- ============================================================
-- VietTourAudio: Vendor Portal Delta Migration
-- Run this MANUALLY after backing up your database.
-- ============================================================

USE viettuoraudio;

-- 1. Add vendor_code and assigned_tour_id to vendors
ALTER TABLE vendors
  ADD COLUMN vendor_code VARCHAR(50) NULL UNIQUE AFTER slug,
  ADD COLUMN assigned_tour_id BIGINT UNSIGNED NULL AFTER vendor_code,
  ADD KEY idx_vendors_vendor_code (vendor_code),
  ADD KEY idx_vendors_assigned_tour_id (assigned_tour_id);

-- Backfill existing vendors with a generated code
UPDATE vendors SET vendor_code = CONCAT('VND-', LPAD(id, 4, '0')) WHERE vendor_code IS NULL;

-- Now enforce NOT NULL
ALTER TABLE vendors MODIFY COLUMN vendor_code VARCHAR(50) NOT NULL;

-- 2. Update stalls: change default radius, add is_premium + priority_score
ALTER TABLE stalls
  MODIFY COLUMN activation_radius INT UNSIGNED NOT NULL DEFAULT 3,
  ADD COLUMN is_premium TINYINT(1) NOT NULL DEFAULT 0 AFTER is_featured,
  ADD COLUMN priority_score INT NOT NULL DEFAULT 0 AFTER is_premium,
  ADD KEY idx_stalls_is_premium (is_premium),
  ADD KEY idx_stalls_priority_score (priority_score);

-- 3. Add approval_status to poi_contents
ALTER TABLE poi_contents
  ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER voice_profile,
  ADD KEY idx_poi_contents_approval_status (approval_status);

-- Approve all existing content
UPDATE poi_contents SET approval_status = 'approved';

-- 4. Add billing fields to vendor_subscriptions
ALTER TABLE vendor_subscriptions
  ADD COLUMN next_billing_date DATE NULL AFTER trial_end,
  ADD COLUMN payment_status ENUM('paid', 'unpaid', 'mock_testing') NOT NULL DEFAULT 'unpaid' AFTER next_billing_date,
  ADD KEY idx_vendor_subscriptions_payment_status (payment_status);

-- Backfill next_billing_date from period_end
UPDATE vendor_subscriptions SET next_billing_date = period_end WHERE next_billing_date IS NULL;
