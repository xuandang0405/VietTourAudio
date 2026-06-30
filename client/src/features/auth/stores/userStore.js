import { create } from 'zustand';

export const useUserStore = create((set) => ({
  preferences: {
    language: 'vi',
    autoplay: true
  },
  setPreferences: (preferences) =>
    set((state) => ({ preferences: { ...state.preferences, ...preferences } }))
}));
