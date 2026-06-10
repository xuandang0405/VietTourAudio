import { Globe2, MapPin, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { languages, useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { formatCountdown } from '../../utils/formatTime';
import { BottomNav } from '../components/BottomNav';
import { TopBar } from '../components/TopBar';

export function SettingsPage({ onUpgrade, onToast }) {
  const [now, setNow] = useState(Date.now());
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const expiresAt = usePremiumStore((state) => state.expiresAt);
  const deactivatePremium = usePremiumStore((state) => state.deactivatePremium);
  const clearLocation = useLocationStore((state) => state.clearLocation);
  const permissionStatus = useLocationStore((state) => state.permissionStatus);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative h-full overflow-y-auto bg-slate-50 px-4 pb-28 pt-24 hide-scrollbar">
      <TopBar title="Cài đặt" compact />

      <header className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">Không cần đăng nhập</p>
        <h1 className="mt-1 text-3xl font-black leading-tight text-slate-950">Trạng thái thiết bị</h1>
      </header>

      <div className="grid gap-3">
        <article className="glass-panel rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-100 text-teal-700">
              <ShieldCheck size={22} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">Premium Pass</h2>
              <p className="text-sm font-semibold text-slate-500">
                {isPremium ? `Còn ${formatCountdown(expiresAt - now)}` : 'Audio đang khóa ở chế độ miễn phí'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={isPremium ? deactivatePremium : onUpgrade}
            className={isPremium ? 'mt-4 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition duration-200 ease-out hover:bg-slate-200 active:scale-95' : 'mt-4 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition duration-200 ease-out hover:bg-orange-600 active:scale-95'}
          >
            {isPremium ? 'Tắt Premium demo' : 'Mở khóa audio 24h'}
          </button>
        </article>

        <article className="glass-panel rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-600">
              <Globe2 size={22} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">Ngôn ngữ</h2>
              <p className="text-sm font-semibold text-slate-500">Ảnh hưởng tới giọng đọc mô phỏng</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {languages.map((language) => {
              const active = currentLanguage === language.code;

              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => setLanguage(language.code)}
                  className={active ? 'rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/20 transition duration-200 ease-out active:scale-95' : 'rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition duration-200 ease-out hover:bg-slate-200 active:scale-95'}
                >
                  {language.name}
                </button>
              );
            })}
          </div>
        </article>

        <article className="glass-panel rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700">
              <MapPin size={22} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">GPS</h2>
              <p className="text-sm font-semibold text-slate-500">Trạng thái: {permissionStatus}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearLocation();
              onToast('Đã xóa vị trí demo/GPS hiện tại.');
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition duration-200 ease-out hover:bg-slate-200 active:scale-95"
          >
            <Trash2 size={17} />
            Xóa vị trí lưu trên giao diện
          </button>
        </article>
      </div>

      <BottomNav />
    </section>
  );
}
