import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileClock,
  FileVideo,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Settings,
  ShieldCheck,
  Store,
  UploadCloud,
  WalletCards,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
import { adminLogout } from '../api/adminApi';
import { useAdminAuthStore } from '../store/adminAuthStore';

const roles = {
  vendor: ['SUPER_ADMIN', 'ADMIN'],
  moderate: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
  finance: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'],
  geofence: ['SUPER_ADMIN', 'ADMIN'],
  system: ['SUPER_ADMIN', 'ADMIN']
};

const navGroups = [
  {
    label: 'Quản lý',
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
      { label: 'Nhà cung cấp', to: '/admin/vendors', icon: Store, roles: roles.vendor },
      { label: 'Kiểm duyệt', to: '/admin/content', icon: FileVideo, roles: roles.moderate },
      { label: 'Điểm tham quan', to: '/admin/pois', icon: MapPinned, roles: roles.vendor }
    ]
  },
  {
    label: 'Tài chính',
    items: [
      { label: 'Ví vendor', to: '/admin/vendor-accounts', icon: WalletCards, roles: roles.finance },
      { label: 'Top-Ups', to: '/admin/topup', icon: UploadCloud, roles: roles.finance },
      { label: 'Doanh thu', to: '/admin/revenue/dashboard', icon: ChartNoAxesCombined, roles: roles.finance }
    ]
  },
  {
    label: 'Hệ thống',
    items: [
      { label: 'Geofences', to: '/admin/geofences', icon: ShieldCheck, roles: roles.geofence },
      { label: 'Nhật ký', to: '/admin/audit-logs', icon: FileClock, roles: roles.system },
      { label: 'Admin users', to: '/admin/settings/users', icon: Settings, roles: roles.system }
    ]
  }
];

const breadcrumbByPath = {
  '/admin': ['Admin', 'Dashboard'],
  '/admin/vendors': ['Admin', 'Nhà cung cấp'],
  '/admin/content': ['Admin', 'Kiểm duyệt'],
  '/admin/pois': ['Admin', 'Điểm tham quan'],
  '/admin/vendor-accounts': ['Admin', 'Ví vendor'],
  '/admin/topup': ['Admin', 'Top-Ups'],
  '/admin/revenue': ['Admin', 'Doanh thu'],
  '/admin/revenue/dashboard': ['Admin', 'Doanh thu'],
  '/admin/geofences': ['Admin', 'Geofences'],
  '/admin/audit-logs': ['Admin', 'Nhật ký'],
  '/admin/settings/users': ['Admin', 'Admin users']
};

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAdminAuthStore((state) => state.user);
  const clearSession = useAdminAuthStore((state) => state.clearSession);

  const breadcrumbs = useMemo(() => {
    if (location.pathname.startsWith('/admin/vendors/')) return ['Admin', 'Nhà cung cấp', 'Chi tiết'];
    return breadcrumbByPath[location.pathname] ?? ['Admin'];
  }, [location.pathname]);

  async function handleLogout() {
    try {
      await adminLogout();
    } catch {
      // Local logout still wins when the token has already expired.
    } finally {
      clearSession();
      navigate('/admin/login', { replace: true });
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-950">
      <aside className="hidden h-full shrink-0 border-r border-slate-800 bg-slate-950 text-white md:flex md:w-20 md:flex-col lg:w-64">
        <SidebarContent userRole={user?.role} onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} />
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[1800] md:hidden">
            <motion.button
              type="button"
              aria-label="Đóng menu"
              className="absolute inset-0 bg-slate-950/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative h-full w-[280px] bg-slate-950 text-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
                aria-label="Đóng menu"
              >
                <X size={18} />
              </button>
              <SidebarContent userRole={user?.role} onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} forceLabels />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:h-18 md:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition duration-200 ease-out hover:bg-slate-50 md:hidden"
              aria-label="Mở menu"
            >
              <Menu size={19} />
            </button>
            <div className="hidden items-center gap-2 text-sm font-bold text-slate-500 sm:flex">
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb}-${index}`} className="flex items-center gap-2">
                  <span className={index === breadcrumbs.length - 1 ? 'max-w-[180px] truncate text-slate-950' : 'hidden text-slate-500 md:inline'}>
                    {crumb}
                  </span>
                  {index < breadcrumbs.length - 1 && <ChevronRight className="hidden text-slate-300 md:block" size={16} />}
                </span>
              ))}
            </div>
            <div className="sm:hidden">
              <p className="text-sm font-black text-slate-950">{breadcrumbs[breadcrumbs.length - 1]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition duration-200 ease-out hover:bg-slate-50"
              aria-label="Thông báo"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
            </button>
            <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 lg:flex">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-xs font-black text-white">
                {user?.displayName?.slice(0, 2).toUpperCase() ?? 'AD'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{user?.displayName ?? 'Admin'}</p>
                <p className="text-xs font-semibold text-slate-500">{user?.role ?? 'ADMIN'}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ userRole, onNavigate, onLogout, forceLabels = false }) {
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(userRole))
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 px-4 lg:px-5">
        <img className="h-10 w-10 rounded-xl" src={logo} alt="VietTourAudio logo" loading="lazy" decoding="async" />
        <img className={forceLabels ? 'h-8 w-36 object-contain lg:block' : 'hidden h-8 w-36 object-contain lg:block'} src={logoText} alt="VietTourAudio" loading="lazy" decoding="async" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 hide-scrollbar">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className={forceLabels ? 'mb-2 px-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500' : 'mb-2 hidden px-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 lg:block'}>
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    [
                      'group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition duration-200 ease-out',
                      isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    ].join(' ')
                  }
                >
                  <item.icon className="shrink-0" size={19} />
                  <span className={forceLabels ? 'truncate' : 'hidden truncate lg:inline'}>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl bg-white/10 px-3 text-sm font-bold text-slate-200 transition duration-200 ease-out hover:bg-white/15"
        >
          <LogOut size={18} />
          <span className={forceLabels ? '' : 'hidden lg:inline'}>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
