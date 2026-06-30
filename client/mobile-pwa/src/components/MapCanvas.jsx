import { Lock, MapPin, Navigation } from 'lucide-react';

function toPoint(zone, box) {
  const x = ((Number(zone.longitude) - box.minLng) / (box.maxLng - box.minLng || 1)) * 100;
  const y = 100 - ((Number(zone.latitude) - box.minLat) / (box.maxLat - box.minLat || 1)) * 100;
  return { x, y };
}

export function MapCanvas({ zones = [], currentLocation, nearestZone, activeZone, onSelect }) {
  if (!zones.length) return <div className="rounded-xl bg-white p-4 text-sm">Chua co zone de hien thi.</div>;

  const box = zones.reduce((acc, z) => ({
    minLat: Math.min(acc.minLat, Number(z.latitude)),
    maxLat: Math.max(acc.maxLat, Number(z.latitude)),
    minLng: Math.min(acc.minLng, Number(z.longitude)),
    maxLng: Math.max(acc.maxLng, Number(z.longitude))
  }), { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 });

  const userPoint = currentLocation ? {
    x: ((Number(currentLocation.lng) - box.minLng) / (box.maxLng - box.minLng || 1)) * 100,
    y: 100 - ((Number(currentLocation.lat) - box.minLat) / (box.maxLat - box.minLat || 1)) * 100
  } : null;

  return (
    <div className="relative h-80 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-teal-50 to-cyan-100">
      {zones.map((z) => {
        const p = toPoint(z, box);
        const isNearest = nearestZone?.id === z.id;
        const isActive = activeZone?.id === z.id;
        return (
          <button
            key={z.id}
            type="button"
            onClick={() => onSelect?.(z)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 ${isActive ? 'bg-teal-600 text-white' : isNearest ? 'bg-orange-500 text-white' : 'bg-white text-slate-700'}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {z.isPremium ? <Lock size={13} /> : <MapPin size={13} />}
          </button>
        );
      })}

      {userPoint ? (
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${userPoint.x}%`, top: `${userPoint.y}%` }}>
          <div className="h-8 w-8 rounded-full bg-blue-500/20 animate-ping" />
          <div className="absolute inset-0 grid place-items-center text-blue-700"><Navigation size={16} /></div>
        </div>
      ) : null}
    </div>
  );
}
