import { Ban, Check, Eye, Plus, Search, X, ChevronLeft, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useVendors, useCreateVendor, useUpdateVendorStatus, useToursList, useUpdateVendor, useUnsuspendVendor } from '../../../admin/api/adminQueries';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminModal } from '../../../admin/components/AdminModal';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { CreateVendorModal } from '../components/CreateVendorModal';
import { EditVendorModal } from '../components/EditVendorModal';

export function AdminVendorsPage() {
  const { t } = useTranslation();
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null); // { type: 'add' | 'edit' | 'suspend' | 'approve' | 'reject', vendor?: any }
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const params = useMemo(() => ({ status, search }), [search, status]);
  const { data: vendors = [], isLoading } = useVendors(params);
  const { data: tours = [] } = useToursList();

  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const updateStatusMutation = useUpdateVendorStatus();
  const unsuspendMutation = useUnsuspendVendor();

  const handleCreateConfirm = async (payload: any) => {
    setError('');
    try {
      await createMutation.mutateAsync({
        tradeName: payload.tradeName,
        contactEmail: payload.contactEmail,
        vendorCode: payload.vendorCode,
        assignedTourId: payload.assignedTourId,
        password: Math.random().toString(36).slice(-8), // generate random password
      });
      setModal(null);
    } catch (err: any) {
      setError(err.response?.data?.error ?? t('common.error', { defaultValue: 'Có lỗi xảy ra.' }));
    }
  };

  const handleEditConfirm = async (payload: any) => {
    if (!modal?.vendor?.id) return;
    setError('');
    try {
      await updateMutation.mutateAsync({
        id: modal.vendor.id,
        data: payload
      });
      setModal(null);
    } catch (err: any) {
      setError(err.response?.data?.error ?? t('common.error', { defaultValue: 'Có lỗi xảy ra.' }));
    }
  };

  const handleStatusConfirm = async () => {
    if (!modal?.vendor) return;
    setError('');
    try {
      const statusMap: Record<string, string> = {
        suspend: 'SUSPENDED',
        approve: 'APPROVED',
        reject: 'REJECTED'
      };
      const targetStatus = statusMap[modal.type];
      await updateStatusMutation.mutateAsync({
        id: modal.vendor.id,
        status: targetStatus,
        reason: reason.trim() || undefined
      });
      setReason('');
      setModal(null);
    } catch (err: any) {
      setError(err.response?.data?.error ?? t('common.error', { defaultValue: 'Có lỗi xảy ra.' }));
    }
  };

  // Vendor count tally inside each Zone/Tour
  const tourCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vendors.forEach((vendor: any) => {
      const tourId = vendor.assignedTourId ? String(vendor.assignedTourId) : 'unassigned';
      counts[tourId] = (counts[tourId] || 0) + 1;
    });
    return counts;
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    if (!selectedTourId) return [];
    if (selectedTourId === 'unassigned') {
      return vendors.filter((v: any) => !v.assignedTourId);
    }
    return vendors.filter((v: any) => String(v.assignedTourId) === String(selectedTourId));
  }, [vendors, selectedTourId]);

  const selectedTourName = useMemo(() => {
    if (selectedTourId === 'unassigned') {
      return t('admin.vendors.unassigned', { defaultValue: 'Chưa phân khu' });
    }
    const tour = tours.find((t: any) => String(t.id) === String(selectedTourId));
    return tour ? tour.name : '';
  }, [selectedTourId, tours, t]);

  const columns = useMemo(() => [
    {
      key: 'vendorCode',
      label: t('admin.vendors.table.code'),
      render: (vendor: any) => <span className="font-bold text-slate-900">{vendor.vendorCode ?? '-'}</span>
    },
    {
      key: 'businessName',
      label: t('admin.vendors.table.name'),
      render: (vendor: any) => (
        <div>
          <p className="font-semibold text-slate-950">{vendor.businessName}</p>
          <p className="text-xs text-slate-500">{vendor.legalName}</p>
        </div>
      )
    },
    {
      key: 'ownerEmail',
      label: t('admin.vendors.table.email'),
      render: (vendor: any) => <span className="text-slate-600 font-medium">{vendor.ownerEmail}</span>
    },
    {
      key: 'assignedTourId',
      label: t('admin.vendors.table.zone'),
      render: (vendor: any) => {
        const tour = tours.find((t: any) => String(t.id) === String(vendor.assignedTourId));
        return <span className="text-slate-700 font-semibold">{tour ? tour.name : '-'}</span>;
      }
    },
    {
      key: 'status',
      label: t('admin.vendors.table.status'),
      render: (vendor: any) => {
        const badgeColors: Record<string, string> = {
          PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
          APPROVED: 'bg-green-50 text-green-700 border-green-200',
          SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
          REJECTED: 'bg-slate-50 text-slate-700 border-slate-200'
        };
        const statusVal = vendor.verificationStatus || 'PENDING';
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeColors[statusVal] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
            {t(`admin.vendors.status.${statusVal}`, { defaultValue: statusVal })}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: t('admin.vendors.table.actions'),
      cellClassName: 'px-4 py-3 text-right',
      render: (vendor: any) => (
        <div className="flex justify-end gap-2">
          <Link
            to={`/admin/vendors/${vendor.id}`}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            title={t('common.detail')}
          >
            <Eye size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setModal({ type: 'edit', vendor })}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            title={t('common.edit', { defaultValue: 'Chỉnh sửa' })}
          >
            <Pencil size={16} />
          </button>
          {vendor.verificationStatus === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => setModal({ type: 'approve', vendor })}
                className="grid h-9 w-9 place-items-center rounded-lg border border-green-200 text-green-700 transition hover:bg-green-50"
                title={t('common.approve')}
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setReason('');
                  setModal({ type: 'reject', vendor });
                }}
                className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50"
                title={t('common.reject')}
              >
                <X size={16} />
              </button>
            </>
          )}
          {vendor.verificationStatus === 'APPROVED' && (
            <button
              type="button"
              onClick={() => {
                setReason('');
                setModal({ type: 'suspend', vendor });
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-sm"
            >
              <Ban size={14} />
              {t('common.suspend', { defaultValue: 'Suspend' })}
            </button>
          )}
          {vendor.verificationStatus === 'SUSPENDED' && (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(t('admin.vendors.confirm_unsuspend', { defaultValue: 'Bạn có chắc chắn muốn mở khóa tài khoản vendor này?' }))) {
                  try {
                    await unsuspendMutation.mutateAsync(vendor.id);
                  } catch (err: any) {
                    alert(err.response?.data?.error ?? t('common.error', { defaultValue: 'Có lỗi xảy ra' }));
                  }
                }
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 text-xs font-bold text-green-700 hover:bg-green-100 transition shadow-sm"
            >
              <Check size={14} />
              {t('admin.vendors.unsuspend_btn', { defaultValue: 'Mở khóa' })}
            </button>
          )}
        </div>
      )
    }
  ], [t, tours]);

  const tabs = useMemo(() => [
    { label: t('common.all', { defaultValue: 'Tất cả' }), value: 'ALL' },
    { label: t('admin.vendors.status.PENDING'), value: 'PENDING' },
    { label: t('admin.vendors.status.APPROVED'), value: 'APPROVED' },
    { label: t('admin.vendors.status.SUSPENDED'), value: 'SUSPENDED' },
  ], [t]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AdminPageHeader
        eyebrow="PORTAL VENDOR"
        title={t('admin.vendors.title')}
        description={t('admin.vendors.subtitle')}
        action={
          <button
            type="button"
            onClick={() => setModal({ type: 'add' })}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus size={17} />
            {t('admin.vendors.create_btn')}
          </button>
        }
      />

      {/* Tier 1: Zone Grid */}
      {!selectedTourId && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            {t('admin.vendors.hierarchical_title', { defaultValue: 'Danh sách nhà cung cấp theo Khu vực' })}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tours.map((tour: any) => (
              <div
                key={tour.id}
                onClick={() => setSelectedTourId(String(tour.id))}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-blue-500 cursor-pointer"
              >
                <div className="aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={tour.coverImageUrl || 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=250&fit=crop'}
                    alt={tour.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {tour.name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                      {t('admin.vendors.total_vendors_count', { count: tourCounts[String(tour.id)] || 0, defaultValue: `${tourCounts[String(tour.id)] || 0} nhà cung cấp` })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Unassigned Area Card */}
            <div
              onClick={() => setSelectedTourId('unassigned')}
              className="group relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 shadow-sm transition hover:shadow-md hover:border-blue-500 cursor-pointer flex flex-col justify-center p-6 text-center min-h-[220px]"
            >
              <h3 className="font-bold text-slate-700 group-hover:text-blue-600 transition text-lg">
                {t('admin.vendors.unassigned', { defaultValue: 'Chưa phân khu' })}
              </h3>
              <p className="mt-2 text-sm text-slate-500 font-semibold">
                {t('admin.vendors.unassigned_desc', { defaultValue: 'Đối tác chưa được gán khu vực hoạt động.' })}
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                  {t('admin.vendors.total_vendors_count', { count: tourCounts['unassigned'] || 0, defaultValue: `${tourCounts['unassigned'] || 0} nhà cung cấp` })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier 2: Zone Filtered Vendor List */}
      {selectedTourId && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedTourId(null)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <ChevronLeft size={16} />
              {t('admin.vendors.back_to_zones', { defaultValue: 'Quay lại danh sách Khu vực' })}
            </button>
            <h2 className="text-xl font-bold text-slate-900">
              {selectedTourName}
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatus(tab.value)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition duration-200 ${
                    status === tab.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 size={30} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <AdminDataTable
              columns={columns}
              rows={filteredVendors}
              emptyText={t('common.no_data', { defaultValue: 'Chưa có dữ liệu' })}
            />
          )}
        </div>
      )}

      {/* Provision Vendor Account Modal */}
      <CreateVendorModal
        open={modal?.type === 'add'}
        isSubmitting={createMutation.isPending}
        onClose={() => setModal(null)}
        onConfirm={handleCreateConfirm}
      />

      {/* Edit Vendor Modal */}
      <EditVendorModal
        open={modal?.type === 'edit'}
        vendor={modal?.vendor}
        isSubmitting={updateMutation.isPending}
        onClose={() => setModal(null)}
        onConfirm={handleEditConfirm}
      />

      {/* Confirmation Modals (Approve / Reject / Suspend) */}
      <AdminModal
        open={modal?.type === 'approve' || modal?.type === 'reject' || modal?.type === 'suspend'}
        title={
          modal?.type === 'suspend'
            ? t('common.suspend', { defaultValue: 'Khóa tài khoản' })
            : modal?.type === 'approve'
            ? t('common.approve', { defaultValue: 'Duyệt tài khoản' })
            : t('common.reject', { defaultValue: 'Từ chối tài khoản' })
        }
        confirmLabel={t('common.confirm')}
        tone={modal?.type === 'suspend' || modal?.type === 'reject' ? 'danger' : 'success'}
        onClose={() => setModal(null)}
        onConfirm={handleStatusConfirm}
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-600">
            {modal?.type === 'suspend'
              ? t('admin.vendors.confirm_suspend')
              : modal?.type === 'approve'
              ? t('vendors.confirm_approve', { defaultValue: 'Bạn có chắc chắn muốn duyệt tài khoản này?' })
              : t('vendors.confirm_reject', { defaultValue: 'Bạn có chắc chắn muốn từ chối tài khoản này?' })}
          </p>

          {(modal?.type === 'reject' || modal?.type === 'suspend') && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                {t('common.reason')}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('common.reason_placeholder', { defaultValue: 'Nhập lý do...' })}
                className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">
              {error}
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}

function Loader2({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
