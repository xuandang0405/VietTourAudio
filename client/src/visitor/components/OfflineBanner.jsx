import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 top-4 z-[1700] flex items-center justify-center gap-2 rounded-2xl border border-warning/25 bg-bgSurface/94 px-4 py-3 text-sm font-bold text-textCrisp shadow-2xl shadow-black/35 backdrop-blur-xl">
      <WifiOff size={17} />
      {t('offline')}
    </div>
  );
}
