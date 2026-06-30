const fs = require('fs');

const localesDir = 'C:/Users/UNITY/Desktop/VietTourAudio-project-ready-database-integration/client/src/locales/';

const viPath = localesDir + 'vi.json';
const enPath = localesDir + 'en.json';
const jaPath = localesDir + 'ja.json';
const zhPath = localesDir + 'zh.json';
const koPath = localesDir + 'ko.json';

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
const ko = JSON.parse(fs.readFileSync(koPath, 'utf8'));

const adminKeys = {
  vendors: {
    management_subtitle: {
      vi: "Quản lý hồ sơ, kiểm tra gói dịch vụ, số dư ví và hoạt động của đối tác.",
      en: "Approve profiles, check subscriptions, wallet balances, and vendor operations.",
      ja: "プロフィールの承認、サブスクリプション、ウォレット残高、およびベンダーの運用を確認します。",
      zh: "批准个人资料，检查订阅，钱包余额和供应商操作。",
      ko: "프로필 승인, 구독 확인, 지갑 잔액 및 공급업체 운영."
    },
    description: {
      vi: "Quản lý hồ sơ, kiểm tra gói dịch vụ, số dư ví và hoạt động của đối tác.",
      en: "Approve profiles, check subscriptions, wallet balances, and vendor operations.",
      ja: "プロフィールの承認、サブスクリプション、ウォレット残高、およびベンダーの運用を確認します。",
      zh: "批准个人资料，检查订阅，钱包余额和供应商操作。",
      ko: "프로필 승인, 구독 확인, 지갑 잔액 및 공급업체 운영."
    },
    all: { vi: "Tất cả", en: "All", ja: "すべて", zh: "全部", ko: "모두" },
    search_placeholder: {
      vi: "Tìm tên đối tác, email, người đại diện...",
      en: "Search vendor name, email, representative...",
      ja: "ベンダー名、メール、担当者を検索...",
      zh: "搜索供应商名称，电子邮件，代表...",
      ko: "공급업체 이름, 이메일, 담당자 검색..."
    },
    table: {
      code: { vi: "MÃ", en: "CODE", ja: "コード", zh: "代码", ko: "코드" },
      vendor: { vi: "ĐỐI TÁC", en: "VENDOR", ja: "ベンダー", zh: "供应商", ko: "공급업체" },
      representative: { vi: "ĐẠI DIỆN", en: "REP", ja: "担当者", zh: "代表", ko: "담당자" },
      plan: { vi: "GÓI", en: "PLAN", ja: "プラン", zh: "计划", ko: "계획" },
      wallet: { vi: "VÍ", en: "WALLET", ja: "ウォレット", zh: "钱包", ko: "지갑" },
      status: { vi: "TRẠNG THÁI", en: "STATUS", ja: "ステータス", zh: "状态", ko: "상태" },
      actions: { vi: "THAO TÁC", en: "ACTIONS", ja: "アクション", zh: "操作", ko: "작업" },
      no_plan: { vi: "Chưa có", en: "No Plan", ja: "プランなし", zh: "无计划", ko: "계획 없음" },
      expired_at: { vi: "Hết hạn {{date}}", en: "Expires {{date}}", ja: "{{date}}に期限切れ", zh: "过期于 {{date}}", ko: "{{date}} 만료" },
      action_view: { vi: "Xem chi tiết", en: "View details", ja: "詳細を見る", zh: "查看详情", ko: "세부 정보 보기" },
      action_approve: { vi: "Duyệt", en: "Approve", ja: "承認", zh: "批准", ko: "승인" },
      action_reject: { vi: "Từ chối", en: "Reject", ja: "拒否", zh: "拒绝", ko: "거부" },
      action_suspend: { vi: "Tạm dừng", en: "Suspend", ja: "一時停止", zh: "暂停", ko: "일시 중지" }
    }
  },
  dashboard: {
    title: { vi: "Dashboard Vận Hành", en: "Operational Dashboard", ja: "運用ダッシュボード", zh: "运营仪表板", ko: "운영 대시보드" },
    subtitle: {
      vi: "Theo dõi đối tác, kiểm duyệt nội dung, định vị GPS, doanh thu và trạng thái đăng ký...",
      en: "Monitor vendors, moderate content, geofences, revenue, and subscription status...",
      ja: "ベンダーの監視、コンテンツのモデレート、ジオフェンス、収益、サブスクリプションのステータス...",
      zh: "监控供应商、审核内容、地理围栏、收入和订阅状态...",
      ko: "공급업체 모니터링, 콘텐츠 조정, 지오펜스, 수익 및 구독 상태..."
    },
    kpi: {
      vendor_active: { vi: "Đối tác Active", en: "Active Vendors", ja: "アクティブベンダー", zh: "活跃供应商", ko: "활성 공급업체" },
      new_today: { vi: "+{{count}} mới hôm nay", en: "+{{count}} new today", ja: "今日+{{count}}新規", zh: "今天新增 +{{count}}", ko: "오늘 +{{count}}개 추가" },
      pending_approval: { vi: "Chờ Duyệt", en: "Pending Approval", ja: "承認待ち", zh: "等待批准", ko: "승인 대기 중" },
      needs_processing: { vi: "Cần xử lý 24h", en: "Needs action in 24h", ja: "24時間以内の対応が必要", zh: "需在24小时内处理", ko: "24시간 내 처리 필요" },
      poi_active: { vi: "POI Active", en: "Active POIs", ja: "アクティブPOI", zh: "活跃POI", ko: "활성 POI" },
      new_poi_this_week: { vi: "+{{count}} tuần này", en: "+{{count}} POIs this week", ja: "今週+{{count}}POI", zh: "本周新增 +{{count}} POI", ko: "이번 주 +{{count}} POI" },
      mrr: { vi: "Doanh thu (MRR)", en: "MRR", ja: "月次経常収益 (MRR)", zh: "月经常性收入 (MRR)", ko: "월 반복 수익 (MRR)" },
      vs_last_period: { vi: "+{{percent}}% so kỳ trước", en: "+{{percent}}% vs last period", ja: "前期比 +{{percent}}%", zh: "较上期 +{{percent}}%", ko: "이전 기간 대비 +{{percent}}%" }
    },
    charts: {
      traffic_7_days: { vi: "Lưu lượng 7 ngày", en: "7-Day Traffic", ja: "7日間のトラフィック", zh: "7天流量", ko: "7일 트래픽" },
      traffic_subtitle: {
        vi: "Lượt quét QR, GPS và giao dịch Premium",
        en: "QR scans, GPS visits, and Premium purchases",
        ja: "QRスキャン、GPS訪問、プレミアム購入",
        zh: "QR扫描，GPS访问和高级购买",
        ko: "QR 스캔, GPS 방문 및 프리미엄 구매"
      }
    },
    widgets: {
      pending_vendors: { vi: "Đối tác Chờ duyệt", en: "Pending Vendors", ja: "承認待ちのベンダー", zh: "待定供应商", ko: "보류 중인 공급업체" },
      overdue_subscriptions: { vi: "Gói cước Quá hạn", en: "Overdue Subscriptions", ja: "延滞中のサブスクリプション", zh: "逾期订阅", ko: "연체된 구독" },
      overdue_by_days: { vi: "Quá hạn {{count}} ngày", en: "Overdue by {{count}} days", ja: "{{count}}日延滞", zh: "逾期 {{count}} 天", ko: "{{count}}일 연체" },
      no_pending_vendors: { vi: "Không có đối tác chờ duyệt.", en: "No pending vendors.", ja: "承認待ちのベンダーはありません。", zh: "没有待定的供应商。", ko: "보류 중인 공급업체가 없습니다." },
      no_overdue_subs: { vi: "Không có gói quá hạn.", en: "No overdue subscriptions.", ja: "延滞中のサブスクリプションはありません。", zh: "没有逾期的订阅。", ko: "연체된 구독이 없습니다." }
    }
  },
  sidebar: {
    dashboard: { vi: "Bảng điều khiển", en: "Dashboard", ja: "ダッシュボード", zh: "仪表板", ko: "대시보드" },
    moderation: { vi: "Kiểm duyệt", en: "Moderation", ja: "モデレーション", zh: "审核", ko: "조정" }
  },
  status: {
    pending: { vi: "Chờ duyệt", en: "Pending", ja: "保留中", zh: "待定", ko: "보류 중" },
    approved: { vi: "Đã duyệt", en: "Approved", ja: "承認済み", zh: "已批准", ko: "승인됨" },
    rejected: { vi: "Từ chối", en: "Rejected", ja: "拒否済み", zh: "已拒绝", ko: "거부됨" },
    suspended: { vi: "Tạm dừng", en: "Suspended", ja: "一時停止中", zh: "已暂停", ko: "일시 중지됨" },
    hidden: { vi: "Đã ẩn", en: "Hidden", ja: "非表示", zh: "已隐藏", ko: "숨김" }
  },
  content: {
    management_subtitle: { vi: "Kiểm Duyệt Nội Dung", en: "Content Moderation", ja: "コンテンツモデレーション", zh: "内容审核", ko: "콘텐츠 조정" },
    description: {
      vi: "Kiểm duyệt ảnh, video, audio và tài liệu do đối tác tải lên. Mọi thay đổi đều được ghi log.",
      en: "Moderate images, videos, audio, and documents uploaded by vendors. Audit logs recorded.",
      ja: "ベンダーによってアップロードされた画像、ビデオ、オーディオ、およびドキュメントをモデレートします。監査ログが記録されます。",
      zh: "审核供应商上传的图像、视频、音频和文档。记录审计日志。",
      ko: "공급업체가 업로드한 이미지, 비디오, 오디오 및 문서를 조정합니다. 감사 로그가 기록됩니다."
    },
    empty_queue: { vi: "Hàng đợi hiện đang trống.", en: "Queue is currently empty.", ja: "キューは現在空です。", zh: "队列当前为空。", ko: "대기열이 현재 비어 있습니다." },
    refresh: { vi: "Làm mới", en: "Refresh", ja: "更新", zh: "刷新", ko: "새로 고침" }
  },
  admin_topup: {
    management_subtitle: { vi: "Quản lý Nạp Tiền", en: "Top-Up Management", ja: "トップアップ管理", zh: "充值管理", ko: "충전 관리" },
    title: { vi: "Quản lý Nạp Tiền", en: "Top-Up Management", ja: "トップアップ管理", zh: "充值管理", ko: "충전 관리" },
    subtitle: {
      vi: "Duyệt các yêu cầu nạp tiền vào ví của Đối tác.",
      en: "Review and approve vendor wallet top-up requests.",
      ja: "ベンダーのウォレットチャージリクエストを確認して承認します。",
      zh: "查看并批准供应商钱包充值请求。",
      ko: "공급업체 지갑 충전 요청을 검토하고 승인합니다."
    },
    tab_pending: { vi: "Chờ duyệt", en: "Pending", ja: "保留中", zh: "待定", ko: "보류 중" },
    tab_approved: { vi: "Đã duyệt", en: "Approved", ja: "承認済み", zh: "已批准", ko: "승인됨" },
    tab_rejected: { vi: "Từ chối", en: "Rejected", ja: "拒否済み", zh: "已拒绝", ko: "거부됨" },
    tab_all: { vi: "Tất cả", en: "All", ja: "すべて", zh: "全部", ko: "모두" },
    request_count: { vi: "Yêu Cầu Nạp Tiền", en: "Top-Up Requests", ja: "トップアップリクエスト", zh: "充值请求", ko: "충전 요청" },
    label_provider: { vi: "Nguồn nạp", en: "Provider", ja: "プロバイダー", zh: "提供商", ko: "제공자" },
    label_balance: { vi: "Số dư hiện tại", en: "Current Balance", ja: "現在の残高", zh: "当前余额", ko: "현재 잔액" },
    label_sub: { vi: "Gói cước", en: "Subscription", ja: "サブスクリプション", zh: "订阅", ko: "구독" },
    label_reject_reason: { vi: "Lý do từ chối", en: "Reject Reason", ja: "拒否の理由", zh: "拒绝原因", ko: "거부 이유" },
    btn_approve: { vi: "Duyệt Nạp Tiền", en: "Approve Top-Up", ja: "トップアップを承認", zh: "批准充值", ko: "충전 승인" },
    btn_reject: { vi: "Từ Chối", en: "Reject", ja: "拒否", zh: "拒绝", ko: "거부" },
    refresh: { vi: "Làm mới", en: "Refresh", ja: "更新", zh: "刷新", ko: "새로 고침" }
  },
  vendor_wallet: {
    management_subtitle: { vi: "Tài Khoản Đối Tác", en: "Vendor Accounts", ja: "ベンダーアカウント", zh: "供应商帐户", ko: "공급업체 계정" },
    title: { vi: "Tài Khoản Đối Tác", en: "Vendor Accounts", ja: "Vendor Accounts", zh: "供应商帐户", ko: "공급업체 계정" },
    subtitle: {
      vi: "Quản lý ví, giao dịch và tình trạng tài khoản của đối tác.",
      en: "Manage vendor wallets, transactions, and account health.",
      ja: "ベンダーのウォレット、トランザクション、およびアカウントの健全性を管理します。",
      zh: "管理供应商钱包，交易和帐户健康状况。",
      ko: "공급업체 지갑, 거래 및 계정 상태를 관리합니다."
    },
    vendor_count: { vi: "Đối tác", en: "Vendors", ja: "ベンダー", zh: "供应商", ko: "공급업체" },
    col_balance: { vi: "SỐ DƯ", en: "BALANCE", ja: "残高", zh: "余额", ko: "잔액" },
    col_warning: { vi: "CẢNH BÁO", en: "WARNINGS", ja: "警告", zh: "警告", ko: "경고" },
    col_action: { vi: "THAO TÁC", en: "ACTIONS", ja: "アクション", zh: "操作", ko: "작업" },
    health_insufficient: { vi: "Không đủ số dư", en: "Insufficient Balance", ja: "残高不足", zh: "余额不足", ko: "잔액 부족" },
    health_low: { vi: "Số dư thấp", en: "Low Balance", ja: "残高が少ない", zh: "余额低", ko: "잔액 낮음" },
    current_balance: { vi: "Số dư hiện tại", en: "Current Balance", ja: "現在の残高", zh: "当前余额", ko: "현재 잔액" },
    total_topup: { vi: "Tổng tiền nạp", en: "Total Top-up", ja: "合計チャージ", zh: "总充值", ko: "총 충전" },
    transaction_history: { vi: "Lịch sử giao dịch", en: "Transaction History", ja: "取引履歴", zh: "交易记录", ko: "거래 내역" },
    after_tx: { vi: "Số dư sau giao dịch", en: "Balance after TX", ja: "取引後の残高", zh: "交易后余额", ko: "거래 후 잔액" },
    refresh: { vi: "Làm mới", en: "Refresh", ja: "更新", zh: "刷新", ko: "새로 고침" }
  }
};

const allFiles = { vi, en, ja, zh, ko };

for (const [namespace, keys] of Object.entries(adminKeys)) {
  for (const lang of Object.keys(allFiles)) {
    if (!allFiles[lang][namespace]) allFiles[lang][namespace] = {};
  }
  
  for (const [keyPath, langs] of Object.entries(keys)) {
    const parts = keyPath.split('.');
    function setNested(obj, parts, val) {
      if (!val) return;
      let current = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = val;
    }
    
    setNested(vi[namespace], parts, langs.vi);
    setNested(en[namespace], parts, langs.en);
    setNested(ja[namespace], parts, langs.ja);
    setNested(zh[namespace], parts, langs.zh);
    setNested(ko[namespace], parts, langs.ko);
  }
}

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(jaPath, JSON.stringify(ja, null, 2));
fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));
fs.writeFileSync(koPath, JSON.stringify(ko, null, 2));

console.log('Successfully added Admin translations to all 5 languages.');
