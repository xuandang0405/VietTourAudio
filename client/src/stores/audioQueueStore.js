import { create } from 'zustand';

export const useAudioQueueStore = create((set, get) => ({
  queue: [],
  isProcessing: false,

  enqueue: (poiId, action) => {
    const { queue } = get();
    if (!poiId || queue.find((item) => item.poiId === poiId)) {
      return;
    }

    set({ queue: [...queue, { poiId, action }] });
    get().processQueue();
  },

  processQueue: async () => {
    const { queue, isProcessing } = get();
    if (isProcessing || queue.length === 0) return;

    set({ isProcessing: true });

    const currentItem = queue[0];
    try {
      await currentItem.action();
    } catch (error) {
      console.error('Audio queue execution error', error);
    } finally {
      set((state) => ({
        queue: state.queue.slice(1),
        isProcessing: false
      }));
      get().processQueue();
    }
  },

  clearQueue: () => {
    set({ queue: [], isProcessing: false });
  }
}));
