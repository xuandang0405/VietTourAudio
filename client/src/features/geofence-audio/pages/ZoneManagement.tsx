import { Edit3, MapPin, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { AdminModal } from '../../../admin/components/AdminModal';
import { useTours, useCreateTour, useUpdateTour, useDeleteTour, useStallsList } from '../../../admin/api/adminQueries';

export function ZoneManagement() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null);
  const [error, setError] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formZoneCode, setFormZoneCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImageUrl, setFormCoverImageUrl] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formStatus, setFormStatus] = useState('DRAFT');
  const [formIsPremium, setFormIsPremium] = useState(false);
  const [formVendorId, setFormVendorId] = useState('');

  // Queries
  const { data: tours = [], isLoading, error: fetchError } = useTours();
  const { data: stalls = [] } = useStallsList();
  
  const createMutation = useCreateTour();
  const updateMutation = useUpdateTour();
  const deleteMutation = useDeleteTour();

  const filteredZones = useMemo(() => {
    return tours.filter((tour: any) =>
      (tour.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (tour.slug ?? '').toLowerCase().includes(search.toLowerCase())
    );
  }, [tours, search]);

  const openAddModal = () => {
    setError('');
    setFormName('');
    setFormZoneCode('');
    setFormDescription('');
    setFormCoverImageUrl('');
    setFormLatitude('');
    setFormLongitude('');
    setFormStatus('DRAFT');
    setFormIsPremium(false);
    setFormVendorId(stalls[0]?.vendorId ?? '1');
    setModal({ type: 'add' });
  };

  const openEditModal = (zone: any) => {
    setError('');
    setFormName(zone.name ?? '');
    setFormZoneCode(zone.slug ?? '');
    setFormDescription(zone.description ?? '');
    setFormCoverImageUrl(zone.coverImageUrl ?? '');
    setFormLatitude(zone.latitude !== null ? String(zone.latitude) : '');
    setFormLongitude(zone.longitude !== null ? String(zone.longitude) : '');
    setFormStatus(zone.status ?? 'DRAFT');
    setFormIsPremium(Boolean(zone.isPremium));
    setFormVendorId(zone.vendorId ?? '1');
    setModal({ type: 'edit', zone });
  };

  const openDeleteModal = (zone: any) => {
    setError('');
    setModal({ type: 'delete', zone });
  };

  const handleConfirm = async () => {
    if (!modal) return;
    setError('');

    try {
      if (modal.type === 'delete') {
        await deleteMutation.mutateAsync(modal.zone.id);
      } else {
        if (!formName.trim()) {
          setError(t('zone.error_name_empty', { defaultValue: 'Tên khu vực không được để trống' }));
          return;
        }

        const lat = formLatitude.trim() ? Number(formLatitude) : null;
        const lng = formLongitude.trim() ? Number(formLongitude) : null;

        if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
          setError(t('zone.error_lat_invalid', { defaultValue: 'Vĩ độ không hợp lệ (-90 đến 90)' }));
          return;
        }
        if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
          setError(t('zone.error_lng_invalid', { defaultValue: 'Kinh độ không hợp lệ (-180 đến 180)' }));
          return;
        }

        const payload = {
          vendorId: formVendorId || '1',
          name: formName.trim(),
          slug: formZoneCode.trim() || undefined,
          description: formDescription.trim() || null,
          coverImageUrl: formCoverImageUrl.trim() || null,
          latitude: lat,
          longitude: lng,
          status: formStatus,
          isPremium: formIsPremium
        };

        if (modal.type === 'add') {
          await createMutation.mutateAsync(payload);
        } else {
          await updateMutation.mutateAsync({ id: modal.zone.id, data: payload });
        }
      }
      setModal(null);
    } catch (err: any) {
      setError(err.response?.data?.error ?? t('zone.error_save', { defaultValue: 'Lỗi khi lưu thông tin khu vực.' }));
    }
  };

  const columns = [
    {
      key: 'id',
      label: t('zone.table.id', { defaultValue: 'Mã' }),
      render: (zone: any) => <span className="font-black text-slate-950">#{zone.id}</span>
    },
    {
      key: 'name',
      label: t('zone.table.name', { defaultValue: 'Khu vực' }),
      render: (zone: any) => (
        <div className="flex items-center gap-3">
          {zone.coverImageUrl && (
            <img src={zone.coverImageUrl} alt={zone.name} className="h-10 w-10 rounded-lg object-cover" />
          )}
          <div>
            <p className="font-black text-slate-950">{zone.name}</p>
            <p className="mt-0.5 text-xs font-mono text-slate-500">code: {zone.slug}</p>
          </div>
        </div>
      )
    },
    {
      key: 'coordinates',
      label: t('zone.table.coordinates', { defaultValue: 'Tọa độ tâm' }),
      render: (zone: any) => (
        <span className="text-xs font-mono text-slate-600">
          {zone.latitude !== null ? zone.latitude.toFixed(6) : '-'}, {zone.longitude !== null ? zone.longitude.toFixed(6) : '-'}
        </span>
      )
    },
    {
      key: 'pois',
      label: t('zone.table.pois', { defaultValue: 'Điểm POI' }),
      render: (zone: any) => (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {zone.poiCount} POI
        </span>
      )
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (zone: any) => <AdminBadge status={zone.status} />
    },
    {
      key: 'actions',
      label: t('common.action'),
      cellClassName: 'px-4 py-3 text-right',
      render: (zone: any) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openEditModal(zone)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label={t('zone.edit', { defaultValue: 'Sửa' })}
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(zone)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50"
            aria-label={t('zone.delete', { defaultValue: 'Xóa' })}
          >
            <Trash2 size={16} />
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

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 w-full max-w-md">
          <Search size={17} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
            placeholder={t('zone.search_placeholder', { defaultValue: 'Tìm kiếm khu vực...' })}
          />
        </label>
      </section>

      <AdminDataTable
        columns={columns}
        rows={filteredZones}
        emptyText={isLoading ? t('common.loading') : t('zone.no_matching', { defaultValue: 'Không tìm thấy khu vực nào.' })}
      />

      {/* Add / Edit Modal */}
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
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('zone.form_cover_url', { defaultValue: 'Ảnh bìa (URL)' })}</label>
            <input
              value={formCoverImageUrl}
              onChange={(e) => setFormCoverImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <span className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">{t('zone.coordinates_section', { defaultValue: 'Tọa độ trung tâm' })}</span>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_latitude')}</label>
                <input
                  type="number"
                  step="any"
                  value={formLatitude}
                  onChange={(e) => setFormLatitude(e.target.value)}
                  placeholder="10.77582"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
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
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('zone.form_vendor', { defaultValue: 'Nhà cung cấp' })}</label>
              <select
                value={formVendorId}
                onChange={(e) => setFormVendorId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              >
                {stalls.map((s: any) => (
                  <option key={s.id} value={s.vendorId}>{s.name} ({s.vendor?.businessName})</option>
                ))}
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

      {/* Delete Confirmation Modal */}
      <AdminModal
        open={modal?.type === 'delete'}
        title={t('zone.delete_title', { defaultValue: 'Xác nhận xóa Khu vực' })}
        description={t('zone.delete_desc', { name: modal?.zone?.name, defaultValue: 'Khu vực sẽ bị chuyển trạng thái thành lưu trữ (ARCHIVED). Các POIs vẫn hoạt động. Bạn có chắc chắn muốn tiếp tục?' })}
        confirmLabel={t('common.delete')}
        tone="danger"
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
