USE viettuoraudio;

-- Password hash mẫu chỉ dùng demo. Không dùng cho production.
-- Admin demo: admin@viettouraudio.local / Admin@123456
-- Hash dưới đây là hash mẫu để backend thay bằng cơ chế hash thật ở phase auth.

INSERT INTO users (id, full_name, email, password_hash, phone, role, status)
VALUES
  (1, 'Admin VietTourAudio', 'admin@viettouraudio.local', '$2a$11$demoAdminHashReplaceWhenAuthIsImplemented', '0900000001', 'ADMIN', 'ACTIVE'),
  (2, 'Chủ sạp Bến Thành', 'owner.benthanh@viettouraudio.local', '$2a$11$demoOwnerHashReplaceWhenAuthIsImplemented', '0900000002', 'STALL_OWNER', 'ACTIVE'),
  (3, 'Chủ sạp Hội An', 'owner.hoian@viettouraudio.local', '$2a$11$demoOwnerHashReplaceWhenAuthIsImplemented', '0900000003', 'STALL_OWNER', 'ACTIVE'),
  (4, 'Khách du lịch Demo', 'tourist@viettouraudio.local', '$2a$11$demoTouristHashReplaceWhenAuthIsImplemented', '0900000004', 'TOURIST', 'ACTIVE');

INSERT INTO stalls (
  id, owner_id, name, slug, description, address, latitude, longitude, location,
  opening_hours, status, is_premium, premium_priority
)
VALUES
  (
    1,
    2,
    'Sạp Cà Phê Bến Thành',
    'sap-ca-phe-ben-thanh',
    'Gian hàng cà phê Việt Nam gần chợ Bến Thành, phù hợp khách quốc tế muốn trải nghiệm hương vị địa phương.',
    'Chợ Bến Thành, Quận 1, TP. Hồ Chí Minh',
    10.7721120,
    106.6982780,
    ST_GeomFromText('POINT(106.698278 10.772112)', 4326),
    '08:00-21:00',
    'APPROVED',
    1,
    10
  ),
  (
    2,
    3,
    'Gốm Thủ Công Hội An',
    'gom-thu-cong-hoi-an',
    'Sạp gốm thủ công giới thiệu câu chuyện làng nghề và sản phẩm lưu niệm.',
    'Phố cổ Hội An, Quảng Nam',
    15.8800580,
    108.3380470,
    ST_GeomFromText('POINT(108.338047 15.880058)', 4326),
    '09:00-20:30',
    'APPROVED',
    0,
    0
  );

INSERT INTO stall_subscriptions (id, stall_id, plan_name, price, start_date, end_date, status)
VALUES
  (1, 1, 'Premium Monthly', 299000.00, '2026-05-01', '2026-06-01', 'ACTIVE'),
  (2, 2, 'Standard Monthly', 99000.00, '2026-05-01', '2026-06-01', 'ACTIVE');

INSERT INTO pois (
  id, stall_id, name, description, latitude, longitude, location,
  activation_radius, is_premium, status
)
VALUES
  (
    1,
    1,
    'Góc rang cà phê phin',
    'Điểm thuyết minh về cách rang, xay và pha cà phê phin Việt Nam.',
    10.7722100,
    106.6983100,
    ST_GeomFromText('POINT(106.698310 10.772210)', 4326),
    35,
    1,
    'ACTIVE'
  ),
  (
    2,
    1,
    'Kệ quà tặng cà phê',
    'Điểm giới thiệu combo cà phê làm quà và QR thanh toán nhanh.',
    10.7720300,
    106.6981900,
    ST_GeomFromText('POINT(106.698190 10.772030)', 4326),
    25,
    0,
    'ACTIVE'
  ),
  (
    3,
    2,
    'Bàn xoay gốm thủ công',
    'Điểm kể chuyện về quy trình tạo hình gốm và nét văn hóa Hội An.',
    15.8801200,
    108.3381200,
    ST_GeomFromText('POINT(108.338120 15.880120)', 4326),
    30,
    0,
    'ACTIVE'
  );

INSERT INTO poi_contents (
  id, poi_id, language_code, title, tts_script, audio_file_url, voice_type
)
VALUES
  (
    1,
    1,
    'vi',
    'Cà phê phin Việt Nam',
    'Chào mừng bạn đến với góc cà phê phin. Đây là nơi hạt cà phê được rang thơm, xay vừa tay và pha chậm để giữ trọn hương vị Việt Nam.',
    '/uploads/audios/poi-1-vi-normal.mp3',
    'NORMAL'
  ),
  (
    2,
    1,
    'en',
    'Vietnamese Phin Coffee',
    'Welcome to the Vietnamese phin coffee corner. Here, coffee beans are roasted, ground and brewed slowly to preserve their local character.',
    '/uploads/audios/poi-1-en-normal.mp3',
    'NORMAL'
  ),
  (
    3,
    2,
    'vi',
    'Quà tặng cà phê',
    'Bạn có thể chọn các combo cà phê làm quà, quét QR để xem giá và thanh toán nhanh ngay trên web app.',
    '/uploads/audios/poi-2-vi-normal.mp3',
    'NORMAL'
  ),
  (
    4,
    3,
    'vi',
    'Gốm thủ công Hội An',
    'Mỗi sản phẩm gốm được tạo hình bằng tay, mang câu chuyện của đất, nước, lửa và người thợ địa phương.',
    '/uploads/audios/poi-3-vi-normal.mp3',
    'NORMAL'
  ),
  (
    5,
    3,
    'en',
    'Hoi An Handmade Pottery',
    'Each pottery item is shaped by hand, carrying the story of clay, water, fire and local craftsmanship.',
    '/uploads/audios/poi-3-en-normal.mp3',
    'NORMAL'
  );

