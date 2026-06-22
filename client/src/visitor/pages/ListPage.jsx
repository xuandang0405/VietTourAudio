import { ChevronRight, Crown, Headphones } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import heroTravel from '../../assets/img/hero-travel.png';
import { destinationPreviews, localizeDestination, localizePoi, visitorPois } from '../../data/visitorPois';
import { useTranslation } from '../../i18n/translations';
import { poiService } from '../../services/poiService';
import { stallService } from '../../services/stallService';
import { useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { enrichPoisWithDistance, formatDistance } from '../../utils/geo';
import { BottomNav } from '../components/BottomNav';
import { TopBar } from '../components/TopBar';

export function ListPage({ onUpgrade }) {
  const { t } = useTranslation();
  const [databasePois, setDatabasePois] = useState(null);
  const [databaseDestinations, setDatabaseDestinations] = useState(null);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const position = useLocationStore((state) => state.position);
  const isFakeMode = useLocationStore((state) => state.isFakeMode);
  const simulateNearPoi = useLocationStore((state) => state.simulateNearPoi);

  useEffect(() => {
    let active = true;

    poiService.getAll().then((response) => {
      if (!active) return;
      const apiPois = response.data?.data ?? [];
      if (apiPois.length === 0) return;
      setDatabasePois(apiPois.map((apiPoi) => {
        const description = apiPoi.description ?? '';
        return {
          id: apiPoi.slug ?? String(apiPoi.id),
          apiId: Number(apiPoi.id),
          stallId: Number(apiPoi.stallId),
          qrCodeId: apiPoi.qrCodeId ?? Number(apiPoi.id),
          title: apiPoi.name,
          zoneName: apiPoi.zoneName,
          category: apiPoi.category,
          image: apiPoi.imageUrl ?? heroTravel,
          latitude: Number(apiPoi.latitude),
          longitude: Number(apiPoi.longitude),
          activationRadius: Number(apiPoi.activationRadius),
          isPremiumPoi: Boolean(apiPoi.isPremium),
          description,
          descriptions: { vi: description },
          narration: { vi: description }
        };
      }));
    }).catch(() => {
      // Keep bundled POIs available when the API is offline.
    });

    stallService.getAll().then((response) => {
      if (!active) return;
      const apiStalls = response.data?.data ?? [];
      const approvedStalls = apiStalls.filter((stall) => stall.status === 'APPROVED');
      if (approvedStalls.length === 0) return;
      setDatabaseDestinations(approvedStalls.map((stall) => ({
        id: `stall-${stall.id}`,
        name: stall.name,
        city: stall.address ?? 'Hội An, Quảng Nam',
        label: stall.isPremium ? 'Premium' : 'Đang mở',
        image: heroTravel
      })));
    }).catch(() => {
      // Keep bundled destination previews available when the API is offline.
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isFakeMode || !databasePois?.length) return;
    simulateNearPoi(databasePois[0]);
  }, [databasePois, isFakeMode, simulateNearPoi]);

  const pois = useMemo(() => {
    const sourcePois = databasePois ?? visitorPois;
    const localizedPois = sourcePois.map((poi) => localizePoi(poi, currentLanguage));
    return position
      ? enrichPoisWithDistance(localizedPois, position, currentLanguage)
      : localizedPois.map((poi) => ({
        ...poi,
        distanceLabel: poi.distanceHint ?? formatDistance(Number.POSITIVE_INFINITY, currentLanguage)
      }));
  }, [currentLanguage, databasePois, position]);
  const destinations = useMemo(
    () => (databaseDestinations ?? destinationPreviews)
      .map((destination) => localizeDestination(destination, currentLanguage)),
    [currentLanguage, databaseDestinations]
  );

  return (
    <section className="relative h-[100vh] min-h-[100vh] overflow-y-auto bg-transparent px-4 pb-32 pt-24 text-textCrisp hide-scrollbar tablet:px-8 pc:px-10">
      <TopBar title={t('list')} compact />

      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase text-oceanCyan">{t('inArea')}</p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-textCrisp">{t('stallsAndDestinations')}</h1>
        </header>

        <div className="grid gap-4 pc:grid-cols-2">
          {pois.map((poi) => {
            const audioAvailable = !poi.isPremiumPoi || isPremium;
            return (
              <Link key={poi.id} to={`/map?poi=${poi.id}`} className="glass-card flex items-center gap-4 p-3 active:scale-[0.98]">
                <div className="relative h-20 w-20 flex-shrink-0">
                  <img className="h-full w-full rounded-xl border border-glassBorder object-cover" src={poi.image} alt={poi.title} loading="lazy" decoding="async" />
                  {audioAvailable && (
                    <div className="absolute -right-1 -top-1 rounded-full border border-premiumNeon/30 bg-premiumNeon p-1 shadow-neon-premium">
                      <Headphones size={12} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-textCrisp">{poi.title}</span>
                  <span className="mt-1 block text-xs font-medium text-textSeafoam">
                    {poi.category}{poi.duration ? ` · ${poi.duration}` : ''}
                  </span>
                  <span className="mt-1 block text-xs font-bold text-oceanCyan">{poi.distanceLabel}</span>
                  <span className={audioAvailable
                    ? 'mt-2 inline-flex rounded-full border border-oceanCyan/20 bg-oceanCyan/10 px-2 py-1 text-[10px] font-bold uppercase text-oceanCyan'
                    : 'mt-2 inline-flex rounded-full border border-glassBorder bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-textSeafoam'}>
                    {audioAvailable ? t('audioAvailable') : t('audioPremium')}
                  </span>
                </div>
                <ChevronRight className="text-textGhost" size={20} />
              </Link>
            );
          })}
        </div>

        {!isPremium && (
          <button type="button" onClick={onUpgrade} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-premiumNeon to-electricBlue px-4 py-4 text-sm font-bold text-white shadow-neon-premium transition duration-150 hover:brightness-110 active:scale-[0.98] pc:max-w-sm">
            <Crown size={20} />
            {t('unlockPremium24h')}
          </button>
        )}

        <section className="mt-7">
          <p className="text-xs font-bold uppercase text-oceanCyan">{t('discoverMore')}</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-textCrisp">{t('nextDestination')}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 pc:grid-cols-4">
            {destinations.map((destination) => (
              <article key={destination.id} className="glass-card overflow-hidden">
                <img className="aspect-[1.25] w-full object-cover" src={destination.image} alt={destination.name} loading="lazy" decoding="async" />
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-textCrisp">{destination.name}</p>
                  <p className="mt-1 text-xs font-semibold text-textSeafoam">{destination.city}</p>
                  <span className="mt-2 inline-flex rounded-full border border-glassBorder bg-white/5 px-2.5 py-1 text-[11px] font-bold text-textSeafoam">{destination.label}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </section>
  );
}
