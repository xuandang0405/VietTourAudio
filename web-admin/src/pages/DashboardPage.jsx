import { useEffect, useMemo, useState } from 'react';
import { KpiCard } from '../components/KpiCard';
import { PageHeader } from '../components/PageHeader';
import { StatChart } from '../components/StatChart';
import { chartData, dashboardStats } from '../utils/mockData';
import { fetchDashboard } from '../api/admin';

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    let active = true;
    fetchDashboard().then((data) => {
      if (!active) return;
      setDashboard(data.dashboard);
      setActivity(data.activity || []);
    });
    return () => { active = false; };
  }, []);

  const kpis = useMemo(() => {
    if (!dashboard) return dashboardStats;
    return [
      { label: 'Active Zones', value: dashboard.totalZones ?? 0, sub: 'from backend analytics' },
      { label: 'Narrations', value: dashboard.totalNarrations ?? 0, sub: 'all languages' },
      { label: 'Users Today', value: dashboard.todayActiveUsers ?? 0, sub: 'distinct sessions' },
      { label: 'QR Scans', value: dashboard.totalQRScans ?? 0, sub: 'all time' }
    ];
  }, [dashboard]);

  return (
    <section>
      <PageHeader title="Dashboard" subtitle="Overview tour, geofence, doanh thu, va hanh vi nguoi dung" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((s) => <KpiCard key={s.label} {...s} />)}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <StatChart data={chartData} />
        <div className="space-y-3 rounded-2xl border border-amber-100 bg-white p-4">
          <h3 className="font-bold text-slate-900">Activity Feed</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {(activity.length ? activity.slice(0, 4).map((item) => (
              <li key={item.id}>{item.actionType} - session {String(item.sessionId || '').slice(0, 10)}</li>
            )) : [
              <li key="f1">Vendor 12 uploaded narration for Zone #2</li>,
              <li key="f2">3 pending media reports need moderation</li>,
              <li key="f3">Heatmap spike detected at Nguyen Hue</li>,
              <li key="f4">Payment success ratio 84% in last 24h</li>
            ])}
          </ul>
        </div>
      </div>
    </section>
  );
}
