import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { LoadingState } from '../components/LoadingState';
import { POICard } from '../components/POICard';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { useAppStore } from '../stores/useAppStore';
import { useZoneStore } from '../stores/useZoneStore';
import { saveTour, saveZones } from '../services/idb';

export function ZoneLanding() {
  const { tourId } = useParams();
  const guestId = useAppStore((s) => s.guestId);
  const setTour = useZoneStore((s) => s.setTour);
  const setZones = useZoneStore((s) => s.setZones);
  const zones = useZoneStore((s) => s.zones);
  const currentTour = useZoneStore((s) => s.currentTour);
  const hydrateFromCache = useZoneStore((s) => s.hydrateFromCache);
  const loadFavorites = useFavoriteStore((s) => s.loadFavorites);
  const isFavorite = useFavoriteStore((s) => s.isFavorite);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      await hydrateFromCache(tourId);
      try {
        const { data } = await api.get(`/tour/${tourId}`);
        if (!active) return;
        setTour(data.tour);
        setZones(data.zones || []);
        await saveTour(data.tour);
        await saveZones(data.tour.id, data.zones || []);
      } catch {
        // keep cache
      }
      await loadFavorites(guestId);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [tourId, setTour, setZones, hydrateFromCache, loadFavorites, guestId]);

  if (loading) return <LoadingState label="Dang tai tour" />;

  return (
    <section className="space-y-4 p-4">
      <header className="rounded-2xl bg-slate-900 p-4 text-white">
        <p className="text-xs uppercase tracking-widest text-slate-300">Tour</p>
        <h1 className="text-xl font-black">{currentTour?.name || `Tour ${tourId}`}</h1>
      </header>

      <div className="grid gap-3">
        {zones.map((z) => (
          <POICard
            key={z.id}
            zone={z}
            onClick={() => {}}
            onFavorite={(zone) => toggleFavorite({ guestId, zone })}
            isFavorite={isFavorite(z.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link to="/map" className="rounded-xl bg-teal-600 px-3 py-3 text-center text-sm font-semibold text-white">Mo ban do</Link>
        <Link to="/player" className="rounded-xl bg-slate-200 px-3 py-3 text-center text-sm font-semibold text-slate-800">Mo player</Link>
      </div>
    </section>
  );
}
