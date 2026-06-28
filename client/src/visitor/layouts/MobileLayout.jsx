import { useState } from 'react';
import { Crosshair, QrCode, SatelliteDish, Search, Heart, Navigation, X } from 'lucide-react';
import { AudioPlayerSheet } from '../../components/AudioPlayerSheet';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '../components/BottomNav';
import { LeafletMap } from '../../features/poi/components/LeafletMap';
import { PoiBottomSheet } from '../../features/poi/components/PoiBottomSheet';
import { TopBar } from '../components/TopBar';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useLocationStore } from '../../features/geofence-audio/stores/locationStore';

export function MobileLayout({
  searchParams,
  setSearchParams,
  selectedPoi,
  selectedStall,
  enrichedPois = [],
  visiblePois = [],
  searchQuery,
  setSearchQuery,
  position,
  permissionStatus,
  handleSelectPoi,
  handleLocate,
  handleClosePoi,
  onUpgrade,
  onToast,
  routingCoordinates,
  setRoutingCoordinates,
  routingInfo,
  setRoutingInfo,
  handleGetDirections,
  zoneCenter
}) {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const { t: tRoot } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const favorites = useFavoritesStore((state) => state.favorites);
  const favoritePois = visiblePois.filter(poi => poi.stallId && favorites.includes(poi.stallId));
  const isCameraLocked = useLocationStore((state) => state.isCameraLocked);
  const setIsCameraLocked = useLocationStore((state) => state.setIsCameraLocked);
  const navigationTargetPoi = useLocationStore((state) => state.navigationTargetPoi);

  const handleCameraLockToggle = () => {
    const nextLocked = !isCameraLocked;
    setIsCameraLocked(nextLocked);
    if (nextLocked) {
      const map = useLocationStore.getState().mapInstance;
      if (map) {
        if (position && position.lat && position.lng) {
          map.setView([position.lat, position.lng], 17, { animate: true });
        } else if (zoneCenter) {
          map.setView([zoneCenter.lat, zoneCenter.lng], 15, { animate: true });
        } else {
          map.setView([mapCenter.lat, mapCenter.lng], 15, { animate: true });
        }
      }
    }
  };

  return (
    <section className="relative w-full h-[100dvh] overflow-hidden bg-slate-100 isolate">
      <div className="absolute inset-0 z-0 w-full h-full">
        <LeafletMap
          selectedPoi={selectedPoi}
          enrichedPois={enrichedPois}
          position={position}
          onSelectPoi={handleSelectPoi}
          routingCoordinates={routingCoordinates}
          zoneCenter={zoneCenter}
        />
      </div>

      {/* Overlay Frame Container */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4">
        {/* Top items */}
        <div className="pointer-events-auto shadow-xl rounded-2xl bg-white/95 backdrop-blur-md w-full">
          <TopBar title={t('mapTitle')} compact />
        </div>

        {/* Center / Float items */}
        <div className="flex-1 flex flex-col justify-center items-end pointer-events-none relative">
          <div className="absolute bottom-[calc(38%+40px)] right-0 z-30 grid gap-3 pointer-events-auto">
            <button
              type="button"
              onClick={handleCameraLockToggle}
              className={`pointer-events-auto shadow-xl rounded-2xl transition duration-150 ease-out active:scale-[0.98] grid h-12 w-12 place-items-center border border-slate-200 ${
                isCameraLocked ? 'bg-teal-500 text-white' : 'bg-white/95 text-slate-600 hover:bg-white'
              }`}
              aria-label={isCameraLocked ? t('camera_lock_disable') : t('camera_lock_enable')}
              title={isCameraLocked ? t('camera_lock_on') : t('camera_lock_off')}
            >
              <Navigation size={21} className={isCameraLocked ? "rotate-45 text-white" : "text-slate-600"} />
            </button>
            <button
              type="button"
              onClick={handleLocate}
              className="pointer-events-auto shadow-xl rounded-2xl bg-teal-600 text-white transition duration-150 ease-out hover:bg-teal-700 active:scale-[0.98] grid h-12 w-12 place-items-center"
              aria-label={t('relocate')}
            >
              <Crosshair size={21} />
            </button>
            {navigationTargetPoi && !selectedPoi && (
              <button
                type="button"
                onClick={() => useLocationStore.getState().stopNavigation()}
                className="pointer-events-auto shadow-xl rounded-2xl transition duration-150 ease-out active:scale-[0.98] grid h-12 w-12 place-items-center border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                aria-label={tRoot('routing.clear_directions', { defaultValue: 'Hủy chỉ đường' })}
                title={tRoot('routing.clear_directions', { defaultValue: 'Hủy chỉ đường' })}
              >
                <X size={21} />
              </button>
            )}
          </div>

          {!position && (
            <article className="pointer-events-auto shadow-xl rounded-2xl bg-white/95 backdrop-blur-md absolute left-0 right-0 top-[120px] z-35 p-4 text-center border border-slate-100">
              <SatelliteDish className="mx-auto text-teal-500" size={30} />
              <h2 className="mt-2 font-display text-base font-bold text-slate-900">{t('locating')}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{t('locatingHelp')}</p>
              <button
                type="button"
                onClick={handleLocate}
                disabled={permissionStatus === 'requesting'}
                className="mt-4 w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition duration-150 ease-out hover:bg-teal-700 active:scale-[0.98] disabled:opacity-70"
              >
                {permissionStatus === 'requesting' ? t('gettingGps') : t('enableGps')}
              </button>
            </article>
          )}
        </div>

        {/* Bottom items */}
        <div className="w-full flex flex-col gap-2">
          <section className="pointer-events-auto shadow-xl rounded-t-3xl bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 pb-4 pt-3">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
            <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
              <Search size={17} />
              <input
                className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <div className="mt-3 flex gap-4 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'all' ? 'text-teal-600 border-b-2 border-teal-600 pb-1' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('list', { defaultValue: 'Danh sách' })}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('favorites')}
                className={`text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 ${
                  activeTab === 'favorites' ? 'text-teal-600 border-b-2 border-teal-600 pb-1' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Heart size={12} className={activeTab === 'favorites' ? "text-red-500 fill-red-500" : ""} />
                {t('favorites', { defaultValue: 'Yêu thích' })}
              </button>
            </div>

            <div className="mt-3 grid max-h-[18svh] gap-2 overflow-y-auto hide-scrollbar">
              {activeTab === 'all' ? (
                visiblePois.length > 0 ? (
                  visiblePois.map((poi) => (
                    <button
                      key={poi.id}
                      type="button"
                      onClick={() => handleSelectPoi(poi)}
                      className="grid grid-cols-[58px_1fr_auto] items-center gap-3 p-2 text-left bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.99] pointer-events-auto"
                    >
                      {poi.image && <img className="h-14 w-14 rounded-xl border border-slate-100 object-cover" src={poi.image} alt={poi.stallName || poi.name || poi.title} loading="lazy" decoding="async" />}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-900">{poi.stallName || poi.name || poi.title}</span>
                        <span className="mt-1 block text-xs font-semibold text-teal-600">{poi.distanceLabel}</span>
                      </span>
                      <span className={poi.isInsideRadius ? 'h-3 w-3 rounded-full bg-orange-500 shadow-sm' : 'h-3 w-3 rounded-full bg-slate-200'} />
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                    {t('noPoi')}
                  </div>
                )
              ) : (
                favoritePois.length > 0 ? (
                  favoritePois.map((poi) => (
                    <button
                      key={poi.id}
                      type="button"
                      onClick={() => handleSelectPoi(poi)}
                      className="grid grid-cols-[58px_1fr_auto] items-center gap-3 p-2 text-left bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.99] pointer-events-auto"
                    >
                      {poi.image && <img className="h-14 w-14 rounded-xl border border-slate-100 object-cover" src={poi.image} alt={poi.stallName || poi.name || poi.title} loading="lazy" decoding="async" />}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-900">{poi.stallName || poi.name || poi.title}</span>
                        <span className="mt-1 block text-xs font-semibold text-teal-600">{poi.distanceLabel}</span>
                      </span>
                      <span className={poi.isInsideRadius ? 'h-3 w-3 rounded-full bg-orange-500 shadow-sm' : 'h-3 w-3 rounded-full bg-slate-200'} />
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                    {t('no_favorites', { defaultValue: 'Chưa có sạp yêu thích' })}
                  </div>
                )
              )}
            </div>
          </section>

          <div className="pointer-events-auto w-full">
            <BottomNav />
          </div>
        </div>
      </div>

      {/* Floating Sheets outside overlay frame to preserve slide-up animation and layout */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <AudioPlayerSheet enrichedPois={enrichedPois} selectedStall={selectedStall} />
        <PoiBottomSheet
          poi={selectedPoi}
          selectedStall={selectedStall}
          onClose={handleClosePoi}
          onUpgrade={onUpgrade}
          onToast={onToast}
          routingCoordinates={routingCoordinates}
          routingInfo={routingInfo}
          onGetDirections={() => handleGetDirections(selectedPoi)}
          onClearDirections={() => {
            useLocationStore.getState().stopNavigation();
          }}
        />
      </div>
    </section>
  );
}
