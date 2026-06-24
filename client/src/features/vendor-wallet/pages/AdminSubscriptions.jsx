import { CalendarPlus } from 'lucide-react';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { subscriptions } from '../../../admin/data/adminMockData';

export function AdminSubscriptions() {
  const columns = [
    { key: 'id', label: 'Mã gói', render: (row) => <span className="font-black text-slate-950">{row.id}</span> },
    { key: 'vendorName', label: 'Vendor' },
    { key: 'plan', label: 'Plan' },
    { key: 'periodEnd', label: 'Hết hạn' },
    {
      key: 'daysLeft',
      label: 'Còn lại',
      render: (row) => <span className={row.daysLeft < 0 ? 'font-bold text-orange-700' : 'font-bold text-slate-700'}>{row.daysLeft < 0 ? `Quá ${Math.abs(row.daysLeft)} ngày` : `${row.daysLeft} ngày`}</span>
    },
    { key: 'status', label: 'Trạng thái', render: (row) => <AdminBadge status={row.status} /> }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Subscriptions"
        title="Gói dịch vụ"
        description="Theo dõi subscription sắp hết hạn/quá hạn. Cron backend sẽ chuyển ACTIVE -> OVERDUE -> SUSPENDED."
        action={
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700">
            <CalendarPlus size={17} />
            Gia hạn gói
          </button>
        }
      />
      <AdminDataTable columns={columns} rows={subscriptions} />
    </div>
  );
}
