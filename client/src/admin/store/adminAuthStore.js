import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAdminAuthStore = create(
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
        }),
      logout: () => {
        set({
          user: null,
          accessToken: '',
          refreshToken: '',
          isAuthenticated: false
        });
      },
      hasAnyRole: (roles = []) => {
        const user = get().user;
        if (!roles.length) {
          return true;
        }

        return Boolean(user && roles.includes(user.role));
      },
      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',
      canModerate: () => ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(get().user?.role),
      canViewFinance: () => ['SUPER_ADMIN', 'ADMIN', 'FINANCE'].includes(get().user?.role)
    }),
    {
      name: 'vta-admin-auth',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
