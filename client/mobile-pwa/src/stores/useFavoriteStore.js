import { create } from 'zustand';
import { api } from '../api/client';
import { addPendingOp, getFavorites, putFavorite, removeFavorite } from '../services/idb';
import { flush } from '../services/syncService';

export const useFavoriteStore = create((set, get) => ({
  favorites: [],
  pendingOps: [],
  loading: false,
  isFavorite: (zoneId) => get().favorites.some((f) => Number(f.zoneId || f.zone?.id) === Number(zoneId)),
  loadFavorites: async (guestId) => {
    set({ loading: true });
    const local = await getFavorites(guestId);
    set({ favorites: local, loading: false });
    if (navigator.onLine) {
      try {
        const { data } = await api.get(`/favorites/${guestId}`);
        const incoming = data.items || [];
        set({ favorites: incoming });
        for (const f of incoming) await putFavorite(guestId, f.zone || { id: f.zoneId, ...f.zone });
      } catch {
        // stay with local cache
      }
    }
  },
  setFavorites: (favorites) => set({ favorites }),
  addPendingOp: (op) => set((s) => ({ pendingOps: [...s.pendingOps, op] })),
  toggleFavorite: async ({ guestId, zone }) => {
    const exists = get().isFavorite(zone.id);
    if (exists) {
      set((s) => ({ favorites: s.favorites.filter((f) => Number(f.zoneId || f.zone?.id) !== Number(zone.id)) }));
      await removeFavorite(guestId, zone.id);
      const op = { guestId, zoneId: zone.id, action: 'remove', createdAt: Date.now() };
      await addPendingOp(op);
      get().addPendingOp(op);
    } else {
      set((s) => ({ favorites: [{ guestId, zoneId: zone.id, zone }, ...s.favorites] }));
      await putFavorite(guestId, zone);
      const op = { guestId, zoneId: zone.id, action: 'add', createdAt: Date.now() };
      await addPendingOp(op);
      get().addPendingOp(op);
    }
    if (navigator.onLine) await flush();
  }
}));
