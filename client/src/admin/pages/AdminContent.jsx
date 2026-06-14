import { Check, Eye, FileText, Image, Music, RefreshCcw, Video, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useContentMutation, useContentQueue } from '../api/adminQueries';
import { formatDateTime } from '../utils/formatters';

const statusTabs = [
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
  { label: 'Đã ẩn', value: 'HIDDEN' },
  { label: 'Tất cả', value: 'ALL' }
];

const mediaIcons = {
  IMAGE: Image,
  AUDIO: Music,
  VIDEO: Video,
  DOCUMENT: FileText
};

export function AdminContent() {
  const [status, setStatus] = useState('PENDING');
  const [selectedIds, setSelectedIds] = useState([]);
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const params = useMemo(() => ({ status }), [status]);
  const { data: items = [], isLoading, error: listError, refetch } = useContentQueue(params);
  const approveMutation = useContentMutation('approve');
  const rejectMutation = useContentMutation('reject');
  const hideMutation = useContentMutation('hide');
  const bulkMutation = useContentMutation('bulk');

  function toggleSelected(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function handleConfirm() {
    if (!modal) return;
    setError('');

    try {
      if (modal.type === 'approve') {
        await approveMutation.mutateAsync({ id: modal.item.id });
      } else if (modal.type === 'bulk') {
        await bulkMutation.mutateAsync({ ids: selectedIds });
        setSelectedIds([]);
      } else {
        if (!reason.trim()) {
          setError('Lý do là bắt buộc cho hành động từ chối/ẩn.');
          return;
        }
        const mutation = modal.type === 'reject' ? rejectMutation : hideMutation;
        await mutation.mutateAsync({ id: modal.item.id, reason: reason.trim() });
      }
      setReason('');
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Không thể cập nhật trạng thái media.');
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-24">
      <AdminPageHeader
        eyebrow="Content moderation"
        title="Kiểm duyệt media"
        description="Duyệt ảnh, video, audio và tài liệu do vendor upload. Mọi mutation được backend ghi AuditLog."
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
          {error || listError?.response?.data?.error || 'Không tải được queue kiểm duyệt.'}
        </div>
      )}

      <section className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hide-scrollbar">
        {statusTabs.map((tab) => (
          <button
            type="button"
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setSelectedIds([]);
            }}
            className={status === tab.value ? 'inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white' : 'inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200'}
          >
            <Eye size={16} />
            {tab.label}
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          const Icon = mediaIcons[item.mediaType] ?? FileText;

          return (
            <article key={item.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 ease-out ${selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'}`}>
              <div className="relative aspect-video bg-slate-100">
                <MediaPreview item={item} />
                <button
                  type="button"
                  onClick={() => toggleSelected(item.id)}
                  className={selected ? 'absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white' : 'absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-slate-400 ring-1 ring-slate-200'}
                  aria-label={`Chọn media ${item.id}`}
                >
                  {selected && <Check size={15} />}
                </button>
                <div className="absolute right-3 top-3">
                  <AdminBadge status={item.mediaType} />
                </div>
                {item.mediaType === 'DOCUMENT' && (
                  <div className="absolute inset-0 grid place-items-center text-slate-400">
                    <Icon size={40} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-sm font-black leading-5 text-slate-950">
                      {item.poi?.name ?? item.stall?.name ?? item.storagePath}
                    </h2>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.vendor?.businessName ?? 'Không có vendor'}</p>
                  </div>
                  <AdminBadge status={item.moderationStatus} />
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                  <p>Mime: {item.mimeType ?? '-'}</p>
                  <p className="mt-1">Upload: {formatDateTime(item.createdAt)}</p>
                  {item.rejectionReason && <p className="mt-1 text-red-600">Lý do: {item.rejectionReason}</p>}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'approve', item })}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-green-200 text-xs font-black text-green-700 transition hover:bg-green-50"
                  >
                    <Check size={15} />
                    Duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReason('');
                      setModal({ type: 'reject', item });
                    }}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 text-xs font-black text-red-700 transition hover:bg-red-50"
                  >
                    <X size={15} />
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReason('');
                      setModal({ type: 'hide', item });
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Ẩn
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!isLoading && items.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
          Queue hiện không có media phù hợp.
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-[1500] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:left-24 lg:left-72">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-slate-950">Đã chọn {selectedIds.length} media</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                onClick={() => setModal({ type: 'bulk' })}
                className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Bulk approve
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminModal
        open={Boolean(modal)}
        title={modal?.type === 'bulk' ? 'Duyệt hàng loạt' : modal?.type === 'approve' ? 'Duyệt media' : modal?.type === 'hide' ? 'Ẩn media' : 'Từ chối media'}
        description={modal?.type === 'bulk' ? `Xác nhận duyệt ${selectedIds.length} media đã chọn.` : 'Backend sẽ cập nhật moderationStatus và ghi AuditLog.'}
        confirmLabel={modal?.type === 'reject' ? 'Từ chối' : modal?.type === 'hide' ? 'Ẩn media' : 'Duyệt'}
        tone={modal?.type === 'reject' || modal?.type === 'hide' ? 'danger' : 'success'}
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        {(modal?.type === 'reject' || modal?.type === 'hide') && (
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Nhập lý do..."
          />
        )}
      </AdminModal>
    </div>
  );
}

function MediaPreview({ item }) {
  if (item.mediaType === 'IMAGE') {
    return <img className="h-full w-full object-cover" src={item.publicUrl} alt={item.storagePath} loading="lazy" decoding="async" />;
  }

  if (item.mediaType === 'VIDEO') {
    return <video className="h-full w-full object-cover" src={item.publicUrl} controls preload="metadata" />;
  }

  if (item.mediaType === 'AUDIO') {
    return (
      <div className="grid h-full place-items-center p-4">
        <audio className="w-full" src={item.publicUrl} controls preload="none" />
      </div>
    );
  }

  return null;
}
