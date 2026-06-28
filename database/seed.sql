-- =============================================================================
-- VietTourAudio — Production Seed Data (Ho Chi Minh City ONLY)
-- All coordinates strictly within HCMC (Lat ~10.77x, Lng ~106.70x)
-- =============================================================================

USE viettuoraudio;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE unlocked_tours;
TRUNCATE TABLE payment_requests;
TRUNCATE TABLE revenue_daily;
TRUNCATE TABLE analytics_daily_stall;
TRUNCATE TABLE commission_earnings;
TRUNCATE TABLE wallet_transactions;
TRUNCATE TABLE top_up_requests;
TRUNCATE TABLE vendor_wallets;
TRUNCATE TABLE payments;
TRUNCATE TABLE play_history;
TRUNCATE TABLE visit_events;
TRUNCATE TABLE qr_scan_events;
TRUNCATE TABLE visitor_sessions;
TRUNCATE TABLE qr_codes;
TRUNCATE TABLE media_files;
TRUNCATE TABLE poi_contents;
TRUNCATE TABLE poi_products;
TRUNCATE TABLE favorites;
TRUNCATE TABLE tour_pois;
TRUNCATE TABLE tours;
TRUNCATE TABLE pois;
TRUNCATE TABLE zones;
TRUNCATE TABLE stalls;
TRUNCATE TABLE vendor_subscriptions;
TRUNCATE TABLE vendor_portal_users;
TRUNCATE TABLE vendors;
TRUNCATE TABLE subscription_plans;
TRUNCATE TABLE system_tickets;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE users;
TRUNCATE TABLE app_settings;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- USERS — Password for all admin users: Admin123
-- Hash: $2b$10$aAWkIkwtjeGwFmzbMI6bNuwS6cuTh1J8.JVP0TY.du7PuXvf7JP.y
-- =============================================================================

INSERT INTO users (id, email, pass_hash, full_name, role, status) VALUES
(1, 'superadmin@viettouraudio.vn', '$2b$10$aAWkIkwtjeGwFmzbMI6bNuwS6cuTh1J8.JVP0TY.du7PuXvf7JP.y', 'Super Admin Demo', 'SUPER_ADMIN', 'ACTIVE'),
(2, 'admin@viettouraudio.vn', '$2b$10$aAWkIkwtjeGwFmzbMI6bNuwS6cuTh1J8.JVP0TY.du7PuXvf7JP.y', 'Admin Demo', 'ADMIN', 'ACTIVE'),
(3, 'moderator@viettouraudio.vn', '$2b$10$aAWkIkwtjeGwFmzbMI6bNuwS6cuTh1J8.JVP0TY.du7PuXvf7JP.y', 'Moderator Demo', 'MODERATOR', 'ACTIVE'),
(4, 'finance@viettouraudio.vn', '$2b$10$aAWkIkwtjeGwFmzbMI6bNuwS6cuTh1J8.JVP0TY.du7PuXvf7JP.y', 'Finance Demo', 'FINANCE', 'ACTIVE');

-- =============================================================================
-- SUBSCRIPTION PLANS
-- =============================================================================

INSERT INTO subscription_plans (id, code, name, price, max_stalls, max_pois_per_stall, max_media_files, allow_premium_content, priority_support) VALUES
(1, 'BASIC_MONTHLY', 'Basic Monthly', 299000.00, 2, 20, 100, 0, 0),
(2, 'PREMIUM_MONTHLY', 'Premium Monthly', 599000.00, 10, 80, 500, 1, 1);

-- =============================================================================
-- VENDORS — 8 vendors, all HCMC-based businesses
-- =============================================================================

INSERT INTO vendors (id, legal_name, trade_name, slug, vendor_code, contact_name, contact_email, phone, address, status, rejection_reason, approved_by_user_id, approved_at) VALUES
(1, 'Công ty TNHH Ẩm Thực Bến Thành', 'Ẩm Thực Bến Thành', 'am-thuc-ben-thanh', 'VND-0001', 'Nguyễn Văn Hùng', 'hung@amthucbenthanh.vn', '0901100001', '23 Phan Bội Châu, Quận 1, TP.HCM', 'APPROVED', NULL, 2, '2026-06-01 09:00:00'),
(2, 'Hộ Kinh Doanh Cà Phê Nguyễn Huệ', 'Cà Phê Nguyễn Huệ', 'ca-phe-nguyen-hue', 'VND-0002', 'Trần Thị Mai', 'mai@caphenguyenhue.vn', '0901100002', '68 Nguyễn Huệ, Quận 1, TP.HCM', 'APPROVED', NULL, 2, '2026-06-01 09:10:00'),
(3, 'Công ty Thủ Công Mỹ Nghệ Sài Gòn', 'Thủ Công Sài Gòn', 'thu-cong-sai-gon', 'VND-0003', 'Lê Quốc Bảo', 'bao@thucongsg.vn', '0901100003', '45 Lê Lợi, Quận 1, TP.HCM', 'APPROVED', NULL, 2, '2026-06-01 09:20:00'),
(4, 'Hộ Kinh Doanh Bánh Mì Sài Gòn', 'Bánh Mì Sài Gòn', 'banh-mi-sai-gon', 'VND-0004', 'Phạm Hoài Linh', 'linh@banhmisaigon.vn', '0901100004', '120 Nguyễn Trãi, Quận 1, TP.HCM', 'PENDING', NULL, NULL, NULL),
(5, 'Quán Nước Ép Tươi Quận 1', 'Nước Ép Tươi Q1', 'nuoc-ep-tuoi-q1', 'VND-0005', 'Võ Thanh Tâm', 'tam@nuoceptuoi.vn', '0901100005', '90 Đề Thám, Quận 1, TP.HCM', 'REJECTED', 'Thiếu giấy phép kinh doanh hợp lệ.', 3, NULL),
(6, 'Công ty Du Lịch Vĩnh Khánh Foods', 'Vĩnh Khánh Seafood', 'vinh-khanh-seafood', 'VND-0006', 'Đặng Mỹ Duyên', 'duyen@vinhkhanh.vn', '0901100006', '162 Vĩnh Khánh, Quận 4, TP.HCM', 'APPROVED', NULL, 2, '2026-06-01 10:00:00'),
(7, 'Studio Áo Dài Đường Sách', 'Áo Dài Đường Sách', 'ao-dai-duong-sach', 'VND-0007', 'Hoàng Nhật Quang', 'quang@aodaids.vn', '0901100007', '44 Nguyễn Văn Bình, Quận 1, TP.HCM', 'SUSPENDED', 'Tạm dừng do quá hạn phí dịch vụ.', 4, NULL),
(8, 'Hộ Kinh Doanh Phở Sài Gòn', 'Phở Gia Truyền Sài Gòn', 'pho-gia-truyen-sai-gon', 'VND-0008', 'Bùi Ngọc Hân', 'han@phosaigon.vn', '0901100008', '260 Pasteur, Quận 3, TP.HCM', 'APPROVED', NULL, 2, '2026-06-01 10:30:00');

