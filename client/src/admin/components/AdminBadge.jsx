const toneClassByStatus = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  APPROVED: 'bg-green-50 text-green-700 ring-green-200',
  ACTIVE: 'bg-green-50 text-green-700 ring-green-200',
  REJECTED: 'bg-red-50 text-red-700 ring-red-200',
  SUSPENDED: 'bg-slate-100 text-slate-600 ring-slate-200',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-200',
  OVERDUE: 'bg-orange-50 text-orange-700 ring-orange-200',
  TRIAL: 'bg-blue-50 text-blue-700 ring-blue-200',
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-200',
  HIDDEN: 'bg-slate-100 text-slate-600 ring-slate-200',
  PAID: 'bg-green-50 text-green-700 ring-green-200',
  FAILED: 'bg-red-50 text-red-700 ring-red-200',
  IMAGE: 'bg-sky-50 text-sky-700 ring-sky-200',
  VIDEO: 'bg-purple-50 text-purple-700 ring-purple-200',
  AUDIO: 'bg-teal-50 text-teal-700 ring-teal-200',
  DOCUMENT: 'bg-slate-100 text-slate-700 ring-slate-200'
};

const labelByStatus = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  ACTIVE: 'Đang hoạt động',
  REJECTED: 'Từ chối',
  SUSPENDED: 'Tạm dừng',
  CANCELLED: 'Đã hủy',
  OVERDUE: 'Quá hạn',
  TRIAL: 'Dùng thử',
  DRAFT: 'Bản nháp',
  HIDDEN: 'Đã ẩn',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  IMAGE: 'Hình ảnh',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  DOCUMENT: 'Tài liệu'
};

export function AdminBadge({ status }) {
  const tone = toneClassByStatus[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
  const label = labelByStatus[status] ?? status;

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tone}`}>
      {label}
    </span>
  );
}
