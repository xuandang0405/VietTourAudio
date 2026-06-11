import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Activity, Map, Mic } from 'lucide-react';

const mockSystemData = [
  { name: 'T2', activeUsers: 1200, premiumUsers: 300 },
  { name: 'T3', activeUsers: 1500, premiumUsers: 420 },
  { name: 'T4', activeUsers: 1800, premiumUsers: 500 },
  { name: 'T5', activeUsers: 1400, premiumUsers: 380 },
  { name: 'T6', activeUsers: 2200, premiumUsers: 650 },
  { name: 'T7', activeUsers: 3500, premiumUsers: 1200 },
  { name: 'CN', activeUsers: 3800, premiumUsers: 1400 },
];

export function AdminAnalytics() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">System Analytics</h2>
        <p className="text-slate-500 mt-1">Thống kê toàn cục hệ thống VietTourAudio</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminCard icon={<Activity />} label="Người dùng Active" value="15.4K" trend="+24%" color="text-teal-600" bg="bg-teal-50" />
        <AdminCard icon={<ShieldCheck />} label="Premium Users" value="4.2K" trend="+32%" color="text-premium-600" bg="bg-premium-50" />
        <AdminCard icon={<Map />} label="Tổng số POI" value="128" trend="+12" color="text-blue-600" bg="bg-blue-50" />
        <AdminCard icon={<Mic />} label="Thời lượng Audio" value="45.5h" trend="+2.5h" color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Lưu lượng truy cập (Tuần qua)</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockSystemData}>
              <defs>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="activeUsers" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" name="Active Users" />
              <Area type="monotone" dataKey="premiumUsers" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorPremium)" name="Premium Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AdminCard({ icon, label, value, trend, color, bg }) {
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
