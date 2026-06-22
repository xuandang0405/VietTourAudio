import { ArrowLeft, Ban, CheckCircle2, FileText, PauseCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useVendor, useVendorAction } from '../api/adminQueries';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

export function AdminVendorDetail() {
  const { id } = useParams();
  const { data: vendor, isLoading, error } = useVendor(id);
  const isSuperAdmin = useAdminAuthStore((state) => state.isSuperAdmin());
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const approveMutation = useVendorAction('approve');
  const rejectMutation = useVendorAction('reject');
  const suspendMutation = useVendorAction('suspend');
  const forceMutation = useVendorAction('force-cancel');

  async function handleConfirm() {
    if (!modal || !vendor) return;
    setActionError('');

    try {
      if (modal === 'approve') {
        await approveMutation.mutateAsync({ id: vendor.id });
      } else {
        if (!reason.trim()) {
          setActionError('Lý do là bắt buộc cho hành động này.');
          return;
        }
        const mutation = modal === 'reject' ? rejectMutation : modal === 'suspend' ? suspendMutation : forceMutation;
        await mutation.mutateAsync({ id: vendor.id, reason: reason.trim() });
      }
      setModal(null);
      setReason('');
    } catch (err) {
      setActionError(err.response?.data?.error ?? 'Không thể cập nhật vendor.');
    }
  }

  if (isLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">Đang tải chi tiết vendor...</div>;
  }

  if (error || !vendor) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4">
        <Link to="/admin/vendors" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
          <ArrowLeft size={17} />
          Quay lại
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
          {error?.response?.data?.error ?? 'Không tìm thấy vendor.'}
        </div>
      </div>
    );
  }

  const transactions = vendor.wallet?.transactions ?? [];
  const topUps = vendor.topUpRequests ?? [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Chi tiết vendor"
        title={vendor.businessName}
        description="Thông tin hồ sơ, subscription, số dư ví, top-up và các hành động kiểm soát trạng thái."
        action={
          <Link
            to="/admin/vendors"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Quay lại
          </Link>
        }
      />

      {actionError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{actionError}</div>}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_400px]">
        <div className="space-y-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Hồ sơ kinh doanh</h2>
                <p className="mt-1 text-sm text-slate-500">Mã vendor #{vendor.id}</p>
              </div>
              <AdminBadge status={vendor.verificationStatus} />
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Info label="Người đại diện" value={vendor.ownerDisplayName ?? '-'} />
              <Info label="Email" value={vendor.ownerEmail} />
              <Info label="Số điện thoại" value={vendor.contactPhone ?? '-'} />
              <Info label="Mã số thuế" value={vendor.taxCode ?? '-'} />
              <Info label="Ngày đăng ký" value={formatDate(vendor.createdAt)} />
              <Info label="Số stall" value={`${vendor.stalls?.length ?? 0} stall`} />
            </dl>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Stalls</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(vendor.stalls ?? []).map((stall) => (
                <div key={stall.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{stall.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {stall.latitude ?? '-'}, {stall.longitude ?? '-'} | radius {stall.activationRadius}m
                      </p>
                    </div>
                    <AdminBadge status={stall.status} />
                  </div>
                </div>
              ))}
              {(vendor.stalls ?? []).length === 0 && <p className="text-sm font-semibold text-slate-500">Vendor chưa có stall.</p>}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Giao dịch ví gần đây</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="py-3">Loại</th>
                    <th className="py-3">Mô tả</th>
                    <th className="py-3">Số tiền</th>
                    <th className="py-3">Sau GD</th>
                    <th className="py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3"><AdminBadge status={tx.type} /></td>
                      <td className="py-3 font-semibold text-slate-700">{tx.description}</td>
                      <td className="py-3 font-bold text-slate-800">{formatCurrency(tx.amount)}</td>
                      <td className="py-3 font-bold text-slate-800">{formatCurrency(tx.balanceAfter)}</td>
                      <td className="py-3 text-slate-600">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm font-semibold text-slate-500">Chưa có giao dịch ví.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <aside className="space-y-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Subscription & ví</h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">{vendor.subscription?.plan?.name ?? 'Chưa có gói'}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Hết hạn {formatDate(vendor.subscription?.periodEnd)}</p>
              <div className="mt-3"><AdminBadge status={vendor.subscription?.status ?? 'DRAFT'} /></div>
            </div>
            <p className="mt-4 text-3xl font-black text-slate-950">{formatCurrency(vendor.wallet?.balance)}</p>
            <p className="text-sm font-semibold text-slate-500">Số dư ví vendor</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Top-up gần đây</h2>
            <div className="mt-4 space-y-3">
              {topUps.map((topUp) => (
                <div key={topUp.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black text-slate-950">{formatCurrency(topUp.amount)}</span>
                    <AdminBadge status={topUp.status} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{formatDateTime(topUp.createdAt)}</p>
                </div>
              ))}
              {topUps.length === 0 && <p className="text-sm font-semibold text-slate-500">Chưa có top-up request.</p>}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Hành động</h2>
            <div className="mt-4 grid gap-2">
              <ActionButton icon={CheckCircle2} label="Duyệt vendor" tone="success" onClick={() => setModal('approve')} />
              <ActionButton icon={Ban} label="Từ chối hồ sơ" tone="danger" onClick={() => { setReason(''); setModal('reject'); }} />
              <ActionButton icon={PauseCircle} label="Tạm dừng vendor" onClick={() => { setReason(''); setModal('suspend'); }} />
              {isSuperAdmin && <ActionButton icon={FileText} label="Force cancel" tone="danger" onClick={() => { setReason(''); setModal('force-cancel'); }} />}
            </div>
          </article>
        </aside>
      </section>

      <AdminModal
        open={Boolean(modal)}
        title="Xác nhận thao tác vendor"
        description={modal === 'approve' ? 'Vendor sẽ chuyển sang APPROVED.' : 'Lý do là bắt buộc và sẽ được lưu vào AuditLog.'}
        confirmLabel="Xác nhận"
        tone={modal === 'approve' ? 'success' : 'danger'}
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        {modal !== 'approve' && (
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Nhập lý do thao tác..."
          />
        )}
      </AdminModal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}

function ActionButton({ icon: Icon, label, tone = 'default', onClick }) {
  const toneClass =
    tone === 'success'
      ? 'border-green-200 text-green-700 hover:bg-green-50'
      : tone === 'danger'
        ? 'border-red-200 text-red-700 hover:bg-red-50'
        : 'border-slate-200 text-slate-700 hover:bg-slate-50';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-black transition ${toneClass}`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}
