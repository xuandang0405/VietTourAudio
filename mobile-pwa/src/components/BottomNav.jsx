import { Heart, Map, QrCode, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/scan', icon: QrCode, label: 'Scan' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/favorites', icon: Heart, label: 'Fav' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-1 px-2 py-2 text-xs ${active ? 'text-teal-700' : 'text-slate-500'}`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
