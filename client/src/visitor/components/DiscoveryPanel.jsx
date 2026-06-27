import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, MapPin, X, Compass, Music, Navigation2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { zones } from '../../data/zones';
import { useLocationStore } from '../../features/geofence-audio/stores/locationStore';

const CATEGORY_EMOJI = {
  food: '🍜', restaurant: '🍜',
  heritage: '🏛️', history: '🏛️',
  museum: '🖼️',
  temple: '🛕', spiritual: '🛕',
  shopping: '🛍️',
  nature: '🌿', park: '🌿',
  audio: '🎧', story: '🎧',
};

function getCategoryEmoji(category = '') {
  const lower = category.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '📍';
}

export function DiscoveryPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOpen = useLocationStore((s) => s.isDiscoveryOpen);
  const setIsOpen = useLocationStore((s) => s.setIsDiscoveryOpen);
  const selectAndFocusPoi = useLocationStore((s) => s.selectAndFocusPoi);
  const [expandedZones, setExpandedZones] = useState({});

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  const toggleZone = (zoneSlug) => {
    setExpandedZones((prev) => ({
      ...prev,
      [zoneSlug]: !prev[zoneSlug],
    }));

    // Fly to zone center on the map
    const zone = zones.find((z) => z.slug === zoneSlug);
    if (zone && zone.pois && zone.pois.length > 0) {
      const map = useLocationStore.getState().mapInstance;
      if (map) {
        // Find average center of all POIs in the zone for a visual fly-to
        const firstPoi = zone.pois[0];
        if (firstPoi && firstPoi.latitude && firstPoi.longitude) {
          map.flyTo([firstPoi.latitude, firstPoi.longitude], 15, { animate: true, duration: 1.0 });
        }
      }
    }
  };

  const handlePoiClick = (zone, poi) => {
    setIsOpen(false);

    // Navigate to /map with zone context
    navigate(`/map?zone=${encodeURIComponent(zone.slug)}`);

    // Use selectAndFocusPoi to open the bottom sheet and fly to POI
    setTimeout(() => {
      // Build a compatible POI object for selectAndFocusPoi
      const enrichedPoi = {
        ...poi,
        title: poi.name || poi.title,
        latitude: poi.latitude,
        longitude: poi.longitude,
        stall_id: poi.stallId,
      };
      selectAndFocusPoi(enrichedPoi);
    }, 300);
  };

  const handleZoneNavigate = (zone) => {
    setIsOpen(false);
    navigate(`/zone/${zone.slug}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="discovery-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1400] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <motion.aside
            key="discovery-panel"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-[1500] w-[380px] max-w-[90vw] bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-600">
                  <Compass size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">
                    {t('discovery.title', { defaultValue: 'Khám phá Khu vực' })}
                  </h2>
                  <p className="text-[11px] font-medium text-slate-400">
                    {t('discovery.subtitle', { defaultValue: `${zones.length} khu vực lễ hội` })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition active:scale-95"
                aria-label={t('common.close', { defaultValue: 'Đóng' })}
              >
                <X size={20} />
              </button>
            </div>

            {/* Zone List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-3 space-y-2">
                {zones.map((zone) => {
                  const isExpanded = expandedZones[zone.slug] || false;
                  const hasPois = zone.pois && zone.pois.length > 0;

                  return (
                    <div
                      key={zone.id}
                      className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Zone Header */}
                      <button
                        type="button"
                        onClick={() => toggleZone(zone.slug)}
                        className="w-full flex items-center gap-3 p-3.5 text-left transition active:scale-[0.99] hover:bg-slate-50"
                      >
                        {/* Zone Thumbnail */}
                        <div className="flex-shrink-0 h-12 w-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                          {zone.coverImage ? (
                            <img
                              src={zone.coverImage}
                              alt={zone.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full grid place-items-center text-slate-300">
                              <MapPin size={20} />
                            </div>
                          )}
                        </div>

                        {/* Zone Info */}
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-slate-800 truncate">
                            {zone.name}
                          </span>
                          <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                            {zone.city}
                            {hasPois && (
                              <span className="ml-1.5 text-teal-500 font-semibold">
                                · {zone.pois.length} {t('discovery.poi_count_label', { defaultValue: 'điểm' })}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Expand Chevron */}
                        <div className={`flex-shrink-0 p-1 rounded-lg transition-transform duration-200 ${isExpanded ? 'rotate-0 text-teal-500' : '-rotate-90 text-slate-300'}`}>
                          <ChevronDown size={18} />
                        </div>
                      </button>

                      {/* Expanded POI List */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key={`pois-${zone.slug}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-slate-50 bg-slate-25">
                              {hasPois ? (
                                <ul className="divide-y divide-slate-50">
                                  {zone.pois.map((poi) => (
                                    <li key={poi.id}>
                                      <button
                                        type="button"
                                        onClick={() => handlePoiClick(zone, poi)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-teal-50/50 transition active:scale-[0.99]"
                                      >
                                        {/* POI emoji marker */}
                                        <span className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 grid place-items-center text-base shadow-sm">
                                          {getCategoryEmoji(poi.type || poi.category || '')}
                                        </span>

                                        {/* POI info */}
                                        <div className="flex-1 min-w-0">
                                          <span className="block text-[13px] font-semibold text-slate-700 truncate">
                                            {poi.name || poi.title}
                                          </span>
                                          <span className="block text-[10px] font-medium text-slate-400 mt-0.5 truncate">
                                            {poi.type || poi.category || t('discovery.poi_default_type', { defaultValue: 'Điểm tham quan' })}
                                            {poi.audioLength && (
                                              <span className="ml-1.5 text-teal-500">
                                                <Music size={10} className="inline -mt-0.5 mr-0.5" />
                                                {poi.audioLength}
                                              </span>
                                            )}
                                          </span>
                                        </div>

                                        {/* Premium badge */}
                                        {poi.premium && (
                                          <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-orange-50 text-[9px] font-black text-orange-500 border border-orange-100">
                                            PRO
                                          </span>
                                        )}

                                        <ChevronRight size={14} className="flex-shrink-0 text-slate-300" />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="px-4 py-5 text-center">
                                  <p className="text-xs font-medium text-slate-400">
                                    {t('discovery.no_pois', { defaultValue: 'Chưa có điểm tham quan. Quét QR tại cổng để khám phá.' })}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => handleZoneNavigate(zone)}
                                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-600 text-xs font-bold border border-teal-100 hover:bg-teal-100 transition active:scale-95"
                                  >
                                    <Navigation2 size={14} />
                                    {t('discovery.go_to_zone', { defaultValue: 'Đi tới khu vực' })}
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-[10px] font-medium text-slate-400 text-center">
                {t('discovery.footer', { defaultValue: 'Chạm vào khu vực để xem các điểm tham quan' })}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