-- =============================================================================
-- VENDOR PORTAL USERS — Password: Vendor123
-- Hash: $2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i
-- =============================================================================

INSERT INTO vendor_portal_users (id, vendor_id, email, pass_hash, full_name, status) VALUES
(1, 1, 'hung@amthucbenthanh.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Nguyễn Văn Hùng', 'ACTIVE'),
(2, 2, 'mai@caphenguyenhue.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Trần Thị Mai', 'ACTIVE'),
(3, 3, 'bao@thucongsg.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Lê Quốc Bảo', 'ACTIVE'),
(4, 6, 'duyen@vinhkhanh.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Đặng Mỹ Duyên', 'ACTIVE'),
(5, 8, 'han@phosaigon.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Bùi Ngọc Hân', 'ACTIVE');

-- =============================================================================
-- VENDOR SUBSCRIPTIONS
-- =============================================================================

INSERT INTO vendor_subscriptions (id, vendor_id, plan_id, status, period_start, period_end, trial_end, next_billing_date, payment_status, price_snapshot) VALUES
(1, 1, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00),
(2, 2, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00),
(3, 3, 1, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 299000.00),
(4, 4, 1, 'TRIAL', '2026-06-10', '2026-06-24', '2026-06-24', '2026-06-24', 'unpaid', 0.00),
(5, 5, 1, 'CANCELLED', '2026-05-01', '2026-05-31', NULL, '2026-05-31', 'unpaid', 299000.00),
(6, 6, 1, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 299000.00),
(7, 7, 2, 'SUSPENDED', '2026-05-01', '2026-05-31', NULL, '2026-05-31', 'unpaid', 599000.00),
(8, 8, 2, 'OVERDUE', '2026-05-15', '2026-06-14', NULL, '2026-06-14', 'unpaid', 599000.00);

-- =============================================================================
-- TOURS — 3 themed walking tours across HCMC
-- =============================================================================

INSERT INTO tours (id, vendor_id, name, slug, description, latitude, longitude, status, sort_order, is_premium) VALUES
(1, 1, 'Phố đi bộ Nguyễn Huệ', 'nguyen-hue', 'Trải nghiệm ẩm thực và văn hóa dọc phố đi bộ Nguyễn Huệ, trung tâm Quận 1.', 10.7734200, 106.7031800, 'PUBLISHED', 1, 0),
(2, 6, 'Khu ẩm thực Vĩnh Khánh', 'vinh-khanh', 'Thiên đường hải sản và ốc nổi tiếng nhất Sài Gòn tại đường Vĩnh Khánh, Quận 4.', 10.7580000, 106.6990000, 'PUBLISHED', 2, 0),
(3, 8, 'Hành lang Pasteur – Quận 3', 'pasteur-q3', 'Khám phá ẩm thực truyền thống dọc đường Pasteur, từ phở đến bún bò.', 10.7830000, 106.6950000, 'PUBLISHED', 3, 1);

-- =============================================================================
-- STALLS — 8 physical stall locations, precise HCMC coordinates
-- Vendor 1: Bến Thành area      (10.7722, 106.6980)
-- Vendor 2: Nguyễn Huệ           (10.7735, 106.7032)
-- Vendor 3: Lê Lợi pedestrian    (10.7730, 106.6990)
-- Vendor 4: Nguyễn Trãi           (10.7700, 106.6920)
-- Vendor 5: Đề Thám backpacker   (10.7690, 106.6936)
-- Vendor 6: Vĩnh Khánh, Q4       (10.7580, 106.6990)
-- Vendor 7: Đường sách NVB       (10.7790, 106.7000)
-- Vendor 8: Pasteur, Q3           (10.7830, 106.6950)
-- =============================================================================

INSERT INTO stalls (id, vendor_id, name, slug, description, address, latitude, longitude, activation_radius, status, opening_hours, is_featured, is_premium, priority_score, zone_code) VALUES
(1, 1, 'Sạp Ẩm Thực Bến Thành', 'sap-am-thuc-ben-thanh', 'Quầy ẩm thực truyền thống ngay trước chợ Bến Thành.', '23 Phan Bội Châu, Quận 1, TP.HCM', 10.7722000, 106.6980000, 35, 'APPROVED', '{"mon_fri":"06:00-22:00","sat_sun":"06:00-23:00"}', 1, 0, 0, 'HCM-01'),
(2, 2, 'Quầy Cà Phê Nguyễn Huệ', 'quay-ca-phe-nguyen-hue', 'Cà phê rang xay và trà truyền thống trên phố đi bộ.', '68 Nguyễn Huệ, Quận 1, TP.HCM', 10.7735000, 106.7032000, 30, 'APPROVED', '{"daily":"06:30-23:00"}', 1, 0, 0, 'HCM-02'),
(3, 3, 'Sạp Thủ Công Lê Lợi', 'sap-thu-cong-le-loi', 'Sản phẩm thủ công mỹ nghệ Sài Gòn trên phố Lê Lợi.', '45 Lê Lợi, Quận 1, TP.HCM', 10.7730000, 106.6990000, 40, 'APPROVED', '{"daily":"08:00-21:00"}', 0, 0, 0, 'HCM-03'),
(4, 4, 'Xe Bánh Mì Nguyễn Trãi', 'xe-banh-mi-nguyen-trai', 'Xe bánh mì nổi tiếng trên đường Nguyễn Trãi.', '120 Nguyễn Trãi, Quận 1, TP.HCM', 10.7700000, 106.6920000, 25, 'PENDING', '{"daily":"05:00-14:00"}', 0, 0, 0, NULL),
(5, 5, 'Nước Ép Tươi Đề Thám', 'nuoc-ep-tuoi-de-tham', 'Nước ép trái cây tươi khu phố Tây.', '90 Đề Thám, Quận 1, TP.HCM', 10.7690000, 106.6936000, 20, 'REJECTED', '{"daily":"07:00-22:00"}', 0, 0, 0, NULL),
(6, 6, 'Quầy Hải Sản Vĩnh Khánh', 'quay-hai-san-vinh-khanh', 'Hải sản tươi nướng trên vỉa hè Vĩnh Khánh.', '162 Vĩnh Khánh, Quận 4, TP.HCM', 10.7580000, 106.6990000, 35, 'APPROVED', '{"daily":"15:00-23:00"}', 1, 0, 0, 'HCM-06'),
(7, 7, 'Studio Áo Dài Đường Sách', 'studio-ao-dai-duong-sach', 'Không gian chụp ảnh áo dài giữa phố sách.', '44 Nguyễn Văn Bình, Quận 1, TP.HCM', 10.7790000, 106.7000000, 30, 'SUSPENDED', '{"daily":"08:00-20:00"}', 0, 0, 0, NULL),
(8, 8, 'Tiệm Phở Pasteur', 'tiem-pho-pasteur', 'Phở gia truyền ba đời trên đường Pasteur.', '260 Pasteur, Quận 3, TP.HCM', 10.7830000, 106.6950000, 35, 'APPROVED', '{"daily":"06:00-22:00"}', 1, 1, 10, 'HCM-08');

