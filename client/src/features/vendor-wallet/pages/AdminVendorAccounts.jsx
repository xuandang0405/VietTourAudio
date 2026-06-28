import { 
  AlertTriangle, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCcw, 
  WalletCards, 
  CheckCircle2, 
  XCircle, 
  ImageOff 
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminModal } from '../../../admin/components/AdminModal';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { 
  useVendorWallet, 
  useVendorWallets, 
  useWalletMutation,
  useTopUpRequests,
  useApproveTopUp,
  useRejectTopUp
} from '../../../admin/api/adminQueries';
import { adminApiClient } from '../../../admin/api/adminApi';
import { formatCurrency, formatDateTime, toNumber } from '../../../admin/utils/formatters';

const emptyForm = { amount: '', description: '', reason: '' };

export function AdminVendorAccounts() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('wallets'); // 'wallets' | 'topups'

  // Wallets Section Queries
  const { data: vendors = [], isLoading: isWalletsLoading, error: walletsError, refetch: refetchWallets } = useVendorWallets();
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [walletModal, setWalletModal] = useState(null); // { type: 'credit' | 'debit', vendor: any }
  const [walletForm, setWalletForm] = useState(emptyForm);
  const [walletFormError, setWalletFormError] = useState('');
  const creditMutation = useWalletMutation('credit');
  const debitMutation = useWalletMutation('debit');
  const selectedWallet = useVendorWallet(selectedVendorId);

  // Topups Section Queries & Mutations
  const [topupStatusFilter, setTopupStatusFilter] = useState('PENDING');
  const [selectedTopupId, setSelectedTopupId] = useState('');
  const [rejectTopupModal, setRejectTopupModal] = useState(null); // request object
  const [rejectReason, setRejectReason] = useState('');
  const [topupError, setTopupError] = useState('');

  const topupParams = useMemo(() => ({ status: topupStatusFilter }), [topupStatusFilter]);
  const { data: topupRequests = [], isLoading: isTopupsLoading, error: topupsError, refetch: refetchTopups } = useTopUpRequests(topupParams);
  const approveTopupMutation = useApproveTopUp();
  const rejectTopupMutation = useRejectTopUp();

  useEffect(() => {
    if (!selectedVendorId && vendors.length) {
      setSelectedVendorId(vendors[0].id);
    }
  }, [selectedVendorId, vendors]);

  const walletRows = useMemo(() => vendors.map((vendor) => ({ ...vendor, health: getBalanceHealth(vendor, t) })), [vendors, t]);
  const selectedVendor = selectedWallet.data ?? vendors.find((vendor) => vendor.id === selectedVendorId);
  const walletTransactions = selectedVendor?.wallet?.transactions ?? [];

  const selectedTopup = topupRequests.find((item) => item.id === selectedTopupId) ?? topupRequests[0];

  const refreshAllData = () => {
    refetchWallets();
    refetchTopups();
  };

  // Wallet Adjustments
  function openWalletModal(type, vendor) {
    setWalletForm(emptyForm);
    setWalletFormError('');
    setWalletModal({ type, vendor });
  }

  async function handleWalletMutation() {
    if (!walletModal?.vendor) return;
    if (!walletForm.amount || !walletForm.description.trim() || !walletForm.reason.trim()) {
      setWalletFormError(t('vendor_wallet.error_required'));
      return;
    }

    const payload = {
      amount: walletForm.amount,
      description: walletForm.description.trim(),
      reason: walletForm.reason.trim()
    };

    try {
      if (walletModal.type === 'credit') {
        await creditMutation.mutateAsync({ vendorId: walletModal.vendor.id, payload });
      } else {
        await debitMutation.mutateAsync({ vendorId: walletModal.vendor.id, payload });
      }
      setWalletModal(null);
      setWalletForm(emptyForm);
      toast.success("Điều chỉnh số dư ví thành công!");
    } catch (err) {
      setWalletFormError(err.response?.data?.error ?? t('vendor_wallet.error_update'));
    }
  }

  // Topup request actions
  async function handleApproveTopup(request) {
    setTopupError('');
    try {
      await approveTopupMutation.mutateAsync(request.id);
      toast.success("Đã phê duyệt yêu cầu nạp tiền!");
      refetchTopups();
      refetchWallets();
    } catch (err) {
      setTopupError(err.response?.data?.error ?? t('admin_topup.error_approve'));
    }
  }

  async function handleRejectTopup() {
    if (!rejectTopupModal) return;
    if (!rejectReason.trim()) {
      setTopupError(t('admin_topup.error_reason_required'));
      return;
    }

    try {
      await rejectTopupMutation.mutateAsync({ id: rejectTopupModal.id, reason: rejectReason.trim() });
      toast.success("Đã từ chối yêu cầu nạp tiền.");
      setRejectTopupModal(null);
      setRejectReason('');
      refetchTopups();
    } catch (err) {
      setTopupError(err.response?.data?.error ?? t('admin_topup.error_reject'));
    }
  }



  const topupTabs = useMemo(() => [
    { label: t('admin_topup.tab_pending'), value: 'PENDING' },
    { label: t('admin_topup.tab_approved'), value: 'APPROVED' },
    { label: t('admin_topup.tab_rejected'), value: 'REJECTED' },
    { label: t('admin_topup.tab_all'), value: 'ALL' }
  ], [t]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Quản lý tài chính & Ví"
        title="Sổ cái & Tài chính Vendor"
        description="Quản lý số dư, lịch sử giao dịch kiểm toán và phê duyệt nạp tiền."
        action={
          <button
            type="button"
            onClick={refreshAllData}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Làm mới dữ liệu
          </button>
        }
      />

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('wallets')}
            className={`py-3 text-sm font-black border-b-2 transition ${
              activeTab === 'wallets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Danh sách Ví & Sổ cái
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('topups')}
            className={`py-3 text-sm font-black border-b-2 transition ${
              activeTab === 'topups'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Duyệt yêu cầu nạp tiền
          </button>

        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'wallets' && (
        <>
          {walletsError && <ErrorPanel message={walletsError.response?.data?.error ?? t('vendor_wallet.error_load')} />}

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_430px]">
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-black text-slate-950">
                  {isWalletsLoading ? t('vendor_wallet.loading_data') : t('vendor_wallet.vendor_count', { count: walletRows.length })}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">{t('vendor_wallet.col_vendor')}</th>
                      <th className="px-4 py-3">{t('vendor_wallet.col_balance')}</th>
                      <th className="px-4 py-3">{t('vendor_wallet.col_subscription')}</th>
                      <th className="px-4 py-3">{t('vendor_wallet.col_warning')}</th>
                      <th className="px-4 py-3 text-right">{t('vendor_wallet.col_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {walletRows.map((vendor) => (
                      <tr
                        key={vendor.id}
                        className={selectedVendorId === vendor.id ? 'bg-blue-50/60' : 'transition hover:bg-slate-50 cursor-pointer'}
                        onClick={() => setSelectedVendorId(vendor.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-black text-slate-950">{vendor.businessName}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{vendor.ownerEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-black text-slate-950">{formatCurrency(vendor.wallet?.balance)}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{t('vendor_wallet.topup_label')} {formatCurrency(vendor.wallet?.totalTopUp)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800">{vendor.subscription?.plan?.name ?? t('vendor_wallet.no_plan')}</p>
                            <AdminBadge status={vendor.subscription?.status ?? 'DRAFT'} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <BalanceHealth health={vendor.health} />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openWalletModal('credit', vendor)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-green-200 px-3 text-xs font-black text-green-700 transition hover:bg-green-50"
                            >
                              <ArrowUpCircle size={15} />
                              {t('vendor_wallet.btn_credit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => openWalletModal('debit', vendor)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-black text-red-700 transition hover:bg-red-50"
                            >
                              <ArrowDownCircle size={15} />
                              {t('vendor_wallet.btn_debit')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!isWalletsLoading && walletRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                          {t('vendor_wallet.no_vendors')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-600">{t('vendor_wallet.wallet_detail')}</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">{selectedVendor?.businessName ?? t('vendor_wallet.select_vendor')}</h2>
                </div>
                <WalletCards className="text-blue-600" size={24} />
              </div>

              {selectedVendor ? (
                <>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-500">{t('vendor_wallet.current_balance')}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{formatCurrency(selectedVendor.wallet?.balance)}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {t('vendor_wallet.total_topup')} {formatCurrency(selectedVendor.wallet?.totalTopUp)}
                    </p>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-sm font-black text-slate-950">{t('vendor_wallet.transaction_history')}</h3>
                    <div className="mt-3 max-h-[480px] space-y-3 overflow-y-auto pr-1">
                      {selectedWallet.isLoading && <p className="text-sm font-semibold text-slate-500">{t('vendor_wallet.loading_tx')}</p>}
                      {walletTransactions.map((tx) => (
                        <div key={tx.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <AdminBadge status={tx.type} />
                              <p className="mt-2 text-sm font-bold text-slate-800 leading-relaxed">{tx.description}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">{formatDateTime(tx.createdAt)}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={toNumber(tx.amount) < 0 ? 'font-black text-red-600' : 'font-black text-green-700'}>
                                {formatCurrency(tx.amount)}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">{t('vendor_wallet.after_tx')} {formatCurrency(tx.balanceAfter)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!selectedWallet.isLoading && walletTransactions.length === 0 && (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">{t('vendor_wallet.no_transactions')}</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm font-semibold text-slate-500">{t('vendor_wallet.select_vendor_hint')}</p>
              )}
            </aside>
          </section>

          {/* Wallet credit/debit Modal */}
          <AdminModal
            open={Boolean(walletModal)}
            title={walletModal?.type === 'credit' ? t('vendor_wallet.modal_title_credit') : t('vendor_wallet.modal_title_debit')}
            description="Điều chỉnh số dư ví của vendor thủ công. Yêu cầu nhập đầy đủ nội dung và lý do điều chỉnh để lưu sổ cái."
            confirmLabel={walletModal?.type === 'credit' ? t('vendor_wallet.btn_credit') : t('vendor_wallet.btn_debit')}
            tone={walletModal?.type === 'credit' ? 'success' : 'danger'}
            onClose={() => setWalletModal(null)}
            onConfirm={handleWalletMutation}
          >
            <div className="space-y-3 py-2">
              {walletFormError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{walletFormError}</div>}
              <label className="block">
                <span className="text-sm font-bold text-slate-700">{t('vendor_wallet.label_amount')}</span>
                <input
                  type="number"
                  min="1"
                  value={walletForm.amount}
                  onChange={(e) => setWalletForm((curr) => ({ ...curr, amount: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="300000"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">{t('vendor_wallet.label_description')}</span>
                <input
                  value={walletForm.description}
                  onChange={(e) => setWalletForm((curr) => ({ ...curr, description: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder={t('vendor_wallet.placeholder_desc')}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">{t('vendor_wallet.label_reason')}</span>
                <textarea
                  value={walletForm.reason}
                  onChange={(e) => setWalletForm((curr) => ({ ...curr, reason: e.target.value }))}
                  className="mt-1 h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none"
                  placeholder={t('vendor_wallet.placeholder_reason')}
                />
              </label>
            </div>
          </AdminModal>
        </>
      )}

      {activeTab === 'topups' && (
        <>
          {(topupError || topupsError) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {topupError || topupsError?.response?.data?.error || t('admin_topup.error_load')}
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {topupTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setTopupStatusFilter(tab.value)}
                  className={topupStatusFilter === tab.value ? 'shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white' : 'shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200'}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-black text-slate-950">
                  {isTopupsLoading ? t('admin_topup.loading') : t('admin_topup.request_count', { count: topupRequests.length })}
                </p>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {topupRequests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedTopupId(request.id)}
                    className={selectedTopup?.id === request.id ? 'block w-full bg-blue-50/70 p-4 text-left' : 'block w-full p-4 text-left transition hover:bg-slate-50'}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{request.vendor?.businessName ?? `Vendor ${request.vendorId}`}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{request.vendor?.ownerEmail}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <AdminBadge status={request.provider} />
                        <AdminBadge status={request.status} />
                        <span className="text-sm font-black text-slate-950">{formatCurrency(request.amount)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{formatDateTime(request.createdAt)}</p>
                  </button>
                ))}
                {!isTopupsLoading && topupRequests.length === 0 && (
                  <p className="p-10 text-center text-sm font-semibold text-slate-500">{t('admin_topup.no_requests')}</p>
                )}
              </div>
            </article>

            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {selectedTopup ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-600">{t('admin_topup.proof_review')}</p>
                      <h2 className="mt-1 truncate text-lg font-black text-slate-950">{selectedTopup.vendor?.businessName}</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{formatCurrency(selectedTopup.amount)}</p>
                    </div>
                    <AdminBadge status={selectedTopup.status} />
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {selectedTopup.proofImageUrl ? (
                      <img
                        src={selectedTopup.proofImageUrl}
                        alt="Top-up proof"
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center text-slate-400">
                        <div className="text-center">
                          <ImageOff size={40} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-bold">{t('admin_topup.no_proof')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedTopup.rejectReason && (
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-xs text-red-800">
                      <p className="font-black">{t('admin_topup.reject_reason')}</p>
                      <p className="mt-1 font-semibold leading-relaxed">{selectedTopup.rejectReason}</p>
                    </div>
                  )}

                  {selectedTopup.status === 'PENDING' && (
                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleApproveTopup(selectedTopup)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700 transition"
                      >
                        <CheckCircle2 size={16} />
                        {t('admin_topup.approve')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectReason('');
                          setRejectTopupModal(selectedTopup);
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 py-3 text-sm font-black text-red-700 hover:bg-red-50 transition"
                      >
                        <XCircle size={16} />
                        {t('admin_topup.reject')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm font-semibold text-slate-500">{t('admin_topup.select_request_hint')}</p>
              )}
            </aside>
          </section>

          {/* Reject topup modal */}
          <AdminModal
            open={Boolean(rejectTopupModal)}
            title={t('admin_topup.modal_reject_title')}
            description={t('admin_topup.modal_reject_desc', { name: rejectTopupModal?.vendor?.businessName })}
            confirmLabel={t('admin_topup.reject')}
            tone="danger"
            onClose={() => setRejectTopupModal(null)}
            onConfirm={handleRejectTopup}
          >
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 resize-none"
              placeholder={t('admin_topup.reason_placeholder')}
            />
          </AdminModal>
        </>
      )}


    </div>
  );
}

function getBalanceHealth(vendor, t) {
  const balance = toNumber(vendor.wallet?.balance);
  const monthlyPrice = toNumber(vendor.subscription?.plan?.monthlyPrice);

  if (!monthlyPrice) return { tone: 'neutral', label: t('vendor_wallet.health_no_sub') };
  if (balance < monthlyPrice) return { tone: 'danger', label: t('vendor_wallet.health_insufficient') };
  if (balance < monthlyPrice * 2) return { tone: 'warning', label: t('vendor_wallet.health_low') };
  return { tone: 'good', label: t('vendor_wallet.health_safe') };
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
