import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAudioStore } from '../stores/useAudioStore';
import { useZoneStore } from '../stores/useZoneStore';
import { checkGeofenceState } from '../services/geofencing';
import { trackAnalytics } from '../services/analytics';

export function useGeofencing({ sessionId, guestId, language }) {
  const zones = useZoneStore((s) => s.zones);
  const setCurrentLocation = useZoneStore((s) => s.setCurrentLocation);
  const setNearestZone = useZoneStore((s) => s.setNearestZone);
  const setActiveZone = useZoneStore((s) => s.setActiveZone);
  const autoPlay = useAudioStore((s) => s.autoPlay);
  const enqueue = useAudioStore((s) => s.enqueue);

  const watchRef = useRef(null);
  const stateRef = useRef({ insideMap: {}, lastCoords: null, lastAt: 0 });

  useEffect(() => {
    if (!navigator.geolocation || !zones.length) return undefined;

    watchRef.current = navigator.geolocation.watchPosition(async (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      };

      if (coords.accuracy > 80 && stateRef.current.lastCoords) return;

      const now = Date.now();
      if (stateRef.current.lastCoords) {
        const dLat = Math.abs(coords.lat - stateRef.current.lastCoords.lat);
        const dLng = Math.abs(coords.lng - stateRef.current.lastCoords.lng);
        const movedEnough = (dLat + dLng) > 0.00002;
        if (!movedEnough && now - stateRef.current.lastAt < 5000) return;
      }

      setCurrentLocation(coords);
      stateRef.current.lastCoords = coords;
      stateRef.current.lastAt = now;

      const next = checkGeofenceState(coords, zones, stateRef.current);
      stateRef.current.insideMap = next.insideMap;
      setNearestZone(next.nearestZone || null);

      for (const zone of next.entered) {
        setActiveZone(zone);
        await trackAnalytics({ sessionId, guestId, zoneId: zone.id, actionType: 'EnterZone', language, latitude: coords.lat, longitude: coords.lng });
        if (!autoPlay) continue;

        try {
          const { data } = await api.post('/geofence/check', {
            guestId,
            sessionId,
            lat: coords.lat,
            lng: coords.lng,
            accuracy: coords.accuracy,
            lang: language
          });
          if (data?.narration && !data?.cooldown) {
            enqueue({ zone, narration: data.narration });
          }
        } catch {
          // ignore network errors
        }
      }

      for (const zone of next.exited) {
        await trackAnalytics({ sessionId, guestId, zoneId: zone.id, actionType: 'ExitZone', language, latitude: coords.lat, longitude: coords.lng });
      }
    }, () => {}, { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [zones, setCurrentLocation, setNearestZone, setActiveZone, autoPlay, enqueue, sessionId, guestId, language]);
}
