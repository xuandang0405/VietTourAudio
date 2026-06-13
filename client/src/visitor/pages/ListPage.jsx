import { ChevronRight, Crown, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { destinationPreviews, visitorPois } from '../../data/visitorPois';
import { usePremiumStore } from '../../stores/premiumStore';
import { BottomNav } from '../components/BottomNav';
import { TopBar } from '../components/TopBar';

export function ListPage({ onUpgrade }) {
  const isPremium = usePremiumStore((state) => state.isPremium);

  return (
    <section className="relative h-[100vh] min-h-[100vh] overflow-y-auto bg-transparent px-4 pb-32 pt-24 text-textCrisp hide-scrollbar tablet:px-8 pc:px-10">
      <TopBar title="Danh sách" compact />

      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase text-oceanCyan">Trong khu vực</p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-textCrisp">Sạp và điểm đến</h1>
        </header>

        <div className="grid gap-4 pc:grid-cols-2">
          {visitorPois.length > 0 ? (
            visitorPois.map((poi) => (
              <Link
                key={poi.id}
                to={`/map?poi=${poi.id}`}
                className="glass-card flex items-center gap-4 p-3 active:scale-[0.98]"
              >
                <div className="relative h-20 w-20 flex-shrink-0">
                  <img
                    className="h-full w-full rounded-xl border border-glassBorder object-cover"
                    src={poi.image}
                    alt={poi.title}
                    loading="lazy"
                    decoding="async"
                  />
                  {isPremium && (
                    <div className="absolute -right-1 -top-1 rounded-full border border-premiumNeon/30 bg-premiumNeon p-1 shadow-neon-premium">
                      <Headphones size={12} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-textCrisp">{poi.title}</span>
                  <span className="mt-1 block text-xs font-medium text-textSeafoam">
                    {poi.category} • {poi.duration}
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={isPremium ? 'inline-flex items-center gap-1 rounded-full border border-premiumNeon/30 bg-premiumNeon/10 px-2 py-1 text-[10px] font-bold uppercase text-premiumNeon' : 'inline-flex items-center gap-1 rounded-full border border-electricBlue/20 bg-electricBlue/10 px-2 py-1 text-[10px] font-medium uppercase text-electricBlue'}>
                      {isPremium ? 'Audio đã mở' : 'Bản chữ miễn phí'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-textGhost" size={20} />
              </Link>
            ))
          ) : (
            <div className="glass-card p-6 text-center font-semibold text-textSeafoam pc:col-span-2">
              Chưa có sạp hoặc điểm thuyết minh trong khu vực này.
            </div>
          )}
        </div>

        {!isPremium && (
          <button
            type="button"
            onClick={onUpgrade}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-premiumNeon to-electricBlue px-4 py-4 text-sm font-bold text-white shadow-neon-premium transition duration-150 hover:brightness-110 active:scale-[0.98] pc:max-w-sm"
          >
            <Crown size={20} />
            Mở khóa Premium 24h
          </button>
        )}

        <section className="mt-7">
          <p className="text-xs font-bold uppercase text-oceanCyan">Khám phá thêm</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-textCrisp">Điểm đến tiếp theo của bạn?</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 pc:grid-cols-4">
            {destinationPreviews.map((destination) => (
              <article key={destination.id} className="glass-card overflow-hidden">
                <img className="aspect-[1.25] w-full object-cover" src={destination.image} alt={destination.name} loading="lazy" decoding="async" />
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-textCrisp">{destination.name}</p>
                  <p className="mt-1 text-xs font-semibold text-textSeafoam">{destination.city}</p>
                  <span className="mt-2 inline-flex rounded-full border border-glassBorder bg-white/5 px-2.5 py-1 text-[11px] font-bold text-textSeafoam">
                    {destination.label}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </section>
  );
}
