import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { PREMIUM_ACTIVATION_CODE } from './data/visitorPois';
import { usePremiumStore } from './stores/premiumStore';
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
  const location = useLocation();
  const navigate = useNavigate();
  const activatePremium = usePremiumStore((state) => state.activatePremium);
  const hydrateFromLegacy = usePremiumStore((state) => state.hydrateFromLegacy);
  const checkExpiry = usePremiumStore((state) => state.checkExpiry);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  useEffect(() => {
    hydrateFromLegacy();
    checkExpiry();
  }, [checkExpiry, hydrateFromLegacy]);

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
    showToast('Premium demo đã được kích hoạt 24 giờ.');
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
    showToast('Thanh toán thành công. Premium đã mở khóa 24 giờ.');
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1500);
  }

  return (
    <VisitorShell>
      <OfflineBanner />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Routes location={location}>
            <Route path="/" element={<LandingPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
            <Route path="/map" element={<MapPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
            <Route path="/list" element={<ListPage onUpgrade={() => setCheckoutOpen(true)} />} />
            <Route path="/settings" element={<SettingsPage onUpgrade={() => setCheckoutOpen(true)} onToast={showToast} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onSuccess={handlePaymentSuccess} />
      <Toast message={toast} />
      <Confetti show={showConfetti} />
    </VisitorShell>
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
