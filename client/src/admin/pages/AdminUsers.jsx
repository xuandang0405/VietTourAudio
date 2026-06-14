import { UserPlus } from 'lucide-react';
import { AdminBadge } from '../components/AdminBadge';
import { AdminDataTable } from '../components/AdminDataTable';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminUsers } from '../data/adminMockData';

export function AdminUsers() {
  const columns = [
    { key: 'id', label: 'Mã', render: (row) => <span className="font-black text-slate-950">{row.id}</span> },
    { key: 'displayName', label: 'Tên' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Vai trò' },
    { key: 'createdAt', label: 'Ngày tạo' },
    { key: 'status', label: 'Trạng thái', render: (row) => <AdminBadge status={row.status} /> }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Settings"
        title="Quản lý Admin"
        description="CRUD tài khoản nội bộ. Backend thật cần bcrypt, soft-delete và RBAC chỉ SUPER_ADMIN được truy cập."
        action={
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700">
            <UserPlus size={17} />
            Tạo admin
          </button>
        }
      />
      <AdminDataTable columns={columns} rows={adminUsers} />
    </div>
  );
}
