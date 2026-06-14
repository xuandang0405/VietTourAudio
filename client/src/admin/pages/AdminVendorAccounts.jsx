import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, RefreshCcw, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useVendorWallet, useVendorWallets, useWalletMutation } from '../api/adminQueries';
import { formatCurrency, formatDateTime, toNumber } from '../utils/formatters';

const emptyForm = { amount: '', description: '', reason: '' };

export function AdminVendorAccounts() {
  const { data: vendors = [], isLoading, error, refetch } = useVendorWallets();
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const creditMutation = useWalletMutation('credit');
  const debitMutation = useWalletMutation('debit');
  const selectedWallet = useVendorWallet(selectedVendorId);

  useEffect(() => {
    if (!selectedVendorId && vendors.length) {
      setSelectedVendorId(vendors[0].id);
    }
  }, [selectedVendorId, vendors]);

  const rows = useMemo(() => vendors.map((vendor) => ({ ...vendor, health: getBalanceHealth(vendor) })), [vendors]);
  const selectedVendor = selectedWallet.data ?? vendors.find((vendor) => vendor.id === selectedVendorId);
  const transactions = selectedVendor?.wallet?.transactions ?? [];

  function openWalletModal(type, vendor) {
    setForm(emptyForm);
    setFormError('');
    setModal({ type, vendor });
  }

  async function handleWalletMutation() {
    if (!modal?.vendor) return;
    if (!form.amount || !form.description.trim() || !form.reason.trim()) {
      setFormError('Số tiền, mô tả và lý do là bắt buộc.');
      return;
    }

    const payload = {
      amount: form.amount,
      description: form.description.trim(),
      reason: form.reason.trim()
    };

    try {
      if (modal.type === 'credit') {
        await creditMutation.mutateAsync({ vendorId: modal.vendor.id, payload });
      } else {
        await debitMutation.mutateAsync({ vendorId: modal.vendor.id, payload });
      }
      setModal(null);
      setForm(emptyForm);
    } catch (err) {
      setFormError(err.response?.data?.error ?? 'Không thể cập nhật ví vendor.');
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Vendor accounts"
        title="Ví vendor"
        description="Theo dõi số dư, trạng thái subscription và thực hiện cộng/trừ ví thủ công với audit reason bắt buộc."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Làm mới
          </button>
        }
      />

      {error && <ErrorPanel message={error.response?.data?.error ?? 'Không tải được danh sách ví vendor.'} />}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_430px]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-black text-slate-950">{isLoading ? 'Đang tải dữ liệu...' : `${rows.length} vendor accounts`}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Số dư</th>
                  <th className="px-4 py-3">Subscription</th>
                  <th className="px-4 py-3">Cảnh báo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className={selectedVendorId === vendor.id ? 'bg-blue-50/60' : 'transition hover:bg-slate-50'}
                    onClick={() => setSelectedVendorId(vendor.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-950">{vendor.businessName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{vendor.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-950">{formatCurrency(vendor.wallet?.balance)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Top-up {formatCurrency(vendor.wallet?.totalTopUp)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">{vendor.subscription?.plan?.name ?? 'Chưa có gói'}</p>
                        <AdminBadge status={vendor.subscription?.status ?? 'DRAFT'} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <BalanceHealth health={vendor.health} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openWalletModal('credit', vendor);
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-green-200 px-3 text-xs font-black text-green-700 transition hover:bg-green-50"
                        >
                          <ArrowUpCircle size={15} />
                          Credit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openWalletModal('debit', vendor);
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-black text-red-700 transition hover:bg-red-50"
                        >
                          <ArrowDownCircle size={15} />
                          Debit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                      Chưa có ví vendor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-600">Wallet detail</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">{selectedVendor?.businessName ?? 'Chọn vendor'}</h2>
            </div>
            <WalletCards className="text-blue-600" size={24} />
          </div>

          {selectedVendor ? (
            <>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">Số dư hiện tại</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{formatCurrency(selectedVendor.wallet?.balance)}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Tổng đã nạp {formatCurrency(selectedVendor.wallet?.totalTopUp)}
                </p>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-black text-slate-950">Lịch sử giao dịch</h3>
                <div className="mt-3 max-h-[480px] space-y-3 overflow-y-auto pr-1">
                  {selectedWallet.isLoading && <p className="text-sm font-semibold text-slate-500">Đang tải giao dịch...</p>}
                  {transactions.map((tx) => (
                    <div key={tx.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <AdminBadge status={tx.type} />
                          <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-800">{tx.description}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{formatDateTime(tx.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={toNumber(tx.amount) < 0 ? 'font-black text-red-600' : 'font-black text-green-700'}>
                            {formatCurrency(tx.amount)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">Sau GD: {formatCurrency(tx.balanceAfter)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!selectedWallet.isLoading && transactions.length === 0 && (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Chưa có giao dịch.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm font-semibold text-slate-500">Chọn một vendor để xem lịch sử giao dịch.</p>
          )}
        </aside>
      </section>

      <AdminModal
        open={Boolean(modal)}
        title={modal?.type === 'credit' ? 'Cộng tiền ví vendor' : 'Trừ tiền ví vendor'}
        description="Số tiền, mô tả và lý do là bắt buộc. Backend sẽ ghi WalletTransaction và AuditLog."
        confirmLabel={modal?.type === 'credit' ? 'Credit ví' : 'Debit ví'}
        tone={modal?.type === 'credit' ? 'success' : 'danger'}
        onClose={() => setModal(null)}
        onConfirm={handleWalletMutation}
      >
        <div className="space-y-3">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</div>}
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Số tiền</span>
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="300000"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Mô tả giao dịch</span>
            <input
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Manual wallet adjustment"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Lý do audit</span>
            <textarea
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              className="mt-1 h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Nhập lý do điều chỉnh ví..."
            />
          </label>
        </div>
      </AdminModal>
    </div>
  );
}

function getBalanceHealth(vendor) {
  const balance = toNumber(vendor.wallet?.balance);
  const monthlyPrice = toNumber(vendor.subscription?.plan?.monthlyPrice);

  if (!monthlyPrice) return { tone: 'neutral', label: 'Chưa có subscription' };
  if (balance < monthlyPrice) return { tone: 'danger', label: 'Không đủ kỳ tới' };
  if (balance < monthlyPrice * 2) return { tone: 'warning', label: 'Sắp thấp' };
  return { tone: 'good', label: 'An toàn' };
}

function BalanceHealth({ health }) {
  const className =
    health.tone === 'danger'
      ? 'bg-red-50 text-red-700 ring-red-200'
      : health.tone === 'warning'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : health.tone === 'good'
          ? 'bg-green-50 text-green-700 ring-green-200'
          : 'bg-slate-100 text-slate-600 ring-slate-200';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ring-1 ring-inset ${className}`}>
      {(health.tone === 'danger' || health.tone === 'warning') && <AlertTriangle size={13} />}
      {health.label}
    </span>
  );
}

function ErrorPanel({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>;
}
