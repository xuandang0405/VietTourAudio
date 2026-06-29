import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useVendorAuthStore } from '../../../vendor/store/vendorAuthStore';

export function VendorGuard({ children }) {
  const location = useLocation();
  const isAuthenticated = useVendorAuthStore((state) => state.isAuthenticated);
  const mustChangePassword = useVendorAuthStore((state) => Boolean(state.user?.mustChangePassword));

  if (!isAuthenticated) {
    return <Navigate to="/vendor/login" replace state={{ from: location }} />;
  }
  if (mustChangePassword && location.pathname !== '/vendor/change-password') {
    return <Navigate to="/vendor/change-password" replace />;
  }

  return children ?? <Outlet />;
}
