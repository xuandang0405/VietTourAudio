import { LockOpen, Timer } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { usePremiumStore } from '../../stores/premiumStore';
import { formatCountdown } from '../../utils/formatTime';
import { useTranslation } from 'react-i18next';

function PremiumStatusButtonComponent({ onUpgrade }) {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
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
      <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700 shadow-sm backdrop-blur-sm">
        <Timer size={17} />
        {t('premium_countdown', { time: formatCountdown(expiresAt - now), defaultValue: 'Premium: {{time}}' })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onUpgrade}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-bold uppercase text-orange-600 shadow-sm backdrop-blur-sm transition duration-150 ease-out hover:border-orange-300 hover:bg-orange-100 active:scale-[0.98]"
    >
      <LockOpen size={17} />
      {t('upgradePremium')}
    </button>
  );
}

export const PremiumStatusButton = memo(PremiumStatusButtonComponent);
