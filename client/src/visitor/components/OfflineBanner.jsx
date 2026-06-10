import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="absolute inset-x-4 top-4 z-[1700] flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-2xl">
      <WifiOff size={17} />
      Bạn đang ngoại tuyến. Nội dung đã xem vẫn có thể hiển thị.
    </div>
  );
}
