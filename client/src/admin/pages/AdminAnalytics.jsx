import { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { CircleDollarSign, MapPin, ShieldAlert, Store } from 'lucide-react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminStatCard } from '../components/AdminStatCard';
import { dashboardKpis, subscriptions, trafficSeries, vendors } from '../data/adminMockData';
import { AdminBadge } from '../components/AdminBadge';

const kpiIcons = [Store, ShieldAlert, MapPin, CircleDollarSign];

export function AdminAnalytics() {
  const pendingVendors = vendors.filter((vendor) => vendor.verificationStatus === 'PENDING');
  const overdueSubscriptions = subscriptions.filter((subscription) => subscription.status === 'OVERDUE');

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AdminPageHeader
        eyebrow="Tổng quan hệ thống"
        title="Dashboard vận hành"
        description="Theo dõi vendor, kiểm duyệt nội dung, geofence, doanh thu và trạng thái subscription trong một màn hình mật độ cao."
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map((kpi, index) => (
          <AdminStatCard key={kpi.label} {...kpi} icon={kpiIcons[index]} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_420px]">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Lưu lượng 7 ngày</h2>
              <p className="text-sm font-semibold text-slate-500">QR scans, GPS visits và lượt mua Premium</p>
            </div>
            <div className="flex gap-2 text-xs font-bold">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">QR</span>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">GPS</span>
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">Premium</span>
            </div>
          </div>
          <TrafficChart />
        </article>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-slate-950">Vendor chờ duyệt</h2>
            <div className="mt-4 space-y-3">
              {pendingVendors.map((vendor) => (
                <div key={vendor.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{vendor.businessName}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{vendor.ownerEmail}</p>
                    </div>
                    <AdminBadge status={vendor.verificationStatus} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
            <h2 className="text-base font-black text-orange-950">Subscription quá hạn</h2>
            <div className="mt-4 space-y-3">
              {overdueSubscriptions.map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/75 p-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{subscription.vendorName}</p>
                    <p className="text-xs font-semibold text-orange-700">Quá hạn {Math.abs(subscription.daysLeft)} ngày</p>
                  </div>
                  <AdminBadge status={subscription.status} />
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function TrafficChart() {
  const wrapperRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

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
    <div ref={wrapperRef} className="h-[320px] min-w-0 lg:h-[420px]">
      {size.width > 0 && size.height > 0 && (
        <AreaChart width={size.width} height={size.height} data={trafficSeries} margin={{ left: -14, right: 10, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="qrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gpsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} />
          <Tooltip
            contentStyle={{
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)'
            }}
          />
          <Area type="monotone" dataKey="qrScans" name="QR scans" stroke="#3B82F6" strokeWidth={3} fill="url(#qrGradient)" />
          <Area type="monotone" dataKey="gpsVisits" name="GPS visits" stroke="#22C55E" strokeWidth={3} fill="url(#gpsGradient)" />
          <Area type="monotone" dataKey="premium" name="Premium" stroke="#F97316" strokeWidth={3} fill="transparent" />
        </AreaChart>
      )}
    </div>
  );
}
