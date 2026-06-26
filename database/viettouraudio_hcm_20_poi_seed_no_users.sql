USE viettuoraudio;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- VietTourAudio HCMC Demo Seed
-- Không TRUNCATE / INSERT bảng users.
-- Yêu cầu: bảng users phải có ít nhất 1 user đang tồn tại,
-- vì một số bảng có FK tới users(id): approved_by_user_id,
-- uploaded_by_user_id, requested_by_user_id, reviewed_by_user_id,
-- created_by_user_id, actor_user_id.
-- =========================================================

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
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE app_settings;

SET FOREIGN_KEY_CHECKS = 1;

-- Lấy user có sẵn để tránh lỗi FK. File này KHÔNG tạo users.
SET @seed_user_id := (SELECT id FROM users ORDER BY id LIMIT 1);
SET @admin_id := COALESCE(
  (SELECT id FROM users WHERE role IN ('SUPER_ADMIN','ADMIN') AND status = 'ACTIVE' ORDER BY id LIMIT 1),
  @seed_user_id
);
SET @moderator_id := COALESCE(
  (SELECT id FROM users WHERE role = 'MODERATOR' AND status = 'ACTIVE' ORDER BY id LIMIT 1),
  @admin_id
);
SET @finance_id := COALESCE(
  (SELECT id FROM users WHERE role = 'FINANCE' AND status = 'ACTIVE' ORDER BY id LIMIT 1),
  @admin_id
);

INSERT INTO subscription_plans (id, code, name, price, max_stalls, max_pois_per_stall, max_media_files, allow_premium_content, priority_support) VALUES
(1, 'BASIC_MONTHLY', 'Basic Monthly', 299000.00, 2, 20, 100, 0, 0),
(2, 'PREMIUM_MONTHLY', 'Premium Monthly', 599000.00, 10, 80, 500, 1, 1),
(3, 'PRO_MONTHLY', 'Pro Monthly', 899000.00, 20, 150, 1000, 1, 1);

-- 10 vendor demo tại TP.HCM
INSERT INTO vendors (id, legal_name, trade_name, slug, vendor_code, contact_name, contact_email, phone, address, status, rejection_reason, approved_by_user_id, approved_at) VALUES
(1, 'Vinh Khanh Street Food Co., Ltd', 'Phố Ẩm Thực Vĩnh Khánh', 'pho-am-thuc-vinh-khanh', 'HCM-0001', 'Nguyễn Gia Bảo', 'bao@vinhkhanhfood.vn', '0902000001', 'Đường Vĩnh Khánh, Phường 8, Quận 4, TP.HCM', 'APPROVED', NULL, @admin_id, '2026-06-01 09:00:00'),
(2, 'Nguyen Hue Walking Street Group', 'Phố Đi Bộ Nguyễn Huệ', 'pho-di-bo-nguyen-hue', 'HCM-0002', 'Trần Minh Khôi', 'khoi@nguyenhue.vn', '0902000002', 'Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM', 'APPROVED', NULL, @admin_id, '2026-06-01 09:10:00'),
(3, 'Ben Thanh Market Foods', 'Chợ Bến Thành Food Tour', 'cho-ben-thanh-food-tour', 'HCM-0003', 'Lê Thị Hồng', 'hong@benthanh.vn', '0902000003', 'Chợ Bến Thành, Phường Bến Thành, Quận 1, TP.HCM', 'APPROVED', NULL, @admin_id, '2026-06-01 09:20:00'),
(4, 'Tan Dinh Heritage Coffee', 'Cà Phê Tân Định', 'ca-phe-tan-dinh', 'HCM-0004', 'Phạm Quốc Anh', 'anh@tandinhcoffee.vn', '0902000004', 'Hai Bà Trưng, Phường Tân Định, Quận 1, TP.HCM', 'APPROVED', NULL, @admin_id, '2026-06-01 09:30:00'),
(5, 'Bui Vien Night Street Service', 'Phố Đêm Bùi Viện', 'pho-dem-bui-vien', 'HCM-0005', 'Võ Thành Nam', 'nam@buiviennight.vn', '0902000005', 'Bùi Viện, Phạm Ngũ Lão, Quận 1, TP.HCM', 'APPROVED', NULL, @admin_id, '2026-06-01 09:40:00'),
(6, 'Saigon River Bach Dang Pier', 'Bến Bạch Đằng Sài Gòn', 'ben-bach-dang-sai-gon', 'HCM-0006', 'Đặng Mỹ Linh', 'linh@bachdangpier.vn', '0902000006', 'Bến Bạch Đằng, Quận 1, TP.HCM', 'APPROVED', NULL, @admin_id, '2026-06-01 09:50:00'),
(7, 'Cholon Heritage Kitchen', 'Ẩm Thực Chợ Lớn', 'am-thuc-cho-lon', 'HCM-0007', 'Hoàng Nhật Quang', 'quang@cholonfood.vn', '0902000007', 'Trần Hưng Đạo, Quận 5, TP.HCM', 'APPROVED', NULL, @admin_id, '2026-06-01 10:00:00'),
(8, 'Ho Thi Ky Flower Food Street', 'Hồ Thị Kỷ Food & Flower', 'ho-thi-ky-food-flower', 'HCM-0008', 'Bùi Ngọc Mai', 'mai@hothiky.vn', '0902000008', 'Hồ Thị Kỷ, Quận 10, TP.HCM', 'APPROVED', NULL, @admin_id, '2026-06-01 10:10:00'),
(9, 'Le Van Tam Park Weekend Market', 'Chợ Cuối Tuần Lê Văn Tám', 'cho-cuoi-tuan-le-van-tam', 'HCM-0009', 'Đỗ Hải Yến', 'yen@levanmarket.vn', '0902000009', 'Công viên Lê Văn Tám, Quận 1, TP.HCM', 'PENDING', NULL, NULL, NULL),
(10, 'Thu Thiem Riverside Experience', 'Bờ Sông Thủ Thiêm', 'bo-song-thu-thiem', 'HCM-0010', 'Ngô Minh Đức', 'duc@thuthiem.vn', '0902000010', 'Công viên bờ sông Thủ Thiêm, TP. Thủ Đức, TP.HCM', 'APPROVED', NULL, @admin_id, '2026-06-01 10:20:00');

-- Password demo cho vendor portal users: Vendor123
INSERT INTO vendor_portal_users (id, vendor_id, email, pass_hash, full_name, status) VALUES
(1, 1, 'bao@vinhkhanhfood.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Nguyễn Gia Bảo', 'ACTIVE'),
(2, 2, 'khoi@nguyenhue.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Trần Minh Khôi', 'ACTIVE'),
(3, 3, 'hong@benthanh.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Lê Thị Hồng', 'ACTIVE'),
(4, 4, 'anh@tandinhcoffee.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Phạm Quốc Anh', 'ACTIVE'),
(5, 5, 'nam@buiviennight.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Võ Thành Nam', 'ACTIVE'),
(6, 6, 'linh@bachdangpier.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Đặng Mỹ Linh', 'ACTIVE'),
(7, 7, 'quang@cholonfood.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Hoàng Nhật Quang', 'ACTIVE'),
(8, 8, 'mai@hothiky.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Bùi Ngọc Mai', 'ACTIVE'),
(9, 10, 'duc@thuthiem.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Ngô Minh Đức', 'ACTIVE');

INSERT INTO vendor_subscriptions (id, vendor_id, plan_id, status, period_start, period_end, trial_end, next_billing_date, payment_status, price_snapshot) VALUES
(1, 1, 3, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'unpaid', 899000.00),
(2, 2, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'unpaid', 599000.00),
(3, 3, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'unpaid', 599000.00),
(4, 4, 1, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'unpaid', 299000.00),
(5, 5, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'unpaid', 599000.00),
(6, 6, 1, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'unpaid', 299000.00),
(7, 7, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'unpaid', 599000.00),
(8, 8, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'unpaid', 599000.00),
(9, 9, 1, 'TRIAL', '2026-06-15', '2026-06-29', '2026-06-29', '2026-06-29', 'unpaid', 0.00),
(10, 10, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'unpaid', 599000.00);

