import { Check, X, Search, FileText } from 'lucide-react';

const mockVendors = [
  { id: 'V-891', name: 'Sạp Đồ Cổ Chú Năm', owner: 'Nguyễn Văn Năm', date: '10/06/2026', status: 'Chờ duyệt', documents: 'GPKD_891.pdf' },
  { id: 'V-890', name: 'Bánh Mì Phượng', owner: 'Trần Thị Phượng', date: '09/06/2026', status: 'Chờ duyệt', documents: 'GPKD_890.pdf' },
  { id: 'V-889', name: 'Trà Mót Hội An', owner: 'Lê Thế Mót', date: '08/06/2026', status: 'Đã duyệt', documents: 'GPKD_889.pdf' },
  { id: 'V-888', name: 'Cơm Gà Bà Buội', owner: 'Phạm Thị Buội', date: '07/06/2026', status: 'Đã duyệt', documents: 'GPKD_888.pdf' },
];

export function AdminVendors() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">Quản lý & Duyệt Sạp</h2>
        <p className="text-slate-500 mt-1">Hệ thống xét duyệt đối tác nội dung</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sạp hoặc đối tác..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="p-4 font-bold">Mã Sạp</th>
              <th className="p-4 font-bold">Tên Cửa hàng</th>
              <th className="p-4 font-bold">Người đại diện</th>
              <th className="p-4 font-bold">Ngày đăng ký</th>
              <th className="p-4 font-bold text-center">Giấy tờ</th>
              <th className="p-4 font-bold text-center">Trạng thái</th>
              <th className="p-4 font-bold text-right">Duyệt</th>
            </tr>
          </thead>
          <tbody>
            {mockVendors.map((vendor) => (
              <tr key={vendor.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="p-4 text-sm font-bold text-slate-900">{vendor.id}</td>
                <td className="p-4 text-sm font-semibold text-slate-700">{vendor.name}</td>
                <td className="p-4 text-sm text-slate-600">{vendor.owner}</td>
                <td className="p-4 text-sm text-slate-500">{vendor.date}</td>
                <td className="p-4 text-center">
                  <button className="inline-flex p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                    <FileText size={16} />
                  </button>
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                    vendor.status === 'Đã duyệt' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {vendor.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {vendor.status === 'Chờ duyệt' ? (
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-green-600 hover:bg-green-50 transition bg-white border border-green-200 rounded-lg">
                        <Check size={16} />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 transition bg-white border border-red-200 rounded-lg">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Đã xử lý</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
