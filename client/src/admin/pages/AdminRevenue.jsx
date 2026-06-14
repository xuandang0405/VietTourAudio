import { Download } from 'lucide-react';
import { AdminBadge } from '../components/AdminBadge';
import { AdminDataTable } from '../components/AdminDataTable';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { formatCurrency, payments } from '../data/adminMockData';

export function AdminRevenue() {
  const columns = [
    { key: 'id', label: 'Mã GD', render: (row) => <span className="font-black text-slate-950">{row.id}</span> },
    { key: 'vendorName', label: 'Vendor' },
    { key: 'paymentType', label: 'Loại' },
    { key: 'provider', label: 'Provider' },
    { key: 'amount', label: 'Số tiền', render: (row) => <span className="font-bold">{formatCurrency(row.amount)}</span> },
    { key: 'createdAt', label: 'Ngày tạo' },
    { key: 'status', label: 'Trạng thái', render: (row) => <AdminBadge status={row.status} /> }
  ];

  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Revenue"
        title="Doanh thu"
        description={`Tổng giao dịch mẫu: ${formatCurrency(total)}. Khi nối backend sẽ có filter thời gian, provider và export CSV.`}
        action={
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50">
            <Download size={17} />
            Export CSV
          </button>
        }
      />
      <AdminDataTable columns={columns} rows={payments} />
    </div>
  );
}
