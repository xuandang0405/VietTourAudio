import { create } from 'zustand';

export const useAppStore = create((set) => ({
  guestId: '',
  sessionId: '',
  language: 'vi',
  audioUnlocked: false,
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  qrToken: null,
  setGuestId: (guestId) => set({ guestId }),
  setSessionId: (sessionId) => set({ sessionId }),
  setLanguage: (language) => set({ language }),
  setAudioUnlocked: (audioUnlocked) => set({ audioUnlocked }),
  setOnline: (online) => set({ online }),
  setQrToken: (qrToken) => set({ qrToken }),
  resetSession: () => set({ sessionId: '', qrToken: null })
}));
