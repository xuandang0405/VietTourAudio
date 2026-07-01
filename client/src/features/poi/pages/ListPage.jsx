import { ChevronRight, Crown, Headphones, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import heroTravel from '../../../assets/img/hero-travel.png';
import { localizeDestination, localizePoi } from '../../../data/visitorPois';
import { useTranslation } from 'react-i18next';
import { poiService } from '../services/poiService';
import { stallService } from '../../vendor-wallet/services/stallService';
import { useLanguageStore } from '../../../stores/languageStore';
import { useLocationStore } from '../../geofence-audio/stores/locationStore';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';
import { enrichPoisWithDistance, formatDistance } from '../../../utils/geo';
import { BottomNav } from '../../../visitor/components/BottomNav';
import { TopBar } from '../../../visitor/components/TopBar';

export function ListPage({ onUpgrade }) {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const zoneQuery = searchParams.get('zone');
  const backendAssetHost = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  const [databasePois, setDatabasePois] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [databaseDestinations, setDatabaseDestinations] = useState([]);
  const [dataError, setDataError] = useState('');
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const position = useLocationStore((state) => state.position);

  useEffect(() => {
    const lockedZone = localStorage.getItem('locked_zone');
    if (!zoneQuery && lockedZone) {
      navigate(`/list?zone=${lockedZone}`, { replace: true });
    }
  }, [zoneQuery, navigate]);

  useEffect(() => {
    let active = true;

    poiService.getAll().then((response) => {
      if (!active) return;
      const apiPois = response.data?.data ?? [];
      if (apiPois.length === 0) {
        setDatabasePois([]);
        return;
      }
      setDatabasePois(apiPois.map((apiPoi) => {
        const description = apiPoi.description ?? '';
        return {
          id: apiPoi.slug ?? String(apiPoi.id),
          apiId: String(apiPoi.id),
          stallId: apiPoi.stallId ? String(apiPoi.stallId) : (apiPoi.StallId ? String(apiPoi.StallId) : null),
          qrCodeId: apiPoi.qrCodeId ?? String(apiPoi.id),
          title: apiPoi.name,
          zoneName: apiPoi.zoneName,
          category: apiPoi.category,
          coverUrl: apiPoi.coverUrl,
          image: apiPoi.imageUrl ?? heroTravel,
          latitude: Number(apiPoi.latitude),
          longitude: Number(apiPoi.longitude),
          activationRadius: Number(apiPoi.activationRadius),
          isPremiumPoi: Boolean(apiPoi.isPremium),
          description,
          descriptions: { vi: description },
          narration: { vi: description },
          tourSlug: apiPoi.tourSlug,
          tourId: apiPoi.tourId ? String(apiPoi.tourId) : null,
          status: apiPoi.status ?? 'ACTIVE',
          approvalStatus: apiPoi.approvalStatus ?? 'APPROVED'
        };
      }));
    }).catch(() => {
      if (active) setDataError(t('no_server_data', 'Chưa có dữ liệu thực tế từ máy chủ. Vui lòng kết nối database!'));
    });

    stallService.getAll().then((response) => {
      if (!active) return;
      const apiStalls = response.data?.data ?? [];
      const approvedStalls = apiStalls.filter((stall) => stall.status === 'APPROVED');
      if (approvedStalls.length === 0) return;
      setDatabaseDestinations(approvedStalls.map((stall) => ({
        id: `stall-${stall.id}`,
        name: stall.name,
        city: stall.address ?? t('fallback_city'),
        label: stall.isPremium ? t('premium') : t('open_now'),
        image: heroTravel
      })));
    }).catch(() => {
      if (active) setDataError(t('no_server_data', 'Chưa có dữ liệu thực tế từ máy chủ. Vui lòng kết nối database!'));
    });

    return () => {
      active = false;
    };
  }, []);

  const pois = useMemo(() => {
    const sourcePois = databasePois;
    const activePois = sourcePois.filter((poi) => (poi.status ?? 'ACTIVE') === 'ACTIVE' && (poi.approvalStatus ?? 'APPROVED') === 'APPROVED');
    const localizedPois = activePois.map((poi) => localizePoi(poi, currentLanguage));
    const filteredPois = zoneQuery
      ? localizedPois.filter(poi => {
          const isNumericQuery = /^\d+$/.test(zoneQuery);
          if (isNumericQuery) {
            return poi.tourId !== null && String(poi.tourId) === String(zoneQuery);
          }
          return poi.tourSlug === zoneQuery;
        })
      : localizedPois;
    const searchedPois = searchQuery.trim()
      ? filteredPois.filter(poi => 
          poi.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          poi.category?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          poi.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filteredPois;
    return position
      ? enrichPoisWithDistance(searchedPois, position, currentLanguage)
      : searchedPois.map((poi) => ({
        ...poi,
        distanceLabel: poi.distanceHint ?? formatDistance(Number.POSITIVE_INFINITY, currentLanguage)
      }));
  }, [currentLanguage, databasePois, position, zoneQuery, searchQuery]);
  const destinations = useMemo(
    () => databaseDestinations
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
        <div className="sticky top-0 bg-white/95 backdrop-blur-md pb-3 pt-1 z-10 px-1 mb-4">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
            <Search size={17} className="text-slate-400" />
            <input
              className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              placeholder={t('searchPlaceholder', 'Tìm kiếm sạp hàng...')}
              aria-label={t('searchPlaceholder', 'Tìm kiếm sạp hàng...')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
        </div>

        {(dataError || pois.length === 0) && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-6 text-center text-sm font-semibold text-slate-600">
            {dataError || t('no_server_data', 'Chưa có dữ liệu thực tế từ máy chủ. Vui lòng kết nối database!')}
          </div>
        )}

        <div className="grid gap-4 pc:grid-cols-2">
          {pois.map((poi) => {
            const audioAvailable = !poi.isPremiumPoi || isPremium;
            const detailTarget = zoneQuery ? `/map?zone=${zoneQuery}&poi=${poi.id}` : `/map?poi=${poi.id}`;
            return (
              <Link key={poi.id} to={detailTarget} className="glass-card flex items-center gap-4 p-3 active:scale-[0.98]">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 shadow-inner">
                  <img 
                    src={poi.coverUrl?.startsWith('http') ? poi.coverUrl : `${backendAssetHost}${poi.coverUrl || '/uploads/default-placeholder.png'}`}
                    alt=""
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=200'; }}
                    className="w-full h-full object-cover rounded-xl"
                    loading="lazy"
                    decoding="async"
                  />
                  {audioAvailable && (
                    <div className="absolute -right-1 -top-1 rounded-full border border-premiumNeon/30 bg-premiumNeon p-1 shadow-neon-premium z-10">
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

        {!zoneQuery && (
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
        )}
      </div>

      <BottomNav />
    </section>
  );
}
