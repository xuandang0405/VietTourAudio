import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#fefaf5]">
      <Sidebar />
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setOpen(false)} role="presentation">
          <div className="h-full w-72 bg-white p-3" onClick={(e) => e.stopPropagation()} role="presentation">
            <Sidebar mobile />
          </div>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <Topbar onMenu={() => setOpen((v) => !v)} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
