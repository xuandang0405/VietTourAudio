import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { Crown, ImagePlus, Loader2, MapPinned, Save } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { useVendorPortalStore } from '../stores/vendorPortalStore';

// Custom marker icon (large teal pin)
const stallIcon = new L.DivIcon({
  className: 'vta-stall-marker',
  html: `<div style="
    width: 36px; height: 36px;
    background: #0D9488;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 4px 14px rgba(13,148,136,0.45);
    display: grid; place-items: center;
  "><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

function DraggableMarkerEvents({ position, onMove }) {
  useMapEvents({
    click(event) {
      onMove(event.latlng.lat, event.latlng.lng);
    }
  });
  return null;
}

export function VendorStall() {
  const { t } = useTranslation();
  const stall = useVendorPortalStore((state) => state.stall);
  const categories = useVendorPortalStore((state) => state.categories);
  const updateStallLocation = useVendorPortalStore((state) => state.updateStallLocation);
  const updateStallInfo = useVendorPortalStore((state) => state.updateStallInfo);
  const togglePremium = useVendorPortalStore((state) => state.togglePremium);
  const saveStall = useVendorPortalStore((state) => state.saveStall);
  const isSavingStall = useVendorPortalStore((state) => state.isSavingStall);

  const [locationError, setLocationError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState(stall.imageUrl);
  const markerRef = useRef(null);

  const mapCenter = useMemo(() => [stall.latitude, stall.longitude], [stall.latitude, stall.longitude]);

  const handleMarkerMove = useCallback((lat, lng) => {
    setLocationError('');
    const result = updateStallLocation(lat, lng);
    if (!result.success) {
      setLocationError(result.error);
    }
  }, [updateStallLocation]);

  const handleMarkerDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      const pos = marker.getLatLng();
      handleMarkerMove(pos.lat, pos.lng);
    }
  }, [handleMarkerMove]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setLocationError(t('stall.error_max_size'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
      updateStallInfo({ imageUrl: e.target.result });
    };
    reader.readAsDataURL(file);
  };

  async function handleSave() {
    setSaveSuccess(false);
    const result = await saveStall();
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">{t('sidebar.stall_location')}</h2>
        <p className="text-slate-500 mt-1">{t('stall.description')}</p>
      </header>

      {locationError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          ⚠️ {locationError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Map */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" style={{ minHeight: '500px' }}>
          <MapContainer
            center={mapCenter}
            zoom={19}
            style={{ height: '100%', minHeight: '500px', width: '100%' }}
            scrollWheelZoom
            zoomControl
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <DraggableMarkerEvents position={mapCenter} onMove={handleMarkerMove} />
            <Marker
              position={[stall.latitude, stall.longitude]}
              icon={stallIcon}
              draggable
              ref={markerRef}
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
            {/* Radius Circle */}
            <Circle
              center={[stall.latitude, stall.longitude]}
              radius={stall.activationRadius}
              pathOptions={{
                color: stall.isPremium ? '#0D9488' : '#94A3B8',
                fillColor: stall.isPremium ? '#0D9488' : '#CBD5E1',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: stall.isPremium ? '' : '6 4'
              }}
            />
          </MapContainer>
        </div>

        {/* Stall Info Form */}
        <div className="space-y-5">
          {/* Coordinates display */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MapPinned size={16} className="text-teal-600" />
              {t('poi.coordinates')}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-bold text-slate-500">Latitude</span>
                <p className="mt-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-sm font-bold text-slate-900">
                  {stall.latitude.toFixed(7)}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500">Longitude</span>
                <p className="mt-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-sm font-bold text-slate-900">
                  {stall.longitude.toFixed(7)}
                </p>
              </div>
            </div>
            {/* Radius badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${stall.isPremium ? 'bg-teal-50 border border-teal-200 text-teal-700' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
                {t('stall.radius_display', 'Bán kính: {{radius}}m', { radius: stall.activationRadius })}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${stall.isPremium ? 'bg-orange-50 border border-orange-200 text-orange-700' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
                {stall.isPremium ? '⭐ Premium' : t('stall.free', 'Miễn phí')}
              </span>
            </div>
          </div>

          {/* Stall Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900">{t('vendor.stall_info')}</h3>

            <label className="block">
              <span className="text-xs font-bold text-slate-600">{t('vendor.trade_name')}</span>
              <input
                type="text"
                value={stall.name}
                onChange={(e) => updateStallInfo({ name: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-slate-600">{t('stall.category', 'Danh mục')}</span>
              <select
                value={stall.category}
                onChange={(e) => updateStallInfo({ category: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>

            {/* Cover Image */}
            <div>
              <span className="text-xs font-bold text-slate-600">{t('stall.cover_image', 'Ảnh bìa (max 5MB)')}</span>
              <div className="mt-2 flex items-center gap-3">
                {previewImage ? (
                  <img src={previewImage} alt="Cover" className="h-20 w-20 rounded-xl border border-slate-200 object-cover" />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                    <ImagePlus size={24} />
                  </div>
                )}
                <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50">
                  {t('stall.select_image', 'Chọn ảnh')}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            {/* Premium Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Crown size={16} className={stall.isPremium ? 'text-orange-500' : 'text-slate-400'} />
                <span className="text-sm font-bold text-slate-700">{t('stall.premium_stall', 'Sạp Premium')}</span>
              </div>
              <button
                type="button"
                onClick={togglePremium}
                className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${stall.isPremium ? 'bg-teal-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${stall.isPremium ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {stall.isPremium
                ? t('stall.premium_desc', 'Premium: Bán kính ≥10m, ưu tiên phát audio khi có chồng lấn.')
                : t('stall.free_desc', 'Miễn phí: Bán kính 3m, không ưu tiên khi chồng lấn.')}
            </p>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSavingStall}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:bg-teal-300"
          >
            {isSavingStall ? (
              <><Loader2 size={16} className="animate-spin" /> {t('common.saving', 'Đang lưu...')}</>
            ) : saveSuccess ? (
              t('vendor.save_stall_success')
            ) : (
              <><Save size={16} /> {t('stall.save_stall', 'Lưu vị trí & thông tin sạp')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
