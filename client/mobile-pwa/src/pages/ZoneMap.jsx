import { useNavigate } from 'react-router-dom';
import { MapCanvas } from '../components/MapCanvas';
import { useZoneStore } from '../stores/useZoneStore';

export function ZoneMap() {
  const navigate = useNavigate();
  const zones = useZoneStore((s) => s.zones);
  const currentLocation = useZoneStore((s) => s.currentLocation);
  const nearestZone = useZoneStore((s) => s.nearestZone);
  const activeZone = useZoneStore((s) => s.activeZone);

  return (
    <section className="space-y-4 p-4">
      <h1 className="text-xl font-black">Ban do geofence</h1>
      <MapCanvas
        zones={zones}
        currentLocation={currentLocation}
        nearestZone={nearestZone}
        activeZone={activeZone}
        onSelect={(zone) => navigate(`/player/${zone.id}`)}
      />
      <p className="text-xs text-slate-500">Cham vao diem de mo player cua zone.</p>
    </section>
  );
}
