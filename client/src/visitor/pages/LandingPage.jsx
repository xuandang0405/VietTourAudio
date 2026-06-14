import { Compass, Headphones, Languages, MapPinned } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroTravel from '../../assets/img/hero-travel.png';
import logo from '../../assets/logo/logo.png';
import { useTranslation } from '../../i18n/translations';
import { languages, useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { TopBar } from '../components/TopBar';

export function LandingPage({ onToast }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const useDemoLocation = useLocationStore((state) => state.useDemoLocation);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  function initAudioContext() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const message = new SpeechSynthesisUtterance('');
      message.volume = 0;
      window.speechSynthesis.speak(message);
    }
  }

  async function handleStart() {
    initAudioContext();
    const allowed = await requestLocation();
    if (allowed) {
      onToast?.(t('gpsReady'));
      navigate('/map');
      return;
    }
    onToast?.(t('gpsFailed'));
  }

  function handleDemo() {
    initAudioContext();
    useDemoLocation();
    onToast?.(t('demoEnabled'));
    navigate('/map');
  }

  return (
    <section className="relative flex h-[100vh] min-h-[100vh] w-full overflow-hidden bg-transparent font-body text-textCrisp">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,7,18,0.94)_0%,rgba(6,11,24,0.78)_52%,rgba(11,21,40,0.42)_100%)] pc:hidden" />

      <div className="relative z-10 flex h-full w-full flex-shrink-0 flex-col px-6 pb-12 pt-32 pc:basis-[45%] pc:border-r pc:border-glassBorder pc:bg-bgAbyss/80 pc:px-10 xl:px-14">
        <div className="pc:hidden">
          <TopBar />
        </div>

        <div className="mx-auto mt-auto flex w-full max-w-md flex-1 flex-col justify-center pc:mx-0 pc:mt-16 pc:max-w-none">
          <div className="mb-8 flex flex-col items-center gap-4 pc:mb-12 pc:items-start">
            <img className="h-20 w-20 rounded-2xl shadow-neon-cyan pc:h-24 pc:w-24" src={logo} alt="VietTourAudio" loading="lazy" decoding="async" />
            <span className="bg-gradient-to-r from-textCrisp via-electricBlue to-oceanCyan bg-clip-text font-display text-4xl font-bold leading-none text-transparent drop-shadow-sm tablet:text-5xl">
              VietTourAudio
            </span>
          </div>

          <h1 className="mb-4 text-center font-display text-4xl font-bold leading-[1.1] text-textCrisp pc:mb-6 pc:text-left pc:text-5xl xl:text-6xl">
            {t('heroPrefix')} <span className="bg-gradient-to-r from-electricBlue to-oceanCyan bg-clip-text text-transparent">{t('heroHighlight')}</span>
          </h1>
          <p className="mx-auto mb-8 max-w-sm text-center text-base font-medium leading-relaxed text-textSeafoam pc:mx-0 pc:max-w-md pc:text-left pc:text-lg">
            {t('heroDescription')}
          </p>

          <div className="glass-card mb-8 grid grid-cols-[auto_1fr] items-center gap-3 p-3">
            <Languages className="text-oceanCyan" size={20} />
            <div className="grid grid-cols-2 gap-2">
              {languages.map((language) => {
                const active = currentLanguage === language.code;
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => setLanguage(language.code)}
                    aria-pressed={active}
                    className={active
                      ? 'rounded-xl border border-oceanCyan/40 bg-oceanCyan/15 px-3 py-2 text-sm font-bold text-textCrisp shadow-neon-cyan transition duration-150 ease-out active:scale-[0.98]'
                      : 'rounded-xl border border-glassBorder bg-white/5 px-3 py-2 text-sm font-bold text-textSeafoam transition duration-150 ease-out hover:border-oceanCyan/50 hover:bg-white/10 hover:text-textCrisp active:scale-[0.98]'}
                  >
                    {language.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-sm gap-4 pc:mx-0 pc:max-w-none pc:flex pc:flex-col xl:flex-row">
            <button
              type="button"
              onClick={handleStart}
              disabled={permissionStatus === 'requesting'}
              className="group relative inline-flex min-h-[60px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-abyssIndigo to-electricBlue px-6 text-base font-semibold text-white shadow-neon-cyan transition duration-150 ease-out hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 pc:min-h-[64px] pc:text-lg xl:flex-1"
            >
              <MapPinned size={22} className="opacity-90" />
              {permissionStatus === 'requesting' ? t('requestingGps') : t('startExperience')}
            </button>

            <button
              type="button"
              onClick={handleDemo}
              className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full border border-glassBorder bg-white/5 px-6 text-sm font-semibold text-textCrisp backdrop-blur transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 active:scale-[0.98] pc:min-h-[64px] pc:text-base xl:w-48"
            >
              <Compass size={20} />
              {t('demoExperience')}
            </button>
          </div>

          {permissionStatus === 'denied' && (
            <div className="mt-6 rounded-2xl border border-error/25 bg-error/10 p-4">
              <p className="text-center text-sm font-medium leading-relaxed text-red-100 pc:text-left">{t('gpsDenied')}</p>
            </div>
          )}

          <div className="relative z-10 mx-auto mt-10 grid w-full max-w-sm grid-cols-2 gap-3 border-t border-white/10 pt-8 pc:mx-0 pc:mt-auto pc:max-w-none">
            <FeatureBadge icon={MapPinned} label={t('autoGps')} />
            <FeatureBadge icon={Headphones} label={isPremium ? t('premiumAudio') : t('textAndImages')} isPremium={isPremium} />
          </div>
        </div>
      </div>

      <div className="relative hidden flex-1 bg-bgTrench pc:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-bgAbyss via-bgAbyss/45 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-bgAbyss/20 via-transparent to-bgAbyss/86" />
        <img src={heroTravel} alt="VietTourAudio" className="absolute inset-0 h-full w-full object-cover opacity-80" loading="lazy" decoding="async" />
      </div>
    </section>
  );
}

function FeatureBadge({ icon: Icon, label, isPremium }) {
  return (
    <div className={isPremium ? 'glass-card glass-card-active flex flex-col items-center justify-center p-4 pc:items-start' : 'glass-card flex flex-col items-center justify-center p-4 pc:items-start'}>
      <Icon className={isPremium ? 'text-premiumNeon' : 'text-textSeafoam'} size={24} strokeWidth={1.5} />
      <span className={isPremium ? 'mt-2 text-xs font-bold uppercase text-premiumNeon' : 'mt-2 text-xs font-bold uppercase text-textSeafoam'}>{label}</span>
    </div>
  );
}
