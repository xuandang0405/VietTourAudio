import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { PageHeader } from '../components/PageHeader';
import { fetchHeatmap } from '../api/admin';

const points = [
  [10.773, 106.704, 0.8],
  [10.7726, 106.7038, 0.6],
  [10.7722, 106.705, 0.7],
  [10.7718, 106.7046, 0.9],
  [10.7734, 106.7052, 0.65]
];

export function HeatmapPage() {
  const mapRef = useRef(null);
  const hostRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = L.map(hostRef.current).setView([10.7728, 106.7045], 16);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    layerRef.current = L.heatLayer(points, { radius: 28, blur: 18, maxZoom: 17 }).addTo(map);

    fetchHeatmap().then((data) => {
      if (!layerRef.current || !data?.points?.length) return;
      layerRef.current.setLatLngs(data.points);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader title="Live Heatmap" subtitle="Mat do truy cap zone theo geofence events" />
      <div ref={hostRef} className="h-[520px] overflow-hidden rounded-2xl border border-slate-200" />
    </section>
  );
}
