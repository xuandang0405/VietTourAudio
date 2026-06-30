-- =============================================================================
-- VietTourAudio DEVELOPMENT/TEST SEED DATA
-- Dialect: MySQL 8.0+ / MariaDB
-- Area: Phố Ẩm Thực Sủi Cảo Hà Tôn Quyền, Quận 11, TP.HCM
-- =============================================================================

USE viettuoraudio;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE StallProducts;
TRUNCATE TABLE Pois;
TRUNCATE TABLE vendor_portal_users;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE favorites;
TRUNCATE TABLE vendor_wallets;
TRUNCATE TABLE wallet_transactions;
TRUNCATE TABLE system_tickets;
TRUNCATE TABLE media_files;
TRUNCATE TABLE qr_codes;
TRUNCATE TABLE admin_payment_configs;
TRUNCATE TABLE payment_transactions;
TRUNCATE TABLE users;
TRUNCATE TABLE Vendors;
TRUNCATE TABLE FestivalZones;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. FESTIVAL ZONES (Hà Tôn Quyền Apex Parent)
-- =============================================================================
INSERT INTO FestivalZones (id, zone_code, name, slug, latitude, longitude, cover_url, description, status, sort_order, created_at)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'ZONE-HTQ',
  'Phố Sủi Cảo Hà Tôn Quyền',
  'pho-sui-cao-ha-ton-quyen',
  10.759400,
  106.657600,
  '/uploads/zones/hatonquyen.jpg',
  'Trải nghiệm phố sủi cảo truyền thống lâu đời bậc nhất Sài Gòn tại Quận 11.',
  'PUBLISHED',
  1,
  NOW()
);

-- =============================================================================
-- 2. VENDORS (3 accounts: thienthien@gmail.com, nhuy@gmail.com, ngocanh@gmail.com)
-- =============================================================================
INSERT INTO Vendors (id, festival_zone_id, email, trade_name, is_premium, premium_activation_date, premium_expiry_date, created_at)
VALUES 
-- 2.1 Sủi Cảo Thiên Thiên (active Gold Premium status)
(
  'a0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'thienthien@gmail.com',
  'Sủi Cảo Thiên Thiên',
  1,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  NOW()
),
-- 2.2 Sủi Cảo Ngọc Ý (approved standard status)
(
  'b0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'nhuy@gmail.com',
  'Sủi Cảo Ngọc Ý',
  0,
  NULL,
  NULL,
  NOW()
),
-- 2.3 Sủi Cảo Ngọc Anh (pending status)
(
  'c0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'ngocanh@gmail.com',
  'Sủi Cảo Ngọc Anh',
  0,
  NULL,
  NULL,
  NOW()
);

-- =============================================================================
-- 3. POIS (Nhất thể hóa Sạp hàng và Điểm thuyết minh)
-- =============================================================================
INSERT INTO Pois (id, festival_zone_id, vendor_id, stall_name, slug, description, latitude, longitude, cover_url, approval_status, is_premium_priority, trigger_radius, status, sort_order, created_at, updated_at)
VALUES
-- 3.1 Sủi Cảo Thiên Thiên POI (Premium, Trigger radius 10.0m)
(
  'a1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'a0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'Sủi Cảo Thiên Thiên',
  'sui-cao-thien-thien',
  'Chào mừng quý khách đến với sủi cảo Thiên Thiên, địa chỉ ẩm thực trứ danh với viên sủi cảo tôm thịt căng mọng thơm ngon đậm đà.',
  10.759320,
  106.657450,
  '/uploads/vendor/thienthien.jpg',
  'APPROVED',
  1,
  10.0,
  'ACTIVE',
  1,
  NOW(),
  NOW()
),
-- 3.2 Sủi Cảo Ngọc Ý POI (Standard, Trigger radius 3.0m)
(
  'b1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'b0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'Sủi Cảo Ngọc Ý',
  'sui-cao-ngoc-y',
  'Chào mừng quý khách đến với sủi cảo Ngọc Ý, cửa hàng sủi cảo lâu đời với công thức nước dùng thanh ngọt tự nhiên cùng nhân sủi cảo truyền thống tinh tế.',
  10.759560,
  106.657800,
  '/uploads/vendor/ngocy.jpg',
  'APPROVED',
  0,
  3.0,
  'ACTIVE',
  2,
  NOW(),
  NOW()
),
-- 3.3 Sủi Cảo Ngọc Anh POI (Pending status, Trigger radius 3.0m)
(
  'c1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'c0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'Sủi Cảo Ngọc Anh',
  'sui-cao-ngoc-anh',
  'Sủi cảo Ngọc Anh đang chờ phê duyệt. Nơi đây hứa hẹn sẽ đem lại trải nghiệm ẩm thực gia đình ấm cúng cùng những món sủi cảo rán độc đáo.',
  10.759150,
  106.657250,
  '/uploads/vendor/ngocanh.jpg',
  'PENDING',
  0,
  3.0,
  'ACTIVE',
  3,
  NOW(),
  NOW()
);

