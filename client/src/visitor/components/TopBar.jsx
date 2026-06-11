import { Languages, Crown } from 'lucide-react';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
import { useLanguageStore } from '../../stores/languageStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { useEffect, useState } from 'react';

export function TopBar({ title = 'VietTourAudio', compact = false }) {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);
  
  const isPremium = usePremiumStore((state) => state.isPremium);
  const getFormattedCountdown = usePremiumStore((state) => state.getFormattedCountdown);
  const [countdown, setCountdown] = useState(getFormattedCountdown());

  useEffect(() => {
    if (!isPremium) return;
    const interval = setInterval(() => {
      setCountdown(getFormattedCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, [isPremium, getFormattedCountdown]);

  return (
    <header className="absolute left-4 right-4 top-4 z-[1200] flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img className="h-10 w-10 rounded-xl shadow-sm" src={logo} alt="VietTourAudio" />
          {compact ? (
            <div>
              <p className="text-base font-bold text-slate-900">{title}</p>
              <p className="text-xs font-medium text-slate-500">Smart Guide</p>
            </div>
          ) : (
            <img className="h-7 object-contain" src={logoText} alt="VietTourAudio" />
          )}
        </div>
        
        <button
          onClick={toggleLanguage}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold uppercase text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <Languages size={18} />
          {currentLanguage}
        </button>
      </div>

      {isPremium && (
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-premium-200 bg-gradient-to-r from-premium-50 to-premium-100 px-4 py-1.5 shadow-md">
          <Crown size={16} className="text-premium-600" />
          <span className="text-sm font-bold text-premium-800">
            Premium còn: <span className="font-mono">{countdown}</span>
          </span>
        </div>
      )}
    </header>
  );
}