-- =============================================================================
-- ZONES — Sub-areas within stalls (all coordinates HCMC)
-- =============================================================================

INSERT INTO zones (id, stall_id, tour_id, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order) VALUES
-- Stall 1: Sạp Ẩm Thực Bến Thành
(1, 1, 1, 2, 'Quầy bánh mì chả lụa', 'quay-banh-mi-cha-lua', 'Bánh mì chả lụa truyền thống Sài Gòn.', 10.7722100, 106.6980200, 20, 0, 'ACTIVE', 1),
(2, 1, 1, 2, 'Khu chè và nước giải khát', 'khu-che-nuoc-giai-khat', 'Chè Sài Gòn và nước mía.', 10.7721800, 106.6980500, 20, 1, 'ACTIVE', 2),
-- Stall 2: Quầy Cà Phê Nguyễn Huệ
(3, 2, 1, 2, 'Bàn pha cà phê phin', 'ban-pha-ca-phe-phin', 'Quy trình pha cà phê phin truyền thống.', 10.7735100, 106.7032200, 22, 1, 'ACTIVE', 1),
(4, 2, 1, 2, 'Góc trà đào cam sả', 'goc-tra-dao-cam-sa', 'Thức uống trà đào pha chế đặc biệt.', 10.7735400, 106.7032500, 22, 0, 'ACTIVE', 2),
-- Stall 3: Sạp Thủ Công Lê Lợi
(5, 3, 1, 2, 'Kệ gốm sứ thủ công', 'ke-gom-su-thu-cong', 'Sản phẩm gốm sứ thủ công Bát Tràng tại Sài Gòn.', 10.7730100, 106.6990200, 25, 0, 'ACTIVE', 1),
(6, 3, 1, 2, 'Quầy tranh sơn mài', 'quay-tranh-son-mai', 'Tranh sơn mài truyền thống Nam Bộ.', 10.7730400, 106.6990500, 20, 1, 'ACTIVE', 2),
-- Stall 4: Xe Bánh Mì (PENDING)
(7, 4, 1, 2, 'Quầy nhân thịt', 'quay-nhan-thit', 'Khu chuẩn bị nhân thịt nướng.', 10.7700100, 106.6920200, 20, 0, 'ACTIVE', 1),
(8, 4, 1, 2, 'Khu gia vị đặc biệt', 'khu-gia-vi-dac-biet', 'Nước sốt gia truyền và pate.', 10.7700400, 106.6920500, 20, 1, 'ACTIVE', 2),
-- Stall 5: Nước Ép (REJECTED)
(9, 5, 1, 2, 'Quầy máy ép trái cây', 'quay-may-ep-trai-cay', 'Trái cây tươi ép tại chỗ.', 10.7690100, 106.6936200, 20, 0, 'INACTIVE', 1),
-- Stall 6: Hải Sản Vĩnh Khánh
(10, 6, 2, 2, 'Bàn nướng hải sản', 'ban-nuong-hai-san', 'Hải sản tươi nướng trên than hồng.', 10.7580100, 106.6990200, 25, 0, 'ACTIVE', 1),
(11, 6, 2, 2, 'Quầy ốc Sài Gòn', 'quay-oc-sai-gon', 'Ốc các loại đặc trưng Sài Gòn.', 10.7579800, 106.6990500, 25, 1, 'ACTIVE', 2),
-- Stall 7: Studio Áo Dài (SUSPENDED)
(12, 7, 1, 2, 'Góc áo dài truyền thống', 'goc-ao-dai-truyen-thong', 'Bối cảnh chụp áo dài giữa phố sách.', 10.7790100, 106.7000200, 20, 0, 'INACTIVE', 1),
-- Stall 8: Phở Pasteur (Premium stall)
(13, 8, 3, 2, 'Nồi nước phở gia truyền', 'noi-nuoc-pho-gia-truyen', 'Nước dùng phở hầm xương 12 tiếng.', 10.7830100, 106.6950200, 25, 1, 'ACTIVE', 1),
(14, 8, 3, 2, 'Khu bánh phở tươi', 'khu-banh-pho-tuoi', 'Sợi phở tươi làm thủ công mỗi sáng.', 10.7830400, 106.6950500, 25, 1, 'ACTIVE', 2),
(15, 8, 3, 2, 'Bàn gia đình truyền thống', 'ban-gia-dinh-truyen-thong', 'Không gian phục vụ kiểu gia đình.', 10.7829800, 106.6949800, 20, 0, 'ACTIVE', 3);

-- =============================================================================
-- POIs — Points of Interest (mirrors zone structure, HCMC coordinates)
-- =============================================================================

INSERT INTO pois (id, stall_id, zone_code, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order) VALUES
(1,  1, 'HCM-01', 2, 'Quầy bánh mì chả lụa', 'quay-banh-mi-cha-lua', 'Bánh mì chả lụa truyền thống Sài Gòn.', 10.7722100, 106.6980200, 20, 0, 'ACTIVE', 1),
(2,  1, 'HCM-01', 2, 'Khu chè và nước giải khát', 'khu-che-nuoc-giai-khat', 'Chè Sài Gòn và nước mía.', 10.7721800, 106.6980500, 20, 1, 'ACTIVE', 2),
(3,  2, 'HCM-02', 2, 'Bàn pha cà phê phin', 'ban-pha-ca-phe-phin', 'Quy trình pha cà phê phin truyền thống.', 10.7735100, 106.7032200, 22, 1, 'ACTIVE', 1),
(4,  2, 'HCM-02', 2, 'Góc trà đào cam sả', 'goc-tra-dao-cam-sa', 'Thức uống trà đào pha chế đặc biệt.', 10.7735400, 106.7032500, 22, 0, 'ACTIVE', 2),
(5,  3, 'HCM-03', 2, 'Kệ gốm sứ thủ công', 'ke-gom-su-thu-cong', 'Sản phẩm gốm sứ thủ công Bát Tràng tại Sài Gòn.', 10.7730100, 106.6990200, 25, 0, 'ACTIVE', 1),
(6,  3, 'HCM-03', 2, 'Quầy tranh sơn mài', 'quay-tranh-son-mai', 'Tranh sơn mài truyền thống Nam Bộ.', 10.7730400, 106.6990500, 20, 1, 'ACTIVE', 2),
(7,  4, NULL,     2, 'Quầy nhân thịt', 'quay-nhan-thit', 'Khu chuẩn bị nhân thịt nướng.', 10.7700100, 106.6920200, 20, 0, 'ACTIVE', 1),
(8,  4, NULL,     2, 'Khu gia vị đặc biệt', 'khu-gia-vi-dac-biet', 'Nước sốt gia truyền và pate.', 10.7700400, 106.6920500, 20, 1, 'ACTIVE', 2),
(9,  5, NULL,     2, 'Quầy máy ép trái cây', 'quay-may-ep-trai-cay', 'Trái cây tươi ép tại chỗ.', 10.7690100, 106.6936200, 20, 0, 'INACTIVE', 1),
(10, 6, 'HCM-06', 2, 'Bàn nướng hải sản', 'ban-nuong-hai-san', 'Hải sản tươi nướng trên than hồng.', 10.7580100, 106.6990200, 25, 0, 'ACTIVE', 1),
(11, 6, 'HCM-06', 2, 'Quầy ốc Sài Gòn', 'quay-oc-sai-gon', 'Ốc các loại đặc trưng Sài Gòn.', 10.7579800, 106.6990500, 25, 1, 'ACTIVE', 2),
(12, 7, NULL,     2, 'Góc áo dài truyền thống', 'goc-ao-dai-truyen-thong', 'Bối cảnh chụp áo dài giữa phố sách.', 10.7790100, 106.7000200, 20, 0, 'INACTIVE', 1),
(13, 8, 'HCM-08', 2, 'Nồi nước phở gia truyền', 'noi-nuoc-pho-gia-truyen', 'Nước dùng phở hầm xương 12 tiếng.', 10.7830100, 106.6950200, 25, 1, 'ACTIVE', 1),
(14, 8, 'HCM-08', 2, 'Khu bánh phở tươi', 'khu-banh-pho-tuoi', 'Sợi phở tươi làm thủ công mỗi sáng.', 10.7830400, 106.6950500, 25, 1, 'ACTIVE', 2),
(15, 8, 'HCM-08', 2, 'Bàn gia đình truyền thống', 'ban-gia-dinh-truyen-thong', 'Không gian phục vụ kiểu gia đình.', 10.7829800, 106.6949800, 20, 0, 'ACTIVE', 3);

