import heroTravel from '../../assets/img/hero-travel.png';

export const adminUserRoles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  FINANCE: 'FINANCE'
};

export const dashboardKpis = [
  {
    label: 'Vendor active',
    value: '47',
    helper: '+3 mới hôm nay',
    trend: 'up',
    tone: 'blue'
  },
  {
    label: 'Chờ duyệt',
    value: '12',
    helper: 'Cần xử lý trong 24h',
    trend: 'warning',
    tone: 'amber'
  },
  {
    label: 'POI active',
    value: '134',
    helper: '+8 POI tuần này',
    trend: 'up',
    tone: 'green'
  },
  {
    label: 'MRR',
    value: '86.4M',
    helper: '+12% so với kỳ trước',
    trend: 'up',
    tone: 'indigo'
  }
];

export const trafficSeries = [
  { day: 'T2', qrScans: 720, gpsVisits: 420, premium: 96 },
  { day: 'T3', qrScans: 860, gpsVisits: 510, premium: 130 },
  { day: 'T4', qrScans: 1040, gpsVisits: 620, premium: 184 },
  { day: 'T5', qrScans: 980, gpsVisits: 590, premium: 160 },
  { day: 'T6', qrScans: 1310, gpsVisits: 780, premium: 228 },
  { day: 'T7', qrScans: 1820, gpsVisits: 1120, premium: 360 },
  { day: 'CN', qrScans: 1940, gpsVisits: 1210, premium: 410 }
];

export const vendors = [
  {
    id: 'V-891',
    businessName: 'Sạp Đồ Cổ Chú Năm',
    ownerDisplayName: 'Nguyễn Văn Năm',
    ownerEmail: 'nam.antiques@example.com',
    contactPhone: '0901 234 891',
    taxCode: '0318910001',
    verificationStatus: 'PENDING',
    createdAt: '2026-06-10',
    subscription: {
      plan: 'Premium Vendor',
      status: 'TRIAL',
      periodEnd: '2026-06-25'
    },
    stalls: 2,
    revenue: 4250000
  },
  {
    id: 'V-890',
    businessName: 'Quầy Cà Phê Di Sản',
    ownerDisplayName: 'Trần Thị Hương',
    ownerEmail: 'heritage.coffee@example.com',
    contactPhone: '0912 555 890',
    taxCode: '0318900002',
    verificationStatus: 'APPROVED',
    createdAt: '2026-06-08',
    subscription: {
      plan: 'Standard',
      status: 'ACTIVE',
      periodEnd: '2026-07-08'
    },
    stalls: 1,
    revenue: 2910000
  },
  {
    id: 'V-889',
    businessName: 'Góc Sách Ký Ức',
    ownerDisplayName: 'Lê Minh An',
    ownerEmail: 'books.memory@example.com',
    contactPhone: '0933 889 001',
    taxCode: '0318890003',
    verificationStatus: 'REJECTED',
    rejectionReason: 'Thiếu giấy phép kinh doanh hợp lệ.',
    createdAt: '2026-06-06',
    subscription: {
      plan: 'Standard',
      status: 'CANCELLED',
      periodEnd: '2026-06-11'
    },
    stalls: 1,
    revenue: 780000
  },
  {
    id: 'V-888',
    businessName: 'Lụa Hội An',
    ownerDisplayName: 'Phạm Thị Linh',
    ownerEmail: 'silk.hoian@example.com',
    contactPhone: '0988 778 888',
    taxCode: '4008880004',
    verificationStatus: 'SUSPENDED',
    createdAt: '2026-05-28',
    subscription: {
      plan: 'Premium Vendor',
      status: 'OVERDUE',
      periodEnd: '2026-06-03'
    },
    stalls: 3,
    revenue: 6340000
  }
];

export const mediaQueue = [
  {
    id: 'M-1092',
    mediaType: 'IMAGE',
    title: 'Ảnh mặt tiền Sạp Đồ Cổ',
    vendorName: 'Sạp Đồ Cổ Chú Năm',
    poiName: 'Sạp Đồ Cổ Chú Năm',
    moderationStatus: 'PENDING',
    createdAt: '2026-06-10 09:40',
    previewUrl: heroTravel,
    size: '1.8 MB'
  },
  {
    id: 'M-1091',
    mediaType: 'AUDIO',
    title: 'Audio tiếng Việt - Quầy Cà Phê',
    vendorName: 'Quầy Cà Phê Di Sản',
    poiName: 'Quầy Cà Phê Di Sản',
    moderationStatus: 'PENDING',
    createdAt: '2026-06-10 08:12',
    previewUrl: heroTravel,
    size: '4.2 MB'
  },
  {
    id: 'M-1089',
    mediaType: 'VIDEO',
    title: 'Video giới thiệu không gian lụa',
    vendorName: 'Lụa Hội An',
    poiName: 'Gian hàng lụa',
    moderationStatus: 'APPROVED',
    createdAt: '2026-06-09 17:20',
    previewUrl: heroTravel,
    size: '8.7 MB'
  },
  {
    id: 'M-1088',
    mediaType: 'IMAGE',
    title: 'Ảnh sách cũ',
    vendorName: 'Góc Sách Ký Ức',
    poiName: 'Góc Sách Ký Ức',
    moderationStatus: 'REJECTED',
    createdAt: '2026-06-08 14:04',
    previewUrl: heroTravel,
    size: '2.1 MB'
  }
];

