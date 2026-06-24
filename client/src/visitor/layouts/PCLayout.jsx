import { SatelliteDish, Home, Map as MapIcon, Bookmark, Globe, Crown, Headphones, Lock, Play, Pause, Volume2, MapPin } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import { DevGpsPanel } from '../../features/geofence-audio/components/DevGpsPanel';
import { LeafletMap } from '../../features/poi/components/LeafletMap';
import { PoiBottomSheet } from '../../features/poi/components/PoiBottomSheet';
import { useLanguageStore, languages } from '../../stores/languageStore';
import { usePremiumStore } from '../../features/vendor-wallet/stores/premiumStore';
import { useAudioStore } from '../../features/geofence-audio/stores/audioStore';
import { visitorPois } from '../../data/visitorPois';

// Embedded Audio Player for Col 2
function Col2AudioPlayer({ onUpgrade }) {
  const isPremium = usePremiumStore((state) => state.isPremium);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentPoiId = useAudioStore((state) => state.currentPoiId);
  const pauseAudio = useAudioStore((state) => state.pauseAudio);
  const resumeAudio = useAudioStore((state) => state.resumeAudio);

  const currentPoi = visitorPois.find((poi) => poi.id === currentPoiId);
  const audioLocked = !isPremium && freeListensRemaining === 0;

  if (!currentPoi && !audioLocked) {
     return (
       <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
         <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-600">
           <Headphones size={24} />
         </div>
         <div>
           <p className="text-sm font-bold text-slate-800">Đã sẵn sàng</p>
           <p className="text-xs text-slate-500">Tiến đến điểm tham quan để nghe tự động</p>
         </div>
       </div>
     );
  }

  if (audioLocked) {
    return (
      <div className="p-4 border-t border-slate-200 bg-orange-50 flex flex-col gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="relative grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-orange-200 text-orange-700 border border-orange-300">
             <Headphones size={24} />
             <Lock size={14} className="absolute bottom-1 right-1 text-orange-800" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Audio bị khóa</p>
            <p className="text-xs font-medium text-orange-600">Đã hết lượt nghe miễn phí</p>
          </div>
        </div>
        <button
          onClick={onUpgrade}
          className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 transition shadow-sm active:scale-[0.98]"
        >
          Mở khóa toàn bộ
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3 mb-4">
        <img src={currentPoi.image} alt={currentPoi.title} className="h-14 w-14 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
        <div className="flex-1 min-w-0">
           <p className="text-xs font-bold text-teal-600 truncate uppercase mb-0.5">{currentPoi.category}</p>
           <p className="text-sm font-bold text-slate-900 truncate">{currentPoi.title}</p>
        </div>
        <button
          onClick={() => isPlaying ? pauseAudio() : resumeAudio()}
          className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-full bg-teal-600 text-white shadow-sm hover:bg-teal-700 transition active:scale-[0.98]"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
        </button>
      </div>
      <div className="flex items-center gap-3">
         <Volume2 size={18} className="text-slate-400" />
         <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
           <div className={`h-full rounded-full transition-all duration-300 ${isPlaying ? 'bg-teal-500 w-full' : 'bg-slate-300 w-1/2'}`}></div>
         </div>
      </div>
    </div>
  );
}

export function PCLayout({
  searchParams,
  setSearchParams,
  selectedPoi,
  enrichedPois = [],
  position,
  permissionStatus,
  isFakeMode,
  handleSelectPoi,
  handleLocate,
  onUpgrade,
  onToast
}) {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  
  const isPremium = usePremiumStore((state) => state.isPremium);
  const getFormattedCountdown = usePremiumStore((state) => state.getFormattedCountdown);
  const [countdown, setCountdown] = useState(getFormattedCountdown());

  useEffect(() => {
    if (!isPremium) return undefined;
    const interval = window.setInterval(() => setCountdown(getFormattedCountdown()), 1000);
    return () => window.clearInterval(interval);
  }, [isPremium, getFormattedCountdown]);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-body text-slate-900 overflow-hidden">
      {/* COLUMN 1: App Navigation (Left Sidebar - Width: 80px) */}
      <aside className="w-[80px] flex-shrink-0 flex flex-col items-center py-6 bg-white border-r border-slate-200 z-[1300] shadow-sm">
        <div className="mb-8">
          <img src={logo} alt="VietTourAudio" className="h-12 w-12 rounded-xl shadow-sm border border-slate-100" />
        </div>
        
        <nav className="flex flex-col gap-6 flex-1 w-full items-center">
          <Link to="/" className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-700 transition">
            <div className="p-2 rounded-xl hover:bg-slate-50">
              <Home size={24} />
            </div>
            <span className="text-[10px] font-bold">Trang chủ</span>
          </Link>
          <div className="flex flex-col items-center gap-1.5 text-teal-600">
            <div className="bg-teal-50 p-2 rounded-xl border border-teal-100 shadow-sm">
              <MapIcon size={24} />
            </div>
            <span className="text-[10px] font-bold">Bản đồ</span>
          </div>
          <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-700 transition">
            <div className="p-2 rounded-xl hover:bg-slate-50">
              <Bookmark size={24} />
            </div>
            <span className="text-[10px] font-bold">Đã lưu</span>
          </button>
        </nav>

        {/* GPS Status */}
        <div className="mt-auto flex flex-col items-center gap-1.5">
          <button onClick={handleLocate} className="relative group p-2.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition" title="Định vị">
            <SatelliteDish size={22} className={position ? "text-teal-500" : "text-slate-400"} />
            {position && <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm"></span>}
          </button>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">GPS</span>
        </div>
      </aside>

      {/* COLUMN 2: POI Details & List (Middle Panel - Width: 380px) */}
      <aside className="w-[380px] flex-shrink-0 flex flex-col bg-white border-r border-slate-200 z-[1200] relative shadow-sm">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="relative flex items-center bg-white border border-slate-200 hover:border-slate-300 transition shadow-sm rounded-lg">
            <Globe size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-transparent pl-9 pr-8 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
          
          {isPremium ? (
             <div className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 shadow-sm">
               <Crown size={14} className="text-teal-600" />
               <span className="font-mono text-xs font-bold text-teal-700">{countdown}</span>
             </div>
          ) : (
            <button
              onClick={onUpgrade}
              className="rounded-full bg-orange-100 text-orange-700 font-bold px-4 py-2 text-xs border border-orange-200 hover:bg-orange-200 transition shadow-sm"
            >
              Mở khóa Audio
            </button>
          )}
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Danh sách địa điểm</h3>
          <div className="flex flex-col gap-3">
            {enrichedPois.map(poi => {
               const isActive = selectedPoi?.id === poi.id;
               return (
                 <div
                   key={poi.id}
                   onClick={() => handleSelectPoi(poi)}
                   className={`flex gap-3 p-3 rounded-xl border transition cursor-pointer ${isActive ? 'bg-teal-50 border-teal-200 shadow-sm' : 'bg-white border-slate-100 hover:border-teal-100 hover:shadow-sm'}`}
                 >
                    <img src={poi.image} alt={poi.title} className="w-[72px] h-[72px] rounded-lg object-cover bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                       <p className="text-xs font-bold text-teal-600 truncate mb-1 uppercase">{poi.category}</p>
                       <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{poi.title}</p>
                       <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                         <MapPin size={12} className={poi.isInsideRadius ? "text-orange-500" : "text-slate-400"} />
                         <span className={poi.isInsideRadius ? "text-orange-600 font-bold" : ""}>{poi.distanceLabel || 'Đang tính...'}</span>
                       </div>
                    </div>
                 </div>
               );
            })}
          </div>
        </div>

        {/* Active POI Detail / Audio Player Area (Sticky Bottom) */}
        <Col2AudioPlayer onUpgrade={onUpgrade} />
      </aside>

      {/* COLUMN 3: The Map Area */}
      <div className="flex-1 relative bg-slate-100 z-[1000]">
        <LeafletMap selectedPoi={selectedPoi} enrichedPois={enrichedPois} position={position} onSelectPoi={handleSelectPoi} />
        
        {(isFakeMode || searchParams.get('debug') === 'gps') && <DevGpsPanel pois={enrichedPois} onToast={onToast} />}

        {/* Status Bar Floating */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1100]">
           <div className="bg-white/95 backdrop-blur-md shadow-md border border-slate-200 px-6 py-3.5 rounded-full flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${position ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-orange-500'}`}></div>
              <span className="text-sm font-bold text-slate-800">
                 {position ? 'Đã sẵn sàng trải nghiệm' : 'Đang chờ vị trí GPS...'}
              </span>
           </div>
        </div>

        {!position && (
          <article className="absolute top-6 left-1/2 -translate-x-1/2 z-[1200] w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6 text-center">
            <SatelliteDish className="mx-auto text-teal-500 mb-4" size={36} />
            <h2 className="text-lg font-extrabold text-slate-900">Đang tìm vị trí của bạn</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">Hãy cấp quyền GPS để bản đồ tự động phát audio khi bạn đến gần điểm tham quan.</p>
            <button
              type="button"
              onClick={handleLocate}
              disabled={permissionStatus === 'requesting'}
              className="mt-5 w-full rounded-xl bg-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-70 active:scale-[0.98]"
            >
              {permissionStatus === 'requesting' ? 'Đang lấy GPS...' : 'Bật GPS / Dùng Demo'}
            </button>
          </article>
        )}
        
        {/* Render bottom sheet just in case (e.g. for full descriptions if needed later, though maybe not strictly needed for PC anymore, keeping it to avoid breaking props) */}
        <PoiBottomSheet poi={selectedPoi} onClose={() => setSearchParams({})} onUpgrade={onUpgrade} onToast={onToast} />
      </div>
    </div>
  );
}
