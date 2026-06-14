import { Download, FileJson } from 'lucide-react';
import { useState } from 'react';
import { AdminDataTable } from '../components/AdminDataTable';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { auditLogs } from '../data/adminMockData';

export function AdminAuditLogs() {
  const [expandedId, setExpandedId] = useState(auditLogs[0]?.id);

  const columns = [
    { key: 'id', label: 'Mã log', render: (row) => <span className="font-black text-slate-950">{row.id}</span> },
    { key: 'performedBy', label: 'Người thao tác' },
    { key: 'action', label: 'Action' },
    { key: 'targetType', label: 'Target', render: (row) => `${row.targetType}: ${row.targetLabel}` },
    { key: 'ipAddress', label: 'IP', cellClassName: 'hidden px-4 py-3 align-middle xl:table-cell' },
    { key: 'createdAt', label: 'Thời gian' },
    {
      key: 'details',
      label: 'Chi tiết',
      render: (row) => (
        <button
          type="button"
          onClick={() => setExpandedId(expandedId === row.id ? '' : row.id)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
        >
          <FileJson size={15} />
          JSON diff
        </button>
      )
    }
  ];

  const expanded = auditLogs.find((log) => log.id === expandedId);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Audit"
        title="Nhật ký hệ thống"
        description="Tra cứu lịch sử thao tác admin. Trên tablet bảng hỗ trợ scroll ngang và ẩn bớt cột ít quan trọng."
        action={
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50">
            <Download size={17} />
            Export CSV
          </button>
        }
      />
      <AdminDataTable columns={columns} rows={auditLogs} />
      {expanded && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-slate-950">JSON diff: {expanded.id}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {JSON.stringify(expanded.beforeData, null, 2)}
            </pre>
            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {JSON.stringify(expanded.afterData, null, 2)}
            </pre>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Lý do: {expanded.reason}</p>
        </section>
      )}
    </div>
  );
}
