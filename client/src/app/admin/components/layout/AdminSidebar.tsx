import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Store, ShieldCheck, MapPin, 
  DollarSign, Percent, CreditCard, Map, 
  ClipboardList, Users, LogOut 
} from 'lucide-react';
import { adminColors } from '../../styles/adminTokens';

const NAV_ITEMS = [
  {
    group: 'QUẢN LÝ',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', roles: ['SUPER_ADMIN','ADMIN','MODERATOR','FINANCE'] },
      { label: 'Nhà cung cấp', icon: Store, path: '/admin/vendors', roles: ['SUPER_ADMIN','ADMIN'], badge: 'pendingVendors' },
      { label: 'Kiểm duyệt', icon: ShieldCheck, path: '/admin/content', roles: ['SUPER_ADMIN','ADMIN','MODERATOR'], badge: 'pendingMedia' },
      { label: 'Điểm tham quan', icon: MapPin, path: '/admin/pois', roles: ['SUPER_ADMIN','ADMIN','MODERATOR'] },
    ]
  },
  {
    group: 'TÀI CHÍNH',
    items: [
      { label: 'Doanh thu', icon: DollarSign, path: '/admin/revenue', roles: ['SUPER_ADMIN','ADMIN','FINANCE'] },
      { label: 'Hoa hồng', icon: Percent, path: '/admin/commissions', roles: ['SUPER_ADMIN','ADMIN','FINANCE'] },
      { label: 'Gói dịch vụ', icon: CreditCard, path: '/admin/subscriptions', roles: ['SUPER_ADMIN','ADMIN'] },
    ]
  },
  {
    group: 'HỆ THỐNG',
    items: [
      { label: 'Bản đồ Geofence', icon: Map, path: '/admin/geofences', roles: ['SUPER_ADMIN','ADMIN'] },
      { label: 'Nhật ký', icon: ClipboardList, path: '/admin/audit-logs', roles: ['SUPER_ADMIN'] },
      { label: 'Quản lý Admin', icon: Users, path: '/admin/settings/users', roles: ['SUPER_ADMIN'] },
    ]
  }
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside 
      className="w-[240px] flex flex-col text-slate-300 transition-all duration-300"
      style={{ backgroundColor: adminColors.sidebar }}
    >
      <div className="h-16 flex items-center px-6 font-bold text-lg tracking-tight text-white border-b border-slate-800">
        VietTour Admin
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {NAV_ITEMS.map((group, idx) => (
          <div key={idx} className="mb-6">
            <div className="px-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.group}
            </div>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                      isActive 
                        ? 'bg-blue-600/10 text-blue-500 border-r-2 border-blue-500 font-medium' 
                        : 'hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};
