import { Download, FileJson } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { AdminModal } from '../../../admin/components/AdminModal';
import { useAuditLogs } from '../../../admin/api/adminQueries';
import { formatDate } from '../../../admin/utils/formatters';

function JsonDiff({ before = {}, after = {}, t }) {
  const keys = Array.from(
    new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {})
    ])
  );

  if (keys.length === 0) {
    return <p className="text-xs font-semibold text-slate-500">{t('audit_log.no_details')}</p>;
  }

  return (
    <div className="space-y-2.5 max-h-[350px] overflow-y-auto font-mono text-xs p-1">
      {keys.map((key) => {
        const b = before?.[key];
        const a = after?.[key];
        const bStr = b !== undefined && b !== null ? JSON.stringify(b) : 'null';
        const aStr = a !== undefined && a !== null ? JSON.stringify(a) : 'null';

        if (bStr === aStr) {
          // Unchanged
          return (
            <div key={key} className="flex py-0.5 px-2 text-slate-400">
              <span className="w-32 font-bold shrink-0 text-slate-500">{key}:</span>
              <span className="truncate">{aStr}</span>
            </div>
          );
        }

        if (b === undefined || b === null) {
          // Added
          return (
            <div key={key} className="flex flex-col md:flex-row md:items-center py-1.5 px-3 bg-green-50/80 text-green-800 border-l-4 border-green-500 rounded-lg">
              <span className="w-32 font-black shrink-0 text-green-900 mb-0.5 md:mb-0">{key}:</span>
              <span className="font-bold">+ {aStr}</span>
            </div>
          );
        }

        if (a === undefined || a === null) {
          // Deleted
          return (
            <div key={key} className="flex flex-col md:flex-row md:items-center py-1.5 px-3 bg-red-50/80 text-red-800 border-l-4 border-red-500 line-through rounded-lg">
              <span className="w-32 font-black shrink-0 text-red-900 mb-0.5 md:mb-0">{key}:</span>
              <span className="font-bold">- {bStr}</span>
            </div>
          );
        }

        // Modified
        return (
          <div key={key} className="py-2 px-3 bg-amber-50/80 text-amber-900 border-l-4 border-amber-500 rounded-lg space-y-1">
            <div className="flex items-center">
              <span className="w-32 font-black shrink-0 text-amber-950">{key}:</span>
              <span className="line-through text-red-600 font-bold">{bStr}</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 shrink-0" />
              <span className="text-green-600 font-black">&rarr; {aStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminAuditLogs() {
  const { t } = useTranslation();
  const { data: logs = [], isLoading, error } = useAuditLogs();
  const [selectedLog, setSelectedLog] = useState(null);

  const columns = useMemo(() => [
    {
      key: 'id',
      label: t('audit_log.id'),
      render: (row) => <span className="font-black text-slate-950">#{row.id}</span>
    },
    {
      key: 'performedBy',
      label: t('audit_log.actor'),
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.actorName || 'System'}</p>
          <p className="text-xs text-slate-500 font-semibold">{row.performedBy}</p>
        </div>
      )
    },
    {
      key: 'action',
      label: t('audit_log.action'),
      render: (row) => <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{row.action}</span>
    },
    {
      key: 'targetType',
      label: t('audit_log.target'),
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">{row.targetType}</p>
          <p className="text-xs text-slate-500 font-semibold">ID: {row.targetId ?? 'N/A'}</p>
        </div>
      )
    },
    {
      key: 'ipAddress',
      label: t('audit_log.ip_address'),
      cellClassName: 'hidden px-4 py-3 align-middle xl:table-cell',
      render: (row) => <span className="font-mono text-xs">{row.ipAddress}</span>
    },
    {
      key: 'createdAt',
      label: t('audit_log.time'),
      render: (row) => <span className="text-xs text-slate-600 font-semibold">{formatDate(row.createdAt)}</span>
    },
    {
      key: 'details',
      label: t('audit_log.details'),
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedLog(row)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
        >
          <FileJson size={15} />
          {t('audit_log.view_details')}
        </button>
      )
    }
  ], [t]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow={t('audit_log.eyebrow')}
        title={t('audit_log.title')}
        description={t('audit_log.subtitle')}
        action={
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <Download size={17} />
            {t('audit_log.export')}
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error.response?.data?.error || t('audit_log.error_loading')}
        </div>
      )}

      <AdminDataTable
        columns={columns}
        rows={logs}
        emptyText={isLoading ? t('audit_log.loading') : t('audit_log.empty')}
      />

      {/* Details Diff Modal */}
      <AdminModal
        open={Boolean(selectedLog)}
        title={t('audit_log.modal_title', { id: selectedLog?.id })}
        description={t('audit_log.modal_desc', { action: selectedLog?.action, ip: selectedLog?.ipAddress })}
        confirmLabel={t('audit_log.close')}
        tone="default"
        onClose={() => setSelectedLog(null)}
        onConfirm={() => setSelectedLog(null)}
      >
        <div className="space-y-4 py-2">
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              {t('audit_log.actor')}
            </span>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm font-bold text-slate-800">
              {selectedLog?.actorName || 'System'} ({selectedLog?.performedBy})
            </div>
          </div>

          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              {t('audit_log.json_diff')}
            </span>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <JsonDiff before={selectedLog?.beforeData} after={selectedLog?.afterData} t={t} />
            </div>
          </div>

          {selectedLog?.reason && (
            <div>
              <span className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                {t('audit_log.reason')}
              </span>
              <p className="text-sm font-semibold text-slate-600 bg-amber-50/50 border border-amber-200/50 rounded-xl p-3">
                {selectedLog.reason}
              </p>
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