INSERT INTO media_files (
  id, owner_id, stall_id, poi_id, file_type, file_name, file_path, mime_type, file_size
)
VALUES
  (1, 2, 1, NULL, 'IMAGE', 'ben-thanh-coffee-banner.jpg', '/uploads/images/stalls/ben-thanh-coffee-banner.jpg', 'image/jpeg', 245760),
  (2, 2, 1, 1, 'AUDIO', 'poi-1-vi-normal.mp3', '/uploads/audios/poi-1-vi-normal.mp3', 'audio/mpeg', 2048000),
  (3, 3, 2, NULL, 'IMAGE', 'hoi-an-pottery-banner.jpg', '/uploads/images/stalls/hoi-an-pottery-banner.jpg', 'image/jpeg', 262144);

INSERT INTO qr_codes (id, stall_id, poi_id, qr_type, qr_code_url, target_url)
VALUES
  (1, NULL, NULL, 'APP', '/uploads/qr/app-viettouraudio.png', 'https://viettouraudio.local'),
  (2, 1, NULL, 'STALL', '/uploads/qr/stalls/sap-ca-phe-ben-thanh.png', 'https://viettouraudio.local/stalls/sap-ca-phe-ben-thanh'),
  (3, 1, 1, 'POI', '/uploads/qr/pois/goc-rang-ca-phe-phin.png', 'https://viettouraudio.local/pois/1'),
  (4, 1, NULL, 'PREMIUM_REFERRAL', '/uploads/qr/premium/sap-ca-phe-ben-thanh-referral.png', 'https://viettouraudio.local/premium?ref=stall-1'),
  (5, 1, NULL, 'PAYMENT', '/uploads/qr/payments/sap-ca-phe-ben-thanh-bankqr.png', 'https://viettouraudio.local/payment?stall=1');

INSERT INTO qr_scan_events (
  id, qr_code_id, stall_id, poi_id, user_id, session_id, ip_address, user_agent, country_code, scanned_at
)
VALUES
  (1, 2, 1, NULL, 4, 'demo-session-001', '127.0.0.1', 'Demo Browser', 'VN', '2026-05-30 09:15:00'),
  (2, 3, 1, 1, NULL, 'demo-session-002', '127.0.0.1', 'Demo Mobile Browser', 'US', '2026-05-30 10:00:00');

INSERT INTO visit_events (
  id, stall_id, poi_id, user_id, session_id, latitude, longitude, distance_meters, visited_at
)
VALUES
  (1, 1, 1, 4, 'demo-session-001', 10.7722100, 106.6983100, 12.40, '2026-05-30 09:16:00'),
  (2, 2, 3, NULL, 'demo-session-003', 15.8801200, 108.3381200, 9.80, '2026-05-30 11:30:00');

INSERT INTO play_history (
  id, user_id, session_id, poi_id, language_code, played_at
)
VALUES
  (1, 4, 'demo-session-001', 1, 'vi', '2026-05-30 09:16:10'),
  (2, NULL, 'demo-session-002', 1, 'en', '2026-05-30 10:01:00');

INSERT INTO payments (
  id, user_id, stall_id, amount, currency, payment_method, payment_type,
  status, transaction_code, note, paid_at, created_at
)
VALUES
  (1, 4, NULL, 99000.00, 'VND', 'MOMO', 'APP_PREMIUM', 'PAID', 'MOMO-DEMO-0001', 'Khách mua Premium demo', '2026-05-30 09:20:00', '2026-05-30 09:19:30'),
  (2, 2, 1, 299000.00, 'VND', 'BANK_QR', 'STALL_SUBSCRIPTION', 'PAID', 'BANKQR-DEMO-0002', 'Chủ sạp gia hạn gói tháng', '2026-05-30 08:00:00', '2026-05-30 07:58:00'),
  (3, NULL, 1, 150000.00, 'VND', 'CASH_MANUAL', 'OTHER', 'PAID', 'CASH-DEMO-0003', 'Ghi nhận doanh thu tiền mặt demo', '2026-05-30 12:00:00', '2026-05-30 12:00:00');

INSERT INTO cash_reports (
  id, stall_id, reported_by, amount, note, report_date
)
VALUES
  (1, 1, 2, 150000.00, 'Doanh thu tiền mặt ghi nhận cuối ca sáng', '2026-05-30');

INSERT INTO commissions (
  id, stall_id, payment_id, commission_rate, commission_amount, status, paid_at
)
VALUES
  (1, 1, 1, 10.00, 9900.00, 'APPROVED', NULL);

INSERT INTO admin_logs (
  id, admin_id, action, target_type, target_id, description
)
VALUES
  (1, 1, 'APPROVE_STALL', 'STALL', 1, 'Duyệt sạp Cà Phê Bến Thành trong dữ liệu demo.'),
  (2, 1, 'SEED_DATABASE', 'SYSTEM', NULL, 'Khởi tạo dữ liệu mẫu cho VietTourAudio.');

INSERT INTO app_settings (
  id, setting_key, setting_value, description
)
VALUES
  (1, 'commission.default_rate', '10', 'Tỷ lệ hoa hồng mặc định cho QR Premium referral.'),
  (2, 'audio.replay_cooldown_seconds', '180', 'Thời gian chống phát lại audio liên tục cho cùng session và POI.'),
  (3, 'upload.max_image_size_mb', '5', 'Dung lượng ảnh tối đa khi upload.');
