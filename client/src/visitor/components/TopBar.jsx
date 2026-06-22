import { Languages } from 'lucide-react';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
import { useTranslation } from '../../i18n/translations';
import { useLanguageStore } from '../../stores/languageStore';

export function TopBar({ title = 'VietTourAudio', compact = false }) {
  const { t } = useTranslation();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);

  return (
    <header className="absolute left-4 right-4 top-4 z-[1200]">
      <div className="glass-card flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img className="h-10 w-10 flex-shrink-0 rounded-xl shadow-neon-cyan" src={logo} alt="VietTourAudio" loading="lazy" decoding="async" />
          {compact ? (
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-textCrisp">{title}</p>
              <p className="text-xs font-medium text-textSeafoam">{t('smartGuide')}</p>
            </div>
          ) : (
            <img className="h-7 object-contain brightness-0 invert" src={logoText} alt="VietTourAudio" loading="lazy" decoding="async" />
          )}
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex h-10 flex-shrink-0 items-center gap-2 rounded-full border border-glassBorder bg-white/5 px-3 text-sm font-bold uppercase text-textCrisp shadow-glass-inner backdrop-blur transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 active:scale-[0.98]"
          aria-label="Đổi ngôn ngữ"
        >
          <Languages size={18} />
          {currentLanguage}
        </button>
      </div>
    </header>
  );
}
