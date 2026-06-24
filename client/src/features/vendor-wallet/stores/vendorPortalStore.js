import { create } from 'zustand';

/**
 * Vendor Portal Store — Provides mock data for offline-first development.
 * When the backend API is available, components fetch from API and fall back to this store.
 */

const MOCK_STALL = {
  id: '1',
  name: 'Sạp Bánh Tráng Nướng',
  category: 'Ẩm thực đường phố',
  latitude: 10.7740,
  longitude: 106.7030,
  isPremium: false,
  activationRadius: 3,
  priorityScore: 0,
  imageUrl: null,
  status: 'APPROVED'
};

const MOCK_CONTENT = {
  id: '1',
  poiId: '1',
  language: 'vi',
  title: 'Sạp Bánh Tráng Nướng - Phố đi bộ Nguyễn Huệ',
  ttsScript: 'Chào mừng bạn đến với sạp Bánh Tráng Nướng tại phố đi bộ Nguyễn Huệ! Đây là một trong những món ăn vặt nổi tiếng nhất Sài Gòn, với hương vị thơm giòn đặc trưng từ bánh tráng nướng phủ trứng, hành lá, tôm khô và sốt mayo.',
  approvalStatus: 'approved',
  lastUpdatedAt: '2026-06-20T10:00:00Z'
};

const MOCK_SUBSCRIPTION = {
  planName: 'Gói Cơ Bản',
  status: 'ACTIVE',
  nextBillingDate: '2026-07-15',
  paymentStatus: 'unpaid',
  priceSnapshot: '150000'
};

const MOCK_STATS = {
  todayVisitors: 47,
  todayAudioPlays: 23,
  todayQrScans: 12,
  todayRevenue: '85000',
  totalVisitors: 1284,
  totalAudioPlays: 623,
  totalQrScans: 318,
  totalRevenue: '2450000'
};

const STALL_CATEGORIES = [
  'Ẩm thực đường phố',
  'Đồ uống & Giải khát',
  'Thủ công mỹ nghệ',
  'Thời trang & Phụ kiện',
  'Quà lưu niệm',
  'Nghệ thuật & Biểu diễn',
  'Dịch vụ du lịch',
  'Khác'
];

// Nguyen Hue Walking Street bounding box (for location validation)
const ZONE_BOUNDS = {
  north: 10.7780,
  south: 10.7710,
  east: 106.7060,
  west: 106.7000
};

export const useVendorPortalStore = create((set, get) => ({
  // --- State ---
  stall: { ...MOCK_STALL },
  content: { ...MOCK_CONTENT },
  subscription: { ...MOCK_SUBSCRIPTION },
  stats: { ...MOCK_STATS },
  categories: STALL_CATEGORIES,
  zoneBounds: ZONE_BOUNDS,
  isPayingSubscription: false,
  isSavingStall: false,
  isSavingContent: false,
  contentValidationError: '',

  // --- Stall Actions ---
  updateStallLocation: (latitude, longitude) => {
    const bounds = get().zoneBounds;
    if (latitude < bounds.south || latitude > bounds.north || longitude < bounds.west || longitude > bounds.east) {
      return { success: false, error: 'Vị trí nằm ngoài khu vực được gán. Vui lòng chọn vị trí trong phạm vi phố đi bộ Nguyễn Huệ.' };
    }
    set((state) => ({ stall: { ...state.stall, latitude, longitude } }));
    return { success: true };
  },

  updateStallInfo: (data) => {
    set((state) => ({ stall: { ...state.stall, ...data } }));
  },

  togglePremium: () => {
    set((state) => ({
      stall: {
        ...state.stall,
        isPremium: !state.stall.isPremium,
        activationRadius: state.stall.isPremium ? 3 : 10,
        priorityScore: state.stall.isPremium ? 0 : 100
      }
    }));
  },

  saveStall: async () => {
    set({ isSavingStall: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ isSavingStall: false });
    return { success: true };
  },

  // --- Content Actions ---
  updateContentScript: (ttsScript) => {
    if (get().content.approvalStatus === 'pending') {
      set({ contentValidationError: 'Không thể chỉnh sửa nội dung đang chờ duyệt.' });
      return;
    }
    set((state) => ({
      content: { ...state.content, ttsScript },
      contentValidationError: ''
    }));
  },

  submitContent: async () => {
    const { content } = get();
    if (content.ttsScript.trim().length < 50) {
      set({ contentValidationError: 'Nội dung TTS phải có ít nhất 50 ký tự để AI đọc giọng chuẩn.' });
      return { success: false };
    }
    // Check punctuation
    const hasPunctuation = /[.,;:!?]/.test(content.ttsScript);
    if (!hasPunctuation) {
      set({ contentValidationError: 'Vui lòng thêm dấu câu (dấu chấm, phẩy, chấm than...) để AI đọc giọng tự nhiên hơn.' });
      return { success: false };
    }

    set({ isSavingContent: true, contentValidationError: '' });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set((state) => ({
      content: { ...state.content, approvalStatus: 'pending', lastUpdatedAt: new Date().toISOString() },
      isSavingContent: false
    }));
    return { success: true };
  },

  // --- Subscription Actions ---
  mockPaySubscription: async () => {
    set({ isPayingSubscription: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const currentDate = get().subscription.nextBillingDate
      ? new Date(get().subscription.nextBillingDate)
      : new Date();
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 30);

    set((state) => ({
      subscription: {
        ...state.subscription,
        paymentStatus: 'paid',
        nextBillingDate: nextDate.toISOString().split('T')[0]
      },
      isPayingSubscription: false
    }));
    return { success: true };
  },

  // --- Reset ---
  resetToMock: () => {
    set({
      stall: { ...MOCK_STALL },
      content: { ...MOCK_CONTENT },
      subscription: { ...MOCK_SUBSCRIPTION },
      stats: { ...MOCK_STATS },
      contentValidationError: ''
    });
  }
}));
