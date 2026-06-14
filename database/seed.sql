USE viettuoraudio;

SET FOREIGN_KEY_CHECKS = 0;

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
TRUNCATE TABLE pois;
TRUNCATE TABLE stalls;
TRUNCATE TABLE vendor_subscriptions;
TRUNCATE TABLE vendors;
TRUNCATE TABLE subscription_plans;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE users;

INSERT INTO users (id, email, pass_hash, full_name, role, status) VALUES
(1, 'superadmin@viettouraudio.vn', '$2b$10$Admin123DemoHashPlaceholder00000000000000000000000000', 'Super Admin Demo', 'SUPER_ADMIN', 'ACTIVE'),
(2, 'admin@viettouraudio.vn', '$2b$10$Admin123DemoHashPlaceholder00000000000000000000000000', 'Admin Demo', 'ADMIN', 'ACTIVE'),
(3, 'moderator@viettouraudio.vn', '$2b$10$Admin123DemoHashPlaceholder00000000000000000000000000', 'Moderator Demo', 'MODERATOR', 'ACTIVE'),
(4, 'finance@viettouraudio.vn', '$2b$10$Admin123DemoHashPlaceholder00000000000000000000000000', 'Finance Demo', 'FINANCE', 'ACTIVE');

INSERT INTO subscription_plans (id, code, name, price, max_stalls, max_pois_per_stall, max_media_files, allow_premium_content, priority_support) VALUES
(1, 'BASIC_MONTHLY', 'Basic Monthly', 299000.00, 2, 20, 100, 0, 0),
(2, 'PREMIUM_MONTHLY', 'Premium Monthly', 599000.00, 10, 80, 500, 1, 1);

INSERT INTO vendors (id, legal_name, trade_name, slug, contact_name, contact_email, phone, address, status, rejection_reason, approved_by_user_id, approved_at) VALUES
(1, 'Hoi An Heritage Foods Co., Ltd', 'Hội An Heritage Foods', 'hoi-an-heritage-foods', 'Nguyễn Minh An', 'an@heritagefoods.vn', '0901000001', '115 Trần Phú, Hội An', 'APPROVED', NULL, 2, '2026-06-01 09:00:00'),
(2, 'Lantern Craft Studio', 'Lantern Craft Studio', 'lantern-craft-studio', 'Trần Thị Lan', 'lan@lantern.vn', '0901000002', '72 Nguyễn Thái Học, Hội An', 'APPROVED', NULL, 2, '2026-06-01 09:10:00'),
(3, 'Old Town Coffee Group', 'Old Town Coffee', 'old-town-coffee', 'Lê Quốc Bình', 'binh@oldtowncoffee.vn', '0901000003', '21 Bạch Đằng, Hội An', 'APPROVED', NULL, 2, '2026-06-01 09:20:00'),
(4, 'Thu Bon Boat Service', 'Thu Bồn Boat Service', 'thu-bon-boat-service', 'Phạm Hoài Nam', 'nam@thubonboats.vn', '0901000004', 'Bến Bạch Đằng, Hội An', 'PENDING', NULL, NULL, NULL),
(5, 'Ancient Tea House', 'Ancient Tea House', 'ancient-tea-house', 'Võ Thanh Trà', 'tra@ancienttea.vn', '0901000005', '88 Trần Phú, Hội An', 'REJECTED', 'Thiếu giấy phép kinh doanh hợp lệ.', 3, NULL),
(6, 'Central Market Snacks', 'Central Market Snacks', 'central-market-snacks', 'Đặng Mỹ Hạnh', 'hanh@market.vn', '0901000006', 'Chợ Hội An, Trần Phú', 'APPROVED', NULL, 2, '2026-06-01 10:00:00'),
(7, 'Hoi An Memory Photo', 'Memory Photo', 'hoi-an-memory-photo', 'Hoàng Nhật Minh', 'minh@memoryphoto.vn', '0901000007', '36 Nguyễn Thái Học, Hội An', 'SUSPENDED', 'Tạm dừng do quá hạn phí dịch vụ.', 4, NULL),
(8, 'Cao Lau Family Kitchen', 'Cao Lầu Family Kitchen', 'cao-lau-family-kitchen', 'Bùi Ngọc Mai', 'mai@caolau.vn', '0901000008', '48 Thái Phiên, Hội An', 'APPROVED', NULL, 2, '2026-06-01 10:30:00');

