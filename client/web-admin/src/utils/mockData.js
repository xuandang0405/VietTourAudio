export const dashboardStats = [
  { label: 'Active Tours', value: 4, sub: '+1 this week' },
  { label: 'POI Total', value: 52, sub: '8 premium spots' },
  { label: 'Listens Today', value: 1240, sub: '+12% vs yesterday' },
  { label: 'Revenue (VND)', value: '8.540.000', sub: 'Mock payments' }
];

export const chartData = [
  { day: 'Mon', plays: 640 },
  { day: 'Tue', plays: 720 },
  { day: 'Wed', plays: 690 },
  { day: 'Thu', plays: 820 },
  { day: 'Fri', plays: 900 },
  { day: 'Sat', plays: 980 },
  { day: 'Sun', plays: 1240 }
];

export const sampleRows = {
  pois: [
    { id: 1, name: 'Pho di bo Nguyen Hue', type: 'street', premium: false, radius: 18 },
    { id: 2, name: 'Nha hat Thanh pho', type: 'landmark', premium: true, radius: 15 }
  ],
  tours: [
    { id: 101, name: 'Sai Gon Dem', status: 'ACTIVE', zones: 12 },
    { id: 102, name: 'Dau an Kien truc', status: 'DRAFT', zones: 8 }
  ],
  users: [
    { id: 'u1', email: 'admin@viettour.vn', role: 'ADMIN', status: 'ACTIVE' },
    { id: 'u2', email: 'vendor@viettour.vn', role: 'VENDOR', status: 'ACTIVE' }
  ],
  payments: [
    { id: 'p1', guestId: 'g-11', amount: 39000, status: 'PAID' },
    { id: 'p2', guestId: 'g-12', amount: 39000, status: 'PENDING' }
  ]
};
