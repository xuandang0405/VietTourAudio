import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const PREMIUM_DURATION_MS = 24 * 60 * 60 * 1000;

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

function readLegacyPremium() {
  if (typeof window === 'undefined') {
    return { isPremium: false, expiresAt: 0 };
  }

  const isPremium = window.localStorage.getItem('isPremium') === 'true';
  const expiresAt = Number(window.localStorage.getItem('premiumExpiry') ?? 0);

  if (!isPremium || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    writeLegacyPremium(false, 0);
    return { isPremium: false, expiresAt: 0 };
  }

  return { isPremium: true, expiresAt };
}

export const usePremiumStore = create(
  persist(
    (set, get) => {
      const legacyPremium = readLegacyPremium();

      return ({
      deviceId: createDeviceId(),
      isPremium: legacyPremium.isPremium,
      expiresAt: legacyPremium.expiresAt,
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
        writeLegacyPremium(true, expiresAt);
      },

      deactivatePremium: () => {
        set({
          isPremium: false,
          expiresAt: 0,
          paymentRef: null
        });
        writeLegacyPremium(false, 0);
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
