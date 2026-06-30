import { CheckCircle2, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { useCommissions } from '../../../admin/api/adminQueries';
import { formatCurrency } from '../../../admin/utils/formatters';

export function AdminCommissions() {
  const { t } = useTranslation();
  const { data: dbCommissions = [], isLoading, refetch } = useCommissions();

  const formattedRows = dbCommissions.map((row) => ({
    id: row.id,
    vendorName: row.vendorName,
    baseAmount: Number(row.baseAmount) || 0,
    commissionRate: `${row.commissionRate}%`,
    commissionAmount: Number(row.commissionAmount) || 0,
    status: row.status
  }));

  const columns = [
    { key: 'id', label: 'Mã HH', render: (row) => <span className="font-black text-slate-950">#{row.id}</span> },
    { key: 'vendorName', label: 'Nhà cung cấp' },
    { key: 'baseAmount', label: 'Doanh thu gốc', render: (row) => formatCurrency(row.baseAmount) },
    { key: 'commissionRate', label: 'Tỷ lệ' },
    { key: 'commissionAmount', label: 'Hoa hồng', render: (row) => <span className="font-black text-slate-950">{formatCurrency(row.commissionAmount)}</span> },
    { key: 'status', label: 'Trạng thái', render: (row) => <AdminBadge status={row.status} /> }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Commissions"
        title="Đối soát hoa hồng"
        description="Theo dõi hoa hồng của các nhà cung cấp thời gian thực trực tiếp từ cơ sở dữ liệu."
        action={
          <button
            onClick={() => refetch()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCcw size={17} />
            Làm mới
          </button>
        }
      />
      <AdminDataTable
        columns={columns}
        rows={formattedRows}
        emptyText={isLoading ? 'Đang tải...' : 'Chưa có thông tin đối soát hoa hồng.'}
      />
    </div>
  );
}