export const adminPois = [
  {
    id: 'P-501',
    name: 'Sạp Đồ Cổ Chú Năm',
    category: 'Di sản địa phương',
    stallName: 'Sạp Đồ Cổ Chú Năm',
    status: 'ACTIVE',
    latitude: 10.77589,
    longitude: 106.70184,
    activationRadius: 35,
    contents: 2,
    mediaFiles: 4
  },
  {
    id: 'P-502',
    name: 'Tòa nhà UBND Thành phố',
    category: 'Kiến trúc',
    stallName: 'Tuyến Nguyễn Huệ',
    status: 'ACTIVE',
    latitude: 10.77672,
    longitude: 106.70102,
    activationRadius: 45,
    contents: 2,
    mediaFiles: 3
  },
  {
    id: 'P-503',
    name: 'Quầy Cà Phê Di Sản',
    category: 'Ẩm thực địa phương',
    stallName: 'Quầy Cà Phê Di Sản',
    status: 'DRAFT',
    latitude: 10.77521,
    longitude: 106.70245,
    activationRadius: 32,
    contents: 1,
    mediaFiles: 2
  },
  {
    id: 'P-504',
    name: 'Góc Sách Ký Ức',
    category: 'Văn hóa',
    stallName: 'Góc Sách Ký Ức',
    status: 'HIDDEN',
    latitude: 10.77508,
    longitude: 106.70136,
    activationRadius: 30,
    contents: 2,
    mediaFiles: 1
  }
];

export const payments = [
  {
    id: 'PAY-7801',
    vendorName: 'Sạp Đồ Cổ Chú Năm',
    paymentType: 'VENDOR_MONTHLY',
    provider: 'BANK_QR',
    amount: 1200000,
    status: 'PAID',
    createdAt: '2026-06-10 10:18'
  },
  {
    id: 'PAY-7800',
    vendorName: 'Quầy Cà Phê Di Sản',
    paymentType: 'APP_PREMIUM',
    provider: 'MOMO',
    amount: 30000,
    status: 'PAID',
    createdAt: '2026-06-10 09:58'
  },
  {
    id: 'PAY-7799',
    vendorName: 'Lụa Hội An',
    paymentType: 'COMMISSION_PAYOUT',
    provider: 'MANUAL',
    amount: 640000,
    status: 'PENDING',
    createdAt: '2026-06-09 16:22'
  }
];

export const commissions = [
  {
    id: 'COM-301',
    vendorName: 'Sạp Đồ Cổ Chú Năm',
    baseAmount: 4200000,
    commissionRate: '8%',
    commissionAmount: 336000,
    status: 'APPROVED'
  },
  {
    id: 'COM-300',
    vendorName: 'Lụa Hội An',
    baseAmount: 8000000,
    commissionRate: '8%',
    commissionAmount: 640000,
    status: 'PENDING'
  }
];

export const subscriptions = [
  {
    id: 'SUB-881',
    vendorName: 'Lụa Hội An',
    plan: 'Premium Vendor',
    status: 'OVERDUE',
    periodEnd: '2026-06-03',
    daysLeft: -8
  },
  {
    id: 'SUB-882',
    vendorName: 'Sạp Đồ Cổ Chú Năm',
    plan: 'Premium Vendor',
    status: 'TRIAL',
    periodEnd: '2026-06-25',
    daysLeft: 14
  },
  {
    id: 'SUB-883',
    vendorName: 'Quầy Cà Phê Di Sản',
    plan: 'Standard',
    status: 'ACTIVE',
    periodEnd: '2026-07-08',
    daysLeft: 27
  }
];

export const auditLogs = [
  {
    id: 'AUD-991',
    performedBy: 'superadmin@viettouraudio.vn',
    action: 'VENDOR_APPROVE',
    targetType: 'Vendor',
    targetLabel: 'Quầy Cà Phê Di Sản',
    ipAddress: '127.0.0.1',
    createdAt: '2026-06-10 10:02',
    reason: 'Hồ sơ hợp lệ',
    beforeData: { verificationStatus: 'PENDING' },
    afterData: { verificationStatus: 'APPROVED' }
  },
  {
    id: 'AUD-990',
    performedBy: 'moderator@viettouraudio.vn',
    action: 'MEDIA_REJECT',
    targetType: 'MediaFile',
    targetLabel: 'Ảnh sách cũ',
    ipAddress: '127.0.0.1',
    createdAt: '2026-06-10 09:14',
    reason: 'Ảnh mờ, cần upload lại',
    beforeData: { moderationStatus: 'PENDING' },
    afterData: { moderationStatus: 'REJECTED' }
  }
];

export const adminUsers = [
  {
    id: 'U-001',
    displayName: 'Super Admin',
    email: 'superadmin@viettouraudio.vn',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-05-20'
  },
  {
    id: 'U-002',
    displayName: 'Moderator',
    email: 'moderator@viettouraudio.vn',
    role: 'MODERATOR',
    status: 'ACTIVE',
    createdAt: '2026-05-24'
  },
  {
    id: 'U-003',
    displayName: 'Finance Operator',
    email: 'finance@viettouraudio.vn',
    role: 'FINANCE',
    status: 'LOCKED',
    createdAt: '2026-05-28'
  }
];

export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
}
