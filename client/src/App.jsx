import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AdminGuard } from './features/auth/components/AdminGuard';
import { AdminLayout } from './admin/components/AdminLayout';
import { AdminAnalytics } from './features/vendor-wallet/pages/AdminAnalytics';
import { AdminAuditLogs } from './features/auth/pages/AdminAuditLogs';
import { AdminCommissions } from './features/vendor-wallet/pages/AdminCommissions';
import { AdminContent } from './features/poi/pages/AdminContent';
import { AdminGeofences } from './features/geofence-audio/pages/AdminGeofences';
import { AdminLoginPage } from './features/auth/pages/AdminLoginPage';
import { AdminPois } from './features/poi/pages/AdminPois';
import { AdminTickets } from './admin/pages/AdminTickets';
import { AdminRevenue } from './features/vendor-wallet/pages/AdminRevenue';
import { AdminSubscriptions } from './features/vendor-wallet/pages/AdminSubscriptions';
import { AdminTopUps } from './features/vendor-wallet/pages/AdminTopUps';
import { AdminUsers } from './features/auth/pages/AdminUsers';
import { AdminVendorAccounts } from './features/vendor-wallet/pages/AdminVendorAccounts';
import { AdminVendorDetail } from './features/vendor-wallet/pages/AdminVendorDetail';
import { AdminVendorsPage } from './features/vendor-wallet/pages/AdminVendorsPage';
import { ZoneManagement } from './features/geofence-audio/pages/ZoneManagement';
import { useTranslation } from 'react-i18next';
import { usePremiumStore } from './features/vendor-wallet/stores/premiumStore';
import { VendorGuard } from './features/auth/components/VendorGuard';
import { VendorLayout } from './vendor/components/VendorLayout';
import { VendorDashboard } from './features/vendor-wallet/pages/VendorDashboard';
import { VendorLoginPage } from './features/auth/pages/VendorLoginPage';
import { VendorRevenue } from './features/vendor-wallet/pages/VendorRevenue';
import { VendorStall } from './features/vendor-wallet/pages/VendorStall';

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
import { AdminPaymentSettings } from './features/payment/AdminPaymentSettings';
import { UserPremiumUpgrade } from './features/payment/UserPremiumUpgrade';
import { VendorBilling } from './features/payment/VendorBilling';
import { appConfig } from './config/appConfig';
import { startRealtimeClient } from './services/realtimeClient';

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

  // Global SignalR presence connection — registers this tab as an active user
  useEffect(() => {
    startRealtimeClient()
      .then(() => console.log('[Presence] SignalR connected — user counted'))
      .catch((err) => console.error('[Presence] SignalR error:', err));

    return undefined;

    /* shared connection remains alive for the app lifetime
        .then(() => console.log('[Presence] SignalR disconnected — user removed'))
        .catch(() => {}); */
  }, []);

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

  function handlePaymentSuccess() {
    activatePremium('checkout-payment');
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
            <Route path="/premium-upgrade" element={<UserPremiumUpgrade />} />
          </Route>

          <Route path="/vendor/login" element={<VendorLoginPage />} />
          <Route element={<VendorGuard />}>
            <Route path="/vendor" element={<VendorLayout />}>
              <Route index element={<VendorDashboard />} />
              <Route path="stall" element={<VendorStall />} />

              <Route path="pois" element={<Navigate to="/vendor/stall" replace />} />
              <Route path="revenue" element={<VendorRevenue />} />
              <Route path="billing" element={<VendorBilling />} />
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
              <Route path="topup" element={<Navigate to="/admin/vendor-accounts" replace />} />
              <Route path="revenue" element={<Navigate to="/admin/revenue/dashboard" replace />} />
              <Route path="revenue/dashboard" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN', 'FINANCE']}><AdminRevenue /></AdminGuard>} />
              <Route path="commissions" element={<AdminCommissions />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
              <Route path="geofences" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminGeofences /></AdminGuard>} />
              <Route path="audit-logs" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminAuditLogs /></AdminGuard>} />
              <Route path="settings/users" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminUsers /></AdminGuard>} />
              <Route path="tickets" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminTickets /></AdminGuard>} />
              <Route path="payment-settings" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN', 'FINANCE']}><AdminPaymentSettings /></AdminGuard>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppErrorBoundary>

      <OfflineBanner />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onSuccess={handlePaymentSuccess} />
      <Toaster position="top-right" />
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
