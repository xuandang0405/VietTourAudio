import { Download, Calendar, ArrowUpRight } from 'lucide-react';

const mockTransactions = [
  { id: 'TX-1029', date: '10/06/2026', user: 'Guest_9281', amount: '12,000 đ', status: 'Hoàn thành' },
  { id: 'TX-1028', date: '09/06/2026', user: 'Guest_1120', amount: '15,000 đ', status: 'Hoàn thành' },
  { id: 'TX-1027', date: '09/06/2026', user: 'Guest_4432', amount: '12,000 đ', status: 'Hoàn thành' },
  { id: 'TX-1026', date: '08/06/2026', user: 'Guest_8891', amount: '20,000 đ', status: 'Hoàn thành' },
];

export function VendorRevenue() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Doanh thu chia sẻ</h2>
          <p className="text-slate-500 mt-1">Lịch sử doanh thu từ lượt nghe Premium.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition">
            <Calendar size={18} />
            Tháng 6, 2026
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition">
            <Download size={18} />
            Xuất báo cáo
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowUpRight size={64} />
          </div>
          <p className="text-sm font-semibold text-slate-500">Tổng doanh thu tháng này</p>
          <p className="text-3xl font-black text-slate-900 mt-2">1,250,000 đ</p>
          <p className="text-sm font-bold text-green-500 mt-2">+15% so với tháng trước</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-500">Số lượt nghe Premium</p>
          <p className="text-3xl font-black text-slate-900 mt-2">420</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-500">Chờ đối soát</p>
          <p className="text-3xl font-black text-premium-600 mt-2">350,000 đ</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Lịch sử giao dịch gần đây</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="p-4 font-bold">Mã Giao Dịch</th>
              <th className="p-4 font-bold">Thời gian</th>
              <th className="p-4 font-bold">Khách hàng</th>
              <th className="p-4 font-bold text-right">Số tiền nhận</th>
              <th className="p-4 font-bold text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((tx) => (
              <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="p-4 text-sm font-bold text-slate-900">{tx.id}</td>
                <td className="p-4 text-sm text-slate-500">{tx.date}</td>
                <td className="p-4 text-sm text-slate-600">{tx.user}</td>
                <td className="p-4 text-sm font-bold text-green-600 text-right">+{tx.amount}</td>
                <td className="p-4 text-center">
                  <span className="inline-flex px-2 py-1 rounded-md bg-green-50 text-green-600 text-xs font-bold">
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
