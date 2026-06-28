-- =============================================================================
-- VietTourAudio DEVELOPMENT/TEST SEED
-- Dialect: MySQL 8.0+ / MariaDB
-- =============================================================================

USE viettuoraudio;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE payment_transactions;
TRUNCATE TABLE admin_payment_configs;
TRUNCATE TABLE poi_products;
TRUNCATE TABLE poi_contents;
TRUNCATE TABLE tour_pois;
TRUNCATE TABLE pois;
TRUNCATE TABLE zones;
TRUNCATE TABLE stalls;
TRUNCATE TABLE vendors;
TRUNCATE TABLE tours;
TRUNCATE TABLE vendor_wallets;
TRUNCATE TABLE vendor_subscriptions;
TRUNCATE TABLE vendor_portal_users;
TRUNCATE TABLE subscription_plans;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Users (Admin123 hash value)
INSERT INTO users (id, email, pass_hash, full_name, role, status) VALUES
(1, 'superadmin@viettouraudio.vn', '$2b$10$aAWkIkwtjeGwFmzbMI6bNuwS6cuTh1J8.JVP0TY.du7PuXvf7JP.y', 'Super Admin Test', 'SUPER_ADMIN', 'ACTIVE'),
(2, 'admin@viettouraudio.vn', '$2b$10$aAWkIkwtjeGwFmzbMI6bNuwS6cuTh1J8.JVP0TY.du7PuXvf7JP.y', 'Admin Test', 'ADMIN', 'ACTIVE'),
(3, 'moderator@viettouraudio.vn', '$2b$10$aAWkIkwtjeGwFmzbMI6bNuwS6cuTh1J8.JVP0TY.du7PuXvf7JP.y', 'Moderator Test', 'MODERATOR', 'ACTIVE');

-- 2. Insert Subscription Plans
INSERT INTO subscription_plans
  (id, code, name, price, billing_cycle, max_stalls, max_pois_per_stall, max_media_files, allow_premium_content, priority_support, is_active)
VALUES
(1, 'STANDARD_MONTHLY', 'Standard', 199000, 'MONTHLY', 1, 10, 100, 0, 0, 1),
(2, 'PREMIUM_MONTHLY', 'Premium', 599000, 'MONTHLY', 3, 30, 300, 1, 1, 1);

-- 3. Insert Tours (FestivalZones apex parent container - no vendor_id column)
INSERT INTO tours
  (id, name, slug, description, latitude, longitude, status, sort_order, is_premium, price)
VALUES
(1, 'Sủi Cảo Hà Tôn Quyền - Khu Standard', 'sui-cao-ha-ton-quyens-standard', 'Khu ẩm thực sủi cảo truyền thống khu vực Standard.', 10.759560, 106.657800, 'PUBLISHED', 1, 0, 0),
(2, 'Sủi Cảo Hà Tôn Quyền - Khu Premium', 'sui-cao-ha-ton-quyens-premium', 'Trải nghiệm âm thanh thuyết minh ẩm thực đặc sắc Khu Premium.', 10.759320, 106.657450, 'PUBLISHED', 2, 1, 30000);

-- 4. Insert Vendors (Linked directly to tours)
INSERT INTO vendors
  (id, legal_name, trade_name, slug, vendor_code, assigned_tour_id, contact_name, contact_email, phone, address, status, approved_by_user_id, approved_at)
