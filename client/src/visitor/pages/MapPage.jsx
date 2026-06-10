import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, QrCode, SatelliteDish, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { visitorPois } from '../../data/visitorPois';
import { useAudioStore } from '../../stores/audioStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { enrichPoisWithDistance } from '../../utils/geo';
import { BottomNav } from '../components/BottomNav';
import { DevGpsPanel } from '../components/DevGpsPanel';
import { LeafletMap } from '../components/LeafletMap';
import { PoiBottomSheet } from '../components/PoiBottomSheet';
import { PremiumStatusButton } from '../components/PremiumStatusButton';
import { TopBar } from '../components/TopBar';

export function MapPage({ onUpgrade, onToast }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPoiId, setSelectedPoiId] = useState(searchParams.get('poi'));
  const position = useLocationStore((state) => state.position);
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const useDemoLocation = useLocationStore((state) => state.useDemoLocation);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const canAutoPlay = useAudioStore((state) => state.canAutoPlay);
  const playPoi = useAudioStore((state) => state.playPoi);
  const getLanguageMeta = useLanguageStore((state) => state.getLanguageMeta);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const enrichedPois = useMemo(() => {
    if (!position) {
      return visitorPois.map((poi) => ({
        ...poi,
        distanceLabel: poi.distanceHint,
        isInsideRadius: false
      }));
    }

    return enrichPoisWithDistance(visitorPois, position);
  }, [position]);

  const selectedPoi = useMemo(
    () => enrichedPois.find((poi) => poi.id === selectedPoiId) ?? null,
    [enrichedPois, selectedPoiId]
  );

  const activeAutoPoi = useMemo(() => enrichedPois.find((poi) => poi.isInsideRadius) ?? null, [enrichedPois]);

  useEffect(() => {
    const poiId = searchParams.get('poi');
    setSelectedPoiId(poiId);
  }, [searchParams]);

  useEffect(() => {
    if (!isPremium || !activeAutoPoi || !canAutoPlay(activeAutoPoi.id)) {
      return;
    }

    const played = playPoi(activeAutoPoi, getLanguageMeta());
    if (played) {
      setSelectedPoiId(activeAutoPoi.id);
      setSearchParams({ poi: activeAutoPoi.id }, { replace: true });
      onToast('Đã vào vùng. Đang tự động phát âm thanh...');
    }
  }, [activeAutoPoi, canAutoPlay, currentLanguage, getLanguageMeta, isPremium, onToast, playPoi, setSearchParams]);

  function handleSelectPoi(poi) {
    setSelectedPoiId(poi.id);
    setSearchParams({ poi: poi.id });
  }

  async function handleLocate() {
    const allowed = await requestLocation();
    if (allowed) {
      onToast('Đã cập nhật vị trí hiện tại.');
      return;
    }

    onToast('Không lấy được GPS. Đang chuyển sang vị trí demo.');
    useDemoLocation();
  }

  return (
    <section className="relative h-full overflow-hidden bg-slate-100">
      <div className="absolute inset-0">
        <LeafletMap selectedPoi={selectedPoi} enrichedPois={enrichedPois} position={position} onSelectPoi={handleSelectPoi} />
      </div>

      <TopBar title="Nguyễn Huệ" compact />

      <div className="absolute left-1/2 top-[92px] z-[1200] w-[calc(100%-2rem)] -translate-x-1/2 text-center">
        <PremiumStatusButton onUpgrade={onUpgrade} />
      </div>

      <div className="absolute bottom-[calc(38%+112px)] right-4 z-[1200] grid gap-3">
        <button
          type="button"
          onClick={onUpgrade}
          className="grid h-12 w-12 place-items-center rounded-full bg-white text-teal-700 shadow-xl shadow-slate-900/10 transition duration-200 ease-out hover:bg-teal-50 active:scale-95"
          aria-label="Quét QR Premium"
        >
          <QrCode size={21} />
        </button>
        <button
          type="button"
          onClick={handleLocate}
          className="grid h-12 w-12 place-items-center rounded-full bg-teal-700 text-white shadow-xl shadow-teal-900/25 transition duration-200 ease-out hover:bg-teal-800 active:scale-95"
          aria-label="Định vị lại"
        >
          <Crosshair size={21} />
        </button>
      </div>

      {searchParams.get('debug') === 'gps' && <DevGpsPanel onToast={onToast} />}

      <AnimatePresence>
        {!position && (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute left-4 right-4 top-[150px] z-[1200] rounded-3xl border border-white/80 bg-white/90 p-4 text-center shadow-xl shadow-slate-900/10 backdrop-blur-2xl"
          >
            <SatelliteDish className="mx-auto text-orange-500" size={30} />
            <h2 className="mt-2 text-base font-black text-slate-950">Đang tìm kiếm vị trí của bạn</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Hãy đảm bảo bạn đã cấp quyền GPS. Bạn vẫn có thể dùng vị trí demo để kiểm thử giao diện.
            </p>
            <button
              type="button"
              onClick={handleLocate}
              disabled={permissionStatus === 'requesting'}
              className="mt-3 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition duration-200 ease-out hover:bg-orange-600 active:scale-95 disabled:opacity-70"
            >
              {permissionStatus === 'requesting' ? 'Đang lấy GPS...' : 'Bật GPS / Dùng demo'}
            </button>
          </motion.article>
        )}
      </AnimatePresence>

      <section className="absolute bottom-[86px] left-0 right-0 z-[1100] max-h-[38%] rounded-t-[2rem] border-t border-white/80 bg-white/95 px-4 pb-4 pt-3 shadow-2xl shadow-slate-900/20 backdrop-blur-2xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <label className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-semibold text-slate-500">
          <Search size={17} />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
            placeholder="Tìm sạp, quán ăn, di tích trong khu vực..."
            aria-label="Tìm điểm tham quan"
          />
        </label>
        <div className="mt-3 grid max-h-[calc(38svh-112px)] gap-2 overflow-y-auto hide-scrollbar">
          {enrichedPois.map((poi) => (
            <button
              key={poi.id}
              type="button"
              onClick={() => handleSelectPoi(poi)}
              className="grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-3xl bg-slate-50 p-2 text-left transition duration-200 ease-out hover:bg-teal-50 active:scale-[0.99]"
            >
              <img className="h-14 w-14 rounded-2xl object-cover" src={poi.image} alt={poi.title} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-950">{poi.title}</span>
                <span className="mt-1 block text-xs font-bold text-teal-700">{poi.distanceLabel}</span>
              </span>
              <span className={poi.isInsideRadius ? 'h-3 w-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/40' : 'h-3 w-3 rounded-full bg-slate-300'} />
            </button>
          ))}
        </div>
      </section>

      <BottomNav />
      <PoiBottomSheet poi={selectedPoi} onClose={() => setSearchParams({})} onUpgrade={onUpgrade} onToast={onToast} />
    </section>
  );
}
