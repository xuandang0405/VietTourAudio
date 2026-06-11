import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { PREMIUM_ACTIVATION_CODE } from './data/visitorPois';
import { usePremiumStore } from './stores/premiumStore';
import { useTranslation } from './i18n/translations';
import { CheckoutModal } from './visitor/components/CheckoutModal';
import { Confetti } from './visitor/components/Confetti';
import { OfflineBanner } from './visitor/components/OfflineBanner';
import { Toast } from './visitor/components/Toast';
import { VisitorShell } from './visitor/components/VisitorShell';
import { LandingPage } from './visitor/pages/LandingPage';
import { ListPage } from './visitor/pages/ListPage';
import { MapPage } from './visitor/pages/MapPage';
import { SettingsPage } from './visitor/pages/SettingsPage';

import { VendorLayout } from './vendor/components/VendorLayout';
import { VendorDashboard } from './vendor/pages/VendorDashboard';
import { VendorPOIs } from './vendor/pages/VendorPOIs';
import { VendorRevenue } from './vendor/pages/VendorRevenue';

import { AdminLayout } from './admin/components/AdminLayout';
import { AdminAnalytics } from './admin/pages/AdminAnalytics';
import { AdminVendors } from './admin/pages/AdminVendors';
import { AdminContent } from './admin/pages/AdminContent';
import { AdminGeofences } from './admin/pages/AdminGeofences';

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
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const activationCode = params.get('activate');

    if (activationCode !== PREMIUM_ACTIVATION_CODE) {
      return;
    }

    activatePremium();
    params.delete('activate');
    showToast(t('premiumActivated'));
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1500);
    navigate(
      {
        pathname: location.pathname,
        search: params.toString()
      },
      { replace: true }
    );
  }, [activatePremium, location.pathname, location.search, navigate, showToast]);

  function handlePaymentSuccess() {
    activatePremium();
    setCheckoutOpen(false);
    showToast(t('paymentSuccess'));
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1500);
  }

  return (
    <>
      <Routes location={location}>
        {/* VISITOR APP - Wrap inside VisitorShell but as a layout */}
        <Route element={<VisitorShell><Outlet /></VisitorShell>}>
          <Route path="/" element={<LandingPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
          <Route path="/map" element={<MapPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
          <Route path="/list" element={<ListPage onUpgrade={() => setCheckoutOpen(true)} />} />
          <Route path="/settings" element={<SettingsPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
        </Route>

        {/* VENDOR PORTAL */}
        <Route path="/vendor" element={<VendorLayout />}>
          <Route index element={<VendorDashboard />} />
          <Route path="pois" element={<VendorPOIs />} />
          <Route path="revenue" element={<VendorRevenue />} />
        </Route>

        {/* ADMIN PORTAL */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminAnalytics />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="geofences" element={<AdminGeofences />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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
