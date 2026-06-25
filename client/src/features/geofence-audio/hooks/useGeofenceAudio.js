import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { poiService } from '../../poi/services/poiService';
import { stallService } from '../../vendor-wallet/services/stallService';
import { useAudioStore } from '../stores/audioStore';
import { useLanguageStore } from '../../../stores/languageStore';
import { useLocationStore } from '../stores/locationStore';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';
import { visitorTrackingService } from '../services/visitorTrackingService';
import { enrichPoisWithDistance } from '../../../utils/geo';
import { visitorPois, localizePoi } from '../../../data/visitorPois';

/**
 * [UC08] View Nearby POI & Audio Playback - Custom Hook.
 * Manages geolocation updates, geofence bounds checks, multilingual narration audio queuing,
 * and visits tracking.
 */
export function useGeofenceAudio({ onToast }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'landing' });
  const { t: tRoot } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPoiId, setSelectedPoiId] = useState(searchParams.get('poi'));
  const [pois, setPois] = useState(visitorPois);
  const [searchQuery, setSearchQuery] = useState('');
  const [routingCoordinates, setRoutingCoordinates] = useState([]);
  const [routingInfo, setRoutingInfo] = useState(null);
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
    const tourSlug = searchParams.get('zone');
    let filteredPois = pois;
    if (tourSlug) {
      filteredPois = pois.filter((poi) => poi.tourSlug === tourSlug);
    }
    const localizedPois = filteredPois.map((poi) => localizePoi(poi, currentLanguage));
    if (!position) {
      return localizedPois.map((poi) => ({ ...poi, distanceLabel: poi.distanceHint, isInsideRadius: false }));
    }
    return enrichPoisWithDistance(localizedPois, position, currentLanguage);
  }, [currentLanguage, pois, position, searchParams]);

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

  // Sync selectedPoiId with URL search params changes
  useEffect(() => {
    const urlPoi = searchParams.get('poi');
    if (urlPoi !== selectedPoiId) {
      setSelectedPoiId(urlPoi);
    }
  }, [searchParams, selectedPoiId]);

  // Handle locked zone synchronization and scan logging
  useEffect(() => {
    const zoneParam = searchParams.get('zone');
    if (zoneParam) {
      const lockedZone = localStorage.getItem('locked_zone');
      const lastScanned = sessionStorage.getItem('last_scanned_zone');

      if (zoneParam !== lockedZone || zoneParam !== lastScanned) {
        localStorage.setItem('locked_zone', zoneParam);
        sessionStorage.setItem('last_scanned_zone', zoneParam);

        // Record scan event in backend (resolves and saves to qr_scan_events)
        stallService.resolveCode(zoneParam, i18n.language).catch(() => {
          // Ignore background resolution/analytics errors
        });
      }
    } else {
      // If zone param is missing in URL but we are locked, restore it
      const lockedZone = localStorage.getItem('locked_zone');
      if (lockedZone) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('zone', lockedZone);
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  // Load POIs from backend, merge with local data fallback
  useEffect(() => {
    let active = true;
    const zoneCode = searchParams.get('zone');

    const fetchPromise = zoneCode
      ? poiService.getGuestPois(zoneCode, i18n.language)
      : poiService.getAll();

    fetchPromise.then((response) => {
      if (!active) return;
      const apiPois = response.data?.data ?? [];
      if (apiPois.length === 0) return;
      const demoTarget = apiPois.find((poi) => poi.slug === selectedPoiId) ?? apiPois[0];
      if (isFakeMode && demoTarget) {
        simulateNearPoi({
          latitude: Number(demoTarget.latitude),
          longitude: Number(demoTarget.longitude),
        });
      }
      setPois((currentPois) => apiPois.map((apiPoi) => {
        const apiId = Number(apiPoi.id);
        const localPoi = currentPois.find((candidate) => candidate.apiId === apiId);
        const fallback = localPoi ?? currentPois[0] ?? visitorPois[0];
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
          qrCodeId: apiPoi.qrCodeId ?? localPoi?.qrCodeId ?? apiId,
          tourSlug: apiPoi.tourSlug ?? null,
          tourId: apiPoi.tourId ? String(apiPoi.tourId) : null,
          zone_code: apiPoi.zone_code ?? null
        };
      }));
    }).catch(() => {
      // Ignore API errors, fallback is active
    });
    return () => {
      active = false;
    };
  }, [isFakeMode, simulateNearPoi, searchParams, i18n.language]);

  const zoneCenter = useMemo(() => {
    const zoneCode = searchParams.get('zone');
    if (!zoneCode || pois.length === 0) return null;

    let latSum = 0;
    let lngSum = 0;
    let count = 0;
    pois.forEach((p) => {
      if (Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) {
        latSum += p.latitude;
        lngSum += p.longitude;
        count++;
      }
    });
    if (count > 0) {
      return { lat: latSum / count, lng: lngSum / count };
    }
    return null;
  }, [pois, searchParams]);

  // Load POI language files/narration TTS scripts
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
      // Ignore content errors, fallback to default narration
    });
  }, [selectedPoi?.apiId]);

  // Geofence Entry visit tracking
  useEffect(() => {
    const currentInside = new Set(enrichedPois.filter((poi) => poi.isInsideRadius).map((poi) => poi.id));
    enrichedPois.forEach((poi) => {
      if (poi.isInsideRadius && !enteredGeofences.current.has(poi.id)) {
        visitorTrackingService.trackVisit(poi, position, poi.distanceMeters);
      }
    });
    enteredGeofences.current = currentInside;
  }, [enrichedPois, position]);

  // [UC38] QR Scanner Deep link tracking
  useEffect(() => {
    if (searchParams.get('source') !== 'qr' || !selectedPoi || announcedQrPoi.current === selectedPoi.id) return;
    announcedQrPoi.current = selectedPoi.id;
    visitorTrackingService.trackQrScan(selectedPoi);
    onToast?.(t('qrOpened', { name: selectedPoi.title }));
  }, [currentLanguage, onToast, searchParams, selectedPoi]);

  // Geofence automatic audio playback trigger
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
    setRoutingCoordinates([]);
    setRoutingInfo(null);
  }

  function handleClosePoi() {
    setSelectedPoiId(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('poi');
    setSearchParams(nextParams);
    setRoutingCoordinates([]);
    setRoutingInfo(null);
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

  async function handleGetDirections(targetPoi) {
    if (!position) {
      onToast?.(tRoot('routing.enable_gps', { defaultValue: 'Vui lòng bật GPS để tìm đường.' }));
      return;
    }
    if (!targetPoi) return;

    try {
      setRoutingInfo({ status: 'calculating' });
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/foot/${position.lng},${position.lat};${targetPoi.longitude},${targetPoi.latitude}?overview=full&geometries=geojson`
      );
      if (!response.ok) throw new Error('OSRM API error');
      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const leafletCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      setRoutingCoordinates(leafletCoords);
      setRoutingInfo({
        distance: route.distance,
        duration: route.duration,
        status: 'success'
      });
    } catch (err) {
      console.error('OSRM Routing error:', err);
      setRoutingInfo({ status: 'error' });
      onToast?.(tRoot('routing.error', { defaultValue: 'Không thể tìm đường.' }));
    }
  }

  return {
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
    handleClosePoi,
    handleLocate,
    routingCoordinates,
    setRoutingCoordinates,
    routingInfo,
    setRoutingInfo,
    handleGetDirections,
    zoneCenter
  };
}