INSERT INTO vendor_subscriptions (id, vendor_id, plan_id, status, period_start, period_end, trial_end, price_snapshot) VALUES
(1, 1, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, 599000.00),
(2, 2, 2, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, 599000.00),
(3, 3, 1, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, 299000.00),
(4, 4, 1, 'TRIAL', '2026-06-10', '2026-06-24', '2026-06-24', 0.00),
(5, 5, 1, 'CANCELLED', '2026-05-01', '2026-05-31', NULL, 299000.00),
(6, 6, 1, 'ACTIVE', '2026-06-01', '2026-06-30', NULL, 299000.00),
(7, 7, 2, 'SUSPENDED', '2026-05-01', '2026-05-31', NULL, 599000.00),
(8, 8, 2, 'OVERDUE', '2026-05-15', '2026-06-14', NULL, 599000.00);

INSERT INTO stalls (id, vendor_id, name, slug, description, address, latitude, longitude, activation_radius, status, opening_hours, is_featured) VALUES
(1, 1, 'Sạp Bánh Mì Phố Cổ', 'sap-banh-mi-pho-co', 'Bánh mì Hội An và câu chuyện ẩm thực phố cổ.', '115 Trần Phú, Hội An', 15.8772000, 108.3262000, 35, 'APPROVED', '{"mon_fri":"07:00-21:00","sat_sun":"07:00-22:00"}', 1),
(2, 2, 'Xưởng Đèn Lồng Cô Lan', 'xuong-den-long-co-lan', 'Không gian thủ công đèn lồng truyền thống.', '72 Nguyễn Thái Học, Hội An', 15.8776500, 108.3270500, 40, 'APPROVED', '{"daily":"08:00-21:00"}', 1),
(3, 3, 'Cà Phê Bạch Đằng', 'ca-phe-bach-dang', 'Góc cà phê nhìn ra sông Hoài.', '21 Bạch Đằng, Hội An', 15.8768500, 108.3291200, 30, 'APPROVED', '{"daily":"06:30-22:00"}', 0),
(4, 4, 'Bến Thuyền Thu Bồn', 'ben-thuyen-thu-bon', 'Điểm khởi hành tour thuyền ngắn trên sông.', 'Bến Bạch Đằng, Hội An', 15.8762100, 108.3298500, 45, 'PENDING', '{"daily":"16:00-22:00"}', 0),
(5, 5, 'Nhà Trà Cổ', 'nha-tra-co', 'Trải nghiệm trà và nếp nhà xưa.', '88 Trần Phú, Hội An', 15.8780200, 108.3266800, 30, 'REJECTED', '{"daily":"09:00-20:00"}', 0),
(6, 6, 'Quầy Ăn Chợ Hội An', 'quay-an-cho-hoi-an', 'Món ăn nhanh trong chợ Hội An.', 'Chợ Hội An, Trần Phú', 15.8784200, 108.3283100, 35, 'APPROVED', '{"daily":"06:00-18:00"}', 1),
(7, 7, 'Studio Ảnh Ký Ức', 'studio-anh-ky-uc', 'Dịch vụ ảnh áo dài và phố cổ.', '36 Nguyễn Thái Học, Hội An', 15.8779000, 108.3275600, 30, 'SUSPENDED', '{"daily":"08:00-20:00"}', 0),
(8, 8, 'Bếp Cao Lầu Gia Đình', 'bep-cao-lau-gia-dinh', 'Cao lầu gia truyền và câu chuyện sợi mì Hội An.', '48 Thái Phiên, Hội An', 15.8790500, 108.3269400, 35, 'APPROVED', '{"daily":"10:00-21:00"}', 1);

