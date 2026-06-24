import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Compass, Globe, MapPinned, ScanLine, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import { useTranslation } from 'react-i18next';
import { languages, useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { QrCameraScanner } from '../components/QrCameraScanner';

export function LandingPage({ onToast, onUpgrade }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const useDemoLocation = useLocationStore((state) => state.useDemoLocation);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [showScanner, setShowScanner] = useState(false);
  const [zoneCodeInput, setZoneCodeInput] = useState('');

  const FEATURED_ZONES = useMemo(() => [
    { id: 1, title: t('landing.featured.zone1_title'), subtitle: t('landing.featured.zone1_subtitle'), img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=200&h=200&fit=crop' },
    { id: 2, title: t('landing.featured.zone2_title'), subtitle: t('landing.featured.zone2_subtitle'), img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=200&h=200&fit=crop' },
    { id: 3, title: t('landing.featured.zone3_title'), subtitle: t('landing.featured.zone3_subtitle'), img: 'https://images.unsplash.com/photo-1555921015-5532091f6026?w=200&h=200&fit=crop' },
  ], [t]);

  // Handle i18next language switch
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  function initAudioContext() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const message = new SpeechSynthesisUtterance('');
      message.volume = 0;
      window.speechSynthesis.speak(message);
    }
  }

  function handleQrResult(rawValue) {
    setShowScanner(false);
    try {
      const url = new URL(rawValue);
      const zoneMatch = url.pathname.match(/\/zone\/([^/?#]+)/);
      if (zoneMatch) {
        navigate(`/zone/${zoneMatch[1]}`);
        return;
      }
    } catch {
      // Not a URL, treat as zone code
    }
    const code = rawValue.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code) navigate(`/zone/${code}`);
  }

  function handleZoneCodeSubmit(e) {
    e.preventDefault();
    const code = zoneCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) return;
    navigate(`/zone/${code}`);
  }

  async function handleStart() {
    initAudioContext();
    const allowed = await requestLocation();
    if (allowed) {
      onToast?.(t('landing.gpsReady'));
      navigate('/map');
      return;
    }
    onToast?.(t('landing.gpsFailed'));
  }

  function handleDemo() {
    initAudioContext();
    useDemoLocation();
    onToast?.(t('landing.demoEnabled'));
    navigate('/map');
  }

  return (
    <div className="relative flex min-h-screen w-full bg-slate-50 font-body text-slate-800">
      {/* GLOBAL HEADER */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="VietTourAudio" className="h-10 w-10 rounded-xl shadow-sm" />
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">VietTourAudio</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Premium Badge */}
          {!isPremium && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700">
              {freeListensRemaining > 0
                ? t('landing.free_listens', { count: freeListensRemaining })
                : t('landing.out_of_listens')}
              {freeListensRemaining === 0 && (
                <button
                  type="button"
                  onClick={() => onUpgrade?.()}
                  className="ml-2 rounded-full bg-orange-600 px-2 py-0.5 text-white hover:bg-orange-700 transition"
                >
                  {t('landing.unlock')}
                </button>
              )}
            </div>
          )}
          {isPremium && (
             <div className="hidden sm:flex items-center gap-2 rounded-full border border-teal-200 bg-teal-100 px-3 py-1.5 text-xs font-bold text-teal-800">
               {t('landing.premium_active')}
             </div>
          )}

          {/* Language Selector */}
          <div className="relative flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
            <Globe size={16} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <select
              value={currentLanguage}
              onChange={handleLanguageChange}
              className="appearance-none bg-transparent pl-8 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* TWO COLUMNS */}
      <div className="flex flex-1 w-full pt-20 md:pt-0">
        {/* LEFT COLUMN: ACTION AREA */}
        <div className="flex w-full md:w-1/2 flex-col items-center justify-center p-6 md:p-12 lg:p-16">
          <div className="w-full max-w-md">
            {/* Hero */}
            <div className="mb-8 text-center md:text-left">
              <h1 
                className="mb-4 text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900"
                dangerouslySetInnerHTML={{ __html: t('landing.hero_title') }}
              />
              <p className="text-lg text-slate-500">
                {t('landing.heroDescription')}
              </p>
            </div>

            {/* Premium Badge Mobile Fallback */}
            {!isPremium && (
              <div className="flex sm:hidden items-center justify-between gap-2 mb-6 rounded-xl border border-orange-200 bg-orange-100 px-4 py-3 text-sm font-bold text-orange-700">
                <span>
                  {freeListensRemaining > 0
                    ? t('landing.free_listens', { count: freeListensRemaining })
                    : t('landing.out_of_listens')}
                </span>
                {freeListensRemaining === 0 && (
                  <button
                    type="button"
                    onClick={() => onUpgrade?.()}
                    className="rounded-full bg-orange-600 px-3 py-1 text-white hover:bg-orange-700 transition"
                  >
                    {t('landing.unlock')}
                  </button>
                )}
              </div>
            )}

            {/* QR Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
              <button
                type="button"
                onClick={() => setShowScanner((v) => !v)}
                className="flex w-full min-h-[56px] items-center justify-center gap-2 rounded-xl bg-teal-600 text-white font-bold text-lg hover:bg-teal-700 transition shadow-sm active:scale-[0.98]"
              >
                {showScanner ? <Camera size={24} /> : <ScanLine size={24} />}
                {showScanner ? t('landing.close_camera') : t('landing.open_camera')}
              </button>

              <AnimatePresence>
                {showScanner && (
                  <motion.div
                    key="scanner"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 flex justify-center overflow-hidden rounded-xl"
                  >
                    <QrCameraScanner onResult={handleQrResult} onClose={() => setShowScanner(false)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="my-6 flex items-center text-slate-400 text-sm">
                <div className="flex-1 border-t border-slate-100"></div>
                <span className="px-3 font-medium">{t('landing.or')}</span>
                <div className="flex-1 border-t border-slate-100"></div>
              </div>

              <form onSubmit={handleZoneCodeSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={zoneCodeInput}
                  onChange={(e) => setZoneCodeInput(e.target.value)}
                  placeholder={t('landing.enter_code_placeholder')}
                  maxLength={60}
                  className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="submit"
                  disabled={!zoneCodeInput.trim()}
                  className="flex-shrink-0 rounded-xl bg-slate-800 px-6 py-3 font-bold text-white hover:bg-slate-900 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {t('landing.enter')}
                </button>
              </form>
            </div>

            {/* Demo Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleStart}
                disabled={permissionStatus === 'requesting'}
                className="flex w-full min-h-[56px] items-center justify-center gap-3 rounded-xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <MapPinned size={22} />
                {permissionStatus === 'requesting' ? t('landing.requestingGps') : t('landing.startExperience')}
              </button>

              <button
                type="button"
                onClick={handleDemo}
                className="flex w-full min-h-[56px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition active:scale-[0.98]"
              >
                <Compass size={20} className="text-slate-500" />
                {t('landing.demoExperience')}
              </button>
            </div>

            {permissionStatus === 'denied' && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600">
                {t('landing.gpsDenied')}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DISCOVERY AREA */}
        <div className="hidden md:flex w-1/2 flex-col bg-slate-100/50 p-6 md:p-12 lg:p-16 border-l border-slate-200 overflow-y-auto">
          <div className="w-full max-w-lg mx-auto pt-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('landing.active_locations')}</h2>
            <div className="flex flex-col gap-4">
              {FEATURED_ZONES.map((zone) => (
                <div
                  key={zone.id}
                  className="group flex items-center gap-4 rounded-xl bg-white p-3 border border-slate-100 shadow-sm transition hover:shadow-md hover:border-teal-200 cursor-pointer"
                >
                  <img
                    src={zone.img}
                    alt={zone.title}
                    className="h-20 w-20 rounded-lg object-cover bg-slate-200"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                      {zone.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">{zone.subtitle}</p>
                  </div>
                  <div className="pr-2 text-slate-300 group-hover:text-teal-500 transition">
                    <ChevronRight size={24} />
                  </div>
                </div>
              ))}
            </div>

            {/* Optional decoration/footer for the right column */}
            <div className="mt-10 p-6 rounded-2xl bg-teal-50 border border-teal-100 text-center">
              <h4 className="font-bold text-teal-800 mb-2">{t('landing.become_partner')}</h4>
              <p className="text-sm text-teal-600 mb-4">{t('landing.partner_desc')}</p>
              <button 
                onClick={() => navigate('/vendor/login')}
                className="text-sm font-bold bg-white text-teal-700 px-4 py-2 rounded-lg border border-teal-200 hover:bg-teal-50 transition"
              >
                {t('landing.register_now')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
