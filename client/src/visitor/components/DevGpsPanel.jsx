import { MapPin } from 'lucide-react';
import { visitorPois } from '../../data/visitorPois';
import { useLocationStore } from '../../stores/locationStore';

export function DevGpsPanel({ onToast }) {
  const simulateNearPoi = useLocationStore((state) => state.simulateNearPoi);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="absolute bottom-[calc(38%+112px)] left-4 right-20 z-[1200] rounded-3xl border border-dashed border-teal-200 bg-white/90 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-teal-700">
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
              onToast(`Đã giả lập GPS gần ${poi.title}.`);
            }}
            className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition duration-200 ease-out hover:bg-teal-50 hover:text-teal-700 active:scale-95"
          >
            {poi.title}
          </button>
        ))}
      </div>
    </div>
  );
}
