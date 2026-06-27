import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { appConfig } from '../../../config/appConfig';
import { poiService } from '../../poi/services/poiService';
import { stallService } from '../../vendor-wallet/services/stallService';
import { useAudioStore } from '../stores/audioStore';
import { useLanguageStore } from '../../../stores/languageStore';
import { useLocationStore } from '../stores/locationStore';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';
import { visitorTrackingService } from '../services/visitorTrackingService';
import { enrichPoisWithDistance, getDistanceMeters } from '../../../utils/geo';
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
  const [selectedStall, setSelectedStall] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [routingCoordinates, setRoutingCoordinates] = useState([]);
  const [routingInfo, setRoutingInfo] = useState(null);
  const enteredGeofences = useRef(new Set());
  const announcedQrPoi = useRef(null);
  const lastRoutedPositionRef = useRef(null);
  const hasArrivedRef = useRef(false);

  const position = useLocationStore((state) => state.position);
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const useDemoLocation = useLocationStore((state) => state.useDemoLocation);
  const simulateNearPoi = useLocationStore((state) => state.simulateNearPoi);
  const isFakeMode = useLocationStore((state) => state.isFakeMode);

  const navigationTargetPoi = useLocationStore((state) => state.navigationTargetPoi);

  useEffect(() => {
    if (!navigationTargetPoi) {
      setRoutingCoordinates([]);
      setRoutingInfo(null);
      lastRoutedPositionRef.current = null;
      hasArrivedRef.current = false;
    }
  }, [navigationTargetPoi]);

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

  const activePoiFromStore = useLocationStore((state) => state.activePoi);
  const [currentPoi, setCurrentPoi] = useState(null);

  useEffect(() => {
    if (!selectedPoiId) {
      setCurrentPoi(null);
      return;
    }
    const found = enrichedPois.find(
      (poi) =>
        poi.slug === selectedPoiId ||
        String(poi.id) === String(selectedPoiId) ||
        String(poi.apiId) === String(selectedPoiId)
    );
    if (found) {
      setCurrentPoi(found);
      const activePoiState = useLocationStore.getState().activePoi;
      if (!activePoiState || String(activePoiState.id) !== String(found.id)) {
        useLocationStore.getState().selectAndFocusPoi(found);
      }
    } else {
      const foundInRaw = pois.find(
        (poi) =>
          poi.slug === selectedPoiId ||
          String(poi.id) === String(selectedPoiId) ||
          String(poi.apiId) === String(selectedPoiId)
      );
      if (foundInRaw) {
        const localized = localizePoi(foundInRaw, currentLanguage);
        setCurrentPoi(localized);
        const activePoiState = useLocationStore.getState().activePoi;
        if (!activePoiState || String(activePoiState.id) !== String(localized.id)) {
          useLocationStore.getState().selectAndFocusPoi(localized);
        }
      }
    }
  }, [selectedPoiId, enrichedPois, pois, currentLanguage]);

  const selectedPoi = currentPoi;
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

    const mapApiPois = (apiPois, currentPois) => {
      if (apiPois.length === 0) return currentPois;

      return apiPois.map((apiPoi) => {
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
          zone_code: apiPoi.zone_code ?? null,
          stall_name: apiPoi.stall_name ?? fallback.stall_name ?? null,
          stall_description: apiPoi.stall_description ?? fallback.stall_description ?? null
        };
      });
    };

    if (!zoneCode) {
      poiService.getAll()
        .then((response) => {
          if (!active) return;
          const apiPois = response.data?.data ?? [];
          setSelectedStall(null);
          setPois((currentPois) => mapApiPois(apiPois, currentPois));
        })
        .catch(() => {
          // Ignore API errors, fallback is active
        });
      return;
    }

    const needsResolution = /[A-Z]/;

    const isAlphanumeric = needsResolution.test(zoneCode) || zoneCode.includes('-ST-') || zoneCode.includes('-TOUR-');

    if (isAlphanumeric) {
      stallService.resolveCode(zoneCode, i18n.language)
        .then((res) => {
          if (!active) return;
          const data = res.data?.data ?? res.data;
          const resolvedSlug = data.stall?.slug ?? zoneCode.toLowerCase();
          const resolvedId = data.stall?.id;

          if (data.stall) {
            setSelectedStall(data.stall);
          } else {
            setSelectedStall(null);
          }

          // Sync URL search params and storage to the resolved lowercase slug
          if (resolvedSlug && resolvedSlug !== zoneCode) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('zone', resolvedSlug);
            setSearchParams(nextParams, { replace: true });
            localStorage.setItem('locked_zone', resolvedSlug);
            sessionStorage.setItem('last_scanned_zone', resolvedSlug);
          }

          // Fetch using the true numeric ID (or resolvedId)
          const targetFetchCode = resolvedId ? String(resolvedId) : resolvedSlug;
          poiService.getGuestPois(targetFetchCode, i18n.language)
            .then((response) => {
              if (!active) return;
              const apiPois = response.data?.data ?? [];
              if (apiPois.length > 0 && apiPois[0].stall_name) {
                setSelectedStall((prev) => prev ?? { name: apiPois[0].stall_name });
              }
              setPois((currentPois) => mapApiPois(apiPois, currentPois));
            })
            .catch(() => {});
        })
        .catch(() => {
          // Fallback if resolver fails
          poiService.getGuestPois(zoneCode, i18n.language)
            .then((response) => {
              if (!active) return;
              const apiPois = response.data?.data ?? [];
              if (apiPois.length > 0 && apiPois[0].stall_name) {
                setSelectedStall((prev) => prev ?? { name: apiPois[0].stall_name });
              }
              setPois((currentPois) => mapApiPois(apiPois, currentPois));
            })
            .catch(() => {});
        });
    } else {
      // Standard lowercase slug or direct numeric ID, fetch directly
      poiService.getGuestPois(zoneCode, i18n.language)
        .then((response) => {
          if (!active) return;
          const apiPois = response.data?.data ?? [];
          if (apiPois.length > 0 && apiPois[0].stall_name) {
            setSelectedStall({ name: apiPois[0].stall_name });
          } else {
            setSelectedStall(null);
          }
          setPois((currentPois) => mapApiPois(apiPois, currentPois));
        })
        .catch(() => {
          // Ignore API errors, fallback is active
        });
    }

    return () => {
      active = false;
    };
  }, [isFakeMode, simulateNearPoi, searchParams.get('zone'), i18n.language]);

  // Handle simulation mode GPS tracking safely in a controlled side effect
  useEffect(() => {
    if (isFakeMode && pois.length > 0) {
      const demoTarget = pois.find((poi) => poi.id === selectedPoiId) ?? pois[0];
      if (demoTarget) {
        simulateNearPoi({
          latitude: Number(demoTarget.latitude),
          longitude: Number(demoTarget.longitude),
        });
      }
    }
  }, [isFakeMode, pois, selectedPoiId, simulateNearPoi]);

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
    useLocationStore.getState().selectAndFocusPoi(poi);
    setSelectedPoiId(poi.id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('poi', poi.id);
    setSearchParams(nextParams);

    // Auto lock camera on selecting a POI
    useLocationStore.getState().setIsCameraLocked(true);

    const currentNavTarget = useLocationStore.getState().navigationTargetPoi;
    if (currentNavTarget && (String(currentNavTarget.id) === String(poi.id) || String(currentNavTarget.slug) === String(poi.slug))) {
      // Same target selected: do not trigger directions refetch, keep active route
      return;
    }

    // New target selected: set navigationTargetPoi and call directions API
    useLocationStore.getState().startNavigation(poi);
    handleGetDirections(poi);
  }

  function handleClosePoi() {
    // Only close information sheet, do NOT modify navigationTargetPoi or clear route polyline
    useLocationStore.setState({ activePoi: null, selectedStallId: null, isPoiSheetOpen: false });
    setSelectedPoiId(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('poi');
    setSearchParams(nextParams);
  }

  async function handleLocate() {
    const allowed = await requestLocation();
    if (allowed) {
      onToast?.(t('locationUpdated'));
      const setIsCameraLocked = useLocationStore.getState().setIsCameraLocked;
      if (typeof setIsCameraLocked === 'function') {
        setIsCameraLocked(true);
      }
      return;
    }
    useDemoLocation();
    onToast?.(t('demoGpsEnabled'));
    const setIsCameraLocked = useLocationStore.getState().setIsCameraLocked;
    if (typeof setIsCameraLocked === 'function') {
      setIsCameraLocked(true);
    }
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
        `${appConfig.guestApiBaseUrl}/routing?startLng=${position.lng}&startLat=${position.lat}&endLng=${targetPoi.longitude}&endLat=${targetPoi.latitude}`
      );
      if (!response.ok) throw new Error('Routing API error');
      const resJson = await response.json();
      const data = resJson.data ?? resJson;
      if (!data.routes || data.routes.length === 0) {
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
      lastRoutedPositionRef.current = { lat: position.lat, lng: position.lng };
      hasArrivedRef.current = false;
      // Sync with locationStore
      useLocationStore.getState().startNavigation(targetPoi);
    } catch (err) {
      console.error('Routing error:', err);
      setRoutingInfo({ status: 'error' });
      onToast?.(tRoot('routing.error', { defaultValue: 'Không thể tìm đường.' }));
    }
  }

  async function recalculateRoute(targetPoi, currentPosition) {
    if (!currentPosition || !targetPoi) return;
    try {
      const response = await fetch(
        `${appConfig.guestApiBaseUrl}/routing?startLng=${currentPosition.lng}&startLat=${currentPosition.lat}&endLng=${targetPoi.longitude}&endLat=${targetPoi.latitude}`
      );
      if (!response.ok) throw new Error('Routing API error');
      const resJson = await response.json();
      const data = resJson.data ?? resJson;
      if (!data.routes || data.routes.length === 0) {
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
      lastRoutedPositionRef.current = { lat: currentPosition.lat, lng: currentPosition.lng };
    } catch (err) {
      console.error('Background Routing error:', err);
    }
  }

  useEffect(() => {
    if (!selectedPoi || routingCoordinates.length === 0 || !position) {
      return;
    }

    const distanceToPoi = getDistanceMeters(position, {
      lat: selectedPoi.latitude,
      lng: selectedPoi.longitude
    });

    if (distanceToPoi <= 8 && !hasArrivedRef.current) {
      hasArrivedRef.current = true;
      onToast?.(tRoot('routing.arrived', { defaultValue: 'Đã đến điểm hẹn!' }));
    }
  }, [position, selectedPoi, routingCoordinates.length, onToast, tRoot]);

  return {
    searchParams,
    setSearchParams,
    selectedPoi,
    selectedStall,
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
