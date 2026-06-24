import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';

export function AppShell() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-20">
      <OfflineBanner />
      <main className="pt-10">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
