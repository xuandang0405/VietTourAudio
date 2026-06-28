import { Edit3, MapPin, Plus, Search, Trash2, Store } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { adminApiClient } from '../../../admin/api/adminApi';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { AdminModal } from '../../../admin/components/AdminModal';
import { POIForm } from '../../poi/components/POIForm';
import { 
  useTours, 
  useTour, 
  useCreateTour, 
  useUpdateTour, 
  useDeleteTour, 
  useArchiveTour,
  useStallsList,
  useCreatePoi,
  useUpdatePoi,
  useDeletePoi,
  useVendors
} from '../../../admin/api/adminQueries';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { resolveBackendMediaUrl } from '../../../utils/mediaUrl';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function ChangeMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export function ZoneManagement() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(() => {
    return searchParams.get('id') || null;
  });

  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) {
      setSelectedZoneId(urlId);
    }
  }, [searchParams]);

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null); // { type: 'add' | 'edit' | 'delete' | 'add-poi' | 'edit-poi' | 'delete-poi', zone?: any, poi?: any }
  const [stallsModalZone, setStallsModalZone] = useState<any>(null);
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Zone Form State
  const [formName, setFormName] = useState('');
  const [formVendorId, setFormVendorId] = useState('');
  const [formZoneCode, setFormZoneCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImageUrl, setFormCoverImageUrl] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formStatus, setFormStatus] = useState('DRAFT');
  const [formIsPremium, setFormIsPremium] = useState(false);

  // Cover Image dual-mode & GPS tracking states
  const [coverImageMode, setCoverImageMode] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [locatingGps, setLocatingGps] = useState(false);

  // Coordinate aliases to match requirements
  const centerLatitude = formLatitude;
  const setCenterLatitude = setFormLatitude;
  const centerLongitude = formLongitude;
  const setCenterLongitude = setFormLongitude;

  // POI Form State
  const [poiFormName, setPoiFormName] = useState('');
  const [poiFormStallId, setPoiFormStallId] = useState('');
  const [poiFormTourId, setPoiFormTourId] = useState('');
  const [poiFormDescription, setPoiFormDescription] = useState('');
  const [poiFormLatitude, setPoiFormLatitude] = useState('');
  const [poiFormLongitude, setPoiFormLongitude] = useState('');
  const [poiFormRadius, setPoiFormRadius] = useState('25');
  const [poiFormIsPremium, setPoiFormIsPremium] = useState(false);
  const [poiFormStatus, setPoiFormStatus] = useState('ACTIVE');
  const [poiFormTranslations, setPoiFormTranslations] = useState<any[]>([
    { lang: 'vi', title: '', ttsScript: '' },
    { lang: 'en', title: '', ttsScript: '' },
    { lang: 'ja', title: '', ttsScript: '' },
    { lang: 'ko', title: '', ttsScript: '' },
    { lang: 'zh', title: '', ttsScript: '' }
  ]);

  // Queries & Mutations
  const { data: tours = [], isLoading, error: fetchError, refetch } = useTours();
  const { data: stalls = [] } = useStallsList();
  const { data: vendorsList = [] } = useVendors({ status: 'ALL' });
  const { data: selectedTourDetail, isLoading: selectedTourLoading, refetch: refetchTourDetail } = useTour(selectedZoneId);

  const assignedVendor = useMemo(() => {
    if (!selectedTourDetail?.vendorId) return null;
    return vendorsList.find((v: any) => String(v.id) === String(selectedTourDetail.vendorId));
  }, [vendorsList, selectedTourDetail]);



  const createMutation = useCreateTour();
  const updateMutation = useUpdateTour();
  const deleteMutation = useDeleteTour();
  const archiveMutation = useArchiveTour();

  const createPoiMutation = useCreatePoi();
  const updatePoiMutation = useUpdatePoi();
  const deletePoiMutation = useDeletePoi();

  const refreshData = () => {
    refetch();
    if (selectedZoneId) refetchTourDetail();
  };

  const handleResetQrCode = async (targetId: any) => {
    if (!targetId) return;
    try {
      setIsResetting(true);
      const response = await adminApiClient.post(`/admin/zones/reset-qr/${targetId}`);
      if (response.data.success || response.status === 200) {
        toast.success(t('notifications.reset_qr_success', { defaultValue: 'Cập nhật mã QR thành công!' }));
        refreshData();
      }
    } catch (e) {
      console.error("QR Code mutation sequence broken:", e);
      toast.error(t('notifications.reset_qr_error', { defaultValue: 'Không thể reset mã QR. Vui lòng thử lại.' }));
    } finally {
      setIsResetting(false);
    }
  };

  const downloadQrCode = () => {
    if (!selectedTourDetail) return;
    const canvas = document.getElementById(`qr-canvas-${selectedTourDetail.id}`);
    if (!canvas) {
      toast.error("Không tìm thấy QR code canvas.");
      return;
    }
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-zone-${selectedTourDetail.slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQrCode = () => {
    if (!selectedTourDetail) return;
    const canvas = document.getElementById(`qr-canvas-${selectedTourDetail.id}`);
    if (!canvas) {
      toast.error("Không tìm thấy QR code canvas.");
      return;
    }
    const url = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt popup blocker.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>In mã QR Code - ${selectedTourDetail.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 90vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
            }
            .card {
              border: 2px solid #e2e8f0;
              border-radius: 16px;
              padding: 24px;
              max-width: 320px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              background: #ffffff;
            }
            img {
              width: 220px;
              height: 220px;
              margin-bottom: 12px;
            }
            .code-badge {
              font-family: monospace;
              font-size: 0.95rem;
              font-weight: bold;
              background-color: #f1f5f9;
              color: #0f172a;
              padding: 6px 12px;
              border-radius: 8px;
              margin-bottom: 14px;
              border: 1px dashed #cbd5e1;
              display: inline-block;
            }
            h1 {
              font-size: 1.25rem;
              margin: 0 0 8px 0;
              color: #0f172a;
            }
            p {
              font-size: 0.875rem;
              margin: 0;
              color: #64748b;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${url}" alt="QR Code" />
            <div class="code-badge">Mã QR Code: ${selectedTourDetail.qrCode}</div>
            <h1>${selectedTourDetail.name}</h1>
            <p>${window.location.origin}/zone/${selectedTourDetail.slug}</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleArchiveZone = async (zoneId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn lưu trữ khu vực này không? Các POIs con vẫn tiếp tục hoạt động bình thường.")) return;
    try {
      await archiveMutation.mutateAsync(zoneId);
      toast.success("Đã chuyển trạng thái khu vực sang Lưu trữ.");
      refreshData();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Lỗi khi lưu trữ khu vực.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('zone.file_too_large', { defaultValue: 'Kích thước tệp vượt quá 5MB!' }));
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl('');
    }
  };

  const handleGetCurrentGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error(t('zone.gps_unsupported', { defaultValue: "Trình duyệt của bạn không hỗ trợ lấy vị trí GPS." }));
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenterLatitude(latitude.toFixed(6));
        setCenterLongitude(longitude.toFixed(6));
        setLocatingGps(false);
        toast.success(t('zone.gps_success', { defaultValue: "Đã lấy vị trí hiện tại thành công!" }));
      },
      (error) => {
        console.warn("GPS retrieval failed:", error);
        toast.error(t('zone.gps_failed', { defaultValue: "Không thể lấy vị trí GPS. Vui lòng cấp quyền truy cập." }));
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const latVal = Number(centerLatitude) || 10.77582;
  const lngVal = Number(centerLongitude) || 106.70208;

  function MapClickPicker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const preciseLatitude = Number.parseFloat(lat.toFixed(6));
        const preciseLongitude = Number.parseFloat(lng.toFixed(6));
        console.log(`📌 Map Pinpoint Selected: Lat ${preciseLatitude.toFixed(6)}, Lng ${preciseLongitude.toFixed(6)}`);
        setCenterLatitude(preciseLatitude.toFixed(6));
        setCenterLongitude(preciseLongitude.toFixed(6));
      },
    });
    const latNum = Number(centerLatitude);
    const lngNum = Number(centerLongitude);
    return (centerLatitude && centerLongitude && !isNaN(latNum) && !isNaN(lngNum)) ? (
      <Marker position={[latNum, lngNum]} icon={customIcon} />
    ) : null;
  }

  const nearbyStalls = useMemo(() => {
    if (!stallsModalZone || stallsModalZone.latitude === null || stallsModalZone.longitude === null) return [];
    return stalls
      .map((s: any) => {
        if (s.latitude === null || s.longitude === null) return null;
        const distance = distanceMeters(
          Number(stallsModalZone.latitude),
          Number(stallsModalZone.longitude),
          Number(s.latitude),
          Number(s.longitude)
        );
        return { ...s, distance };
      })
      .filter((s: any) => s !== null && s.distance <= 1000)
      .sort((a: any, b: any) => a.distance - b.distance);
  }, [stalls, stallsModalZone]);

  const filteredZones = useMemo(() => {
    return tours.filter((tour: any) =>
      (tour.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (tour.slug ?? '').toLowerCase().includes(search.toLowerCase())
    );
  }, [tours, search]);

  const openAddModal = () => {
    setError('');
    setFormName('');
    setFormVendorId(String(vendorsList[0]?.id ?? ''));
    setFormZoneCode('');
    setFormDescription('');
    setFormCoverImageUrl('');
    setFormLatitude('');
    setFormLongitude('');
    setFormStatus('DRAFT');
    setFormIsPremium(false);
    setCoverImageMode('upload');
    setSelectedFile(null);
    setPreviewUrl('');
    setModal({ type: 'add' });
  };

  const openEditModal = (zone: any) => {
    setError('');
    setFormName(zone.name ?? '');
    setFormVendorId(String(zone.vendorId ?? ''));
    setFormZoneCode(zone.slug ?? '');
    setFormDescription(zone.description ?? '');
    setFormCoverImageUrl(zone.coverImageUrl ?? '');
    setFormLatitude(zone.latitude !== null ? String(zone.latitude) : '');
    setFormLongitude(zone.longitude !== null ? String(zone.longitude) : '');
    setFormStatus(zone.status ?? 'DRAFT');
    setFormIsPremium(Boolean(zone.isPremium));
    
    if (zone.coverImageUrl && !zone.coverImageUrl.startsWith('http') && zone.coverImageUrl.includes('/uploads/')) {
      setCoverImageMode('upload');
      setSelectedFile(null);
      setPreviewUrl(zone.coverImageUrl);
    } else {
      setCoverImageMode(zone.coverImageUrl ? 'url' : 'upload');
      setSelectedFile(null);
      setPreviewUrl('');
    }
    
    setModal({ type: 'edit', zone });
  };

  const handleConfirmDeleteZone = async (zoneId: string) => {
    if (!window.confirm("Cảnh báo: Xóa khu vực này sẽ gỡ bỏ toàn bộ sạp hàng Vendor trực thuộc! Bạn có chắc chắn muốn xóa?")) return;

    try {
      const response = await adminApiClient.delete(`/admin/zones/${zoneId}`);
      if (response.data?.success || response.status === 200) {
        toast.success("Xóa khu vực khỏi hệ thống thành công!");
        setSelectedZoneId(null);
        refreshData();
      }
    } catch (error: any) {
      console.error("Zone deletion aborted fault trace:", error);
      toast.error(`Không thể xóa khu vực: ${error.response?.data?.message || "Lỗi kết nối 500."}`);
    }
  };

  const openAddPoiModal = (tourId: string) => {
    setError('');
    setPoiFormName('');
    setPoiFormStallId(stalls[0]?.id ?? '1');
    setPoiFormTourId(tourId);
    setPoiFormDescription('');
    setPoiFormLatitude('10.77582');
    setPoiFormLongitude('106.70208');
    setPoiFormRadius('25');
    setPoiFormIsPremium(false);
    setPoiFormStatus('ACTIVE');
    setPoiFormTranslations([
      { lang: 'vi', title: '', ttsScript: '' },
      { lang: 'en', title: '', ttsScript: '' },
      { lang: 'ja', title: '', ttsScript: '' },
      { lang: 'ko', title: '', ttsScript: '' },
      { lang: 'zh', title: '', ttsScript: '' }
    ]);
    setModal({ type: 'add-poi' });
  };

  const openEditPoiModal = (poi: any) => {
    setError('');
    setPoiFormName(poi.name ?? '');
    setPoiFormStallId(poi.stallId ?? (stalls[0]?.id ?? '1'));
    setPoiFormTourId(poi.tourId ? String(poi.tourId) : (selectedZoneId ?? ''));
    setPoiFormDescription(poi.description ?? '');
    setPoiFormLatitude(String(poi.latitude ?? ''));
    setPoiFormLongitude(String(poi.longitude ?? ''));
    setPoiFormRadius(String(poi.activationRadius ?? '25'));
    setPoiFormIsPremium(Boolean(poi.isPremiumContent));
    setPoiFormStatus(poi.status ?? 'ACTIVE');

    const list = poi?.translations ?? [];
    const safeTrans = ['vi', 'en', 'ja', 'ko', 'zh'].map((lang) => {
      const match = list.find((item: any) => item.lang === lang);
      if (match) {
        return { lang, title: match.title ?? '', ttsScript: match.ttsScript ?? '' };
      }
      if (lang === 'vi') {
        return { lang, title: poi?.name ?? '', ttsScript: poi?.description ?? '' };
      }
      return { lang, title: '', ttsScript: '' };
    });
    setPoiFormTranslations(safeTrans);
    setModal({ type: 'edit-poi', poi });
  };

  const openDeletePoiModal = (poi: any) => {
    setError('');
    setModal({ type: 'delete-poi', poi });
  };

  const handleConfirm = async () => {
    if (!modal) return;
    setError('');

    try {
      if (modal.type === 'delete') {
        await deleteMutation.mutateAsync(modal.zone.id);
        setSelectedZoneId(null);
        setModal(null);
        refreshData();
      } else if (modal.type === 'delete-poi') {
        await deletePoiMutation.mutateAsync(modal.poi.id);
        setModal(null);
        refreshData();
      } else if (modal.type === 'add' || modal.type === 'edit') {
        if (!formName.trim()) {
          setError(t('zone.error_name_empty', { defaultValue: 'Tên khu vực không được để trống' }));
          return;
        }
        const lat = formLatitude.trim() ? Number(formLatitude) : null;
        const lng = formLongitude.trim() ? Number(formLongitude) : null;
        if (lat === null || isNaN(lat) || lat < -90 || lat > 90) {
          setError(t('zone.error_lat_invalid', { defaultValue: 'Vĩ độ không hợp lệ (-90 đến 90)' }));
          return;
        }
        if (lng === null || isNaN(lng) || lng < -180 || lng > 180) {
          setError(t('zone.error_lng_invalid', { defaultValue: 'Kinh độ không hợp lệ (-180 đến 180)' }));
          return;
        }
        const formData = new FormData();
        formData.append("name", formName.trim());
        if (formZoneCode.trim()) formData.append("slug", formZoneCode.trim());
        if (formDescription.trim()) formData.append("description", formDescription.trim());
        formData.append("status", formStatus);
        formData.append("isPremium", String(formIsPremium));
        formData.append("latitude", lat.toFixed(6));
        formData.append("longitude", lng.toFixed(6));

        if (coverImageMode === 'upload') {
          if (selectedFile) {
            formData.append("coverFile", selectedFile);
          } else if (previewUrl && !previewUrl.startsWith('blob:')) {
            formData.append("coverImageUrl", previewUrl);
          }
        } else {
          if (formCoverImageUrl.trim()) {
            formData.append("coverImageUrl", formCoverImageUrl.trim());
          }
        }

        if (modal.type === 'add') {
          await createMutation.mutateAsync(formData);
        } else {
          await updateMutation.mutateAsync({ id: modal.zone.id, data: formData });
        }
        setModal(null);
        refreshData();
      } else if (modal.type === 'add-poi' || modal.type === 'edit-poi') {
        if (!poiFormName.trim()) { setError(t('poi.error_name_empty')); return; }
        if (!poiFormTourId) { setError('Vui lòng chọn Khu vực'); return; }
        if (!poiFormStallId) { setError(t('poi.error_stall_empty')); return; }
        const lat = Number(poiFormLatitude);
        const lng = Number(poiFormLongitude);
        const rad = Number(poiFormRadius);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) { setError(t('poi.error_lat_invalid')); return; }
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) { setError(t('poi.error_lng_invalid')); return; }
        if (!Number.isFinite(rad) || rad <= 0) { setError(t('poi.error_radius_invalid')); return; }

        const payload = {
          tourId: Number(poiFormTourId),
          stallId: Number(poiFormStallId),
          name: poiFormName.trim(),
          description: poiFormDescription.trim(),
          latitude: lat,
          longitude: lng,
          activationRadius: rad,
          isPremiumContent: poiFormIsPremium,
          status: poiFormStatus,
          translations: poiFormTranslations
        };

        if (modal.type === 'add-poi') {
          await createPoiMutation.mutateAsync(payload);
        } else {
          await updatePoiMutation.mutateAsync({ id: modal.poi.id, data: payload });
        }
        setModal(null);
        refreshData();
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? t('zone.error_save', { defaultValue: 'Lỗi khi thực hiện thao tác.' }));
    }
  };

  const poiColumns = [
    {
      key: 'id',
      label: 'Mã POI',
      render: (poi: any) => <span className="font-mono font-bold text-slate-800">#{poi.id}</span>
    },
    {
      key: 'name',
      label: 'Tên POI / Thuyết minh',
      render: (poi: any) => (
        <div>
          <p className="font-black text-slate-950">{poi.name}</p>
          <span className="mt-1 inline-block"><AdminBadge status={poi.status} /></span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Thao tác',
      cellClassName: 'px-4 py-3 text-right',
      render: (poi: any) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openEditPoiModal(poi)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Sửa POI"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => openDeletePoiModal(poi)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
            title="Xóa POI"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow={t('zone.subtitle', { defaultValue: 'Quản lý thông tin' })}
        title={t('zone.title', { defaultValue: 'Danh sách Festival Zones' })}
        description={t('zone.description', { defaultValue: 'Quản lý các khu vực lễ hội và tọa độ trung tâm của chúng.' })}
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            {t('zone.add', { defaultValue: 'Thêm Khu vực' })}
          </button>
        }
      />

      {(error || fetchError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error || fetchError?.response?.data?.error || t('zone.error_load', { defaultValue: 'Không thể tải danh sách khu vực.' })}
        </div>
      )}

      {/* Unified Master-Detail View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        
        {/* Left Column: Master List of Zones */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 w-full">
              <Search size={17} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                placeholder={t('zone.search_placeholder', { defaultValue: 'Tìm kiếm khu vực...' })}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm max-h-[calc(100vh-250px)] overflow-y-auto divide-y divide-slate-100">
            {filteredZones.map((zone: any) => {
              const isSelected = selectedZoneId === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`w-full p-4 text-left transition ${isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {zone.coverImageUrl && (
                      <img
                        src={resolveBackendMediaUrl(zone.coverImageUrl)}
                        alt={zone.name}
                        className="h-10 w-10 rounded-lg object-cover"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-950 truncate">{zone.name}</p>
                      <p className="mt-0.5 text-xs font-mono text-slate-500 truncate">code: {zone.slug}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                      {zone.poiCount} POI
                    </span>
                    <AdminBadge status={zone.status} />
                  </div>
                </button>
              );
            })}
            {filteredZones.length === 0 && (
              <p className="p-8 text-center text-sm font-semibold text-slate-500">{t('zone.no_matching', { defaultValue: 'Không tìm thấy khu vực nào.' })}</p>
            )}
          </div>
        </aside>

        {/* Right Column: Zone Detail & POI List */}
        <main className="space-y-6">
          {selectedZoneId ? (
            selectedTourLoading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              </div>
            ) : selectedTourDetail ? (
              <>
                {/* Zone Details */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{selectedTourDetail.name}</h2>
                      <p className="text-xs font-mono text-slate-500 mt-1">ID: #{selectedTourDetail.id} | Slug: {selectedTourDetail.slug}</p>
                      {assignedVendor && (
                        <p className="text-xs font-semibold text-indigo-600 mt-2 flex items-center gap-1">
                          <Store size={13} className="text-indigo-500" />
                          <span>{t('zone.assigned_vendor', { defaultValue: 'Nhà cung cấp phụ trách' })}:</span>
                          <Link
                            to={`/admin/vendors/${assignedVendor.id}`}
                            className="font-bold underline hover:text-indigo-800"
                          >
                            {assignedVendor.businessName}
                          </Link>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetQrCode(selectedTourDetail.id)}
                        disabled={isResetting}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                      >
                        {t('common.reset_qr', { defaultValue: 'Reset QR' })}
                      </button>
                       <button
                        type="button"
                        onClick={() => openEditModal(selectedTourDetail)}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchiveZone(selectedTourDetail.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                        title="Lưu trữ"
                      >
                        Lưu trữ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedTourDetail?.id) {
                            console.error("Aborting dispatch: Selected zone database item is missing a valid ID field.");
                            return;
                          }
                          handleConfirmDeleteZone(selectedTourDetail.id);
                        }}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-600 leading-relaxed">{selectedTourDetail.description || 'Chưa có mô tả.'}</p>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-slate-50 p-4 rounded-xl text-xs font-bold text-slate-700">
                    <div>
                      <p className="text-slate-400 font-medium">Trạng thái</p>
                      <div className="mt-1"><AdminBadge status={selectedTourDetail.status} /></div>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Tọa độ tâm</p>
                      <p className="mt-1 font-mono text-slate-900">{selectedTourDetail.latitude !== null ? selectedTourDetail.latitude.toFixed(6) : '-'}, {selectedTourDetail.longitude !== null ? selectedTourDetail.longitude.toFixed(6) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Mã QR Code</p>
                      <p className="mt-1 font-mono text-slate-900 text-sm">{selectedTourDetail.qrCode || 'Chưa có'}</p>
                    </div>
                  </div>

                  {selectedTourDetail.qrCode && (
                    <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center gap-6">
                      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                        <QRCodeCanvas
                          id={`qr-canvas-${selectedTourDetail.id}`}
                          value={`${window.location.origin}/zone/${selectedTourDetail.slug}`}
                          size={140}
                          bgColor="#ffffff"
                          fgColor="#1e3a8a"
                          level="Q"
                          includeMargin={true}
                        />
                      </div>
                      <div className="space-y-2 text-center sm:text-left">
                        <h4 className="font-black text-slate-950 text-sm">Quét để truy cập Web App</h4>
                        <p className="text-xs text-slate-500 max-w-[240px]">
                          Quét mã này để xem thuyết minh tự động và thông tin sạp hàng của khu vực {selectedTourDetail.name}.
                        </p>
                        <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                          <button
                            type="button"
                            onClick={downloadQrCode}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 transition"
                          >
                            Tải xuống QR
                          </button>
                          <button
                            type="button"
                            onClick={printQrCode}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            In mã QR
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* POI List in Zone */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">Danh sách POIs trong Khu vực ({selectedTourDetail.pois?.length || 0})</h3>
                    <button
                      type="button"
                      onClick={() => openAddPoiModal(selectedTourDetail.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700"
                    >
                      <Plus size={15} />
                      Thêm POI
                    </button>
                  </div>

                  <AdminDataTable
                    columns={poiColumns}
                    rows={selectedTourDetail.pois || []}
                    emptyText="Khu vực này chưa có điểm thuyết minh (POI) nào."
                  />
                </section>
              </>
            ) : null
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div className="text-center">
                <MapPin size={48} className="mx-auto mb-3 text-slate-300 animate-pulse" />
                <p className="text-sm font-black text-slate-600">Chọn một Khu vực từ danh sách bên trái</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">để xem chi tiết và danh sách các điểm thuyết minh con (POI).</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Zone Modal */}
      <AdminModal
        open={Boolean(modal) && (modal?.type === 'add' || modal?.type === 'edit')}
        title={modal?.type === 'add' ? t('zone.add_title', { defaultValue: 'Thêm Khu vực mới' }) : t('zone.edit_title', { defaultValue: 'Chỉnh sửa Khu vực' })}
        description={t('zone.form_description', { defaultValue: 'Vui lòng cung cấp chi tiết đầy đủ cho khu vực lễ hội này.' })}
        confirmLabel={modal?.type === 'add' ? t('common.add') : t('common.save')}
        tone="success"
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        <div className="space-y-4 py-2">
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('zone.form_name', { defaultValue: 'Tên khu vực' })}</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: Phố đi bộ Nguyễn Huệ"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('zone.form_code', { defaultValue: 'Mã khu vực (Slug)' })}</label>
              <input
                value={formZoneCode}
                onChange={(e) => setFormZoneCode(e.target.value)}
                placeholder="VD: pho-di-bo-nguyen-hue"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('common.description')}</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Nhập mô tả ngắn về khu vực du lịch này..."
              className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 resize-none"
            />
          </div>
          {/* Dual-Mode Cover Image Switcher */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              {t('zone.form_cover_image', { defaultValue: 'Ảnh bìa khu vực' })}
            </label>
            
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setCoverImageMode('upload')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  coverImageMode === 'upload'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                [Tải tệp lên]
              </button>
              <button
                type="button"
                onClick={() => setCoverImageMode('url')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  coverImageMode === 'url'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                [Nhập liên kết ảnh URL]
              </button>
            </div>

            {coverImageMode === 'upload' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Plus className="w-8 h-8 text-slate-400 mb-1" />
                      <p className="text-xs font-bold text-slate-500">
                        {selectedFile ? selectedFile.name : t('zone.upload_prompt', { defaultValue: 'Chọn ảnh từ thiết bị' })}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG, WEBP (Max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {previewUrl && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
                    <img src={resolveBackendMediaUrl(previewUrl)} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={formCoverImageUrl}
                  onChange={(e) => {
                    setFormCoverImageUrl(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
                {formCoverImageUrl && (
                  <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={resolveBackendMediaUrl(formCoverImageUrl)}
                      alt="Preview URL"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-xs font-black uppercase tracking-wider text-slate-500">{t('zone.coordinates_section', { defaultValue: 'Tọa độ trung tâm' })}</span>
              <button
                type="button"
                onClick={handleGetCurrentGps}
                disabled={locatingGps}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
              >
                {t('zone.get_current_gps', { defaultValue: 'Lấy vị trí hiện tại' })}
              </button>
            </div>

            {/* Visual Map Widget */}
            <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-inner my-2">
              <MapContainer 
                center={[latVal, lngVal]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickPicker />
                <ChangeMapCenter center={[latVal, lngVal]} />
              </MapContainer>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_latitude')}</label>
                <input
                  type="number"
                  step="any"
                  value={formLatitude}
                  onChange={(e) => setFormLatitude(e.target.value)}
                  placeholder="10.77582"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_longitude')}</label>
                <input
                  type="number"
                  step="any"
                  value={formLongitude}
                  onChange={(e) => setFormLongitude(e.target.value)}
                  placeholder="106.70208"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('common.status')}</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              >
                <option value="DRAFT">{t('common.draft')}</option>
                <option value="PUBLISHED">{t('status.published', { defaultValue: 'Đã xuất bản' })}</option>
                <option value="ARCHIVED">{t('common.archived')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isTourPremium"
                checked={formIsPremium}
                onChange={(e) => setFormIsPremium(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isTourPremium" className="text-sm font-bold text-slate-700">{t('zone.is_premium', { defaultValue: 'Khu vực Premium' })}</label>
            </div>
          </div>
        </div>
      </AdminModal>



      {/* Add / Edit POI Modal */}
       <AdminModal
        open={Boolean(modal) && (modal?.type === 'add-poi' || modal?.type === 'edit-poi')}
        title={modal?.type === 'add-poi' ? 'Thêm Điểm tham quan mới (POI)' : 'Chỉnh sửa Điểm tham quan (POI)'}
        description="Nhập thông tin chi tiết và bản dịch thuyết minh cho POI."
        confirmLabel={modal?.type === 'add-poi' ? t('common.add') : t('common.save')}
        tone="success"
        size="5xl"
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        <POIForm
          formName={poiFormName}
          setFormName={setPoiFormName}
          formStallId={poiFormStallId}
          setFormStallId={setPoiFormStallId}
          formTourId={poiFormTourId}
          setFormTourId={setPoiFormTourId}
          formDescription={poiFormDescription}
          setFormDescription={setPoiFormDescription}
          formLatitude={poiFormLatitude}
          setFormLatitude={setPoiFormLatitude}
          formLongitude={poiFormLongitude}
          setFormLongitude={setPoiFormLongitude}
          formRadius={poiFormRadius}
          setFormRadius={setPoiFormRadius}
          formIsPremium={poiFormIsPremium}
          setFormIsPremium={setPoiFormIsPremium}
          formStatus={poiFormStatus}
          setFormStatus={setPoiFormStatus}
          stalls={stalls}
          tours={tours}
          vendors={vendorsList}
          error={error}
          translations={poiFormTranslations}
          setTranslations={setPoiFormTranslations}
        />
      </AdminModal>

      {/* Delete POI Confirmation Modal */}
      <AdminModal
        open={modal?.type === 'delete-poi'}
        title="Xác nhận xóa Điểm thuyết minh"
        description={`Bạn có chắc chắn muốn xóa điểm thuyết minh "${modal?.poi?.name}"?`}
        confirmLabel="Xóa"
        tone="danger"
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        {error && <p className="text-xs font-bold text-red-600 pb-2">{error}</p>}
      </AdminModal>

      {/* Stalls Proximity Modal */}
      <AdminModal
        open={Boolean(stallsModalZone)}
        title={t('zone.stalls_modal_title', { defaultValue: 'Danh sách Sạp thuộc Khu vực' })}
        description={stallsModalZone ? t('zone.stalls_modal_desc', { name: stallsModalZone.name, defaultValue: `Các sạp của Vendor nằm trong bán kính 1km của khu vực: ${stallsModalZone.name}` }) : ''}
        onClose={() => setStallsModalZone(null)}
        tone="info"
        confirmLabel={t('common.close')}
        onConfirm={() => setStallsModalZone(null)}
      >
        <div className="py-2 max-h-[400px] overflow-y-auto space-y-3">
          {nearbyStalls.length === 0 ? (
            <p className="text-sm font-semibold text-slate-500 text-center py-8">
              {t('zone.no_nearby_stalls', { defaultValue: 'Không có sạp nào nằm trong khu vực này.' })}
            </p>
          ) : (
            nearbyStalls.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">{s.name}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {t('zone.stall_vendor', { defaultValue: 'Vendor' })}: {s.vendor?.businessName || t('common.unknown')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    {Math.round(s.distance)}m
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Radius: {s.activationRadius}m
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </AdminModal>
    </div>
  );
}
