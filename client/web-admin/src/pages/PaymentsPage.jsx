import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { sampleRows } from '../utils/mockData';
import { fetchPayments } from '../api/admin';

export function PaymentsPage() {
  const [rows, setRows] = useState(sampleRows.payments);

  useEffect(() => {
    let active = true;
    fetchPayments().then((items) => {
      if (!active || !items?.length) return;
      setRows(items.map((p) => ({
        id: p.id,
        guestId: p.guestId || '-',
        amount: p.amount,
        status: p.status
      })));
    });
    return () => { active = false; };
  }, []);

  const columns = useMemo(() => [
    { header: 'Payment ID', accessorKey: 'id' },
    { header: 'Guest', accessorKey: 'guestId' },
    { header: 'Amount', accessorKey: 'amount' },
    { header: 'Status', accessorKey: 'status' }
  ], []);

  return (
    <section className="space-y-4">
      <PageHeader title="Payments" subtitle="Theo doi giao dich premium va doi soat mock gateway" />
      <DataTable columns={columns} data={rows} />
    </section>
  );
}
