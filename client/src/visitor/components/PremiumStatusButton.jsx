import { LockOpen, Timer } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { usePremiumStore } from '../../stores/premiumStore';
import { formatCountdown } from '../../utils/formatTime';

function PremiumStatusButtonComponent({ onUpgrade }) {
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
      <div className="inline-flex items-center gap-2 rounded-full border border-premiumNeon/30 bg-premiumNeon/10 px-4 py-3 text-sm font-bold text-premiumNeon shadow-neon-premium">
        <Timer size={17} />
        Premium: {formatCountdown(expiresAt - now)}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onUpgrade}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-premiumNeon/30 bg-premiumNeon/10 px-5 py-3 text-sm font-bold uppercase text-premiumNeon shadow-neon-premium transition duration-150 ease-out hover:border-premiumNeon/50 hover:bg-premiumNeon/15 active:scale-[0.98]"
    >
      <LockOpen size={17} />
      Nâng cấp Premium (24h)
    </button>
  );
}

export const PremiumStatusButton = memo(PremiumStatusButtonComponent);
