import React from 'react';
import { Store, ShieldAlert, MapPin, DollarSign } from 'lucide-react';

const KPICard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      </div>
      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {subtext && (
      <div className="mt-4 flex items-center text-sm">
        <span className={trend === 'up' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {subtext}
        </span>
      </div>
    )}
  </div>
);

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="text-sm text-slate-500">
          Thứ Tư, 15/01/2025
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Vendor Active" 
          value="47" 
          subtext="↑ 3 mới hôm nay" 
          trend="up"
          icon={Store} 
        />
        <KPICard 
          title="Chờ duyệt" 
          value="12" 
          subtext="⚠️ Cần xử lý" 
          trend="down"
          icon={ShieldAlert} 
        />
        <KPICard 
          title="POI Active" 
          value="134" 
          subtext="↑ 8 mới hôm nay" 
          trend="up"
          icon={MapPin} 
        />
        <KPICard 
          title="Doanh thu hôm nay" 
          value="8.4M đ" 
          subtext="↑ 12% so với hôm qua" 
          trend="up"
          icon={DollarSign} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Lượt truy cập 30 ngày</h3>
          <div className="flex items-center justify-center h-[300px] text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            [Biểu đồ LineChart (Visits | QR Scans | Premium)]
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Top 5 sạp</h3>
            <div className="space-y-4">
              {['Bánh Mì Phượng', 'Lụa Hội An', 'Cao Lầu Bà Bé', 'Tour Xuồng', 'Đèn Lồng Trúc'].map((stall, i) => (
                <div key={stall} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-slate-400 font-medium">{i + 1}.</span>
                    <span className="font-medium text-slate-700">{stall}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
