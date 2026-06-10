import { motion } from 'framer-motion';
import { ChevronRight, Compass, Headphones, MapPinned, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
import { PREMIUM_ACTIVATION_CODE } from '../../data/visitorPois';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { TopBar } from '../components/TopBar';

export function LandingPage({ onUpgrade, onToast }) {
  const navigate = useNavigate();
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const lastError = useLocationStore((state) => state.lastError);
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const useDemoLocation = useLocationStore((state) => state.useDemoLocation);
  const isPremium = usePremiumStore((state) => state.isPremium);

  async function handleStart() {
    const allowed = await requestLocation();

    if (allowed) {
      onToast('GPS đã sẵn sàng. Mở bản đồ khám phá.');
      navigate('/map');
      return;
    }

    onToast('Chưa lấy được GPS. Bạn vẫn có thể dùng chế độ demo.');
  }

  function handleDemo() {
    useDemoLocation();
    onToast('Đang dùng vị trí demo tại Phố đi bộ Nguyễn Huệ.');
    navigate('/map');
  }

  return (
    <section className="relative h-full overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.42),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(249,115,22,0.28),transparent_26%),linear-gradient(165deg,#073b48_0%,#061c2d_48%,#0f172a_100%)]" />
      <div className="absolute left-[-18%] top-[17%] h-[420px] w-[420px] rounded-full border border-white/10 opacity-70" />
      <div className="absolute right-[-22%] top-[30%] h-[360px] w-[360px] rounded-full border border-teal-300/20" />
      <div className="soundwave-watermark absolute inset-x-0 bottom-16 h-48 opacity-30" />

      <TopBar />

      <div className="relative z-10 flex h-full flex-col px-5 pb-8 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mt-auto"
        >
          <img className="h-16 w-16 rounded-3xl shadow-2xl shadow-teal-900/30" src={logo} alt="VietTourAudio logo" />
          <img className="mt-5 h-12 max-w-[260px] object-contain" src={logoText} alt="VietTourAudio" />
          <h1 className="mt-7 text-4xl font-black leading-[1.05] tracking-normal">
            Nghe câu chuyện du lịch ngay tại nơi bạn đứng.
          </h1>
          <p className="mt-4 max-w-[330px] text-base leading-7 text-white/80">
            PWA thuyết minh tự động theo GPS, QR và giọng đọc AI đa ngôn ngữ. Không cần đăng nhập, mở lên là khám phá.
          </p>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={handleStart}
              disabled={permissionStatus === 'requesting'}
              className="group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition duration-200 ease-out hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {permissionStatus === 'requesting' ? 'Đang xin quyền GPS...' : 'Bắt đầu hành trình'}
              <ChevronRight className="transition duration-200 group-hover:translate-x-0.5" size={19} />
            </button>
            <button
              type="button"
              onClick={handleDemo}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white backdrop-blur-xl transition duration-200 ease-out hover:bg-white/20 active:scale-[0.98]"
            >
              <Compass size={18} />
              Xem bản đồ demo
            </button>
          </div>

          {permissionStatus === 'denied' && (
            <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white/80">
              {lastError || 'GPS bị từ chối. Bạn có thể cấp quyền lại trong cài đặt trình duyệt.'}
            </p>
          )}
        </motion.div>

        <div className="relative z-10 mt-7 grid grid-cols-3 gap-2">
          <FeatureBadge icon={MapPinned} label="GPS" value="Tự phát" />
          <FeatureBadge icon={Headphones} label="Audio" value={isPremium ? 'Đã mở' : 'Premium'} />
          <FeatureBadge icon={ShieldCheck} label="Demo" value={PREMIUM_ACTIVATION_CODE} compact />
        </div>

        {!isPremium && (
          <button
            type="button"
            onClick={onUpgrade}
            className="relative z-10 mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-black text-teal-800 shadow-xl shadow-slate-950/20 transition duration-200 ease-out hover:bg-teal-50 active:scale-[0.98]"
          >
            Mở khóa Premium 24h bằng QR test
          </button>
        )}
      </div>
    </section>
  );
}

function FeatureBadge({ icon: Icon, label, value, compact = false }) {
  return (
    <article className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-xl">
      <Icon className="text-orange-300" size={19} />
      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/60">{label}</p>
      <p className={compact ? 'mt-1 truncate text-[11px] font-black text-white' : 'mt-1 text-sm font-black text-white'}>{value}</p>
    </article>
  );
}
