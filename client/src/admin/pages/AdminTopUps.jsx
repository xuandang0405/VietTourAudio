import { CheckCircle2, ImageOff, RefreshCcw, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useApproveTopUp, useRejectTopUp, useTopUpRequests } from '../api/adminQueries';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const tabs = [
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
  { label: 'Tất cả', value: 'ALL' }
];

export function AdminTopUps() {
  const [status, setStatus] = useState('PENDING');
  const [selectedId, setSelectedId] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const params = useMemo(() => ({ status }), [status]);
  const { data: requests = [], isLoading, error: listError, refetch } = useTopUpRequests(params);
  const approveMutation = useApproveTopUp();
  const rejectMutation = useRejectTopUp();
  const selected = requests.find((item) => item.id === selectedId) ?? requests[0];

  async function handleApprove(request) {
    setError('');
    try {
      await approveMutation.mutateAsync(request.id);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Không thể duyệt yêu cầu nạp tiền.');
    }
  }

  async function handleReject() {
    if (!rejectModal) return;
    if (!reason.trim()) {
      setError('Lý do từ chối là bắt buộc.');
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: rejectModal.id, reason: reason.trim() });
      setRejectModal(null);
      setReason('');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Không thể từ chối yêu cầu nạp tiền.');
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Top-Up management"
        title="Duyệt yêu cầu nạp tiền"
        description="Kiểm tra proof image, duyệt top-up theo transaction atomic và tự động cộng ví vendor."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Làm mới
          </button>
        }
      />

      {(error || listError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error || listError?.response?.data?.error || 'Không tải được yêu cầu top-up.'}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={status === tab.value ? 'shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white' : 'shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200'}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-black text-slate-950">{isLoading ? 'Đang tải...' : `${requests.length} yêu cầu`}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {requests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => setSelectedId(request.id)}
                className={selected?.id === request.id ? 'block w-full bg-blue-50/70 p-4 text-left' : 'block w-full p-4 text-left transition hover:bg-slate-50'}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{request.vendor?.businessName ?? `Vendor ${request.vendorId}`}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{request.vendor?.ownerEmail}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminBadge status={request.provider} />
                    <AdminBadge status={request.status} />
                    <span className="text-sm font-black text-slate-950">{formatCurrency(request.amount)}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">{formatDateTime(request.createdAt)}</p>
              </button>
            ))}
            {!isLoading && requests.length === 0 && (
              <p className="p-10 text-center text-sm font-semibold text-slate-500">Không có yêu cầu phù hợp.</p>
            )}
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-600">Proof review</p>
                  <h2 className="mt-1 truncate text-lg font-black text-slate-950">{selected.vendor?.businessName}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{formatCurrency(selected.amount)}</p>
                </div>
                <AdminBadge status={selected.status} />
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {selected.proofImageUrl ? (
                  <img
                    src={selected.proofImageUrl}
                    alt="Top-up proof"
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center text-slate-400">
                    <div className="text-center">
                      <ImageOff className="mx-auto" size={34} />
                      <p className="mt-2 text-sm font-bold">Không có proof image</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                <Info label="Provider" value={<AdminBadge status={selected.provider} />} />
                <Info label="Số dư hiện tại" value={formatCurrency(selected.vendor?.wallet?.balance)} />
                <Info label="Subscription" value={selected.vendor?.subscription?.plan?.name ?? 'Chưa có'} />
                {selected.rejectReason && <Info label="Lý do từ chối" value={selected.rejectReason} />}
              </div>

              {selected.status === 'PENDING' && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(selected)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 text-sm font-black text-white transition hover:bg-green-700"
                  >
                    <CheckCircle2 size={17} />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setReason('');
                      setRejectModal(selected);
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-black text-red-700 transition hover:bg-red-50"
                  >
                    <XCircle size={17} />
                    Reject
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-500">Chọn một yêu cầu để xem proof image.</p>
          )}
        </aside>
      </section>

      <AdminModal
        open={Boolean(rejectModal)}
        title="Từ chối top-up"
        description="Lý do là bắt buộc và sẽ được lưu vào TopUpRequest cùng AuditLog."
        confirmLabel="Từ chối"
        tone="danger"
        onClose={() => setRejectModal(null)}
        onConfirm={handleReject}
      >
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          placeholder="Nhập lý do từ chối..."
        />
      </AdminModal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="text-right font-black text-slate-900">{value}</span>
    </div>
  );
}
