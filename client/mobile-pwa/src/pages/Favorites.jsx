import { useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { POICard } from '../components/POICard';

export function Favorites() {
  const guestId = useAppStore((s) => s.guestId);
  const favorites = useFavoriteStore((s) => s.favorites);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const zones = useMemo(() => favorites.map((f) => f.zone || { id: f.zoneId, ...f }), [favorites]);

  return (
    <section className="space-y-3 p-4">
      <h1 className="text-xl font-black">Danh sach yeu thich</h1>
      {!zones.length ? <p className="text-sm text-slate-500">Chua co zone nao duoc luu.</p> : null}
      {zones.map((z) => (
        <POICard
          key={z.id}
          zone={z}
          isFavorite
          onFavorite={(zone) => toggleFavorite({ guestId, zone })}
        />
      ))}
    </section>
  );
}
