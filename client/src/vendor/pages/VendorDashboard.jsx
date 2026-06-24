import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Headphones, Users, MapPin, TrendingUp } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

const mockDailyData = [
  { name: '01/06', listeners: 120, visitors: 300 },
  { name: '02/06', listeners: 150, visitors: 320 },
  { name: '03/06', listeners: 180, visitors: 400 },
  { name: '04/06', listeners: 140, visitors: 280 },
  { name: '05/06', listeners: 200, visitors: 450 },
  { name: '06/06', listeners: 250, visitors: 500 },
  { name: '07/06', listeners: 210, visitors: 480 },
];

export function VendorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const response = await analyticsService.getStallOwnerDashboard();
        const data = response.data?.data ?? response.data;
        if (!cancelled) {
          setDashboard(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Không thể tải dữ liệu dashboard. Vui lòng đăng nhập hoặc thử lại.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const visits = dashboard?.VisitsToday ?? '...';
  const audioPlays = dashboard?.AudioPlaysToday ?? '...';
  const poiCount = dashboard?.ActivePois ?? dashboard?.TotalPois ?? '...';
  const revenue = dashboard?.RevenueToday != null ? `${dashboard.RevenueToday.toLocaleString('vi-VN')} đ` : '...';

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Tổng quan hoạt động của Sạp Đồ Cổ Chú Năm</p>
      </header>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard icon={<Users />} label="Lượt ghé thăm" value={loading ? '...' : visits} trend="+12%" />
        <KPICard icon={<Headphones />} label="Lượt nghe Audio" value={loading ? '...' : audioPlays} trend="+18%" color="text-premium-600" bg="bg-premium-50" />
        <KPICard icon={<MapPin />} label="Số lượng POI" value={loading ? '...' : poiCount} trend="Cố định" />
        <KPICard icon={<TrendingUp />} label="Doanh thu tạm tính" value={loading ? '...' : revenue} trend="+5%" color="text-green-600" bg="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Lượt Khách & Lượt Nghe (7 ngày)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDailyData}>
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
          <h3 className="text-lg font-bold text-slate-900 mb-6">Tương tác theo POI</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDailyData.slice(0, 5)}>
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
