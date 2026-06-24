import { PageHeader } from '../components/PageHeader';

const rows = [
  { id: 'v1', name: 'Saigon Walking Co.', status: 'ACTIVE' },
  { id: 'v2', name: 'Heritage Story Labs', status: 'PENDING' }
];

export function VendorPage() {
  return (
    <section className="space-y-4">
      <PageHeader title="Vendor Management" subtitle="Kiem duyet nha cung cap noi dung" />
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-slate-100 px-2 py-3 last:border-b-0">
            <div>
              <p className="font-semibold">{r.name}</p>
              <p className="text-xs text-slate-500">{r.id}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{r.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
