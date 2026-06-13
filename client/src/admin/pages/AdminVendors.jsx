import { Check, Eye, Search, ShieldAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminBadge } from '../components/AdminBadge';
import { AdminDataTable } from '../components/AdminDataTable';
import { AdminModal } from '../components/AdminModal';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { formatCurrency, vendors } from '../data/adminMockData';

const tabs = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
  { label: 'Tạm dừng', value: 'SUSPENDED' }
];

export function AdminVendors() {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchStatus = status === 'ALL' || vendor.verificationStatus === status;
      const query = search.trim().toLowerCase();
      const matchSearch =
        !query ||
        vendor.businessName.toLowerCase().includes(query) ||
        vendor.ownerEmail.toLowerCase().includes(query) ||
        vendor.ownerDisplayName.toLowerCase().includes(query);

      return matchStatus && matchSearch;
    });
  }, [search, status]);

  const columns = [
    {
      key: 'id',
      label: 'Mã',
      render: (vendor) => <span className="font-black text-slate-950">{vendor.id}</span>
    },
    {
      key: 'businessName',
      label: 'Nhà cung cấp',
      render: (vendor) => (
        <div>
          <p className="font-black text-slate-950">{vendor.businessName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{vendor.ownerEmail}</p>
        </div>
      )
    },
    { key: 'ownerDisplayName', label: 'Đại diện' },
    { key: 'contactPhone', label: 'SĐT' },
    {
      key: 'subscription',
      label: 'Gói',
      render: (vendor) => (
        <div>
          <p className="font-bold text-slate-800">{vendor.subscription.plan}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Hết hạn {vendor.subscription.periodEnd}</p>
        </div>
      )
    },
    {
      key: 'revenue',
      label: 'Doanh thu',
      render: (vendor) => <span className="font-bold text-slate-800">{formatCurrency(vendor.revenue)}</span>
    },
    {
      key: 'verificationStatus',
      label: 'Trạng thái',
      render: (vendor) => <AdminBadge status={vendor.verificationStatus} />
    },
    {
      key: 'actions',
      label: 'Thao tác',
      cellClassName: 'px-4 py-3 text-right',
      render: (vendor) => (
        <div className="flex justify-end gap-2">
          <Link
            to={`/admin/vendors/${vendor.id}`}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition duration-200 ease-out hover:bg-slate-50"
            aria-label={`Xem ${vendor.businessName}`}
          >
            <Eye size={16} />
          </Link>
          {vendor.verificationStatus === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => setModal({ type: 'approve', vendor })}
                className="grid h-9 w-9 place-items-center rounded-lg border border-green-200 text-green-700 transition duration-200 ease-out hover:bg-green-50"
                aria-label="Duyệt vendor"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => setModal({ type: 'reject', vendor })}
                className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-700 transition duration-200 ease-out hover:bg-red-50"
                aria-label="Từ chối vendor"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Quản lý vendor"
        title="Nhà cung cấp"
        description="Duyệt hồ sơ chủ sạp, kiểm tra subscription, doanh thu và trạng thái vận hành."
        action={
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition duration-200 ease-out hover:bg-blue-700"
          >
            <ShieldAlert size={17} />
            Export queue
          </button>
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={status === tab.value ? 'shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white' : 'shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 transition duration-200 ease-out hover:bg-slate-200'}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 lg:w-96">
            <Search size={17} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              placeholder="Tìm tên vendor, email, người đại diện..."
            />
          </label>
        </div>
      </section>

      <AdminDataTable columns={columns} rows={filteredVendors} emptyText="Không tìm thấy vendor phù hợp." />

      <AdminModal
        open={Boolean(modal)}
        title={modal?.type === 'approve' ? 'Duyệt nhà cung cấp' : 'Từ chối nhà cung cấp'}
        description={
          modal?.type === 'approve'
            ? `Xác nhận duyệt ${modal?.vendor.businessName}. Hệ thống sẽ ghi audit log và cập nhật người duyệt.`
            : `Nhập lý do từ chối ${modal?.vendor.businessName}. Lý do là bắt buộc khi nối API thật.`
        }
        confirmLabel={modal?.type === 'approve' ? 'Duyệt' : 'Từ chối'}
        tone={modal?.type === 'approve' ? 'success' : 'danger'}
        onClose={() => setModal(null)}
        onConfirm={() => setModal(null)}
      >
        {modal?.type === 'reject' && (
          <textarea
            className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none transition duration-200 ease-out focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Ví dụ: Thiếu giấy phép kinh doanh hợp lệ."
          />
        )}
      </AdminModal>
    </div>
  );
}