-- 5 tour/khu vực chính tại TP.HCM
INSERT INTO tours (id, vendor_id, name, slug, description, status, sort_order, is_premium) VALUES
(1, 1, 'Khu phố ẩm thực Vĩnh Khánh', 'khu-pho-am-thuc-vinh-khanh', 'Tuyến trải nghiệm món nướng, hải sản, ốc và nhịp sống đêm Quận 4.', 'PUBLISHED', 1, 0),
(2, 2, 'Trung tâm Sài Gòn Quận 1', 'trung-tam-sai-gon-quan-1', 'Tuyến đi bộ qua Nguyễn Huệ, Bến Thành, Bùi Viện và Bến Bạch Đằng.', 'PUBLISHED', 2, 0),
(3, 7, 'Hương vị Chợ Lớn Quận 5', 'huong-vi-cho-lon-quan-5', 'Tuyến khám phá ẩm thực người Hoa, chợ truyền thống và văn hóa Quận 5.', 'PUBLISHED', 3, 1),
(4, 8, 'Hồ Thị Kỷ và Chợ Đêm Quận 10', 'ho-thi-ky-va-cho-dem-quan-10', 'Tuyến hoa, chè, xiên que và các món ăn đường phố trong hẻm.', 'PUBLISHED', 4, 0),
(5, 10, 'Bờ sông Thủ Thiêm', 'bo-song-thu-thiem', 'Tuyến ngắm skyline, không gian ven sông và điểm check-in mới của TP.HCM.', 'PUBLISHED', 5, 1);

-- 10 stall/khu vực cha. Tất cả ở TP.HCM.
INSERT INTO stalls (id, vendor_id, name, slug, description, address, latitude, longitude, activation_radius, status, opening_hours, is_featured, is_premium, priority_score, zone_code) VALUES
(1, 1, 'Cổng Ẩm Thực Vĩnh Khánh', 'cong-am-thuc-vinh-khanh', 'Điểm bắt đầu tuyến ẩm thực đêm Vĩnh Khánh.', 'Vĩnh Khánh, Phường 8, Quận 4, TP.HCM', 10.7566600, 106.7065300, 50, 'APPROVED', '{"daily":"16:00-23:30"}', 1, 0, 90, 'HCM-Q4-VK-01'),
(2, 1, 'Khu Hải Sản Vĩnh Khánh', 'khu-hai-san-vinh-khanh', 'Cụm quán hải sản và ốc nổi bật tại Quận 4.', 'Vĩnh Khánh, Quận 4, TP.HCM', 10.7559800, 106.7070500, 45, 'APPROVED', '{"daily":"17:00-23:30"}', 1, 1, 88, 'HCM-Q4-VK-02'),
(3, 2, 'Phố Đi Bộ Nguyễn Huệ', 'pho-di-bo-nguyen-hue', 'Không gian đi bộ trung tâm thành phố.', 'Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM', 10.7742400, 106.7034700, 60, 'APPROVED', '{"daily":"08:00-23:00"}', 1, 0, 95, 'HCM-Q1-NH-01'),
(4, 3, 'Chợ Bến Thành', 'cho-ben-thanh', 'Biểu tượng chợ truyền thống và ẩm thực trung tâm.', 'Chợ Bến Thành, Quận 1, TP.HCM', 10.7724800, 106.6980100, 55, 'APPROVED', '{"daily":"07:00-19:00"}', 1, 0, 92, 'HCM-Q1-BT-01'),
(5, 4, 'Nhà Thờ Tân Định', 'nha-tho-tan-dinh', 'Khu vực tham quan, cà phê và kiến trúc màu hồng nổi bật.', 'Hai Bà Trưng, Tân Định, Quận 1, TP.HCM', 10.7882900, 106.6905700, 45, 'APPROVED', '{"daily":"07:00-21:00"}', 0, 0, 80, 'HCM-Q1-TD-01'),
(6, 5, 'Phố Đêm Bùi Viện', 'pho-dem-bui-vien', 'Tuyến phố đêm sôi động của khu Phạm Ngũ Lão.', 'Bùi Viện, Phạm Ngũ Lão, Quận 1, TP.HCM', 10.7676100, 106.6947800, 55, 'APPROVED', '{"daily":"18:00-02:00"}', 1, 1, 85, 'HCM-Q1-BV-01'),
(7, 6, 'Bến Bạch Đằng', 'ben-bach-dang', 'Không gian ven sông Sài Gòn và điểm lên thuyền.', 'Bến Bạch Đằng, Quận 1, TP.HCM', 10.7748600, 106.7062800, 60, 'APPROVED', '{"daily":"06:00-23:00"}', 1, 0, 86, 'HCM-Q1-BD-01'),
(8, 7, 'Chợ Lớn Quận 5', 'cho-lon-quan-5', 'Cụm văn hóa, hàng quán và chợ truyền thống người Hoa.', 'Trần Hưng Đạo, Quận 5, TP.HCM', 10.7547500, 106.6637100, 60, 'APPROVED', '{"daily":"07:00-22:00"}', 1, 1, 87, 'HCM-Q5-CL-01'),
(9, 8, 'Chợ Hồ Thị Kỷ', 'cho-ho-thi-ky', 'Khu chợ hoa và thiên đường ăn vặt Quận 10.', 'Hồ Thị Kỷ, Quận 10, TP.HCM', 10.7631200, 106.6707200, 50, 'APPROVED', '{"daily":"08:00-23:00"}', 1, 0, 89, 'HCM-Q10-HTK-01'),
(10, 10, 'Công Viên Bờ Sông Thủ Thiêm', 'cong-vien-bo-song-thu-thiem', 'Không gian ven sông nhìn về skyline Quận 1.', 'Bờ sông Thủ Thiêm, TP. Thủ Đức, TP.HCM', 10.7759300, 106.7142600, 65, 'APPROVED', '{"daily":"06:00-23:00"}', 1, 1, 91, 'HCM-TD-TT-01');

