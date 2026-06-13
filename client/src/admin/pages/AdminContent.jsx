import { Check, Eye, Image, Music, Play, Video, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { mediaQueue } from '../data/adminMockData';

const mediaTabs = [
  { label: 'Tất cả', value: 'ALL', icon: Eye },
  { label: 'Hình ảnh', value: 'IMAGE', icon: Image },
  { label: 'Audio', value: 'AUDIO', icon: Music },
  { label: 'Video', value: 'VIDEO', icon: Video }
];

export function AdminContent() {
  const [type, setType] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [modal, setModal] = useState(null);

  const visibleItems = useMemo(() => {
    return mediaQueue.filter((item) => type === 'ALL' || item.mediaType === type);
  }, [type]);

  function toggleSelected(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-24">
      <AdminPageHeader
        eyebrow="Content moderation"
        title="Kiểm duyệt media"
        description="Duyệt ảnh, video, audio và tài liệu do vendor upload. Bulk approve hỗ trợ tối đa 50 bản ghi khi nối API thật."
      />

      <section className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hide-scrollbar">
        {mediaTabs.map((tab) => (
          <button
            type="button"
            key={tab.value}
            onClick={() => setType(tab.value)}
            className={type === tab.value ? 'inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white' : 'inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 transition duration-200 ease-out hover:bg-slate-200'}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleItems.map((item) => {
          const selected = selectedIds.includes(item.id);

          return (
            <article key={item.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 ease-out ${selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'}`}>
              <div className="relative aspect-video bg-slate-100">
                <img className="h-full w-full object-cover" src={item.previewUrl} alt={item.title} />
                <button
                  type="button"
                  onClick={() => toggleSelected(item.id)}
                  className={selected ? 'absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white' : 'absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-slate-400 ring-1 ring-slate-200'}
                  aria-label={`Chọn ${item.title}`}
                >
                  {selected && <Check size={15} />}
                </button>
                <div className="absolute right-3 top-3">
                  <AdminBadge status={item.mediaType} />
                </div>
                {item.mediaType !== 'IMAGE' && (
                  <button
                    type="button"
                    className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-blue-600 shadow-lg"
                    aria-label="Preview"
                  >
                    <Play size={20} fill="currentColor" />
                  </button>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-sm font-black leading-5 text-slate-950">{item.title}</h2>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.vendorName}</p>
                  </div>
                  <AdminBadge status={item.moderationStatus} />
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                  <p>POI: {item.poiName}</p>
                  <p className="mt-1">Dung lượng: {item.size}</p>
                  <p className="mt-1">Upload: {item.createdAt}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'approve', item })}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-green-200 text-sm font-black text-green-700 transition duration-200 ease-out hover:bg-green-50"
                  >
                    <Check size={16} />
                    Duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'reject', item })}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-black text-red-700 transition duration-200 ease-out hover:bg-red-50"
                  >
                    <X size={16} />
                    Từ chối
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-[1500] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:left-24 lg:left-64">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-slate-950">Đã chọn {selectedIds.length} media</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition duration-200 ease-out hover:bg-slate-50"
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                onClick={() => setModal({ type: 'bulk' })}
                className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition duration-200 ease-out hover:bg-blue-700"
              >
                Bulk approve
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminModal
        open={Boolean(modal)}
        title={modal?.type === 'bulk' ? 'Duyệt hàng loạt' : modal?.type === 'approve' ? 'Duyệt media' : 'Từ chối media'}
        description={modal?.type === 'bulk' ? `Xác nhận duyệt ${selectedIds.length} media đã chọn.` : 'Thao tác này sẽ cập nhật moderationStatus và ghi audit log khi nối API thật.'}
        confirmLabel={modal?.type === 'reject' ? 'Từ chối' : 'Duyệt'}
        tone={modal?.type === 'reject' ? 'danger' : 'success'}
        onClose={() => setModal(null)}
        onConfirm={() => {
          setModal(null);
          if (modal?.type === 'bulk') {
            setSelectedIds([]);
          }
        }}
      >
        {modal?.type === 'reject' && (
          <textarea
            className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Nhập lý do từ chối..."
          />
        )}
      </AdminModal>
    </div>
  );
}
