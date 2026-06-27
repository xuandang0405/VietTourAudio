import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, ImagePlus, Loader2, LocateFixed, MapPinned, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { useVendorStall } from '../../../vendor/api/vendorQueries';
import { submitVendorStallUpdate } from '../../../vendor/api/vendorApi';
import { appConfig } from '../../../config/appConfig';

const stallIcon = new L.DivIcon({
  className: 'vta-stall-marker',
  html: '<div style="width:36px;height:36px;background:#0D9488;border:3px solid #fff;border-radius:50%;box-shadow:0 4px 14px rgba(13,148,136,.45);display:grid;place-items:center"><span style="width:10px;height:10px;background:white;border-radius:50%"></span></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

function MapInteraction({ onMove }) {
  useMapEvents({ click: (event) => onMove(event.latlng.lat, event.latlng.lng) });
  return null;
}

function MapRecenter({ position }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, map.getZoom(), { animate: true, duration: 0.5 });
  }, [map, position]);
  return null;
}

function toPublicImageUrl(value) {
  if (!value || value.startsWith('blob:') || value.startsWith('data:') || /^https?:\/\//.test(value)) return value;
  return `${new URL(appConfig.vendorApiBaseUrl).origin}${value.startsWith('/') ? value : `/${value}`}`;
}

export function VendorStall() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useVendorStall();
  const stall = data?.stall;
  const markerRef = useRef(null);
  const [form, setForm] = useState({ name: '', description: '', latitude: 10.77582, longitude: 106.70208 });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!stall) return;
    setForm({
      name: stall.pendingName ?? stall.name ?? '',
      description: stall.pendingDescription ?? stall.description ?? '',
      latitude: Number(stall.pendingLatitude ?? stall.latitude),
      longitude: Number(stall.pendingLongitude ?? stall.longitude)
    });
    setPreviewImage(toPublicImageUrl(stall.pendingCoverImageUrl ?? stall.imageUrl ?? ''));
  }, [stall]);

  useEffect(() => () => {
    if (previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
  }, [previewImage]);

  const position = useMemo(() => [form.latitude, form.longitude], [form.latitude, form.longitude]);
  const moveMarker = useCallback((latitude, longitude) => {
    setForm((current) => ({ ...current, latitude, longitude }));
    setMessage({ type: '', text: '' });
  }, []);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setMessage({ type: 'error', text: t('stall.error_file_type') });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('stall.error_max_size') });
      return;
    }
    if (previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  }

  function locateDevice() {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: t('stall.geolocation_unavailable') });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        moveMarker(coords.latitude, coords.longitude);
        setLocating(false);
      },
      () => {
        setMessage({ type: 'error', text: t('stall.geolocation_failed') });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage({ type: '', text: '' });
    const payload = new FormData();
    payload.append('name', form.name.trim());
    payload.append('description', form.description.trim());
    payload.append('latitude', String(form.latitude));
    payload.append('longitude', String(form.longitude));
    if (imageFile) payload.append('image', imageFile);
    try {
      await submitVendorStallUpdate(payload);
      setImageFile(null);
      setMessage({ type: 'success', text: t('stall.submitted_for_approval') });
      await refetch();
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.response?.data?.error ?? t('stall.error_save') });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="p-8 text-sm font-bold text-slate-500">{t('vendor.loading_stall')}</div>;
  if (error || !stall) return <div className="p-8 text-sm font-bold text-red-700">{error?.response?.data?.error ?? t('stall.error_load')}</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">{t('sidebar.stall_location')}</h2>
        <p className="mt-1 text-slate-500">{t('stall.description')}</p>
      </header>

      {stall.approvalStatus === 'PENDING' && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          {t('stall.pending_approval_notice')}
        </div>
      )}
      {message.text && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <MapContainer center={position} zoom={18} style={{ height: 560, width: '100%' }} scrollWheelZoom>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <MapInteraction onMove={moveMarker} />
            <MapRecenter position={position} />
            <Marker
              position={position}
              icon={stallIcon}
              draggable
              ref={markerRef}
              eventHandlers={{ dragend: () => {
                const next = markerRef.current?.getLatLng();
                if (next) moveMarker(next.lat, next.lng);
              } }}
            />
            <Circle center={position} radius={stall.activationRadius} pathOptions={{ color: '#0D9488', fillOpacity: 0.12 }} />
          </MapContainer>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><MapPinned size={17} />{t('poi.coordinates')}</h3>
              <button type="button" onClick={locateDevice} disabled={locating} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-50">
                {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                {t('stall.use_my_location')}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">{t('stall.map_instruction')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs font-bold">
              <span className="rounded-lg bg-slate-50 p-2">{form.latitude.toFixed(7)}</span>
              <span className="rounded-lg bg-slate-50 p-2">{form.longitude.toFixed(7)}</span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs font-bold text-teal-700"><Crosshair size={14} />{t('stall.radius_display', { radius: stall.activationRadius })}</p>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-xs font-bold text-slate-600">
              {t('vendor.trade_name')}
              <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              {t('common.description')}
              <textarea rows={3} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm" />
            </label>
            <div>
              <span className="text-xs font-bold text-slate-600">{t('stall.cover_image')}</span>
              <div className="mt-2 flex items-center gap-3">
                {previewImage ? <img src={previewImage} alt={t('stall.cover_image')} className="h-20 w-20 rounded-xl border object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed text-slate-400"><ImagePlus /></div>}
                <label className="cursor-pointer rounded-xl border px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  {t('stall.select_image')}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-400">{t('stall.image_requirements')}</p>
            </div>
          </section>

          <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? t('common.saving') : t('stall.save_stall')}
          </button>
        </aside>
      </div>
    </div>
  );
}