INSERT INTO pois (id, stall_id, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order) VALUES
(1, 1, 'Lò nướng bánh mì', 'lo-nuong-banh-mi', 'Giới thiệu cách nướng bánh mì giòn kiểu Hội An.', 15.8772100, 108.3262200, 20, 1, 'ACTIVE', 1),
(2, 1, 'Khu gia vị địa phương', 'khu-gia-vi-dia-phuong', 'Các loại rau thơm, nước sốt và pate địa phương.', 15.8771800, 108.3262500, 20, 0, 'ACTIVE', 2),
(3, 2, 'Bàn tre đèn lồng', 'ban-tre-den-long', 'Câu chuyện khung tre trong nghề làm đèn lồng.', 15.8776600, 108.3270700, 22, 1, 'ACTIVE', 1),
(4, 2, 'Góc nhuộm vải', 'goc-nhuom-vai', 'Quy trình chọn màu và căng vải.', 15.8777000, 108.3270900, 22, 0, 'ACTIVE', 2),
(5, 3, 'Ban công sông Hoài', 'ban-cong-song-hoai', 'Góc nhìn ra sông Hoài từ quán cà phê.', 15.8768300, 108.3291000, 25, 0, 'ACTIVE', 1),
(6, 3, 'Quầy pha phin', 'quay-pha-phin', 'Thói quen cà phê phin của người phố cổ.', 15.8768800, 108.3291500, 20, 1, 'ACTIVE', 2),
(7, 4, 'Cầu thuyền gỗ', 'cau-thuyen-go', 'Điểm đón khách lên thuyền Thu Bồn.', 15.8762200, 108.3298600, 30, 0, 'ACTIVE', 1),
(8, 4, 'Lịch sử sông Thu Bồn', 'lich-su-song-thu-bon', 'Vai trò giao thương của dòng sông với Hội An.', 15.8762600, 108.3299100, 30, 1, 'ACTIVE', 2),
(9, 5, 'Bộ ấm trà cổ', 'bo-am-tra-co', 'Bộ ấm gốm và nghi thức uống trà.', 15.8780300, 108.3267000, 20, 0, 'INACTIVE', 1),
(10, 6, 'Gánh mì Quảng', 'ganh-mi-quang', 'Mì Quảng trong không gian chợ Hội An.', 15.8784300, 108.3283300, 25, 0, 'ACTIVE', 1),
(11, 6, 'Quầy bánh hoa hồng trắng', 'quay-banh-hoa-hong-trang', 'Món bánh đặc trưng của phố Hội.', 15.8783900, 108.3283600, 25, 1, 'ACTIVE', 2),
(12, 7, 'Góc áo dài', 'goc-ao-dai', 'Bối cảnh chụp ảnh áo dài trong phố cổ.', 15.8779200, 108.3275800, 20, 0, 'INACTIVE', 1),
(13, 8, 'Nồi nước cao lầu', 'noi-nuoc-cao-lau', 'Nước dùng và nguyên liệu trong món cao lầu.', 15.8790600, 108.3269600, 25, 1, 'ACTIVE', 1),
(14, 8, 'Khu sợi mì', 'khu-soi-mi', 'Câu chuyện sợi mì cao lầu dai và vàng.', 15.8790800, 108.3269900, 25, 1, 'ACTIVE', 2),
(15, 8, 'Bàn gia đình', 'ban-gia-dinh', 'Không gian phục vụ kiểu gia đình.', 15.8790200, 108.3269100, 20, 0, 'ACTIVE', 3);

