import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Download, 
  Loader2, 
  QrCode, 
  Upload, 
  WalletCards, 
  TrendingUp, 
  Headphones, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Coins
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { downloadBlob, formatCurrency, formatDateTime, formatDate } from '../../admin/utils/formatters';
import { useVendorRevenue, useVendorDashboard } from '../../vendor/api/vendorQueries';
import { paySubscriptionFromWallet, requestPremiumUpgrade, submitWalletTopUp } from '../../vendor/api/vendorApi';
import { InsufficientBalanceModal } from '../../features/vendor-wallet/components/InsufficientBalanceModal';

export function VendorFinance() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Queries
  const { 
    data: revenueData, 
    isLoading: isRevLoading, 
    error: revError, 
    refetch: refetchRevenue 
  } = useVendorRevenue();
  
  const { 
    data: dashData, 
    isLoading: isDashLoading, 
    error: dashError, 
    refetch: refetchDashboard 
  } = useVendorDashboard();

  // States
  const [topUpAmount, setTopUpAmount] = useState('300000');
  const [topUpNote, setTopUpNote] = useState('');
  const [proof, setProof] = useState(null);
  const [busy, setBusy] = useState('');
  const [balanceError, setBalanceError] = useState('');
  const [bankQrUrl, setBankQrUrl] = useState('/qr_fallback.svg');
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'topup_requests'

  const topUpFormRef = useRef(null);

  // Extract revenue variables
  const transactions = revenueData?.transactions ?? [];
  const topUps = revenueData?.topUps ?? [];
  const summary = revenueData?.summary ?? {};

  // Extract dashboard variables
  const dailyData = (dashData?.daily ?? []).map((row) => ({
    name: formatDate(row.date),
    listeners: row.audioPlays,
    visitors: row.visitors,
    revenue: Number(row.revenue ?? 0)
  }));
  const topPoiData = (dashData?.topPois ?? []).map((poi) => ({
    name: poi.name,
    listeners: poi.audioPlays,
    visits: poi.visits
  }));

  // Fetch VietQR bank code
  useEffect(() => {
    axios.get('/api/admin/wallets/bank-qr')
      .then(res => {
        if (res.data?.data?.url) {
          setBankQrUrl(res.data.data.url);
        }
      })
      .catch(err => console.error("Error fetching bank QR:", err));
  }, []);

  const scrollToPaymentSection = () => {
    topUpFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Spend from wallet handlers
  const handleSpendWalletForPremium = async () => {
    setBusy('premium');
    try {
      await requestPremiumUpgrade({});
      toast.success("Kích hoạt Premium cho sạp hàng từ ví thành công!");
      await refetchRevenue();
      await refetchDashboard();
    } catch (error) {
      const payload = error.response?.data;
      if (error.response?.status === 400 || payload?.errorCode === 'INSUFFICIENT_BALANCE') {
        toast.error("Số dư ví không đủ! Tự động mở phân khu nạp tiền QR bên dưới.");
        setBalanceError("Số dư ví không đủ để nâng cấp Premium. Vui lòng nạp thêm tiền.");
        scrollToPaymentSection();
      } else {
        toast.error(payload?.message || "Giao dịch thất bại. Vui lòng kiểm tra lại hệ thống.");
      }
    } finally {
      setBusy('');
    }
  };

  const handleSpendWalletForRent = async () => {
    setBusy('rent');
    try {
      await paySubscriptionFromWallet();
      toast.success("Thanh toán phí thuê WebApp thành công!");
      await refetchRevenue();
      await refetchDashboard();
    } catch (error) {
      const payload = error.response?.data;
      if (error.response?.status === 400 || payload?.errorCode === 'INSUFFICIENT_BALANCE') {
        toast.error("Số dư ví không đủ! Tự động mở phân khu nạp tiền QR bên dưới.");
        setBalanceError("Số dư ví không đủ để thanh toán phí thuê. Vui lòng nạp thêm tiền.");
        scrollToPaymentSection();
      } else {
        toast.error(payload?.message || "Giao dịch thất bại. Vui lòng kiểm tra lại hệ thống.");
      }
    } finally {
      setBusy('');
    }
  };

  // Submit deposit proof
  const submitTopUp = async (event) => {
    event.preventDefault();
    if (!proof) {
      toast.error(t('wallet.proof_required', { defaultValue: 'Vui lòng tải ảnh biên lai chuyển khoản!' }));
      return;
    }
    setBusy('topup');
    try {
      const payload = new FormData();
      payload.append('amount', topUpAmount);
      payload.append('note', topUpNote.trim());
      payload.append('proof', proof);
      
      await submitWalletTopUp(payload);
      toast.success(t('wallet.topup_submitted', { defaultValue: 'Yêu cầu nạp tiền đã được gửi để duyệt!' }));
      setProof(null);
      setTopUpNote('');
      await refetchRevenue();
      await refetchDashboard();
    } catch (error) {
      const payload = error.response?.data;
      toast.error(payload?.message ?? payload?.error ?? t('common.error'));
    } finally {
      setBusy('');
    }
  };

  // Export ledger to CSV
  const exportLedger = () => {
    const rows = [
      'id,category,direction,amount,balance_after,description,created_at',
      ...transactions.map((tx) => [
        tx.id, 
        tx.category, 
        tx.direction, 
        tx.amount, 
        tx.balanceAfter, 
        JSON.stringify(tx.description ?? ''), 
        tx.createdAt
      ].join(','))
    ].join('\n');
    downloadBlob(new Blob([rows], { type: 'text/csv;charset=utf-8' }), 'vendor-wallet-ledger.csv');
  };

  if (isRevLoading || isDashLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-semibold text-slate-500">{t('wallet.loading', { defaultValue: 'Đang tải dữ liệu tài chính...' })}</p>
        </div>
      </div>
    );
  }

  if (revError || dashError) {
    const err = revError || dashError;
    return (
      <div className="p-8 text-center text-sm font-bold text-red-700 bg-red-50 rounded-2xl border border-red-200">
        {err.response?.data?.error ?? t('wallet.load_error', { defaultValue: 'Lỗi tải dữ liệu tài chính. Vui lòng tải lại trang.' })}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <InsufficientBalanceModal
        open={Boolean(balanceError)}
        message={balanceError}
        onClose={() => setBalanceError('')}
        onTopUp={() => {
          setBalanceError('');
          scrollToPaymentSection();
        }}
      />

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t('vendor.finance_portal', { defaultValue: 'Không gian Tài chính & Ví tiền' })}</h2>
          <p className="mt-1 text-slate-500">{t('vendor.finance_desc', { defaultValue: 'Quản lý số dư, kích hoạt gói dịch vụ sạp hàng và kiểm tra doanh số hoạt động.' })}</p>
        </div>
        <button 
          type="button" 
          onClick={exportLedger} 
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 active:scale-[0.98] transition"
        >
          <Download size={17} />
          {t('wallet.export', { defaultValue: 'Xuất sao kê (CSV)' })}
        </button>
      </header>

      {/* SECTION 1: Master Wallet Card & Subscription Widgets */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Wallet balance */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 p-6 text-white shadow-md">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <WalletCards size={180} />
          </div>
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-white/20 p-2"><WalletCards size={24} /></span>
            <span className="text-xs font-black uppercase bg-white/25 px-2.5 py-1 rounded-md tracking-wider">WALLET</span>
          </div>
          <p className="mt-6 text-sm font-bold text-teal-100">{t('vendor.wallet_balance', { defaultValue: 'Số dư ví khả dụng' })}</p>
          <p className="mt-1 text-3xl font-black">{formatCurrency(summary.balance)}</p>
          <div className="mt-6 flex gap-4 text-xs text-teal-100">
            <div>
              <p className="opacity-75">{t('wallet.total_top_up', { defaultValue: 'Tổng nạp' })}</p>
              <p className="font-bold text-white text-sm mt-0.5">{formatCurrency(summary.totalTopUp)}</p>
            </div>
            <div className="border-l border-white/20 pl-4">
              <p className="opacity-75">{t('wallet.total_spent', { defaultValue: 'Tổng chi tiêu' })}</p>
              <p className="font-bold text-white text-sm mt-0.5">{formatCurrency(summary.totalSpent)}</p>
            </div>
          </div>
        </div>

        {/* WebApp subscription rent */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{t('wallet.monthly_rent', { defaultValue: 'Gói phí WebApp' })}</h3>
              {summary.subscriptionStatus === 'ACTIVE' ? (
                <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-bold text-green-700">✓ {t('stall.paid', { defaultValue: 'Đã thanh toán' })}</span>
              ) : (
                <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-bold text-orange-700">{t('stall.unpaid', { defaultValue: 'Chưa thanh toán' })}</span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-500">Phí duy trì sạp hàng trên bản đồ du lịch VietTourAudio.</p>
            <p className="mt-2 text-sm font-bold text-slate-800">
              {t('wallet.next_billing', { defaultValue: 'Hạn thanh toán tiếp theo' })}: {summary.nextBillingDate ? new Date(summary.nextBillingDate).toLocaleDateString() : '-'}
            </p>
          </div>
          
          <button 
            type="button" 
            disabled={busy === 'rent'} 
            onClick={handleSpendWalletForRent} 
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-black text-white hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 transition"
          >
            {busy === 'rent' && <Loader2 size={15} className="animate-spin" />}
            {t('wallet.pay_rent_price', { defaultValue: 'Gia hạn sạp (199,000đ)' })}
          </button>
        </div>

        {/* Premium priority upgrades */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="text-amber-600" size={20} />
                <h3 className="font-bold text-amber-950">{t('wallet.premium_status', { defaultValue: 'Gói sạp ưu tiên Premium' })}</h3>
              </div>
              {summary.isPremium ? (
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-700">★ ACTIVE</span>
              ) : (
                <span className="rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-xs font-bold text-slate-500">NORMAL</span>
              )}
            </div>
            <p className="mt-3 text-sm text-amber-900/80">Kích hoạt bán kính phát âm thanh rộng hơn và nổi bật trên bản đồ.</p>
            <p className="mt-2 text-sm font-bold text-amber-950">
              {t('wallet.premium_price', { defaultValue: 'Đơn giá' })}: {formatCurrency(summary.premiumPrice ?? 599000)} / 30 ngày
            </p>
          </div>

          <button 
            type="button" 
            disabled={busy === 'premium' || summary.isPremium} 
            onClick={handleSpendWalletForPremium} 
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition"
          >
            {busy === 'premium' && <Loader2 size={15} className="animate-spin" />}
            {summary.isPremium ? t('wallet.premium_active', { defaultValue: 'Sạp Premium đã kích hoạt' }) : t('wallet.upgrade_now_price', { defaultValue: 'Nâng cấp Premium (599,000đ)' })}
          </button>
        </div>
      </section>

      {/* SECTION 3: Combined Analytics & Revenue Summary */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">{t('dashboard.charts.visitors_and_listeners', { defaultValue: 'Thống kê lượng truy cập & Lượt nghe' })}</h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
              <TrendingUp size={14} /> Thống kê 7 ngày qua
            </span>
          </div>
          <div className="w-full h-64 min-w-0 min-h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="visitors" stroke="#94A3B8" strokeWidth={3} dot={{ r: 4 }} name="Người dùng truy cập" />
                <Line type="monotone" dataKey="listeners" stroke="#0D9488" strokeWidth={3} dot={{ r: 4 }} name="Lượt phát Audio" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">{t('dashboard.charts.popular_poi', { defaultValue: 'Top điểm tham quan phổ biến' })}</h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
              <Headphones size={14} /> Lượt phát âm thanh
            </span>
          </div>
          <div className="w-full h-64 min-w-0 min-h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={topPoiData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} dx={-10} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="listeners" fill="#0D9488" radius={[4, 4, 0, 0]} name="Lượt nghe" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 2 & 4 Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        
        {/* SECTION 4: Transaction Ledger History Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 p-4 bg-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <History size={18} className="text-slate-500" />
                {t('wallet.transaction_history', { defaultValue: 'Lịch sử tài chính & Biến động số dư' })}
              </h3>
              <div className="flex bg-slate-200/60 rounded-lg p-0.5 text-xs font-bold">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('ledger')}
                  className={`px-3 py-1 rounded-md ${activeTab === 'ledger' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Sao kê ví
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('topup_requests')}
                  className={`px-3 py-1 rounded-md ${activeTab === 'topup_requests' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Yêu cầu nạp
                </button>
              </div>
            </div>

            {activeTab === 'ledger' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px] text-left text-sm">
                  <thead className="bg-slate-50/70 text-xs uppercase text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4">{t('wallet.date', { defaultValue: 'Thời gian' })}</th>
                      <th className="p-4">{t('wallet.category', { defaultValue: 'Phân loại' })}</th>
                      <th className="p-4">{t('wallet.description', { defaultValue: 'Nội dung giao dịch' })}</th>
                      <th className="p-4 text-right">{t('wallet.amount', { defaultValue: 'Số tiền' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition duration-150">
                        <td className="p-4 text-xs text-slate-500">{formatDateTime(tx.createdAt)}</td>
                        <td className="p-4">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">
                            {tx.category ?? tx.type}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium text-xs">{tx.description}</td>
                        <td className={`p-4 text-right font-black text-sm ${tx.direction === 'DEBIT' ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.direction === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                    {!transactions.length && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-xs font-bold text-slate-400">
                          {t('wallet.no_transactions', { defaultValue: 'Chưa có biến động số dư nào.' })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px] text-left text-sm">
                  <thead className="bg-slate-50/70 text-xs uppercase text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4">Thời gian</th>
                      <th className="p-4">Số tiền</th>
                      <th className="p-4">Ghi chú</th>
                      <th className="p-4 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUps.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="p-4 text-xs text-slate-500">{formatDateTime(item.createdAt)}</td>
                        <td className="p-4 font-bold text-slate-700 text-sm">{formatCurrency(item.amount)}</td>
                        <td className="p-4 text-xs text-slate-500 truncate max-w-[150px]">{item.note || '-'}</td>
                        <td className="p-4 text-right">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                            item.status === 'APPROVED' || item.status === 'SUCCESS'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : item.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!topUps.length && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-xs font-bold text-slate-400">
                          Chưa có yêu cầu nạp tiền nào được tạo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: Core VietQR Deposit Flow */}
        <aside className="space-y-6">
          <form ref={topUpFormRef} onSubmit={submitTopUp} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <QrCode className="text-teal-600" />
              <h3 className="font-black text-slate-900">{t('wallet.topup_title', { defaultValue: 'Nạp tiền qua VietQR' })}</h3>
            </div>
            
            <p className="text-xs leading-5 text-slate-500">
              Chuyển khoản chính xác số tiền cần nạp, sau đó chụp ảnh màn hình giao dịch chuyển khoản thành công làm bằng chứng.
            </p>
            
            <div className="flex justify-center rounded-xl bg-slate-50 p-4 border border-slate-100">
              <img src={bankQrUrl} alt="VietQR bank transfer" className="h-44 w-44 object-contain shadow-sm rounded-lg" />
            </div>

            <label className="block text-xs font-bold text-slate-600">
              {t('wallet.transfer_amount', { defaultValue: 'Số tiền chuyển khoản (VND)' })}
              <input 
                type="number" 
                min="10000" 
                required 
                value={topUpAmount} 
                onChange={(e) => setTopUpAmount(e.target.value)} 
                className="mt-1 h-10 w-full rounded-xl border bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition" 
              />
            </label>

            <label className="block text-xs font-bold text-slate-600">
              {t('wallet.transfer_proof', { defaultValue: 'Ảnh biên lai / Hóa đơn thành công' })}
              <span className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 p-4 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-500 transition text-slate-500 font-normal">
                <Upload size={20} className="text-teal-600" />
                <span className="text-xs font-bold text-slate-700 truncate max-w-[280px]">
                  {proof?.name ?? t('wallet.select_proof', { defaultValue: 'Chọn file ảnh biên lai' })}
                </span>
                <span className="text-[10px] text-slate-400">Chấp nhận JPG, PNG, WEBP tối đa 5MB</span>
                <input 
                  type="file" 
                  required 
                  accept="image/jpeg,image/png,image/webp,image/gif" 
                  className="hidden" 
                  onChange={(e) => setProof(e.target.files?.[0] ?? null)} 
                />
              </span>
            </label>

            <label className="block text-xs font-bold text-slate-600">
              {t('wallet.notes', { defaultValue: 'Ghi chú nạp tiền' })}
              <textarea 
                rows={2} 
                value={topUpNote} 
                onChange={(e) => setTopUpNote(e.target.value)} 
                className="mt-1 w-full rounded-xl border bg-slate-50 p-2.5 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition font-normal" 
                placeholder="Ghi mã giao dịch hoặc nội dung chuyển tiền..."
              />
            </label>

            <button 
              type="submit" 
              disabled={busy === 'topup'} 
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 transition"
            >
              {busy === 'topup' && <Loader2 size={16} className="animate-spin" />}
              {t('wallet.submit_topup', { defaultValue: 'Gửi biên nhận xác minh' })}
            </button>
          </form>

          {/* Inline top-up requests checklist */}
          {topUps.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
              <p className="mb-2 font-black text-slate-900 flex items-center gap-1">
                <Coins size={14} className="text-teal-600" />
                Yêu cầu nạp gần đây
              </p>
              <div className="space-y-1.5">
                {topUps.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-t border-slate-100 py-1.5">
                    <span className="font-bold text-slate-700">{formatCurrency(item.amount)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                      item.status === 'APPROVED' || item.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