-- =============================================================================
-- TOUR ↔ POI JUNCTION
-- Tour 1 (Nguyễn Huệ): POIs 1-9 (Stalls 1,2,3,4,5)
-- Tour 2 (Vĩnh Khánh): POIs 10-11 (Stall 6)
-- Tour 3 (Pasteur Q3):  POIs 13-15 (Stall 8)
-- =============================================================================

INSERT INTO tour_pois (tour_id, poi_id, sort_order) VALUES
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
(1, 4, 4),
(1, 5, 5),
(1, 6, 6),
(1, 7, 7),
(1, 8, 8),
(1, 9, 9),
(2, 10, 1),
(2, 11, 2),
(1, 12, 10),
(3, 13, 1),
(3, 14, 2),
(3, 15, 3);

-- =============================================================================
-- POI CONTENTS — Bilingual (vi + en) audio content for each POI
-- =============================================================================

INSERT INTO poi_contents (id, poi_id, lang, title, short_text, tts_script, audio_url, voice_profile, approval_status) VALUES
-- POI 1: Quầy bánh mì chả lụa
(1, 1, 'vi', 'Quầy bánh mì chả lụa', 'Bánh mì Sài Gòn chính gốc.', 'Bạn đang đứng trước quầy bánh mì chả lụa. Lớp vỏ giòn rụm, nhân chả lụa mịn thơm, thêm đồ chua và rau thơm tạo nên hương vị đặc trưng Sài Gòn.', '/uploads/audio/poi-1-vi.mp3', 'vi-standard', 'approved'),
(2, 1, 'en', 'Banh Mi Cha Lua Stand', 'Authentic Saigon banh mi.', 'You are standing at the banh mi cha lua stand. Crispy crust, smooth pork roll, pickled vegetables and fresh herbs create the authentic Saigon flavor.', '/uploads/audio/poi-1-en.mp3', 'en-standard', 'approved'),

-- POI 2: Khu chè
(3, 2, 'vi', 'Khu chè và nước giải khát', 'Chè Sài Gòn mát lạnh.', 'Khu chè Sài Gòn với đủ loại chè thập cẩm, chè bưởi, chè đậu xanh. Ly nước mía đá bào giải khát giữa trưa nắng.', '/uploads/audio/poi-2-vi.mp3', 'vi-standard', 'approved'),
(4, 2, 'en', 'Dessert & Drinks Corner', 'Cool Saigon sweet soups.', 'The dessert corner offers mixed sweet soup, pomelo sweet soup, and mung bean dessert. Fresh sugarcane juice cools you down under the midday sun.', '/uploads/audio/poi-2-en.mp3', 'en-standard', 'approved'),

-- POI 3: Cà phê phin
(5, 3, 'vi', 'Bàn pha cà phê phin', 'Cà phê phin Sài Gòn.', 'Ly cà phê phin nhỏ giọt chậm rãi trên phố đi bộ Nguyễn Huệ. Vị đắng nhẹ hòa cùng sữa đặc tạo nên cà phê sữa đá đúng kiểu Sài Gòn.', '/uploads/audio/poi-3-vi.mp3', 'vi-premium', 'approved'),
(6, 3, 'en', 'Vietnamese Drip Coffee', 'Slow drip Saigon coffee.', 'Vietnamese drip coffee slowly filters on Nguyen Hue walking street. The mild bitterness blends with condensed milk for the classic iced coffee.', '/uploads/audio/poi-3-en.mp3', 'en-premium', 'approved'),

-- POI 4: Trà đào cam sả
(7, 4, 'vi', 'Góc trà đào cam sả', 'Trà đào thanh mát.', 'Trà đào cam sả pha chế từ đào tươi, vỏ cam và cọng sả. Vị chua ngọt tự nhiên, mùi thơm nhẹ của sả.', '/uploads/audio/poi-4-vi.mp3', 'vi-standard', 'approved'),

-- POI 5: Gốm sứ
(8, 5, 'vi', 'Kệ gốm sứ thủ công', 'Gốm sứ Bát Tràng.', 'Những sản phẩm gốm sứ thủ công từ làng nghề Bát Tràng, được mang vào Sài Gòn phục vụ khách du lịch.', '/uploads/audio/poi-5-vi.mp3', 'vi-standard', 'approved'),
(9, 5, 'en', 'Handmade Ceramics Shelf', 'Bat Trang pottery.', 'These handmade ceramic products come from the famous Bat Trang pottery village, brought to Saigon for tourists.', '/uploads/audio/poi-5-en.mp3', 'en-standard', 'approved'),

-- POI 6: Tranh sơn mài
(10, 6, 'vi', 'Quầy tranh sơn mài', 'Sơn mài Nam Bộ.', 'Tranh sơn mài được tạo từ nhiều lớp sơn thiên nhiên, mài bóng thủ công, phản ánh nghệ thuật truyền thống miền Nam.', '/uploads/audio/poi-6-vi.mp3', 'vi-premium', 'approved'),
(11, 6, 'en', 'Lacquer Art Gallery', 'Southern lacquer art.', 'Lacquer paintings are crafted from multiple layers of natural lacquer, hand-polished, reflecting traditional Southern Vietnamese art.', '/uploads/audio/poi-6-en.mp3', 'en-premium', 'approved'),

