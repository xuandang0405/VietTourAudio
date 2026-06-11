import { create } from 'zustand';

export const useAudioQueueStore = create((set, get) => ({
  queue: [],
  isProcessing: false,

  enqueue: (poiId, action) => {
    const { queue } = get();
    // Ngăn chặn việc add cùng 1 POI nhiều lần vào hàng chờ nếu đang có sẵn
    if (!queue.find(q => q.poiId === poiId)) {
      set({ queue: [...queue, { poiId, action }] });
      get().processQueue();
    }
  },

  processQueue: async () => {
    const { queue, isProcessing } = get();
    if (isProcessing || queue.length === 0) return;

    set({ isProcessing: true });
    
    const currentItem = queue[0];
    try {
      await currentItem.action(); // Thực thi phát audio
    } catch (e) {
      console.error('Audio queue execution error', e);
    } finally {
      set((state) => ({ 
        queue: state.queue.slice(1), 
        isProcessing: false 
      }));
      // Xử lý bài tiếp theo nếu có
      get().processQueue();
    }
  },

  clearQueue: () => {
    set({ queue: [], isProcessing: false });
  }
}));
