import { Globe2, MapPin, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { languages, useLanguageStore } from '../../../stores/languageStore';
import { useLocationStore } from '../../geofence-audio/stores/locationStore';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';
import { formatCountdown } from '../../../utils/formatTime';
import { BottomNav } from '../../../visitor/components/BottomNav';
import { TopBar } from '../../../visitor/components/TopBar';

export function SettingsPage({ onUpgrade, onToast }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'landing' });
  const [now, setNow] = useState(Date.now());
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [searchParams, setSearchParams] = useSearchParams();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const expiresAt = usePremiumStore((state) => state.expiresAt);
  const deactivatePremium = usePremiumStore((state) => state.deactivatePremium);
  const clearLocation = useLocationStore((state) => state.clearLocation);
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const localizedGpsStatus = t(`gps_${permissionStatus}`);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[100vh] min-h-[100vh] overflow-y-auto bg-slate-50 px-4 pb-32 pt-24 text-slate-900 hide-scrollbar tablet:px-8 pc:px-10">
      <TopBar title={t('settings')} compact />

      <div className="mx-auto max-w-3xl">
        <header className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('noLogin')}</p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-slate-900">{t('deviceStatus')}</h1>
        </header>

        <div className="grid gap-3 pc:grid-cols-2">
          <article className="p-4 pc:col-span-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-teal-200 bg-teal-50 text-teal-600 shadow-sm"><ShieldCheck size={22} /></span>
              <div>
                <h2 className="font-display font-bold text-slate-900">{t('premiumPass')}</h2>
                <p className="text-sm font-semibold text-slate-500">
                  {isPremium ? t('remaining', { time: formatCountdown(expiresAt - now) }) : t('audioLockedFree')}
                </p>
              </div>
            </div>
            <button type="button" onClick={isPremium ? deactivatePremium : onUpgrade} className={isPremium
              ? 'mt-4 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition duration-150 ease-out hover:bg-slate-100 active:scale-[0.98] pc:max-w-xs'
              : 'mt-4 w-full rounded-full bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] transition duration-150 ease-out hover:brightness-110 active:scale-[0.98] pc:max-w-xs'}>
              {isPremium ? t('disablePremiumDemo') : t('unlockPremium24h')}
            </button>
          </article>

          <article className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-teal-200 bg-teal-50 text-teal-600 shadow-sm"><Globe2 size={22} /></span>
              <div>
                <h2 className="font-display font-bold text-slate-900">{t('language')}</h2>
                <p className="text-sm font-semibold text-slate-500">{t('languageHelp')}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {languages.map((language) => {
                const active = currentLanguage === language.code;
                return (
                  <button key={language.code} type="button" onClick={() => {
                    setLanguage(language.code);
                    i18n.changeLanguage(language.code);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('lang', language.code);
                    setSearchParams(newParams);
                  }} className={active
                    ? 'rounded-full border bg-teal-50 border-teal-500 text-teal-700 px-4 py-3 text-sm font-bold transition duration-150 ease-out active:scale-[0.98]'
                    : 'rounded-full border bg-white border-slate-200 text-slate-600 px-4 py-3 text-sm font-bold transition duration-150 ease-out hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98]'}>
                    {language.name}
                  </button>
                );
              })}
            </div>
          </article>

          <article className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-teal-200 bg-teal-50 text-teal-600 shadow-sm"><MapPin size={22} /></span>
              <div>
                <h2 className="font-display font-bold text-slate-900">GPS</h2>
                <p className="text-sm font-semibold text-slate-500">{t('gpsStatus', { status: localizedGpsStatus })}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearLocation();
                onToast?.(t('locationCleared'));
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition duration-150 ease-out hover:bg-slate-100 hover:text-slate-800 active:scale-[0.98]"
            >
              <Trash2 size={17} />
              {t('clearLocation')}
            </button>
          </article>
        </div>
      </div>

      <BottomNav />
    </section>
  );
}
