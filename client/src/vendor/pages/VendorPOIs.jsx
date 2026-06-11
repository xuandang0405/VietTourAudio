import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import { visitorPois } from '../../data/visitorPois';

export function VendorPOIs() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Quản lý POI & Audio</h2>
          <p className="text-slate-500 mt-1">Danh sách các điểm thuyết minh của bạn.</p>
        </div>
        <button className="bg-premium-600 hover:bg-premium-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition">
          <Plus size={18} />
          Thêm POI mới
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm POI..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-premium-500"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="p-4 font-bold w-16">ID</th>
              <th className="p-4 font-bold">Hình ảnh & Tên</th>
              <th className="p-4 font-bold">Thể loại</th>
              <th className="p-4 font-bold text-center">Trạng thái</th>
              <th className="p-4 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visitorPois.slice(0, 5).map((poi) => (
              <tr key={poi.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="p-4 text-slate-400 text-sm font-mono">{poi.id.split('-')[1]}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={poi.image} alt={poi.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{poi.title}</p>
                      <p className="text-xs text-slate-500">{poi.duration}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-600">{poi.category}</td>
                <td className="p-4 text-center">
                  <span className="inline-flex px-2 py-1 rounded-md bg-green-50 text-green-600 text-xs font-bold">
                    Active
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-premium-600 transition bg-slate-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 transition bg-slate-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
