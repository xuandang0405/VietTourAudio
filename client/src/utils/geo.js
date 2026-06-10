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

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) {
    return 'Chưa có GPS';
  }

  if (meters < 1000) {
    return `Cách bạn ${Math.max(1, Math.round(meters))}m`;
  }

  return `Cách bạn ${(meters / 1000).toFixed(1)}km`;
}

export function enrichPoisWithDistance(pois, position) {
  return pois
    .map((poi) => {
      const distanceMeters = getDistanceMeters(position, {
        lat: poi.latitude,
        lng: poi.longitude
      });

      return {
        ...poi,
        distanceMeters,
        distanceLabel: formatDistance(distanceMeters),
        isInsideRadius: distanceMeters <= poi.activationRadius
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
