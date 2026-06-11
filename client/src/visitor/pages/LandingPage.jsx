import { motion } from 'framer-motion';
import { ChevronRight, Compass, Headphones, MapPinned, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
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

  const initAudioContext = () => {
    // Kích hoạt audio context trên iOS
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance('');
      msg.volume = 0;
      window.speechSynthesis.speak(msg);
    }
  };

  async function handleStart() {
    initAudioContext();
    const allowed = await requestLocation();

    if (allowed) {
      onToast('GPS đã sẵn sàng. Hãy bắt đầu khám phá.');
      navigate('/map');
      return;
    }

    onToast('Chưa lấy được GPS. Bạn có thể cấp quyền lại hoặc dùng bản demo.');
  }

  function handleDemo() {
    initAudioContext();
    useDemoLocation();
    onToast('Đang dùng chế độ Demo. Vị trí giả lập tại trung tâm.');
    navigate('/map');
  }

  return (
    <section className="relative h-full overflow-hidden bg-slate-900 text-white font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,119,6,0.15),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(15,23,42,0.8),transparent_50%),linear-gradient(135deg,#0f172a_0%,#1e293b_100%)]" />
      <div className="absolute -left-20 top-20 h-[500px] w-[500px] rounded-full border-[1px] border-premium-500/10" />
      <div className="absolute -right-20 bottom-20 h-[400px] w-[400px] rounded-full border-[1px] border-premium-400/10" />
      
      <TopBar />

      <div className="relative z-10 flex h-full flex-col px-6 pb-12 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mt-auto"
        >
          <div className="flex justify-center mb-8">
             <img className="h-20 w-20 rounded-2xl shadow-2xl shadow-premium-900/40" src={logo} alt="VietTourAudio" />
          </div>
          
          <h1 className="text-center text-4xl font-extrabold leading-[1.1] tracking-tight text-white mb-4">
            Khám phá vẻ đẹp qua <span className="text-transparent bg-clip-text bg-gradient-to-r from-premium-300 to-premium-500">giọng kể AI</span>
          </h1>
          <p className="text-center text-base leading-relaxed text-slate-300 mb-10 max-w-sm mx-auto">
            Tự động phát audio theo vị trí GPS. Trải nghiệm du lịch thông minh, tiện lợi, không cần đăng nhập.
          </p>

          <div className="grid gap-4 max-w-sm mx-auto">
            <button
              type="button"
              onClick={handleStart}
              disabled={permissionStatus === 'requesting'}
              className="group relative inline-flex min-h-[60px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-premium-500 to-premium-600 px-6 text-base font-bold text-white shadow-xl shadow-premium-500/30 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <MapPinned size={22} className="opacity-90" />
              {permissionStatus === 'requesting' ? 'Đang xin quyền GPS...' : 'Bắt đầu trải nghiệm'}
            </button>
            
            <button
              type="button"
              onClick={handleDemo}
              className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-slate-300 backdrop-blur-md transition-all duration-300 ease-out hover:bg-white/10 active:scale-[0.98]"
            >
              <Compass size={20} />
              Trải nghiệm Demo
            </button>
          </div>

          {permissionStatus === 'denied' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm font-medium leading-relaxed text-red-200 text-center">
                {lastError || 'GPS bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt để tiếp tục.'}
              </p>
            </motion.div>
          )}
        </motion.div>

        <div className="relative z-10 mt-10 grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
          <FeatureBadge icon={MapPinned} label="GPS TỰ ĐỘNG" />
          <FeatureBadge icon={Headphones} label={isPremium ? 'AUDIO PREMIUM' : 'TEXT & ẢNH'} isPremium={isPremium} />
        </div>
      </div>
    </section>
  );
}

function FeatureBadge({ icon: Icon, label, isPremium }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border ${isPremium ? 'border-premium-500/30 bg-premium-500/10' : 'border-white/10 bg-white/5'} p-4 backdrop-blur-md`}>
      <Icon className={isPremium ? 'text-premium-400' : 'text-slate-400'} size={24} strokeWidth={1.5} />
      <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${isPremium ? 'text-premium-300' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}
