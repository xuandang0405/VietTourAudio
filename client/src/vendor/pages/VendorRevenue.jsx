import { ArrowUpRight, Download, WalletCards } from 'lucide-react';
import { downloadBlob, formatCurrency, formatDateTime, toNumber } from '../../admin/utils/formatters';
import { useVendorRevenue } from '../api/vendorQueries';

export function VendorRevenue() {
  const { data, isLoading, error } = useVendorRevenue();
  const transactions = data?.transactions ?? [];
  const summary = data?.summary ?? {};

  function handleExport() {
    const lines = [
      'id,type,direction,amount,balance_after,description,created_at',
      ...transactions.map((tx) => [tx.id, tx.type, tx.direction, tx.amount, tx.balanceAfter, JSON.stringify(tx.description ?? ''), tx.createdAt].join(','))
    ].join('\n');

    downloadBlob(new Blob([lines], { type: 'text/csv;charset=utf-8;' }), 'vendor-wallet-transactions.csv');
  }

  if (isLoading) {
    return <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">Đang tải doanh thu vendor...</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-700">{error.response?.data?.error ?? 'Không tải được doanh thu vendor.'}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Doanh thu chia sẻ</h2>
          <p className="text-slate-500 mt-1">Số dư ví, commission và lịch sử giao dịch của vendor.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition">
            <Download size={18} />
            Xuất báo cáo
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowUpRight size={64} />
          </div>
          <p className="text-sm font-semibold text-slate-500">Số dư ví hiện tại</p>
          <p className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(summary.balance)}</p>
          <p className="text-sm font-bold text-green-500 mt-2">Top up {formatCurrency(summary.totalTopUp)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-500">Commission đã duyệt</p>
          <p className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(summary.approvedCommission)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-500">Commission chờ đối soát</p>
          <p className="text-3xl font-black text-premium-600 mt-2">{formatCurrency(summary.pendingCommission)}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-600">
              <WalletCards size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-500">Tổng đã chi</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(summary.totalSpent)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Tổng commission tích lũy</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(summary.totalCommission)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Lịch sử giao dịch ví gần đây</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="p-4 font-bold">Mã Giao Dịch</th>
              <th className="p-4 font-bold">Thời gian</th>
              <th className="p-4 font-bold">Mô tả</th>
              <th className="p-4 font-bold text-right">Số tiền nhận</th>
              <th className="p-4 font-bold text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="p-4 text-sm font-bold text-slate-900">TX-{tx.id}</td>
                <td className="p-4 text-sm text-slate-500">{formatDateTime(tx.createdAt)}</td>
                <td className="p-4 text-sm text-slate-600">{tx.description ?? tx.type}</td>
                <td className={toNumber(tx.direction === 'DEBIT' ? -Number(tx.amount) : Number(tx.amount)) < 0 ? 'p-4 text-sm font-bold text-red-600 text-right' : 'p-4 text-sm font-bold text-green-600 text-right'}>
                  {tx.direction === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount)}
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                    {tx.type}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm font-semibold text-slate-500">
                  Chưa có giao dịch ví.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
