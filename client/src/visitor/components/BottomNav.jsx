import { Compass, Crown, List, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePremiumStore } from '../../features/vendor-wallet/stores/premiumStore';
import { useTranslation } from 'react-i18next';

const navigationTabs = [
  {
    id: 'explore',
    labelKey: 'explore',
    to: '/map',
    icon: Compass
  },
  {
    id: 'list',
    labelKey: 'list',
    to: '/list',
    icon: List
  },
  {
    id: 'settings',
    labelKey: 'settings',
    to: '/settings',
    icon: Settings
  }
];

export function BottomNav() {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const { pathname } = useLocation();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const lockedZone = localStorage.getItem('locked_zone');

  function openCheckout() {
    window.dispatchEvent(new CustomEvent('open-checkout'));
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl tablet:bottom-6 tablet:left-1/2 tablet:right-auto tablet:w-[430px] tablet:-translate-x-1/2 tablet:rounded-2xl tablet:border tablet:pb-0">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-3">
        {navigationTabs.map(({ id, labelKey, to, icon: Icon }) => {
          const active = pathname === to || (id === 'explore' && pathname === '/');
          const targetTo = lockedZone ? `${to}?zone=${lockedZone}` : to;

          return (
            <Link
              key={id}
              to={targetTo}
              className={[
                'flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 transition duration-200 ease-out active:scale-95',
                active ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <span className={active ? 'grid h-10 w-10 place-items-center rounded-full bg-teal-100 text-teal-600' : 'grid h-10 w-10 place-items-center rounded-full bg-transparent text-slate-400'}>
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={active ? 'text-[10px] font-black' : 'text-[10px] font-semibold'}>{t(labelKey)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={openCheckout}
          className={[
            'flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 transition duration-200 ease-out active:scale-95',
            isPremium ? 'text-teal-600' : 'text-orange-500 hover:text-orange-600'
          ].join(' ')}
        >
          <span className={isPremium ? 'grid h-10 w-10 place-items-center rounded-full border border-teal-200 bg-teal-50 text-teal-600' : 'grid h-10 w-10 place-items-center rounded-full border border-orange-200 bg-orange-50 text-orange-500'}>
            <Crown size={22} strokeWidth={isPremium ? 2.5 : 2} />
          </span>
          <span className="text-[10px] font-black">{isPremium ? 'Premium' : t('unlock')}</span>
        </button>
      </div>
    </nav>
  );
}
