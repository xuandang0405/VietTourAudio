import { ChevronRight, Download, Edit3, Map, MapPin, Plus, QrCode, RefreshCw, Search, Trash2, X, Clock, Check, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { AdminModal } from '../../../admin/components/AdminModal';
import { AdminScannerTest } from '../components/AdminScannerTest';
import { POIForm } from '../components/POIForm';
import {
  useAdminPois,
  useStallsList,
  useCreatePoi,
  useUpdatePoi,
  useDeletePoi,
  usePoiDistance,
  useTours,
  useTour,
  useCreateTour,
  useUpdateTour,
  useDeleteTour,
  useResetTourQr,
  useAdminApprovals,
  useApprovePoi,
  useRejectPoi
} from '../../../admin/api/adminQueries';

function toPublicImageUrl(value) {
  if (!value || value.startsWith('blob:') || value.startsWith('data:') || /^https?:\/\//.test(value)) return value;
  return `http://localhost:45200${value.startsWith('/') ? value : `/${value}`}`;
}

export function AdminPois() {
  const { t } = useTranslation();

  // ── State ──
  const [selectedTourId, setSelectedTourId] = useState(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [distancePoiA, setDistancePoiA] = useState('');
  const [distancePoiB, setDistancePoiB] = useState('');
  const [isTestingScanner, setIsTestingScanner] = useState(false);

  // POI form
  const [formName, setFormName] = useState('');
  const [formStallId, setFormStallId] = useState('');
  const [formTourId, setFormTourId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formRadius, setFormRadius] = useState('');
  const [formIsPremium, setFormIsPremium] = useState(false);
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formTranslations, setFormTranslations] = useState([
    { lang: 'vi', title: '', ttsScript: '' },
    { lang: 'en', title: '', ttsScript: '' },
    { lang: 'ja', title: '', ttsScript: '' },
    { lang: 'ko', title: '', ttsScript: '' },
    { lang: 'zh', title: '', ttsScript: '' }
  ]);

  function getSafeTranslations(poi) {
    const list = poi?.translations ?? [];
    return ['vi', 'en', 'ja', 'ko', 'zh'].map((lang) => {
      const match = list.find((item) => item.lang === lang);
      if (match) {
        return { lang, title: match.title ?? '', ttsScript: match.ttsScript ?? '' };
      }
      if (lang === 'vi') {
        return { lang, title: poi?.name ?? '', ttsScript: poi?.description ?? '' };
      }
      return { lang, title: '', ttsScript: '' };
    });
  }

  // Tour form
  const [tourFormName, setTourFormName] = useState('');
  const [tourFormDescription, setTourFormDescription] = useState('');
  const [tourFormStatus, setTourFormStatus] = useState('DRAFT');
  const [tourFormVendorId, setTourFormVendorId] = useState('');
  const [tourFormIsPremium, setTourFormIsPremium] = useState(false);

  // ── Queries & Mutations ──
  const { data: pois = [], isLoading: poisLoading, error: poisError } = useAdminPois();
  const { data: stalls = [] } = useStallsList();
  const { data: tours = [], isLoading: toursLoading } = useTours();
  const createMutation = useCreatePoi();
  const updateMutation = useUpdatePoi();
  const deleteMutation = useDeletePoi();
  const createTourMutation = useCreateTour();
  const updateTourMutation = useUpdateTour();
  const deleteTourMutation = useDeleteTour();
  const resetQrMutation = useResetTourQr();
  const distanceQuery = usePoiDistance(distancePoiA, distancePoiB);
  
  const { data: approvals = [] } = useAdminApprovals();
  const approveMutation = useApprovePoi();
  const rejectMutation = useRejectPoi();

  const { data: tourDetail, isLoading: tourDetailLoading } = useTour(selectedTourId);
  const selectedTour = useMemo(() => {
    if (!selectedTourId) return null;
    const tourFromList = tours.find((t) => String(t.id) === String(selectedTourId)) ?? null;
    if (tourDetail) {
      return { ...tourFromList, ...tourDetail };
    }
    return tourFromList;
  }, [tours, selectedTourId, tourDetail]);

  // Filter POIs for selected tour
  const filteredPois = useMemo(() => {
    let list = selectedTour?.pois ?? [];
    if (search) {
      list = list.filter(
        (poi) =>
          (poi.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (poi.stallName ?? '').toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [selectedTour, search]);

  const poiOptions = useMemo(() => pois.map((poi) => ({ value: poi.id, label: poi.stallName ? `${poi.name} - ${poi.stallName}` : poi.name })), [pois]);
  const distanceMeters = distanceQuery.data?.distanceMeters;
  const distanceLabel = Number.isFinite(distanceMeters) ? Math.round(distanceMeters) : null;

  // ── Modal helpers ──
  function openAddPoiModal() {
    setError('');
    setFormName('');
    setFormStallId(stalls[0]?.id ?? '1');
    setFormTourId(selectedTourId && selectedTourId !== 'approvals' ? String(selectedTourId) : (tours[0]?.id ?? ''));
    setFormDescription('');
    setFormLatitude('10.77582');
    setFormLongitude('106.70208');
    setFormRadius('25');
    setFormIsPremium(false);
    setFormStatus('ACTIVE');
    setFormTranslations([
      { lang: 'vi', title: '', ttsScript: '' },
      { lang: 'en', title: '', ttsScript: '' },
      { lang: 'ja', title: '', ttsScript: '' },
      { lang: 'ko', title: '', ttsScript: '' },
      { lang: 'zh', title: '', ttsScript: '' }
    ]);
    setModal({ type: 'add' });
  }

  function openEditPoiModal(poi) {
    setError('');
    setFormName(poi.name ?? '');
    setFormStallId(poi.stallId ?? (stalls[0]?.id ?? '1'));
    setFormTourId(poi.tourId ? String(poi.tourId) : (selectedTourId && selectedTourId !== 'approvals' ? String(selectedTourId) : (tours[0]?.id ?? '')));
    setFormDescription(poi.description ?? '');
    setFormLatitude(String(poi.latitude ?? ''));
    setFormLongitude(String(poi.longitude ?? ''));
    setFormRadius(String(poi.activationRadius ?? '25'));
    setFormIsPremium(Boolean(poi.isPremiumContent));
    setFormStatus(poi.status ?? 'ACTIVE');
    setFormTranslations(getSafeTranslations(poi));
    setModal({ type: 'edit', poi });
  }

  function openDeletePoiModal(poi) {
    setError('');
    setModal({ type: 'delete', poi });
  }

  function openAddTourModal() {
    setError('');
    setTourFormName('');
    setTourFormDescription('');
    setTourFormStatus('DRAFT');
    setTourFormVendorId(stalls[0]?.vendorId ?? '1');
    setTourFormIsPremium(false);
    setModal({ type: 'add-tour' });
  }

  function openEditTourModal(tour) {
    setError('');
    setTourFormName(tour.name ?? '');
    setTourFormDescription(tour.description ?? '');
    setTourFormStatus(tour.status ?? 'DRAFT');
    setTourFormVendorId(tour.vendorId ?? '1');
    setTourFormIsPremium(Boolean(tour.isPremium));
    setModal({ type: 'edit-tour', tour });
  }

  function openDeleteTourModal(tour) {
    setError('');
    setModal({ type: 'delete-tour', tour });
  }

  async function handleConfirm() {
    if (!modal) return;
    setError('');

    try {
      if (modal.type === 'delete') {
        await deleteMutation.mutateAsync({ id: modal.poi.id, reason: deleteReason.trim() });
      } else if (modal.type === 'delete-tour') {
        await deleteTourMutation.mutateAsync({ id: modal.tour.id, reason: deleteReason.trim() });
        if (String(selectedTourId) === String(modal.tour.id)) setSelectedTourId(null);
      } else if (modal.type === 'add-tour' || modal.type === 'edit-tour') {
        if (!tourFormName.trim()) { setError('Tên khu vực không được để trống'); return; }
        const tourPayload = {
          vendorId: tourFormVendorId || '1',
          name: tourFormName.trim(),
          description: tourFormDescription.trim(),
          status: tourFormStatus,
          isPremium: tourFormIsPremium
        };
        if (modal.type === 'add-tour') {
          await createTourMutation.mutateAsync(tourPayload);
        } else {
          await updateTourMutation.mutateAsync({ id: modal.tour.id, data: tourPayload });
        }
      } else {
        // POI add/edit
        if (!formName.trim()) { setError(t('poi.error_name_empty')); return; }
        if (!formTourId) { setError('Vui lòng chọn Khu vực'); return; }
        if (!formStallId) { setError(t('poi.error_stall_empty')); return; }
        const lat = Number(formLatitude);
        const lng = Number(formLongitude);
        const rad = Number(formRadius);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) { setError(t('poi.error_lat_invalid')); return; }
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) { setError(t('poi.error_lng_invalid')); return; }
        if (!Number.isFinite(rad) || rad <= 0) { setError(t('poi.error_radius_invalid')); return; }
        const payload = {
          tourId: Number(formTourId),
          stallId: Number(formStallId),
          name: formName.trim(),
          description: formDescription.trim(),
          latitude: lat,
          longitude: lng,
          activationRadius: rad,
          isPremiumContent: formIsPremium,
          status: formStatus,
          translations: formTranslations
        };
        if (modal.type === 'add') await createMutation.mutateAsync(payload);
        else await updateMutation.mutateAsync({ id: modal.poi.id, data: payload });
      }
      setDeleteReason('');
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.error ?? t('poi.error_save'));
    }
  }

  function handlePrintQr(tour) {
    if (!tour || !tour.qrCode) return;
    const qrUrl = `${window.location.origin}/zone/${tour.qrCode}`;
    const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`;
    
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (!printWindow) {
      alert('Vui lòng cho phép mở popup để in mã QR!');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In mã QR - ${tour.name}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 40px;
              color: #1e293b;
              background: #fff;
            }
            .print-container {
              max-width: 500px;
              margin: 0 auto;
              border: 3px double #cbd5e1;
              padding: 30px;
              border-radius: 24px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            }
            .header-logo {
              font-size: 24px;
              font-weight: 800;
              color: #4f46e5;
              letter-spacing: -0.025em;
              margin-bottom: 24px;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              margin: 10px 0 5px 0;
            }
            .subtitle {
              font-size: 14px;
              color: #64748b;
              font-weight: 600;
              margin-bottom: 24px;
            }
            .qr-image {
              width: 280px;
              height: 280px;
              margin: 0 auto;
              display: block;
              border: 1px solid #e2e8f0;
              padding: 10px;
              border-radius: 16px;
            }
            .qr-code-text {
              font-family: monospace;
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.1em;
              margin-top: 20px;
              background: #f1f5f9;
              display: inline-block;
              padding: 6px 16px;
              border-radius: 8px;
            }
            .instructions {
              margin-top: 24px;
              font-size: 15px;
              font-weight: 700;
              color: #475569;
              line-height: 1.5;
            }
            .footer-text {
              margin-top: 30px;
              font-size: 11px;
              color: #94a3b8;
              font-weight: 500;
            }
            @media print {
              body {
                padding: 0;
              }
              .print-container {
                border: none;
                box-shadow: none;
                padding: 10px;
              }
              .no-print {
                display: none;
              }
            }
            .no-print-btn {
              margin-top: 20px;
              background: #4f46e5;
              color: #fff;
              border: none;
              padding: 10px 20px;
              font-size: 14px;
              font-weight: 700;
              border-radius: 8px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header-logo">VIET TOUR AUDIO</div>
            <div class="title">${tour.name}</div>
            <div class="subtitle">${tour.description || ''}</div>
            <img class="qr-image" src="${qrImageSrc}" alt="Mã QR" />
            <div class="qr-code-text">${tour.qrCode}</div>
            <div class="instructions">
              Quét mã QR bằng điện thoại để bắt đầu<br>tham gia hướng dẫn du lịch tự động!
            </div>
            <div class="footer-text">Hệ thống thuyết minh tự động VietTourAudio</div>
            <div class="no-print">
              <button class="no-print-btn" onclick="window.print()">In trang này</button>
            </div>
          </div>
          <script>
            // Auto trigger print when image is loaded
            const img = document.querySelector('.qr-image');
            if (img.complete) {
              setTimeout(() => { window.print(); }, 500);
            } else {
              img.onload = function() {
                setTimeout(() => { window.print(); }, 500);
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // ── Tour columns ──
  const tourListItems = tours;

  // ── POI table columns ──
  const poiColumns = [
    {
      key: 'id', label: t('poi.poi_code'),
      render: (poi) => <span className="font-black text-slate-950">#{poi.id}</span>
    },
    {
      key: 'name', label: t('poi.poi_name'),
      render: (poi) => (
        <div>
          <p className="font-black text-slate-950">{poi.name}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{poi.stallName}</p>
        </div>
      )
    },
    {
      key: 'coordinates', label: t('poi.coordinates'),
      render: (poi) => (
        <span className="text-xs font-mono text-slate-600">
          {poi.latitude?.toFixed(6) ?? '-'}, {poi.longitude?.toFixed(6) ?? '-'}
        </span>
      )
    },
    {
      key: 'activationRadius', label: t('poi.radius'),
      render: (poi) => (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{poi.activationRadius}m</span>
      )
    },
    {
      key: 'contents', label: t('poi.languages'),
      render: (poi) => t('poi.contents_count', { count: poi.contents ?? 0 })
    },
    {
      key: 'status', label: t('common.status'),
      render: (poi) => <AdminBadge status={poi.status} />
    },
    {
      key: 'actions', label: t('common.action'), cellClassName: 'px-4 py-3 text-right',
      render: (poi) => (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => openEditPoiModal(poi)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label={t('poi.edit_poi')}>
            <Edit3 size={16} />
          </button>
          <button type="button" onClick={() => openDeletePoiModal(poi)} className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50" aria-label={t('poi.delete_poi')}>
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow={t('poi.management_subtitle')}
        title="Quản lý Khu vực & POI"
        description="Quản lý Khu vực (Tours) và các Điểm tham quan (POIs) thuộc từng khu vực"
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsTestingScanner(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-amber-700"
            >
              <QrCode size={17} /> {t('admin.scanner.title')}
            </button>
            <button type="button" onClick={openAddTourModal} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700">
              <Map size={17} /> Thêm Khu vực
            </button>
            <button
              type="button"
              disabled={!selectedTourId}
              onClick={openAddPoiModal}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!selectedTourId ? "Vui lòng chọn một Khu vực để thêm POI" : ""}
            >
              <Plus size={17} /> {t('poi.add_poi')}
            </button>
          </div>
        }
      />

      {(error || poisError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error || poisError?.response?.data?.error || t('poi.error_load')}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── Left Panel: Tours ── */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-600">
                <Map size={15} className="mr-1.5 inline -mt-0.5 text-indigo-600" /> Khu vực ({tours.length})
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
              {toursLoading && (
                <div className="px-4 py-6 text-center text-sm font-semibold text-slate-400">Đang tải...</div>
              )}
              {!toursLoading && tourListItems.length === 0 && (
                <div className="px-4 py-6 text-center text-sm font-semibold text-slate-400">Chưa có khu vực nào</div>
              )}
              {tourListItems.map((tour) => {
                const isSelected = String(selectedTourId) === String(tour.id);
                return (
                  <button
                    key={tour.id}
                    type="button"
                    onClick={() => setSelectedTourId(isSelected ? null : tour.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Map size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-black ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>{tour.name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <AdminBadge status={tour.status} />
                        <span className="text-xs font-semibold text-slate-500">{tour.poiCount} POI</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`shrink-0 transition ${isSelected ? 'text-indigo-600 rotate-90' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
            <div className="border-t border-slate-100 p-2 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSelectedTourId('approvals')}
                className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                  selectedTourId === 'approvals' ? 'bg-amber-500 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selectedTourId === 'approvals' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                  <Clock size={16} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-xs font-bold uppercase tracking-wider">{t('poi.pending_approvals_tab', { defaultValue: 'Yêu cầu duyệt' })}</p>
                  <p className="text-[10px] opacity-80">{t('poi.pending_approvals_count', { count: approvals.length, defaultValue: `${approvals.length} yêu cầu` })}</p>
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Right Panel: Tour Detail + POIs ── */}
        <main className="space-y-4">
          {selectedTour ? (
            <>
              {/* Tour Header */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-black text-slate-950">{selectedTour.name}</h2>
                      <AdminBadge status={selectedTour.status} />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">{selectedTour.description || 'Chưa có mô tả'}</p>
                    <p className="mt-1.5 text-xs font-mono text-slate-400">slug: {selectedTour.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedTour.qrCode && (
                      <button
                        type="button"
                        onClick={() => setModal({ type: 'view-qr', tour: selectedTour })}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-600 hover:bg-slate-100 transition shadow-sm"
                      >
                        <QrCode size={14} /> Xem/In QR: {selectedTour.qrCode}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => resetQrMutation.mutate(selectedTour.id)}
                      disabled={resetQrMutation.isPending}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={resetQrMutation.isPending ? 'animate-spin' : ''} />
                      {resetQrMutation.isPending ? 'Đang tạo...' : 'Reset QR'}
                    </button>
                    <button type="button" onClick={() => openEditTourModal(selectedTour)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50">
                      <Edit3 size={16} />
                    </button>
                    <button type="button" onClick={() => openDeleteTourModal(selectedTour)} className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </section>

              {/* Search + Filter bar */}
              <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <label className="relative flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                    <Search size={17} className="text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none pr-6 placeholder:text-slate-400" placeholder={t('poi.search_placeholder')} />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition"
                        aria-label="Xóa tìm kiếm"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </label>
                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                    <MapPin size={12} className="inline mr-1 -mt-0.5" />{filteredPois.length} POI
                  </span>
                </div>
              </section>


              {/* POI table */}
              {tourDetailLoading && !tourDetail ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                </div>
              ) : (
                <AdminDataTable
                  columns={poiColumns}
                  rows={filteredPois}
                  emptyText={t('tour.no_pois_assigned', { defaultValue: 'Chưa có điểm tham quan nào được gán cho Tour này.' })}
                />
              )}
            </>
          ) : selectedTourId === 'approvals' ? (
            <section className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                  <Clock className="text-amber-500" size={20} />
                  {t('poi.approvals_panel_title', { defaultValue: 'Yêu cầu duyệt chỉnh sửa POI từ Vendor' })}
                </h2>
                <p className="text-sm font-semibold text-slate-500 mt-1">
                  {t('poi.approvals_panel_desc', { defaultValue: 'Xem xét và phê duyệt các yêu cầu thay đổi tên, ảnh, mô tả từ phía Vendor quản lý POI.' })}
                </p>
              </div>

              {approvals.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                  <div className="text-center">
                    <CheckCircle className="mx-auto mb-3 text-green-500" size={40} />
                    <p className="text-sm font-black text-slate-600">{t('poi.no_pending_approvals', { defaultValue: 'Không có yêu cầu nào đang chờ duyệt' })}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{t('poi.no_pending_approvals_desc', { defaultValue: 'Tất cả các điểm thuyết minh đang ở trạng thái đồng bộ công khai.' })}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {approvals.map((req) => (
                    <div key={req.id} className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                      {/* Left: General Info */}
                      <div className="p-6 border-r border-slate-100 bg-slate-50/40">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Thông tin chung sạp hàng
                        </span>
                        <div className="mt-3 flex gap-3">
                          <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                            POI #{req.id}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-teal-600">Vĩ độ: {req.latitude} | Kinh độ: {req.longitude}</p>
                            <h3 className="font-extrabold text-slate-900 text-sm mt-1">{req.name}</h3>
                            <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{req.description || 'Không có mô tả'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Proposal & Actions */}
                      <div className="p-6 flex flex-col justify-between">
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 tracking-wider bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <AlertTriangle size={10} />
                            Đề xuất duyệt thay đổi
                          </span>
                          <div className="mt-3 flex gap-3">
                            {req.coverUrl ? (
                              <img src={toPublicImageUrl(req.coverUrl)} alt={req.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border-2 border-amber-400" />
                            ) : (
                              <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs shrink-0 font-bold">No Cover</div>
                            )}
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm mt-1">{req.name}</h3>
                              <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{req.description}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3 justify-end">
                          <button
                            type="button"
                            onClick={() => rejectMutation.mutate(req.id)}
                            disabled={rejectMutation.isPending || approveMutation.isPending}
                            className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold rounded-xl transition disabled:opacity-50"
                          >
                            {rejectMutation.isPending ? t('common.processing', { defaultValue: 'Đang xử lý...' }) : t('common.reject', { defaultValue: 'Từ chối' })}
                          </button>
                          <button
                            type="button"
                            onClick={() => approveMutation.mutate(req.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-[0.98] disabled:opacity-50"
                          >
                            {approveMutation.isPending ? t('common.processing', { defaultValue: 'Đang xử lý...' }) : t('common.approve', { defaultValue: 'Duyệt áp dụng' })}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div className="text-center">
                <Map size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-black text-slate-600">Chọn một Khu vực từ danh sách bên trái</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">để xem và quản lý các Điểm tham quan (POI)</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── POI Form Modal ── */}
      <AdminModal
        open={Boolean(modal) && (modal?.type === 'add' || modal?.type === 'edit')}
        title={modal?.type === 'add' ? t('poi.add_poi') : t('poi.edit_poi')}
        description={t('poi.form_description_hint')}
        confirmLabel={modal?.type === 'add' ? t('common.add') : t('common.save')}
        tone="success"
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        <POIForm
          formName={formName}
          setFormName={setFormName}
          formStallId={formStallId}
          setFormStallId={setFormStallId}
          formTourId={formTourId}
          setFormTourId={setFormTourId}
          formDescription={formDescription}
          setFormDescription={setFormDescription}
          formLatitude={formLatitude}
          setFormLatitude={setFormLatitude}
          formLongitude={formLongitude}
          setFormLongitude={setFormLongitude}
          formRadius={formRadius}
          setFormRadius={setFormRadius}
          formIsPremium={formIsPremium}
          setFormIsPremium={setFormIsPremium}
          formStatus={formStatus}
          setFormStatus={setFormStatus}
          stalls={stalls}
          tours={tours}
          error={error}
          translations={formTranslations}
          setTranslations={setFormTranslations}
        />
      </AdminModal>

      {/* ── Tour Form Modal ── */}
      <AdminModal
        open={Boolean(modal) && (modal?.type === 'add-tour' || modal?.type === 'edit-tour')}
        title={modal?.type === 'add-tour' ? 'Thêm Khu vực mới' : 'Chỉnh sửa Khu vực'}
        description="Điền thông tin khu vực du lịch"
        confirmLabel={modal?.type === 'add-tour' ? t('common.add') : t('common.save')}
        tone="success"
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        <div className="space-y-4 py-2">
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Tên khu vực</label>
            <input value={tourFormName} onChange={(e) => setTourFormName(e.target.value)} placeholder="VD: Phố đi bộ Nguyễn Huệ" className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Mô tả</label>
            <textarea value={tourFormDescription} onChange={(e) => setTourFormDescription(e.target.value)} placeholder="Mô tả ngắn về khu vực..." className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('common.status')}</label>
              <select value={tourFormStatus} onChange={(e) => setTourFormStatus(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500">
                <option value="DRAFT">{t('common.draft')}</option>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="ARCHIVED">{t('common.archived')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="isTourPremium" checked={tourFormIsPremium} onChange={(e) => setTourFormIsPremium(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="isTourPremium" className="text-sm font-bold text-slate-700">Khu vực Premium</label>
            </div>
          </div>
        </div>
      </AdminModal>

      {/* ── Delete Confirmation Modal ── */}
      <AdminModal
        open={modal?.type === 'delete' || modal?.type === 'delete-tour'}
        title={modal?.type === 'delete-tour' ? 'Xác nhận xoá Khu vực' : t('poi.delete_confirm_title')}
        description={
          modal?.type === 'delete-tour'
            ? `Khu vực "${modal?.tour?.name}" sẽ bị lưu trữ (ARCHIVED). Bạn có chắc chắn?`
            : t('poi.delete_soft_confirm_desc', { name: modal?.poi?.name })
        }
        confirmLabel={modal?.type === 'delete-tour' ? 'Xoá Khu vực' : t('poi.confirm_hide')}
        tone="danger"
        onClose={() => { setModal(null); setDeleteReason(''); }}
        onConfirm={handleConfirm}
      >
        <div className="mt-4">
          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder={t('admin.common.delete_reason_placeholder', { defaultValue: "Nhập lý do xóa (Không bắt buộc)..." })}
            className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none"
          />
        </div>
      </AdminModal>

      {/* ── View QR Modal ── */}
      <AdminModal
        open={Boolean(modal) && modal?.type === 'view-qr'}
        title={`Mã QR: ${modal?.tour?.name}`}
        description="Quét mã QR dưới đây bằng điện thoại để xem khu vực và danh sách điểm tham quan (POIs)."
        confirmLabel="In mã QR"
        tone="success"
        onClose={() => setModal(null)}
        onConfirm={() => handlePrintQr(modal.tour)}
      >
        {modal?.tour && (() => {
          const qrUrl = `${window.location.origin}/zone/${modal.tour.qrCode}`;
          const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;
          return (
            <div className="flex flex-col items-center justify-center p-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
                <img
                  src={qrImageSrc}
                  alt={`QR Code for ${modal.tour.name}`}
                  className="mx-auto block h-48 w-48 rounded-xl bg-white p-2 shadow-sm"
                />
              </div>
              <div className="text-center">
                <p className="font-mono text-lg font-black tracking-wider text-slate-900 bg-slate-100 px-4 py-1.5 rounded-lg inline-block">
                  {modal.tour.qrCode}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-400 break-all select-all hover:text-indigo-600 transition">
                  {qrUrl}
                </p>
              </div>
            </div>
          );
        })()}
      </AdminModal>

      {/* ── Admin Scanner Test Modal ── */}
      <AdminScannerTest
        open={isTestingScanner}
        onClose={() => setIsTestingScanner(false)}
      />
    </div>
  );
}
