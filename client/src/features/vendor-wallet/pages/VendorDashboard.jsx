import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CreditCard, Headphones, Loader2, MapPin, QrCode, TrendingUp, Copy, CheckCircle2, Download } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../../admin/utils/formatters';
import { useVendorDashboard, useVendorStall, useVendorStallQr } from '../../../vendor/api/vendorQueries';
import { paySubscriptionFromWallet } from '../../../vendor/api/vendorApi';
import { QRCodeCanvas } from 'qrcode.react';
import { appConfig } from '../../../config/appConfig';
import { InsufficientBalanceModal } from '../components/InsufficientBalanceModal';

export function VendorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useVendorDashboard();
  const subscription = {
    planName: data?.vendor?.subscriptionPlan ?? '',
    nextBillingDate: data?.vendor?.nextBillingDate ?? '',
    paymentStatus: data?.vendor?.paymentStatus ?? 'unpaid'
  };
  const [isPayingSubscription, setIsPayingSubscription] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);
  const [balanceError, setBalanceError] = useState('');
  const { data: qrData } = useVendorStallQr();

  const dailyData = (data?.daily ?? []).map((row) => ({
    name: formatDate(row.date),
    listeners: row.audioPlays,
    visitors: row.visitors,
    revenue: Number(row.revenue ?? 0)
  }));
  const topPoiData = (data?.topPois ?? []).map((poi) => ({
    name: poi.name,
    listeners: poi.audioPlays,
    visits: poi.visits
  }));

  async function handleSubscriptionPayment() {
    setPaySuccess(false);
    setIsPayingSubscription(true);
    try {
      await paySubscriptionFromWallet();
      toast.success('Thanh toán gia hạn thành công!');
      setPaySuccess(true);
      setTimeout(() => setPaySuccess(false), 3000);
      await refetch();
    } catch (requestError) {
      const payload = requestError.response?.data;
      console.warn('[PAYMENT EXCEPTION CAUGHT]:', payload);
      if (payload?.errorCode === 'INSUFFICIENT_BALANCE') {
        setBalanceError(payload.message || 'Ví của bạn không đủ tiền!');
        toast.error(payload.message || 'Ví của bạn không đủ tiền!');
      } else {
        toast.error(payload?.message || 'Hệ thống thanh toán bận, vui lòng thử lại sau.');
      }
    } finally {
      setIsPayingSubscription(false);
    }
  }

  if (isLoading) {
    return <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">{t('stall.loading_dashboard')}</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-700">{error.response?.data?.error ?? t('stall.error_load_dashboard')}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <InsufficientBalanceModal
        open={Boolean(balanceError)}
        message={balanceError}
        onClose={() => setBalanceError('')}
        onTopUp={() => {
          setBalanceError('');
          navigate('/vendor/finance');
        }}
      />
      {/* Subscription Banner */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t('stall.rent_banner')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">
                  {t('stall.plan', { name: subscription.planName })}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-sm font-semibold text-slate-500">
                  {t('stall.next_billing', { date: subscription.nextBillingDate })}
                </span>
                <span className="text-slate-300">•</span>
                {subscription.paymentStatus === 'paid' ? (
                  <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-bold text-green-700">✓ {t('stall.paid')}</span>
                ) : (
                  <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-bold text-orange-700">{t('stall.unpaid')}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {paySuccess && (
              <span className="text-sm font-bold text-green-600 animate-pulse">✓ {t('stall.pay_success')}</span>
            )}
            <button
              type="button"
              onClick={handleSubscriptionPayment}
              disabled={isPayingSubscription || subscription.paymentStatus === 'paid'}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isPayingSubscription ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('stall.processing')}
                </>
              ) : subscription.paymentStatus === 'paid' ? (
                `✓ ${t('stall.paid')}`
              ) : (
                t('wallet.pay_rent')
              )}
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Card */}
      {(() => {
        const zoneCode = qrData?.zoneCode;
        const qrUrl = zoneCode
          ? `${import.meta.env.VITE_GUEST_APP_URL || appConfig.publicAppUrl || window.location.origin}/zone/${zoneCode}`
          : null;

        function handleCopyQrCode() {
          if (zoneCode) {
            navigator.clipboard.writeText(zoneCode);
            setCopiedQr(true);
            setTimeout(() => setCopiedQr(false), 2000);
          }
        }

        function downloadVendorQr() {
          const canvas = document.getElementById('vendor-stall-qr-canvas');
          if (!canvas) return;
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `stall-qr-${zoneCode ?? 'code'}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        return (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <QrCode size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{t('vendor.stall_qr_title')}</p>
                <p className="text-xs font-semibold text-slate-500">{t('vendor.stall_qr_desc')}</p>
              </div>
            </div>

            {zoneCode ? (
              <div className="flex flex-col items-center gap-4">
                {/* Zone Code Text */}
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">{t('vendor.zone_code')}</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1 select-all tracking-widest">
                    {zoneCode}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopyQrCode}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                  >
                    {copiedQr ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copiedQr ? t('vendor.copied') : t('vendor.copy_code')}
                  </button>
                </div>

                {/* QR Code Image */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <QRCodeCanvas
                    id="vendor-stall-qr-canvas"
                    value={qrUrl}
                    size={180}
                    level="M"
                    includeMargin
                  />
                </div>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={downloadVendorQr}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  <Download size={16} />
                  {t('vendor.download_qr')}
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-semibold text-slate-500">
                  {t('vendor.qr_not_configured')}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">{t('sidebar.dashboard')}</h2>
        <p className="text-slate-500 mt-1">{t('vendor.dashboard_desc', 'Tổng quan hoạt động của {{name}}.', { name: data?.vendor?.businessName ?? t('common.vendor', 'vendor') })}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          icon={<MapPin />}
          label={t('stall.visitors_today')}
          value={String(data?.metrics?.totalVisits ?? 0)}
          trend={t('stall.total', { count: data?.metrics?.totalUniqueVisitors ?? 0 })}
        />
        <KPICard
          icon={<Headphones />}
          label={t('stall.audio_today')}
          value={String(data?.metrics?.totalAudioPlays ?? 0)}
          trend={t('stall.premium_conversions', { count: data?.metrics?.totalPremiumConversions ?? 0 })}
          color="text-teal-600"
          bg="bg-teal-50"
        />
        <KPICard
          icon={<QrCode />}
          label={t('stall.qr_today')}
          value={String(data?.metrics?.totalQrScans ?? 0)}
          trend={t('stall.total', { count: data?.metrics?.totalQrScans ?? 0 })}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <KPICard
          icon={<TrendingUp />}
          label={t('stall.revenue')}
          value={formatCurrency(data?.metrics?.totalRevenue ?? 0)}
          trend={data?.vendor?.subscriptionPlan ?? subscription.planName}
          color="text-green-600"
          bg="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">{t('dashboard.charts.visitors_and_listeners')}</h3>
          <div className="w-full h-72 min-w-0 min-h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="visitors" stroke="#94A3B8" strokeWidth={3} dot={{ r: 4 }} name={t('dashboard.charts.visitors')} />
                <Line type="monotone" dataKey="listeners" stroke="#0D9488" strokeWidth={3} dot={{ r: 4 }} name={t('dashboard.charts.audio_plays')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">{t('dashboard.charts.popular_poi')}</h3>
          <div className="w-full h-72 min-w-0 min-h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={topPoiData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="listeners" fill="#0D9488" radius={[4, 4, 0, 0]} name={t('dashboard.charts.plays')} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, trend, color = "text-slate-600", bg = "bg-slate-50" }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">{trend}</span>
      </div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}
