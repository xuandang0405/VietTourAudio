import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Building2, DollarSign, LayoutDashboard, LogOut, MapPin } from 'lucide-react';
import { vendorLogout } from '../api/vendorApi';
import { useVendorAuthStore } from '../store/vendorAuthStore';

export function VendorLayout() {
  const navigate = useNavigate();
  const user = useVendorAuthStore((state) => state.user);
  const clearSession = useVendorAuthStore((state) => state.clearSession);

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

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <aside className="flex w-72 shrink-0 flex-col bg-slate-950 text-white">
        <div className="border-b border-white/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">Vendor Portal</p>
          <h1 className="mt-3 text-2xl font-black text-white">VietTour Vendor</h1>
          <p className="mt-2 text-sm text-slate-400">Quản lý sạp, POI, doanh thu và ví vận hành.</p>
        </div>

        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-300">
              <Building2 size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{user?.vendorName ?? 'Vendor'}</p>
              <p className="truncate text-xs font-semibold text-slate-400">{user?.email ?? 'vendor@viettouraudio.vn'}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2 px-4 py-6">
          <NavLink
            to="/vendor"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                isActive ? 'bg-premium-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink
            to="/vendor/pois"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                isActive ? 'bg-premium-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <MapPin size={20} />
            Quản lý POI
          </NavLink>
          <NavLink
            to="/vendor/revenue"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                isActive ? 'bg-premium-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <DollarSign size={20} />
            Doanh thu
          </NavLink>
        </nav>
        
        <div className="p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-700"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