-- 20 zone/POI đều ở TP.HCM. zone và poi được tạo song song để app nào dùng bảng nào cũng có data.
INSERT INTO zones (id, stall_id, tour_id, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order) VALUES
(1, 1, 1, 2, 'Cổng phố Vĩnh Khánh', 'cong-pho-vinh-khanh', 'Điểm mở đầu tuyến âm thanh phố ẩm thực Vĩnh Khánh.', 10.7566600, 106.7065300, 25, 0, 'ACTIVE', 1),
(2, 1, 1, 2, 'Khu ốc nướng Vĩnh Khánh', 'khu-oc-nuong-vinh-khanh', 'Câu chuyện về văn hóa ăn ốc và món nướng Quận 4.', 10.7563500, 106.7068300, 25, 1, 'ACTIVE', 2),
(3, 2, 1, 2, 'Quầy hải sản đêm', 'quay-hai-san-dem', 'Âm thanh bếp than, hải sản và nhịp phục vụ ban đêm.', 10.7559800, 106.7070500, 25, 1, 'ACTIVE', 1),
(4, 2, 1, 2, 'Góc bánh tráng nướng', 'goc-banh-trang-nuong', 'Món ăn vặt quen thuộc của giới trẻ Sài Gòn.', 10.7556200, 106.7072800, 22, 0, 'ACTIVE', 2),
(5, 3, 2, 2, 'Tượng đài Nguyễn Huệ', 'tuong-dai-nguyen-hue', 'Không gian trung tâm của phố đi bộ Nguyễn Huệ.', 10.7742400, 106.7034700, 30, 0, 'ACTIVE', 1),
(6, 3, 2, 2, 'Đài phun nước Nguyễn Huệ', 'dai-phun-nuoc-nguyen-hue', 'Điểm dừng chân nghe câu chuyện nhịp sống đô thị.', 10.7735500, 106.7034000, 30, 0, 'ACTIVE', 2),
(7, 4, 2, 2, 'Cổng Nam Chợ Bến Thành', 'cong-nam-cho-ben-thanh', 'Biểu tượng nhận diện của khu chợ trung tâm.', 10.7724800, 106.6980100, 28, 0, 'ACTIVE', 1),
(8, 4, 2, 2, 'Khu hàng ăn Chợ Bến Thành', 'khu-hang-an-cho-ben-thanh', 'Các món ăn nhanh, chè và hàng quán trong chợ.', 10.7721200, 106.6977500, 25, 1, 'ACTIVE', 2),
(9, 5, 2, 2, 'Mặt tiền Nhà Thờ Tân Định', 'mat-tien-nha-tho-tan-dinh', 'Kiến trúc màu hồng và câu chuyện khu Tân Định.', 10.7882900, 106.6905700, 30, 1, 'ACTIVE', 1),
(10, 5, 2, 2, 'Góc cà phê Tân Định', 'goc-ca-phe-tan-dinh', 'Văn hóa cà phê sáng quanh khu nhà thờ.', 10.7880300, 106.6901200, 25, 0, 'ACTIVE', 2),
(11, 6, 2, 2, 'Cổng phố Bùi Viện', 'cong-pho-bui-vien', 'Điểm bắt đầu tuyến phố đêm sôi động.', 10.7676100, 106.6947800, 30, 0, 'ACTIVE', 1),
(12, 6, 2, 2, 'Sân khấu đường phố Bùi Viện', 'san-khau-duong-pho-bui-vien', 'Âm thanh âm nhạc, biển hiệu và dòng người ban đêm.', 10.7671600, 106.6938500, 30, 1, 'ACTIVE', 2),
(13, 7, 2, 2, 'Cột cờ Thủ Ngữ', 'cot-co-thu-ngu', 'Dấu mốc lịch sử ven sông Sài Gòn.', 10.7750900, 106.7066200, 30, 1, 'ACTIVE', 1),
(14, 7, 2, 2, 'Bến tàu Bạch Đằng', 'ben-tau-bach-dang', 'Điểm kết nối tour sông và không gian dạo bộ.', 10.7748600, 106.7062800, 30, 0, 'ACTIVE', 2),
(15, 8, 3, 2, 'Cổng Chợ Lớn', 'cong-cho-lon', 'Không khí mua bán và dấu ấn văn hóa người Hoa.', 10.7547500, 106.6637100, 30, 0, 'ACTIVE', 1),
(16, 8, 3, 2, 'Khu mì vịt tiềm Quận 5', 'khu-mi-vit-tiem-quan-5', 'Câu chuyện món mì, tiệm ăn gia truyền và hương thuốc bắc.', 10.7543800, 106.6632000, 25, 1, 'ACTIVE', 2),
(17, 9, 4, 2, 'Lối vào Chợ Hồ Thị Kỷ', 'loi-vao-cho-ho-thi-ky', 'Tuyến hẻm hoa và món ăn vặt nổi tiếng.', 10.7631200, 106.6707200, 28, 0, 'ACTIVE', 1),
(18, 9, 4, 2, 'Khu chè Campuchia', 'khu-che-campuchia', 'Trải nghiệm món chè, xiên que và nhịp chợ đêm.', 10.7634500, 106.6702000, 25, 1, 'ACTIVE', 2),
(19, 10, 5, 2, 'Bãi cỏ bờ sông Thủ Thiêm', 'bai-co-bo-song-thu-thiem', 'Điểm ngắm skyline và gió sông Sài Gòn.', 10.7759300, 106.7142600, 35, 0, 'ACTIVE', 1),
(20, 10, 5, 2, 'Góc ngắm Landmark và Quận 1', 'goc-ngam-landmark-va-quan-1', 'Điểm nghe audio về sự phát triển đô thị ven sông.', 10.7764100, 106.7150500, 35, 1, 'ACTIVE', 2);

INSERT INTO pois (id, stall_id, zone_code, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order) VALUES
(1, 1, 'HCM-Q4-VK-01', 2, 'Cổng phố Vĩnh Khánh', 'cong-pho-vinh-khanh', 'Điểm mở đầu tuyến âm thanh phố ẩm thực Vĩnh Khánh.', 10.7566600, 106.7065300, 25, 0, 'ACTIVE', 1),
(2, 1, 'HCM-Q4-VK-01', 2, 'Khu ốc nướng Vĩnh Khánh', 'khu-oc-nuong-vinh-khanh', 'Câu chuyện về văn hóa ăn ốc và món nướng Quận 4.', 10.7563500, 106.7068300, 25, 1, 'ACTIVE', 2),
(3, 2, 'HCM-Q4-VK-02', 2, 'Quầy hải sản đêm', 'quay-hai-san-dem', 'Âm thanh bếp than, hải sản và nhịp phục vụ ban đêm.', 10.7559800, 106.7070500, 25, 1, 'ACTIVE', 1),
(4, 2, 'HCM-Q4-VK-02', 2, 'Góc bánh tráng nướng', 'goc-banh-trang-nuong', 'Món ăn vặt quen thuộc của giới trẻ Sài Gòn.', 10.7556200, 106.7072800, 22, 0, 'ACTIVE', 2),
(5, 3, 'HCM-Q1-NH-01', 2, 'Tượng đài Nguyễn Huệ', 'tuong-dai-nguyen-hue', 'Không gian trung tâm của phố đi bộ Nguyễn Huệ.', 10.7742400, 106.7034700, 30, 0, 'ACTIVE', 1),
(6, 3, 'HCM-Q1-NH-01', 2, 'Đài phun nước Nguyễn Huệ', 'dai-phun-nuoc-nguyen-hue', 'Điểm dừng chân nghe câu chuyện nhịp sống đô thị.', 10.7735500, 106.7034000, 30, 0, 'ACTIVE', 2),
(7, 4, 'HCM-Q1-BT-01', 2, 'Cổng Nam Chợ Bến Thành', 'cong-nam-cho-ben-thanh', 'Biểu tượng nhận diện của khu chợ trung tâm.', 10.7724800, 106.6980100, 28, 0, 'ACTIVE', 1),
(8, 4, 'HCM-Q1-BT-01', 2, 'Khu hàng ăn Chợ Bến Thành', 'khu-hang-an-cho-ben-thanh', 'Các món ăn nhanh, chè và hàng quán trong chợ.', 10.7721200, 106.6977500, 25, 1, 'ACTIVE', 2),
(9, 5, 'HCM-Q1-TD-01', 2, 'Mặt tiền Nhà Thờ Tân Định', 'mat-tien-nha-tho-tan-dinh', 'Kiến trúc màu hồng và câu chuyện khu Tân Định.', 10.7882900, 106.6905700, 30, 1, 'ACTIVE', 1),
(10, 5, 'HCM-Q1-TD-01', 2, 'Góc cà phê Tân Định', 'goc-ca-phe-tan-dinh', 'Văn hóa cà phê sáng quanh khu nhà thờ.', 10.7880300, 106.6901200, 25, 0, 'ACTIVE', 2),
(11, 6, 'HCM-Q1-BV-01', 2, 'Cổng phố Bùi Viện', 'cong-pho-bui-vien', 'Điểm bắt đầu tuyến phố đêm sôi động.', 10.7676100, 106.6947800, 30, 0, 'ACTIVE', 1),
(12, 6, 'HCM-Q1-BV-01', 2, 'Sân khấu đường phố Bùi Viện', 'san-khau-duong-pho-bui-vien', 'Âm thanh âm nhạc, biển hiệu và dòng người ban đêm.', 10.7671600, 106.6938500, 30, 1, 'ACTIVE', 2),
(13, 7, 'HCM-Q1-BD-01', 2, 'Cột cờ Thủ Ngữ', 'cot-co-thu-ngu', 'Dấu mốc lịch sử ven sông Sài Gòn.', 10.7750900, 106.7066200, 30, 1, 'ACTIVE', 1),
(14, 7, 'HCM-Q1-BD-01', 2, 'Bến tàu Bạch Đằng', 'ben-tau-bach-dang', 'Điểm kết nối tour sông và không gian dạo bộ.', 10.7748600, 106.7062800, 30, 0, 'ACTIVE', 2),
(15, 8, 'HCM-Q5-CL-01', 2, 'Cổng Chợ Lớn', 'cong-cho-lon', 'Không khí mua bán và dấu ấn văn hóa người Hoa.', 10.7547500, 106.6637100, 30, 0, 'ACTIVE', 1),
(16, 8, 'HCM-Q5-CL-01', 2, 'Khu mì vịt tiềm Quận 5', 'khu-mi-vit-tiem-quan-5', 'Câu chuyện món mì, tiệm ăn gia truyền và hương thuốc bắc.', 10.7543800, 106.6632000, 25, 1, 'ACTIVE', 2),
(17, 9, 'HCM-Q10-HTK-01', 2, 'Lối vào Chợ Hồ Thị Kỷ', 'loi-vao-cho-ho-thi-ky', 'Tuyến hẻm hoa và món ăn vặt nổi tiếng.', 10.7631200, 106.6707200, 28, 0, 'ACTIVE', 1),
(18, 9, 'HCM-Q10-HTK-01', 2, 'Khu chè Campuchia', 'khu-che-campuchia', 'Trải nghiệm món chè, xiên que và nhịp chợ đêm.', 10.7634500, 106.6702000, 25, 1, 'ACTIVE', 2),
(19, 10, 'HCM-TD-TT-01', 2, 'Bãi cỏ bờ sông Thủ Thiêm', 'bai-co-bo-song-thu-thiem', 'Điểm ngắm skyline và gió sông Sài Gòn.', 10.7759300, 106.7142600, 35, 0, 'ACTIVE', 1),
(20, 10, 'HCM-TD-TT-01', 2, 'Góc ngắm Landmark và Quận 1', 'goc-ngam-landmark-va-quan-1', 'Điểm nghe audio về sự phát triển đô thị ven sông.', 10.7764100, 106.7150500, 35, 1, 'ACTIVE', 2);