-- POI 7: Quầy nhân thịt (PENDING stall)
(12, 7, 'vi', 'Quầy nhân thịt', 'Thịt nướng bánh mì.', 'Khu chuẩn bị nhân thịt nướng cho bánh mì. Thịt được ướp gia vị truyền thống và nướng trên than.', '/uploads/audio/poi-7-vi.mp3', 'vi-standard', 'approved'),

-- POI 8: Khu gia vị
(13, 8, 'vi', 'Khu gia vị đặc biệt', 'Pate và nước sốt.', 'Nước sốt gia truyền và pate tự làm, hai thành phần không thể thiếu trong chiếc bánh mì Sài Gòn.', '/uploads/audio/poi-8-vi.mp3', 'vi-premium', 'approved'),
(14, 8, 'en', 'Special Sauce Corner', 'Pate and sauces.', 'Homemade traditional sauce and pate, two essential ingredients in every Saigon banh mi.', '/uploads/audio/poi-8-en.mp3', 'en-premium', 'approved'),

-- POI 9: Nước ép (REJECTED stall)
(15, 9, 'vi', 'Quầy máy ép trái cây', 'Nước ép tươi.', 'Trái cây nhiệt đới tươi được ép ngay tại chỗ: mãng cầu, dứa, dưa hấu.', '/uploads/audio/poi-9-vi.mp3', 'vi-standard', 'approved'),

-- POI 10: Bàn nướng hải sản
(16, 10, 'vi', 'Bàn nướng hải sản', 'Hải sản tươi nướng.', 'Tôm, mực, cua được nướng trực tiếp trên than hồng. Vỉa hè Vĩnh Khánh sống động nhất vào buổi tối.', '/uploads/audio/poi-10-vi.mp3', 'vi-standard', 'approved'),
(17, 10, 'en', 'Grilled Seafood Table', 'Fresh grilled seafood.', 'Shrimp, squid, and crab are grilled directly over hot charcoal. Vinh Khanh sidewalk is liveliest at night.', '/uploads/audio/poi-10-en.mp3', 'en-standard', 'approved'),

-- POI 11: Quầy ốc
(18, 11, 'vi', 'Quầy ốc Sài Gòn', 'Ốc đặc trưng Sài Gòn.', 'Ốc hương rang muối ớt, ốc len xào dừa, ốc giác nướng mỡ hành — những món ốc đặc trưng Sài Gòn.', '/uploads/audio/poi-11-vi.mp3', 'vi-premium', 'approved'),
(19, 11, 'en', 'Saigon Snail Stand', 'Saigon snail specialties.', 'Salt-chili snails, coconut snails, grilled conch with scallion oil — iconic Saigon snail dishes.', '/uploads/audio/poi-11-en.mp3', 'en-premium', 'approved'),

-- POI 12: Áo dài (SUSPENDED stall)
(20, 12, 'vi', 'Góc áo dài truyền thống', 'Chụp ảnh áo dài.', 'Góc áo dài truyền thống giữa phố sách, nơi du khách có thể mặc áo dài và chụp ảnh lưu niệm.', '/uploads/audio/poi-12-vi.mp3', 'vi-standard', 'approved'),

-- POI 13: Nồi nước phở
(21, 13, 'vi', 'Nồi nước phở gia truyền', 'Nước dùng hầm 12 tiếng.', 'Nồi nước phở hầm từ xương ống bò, gừng nướng, hoa hồi và quế — hương thơm đặc trưng phở Sài Gòn.', '/uploads/audio/poi-13-vi.mp3', 'vi-premium', 'approved'),
(22, 13, 'en', 'Traditional Pho Broth', '12-hour bone broth.', 'The pho broth simmers from beef bones, grilled ginger, star anise and cinnamon — the signature aroma of Saigon pho.', '/uploads/audio/poi-13-en.mp3', 'en-premium', 'approved'),

-- POI 14: Bánh phở tươi
(23, 14, 'vi', 'Khu bánh phở tươi', 'Sợi phở tươi mỗi sáng.', 'Sợi phở tươi được làm thủ công mỗi sáng, mỏng mềm và dai, khác hoàn toàn với phở khô.', '/uploads/audio/poi-14-vi.mp3', 'vi-premium', 'approved'),
(24, 14, 'en', 'Fresh Pho Noodles', 'Handmade every morning.', 'Fresh pho noodles are handmade every morning, thin, soft and chewy, completely different from dried noodles.', '/uploads/audio/poi-14-en.mp3', 'en-premium', 'approved'),

-- POI 15: Bàn gia đình
(25, 15, 'vi', 'Bàn gia đình truyền thống', 'Không gian dùng phở.', 'Bàn gia đình là nơi du khách ngồi lại, nghe câu chuyện ba đời nấu phở và cảm nhận sự hiếu khách Sài Gòn.', '/uploads/audio/poi-15-vi.mp3', 'vi-standard', 'approved');

-- =============================================================================
-- POI PRODUCTS — Menu items with VND pricing
-- =============================================================================

INSERT INTO poi_products (id, poi_id, name, price) VALUES
-- Stall 1: Bến Thành
(1, 1, 'Bánh mì chả lụa', 25000.00),
(2, 1, 'Bánh mì thịt nướng', 30000.00),
(3, 2, 'Chè thập cẩm', 20000.00),
(4, 2, 'Nước mía đá bào', 15000.00),
-- Stall 2: Cà Phê Nguyễn Huệ
(5, 3, 'Cà phê sữa đá', 35000.00),
(6, 3, 'Cà phê đen đá', 30000.00),
(7, 4, 'Trà đào cam sả', 40000.00),
(8, 4, 'Trà vải', 38000.00),
-- Stall 3: Thủ Công Lê Lợi
(9, 5, 'Chén gốm Bát Tràng', 120000.00),
(10, 5, 'Bình hoa gốm men ngọc', 250000.00),
(11, 6, 'Tranh sơn mài nhỏ (20x30)', 350000.00),
(12, 6, 'Tranh sơn mài lớn (50x70)', 1200000.00),
-- Stall 6: Hải Sản Vĩnh Khánh
(13, 10, 'Tôm nướng muối ớt (1kg)', 250000.00),
(14, 10, 'Mực nướng sa tế', 180000.00),
(15, 10, 'Cua rang me', 350000.00),
(16, 11, 'Ốc hương rang muối ớt', 120000.00),
(17, 11, 'Ốc len xào dừa', 80000.00),
(18, 11, 'Ốc giác nướng mỡ hành', 100000.00),
-- Stall 8: Phở Pasteur
(19, 13, 'Phở bò tái nạm', 65000.00),
(20, 13, 'Phở bò viên', 60000.00),
(21, 14, 'Phở gà', 55000.00),
(22, 15, 'Nước chanh đá', 15000.00),
(23, 15, 'Trà đá miễn phí', 0.00);

