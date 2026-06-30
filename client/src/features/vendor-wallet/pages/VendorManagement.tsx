import { Ban, Check, Eye, PauseCircle, Plus, Search, ShieldAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVendors, useCreateVendor, useUpdateVendorStatus, useToursList } from '../../../admin/api/adminQueries';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminModal } from '../../../admin/components/AdminModal';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { formatCurrency, formatDate } from '../../../admin/utils/formatters';

export function VendorManagement() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Creation form state
  const [tradeName, setTradeName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [password, setPassword] = useState('');
  const [assignedTourId, setAssignedTourId] = useState('');

  const params = useMemo(() => ({ status, search }), [search, status]);
  const { data: vendors = [], isLoading, error: listError } = useVendors(params);
  const { data: tours = [] } = useToursList();

  const createMutation = useCreateVendor();
  const updateStatusMutation = useUpdateVendorStatus();

  const tabs = useMemo(() => [
    { label: t('vendors.all'), value: 'ALL' },
    { label: t('status.pending'), value: 'PENDING' },
    { label: t('status.approved'), value: 'APPROVED' },
    { label: t('status.rejected'), value: 'REJECTED' },
    { label: t('status.suspended'), value: 'SUSPENDED' }
  ], [t]);

  const openAddVendorModal = () => {
    setError('');
    setTradeName('');
    setContactEmail('');
    setVendorCode('');
    setPassword('');
    setAssignedTourId(tours[0]?.id ?? '');
    setModal({ type: 'add' });
  };

  const handleConfirm = async () => {
    if (!modal) return;
    setError('');

    try {
      if (modal.type === 'add') {
        if (!tradeName.trim() || !contactEmail.trim() || !vendorCode.trim() || !password.trim()) {
          setError(t('vendors.modals.all_fields_required', { defaultValue: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' }));
          return;
        }
        await createMutation.mutateAsync({
          tradeName: tradeName.trim(),
          contactEmail: contactEmail.trim().toLowerCase(),
          password,
          vendorCode: vendorCode.trim(),
          assignedTourId: assignedTourId ? String(assignedTourId) : null
        });
      } else {
        // status change: approve, reject, suspend
        const statusMap: Record<string, string> = {
          approve: 'APPROVED',
          reject: 'REJECTED',
          suspend: 'SUSPENDED'
        };
        const targetStatus = statusMap[modal.type];
        if (targetStatus !== 'APPROVED' && !reason.trim()) {
          setError(t('vendors.modals.reason_required'));
          return;
        }
        await updateStatusMutation.mutateAsync({
          id: modal.vendor.id,
          status: targetStatus,
          reason: reason.trim()
        });
      }
      setReason('');
      setModal(null);
    } catch (err: any) {
      setError(err.response?.data?.error ?? t('vendors.error_update'));
    }
  };

  const columns = useMemo(() => [
    {
      key: 'id',
      label: t('vendors.table.code'),
      render: (vendor: any) => <span className="font-black text-slate-950">#{vendor.id}</span>
    },
    {
      key: 'businessName',
      label: t('vendors.table.vendor'),
      render: (vendor: any) => (
        <div>
          <p className="font-black text-slate-950">{vendor.businessName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{vendor.ownerEmail}</p>
        </div>
      )
    },
    { key: 'ownerDisplayName', label: t('vendors.table.representative'), render: (vendor: any) => vendor.ownerDisplayName ?? '-' },
    {
      key: 'subscription',
      label: t('vendors.table.plan'),
      render: (vendor: any) => (
        <div>
          <p className="font-bold text-slate-800">{vendor.subscription?.plan?.name ?? t('vendors.table.no_plan')}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{t('vendors.table.expired_at', { date: formatDate(vendor.subscription?.periodEnd) })}</p>
        </div>
      )
    },
    {
      key: 'wallet',
      label: t('vendors.table.wallet'),
      render: (vendor: any) => <span className="font-bold text-slate-800">{formatCurrency(vendor.wallet?.balance)}</span>
    },
    {
      key: 'verificationStatus',
      label: t('vendors.table.status'),
      render: (vendor: any) => <AdminBadge status={vendor.verificationStatus} />
    },
    {
      key: 'actions',
      label: t('vendors.table.actions'),
      cellClassName: 'px-4 py-3 text-right',
      render: (vendor: any) => (
        <div className="flex justify-end gap-2">
          <Link
            to={`/admin/vendors/${vendor.id}`}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label={t('vendors.table.action_view')}
          >
            <Eye size={16} />
          </Link>
          {vendor.verificationStatus === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => setModal({ type: 'approve', vendor })}
                className="grid h-9 w-9 place-items-center rounded-lg border border-green-200 text-green-700 transition hover:bg-green-50"
                aria-label={t('vendors.table.action_approve')}
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
                aria-label={t('vendors.table.action_reject')}
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-black text-red-700 hover:bg-red-100 transition shadow-sm"
              title={t('vendors.suspend_immediately', { defaultValue: 'Hủy/Khóa tài khoản lập tức' })}
            >
              <Ban size={14} />
              {t('vendors.suspend_btn', { defaultValue: 'Khóa lập tức' })}
            </button>
          )}
        </div>
      )
    }
  ], [t]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow={t('vendors.management_subtitle', 'Vendor Management')}
        title={t('sidebar.vendors')}
        description={t('vendors.description')}
        action={
          <button
            type="button"
            onClick={openAddVendorModal}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            {t('vendors.add', { defaultValue: 'Tạo tài khoản Đối tác' })}
          </button>
        }
      />

      {(error || listError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error || listError?.response?.data?.error || t('vendors.error_load')}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={status === tab.value ? 'shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white' : 'shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200'}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 lg:w-96">
            <Search size={17} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              placeholder={t('vendors.search_placeholder')}
            />
          </label>
        </div>
      </section>

      <AdminDataTable columns={columns} rows={vendors} emptyText={isLoading ? t('common.loading') : t('poi.no_matching')} />

      {/* Creation Modal */}
      <AdminModal
        open={Boolean(modal) && modal?.type === 'add'}
        title={t('vendors.add_title', { defaultValue: 'Tạo tài khoản Đối tác mới' })}
        description={t('vendors.add_desc', { defaultValue: 'Tạo một hồ sơ đối tác hoàn chỉnh với pháp lý và thông tin đăng nhập.' })}
        confirmLabel={t('common.add')}
        tone="success"
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        <div className="space-y-4 py-2">
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('vendors.form.trade_name', { defaultValue: 'Tên đối tác / Chủ sạp' })}</label>
            <input
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="VD: Food Stall A"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('vendors.form.email', { defaultValue: 'Email đăng ký' })}</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('vendors.form.vendor_code', { defaultValue: 'Mã sạp / Vendor code' })}</label>
              <input
                value={vendorCode}
                onChange={(e) => setVendorCode(e.target.value)}
                placeholder="STALL-001"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('vendors.form.password', { defaultValue: 'Mật khẩu khởi tạo' })}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('vendors.form.assigned_zone', { defaultValue: 'Khu vực quản lý (Zone)' })}</label>
              <select
                value={assignedTourId}
                onChange={(e) => setAssignedTourId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              >
                {tours.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Approve / Reject / Suspend status Modals */}
      <AdminModal
        open={Boolean(modal) && modal?.type !== 'add'}
        title={modal?.type === 'approve' ? t('vendors.modals.approve_title') : modal?.type === 'suspend' ? t('vendors.modals.suspend_title') : t('vendors.modals.reject_title')}
        description={
          modal?.type === 'approve'
            ? t('vendors.modals.approve_desc', { name: modal?.vendor?.businessName })
            : modal?.type === 'suspend'
            ? t('vendors.modals.suspend_desc', { name: modal?.vendor?.businessName, defaultValue: `Tài khoản của đối tác "${modal?.vendor?.businessName}" sẽ bị khóa và ngắt toàn bộ phiên kết nối lập tức.` })
            : t('vendors.modals.reject_desc', { name: modal?.vendor?.businessName })
        }
        confirmLabel={modal?.type === 'approve' ? t('vendors.modals.approve') : modal?.type === 'suspend' ? t('vendors.modals.suspend', { defaultValue: 'Khóa lập tức' }) : t('vendors.modals.reject')}
        tone={modal?.type === 'approve' ? 'success' : 'danger'}
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        {modal?.type !== 'approve' && (
          <div className="space-y-3">
            {modal?.type === 'suspend' && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{t('vendors.modals.suspend_warning_tip', { defaultValue: 'Hành động này sẽ vô hiệu hóa tất cả tài khoản sạp liên kết, thu hồi mã JWT và buộc đăng xuất lập tức.' })}</span>
              </div>
            )}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder={t('vendors.modals.reason_placeholder')}
            />
          </div>
        )}
      </AdminModal>
    </div>
  );
}
