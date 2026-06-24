import { WifiOff } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export function OfflineBanner() {
  const online = useAppStore((s) => s.online);
  if (online) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">
      <WifiOff size={14} /> Dang offline - app dang dung cache
    </div>
  );
}
