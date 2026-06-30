import { CalendarPlus, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { useVendorWallets } from '../../../admin/api/adminQueries';
import { formatDate } from '../../../admin/utils/formatters';

export function AdminSubscriptions() {
  const { t } = useTranslation();
  const { data: wallets = [], isLoading, refetch } = useVendorWallets();

  // Filter only vendors that have an active/inactive subscription plan
  const rows = wallets
    .filter((row) => row.planName)
    .map((row) => {
      const daysLeft = row.periodEnd
        ? Math.ceil((new Date(row.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        id: row.id,
        vendorName: row.businessName,
        plan: row.planName,
        periodEnd: formatDate(row.periodEnd),
        daysLeft,
        status: row.subscriptionStatus || 'INACTIVE'
      };
    });

  const columns = [
    { key: 'id', label: 'Mã Vendor', render: (row) => <span className="font-black text-slate-950">#{row.id}</span> },
    { key: 'vendorName', label: 'Nhà cung cấp' },
    { key: 'plan', label: 'Gói dịch vụ' },
    { key: 'periodEnd', label: 'Ngày hết hạn' },
    {
      key: 'daysLeft',
      label: 'Thời gian còn lại',
      render: (row) => (
        <span className={row.daysLeft < 0 ? 'font-black text-rose-600' : 'font-black text-slate-700'}>
          {row.daysLeft < 0 ? `Quá hạn ${Math.abs(row.daysLeft)} ngày` : `${row.daysLeft} ngày`}
        </span>
      )
    },
    { key: 'status', label: 'Trạng thái', render: (row) => <AdminBadge status={row.status} /> }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Subscriptions"
        title="Quản lý Gói dịch vụ"
        description="Theo dõi gói dịch vụ của các nhà cung cấp trực tiếp từ cơ sở dữ liệu."
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
        rows={rows}
        emptyText={isLoading ? 'Đang tải...' : 'Không có gói dịch vụ nào hoạt động.'}
      />
    </div>
  );
}
