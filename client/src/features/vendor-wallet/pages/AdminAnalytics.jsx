import { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { CircleDollarSign, Headphones, MapPin, QrCode, Store, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { AdminStatCard } from '../../../admin/components/AdminStatCard';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { useHourlyActiveUsers, useDashboardAnalytics } from '../../../admin/api/adminQueries';
import { formatCurrency } from '../../../admin/utils/formatters';
import { subscribeRealtime } from '../../../services/realtimeClient';

export function AdminAnalytics() {
  const { t } = useTranslation();
  const { data: dashboard, isLoading: dashLoading } = useDashboardAnalytics();

  const kpis = dashboard?.kpis;

  const kpiCards = [
    {
      label: t('dashboard.kpi.vendor_active'),
      value: kpis ? String(kpis.activeVendors) : '—',
      helper: kpis ? t('dashboard.kpi.new_today', { count: kpis.pendingVendors }) : '',
      trend: 'up',
      tone: 'blue',
      icon: Store
    },
    {
      label: t('dashboard.kpi.pending_approval'),
      value: kpis ? String(kpis.pendingVendors) : '—',
      helper: t('dashboard.kpi.needs_processing'),
      trend: kpis?.pendingVendors > 0 ? 'warning' : 'up',
      tone: 'amber',
      icon: Users
    },
    {
      label: t('dashboard.kpi.poi_active'),
      value: kpis ? String(kpis.activePois) : '—',
      helper: kpis ? `${kpis.totalScans} lượt quét tổng` : '',
      trend: 'up',
      tone: 'green',
      icon: MapPin
    },
    {
      label: t('dashboard.kpi.mrr'),
      value: kpis ? formatCurrency(kpis.totalRevenue) : '—',
      helper: t('dashboard.kpi.vs_last_period', { percent: 0 }),
      trend: 'up',
      tone: 'indigo',
      icon: CircleDollarSign
    }
  ];

  const tourColumns = [
    {
      key: 'tourName',
      label: 'Khu vực',
      render: (row) => (
        <div>
          <p className="font-black text-slate-950">{row.tourName}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{row.tourSlug}</p>
        </div>
      )
    },
    {
      key: 'tourStatus',
      label: t('common.status'),
      render: (row) => <AdminBadge status={row.tourStatus} />
    },
    {
      key: 'poiCount',
      label: 'POI',
      render: (row) => (
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{row.poiCount}</span>
      )
    },
    {
      key: 'scanCount',
      label: 'Lượt quét QR',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <QrCode size={14} className="text-slate-400" />
          <span className="font-black text-slate-950">{row.scanCount}</span>
        </div>
      )
    }
  ];

  const poiColumns = [
    {
      key: 'poiName',
      label: 'Điểm tham quan (POI)',
      render: (row) => (
        <div>
          <p className="font-black text-slate-950">{row.poiName}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{row.stallName || '—'}</p>
        </div>
      )
    },
    {
      key: 'tourName',
      label: 'Thuộc Khu vực',
      render: (row) => (
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
          {row.tourName || '—'}
        </span>
      )
    },
    {
      key: 'poiStatus',
      label: t('common.status'),
      render: (row) => <AdminBadge status={row.poiStatus} />
    },
    {
      key: 'playCount',
      label: 'Lượt nghe Audio',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Headphones size={14} className="text-emerald-500" />
          <span className="font-black text-slate-950">{row.playCount}</span>
        </div>
      )
    },
    {
      key: 'visitCount',
      label: 'Lượt ghé thăm',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-blue-500" />
          <span className="font-black text-slate-950">{row.visitCount}</span>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AdminPageHeader
        eyebrow={t('sidebar.dashboard')}
        title={t('dashboard.title')}
        description={t('dashboard.subtitle')}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => (
          <AdminStatCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_420px]">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">{t('dashboard.realtime_traffic')}</h2>
              <p className="text-sm font-semibold text-slate-500">{t('dashboard.active_users_now')}</p>
            </div>
            <div className="flex gap-2 text-xs font-bold">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{t('dashboard.updated_just_now')}</span>
            </div>
          </div>
          <TrafficChart t={t} />
        </article>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <QrCode size={18} className="text-blue-600" />
              <h2 className="text-base font-black text-slate-950">Thống kê Khu vực (Tour)</h2>
            </div>
            <AdminDataTable
              columns={tourColumns}
              rows={dashboard?.tourStats ?? []}
              emptyText={dashLoading ? t('common.loading') : 'Chưa có dữ liệu khu vực'}
            />
          </article>
        </aside>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Headphones size={18} className="text-emerald-600" />
          <h2 className="text-base font-black text-slate-950">Thống kê chi tiết POI</h2>
        </div>
        <AdminDataTable
          columns={poiColumns}
          rows={dashboard?.poiStats ?? []}
          emptyText={dashLoading ? t('common.loading') : 'Chưa có dữ liệu POI'}
        />
      </section>
    </div>
  );
}

function TrafficChart({ t }) {
  const wrapperRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { data, isLoading } = useHourlyActiveUsers();
  const chartData = data?.points?.length ? data.points : [];
  const activeUsersNow = Number(data?.activeUsersNow ?? 0);
  const [presence, setPresence] = useState({ totalActive: activeUsersNow, byZone: {} });

  useEffect(() => {
    setPresence((current) => ({ ...current, totalActive: activeUsersNow }));
  }, [activeUsersNow]);

  useEffect(() => subscribeRealtime('PresenceUpdated', (snapshot) => {
    setPresence({
      totalActive: Number(snapshot?.totalActive ?? 0),
      byZone: snapshot?.byZone ?? {}
    });
  }), []);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);

      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-[320px] min-w-0 lg:h-[420px]">
      <div className="absolute right-2 top-1 z-10 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-right shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{t('dashboard.active_users_now')}</p>
        <p className="text-xl font-black text-slate-950">{presence.totalActive}</p>
      </div>
      <div className="absolute bottom-2 left-2 z-10 max-w-[70%] rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm">
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Theo khu vực</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(presence.byZone).map(([zone, count]) => (
            <span key={zone} className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
              {zone}: {count}
            </span>
          ))}
          {Object.keys(presence.byZone).length === 0 && (
            <span className="text-[11px] font-semibold text-slate-400">Chưa có khách trong khu vực</span>
          )}
        </div>
      </div>
      {size.width > 0 && size.height > 0 && (
        <AreaChart width={size.width} height={size.height} data={chartData} margin={{ left: -14, right: 10, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="qrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} />
          <Tooltip
            contentStyle={{
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)'
            }}
          />
          <Area
            type="monotone"
            dataKey="activeUsers"
            name={isLoading ? t('common.loading') : t('dashboard.active_users_now')}
            stroke="#3B82F6"
            strokeWidth={3}
            fill="url(#qrGradient)"
          />
        </AreaChart>
      )}
    </div>
  );
}
