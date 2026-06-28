import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';
import {
  CircleDollarSign, RefreshCcw, TrendingUp, Users, WalletCards,
  Clock, Wifi
} from 'lucide-react';
import { subscribeRealtime } from '../../../services/realtimeClient';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { AdminStatCard } from '../../../admin/components/AdminStatCard';
import { usePaymentRevenueStats } from '../../../admin/api/adminQueries';
import { formatCurrency } from '../../../admin/utils/formatters';

export function AdminRevenue() {
  const { data: stats, isLoading, refetch } = usePaymentRevenueStats();
  const [activeOnlineUsers, setActiveOnlineUsers] = useState(0);
  const [timePeriod, setTimePeriod] = useState('allTime');

  // Seed initial active users from the REST fallback
  useEffect(() => {
    if (stats?.activeUsers != null) {
      setActiveOnlineUsers(stats.activeUsers);
    }
  }, [stats]);

  // Subscribe to real-time active user count via SignalR
  useEffect(() => {
    const unsubscribeUsers = subscribeRealtime('UpdateActiveUsersCount', (liveCount) => {
      setActiveOnlineUsers(liveCount);
    });

    // Also auto-refresh financial stats when a payment is verified by admin
    const unsubscribeNotifications = subscribeRealtime('ReceiveNotification', (notification) => {
      if (notification?.type === 'PAYMENT_PROOF' || notification?.type === 'PAYMENT_APPROVED') {
        refetch();
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeNotifications();
    };
  }, [refetch]);

  const currentYear = new Date().getFullYear().toString();
  const currentMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${currentYear}`;

  const chartData = (stats?.chartData ?? [])
    .filter((item) => {
      if (timePeriod === 'thisYear') {
        return item.period.endsWith(currentYear);
      }
      if (timePeriod === 'thisMonth' || timePeriod === 'today') {
        return item.period === currentMonth;
      }
      return true; // allTime
    })
    .map((item) => ({
      period: item.period,
      tourist: Number(item.tourist ?? 0),
      vendor: Number(item.vendor ?? 0)
    }));

  const currentMetrics = stats?.[timePeriod] || { total: 0, tourist: 0, vendor: 0, count: 0 };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Revenue"
        title="Doanh thu hệ thống"
        description="Tổng quan tài chính và chỉ số hoạt động kinh doanh của toàn bộ nền tảng theo thời gian thực."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Làm mới
          </button>
        }
      />

      {/* Time Period Filter Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1 w-fit mb-6 border border-slate-200">
        {['today', 'thisMonth', 'thisYear', 'allTime'].map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => setTimePeriod(period)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition active:scale-[0.98] cursor-pointer ${
              timePeriod === period 
                ? 'bg-white text-teal-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {period === 'today' && 'Hôm nay'}
            {period === 'thisMonth' && 'Tháng này'}
            {period === 'thisYear' && 'Năm nay'}
            {period === 'allTime' && 'Từ trước đến nay'}
          </button>
        ))}
      </div>

      {/* KPI Cards Row */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng doanh thu"
          value={isLoading ? '—' : formatCurrency(currentMetrics.total)}
          helper="Tổng doanh thu hoàn tất đối soát"
          trend="up"
          tone="green"
          icon={CircleDollarSign}
        />
        <AdminStatCard
          label="Doanh thu khách du lịch"
          value={isLoading ? '—' : formatCurrency(currentMetrics.tourist)}
          helper="Doanh thu kích hoạt tài khoản Premium"
          trend="up"
          tone="blue"
          icon={TrendingUp}
        />
        <AdminStatCard
          label="Doanh thu nhà cung cấp"
          value={isLoading ? '—' : formatCurrency(currentMetrics.vendor)}
          helper="Doanh thu duy trì sạp hàng & dịch vụ"
          trend="up"
          tone="indigo"
          icon={WalletCards}
        />
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-500">Người online</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{activeOnlineUsers}</p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wifi size={21} />
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-slate-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Số lượng thiết bị đang truy cập thời gian thực
          </div>
        </article>
      </section>

      {/* Pending Transactions Banner */}
      {(stats?.pendingCount ?? 0) > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
              <Clock size={20} />
            </span>
            <div>
              <p className="text-sm font-black text-amber-800">
                {stats.pendingCount} giao dịch đang chờ duyệt
              </p>
              <p className="text-xs font-semibold text-amber-600">
                Các giao dịch PENDING cần Admin xác nhận minh chứng chuyển khoản.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Monthly Revenue Chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="mb-5">
          <h2 className="text-base font-black text-slate-950">Biểu đồ tăng trưởng doanh thu hệ thống</h2>
          <p className="text-sm font-semibold text-slate-500">
            Phân tách luồng tiền thu thập từ Tài khoản Khách tham quan và Đối tác cung cấp gói dịch vụ.
          </p>
        </div>

        {chartData.length > 0 ? (
          <div className="w-full h-[380px] min-w-0 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={chartData} margin={{ left: -10, right: 10, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)'
                  }}
                />
                <Bar dataKey="tourist" name="Khách du lịch" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="vendor" name="Nhà cung cấp" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="grid h-[300px] place-items-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-500">
            {isLoading ? 'Đang tải dữ liệu...' : 'Chưa có giao dịch APPROVED nào trong hệ thống.'}
          </div>
        )}
      </section>
    </div>
  );
}
