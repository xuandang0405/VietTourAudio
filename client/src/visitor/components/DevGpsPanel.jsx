import { MapPin } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { useTranslation } from '../../i18n/translations';

export function DevGpsPanel({ pois = [], onToast }) {
  const { t } = useTranslation();
  const simulateNearPoi = useLocationStore((state) => state.simulateNearPoi);
  return (
    <div className="absolute bottom-[calc(38%+112px)] left-4 right-20 z-[1200] rounded-2xl border border-dashed border-oceanCyan/30 bg-bgSurface/85 p-3 shadow-xl shadow-black/30 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-oceanCyan">
        <MapPin size={14} />
        Dev GPS
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {pois.map((poi) => (
          <button
            key={poi.id}
            type="button"
            onClick={() => {
              simulateNearPoi(poi);
              onToast?.(t('demoMoved', { name: poi.title }));
            }}
            className="shrink-0 rounded-full border border-glassBorder bg-white/5 px-3 py-2 text-xs font-bold text-textSeafoam transition duration-150 ease-out hover:border-oceanCyan/50 hover:bg-white/10 hover:text-textCrisp active:scale-[0.98]"
          >
            {poi.title}
          </button>
        ))}
      </div>
    </div>
  );
}