INSERT INTO poi_contents (id, poi_id, lang, title, short_text, tts_script, audio_url, voice_profile) VALUES
(1, 1, 'vi', 'Lò nướng bánh mì', 'Bánh mì giòn trong phố cổ.', 'Bạn đang ở khu lò nướng bánh mì. Mùi bánh nóng và âm thanh phố cổ tạo nên một trải nghiệm rất Hội An.', '/uploads/audio/poi-1-vi.mp3', 'vi-standard'),
(2, 1, 'en', 'Banh Mi Oven', 'Crispy bread in the old town.', 'You are at the banh mi oven. The warm bread and old town rhythm create a very local Hoi An moment.', '/uploads/audio/poi-1-en.mp3', 'en-standard'),
(3, 2, 'vi', 'Khu gia vị địa phương', 'Rau thơm và nước sốt.', 'Những loại gia vị ở đây làm nên hương vị cân bằng giữa béo, cay, chua và thơm.', '/uploads/audio/poi-2-vi.mp3', 'vi-standard'),
(4, 2, 'en', 'Local Spice Corner', 'Herbs and sauces.', 'The herbs and sauces here create the balance of richness, heat, freshness, and aroma.', '/uploads/audio/poi-2-en.mp3', 'en-standard'),
(5, 3, 'vi', 'Bàn tre đèn lồng', 'Khung tre thủ công.', 'Khung tre là phần xương sống của chiếc đèn lồng, đòi hỏi độ đều và sự kiên nhẫn của người thợ.', '/uploads/audio/poi-3-vi.mp3', 'vi-premium'),
(6, 3, 'en', 'Lantern Bamboo Frame', 'Handmade bamboo frame.', 'The bamboo frame is the backbone of the lantern and requires patience, balance, and careful hands.', '/uploads/audio/poi-3-en.mp3', 'en-premium'),
(7, 4, 'vi', 'Góc nhuộm vải', 'Màu sắc đèn lồng.', 'Mỗi tấm vải được chọn màu theo mùa, theo lễ hội và theo cảm xúc của người đặt đèn.', '/uploads/audio/poi-4-vi.mp3', 'vi-standard'),
(8, 5, 'vi', 'Ban công sông Hoài', 'Góc nhìn ra sông.', 'Từ ban công này, bạn có thể cảm nhận nhịp chảy chậm của sông Hoài và ánh đèn phố cổ.', '/uploads/audio/poi-5-vi.mp3', 'vi-standard'),
(9, 5, 'en', 'Hoai River Balcony', 'A quiet river view.', 'From this balcony, you can feel the slow rhythm of the Hoai River and the lantern-lit old town.', '/uploads/audio/poi-5-en.mp3', 'en-standard'),
(10, 6, 'vi', 'Quầy pha phin', 'Cà phê phin phố cổ.', 'Ly cà phê phin nhỏ giọt chậm như nhịp sống buổi sáng trong lòng Hội An.', '/uploads/audio/poi-6-vi.mp3', 'vi-premium'),
(11, 6, 'en', 'Vietnamese Drip Coffee', 'Slow coffee ritual.', 'Vietnamese drip coffee moves slowly, much like a quiet morning in Hoi An old town.', '/uploads/audio/poi-6-en.mp3', 'en-premium'),
(12, 7, 'vi', 'Cầu thuyền gỗ', 'Điểm lên thuyền.', 'Cầu thuyền là nơi du khách bắt đầu nhìn Hội An từ mặt nước.', '/uploads/audio/poi-7-vi.mp3', 'vi-standard'),
(13, 8, 'vi', 'Lịch sử sông Thu Bồn', 'Dòng sông thương cảng.', 'Sông Thu Bồn từng góp phần đưa Hội An trở thành thương cảng nhộn nhịp trong nhiều thế kỷ.', '/uploads/audio/poi-8-vi.mp3', 'vi-premium'),
(14, 8, 'en', 'Thu Bon River History', 'The trading river.', 'The Thu Bon River helped Hoi An become a vibrant trading port for centuries.', '/uploads/audio/poi-8-en.mp3', 'en-premium'),
(15, 9, 'vi', 'Bộ ấm trà cổ', 'Nghi thức thưởng trà.', 'Bộ ấm trà gợi nhắc một nhịp sống chậm, nơi cuộc trò chuyện bắt đầu bằng hương trà.', '/uploads/audio/poi-9-vi.mp3', 'vi-standard'),
(16, 10, 'vi', 'Gánh mì Quảng', 'Món ăn miền Trung.', 'Mì Quảng ở chợ Hội An đậm vị, nhiều rau, và thường được dùng như một bữa ăn nhanh no lòng.', '/uploads/audio/poi-10-vi.mp3', 'vi-standard'),
(17, 10, 'en', 'Mi Quang Stall', 'A Central Vietnam dish.', 'Mi Quang is rich, fresh, and filling, a signature dish of Central Vietnam.', '/uploads/audio/poi-10-en.mp3', 'en-standard'),
(18, 11, 'vi', 'Bánh hoa hồng trắng', 'Món bánh đặc trưng.', 'Bánh hoa hồng trắng có lớp vỏ mỏng, hình dáng thanh nhã và nhân tôm thơm nhẹ.', '/uploads/audio/poi-11-vi.mp3', 'vi-premium'),
(19, 11, 'en', 'White Rose Dumpling', 'A Hoi An specialty.', 'White Rose Dumplings are delicate, elegant, and filled with lightly seasoned shrimp.', '/uploads/audio/poi-11-en.mp3', 'en-premium'),
(20, 12, 'vi', 'Góc áo dài', 'Ảnh áo dài phố cổ.', 'Góc áo dài lưu giữ hình ảnh duyên dáng của du khách giữa nền tường vàng phố Hội.', '/uploads/audio/poi-12-vi.mp3', 'vi-standard'),
(21, 13, 'vi', 'Nồi nước cao lầu', 'Nước dùng gia truyền.', 'Nồi nước dùng cao lầu là phần nền tạo nên mùi thơm và vị đậm của món ăn.', '/uploads/audio/poi-13-vi.mp3', 'vi-premium'),
(22, 13, 'en', 'Cao Lau Broth', 'Family broth recipe.', 'The cao lau broth carries the aroma and depth that make this noodle dish memorable.', '/uploads/audio/poi-13-en.mp3', 'en-premium'),
(23, 14, 'vi', 'Khu sợi mì', 'Sợi mì cao lầu.', 'Sợi mì cao lầu có độ dai và màu vàng đặc trưng, tạo nên khác biệt so với nhiều món mì khác.', '/uploads/audio/poi-14-vi.mp3', 'vi-premium'),
(24, 14, 'en', 'Cao Lau Noodles', 'Firm yellow noodles.', 'Cao lau noodles are firm and golden, giving the dish its unique texture.', '/uploads/audio/poi-14-en.mp3', 'en-premium'),
(25, 15, 'vi', 'Bàn gia đình', 'Không gian dùng bữa.', 'Bàn gia đình là nơi du khách ngồi lại, nghe câu chuyện món ăn và cảm nhận sự hiếu khách địa phương.', '/uploads/audio/poi-15-vi.mp3', 'vi-standard');

