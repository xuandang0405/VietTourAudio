import heroTravel from '../assets/img/hero-travel.png';

export const defaultZoneSlug = 'nguyen-hue';

export const zones = [
  {
    id: 'zone-nguyen-hue',
    slug: 'nguyen-hue',
    name: 'Phố đi bộ Nguyễn Huệ',
    city: 'TP. Hồ Chí Minh',
    coverImage: heroTravel,
    summary: 'Khám phá lịch sử và những câu chuyện thú vị đằng sau con phố sầm uất nhất Sài Gòn.',
    stats: ['25 Điểm tham quan', '45 Phút Audio', 'Đánh giá 4.8/5'],
    audioPrice: '30.000Đ',
    qrCode: 'VTA-ZONE-NGUYEN-HUE-001',
    qrPath: '/zone/nguyen-hue',
    statusLabel: 'Đã mở bằng QR khu vực',
    accessLabel: 'Xem trước',
    mapBoundsLabel: 'Giới hạn tuyến phố Nguyễn Huệ',
    poiCount: 25,
    audioMinutes: 45,
    rating: '4.8',
    pois: [
      {
        id: 'stall-antiques-nam',
        name: 'Sạp Đồ Cổ Chú Năm',
        type: 'Sạp đồ cổ',
        distance: 'Cách bạn 15m',
        audioLength: '04:20',
        nearest: true,
        premium: true,
        positionClass: 'pin-nguyen-hue-1',
        initials: 'CN'
      },
      {
        id: 'poi-city-hall',
        name: 'Tòa nhà UBND Thành phố',
        type: 'Di tích kiến trúc',
        distance: 'Cách bạn 42m',
        audioLength: '06:15',
        nearest: false,
        premium: false,
        positionClass: 'pin-nguyen-hue-2',
        initials: 'UB'
      },
      {
        id: 'stall-coffee-heritage',
        name: 'Quầy Cà Phê Di Sản',
        type: 'Ẩm thực địa phương',
        distance: 'Cách bạn 68m',
        audioLength: '03:40',
        nearest: false,
        premium: false,
        positionClass: 'pin-nguyen-hue-3',
        initials: 'CF'
      }
    ]
  },
  {
    id: 'zone-ben-thanh',
    slug: 'ben-thanh',
    name: 'Chợ Bến Thành',
    city: 'TP. Hồ Chí Minh',
    coverImage: heroTravel,
    summary: 'Một vòng audio quanh khu chợ biểu tượng với ẩm thực, quà lưu niệm và chuyện nghề thương hồ.',
    stats: ['18 Điểm tham quan', '36 Phút Audio', 'Đánh giá 4.7/5'],
    audioPrice: '25.000Đ',
    qrCode: 'VTA-ZONE-BEN-THANH-002',
    qrPath: '/zone/ben-thanh',
    statusLabel: 'Cần quét QR tại cổng',
    accessLabel: 'Cần quét QR',
    mapBoundsLabel: 'Giới hạn khu Chợ Bến Thành',
    poiCount: 18,
    audioMinutes: 36,
    rating: '4.7',
    pois: []
  },
  {
    id: 'zone-hue-citadel',
    slug: 'hue-citadel',
    name: 'Hoàng Thành Huế',
    city: 'Thừa Thiên Huế',
    coverImage: heroTravel,
    summary: 'Không gian thuyết minh di sản triều Nguyễn với audio đa ngôn ngữ và tuyến tham quan gợi ý.',
    stats: ['31 Điểm tham quan', '58 Phút Audio', 'Đánh giá 4.9/5'],
    audioPrice: '40.000Đ',
    qrCode: 'VTA-ZONE-HUE-CITADEL-003',
    qrPath: '/zone/hue-citadel',
    statusLabel: 'Cần quét QR tại điểm vào',
    accessLabel: 'Cần quét QR',
    mapBoundsLabel: 'Giới hạn Hoàng Thành Huế',
    poiCount: 31,
    audioMinutes: 58,
    rating: '4.9',
    pois: []
  },
  {
    id: 'zone-hoi-an',
    slug: 'hoi-an',
    name: 'Phố cổ Hội An',
    city: 'Quảng Nam',
    coverImage: heroTravel,
    summary: 'Tuyến audio buổi hoàng hôn qua chùa Cầu, nhà cổ, hội quán và những con hẻm ven sông.',
    stats: ['22 Điểm tham quan', '45 Phút Audio', 'Đánh giá 4.9/5'],
    audioPrice: '35.000Đ',
    qrCode: 'VTA-ZONE-HOI-AN-004',
    qrPath: '/zone/hoi-an',
    statusLabel: 'Xem trước trước khi quét',
    accessLabel: 'Xem trước',
    mapBoundsLabel: 'Giới hạn phố cổ Hội An',
    poiCount: 22,
    audioMinutes: 45,
    rating: '4.9',
    pois: []
  }
];

export function getZoneBySlug(slug) {
  return zones.find((zone) => zone.slug === slug) ?? zones[0];
}

export function getZoneQrValue(zone) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://viettouraudio.vn';
  return new URL(zone.qrPath, origin).toString();
}
