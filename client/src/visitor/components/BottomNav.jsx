import { Compass, List, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  {
    id: 'explore',
    label: 'Khám phá',
    to: '/map',
    icon: Compass
  },
  {
    id: 'list',
    label: 'Danh sách',
    to: '/list',
    icon: List
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    to: '/settings',
    icon: Settings
  }
];

export function BottomNav() {
  return (
    <nav className="absolute bottom-3 left-3 right-3 z-[1300] grid grid-cols-3 rounded-[1.65rem] border border-white/80 bg-white/90 p-2 shadow-2xl shadow-slate-900/20 backdrop-blur-2xl min-[769px]:bottom-4">
      {tabs.map(({ id, label, to, icon: Icon }) => (
        <NavLink
          key={id}
          to={to}
          data-testid={`nav-${id}`}
          className={({ isActive }) =>
            [
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-black transition duration-200 ease-out active:scale-95',
              isActive ? 'bg-teal-700 text-white shadow-lg shadow-teal-900/20' : 'text-slate-500 hover:bg-slate-100'
            ].join(' ')
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
