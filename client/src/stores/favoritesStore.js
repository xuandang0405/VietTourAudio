import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import axios from 'axios';
import { appConfig } from '../config/appConfig';
import { getVisitorSessionId } from '../utils/visitorSession';

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [], // Array of stall IDs (string)
      localQueue: [], // Array of unsynced ops: { stallId, action: 'add' | 'remove' }

      toggleFavorite: (stallId) => {
        const current = get().favorites;
        const queue = [...get().localQueue];
        const isFav = current.includes(stallId);

        // Optimistic update
        let nextFavorites;
        if (isFav) {
          nextFavorites = current.filter((id) => id !== stallId);
          queue.push({ stallId, action: 'remove' });
        } else {
          nextFavorites = [...current, stallId];
          queue.push({ stallId, action: 'add' });
        }

        set({ favorites: nextFavorites, localQueue: queue });

        // Try syncing immediately
        get().syncOfflineOps();
      },

      isFavorite: (stallId) => get().favorites.includes(stallId),

      syncOfflineOps: async () => {
        const queue = get().localQueue;
        if (queue.length === 0) return;

        const guestId = getVisitorSessionId();

        try {
          const response = await axios.post(`${appConfig.guestApiBaseUrl}/favorites/sync`, {
            guestId,
            ops: queue
          });
          const data = response.data?.data ?? response.data;
          if (data && Array.isArray(data.favorites)) {
            // Success! Clear synced queue and merge remote
            set({ favorites: data.favorites.map(String), localQueue: [] });
          }
        } catch (error) {
          console.warn('Offline sync failed, keeping queue:', error.message);
        }
      },

      fetchFavorites: async () => {
        const guestId = getVisitorSessionId();
        try {
          const response = await axios.get(`${appConfig.guestApiBaseUrl}/favorites/${guestId}`);
          const data = response.data?.data ?? response.data;
          if (data && Array.isArray(data.favorites)) {
            // Only update favorites from server if there is no local changes queued
            if (get().localQueue.length === 0) {
              set({ favorites: data.favorites.map(String) });
            }
          }
        } catch (error) {
          console.warn('Failed to fetch favorites from server:', error.message);
        }
      }
    }),
    {
      name: 'vta-favorites',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        localQueue: state.localQueue
      })
    }
  )
);

// Trigger sync on online connection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useFavoritesStore.getState().syncOfflineOps();
  });
}

