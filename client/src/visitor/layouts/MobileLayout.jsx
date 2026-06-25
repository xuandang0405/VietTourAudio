import { Crosshair, QrCode, SatelliteDish, Search } from 'lucide-react';
import { AudioPlayerSheet } from '../../components/AudioPlayerSheet';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '../components/BottomNav';
import { DevGpsPanel } from '../../features/geofence-audio/components/DevGpsPanel';
import { LeafletMap } from '../../features/poi/components/LeafletMap';
import { PoiBottomSheet } from '../../features/poi/components/PoiBottomSheet';
import { PremiumStatusButton } from '../components/PremiumStatusButton';
import { TopBar } from '../components/TopBar';

export function MobileLayout({
  searchParams,
  setSearchParams,
  selectedPoi,
  enrichedPois = [],
  visiblePois = [],
  searchQuery,
  setSearchQuery,
  position,
  permissionStatus,
  isFakeMode,
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

  return (
    <section className="relative w-full h-[100dvh] overflow-hidden bg-slate-50">
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
          <div className="absolute left-1/2 top-[12px] z-30 w-full -translate-x-1/2 text-center pointer-events-auto">
            <PremiumStatusButton onUpgrade={onUpgrade} />
          </div>

          <div className="absolute bottom-[calc(38%+40px)] right-0 z-30 grid gap-3 pointer-events-auto">
            <button
              type="button"
              onClick={onUpgrade}
              className="pointer-events-auto shadow-xl rounded-2xl bg-white/95 backdrop-blur-md grid h-12 w-12 place-items-center border border-slate-200 text-teal-600 transition duration-150 ease-out hover:bg-white active:scale-[0.98]"
              aria-label={t('openPremium')}
            >
              <QrCode size={21} />
            </button>
            <button
              type="button"
              onClick={handleLocate}
              className="pointer-events-auto shadow-xl rounded-2xl bg-teal-600 text-white transition duration-150 ease-out hover:bg-teal-700 active:scale-[0.98] grid h-12 w-12 place-items-center"
              aria-label={t('relocate')}
            >
              <Crosshair size={21} />
            </button>
          </div>

          {(isFakeMode || searchParams.get('debug') === 'gps') && (
            <div className="pointer-events-auto absolute left-0 top-[60px]">
              <DevGpsPanel pois={enrichedPois} onToast={onToast} />
            </div>
          )}

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
            <div className="mt-3 grid max-h-[18svh] gap-2 overflow-y-auto hide-scrollbar">
              {visiblePois.length > 0 ? (
                visiblePois.map((poi) => (
                  <button
                    key={poi.id}
                    type="button"
                    onClick={() => handleSelectPoi(poi)}
                    className="grid grid-cols-[58px_1fr_auto] items-center gap-3 p-2 text-left bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.99] pointer-events-auto"
                  >
                    <img className="h-14 w-14 rounded-xl border border-slate-100 object-cover" src={poi.image} alt={poi.title} loading="lazy" decoding="async" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-900">{poi.title}</span>
                      <span className="mt-1 block text-xs font-semibold text-teal-600">{poi.distanceLabel}</span>
                    </span>
                    <span className={poi.isInsideRadius ? 'h-3 w-3 rounded-full bg-orange-500 shadow-sm' : 'h-3 w-3 rounded-full bg-slate-200'} />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  {t('noPoi')}
                </div>
              )}
            </div>
          </section>

          <div className="pointer-events-auto w-full">
            <BottomNav />
          </div>
        </div>
      </div>

      {/* Floating Sheets outside overlay frame to preserve slide-up animation and layout */}
      <div className="relative z-20 pointer-events-auto">
        <AudioPlayerSheet />
        <PoiBottomSheet
          poi={selectedPoi}
          onClose={handleClosePoi}
          onUpgrade={onUpgrade}
          onToast={onToast}
          routingCoordinates={routingCoordinates}
          routingInfo={routingInfo}
          onGetDirections={() => handleGetDirections(selectedPoi)}
          onClearDirections={() => {
            setRoutingCoordinates([]);
            setRoutingInfo(null);
          }}
        />
      </div>
    </section>
  );
}
