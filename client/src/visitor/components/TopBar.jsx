import { Languages } from 'lucide-react';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
import { useLanguageStore } from '../../stores/languageStore';

export function TopBar({ title = 'VietTourAudio', compact = false }) {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);

  return (
    <header className="absolute left-4 right-4 top-4 z-[1200] flex items-center justify-between rounded-3xl border border-white/75 bg-white/90 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-2xl">
      <div className="flex min-w-0 items-center gap-3">
        <img className="h-10 w-10 rounded-2xl shadow-md shadow-teal-900/10" src={logo} alt="VietTourAudio logo" />
        {compact ? (
          <div className="min-w-0">
            <p className="truncate text-base font-black leading-tight text-slate-950">{title}</p>
            <p className="truncate text-xs font-semibold text-slate-500">Smart audio guide</p>
          </div>
        ) : (
          <img className="h-8 max-w-[172px] object-contain" src={logoText} alt="VietTourAudio" />
        )}
      </div>
      <button
        type="button"
        onClick={toggleLanguage}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 text-sm font-black uppercase text-teal-700 transition duration-200 ease-out hover:bg-teal-100 active:scale-95"
      >
        <Languages size={17} />
        {currentLanguage}
      </button>
    </header>
  );
}
