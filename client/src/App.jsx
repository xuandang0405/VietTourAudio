import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AdminGuard } from './features/auth/components/AdminGuard';
import { AdminLayout } from './admin/components/AdminLayout';
import { AdminAnalytics } from './features/vendor-wallet/pages/AdminAnalytics';
import { AdminAuditLogs } from './features/auth/pages/AdminAuditLogs';
import { AdminCommissions } from './features/vendor-wallet/pages/AdminCommissions';
import { AdminContent } from './features/poi/pages/AdminContent';
import { AdminGeofences } from './features/geofence-audio/pages/AdminGeofences';
import { AdminLoginPage } from './features/auth/pages/AdminLoginPage';
import { AdminPois } from './features/poi/pages/AdminPois';
import { AdminRevenue } from './features/vendor-wallet/pages/AdminRevenue';
import { AdminSubscriptions } from './features/vendor-wallet/pages/AdminSubscriptions';
import { AdminTopUps } from './features/vendor-wallet/pages/AdminTopUps';
import { AdminUsers } from './features/auth/pages/AdminUsers';
import { AdminVendorAccounts } from './features/vendor-wallet/pages/AdminVendorAccounts';
import { AdminVendorDetail } from './features/vendor-wallet/pages/AdminVendorDetail';
import { AdminVendorsPage } from './features/vendor-wallet/pages/AdminVendorsPage';
import { ZoneManagement } from './features/geofence-audio/pages/ZoneManagement';
import { PREMIUM_ACTIVATION_CODE } from './data/visitorPois';
import { useTranslation } from 'react-i18next';
import { usePremiumStore } from './features/vendor-wallet/stores/premiumStore';
import { VendorGuard } from './features/auth/components/VendorGuard';
import { VendorLayout } from './vendor/components/VendorLayout';
import { VendorDashboard } from './features/vendor-wallet/pages/VendorDashboard';
import { VendorLoginPage } from './features/auth/pages/VendorLoginPage';
import { VendorPOIs } from './features/poi/pages/VendorPOIs';
import { VendorRevenue } from './features/vendor-wallet/pages/VendorRevenue';
import { VendorStall } from './features/vendor-wallet/pages/VendorStall';
import { VendorContent } from './features/poi/pages/VendorContent';
import { AppErrorBoundary } from './visitor/components/AppErrorBoundary';
import { CheckoutModal } from './visitor/components/CheckoutModal';
import { Confetti } from './visitor/components/Confetti';
import { FloatingPremiumBadge } from './visitor/components/FloatingPremiumBadge';
import { OfflineBanner } from './visitor/components/OfflineBanner';
import { Toast } from './visitor/components/Toast';
import { VisitorShell } from './visitor/components/VisitorShell';
import { LandingPage } from './features/poi/pages/LandingPage';
import { ListPage } from './features/poi/pages/ListPage';
import { MapPage } from './features/poi/pages/MapPage';
import { SettingsPage } from './features/poi/pages/SettingsPage';
import { ZonePage } from './features/poi/pages/ZonePage';

function AppRoutes() {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const location = useLocation();
  const isAdminOrVendor = location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor');
  const navigate = useNavigate();
  const activatePremium = usePremiumStore((state) => state.activatePremium);
  const checkExpiry = usePremiumStore((state) => state.checkExpiry);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  useEffect(() => {
    checkExpiry();
  }, [checkExpiry]);

  useEffect(() => {
    import('./stores/favoritesStore').then(({ useFavoritesStore }) => {
      useFavoritesStore.getState().fetchFavorites();
      useFavoritesStore.getState().syncOfflineOps();
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const handleOpenCheckout = () => setCheckoutOpen(true);
    window.addEventListener('open-checkout', handleOpenCheckout);
    return () => window.removeEventListener('open-checkout', handleOpenCheckout);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(checkExpiry, 10000);
    return () => window.clearInterval(timer);
  }, [checkExpiry]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const activationCode = params.get('activate');

    if (activationCode !== PREMIUM_ACTIVATION_CODE) return;

    activatePremium('demo-url');
    params.delete('activate');
    showToast(t('premiumActivated'));
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1500);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [activatePremium, location.pathname, location.search, navigate, showToast]);

  function handlePaymentSuccess() {
    activatePremium('demo-payment');
    setCheckoutOpen(false);
    showToast(t('paymentSuccess'));
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1500);
  }

  return (
    <>
      <AppErrorBoundary resetKey={location.pathname}>
        <Routes location={location}>
          <Route element={<VisitorShell><Outlet /></VisitorShell>}>
            <Route path="/" element={<LandingPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
            <Route path="/zone/:code" element={<ZonePage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
            <Route path="/map" element={<MapPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
            <Route path="/list" element={<ListPage onUpgrade={() => setCheckoutOpen(true)} />} />
            <Route path="/settings" element={<SettingsPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
          </Route>

          <Route path="/vendor/login" element={<VendorLoginPage />} />
          <Route element={<VendorGuard />}>
            <Route path="/vendor" element={<VendorLayout />}>
              <Route index element={<VendorDashboard />} />
              <Route path="stall" element={<VendorStall />} />
              <Route path="content" element={<VendorContent />} />
              <Route path="pois" element={<VendorPOIs />} />
              <Route path="revenue" element={<VendorRevenue />} />
            </Route>
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminAnalytics />} />
              <Route path="vendors" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminVendorsPage /></AdminGuard>} />
              <Route path="zones" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><ZoneManagement /></AdminGuard>} />
              <Route path="vendors/:id" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminVendorDetail /></AdminGuard>} />
              <Route path="content" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN', 'MODERATOR']}><AdminContent /></AdminGuard>} />
              <Route path="pois" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminPois /></AdminGuard>} />
              <Route path="vendor-accounts" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN', 'FINANCE']}><AdminVendorAccounts /></AdminGuard>} />
              <Route path="topup" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN', 'FINANCE']}><AdminTopUps /></AdminGuard>} />
              <Route path="revenue" element={<Navigate to="/admin/revenue/dashboard" replace />} />
              <Route path="revenue/dashboard" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN', 'FINANCE']}><AdminRevenue /></AdminGuard>} />
              <Route path="commissions" element={<AdminCommissions />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
              <Route path="geofences" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminGeofences /></AdminGuard>} />
              <Route path="audit-logs" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminAuditLogs /></AdminGuard>} />
              <Route path="settings/users" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminUsers /></AdminGuard>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppErrorBoundary>

      <OfflineBanner />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onSuccess={handlePaymentSuccess} />
      <Toast message={toast} />
      <Confetti show={showConfetti} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
