import { MapPin } from 'lucide-react';
import { visitorPois } from '../../data/visitorPois';
import { useLocationStore } from '../../stores/locationStore';

export function DevGpsPanel({ onToast }) {
  const simulateNearPoi = useLocationStore((state) => state.simulateNearPoi);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="absolute bottom-[calc(38%+112px)] left-4 right-20 z-[1200] rounded-2xl border border-dashed border-oceanCyan/30 bg-bgSurface/85 p-3 shadow-xl shadow-black/30 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-oceanCyan">
        <MapPin size={14} />
        Dev GPS
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {visitorPois.map((poi) => (
          <button
            key={poi.id}
            type="button"
            onClick={() => {
              simulateNearPoi(poi);
              onToast?.(`Đã giả lập GPS gần ${poi.title}.`);
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