INSERT INTO media_files (id, vendor_id, stall_id, poi_id, uploaded_by_user_id, file_type, file_name, file_path, public_url, mime_type, file_size) VALUES
(1, 1, 1, NULL, 2, 'IMAGE', 'banh-mi.jpg', '/uploads/vendors/1/stalls/1/banh-mi.jpg', '/media/banh-mi.jpg', 'image/jpeg', 245000),
(2, 2, 2, NULL, 2, 'IMAGE', 'lantern.jpg', '/uploads/vendors/2/stalls/2/lantern.jpg', '/media/lantern.jpg', 'image/jpeg', 310000),
(3, 8, 8, 13, 2, 'AUDIO', 'cao-lau-vi.mp3', '/uploads/audio/poi-13-vi.mp3', '/media/audio/poi-13-vi.mp3', 'audio/mpeg', 1200000);

INSERT INTO qr_codes (id, vendor_id, stall_id, poi_id, code, qr_type, target_url, image_url, is_active) VALUES
(1, 1, 1, NULL, 'VTA-ST-0001', 'STALL', 'https://app.viettouraudio.vn/map?stall=1', '/qr/stall-1.png', 1),
(2, 2, 2, NULL, 'VTA-ST-0002', 'STALL', 'https://app.viettouraudio.vn/map?stall=2', '/qr/stall-2.png', 1),
(3, 8, 8, 13, 'VTA-POI-0013', 'POI', 'https://app.viettouraudio.vn/map?poi=13', '/qr/poi-13.png', 1),
(4, 8, 8, NULL, 'VTA-PAY-0008', 'PAYMENT', 'https://app.viettouraudio.vn/pay?vendor=8', '/qr/pay-8.png', 1);

