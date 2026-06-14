import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminAuthStore';

export function AdminGuard({ roles = [] }) {
  const location = useLocation();
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const hasAnyRole = useAdminAuthStore((state) => state.hasAnyRole);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!hasAnyRole(roles)) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
