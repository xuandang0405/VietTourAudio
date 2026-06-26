import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [], // Array of stall IDs (number or string)
      toggleFavorite: (stallId) => {
        const current = get().favorites;
        if (current.includes(stallId)) {
          set({ favorites: current.filter((id) => id !== stallId) });
        } else {
          set({ favorites: [...current, stallId] });
        }
      },
      isFavorite: (stallId) => get().favorites.includes(stallId)
    }),
    {
      name: 'vta-favorites',
      storage: createJSONStorage(() => window.localStorage)
    }
  )
);
