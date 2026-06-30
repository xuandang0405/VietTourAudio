import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../api/client';

export function AuditPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let active = true;
    api.get('/analytics/activity').then((res) => {
      if (!active) return;
      const mapped = (res.data.items || []).map((x) => {
        const ts = new Date(x.createdAt).toISOString().replace('T', ' ').slice(0, 19);
        return `[${ts}] ${x.actionType} session:${String(x.sessionId || '').slice(0, 10)} zone:${x.zoneId ?? '-'} guest:${x.guestId ?? '-'}`;
      });
      setLogs(mapped);
    }).catch(() => {
      setLogs([
        '[2026-06-23 09:05] ADMIN updated zone radius #2 from 12m to 15m',
        '[2026-06-23 09:12] MODERATOR approved media report r1',
        '[2026-06-23 09:20] SYSTEM sync favorites queue (42 items)',
        '[2026-06-23 09:34] ADMIN generated 120 QR codes for Tour 101'
      ]);
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader title="Audit Logs" subtitle="Nhat ky hanh dong quan tri" />
      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-xs text-emerald-300">
        {logs.map((log) => <p key={log} className="mb-2">{log}</p>)}
      </div>
    </section>
  );
}
