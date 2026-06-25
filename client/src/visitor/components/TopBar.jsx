import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo/logo.png';

const languages = [
  { code: 'vi', name: 'VI' },
  { code: 'en', name: 'EN' },
  { code: 'ja', name: 'JA' },
  { code: 'ko', name: 'KO' },
  { code: 'zh', name: 'ZH' },
];

export function TopBar({ title = 'VietTourAudio', compact = false }) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentIndex = languages.findIndex(l => l.code === i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLang = languages[nextIndex].code;
    i18n.changeLanguage(nextLang);
    localStorage.setItem('admin_lang', nextLang); // Sync with store
  };

  return (
    <header className="absolute left-4 right-4 top-4 z-10">
      <div className="flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl">
        <div className="flex min-w-0 items-center gap-3">
          <img className="h-10 w-10 flex-shrink-0 rounded-xl border border-slate-100" src={logo} alt="VietTourAudio" loading="lazy" decoding="async" />
          {compact ? (
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-slate-900">{title}</p>
              <p className="text-xs font-medium text-slate-500">{t('common.smartGuide', 'Smart Guide')}</p>
            </div>
          ) : (
            <span className="font-display text-xl font-bold text-slate-900">VietTourAudio</span>
          )}
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex h-10 flex-shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold uppercase text-slate-700 shadow-sm backdrop-blur transition duration-150 ease-out hover:bg-slate-100 active:scale-[0.98]"
          aria-label="Đổi ngôn ngữ"
        >
          <Languages size={18} />
          {i18n.language?.toUpperCase().substring(0, 2) || 'VI'}
        </button>
      </div>
    </header>
  );
}
