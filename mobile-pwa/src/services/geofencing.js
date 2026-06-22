export function haversineMeters(a, b) {
  const toRad = (n) => (n * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function getBoundingBox(zones = []) {
  if (!zones.length) return null;
  return zones.reduce((acc, z) => ({
    minLat: Math.min(acc.minLat, Number(z.latitude)),
    maxLat: Math.max(acc.maxLat, Number(z.latitude)),
    minLng: Math.min(acc.minLng, Number(z.longitude)),
    maxLng: Math.max(acc.maxLng, Number(z.longitude))
  }), { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 });
}

export function findNearestZone(coords, zones = []) {
  let nearest = null;
  for (const zone of zones) {
    const distance = haversineMeters(coords, { lat: Number(zone.latitude), lng: Number(zone.longitude) });
    if (!nearest || distance < nearest.distance) nearest = { zone, distance };
  }
  return nearest;
}

export function checkGeofenceState(coords, zones = [], previousState = {}) {
  const nearest = findNearestZone(coords, zones);
  if (!nearest) return { nearestZone: null, entered: [], exited: [], insideMap: previousState.insideMap || {} };

  const insideMap = { ...(previousState.insideMap || {}) };
  const entered = [];
  const exited = [];

  for (const zone of zones) {
    const id = String(zone.id);
    const distance = haversineMeters(coords, { lat: Number(zone.latitude), lng: Number(zone.longitude) });
    const accuracy = Number(coords.accuracy || 10);
    const enterRadius = Number(zone.radius || 10) + Math.max(0, accuracy > 15 ? accuracy - 10 : 0);
    const exitRadius = enterRadius * 1.35;
    const wasInside = Boolean(insideMap[id]);
    const nowInside = wasInside ? distance <= exitRadius : distance <= enterRadius;

    if (!wasInside && nowInside) entered.push(zone);
    if (wasInside && !nowInside) exited.push(zone);
    insideMap[id] = nowInside;
  }

  return { nearestZone: nearest.zone, entered, exited, insideMap };
}
