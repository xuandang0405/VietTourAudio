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
  FORCE_CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-200',
  PAID: 'bg-green-50 text-green-700 ring-green-200',
  FAILED: 'bg-red-50 text-red-700 ring-red-200',
  REFUNDED: 'bg-sky-50 text-sky-700 ring-sky-200',
  IMAGE: 'bg-sky-50 text-sky-700 ring-sky-200',
  VIDEO: 'bg-purple-50 text-purple-700 ring-purple-200',
  AUDIO: 'bg-teal-50 text-teal-700 ring-teal-200',
  DOCUMENT: 'bg-slate-100 text-slate-700 ring-slate-200',
  TOP_UP: 'bg-green-50 text-green-700 ring-green-200',
  SUBSCRIPTION_FEE: 'bg-blue-50 text-blue-700 ring-blue-200',
  REFUND: 'bg-sky-50 text-sky-700 ring-sky-200',
  MANUAL_DEBIT: 'bg-red-50 text-red-700 ring-red-200',
  MANUAL_CREDIT: 'bg-green-50 text-green-700 ring-green-200',
  MOMO: 'bg-pink-50 text-pink-700 ring-pink-200',
  VNPAY: 'bg-blue-50 text-blue-700 ring-blue-200',
  STRIPE: 'bg-purple-50 text-purple-700 ring-purple-200',
  BANK_QR: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  CASH: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  MANUAL: 'bg-slate-100 text-slate-700 ring-slate-200'
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
  FORCE_CANCELLED: 'Force cancel',
  PENDING_REVIEW: 'Chờ review',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Hoàn tiền',
  IMAGE: 'Hình ảnh',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  DOCUMENT: 'Tài liệu',
  TOP_UP: 'Nạp ví',
  SUBSCRIPTION_FEE: 'Phí subscription',
  REFUND: 'Hoàn tiền',
  MANUAL_DEBIT: 'Trừ thủ công',
  MANUAL_CREDIT: 'Cộng thủ công',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
  STRIPE: 'Stripe',
  BANK_QR: 'Bank QR',
  CASH: 'Tiền mặt',
  MANUAL: 'Thủ công'
};

export function AdminBadge({ status }) {
  const tone = toneClassByStatus[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
  const label = labelByStatus[status] ?? status ?? '-';

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tone}`}>
      {label}
    </span>
  );
}
