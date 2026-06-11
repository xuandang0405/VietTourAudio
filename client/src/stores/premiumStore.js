import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const PREMIUM_DURATION_MS = 24 * 60 * 60 * 1000;

export const usePremiumStore = create(
  persist(
    (set, get) => ({
      deviceId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      isPremium: false,
      expiresAt: 0,
      purchasedAt: 0,
      paymentRef: null,

      activatePremium: (ref = null, durationMs = PREMIUM_DURATION_MS) => {
        const expiresAt = Date.now() + durationMs;
        set({
          isPremium: true,
          expiresAt,
          purchasedAt: Date.now(),
          paymentRef: ref
        });
      },

      deactivatePremium: () => {
        set({
          isPremium: false,
          expiresAt: 0,
          paymentRef: null
        });
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
    }),
    {
      name: 'vta-premium-store',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        deviceId: state.deviceId,
        isPremium: state.isPremium,
        expiresAt: state.expiresAt,
        purchasedAt: state.purchasedAt,
        paymentRef: state.paymentRef
      })
    }
  )
);
