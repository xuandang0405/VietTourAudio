import { Ban, Check, Eye, PauseCircle, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVendorAction, useVendors } from '../../../admin/api/adminQueries';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminModal } from '../../../admin/components/AdminModal';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { formatCurrency, formatDate } from '../../../admin/utils/formatters';

export function AdminVendors() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const params = useMemo(() => ({ status, search }), [search, status]);
  const { data: vendors = [], isLoading, error: listError } = useVendors(params);
  const approveMutation = useVendorAction('approve');
  const rejectMutation = useVendorAction('reject');
  const suspendMutation = useVendorAction('suspend');

  const tabs = useMemo(() => [
    { label: t('vendors.all'), value: 'ALL' },
    { label: t('status.pending'), value: 'PENDING' },
    { label: t('status.approved'), value: 'APPROVED' },
    { label: t('status.rejected'), value: 'REJECTED' },
    { label: t('status.suspended'), value: 'SUSPENDED' }
  ], [t]);

  async function handleConfirm() {
    if (!modal) return;
    setError('');

    try {
      if (modal.type === 'approve') {
        await approveMutation.mutateAsync({ id: modal.vendor.id });
      } else {
        if (!reason.trim()) {
          setError(t('vendors.modals.reason_required'));
          return;
        }
        const mutation = modal.type === 'reject' ? rejectMutation : suspendMutation;
        await mutation.mutateAsync({ id: modal.vendor.id, reason: reason.trim() });
      }
      setReason('');
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.error ?? t('vendors.error_update'));
    }
  }

  const columns = useMemo(() => [
    {
      key: 'id',
      label: t('vendors.table.code'),
      render: (vendor) => <span className="font-black text-slate-950">#{vendor.id}</span>
    },
    {
      key: 'businessName',
      label: t('vendors.table.vendor'),
      render: (vendor) => (
        <div>
          <p className="font-black text-slate-950">{vendor.businessName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{vendor.ownerEmail}</p>
        </div>
      )
    },
    { key: 'ownerDisplayName', label: t('vendors.table.representative'), render: (vendor) => vendor.ownerDisplayName ?? '-' },
    {
      key: 'subscription',
      label: t('vendors.table.plan'),
      render: (vendor) => (
        <div>
          <p className="font-bold text-slate-800">{vendor.subscription?.plan?.name ?? t('vendors.table.no_plan')}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{t('vendors.table.expired_at', { date: formatDate(vendor.subscription?.periodEnd) })}</p>
        </div>
      )
    },
    {
      key: 'wallet',
      label: t('vendors.table.wallet'),
      render: (vendor) => <span className="font-bold text-slate-800">{formatCurrency(vendor.wallet?.balance)}</span>
    },
    {
      key: 'verificationStatus',
      label: t('vendors.table.status'),
      render: (vendor) => <AdminBadge status={vendor.verificationStatus} />
    },
    {
      key: 'actions',
      label: t('vendors.table.actions'),
      cellClassName: 'px-4 py-3 text-right',
      render: (vendor) => (
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
              className="grid h-9 w-9 place-items-center rounded-lg border border-amber-200 text-amber-700 transition hover:bg-amber-50"
              aria-label={t('vendors.table.action_suspend')}
            >
              <PauseCircle size={16} />
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

      <AdminModal
        open={Boolean(modal)}
        title={modal?.type === 'approve' ? t('vendors.modals.approve_title') : modal?.type === 'suspend' ? t('vendors.modals.suspend_title') : t('vendors.modals.reject_title')}
        description={
          modal?.type === 'approve'
            ? t('vendors.modals.approve_desc', { name: modal?.vendor?.businessName })
            : t('vendors.modals.reject_desc', { name: modal?.vendor?.businessName })
        }
        confirmLabel={modal?.type === 'approve' ? t('vendors.modals.approve') : modal?.type === 'suspend' ? t('vendors.modals.suspend') : t('vendors.modals.reject')}
        tone={modal?.type === 'approve' ? 'success' : 'danger'}
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        {modal?.type !== 'approve' && (
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder={t('vendors.modals.reason_placeholder')}
          />
        )}
      </AdminModal>
    </div>
  );
}
