import { Check, X, Play, Image as ImageIcon } from 'lucide-react';
import { visitorPois } from '../../data/visitorPois';

export function AdminContent() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">Kiểm duyệt Nội dung</h2>
        <p className="text-slate-500 mt-1">Kiểm tra âm thanh, hình ảnh và text từ các sạp.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visitorPois.slice(0, 6).map((poi) => (
          <div key={poi.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="relative h-48 bg-slate-100">
              <img src={poi.image} alt={poi.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {poi.id}
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-slate-900 text-lg leading-tight">{poi.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{poi.category} • {poi.duration}</p>
              
              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600 line-clamp-3">
                {poi.description}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-bold flex justify-center items-center gap-2 transition">
                  <Play size={16} /> Nghe thử
                </button>
              </div>
              
              <div className="mt-auto pt-6 flex gap-3">
                <button className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition border border-green-200">
                  <Check size={18} /> Duyệt
                </button>
                <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition border border-red-200">
                  <X size={18} /> Từ chối
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
