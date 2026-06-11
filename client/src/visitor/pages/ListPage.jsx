import { ChevronRight, Download, Headphones, Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { destinationPreviews, visitorPois } from '../../data/visitorPois';
import { usePremiumStore } from '../../stores/premiumStore';
import { BottomNav } from '../components/BottomNav';
import { TopBar } from '../components/TopBar';

export function ListPage({ onUpgrade }) {
  const isPremium = usePremiumStore((state) => state.isPremium);

  return (
    <section className="relative h-full overflow-y-auto bg-slate-50 px-4 pb-28 pt-24 hide-scrollbar">
      <TopBar title="Danh sách" compact />

      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-premium-600">Trong khu vực</p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight text-slate-900">Sạp và Điểm đến</h1>
      </header>

      <div className="grid gap-4">
        {visitorPois.map((poi) => (
          <Link
            key={poi.id}
            to={`/map?poi=${poi.id}`}
            className="flex items-center gap-4 rounded-3xl bg-white p-3 shadow-md border border-slate-100 transition-all duration-300 ease-out hover:shadow-lg active:scale-[0.98]"
          >
            <div className="relative h-20 w-20 flex-shrink-0">
              <img className="h-full w-full rounded-2xl object-cover" src={poi.image} alt={poi.title} />
              {isPremium && (
                <div className="absolute -top-1 -right-1 rounded-full bg-gradient-to-r from-premium-400 to-premium-600 p-1 shadow-md">
                   <Headphones size={12} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-slate-900">{poi.title}</span>
              <span className="mt-1 block text-xs font-medium text-slate-500">
                {poi.category} • {poi.duration}
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isPremium ? 'bg-premium-50 text-premium-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isPremium ? 'AUDIO ĐÃ MỞ' : 'BẢN CHỮ MIỄN PHÍ'}
                </span>
              </div>
            </div>
            <ChevronRight className="text-slate-300" size={20} />
          </Link>
        ))}
      </div>

      {!isPremium && (
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-premium-500 to-premium-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-premium-500/30 transition duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Crown size={20} />
          Mở khóa Premium 24h
        </button>
      )}

      <section className="mt-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">Khám phá thêm</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Điểm đến tiếp theo của bạn?</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {destinationPreviews.map((destination) => (
            <article key={destination.id} className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/10">
              <img className="aspect-[1.25] w-full object-cover" src={destination.image} alt={destination.name} />
              <div className="p-3">
                <p className="truncate text-sm font-black text-slate-950">{destination.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{destination.city}</p>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                  {destination.label}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BottomNav />
    </section>
  );
}
