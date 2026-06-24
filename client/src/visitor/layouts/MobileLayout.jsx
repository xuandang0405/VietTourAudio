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
  onUpgrade,
  onToast
}) {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });

  return (
    <section className="relative h-[100vh] min-h-[100vh] overflow-hidden bg-slate-50">
      <div className="absolute inset-0">
        <LeafletMap selectedPoi={selectedPoi} enrichedPois={enrichedPois} position={position} onSelectPoi={handleSelectPoi} />
      </div>

      <TopBar title={t('mapTitle')} compact />

      <div className="absolute left-1/2 top-[92px] z-[1200] w-[calc(100%-2rem)] -translate-x-1/2 text-center">
        <PremiumStatusButton onUpgrade={onUpgrade} />
      </div>

      <div className="absolute bottom-[calc(38%+112px)] right-4 z-[1200] grid gap-3">
        <button
          type="button"
          onClick={onUpgrade}
          className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white/90 text-teal-600 shadow-md backdrop-blur-xl transition duration-150 ease-out hover:bg-white active:scale-[0.98]"
          aria-label={t('openPremium')}
        >
          <QrCode size={21} />
        </button>
        <button
          type="button"
          onClick={handleLocate}
          className="grid h-12 w-12 place-items-center rounded-full bg-teal-600 text-white shadow-md transition duration-150 ease-out hover:bg-teal-700 active:scale-[0.98]"
          aria-label={t('relocate')}
        >
          <Crosshair size={21} />
        </button>
      </div>

      {(isFakeMode || searchParams.get('debug') === 'gps') && <DevGpsPanel pois={enrichedPois} onToast={onToast} />}

      {!position && (
        <article className="absolute left-4 right-4 top-[150px] z-[1200] bg-white rounded-2xl p-4 text-center shadow-xl border border-slate-100">
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

      <section className="absolute bottom-[86px] left-0 right-0 z-[1100] max-h-[38%] rounded-t-3xl border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
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
        <div className="mt-3 grid max-h-[calc(38svh-112px)] gap-2 overflow-y-auto hide-scrollbar">
          {visiblePois.length > 0 ? (
            visiblePois.map((poi) => (
              <button
                key={poi.id}
                type="button"
                onClick={() => handleSelectPoi(poi)}
                className="grid grid-cols-[58px_1fr_auto] items-center gap-3 p-2 text-left bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.99]"
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

      <BottomNav />
      <AudioPlayerSheet />
      <PoiBottomSheet poi={selectedPoi} onClose={() => setSearchParams({})} onUpgrade={onUpgrade} onToast={onToast} />
    </section>
  );
}
