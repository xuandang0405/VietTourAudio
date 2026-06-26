import { useState } from 'react';
import { Crosshair, Globe2, MapPin, X, Heart } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
import { languages, useLanguageStore } from '../../stores/languageStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { SidebarPoiCard } from '../../features/poi/components/SidebarPoiCard';
import { useTranslation } from 'react-i18next';

export function SidebarContent({
  onClose,
  onUpgrade,
  handleLocate,
  permissionStatus,
  isFakeMode,
  enrichedPois = [],
  selectedPoi,
  handleSelectPoi
}) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'landing' });
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState('nearby');
  const favorites = useFavoritesStore((state) => state.favorites);
  const favoritePois = enrichedPois.filter((poi) => poi.stallId && favorites.includes(poi.stallId));

  const gpsLabels = {
    granted: t('gps_granted'),
    requesting: t('gps_requesting'),
    denied: t('gps_denied'),
    unavailable: t('gps_unavailable'),
    idle: t('gps_idle')
  };

  return (
    <div className="flex h-full w-[300px] flex-col border-r border-glassBorder bg-bgSurface/82 shadow-2xl shadow-black/35 backdrop-blur-xl xl:shadow-none">
      <div className="flex items-center justify-between border-b border-glassBorder p-4">
        <div className="flex min-w-0 items-center gap-2">
          <img className="h-8 w-8 flex-shrink-0 rounded-lg shadow-neon-cyan" src={logo} alt="VietTourAudio" loading="lazy" decoding="async" />
          <img className="h-5 object-contain brightness-0 invert" src={logoText} alt="VietTourAudio" loading="lazy" decoding="async" />
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-full border border-glassBorder bg-white/5 p-2 text-textSeafoam transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 hover:text-textCrisp active:scale-[0.98]"
            aria-label={t('close_nav')}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 hide-scrollbar">

        <section>
          <div className="mb-2 flex items-center gap-2">
            <Globe2 size={14} className="text-oceanCyan" />
            <p className="text-[10px] font-bold uppercase text-textGhost">{t('audio_language')}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  i18n.changeLanguage(lang.code);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('lang', lang.code);
                  setSearchParams(newParams);
                }}
                className={[
                  'rounded-full border px-3 py-2 text-xs font-bold transition duration-150 ease-out active:scale-[0.98]',
                  currentLanguage === lang.code
                    ? 'border-oceanCyan/40 bg-oceanCyan/15 text-textCrisp shadow-neon-cyan'
                    : 'border-glassBorder bg-white/5 text-textSeafoam hover:border-oceanCyan/50 hover:bg-white/10 hover:text-textCrisp'
                ].join(' ')}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <MapPin size={14} className="text-oceanCyan" />
            <p className="text-[10px] font-bold uppercase text-textGhost">{t('gps_location')}</p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-glassBorder bg-white/5 p-3">
            <span className="text-xs font-semibold text-textSeafoam">
              {isFakeMode ? t('demo_mode_active') : (gpsLabels[permissionStatus] ?? t('gps_idle'))}
            </span>
            <button
              type="button"
              onClick={handleLocate}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-glassBorder bg-white/5 text-textCrisp shadow-glass-inner transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 hover:text-oceanCyan active:scale-[0.98]"
              title={t('relocate')}
              aria-label={t('relocate')}
            >
              <Crosshair size={16} />
            </button>
          </div>
        </section>

        <section className="flex flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between border-b border-glassBorder pb-2">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('nearby')}
                className={`text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'nearby' ? 'text-textCrisp border-b-2 border-oceanCyan pb-1' : 'text-textGhost hover:text-textSeafoam'
                }`}
              >
                {t('near_you')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('favorites')}
                className={`text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 ${
                  activeTab === 'favorites' ? 'text-textCrisp border-b-2 border-oceanCyan pb-1' : 'text-textGhost hover:text-textSeafoam'
                }`}
              >
                <Heart size={12} className={activeTab === 'favorites' ? "text-red-500 fill-red-500" : ""} />
                {t('favorites', { defaultValue: 'Yêu thích' })}
              </button>
            </div>
            {activeTab === 'nearby' && (
              <Link to="/list" className="text-xs font-bold text-oceanCyan transition duration-150 ease-out hover:text-electricBlue">
                {t('view_all')}
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {activeTab === 'nearby' ? (
              enrichedPois.length > 0 ? (
                enrichedPois.slice(0, 5).map((poi) => (
                  <SidebarPoiCard key={poi.id} poi={poi} active={selectedPoi?.id === poi.id} onClick={() => handleSelectPoi(poi)} />
                ))
              ) : (
                <div className="glass-card p-4 text-center text-sm font-semibold text-textSeafoam">
                  {t('no_poi_nearby')}
                </div>
              )
            ) : (
              favoritePois.length > 0 ? (
                favoritePois.map((poi) => (
                  <SidebarPoiCard key={poi.id} poi={poi} active={selectedPoi?.id === poi.id} onClick={() => handleSelectPoi(poi)} />
                ))
              ) : (
                <div className="glass-card p-4 text-center text-sm font-semibold text-textSeafoam">
                  {t('no_favorites', { defaultValue: 'Chưa có sạp yêu thích' })}
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
