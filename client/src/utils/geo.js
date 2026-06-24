const EARTH_RADIUS_METERS = 6371000;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(pointA, pointB) {
  if (!pointA || !pointB) {
    return Number.POSITIVE_INFINITY;
  }

  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);
  const deltaLat = toRadians(pointB.lat - pointA.lat);
  const deltaLng = toRadians(pointB.lng - pointA.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

import i18n from '../i18n';

export function formatDistance(meters, languageCode = 'vi') {
  if (!Number.isFinite(meters)) {
    return i18n.t('common.error', 'Chưa có GPS'); // fallback if needed
  }

  if (meters < 1000) {
    const value = `${Math.max(1, Math.round(meters))}m`;
    return i18n.t('landing.distance_away', { distance: value });
  }

  const locale = { vi: 'vi-VN', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR' }[languageCode] ?? 'vi-VN';
  const value = `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(meters / 1000)} km`;
  return i18n.t('landing.distance_away', { distance: value });
}

export function enrichPoisWithDistance(pois, position, languageCode = 'vi') {
  return pois
    .map((poi) => {
      const distanceMeters = getDistanceMeters(position, {
        lat: poi.latitude,
        lng: poi.longitude
      });

      return {
        ...poi,
        distanceMeters,
        distanceLabel: formatDistance(distanceMeters, languageCode),
        isInsideRadius: distanceMeters <= poi.activationRadius
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
