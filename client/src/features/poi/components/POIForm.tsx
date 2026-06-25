import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Loader2 } from 'lucide-react';

interface POIFormProps {
  formName: string;
  setFormName: (val: string) => void;
  formStallId: string;
  setFormStallId: (val: string) => void;
  formDescription: string;
  setFormDescription: (val: string) => void;
  formLatitude: string;
  setFormLatitude: (val: string) => void;
  formLongitude: string;
  setFormLongitude: (val: string) => void;
  formRadius: string;
  setFormRadius: (val: string) => void;
  formIsPremium: boolean;
  setFormIsPremium: (val: boolean) => void;
  formStatus: string;
  setFormStatus: (val: string) => void;
  stalls: any[];
  error?: string;
  translations: { lang: string; title: string; ttsScript: string }[];
  setTranslations: (val: { lang: string; title: string; ttsScript: string }[]) => void;
}

export function POIForm({
  formName,
  setFormName,
  formStallId,
  setFormStallId,
  formDescription,
  setFormDescription,
  formLatitude,
  setFormLatitude,
  formLongitude,
  setFormLongitude,
  formRadius,
  setFormRadius,
  formIsPremium,
  setFormIsPremium,
  formStatus,
  setFormStatus,
  stalls,
  error,
  translations,
  setTranslations
}: POIFormProps) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [activeTab, setActiveTab] = useState('vi');

  const languages = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  // Sync parent formName and formDescription changes to translations 'vi'
  useEffect(() => {
    const viTrans = translations.find((tr) => tr.lang === 'vi');
    if (viTrans && (viTrans.title !== formName || viTrans.ttsScript !== formDescription)) {
      const updated = translations.map((tr) =>
        tr.lang === 'vi' ? { ...tr, title: formName, ttsScript: formDescription } : tr
      );
      setTranslations(updated);
    }
  }, [formName, formDescription]);

  const currentTranslation = translations.find((tr) => tr.lang === activeTab) || {
    lang: activeTab,
    title: '',
    ttsScript: '',
  };

  const handleTitleChange = (val: string) => {
    if (activeTab === 'vi') {
      setFormName(val);
    }
    const updated = translations.map((tr) =>
      tr.lang === activeTab ? { ...tr, title: val } : tr
    );
    setTranslations(updated);
  };

  const handleTtsScriptChange = (val: string) => {
    if (activeTab === 'vi') {
      setFormDescription(val);
    }
    const updated = translations.map((tr) =>
      tr.lang === activeTab ? { ...tr, ttsScript: val } : tr
    );
    setTranslations(updated);
  };

  const handleGetCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert(t('admin.poi.gps_unsupported', { defaultValue: "Trình duyệt hoặc môi trường HTTP của bạn không hỗ trợ lấy vị trí GPS trực tiếp." }));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Safely update form data via state setters or React Hook Form setValue
        // Ensure proper fallback checking if state primitives are nested
        const { latitude, longitude } = position.coords;
        const targetVal = typeof (window as any).setValue === 'function' ? (window as any).setValue : null;
        if (targetVal) {
          targetVal('latitude', latitude);
          targetVal('longitude', longitude);
        } else if (typeof (window as any).setFormData === 'function') {
          (window as any).setFormData((prev: any) => ({ ...prev, latitude, longitude }));
        } else {
          setFormLatitude(latitude.toFixed(7));
          setFormLongitude(longitude.toFixed(7));
        }
        setLocating(false);
      },
      (error) => {
        console.warn("GPS retrieval failed:", error);
        alert(t('admin.poi.gps_failed', { defaultValue: "Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí trên thiết bị." }));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4 py-2">
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}

      {/* Multilingual Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
        {languages.map((lang) => {
          const isActive = activeTab === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveTab(lang.code)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          );
        })}
      </div>

      {/* Localized Content fields */}
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
            {t('poi.form_name')} ({languages.find((l) => l.code === activeTab)?.flag} {activeTab.toUpperCase()})
          </label>
          <input
            value={currentTranslation.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={t('poi.form_name_placeholder')}
            className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 transition shadow-inner focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
            {t('common.description')} / TTS Script ({languages.find((l) => l.code === activeTab)?.flag} {activeTab.toUpperCase()})
          </label>
          <textarea
            value={currentTranslation.ttsScript}
            onChange={(e) => handleTtsScriptChange(e.target.value)}
            placeholder={t('poi.form_desc_placeholder')}
            className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 transition shadow-inner focus:bg-white resize-none"
          />
        </div>
      </div>

      {/* Common fields */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_stall')}</label>
        <select
          value={formStallId}
          onChange={(e) => setFormStallId(e.target.value)}
          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
        >
          {stalls.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          {stalls.length === 0 && <option value="">{t('poi.no_stall')}</option>}
        </select>
      </div>

      {/* Coordinates section */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">{t('poi.coordinates_section', { defaultValue: 'Tọa độ GPS' })}</span>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <Compass size={14} />}
            {t('poi.get_current_location', { defaultValue: 'Lấy vị trí hiện tại của tôi' })}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_latitude')}</label>
            <input
              type="number"
              step="any"
              value={formLatitude}
              onChange={(e) => setFormLatitude(e.target.value)}
              placeholder="10.77582"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_longitude')}</label>
            <input
              type="number"
              step="any"
              value={formLongitude}
              onChange={(e) => setFormLongitude(e.target.value)}
              placeholder="106.70208"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_radius_m')}</label>
            <input
              type="number"
              value={formRadius}
              onChange={(e) => setFormRadius(e.target.value)}
              placeholder="25"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('common.status')}</label>
          <select
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
          >
            <option value="ACTIVE">{t('common.active')}</option>
            <option value="DRAFT">{t('common.draft')}</option>
            <option value="INACTIVE">{t('common.inactive')}</option>
            <option value="ARCHIVED">{t('common.archived')}</option>
          </select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="isPremiumContent"
            checked={formIsPremium}
            onChange={(e) => setFormIsPremium(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isPremiumContent" className="text-sm font-bold text-slate-700">
            {t('poi.premium_content')}
          </label>
        </div>
      </div>
    </div>
  );
}
