-- =============================================================================
-- VietTourAudio — Production Seed Data (Hà Tôn Quyền Sủi Cảo walking tour ONLY)
-- All coordinates strictly within HCMC (Hà Tôn Quyền area: Lat ~10.7601x, Lng ~106.6575x)
-- =============================================================================

USE viettuoraudio;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE unlocked_tours;
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
-- VENDORS — Authentic Hà Tôn Quyền vendors
-- =============================================================================

INSERT INTO vendors (id, legal_name, trade_name, slug, vendor_code, assigned_tour_id, contact_name, contact_email, phone, address, status, approved_by_user_id, approved_at) VALUES
(1, 'Công ty TNHH Sủi Cảo Thiên Thiên', 'Sủi Cảo Thiên Thiên', 'sui-cao-thien-thien', 'VND-HTQ01', 1, 'Lâm Thiên', 'thienthien@viettuoraudio.vn', '02838561111', '197 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 'APPROVED', 2, '2026-06-01 09:00:00'),
(2, 'Hộ Kinh Doanh Sủi Cảo Ngọc Ý', 'Sủi Cảo Ngọc Ý', 'sui-cao-ngoc-y', 'VND-HTQ02', 1, 'Trương Ngọc Ý', 'ngocy@viettuoraudio.vn', '02839556666', '187 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 'APPROVED', 2, '2026-06-01 09:10:00'),
(3, 'Hộ Kinh Doanh Sủi Cảo Như Ý', 'Sủi Cảo Như Ý', 'sui-cao-nhu-y', 'VND-HTQ03', 1, 'Lý Như Ý', 'nhuy@viettuoraudio.vn', '02839558888', '185 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 'APPROVED', 2, '2026-06-01 09:20:00');

-- =============================================================================
-- VENDOR PORTAL USERS — Password: Vendor123
-- Hash: $2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i
-- =============================================================================

INSERT INTO vendor_portal_users (id, vendor_id, email, pass_hash, full_name, status) VALUES
(1, 1, 'thienthien@viettuoraudio.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Lâm Thiên', 'ACTIVE'),
(2, 2, 'ngocy@viettuoraudio.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Trương Ngọc Ý', 'ACTIVE'),
(3, 3, 'nhuy@viettuoraudio.vn', '$2b$10$afK1gYIdqdoDOuXchqHNAOCdHGB5gxOyUwnJipKLMcbAqVlfA4F3i', 'Lý Như Ý', 'ACTIVE');

-- =============================================================================
-- VENDOR SUBSCRIPTIONS & WALLETS
-- =============================================================================

INSERT INTO vendor_subscriptions (id, vendor_id, plan_id, status, period_start, period_end, trial_end, next_billing_date, payment_status, price_snapshot) VALUES
(1, 1, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00),
(2, 2, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00),
(3, 3, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, '2026-06-30', 'paid', 599000.00);

INSERT INTO vendor_wallets (id, vendor_id, balance, promo_balance, created_at, updated_at) VALUES
(1, 1, 2500000.00, 500000.00, NOW(), NOW()),
(2, 2, 1800000.00, 200000.00, NOW(), NOW()),
(3, 3, 3200000.00, 800000.00, NOW(), NOW());

-- =============================================================================
-- TOURS — Food walking tour on Hà Tôn Quyền Street
-- =============================================================================

INSERT INTO tours (id, vendor_id, name, slug, description, latitude, longitude, status, sort_order, is_premium) VALUES
(1, 1, 'Tour Ẩm Thực Phố Sủi Cảo Hà Tôn Quyền - Quận 11', 'sui-cao-ha-ton-quyen', 'Hành trình khám phá con phố sủi cảo người Hoa sầm uất bậc nhất Sài Gòn tại Quận 11.', 10.7601660, 106.6575190, 'PUBLISHED', 1, 1);

-- =============================================================================
-- STALLS — Physical location details on the street map
-- =============================================================================

INSERT INTO stalls (id, vendor_id, name, slug, description, address, latitude, longitude, activation_radius, status, opening_hours, is_featured, is_premium, is_premium_priority, premium_activation_date, premium_expiry_date, priority_score, zone_code) VALUES
(1, 1, 'Sủi Cảo Thiên Thiên', 'sui-cao-thien-thien-primary', 'Quán sủi cảo lâu đời với không gian rộng rãi, nổi tiếng với nước lèo thanh ngọt nấu từ xương và mực khô.', '197 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 10.7600860, 106.6576820, 10, 'APPROVED', '{"daily":"14:00-01:30"}', 1, 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 'STALL-01'),
(2, 2, 'Sủi Cảo Ngọc Ý', 'sui-cao-ngoc-y-primary', 'Được lòng thực khách nhờ sủi cảo to tròn, vỏ mỏng dai mịn ôm trọn nhân tôm thịt tươi ngon giòn sần sật.', '187 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 10.7602350, 106.6574710, 10, 'APPROVED', '{"daily":"13:00-01:00"}', 1, 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 'STALL-02'),
(3, 3, 'Sủi Cảo Như Ý', 'sui-cao-nhu-y-primary', 'Nơi bán sủi cảo chiên giòn rụm chấm nước sốt xí muội cực phẩm và món sủi cảo chưng cách thủy nhân hẹ thơm lừng.', '185 Hà Tôn Quyền, Phường 4, Quận 11, TP.HCM', 10.7601950, 106.6575000, 10, 'APPROVED', '{"daily":"14:00-01:00"}', 1, 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 'STALL-03');

-- =============================================================================
-- ZONES (Sub-areas for tour structure) — Backfilled matching Pois
-- =============================================================================

INSERT INTO zones (id, tour_id, stall_id, vendor_id, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order, approval_status) VALUES
(1, 1, 1, 1, 2, 'Sủi Cảo Thiên Thiên', 'sui-cao-thien-thien-poi', 'Quán sủi cảo lâu đời với không gian rộng rãi, nổi tiếng với nước lèo thanh ngọt nấu từ xương và mực khô.', 10.7600860, 106.6576820, 10, 1, 'ACTIVE', 1, 'APPROVED'),
(2, 1, 2, 2, 2, 'Sủi Cảo Ngọc Ý', 'sui-cao-ngoc-y-poi', 'Được lòng thực khách nhờ sủi cảo to tròn, vỏ mỏng dai mịn ôm trọn nhân tôm thịt tươi ngon giòn sần sật.', 10.7602350, 106.6574710, 10, 1, 'ACTIVE', 2, 'APPROVED'),
(3, 1, 3, 3, 2, 'Sủi Cảo Như Ý', 'sui-cao-nhu-y-poi', 'Nơi bán sủi cảo chiên giòn rụm chấm nước sốt xí muội cực phẩm và món sủi cảo chưng cách thủy nhân hẹ thơm lừng.', 10.7601950, 106.6575000, 10, 1, 'ACTIVE', 3, 'APPROVED');

-- =============================================================================
-- POIs (Unified with zones)
-- =============================================================================

INSERT INTO pois (id, stall_id, vendor_id, zone_code, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order, approval_status) VALUES
(1, 1, 1, 'STALL-01', 2, 'Sủi Cảo Thiên Thiên', 'sui-cao-thien-thien-poi', 'Quán sủi cảo lâu đời với không gian rộng rãi, nổi tiếng với nước lèo thanh ngọt nấu từ xương và mực khô.', 10.7600860, 106.6576820, 10, 1, 'ACTIVE', 1, 'APPROVED'),
(2, 2, 2, 'STALL-02', 2, 'Sủi Cảo Ngọc Ý', 'sui-cao-ngoc-y-poi', 'Được lòng thực khách nhờ sủi cảo to tròn, vỏ mỏng dai mịn ôm trọn nhân tôm thịt tươi ngon giòn sần sật.', 10.7602350, 106.6574710, 10, 1, 'ACTIVE', 2, 'APPROVED'),
(3, 3, 3, 'STALL-03', 2, 'Sủi Cảo Như Ý', 'sui-cao-nhu-y-poi', 'Nơi bán sủi cảo chiên giòn rụm chấm nước sốt xí muội cực phẩm và món sủi cảo chưng cách thủy nhân hẹ thơm lừng.', 10.7601950, 106.6575000, 10, 1, 'ACTIVE', 3, 'APPROVED');

-- =============================================================================
-- TOUR ↔ POI LINK
-- =============================================================================

INSERT INTO tour_pois (tour_id, poi_id, sort_order) VALUES
(1, 1, 1),
(1, 2, 2),
(1, 3, 3);

-- =============================================================================
-- POI CONTENTS — Rich bilingual & multilingual auto translation strings for TTS
-- =============================================================================

INSERT INTO poi_contents (id, poi_id, lang, title, tts_script, voice_type, approval_status) VALUES
-- Sủi Cảo Thiên Thiên
(1, 1, 'vi', 'Sủi Cảo Thiên Thiên', 'Chào mừng bạn đến với sủi cảo Thiên Thiên, một trong những quán ăn lâu đời và nổi tiếng nhất tại phố ẩm thực Hà Tôn Quyền. Món sủi cảo ở đây nổi tiếng với nhân tôm thịt tươi giòn sần sật ôm trọn trong vỏ bánh mỏng mịn. Nước dùng được hầm kỹ từ xương ống heo cùng mực khô nướng đem lại hậu vị thanh mát ngọt đậm đà khó quên.', 'NORMAL', 'APPROVED'),
(2, 1, 'en', 'Thien Thien Dumplings', 'Welcome to Thien Thien Dumplings, one of the oldest and most legendary eateries on Ha Ton Quyen Food Street. Our dumplings are famous for their thin, smooth wraps holding fresh, crunchy shrimp and pork filling. The broth is simmered with pork bones and grilled dried squid, delivering a uniquely sweet, savory, and unforgettable aftertaste.', 'NORMAL', 'APPROVED'),
(3, 1, 'zh', '天天水饺', '欢迎光临天天水饺，这是哈尊权美食街上最古老且最具传奇色彩的餐厅之一。我们的水饺以皮薄滑嫩、内馅鲜美弹牙的鲜虾猪肉馅而闻名。汤底由猪骨和烤干鱿鱼熬制而成，带来独特的鲜甜回味，令人难忘。', 'NORMAL', 'APPROVED'),
(4, 1, 'ja', 'ティエンティエン水餃子', 'ハトンクエン・フードストリートで最も歴史があり、有名なレストランの一つであるティエンティエン水餃子へようこそ。ここの餃子は、薄く滑らかな皮の中に、新鮮でプリプリしたエビと豚肉 of 餡がぎっしり詰まっていることで有名です。スープは豚骨と焼きスルメをじっくり煮込んで作られており、独特の甘みとコクのある後味が楽しめます。', 'NORMAL', 'APPROVED'),
(5, 1, 'ko', '티엔티엔 물만두', '하톤꾸옌 음식 거리에서 가장 오래되고 전설적인 맛집 중 하나인 티엔티엔 물만두에 오신 것을 환영합니다. 저희 만두는 얇고 부드러운 만두피 속에 신선하고 탱글탱글한 새우와 돼지고기 소가 가득 차 있는 것으로 유명합니다. 육수는 돼지뼈와 구운 마른 오징어를 함께 우려내어 잊을 수 없는 깊고 달콤한 감칠맛을 선사합니다.', 'NORMAL', 'APPROVED'),

-- Sủi Cảo Ngọc Ý
(6, 2, 'vi', 'Sủi Cảo Ngọc Ý', 'Sủi cảo Ngọc Ý là điểm dừng chân lý tưởng dành cho tín đồ yêu thích sủi cảo truyền thống Trung Hoa. Với công thức chế biến gia truyền qua nhiều thế hệ, từng viên sủi cảo tròn mập mạp đều tăm tắp, nhân bên trong đầy đặn đậm vị. Nước súp hầm mực khô đặc trưng giúp làm dậy mùi thơm ngào ngạt ăn kèm cải ngọt giòn mát.', 'NORMAL', 'APPROVED'),
(7, 2, 'en', 'Ngoc Y Dumplings', 'Ngoc Y Dumplings is the perfect stop for lovers of traditional Chinese dumplings. Using a legacy recipe passed down through generations, each dumpling is plump, perfectly wrapped, and bursting with seasoned filling. The signature dried squid broth raises the rich aroma, served alongside crunchy sweet cabbage.', 'NORMAL', 'APPROVED'),
(8, 2, 'zh', '玉意水饺', '玉意水饺是喜爱传统中式水饺的食客的理想去处。采用代代相传的秘方，每一颗水饺都圆润饱满、皮薄馅大、调味恰到好处。招牌干鱿鱼汤头香气四溢，搭配爽口的甜白菜，更是美味加倍。', 'NORMAL', 'APPROVED'),

-- Sủi Cảo Như Ý
(9, 3, 'vi', 'Sủi Cảo Như Ý', 'Sủi cảo Như Ý mang đến sự đổi mới độc đáo với món sủi cảo chiên giòn rụm vàng ươm, khi cắn vào vỏ ngoài giòn tan bên trong nóng hổi mọng nước. Quán ăn nổi tiếng với các phần súp thập cẩm ăn kèm da heo phồng, mực ngâm tro và các loại rau thanh mát mang đậm nét ẩm thực của người Hoa Chợ Lớn.', 'NORMAL', 'APPROVED'),
(10, 3, 'en', 'Nhu Y Dumplings', 'Nhu Y Dumplings offers a unique twist with golden, crispy fried dumplings that are crunchy on the outside and juicy on the inside. We are famous for our combination soups featuring pork skin, ash-soaked squid, and fresh greens, reflecting the authentic culinary traditions of Cholon Chinese-Vietnamese culture.', 'NORMAL', 'APPROVED'),
(11, 3, 'zh', '如意水饺', '如意水饺以金黄酥脆的炸水饺带来独特的风味，外酥里嫩，一口咬下汁水四溢。店内以招牌什锦汤闻名，汤里配 có 炸猪皮、灰浸鱿鱼和新鲜蔬菜，展现了堤岸华人独特的饮食传统。', 'NORMAL', 'APPROVED');

-- =============================================================================
-- POI PRODUCTS — Menu items with prices in VND
-- =============================================================================

INSERT INTO poi_products (id, poi_id, name, price) VALUES
-- Sủi Cảo Thiên Thiên (poi_id: 1)
(1, 1, 'Sủi cảo nước thập cẩm', 65000.00),
(2, 1, 'Sủi cảo tôm mực', 70000.00),
(3, 1, 'Sủi cảo chiên giòn', 68000.00),
(4, 1, 'Mì sủi cảo xá xíu', 75000.00),
(5, 1, 'Hồng trà chanh đá', 25000.00),

-- Sủi Cảo Ngọc Ý (poi_id: 2)
(6, 2, 'Sủi cảo tôm thịt heo', 60000.00),
(7, 2, 'Hủ tiếu sủi cảo xương', 65000.00),
(8, 2, 'Sủi cảo hấp cải thảo', 58000.00),
(9, 2, 'Mì khô sốt dầu hào sủi cảo', 70000.00),
(10, 2, 'Nước sâm bí đao hạt chia', 20000.00),

-- Sủi Cảo Như Ý (poi_id: 3)
(11, 3, 'Súp sủi cảo da heo mực tro', 70000.00),
(12, 3, 'Sủi cảo chiên sốt xí muội', 68000.00),
(13, 3, 'Mì hoành thánh sủi cảo chiên', 75000.00),
(14, 3, 'Bánh xếp chưng cách thủy', 60000.00),
(15, 3, 'Sữa đậu nành lá dứa', 15000.00);