-- =============================================================================
-- MEDIA FILES
-- =============================================================================

INSERT INTO media_files (id, vendor_id, stall_id, poi_id, uploaded_by_user_id, file_type, storage_provider, file_name, file_path, public_url, mime_type, file_size, moderation_status) VALUES
(1, 1, 1, NULL, 2, 'IMAGE', 'LOCAL', 'ben-thanh-stall.jpg', '/uploads/vendors/1/stalls/1/ben-thanh-stall.jpg', '/media/ben-thanh-stall.jpg', 'image/jpeg', 245000, 'APPROVED'),
(2, 2, 2, NULL, 2, 'IMAGE', 'LOCAL', 'nguyen-hue-coffee.jpg', '/uploads/vendors/2/stalls/2/nguyen-hue-coffee.jpg', '/media/nguyen-hue-coffee.jpg', 'image/jpeg', 310000, 'APPROVED'),
(3, 8, 8, 13, 2, 'AUDIO', 'LOCAL', 'pho-vi.mp3', '/uploads/audio/poi-13-vi.mp3', '/media/audio/poi-13-vi.mp3', 'audio/mpeg', 1200000, 'APPROVED'),
(4, 6, 6, 10, 2, 'IMAGE', 'LOCAL', 'vinh-khanh-seafood.jpg', '/uploads/vendors/6/stalls/6/vinh-khanh-seafood.jpg', '/media/vinh-khanh-seafood.jpg', 'image/jpeg', 280000, 'APPROVED');

-- =============================================================================
-- QR CODES
-- =============================================================================

INSERT INTO qr_codes (id, vendor_id, tour_id, stall_id, poi_id, code, qr_type, target_url, image_url, is_active) VALUES
(1, 1, NULL, 1, NULL, 'VTA-ST-0001', 'STALL', 'https://app.viettouraudio.vn/map?stall=1', '/qr/stall-1.png', 1),
(2, 2, NULL, 2, NULL, 'VTA-ST-0002', 'STALL', 'https://app.viettouraudio.vn/map?stall=2', '/qr/stall-2.png', 1),
(3, 8, NULL, 8, 13, 'VTA-POI-0013', 'POI', 'https://app.viettouraudio.vn/map?poi=13', '/qr/poi-13.png', 1),
(4, 8, NULL, 8, NULL, 'VTA-PAY-0008', 'PAYMENT', 'https://app.viettouraudio.vn/pay?vendor=8', '/qr/pay-8.png', 1),
(5, 1, 1, NULL, NULL, 'VTA-TOUR-0001', 'TOUR', 'https://app.viettouraudio.vn/tour/nguyen-hue', '/qr/tour-1.png', 1),
(6, 6, 2, NULL, NULL, 'VTA-TOUR-0002', 'TOUR', 'https://app.viettouraudio.vn/tour/vinh-khanh', '/qr/tour-2.png', 1),
(7, 6, NULL, 6, NULL, 'VTA-ST-0006', 'STALL', 'https://app.viettouraudio.vn/map?stall=6', '/qr/stall-6.png', 1);

-- =============================================================================
-- VISITOR SESSIONS
-- =============================================================================

INSERT INTO visitor_sessions (id, token, is_premium, premium_24h_expiry, device_fingerprint, ip_address, user_agent) VALUES
(1, 'vs_hcm_demo_001', 1, '2026-06-15 09:00:00', 'fp-ios-hcm-001', '127.0.0.1', 'Demo Safari'),
(2, 'vs_hcm_demo_002', 0, NULL, 'fp-android-hcm-002', '127.0.0.1', 'Demo Chrome'),
(3, 'vs_hcm_demo_003', 1, '2026-06-15 10:00:00', 'fp-web-hcm-003', '127.0.0.1', 'Demo Edge');

-- =============================================================================
-- QR SCAN EVENTS
-- =============================================================================

INSERT INTO qr_scan_events (id, qr_code_id, vendor_id, tour_id, stall_id, poi_id, visitor_session_id, country_code, scanned_at) VALUES
(1, 5, 1, 1, NULL, NULL, 1, 'VN', '2026-06-11 08:30:00'),
(2, 1, 1, NULL, 1, NULL, 1, 'VN', '2026-06-11 09:00:00'),
(3, 2, 2, NULL, 2, NULL, 2, 'VN', '2026-06-11 09:15:00'),
(4, 3, 8, NULL, 8, 13, 3, 'US', '2026-06-11 10:00:00'),
(5, 6, 6, 2, NULL, NULL, 2, 'VN', '2026-06-11 18:30:00');

-- =============================================================================
-- VISIT EVENTS
-- =============================================================================

INSERT INTO visit_events (id, vendor_id, stall_id, poi_id, visitor_session_id, source, latitude, longitude, distance_meters, visited_at) VALUES
(1, 1, 1, 1, 1, 'GPS', 10.7722100, 106.6980200, 5.30, '2026-06-11 09:03:00'),
(2, 2, 2, 3, 2, 'QR', 10.7735100, 106.7032200, 0.00, '2026-06-11 09:16:00'),
(3, 8, 8, 13, 3, 'GPS', 10.7830100, 106.6950200, 4.80, '2026-06-11 10:04:00'),
(4, 6, 6, 10, 2, 'GPS', 10.7580100, 106.6990200, 3.20, '2026-06-11 18:35:00');

-- =============================================================================
-- PLAY HISTORY
-- =============================================================================

INSERT INTO play_history (id, visitor_session_id, poi_id, poi_content_id, lang, source, started_at, completed_at, duration_seconds) VALUES
(1, 1, 1, 1, 'vi', 'AUTO_GPS', '2026-06-11 09:04:00', '2026-06-11 09:05:20', 80),
(2, 3, 13, 21, 'vi', 'AUTO_GPS', '2026-06-11 10:05:00', '2026-06-11 10:06:35', 95),
(3, 2, 10, 16, 'vi', 'MANUAL', '2026-06-11 18:36:00', '2026-06-11 18:37:30', 90);

-- =============================================================================
-- PAYMENTS
-- =============================================================================

