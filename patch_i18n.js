const fs = require('fs');
const path = require('path');

const viTranslations = {
  auth: {
    vendor_login_error: "Không thể đăng nhập. Kiểm tra mã vendor và mật khẩu.",
    vendor_portal: "Vendor Portal",
    vendor_hero_title: "Quản trị sạp, nội dung TTS và doanh thu ngay trên cổng vendor.",
    vendor_hero_desc: "Theo dõi lượt nghe audio, quản lý vị trí sạp trên bản đồ, gửi nội dung TTS để Admin duyệt và thanh toán phí thuê WebApp hàng tháng.",
    vendor_feature_1: "Bản đồ vị trí sạp",
    vendor_feature_2: "TTS Content Editor",
    vendor_feature_3: "Analytics & Revenue",
    vendor_login: "Vendor login",
    vendor_login_title: "Đăng nhập cổng vendor",
    vendor_login_subtitle: "Sử dụng mã vendor do Admin cấp để đăng nhập.",
    vendor_code: "Mã Vendor",
    password: "Mật khẩu",
    login_loading: "Đang xác thực...",
    vendor_login_button: "Đăng nhập Vendor Portal",
    demo_account_hint: "Tài khoản mẫu local:",
    vendor_code_short: "Mã"
  },
  landing: {
    gps_granted: "Đã bật",
    gps_requesting: "Đang lấy...",
    gps_denied: "Đang dùng demo",
    gps_unavailable: "Không hỗ trợ",
    gps_idle: "Chưa bật",
    close_nav: "Đóng bảng điều hướng",
    account_status: "Trạng thái tài khoản",
    audio_language: "Ngôn ngữ thuyết minh",
    gps_location: "Định vị GPS",
    demo_mode_active: "Đang dùng demo",
    relocate: "Định vị lại",
    near_you: "Gần bạn",
    view_all: "Xem tất cả",
    no_poi_nearby: "Chưa có điểm tham quan trong khu vực.",
    auto_play_started: "📍 Đã vào {{name}}. Tự động phát audio",
    unlock: "Mở khóa",
    explore: "Khám phá",
    list: "Danh sách",
    settings: "Cài đặt"
  },
  geofence: {
    title: "Bản đồ vùng kích hoạt",
    subtitle: "Zoom xa (< 15) xem toàn bộ Khu vực Lễ hội (Tour/Zone). Zoom gần (>= 15) xem chi tiết các Sạp hàng & POIs.",
    refresh: "Làm mới",
    error_loading: "Không tải được dữ liệu geofence.",
    stall_list: "Danh sách stall",
    loading: "Đang tải...",
    stall_count: "{{total}} stall, {{overlap}} có overlap",
    no_stalls: "Chưa có stall có tọa độ.",
    zoom_level: "Mức zoom: {{zoom}} ({{type}})",
    zoom_macro: "Bản đồ khu vực",
    zoom_micro: "Bản đồ chi tiết",
    tour: "Khu vực",
    stall: "Sạp",
    poi: "POI"
  },
  audit_log: {
    no_details: "Không có thông tin chi tiết hoặc không có thay đổi dữ liệu.",
    id: "Mã log",
    actor: "Người thực hiện",
    action: "Hành động",
    target: "Đối tượng",
    time: "Thời gian",
    details: "Chi tiết",
    view_details: "Xem chi tiết",
    title: "Nhật ký hệ thống",
    subtitle: "Tra cứu lịch sử thao tác admin, theo dõi thay đổi dữ liệu trước và sau khi chỉnh sửa.",
    export: "Export CSV",
    error_loading: "Không thể tải nhật ký hệ thống.",
    loading: "Đang tải nhật ký hệ thống...",
    empty: "Không tìm thấy nhật ký.",
    modal_title: "Chi tiết nhật ký #{{id}}",
    modal_desc: "Hành động: {{action}} | IP: {{ip}}",
    close: "Đóng",
    json_diff: "So sánh thay đổi dữ liệu (JSON Diff)",
    reason: "Lý do thao tác"
  },
  vendor_content: {
    status_pending: "Đang chờ Admin duyệt",
    status_approved: "Đã duyệt ✓",
    status_rejected: "Từ chối ✗",
    title: "Nội dung TTS & Audio",
    subtitle: "Soạn nội dung thuyết minh để AI đọc giọng tự động. Admin duyệt trước khi phát cho khách.",
    warning_title: "Lưu ý: Viết đúng chính tả, rõ dấu câu để AI đọc giọng chuẩn nhất",
    warning_desc: "Nội dung phải có ít nhất 50 ký tự, sử dụng dấu chấm (.), phẩy (,) và chấm than (!) để AI phân tách câu tự nhiên. Tránh viết tắt hoặc dùng ký hiệu đặc biệt.",
    language_vi: "Ngôn ngữ: Tiếng Việt (vi)",
    locked_pending: "Không thể chỉnh sửa khi đang chờ duyệt",
    placeholder: "Nhập nội dung thuyết minh cho AI đọc giọng tự động...",
    chars: "ký tự",
    need_more_chars: "(cần thêm {{count}})",
    updated_at: "Cập nhật",
    submit_success: "✓ Nội dung đã được gửi! Đang chờ Admin duyệt.",
    footer_hint: "Sau khi gửi, nội dung sẽ chuyển sang trạng thái <span class=\"font-bold text-amber-600\">\"Đang chờ duyệt\"</span> và không thể chỉnh sửa cho đến khi Admin phê duyệt hoặc từ chối.",
    sending: "Đang gửi...",
    send: "Gửi nội dung duyệt",
    approved_title: "Nội dung đã duyệt — Đang phát cho khách"
  }
};

