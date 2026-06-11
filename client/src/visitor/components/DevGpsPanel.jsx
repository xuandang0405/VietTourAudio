import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { visitorPois } from '../../data/visitorPois';
import { useLocationStore } from '../../stores/locationStore';
import { useTranslation } from '../../i18n/translations';

export function DevGpsPanel({ onToast }) {
  const { t } = useTranslation();
  const simulateNearPoi = useLocationStore((state) => state.simulateNearPoi);
  const position = useLocationStore((state) => state.position);
  const currentIndex = useMemo(() => {
    if (!position) return 0;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    visitorPois.forEach((poi, index) => {
      const distance = Math.hypot(poi.latitude - position.lat, poi.longitude - position.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    return nearestIndex;
  }, [position]);

  function moveTo(offset) {
    const nextIndex = (currentIndex + offset + visitorPois.length) % visitorPois.length;
    const poi = visitorPois[nextIndex];
    simulateNearPoi(poi);
    onToast(t('demoMoved', { name: poi.title }));
  }

  return (
    <div className="absolute bottom-[calc(38%+112px)] left-4 z-[1200] flex items-center gap-2 rounded-2xl border border-teal-200 bg-white/95 p-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
      <button type="button" onClick={() => moveTo(-1)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700" aria-label={t('explore')}>
        <ChevronLeft size={18} />
      </button>
      <div className="flex min-w-0 items-center gap-2 px-1 text-xs font-black text-teal-700">
        <MapPin size={14} />
        <span className="max-w-28 truncate">GPS DEMO</span>
      </div>
      <button type="button" onClick={() => moveTo(1)} className="grid h-9 w-9 place-items-center rounded-xl bg-teal-700 text-white" aria-label={t('explore')}>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
