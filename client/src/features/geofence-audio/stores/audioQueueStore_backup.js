import { create } from 'zustand';

export const useAudioQueueStore = create((set) => ({
  queue: [],
  currentTrack: null,
  setQueue: (queue) => set({ queue }),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),
  clearQueue: () => set({ queue: [], currentTrack: null })
}));
