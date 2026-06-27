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
  Map,
  MapPinned,
  Menu,
  Settings,
  ShieldCheck,
  Store,
  UploadCloud,
  WalletCards,
  X,
  Mail
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
import { adminLogout } from '../api/adminApi';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminNotifications, markAdminNotificationRead } from '../api/adminApi';

const roles = {
  vendor: ['SUPER_ADMIN', 'ADMIN'],
  moderate: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
  finance: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'],
  geofence: ['SUPER_ADMIN', 'ADMIN'],
  system: ['SUPER_ADMIN', 'ADMIN']
};

const navGroups = [
  {
    labelKey: 'sidebar.group_management',
    items: [
      { labelKey: 'sidebar.dashboard', to: '/admin', icon: LayoutDashboard },
      { labelKey: 'sidebar.vendors', to: '/admin/vendors', icon: Store, roles: roles.vendor },
      { labelKey: 'sidebar.zones', to: '/admin/zones', icon: Map, roles: roles.vendor },
      { labelKey: 'sidebar.moderation', to: '/admin/content', icon: FileVideo, roles: roles.moderate },
      { labelKey: 'sidebar.poi_management', to: '/admin/pois', icon: MapPinned, roles: roles.vendor }
    ]
  },
  {
    labelKey: 'sidebar.group_finance',
    items: [
      { labelKey: 'sidebar.vendor_wallet', to: '/admin/vendor-accounts', icon: WalletCards, roles: roles.finance },
      { labelKey: 'sidebar.topups', to: '/admin/topup', icon: UploadCloud, roles: roles.finance },
      { labelKey: 'sidebar.revenue', to: '/admin/revenue/dashboard', icon: ChartNoAxesCombined, roles: roles.finance }
    ]
  },
  {
    labelKey: 'sidebar.group_system',
    items: [
      { labelKey: 'sidebar.geofences', to: '/admin/geofences', icon: ShieldCheck, roles: roles.geofence },
      { labelKey: 'sidebar.audit_logs', to: '/admin/audit-logs', icon: FileClock, roles: roles.system },
      { labelKey: 'sidebar.admin_users', to: '/admin/settings/users', icon: Settings, roles: roles.system },
      { labelKey: 'sidebar.tickets', to: '/admin/tickets', icon: Mail, roles: roles.system }
    ]
  }
];

const breadcrumbByPath = {
  '/admin': ['Admin', 'Dashboard'],
  '/admin/vendors': ['Admin', 'Nhà cung cấp'],
  '/admin/zones': ['Admin', 'Khu vực'],
  '/admin/content': ['Admin', 'Kiểm duyệt'],
  '/admin/pois': ['Admin', 'Điểm tham quan'],
  '/admin/vendor-accounts': ['Admin', 'Ví vendor'],
  '/admin/topup': ['Admin', 'Top-Ups'],
  '/admin/revenue': ['Admin', 'Doanh thu'],
  '/admin/revenue/dashboard': ['Admin', 'Doanh thu'],
  '/admin/geofences': ['Admin', 'Geofences'],
  '/admin/audit-logs': ['Admin', 'Nhật ký'],
  '/admin/settings/users': ['Admin', 'Admin users'],
  '/admin/tickets': ['Admin', 'Hộp thư hỗ trợ']
};

const crumbTranslationKeys = {
  'Admin': 'sidebar.admin_portal',
  'Dashboard': 'sidebar.dashboard',
  'Nhà cung cấp': 'sidebar.vendors',
  'Khu vực': 'sidebar.zones',
  'Kiểm duyệt': 'sidebar.moderation',
  'Điểm tham quan': 'sidebar.poi_management',
  'Ví vendor': 'sidebar.vendor_wallet',
  'Top-Ups': 'sidebar.topups',
  'Doanh thu': 'sidebar.revenue',
  'Geofences': 'sidebar.geofences',
  'Nhật ký': 'sidebar.audit_logs',
  'Admin users': 'sidebar.admin_users',
  'Chi tiết': 'common.detail',
  'Hộp thư hỗ trợ': 'sidebar.tickets'
};

