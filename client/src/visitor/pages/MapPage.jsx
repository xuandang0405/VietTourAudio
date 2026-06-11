import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, QrCode, SatelliteDish, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { localizePoi, visitorPois } from '../../data/visitorPois';
import { useTranslation } from '../../i18n/translations';
import { poiService } from '../../services/poiService';
import { visitorTrackingService } from '../../services/visitorTrackingService';
import { useAudioStore } from '../../stores/audioStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { enrichPoisWithDistance } from '../../utils/geo';
import { BottomNav } from '../components/BottomNav';
import { DevGpsPanel } from '../components/DevGpsPanel';
import { LeafletMap } from '../components/LeafletMap';
import { PoiBottomSheet } from '../components/PoiBottomSheet';
import { PremiumStatusButton } from '../components/PremiumStatusButton';
import { TopBar } from '../components/TopBar';

export function MapPage({ onUpgrade, onToast }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPoiId, setSelectedPoiId] = useState(searchParams.get('poi'));
  const [pois, setPois] = useState(visitorPois);
  const [searchQuery, setSearchQuery] = useState('');
  const enteredGeofences = useRef(new Set());
  const announcedQrPoi = useRef(null);
  const position = useLocationStore((state) => state.position);
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const useDemoLocation = useLocationStore((state) => state.useDemoLocation);
  const isFakeMode = useLocationStore((state) => state.isFakeMode);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const canAutoPlay = useAudioStore((state) => state.canAutoPlay);
  const enqueuePoi = useAudioStore((state) => state.enqueuePoi);
  const getLanguageMeta = useLanguageStore((state) => state.getLanguageMeta);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const enrichedPois = useMemo(() => {
    const localizedPois = pois.map((poi) => localizePoi(poi, currentLanguage));
    if (!position) {
      return localizedPois.map((poi) => ({
        ...poi,
        distanceLabel: poi.distanceHint,
        isInsideRadius: false
      }));
    }

    return enrichPoisWithDistance(localizedPois, position, currentLanguage);
  }, [currentLanguage, pois, position]);

  const visiblePois = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('vi');
    if (!normalizedQuery) return enrichedPois;
    return enrichedPois.filter((poi) =>
      [poi.title, poi.zoneName, poi.category].some((value) => value?.toLocaleLowerCase('vi').includes(normalizedQuery))
    );
  }, [enrichedPois, searchQuery]);

  const selectedPoi = useMemo(
    () => enrichedPois.find((poi) => poi.id === selectedPoiId) ?? null,
    [enrichedPois, selectedPoiId]
  );

  const activeAutoPoi = useMemo(() => enrichedPois.find((poi) => poi.isInsideRadius) ?? null, [enrichedPois]);

  useEffect(() => {
    let active = true;
    poiService.getAll().then((response) => {
      if (!active) return;
      const apiPois = response.data?.data ?? [];
      setPois((currentPois) => currentPois.map((localPoi) => {
        const apiPoi = apiPois.find((candidate) => Number(candidate.id) === localPoi.apiId);
        if (!apiPoi) return localPoi;
        return {
          ...localPoi,
          title: apiPoi.name ?? localPoi.title,
          description: apiPoi.description ?? localPoi.description,
          latitude: Number(apiPoi.latitude),
          longitude: Number(apiPoi.longitude),
          activationRadius: apiPoi.activationRadius ?? localPoi.activationRadius,
          isPremiumPoi: apiPoi.isPremium ?? localPoi.isPremiumPoi
        };
      }));
    }).catch(() => {
      // Static prototype POIs are the offline fallback.
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const poiId = searchParams.get('poi');
    setSelectedPoiId(poiId);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedPoi?.apiId) return;
    poiService.getContents(selectedPoi.apiId).then((response) => {
      const contents = response.data?.data ?? [];
      if (contents.length === 0) return;
      setPois((currentPois) => currentPois.map((poi) => {
        if (poi.apiId !== selectedPoi.apiId) return poi;
        const narration = { ...poi.narration };
        contents.forEach((content) => {
          if (content.ttsScript) narration[content.languageCode] = content.ttsScript;
        });
        return { ...poi, narration };
      }));
    }).catch(() => {
      // Keep bundled multilingual content when the API is offline.
    });
  }, [selectedPoi?.apiId]);

  useEffect(() => {
    const currentInside = new Set(enrichedPois.filter((poi) => poi.isInsideRadius).map((poi) => poi.id));
    enrichedPois.forEach((poi) => {
      if (poi.isInsideRadius && !enteredGeofences.current.has(poi.id)) {
        visitorTrackingService.trackVisit(poi, position, poi.distanceMeters);
      }
    });
    enteredGeofences.current = currentInside;
  }, [enrichedPois, position]);

  useEffect(() => {
    if (searchParams.get('source') !== 'qr' || !selectedPoi || announcedQrPoi.current === selectedPoi.id) return;
    announcedQrPoi.current = selectedPoi.id;
    visitorTrackingService.trackQrScan(selectedPoi);
    onToast(t('qrOpened', { name: selectedPoi.title }));
  }, [onToast, searchParams, selectedPoi]);

  useEffect(() => {
    const needsPremium = activeAutoPoi?.isPremiumPoi && !isPremium;
    if (!activeAutoPoi || needsPremium || !canAutoPlay(activeAutoPoi.id)) {
      return;
    }

    enqueuePoi(activeAutoPoi, getLanguageMeta());
    setSelectedPoiId(activeAutoPoi.id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('poi', activeAutoPoi.id);
    setSearchParams(nextParams, { replace: true });
    onToast(t('nearPoi', { name: activeAutoPoi.title }));
  }, [activeAutoPoi, canAutoPlay, currentLanguage, getLanguageMeta, isPremium, onToast, enqueuePoi, setSearchParams]);

  function handleSelectPoi(poi) {
    setSelectedPoiId(poi.id);
    setSearchParams({ poi: poi.id });
  }

  async function handleLocate() {
    const allowed = await requestLocation();
    if (allowed) {
      onToast(t('locationUpdated'));
      return;
    }

    onToast(t('locationFailed'));
  }

  function handleDemoLocation() {
    useDemoLocation();
    onToast(t('demoGpsEnabled'));
  }

  return (
    <section className="relative h-full overflow-hidden bg-slate-100">
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
          className="grid h-12 w-12 place-items-center rounded-full bg-white text-teal-700 shadow-xl shadow-slate-900/10 transition duration-200 ease-out hover:bg-teal-50 active:scale-95"
          aria-label={t('openPremium')}
        >
          <QrCode size={21} />
        </button>
        <button
          type="button"
          onClick={handleLocate}
          className="grid h-12 w-12 place-items-center rounded-full bg-teal-700 text-white shadow-xl shadow-teal-900/25 transition duration-200 ease-out hover:bg-teal-800 active:scale-95"
          aria-label={t('relocate')}
        >
          <Crosshair size={21} />
        </button>
      </div>

      {(isFakeMode || searchParams.get('debug') === 'gps') && <DevGpsPanel onToast={onToast} />}

      <AnimatePresence>
        {!position && (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute left-4 right-4 top-[150px] z-[1200] rounded-3xl border border-white/80 bg-white/90 p-4 text-center shadow-xl shadow-slate-900/10 backdrop-blur-2xl"
          >
            <SatelliteDish className="mx-auto text-orange-500" size={30} />
            <h2 className="mt-2 text-base font-black text-slate-950">{t('locating')}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {t('locatingHelp')}
            </p>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                onClick={handleLocate}
                disabled={permissionStatus === 'requesting'}
                className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition duration-200 ease-out hover:bg-orange-600 active:scale-95 disabled:opacity-70"
              >
                {permissionStatus === 'requesting' ? t('gettingGps') : t('enableGps')}
              </button>
              <button type="button" onClick={handleDemoLocation} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600">
                {t('demo')}
              </button>
            </div>
          </motion.article>
        )}
      </AnimatePresence>

      <section className="absolute bottom-[86px] left-0 right-0 z-[1100] max-h-[38%] rounded-t-[2rem] border-t border-white/80 bg-white/95 px-4 pb-4 pt-3 shadow-2xl shadow-slate-900/20 backdrop-blur-2xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <label className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-semibold text-slate-500">
          <Search size={17} />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <div className="mt-3 grid max-h-[calc(38svh-112px)] gap-2 overflow-y-auto hide-scrollbar">
          {visiblePois.map((poi) => (
            <button
              key={poi.id}
              type="button"
              onClick={() => handleSelectPoi(poi)}
              className="grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-3xl bg-slate-50 p-2 text-left transition duration-200 ease-out hover:bg-slate-100 active:scale-[0.99]"
            >
              <img className="h-14 w-14 rounded-2xl object-cover" src={poi.image} alt={poi.title} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">{poi.title}</span>
                <span className="mt-1 block text-xs font-bold text-premium-600">{poi.distanceLabel}</span>
              </span>
              <span className={poi.isInsideRadius ? 'h-3 w-3 rounded-full bg-premium-500 shadow-lg shadow-premium-500/40' : 'h-3 w-3 rounded-full bg-slate-300'} />
            </button>
          ))}
          {visiblePois.length === 0 && (
            <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-500">{t('noPoi')}</p>
          )}
        </div>
      </section>

      <BottomNav />
      <PoiBottomSheet poi={selectedPoi} onClose={() => setSearchParams({})} onUpgrade={onUpgrade} onToast={onToast} />
    </section>
  );
}
