import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';
import { appConfig } from '../config/appConfig';
import { getVisitorSessionId } from '../utils/visitorSession';

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [], // Array of stall IDs (string)
      localQueue: [], // Array of unsynced ops: { stallId, action: 'add' | 'remove' }

      toggleFavorite: async (guestIdOrPoiId, maybePoiId) => {
        let guestId = guestIdOrPoiId;
        let poiId = maybePoiId;
        
        if (maybePoiId === undefined) {
          poiId = guestIdOrPoiId;
          guestId = getVisitorSessionId();
        }

        if (!poiId) return;
        const resolvedPoiId = typeof poiId === 'object' ? (poiId.stallId || poiId.id) : poiId;
        if (!resolvedPoiId) return;

        try {
          // 1. Log the outgoing request
          console.log(`[FAV-TOGGLE] Sending guestId: ${guestId}, poiId: ${resolvedPoiId}`);

          // 2. Wait for backend truth (No optimistic updates!)
          const response = await axios.post(`${appConfig.guestApiBaseUrl}/favorites/toggle`, {
            guestId: String(guestId),
            poiId: String(resolvedPoiId)
          });

          // 3. Log the response to verify it's a flat array of IDs
          console.log(`[FAV-TOGGLE] Received updated array:`, response.data);

          const data = response.data?.data ?? response.data;
          let favList = [];
          if (Array.isArray(data)) {
            favList = data;
          } else if (data && Array.isArray(data.favorites)) {
            favList = data.favorites;
          }

          // 4. Force state update
          set({ favorites: favList.map(String) });
        } catch (error) {
          console.error("[FAV-TOGGLE] Failed:", error);
        }
      },

      isFavorite: (stallId) => get().favorites.includes(stallId),

      syncOfflineOps: async () => {
        const queue = get().localQueue;
        if (queue.length === 0) return;

        const guestId = getVisitorSessionId();
        const payload = {
          guestId: guestId,
          ops: queue.map(op => ({
            stallId: op.stallId,
            action: op.action
          }))
        };

        console.log("[SYNC PAYLOAD OUT]:", payload);

        try {
          const response = await axios.post(`${appConfig.guestApiBaseUrl}/favorites/sync`, payload);
          const data = response.data?.data ?? response.data;
          
          // Clear synced queue
          set({ localQueue: [] });

          let favList = [];
          if (Array.isArray(data)) {
            favList = data;
          } else if (data && Array.isArray(data.favorites)) {
            favList = data.favorites;
          }

          set({ favorites: favList.map(String) });
        } catch (error) {
          console.warn('Offline sync failed, keeping queue:', error.message);
        }
      },

      fetchFavorites: async (guestId) => {
        const actualGuestId = guestId || getVisitorSessionId();
        try {
          const response = await axios.get(`${appConfig.guestApiBaseUrl}/favorites/${actualGuestId}`);
          const data = response.data?.data ?? response.data;
          
          let favList = [];
          if (Array.isArray(data)) {
            favList = data;
          } else if (data && Array.isArray(data.favorites)) {
            favList = data.favorites;
          }

          // Only update favorites from server if there is no local changes queued
          if (get().localQueue.length === 0) {
            set({ favorites: favList.map(String) });
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