INSERT INTO payments (id, vendor_id, visitor_session_id, vendor_subscription_id, amount, provider, payment_type, status, transaction_code, provider_payload, paid_at) VALUES
(1, 1, NULL, 1, 599000.00, 'BANK_QR', 'VENDOR_SUBSCRIPTION', 'PAID', 'PAY-SUB-0001', '{"bank":"VCB"}', '2026-06-01 08:00:00'),
(2, 2, NULL, 2, 599000.00, 'MOMO', 'VENDOR_SUBSCRIPTION', 'PAID', 'PAY-SUB-0002', '{"wallet":"momo"}', '2026-06-01 08:05:00'),
(3, 3, NULL, 3, 299000.00, 'BANK_QR', 'VENDOR_SUBSCRIPTION', 'PAID', 'PAY-SUB-0003', '{"bank":"TCB"}', '2026-06-01 08:10:00'),
(4, 8, NULL, 8, 599000.00, 'BANK_QR', 'WALLET_TOP_UP', 'PAID', 'PAY-TOP-0008', '{"bank":"ACB"}', '2026-06-10 11:00:00'),
(5, NULL, 1, NULL, 30000.00, 'MOMO', 'VISITOR_PREMIUM', 'PAID', 'PAY-VIS-0001', '{"wallet":"momo"}', '2026-06-11 09:00:00'),
(6, NULL, 3, NULL, 30000.00, 'STRIPE', 'VISITOR_PREMIUM', 'PAID', 'PAY-VIS-0002', '{"card":"test"}', '2026-06-11 10:00:00');

-- =============================================================================
-- VENDOR WALLETS
-- =============================================================================

INSERT INTO vendor_wallets (id, vendor_id, balance, total_top_up, total_spent, total_commission) VALUES
(1, 1, 450000.00, 500000.00, 80000.00, 30000.00),
(2, 2, 620000.00, 700000.00, 100000.00, 20000.00),
(3, 3, 210000.00, 250000.00, 40000.00, 0.00),
(4, 4, 0.00, 0.00, 0.00, 0.00),
(5, 5, 0.00, 0.00, 0.00, 0.00),
(6, 6, 360000.00, 400000.00, 60000.00, 20000.00),
(7, 7, 15000.00, 100000.00, 85000.00, 0.00),
(8, 8, 930000.00, 1000000.00, 100000.00, 30000.00);

-- =============================================================================
-- TOP-UP REQUESTS
-- =============================================================================

INSERT INTO top_up_requests (id, vendor_id, wallet_id, requested_by_user_id, provider, status, amount, proof_url, note, reviewed_by_user_id, reviewed_at) VALUES
(1, 1, 1, 4, 'BANK_QR', 'APPROVED', 500000.00, '/proofs/topup-1.jpg', 'Nạp ví tháng 6', 4, '2026-06-02 08:00:00'),
(2, 2, 2, 4, 'MOMO', 'APPROVED', 700000.00, '/proofs/topup-2.jpg', 'Nạp ví premium', 4, '2026-06-02 08:10:00'),
(3, 3, 3, 4, 'BANK_QR', 'APPROVED', 250000.00, '/proofs/topup-3.jpg', 'Nạp ví basic', 4, '2026-06-02 08:20:00'),
(4, 6, 6, 4, 'VNPAY', 'APPROVED', 400000.00, '/proofs/topup-6.jpg', 'Nạp ví hải sản VK', 4, '2026-06-02 08:30:00'),
(5, 7, 7, 4, 'BANK_QR', 'PENDING', 100000.00, '/proofs/topup-7.jpg', 'Chờ đối soát', NULL, NULL),
(6, 8, 8, 4, 'BANK_QR', 'APPROVED', 1000000.00, '/proofs/topup-8.jpg', 'Nạp ví phở Pasteur', 4, '2026-06-10 11:05:00');

-- =============================================================================
-- WALLET TRANSACTIONS
-- =============================================================================

