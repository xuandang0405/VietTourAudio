import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

function createDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 15);
}

function writeLegacyPremium(isPremium, expiresAt) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('isPremium', isPremium ? 'true' : 'false');
  if (isPremium && expiresAt > Date.now()) {
    window.localStorage.setItem('premiumExpiry', String(expiresAt));
  } else {
    window.localStorage.removeItem('premiumExpiry');
  }
}

export const FREE_LISTENS_DEFAULT = 1;

export const usePremiumStore = create(
  persist(
    (set, get) => {
      return ({
      deviceId: createDeviceId(),
      isPremium: false,
      expiresAt: 0,
      purchasedAt: 0,
      paymentRef: null,
      freeListensRemaining: FREE_LISTENS_DEFAULT,
      playedPoiIds: {},

      canListen: (poiId) => {
        const { isPremium, expiresAt, playedPoiIds } = get();
        if (isPremium && expiresAt > Date.now()) return true;
        return Boolean(poiId) && !playedPoiIds[String(poiId)];
      },

      markPoiPlayed: (poiId) => {
        if (!poiId) return;
        set((state) => ({
          playedPoiIds: { ...state.playedPoiIds, [String(poiId)]: true },
          freeListensRemaining: 0
        }));
      },

      applyServerStatus: ({
        isPremium,
        expiry,
        transactionId = null,
        poiId = null,
        hasUsedFreeListen = false
      }) => {
        const expiresAt = expiry ? new Date(expiry).getTime() : 0;
        const active = Boolean(isPremium) && Number.isFinite(expiresAt) && expiresAt > Date.now();
        set((state) => ({
          isPremium: active,
          expiresAt: active ? expiresAt : 0,
          purchasedAt: active ? Date.now() : 0,
          paymentRef: transactionId,
          playedPoiIds: poiId && hasUsedFreeListen
            ? { ...state.playedPoiIds, [String(poiId)]: true }
            : state.playedPoiIds,
          freeListensRemaining: poiId && hasUsedFreeListen ? 0 : state.freeListensRemaining
        }));
        writeLegacyPremium(active, active ? expiresAt : 0);
      },

      activatePremium: () => {},

      deactivatePremium: () => {
        set({
          isPremium: false,
          expiresAt: 0,
          paymentRef: null
        });
        writeLegacyPremium(false, 0);
      },

      setPremium: (isPremium) => {
        set({ isPremium });
        const { expiresAt } = get();
        writeLegacyPremium(isPremium, expiresAt);
      },

      setExpiry: (expiresAt) => {
        set({ expiresAt });
        const { isPremium } = get();
        writeLegacyPremium(isPremium, expiresAt);
      },

      checkExpiry: () => {
        const { isPremium, expiresAt } = get();
        if (!isPremium) return false;

        if (expiresAt <= Date.now()) {
          get().deactivatePremium();
          return false;
        }
        return true;
      },

      getRemainingMs: () => {
        const { isPremium, expiresAt } = get();
        return isPremium ? Math.max(0, expiresAt - Date.now()) : 0;
      },

      getFormattedCountdown: () => {
        const remaining = get().getRemainingMs();
        if (remaining <= 0) return '00:00:00';

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    });
    },
    {
      name: 'vta-premium-store',
      version: 2,
      storage: createJSONStorage(() => window.localStorage),
      migrate: (persistedState) => ({
        ...persistedState,
        isPremium: false,
        expiresAt: 0,
        paymentRef: null,
        freeListensRemaining: FREE_LISTENS_DEFAULT,
        playedPoiIds: persistedState?.playedPoiIds ?? {}
      }),
      partialize: (state) => ({
        deviceId: state.deviceId,
        isPremium: state.isPremium,
        expiresAt: state.expiresAt,
        purchasedAt: state.purchasedAt,
        paymentRef: state.paymentRef,
        freeListensRemaining: state.freeListensRemaining,
        playedPoiIds: state.playedPoiIds
      })
    }
  )
);
