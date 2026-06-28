import { useState, useMemo } from 'react';
import { Check, Eye, Mail, MailCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminDataTable } from '../components/AdminDataTable';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { useTickets, useResolveTicket } from '../api/adminQueries';

export function AdminTickets() {
  const { t } = useTranslation();
  const { data: tickets = [], isLoading, error } = useTickets();
  const resolveMutation = useResolveTicket();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const handleResolve = async (id) => {
    if (window.confirm(t('admin.tickets.confirm_resolve', { defaultValue: 'Đánh dấu yêu cầu này đã được xử lý?' }))) {
      try {
        await resolveMutation.mutateAsync(id);
      } catch (err) {
        alert('Không thể xử lý yêu cầu.');
      }
    }
  };

  const tabs = [
    { label: t('common.all', { defaultValue: 'Tất cả' }), value: 'ALL' },
    { label: t('admin.tickets.status.PENDING', { defaultValue: 'Chờ xử lý' }), value: 'PENDING' },
    { label: t('admin.tickets.status.PROCESSED', { defaultValue: 'Đã xử lý' }), value: 'PROCESSED' },
  ];

  const columns = [
    {
      key: 'createdAt',
      label: t('admin.tickets.table.date', { defaultValue: 'Thời gian' }),
      render: (row) => (
        <span className="text-xs font-semibold text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'senderEmail',
      label: t('admin.tickets.table.email', { defaultValue: 'Người gửi' }),
      render: (row) => <span className="font-bold text-slate-900">{row.senderEmail}</span>,
    },
    {
      key: 'subject',
      label: t('admin.tickets.table.subject', { defaultValue: 'Chủ đề' }),
      render: (row) => <span className="font-semibold text-slate-700">{row.subject}</span>,
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (row) => {
        const statusColors = {
          PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
          PROCESSED: 'bg-green-50 text-green-700 border-green-200',
        };
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusColors[row.status]}`}>
            {t(`admin.tickets.status.${row.status}`, { defaultValue: row.status })}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: t('common.action'),
      cellClassName: 'px-4 py-3 text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setSelectedTicket(row)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            title={t('common.detail')}
          >
            <Eye size={16} />
          </button>
          {row.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => handleResolve(row.id)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-green-200 text-green-700 transition hover:bg-green-50"
              title={t('admin.tickets.resolve_title', { defaultValue: 'Đánh dấu đã xử lý' })}
            >
              <Check size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow={t('sidebar.tickets', { defaultValue: 'Hộp thư hỗ trợ' })}
        title={t('admin.tickets.title', { defaultValue: 'Hộp thư liên hệ & đăng ký' })}
        description={t('admin.tickets.description', { defaultValue: 'Xem các yêu cầu hỗ trợ và đăng ký làm đối tác/vendor từ khách truy cập.' })}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {t('common.load_error', { defaultValue: 'Không thể tải danh sách yêu cầu.' })}
        </div>
      )}

      {/* Tabs */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`h-9 rounded-xl px-4 text-sm font-bold transition duration-150 ease-out active:scale-95 ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <AdminDataTable
        columns={columns}
        rows={filteredTickets}
        emptyText={isLoading ? t('common.loading') : t('admin.tickets.empty_inbox', { defaultValue: 'Hộp thư trống' })}
      />

      {/* Detail Modal */}
      <AdminModal
        open={Boolean(selectedTicket)}
        title={t('admin.tickets.detail_title', { defaultValue: 'Chi tiết yêu cầu hỗ trợ' })}
        onClose={() => setSelectedTicket(null)}
        tone="info"
        confirmLabel=""
      >
        {selectedTicket && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {t('admin.tickets.table.email', { defaultValue: 'Người gửi' })}
                </p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedTicket.senderEmail}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {t('admin.tickets.table.date', { defaultValue: 'Thời gian' })}
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {t('admin.tickets.table.subject', { defaultValue: 'Chủ đề' })}
              </p>
              <p className="font-black text-slate-800 text-base mt-0.5">{selectedTicket.subject}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                {t('admin.tickets.message_body', { defaultValue: 'Nội dung tin nhắn' })}
              </p>
              <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.message}
              </p>
            </div>

            {selectedTicket.status === 'PENDING' && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    handleResolve(selectedTicket.id);
                    setSelectedTicket(null);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-black text-white hover:bg-green-700 transition active:scale-95"
                >
                  <Check size={16} />
                  {t('admin.tickets.resolve_btn', { defaultValue: 'Đánh dấu đã xử lý' })}
                </button>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
