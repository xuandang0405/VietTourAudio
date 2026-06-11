import { Compass, List, Settings, Crown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { usePremiumStore } from '../../stores/premiumStore';

export function BottomNav() {
  const isPremium = usePremiumStore((state) => state.isPremium);

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
      id: 'premium',
      label: isPremium ? 'Premium (Active)' : 'Mở khóa',
      to: '/', // Sẽ mở modal mua Premium
      icon: Crown,
      isAction: true
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      to: '/settings',
      icon: Settings
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1300] bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-safe">
      <div className="flex items-center justify-around px-2 py-3 max-w-md mx-auto relative">
        {tabs.map(({ id, label, to, icon: Icon, isAction }) => (
          <NavLink
            key={id}
            to={isAction ? '#' : to}
            onClick={(e) => {
              if (isAction) {
                e.preventDefault();
                // TODO: trigger checkout modal
                window.dispatchEvent(new CustomEvent('open-checkout'));
              }
            }}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300',
                isActive && !isAction ? 'text-premium-600 font-bold' : 'text-slate-400 hover:text-slate-800',
                isAction ? 'relative' : ''
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isAction ? (
                  <div className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${isPremium ? 'bg-premium-50 text-premium-600 shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    <Icon size={22} strokeWidth={isPremium ? 2.5 : 2} className={isPremium ? 'drop-shadow-sm' : ''} />
                  </div>
                ) : (
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                )}
                <span className={`text-[10px] mt-0.5 ${isActive || isAction ? 'font-bold' : 'font-medium'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
