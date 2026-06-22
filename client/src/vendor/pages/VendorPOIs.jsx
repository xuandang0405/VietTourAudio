import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useVendorPois } from '../api/vendorQueries';

export function VendorPOIs() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useVendorPois();
  const pois = data?.pois ?? [];
  const filteredPois = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return pois;
    }

    return pois.filter((poi) =>
      [poi.name, poi.slug, poi.stallName, poi.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [pois, search]);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Quản lý POI & Audio</h2>
          <p className="text-slate-500 mt-1">Danh sách các điểm thuyết minh đang hoạt động trong vendor portal.</p>
        </div>
        <button type="button" disabled className="cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 font-bold text-slate-500 flex items-center gap-2">
          <Plus size={18} />
          Sắp mở tạo POI
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error.response?.data?.error ?? 'Không tải được danh sách POI vendor.'}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm POI..." 
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-premium-500"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="p-4 font-bold w-16">ID</th>
              <th className="p-4 font-bold">POI</th>
              <th className="p-4 font-bold">Sạp</th>
              <th className="p-4 font-bold text-center">Ngôn ngữ</th>
              <th className="p-4 font-bold text-center">Lượt nghe</th>
              <th className="p-4 font-bold text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredPois.map((poi) => (
              <tr key={poi.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="p-4 text-slate-400 text-sm font-mono">#{poi.id}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {poi.imageUrl ? (
                      <img src={poi.imageUrl} alt={poi.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-sm font-black text-slate-500">
                        {poi.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{poi.name}</p>
                      <p className="text-xs text-slate-500">{poi.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-600">{poi.stallName}</td>
                <td className="p-4 text-center text-sm font-bold text-slate-700">{poi.languageCount}</td>
                <td className="p-4 text-center text-sm font-bold text-slate-700">{poi.audioPlays}</td>
                <td className="p-4 text-center">
                  <span className={poi.status === 'ACTIVE' ? 'inline-flex px-2 py-1 rounded-md bg-green-50 text-green-600 text-xs font-bold' : 'inline-flex px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold'}>
                    {poi.status}
                  </span>
                  {poi.isPremiumContent && (
                    <span className="ml-2 inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                      Premium
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && filteredPois.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm font-semibold text-slate-500">
                  Không tìm thấy POI phù hợp.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm font-semibold text-slate-500">
                  Đang tải danh sách POI...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
