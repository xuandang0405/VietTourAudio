import { Edit3, Plus, Trash2 } from 'lucide-react';
import { AdminBadge } from '../components/AdminBadge';
import { AdminDataTable } from '../components/AdminDataTable';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminPois } from '../data/adminMockData';

export function AdminPois() {
  const columns = [
    { key: 'id', label: 'Mã POI', render: (poi) => <span className="font-black text-slate-950">{poi.id}</span> },
    {
      key: 'name',
      label: 'Điểm tham quan',
      render: (poi) => (
        <div>
          <p className="font-black text-slate-950">{poi.name}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{poi.stallName}</p>
        </div>
      )
    },
    { key: 'category', label: 'Danh mục' },
    { key: 'activationRadius', label: 'Radius', render: (poi) => `${poi.activationRadius}m` },
    { key: 'contents', label: 'Ngôn ngữ', render: (poi) => `${poi.contents} bản` },
    { key: 'mediaFiles', label: 'Media', render: (poi) => `${poi.mediaFiles} file` },
    { key: 'status', label: 'Trạng thái', render: (poi) => <AdminBadge status={poi.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      cellClassName: 'px-4 py-3 text-right',
      render: () => (
        <div className="flex justify-end gap-2">
          <button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Sửa POI">
            <Edit3 size={16} />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50" aria-label="Ẩn POI">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="POI management"
        title="Điểm tham quan"
        description="Quản lý POI, bán kính kích hoạt và nội dung đa ngôn ngữ. Form thật sẽ nối API upsert contents/audio."
        action={
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700">
            <Plus size={17} />
            Thêm POI
          </button>
        }
      />
      <AdminDataTable columns={columns} rows={adminPois} />
    </div>
  );
}
