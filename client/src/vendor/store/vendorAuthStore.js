import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useVendorAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: '',
      refreshToken: '',
      isAuthenticated: false,
      setSession: ({ user, accessToken, refreshToken }) => {
        set({
          user: user ?? get().user,
          accessToken: accessToken ?? get().accessToken,
          refreshToken: refreshToken ?? get().refreshToken,
          isAuthenticated: Boolean(accessToken || refreshToken || user)
        });
      },
      setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: Boolean(accessToken || get().refreshToken) }),
      clearSession: () =>
        set({
          user: null,
          accessToken: '',
          refreshToken: '',
          isAuthenticated: false
        })
    }),
    {
      name: 'vta-vendor-auth',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);