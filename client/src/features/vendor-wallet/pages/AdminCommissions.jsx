import { CheckCircle2 } from 'lucide-react';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { commissions, formatCurrency } from '../../../admin/data/adminMockData';

export function AdminCommissions() {
  const columns = [
    { key: 'id', label: 'Mã HH', render: (row) => <span className="font-black text-slate-950">{row.id}</span> },
    { key: 'vendorName', label: 'Vendor' },
    { key: 'baseAmount', label: 'Doanh thu gốc', render: (row) => formatCurrency(row.baseAmount) },
    { key: 'commissionRate', label: 'Tỷ lệ' },
    { key: 'commissionAmount', label: 'Hoa hồng', render: (row) => <span className="font-bold">{formatCurrency(row.commissionAmount)}</span> },
    { key: 'status', label: 'Trạng thái', render: (row) => <AdminBadge status={row.status} /> }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Commissions"
        title="Đối soát hoa hồng"
        description="Theo dõi hoa hồng vendor khi khách mua Premium qua QR giới thiệu của sạp."
        action={
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700">
            <CheckCircle2 size={17} />
            Bulk payout
          </button>
        }
      />
      <AdminDataTable columns={columns} rows={commissions} />
    </div>
  );
}
