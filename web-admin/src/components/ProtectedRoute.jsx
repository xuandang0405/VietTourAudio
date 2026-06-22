import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6">Loading session...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
