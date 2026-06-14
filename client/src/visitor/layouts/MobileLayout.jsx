import { Crosshair, QrCode, SatelliteDish, Search } from 'lucide-react';
import { useTranslation } from '../../i18n/translations';
import { BottomNav } from '../components/BottomNav';
import { DevGpsPanel } from '../components/DevGpsPanel';
import { LeafletMap } from '../components/LeafletMap';
import { PoiBottomSheet } from '../components/PoiBottomSheet';
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
  const { t } = useTranslation();

  return (
    <section className="relative h-[100vh] min-h-[100vh] overflow-hidden bg-transparent">
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
          className="grid h-12 w-12 place-items-center rounded-full border border-glassBorder bg-white/5 text-oceanCyan shadow-glass-inner backdrop-blur-xl transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 active:scale-[0.98]"
          aria-label={t('openPremium')}
        >
          <QrCode size={21} />
        </button>
        <button
          type="button"
          onClick={handleLocate}
          className="grid h-12 w-12 place-items-center rounded-full bg-oceanCyan text-bgAbyss shadow-[0_0_20px_rgba(34,211,238,0.6)] transition duration-150 ease-out hover:bg-white active:scale-[0.98]"
          aria-label={t('relocate')}
        >
          <Crosshair size={21} />
        </button>
      </div>

      {(isFakeMode || searchParams.get('debug') === 'gps') && <DevGpsPanel onToast={onToast} />}

      {!position && (
        <article className="glass-card absolute left-4 right-4 top-[150px] z-[1200] p-4 text-center">
          <SatelliteDish className="mx-auto text-oceanCyan" size={30} />
          <h2 className="mt-2 font-display text-base font-bold text-textCrisp">{t('locating')}</h2>
          <p className="mt-1 text-sm leading-6 text-textSeafoam">{t('locatingHelp')}</p>
          <button
            type="button"
            onClick={handleLocate}
            disabled={permissionStatus === 'requesting'}
            className="mt-3 w-full rounded-full bg-oceanCyan px-4 py-3 text-sm font-bold text-bgAbyss shadow-[0_0_20px_rgba(34,211,238,0.6)] transition duration-150 ease-out hover:bg-white active:scale-[0.98] disabled:opacity-70"
          >
            {permissionStatus === 'requesting' ? t('gettingGps') : t('enableGps')}
          </button>
        </article>
      )}

      <section className="absolute bottom-[86px] left-0 right-0 z-[1100] max-h-[38%] rounded-t-2xl border-t border-glassBorder bg-glassCore px-4 pb-4 pt-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-electricBlue/25" />
        <label className="flex h-11 items-center gap-2 rounded-full border border-glassBorder bg-bgElevated/70 px-3 text-sm font-semibold text-textSeafoam">
          <Search size={17} />
          <input
            className="min-w-0 flex-1 bg-transparent text-textCrisp outline-none placeholder:text-textGhost"
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
                className="glass-card grid grid-cols-[58px_1fr_auto] items-center gap-3 p-2 text-left active:scale-[0.99]"
              >
                <img className="h-14 w-14 rounded-xl border border-glassBorder object-cover" src={poi.image} alt={poi.title} loading="lazy" decoding="async" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-textCrisp">{poi.title}</span>
                  <span className="mt-1 block text-xs font-semibold text-oceanCyan">{poi.distanceLabel}</span>
                </span>
                <span className={poi.isInsideRadius ? 'h-3 w-3 rounded-full bg-oceanCyan shadow-neon-cyan' : 'h-3 w-3 rounded-full bg-textGhost'} />
              </button>
            ))
          ) : (
            <div className="glass-card p-4 text-center text-sm font-semibold text-textSeafoam">
              {t('noPoi')}
            </div>
          )}
        </div>
      </section>

      <BottomNav />
      <PoiBottomSheet poi={selectedPoi} onClose={() => setSearchParams({})} onUpgrade={onUpgrade} onToast={onToast} />
    </section>
  );
}
