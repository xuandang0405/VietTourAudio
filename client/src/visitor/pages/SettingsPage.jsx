import { Globe2, MapPin, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/translations';
import { languages, useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { formatCountdown } from '../../utils/formatTime';
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
    <section className="relative h-[100vh] min-h-[100vh] overflow-y-auto bg-transparent px-4 pb-32 pt-24 text-textCrisp hide-scrollbar tablet:px-8 pc:px-10">
      <TopBar title={t('settings')} compact />

      <div className="mx-auto max-w-3xl">
        <header className="mb-4">
          <p className="text-xs font-bold uppercase text-oceanCyan">{t('noLogin')}</p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-textCrisp">{t('deviceStatus')}</h1>
        </header>

        <div className="grid gap-3 pc:grid-cols-2">
          <article className="glass-card p-4 pc:col-span-2">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-premiumNeon/30 bg-premiumNeon/10 text-premiumNeon shadow-neon-premium"><ShieldCheck size={22} /></span>
              <div>
                <h2 className="font-display font-bold text-textCrisp">{t('premiumPass')}</h2>
                <p className="text-sm font-semibold text-textSeafoam">
                  {isPremium ? t('remaining', { time: formatCountdown(expiresAt - now) }) : t('audioLockedFree')}
                </p>
              </div>
            </div>
            <button type="button" onClick={isPremium ? deactivatePremium : onUpgrade} className={isPremium
              ? 'mt-4 w-full rounded-full border border-glassBorder bg-white/5 px-4 py-3 text-sm font-bold text-textCrisp transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 active:scale-[0.98] pc:max-w-xs'
              : 'mt-4 w-full rounded-full bg-gradient-to-r from-premiumNeon to-electricBlue px-4 py-3 text-sm font-bold text-white shadow-neon-premium transition duration-150 ease-out hover:brightness-110 active:scale-[0.98] pc:max-w-xs'}>
              {isPremium ? t('disablePremiumDemo') : t('unlockPremium24h')}
            </button>
          </article>

          <article className="glass-card p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-oceanCyan/30 bg-oceanCyan/10 text-oceanCyan shadow-neon-cyan"><Globe2 size={22} /></span>
              <div>
                <h2 className="font-display font-bold text-textCrisp">{t('language')}</h2>
                <p className="text-sm font-semibold text-textSeafoam">{t('languageHelp')}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {languages.map((language) => {
                const active = currentLanguage === language.code;
                return (
                  <button key={language.code} type="button" onClick={() => setLanguage(language.code)} className={active
                    ? 'rounded-full border border-oceanCyan/40 bg-oceanCyan/15 px-4 py-3 text-sm font-bold text-textCrisp shadow-neon-cyan transition duration-150 ease-out active:scale-[0.98]'
                    : 'rounded-full border border-glassBorder bg-white/5 px-4 py-3 text-sm font-bold text-textSeafoam transition duration-150 ease-out hover:border-oceanCyan/50 hover:bg-white/10 hover:text-textCrisp active:scale-[0.98]'}>
                    {language.name}
                  </button>
                );
              })}
            </div>
          </article>

          <article className="glass-card p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-electricBlue/30 bg-electricBlue/10 text-electricBlue shadow-neon-cyan"><MapPin size={22} /></span>
              <div>
                <h2 className="font-display font-bold text-textCrisp">GPS</h2>
                <p className="text-sm font-semibold text-textSeafoam">{t('gpsStatus', { status: localizedGpsStatus })}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearLocation();
                onToast?.(t('locationCleared'));
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-glassBorder bg-white/5 px-4 py-3 text-sm font-bold text-textCrisp transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 active:scale-[0.98]"
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
