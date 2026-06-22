import { BarChart3, CreditCard, FileAudio, Landmark, LayoutDashboard, MapPinned, QrCode, ScrollText, Settings, ShieldCheck, UserCog, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pois', icon: MapPinned, label: 'POI & Zones' },
  { to: '/tours', icon: Landmark, label: 'Tours' },
  { to: '/narrations', icon: FileAudio, label: 'Narrations' },
  { to: '/qrs', icon: QrCode, label: 'QR Management' },
  { to: '/vendors', icon: UserCog, label: 'Vendors' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/media', icon: ShieldCheck, label: 'Media Moderation' },
  { to: '/audit', icon: ScrollText, label: 'Audit Logs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/heatmap', icon: BarChart3, label: 'Heatmap' }
];

export function Sidebar({ mobile = false }) {
  return (
    <aside className={`${mobile ? 'block' : 'hidden lg:block'} w-72 shrink-0 border-r border-amber-100 bg-white`}>
      <div className="border-b border-amber-100 p-5">
        <h1 className="text-lg font-black tracking-tight text-amber-900">VietTourAudio Admin</h1>
        <p className="text-xs text-amber-700">Operations Control Center</p>
      </div>
      <nav className="space-y-1 p-3">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-amber-100 font-semibold text-amber-900' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