INSERT INTO visitor_sessions (id, token, is_premium, premium_24h_expiry, device_fingerprint, ip_address, user_agent) VALUES
(1, 'vs_demo_001', 1, '2026-06-15 09:00:00', 'fp-ios-001', '127.0.0.1', 'Demo Safari'),
(2, 'vs_demo_002', 0, NULL, 'fp-android-002', '127.0.0.1', 'Demo Chrome'),
(3, 'vs_demo_003', 1, '2026-06-15 10:00:00', 'fp-web-003', '127.0.0.1', 'Demo Edge');

INSERT INTO qr_scan_events (id, qr_code_id, vendor_id, stall_id, poi_id, visitor_session_id, country_code, scanned_at) VALUES
(1, 1, 1, 1, NULL, 1, 'VN', '2026-06-11 09:00:00'),
(2, 2, 2, 2, NULL, 2, 'VN', '2026-06-11 09:15:00'),
(3, 3, 8, 8, 13, 3, 'US', '2026-06-11 10:00:00');

INSERT INTO visit_events (id, vendor_id, stall_id, poi_id, visitor_session_id, source, latitude, longitude, distance_meters, visited_at) VALUES
(1, 1, 1, 1, 1, 'GPS', 15.8772100, 108.3262200, 5.30, '2026-06-11 09:03:00'),
(2, 2, 2, 3, 2, 'QR', 15.8776600, 108.3270700, 0.00, '2026-06-11 09:16:00'),
(3, 8, 8, 13, 3, 'GPS', 15.8790600, 108.3269600, 4.80, '2026-06-11 10:04:00');

INSERT INTO play_history (id, visitor_session_id, poi_id, poi_content_id, lang, source, started_at, completed_at, duration_seconds) VALUES
(1, 1, 1, 1, 'vi', 'AUTO_GPS', '2026-06-11 09:04:00', '2026-06-11 09:05:20', 80),
(2, 3, 13, 21, 'vi', 'AUTO_GPS', '2026-06-11 10:05:00', '2026-06-11 10:06:35', 95);

INSERT INTO payments (id, vendor_id, visitor_session_id, vendor_subscription_id, amount, provider, payment_type, status, transaction_code, provider_payload, paid_at) VALUES
(1, 1, NULL, 1, 599000.00, 'BANK_QR', 'VENDOR_SUBSCRIPTION', 'PAID', 'PAY-SUB-0001', '{"bank":"VCB"}', '2026-06-01 08:00:00'),
(2, 2, NULL, 2, 599000.00, 'MOMO', 'VENDOR_SUBSCRIPTION', 'PAID', 'PAY-SUB-0002', '{"wallet":"momo"}', '2026-06-01 08:05:00'),
(3, 3, NULL, 3, 299000.00, 'BANK_QR', 'VENDOR_SUBSCRIPTION', 'PAID', 'PAY-SUB-0003', '{"bank":"TCB"}', '2026-06-01 08:10:00'),
(4, 8, NULL, 8, 599000.00, 'BANK_QR', 'WALLET_TOP_UP', 'PAID', 'PAY-TOP-0008', '{"bank":"ACB"}', '2026-06-10 11:00:00'),
(5, NULL, 1, NULL, 30000.00, 'MOMO', 'VISITOR_PREMIUM', 'PAID', 'PAY-VIS-0001', '{"wallet":"momo"}', '2026-06-11 09:00:00'),
(6, NULL, 3, NULL, 30000.00, 'STRIPE', 'VISITOR_PREMIUM', 'PAID', 'PAY-VIS-0002', '{"card":"test"}', '2026-06-11 10:00:00');

