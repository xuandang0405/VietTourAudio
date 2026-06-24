import { AnimatePresence, motion } from 'framer-motion';
import { Timer, Zap } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { usePremiumStore } from '../../stores/premiumStore';
import { formatCountdown } from '../../utils/formatTime';
import { useTranslation } from 'react-i18next';

/**
 * Floating badge góc phải màn hình:
 * - Khi isPremium: hiện ⏱ đếm ngược Premium HH:MM:SS
 * - Khi !isPremium && freeListensRemaining > 0: hiện số lượt còn lại
 * - Khi đã hết lượt và !isPremium: badge 🔒 mờ
 */
function FloatingPremiumBadgeComponent({ onUpgrade }) {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const isPremium = usePremiumStore((state) => state.isPremium);
  const expiresAt = usePremiumStore((state) => state.expiresAt);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);
  const checkExpiry = usePremiumStore((state) => state.checkExpiry);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      checkExpiry();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [checkExpiry]);

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-[1800]">
      <AnimatePresence mode="wait">
        {isPremium ? (
          <motion.div
            key="premium-countdown"
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-4 py-2 text-sm font-bold text-teal-700 shadow-sm backdrop-blur-xl"
          >
            <Timer size={15} className="flex-shrink-0" />
            <span className="tabular-nums">{t('premium_countdown', { time: formatCountdown(expiresAt - now), defaultValue: 'Premium: {{time}}' })}</span>
          </motion.div>
        ) : freeListensRemaining > 0 ? (
          <motion.button
            key="free-listens"
            type="button"
            onClick={() => onUpgrade?.()}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-bold text-teal-600 shadow-sm backdrop-blur-xl transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
          >
            <Zap size={13} className="flex-shrink-0" />
            <span>{t('free_listens', { count: freeListensRemaining })}</span>
          </motion.button>
        ) : (
          <motion.button
            key="locked"
            type="button"
            onClick={() => onUpgrade?.()}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-xs font-bold text-orange-600 shadow-sm backdrop-blur-xl transition hover:bg-orange-50 active:scale-[0.97]"
          >
            <span>🔒 {t('unlock')}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export const FloatingPremiumBadge = memo(FloatingPremiumBadgeComponent);