VALUES
(1, 'Sủi Cảo Ngọc Ý', 'Sủi Cảo Ngọc Ý', 'sui-cao-ngoc-y', 'VND-NGOC-Y', 1, 'Nguyễn Như Ý', 'nhuy@gmail.com', '0908123456', '187 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 'APPROVED', 1, NOW()),
(2, 'Sủi Cảo Thiên Thiên', 'Sủi Cảo Thiên Thiên', 'sui-cao-thien-thien', 'VND-THIEN-THIEN', 2, 'Trần Thiên Thiên', 'thienthien@gmail.com', '0909987654', '197 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 'APPROVED', 1, NOW());

-- 5. Insert Vendor Portal Users (Vendor123 hash value)
INSERT INTO vendor_portal_users (id, vendor_id, email, pass_hash, full_name, status) VALUES
(1, 1, 'nhuy@gmail.com', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Vendor Ngọc Ý', 'ACTIVE'),
(2, 2, 'thienthien@gmail.com', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Vendor Thiên Thiên', 'ACTIVE');

-- 6. Insert Vendor Subscriptions (Expiry Date capped to 30 days)
INSERT INTO vendor_subscriptions
  (id, vendor_id, plan_id, status, period_start, period_end, next_billing_date, payment_status, price_snapshot)
VALUES
(1, 1, 1, 'ACTIVE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'paid', 199000),
(2, 2, 2, 'ACTIVE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'paid', 599000);

-- 7. Insert Vendor Wallets
INSERT INTO vendor_wallets
  (id, vendor_id, balance, total_top_up, total_spent, total_commission)
VALUES
(1, 1, 1000000, 1000000, 0, 0),
(2, 2, 3000000, 3000000, 0, 0);

-- 8. Insert Stalls (References vendors and real location coordinates)
INSERT INTO stalls
  (id, vendor_id, name, slug, description, address, latitude, longitude, activation_radius, status, is_featured, is_premium, is_premium_priority, premium_activation_date, premium_expiry_date, priority_score, zone_code, approval_status)
VALUES
(1, 1, 'Sủi Cảo Ngọc Ý', 'sui-cao-ngoc-y-primary', 'Sủi cảo gia truyền Ngọc Ý, phục vụ lâu năm tại phố ẩm thực.', '187 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 10.759560, 106.657800, 10, 'APPROVED', 1, 0, 1, NULL, NULL, 100, 'STALL-NGOC-Y', 'APPROVED'),
(2, 2, 'Sủi Cảo Thiên Thiên', 'sui-cao-thien-thien-primary', 'Thương hiệu sủi cảo Thiên Thiên nổi tiếng nhất khu vực.', '197 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 10.759320, 106.657450, 10, 'APPROVED', 1, 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 'STALL-THIEN-THIEN', 'APPROVED'),
(3, 2, 'Sủi Cảo 162 Chờ Duyệt', 'sui-cao-162-primary', 'Dữ liệu dùng kiểm thử Admin duyệt realtime.', '162 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 10.759150, 106.657250, 3, 'PENDING', 0, 1, 0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 0, 'STALL-162-PENDING', 'PENDING');

-- 9. Insert Zones (The after_zone_insert database trigger automatically spawns identical records in the pois table)
INSERT INTO zones
  (id, tour_id, stall_id, vendor_id, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order, approval_status)
VALUES
(1, 1, 1, 1, 2, 'Sủi Cảo Ngọc Ý', 'sui-cao-ngoc-y-poi', 'Nội dung thuyết minh thật lấy từ database cho sạp Ngọc Ý.', 10.759560, 106.657800, 10, 0, 'ACTIVE', 1, 'APPROVED'),
(2, 2, 2, 2, 2, 'Sủi Cảo Thiên Thiên', 'sui-cao-thien-thien-poi', 'Nội dung thuyết minh Premium của sạp Thiên Thiên, kiểm thử phạm vi kích hoạt GPS.', 10.759320, 106.657450, 10, 1, 'ACTIVE', 1, 'APPROVED'),
(3, 2, 3, 2, 2, 'Sủi Cảo 162 Chờ Duyệt', 'sui-cao-162-poi', 'POI sạp phụ của nhà cung cấp đang chờ Admin phê duyệt.', 10.759150, 106.657250, 3, 0, 'ACTIVE', 2, 'PENDING');

-- 10. Insert Tour POI junctions
INSERT INTO tour_pois (tour_id, poi_id, sort_order) VALUES
(1, 1, 1),
(2, 2, 1),
(2, 3, 2);

-- 11. Insert Localized Audio Contents
INSERT INTO poi_contents
  (poi_id, lang, title, short_text, tts_script, audio_url, voice_profile, approval_status)
VALUES
(1, 'vi', 'Sủi Cảo Ngọc Ý - Thuyết minh', 'Thuyết minh Ngọc Ý', 'Chào mừng quý khách đến với Sủi Cảo Ngọc Ý. Hãy thưởng thức hương vị sủi cảo truyền thống đặc trưng.', NULL, 'BROWSER_TTS', 'approved'),
(2, 'vi', 'Sủi Cảo Thiên Thiên - Thuyết minh Premium', 'Thuyết minh Thiên Thiên', 'Chào mừng quý khách đến với Sủi Cảo Thiên Thiên. Đây là nội dung hướng dẫn ẩm thực cao cấp dành cho bạn.', NULL, 'BROWSER_TTS', 'approved'),
(3, 'vi', 'Sủi Cảo 162 - Nội dung chờ duyệt', 'Nội dung chờ duyệt', 'Nội dung thuyết minh của sạp 162 đang chờ ban quản trị phê duyệt chất lượng.', NULL, 'BROWSER_TTS', 'pending');

-- 12. Insert Products
INSERT INTO poi_products (poi_id, name, price) VALUES
(1, 'Sủi cảo chưng thịt thập cẩm', 65000),
(1, 'Sủi cảo chiên giòn rụm', 70000),
(2, 'Sủi cảo tôm mực thượng hạng', 85000),
(2, 'Sủi cảo khô sốt Hồng Kông', 90000);

-- 13. Insert Admin Payment Configs
INSERT INTO admin_payment_configs
  (gateway_type, account_name, account_number, qr_code_url, transfer_memo_pattern, is_active)
VALUES
('MOMO', 'VietTourAudio Admin', '0900000000', NULL, 'VTA [Type] [Id]', 1),
('BANK', 'VietTourAudio Admin', '000000000001', NULL, 'VTA [Type] [Id]', 1),
('VISA', 'VietTourAudio Admin', 'VISA-MOCK', NULL, 'VTA VISA [Id]', 1);

-- 14. Insert Payment Transactions
INSERT INTO payment_transactions
  (id, sender_id, sender_type, payment_method, transaction_type, amount, transfer_memo, proof_attachment_url, status, created_at, updated_at)
VALUES
('11111111-1111-1111-1111-111111111111', '2', 'VENDOR', 'BANK', 'VENDOR_PREMIUM', 599000, 'VTA VENDOR TEST 0001', NULL, 'PENDING', NOW(6), NOW(6));

SET FOREIGN_KEY_CHECKS = 1;