INSERT INTO vendor_wallets (id, vendor_id, balance, total_top_up, total_spent, total_commission) VALUES
(1, 1, 450000.00, 500000.00, 80000.00, 30000.00),
(2, 2, 620000.00, 700000.00, 100000.00, 20000.00),
(3, 3, 210000.00, 250000.00, 40000.00, 0.00),
(4, 4, 0.00, 0.00, 0.00, 0.00),
(5, 5, 0.00, 0.00, 0.00, 0.00),
(6, 6, 360000.00, 400000.00, 60000.00, 20000.00),
(7, 7, 15000.00, 100000.00, 85000.00, 0.00),
(8, 8, 930000.00, 1000000.00, 100000.00, 30000.00);

INSERT INTO top_up_requests (id, vendor_id, wallet_id, requested_by_user_id, provider, status, amount, proof_url, note, reviewed_by_user_id, reviewed_at) VALUES
(1, 1, 1, 4, 'BANK_QR', 'APPROVED', 500000.00, '/proofs/topup-1.jpg', 'Nạp ví tháng 6', 4, '2026-06-02 08:00:00'),
(2, 2, 2, 4, 'MOMO', 'APPROVED', 700000.00, '/proofs/topup-2.jpg', 'Nạp ví premium', 4, '2026-06-02 08:10:00'),
(3, 3, 3, 4, 'BANK_QR', 'APPROVED', 250000.00, '/proofs/topup-3.jpg', 'Nạp ví basic', 4, '2026-06-02 08:20:00'),
(4, 6, 6, 4, 'VNPAY', 'APPROVED', 400000.00, '/proofs/topup-6.jpg', 'Nạp ví chợ Hội An', 4, '2026-06-02 08:30:00'),
(5, 7, 7, 4, 'BANK_QR', 'PENDING', 100000.00, '/proofs/topup-7.jpg', 'Chờ đối soát', NULL, NULL),
(6, 8, 8, 4, 'BANK_QR', 'APPROVED', 1000000.00, '/proofs/topup-8.jpg', 'Nạp ví cao lầu', 4, '2026-06-10 11:05:00');

