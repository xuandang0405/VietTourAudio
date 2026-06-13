import heroTravel from '../assets/img/hero-travel.png';

export const PREMIUM_ACTIVATION_CODE = 'VTA-DEMO-2024';

export const mapCenter = {
  lat: 10.77582,
  lng: 106.70208
};

export const visitorPois = [
  {
    id: 'stall-antiques-nam',
    title: 'Sạp Đồ Cổ Chú Năm',
    zoneName: 'Phố đi bộ Nguyễn Huệ',
    category: 'Di sản địa phương',
    distanceHint: 'Cách bạn 5m',
    duration: '04:20',
    rating: '4.9',
    priceLabel: 'Miễn phí bản chữ',
    image: heroTravel,
    latitude: 10.77589,
    longitude: 106.70184,
    activationRadius: 35,
    isPremiumPoi: true,
    description:
      'Sạp Đồ Cổ Chú Năm lưu giữ những món vật dụng gắn với đời sống Sài Gòn xưa: máy ảnh phim, đồng hồ để bàn, hộp trà cũ và các món lưu niệm đã đi qua nhiều thế hệ. Đây là điểm dừng lý tưởng để nghe câu chuyện về nhịp buôn bán, ký ức đô thị và cách người dân địa phương gìn giữ những món đồ có linh hồn riêng.',
    narration: {
      vi:
        'Bạn đang đứng trước Sạp Đồ Cổ Chú Năm. Những món đồ nhỏ ở đây không chỉ để bán, mà còn kể lại nhịp sống Sài Gòn qua từng thời kỳ. Hãy nhìn kỹ những chiếc máy ảnh, đồng hồ và hộp trà cũ. Mỗi món đều giữ một mảnh ký ức của phố thị.',
      en:
        'You are standing in front of Uncle Nam Antique Stall. These objects are more than souvenirs. Cameras, clocks, and tea tins preserve small memories of old Saigon and the rhythm of local street life.'
    }
  },
  {
    id: 'poi-city-hall',
    title: 'Tòa nhà UBND Thành phố',
    zoneName: 'Phố đi bộ Nguyễn Huệ',
    category: 'Kiến trúc',
    distanceHint: 'Cách bạn 42m',
    duration: '06:15',
    rating: '4.8',
    priceLabel: 'Miễn phí bản chữ',
    image: heroTravel,
    latitude: 10.77672,
    longitude: 106.70102,
    activationRadius: 45,
    isPremiumPoi: false,
    description:
      'Công trình kiến trúc nổi bật ở đầu phố Nguyễn Huệ, thường xuất hiện trong các hành trình khám phá trung tâm thành phố. Nội dung giới thiệu bối cảnh lịch sử, phong cách kiến trúc và vai trò biểu tượng của công trình trong đời sống đô thị hiện đại.',
    narration: {
      vi:
        'Phía trước bạn là tòa nhà Ủy ban Nhân dân Thành phố Hồ Chí Minh, một công trình mang dấu ấn kiến trúc Pháp đầu thế kỷ hai mươi. Không gian phía trước công trình đã trở thành điểm hẹn quen thuộc của người dân và du khách.',
      en:
        'In front of you is Ho Chi Minh City Hall, a landmark with French architectural influence from the early twentieth century. The square around it has become a familiar meeting point for locals and travelers.'
    }
  },
  {
    id: 'stall-coffee-heritage',
    title: 'Quầy Cà Phê Di Sản',
    zoneName: 'Phố đi bộ Nguyễn Huệ',
    category: 'Ẩm thực địa phương',
    distanceHint: 'Cách bạn 68m',
    duration: '03:40',
    rating: '4.7',
    priceLabel: 'Miễn phí bản chữ',
    image: heroTravel,
    latitude: 10.77521,
    longitude: 106.70245,
    activationRadius: 32,
    isPremiumPoi: false,
    description:
      'Quầy cà phê nhỏ nằm nép cạnh tuyến phố đi bộ, nơi hương cà phê rang đậm hòa với tiếng người qua lại. Nội dung thuyết minh kể về thói quen uống cà phê vỉa hè, sự giao thoa giữa nhịp sống hiện đại và những nếp sinh hoạt quen thuộc của đô thị Việt Nam.',
    narration: {
      vi:
        'Quầy Cà Phê Di Sản gợi lại thói quen uống cà phê rất Việt Nam: chậm rãi, gần gũi và nhiều câu chuyện. Từ một ly cà phê nhỏ, bạn có thể cảm nhận nhịp sống đường phố, tiếng trò chuyện và sự hiếu khách của người địa phương.',
      en:
        'Heritage Coffee Corner reflects a very Vietnamese coffee habit: slow, friendly, and full of stories. From one small cup, you can feel the rhythm of street life and local hospitality.'
    }
  },
  {
    id: 'stall-book-memory',
    title: 'Góc Sách Ký Ức',
    zoneName: 'Phố đi bộ Nguyễn Huệ',
    category: 'Văn hóa',
    distanceHint: 'Cách bạn 93m',
    duration: '02:55',
    rating: '4.6',
    priceLabel: 'Miễn phí bản chữ',
    image: heroTravel,
    latitude: 10.77508,
    longitude: 106.70136,
    activationRadius: 30,
    isPremiumPoi: true,
    description:
      'Một góc nhỏ dành cho sách cũ, bưu thiếp và tranh in địa phương. Bản chữ giúp du khách hiểu thêm về ký ức đô thị, thói quen đọc sách xưa và cách các gian hàng nhỏ tạo nên bản sắc riêng cho tuyến tham quan.',
    narration: {
      vi:
        'Góc Sách Ký Ức là nơi những trang sách cũ gặp lại nhịp sống hôm nay. Những bưu thiếp, tranh in và tập sách nhỏ ở đây lưu giữ một phần ký ức đô thị, dành cho người thích khám phá thành phố bằng nhịp chậm.',
      en:
        'Memory Book Corner is where old pages meet today city rhythm. Postcards, prints, and small books preserve a quiet urban memory for travelers who enjoy discovering the city slowly.'
    }
  }
];

export const destinationPreviews = [
  {
    id: 'nguyen-hue',
    name: 'Phố đi bộ Nguyễn Huệ',
    city: 'TP. Hồ Chí Minh',
    label: 'Đang mở',
    image: heroTravel
  },
  {
    id: 'ben-thanh',
    name: 'Chợ Bến Thành',
    city: 'TP. Hồ Chí Minh',
    label: 'Cần quét QR',
    image: heroTravel
  },
  {
    id: 'hue-citadel',
    name: 'Hoàng Thành Huế',
    city: 'Thừa Thiên Huế',
    label: 'Xem trước',
    image: heroTravel
  },
  {
    id: 'hoi-an',
    name: 'Phố cổ Hội An',
    city: 'Quảng Nam',
    label: 'Cần quét QR',
    image: heroTravel
  }
];

export function getPoiById(id) {
  return visitorPois.find((poi) => poi.id === id) ?? visitorPois[0];
}
