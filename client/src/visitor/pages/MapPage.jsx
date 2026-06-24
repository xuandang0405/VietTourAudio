import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { localizePoi, visitorPois } from '../../data/visitorPois';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useTranslation } from 'react-i18next';
import { poiService } from '../../services/poiService';
import { visitorTrackingService } from '../../services/visitorTrackingService';
import { useAudioStore } from '../../stores/audioStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { enrichPoisWithDistance } from '../../utils/geo';
import { MobileLayout } from '../layouts/MobileLayout';
import { PCLayout } from '../layouts/PCLayout';
import { TabletLayout } from '../layouts/TabletLayout';

export function MapPage({ onUpgrade, onToast }) {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const breakpoint = useBreakpoint();
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
  const simulateNearPoi = useLocationStore((state) => state.simulateNearPoi);
  const isFakeMode = useLocationStore((state) => state.isFakeMode);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const canAutoPlay = useAudioStore((state) => state.canAutoPlay);
  const enqueuePoi = useAudioStore((state) => state.enqueuePoi);
  const getLanguageMeta = useLanguageStore((state) => state.getLanguageMeta);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const enrichedPois = useMemo(() => {
    const localizedPois = pois.map((poi) => localizePoi(poi, currentLanguage));
    if (!position) {
      return localizedPois.map((poi) => ({ ...poi, distanceLabel: poi.distanceHint, isInsideRadius: false }));
    }
    return enrichPoisWithDistance(localizedPois, position, currentLanguage);
  }, [currentLanguage, pois, position]);

  const visiblePois = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase(currentLanguage);
    if (!normalizedQuery) return enrichedPois;
    return enrichedPois.filter((poi) =>
      [poi.title, poi.zoneName, poi.category].some((value) => value?.toLocaleLowerCase(currentLanguage).includes(normalizedQuery))
    );
  }, [currentLanguage, enrichedPois, searchQuery]);

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
      if (apiPois.length === 0) return;
      const demoTarget = apiPois.find((poi) => poi.slug === selectedPoiId) ?? apiPois[0];
      if (isFakeMode && demoTarget) {
        simulateNearPoi({
          latitude: Number(demoTarget.latitude),
          longitude: Number(demoTarget.longitude)
        });
      }
      setPois((currentPois) => apiPois.map((apiPoi) => {
        const apiId = Number(apiPoi.id);
        const localPoi = currentPois.find((candidate) => candidate.apiId === apiId);
        const fallback = localPoi ?? currentPois[0];
        const description = apiPoi.description ?? fallback.description;
        return {
          ...fallback,
          id: apiPoi.slug ?? String(apiPoi.id),
          apiId,
          stallId: Number(apiPoi.stallId),
          title: apiPoi.name ?? fallback.title,
          zoneName: apiPoi.zoneName ?? fallback.zoneName,
          category: apiPoi.category ?? fallback.category,
          image: apiPoi.imageUrl ?? fallback.image,
          description,
          descriptions: localPoi?.descriptions ?? { vi: description },
          narration: localPoi?.narration ?? { vi: description },
          latitude: Number(apiPoi.latitude),
          longitude: Number(apiPoi.longitude),
          activationRadius: apiPoi.activationRadius ?? fallback.activationRadius,
          isPremiumPoi: apiPoi.isPremium ?? fallback.isPremiumPoi,
          qrCodeId: apiPoi.qrCodeId ?? localPoi?.qrCodeId ?? apiId
        };
      }));
    }).catch(() => {
      // Bundled POIs remain available when the API is offline.
    });
    return () => {
      active = false;
    };
  }, [isFakeMode, simulateNearPoi]);

  useEffect(() => {
    setSelectedPoiId(searchParams.get('poi'));
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
      // Bundled multilingual content remains the fallback.
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
    onToast?.(t('qrOpened', { name: selectedPoi.title }));
  }, [currentLanguage, onToast, searchParams, selectedPoi]);

  useEffect(() => {
    const needsPremium = activeAutoPoi?.isPremiumPoi && !isPremium;
    const premiumState = usePremiumStore.getState();
    if (!activeAutoPoi || needsPremium || !premiumState.canListen() || !canAutoPlay(activeAutoPoi.id)) return;

    enqueuePoi(activeAutoPoi, getLanguageMeta());
    setSelectedPoiId(activeAutoPoi.id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('poi', activeAutoPoi.id);
    setSearchParams(nextParams, { replace: true });
    onToast?.(t('auto_play_started', { name: activeAutoPoi.title }));
  }, [activeAutoPoi, canAutoPlay, currentLanguage, enqueuePoi, getLanguageMeta, isPremium, onToast, searchParams, setSearchParams]);

  function handleSelectPoi(poi) {
    if (!poi?.id) return;
    setSelectedPoiId(poi.id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('poi', poi.id);
    setSearchParams(nextParams);
  }

  async function handleLocate() {
    const allowed = await requestLocation();
    if (allowed) {
      onToast?.(t('locationUpdated'));
      return;
    }
    useDemoLocation();
    onToast?.(t('demoGpsEnabled'));
  }

  const layoutProps = {
    searchParams,
    setSearchParams,
    selectedPoi,
    enrichedPois,
    visiblePois,
    searchQuery,
    setSearchQuery,
    position,
    permissionStatus,
    isFakeMode,
    handleSelectPoi,
    handleLocate,
    onUpgrade,
    onToast
  };

  if (breakpoint === 'pc') return <PCLayout {...layoutProps} />;
  if (breakpoint === 'tablet') return <TabletLayout {...layoutProps} />;
  return <MobileLayout {...layoutProps} />;
}
