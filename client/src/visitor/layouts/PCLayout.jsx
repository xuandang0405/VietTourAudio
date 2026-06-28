import { SatelliteDish, Home, Map as MapIcon, Bookmark, Globe, Crown, Headphones, Lock, Play, Pause, Volume2, MapPin, Heart, Navigation, X, Compass } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo/logo.png';
import { DevGpsPanel } from '../../features/geofence-audio/components/DevGpsPanel';
import { LeafletMap } from '../../features/poi/components/LeafletMap';
import { PoiBottomSheet } from '../../features/poi/components/PoiBottomSheet';
import { useLanguageStore, languages } from '../../stores/languageStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { usePremiumStore } from '../../features/vendor-wallet/stores/premiumStore';
import { useAudioStore } from '../../features/geofence-audio/stores/audioStore';
import { useLocationStore } from '../../features/geofence-audio/stores/locationStore';
import { visitorPois } from '../../data/visitorPois';
import { motion } from 'framer-motion';
import { DiscoveryPanel } from '../components/DiscoveryPanel';

// Embedded Audio Player for Col 2
function Col2AudioPlayer({ onUpgrade, enrichedPois = [], selectedStall }) {
  const { t } = useTranslation();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentPoiId = useAudioStore((state) => state.currentPoiId);
  const pauseAudio = useAudioStore((state) => state.pauseAudio);
  const resumeAudio = useAudioStore((state) => state.resumeAudio);
  const playPoi = useAudioStore((state) => state.playPoi);
  const getLanguageMeta = useLanguageStore((state) => state.getLanguageMeta);
  const activePoi = useLocationStore((state) => state.activePoi);

  // HTML5 Progress states
  const currentTime = useAudioStore((state) => state.currentTime);
  const duration = useAudioStore((state) => state.duration);
  const isHtml5 = useAudioStore((state) => state.isHtml5);
  const seek = useAudioStore((state) => state.seek);

  const currentPoi =
    enrichedPois.find((poi) => poi.id === currentPoiId) ||
    enrichedPois.find((poi) => poi.id === activePoi?.id) ||
    activePoi ||
    visitorPois.find((poi) => poi.id === currentPoiId);
  const audioLocked = !isPremium && freeListensRemaining === 0;
  const activeStallName = currentPoi?.stall_name || selectedStall?.name || t('common.unknown_stall');
  const activeStallDescription = currentPoi?.stall_description || selectedStall?.description || t('landing.no_description');
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  const stallId = currentPoi?.stallId || selectedStall?.id;
  const isFav = stallId ? isFavorite(stallId) : false;
  const handleToggleAudio = () => {
    if (!currentPoi) return;
    if (isPlaying && currentPoi.id === currentPoiId) {
      pauseAudio();
      return;
    }
    if (!isPlaying && currentPoi.id === currentPoiId) {
      resumeAudio();
      return;
    }
    playPoi(currentPoi, getLanguageMeta());
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
      <div className="flex items-center gap-3 mb-3">
        <img src={currentPoi.image} alt={currentPoi.title} className="h-14 w-14 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-teal-600 truncate uppercase mb-0.5">{activeStallName}</p>
            <p className="text-sm font-bold text-slate-900 truncate">{currentPoi.title}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5" title={activeStallDescription}>{activeStallDescription}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {stallId && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleFavorite(stallId)}
              className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 border border-slate-200 shadow-sm hover:bg-slate-100 transition"
              aria-label={isFav ? t('favorites_remove', { defaultValue: 'Xóa khỏi yêu thích' }) : t('favorites_add', { defaultValue: 'Thêm vào yêu thích' })}
            >
              <Heart size={20} className={isFav ? "text-red-500 fill-red-500" : "text-slate-400"} />
            </motion.button>
          )}
          <button
            type="button"
            onClick={handleToggleAudio}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-teal-600 text-white shadow-sm hover:bg-teal-700 transition active:scale-[0.98]"
            aria-label={isPlaying ? t('common.pause', { defaultValue: 'Tạm dừng' }) : t('common.play', { defaultValue: 'Phát âm thanh' })}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
        </div>
      </div>
      
      {isHtml5 ? (
        <div className="flex flex-col gap-1 px-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-teal-600 focus:outline-none"
            aria-label="Tiến trình phát"
          />
          <div className="flex justify-between text-[10px] font-semibold text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Volume2 size={18} className="text-slate-400" />
          <div className="h-1 flex-1 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${isPlaying ? 'bg-teal-500 w-full' : 'bg-slate-300 w-1/2'}`}></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PCLayout({
  searchParams,
  setSearchParams,
  selectedPoi,
  selectedStall,
  enrichedPois = [],
  position,
  permissionStatus,
  isFakeMode,
  handleSelectPoi,
  handleClosePoi,
  handleLocate,
  onUpgrade,
  onToast,
  routingCoordinates,
  setRoutingCoordinates,
  routingInfo,
  setRoutingInfo,
  handleGetDirections,
  zoneCenter
}) {
  const { t, i18n } = useTranslation();
  const { t: tRoot } = useTranslation();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const isCameraLocked = useLocationStore((state) => state.isCameraLocked);
  const setIsCameraLocked = useLocationStore((state) => state.setIsCameraLocked);
  const navigationTargetPoi = useLocationStore((state) => state.navigationTargetPoi);
  const isDiscoveryOpen = useLocationStore((state) => state.isDiscoveryOpen);
  const setIsDiscoveryOpen = useLocationStore((state) => state.setIsDiscoveryOpen);



  const handleCameraLockToggle = () => {
    const nextLocked = !isCameraLocked;
    setIsCameraLocked(nextLocked);
    if (nextLocked) {
      const map = useLocationStore.getState().mapInstance;
      if (map) {
        if (position && position.lat && position.lng) {
          map.setView([position.lat, position.lng], 17, { animate: true });
        } else if (zoneCenter) {
          map.setView([zoneCenter.lat, zoneCenter.lng], 15, { animate: true });
        } else {
          map.setView([mapCenter.lat, mapCenter.lng], 15, { animate: true });
        }
      }
    }
  };
  
  const [activeTab, setActiveTab] = useState('all');
  const favorites = useFavoritesStore((state) => state.favorites);
  const favoritePois = enrichedPois.filter(poi => poi.stallId && favorites.includes(poi.stallId));
  
  const isPremium = usePremiumStore((state) => state.isPremium);
  const getFormattedCountdown = usePremiumStore((state) => state.getFormattedCountdown);
  const [countdown, setCountdown] = useState(getFormattedCountdown());

  useEffect(() => {
    if (!isPremium) return undefined;
    const interval = window.setInterval(() => setCountdown(getFormattedCountdown()), 1000);
    return () => window.clearInterval(interval);
  }, [isPremium, getFormattedCountdown]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-100 isolate flex font-body text-slate-900">
      {/* COLUMN 1: App Navigation (Left Sidebar - Width: 80px) */}
      <aside className="w-[80px] flex-shrink-0 flex flex-col items-center py-6 bg-white border-r border-slate-200 z-[1300] shadow-sm">
        <div className="mb-8">
          <img src={logo} alt="VietTourAudio" className="h-12 w-12 rounded-xl shadow-sm border border-slate-100" />
        </div>
        
        <nav className="flex flex-col gap-6 flex-1 w-full items-center">
          <Link
            to="/"
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-teal-600 transition"
            aria-label="Các khu vực lễ hội"
          >
            <div className="p-2 rounded-xl hover:bg-teal-50 hover:text-teal-600">
              <Globe size={24} />
            </div>
            <span className="text-[10px] font-bold">
              {typeof t === "function"
                ? t("sidebar.zones", { defaultValue: "Khu vực" })
                : "Khu vực"}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIsDiscoveryOpen(true)}
            aria-label="Khám phá khu vực lễ hội"
            className={`flex flex-col items-center gap-1.5 transition duration-150 ease-out active:scale-95 cursor-pointer ${
              isDiscoveryOpen ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600'
            }`}
          >
            <div className={`p-2 rounded-xl border transition ${
              isDiscoveryOpen
                ? 'bg-teal-50 border-teal-100 shadow-sm'
                : 'border-transparent hover:bg-teal-50 hover:border-teal-100 hover:shadow-sm'
            }`}>
              <Compass size={24} />
            </div>
            <span className="text-[10px] font-bold">
              {t('navigation.discover', { defaultValue: 'Khám phá' })}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'favorites' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-700'}`}
          >
            <div className={`p-2 rounded-xl ${activeTab === 'favorites' ? 'bg-teal-50 border border-teal-100 shadow-sm' : 'hover:bg-slate-50'}`}>
              <Bookmark size={24} />
            </div>
            <span className="text-[10px] font-bold">{t('landing.favorites', { defaultValue: 'Yêu thích' })}</span>
          </button>
        </nav>

        {/* GPS Status */}
        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleCameraLockToggle}
            className={`relative group p-2.5 rounded-full border transition active:scale-[0.98] ${
              isCameraLocked ? 'bg-teal-500 text-white border-teal-500 shadow-md' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-400 hover:border-slate-300'
            }`}
            title={isCameraLocked ? t('landing.camera_lock_on') : t('landing.camera_lock_off')}
            aria-label={isCameraLocked ? t('landing.camera_lock_disable') : t('landing.camera_lock_enable')}
          >
            <Navigation size={22} className={isCameraLocked ? "rotate-45 text-white" : "text-slate-400"} />
          </button>
          <button onClick={handleLocate} className="relative group p-2.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition" title="Định vị">
            <SatelliteDish size={22} className={position ? "text-teal-500" : "text-slate-400"} />
            {position && <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm"></span>}
          </button>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">GPS</span>
        </div>
      </aside>

      {/* COLUMN 2: POI Details & List (Middle Panel - Width: 380px) */}
      <aside className="relative z-20 w-[380px] h-full flex flex-col bg-white border-r border-slate-200 flex-shrink-0 shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="relative flex items-center bg-white border border-slate-200 hover:border-slate-300 transition shadow-sm rounded-lg">
            <Globe size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={currentLanguage}
              onChange={(e) => {
                const nextLang = e.target.value;
                setLanguage(nextLang);
                i18n.changeLanguage(nextLang);
                const newParams = new URLSearchParams(searchParams);
                newParams.set('lang', nextLang);
                setSearchParams(newParams);
              }}
              className="appearance-none bg-transparent pl-9 pr-8 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <div className="flex gap-4 border-b border-slate-200 mb-4 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'all' ? 'text-teal-600 border-b-2 border-teal-600 pb-1' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('landing.list', { defaultValue: 'Danh sách' })}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 ${
                activeTab === 'favorites' ? 'text-teal-600 border-b-2 border-teal-600 pb-1' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Heart size={12} className={activeTab === 'favorites' ? "text-red-500 fill-red-500" : ""} />
              {t('landing.favorites', { defaultValue: 'Yêu thích' })}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {activeTab === 'all' ? (
              enrichedPois.map(poi => {
                const isActive = selectedPoi?.id === poi.id;
                return (
                  <div
                    key={poi.id}
                    onClick={() => handleSelectPoi(poi)}
                    className={`flex gap-3 p-3 rounded-xl border transition cursor-pointer ${isActive ? 'bg-teal-50 border-teal-200 shadow-sm' : 'bg-white border-slate-100 hover:border-teal-100 hover:shadow-sm'}`}
                  >
                     {poi.image && <img src={poi.image} alt={poi.stallName || poi.name || poi.title} className="w-[72px] h-[72px] rounded-lg object-cover bg-slate-200 flex-shrink-0" />}
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-xs font-bold text-teal-600 truncate mb-1 uppercase">{poi.category}</p>
                        <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{poi.stallName || poi.name || poi.title}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <MapPin size={12} className={poi.isInsideRadius ? "text-orange-500" : "text-slate-400"} />
                          <span className={poi.isInsideRadius ? "text-orange-600 font-bold" : ""}>{poi.distanceLabel || 'Đang tính...'}</span>
                        </div>
                     </div>
                  </div>
                );
              })
            ) : (
              favoritePois.length > 0 ? (
                favoritePois.map(poi => {
                  const isActive = selectedPoi?.id === poi.id;
                  return (
                    <div
                      key={poi.id}
                      onClick={() => handleSelectPoi(poi)}
                      className={`flex gap-3 p-3 rounded-xl border transition cursor-pointer ${isActive ? 'bg-teal-50 border-teal-200 shadow-sm' : 'bg-white border-slate-100 hover:border-teal-100 hover:shadow-sm'}`}
                    >
                       {poi.image && <img src={poi.image} alt={poi.stallName || poi.name || poi.title} className="w-[72px] h-[72px] rounded-lg object-cover bg-slate-200 flex-shrink-0" />}
                       <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-xs font-bold text-teal-600 truncate mb-1 uppercase">{poi.category}</p>
                          <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{poi.stallName || poi.name || poi.title}</p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <MapPin size={12} className={poi.isInsideRadius ? "text-orange-500" : "text-slate-400"} />
                            <span className={poi.isInsideRadius ? "text-orange-600 font-bold" : ""}>{poi.distanceLabel || 'Đang tính...'}</span>
                          </div>
                       </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-4 text-center text-sm font-semibold text-slate-400 rounded-xl border border-slate-100 shadow-sm">
                  {t('landing.no_favorites', { defaultValue: 'Chưa có sạp yêu thích' })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Active POI Detail / Audio Player Area (Sticky Bottom) */}
        <Col2AudioPlayer onUpgrade={onUpgrade} enrichedPois={enrichedPois} selectedStall={selectedStall} />
      </aside>

      {/* COLUMN 3: The Map Area */}
      <div className="flex-1 relative bg-slate-100 z-0">
        <LeafletMap
          selectedPoi={selectedPoi}
          enrichedPois={enrichedPois}
          position={position}
          onSelectPoi={handleSelectPoi}
          routingCoordinates={routingCoordinates}
          zoneCenter={zoneCenter}
        />
        
        {(isFakeMode || searchParams.get('debug') === 'gps') && <DevGpsPanel pois={enrichedPois} onToast={onToast} />}

        {navigationTargetPoi && !selectedPoi && (
          <div className="absolute top-4 right-4 z-[1000] pointer-events-auto animate-fade-in">
            <button
              type="button"
              onClick={() => useLocationStore.getState().stopNavigation()}
              className="shadow-xl rounded-xl transition duration-150 ease-out active:scale-[0.98] flex items-center gap-2 px-4 h-11 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold"
              title={tRoot('routing.clear_directions', { defaultValue: 'Hủy chỉ đường' })}
            >
              <X size={16} />
              {tRoot('routing.clear_directions', { defaultValue: 'Hủy chỉ đường' })}
            </button>
          </div>
        )}

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
        <PoiBottomSheet
          poi={selectedPoi}
          selectedStall={selectedStall}
          onClose={handleClosePoi}
          onUpgrade={onUpgrade}
          onToast={onToast}
          routingCoordinates={routingCoordinates}
          routingInfo={routingInfo}
          onGetDirections={() => handleGetDirections(selectedPoi)}
          onClearDirections={() => {
            useLocationStore.getState().stopNavigation();
          }}
        />
      </div>
      {/* Discovery Explorer Panel */}
      <DiscoveryPanel />
    </div>
  );
}
