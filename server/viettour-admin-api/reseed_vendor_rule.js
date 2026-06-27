const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'viettuoraudio'
  });

  console.log('Connected to MySQL database:', process.env.DB_NAME || 'viettuoraudio');

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  // Truncate tables to ensure a clean slate
  const tablesToTruncate = [
    'revenue_daily',
    'analytics_daily_stall',
    'commission_earnings',
    'wallet_transactions',
    'top_up_requests',
    'vendor_wallets',
    'payments',
    'play_history',
    'visit_events',
    'qr_scan_events',
    'visitor_sessions',
    'qr_codes',
    'media_files',
    'poi_contents',
    'favorites',
    'tour_pois',
    'tours',
    'pois',
    'zones',
    'stalls',
    'vendor_subscriptions',
    'vendor_portal_users',
    'vendors',
    'subscription_plans',
    'audit_logs',
    'refresh_tokens',
    'app_settings',
    'payment_requests',
    'unlocked_tours'
  ];

  for (const table of tablesToTruncate) {
    console.log(`Truncating table ${table}...`);
    await connection.query(`TRUNCATE TABLE \`${table}\``);
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  // Get first user in DB to avoid FK error
  const [users] = await connection.query('SELECT id FROM users ORDER BY id LIMIT 1');
  if (users.length === 0) {
    console.error('CRITICAL: No users found in users table. Please run the main schema.sql first.');
    process.exit(1);
  }
  const adminId = users[0].id;

  // 1. Seed subscription plans
  console.log('Seeding subscription plans...');
  await connection.query(`
    INSERT INTO subscription_plans (id, code, name, price, billing_cycle, max_stalls, max_pois_per_stall, max_media_files, allow_premium_content, priority_support, is_active) VALUES
    (1, 'BASIC_MONTHLY', 'Basic Monthly', 299000.00, 'MONTHLY', 1, 1, 100, 0, 0, 1),
    (2, 'PREMIUM_MONTHLY', 'Premium Monthly', 599000.00, 'MONTHLY', 1, 1, 500, 1, 1, 1),
    (3, 'PRO_MONTHLY', 'Pro Monthly', 899000.00, 'MONTHLY', 1, 1, 1000, 1, 1, 1);
  `);

  // 2. Seed 10 Vendors
  console.log('Seeding 10 vendors...');
  await connection.query(`
    INSERT INTO vendors (id, legal_name, trade_name, slug, vendor_code, contact_name, contact_email, phone, address, status, approved_by_user_id, approved_at) VALUES
    (1, 'Vinh Khanh Food Company', 'Phố Ẩm Thực Vĩnh Khánh', 'pho-am-thuc-vinh-khanh', 'HCM-0001', 'Nguyễn Gia Bảo', 'bao@vinhkhanhfood.vn', '0902000001', 'Đường Vĩnh Khánh, Quận 4, TP.HCM', 'APPROVED', ?, NOW()),
    (2, 'Nguyen Hue Walking Street Co', 'Phố Đi Bộ Nguyễn Huệ', 'pho-di-bo-nguyen-hue', 'HCM-0002', 'Trần Minh Khôi', 'khoi@nguyenhue.vn', '0902000002', 'Nguyễn Huệ, Quận 1, TP.HCM', 'APPROVED', ?, NOW()),
    (3, 'Ben Thanh Market Foods', 'Chợ Bến Thành Food Tour', 'cho-ben-thanh-food-tour', 'HCM-0003', 'Lê Thị Hồng', 'hong@benthanh.vn', '0902000003', 'Chợ Bến Thành, Quận 1, TP.HCM', 'APPROVED', ?, NOW()),
    (4, 'Tan Dinh Heritage Coffee', 'Cà Phê Tân Định', 'ca-phe-tan-dinh', 'HCM-0004', 'Phạm Quốc Anh', 'anh@tandinhcoffee.vn', '0902000004', 'Hai Bà Trưng, Quận 1, TP.HCM', 'APPROVED', ?, NOW()),
    (5, 'Bui Vien Night Street Service', 'Phố Đêm Bùi Viện', 'pho-dem-bui-vien', 'HCM-0005', 'Võ Thành Nam', 'nam@buiviennight.vn', '0902000005', 'Bùi Viện, Quận 1, TP.HCM', 'APPROVED', ?, NOW()),
    (6, 'Saigon River Bach Dang Pier', 'Bến Bạch Đằng Sài Gòn', 'ben-bach-dang-sai-gon', 'HCM-0006', 'Đặng Mỹ Linh', 'linh@bachdangpier.vn', '0902000006', 'Bến Bạch Đằng, Quận 1, TP.HCM', 'APPROVED', ?, NOW()),
    (7, 'Cholon Heritage Kitchen', 'Ẩm Thực Chợ Lớn', 'am-thuc-cho-lon', 'HCM-0007', 'Hoàng Nhật Quang', 'quang@cholonfood.vn', '0902000007', 'Trần Hưng Đạo, Quận 5, TP.HCM', 'APPROVED', ?, NOW()),
    (8, 'Ho Thi Ky Flower Food Street', 'Hồ Thị Kỷ Food & Flower', 'ho-thi-ky-food-flower', 'HCM-0008', 'Bùi Ngọc Mai', 'mai@hothiky.vn', '0902000008', 'Hồ Thị Kỷ, Quận 10, TP.HCM', 'APPROVED', ?, NOW()),
    (9, 'Le Van Tam Park Weekend Market', 'Chợ Cuối Tuần Lê Văn Tám', 'cho-cuoi-tuan-le-van-tam', 'HCM-0009', 'Đỗ Hải Yến', 'yen@levanmarket.vn', '0902000009', 'Công viên Lê Văn Tám, Quận 1, TP.HCM', 'APPROVED', ?, NOW()),
    (10, 'Thu Thiem Riverside Experience', 'Bờ Sông Thủ Thiêm', 'bo-song-thu-thiem', 'HCM-0010', 'Ngô Minh Đức', 'duc@thuthiem.vn', '0902000010', 'Bờ sông Thủ Thiêm, TP. Thủ Đức, TP.HCM', 'APPROVED', ?, NOW());
  `, [adminId, adminId, adminId, adminId, adminId, adminId, adminId, adminId, adminId, adminId]);

  // 3. Seed Vendor Portal Users (Password is Vendor123)
  console.log('Seeding vendor portal users...');
  await connection.query(`
    INSERT INTO vendor_portal_users (id, vendor_id, email, pass_hash, full_name, status) VALUES
    (1, 1, 'bao@vinhkhanhfood.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Nguyễn Gia Bảo', 'ACTIVE'),
    (2, 2, 'khoi@nguyenhue.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Trần Minh Khôi', 'ACTIVE'),
    (3, 3, 'hong@benthanh.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Lê Thị Hồng', 'ACTIVE'),
    (4, 4, 'anh@tandinhcoffee.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Phạm Quốc Anh', 'ACTIVE'),
    (5, 5, 'nam@buiviennight.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Võ Thành Nam', 'ACTIVE'),
    (6, 6, 'linh@bachdangpier.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Đặng Mỹ Linh', 'ACTIVE'),
    (7, 7, 'quang@cholonfood.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Hoàng Nhật Quang', 'ACTIVE'),
    (8, 8, 'mai@hothiky.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Bùi Ngọc Mai', 'ACTIVE'),
    (9, 9, 'yen@levanmarket.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Đỗ Hải Yến', 'ACTIVE'),
    (10, 10, 'duc@thuthiem.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Ngô Minh Đức', 'ACTIVE');
  `);

  // 4. Seed subscriptions
  console.log('Seeding vendor subscriptions...');
  await connection.query(`
    INSERT INTO vendor_subscriptions (id, vendor_id, plan_id, status, period_start, period_end, trial_end, next_billing_date, payment_status, price_snapshot) VALUES
    (1, 1, 3, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 899000.00),
    (2, 2, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00),
    (3, 3, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00),
    (4, 4, 1, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 299000.00),
    (5, 5, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00),
    (6, 6, 1, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 299000.00),
    (7, 7, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00),
    (8, 8, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00),
    (9, 9, 1, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 299000.00),
    (10, 10, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00);
  `);

  // 5. Seed 5 Tours (Khu vực)
  console.log('Seeding 5 tours...');
  await connection.query(`
    INSERT INTO tours (id, vendor_id, name, slug, description, status, sort_order, is_premium, price, code) VALUES
    (1, 1, 'Khu phố ẩm thực Vĩnh Khánh', 'khu-pho-am-thuc-vinh-khanh', 'Trải nghiệm ẩm thực đêm, hải sản, ốc và nhịp sống nhộn nhịp tại Quận 4.', 'PUBLISHED', 1, 0, 0.00, 'VTA-TOUR-VK'),
    (2, 2, 'Trung tâm Sài Gòn Quận 1', 'trung-tam-sai-gon-quan-1', 'Tuyến đi bộ qua Nguyễn Huệ, Bến Thành, Bùi Viện và Bạch Đằng.', 'PUBLISHED', 2, 0, 0.00, 'VTA-TOUR-Q1'),
    (3, 7, 'Hương vị Chợ Lớn Quận 5', 'huong-vi-cho-lon-quan-5', 'Tuyến ẩm thực người Hoa, các tiệm ăn gia truyền và chợ truyền thống Quận 5.', 'PUBLISHED', 3, 1, 30000.00, 'VTA-TOUR-CL'),
    (4, 8, 'Hồ Thị Kỷ và Chợ Đêm Quận 10', 'ho-thi-ky-va-cho-dem-quan-10', 'Tuyến hoa tươi, ẩm thực đường phố độc đáo trong các ngõ hẻm Quận 10.', 'PUBLISHED', 4, 0, 0.00, 'VTA-TOUR-HTK'),
    (5, 10, 'Bờ sông Thủ Thiêm', 'bo-song-thu-thiem', 'Điểm ngắm hoàng hôn, skyline Quận 1 và khu công viên bờ sông mát mẻ.', 'PUBLISHED', 5, 1, 30000.00, 'VTA-TOUR-TT');
  `);

  // 6. Seed 10 Stalls (1 stall per Vendor)
  console.log('Seeding 10 stalls...');
  await connection.query(`
    INSERT INTO stalls (id, vendor_id, name, slug, description, address, latitude, longitude, activation_radius, status, opening_hours, is_featured, is_premium, priority_score, zone_code) VALUES
    (1, 1, 'Cổng Phố Vĩnh Khánh', 'cong-pho-vinh-khanh', 'Điểm bắt đầu tuyến ẩm thực đêm Vĩnh Khánh.', 'Vĩnh Khánh, Quận 4, TP.HCM', 10.7566600, 106.7065300, 50, 'APPROVED', '{"daily":"16:00-23:30"}', 1, 0, 90, 'HCM-Q4-VK-01'),
    (2, 2, 'Khu Hải Sản Vĩnh Khánh', 'khu-hai-san-vinh-khanh', 'Cụm quán hải sản và ốc nổi bật Quận 4.', 'Vĩnh Khánh, Quận 4, TP.HCM', 10.7559800, 106.7070500, 45, 'APPROVED', '{"daily":"17:00-23:30"}', 1, 1, 88, 'HCM-Q4-VK-02'),
    (3, 3, 'Tượng Đài Nguyễn Huệ', 'tuong-dai-nguyen-hue', 'Không gian quảng trường đi bộ trung tâm.', 'Nguyễn Huệ, Quận 1, TP.HCM', 10.7742400, 106.7034700, 60, 'APPROVED', '{"daily":"08:00-23:00"}', 1, 0, 95, 'HCM-Q1-NH-01'),
    (4, 4, 'Cổng Nam Chợ Bến Thành', 'cong-nam-cho-ben-thanh', 'Biểu tượng thương mại nổi tiếng trung tâm.', 'Chợ Bến Thành, Quận 1, TP.HCM', 10.7724800, 106.6980100, 55, 'APPROVED', '{"daily":"07:00-19:00"}', 1, 0, 92, 'HCM-Q1-BT-01'),
    (5, 5, 'Nhà Thờ Tân Định Pink', 'nha-tho-tan-dinh-pink', 'Kiến trúc nhà thờ màu hồng cổ kính Quận 1.', 'Hai Bà Trưng, Quận 1, TP.HCM', 10.7882900, 106.6905700, 45, 'APPROVED', '{"daily":"07:00-21:00"}', 0, 0, 80, 'HCM-Q1-TD-01'),
    (6, 6, 'Cổng Phố Đi Bộ Bùi Viện', 'cong-pho-di-bo-bui-vien', 'Trục đường phố đi bộ sôi động về đêm.', 'Bùi Viện, Quận 1, TP.HCM', 10.7676100, 106.6947800, 55, 'APPROVED', '{"daily":"18:00-02:00"}', 1, 1, 85, 'HCM-Q1-BV-01'),
    (7, 7, 'Bến Tàu Bạch Đằng River', 'ben-tau-bach-dang-river', 'Bến tàu dạo mát ven sông Sài Gòn.', 'Bến Bạch Đằng, Quận 1, TP.HCM', 10.7748600, 106.7062800, 60, 'APPROVED', '{"daily":"06:00-23:00"}', 1, 0, 86, 'HCM-Q1-BD-01'),
    (8, 8, 'Cổng Chợ Lớn Quận 5', 'cong-cho-lon-quan-5', 'Trái tim phố cổ và ẩm thực người Hoa.', 'Trần Hưng Đạo, Quận 5, TP.HCM', 10.7547500, 106.6637100, 60, 'APPROVED', '{"daily":"07:00-22:00"}', 1, 1, 87, 'HCM-Q5-CL-01'),
    (9, 9, 'Chợ Hoa Đêm Hồ Thị Kỷ', 'cho-hoa-dem-ho-thi-ky', 'Khu ăn vặt và hoa tươi bán sỉ Quận 10.', 'Hồ Thị Kỷ, Quận 10, TP.HCM', 10.7631200, 106.6707200, 50, 'APPROVED', '{"daily":"08:00-23:00"}', 1, 0, 89, 'HCM-Q10-HTK-01'),
    (10, 10, 'Đầu Bờ Sông Thủ Thiêm', 'dau-bo-song-thu-thiem', 'Không gian thư giãn ven sông mới của giới trẻ.', 'Bờ sông Thủ Thiêm, TP. Thủ Đức, TP.HCM', 10.7759300, 106.7142600, 65, 'APPROVED', '{"daily":"06:00-23:00"}', 1, 1, 91, 'HCM-TD-TT-01');
  `);

  // 7. Seed 10 POIs/Zones (1 POI per Stall/Vendor, mapped to Tours)
  console.log('Seeding 10 POIs/Zones...');
  await connection.query(`
    INSERT INTO pois (id, stall_id, zone_code, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order, approval_status) VALUES
    (1, 1, 'HCM-Q4-VK-01', 2, 'Cổng phố Vĩnh Khánh', 'cong-pho-vinh-khanh', 'Điểm mở đầu tuyến âm thanh phố ẩm thực Vĩnh Khánh.', 10.7566600, 106.7065300, 25, 0, 'ACTIVE', 1, 'APPROVED'),
    (2, 2, 'HCM-Q4-VK-02', 2, 'Khu ốc nướng Vĩnh Khánh', 'khu-oc-nuong-vinh-khanh', 'Câu chuyện về văn hóa ăn ốc và món nướng Quận 4.', 10.7559800, 106.7070500, 25, 1, 'ACTIVE', 2, 'APPROVED'),
    (3, 3, 'HCM-Q1-NH-01', 2, 'Tượng đài Nguyễn Huệ', 'tuong-dai-nguyen-hue', 'Không gian trung tâm của phố đi bộ Nguyễn Huệ.', 10.7742400, 106.7034700, 30, 0, 'ACTIVE', 1, 'APPROVED'),
    (4, 4, 'HCM-Q1-BT-01', 2, 'Cổng Nam Chợ Bến Thành', 'cong-nam-cho-ben-thanh', 'Biểu tượng nhận diện của khu chợ trung tâm.', 10.7724800, 106.6980100, 28, 0, 'ACTIVE', 1, 'APPROVED'),
    (5, 5, 'HCM-Q1-TD-01', 2, 'Mặt tiền Nhà Thờ Tân Định', 'mat-tien-nha-tho-tan-dinh', 'Kiến trúc màu hồng và câu chuyện khu Tân Định.', 10.7882900, 106.6905700, 30, 1, 'ACTIVE', 1, 'APPROVED'),
    (6, 6, 'HCM-Q1-BV-01', 2, 'Cổng phố Bùi Viện', 'cong-pho-bui-vien', 'Điểm bắt đầu tuyến phố đêm sôi động.', 10.7676100, 106.6947800, 30, 0, 'ACTIVE', 1, 'APPROVED'),
    (7, 7, 'HCM-Q1-BD-01', 2, 'Bến tàu Bạch Đằng', 'ben-tau-bach-dang', 'Điểm kết nối tour sông và không gian dạo bộ.', 10.7748600, 106.7062800, 30, 0, 'ACTIVE', 2, 'APPROVED'),
    (8, 8, 'HCM-Q5-CL-01', 2, 'Cổng Chợ Lớn', 'cong-cho-lon', 'Không khí mua bán và dấu ấn văn hóa người Hoa.', 10.7547500, 106.6637100, 30, 0, 'ACTIVE', 1, 'APPROVED'),
    (9, 9, 'HCM-Q10-HTK-01', 2, 'Lối vào Chợ Hồ Thị Kỷ', 'loi-vao-cho-ho-thi-ky', 'Tuyến hẻm hoa và món ăn vặt nổi tiếng.', 10.7631200, 106.6707200, 28, 0, 'ACTIVE', 1, 'APPROVED'),
    (10, 10, 'HCM-TD-TT-01', 2, 'Bãi cỏ bờ sông Thủ Thiêm', 'bai-co-bo-song-thu-thiem', 'Điểm ngắm skyline và gió sông Sài Gòn.', 10.7759300, 106.7142600, 35, 0, 'ACTIVE', 1, 'APPROVED');
  `);

  await connection.query(`
    INSERT INTO zones (id, tour_id, stall_id, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order, approval_status) VALUES
    (1, 1, 1, 2, 'Cổng phố Vĩnh Khánh', 'cong-pho-vinh-khanh', 'Điểm mở đầu tuyến âm thanh phố ẩm thực Vĩnh Khánh.', 10.7566600, 106.7065300, 25, 0, 'ACTIVE', 1, 'APPROVED'),
    (2, 1, 2, 2, 'Khu ốc nướng Vĩnh Khánh', 'khu-oc-nuong-vinh-khanh', 'Câu chuyện về văn hóa ăn ốc và món nướng Quận 4.', 10.7559800, 106.7070500, 25, 1, 'ACTIVE', 2, 'APPROVED'),
    (3, 2, 3, 2, 'Tượng đài Nguyễn Huệ', 'tuong-dai-nguyen-hue', 'Không gian trung tâm của phố đi bộ Nguyễn Huệ.', 10.7742400, 106.7034700, 30, 0, 'ACTIVE', 1, 'APPROVED'),
    (4, 2, 4, 2, 'Cổng Nam Chợ Bến Thành', 'cong-nam-cho-ben-thanh', 'Biểu tượng nhận diện của khu chợ trung tâm.', 10.7724800, 106.6980100, 28, 0, 'ACTIVE', 1, 'APPROVED'),
    (5, 2, 5, 2, 'Mặt tiền Nhà Thờ Tân Định', 'mat-tien-nha-tho-tan-dinh', 'Kiến trúc màu hồng và câu chuyện khu Tân Định.', 10.7882900, 106.6905700, 30, 1, 'ACTIVE', 1, 'APPROVED'),
    (6, 2, 6, 2, 'Cổng phố Bùi Viện', 'cong-pho-bui-vien', 'Điểm bắt đầu tuyến phố đêm sôi động.', 10.7676100, 106.6947800, 30, 0, 'ACTIVE', 1, 'APPROVED'),
    (7, 2, 7, 2, 'Bến tàu Bạch Đằng', 'ben-tau-bach-dang', 'Điểm kết nối tour sông và không gian dạo bộ.', 10.7748600, 106.7062800, 30, 0, 'ACTIVE', 2, 'APPROVED'),
    (8, 3, 8, 2, 'Cổng Chợ Lớn', 'cong-cho-lon', 'Không khí mua bán và dấu ấn văn hóa người Hoa.', 10.7547500, 106.6637100, 30, 0, 'ACTIVE', 1, 'APPROVED'),
    (9, 4, 9, 2, 'Lối vào Chợ Hồ Thị Kỷ', 'loi-vao-cho-ho-thi-ky', 'Tuyến hẻm hoa và món ăn vặt nổi tiếng.', 10.7631200, 106.6707200, 28, 0, 'ACTIVE', 1, 'APPROVED'),
    (10, 5, 10, 2, 'Bãi cỏ bờ sông Thủ Thiêm', 'bai-co-bo-song-thu-thiem', 'Điểm ngắm skyline và gió sông Sài Gòn.', 10.7759300, 106.7142600, 35, 0, 'ACTIVE', 1, 'APPROVED');
  `);

  // 8. Seed tour_pois
  console.log('Seeding tour_pois links...');
  await connection.query(`
    INSERT INTO tour_pois (tour_id, poi_id, sort_order) VALUES
    (1, 1, 1), (1, 2, 2),
    (2, 3, 1), (2, 4, 2), (2, 5, 3), (2, 6, 4), (2, 7, 5),
    (3, 8, 1),
    (4, 9, 1),
    (5, 10, 1);
  `);

  // 9. Seed poi_contents
  console.log('Seeding poi_contents...');
  await connection.query(`
    INSERT INTO poi_contents (id, poi_id, lang, title, short_text, tts_script, audio_url, voice_profile, approval_status) VALUES
    (1, 1, 'vi', 'Cổng phố Vĩnh Khánh', 'Điểm bắt đầu phố ẩm thực Quận 4.', 'Bạn đang đứng ở cổng phố Vĩnh Khánh, nơi mùi món nướng, tiếng xe máy và tiếng gọi món tạo nên nhịp sống đêm rất riêng của Quận 4.', '/uploads/audio/hcm/poi-1-vi.mp3', 'vi-standard', 'approved'),
    (2, 1, 'en', 'Vinh Khanh Street Gate', 'Starting point of District 4 food street.', 'You are at the entrance of Vinh Khanh Street, where grilled food, scooters, and lively voices shape District 4 night culture.', '/uploads/audio/hcm/poi-1-en.mp3', 'en-standard', 'approved'),
    (3, 2, 'vi', 'Khu ốc nướng Vĩnh Khánh', 'Hương vị ốc nướng đêm Sài Gòn.', 'Khu ốc nướng Vĩnh Khánh nổi bật với bếp than, nước chấm cay và thói quen ngồi lâu cùng bạn bè sau giờ làm.', '/uploads/audio/hcm/poi-2-vi.mp3', 'vi-premium', 'approved'),
    (4, 2, 'en', 'Vinh Khanh Grilled Snails', 'Night grilled snails in Saigon.', 'This area is known for charcoal grills, spicy dipping sauces, and long casual meals with friends after work.', '/uploads/audio/hcm/poi-2-en.mp3', 'en-premium', 'approved'),
    (5, 3, 'vi', 'Tượng đài Nguyễn Huệ', 'Trung tâm phố đi bộ.', 'Tượng đài là điểm định hướng của phố đi bộ Nguyễn Huệ, nơi người dân và du khách thường hẹn gặp trước khi dạo phố.', '/uploads/audio/hcm/poi-5-vi.mp3', 'vi-standard', 'approved'),
    (6, 3, 'en', 'Nguyen Hue Statue', 'Center of the walking street.', 'The statue is a landmark of Nguyen Hue Walking Street and a common meeting point before an evening walk.', '/uploads/audio/hcm/poi-5-en.mp3', 'en-standard', 'approved'),
    (7, 4, 'vi', 'Cổng Nam Chợ Bến Thành', 'Biểu tượng chợ Sài Gòn.', 'Cổng Nam Chợ Bến Thành là hình ảnh quen thuộc khi nhắc đến khu chợ trung tâm và lịch sử thương mại của Sài Gòn.', '/uploads/audio/hcm/poi-7-vi.mp3', 'vi-standard', 'approved'),
    (8, 4, 'en', 'Ben Thanh South Gate', 'A Saigon market symbol.', 'The south gate is one of the most recognizable images of Ben Thanh Market and central Saigon commerce.', '/uploads/audio/hcm/poi-7-en.mp3', 'en-standard', 'approved'),
    (9, 5, 'vi', 'Mặt tiền Nhà Thờ Tân Định', 'Kiến trúc màu hồng nổi bật.', 'Mặt tiền màu hồng của Nhà Thờ Tân Định khiến nơi đây trở thành một điểm nhận diện đặc biệt của khu vực.', '/uploads/audio/hcm/poi-9-vi.mp3', 'vi-premium', 'approved'),
    (10, 5, 'en', 'Tan Dinh Church Facade', 'The iconic pink facade.', 'The pink facade makes Tan Dinh Church a distinctive landmark in the neighborhood.', '/uploads/audio/hcm/poi-9-en.mp3', 'en-premium', 'approved'),
    (11, 6, 'vi', 'Cổng phố Bùi Viện', 'Lối vào khu phố đêm.', 'Cổng phố Bùi Viện mở ra một không gian nhiều âm thanh, ánh sáng và dịch vụ giải trí ban đêm.', '/uploads/audio/hcm/poi-11-vi.mp3', 'vi-standard', 'approved'),
    (12, 6, 'en', 'Bui Vien Entrance', 'Gateway to the night street.', 'The entrance to Bùi Viện opens into a soundscape of lights, music, and nightlife services.', '/uploads/audio/hcm/poi-11-en.mp3', 'en-standard', 'approved'),
    (13, 7, 'vi', 'Bến tàu Bạch Đằng', 'Điểm kết nối tour sông.', 'Bến tàu là nơi chuyển tiếp từ trải nghiệm đi bộ sang trải nghiệm nhìn thành phố từ mặt nước.', '/uploads/audio/hcm/poi-14-vi.mp3', 'vi-standard', 'approved'),
    (14, 7, 'en', 'Bach Dang Pier', 'Connection to river tours.', 'The pier links walking routes with the experience of seeing the city from the river.', '/uploads/audio/hcm/poi-14-en.mp3', 'en-standard', 'approved'),
    (15, 8, 'vi', 'Cổng Chợ Lớn', 'Không khí thương mại Quận 5.', 'Chợ Lớn mang không khí thương mại lâu đời, kết hợp bảng hiệu, tiếng rao và văn hóa cộng đồng người Hoa.', '/uploads/audio/hcm/poi-15-vi.mp3', 'vi-standard', 'approved'),
    (16, 8, 'en', 'Cholon Gate', 'District 5 commerce atmosphere.', 'Cholon carries a long-standing trade atmosphere, mixing signs, street calls, and Chinese-Vietnamese community culture.', '/uploads/audio/hcm/poi-15-en.mp3', 'en-standard', 'approved'),
    (17, 9, 'vi', 'Lối vào Chợ Hồ Thị Kỷ', 'Hẻm hoa và món ăn vặt.', 'Lối vào Hồ Thị Kỷ mở ra không gian hẻm nhỏ, xe đẩy, quầy hoa và mùi món ăn vặt.', '/uploads/audio/hcm/poi-17-vi.mp3', 'vi-standard', 'approved'),
    (18, 9, 'en', 'Ho Thi Ky Market Entrance', 'Flowers and street snacks.', 'The entrance opens into narrow alleys with carts, flower stalls, and the aroma of street snacks.', '/uploads/audio/hcm/poi-17-en.mp3', 'en-standard', 'approved'),
    (19, 10, 'vi', 'Bãi cỏ bờ sông Thủ Thiêm', 'Gió sông và skyline.', 'Từ bãi cỏ ven sông, bạn có thể nghe gió thổi qua mặt nước và nhìn về đường chân trời Quận 1.', '/uploads/audio/hcm/poi-19-vi.mp3', 'vi-standard', 'approved'),
    (20, 10, 'en', 'Thu Thiem Riverside Lawn', 'River breeze and skyline.', 'From the riverside lawn, you can feel the breeze and look toward the District 1 skyline.', '/uploads/audio/hcm/poi-19-en.mp3', 'en-standard', 'approved');
  `);

  // 10. Seed media_files (Images for POIs)
  console.log('Seeding media_files images...');
  await connection.query(`
    INSERT INTO media_files (id, vendor_id, stall_id, poi_id, uploaded_by_user_id, file_type, storage_provider, file_name, file_path, public_url, mime_type, file_size, moderation_status) VALUES
    (1, 1, 1, 1, ?, 'IMAGE', 'LOCAL', 'vinh-khanh-1.jpg', '/uploads/hcm/vinh-khanh-1.jpg', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=250&fit=crop', 'image/jpeg', 280000, 'APPROVED'),
    (2, 2, 2, 2, ?, 'IMAGE', 'LOCAL', 'vinh-khanh-2.jpg', '/uploads/hcm/vinh-khanh-2.jpg', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=250&fit=crop', 'image/jpeg', 320000, 'APPROVED'),
    (3, 3, 3, 3, ?, 'IMAGE', 'LOCAL', 'nguyen-hue.jpg', '/uploads/hcm/nguyen-hue.jpg', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop', 'image/jpeg', 420000, 'APPROVED'),
    (4, 4, 4, 4, ?, 'IMAGE', 'LOCAL', 'ben-thanh.jpg', '/uploads/hcm/ben-thanh.jpg', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'image/jpeg', 390000, 'APPROVED'),
    (5, 5, 5, 5, ?, 'IMAGE', 'LOCAL', 'tan-dinh.jpg', '/uploads/hcm/tan-dinh.jpg', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=250&fit=crop', 'image/jpeg', 350000, 'APPROVED'),
    (6, 6, 6, 6, ?, 'IMAGE', 'LOCAL', 'bui-vien.jpg', '/uploads/hcm/bui-vien.jpg', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop', 'image/jpeg', 410000, 'APPROVED'),
    (7, 7, 7, 7, ?, 'IMAGE', 'LOCAL', 'bach-dang.jpg', '/uploads/hcm/bach-dang.jpg', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=250&fit=crop', 'image/jpeg', 450000, 'APPROVED'),
    (8, 8, 8, 8, ?, 'IMAGE', 'LOCAL', 'cholon.jpg', '/uploads/hcm/cholon.jpg', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=250&fit=crop', 'image/jpeg', 400000, 'APPROVED'),
    (9, 9, 9, 9, ?, 'IMAGE', 'LOCAL', 'ho-thi-ky.jpg', '/uploads/hcm/ho-thi-ky.jpg', 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=250&fit=crop', 'image/jpeg', 380000, 'APPROVED'),
    (10, 10, 10, 10, ?, 'IMAGE', 'LOCAL', 'thu-thiem.jpg', '/uploads/hcm/thu-thiem.jpg', 'https://images.unsplash.com/photo-1473093290043-c94126c7e609?w=400&h=250&fit=crop', 'image/jpeg', 450000, 'APPROVED');
  `, Array(10).fill(adminId));

  // 11. Seed QR Codes
  console.log('Seeding qr_codes...');
  await connection.query(`
    INSERT INTO qr_codes (id, vendor_id, tour_id, stall_id, poi_id, code, qr_type, target_url, image_url, is_active) VALUES
    (1, 1, 1, NULL, NULL, 'VTA-TOUR-0001', 'TOUR', 'https://app.viettouraudio.vn/tour/khu-pho-am-thuc-vinh-khanh', '/qr/hcm/tour-vinh-khanh.png', 1),
    (2, 2, 2, NULL, NULL, 'VTA-TOUR-0002', 'TOUR', 'https://app.viettouraudio.vn/tour/trung-tam-sai-gon-quan-1', '/qr/hcm/tour-q1.png', 1),
    (3, 7, 3, NULL, NULL, 'VTA-TOUR-0003', 'TOUR', 'https://app.viettouraudio.vn/tour/huong-vi-cho-lon-quan-5', '/qr/hcm/tour-cholon.png', 1),
    (4, 8, 4, NULL, NULL, 'VTA-TOUR-0004', 'TOUR', 'https://app.viettouraudio.vn/tour/ho-thi-ky-va-cho-dem-quan-10', '/qr/hcm/tour-ho-thi-ky.png', 1),
    (5, 10, 5, NULL, NULL, 'VTA-TOUR-0005', 'TOUR', 'https://app.viettouraudio.vn/tour/bo-song-thu-thiem', '/qr/hcm/tour-thu-thiem.png', 1),
    (6, 1, NULL, 1, NULL, 'VTA-HCM-ST-VK01', 'STALL', 'https://app.viettouraudio.vn/map?stall=1', '/qr/hcm/stall-vk01.png', 1),
    (7, 2, NULL, 2, NULL, 'VTA-HCM-ST-VK02', 'STALL', 'https://app.viettouraudio.vn/map?stall=2', '/qr/hcm/stall-vk02.png', 1),
    (8, 3, NULL, 3, NULL, 'VTA-HCM-ST-NH01', 'STALL', 'https://app.viettouraudio.vn/map?stall=3', '/qr/hcm/stall-nh01.png', 1),
    (9, 4, NULL, 4, NULL, 'VTA-HCM-ST-BT01', 'STALL', 'https://app.viettouraudio.vn/map?stall=4', '/qr/hcm/stall-bt01.png', 1),
    (10, 10, NULL, 10, NULL, 'VTA-HCM-ST-TT01', 'STALL', 'https://app.viettouraudio.vn/map?stall=10', '/qr/hcm/stall-tt01.png', 1);
  `);

  // 12. Seed vendor wallets
  console.log('Seeding vendor_wallets...');
  await connection.query(`
    INSERT INTO vendor_wallets (id, vendor_id, balance, total_top_up, total_spent, total_commission) VALUES
    (1, 1, 500000.00, 500000.00, 0.00, 0.00),
    (2, 2, 500000.00, 500000.00, 0.00, 0.00),
    (3, 3, 500000.00, 500000.00, 0.00, 0.00),
    (4, 4, 500000.00, 500000.00, 0.00, 0.00),
    (5, 5, 500000.00, 500000.00, 0.00, 0.00),
    (6, 6, 500000.00, 500000.00, 0.00, 0.00),
    (7, 7, 500000.00, 500000.00, 0.00, 0.00),
    (8, 8, 500000.00, 500000.00, 0.00, 0.00),
    (9, 9, 500000.00, 500000.00, 0.00, 0.00),
    (10, 10, 500000.00, 500000.00, 0.00, 0.00);
  `);

  // 13. Seed app_settings
  console.log('Seeding app_settings...');
  await connection.query(`
    INSERT INTO app_settings (\`key\`, \`value\`) VALUES
    ('PREMIUM_PAYMENT_QR', '970403:123456789:NHOM_VTA:NGUYEN VAN A'),
    ('DEFAULT_CITY', 'TP. Hồ Chí Minh'),
    ('DEFAULT_MAP_CENTER', '{"lat":10.7769,"lng":106.7009,"zoom":13}'),
    ('SEED_PROFILE', 'HCMC_1VENDOR_1POI_INTEGRATED');
  `);

  console.log('Database re-seeded successfully with 1-Vendor 1-POI rule constraints!');
  await connection.end();
}

run().catch(err => {
  console.error('Re-seed script failed:', err);
  process.exit(1);
});
