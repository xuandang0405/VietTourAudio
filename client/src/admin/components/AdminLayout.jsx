import { Outlet, NavLink } from 'react-router-dom';
import { BarChart3, Users, FileVideo, Map, LogOut } from 'lucide-react';

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <aside className="w-64 bg-teal-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6">
          <h1 className="text-xl font-black text-teal-300">VTA Admin</h1>
          <p className="text-sm text-teal-100/70 mt-1">Super Administrator</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                isActive ? 'bg-teal-700 text-white shadow-lg' : 'text-teal-100/70 hover:bg-teal-800'
              }`
            }
          >
            <BarChart3 size={20} />
            Analytics
          </NavLink>
          <NavLink
            to="/admin/vendors"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                isActive ? 'bg-teal-700 text-white shadow-lg' : 'text-teal-100/70 hover:bg-teal-800'
              }`
            }
          >
            <Users size={20} />
            Duyệt Sạp
          </NavLink>
          <NavLink
            to="/admin/content"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                isActive ? 'bg-teal-700 text-white shadow-lg' : 'text-teal-100/70 hover:bg-teal-800'
              }`
            }
          >
            <FileVideo size={20} />
            Kiểm duyệt Nội dung
          </NavLink>
          <NavLink
            to="/admin/geofences"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                isActive ? 'bg-teal-700 text-white shadow-lg' : 'text-teal-100/70 hover:bg-teal-800'
              }`
            }
          >
            <Map size={20} />
            Bản đồ Geofences
          </NavLink>
        </nav>
        
        <div className="p-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-3 text-sm font-bold text-teal-100 transition hover:bg-teal-700">
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
