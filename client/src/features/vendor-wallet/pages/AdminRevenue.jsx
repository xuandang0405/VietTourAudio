import { Download, RefreshCcw, Repeat2, TrendingUp, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { exportRevenueCsv } from '../../../admin/api/adminApi';
import { useRevenueOverview, useRevenueTimeline } from '../../../admin/api/adminQueries';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { AdminStatCard } from '../../../admin/components/AdminStatCard';
import { downloadBlob, formatCurrency, formatDate, toNumber } from '../../../admin/utils/formatters';

const periods = [
  { label: 'Hôm nay', value: 'today' },
  { label: 'Tháng này', value: 'month' },
  { label: 'YTD', value: 'ytd' }
];

const providerColors = ['#3B82F6', '#22C55E', '#F97316', '#8B5CF6', '#14B8A6', '#64748B'];

export function AdminRevenue() {
  const [period, setPeriod] = useState('month');
  const params = useMemo(() => ({ period }), [period]);
  const overview = useRevenueOverview(params);
  const timeline = useRevenueTimeline(params);
  const chartRows = useMemo(() => buildTimeline(timeline.data ?? []), [timeline.data]);
  const providerRows = useMemo(() => (overview.data?.providers ?? []).map((item) => ({ name: item.provider, value: toNumber(item.amount) })), [overview.data]);

  async function handleExport() {
    const blob = await exportRevenueCsv(params);
    downloadBlob(blob, `viettour-revenue-${period}.csv`);
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Revenue"
        title="Doanh thu"
        description="Theo dõi doanh thu, top-up, MRR, renewals và xuất CSV theo kỳ."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                overview.refetch();
                timeline.refetch();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw size={17} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              <Download size={17} />
              Export CSV
            </button>
          </div>
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {periods.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={period === item.value ? 'shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white' : 'shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200'}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {overview.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {overview.error.response?.data?.error ?? 'Không tải được revenue overview.'}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="MRR" value={formatCurrency(overview.data?.mrr)} helper={`${overview.data?.activeSubscriptions ?? 0} subscription ACTIVE`} trend="up" tone="blue" icon={TrendingUp} />
        <AdminStatCard label="Total revenue" value={formatCurrency(overview.data?.totalRevenue)} helper="Payment PAID trong kỳ" trend="up" tone="green" icon={WalletCards} />
        <AdminStatCard label="Top-Ups" value={formatCurrency(overview.data?.totalTopUps)} helper="TopUpRequest APPROVED" trend="up" tone="indigo" icon={WalletCards} />
        <AdminStatCard label="Renewals" value={overview.data?.renewals ?? 0} helper="Subscription fee transactions" trend="up" tone="amber" icon={Repeat2} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-black text-slate-950">Timeline doanh thu</h2>
            <p className="text-sm font-semibold text-slate-500">Dữ liệu từ RevenueDaily</p>
          </div>
          <div className="h-[360px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows} margin={{ left: -10, right: 10, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="topUps" name="Top-Ups" stroke="#22C55E" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-slate-950">Provider mix</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Payment provider theo kỳ</p>
          <div className="mt-4 h-[260px]">
            {providerRows.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={providerRows} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                    {providerRows.map((entry, index) => (
                      <Cell key={entry.name} fill={providerColors[index % providerColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-500">Chưa có dữ liệu provider.</div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {providerRows.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: providerColors[index % providerColors.length] }} />
                  {entry.name}
                </span>
                <span className="font-black text-slate-950">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

function buildTimeline(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = String(row.date).slice(0, 10);
    const current = grouped.get(key) ?? { date: key, dateLabel: formatDate(key), revenue: 0, topUps: 0 };
    const amount = toNumber(row.totalAmount);

    if (row.source === 'TOP_UP') {
      current.topUps += amount;
    } else {
      current.revenue += amount;
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values());
}
