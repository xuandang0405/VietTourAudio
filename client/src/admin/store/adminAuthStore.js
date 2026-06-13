import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const demoUser = {
  id: 'U-001',
  email: 'superadmin@viettouraudio.vn',
  displayName: 'Super Admin',
  role: 'SUPER_ADMIN'
};

export const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: '',
      refreshToken: '',
      isAuthenticated: false,
      loginDemo: () => {
        set({
          user: demoUser,
          accessToken: 'demo-access-token',
          refreshToken: 'demo-refresh-token',
          isAuthenticated: true
        });
      },
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
