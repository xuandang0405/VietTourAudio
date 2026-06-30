import { AnimatePresence, motion } from 'framer-motion';
import { Headphones, Loader2, MapPin, QrCode, Star, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import logo from '../../../assets/logo/logo.png';
import { appConfig } from '../../../config/appConfig';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';
import { useTranslation } from 'react-i18next';
import { getVisitorSessionId } from '../../../utils/visitorSession';

export function ZonePage({ onUpgrade, onToast }) {
  const { t, i18n } = useTranslation();
  const { code } = useParams();
  const navigate = useNavigate();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);

  const [zone, setZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoNav, setAutoNav] = useState(true);

  // Payment states
  const [unlocked, setUnlocked] = useState(false);
  const [checkingUnlock, setCheckingUnlock] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [qrError, setQrError] = useState(false);
  const [qrVersion, setQrVersion] = useState(0);

  // Defensive timeout safety net for loading spinner
  useEffect(() => {
    let safetyTimer;
    if (loading) {
      safetyTimer = setTimeout(() => {
        setLoading(false);
        console.warn("[PERFORMANCE EMERGENCY]: Spinner forced closed due to unresponsive background execution thread.");
      }, 5000);
    }
    return () => clearTimeout(safetyTimer);
  }, [loading]);

  // Fetch zone data from API
  useEffect(() => {
    if (!code) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    axios
      .get(`${appConfig.guestApiBaseUrl}/resolve-code/${encodeURIComponent(code)}?lang=${i18n.language}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        const resolvedSlug = data.stall?.slug ?? code.toLowerCase();
        localStorage.setItem('locked_zone', resolvedSlug);
        sessionStorage.setItem('last_scanned_zone', resolvedSlug);

        setZone({
          id: data.stall?.id,
          tourId: data.stall?.tourId ?? data.stall?.id,
          code: resolvedSlug,
          name: data.stall?.name ?? `${t('zone.fallback_name')} ${code}`,
          description: data.stall?.description ?? t('zone.fallback_desc'),
          poiCount: data.pois?.length ?? 0,
          audioMinutes: data.pois?.length ? Math.round(data.pois.length * 4) : '?',
          rating: null,
          statusLabel: data.stall?.status === 'APPROVED' ? t('zone.status_active') : t('zone.status_updating'),
          vendorName: data.stall?.vendorName,
          pois: data.pois ?? [],
          isPremium: Boolean(data.stall?.isPremium),
          price: Number(data.stall?.price ?? 0)
        });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const statusCode = err.response?.status;
        if (statusCode === 404) {
          setError(t('zone.not_found_desc'));
        } else {
          setZone({
            code: code.toUpperCase(),
            name: `${t('zone.fallback_name')} ${code.toUpperCase()}`,
            description: t('zone.fallback_desc'),
            poiCount: '?',
            audioMinutes: '?',
            rating: null,
            statusLabel: t('zone.status_updating'),
            vendorName: null,
            pois: [],
            isPremium: false,
            price: 0
          });
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, i18n.language, t]);

  // Check unlock status on load once zone details are fetched
  useEffect(() => {
    if (!zone) return;

    if (!zone.isPremium || zone.price === 0) {
      setUnlocked(true);
      setCheckingUnlock(false);
      return;
    }

    const guestId = getVisitorSessionId();
    setCheckingUnlock(true);

    axios
      .get(`${appConfig.guestApiBaseUrl}/tours/${zone.tourId}/unlocked-status?guestId=${guestId}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data.unlocked) {
          setUnlocked(true);
          setCheckingUnlock(false);
        } else {
          setUnlocked(false);
          setCheckingUnlock(false);
          // Initiate payment request
          createPaymentRequest(guestId, zone.tourId);
        }
      })
      .catch((err) => {
        console.error('Failed to check unlock status:', err);
        setCheckingUnlock(false);
      });
  }, [zone]);

  const createPaymentRequest = (guestId, tourId) => {
    axios
      .post(`${appConfig.paymentApiBaseUrl}/create-request`, { guestId, tourId })
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setPaymentInfo(data);
        setQrError(false);
      })
      .catch((err) => {
        console.error('Failed to create payment request:', err);
      });
  };

  // Poll payment status
  useEffect(() => {
    if (unlocked || !paymentInfo || paymentInfo.status === 'PAID') return;

    const interval = setInterval(() => {
      axios
        .get(`${appConfig.paymentApiBaseUrl}/status?reference=${paymentInfo.referenceCode}`)
        .then((res) => {
          const data = res.data?.data ?? res.data;
          if (data.status === 'PAID') {
            clearInterval(interval);
            setUnlocked(true);
            onToast?.(t('payment.success', { defaultValue: 'Thanh toán thành công! Tuyến tham quan đã được mở khóa.' }));
            handleEnterZone();
          }
        })
        .catch((err) => {
          console.warn('Error polling payment status:', err);
        });
    }, 4000);

    return () => clearInterval(interval);
  }, [paymentInfo, unlocked]);

  // Deep link navigate to map
  function handleEnterZone() {
    if (!zone) return;
    navigate(`/map?zone=${zone.code}`, { replace: false });
    onToast?.(t('zone.entering', { name: zone.name }));
  }

  useEffect(() => {
    if (!zone || !autoNav || !unlocked) return;
    const timer = setTimeout(handleEnterZone, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, unlocked]);

  // Loading state
  if (loading) {
    return (
      <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-bgAbyss px-4 text-textCrisp">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.18)_0%,transparent_65%)]" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 size={40} className="animate-spin text-oceanCyan" />
          <p className="text-sm font-bold text-textSeafoam">{t('zone.loading')}</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-bgAbyss px-4 text-textCrisp">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.18)_0%,transparent_65%)]" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 max-w-sm text-center"
        >
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-textCrisp">{t('zone.not_found_title')}</h2>
          <p className="text-sm text-textSeafoam">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-2 rounded-full bg-gradient-to-r from-electricBlue to-oceanCyan px-6 py-3 text-sm font-bold text-white shadow-neon-cyan transition hover:brightness-110 active:scale-[0.98]"
          >
            {t('zone.go_home')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!zone) return null;

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-bgAbyss px-4 text-textCrisp">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.18)_0%,transparent_65%)]" aria-hidden="true" />

      <AnimatePresence>
        <motion.div
          key="zone-entry-card"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Logo */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <img src={logo} alt="VietTourAudio" className="h-12 w-12 rounded-xl shadow-neon-cyan" />
            <span className="bg-gradient-to-r from-electricBlue to-oceanCyan bg-clip-text font-display text-xl font-bold text-transparent">
              VietTourAudio
            </span>
          </div>

          {/* Zone card */}
          <div className="rounded-2xl border border-glassBorder bg-bgSurface/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {/* Header */}
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-oceanCyan">
              <QrCode size={14} />
              <span>Deep Link · {zone.code}</span>
            </div>
            <h1 className="mb-3 font-display text-2xl font-bold leading-tight text-textCrisp">
              {zone.name}
            </h1>

            {zone.vendorName && (
              <p className="mb-2 text-xs font-semibold text-textSeafoam">
                {t('zone.by_vendor')} {zone.vendorName}
              </p>
            )}

            {/* Meta pills */}
            <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 rounded-full border border-electricBlue/25 bg-electricBlue/10 px-3 py-1 text-electricBlue">
                <MapPin size={11} />
                {zone.poiCount} {t('zone.poi_unit')}
              </span>
              <span className="flex items-center gap-1 rounded-full border border-oceanCyan/25 bg-oceanCyan/10 px-3 py-1 text-oceanCyan">
                <Headphones size={11} />
                {zone.audioMinutes} {t('zone.audio_unit')}
              </span>
              {zone.rating && (
                <span className="flex items-center gap-1 rounded-full border border-premiumNeon/25 bg-premiumNeon/10 px-3 py-1 text-premiumNeon">
                  <Star size={11} fill="currentColor" />
                  {zone.rating}/5
                </span>
              )}
            </div>

            <p className="mb-5 text-sm leading-relaxed text-textSeafoam">{zone.description}</p>

            {/* VietQR Payment Area for locked premium content */}
            {!unlocked && !checkingUnlock && paymentInfo && (
              <div className="mb-5 flex flex-col items-center justify-center p-4 border border-glassBorder bg-bgSurface/40 rounded-xl">
                <p className="text-xs text-orange-400 font-bold uppercase mb-2 flex items-center gap-1">
                  <AlertCircle size={13} />
                  {t('zone.premium_required', { defaultValue: 'Yêu cầu mở khóa khu vực' })}
                </p>
                <p className="text-[11px] leading-relaxed text-center text-slate-300 mb-4">
                  {t('zone.payment_instruction', { defaultValue: 'Vui lòng quét mã VietQR dưới đây để mở khóa toàn bộ thuyết minh của khu vực.' })}
                </p>

                {/* VietQR Image with fallback */}
                <div className="relative w-44 h-44 bg-white p-2 rounded-xl flex items-center justify-center border border-slate-200 shadow-md">
                  {!qrError ? (
                    <img
                      src={`${paymentInfo.qrUrl}&v=${qrVersion}`}
                      alt="VietQR Payment"
                      className="w-full h-full object-contain"
                      onError={() => setQrError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <img
                        src="/qr_fallback.svg"
                        alt="QR Fallback"
                        className="w-28 h-28 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setQrError(false);
                          setQrVersion(prev => prev + 1);
                        }}
                        className="text-xs text-teal-500 font-bold underline"
                      >
                        {t('zone.retry_load_qr', { defaultValue: 'Tải lại mã' })}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center w-full">
                  <p className="text-xs font-bold text-slate-200">
                    {t('zone.amount', { defaultValue: 'Số tiền' })}: <span className="text-teal-400 font-mono text-sm">{paymentInfo.amount.toLocaleString()} VND</span>
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    {t('zone.ref_content', { defaultValue: 'Nội dung CK' })}: <span className="text-orange-400 font-mono font-bold select-all bg-slate-900/30 px-1.5 py-0.5 rounded">{paymentInfo.referenceCode}</span>
                  </p>
                  <p className="text-[9px] text-slate-400 mt-2 animate-pulse">
                    {t('zone.polling_payment', { defaultValue: 'Đang kiểm tra giao dịch tự động...' })}
                  </p>
                </div>
              </div>
            )}

            {/* Free listens indicator when not premium */}
            {unlocked && !isPremium && (
              <div className="mb-4 rounded-xl border border-electricBlue/20 bg-electricBlue/8 px-4 py-3 text-center text-xs font-bold text-electricBlue">
                {freeListensRemaining > 0
                  ? t('zone.free_listen_hint', { count: freeListensRemaining })
                  : t('zone.out_of_free')}
              </div>
            )}
            {unlocked && isPremium && (
              <div className="mb-4 rounded-xl border border-premiumNeon/20 bg-premiumNeon/8 px-4 py-3 text-center text-xs font-bold text-premiumNeon">
                {t('zone.premium_active')}
              </div>
            )}

            {/* CTA */}
            {unlocked ? (
              <button
                type="button"
                onClick={handleEnterZone}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-electricBlue to-oceanCyan px-4 py-4 text-sm font-bold text-white shadow-neon-cyan transition duration-150 ease-out hover:brightness-110 active:scale-[0.98]"
              >
                <MapPin size={18} />
                {t('zone.enter_map')}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-800 border border-slate-700 px-4 py-4 text-sm font-bold text-slate-500 cursor-not-allowed"
              >
                <Loader2 size={18} className="animate-spin text-slate-500" />
                {t('zone.waiting_payment', { defaultValue: 'Đang chờ thanh toán...' })}
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-textGhost">
            {t('zone.redirecting')}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
