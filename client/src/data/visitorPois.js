import heroTravel from '../assets/img/hero-travel.png';

export const PREMIUM_ACTIVATION_CODE = 'VTA-DEMO-2024';

export const mapCenter = {
  lat: 10.77582,
  lng: 106.70208
};

export const visitorPois = [
  {
    id: 'stall-antiques-nam',
    apiId: 1,
    stallId: 1,
    qrCodeId: 1001,
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
      'Sạp Đồ Cổ Chú Năm lưu giữ những món vật dụng gắn với đời sống Sài Gòn xưa: máy ảnh film, đồng hồ để bàn, hộp trà cũ và các món lưu niệm đã đi qua nhiều thế hệ. Đây là điểm dừng lý tưởng để nghe câu chuyện về nhịp buôn bán, ký ức đô thị và cách người dân địa phương gìn giữ những món đồ có linh hồn riêng.',
    descriptions: {
      vi: 'Sạp Đồ Cổ Chú Năm lưu giữ những món vật dụng gắn với đời sống Sài Gòn xưa: máy ảnh film, đồng hồ để bàn, hộp trà cũ và các món lưu niệm đã đi qua nhiều thế hệ.',
      en: 'Uncle Nam Antique Stall preserves cameras, clocks, tea tins, and souvenirs connected to everyday life in old Saigon.',
      ja: 'ナムおじさんの骨董店には、昔のサイゴンの暮らしを伝えるカメラ、時計、茶缶などが並んでいます。',
      ko: '남 아저씨의 골동품 가게에는 옛 사이공의 일상을 보여 주는 카메라, 시계와 찻통이 전시되어 있습니다.',
      zh: '南叔古董摊收藏着相机、时钟和旧茶罐，讲述昔日西贡的日常生活。'
    },
    narration: {
      vi:
        'Bạn đang đứng trước Sạp Đồ Cổ Chú Năm. Những món đồ nhỏ ở đây không chỉ để bán, mà còn kể lại nhịp sống Sài Gòn qua từng thời kỳ. Hãy nhìn kỹ những chiếc máy ảnh, đồng hồ và hộp trà cũ. Mỗi món đều giữ một mảnh ký ức của phố thị.',
      en:
        'You are standing in front of Uncle Nam Antique Stall. These objects are more than souvenirs. Cameras, clocks, and tea tins preserve small memories of old Saigon and the rhythm of local street life.',
      ja: 'ナムおじさんの骨董店へようこそ。ここにあるカメラや時計、古い茶缶は、サイゴンの街の記憶を今に伝えています。',
      ko: '남 아저씨의 골동품 가게에 오신 것을 환영합니다. 카메라와 시계, 오래된 찻통에는 사이공의 작은 기억이 담겨 있습니다.',
      zh: '欢迎来到南叔古董摊。这里的相机、时钟和旧茶罐保存着西贡街头生活的珍贵记忆。'
    }
  },
  {
    id: 'poi-city-hall',
    apiId: 2,
    stallId: 1,
    qrCodeId: 1002,
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
    descriptions: {
      vi: 'Công trình kiến trúc nổi bật ở đầu phố Nguyễn Huệ, mang dấu ấn kiến trúc Pháp và là một biểu tượng quen thuộc của trung tâm Thành phố Hồ Chí Minh.',
      en: 'This landmark at the head of Nguyen Hue Street features French architectural influence and is a familiar symbol of central Ho Chi Minh City.',
      ja: 'グエンフエ通りの正面に建つこの建物は、フランス建築の影響を残すホーチミン市中心部の象徴です。',
      ko: '응우옌후에 거리 끝에 위치한 이 건물은 프랑스 건축의 영향을 보여 주는 호찌민시의 대표적인 명소입니다.',
      zh: '这座位于阮惠街尽头的建筑带有法国建筑风格，是胡志明市中心的著名地标。'
    },
    narration: {
      vi:
        'Phía trước bạn là tòa nhà Ủy ban Nhân dân Thành phố Hồ Chí Minh, một công trình mang dấu ấn kiến trúc Pháp đầu thế kỷ hai mươi. Không gian phía trước công trình đã trở thành điểm hẹn quen thuộc của người dân và du khách.',
      en:
        'In front of you is Ho Chi Minh City Hall, a landmark with French architectural influence from the early twentieth century. The square around it has become a familiar meeting point for locals and travelers.',
      ja: '目の前にあるのはホーチミン市庁舎です。二十世紀初頭のフランス建築の影響を受け、周辺の広場は市民と旅行者の待ち合わせ場所になっています。',
      ko: '앞에 보이는 건물은 호찌민 시청입니다. 20세기 초 프랑스 건축의 영향을 받은 명소이며 주변 광장은 시민과 여행객의 만남의 장소입니다.',
      zh: '您面前的是胡志明市人民委员会大楼。这座二十世纪初受法国建筑影响的地标，周围广场已成为市民与游客熟悉的会面地点。'
    }
  },
  {
    id: 'stall-coffee-heritage',
    apiId: 3,
    stallId: 1,
    qrCodeId: 1003,
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
    descriptions: {
      vi: 'Quầy cà phê nhỏ bên phố đi bộ kể về thói quen uống cà phê vỉa hè và nhịp sống gần gũi của đô thị Việt Nam.',
      en: 'This small coffee corner tells the story of Vietnamese pavement coffee and the friendly rhythm of city life.',
      ja: '歩行者通りの小さなコーヒー店から、ベトナムの路上コーヒー文化と街の日常を感じられます。',
      ko: '보행자 거리의 작은 커피 가게에서 베트남 길거리 커피 문화와 도시의 친근한 일상을 만날 수 있습니다.',
      zh: '这间步行街旁的小咖啡摊讲述越南街边咖啡文化与亲切的城市生活节奏。'
    },
    narration: {
      vi:
        'Quầy Cà Phê Di Sản gợi lại thói quen uống cà phê rất Việt Nam: chậm rãi, gần gũi và nhiều câu chuyện. Từ một ly cà phê nhỏ, bạn có thể cảm nhận nhịp sống đường phố, tiếng trò chuyện và sự hiếu khách của người địa phương.',
      en:
        'Heritage Coffee Corner reflects a very Vietnamese coffee habit: slow, friendly, and full of stories. From one small cup, you can feel the rhythm of street life and local hospitality.',
      ja: 'ヘリテージコーヒーでは、ゆっくりと会話を楽しむベトナムらしいコーヒー文化を体験できます。一杯のコーヒーから街のリズムと人々の温かさを感じてください。',
      ko: '헤리티지 커피 코너는 느긋하고 정겨운 베트남의 커피 문화를 보여 줍니다. 작은 커피 한 잔에서 거리의 리듬과 현지인의 따뜻함을 느껴 보세요.',
      zh: '遗产咖啡角展现了缓慢、亲切而充满故事的越南咖啡习惯。透过一杯小咖啡，您可以感受街头节奏与当地人的热情。'
    }
  },
  {
    id: 'stall-book-memory',
    apiId: 4,
    stallId: 1,
    qrCodeId: 1004,
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
    descriptions: {
      vi: 'Một góc nhỏ dành cho sách cũ, bưu thiếp và tranh in địa phương, lưu giữ ký ức đô thị bằng nhịp kể chậm rãi.',
      en: 'A quiet corner of old books, postcards, and local prints that preserves urban memories at a slower pace.',
      ja: '古書、絵はがき、地元の版画が並ぶ静かな一角で、街の記憶をゆっくりたどることができます。',
      ko: '헌책과 엽서, 지역 판화가 있는 조용한 공간에서 도시의 기억을 천천히 만나 볼 수 있습니다.',
      zh: '这里陈列着旧书、明信片和本地版画，让游客以缓慢的节奏感受城市记忆。'
    },
    narration: {
      vi:
        'Góc Sách Ký Ức là nơi những trang sách cũ gặp lại nhịp sống hôm nay. Những bưu thiếp, tranh in và tập sách nhỏ ở đây lưu giữ một phần ký ức đô thị, dành cho người thích khám phá thành phố bằng nhịp chậm.',
      en:
        'Memory Book Corner is where old pages meet today’s city rhythm. Postcards, prints, and small books preserve a quiet urban memory for travelers who enjoy discovering the city slowly.',
      ja: 'メモリーブックコーナーでは、古いページと現代の街のリズムが出会います。絵はがきや版画、小さな本が静かな都市の記憶を伝えています。',
      ko: '메모리 북 코너는 오래된 책장과 오늘의 도시 리듬이 만나는 곳입니다. 엽서와 판화, 작은 책들이 조용한 도시의 기억을 전합니다.',
      zh: '记忆书角让旧书页与今天的城市节奏相遇。明信片、版画和小书为喜欢慢慢探索城市的旅行者保存着安静的都市记忆。'
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
  return visitorPois.find((poi) => poi.id === id || String(poi.apiId) === String(id)) ?? visitorPois[0];
}

export function getLocalizedPoiContent(poi, languageCode = 'vi') {
  return {
    description: poi?.descriptions?.[languageCode] ?? poi?.description ?? '',
    narration: poi?.narration?.[languageCode] ?? poi?.narration?.vi ?? poi?.description ?? ''
  };
}

const poiLabels = {
  'stall-antiques-nam': {
    en: ['Uncle Nam Antique Stall', 'Nguyen Hue Walking Street', 'Local heritage'],
    zh: ['南叔古董摊', '阮惠步行街', '本地文化遗产'],
    ja: ['ナムおじさんの骨董店', 'グエンフエ歩行者通り', '地域文化遺産'],
    ko: ['남 아저씨 골동품 가게', '응우옌후에 보행자 거리', '지역 문화유산']
  },
  'poi-city-hall': {
    en: ['Ho Chi Minh City Hall', 'Nguyen Hue Walking Street', 'Architecture'],
    zh: ['胡志明市人民委员会大楼', '阮惠步行街', '建筑'],
    ja: ['ホーチミン市庁舎', 'グエンフエ歩行者通り', '建築'],
    ko: ['호찌민 시청', '응우옌후에 보행자 거리', '건축']
  },
  'stall-coffee-heritage': {
    en: ['Heritage Coffee Corner', 'Nguyen Hue Walking Street', 'Local cuisine'],
    zh: ['遗产咖啡角', '阮惠步行街', '当地美食'],
    ja: ['ヘリテージコーヒー', 'グエンフエ歩行者通り', '郷土料理'],
    ko: ['헤리티지 커피 코너', '응우옌후에 보행자 거리', '지역 음식']
  },
  'stall-book-memory': {
    en: ['Memory Book Corner', 'Nguyen Hue Walking Street', 'Culture'],
    zh: ['记忆书角', '阮惠步行街', '文化'],
    ja: ['メモリーブックコーナー', 'グエンフエ歩行者通り', '文化'],
    ko: ['메모리 북 코너', '응우옌후에 보행자 거리', '문화']
  }
};

export function localizePoi(poi, languageCode = 'vi') {
  const labels = poiLabels[poi.id]?.[languageCode];
  const content = getLocalizedPoiContent(poi, languageCode);
  if (!labels) return { ...poi, ...content };
  const distance = poi.distanceHint?.match(/\d+/)?.[0];
  const distanceHint = distance
    ? ({ en: `About ${distance}m away`, zh: `约${distance}米`, ja: `約${distance}m`, ko: `약 ${distance}m` }[languageCode] ?? poi.distanceHint)
    : poi.distanceHint;
  return { ...poi, title: labels[0], zoneName: labels[1], category: labels[2], distanceHint, ...content };
}

const destinationLabels = {
  'nguyen-hue': { en: ['Nguyen Hue Walking Street', 'Ho Chi Minh City', 'Open'], zh: ['阮惠步行街', '胡志明市', '开放中'], ja: ['グエンフエ歩行者通り', 'ホーチミン市', '公開中'], ko: ['응우옌후에 보행자 거리', '호찌민시', '운영 중'] },
  'ben-thanh': { en: ['Ben Thanh Market', 'Ho Chi Minh City', 'QR required'], zh: ['滨城市场', '胡志明市', '需要扫码'], ja: ['ベンタイン市場', 'ホーチミン市', 'QRが必要'], ko: ['벤탄 시장', '호찌민시', 'QR 필요'] },
  'hue-citadel': { en: ['Hue Imperial City', 'Hue', 'Preview'], zh: ['顺化皇城', '顺化', '预览'], ja: ['フエ王宮', 'フエ', 'プレビュー'], ko: ['후에 황성', '후에', '미리 보기'] },
  'hoi-an': { en: ['Hoi An Ancient Town', 'Quang Nam', 'QR required'], zh: ['会安古城', '广南省', '需要扫码'], ja: ['ホイアン旧市街', 'クアンナム', 'QRが必要'], ko: ['호이안 올드타운', '꽝남', 'QR 필요'] }
};

export function localizeDestination(destination, languageCode = 'vi') {
  const labels = destinationLabels[destination.id]?.[languageCode];
  return labels ? { ...destination, name: labels[0], city: labels[1], label: labels[2] } : destination;
}
