export const strings = {
  vi: {
    scanPrompt: 'Quet ma QR de bat dau',
    buyBtn: 'MUA GOI KHU VUC',
    start: 'Bat dau nghe thuyet minh',
    unlockAudio: 'Bam de bat dau nghe',
    manualToken: 'Nhap ma thu cong',
    gpsDenied: 'Ban da tu choi GPS, hay bat lai trong cai dat trinh duyet.',
    offlineMode: 'Dang offline - hien thi du lieu da cache',
    goMap: 'Vao ban do',
    favorites: 'Yeu thich',
    settings: 'Cai dat',
    player: 'Trinh phat',
    payment: 'Thanh toan gia lap',
    loading: 'Dang tai...'
  },
  en: {
    scanPrompt: 'Scan QR code to begin',
    buyBtn: 'BUY ZONE PASS',
    start: 'Start narration',
    unlockAudio: 'Tap to unlock audio',
    manualToken: 'Manual token',
    gpsDenied: 'GPS permission denied. Please enable it in browser settings.',
    offlineMode: 'Offline mode - showing cached data',
    goMap: 'Go map',
    favorites: 'Favorites',
    settings: 'Settings',
    player: 'Player',
    payment: 'Mock payment',
    loading: 'Loading...'
  }
};

export function t(key, lang = 'vi') {
  return strings[lang]?.[key] ?? strings.vi[key] ?? key;
}