const getBreadcrumbUrl = (crumb, currentPathname) => {
  switch (crumb) {
    case 'Admin':
    case 'Dashboard':
      return '/admin';
    case 'Nhà cung cấp':
      return '/admin/vendors';
    case 'Khu vực':
      return '/admin/zones';
    case 'Kiểm duyệt':
      return '/admin/content';
    case 'Điểm tham quan':
      return '/admin/pois';
    case 'Ví vendor':
      return '/admin/vendor-accounts';
    case 'Top-Ups':
      return '/admin/topup';
    case 'Doanh thu':
      return '/admin/revenue/dashboard';
    case 'Geofences':
      return '/admin/geofences';
    case 'Nhật ký':
      return '/admin/audit-logs';
    case 'Admin users':
      return '/admin/settings/users';
    case 'Hộp thư hỗ trợ':
      return '/admin/tickets';
    case 'Chi tiết':
      return currentPathname;
    default:
      return '/admin';
  }
};


export function AdminLayout() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAdminAuthStore((state) => state.user);
  const clearSession = useAdminAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: fetchAdminNotifications,
    refetchInterval: 60000
  });
  const unreadCount = notifications.filter((item) => !item.isRead).length;

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
    <div className="admin-shell flex h-screen w-full overflow-hidden bg-slate-50 text-slate-950">
      <aside className="hidden h-full shrink-0 border-r border-slate-800 bg-slate-950 text-white md:flex md:w-20 md:flex-col lg:w-64">
        <SidebarContent userRole={user?.role} onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} />
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[1800] md:hidden">
            <motion.button
              type="button"
              aria-label={t('close')}
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
                aria-label={t('close')}
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
                  <Link
                    to={getBreadcrumbUrl(crumb, location.pathname)}
                    className={index === breadcrumbs.length - 1 ? 'max-w-[180px] truncate text-slate-950 hover:underline' : 'hidden text-slate-500 hover:underline md:inline'}
                  >
                    {t(crumbTranslationKeys[crumb] ?? crumb)}
                  </Link>
                  {index < breadcrumbs.length - 1 && <ChevronRight className="hidden text-slate-300 md:block" size={16} />}
                </span>
              ))}
            </div>
            <div className="sm:hidden">
              <p className="text-sm font-black text-slate-950">{t(crumbTranslationKeys[breadcrumbs[breadcrumbs.length - 1]] ?? breadcrumbs[breadcrumbs.length - 1])}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition duration-200 ease-out hover:bg-slate-50"
                aria-label="Thông báo"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 origin-top-right"
                    >
                      <h3 className="text-sm font-black text-slate-900 mb-2">
                        {t('admin.notifications.title', { defaultValue: 'Thông báo' })}
                      </h3>
                      <div className="border-t border-slate-100 my-2"></div>
                      {notifications.length === 0 ? (
                        <p className="py-6 text-center text-xs font-semibold text-slate-400">
                          {t('admin.notifications.empty')}
                        </p>
                      ) : (
                        <div className="max-h-80 space-y-2 overflow-y-auto">
                          {notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={async () => {
                                if (!item.isRead) {
                                  await markAdminNotificationRead(item.id);
                                  queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
                                }
                              }}
                              className={`w-full rounded-xl p-3 text-left transition hover:bg-slate-50 ${item.isRead ? 'bg-white' : 'bg-blue-50'}`}
                            >
                              <p className="text-xs font-black text-slate-900">{item.title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-600">{item.message}</p>
                              {item.vendorName && <p className="mt-1 text-[10px] font-bold text-slate-400">{item.vendorName}</p>}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
  const { t } = useTranslation();
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
          <div key={group.labelKey}>
            <p className={forceLabels ? 'mb-2 px-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500' : 'mb-2 hidden px-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 lg:block'}>
              {t(group.labelKey)}
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
                  <span className={forceLabels ? 'truncate' : 'hidden truncate lg:inline'}>{t(item.labelKey)}</span>
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
          <span className={forceLabels ? '' : 'hidden lg:inline'}>{t('sidebar.logout')}</span>
        </button>
      </div>
    </div>
  );
}
