import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AdminGuard } from './admin/components/AdminGuard';
import { AdminLayout } from './admin/components/AdminLayout';
import { AdminAnalytics } from './admin/pages/AdminAnalytics';
import { AdminAuditLogs } from './admin/pages/AdminAuditLogs';
import { AdminCommissions } from './admin/pages/AdminCommissions';
import { AdminContent } from './admin/pages/AdminContent';
import { AdminGeofences } from './admin/pages/AdminGeofences';
import { AdminLoginPage } from './admin/pages/AdminLoginPage';
import { AdminPois } from './admin/pages/AdminPois';
import { AdminRevenue } from './admin/pages/AdminRevenue';
import { AdminSubscriptions } from './admin/pages/AdminSubscriptions';
import { AdminTopUps } from './admin/pages/AdminTopUps';
import { AdminUsers } from './admin/pages/AdminUsers';
import { AdminVendorAccounts } from './admin/pages/AdminVendorAccounts';
import { AdminVendorDetail } from './admin/pages/AdminVendorDetail';
import { AdminVendors } from './admin/pages/AdminVendors';
import { PREMIUM_ACTIVATION_CODE } from './data/visitorPois';
import { useTranslation } from './i18n/translations';
import { usePremiumStore } from './stores/premiumStore';
import { VendorLayout } from './vendor/components/VendorLayout';
import { VendorDashboard } from './vendor/pages/VendorDashboard';
import { VendorPOIs } from './vendor/pages/VendorPOIs';
import { VendorRevenue } from './vendor/pages/VendorRevenue';
import { AppErrorBoundary } from './visitor/components/AppErrorBoundary';
import { CheckoutModal } from './visitor/components/CheckoutModal';
import { Confetti } from './visitor/components/Confetti';
import { OfflineBanner } from './visitor/components/OfflineBanner';
import { Toast } from './visitor/components/Toast';
import { VisitorShell } from './visitor/components/VisitorShell';
import { LandingPage } from './visitor/pages/LandingPage';
import { ListPage } from './visitor/pages/ListPage';
import { MapPage } from './visitor/pages/MapPage';
import { SettingsPage } from './visitor/pages/SettingsPage';

function AppRoutes() {
  const { t } = useTranslation();
  const location = useLocation();
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
            <Route path="/map" element={<MapPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
            <Route path="/list" element={<ListPage onUpgrade={() => setCheckoutOpen(true)} />} />
            <Route path="/settings" element={<SettingsPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
          </Route>

          <Route path="/vendor" element={<VendorLayout />}>
            <Route index element={<VendorDashboard />} />
            <Route path="pois" element={<VendorPOIs />} />
            <Route path="revenue" element={<VendorRevenue />} />
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminAnalytics />} />
              <Route path="vendors" element={<AdminGuard roles={['SUPER_ADMIN', 'ADMIN']}><AdminVendors /></AdminGuard>} />
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
