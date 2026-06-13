import { Compass, Crown, List, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePremiumStore } from '../../stores/premiumStore';

const navigationTabs = [
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
  const { pathname } = useLocation();
  const isPremium = usePremiumStore((state) => state.isPremium);

  function openCheckout() {
    window.dispatchEvent(new CustomEvent('open-checkout'));
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1300] border-t border-glassBorder bg-bgSurface/85 pb-safe shadow-[0_-18px_55px_rgba(0,0,0,0.34)] backdrop-blur-xl tablet:bottom-6 tablet:left-1/2 tablet:right-auto tablet:w-[430px] tablet:-translate-x-1/2 tablet:rounded-2xl tablet:border tablet:pb-0">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-3">
        {navigationTabs.map(({ id, label, to, icon: Icon }) => {
          const active = pathname === to || (id === 'explore' && pathname === '/');

          return (
            <Link
              key={id}
              to={to}
              className={[
                'flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 transition duration-200 ease-out active:scale-95',
                active ? 'text-oceanCyan' : 'text-textSeafoam hover:text-textCrisp'
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <span className={active ? 'grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-abyssIndigo to-electricBlue text-white shadow-neon-cyan' : 'grid h-10 w-10 place-items-center rounded-full bg-white/5 text-textSeafoam'}>
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={active ? 'text-[10px] font-black' : 'text-[10px] font-semibold'}>{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={openCheckout}
          className={[
            'flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 transition duration-200 ease-out active:scale-95',
            isPremium ? 'text-premiumNeon' : 'text-warning hover:text-textCrisp'
          ].join(' ')}
        >
          <span className={isPremium ? 'grid h-10 w-10 place-items-center rounded-full border border-premiumNeon/30 bg-premiumNeon/10 text-premiumNeon shadow-neon-premium' : 'grid h-10 w-10 place-items-center rounded-full border border-warning/25 bg-warning/10 text-warning'}>
            <Crown size={22} strokeWidth={isPremium ? 2.5 : 2} />
          </span>
          <span className="text-[10px] font-black">{isPremium ? 'Premium' : 'Mở khóa'}</span>
        </button>
      </div>
    </nav>
  );
}
