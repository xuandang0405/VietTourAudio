import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/PageHeader';
import { fetchSettings, upsertSetting } from '../api/admin';

export function SettingsPage() {
  const [api, setApi] = useState(import.meta.env.VITE_ADMIN_API_URL || '/api');
  const [socket, setSocket] = useState(import.meta.env.VITE_SOCKET_URL || '');

  useEffect(() => {
    let active = true;
    fetchSettings().then((items) => {
      if (!active) return;
      const map = Object.fromEntries((items || []).map((x) => [x.key, x.value]));
      if (map.API_URL) setApi(map.API_URL);
      if (map.SOCKET_URL) setSocket(map.SOCKET_URL);
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader title="System Settings" subtitle="Cau hinh endpoint va tham so van hanh" />
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block text-sm font-semibold text-slate-700">API URL</label>
        <input value={api} onChange={(e) => setApi(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
        <label className="block text-sm font-semibold text-slate-700">Socket URL</label>
        <input value={socket} onChange={(e) => setSocket(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
        <button
          type="button"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={async () => {
            try {
              await upsertSetting('API_URL', api);
              await upsertSetting('SOCKET_URL', socket);
              toast.success('Settings saved to backend');
            } catch (e) {
              toast.error(e.message);
            }
          }}
        >
          Save settings
        </button>
        <p className="text-xs text-slate-500">Luu y: Day la UI demo, gia tri env can set trong file .env cho production.</p>
      </div>
    </section>
  );
}
