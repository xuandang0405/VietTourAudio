import { ChevronRight, Download, Headphones, Lock } from 'lucide-react';
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

      <header className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">Trong khu vực</p>
        <h1 className="mt-1 text-3xl font-black leading-tight text-slate-950">Sạp và điểm thuyết minh</h1>
      </header>

      <div className="grid gap-3">
        {visitorPois.map((poi) => (
          <Link
            key={poi.id}
            to={`/map?poi=${poi.id}`}
            className="glass-panel grid grid-cols-[74px_1fr_auto] items-center gap-3 rounded-3xl p-3 text-left transition duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <img className="h-[74px] w-[74px] rounded-2xl object-cover" src={poi.image} alt={poi.title} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-slate-950">{poi.title}</span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">
                {poi.category} • {poi.duration}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-700">
                {isPremium ? <Headphones size={13} /> : <Lock size={13} />}
                {isPremium ? 'Audio đã mở' : 'Bản chữ miễn phí'}
              </span>
            </span>
            <ChevronRight className="text-slate-400" size={18} />
          </Link>
        ))}
      </div>

      {!isPremium && (
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition duration-200 ease-out hover:bg-orange-600 active:scale-95"
        >
          <Download size={18} />
          Mở khóa toàn bộ audio 24h
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
