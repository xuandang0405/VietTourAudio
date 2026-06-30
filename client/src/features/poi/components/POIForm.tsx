import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { apiClient } from '../../../services/apiClient';
import { adminApiClient } from '../../../admin/api/adminApi';
import toast from 'react-hot-toast';

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapClickHandler({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      const latitude = Number.parseFloat(e.latlng.lat.toFixed(6));
      const longitude = Number.parseFloat(e.latlng.lng.toFixed(6));
      console.log(`📌 POI Pinpoint Selected: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`);
      onLocationSelected(latitude, longitude);
    }
  });
  return null;
}

function ChangeMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

interface POIFormProps {
  formName: string;
  setFormName: (val: string) => void;
  formStallId: string;
  setFormStallId: (val: string) => void;
  formTourId: string;
  setFormTourId: (val: string) => void;
  formDescription: string;
  setFormDescription: (val: string) => void;
  formCoverImageUrl: string;
  setFormCoverImageUrl: (val: string) => void;
  formLatitude: string;
  setFormLatitude: (val: string) => void;
  formLongitude: string;
  setFormLongitude: (val: string) => void;
  formRadius: string;
  setFormRadius: (val: string) => void;
  formIsPremium: boolean;
  setFormIsPremium: (val: boolean) => void;
  formStatus: string;
  setFormStatus: (val: string) => void;
  stalls: any[];
  tours: any[];
  vendors?: any[];
  error?: string;
  translations: { lang: string; title: string; ttsScript: string }[];
  setTranslations: (val: { lang: string; title: string; ttsScript: string }[]) => void;
  formCoverFile?: File | null;
  setFormCoverFile?: (file: File | null) => void;
  formPreviewUrl?: string;
  setFormPreviewUrl?: (url: string) => void;
}

