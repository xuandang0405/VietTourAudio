import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Headphones, MapPin, QrCode, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '../../admin/utils/formatters';
import { useVendorDashboard } from '../api/vendorQueries';

export function VendorDashboard() {
  const { data, isLoading, error } = useVendorDashboard();
  const dailyData = (data?.daily ?? []).map((row) => ({
    name: formatDate(row.date),
    listeners: row.audioPlays,
    visitors: row.visitors,
    revenue: Number(row.revenue ?? 0)
  }));
  const topPoiData = (data?.topPois ?? []).map((poi) => ({
    name: poi.name,
    listeners: poi.audioPlays,
    visits: poi.visits
  }));

  if (isLoading) {
    return <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">Đang tải dashboard vendor...</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-700">{error.response?.data?.error ?? 'Không tải được dashboard vendor.'}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Tổng quan hoạt động của {data?.vendor?.businessName ?? 'vendor của bạn'}.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard icon={<QrCode />} label="QR scans" value={String(data?.metrics?.totalQrScans ?? 0)} trend={`${data?.metrics?.totalUniqueVisitors ?? 0} khách`} />
        <KPICard icon={<Headphones />} label="Lượt nghe Audio" value={String(data?.metrics?.totalAudioPlays ?? 0)} trend={`${data?.metrics?.totalPremiumConversions ?? 0} premium`} color="text-premium-600" bg="bg-premium-50" />
        <KPICard icon={<MapPin />} label="Số lượng POI" value={String(data?.metrics?.totalPois ?? 0)} trend={`${data?.metrics?.totalVisits ?? 0} lượt ghé`} />
        <KPICard icon={<TrendingUp />} label="Doanh thu" value={formatCurrency(data?.metrics?.totalRevenue)} trend={data?.vendor?.subscriptionPlan ?? 'Không có gói'} color="text-green-600" bg="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Lượt khách và lượt nghe</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="visitors" stroke="#94A3B8" strokeWidth={3} dot={{ r: 4 }} name="Ghé thăm" />
                <Line type="monotone" dataKey="listeners" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} name="Nghe Audio" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">POI nổi bật</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPoiData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="listeners" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Lượt nghe" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, trend, color = "text-slate-600", bg = "bg-slate-50" }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-green-500 bg-green-50 px-2.5 py-1 rounded-full">{trend}</span>
      </div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}