INSERT INTO tour_pois (tour_id, poi_id, sort_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4),
(2, 5, 1), (2, 6, 2), (2, 7, 3), (2, 8, 4), (2, 9, 5), (2, 10, 6), (2, 11, 7), (2, 12, 8), (2, 13, 9), (2, 14, 10),
(3, 15, 1), (3, 16, 2),
(4, 17, 1), (4, 18, 2),
(5, 19, 1), (5, 20, 2);

-- 40 content: mỗi POI có tiếng Việt và tiếng Anh
INSERT INTO poi_contents (id, poi_id, lang, title, short_text, tts_script, audio_url, voice_profile, approval_status) VALUES
(1, 1, 'vi', 'Cổng phố Vĩnh Khánh', 'Điểm bắt đầu phố ẩm thực Quận 4.', 'Bạn đang đứng ở cổng phố Vĩnh Khánh, nơi mùi món nướng, tiếng xe máy và tiếng gọi món tạo nên nhịp sống đêm rất riêng của Quận 4.', '/uploads/audio/hcm/poi-1-vi.mp3', 'vi-standard', 'approved'),
(2, 1, 'en', 'Vinh Khanh Street Gate', 'Starting point of District 4 food street.', 'You are at the entrance of Vinh Khanh Street, where grilled food, scooters, and lively voices shape District 4 night culture.', '/uploads/audio/hcm/poi-1-en.mp3', 'en-standard', 'approved'),
(3, 2, 'vi', 'Khu ốc nướng Vĩnh Khánh', 'Hương vị ốc nướng đêm Sài Gòn.', 'Khu ốc nướng Vĩnh Khánh nổi bật với bếp than, nước chấm cay và thói quen ngồi lâu cùng bạn bè sau giờ làm.', '/uploads/audio/hcm/poi-2-vi.mp3', 'vi-premium', 'approved'),
(4, 2, 'en', 'Vinh Khanh Grilled Snails', 'Night grilled snails in Saigon.', 'This area is known for charcoal grills, spicy dipping sauces, and long casual meals with friends after work.', '/uploads/audio/hcm/poi-2-en.mp3', 'en-premium', 'approved'),
(5, 3, 'vi', 'Quầy hải sản đêm', 'Không khí bếp hải sản ven đường.', 'Ở đây, âm thanh xào nướng, mùi bơ tỏi và tiếng gọi món tạo nên một sân khấu ẩm thực bình dân.', '/uploads/audio/hcm/poi-3-vi.mp3', 'vi-premium', 'approved'),
(6, 3, 'en', 'Night Seafood Counter', 'Street seafood kitchen atmosphere.', 'Here, sizzling pans, garlic butter, and quick orders create an informal street food performance.', '/uploads/audio/hcm/poi-3-en.mp3', 'en-premium', 'approved'),
(7, 4, 'vi', 'Góc bánh tráng nướng', 'Món ăn vặt quen thuộc.', 'Bánh tráng nướng là món ăn vặt dễ bắt gặp, kết hợp trứng, hành, tép và tương cay trên lớp bánh giòn.', '/uploads/audio/hcm/poi-4-vi.mp3', 'vi-standard', 'approved'),
(8, 4, 'en', 'Grilled Rice Paper Corner', 'A familiar street snack.', 'Grilled rice paper combines egg, scallion, dried shrimp, and chili sauce on a crispy base.', '/uploads/audio/hcm/poi-4-en.mp3', 'en-standard', 'approved'),
(9, 5, 'vi', 'Tượng đài Nguyễn Huệ', 'Trung tâm phố đi bộ.', 'Tượng đài là điểm định hướng của phố đi bộ Nguyễn Huệ, nơi người dân và du khách thường hẹn gặp trước khi dạo phố.', '/uploads/audio/hcm/poi-5-vi.mp3', 'vi-standard', 'approved'),
(10, 5, 'en', 'Nguyen Hue Statue', 'Center of the walking street.', 'The statue is a landmark of Nguyen Hue Walking Street and a common meeting point before an evening walk.', '/uploads/audio/hcm/poi-5-en.mp3', 'en-standard', 'approved'),
(11, 6, 'vi', 'Đài phun nước Nguyễn Huệ', 'Nhịp sống đô thị trung tâm.', 'Đài phun nước tạo điểm nghỉ giữa quảng trường, phản chiếu ánh đèn, màn hình lớn và nhịp đi bộ của thành phố.', '/uploads/audio/hcm/poi-6-vi.mp3', 'vi-standard', 'approved'),
(12, 6, 'en', 'Nguyen Hue Fountain', 'Urban rhythm in the center.', 'The fountain offers a resting point among lights, large screens, and the walking rhythm of the city.', '/uploads/audio/hcm/poi-6-en.mp3', 'en-standard', 'approved'),
(13, 7, 'vi', 'Cổng Nam Chợ Bến Thành', 'Biểu tượng chợ Sài Gòn.', 'Cổng Nam Chợ Bến Thành là hình ảnh quen thuộc khi nhắc đến khu chợ trung tâm và lịch sử thương mại của Sài Gòn.', '/uploads/audio/hcm/poi-7-vi.mp3', 'vi-standard', 'approved'),
(14, 7, 'en', 'Ben Thanh South Gate', 'A Saigon market symbol.', 'The south gate is one of the most recognizable images of Ben Thanh Market and central Saigon commerce.', '/uploads/audio/hcm/poi-7-en.mp3', 'en-standard', 'approved'),
(15, 8, 'vi', 'Khu hàng ăn Chợ Bến Thành', 'Món nhanh và chè trong chợ.', 'Khu hàng ăn trong chợ gom nhiều món quen thuộc, từ bún, cơm, gỏi cuốn đến chè và nước giải khát.', '/uploads/audio/hcm/poi-8-vi.mp3', 'vi-premium', 'approved'),
(16, 8, 'en', 'Ben Thanh Food Stalls', 'Quick meals and desserts.', 'The food stalls gather familiar dishes, from noodles and rice plates to spring rolls, sweet soup, and drinks.', '/uploads/audio/hcm/poi-8-en.mp3', 'en-premium', 'approved'),
(17, 9, 'vi', 'Mặt tiền Nhà Thờ Tân Định', 'Kiến trúc màu hồng nổi bật.', 'Mặt tiền màu hồng của Nhà Thờ Tân Định khiến nơi đây trở thành một điểm nhận diện đặc biệt của khu vực.', '/uploads/audio/hcm/poi-9-vi.mp3', 'vi-premium', 'approved'),
(18, 9, 'en', 'Tan Dinh Church Facade', 'The iconic pink facade.', 'The pink facade makes Tan Dinh Church a distinctive landmark in the neighborhood.', '/uploads/audio/hcm/poi-9-en.mp3', 'en-premium', 'approved'),
(19, 10, 'vi', 'Góc cà phê Tân Định', 'Cà phê sáng quanh nhà thờ.', 'Các quán cà phê quanh Tân Định là nơi quan sát nhịp xe, tiếng chuông và đời sống buổi sáng của thành phố.', '/uploads/audio/hcm/poi-10-vi.mp3', 'vi-standard', 'approved'),
(20, 10, 'en', 'Tan Dinh Coffee Corner', 'Morning coffee near the church.', 'The coffee shops around Tan Dinh offer a view of traffic, bells, and the morning pace of the city.', '/uploads/audio/hcm/poi-10-en.mp3', 'en-standard', 'approved'),
(21, 11, 'vi', 'Cổng phố Bùi Viện', 'Lối vào khu phố đêm.', 'Cổng phố Bùi Viện mở ra một không gian nhiều âm thanh, ánh sáng và dịch vụ giải trí ban đêm.', '/uploads/audio/hcm/poi-11-vi.mp3', 'vi-standard', 'approved'),
(22, 11, 'en', 'Bui Vien Entrance', 'Gateway to the night street.', 'The entrance to Bui Vien opens into a soundscape of lights, music, and nightlife services.', '/uploads/audio/hcm/poi-11-en.mp3', 'en-standard', 'approved'),
(23, 12, 'vi', 'Sân khấu đường phố Bùi Viện', 'Âm nhạc và biển hiệu về đêm.', 'Điểm này tập trung âm nhạc, tiếng nói nhiều ngôn ngữ và bảng hiệu neon đặc trưng của phố đêm.', '/uploads/audio/hcm/poi-12-vi.mp3', 'vi-premium', 'approved'),
(24, 12, 'en', 'Bui Vien Street Stage', 'Music and night signs.', 'This point gathers music, multilingual conversations, and the neon signs that define the street at night.', '/uploads/audio/hcm/poi-12-en.mp3', 'en-premium', 'approved'),
(25, 13, 'vi', 'Cột cờ Thủ Ngữ', 'Dấu mốc ven sông Sài Gòn.', 'Cột cờ Thủ Ngữ là dấu mốc quen thuộc ven sông, gắn với lịch sử giao thương và cảng thị Sài Gòn.', '/uploads/audio/hcm/poi-13-vi.mp3', 'vi-premium', 'approved'),
(26, 13, 'en', 'Thu Ngu Flagpole', 'A riverside landmark.', 'Thu Ngu Flagpole is a familiar riverside landmark connected to Saigon trade and port history.', '/uploads/audio/hcm/poi-13-en.mp3', 'en-premium', 'approved'),
(27, 14, 'vi', 'Bến tàu Bạch Đằng', 'Điểm kết nối tour sông.', 'Bến tàu là nơi chuyển tiếp từ trải nghiệm đi bộ sang trải nghiệm nhìn thành phố từ mặt nước.', '/uploads/audio/hcm/poi-14-vi.mp3', 'vi-standard', 'approved'),
(28, 14, 'en', 'Bach Dang Pier', 'Connection to river tours.', 'The pier links walking routes with the experience of seeing the city from the river.', '/uploads/audio/hcm/poi-14-en.mp3', 'en-standard', 'approved'),
(29, 15, 'vi', 'Cổng Chợ Lớn', 'Không khí thương mại Quận 5.', 'Chợ Lớn mang không khí thương mại lâu đời, kết hợp bảng hiệu, tiếng rao và văn hóa cộng đồng người Hoa.', '/uploads/audio/hcm/poi-15-vi.mp3', 'vi-standard', 'approved'),
(30, 15, 'en', 'Cholon Gate', 'District 5 commerce atmosphere.', 'Cholon carries a long-standing trade atmosphere, mixing signs, street calls, and Chinese-Vietnamese community culture.', '/uploads/audio/hcm/poi-15-en.mp3', 'en-standard', 'approved'),
(31, 16, 'vi', 'Khu mì vịt tiềm Quận 5', 'Hương vị tiệm ăn gia truyền.', 'Mì vịt tiềm gợi nhắc các tiệm ăn gia đình, nước dùng thơm vị thuốc bắc và phong cách phục vụ nhanh.', '/uploads/audio/hcm/poi-16-vi.mp3', 'vi-premium', 'approved'),
(32, 16, 'en', 'District 5 Duck Noodle Area', 'Family shop flavors.', 'Duck noodles evoke family-run eateries, herbal broth, and fast neighborhood service.', '/uploads/audio/hcm/poi-16-en.mp3', 'en-premium', 'approved'),
(33, 17, 'vi', 'Lối vào Chợ Hồ Thị Kỷ', 'Hẻm hoa và món ăn vặt.', 'Lối vào Hồ Thị Kỷ mở ra không gian hẻm nhỏ, xe đẩy, quầy hoa và mùi món ăn vặt.', '/uploads/audio/hcm/poi-17-vi.mp3', 'vi-standard', 'approved'),
(34, 17, 'en', 'Ho Thi Ky Market Entrance', 'Flowers and street snacks.', 'The entrance opens into narrow alleys with carts, flower stalls, and the aroma of street snacks.', '/uploads/audio/hcm/poi-17-en.mp3', 'en-standard', 'approved'),
(35, 18, 'vi', 'Khu chè Campuchia', 'Chè và xiên que Quận 10.', 'Khu chè Campuchia kết hợp vị ngọt, béo, đá bào và nhiều món xiên que trong không khí chợ đêm.', '/uploads/audio/hcm/poi-18-vi.mp3', 'vi-premium', 'approved'),
(36, 18, 'en', 'Cambodian Dessert Area', 'Desserts and skewers in District 10.', 'This area combines sweet, creamy desserts, shaved ice, and skewers in a night market setting.', '/uploads/audio/hcm/poi-18-en.mp3', 'en-premium', 'approved'),
(37, 19, 'vi', 'Bãi cỏ bờ sông Thủ Thiêm', 'Gió sông và skyline.', 'Từ bãi cỏ ven sông, bạn có thể nghe gió thổi qua mặt nước và nhìn về đường chân trời Quận 1.', '/uploads/audio/hcm/poi-19-vi.mp3', 'vi-standard', 'approved'),
(38, 19, 'en', 'Thu Thiem Riverside Lawn', 'River breeze and skyline.', 'From the riverside lawn, you can feel the breeze and look toward the District 1 skyline.', '/uploads/audio/hcm/poi-19-en.mp3', 'en-standard', 'approved'),
(39, 20, 'vi', 'Góc ngắm Landmark và Quận 1', 'Điểm nhìn đô thị ven sông.', 'Điểm nhìn này kể câu chuyện về sự thay đổi của không gian ven sông và các tòa nhà cao tầng trong thành phố.', '/uploads/audio/hcm/poi-20-vi.mp3', 'vi-premium', 'approved'),
(40, 20, 'en', 'Landmark and District 1 Viewpoint', 'A riverside urban view.', 'This viewpoint tells the story of changing riverside spaces and high-rise development in the city.', '/uploads/audio/hcm/poi-20-en.mp3', 'en-premium', 'approved');