export function POIForm({
  formName,
  setFormName,
  formStallId,
  setFormStallId,
  formTourId,
  setFormTourId,
  formDescription,
  setFormDescription,
  formCoverImageUrl,
  setFormCoverImageUrl,
  formLatitude,
  setFormLatitude,
  formLongitude,
  setFormLongitude,
  formRadius,
  setFormRadius,
  formIsPremium,
  setFormIsPremium,
  formStatus,
  setFormStatus,
  stalls,
  tours,
  vendors = [],
  error,
  translations,
  setTranslations,
  formCoverFile = null,
  setFormCoverFile = () => {},
  formPreviewUrl = '',
  setFormPreviewUrl = () => {}
}: POIFormProps) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState('vi');
  const [selectedVendorId, setSelectedVendorId] = useState('');

  useEffect(() => {
    if (formStallId && stalls.length > 0) {
      const activeStall = stalls.find((s) => String(s.id) === String(formStallId));
      if (activeStall?.vendorId) {
        setSelectedVendorId(String(activeStall.vendorId));
      } else {
        setSelectedVendorId('unassigned');
      }
    }
  }, [formStallId, stalls]);

  // Auto-select single stall if vendor is not Premium
  useEffect(() => {
    if (selectedVendorId && selectedVendorId !== 'unassigned' && stalls.length > 0) {
      const selectedVendor = vendors.find((v) => String(v.id) === selectedVendorId);
      const isPremium = selectedVendor?.subscription?.plan?.name?.toLowerCase().includes('premium') || String(selectedVendor?.subscription?.plan?.id) === '2';
      
      if (!isPremium) {
        const vendorStalls = stalls.filter((s) => String(s.vendorId) === selectedVendorId);
        if (vendorStalls.length > 0) {
          const singleStallId = String(vendorStalls[0].id);
          if (formStallId !== singleStallId) {
            setFormStallId(singleStallId);
          }
        }
      }
    }
  }, [selectedVendorId, stalls, vendors, formStallId, setFormStallId]);

  const languages = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  // Sync parent formName and formDescription changes to translations 'vi'
  useEffect(() => {
    const viTrans = translations.find((tr) => tr.lang === 'vi');
    if (viTrans && (viTrans.title !== formName || viTrans.ttsScript !== formDescription)) {
      const updated = translations.map((tr) =>
        tr.lang === 'vi' ? { ...tr, title: formName, ttsScript: formDescription } : tr
      );
      setTranslations(updated);
    }
  }, [formName, formDescription]);

  // Clean up preview object URL on change/unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (formPreviewUrl && formPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formPreviewUrl);
      }
    };
  }, [formPreviewUrl]);

  const currentTranslation = translations.find((tr) => tr.lang === activeTab) || {
    lang: activeTab,
    title: '',
    ttsScript: '',
  };

  const handleTitleChange = (val: string) => {
    if (activeTab === 'vi') {
      setFormName(val);
    }
    const updated = translations.map((tr) =>
      tr.lang === activeTab ? { ...tr, title: val } : tr
    );
    setTranslations(updated);
  };

  const handleTtsScriptChange = (val: string) => {
    if (activeTab === 'vi') {
      setFormDescription(val);
    }
    const updated = translations.map((tr) =>
      tr.lang === activeTab ? { ...tr, ttsScript: val } : tr
    );
    setTranslations(updated);
  };

  const handleGetCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert(t('admin.poi.gps_unsupported', { defaultValue: "Trình duyệt hoặc môi trường HTTP của bạn không hỗ trợ lấy vị trí GPS trực tiếp." }));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormLatitude(latitude.toFixed(7));
        setFormLongitude(longitude.toFixed(7));
        setLocating(false);
      },
      (error) => {
        console.warn("GPS retrieval failed:", error);
        alert(t('admin.poi.gps_failed', { defaultValue: "Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí trên thiết bị." }));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAutoTranslateThisLang = async () => {
    const viTrans = translations.find((tr) => tr.lang === 'vi');
    if (!viTrans || (!viTrans.title.trim() && !viTrans.ttsScript.trim())) {
      toast.error("Vui lòng điền tên và mô tả tiếng Việt trước khi dịch.");
      return;
    }
    setTranslating(true);
    try {
      let updatedTitle = currentTranslation.title;
      let updatedTts = currentTranslation.ttsScript;

      if (viTrans.title.trim()) {
        const titleRes = await apiClient.post('/api/admin/translate', {
          text: viTrans.title,
          targetLangs: [activeTab]
        });
        if (titleRes.data?.data?.[activeTab]) {
          updatedTitle = titleRes.data.data[activeTab];
        }
      }

      if (viTrans.ttsScript.trim()) {
        const ttsRes = await apiClient.post('/api/admin/translate', {
          text: viTrans.ttsScript,
          targetLangs: [activeTab]
        });
        if (ttsRes.data?.data?.[activeTab]) {
          updatedTts = ttsRes.data.data[activeTab];
        }
      }

      const updated = translations.map((tr) =>
        tr.lang === activeTab ? { ...tr, title: updatedTitle, ttsScript: updatedTts } : tr
      );
      setTranslations(updated);
      toast.success(`Dịch tự động sang ${languages.find(l => l.code === activeTab)?.label} thành công!`);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi dịch tự động.");
    } finally {
      setTranslating(false);
    }
  };

  const latVal = Number(formLatitude) || 10.77582;
  const lngVal = Number(formLongitude) || 106.70208;
  const radiusVal = Number(formRadius) || 25;
  const mapCenter: [number, number] = [latVal, lngVal];

  const markerEvents = useMemo(() => ({
    dragend(e: any) {
      const marker = e.target;
      if (marker != null) {
        const latLng = marker.getLatLng();
        setFormLatitude(latLng.lat.toFixed(7));
        setFormLongitude(latLng.lng.toFixed(7));
      }
    }
  }), [setFormLatitude, setFormLongitude]);

  return (
    <div className="w-full max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
      {error && <p className="text-xs font-bold text-red-600 mb-3">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Localized content, Vendor & Stall, Status & Premium */}
        <div className="space-y-4">
          {/* Multilingual Tabs */}
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {languages.map((lang) => {
              const isActive = activeTab === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setActiveTab(lang.code)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              );
            })}
          </div>

          {/* Localized Content fields */}
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                {t('poi.form_name')} ({languages.find((l) => l.code === activeTab)?.flag} {activeTab.toUpperCase()})
              </label>
              <input
                value={currentTranslation.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t('poi.form_name_placeholder')}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 transition shadow-inner focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                {t('common.description')} / TTS Script ({languages.find((l) => l.code === activeTab)?.flag} {activeTab.toUpperCase()})
              </label>
              <textarea
                value={currentTranslation.ttsScript}
                onChange={(e) => handleTtsScriptChange(e.target.value)}
                placeholder={t('poi.form_desc_placeholder')}
                className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 transition shadow-inner focus:bg-white resize-none"
              />
            </div>

            {activeTab !== 'vi' && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAutoTranslateThisLang}
                  disabled={translating}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {translating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang dịch...</span>
                    </>
                  ) : (
                    <span>Auto-Translate (Dịch tự động)</span>
                  )}
                </button>
              </div>
            )}


          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Vendor Selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1">
                {t('poi.form_vendor', { defaultValue: 'Nhà cung cấp (Vendor)' })}
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedVendorId(val);
                  if (val === 'unassigned') {
                    setFormStallId(stalls[0]?.id ?? '1');
                    setFormStatus('INACTIVE');
                  } else {
                    const vendorStalls = stalls.filter((s) => String(s.vendorId) === val);
                    if (vendorStalls.length > 0) {
                      setFormStallId(vendorStalls[0].id);
                    }
                  }
                }}
                className="w-full h-11 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-bold text-indigo-900 outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="unassigned">⚠️ {t('poi.unassigned_vendor', { defaultValue: 'Chưa gán nhà cung cấp (Tạm ngưng)' })}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    🏢 {v.businessName}
                  </option>
                ))}
              </select>
            </div>

            {/* Common Stall field */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                {t('poi.form_stall', { defaultValue: 'Sạp hàng (Stall)' })}
              </label>
              {selectedVendorId === 'unassigned' ? (
                <div className="w-full h-11 flex items-center px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400">
                  {t('poi.no_stall_unassigned', { defaultValue: 'Không có sạp (POI tạm ngưng)' })}
                </div>
              ) : (() => {
                const selectedVendor = vendors.find((v) => String(v.id) === selectedVendorId);
                const isPremium = selectedVendor?.subscription?.plan?.name?.toLowerCase().includes('premium') || String(selectedVendor?.subscription?.plan?.id) === '2';
                
                if (isPremium) {
                  return (
                    <select
                      value={formStallId}
                      onChange={(e) => setFormStallId(e.target.value)}
                      className="w-full h-11 rounded-xl border border-indigo-200 bg-indigo-50/20 px-3 text-sm font-semibold text-indigo-950 outline-none focus:border-indigo-500 focus:bg-white"
                    >
                      {stalls
                        .filter((s) => String(s.vendorId) === selectedVendorId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            🏪 {s.name}
                          </option>
                        ))}
                    </select>
                  );
                } else {
                  const vendorStalls = stalls.filter((s) => String(s.vendorId) === selectedVendorId);
                  const singleStall = vendorStalls[0];
                  return (
                    <div className="w-full h-11 flex items-center justify-between px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-inner">
                      <span className="truncate">🏪 {singleStall?.name || t('poi.only_stall', { defaultValue: 'Sạp hàng duy nhất' })}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-600 tracking-wide flex-shrink-0">
                        {t('poi.basic_plan', { defaultValue: 'Gói cơ bản' })}
                      </span>
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Common Zone field */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_zone', { defaultValue: 'Khu vực (Zone)' })}</label>
              <select
                value={formTourId}
                onChange={(e) => setFormTourId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              >
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
                {tours.length === 0 && <option value="">{t('poi.no_zone', { defaultValue: 'Không có khu vực nào' })}</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('common.status')}</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              >
                <option value="ACTIVE">{t('common.active')}</option>
                <option value="DRAFT">{t('common.draft')}</option>
                <option value="INACTIVE">{t('common.inactive')}</option>
                <option value="ARCHIVED">{t('common.archived')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPremiumContent"
              checked={formIsPremium}
              onChange={(e) => setFormIsPremium(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isPremiumContent" className="text-sm font-bold text-slate-700">
              {t('poi.premium_content')}
            </label>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
              Ảnh bìa POI
            </span>
            <div className="mt-2 flex items-center gap-3">
              {(formPreviewUrl || formCoverImageUrl) ? (
                <img
                  src={formPreviewUrl || (formCoverImageUrl.startsWith('/') ? `${window.location.origin}${formCoverImageUrl}` : formCoverImageUrl)}
                  alt="Cover"
                  className="h-16 w-16 rounded-xl border object-cover"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed text-slate-400 bg-slate-50">
                  <span className="text-[10px]">No Img</span>
                </div>
              )}
              <label className="cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                Chọn tệp ảnh từ thiết bị
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Kích thước tệp vượt quá 5MB!");
                        return;
                      }
                      
                      // Revoke previous object URL if any to prevent memory leaks
                      if (formPreviewUrl && formPreviewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(formPreviewUrl);
                      }
                      
                      setFormCoverFile(file);
                      const objectUrl = URL.createObjectURL(file);
                      setFormPreviewUrl(objectUrl);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map & Location Settings */}
        <div className="space-y-4">
          {/* Interactive Leaflet Map */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
            <span className="block p-2 text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
              📍 Bản đồ vị trí POI (Nhấp để chọn, kéo marker)
            </span>
            <div style={{ height: '235px', width: '100%' }}>
              <MapContainer center={mapCenter} zoom={17} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelected={(lat, lng) => {
                  setFormLatitude(lat.toFixed(6));
                  setFormLongitude(lng.toFixed(6));
                }} />
                <ChangeMapCenter center={mapCenter} />
                <Marker position={mapCenter} icon={customIcon} draggable={true} eventHandlers={markerEvents} />
                <Circle center={mapCenter} radius={radiusVal} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.15 }} />
              </MapContainer>
            </div>
          </div>

          {/* Coordinates & Radius section */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">{t('poi.coordinates_section', { defaultValue: 'Tọa độ GPS' })}</span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
              >
                {locating ? <Loader2 size={14} className="animate-spin" /> : <Compass size={14} />}
                {t('poi.get_current_location', { defaultValue: 'Lấy vị trí' })}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_latitude')}</label>
                <input
                  type="number"
                  step="any"
                  value={formLatitude}
                  onChange={(e) => setFormLatitude(e.target.value)}
                  placeholder="10.77582"
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_longitude')}</label>
                <input
                  type="number"
                  step="any"
                  value={formLongitude}
                  onChange={(e) => setFormLongitude(e.target.value)}
                  placeholder="106.70208"
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_radius_m')}</label>
                <input
                  type="number"
                  value={formRadius}
                  onChange={(e) => setFormRadius(e.target.value)}
                  placeholder="25"
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
