import { Heart, Lock } from 'lucide-react';

export function POICard({ zone, onClick, onFavorite, isFavorite }) {
  return (
    <button type="button" onClick={() => onClick?.(zone)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{zone.zoneType}</p>
          <h3 className="font-semibold text-slate-900">{zone.localizedTitle || zone.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600">{zone.localizedDescription || zone.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {zone.isPremium ? <Lock size={14} className="text-amber-600" /> : null}
          <span onClick={(e) => { e.stopPropagation(); onFavorite?.(zone); }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </span>
        </div>
      </div>
    </button>
  );
}