-- =============================================================================
-- 4. STALL PRODUCTS
-- =============================================================================
INSERT INTO StallProducts (poi_id, product_name, price)
VALUES
-- Sủi Cảo Thiên Thiên menu
('a1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'Sủi cảo tôm mực đặc biệt', 85000),
('a1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'Sủi cảo khô sốt Hồng Kông', 90000),
('a1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'Sủi cảo chiên giòn sốt me', 80000),
-- Sủi Cảo Ngọc Ý menu
('b1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'Sủi cảo chưng thịt thập cẩm', 65000),
('b1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'Sủi cảo chiên truyền thống', 70000),
-- Sủi Cảo Ngọc Anh menu
('c1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'Sủi cảo chay thanh đạm', 55000),
('c1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'Sủi cảo chiên giòn tan', 60000);

-- =============================================================================
-- 5. USERS (Admin / Moderator logins - Password is Admin123)
-- =============================================================================
INSERT INTO users (id, email, pass_hash, full_name, role, status)
VALUES
(
  'd0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'admin@viettouraudio.vn',
  '$2b$10$aAWkIkwtjeGwFmzbMI6bNuwS6cuTh1J8.JVP0TY.du7PuXvf7JP.y',
  'Hệ Thống Admin',
  'ADMIN',
  'ACTIVE'
);

-- =============================================================================
-- 6. VENDOR PORTAL USERS (Login accounts for vendors - Password is Vendor123)
-- =============================================================================
INSERT INTO vendor_portal_users (id, vendor_id, email, pass_hash, full_name, status)
VALUES
(
  'a2f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'a0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'thienthien@gmail.com',
  '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i',
  'Vendor Thiên Thiên',
  'ACTIVE'
),
(
  'b2f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'b0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'nhuy@gmail.com',
  '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i',
  'Vendor Ngọc Ý',
  'ACTIVE'
),
(
  'c2f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'c0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'ngocanh@gmail.com',
  '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i',
  'Vendor Ngọc Anh',
  'ACTIVE'
);

-- =============================================================================
-- 7. VENDOR WALLETS
-- =============================================================================
INSERT INTO vendor_wallets (id, vendor_id, balance, total_top_up, total_spent)
VALUES
('w0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'a0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 3000000.00, 3000000.00, 0.00),
('w1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'b0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 1000000.00, 1000000.00, 0.00),
('w2f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'c0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 0.00, 0.00, 0.00);

-- =============================================================================
-- 8. ADMIN PAYMENT CONFIGS (Ví Admin)
-- =============================================================================
INSERT INTO admin_payment_configs (gateway_type, account_name, account_number, qr_code_url, transfer_memo_pattern, is_active)
VALUES
('MOMO', 'VietTourAudio Admin', '0900000000', NULL, 'VTA [Type] [Id]', 1),
('BANK', 'VietTourAudio Admin', '000000000001', NULL, 'VTA [Type] [Id]', 1),
('VISA', 'VietTourAudio Admin', 'VISA-MOCK', NULL, 'VTA VISA [Id]', 1);

-- =============================================================================
-- 9. PAYMENT TRANSACTIONS
-- =============================================================================
INSERT INTO payment_transactions (id, sender_id, sender_type, payment_method, transaction_type, amount, transfer_memo, proof_attachment_url, status, created_at, updated_at)
VALUES
(
  'e0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'a0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'VENDOR',
  'BANK',
  'VENDOR_PREMIUM',
  599000.00,
  'VTA VENDOR THIENTHIEN PREMIUM',
  NULL,
  'APPROVED',
  NOW(6),
  NOW(6)
);

-- =============================================================================
-- 10. QR CODES
-- =============================================================================
INSERT INTO qr_codes (id, vendor_id, tour_id, poi_id, code, qr_type, target_url, is_active)
VALUES
(
  'q0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  NULL,
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  NULL,
  'TOUR-HTQ-HTQ1',
  'TOUR',
  '/tours/pho-sui-cao-ha-ton-quyen',
  1
),
(
  'q1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'a0f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  NULL,
  'a1f8b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'POI-TT-TT1',
  'POI',
  '/pois/sui-cao-thien-thien',
  1
);
