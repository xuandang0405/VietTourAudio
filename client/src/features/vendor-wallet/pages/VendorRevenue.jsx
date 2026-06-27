import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Download, Loader2, QrCode, Upload, WalletCards } from 'lucide-react';
import { downloadBlob, formatCurrency, formatDateTime } from '../../../admin/utils/formatters';
import { useVendorRevenue } from '../../../vendor/api/vendorQueries';
import { mockPaySubscription, requestPremiumUpgrade, submitWalletTopUp } from '../../../vendor/api/vendorApi';

export function VendorRevenue() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useVendorRevenue();
  const transactions = data?.transactions ?? [];
  const topUps = data?.topUps ?? [];
  const summary = data?.summary ?? {};
  const [topUpAmount, setTopUpAmount] = useState('300000');
  const [topUpNote, setTopUpNote] = useState('');
  const [proof, setProof] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  function exportLedger() {
    const rows = [
      'id,category,direction,amount,balance_after,description,created_at',
      ...transactions.map((tx) => [tx.id, tx.category, tx.direction, tx.amount, tx.balanceAfter, JSON.stringify(tx.description ?? ''), tx.createdAt].join(','))
    ].join('\n');
    downloadBlob(new Blob([rows], { type: 'text/csv;charset=utf-8' }), 'vendor-wallet-ledger.csv');
  }

  async function runAction(action, task, successKey) {
    setBusy(action);
    setMessage({ type: '', text: '' });
    try {
      await task();
      setMessage({ type: 'success', text: t(successKey) });
      await refetch();
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.response?.data?.error ?? t('common.error') });
    } finally {
      setBusy('');
    }
  }

  function submitTopUp(event) {
    event.preventDefault();
    if (!proof) {
      setMessage({ type: 'error', text: t('wallet.proof_required') });
      return;
    }
    const payload = new FormData();
    payload.append('amount', topUpAmount);
    payload.append('note', topUpNote.trim());
    payload.append('proof', proof);
    void runAction('topup', () => submitWalletTopUp(payload), 'wallet.topup_submitted').then(() => {
      setProof(null);
      setTopUpNote('');
    });
  }

  if (isLoading) return <div className="p-8 text-sm font-bold text-slate-500">{t('wallet.loading')}</div>;
  if (error) return <div className="p-8 text-sm font-bold text-red-700">{error.response?.data?.error ?? t('wallet.load_error')}</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t('vendor.wallet_title')}</h2>
          <p className="mt-1 text-slate-500">{t('vendor.wallet_desc')}</p>
        </div>
        <button type="button" onClick={exportLedger} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
          <Download size={17} />{t('wallet.export')}
        </button>
      </header>

      {message.text && (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-teal-600 p-6 text-white shadow-sm">
          <WalletCards size={24} />
          <p className="mt-4 text-sm font-semibold text-teal-100">{t('vendor.wallet_balance')}</p>
          <p className="mt-1 text-3xl font-black">{formatCurrency(summary.balance)}</p>
          <p className="mt-2 text-xs text-teal-100">{t('wallet.top_up_total')}: {formatCurrency(summary.totalTopUp)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-500">{t('wallet.monthly_rent')}</p>
          <p className="mt-2 text-lg font-black text-slate-900">{t('wallet.next_billing')}: {summary.nextBillingDate ? new Date(summary.nextBillingDate).toLocaleDateString() : '-'}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{t('common.status')}: {summary.subscriptionStatus ?? '-'}</p>
          <button type="button" disabled={Boolean(busy)} onClick={() => runAction('rent', mockPaySubscription, 'wallet.rent_paid')} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-50">
            {busy === 'rent' && <Loader2 size={15} className="animate-spin" />}{t('wallet.pay_rent')}
          </button>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <Crown className="text-amber-600" size={24} />
          <p className="mt-3 text-sm font-black text-amber-950">{summary.isPremium ? t('wallet.premium_active') : t('wallet.premium_upgrade')}</p>
          <p className="mt-1 text-sm font-bold text-amber-800">{formatCurrency(summary.premiumPrice)}</p>
          <button type="button" disabled={Boolean(busy) || summary.isPremium} onClick={() => runAction('premium', () => requestPremiumUpgrade({}), 'wallet.premium_upgraded')} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-700 disabled:opacity-50">
            {busy === 'premium' && <Loader2 size={15} className="animate-spin" />}{summary.isPremium ? t('wallet.premium_active') : t('wallet.upgrade_from_wallet')}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b p-4"><h3 className="font-black text-slate-900">{t('wallet.transaction_history')}</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="p-4">{t('wallet.date')}</th><th className="p-4">{t('wallet.type')}</th><th className="p-4">{t('wallet.description')}</th><th className="p-4 text-right">{t('wallet.amount')}</th></tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-100">
                    <td className="p-4 text-slate-500">{formatDateTime(tx.createdAt)}</td>
                    <td className="p-4 text-xs font-black text-slate-700">{tx.category ?? tx.type}</td>
                    <td className="p-4 text-slate-600">{tx.description}</td>
                    <td className={`p-4 text-right font-black ${tx.direction === 'DEBIT' ? 'text-red-600' : 'text-green-600'}`}>{tx.direction === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
                {!transactions.length && <tr><td colSpan={4} className="p-8 text-center text-slate-500">{t('wallet.no_transactions')}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-5">
          <form onSubmit={submitTopUp} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><QrCode className="text-teal-600" /><h3 className="font-black text-slate-900">{t('wallet.topup_title')}</h3></div>
            <p className="text-xs leading-5 text-slate-500">{t('wallet.topup_instructions')}</p>
            <div className="flex justify-center rounded-xl bg-slate-50 p-3"><img src="/qr_fallback.svg" alt={t('wallet.payment_qr_alt')} className="h-36 w-36" /></div>
            <label className="block text-xs font-bold text-slate-600">{t('wallet.transfer_amount')}
              <input type="number" min="1" required value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} className="mt-1 h-10 w-full rounded-xl border bg-slate-50 px-3 text-sm" />
            </label>
            <label className="block text-xs font-bold text-slate-600">{t('wallet.transfer_proof')}
              <span className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-3 text-slate-500"><Upload size={16} />{proof?.name ?? t('wallet.select_proof')}
                <input type="file" required accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
              </span>
            </label>
            <label className="block text-xs font-bold text-slate-600">{t('wallet.notes')}
              <textarea rows={2} value={topUpNote} onChange={(e) => setTopUpNote(e.target.value)} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 text-sm" />
            </label>
            <button disabled={Boolean(busy)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-50">
              {busy === 'topup' && <Loader2 size={15} className="animate-spin" />}{t('wallet.submit_topup')}
            </button>
          </form>
          {topUps.length > 0 && <div className="rounded-2xl border bg-white p-4 text-xs text-slate-600"><p className="mb-2 font-black text-slate-900">{t('wallet.topup_history')}</p>{topUps.slice(0, 5).map((item) => <p key={item.id} className="border-t py-2">{formatCurrency(item.amount)} · {item.status}</p>)}</div>}
        </aside>
      </div>
    </div>
  );
}