INSERT INTO wallet_transactions (id, wallet_id, vendor_id, payment_id, top_up_request_id, transaction_type, transaction_category, direction, amount, balance_before, balance_after, description, created_by_user_id, metadata) VALUES
(1, 1, 1, NULL, 1, 'TOP_UP', 'WALLET_TOP_UP', 'CREDIT', 500000.00, 0.00, 500000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(2, 1, 1, NULL, NULL, 'FEE', 'WEBAPP_MONTHLY_RENT', 'DEBIT', 50000.00, 500000.00, 450000.00, 'Monthly platform fee', 4, '{"batch":"seed"}'),
(3, 1, 1, NULL, NULL, 'MANUAL', 'MANUAL_ADJUSTMENT', 'CREDIT', 30000.00, 420000.00, 450000.00, 'Manual adjustment', 4, '{"batch":"seed"}'),
(4, 2, 2, NULL, 2, 'TOP_UP', 'WALLET_TOP_UP', 'CREDIT', 700000.00, 0.00, 700000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(5, 2, 2, NULL, NULL, 'FEE', 'PREMIUM_UPGRADE', 'DEBIT', 80000.00, 700000.00, 620000.00, 'Premium media fee', 4, '{"batch":"seed"}'),
(6, 2, 2, NULL, NULL, 'MANUAL', 'MANUAL_ADJUSTMENT', 'CREDIT', 20000.00, 600000.00, 620000.00, 'Commission correction', 4, '{"batch":"seed"}'),
(7, 3, 3, NULL, 3, 'TOP_UP', 'WALLET_TOP_UP', 'CREDIT', 250000.00, 0.00, 250000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(8, 3, 3, NULL, NULL, 'FEE', 'WEBAPP_MONTHLY_RENT', 'DEBIT', 40000.00, 250000.00, 210000.00, 'Audio processing fee', 4, '{"batch":"seed"}'),
(9, 6, 6, NULL, 4, 'TOP_UP', 'WALLET_TOP_UP', 'CREDIT', 400000.00, 0.00, 400000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(10, 6, 6, NULL, NULL, 'FEE', 'WEBAPP_MONTHLY_RENT', 'DEBIT', 60000.00, 400000.00, 340000.00, 'QR campaign fee', 4, '{"batch":"seed"}'),
(11, 6, 6, NULL, NULL, 'MANUAL', 'MANUAL_ADJUSTMENT', 'CREDIT', 20000.00, 340000.00, 360000.00, 'Manual correction', 4, '{"batch":"seed"}'),
(12, 7, 7, NULL, 5, 'TOP_UP', 'WALLET_TOP_UP', 'CREDIT', 100000.00, 0.00, 100000.00, 'Pending top up provisional', 4, '{"batch":"seed"}'),
(13, 7, 7, NULL, NULL, 'FEE', 'WEBAPP_MONTHLY_RENT', 'DEBIT', 85000.00, 100000.00, 15000.00, 'Overdue fee', 4, '{"batch":"seed"}'),
(14, 8, 8, 4, 6, 'TOP_UP', 'WALLET_TOP_UP', 'CREDIT', 1000000.00, 0.00, 1000000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(15, 8, 8, NULL, NULL, 'FEE', 'PREMIUM_UPGRADE', 'DEBIT', 70000.00, 1000000.00, 930000.00, 'Premium POI fee', 4, '{"batch":"seed"}'),
(16, 8, 8, NULL, NULL, 'MANUAL', 'MANUAL_ADJUSTMENT', 'CREDIT', 30000.00, 900000.00, 930000.00, 'Commission correction', 4, '{"batch":"seed"}'),
(17, 1, 1, NULL, NULL, 'FEE', 'WEBAPP_MONTHLY_RENT', 'DEBIT', 30000.00, 450000.00, 420000.00, 'Campaign reserve', 4, '{"batch":"seed"}'),
(18, 2, 2, NULL, NULL, 'FEE', 'WEBAPP_MONTHLY_RENT', 'DEBIT', 20000.00, 620000.00, 600000.00, 'Storage reserve', 4, '{"batch":"seed"}'),
(19, 4, 4, NULL, NULL, 'MANUAL', 'MANUAL_ADJUSTMENT', 'CREDIT', 0.00, 0.00, 0.00, 'Trial wallet initialized', 4, '{"batch":"seed"}'),
(20, 5, 5, NULL, NULL, 'MANUAL', 'MANUAL_ADJUSTMENT', 'CREDIT', 0.00, 0.00, 0.00, 'Rejected vendor wallet initialized', 4, '{"batch":"seed"}');

-- =============================================================================
-- COMMISSION EARNINGS
-- =============================================================================

INSERT INTO commission_earnings (id, vendor_id, payment_id, qr_code_id, visitor_session_id, rate_percent, gross_amount, commission_amount, status, earned_at) VALUES
(1, 1, 5, 1, 1, 10.00, 30000.00, 3000.00, 'APPROVED', '2026-06-11 09:00:00'),
(2, 8, 6, 3, 3, 10.00, 30000.00, 3000.00, 'PENDING', '2026-06-11 10:00:00');

-- =============================================================================
-- ANALYTICS — Daily aggregated stall metrics (3 days)
-- =============================================================================

INSERT INTO analytics_daily_stall (date, stall_id, vendor_id, qr_scans, visits, audio_plays, unique_visitors, premium_conversions, total_revenue) VALUES
('2026-06-11', 1, 1, 14, 55, 31, 44, 2, 60000.00),
('2026-06-11', 2, 2, 11, 42, 21, 35, 1, 30000.00),
('2026-06-11', 3, 3, 7, 25, 14, 20, 0, 0.00),
('2026-06-11', 4, 4, 3, 10, 0, 8, 0, 0.00),
('2026-06-11', 5, 5, 1, 5, 0, 5, 0, 0.00),
('2026-06-11', 6, 6, 19, 70, 36, 58, 3, 90000.00),
('2026-06-11', 7, 7, 2, 8, 0, 7, 0, 0.00),
('2026-06-11', 8, 8, 25, 88, 52, 75, 4, 120000.00),
('2026-06-12', 1, 1, 18, 62, 35, 50, 2, 60000.00),
('2026-06-12', 2, 2, 15, 49, 25, 40, 2, 60000.00),
('2026-06-12', 3, 3, 9, 30, 17, 24, 1, 30000.00),
('2026-06-12', 4, 4, 4, 13, 0, 11, 0, 0.00),
('2026-06-12', 5, 5, 1, 4, 0, 4, 0, 0.00),
('2026-06-12', 6, 6, 22, 76, 40, 63, 3, 90000.00),
('2026-06-12', 7, 7, 2, 7, 0, 6, 0, 0.00),
('2026-06-12', 8, 8, 30, 94, 58, 82, 5, 150000.00),
('2026-06-13', 1, 1, 20, 68, 38, 55, 3, 90000.00),
('2026-06-13', 2, 2, 17, 53, 29, 44, 2, 60000.00),
('2026-06-13', 3, 3, 10, 34, 19, 28, 1, 30000.00),
('2026-06-13', 4, 4, 5, 15, 0, 13, 0, 0.00),
('2026-06-13', 5, 5, 1, 3, 0, 3, 0, 0.00),
('2026-06-13', 6, 6, 26, 82, 47, 70, 4, 120000.00),
('2026-06-13', 7, 7, 3, 9, 0, 8, 0, 0.00),
('2026-06-13', 8, 8, 34, 101, 66, 90, 6, 180000.00);

-- =============================================================================
-- REVENUE DAILY — Aggregated revenue (3 days)
-- =============================================================================

INSERT INTO revenue_daily (date, source, provider, gross_amount, net_amount, fees, transaction_count) VALUES
('2026-06-11', 'VISITOR_PREMIUM', 'MOMO', 90000.00, 87000.00, 3000.00, 3),
('2026-06-11', 'VENDOR_SUBSCRIPTION', 'BANK_QR', 1497000.00, 1497000.00, 0.00, 3),
('2026-06-12', 'VISITOR_PREMIUM', 'STRIPE', 120000.00, 114000.00, 6000.00, 4),
('2026-06-12', 'WALLET_TOP_UP', 'BANK_QR', 750000.00, 750000.00, 0.00, 2),
('2026-06-13', 'VISITOR_PREMIUM', 'MOMO', 180000.00, 174000.00, 6000.00, 6),
('2026-06-13', 'WALLET_TOP_UP', 'VNPAY', 400000.00, 394000.00, 6000.00, 1);

-- =============================================================================
-- SYSTEM TICKETS — Sample support requests
-- =============================================================================

INSERT INTO system_tickets (id, sender_email, subject, message, status) VALUES
(1, 'guest@example.com', 'Không nghe được audio tại Bến Thành', 'Tôi đã quét mã QR tại sạp Bến Thành nhưng không nghe được audio. Xin kiểm tra giúp.', 'PENDING'),
(2, 'linh@banhmisaigon.vn', 'Xin đăng ký làm đối tác Vendor', 'Tôi muốn đăng ký tài khoản Vendor cho xe bánh mì trên Nguyễn Trãi. Xin hướng dẫn các bước cần thiết.', 'PROCESSED'),
(3, 'tourist@gmail.com', 'Premium payment issue', 'I paid for premium via MoMo but my session still shows free. Token: vs_hcm_demo_002', 'IN_PROGRESS');

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, before_data, after_data, ip_address) VALUES
(1, 2, 'APPROVE_VENDOR', 'vendors', 1, '{"status":"PENDING"}', '{"status":"APPROVED"}', '127.0.0.1'),
(2, 4, 'APPROVE_TOP_UP', 'top_up_requests', 1, '{"status":"PENDING"}', '{"status":"APPROVED"}', '127.0.0.1'),
(3, 2, 'APPROVE_VENDOR', 'vendors', 6, '{"status":"PENDING"}', '{"status":"APPROVED"}', '127.0.0.1'),
(4, 2, 'APPROVE_VENDOR', 'vendors', 8, '{"status":"PENDING"}', '{"status":"APPROVED"}', '127.0.0.1');

-- =============================================================================
-- APP SETTINGS
-- =============================================================================

INSERT INTO app_settings (`key`, `value`) VALUES
('PREMIUM_PAYMENT_QR', 'MOMO-PAY-PREMIUM-12345'),
('DEFAULT_ACTIVATION_RADIUS', '25'),
('MIN_PREMIUM_RADIUS', '10'),
('PLATFORM_VERSION', '1.0.0');
