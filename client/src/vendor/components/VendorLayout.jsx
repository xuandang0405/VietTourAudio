import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Building2, CreditCard, DollarSign, LayoutDashboard, LogOut, MapPinned, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { vendorLogout } from '../api/vendorApi';
import { useVendorAuthStore } from '../store/vendorAuthStore';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useVendorStall } from '../api/vendorQueries';

export function VendorLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useVendorAuthStore((state) => state.user);
  const clearSession = useVendorAuthStore((state) => state.clearSession);
  const { data: stallData } = useVendorStall();
  
  const stalls = Array.isArray(stallData) ? stallData : (stallData?.stall ? [stallData.stall] : []);
  const primaryStall = stalls[0];
  const isPremium = primaryStall?.isPremium;
  const premiumExpiryDate = primaryStall?.premiumExpiryDate;
  const assignedZoneName = primaryStall?.assignedZoneName;
  const daysRemaining = premiumExpiryDate ? Math.ceil((new Date(premiumExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  async function handleLogout() {
    try {
      await vendorLogout();
    } catch {
      // Local logout still wins when the session has already expired.
    } finally {
      clearSession();
      navigate('/vendor/login', { replace: true });
    }
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
      isActive ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-600">{t('sidebar.vendor_portal')}</p>
          <h1 className="mt-3 text-xl font-black text-slate-900">VietTour Vendor</h1>
          <p className="mt-2 text-xs text-slate-500">{t('vendor.management_description', 'Quản lý sạp, nội dung TTS và ví tiền & thanh toán.')}</p>
        </div>

        <div className="border-b border-slate-100 px-4 py-5">
          <div className={`rounded-2xl p-4 transition-all duration-300 ${isPremium ? 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.65)] bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950 text-amber-100 animate-pulse' : 'border border-slate-200 bg-white text-slate-800'}`}>
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${isPremium ? 'bg-amber-400/20 text-amber-300' : 'bg-teal-50 text-teal-600'}`}>
                <Building2 size={20} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{user?.vendorName ?? 'Vendor'}</p>
                <p className={`truncate text-xs font-semibold ${isPremium ? 'text-amber-200/80' : 'text-slate-500'}`}>{user?.email ?? 'vendor@viettouraudio.vn'}</p>
              </div>
            </div>
            {isPremium && (
              <div className="mt-3 border-t border-amber-500/30 pt-2 flex items-center justify-between text-[11px] font-bold text-amber-200">
                <span>★ PREMIUM GOLD</span>
                <span>{daysRemaining > 0 ? `${daysRemaining} ngày` : 'Hết hạn hôm nay'}</span>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-6">
          <NavLink to="/vendor" end className={navLinkClass}>
            <LayoutDashboard size={20} />
            {t('sidebar.dashboard')}
          </NavLink>
          <NavLink to="/vendor/stall" className={navLinkClass}>
            <MapPinned size={20} />
            {t('sidebar.stall_poi_management', { defaultValue: 'Quản lý sạp hàng (POI)' })}
          </NavLink>
          <NavLink to="/vendor/finance" className={navLinkClass}>
            <DollarSign size={20} />
            {t('vendor.wallet_title', { defaultValue: 'Tài chính & Ví tiền' })}
          </NavLink>
          <NavLink to="/vendor/support" className={navLinkClass}>
            <HelpCircle size={20} />
            Hỗ trợ & Gửi Ticket
          </NavLink>
        </nav>
        
        <div className="p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut size={18} />
            {t('sidebar.logout')}
          </button>
        </div>
      </aside>
      
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-xs font-black text-white">
                {user?.vendorName?.slice(0, 2).toUpperCase() ?? 'VD'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{user?.vendorName ?? 'Vendor'}</p>
                <p className="text-xs font-semibold text-slate-500">{user?.email ?? 'vendor@viettouraudio.vn'}</p>
              </div>
            </div>
          </div>
        </header>

        {assignedZoneName && (
          <div className="bg-teal-50 border-b border-teal-200 px-6 py-2.5 text-sm font-bold text-teal-800 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            {t('vendor.assigned_zone_alert', { name: assignedZoneName, defaultValue: `Khu vực quản lý của bạn: ${assignedZoneName}` })}
          </div>
        )}

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
