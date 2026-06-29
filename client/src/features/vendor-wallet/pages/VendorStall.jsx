import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, ImagePlus, Loader2, LocateFixed, MapPinned, Save, Plus, Music, HelpCircle, CheckCircle2, Trash2, Edit2, Check, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { useVendorMyStalls } from '../../../vendor/api/vendorQueries';
import { createVendorStall, submitVendorStallUpdate, vendorApiClient, fetchPoiProducts, createPoiProduct, updatePoiProduct, deletePoiProduct } from '../../../vendor/api/vendorApi';
import { appConfig } from '../../../config/appConfig';
import { subscribeRealtime } from '../../../services/realtimeClient';

const stallIcon = new L.DivIcon({
  className: 'vta-stall-marker',
  html: '<div style="width:36px;height:36px;background:#0D9488;border:3px solid #fff;border-radius:50%;box-shadow:0 4px 14px rgba(13,148,136,.45);display:grid;place-items:center"><span style="width:10px;height:10px;background:white;border-radius:50%"></span></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

function MapInteraction({ onMove }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onMove(Number.parseFloat(lat.toFixed(6)), Number.parseFloat(lng.toFixed(6)));
    }
  });
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
  const { data: stallsData, isLoading, error, refetch } = useVendorMyStalls();
  const stall = stallsData?.[0];
  const markerRef = useRef(null);

  // Unified form state
  const [form, setForm] = useState({ name: '', description: '', latitude: 10.77582, longitude: 106.70208 });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  
  // Translations preview state
  const [translations, setTranslations] = useState({});
  const [activeLangTab, setActiveLangTab] = useState('vi');

  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Products state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('30000');
  const [editingProdId, setEditingProdId] = useState(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');

  useEffect(() => {
    if (stall?.id) {
      setLoadingProducts(true);
      fetchPoiProducts(stall.id)
        .then((res) => setProducts(res.products ?? []))
        .catch((err) => console.error('Failed to load products:', err))
        .finally(() => setLoadingProducts(false));
    }
  }, [stall?.id]);

  const daysRemaining = stall?.premiumExpiryDate
    ? Math.ceil((new Date(stall.premiumExpiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  async function loadTranslations() {
    try {
      const res = await vendorApiClient.get('/content');
      const data = res.data?.data?.contents ?? [];
      const transMap = {};
      data.forEach(item => {
        transMap[item.language] = {
          title: item.title,
          ttsScript: item.ttsScript,
          approvalStatus: item.approvalStatus
        };
      });
      setTranslations(transMap);
    } catch (err) {
      console.error("Failed to load translations:", err);
    }
  }

  useEffect(() => {
    if (!stall) return;
    setForm({
      name: stall.pendingName ?? stall.name ?? '',
      description: stall.pendingDescription ?? stall.description ?? '',
      latitude: Number(stall.pendingLatitude ?? stall.latitude),
      longitude: Number(stall.pendingLongitude ?? stall.longitude)
    });
    setPreviewImage(toPublicImageUrl(stall.pendingCoverImageUrl ?? stall.imageUrl ?? ''));
    loadTranslations();
  }, [stall]);

  useEffect(() => () => {
    if (previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
  }, [previewImage]);

  useEffect(() => {
    if (!stall?.id) return undefined;
    const onStatusUpdated = (stallId, status) => {
      if (String(stallId) !== String(stall.id)) return;
      setMessage({
        type: status === 'APPROVED' ? 'success' : 'error',
        text: status === 'APPROVED'
          ? t('stall.published', { defaultValue: 'Đã xuất bản / Hoàn tất' })
          : t('stall.rejected', { defaultValue: 'Yêu cầu cập nhật chưa được duyệt' })
      });
      refetch();
    };
    return subscribeRealtime('StallStatusUpdated', onStatusUpdated);
  }, [refetch, stall?.id, t]);

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
      setMessage({ type: 'success', text: 'Đã gửi yêu cầu cập nhật lên Admin phê duyệt và kích hoạt dịch tự động đa ngôn ngữ!' });
      await refetch();
      // Reload translations after auto-translate pipeline completes
      await loadTranslations();
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.response?.data?.error ?? t('stall.error_save') });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSecondaryStall() {
    if (!stall?.isPremium || stallsData.length >= 3) return;
    const name = window.prompt(
      t('stall.secondary_name_prompt', { defaultValue: 'Nhập tên sạp phụ mới:' })
    )?.trim();
    if (!name) return;
    try {
      await createVendorStall({
        name,
        description: t('stall.secondary_default_description', {
          defaultValue: 'Vui lòng cập nhật mô tả sạp hàng của bạn.'
        }),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      });
      setMessage({
        type: 'success',
        text: t('stall.secondary_created', {
          defaultValue: 'Đã tạo sạp phụ và gửi Admin phê duyệt.'
        })
      });
      await refetch();
    } catch (requestError) {
      setMessage({
        type: 'error',
        text: requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          t('stall.error_save')
      });
    }
  }
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;
    try {
      await createPoiProduct(stall.id, {
        name: newProdName.trim(),
        price: Number(newProdPrice)
      });
      const refreshed = await fetchPoiProducts(stall.id);
      setProducts(refreshed.products ?? []);
      setNewProdName('');
      setNewProdPrice('30000');
    } catch (err) {
      alert(t('poi.product_add_error', { defaultValue: 'Lỗi khi thêm sản phẩm' }));
    }
  };

  const handleStartEdit = (prod) => {
    setEditingProdId(prod.id);
    setEditProdName(prod.name);
    setEditProdPrice(String(prod.price));
  };

  const handleUpdateProduct = async (productId) => {
    if (!editProdName.trim() || !editProdPrice) return;
    try {
      await updatePoiProduct(stall.id, productId, {
        name: editProdName.trim(),
        price: Number(editProdPrice)
      });
      const refreshed = await fetchPoiProducts(stall.id);
      setProducts(refreshed.products ?? []);
      setEditingProdId(null);
    } catch (err) {
      alert(t('poi.product_update_error', { defaultValue: 'Lỗi khi cập nhật sản phẩm' }));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(t('poi.product_delete_confirm', { defaultValue: 'Bạn có chắc chắn muốn xoá sản phẩm này?' }))) return;
    try {
      await deletePoiProduct(stall.id, productId);
      const refreshed = await fetchPoiProducts(stall.id);
      setProducts(refreshed.products ?? []);
    } catch (err) {
      alert(t('poi.product_delete_error', { defaultValue: 'Lỗi khi xoá sản phẩm' }));
    }
  };

  const languages = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  if (isLoading) return <div className="p-8 text-sm font-bold text-slate-500">{t('vendor.loading_stall')}</div>;
  if (error || !stall) return <div className="p-8 text-sm font-bold text-red-700">{error?.response?.data?.error ?? t('stall.error_load')}</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900">{t('sidebar.stall_poi_management', { defaultValue: 'Quản lý sạp hàng (POI)' })}</h2>
            {stall.isPremium && (
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-extrabold px-3 py-1 rounded-full animate-bounce shadow-[0_2px_8px_rgba(251,191,36,0.4)]">
                ★ PREMIUM GOLD
              </span>
            )}
          </div>
          <p className="mt-1 text-slate-500">Cập nhật hồ sơ sạp hàng, vị trí GPS, cover image và bài giới thiệu audio đa ngôn ngữ.</p>
        </div>

        {stall.isPremium ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-amber-600">Đặc quyền Premium</p>
              <p className="text-[11px] font-bold text-slate-400">Thời hạn còn {daysRemaining} ngày</p>
            </div>
            <button
              type="button"
              disabled={stallsData.length >= 3}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleAddSecondaryStall}
            >
              <Plus size={16} />
              {stallsData.length >= 3
                ? t('stall.limit_reached', { defaultValue: 'Đã đạt giới hạn 3 sạp' })
                : t('stall.add_secondary', { defaultValue: 'Thêm sạp phụ (+)' })}
            </button>
          </div>
        ) : (
          <div className="bg-slate-100 rounded-xl px-4 py-2 border border-slate-200 text-xs text-slate-500 font-bold max-w-xs">
            💡 Nâng cấp gói Premium để mở khóa 3 sạp và chế độ định vị 10m.
          </div>
        )}
      </header>

      {stall.approvalStatus === 'PENDING' ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          {t('stall.pending_approval_notice')}
        </div>
      ) : stall.approvalStatus === 'APPROVED' && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.16)]">
          {t('stall.published', { defaultValue: 'Đã xuất bản / Hoàn tất' })}
        </div>
      )}
      {message.text && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Unified Editor Form Container */}
      <div className={`grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] p-2 rounded-3xl transition-all duration-300 ${stall.isPremium ? 'border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.3)] bg-gradient-to-br from-slate-900/[0.02] via-slate-950/[0.01] to-amber-950/[0.03]' : 'border border-slate-200'}`}>
        
        {/* Left Column: Interactive GIS Map */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm h-[560px]">
          <MapContainer center={position} zoom={18} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
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

        {/* Right Column: Information & Media Streams */}
        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><MapPinned size={17} />{t('poi.coordinates')}</h3>
              <button type="button" onClick={locateDevice} disabled={locating} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-50">
                {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                {t('stall.use_my_location', { defaultValue: 'Lấy vị trí của tôi' })}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">{t('stall.map_instruction', { defaultValue: 'Chấm một vị trí trên Google Map làm tọa độ trung tâm' })}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs font-bold">
              <span className="rounded-lg bg-slate-50 p-2">{form.latitude.toFixed(7)}</span>
              <span className="rounded-lg bg-slate-50 p-2">{form.longitude.toFixed(7)}</span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs font-bold text-teal-700"><Crosshair size={14} />{t('stall.radius_display', { radius: stall.activationRadius, defaultValue: 'Bán kính vùng kích hoạt phát thanh thuyết minh' })}</p>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-xs font-bold text-slate-600">
              Tên Sạp Thuyết Minh (Tiếng Việt)
              <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-teal-500 transition focus:bg-white" />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Bài Thuyết Minh TTS (Tiếng Việt)
              <textarea rows={4} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-teal-500 transition focus:bg-white resize-none" placeholder="Nhập kịch bản giọng đọc giới thiệu về sạp..." />
            </label>

            {/* Cover Image Uploader */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-600">{t('stall.cover_image', { defaultValue: 'Ảnh bìa sạp hàng' })}</span>
              <div className="mt-2 flex items-center gap-3">
                {previewImage ? <img src={previewImage} alt={t('stall.cover_image', { defaultValue: 'Ảnh bìa sạp hàng' })} className="h-16 w-16 rounded-xl border object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed text-slate-400"><ImagePlus /></div>}
                <label className="cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  {t('stall.select_image', { defaultValue: 'Chọn tệp ảnh từ thiết bị' })}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>
          </section>

          <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-50 active:scale-[0.98]">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Đang gửi yêu cầu duyệt sạp hàng lên Ban quản trị...' : 'Lưu Thay Đổi & Dịch Tự Động'}
          </button>
        </aside>
      </div>

      {/* Translations Preview Card Tab System */}
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <HelpCircle className="text-teal-600" size={20} />
          Bản Dịch Đa Ngôn Ngữ Tự Động (Background Translations)
        </h3>
        <p className="text-xs text-slate-500 mt-1">Khi bạn lưu thay đổi, hệ thống sẽ tự động tạo bản dịch TTS sang 4 ngôn ngữ khác.</p>
        
        {/* Language Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-4 border-b border-slate-100 pb-3">
          {languages.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveLangTab(lang.code)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${activeLangTab === lang.code ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Preview */}
        <div className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[120px]">
          {activeLangTab === 'vi' ? (
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {form.name || 'Chưa nhập tên'}
              </h4>
              <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">
                {form.description || 'Chưa nhập mô tả thuyết minh'}
              </p>
            </div>
          ) : (
            (() => {
              const trans = translations[activeLangTab];
              if (!trans) {
                return (
                  <p className="text-xs text-slate-400 italic">Hệ thống sẽ dịch tự động sang ngôn ngữ này sau khi bạn lưu thay đổi.</p>
                );
              }
              return (
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    {trans.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">
                    {trans.ttsScript}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md inline-block border border-teal-100">
                    Trạng thái duyệt: {trans.approvalStatus?.toUpperCase()}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </section>

      {/* Product Catalog Section */}
      {stall?.id && (
        <div className="mt-8 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">{t('poi.products_catalog', { defaultValue: 'Danh mục sản phẩm của sạp' })}</h2>
              <p className="text-xs text-slate-500 mt-1">{t('poi.products_catalog_desc', { defaultValue: 'Sản phẩm và giá tiền hiển thị trực tiếp cho khách mua trên thiết bị di động.' })}</p>
            </div>
          </div>

          {/* Add Product Form */}
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-[1fr_200px_auto] gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <input
              type="text"
              required
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              placeholder={t('poi.new_product_name', { defaultValue: 'Tên sản phẩm (ví dụ: Trà đào, Bánh mì...)' })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
            <input
              type="number"
              required
              value={newProdPrice}
              onChange={(e) => setNewProdPrice(e.target.value)}
              placeholder={t('poi.new_product_price', { defaultValue: 'Giá tiền (VND)' })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-4 transition active:scale-[0.98]"
            >
              <Plus size={14} />
              {t('common.add', { defaultValue: 'Thêm' })}
            </button>
          </form>

          {/* Products List Table */}
          {loadingProducts ? (
            <div className="text-center py-6 text-xs text-slate-500 font-bold">{t('common.loading', { defaultValue: 'Đang tải...' })}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">{t('poi.product_name', { defaultValue: 'Tên sản phẩm' })}</th>
                    <th className="p-3">{t('poi.product_price', { defaultValue: 'Giá bán' })}</th>
                    <th className="p-3 text-center w-28">{t('common.actions', { defaultValue: 'Hành động' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod, idx) => (
                    <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50 transition text-xs font-semibold">
                      <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        {editingProdId === prod.id ? (
                          <input
                            type="text"
                            value={editProdName}
                            onChange={(e) => setEditProdName(e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
                          />
                        ) : (
                          <span className="font-bold text-slate-800">{prod.name}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {editingProdId === prod.id ? (
                          <input
                            type="number"
                            value={editProdPrice}
                            onChange={(e) => setEditProdPrice(e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded-lg w-32 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
                          />
                        ) : (
                          <span className="font-extrabold text-teal-600">{Number(prod.price).toLocaleString()} VND</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {editingProdId === prod.id ? (
                          <div className="flex justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateProduct(prod.id)}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProdId(null)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(prod)}
                              className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-xs text-slate-400 font-bold">
                        {t('poi.no_products', { defaultValue: 'Sạp chưa đăng ký sản phẩm nào.' })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
