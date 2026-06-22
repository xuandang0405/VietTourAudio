import { Menu, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-amber-100 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onMenu} className="rounded-lg border border-slate-200 p-2 lg:hidden">
          <Menu size={16} />
        </button>
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 sm:flex">
          <Search size={14} />
          <span>Search POI, user, payment...</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{user?.fullName || user?.email || 'Admin'}</p>
            <p className="text-xs text-slate-500">{user?.role || 'ADMIN'}</p>
          </div>
          <button type="button" onClick={logout} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Dang xuat</button>
        </div>
      </div>
    </header>
  );
}
