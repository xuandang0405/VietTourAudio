import { create } from 'zustand';

export const useAudioStore = create((set) => ({
  selectedPOI: null,
  selectedNarration: null,
  isPlaying: false,
  progress: 0,
  currentTime: 0,
  duration: 0,
  speed: 1,
  autoPlay: true,
  queue: [],
  error: null,
  setSelectedPOI: (selectedPOI) => set({ selectedPOI }),
  setSelectedNarration: (selectedNarration) => set({ selectedNarration }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setSpeed: (speed) => set({ speed }),
  setAutoPlay: (autoPlay) => set({ autoPlay }),
  setError: (error) => set({ error }),
  enqueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
  dequeue: () => set((s) => ({ queue: s.queue.slice(1) })),
  clearQueue: () => set({ queue: [] })
}));
