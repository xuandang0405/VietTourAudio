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
  User,
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
import { paySubscriptionFromWallet, requestPremiumUpgrade } from '../../vendor/api/vendorApi';
import { InsufficientBalanceModal } from '../../features/vendor-wallet/components/InsufficientBalanceModal';
import { useVendorAuthStore } from '../../vendor/store/vendorAuthStore';
import { CheckoutMatrix } from '../../features/payment/CheckoutMatrix';

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

  // Vendor Auth session
  const user = useVendorAuthStore((state) => state.user);
  const senderId = user?.vendorId ?? user?.id;
  const [topUpAmount, setTopUpAmount] = useState('200000');

  // States
  const [busy, setBusy] = useState('');
  const [balanceError, setBalanceError] = useState('');
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'topup_requests'

  const topUpFormRef = useRef(null);

  const getRemainingTimeText = (expiryDate) => {
    if (!expiryDate) return '';
    const diff = new Date(expiryDate).getTime() - Date.now();
    if (diff <= 0) return 'Đã hết hạn';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `Còn ${days} ngày`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `Còn ${hours} giờ`;
  };

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

      {summary.subscriptionStatus === 'EXPIRED' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-3">
          <AlertTriangle className="text-red-600 shrink-0" size={20} />
          <div>
            Tài khoản sạp hàng của bạn đã tạm thời bị khóa do hết hạn thanh toán phí duy trì WebApp. Vui lòng thanh toán gia hạn phí thuê sạp để tiếp tục sử dụng dịch vụ.
          </div>
        </div>
      )}

      {/* Header & Dynamic Premium Status Badge */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 font-sans tracking-tight">{t('vendor.finance_portal', { defaultValue: 'Không gian Tài chính & Ví tiền' })}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('vendor.finance_desc', { defaultValue: 'Quản lý số dư, kích hoạt gói dịch vụ sạp hàng và kiểm tra doanh số hoạt động.' })}</p>
          </div>
          
          {summary.isPremium ? (
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2 rounded-full shadow-lg shadow-orange-500/20 border border-orange-400">
              <Crown className="w-4 h-4 animate-pulse" />
              <span className="font-bold text-xs tracking-wide font-sans antialiased">
                TÀI KHOẢN PREMIUM
              </span>
              <span className="text-xs opacity-90 border-l border-white/30 pl-3 ml-1 font-medium font-sans">
                Hết hạn: {summary.premiumExpiryDate ? `${new Date(summary.premiumExpiryDate).toLocaleDateString('vi-VN')} (${getRemainingTimeText(summary.premiumExpiryDate)})` : 'N/A'}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 bg-slate-100 text-slate-600 px-5 py-2 rounded-full border border-slate-200">
              <User className="w-4 h-4" />
              <span className="font-semibold text-xs tracking-wide font-sans antialiased">
                Tài khoản Tiêu chuẩn
              </span>
              <span className="text-xs text-slate-400 border-l border-slate-300 pl-3 ml-1 font-medium font-sans">
                Hãy nâng cấp để mở khóa sạp hàng VIP
              </span>
            </div>
          )}
        </div>
        <button 
          type="button" 
          onClick={exportLedger} 
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 active:scale-[0.98] transition self-start"
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
            <p className="mt-2 text-xs font-bold text-slate-800">
              {t('wallet.next_billing', { defaultValue: 'Hạn thanh toán tiếp theo' })}: {summary.nextBillingDate ? `${new Date(summary.nextBillingDate).toLocaleDateString()} (${getRemainingTimeText(summary.nextBillingDate)})` : '-'}
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
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-black rounded-2xl p-6 text-center shadow-md border border-slate-800 flex flex-col justify-between font-sans antialiased text-white">
          <div className="flex flex-col items-center w-full">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-600/20 flex items-center justify-center mb-4 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Crown className="w-8 h-8 text-amber-500 animate-pulse" strokeWidth={2} />
            </div>

            <h3 className="text-lg font-black text-white tracking-tight mb-2">
              {summary.isPremium ? "Đang sử dụng Premium" : "Nâng cấp Premium"}
            </h3>
            
            <p className="text-slate-400 text-xs leading-relaxed mb-4 font-medium px-2">
              {summary.isPremium 
                ? "Gói dịch vụ đã được kích hoạt. Quyền quản lý sạp mở rộng đã sẵn sàng hoạt động trên hệ thống." 
                : "Mở khóa toàn bộ tính năng thu hút khách hàng và phạm vi phát audio tự động lên 10m."}
            </p>

            <div className="text-xs font-bold text-amber-400 mb-2">
              {summary.isPremium ? (
                <>Hết hạn: {summary.premiumExpiryDate ? `${new Date(summary.premiumExpiryDate).toLocaleDateString('vi-VN')} (${getRemainingTimeText(summary.premiumExpiryDate)})` : '-'}</>
              ) : (
                <>Đơn giá: {formatCurrency(summary.premiumPrice ?? 599000)} / 30 ngày</>
              )}
            </div>
          </div>

          <button 
            type="button" 
            disabled={busy === 'premium' || summary.isPremium} 
            onClick={handleSpendWalletForPremium} 
            className="w-full mt-4 font-bold text-xs tracking-wide bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:border disabled:border-slate-700"
          >
            {busy === 'premium' && <Loader2 size={12} className="animate-spin mr-1 inline-block" />}
            {summary.isPremium ? "TÀI KHOẢN ĐÃ LÀ PREMIUM" : "MUA PREMIUM BẰNG VÍ"}
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

        {/* SECTION 2: Unified Checkout Matrix (Momo, Bank, Visa) */}
        <aside className="space-y-6" ref={topUpFormRef}>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <QrCode className="text-teal-600" />
              <h3 className="font-black text-slate-900">Nạp tiền vào ví</h3>
            </div>
            
            <p className="text-xs leading-5 text-slate-500 font-normal text-slate-400">
              Nhập số tiền muốn nạp vào ví sạp hàng dưới đây, sau đó chuyển khoản qua cổng Momo, Ngân hàng hoặc Visa của Admin.
            </p>

            <label className="block text-xs font-bold text-slate-600">
              Số tiền muốn nạp (VND)
              <input 
                type="number" 
                min="10000" 
                required 
                value={topUpAmount} 
                onChange={(e) => setTopUpAmount(e.target.value)} 
                className="mt-1 h-10 w-full rounded-xl border bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition" 
              />
            </label>

            <div className="border-t border-slate-100 pt-4">
              <CheckoutMatrix
                senderId={senderId}
                senderType="VENDOR"
                transactionType="VENDOR_TOPUP"
                amount={topUpAmount}
                onSuccess={() => {
                  refetchRevenue();
                  refetchDashboard();
                }}
                onSuccessClose={() => {
                  refetchRevenue();
                  refetchDashboard();
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
