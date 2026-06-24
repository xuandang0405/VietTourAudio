import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { sampleRows } from '../utils/mockData';
import { fetchUsers } from '../api/admin';

export function UsersPage() {
  const [rows, setRows] = useState(sampleRows.users);

  useEffect(() => {
    let active = true;
    fetchUsers().then((items) => {
      if (!active || !items?.length) return;
      setRows(items.map((u) => ({
        id: u.id,
        email: u.email || u.username,
        role: u.role,
        status: u.approvalStatus || (u.isActive ? 'ACTIVE' : 'INACTIVE')
      })));
    });
    return () => { active = false; };
  }, []);

  const columns = useMemo(() => [
    { header: 'User ID', accessorKey: 'id' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Role', accessorKey: 'role' },
    { header: 'Status', accessorKey: 'status' }
  ], []);

  return (
    <section className="space-y-4">
      <PageHeader title="Users & RBAC" subtitle="Phan quyen admin, vendor moderator" />
      <DataTable columns={columns} data={rows} />
    </section>
  );
}
