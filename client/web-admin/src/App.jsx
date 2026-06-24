import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';

const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PoiPage = lazy(() => import('./pages/PoiPage').then((m) => ({ default: m.PoiPage })));
const TourPage = lazy(() => import('./pages/TourPage').then((m) => ({ default: m.TourPage })));
const NarrationPage = lazy(() => import('./pages/NarrationPage').then((m) => ({ default: m.NarrationPage })));
const QrPage = lazy(() => import('./pages/QrPage').then((m) => ({ default: m.QrPage })));
const VendorPage = lazy(() => import('./pages/VendorPage').then((m) => ({ default: m.VendorPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const MediaPage = lazy(() => import('./pages/MediaPage').then((m) => ({ default: m.MediaPage })));
const AuditPage = lazy(() => import('./pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const HeatmapPage = lazy(() => import('./pages/HeatmapPage').then((m) => ({ default: m.HeatmapPage })));

export default function App() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={(
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          )}
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pois" element={<PoiPage />} />
          <Route path="/tours" element={<TourPage />} />
          <Route path="/narrations" element={<NarrationPage />} />
          <Route path="/qrs" element={<QrPage />} />
          <Route path="/vendors" element={<VendorPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