const enTranslations = {
  auth: {
    vendor_login_error: "Login failed. Check vendor code and password.",
    vendor_portal: "Vendor Portal",
    vendor_hero_title: "Manage stalls, TTS content and revenue right from the vendor portal.",
    vendor_hero_desc: "Track audio listens, manage stall location on the map, submit TTS content for Admin review and pay monthly WebApp rental fees.",
    vendor_feature_1: "Stall location map",
    vendor_feature_2: "TTS Content Editor",
    vendor_feature_3: "Analytics & Revenue",
    vendor_login: "Vendor login",
    vendor_login_title: "Vendor Portal Login",
    vendor_login_subtitle: "Use the vendor code provided by Admin to log in.",
    vendor_code: "Vendor Code",
    password: "Password",
    login_loading: "Authenticating...",
    vendor_login_button: "Login to Vendor Portal",
    demo_account_hint: "Local demo account:",
    vendor_code_short: "Code"
  },
  landing: {
    gps_granted: "Granted",
    gps_requesting: "Requesting...",
    gps_denied: "Demo mode",
    gps_unavailable: "Unavailable",
    gps_idle: "Idle",
    close_nav: "Close navigation",
    account_status: "Account status",
    audio_language: "Audio language",
    gps_location: "GPS Location",
    demo_mode_active: "Demo mode active",
    relocate: "Relocate",
    near_you: "Near you",
    view_all: "View all",
    no_poi_nearby: "No POI nearby.",
    auto_play_started: "📍 Entered {{name}}. Auto-playing audio",
    unlock: "Unlock",
    explore: "Explore",
    list: "List",
    settings: "Settings"
  },
  geofence: {
    title: "Geofence Map",
    subtitle: "Zoom out (< 15) to see the entire Festival Area (Tour/Zone). Zoom in (>= 15) to see details of Stalls & POIs.",
    refresh: "Refresh",
    error_loading: "Failed to load geofence data.",
    stall_list: "Stall List",
    loading: "Loading...",
    stall_count: "{{total}} stalls, {{overlap}} overlapping",
    no_stalls: "No stalls with coordinates.",
    zoom_level: "Zoom level: {{zoom}} ({{type}})",
    zoom_macro: "Macro map",
    zoom_micro: "Micro map",
    tour: "Tour",
    stall: "Stall",
    poi: "POI"
  },
  audit_log: {
    no_details: "No details or data changes.",
    id: "Log ID",
    actor: "Actor",
    action: "Action",
    target: "Target",
    time: "Time",
    details: "Details",
    view_details: "View details",
    title: "Audit Logs",
    subtitle: "Lookup admin operations history, track data changes before and after edits.",
    export: "Export CSV",
    error_loading: "Cannot load audit logs.",
    loading: "Loading audit logs...",
    empty: "No audit logs found.",
    modal_title: "Log details #{{id}}",
    modal_desc: "Action: {{action}} | IP: {{ip}}",
    close: "Close",
    json_diff: "Data change comparison (JSON Diff)",
    reason: "Reason"
  },
  vendor_content: {
    status_pending: "Pending Admin approval",
    status_approved: "Approved ✓",
    status_rejected: "Rejected ✗",
    title: "TTS & Audio Content",
    subtitle: "Compose narration for AI to read automatically. Admin reviews before broadcasting to guests.",
    warning_title: "Note: Use correct spelling and clear punctuation for the best AI voice.",
    warning_desc: "Content must be at least 50 characters, use period (.), comma (,), and exclamation mark (!) for AI to naturally separate sentences. Avoid abbreviations or special symbols.",
    language_vi: "Language: Vietnamese (vi)",
    locked_pending: "Cannot edit while pending approval",
    placeholder: "Enter narration content for AI to read automatically...",
    chars: "chars",
    need_more_chars: "(need {{count}} more)",
    updated_at: "Updated at",
    submit_success: "✓ Content submitted! Pending Admin approval.",
    footer_hint: "After submitting, the content will switch to the <span class=\"font-bold text-amber-600\">\"Pending approval\"</span> state and cannot be edited until Admin approves or rejects.",
    sending: "Sending...",
    send: "Submit content for review",
    approved_title: "Content approved — Currently playing for guests"
  }
};

function patchLocales() {
  const viPath = path.join(__dirname, 'client/src/locales/vi.json');
  const enPath = path.join(__dirname, 'client/src/locales/en.json');
  
  const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  for (const [section, values] of Object.entries(viTranslations)) {
    if (!viData[section]) viData[section] = {};
    for (const [key, value] of Object.entries(values)) {
      viData[section][key] = value;
    }
  }

  for (const [section, values] of Object.entries(enTranslations)) {
    if (!enData[section]) enData[section] = {};
    for (const [key, value] of Object.entries(values)) {
      enData[section][key] = value;
    }
  }

  fs.writeFileSync(viPath, JSON.stringify(viData, null, 2) + '\n');
  fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n');
  console.log('Successfully patched vi.json and en.json');
}

patchLocales();
