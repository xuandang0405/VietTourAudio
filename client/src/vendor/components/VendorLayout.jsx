import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, DollarSign, LogOut } from 'lucide-react';

export function VendorLayout() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-black text-premium-400">VietTour Vendor</h1>
          <p className="text-sm text-slate-400 mt-1">Quản lý Sạp & Audio</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
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
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-700">
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