INSERT INTO media_files (id, vendor_id, stall_id, poi_id, uploaded_by_user_id, file_type, storage_provider, file_name, file_path, public_url, mime_type, file_size, moderation_status) VALUES
(1, 1, 1, NULL, @admin_id, 'IMAGE', 'LOCAL', 'vinh-khanh-street.jpg', '/uploads/vendors/1/stalls/1/vinh-khanh-street.jpg', '/media/hcm/vinh-khanh-street.jpg', 'image/jpeg', 350000, 'APPROVED'),
(2, 1, 2, 2, @admin_id, 'AUDIO', 'LOCAL', 'poi-2-vi.mp3', '/uploads/audio/hcm/poi-2-vi.mp3', '/media/audio/hcm/poi-2-vi.mp3', 'audio/mpeg', 1250000, 'APPROVED'),
(3, 2, 3, NULL, @admin_id, 'IMAGE', 'nguyen-hue.jpg', '/uploads/vendors/2/stalls/3/nguyen-hue.jpg', '/media/hcm/nguyen-hue.jpg', 'image/jpeg', 420000, 'APPROVED'),
(4, 3, 4, NULL, @admin_id, 'IMAGE', 'ben-thanh.jpg', '/uploads/vendors/3/stalls/4/ben-thanh.jpg', '/media/hcm/ben-thanh.jpg', 'image/jpeg', 390000, 'APPROVED'),
(5, 5, 6, NULL, @admin_id, 'IMAGE', 'bui-vien-night.jpg', '/uploads/vendors/5/stalls/6/bui-vien-night.jpg', '/media/hcm/bui-vien-night.jpg', 'image/jpeg', 410000, 'APPROVED'),
(6, 8, 9, 18, @admin_id, 'AUDIO', 'LOCAL', 'poi-18-vi.mp3', '/uploads/audio/hcm/poi-18-vi.mp3', '/media/audio/hcm/poi-18-vi.mp3', 'audio/mpeg', 1180000, 'APPROVED'),
(7, 10, 10, NULL, @admin_id, 'IMAGE', 'thu-thiem-riverside.jpg', '/uploads/vendors/10/stalls/10/thu-thiem-riverside.jpg', '/media/hcm/thu-thiem-riverside.jpg', 'image/jpeg', 450000, 'APPROVED'),
(8, 7, 8, 16, @admin_id, 'AUDIO', 'LOCAL', 'poi-16-vi.mp3', '/uploads/audio/hcm/poi-16-vi.mp3', '/media/audio/hcm/poi-16-vi.mp3', 'audio/mpeg', 1210000, 'APPROVED');

