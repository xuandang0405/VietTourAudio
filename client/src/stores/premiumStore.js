import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const PREMIUM_DURATION_MS = 24 * 60 * 60 * 1000;

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readLegacyPremium() {
  if (!hasStorage()) {
    return { isPremium: false, expiresAt: 0 };
  }

  const expiresAt = Number(window.localStorage.getItem('premiumExpiry') || 0);
  const isPremium = window.localStorage.getItem('isPremium') === 'true' && expiresAt > Date.now();

  return {
    isPremium,
    expiresAt: isPremium ? expiresAt : 0
  };
}

function writeLegacyPremium(isPremium, expiresAt) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem('isPremium', isPremium ? 'true' : 'false');

  if (isPremium && expiresAt > Date.now()) {
    window.localStorage.setItem('premiumExpiry', String(expiresAt));
  } else {
    window.localStorage.removeItem('premiumExpiry');
  }
}

const initialPremium = readLegacyPremium();

export const usePremiumStore = create(
  persist(
    (set, get) => ({
      isPremium: initialPremium.isPremium,
      expiresAt: initialPremium.expiresAt,
      purchasedAt: 0,
      activatePremium: (durationMs = PREMIUM_DURATION_MS) => {
        const expiresAt = Date.now() + durationMs;
        writeLegacyPremium(true, expiresAt);
        set({
          isPremium: true,
          expiresAt,
          purchasedAt: Date.now()
        });
      },
      deactivatePremium: () => {
        writeLegacyPremium(false, 0);
        set({
          isPremium: false,
          expiresAt: 0
        });
      },
      hydrateFromLegacy: () => {
        const legacy = readLegacyPremium();
        if (legacy.isPremium) {
          set({
            isPremium: true,
            expiresAt: legacy.expiresAt
          });
        }
      },
      checkExpiry: () => {
        const { isPremium, expiresAt } = get();

        if (!isPremium) {
          return false;
        }

        if (expiresAt <= Date.now()) {
          get().deactivatePremium();
          return false;
        }

        writeLegacyPremium(true, expiresAt);
        return true;
      },
      getRemainingMs: () => {
        const { isPremium, expiresAt } = get();
        return isPremium ? Math.max(0, expiresAt - Date.now()) : 0;
      }
    }),
    {
      name: 'vta-premium-pass',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        isPremium: state.isPremium,
        expiresAt: state.expiresAt,
        purchasedAt: state.purchasedAt
      })
    }
  )
);
