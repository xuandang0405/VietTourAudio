import { AnimatePresence, motion } from 'framer-motion';
import { Headphones, MapPin, QrCode, Star } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import { usePremiumStore } from '../../stores/premiumStore';

// ── Zone metadata tĩnh; sẽ được bổ sung từ API khi backend sẵn sàng ──
const ZONE_CATALOG = {
  PHODIBONGUYENHUE: {
    code: 'PHODIBONGUYENHUE',
    name: 'Phố đi bộ Nguyễn Huệ',
    description:
      'Trục phố đi bộ trung tâm TP.HCM – nơi hội tụ kiến trúc Pháp cổ, ẩm thực địa phương và các gian hàng lưu niệm đặc sắc.',
    poiCount: 6,
    audioMinutes: 24,
    rating: 4.8,
    statusLabel: 'Đang hoạt động',
  },
};

function getZone(code) {
  if (!code) return null;
  const key = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return ZONE_CATALOG[key] ?? {
    code: key,
    name: `Khu vực ${key}`,
    description: 'Khu vực đang cập nhật thông tin.',
    poiCount: '?',
    audioMinutes: '?',
    rating: null,
    statusLabel: 'Đang cập nhật',
  };
}

export function ZonePage({ onUpgrade, onToast }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);
  const zone = getZone(code);

  // Deep link: tự navigate vào map của zone này
  function handleEnterZone() {
    navigate(`/map?zone=${zone.code}`, { replace: false });
    onToast?.(`📍 Đang vào ${zone.name}`);
  }

  useEffect(() => {
    // Nếu scan QR thật trực tiếp -> tự động chuyển sau 1s
    const timer = setTimeout(handleEnterZone, 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-bgAbyss px-4 text-textCrisp">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.18)_0%,transparent_65%)]" aria-hidden="true" />

      <AnimatePresence>
        <motion.div
          key="zone-entry-card"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Logo */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <img src={logo} alt="VietTourAudio" className="h-12 w-12 rounded-xl shadow-neon-cyan" />
            <span className="bg-gradient-to-r from-electricBlue to-oceanCyan bg-clip-text font-display text-xl font-bold text-transparent">
              VietTourAudio
            </span>
          </div>

          {/* Zone card */}
          <div className="rounded-2xl border border-glassBorder bg-bgSurface/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {/* Header */}
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-oceanCyan">
              <QrCode size={14} />
              <span>Deep Link · {zone.code}</span>
            </div>
            <h1 className="mb-3 font-display text-2xl font-bold leading-tight text-textCrisp">
              {zone.name}
            </h1>

            {/* Meta pills */}
            <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 rounded-full border border-electricBlue/25 bg-electricBlue/10 px-3 py-1 text-electricBlue">
                <MapPin size={11} />
                {zone.poiCount} điểm tham quan
              </span>
              <span className="flex items-center gap-1 rounded-full border border-oceanCyan/25 bg-oceanCyan/10 px-3 py-1 text-oceanCyan">
                <Headphones size={11} />
                {zone.audioMinutes} phút audio
              </span>
              {zone.rating && (
                <span className="flex items-center gap-1 rounded-full border border-premiumNeon/25 bg-premiumNeon/10 px-3 py-1 text-premiumNeon">
                  <Star size={11} fill="currentColor" />
                  {zone.rating}/5
                </span>
              )}
            </div>

            <p className="mb-5 text-sm leading-relaxed text-textSeafoam">{zone.description}</p>

            {/* Free listens indicator */}
            {!isPremium && (
              <div className="mb-4 rounded-xl border border-electricBlue/20 bg-electricBlue/8 px-4 py-3 text-center text-xs font-bold text-electricBlue">
                {freeListensRemaining > 0
                  ? `🎧 Bạn còn ${freeListensRemaining} lượt nghe miễn phí`
                  : '🔒 Đã hết lượt nghe miễn phí – mở khóa Premium để tiếp tục'}
              </div>
            )}
            {isPremium && (
              <div className="mb-4 rounded-xl border border-premiumNeon/20 bg-premiumNeon/8 px-4 py-3 text-center text-xs font-bold text-premiumNeon">
                ✨ Premium đang hoạt động – thưởng thức không giới hạn
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={handleEnterZone}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-electricBlue to-oceanCyan px-4 py-4 text-sm font-bold text-white shadow-neon-cyan transition duration-150 ease-out hover:brightness-110 active:scale-[0.98]"
            >
              <MapPin size={18} />
              Vào bản đồ khu vực
            </button>

            {!isPremium && freeListensRemaining === 0 && (
              <button
                type="button"
                onClick={() => onUpgrade?.()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-premiumNeon/40 bg-premiumNeon/10 px-4 py-3 text-sm font-bold text-premiumNeon transition duration-150 ease-out hover:bg-premiumNeon/15 active:scale-[0.98]"
              >
                🔓 Mở khóa toàn bộ Audio – 30.000 VND / 24h
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-textGhost">
            Đang chuyển hướng tự động…
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
