import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { poiService } from '../../poi/services/poiService';
import { useAudioStore } from '../stores/audioStore';
import { useLanguageStore } from '../../../stores/languageStore';
import { useLocationStore } from '../stores/locationStore';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';
import { visitorTrackingService } from '../services/visitorTrackingService';
import { enrichPoisWithDistance, getDistanceMeters } from '../../../utils/geo';
import { localizePoi } from '../../../data/visitorPois';
import { resolveBackendMediaUrl } from '../../../utils/mediaUrl';
import { clearPresenceZone, setPresenceZone, subscribeRealtime } from '../../../services/realtimeClient';

/**
 * [UC08] View Nearby POI & Audio Playback - Custom Hook.
 * Manages geolocation updates, geofence bounds checks, multilingual narration audio queuing,
 * and visits tracking.
 */
export function useGeofenceAudio({ onToast }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'landing' });
  const { t: tRoot } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const presenceZone = searchParams.get('zone') ?? localStorage.getItem('locked_zone') ?? '';
  const [selectedPoiId, setSelectedPoiId] = useState(searchParams.get('poi'));
  const [pois, setPois] = useState([]);
  const [realtimeRevision, setRealtimeRevision] = useState(0);
  const [selectedStall, setSelectedStall] = useState(null);

  useEffect(() => {
    if (!presenceZone) return undefined;
    void setPresenceZone(presenceZone).catch((error) => {
      console.warn('Zone presence registration failed.', error);
    });
    return () => {
      void clearPresenceZone();
    };
  }, [presenceZone]);
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
    const filteredPois = pois.filter((poi) =>
      String(poi.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' &&
      ['APPROVED', 'ACTIVE', '1'].includes(
        String(poi.approvalStatus ?? 'APPROVED').toUpperCase()
      )
    );
    const localizedPois = filteredPois.map((poi) => localizePoi(poi, currentLanguage));
    if (!position) {
      return localizedPois.map((poi) => ({ ...poi, distanceLabel: poi.distanceHint, isInsideRadius: false }));
    }
    
    // Đề xuất: Lọc POI theo Zone để tránh tính Haversine quá nhiều
    const currentZone = searchParams.get('zone') ?? localStorage.getItem('locked_zone');
    let poisToCalculate = localizedPois;
    let otherPois = [];

    if (currentZone) {
      const isCurrentZone = (p) => 
        String(p.zoneCode).toLowerCase() === String(currentZone).toLowerCase() || 
        String(p.tourSlug).toLowerCase() === String(currentZone).toLowerCase() || 
        String(p.tourId) === String(currentZone);

      poisToCalculate = localizedPois.filter(isCurrentZone);
      otherPois = localizedPois
        .filter(p => !isCurrentZone(p))
        .map(poi => ({ ...poi, distanceLabel: poi.distanceHint, isInsideRadius: false }));
      
      // Fallback nếu không có POI nào thuộc currentZone thì tính hết
      if (poisToCalculate.length === 0) {
        poisToCalculate = localizedPois;
        otherPois = [];
      }
    }

    const calculatedPois = enrichPoisWithDistance(poisToCalculate, position, currentLanguage);
    return [...calculatedPois, ...otherPois];
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
  const activeAutoPoi = useMemo(() => {
    const insidePois = enrichedPois.filter((poi) => {
      const activeRadius = poi.isPremiumPoi ? 10.0 : 3.0;
      return poi.distanceMeters <= activeRadius;
    });
    if (insidePois.length === 0) return null;
    const sorted = [...insidePois].sort((a, b) => {
      const priorityA = a.isPremiumPoi ? 1 : 0;
      const priorityB = b.isPremiumPoi ? 1 : 0;
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }
      return a.distanceMeters - b.distanceMeters;
    });
    return sorted[0];
  }, [enrichedPois]);

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

  // Resolve the scanned zone and load its relational POIs from the live API.
  useEffect(
    () => subscribeRealtime('StallStatusUpdated', (_stallId, status) => {
      if (String(status).toUpperCase() === 'APPROVED') {
        setRealtimeRevision((revision) => revision + 1);
      }
    }),
    []
  );

  useEffect(() => {
    let active = true;
    const queryParams = new URLSearchParams(window.location.search);
    const zoneToken = queryParams.get('zone');

    const mapApiPois = (apiPois) =>
      apiPois
        .map((apiPoi) => {
        const latitude = Number.parseFloat(apiPoi.latitude ?? apiPoi.lat);
        const longitude = Number.parseFloat(apiPoi.longitude ?? apiPoi.lng ?? apiPoi.long);
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude === 0 ||
          longitude === 0 ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) return null;
        const apiId = Number(apiPoi.id);
        const description = apiPoi.description ?? '';
        const displayName = apiPoi.stallName ?? apiPoi.name ?? apiPoi.title ?? '';
        const coverUrl = apiPoi.coverUrl ?? apiPoi.coverImageUrl ?? apiPoi.imageUrl ?? '';
        const translatedNames = {
          en: apiPoi.stallName_EN ?? apiPoi.stallNameEn ?? '',
          ja: apiPoi.stallName_JA ?? apiPoi.stallNameJa ?? '',
          ko: apiPoi.stallName_KO ?? apiPoi.stallNameKo ?? '',
          zh: apiPoi.stallName_ZH ?? apiPoi.stallNameZh ?? ''
        };
        const translatedDescriptions = {
          en: apiPoi.description_EN ?? apiPoi.descriptionEn ?? '',
          ja: apiPoi.description_JA ?? apiPoi.descriptionJa ?? '',
          ko: apiPoi.description_KO ?? apiPoi.descriptionKo ?? '',
          zh: apiPoi.description_ZH ?? apiPoi.descriptionZh ?? ''
        };
        const approvalStatus = apiPoi.approvalStatus === 1
          ? 'APPROVED'
          : String(apiPoi.approvalStatus ?? 'APPROVED').toUpperCase();
        return {
          id: apiPoi.slug ?? String(apiPoi.id),
          apiId,
          backendId: String(apiPoi.id),
          stallId: apiPoi.stallId == null ? null : String(apiPoi.stallId),
          name: apiPoi.name ?? displayName,
          title: displayName,
          stallName: displayName,
          stallName_EN: translatedNames.en,
          stallName_JA: translatedNames.ja,
          stallName_KO: translatedNames.ko,
          stallName_ZH: translatedNames.zh,
          description_EN: translatedDescriptions.en,
          description_JA: translatedDescriptions.ja,
          description_KO: translatedDescriptions.ko,
          description_ZH: translatedDescriptions.zh,
          titles: { vi: displayName, ...translatedNames },
          zoneName: apiPoi.zoneName ?? '',
          category: apiPoi.category ?? '',
          coverUrl,
          imageUrl: coverUrl,
          image: resolveBackendMediaUrl(coverUrl),
          description,
          descriptions: { vi: description, ...translatedDescriptions },
          narration: { [currentLanguage]: apiPoi.ttsScript ?? description },
          latitude,
          longitude,
          activationRadius: Number(apiPoi.activationRadius) || 30,
          isPremiumPoi: Boolean(apiPoi.isPremium ?? apiPoi.isPremiumContent),
          qrCodeId: apiPoi.qrCodeId ?? apiId,
          products: Array.isArray(apiPoi.products) ? apiPoi.products : [],
          audioUrl: apiPoi.audioUrl ?? apiPoi.audioFileUrl ?? null,
          tourSlug: apiPoi.tourSlug ?? null,
          tourId: apiPoi.tourId ? String(apiPoi.tourId) : null,
          zoneCode: apiPoi.zoneCode ?? null,
          stallName: apiPoi.stallName ?? apiPoi.name ?? null,
          status: String(apiPoi.status ?? 'ACTIVE').toUpperCase(),
          approvalStatus
        };
      })
      .filter(Boolean);

    if (!zoneToken) {
      poiService.getAll()
        .then((response) => {
          if (!active) return;
          const apiPois = response.data?.data ?? [];
          setSelectedStall(null);
          setPois(mapApiPois(apiPois));
        })
        .catch(() => {
          if (active) setPois([]);
        });
    } else {
      poiService.resolveGuestZone(zoneToken, i18n.language)
        .then((response) => {
          if (!active) return;
          if (import.meta.env.DEV) {
            console.log('👉 USER MAP API DATA INTERCEPT:', response.data);
          }
          const zonePayload = response.data?.data ?? response.data;
          const extractedPois =
            zonePayload?.pois ||
            zonePayload?.stalls ||
            zonePayload?.poiList ||
            [];
          setSelectedStall(zonePayload?.stall ?? null);
          setPois(mapApiPois(Array.isArray(extractedPois) ? extractedPois : []));
        })
        .catch(() => {
          if (!active) return;
          setSelectedStall(null);
          setPois([]);
        });
    }

    return () => {
      active = false;
    };
  }, [searchParams, i18n.language, realtimeRevision]);

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

  // Đề xuất 1: Giảm độ chính xác (enableHighAccuracy=false) khi cách khu vực > 10km
  const updateAccuracy = useLocationStore((state) => state.updateAccuracy);
  useEffect(() => {
    if (position && zoneCenter) {
      const distance = getDistanceMeters(position, zoneCenter);
      if (typeof updateAccuracy === 'function') {
        updateAccuracy(distance < 10000);
      }
    }
  }, [position, zoneCenter, updateAccuracy]);

  // Load POI language files/narration TTS scripts
  useEffect(() => {
    if (!selectedPoi?.apiId) return;
    poiService.getContents(selectedPoi.apiId).then((response) => {
      const contents = response.data?.data ?? [];
      if (contents.length === 0) return;
      setPois((currentPois) => currentPois.map((poi) => {
        if (poi.apiId !== selectedPoi.apiId) return poi;
        const narration = { ...poi.narration };
        let audioUrl = poi.audioUrl;
        contents.forEach((content) => {
          if (content.ttsScript) narration[content.languageCode] = content.ttsScript;
          if (
            content.languageCode === currentLanguage &&
            (content.audioFileUrl || content.audioUrl)
          ) {
            audioUrl = content.audioFileUrl ?? content.audioUrl;
          }
        });
        return { ...poi, narration, audioUrl };
      }));
    }).catch(() => {
      // Ignore content errors, fallback to default narration
    });
  }, [currentLanguage, selectedPoi?.apiId]);

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
    const premiumState = usePremiumStore.getState();
    if (
      !activeAutoPoi ||
      !premiumState.canListen(activeAutoPoi.backendId ?? activeAutoPoi.id) ||
      !canAutoPlay(activeAutoPoi.id)
    ) return;

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
    onToast?.(t('gps_failed', { defaultValue: 'Không thể lấy vị trí GPS từ thiết bị.' }));
  }

  // Helper to parse both structured routing payloads and raw OSRM payloads safely
  function parseRouteResponse(payload) {
    const data = payload?.data ?? payload;
    if (!data) return null;

    let distance = 0;
    let duration = 0;
    let leafletCoords = [];

    // Shape 1: Standard structured response containing coordinates array
    if (data.coordinates && Array.isArray(data.coordinates)) {
      distance = data.distance ?? 0;
      duration = data.duration ?? 0;
      
      leafletCoords = data.coordinates
        .map(point => {
          if (!point) return null;
          if (Array.isArray(point)) {
            if (point.length >= 2) {
              return [Number(point[0]), Number(point[1])];
            }
            return null;
          }
          if (point.lat !== undefined && point.lng !== undefined) {
            return [Number(point.lat), Number(point.lng)];
          }
          if (point.latitude !== undefined && point.longitude !== undefined) {
            return [Number(point.latitude), Number(point.longitude)];
          }
          return null;
        })
        .filter(p => p !== null && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    }
    // Shape 2: Raw OSRM response containing routes array
    else if (data.routes && Array.isArray(data.routes) && data.routes.length > 0) {
      const route = data.routes[0];
      distance = route.distance ?? 0;
      duration = route.duration ?? 0;
      if (route.geometry && Array.isArray(route.geometry.coordinates)) {
        leafletCoords = route.geometry.coordinates
          .map(coord => {
            if (Array.isArray(coord) && coord.length >= 2) {
              // OSRM is [lng, lat], Leaflet is [lat, lng]
              return [Number(coord[1]), Number(coord[0])];
            }
            return null;
          })
          .filter(p => p !== null && Number.isFinite(p[0]) && Number.isFinite(p[1]));
      }
    }

    if (leafletCoords.length === 0) return null;

    return { distance, duration, coordinates: leafletCoords };
  }

  async function handleGetDirections(targetPoi) {
    if (!position) {
      onToast?.(tRoot('routing.enable_gps', { defaultValue: 'Vui lòng bật GPS để tìm đường.' }));
      return;
    }
    if (!targetPoi) return;

    try {
      setRoutingInfo({ status: 'calculating' });
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(
        `${apiBase}/guest/routing?startLng=${position.lng}&startLat=${position.lat}&endLng=${targetPoi.longitude}&endLat=${targetPoi.latitude}`
      );
      if (!response.ok) throw new Error('Routing API error');
      const resJson = await response.json();
      
      const parsed = parseRouteResponse(resJson);
      if (!parsed) {
        throw new Error('Failed to parse route coordinates');
      }

      setRoutingCoordinates(parsed.coordinates);
      setRoutingInfo({
        distance: parsed.distance,
        duration: parsed.duration,
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
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(
        `${apiBase}/guest/routing?startLng=${currentPosition.lng}&startLat=${currentPosition.lat}&endLng=${targetPoi.longitude}&endLat=${targetPoi.latitude}`
      );
      if (!response.ok) throw new Error('Routing API error');
      const resJson = await response.json();

      const parsed = parseRouteResponse(resJson);
      if (!parsed) {
        throw new Error('Failed to parse route coordinates');
      }

      setRoutingCoordinates(parsed.coordinates);
      setRoutingInfo({
        distance: parsed.distance,
        duration: parsed.duration,
        status: 'success'
      });
      lastRoutedPositionRef.current = { lat: currentPosition.lat, lng: currentPosition.lng };
    } catch (err) {
      console.error('Recalculate route error:', err);
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