INSERT INTO qr_codes (id, vendor_id, tour_id, stall_id, poi_id, code, qr_type, target_url, image_url, is_active) VALUES
(1, 1, 1, NULL, NULL, 'VTA-HCM-TOUR-VK', 'TOUR', 'https://app.viettouraudio.vn/tour/khu-pho-am-thuc-vinh-khanh', '/qr/hcm/tour-vinh-khanh.png', 1),
(2, 2, 2, NULL, NULL, 'VTA-HCM-TOUR-Q1', 'TOUR', 'https://app.viettouraudio.vn/tour/trung-tam-sai-gon-quan-1', '/qr/hcm/tour-q1.png', 1),
(3, 7, 3, NULL, NULL, 'VTA-HCM-TOUR-CL', 'TOUR', 'https://app.viettouraudio.vn/tour/huong-vi-cho-lon-quan-5', '/qr/hcm/tour-cholon.png', 1),
(4, 8, 4, NULL, NULL, 'VTA-HCM-TOUR-HTK', 'TOUR', 'https://app.viettouraudio.vn/tour/ho-thi-ky-va-cho-dem-quan-10', '/qr/hcm/tour-ho-thi-ky.png', 1),
(5, 10, 5, NULL, NULL, 'VTA-HCM-TOUR-TT', 'TOUR', 'https://app.viettouraudio.vn/tour/bo-song-thu-thiem', '/qr/hcm/tour-thu-thiem.png', 1),
(6, 1, NULL, 1, NULL, 'VTA-HCM-ST-VK01', 'STALL', 'https://app.viettouraudio.vn/map?stall=1', '/qr/hcm/stall-vk01.png', 1),
(7, 1, NULL, 2, 2, 'VTA-HCM-POI-0002', 'POI', 'https://app.viettouraudio.vn/map?poi=2', '/qr/hcm/poi-2.png', 1),
(8, 3, NULL, 4, 8, 'VTA-HCM-POI-0008', 'POI', 'https://app.viettouraudio.vn/map?poi=8', '/qr/hcm/poi-8.png', 1),
(9, 5, NULL, 6, 12, 'VTA-HCM-POI-0012', 'POI', 'https://app.viettouraudio.vn/map?poi=12', '/qr/hcm/poi-12.png', 1),
(10, 10, NULL, 10, 20, 'VTA-HCM-POI-0020', 'POI', 'https://app.viettouraudio.vn/map?poi=20', '/qr/hcm/poi-20.png', 1);

INSERT INTO visitor_sessions (id, token, is_premium, premium_24h_expiry, device_fingerprint, ip_address, user_agent) VALUES
(1, 'hcm_vs_001', 1, '2026-06-15 23:59:00', 'hcm-fp-ios-001', '127.0.0.1', 'Demo Safari HCMC'),
(2, 'hcm_vs_002', 0, NULL, 'hcm-fp-android-002', '127.0.0.1', 'Demo Chrome Android HCMC'),
(3, 'hcm_vs_003', 1, '2026-06-16 18:00:00', 'hcm-fp-web-003', '127.0.0.1', 'Demo Edge HCMC'),
(4, 'hcm_vs_004', 0, NULL, 'hcm-fp-ios-004', '127.0.0.1', 'Demo Safari 2 HCMC'),
(5, 'hcm_vs_005', 1, '2026-06-16 20:00:00', 'hcm-fp-web-005', '127.0.0.1', 'Demo Chrome Desktop HCMC'),
(6, 'hcm_vs_006', 0, NULL, 'hcm-fp-android-006', '127.0.0.1', 'Demo Samsung Internet HCMC'),
(7, 'hcm_vs_007', 1, '2026-06-17 12:00:00', 'hcm-fp-ios-007', '127.0.0.1', 'Demo Safari 3 HCMC'),
(8, 'hcm_vs_008', 0, NULL, 'hcm-fp-web-008', '127.0.0.1', 'Demo Firefox HCMC'),
(9, 'hcm_vs_009', 1, '2026-06-17 22:00:00', 'hcm-fp-android-009', '127.0.0.1', 'Demo Chrome 2 HCMC'),
(10, 'hcm_vs_010', 0, NULL, 'hcm-fp-web-010', '127.0.0.1', 'Demo Edge 2 HCMC');

INSERT INTO qr_scan_events (id, qr_code_id, vendor_id, tour_id, stall_id, poi_id, visitor_session_id, country_code, scanned_at) VALUES
(1, 1, 1, 1, NULL, NULL, 1, 'VN', '2026-06-15 18:00:00'),
(2, 6, 1, NULL, 1, NULL, 2, 'VN', '2026-06-15 18:10:00'),
(3, 7, 1, NULL, 2, 2, 3, 'VN', '2026-06-15 18:20:00'),
(4, 2, 2, 2, NULL, NULL, 4, 'US', '2026-06-15 19:00:00'),
(5, 8, 3, NULL, 4, 8, 5, 'VN', '2026-06-15 19:30:00'),
(6, 9, 5, NULL, 6, 12, 6, 'KR', '2026-06-15 21:00:00'),
(7, 3, 7, 3, NULL, NULL, 7, 'VN', '2026-06-16 09:00:00'),
(8, 4, 8, 4, NULL, NULL, 8, 'VN', '2026-06-16 20:00:00'),
(9, 5, 10, 5, NULL, NULL, 9, 'JP', '2026-06-16 21:00:00'),
(10, 10, 10, NULL, 10, 20, 10, 'VN', '2026-06-16 21:10:00');

INSERT INTO visit_events (id, vendor_id, stall_id, poi_id, visitor_session_id, source, latitude, longitude, distance_meters, visited_at) VALUES
(1, 1, 1, 1, 1, 'QR', 10.7566600, 106.7065300, 0.00, '2026-06-15 18:02:00'),
(2, 1, 1, 2, 2, 'GPS', 10.7563500, 106.7068300, 6.50, '2026-06-15 18:12:00'),
(3, 1, 2, 3, 3, 'GPS', 10.7559800, 106.7070500, 5.20, '2026-06-15 18:25:00'),
(4, 2, 3, 5, 4, 'QR', 10.7742400, 106.7034700, 0.00, '2026-06-15 19:02:00'),
(5, 3, 4, 8, 5, 'QR', 10.7721200, 106.6977500, 0.00, '2026-06-15 19:32:00'),
(6, 5, 6, 12, 6, 'QR', 10.7671600, 106.6938500, 0.00, '2026-06-15 21:05:00'),
(7, 7, 8, 16, 7, 'GPS', 10.7543800, 106.6632000, 4.70, '2026-06-16 09:05:00'),
(8, 8, 9, 18, 8, 'GPS', 10.7634500, 106.6702000, 8.10, '2026-06-16 20:05:00'),
(9, 10, 10, 19, 9, 'GPS', 10.7759300, 106.7142600, 5.40, '2026-06-16 21:03:00'),
(10, 10, 10, 20, 10, 'QR', 10.7764100, 106.7150500, 0.00, '2026-06-16 21:12:00');

