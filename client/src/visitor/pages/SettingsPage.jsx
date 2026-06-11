import { Globe2, MapPin, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { languages, useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { formatCountdown } from '../../utils/formatTime';
import { useTranslation } from '../../i18n/translations';
import { BottomNav } from '../components/BottomNav';
import { TopBar } from '../components/TopBar';

export function SettingsPage({ onUpgrade, onToast }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const expiresAt = usePremiumStore((state) => state.expiresAt);
  const deactivatePremium = usePremiumStore((state) => state.deactivatePremium);
  const clearLocation = useLocationStore((state) => state.clearLocation);
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const localizedGpsStatus = {
    vi: { idle: 'chưa bật', requesting: 'đang yêu cầu', granted: 'đã cấp quyền', denied: 'bị từ chối', unavailable: 'không hỗ trợ' },
    en: { idle: 'not enabled', requesting: 'requesting', granted: 'allowed', denied: 'denied', unavailable: 'unavailable' },
    zh: { idle: '未开启', requesting: '正在请求', granted: '已允许', denied: '已拒绝', unavailable: '不可用' },
    ja: { idle: '未設定', requesting: '確認中', granted: '許可済み', denied: '拒否', unavailable: '利用不可' },
    ko: { idle: '꺼짐', requesting: '요청 중', granted: '허용됨', denied: '거부됨', unavailable: '사용 불가' }
  }[currentLanguage]?.[permissionStatus] ?? permissionStatus;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative h-full overflow-y-auto bg-slate-50 px-4 pb-28 pt-24 hide-scrollbar">
      <TopBar title={t('settings')} compact />

      <header className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">{t('noLogin')}</p>
        <h1 className="mt-1 text-3xl font-black leading-tight text-slate-950">{t('deviceStatus')}</h1>
      </header>

      <div className="grid gap-3">
        <article className="glass-panel rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-100 text-teal-700">
              <ShieldCheck size={22} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">{t('premiumPass')}</h2>
              <p className="text-sm font-semibold text-slate-500">
                {isPremium ? t('remaining', { time: formatCountdown(expiresAt - now) }) : t('audioLockedFree')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={isPremium ? deactivatePremium : onUpgrade}
            className={isPremium ? 'mt-4 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition duration-200 ease-out hover:bg-slate-200 active:scale-95' : 'mt-4 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition duration-200 ease-out hover:bg-orange-600 active:scale-95'}
          >
            {isPremium ? t('disablePremiumDemo') : t('unlockPremium24h')}
          </button>
        </article>

        <article className="glass-panel rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-600">
              <Globe2 size={22} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">{t('language')}</h2>
              <p className="text-sm font-semibold text-slate-500">{t('languageHelp')}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {languages.map((language) => {
              const active = currentLanguage === language.code;

              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => setLanguage(language.code)}
                  className={active ? 'rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/20 transition duration-200 ease-out active:scale-95' : 'rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition duration-200 ease-out hover:bg-slate-200 active:scale-95'}
                >
                  {language.name}
                </button>
              );
            })}
          </div>
        </article>

        <article className="glass-panel rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700">
              <MapPin size={22} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">GPS</h2>
              <p className="text-sm font-semibold text-slate-500">{t('gpsStatus', { status: localizedGpsStatus })}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearLocation();
              onToast(t('locationCleared'));
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition duration-200 ease-out hover:bg-slate-200 active:scale-95"
          >
            <Trash2 size={17} />
            {t('clearLocation')}
          </button>
        </article>
      </div>

      <BottomNav />
    </section>
  );
}