INSERT INTO wallet_transactions (id, wallet_id, vendor_id, payment_id, top_up_request_id, transaction_type, direction, amount, balance_before, balance_after, description, created_by_user_id, metadata) VALUES
(1, 1, 1, NULL, 1, 'TOP_UP', 'CREDIT', 500000.00, 0.00, 500000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(2, 1, 1, NULL, NULL, 'FEE', 'DEBIT', 50000.00, 500000.00, 450000.00, 'Monthly platform fee', 4, '{"batch":"seed"}'),
(3, 1, 1, NULL, NULL, 'MANUAL', 'CREDIT', 30000.00, 420000.00, 450000.00, 'Manual adjustment', 4, '{"batch":"seed"}'),
(4, 2, 2, NULL, 2, 'TOP_UP', 'CREDIT', 700000.00, 0.00, 700000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(5, 2, 2, NULL, NULL, 'FEE', 'DEBIT', 80000.00, 700000.00, 620000.00, 'Premium media fee', 4, '{"batch":"seed"}'),
(6, 2, 2, NULL, NULL, 'MANUAL', 'CREDIT', 20000.00, 600000.00, 620000.00, 'Commission correction', 4, '{"batch":"seed"}'),
(7, 3, 3, NULL, 3, 'TOP_UP', 'CREDIT', 250000.00, 0.00, 250000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(8, 3, 3, NULL, NULL, 'FEE', 'DEBIT', 40000.00, 250000.00, 210000.00, 'Audio processing fee', 4, '{"batch":"seed"}'),
(9, 6, 6, NULL, 4, 'TOP_UP', 'CREDIT', 400000.00, 0.00, 400000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(10, 6, 6, NULL, NULL, 'FEE', 'DEBIT', 60000.00, 400000.00, 340000.00, 'QR campaign fee', 4, '{"batch":"seed"}'),
(11, 6, 6, NULL, NULL, 'MANUAL', 'CREDIT', 20000.00, 340000.00, 360000.00, 'Manual correction', 4, '{"batch":"seed"}'),
(12, 7, 7, NULL, 5, 'TOP_UP', 'CREDIT', 100000.00, 0.00, 100000.00, 'Pending top up provisional', 4, '{"batch":"seed"}'),
(13, 7, 7, NULL, NULL, 'FEE', 'DEBIT', 85000.00, 100000.00, 15000.00, 'Overdue fee', 4, '{"batch":"seed"}'),
(14, 8, 8, 4, 6, 'TOP_UP', 'CREDIT', 1000000.00, 0.00, 1000000.00, 'Top up approved', 4, '{"batch":"seed"}'),
(15, 8, 8, NULL, NULL, 'FEE', 'DEBIT', 70000.00, 1000000.00, 930000.00, 'Premium POI fee', 4, '{"batch":"seed"}'),
(16, 8, 8, NULL, NULL, 'MANUAL', 'CREDIT', 30000.00, 900000.00, 930000.00, 'Commission correction', 4, '{"batch":"seed"}'),
(17, 1, 1, NULL, NULL, 'FEE', 'DEBIT', 30000.00, 450000.00, 420000.00, 'Campaign reserve', 4, '{"batch":"seed"}'),
(18, 2, 2, NULL, NULL, 'FEE', 'DEBIT', 20000.00, 620000.00, 600000.00, 'Storage reserve', 4, '{"batch":"seed"}'),
(19, 4, 4, NULL, NULL, 'MANUAL', 'CREDIT', 0.00, 0.00, 0.00, 'Trial wallet initialized', 4, '{"batch":"seed"}'),
(20, 5, 5, NULL, NULL, 'MANUAL', 'CREDIT', 0.00, 0.00, 0.00, 'Rejected vendor wallet initialized', 4, '{"batch":"seed"}');

INSERT INTO commission_earnings (id, vendor_id, payment_id, qr_code_id, visitor_session_id, rate_percent, gross_amount, commission_amount, status, earned_at) VALUES
(1, 1, 5, 1, 1, 10.00, 30000.00, 3000.00, 'APPROVED', '2026-06-11 09:00:00'),
(2, 8, 6, 3, 3, 10.00, 30000.00, 3000.00, 'PENDING', '2026-06-11 10:00:00');

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

INSERT INTO revenue_daily (date, source, provider, gross_amount, net_amount, fees, transaction_count) VALUES
('2026-06-11', 'VISITOR_PREMIUM', 'MOMO', 90000.00, 87000.00, 3000.00, 3),
('2026-06-11', 'VENDOR_SUBSCRIPTION', 'BANK_QR', 1497000.00, 1497000.00, 0.00, 3),
('2026-06-12', 'VISITOR_PREMIUM', 'STRIPE', 120000.00, 114000.00, 6000.00, 4),
('2026-06-12', 'WALLET_TOP_UP', 'BANK_QR', 750000.00, 750000.00, 0.00, 2),
('2026-06-13', 'VISITOR_PREMIUM', 'MOMO', 180000.00, 174000.00, 6000.00, 6),
('2026-06-13', 'WALLET_TOP_UP', 'VNPAY', 400000.00, 394000.00, 6000.00, 1);

INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, before_data, after_data, ip_address) VALUES
(1, 2, 'APPROVE_VENDOR', 'vendors', 1, '{"status":"PENDING"}', '{"status":"APPROVED"}', '127.0.0.1'),
(2, 4, 'APPROVE_TOP_UP', 'top_up_requests', 1, '{"status":"PENDING"}', '{"status":"APPROVED"}', '127.0.0.1');

SET FOREIGN_KEY_CHECKS = 1;