INSERT INTO play_history (id, visitor_session_id, poi_id, poi_content_id, lang, source, started_at, completed_at, duration_seconds) VALUES
(1, 1, 1, 1, 'vi', 'QR', '2026-06-15 18:03:00', '2026-06-15 18:04:24', 84),
(2, 2, 2, 3, 'vi', 'AUTO_GPS', '2026-06-15 18:13:00', '2026-06-15 18:14:30', 90),
(3, 3, 3, 5, 'vi', 'AUTO_GPS', '2026-06-15 18:26:00', '2026-06-15 18:27:35', 95),
(4, 4, 5, 10, 'en', 'QR', '2026-06-15 19:03:00', '2026-06-15 19:04:12', 72),
(5, 5, 8, 15, 'vi', 'QR', '2026-06-15 19:33:00', '2026-06-15 19:34:40', 100),
(6, 6, 12, 23, 'vi', 'QR', '2026-06-15 21:06:00', '2026-06-15 21:07:20', 80),
(7, 7, 16, 31, 'vi', 'AUTO_GPS', '2026-06-16 09:06:00', '2026-06-16 09:07:42', 102),
(8, 8, 18, 35, 'vi', 'AUTO_GPS', '2026-06-16 20:06:00', '2026-06-16 20:07:28', 88),
(9, 9, 19, 38, 'en', 'AUTO_GPS', '2026-06-16 21:04:00', '2026-06-16 21:05:15', 75),
(10, 10, 20, 39, 'vi', 'QR', '2026-06-16 21:13:00', '2026-06-16 21:14:35', 95);

INSERT INTO payments (id, vendor_id, visitor_session_id, vendor_subscription_id, amount, provider, payment_type, status, transaction_code, provider_payload, paid_at) VALUES
(1, 1, NULL, 1, 899000.00, 'BANK_QR', 'VENDOR_SUBSCRIPTION', 'PAID', 'HCM-PAY-SUB-0001', '{"bank":"VCB"}', '2026-06-01 08:00:00'),
(2, 2, NULL, 2, 599000.00, 'MOMO', 'VENDOR_SUBSCRIPTION', 'PAID', 'HCM-PAY-SUB-0002', '{"wallet":"momo"}', '2026-06-01 08:05:00'),
(3, 3, NULL, 3, 599000.00, 'BANK_QR', 'VENDOR_SUBSCRIPTION', 'PAID', 'HCM-PAY-SUB-0003', '{"bank":"TCB"}', '2026-06-01 08:10:00'),
(4, 8, NULL, 8, 599000.00, 'VNPAY', 'VENDOR_SUBSCRIPTION', 'PAID', 'HCM-PAY-SUB-0008', '{"gateway":"vnpay"}', '2026-06-01 08:20:00'),
(5, 10, NULL, 10, 599000.00, 'BANK_QR', 'WALLET_TOP_UP', 'PAID', 'HCM-PAY-TOP-0010', '{"bank":"ACB"}', '2026-06-10 11:00:00'),
(6, NULL, 1, NULL, 30000.00, 'MOMO', 'VISITOR_PREMIUM', 'PAID', 'HCM-PAY-VIS-0001', '{"wallet":"momo"}', '2026-06-15 18:00:00'),
(7, NULL, 3, NULL, 30000.00, 'STRIPE', 'VISITOR_PREMIUM', 'PAID', 'HCM-PAY-VIS-0003', '{"card":"test"}', '2026-06-15 18:20:00'),
(8, NULL, 5, NULL, 30000.00, 'MOMO', 'VISITOR_PREMIUM', 'PAID', 'HCM-PAY-VIS-0005', '{"wallet":"momo"}', '2026-06-15 19:30:00'),
(9, NULL, 7, NULL, 30000.00, 'STRIPE', 'VISITOR_PREMIUM', 'PAID', 'HCM-PAY-VIS-0007', '{"card":"test"}', '2026-06-16 09:00:00'),
(10, NULL, 9, NULL, 30000.00, 'MOMO', 'VISITOR_PREMIUM', 'PAID', 'HCM-PAY-VIS-0009', '{"wallet":"momo"}', '2026-06-16 21:00:00');

INSERT INTO vendor_wallets (id, vendor_id, balance, total_top_up, total_spent, total_commission) VALUES
(1, 1, 900000.00, 1000000.00, 130000.00, 30000.00),
(2, 2, 520000.00, 600000.00, 100000.00, 20000.00),
(3, 3, 430000.00, 500000.00, 90000.00, 20000.00),
(4, 4, 210000.00, 250000.00, 40000.00, 0.00),
(5, 5, 360000.00, 400000.00, 60000.00, 20000.00),
(6, 6, 300000.00, 350000.00, 50000.00, 0.00),
(7, 7, 460000.00, 550000.00, 110000.00, 20000.00),
(8, 8, 620000.00, 700000.00, 100000.00, 20000.00),
(9, 9, 0.00, 0.00, 0.00, 0.00),
(10, 10, 930000.00, 1000000.00, 100000.00, 30000.00);

INSERT INTO top_up_requests (id, vendor_id, wallet_id, requested_by_user_id, provider, status, amount, proof_url, note, reviewed_by_user_id, reviewed_at) VALUES
(1, 1, 1, @finance_id, 'BANK_QR', 'APPROVED', 1000000.00, '/proofs/hcm/topup-1.jpg', 'Nạp ví cho chiến dịch Vĩnh Khánh', @finance_id, '2026-06-02 08:00:00'),
(2, 2, 2, @finance_id, 'MOMO', 'APPROVED', 600000.00, '/proofs/hcm/topup-2.jpg', 'Nạp ví Nguyễn Huệ', @finance_id, '2026-06-02 08:10:00'),
(3, 3, 3, @finance_id, 'BANK_QR', 'APPROVED', 500000.00, '/proofs/hcm/topup-3.jpg', 'Nạp ví Bến Thành', @finance_id, '2026-06-02 08:20:00'),
(4, 5, 5, @finance_id, 'VNPAY', 'APPROVED', 400000.00, '/proofs/hcm/topup-5.jpg', 'Nạp ví Bùi Viện', @finance_id, '2026-06-02 08:30:00'),
(5, 8, 8, @finance_id, 'BANK_QR', 'APPROVED', 700000.00, '/proofs/hcm/topup-8.jpg', 'Nạp ví Hồ Thị Kỷ', @finance_id, '2026-06-02 08:40:00'),
(6, 10, 10, @finance_id, 'BANK_QR', 'APPROVED', 1000000.00, '/proofs/hcm/topup-10.jpg', 'Nạp ví Thủ Thiêm', @finance_id, '2026-06-10 11:05:00');

