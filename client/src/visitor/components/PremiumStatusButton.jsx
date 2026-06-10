import { motion } from 'framer-motion';
import { LockOpen, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePremiumStore } from '../../stores/premiumStore';
import { formatCountdown } from '../../utils/formatTime';

export function PremiumStatusButton({ onUpgrade }) {
  const isPremium = usePremiumStore((state) => state.isPremium);
  const expiresAt = usePremiumStore((state) => state.expiresAt);
  const checkExpiry = usePremiumStore((state) => state.checkExpiry);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      checkExpiry();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [checkExpiry]);

  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-xl shadow-teal-900/20"
      >
        <Timer size={17} />
        Premium: {formatCountdown(expiresAt - now)}
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onUpgrade}
      animate={{ scale: [1, 1.035, 1] }}
      transition={{ repeat: Infinity, duration: 1.35, ease: 'easeInOut' }}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-orange-500/30 transition duration-200 ease-out hover:bg-orange-600 active:scale-95"
    >
      <LockOpen size={17} />
      Nâng cấp Premium (24h)
    </motion.button>
  );
}