INSERT INTO wallet_transactions (id, wallet_id, vendor_id, payment_id, top_up_request_id, transaction_type, direction, amount, balance_before, balance_after, description, created_by_user_id, metadata) VALUES
(1, 1, 1, NULL, 1, 'TOP_UP', 'CREDIT', 1000000.00, 0.00, 1000000.00, 'Top up approved for HCMC Vĩnh Khánh campaign', @finance_id, '{"batch":"hcm_seed"}'),
(2, 1, 1, NULL, NULL, 'FEE', 'DEBIT', 130000.00, 1000000.00, 870000.00, 'Audio and QR campaign fee', @finance_id, '{"batch":"hcm_seed"}'),
(3, 1, 1, NULL, NULL, 'MANUAL', 'CREDIT', 30000.00, 870000.00, 900000.00, 'Commission adjustment', @finance_id, '{"batch":"hcm_seed"}'),
(4, 2, 2, NULL, 2, 'TOP_UP', 'CREDIT', 600000.00, 0.00, 600000.00, 'Top up approved', @finance_id, '{"batch":"hcm_seed"}'),
(5, 2, 2, NULL, NULL, 'FEE', 'DEBIT', 100000.00, 600000.00, 500000.00, 'Premium tour placement fee', @finance_id, '{"batch":"hcm_seed"}'),
(6, 2, 2, NULL, NULL, 'MANUAL', 'CREDIT', 20000.00, 500000.00, 520000.00, 'Commission adjustment', @finance_id, '{"batch":"hcm_seed"}'),
(7, 3, 3, NULL, 3, 'TOP_UP', 'CREDIT', 500000.00, 0.00, 500000.00, 'Top up approved', @finance_id, '{"batch":"hcm_seed"}'),
(8, 3, 3, NULL, NULL, 'FEE', 'DEBIT', 90000.00, 500000.00, 410000.00, 'Market content fee', @finance_id, '{"batch":"hcm_seed"}'),
(9, 3, 3, NULL, NULL, 'MANUAL', 'CREDIT', 20000.00, 410000.00, 430000.00, 'Manual adjustment', @finance_id, '{"batch":"hcm_seed"}'),
(10, 5, 5, NULL, 4, 'TOP_UP', 'CREDIT', 400000.00, 0.00, 400000.00, 'Top up approved', @finance_id, '{"batch":"hcm_seed"}'),
(11, 5, 5, NULL, NULL, 'FEE', 'DEBIT', 60000.00, 400000.00, 340000.00, 'Night street campaign fee', @finance_id, '{"batch":"hcm_seed"}'),
(12, 5, 5, NULL, NULL, 'MANUAL', 'CREDIT', 20000.00, 340000.00, 360000.00, 'Manual correction', @finance_id, '{"batch":"hcm_seed"}'),
(13, 8, 8, NULL, 5, 'TOP_UP', 'CREDIT', 700000.00, 0.00, 700000.00, 'Top up approved', @finance_id, '{"batch":"hcm_seed"}'),
(14, 8, 8, NULL, NULL, 'FEE', 'DEBIT', 100000.00, 700000.00, 600000.00, 'Food market campaign fee', @finance_id, '{"batch":"hcm_seed"}'),
(15, 8, 8, NULL, NULL, 'MANUAL', 'CREDIT', 20000.00, 600000.00, 620000.00, 'Commission adjustment', @finance_id, '{"batch":"hcm_seed"}'),
(16, 10, 10, 5, 6, 'TOP_UP', 'CREDIT', 1000000.00, 0.00, 1000000.00, 'Top up approved', @finance_id, '{"batch":"hcm_seed"}'),
(17, 10, 10, NULL, NULL, 'FEE', 'DEBIT', 100000.00, 1000000.00, 900000.00, 'Riverside premium POI fee', @finance_id, '{"batch":"hcm_seed"}'),
(18, 10, 10, NULL, NULL, 'MANUAL', 'CREDIT', 30000.00, 900000.00, 930000.00, 'Commission adjustment', @finance_id, '{"batch":"hcm_seed"}'),
(19, 9, 9, NULL, NULL, 'MANUAL', 'CREDIT', 0.00, 0.00, 0.00, 'Trial wallet initialized', @finance_id, '{"batch":"hcm_seed"}'),
(20, 4, 4, NULL, NULL, 'FEE', 'DEBIT', 40000.00, 250000.00, 210000.00, 'Coffee POI processing fee', @finance_id, '{"batch":"hcm_seed"}');

INSERT INTO commission_earnings (id, vendor_id, payment_id, qr_code_id, visitor_session_id, rate_percent, gross_amount, commission_amount, status, earned_at) VALUES
(1, 1, 6, 6, 1, 10.00, 30000.00, 3000.00, 'APPROVED', '2026-06-15 18:00:00'),
(2, 1, 7, 7, 3, 10.00, 30000.00, 3000.00, 'APPROVED', '2026-06-15 18:20:00'),
(3, 3, 8, 8, 5, 10.00, 30000.00, 3000.00, 'PENDING', '2026-06-15 19:30:00'),
(4, 7, 9, 3, 7, 10.00, 30000.00, 3000.00, 'APPROVED', '2026-06-16 09:00:00'),
(5, 10, 10, 10, 9, 10.00, 30000.00, 3000.00, 'PENDING', '2026-06-16 21:00:00');

INSERT INTO analytics_daily_stall (date, stall_id, vendor_id, qr_scans, visits, audio_plays, unique_visitors, premium_conversions, total_revenue) VALUES
('2026-06-15', 1, 1, 35, 120, 75, 88, 4, 120000.00),
('2026-06-15', 2, 1, 28, 96, 61, 72, 3, 90000.00),
('2026-06-15', 3, 2, 42, 150, 82, 110, 4, 120000.00),
('2026-06-15', 4, 3, 31, 105, 70, 83, 3, 90000.00),
('2026-06-15', 5, 4, 18, 64, 42, 51, 1, 30000.00),
('2026-06-15', 6, 5, 39, 140, 92, 101, 5, 150000.00),
('2026-06-15', 7, 6, 25, 90, 55, 67, 2, 60000.00),
('2026-06-15', 8, 7, 22, 80, 48, 60, 2, 60000.00),
('2026-06-15', 9, 8, 36, 130, 86, 97, 4, 120000.00),
('2026-06-15', 10, 10, 30, 112, 74, 86, 3, 90000.00),
('2026-06-16', 1, 1, 41, 138, 90, 102, 5, 150000.00),
('2026-06-16', 2, 1, 32, 110, 72, 82, 4, 120000.00),
('2026-06-16', 3, 2, 50, 170, 100, 124, 5, 150000.00),
('2026-06-16', 4, 3, 35, 116, 76, 90, 3, 90000.00),
('2026-06-16', 5, 4, 21, 70, 45, 57, 1, 30000.00),
('2026-06-16', 6, 5, 43, 155, 101, 115, 6, 180000.00),
('2026-06-16', 7, 6, 29, 97, 61, 72, 2, 60000.00),
('2026-06-16', 8, 7, 25, 88, 55, 68, 2, 60000.00),
('2026-06-16', 9, 8, 44, 149, 96, 112, 5, 150000.00),
('2026-06-16', 10, 10, 38, 128, 88, 97, 4, 120000.00);

INSERT INTO revenue_daily (date, source, provider, gross_amount, net_amount, fees, transaction_count) VALUES
('2026-06-15', 'VISITOR_PREMIUM', 'MOMO', 210000.00, 203000.00, 7000.00, 7),
('2026-06-15', 'VISITOR_PREMIUM', 'STRIPE', 90000.00, 85500.00, 4500.00, 3),
('2026-06-15', 'VENDOR_SUBSCRIPTION', 'BANK_QR', 2097000.00, 2097000.00, 0.00, 3),
('2026-06-15', 'WALLET_TOP_UP', 'BANK_QR', 1500000.00, 1500000.00, 0.00, 2),
('2026-06-16', 'VISITOR_PREMIUM', 'MOMO', 270000.00, 261000.00, 9000.00, 9),
('2026-06-16', 'VISITOR_PREMIUM', 'STRIPE', 120000.00, 114000.00, 6000.00, 4),
('2026-06-16', 'WALLET_TOP_UP', 'VNPAY', 400000.00, 394000.00, 6000.00, 1),
('2026-06-16', 'VENDOR_SUBSCRIPTION', 'MOMO', 599000.00, 593000.00, 6000.00, 1);

INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, before_data, after_data, ip_address) VALUES
(1, @admin_id, 'APPROVE_VENDOR', 'vendors', 1, '{"status":"PENDING"}', '{"status":"APPROVED"}', '127.0.0.1'),
(2, @admin_id, 'APPROVE_VENDOR', 'vendors', 10, '{"status":"PENDING"}', '{"status":"APPROVED"}', '127.0.0.1'),
(3, @finance_id, 'APPROVE_TOP_UP', 'top_up_requests', 1, '{"status":"PENDING"}', '{"status":"APPROVED"}', '127.0.0.1'),
(4, @moderator_id, 'APPROVE_POI_CONTENT', 'poi_contents', 1, '{"approval_status":"pending"}', '{"approval_status":"approved"}', '127.0.0.1'),
(5, @moderator_id, 'APPROVE_POI_CONTENT', 'poi_contents', 40, '{"approval_status":"pending"}', '{"approval_status":"approved"}', '127.0.0.1');

INSERT INTO app_settings (`key`, `value`) VALUES
('PREMIUM_PAYMENT_QR', 'MOMO-PAY-HCM-PREMIUM-12345'),
('DEFAULT_CITY', 'TP. Hồ Chí Minh'),
('DEFAULT_MAP_CENTER', '{"lat":10.7769,"lng":106.7009,"zoom":13}'),
('SEED_PROFILE', 'HCMC_20_POI_NO_USERS');

-- Kiểm tra nhanh sau khi chạy
SELECT 'HCMC seed no users completed' AS message,
       (SELECT COUNT(*) FROM vendors) AS vendors_count,
       (SELECT COUNT(*) FROM stalls) AS stalls_count,
       (SELECT COUNT(*) FROM tours) AS tours_count,
       (SELECT COUNT(*) FROM pois) AS pois_count,
       (SELECT COUNT(*) FROM poi_contents) AS poi_contents_count;
