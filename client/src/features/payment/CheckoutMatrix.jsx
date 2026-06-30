import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, CheckCircle2, Copy, CreditCard, Crown, Loader2, Radio, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { resolveBackendMediaUrl } from '../../utils/mediaUrl';
import { paymentApi } from './paymentApi';
import { subscribeRealtime } from '../../services/realtimeClient';

const methods = [
  { id: 'MOMO', icon: Smartphone, key: 'payment.momo' },
  { id: 'BANK', icon: Building2, key: 'payment.bank' },
  { id: 'VISA', icon: CreditCard, key: 'payment.visa' }
];

export function CheckoutMatrix({ senderId, senderType, transactionType, amount, onSuccess, onSuccessClose }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState('MOMO');
  const [configs, setConfigs] = useState([]);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [checkout, setCheckout] = useState(null);
  const [busy, setBusy] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [proof, setProof] = useState(null);
  const [viewMode, setViewMode] = useState('CHECKOUT');
  const [activeTransactionId, setActiveTransactionId] = useState('');
  const [qrFailed, setQrFailed] = useState(false);
  const [card, setCard] = useState({ cardholderName: '', cardNumber: '', expiry: '', cvv: '' });
  const successTriggeredRef = useRef(false);

  const triggerVendorSuccessCelebration = useCallback(() => {
    if (successTriggeredRef.current) return;
    successTriggeredRef.current = true;
    setViewMode('SUCCESS');
    onSuccess?.();
    toast.success(t('vendor_payment.success_toast', {
      defaultValue: 'Kích hoạt gói Vendor thành công!'
    }));
  }, [onSuccess, t]);

  useEffect(() => {
    let active = true;
    setConfigsLoading(true);
    paymentApi.getPublicGateways()
      .then((data) => {
        if (!active) return;
        const activeConfigs = Array.isArray(data) ? data : [];
        setConfigs(activeConfigs);
        if (activeConfigs.length && !activeConfigs.some((item) => item.gatewayType === method)) {
          setMethod(activeConfigs[0].gatewayType);
        }
      })
      .catch(() => toast.error(t('payment.gateway_load_error')))
      .finally(() => { if (active) setConfigsLoading(false); });
    return () => { active = false; };
  }, [t]);

  function selectPaymentMethod(nextMethod) {
    if (isProcessingPayment || busy) return;
    setMethod(nextMethod);
    setCheckout(null);
    setViewMode('CHECKOUT');
    setActiveTransactionId('');
    successTriggeredRef.current = false;
    setQrFailed(false);
  }

  async function handleInitializeCheckout(event) {
    event?.preventDefault();
    if (isProcessingPayment || busy) return;
    if (!senderId || configsLoading || !configs.some((config) => config.gatewayType === method)) {
      toast.error(t('payment.method_unavailable'));
      return;
    }

    setIsProcessingPayment(true);
    const loadingToast = toast.loading(
      t('payment.initializing', { defaultValue: 'Đang khởi tạo giao dịch...' })
    );
    try {
      const data = await paymentApi.initialize({
        senderId: String(senderId),
        senderType,
        paymentMethod: method,
        transactionType,
        amount: amount ? Number(amount) : undefined
      });
      setCheckout(data);
      setViewMode('CHECKOUT');
      setActiveTransactionId('');
      successTriggeredRef.current = false;
      setQrFailed(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ??
          t('common.error', { defaultValue: 'Không thể khởi tạo giao dịch.' })
      );
    } finally {
      toast.dismiss(loadingToast);
      setIsProcessingPayment(false);
    }
  }

  useEffect(() => {
    if (senderType !== 'VENDOR' || viewMode !== 'WAITING_APPROVAL' || !activeTransactionId) {
      return undefined;
    }

    let disposed = false;
    const handlePaymentUpdate = (targetId, currentStatus) => {
      if (String(targetId).toLowerCase() !== activeTransactionId.toLowerCase()) return;
      if (String(currentStatus).toUpperCase() === 'APPROVED') {
        triggerVendorSuccessCelebration();
      }
      if (String(currentStatus).toUpperCase() === 'FAILED') {
        setViewMode('CHECKOUT');
        toast.error(t('vendor_payment.rejected', {
          defaultValue: 'Giao dịch chưa được phê duyệt. Vui lòng kiểm tra lại minh chứng.'
        }));
      }
    };

    const unsubscribe = subscribeRealtime('ReceivePaymentUpdate', handlePaymentUpdate);

    const pollStatus = async () => {
      try {
        const data = await paymentApi.getStatus(activeTransactionId);
        const status = String(data?.status ?? data?.data?.status ?? '').toUpperCase();
        if (status === 'APPROVED') triggerVendorSuccessCelebration();
        if (status === 'FAILED') handlePaymentUpdate(activeTransactionId, status);
      } catch (error) {
        if (!disposed) console.debug('Vendor status check poll slipped:', error.message);
      }
    };

    void pollStatus();
    const vendorPollTimer = window.setInterval(pollStatus, 3000);
    return () => {
      disposed = true;
      window.clearInterval(vendorPollTimer);
      unsubscribe();
    };
  }, [activeTransactionId, senderType, t, triggerVendorSuccessCelebration, viewMode]);

  async function copyMemo() {
    try {
      await navigator.clipboard.writeText(checkout?.transaction?.transferMemo ?? '');
      toast.success(t('payment.memo_copied'));
    } catch {
      toast.error(t('payment.copy_failed'));
    }
  }

  async function submitProof() {
    if (busy || isProcessingPayment) return;
    if (!proof) return toast.error(t('payment.proof_required'));
    setBusy(true);
    try {
      await paymentApi.uploadProof(checkout.transaction.id, proof);
      setActiveTransactionId(String(checkout.transaction.id));
      setViewMode('WAITING_APPROVAL');
      toast.success(t('payment.manual_submission_success'));
    } catch (error) {
      toast.error(error.response?.data?.message ?? t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  async function submitVisa(event) {
    event.preventDefault();
    if (busy || isProcessingPayment) return;
    setBusy(true);
    try {
      await paymentApi.processVisa({ transactionId: checkout.transaction.id, ...card });
      if (senderType === 'VENDOR') triggerVendorSuccessCelebration();
      else {
        toast.success(t('payment.success'));
        onSuccess?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.message ?? t('payment.card_failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 md:p-7">
      {viewMode === 'WAITING_APPROVAL' && (
        <div className="grid min-h-[500px] place-items-center overflow-hidden rounded-3xl bg-slate-950 p-6 text-center text-white">
          <div className="relative z-10 max-w-xl">
            <div className="relative mx-auto h-36 w-36">
              <div className="absolute inset-0 animate-ping rounded-full border border-teal-400/30" />
              <div className="absolute inset-3 animate-pulse rounded-full bg-teal-400/10 shadow-[0_0_60px_rgba(45,212,191,0.35)]" />
              <div className="absolute inset-6 animate-spin rounded-full border-4 border-transparent border-r-teal-300 border-t-teal-400" />
              <div className="absolute inset-0 grid place-items-center">
                <Radio size={38} className="text-teal-300" />
              </div>
            </div>
            <h2 className="mt-8 text-2xl font-black">
              {t('vendor_payment.waiting_title', {
                defaultValue: 'Đang xác thực giao dịch gia hạn...'
              })}
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              {t('vendor_payment.waiting_desc', {
                defaultValue: 'Hệ thống đang kiểm tra minh chứng chuyển khoản từ Đối tác. Vui lòng giữ nguyên màn hình, tính năng sạp hàng/Premium sẽ tự động kích hoạt ngay khi hoàn tất đối soát.'
              })}
            </p>
            <p className="mt-5 font-mono text-xs text-teal-300/80">
              {t('vendor_payment.transaction_id', { defaultValue: 'Mã giao dịch' })}: {activeTransactionId}
            </p>
          </div>
        </div>
      )}

      {viewMode === 'SUCCESS' && (
        <div className="grid min-h-[500px] place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950 to-slate-950 p-6 text-center text-white">
          <div className="max-w-xl">
            <div className="mx-auto grid h-28 w-28 scale-110 place-items-center rounded-full bg-amber-300/20 text-amber-300 shadow-[0_0_70px_rgba(251,191,36,0.45)] ring-4 ring-amber-300/30 transition-all duration-500">
              <Crown size={54} />
            </div>
            <CheckCircle2 size={34} className="mx-auto mt-6 text-emerald-400" />
            <h2 className="mt-4 text-3xl font-black font-sans tracking-tight">
              {transactionType === 'VENDOR_TOPUP' 
                ? 'Nạp tiền thành công!' 
                : t('vendor_payment.success_title', { defaultValue: 'Kích hoạt thành công!' })}
            </h2>
            <p className="mt-4 text-slate-200 text-sm leading-relaxed font-sans font-medium">
              {transactionType === 'VENDOR_TOPUP'
                ? 'Số tiền nạp đã được cộng vào số dư ví của bạn thành công.'
                : t('vendor_payment.success_desc', {
                    defaultValue: 'Gói dịch vụ đã được kích hoạt. Quyền quản lý sạp mở rộng đã sẵn sàng.'
                  })}
            </p>
            <button
              type="button"
              onClick={() => onSuccessClose?.()}
              className="mt-8 rounded-2xl bg-amber-300 px-6 py-3 font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:scale-105 hover:bg-amber-200"
            >
              {t('vendor_payment.start_now', { defaultValue: 'Bắt đầu trải nghiệm ngay' })}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'CHECKOUT' && <>
      <h2 className="text-sm font-bold text-slate-950">{t('payment.select_method', { defaultValue: 'Chọn phương thức thanh toán' })}</h2>
      {configsLoading && <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500"><Loader2 className="animate-spin" size={16} />{t('payment.loading_gateways', { defaultValue: 'Đang tải cổng...' })}</div>}
      <div className="mt-4 grid gap-2 grid-cols-3">
        {methods.map(({ id, icon: Icon, key }) => {
          const available = configs.some((config) => config.gatewayType === id);
          return (
            <button key={id} type="button" disabled={isProcessingPayment || busy} onClick={() => available ? selectPaymentMethod(id) : toast.error(t('payment.method_unavailable', { defaultValue: 'Cổng thanh toán tạm khóa' }))}
              className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition ${method === id && available ? 'border-teal-500 bg-teal-50/50 text-teal-700 ring-2 ring-teal-100' : available ? 'border-slate-200 text-slate-600 hover:border-teal-200' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
              <Icon size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider">{t(key, { defaultValue: id === 'MOMO' ? 'Momo' : id === 'BANK' ? 'Bank' : 'Visa' })}</span>
              {!available && <span className="absolute -top-1.5 -right-1 rounded-full bg-slate-200 px-1 py-0.5 text-[8px] font-black uppercase text-slate-500 scale-90">{t('payment.inactive', { defaultValue: 'Tắt' })}</span>}
            </button>
          );
        })}
      </div>
      {!configsLoading && configs.length === 0 && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">{t('payment.no_gateways', { defaultValue: 'Chưa có cấu hình cổng.' })}</div>}

      {!checkout && !configsLoading && configs.length > 0 && (
        <button
          type="button"
          disabled={isProcessingPayment || busy}
          onClick={(event) => handleInitializeCheckout(event)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-white transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isProcessingPayment && <Loader2 className="animate-spin" size={14} />}
          {isProcessingPayment
            ? t('payment.processing', { defaultValue: 'Đang xử lý...' })
            : t('payment.start', { defaultValue: 'BẮT ĐẦU GIAO DỊCH' })}
        </button>
      )}

      {checkout && method !== 'VISA' && (
        <div className="mt-5 space-y-4">
          <div className="flex justify-center border border-slate-100 rounded-xl bg-slate-50 p-3">
            {checkout.gateway.qrCodeUrl && !qrFailed
              ? <img className="max-h-40 object-contain shadow-sm rounded-lg" src={resolveBackendMediaUrl(checkout.gateway.qrCodeUrl)} alt={t(`payment.${method.toLowerCase()}`)} onError={() => setQrFailed(true)} />
              : <div className="text-center text-slate-400 py-4"><Smartphone size={40} className="mx-auto" /><p className="mt-2 text-[10px] font-bold">{t('payment.qr_unavailable', { defaultValue: 'Không có QR' })}</p></div>}
          </div>
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Info label={t('payment.account_name', { defaultValue: 'Tên tài khoản' })} value={checkout.gateway.accountName} />
              <Info label={t('payment.account_number', { defaultValue: 'Số tài khoản' })} value={checkout.gateway.accountNumber} />
            </div>
            
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <p className="text-[10px] font-black uppercase text-amber-700">{t('payment.memo', { defaultValue: 'Nội dung chuyển khoản' })}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="break-all font-mono text-xs font-black text-slate-950 bg-white border px-1.5 py-0.5 rounded">{checkout.transaction.transferMemo}</code>
                <button type="button" onClick={() => copyMemo()} className="rounded-lg bg-teal-50 hover:bg-teal-100 p-1.5 text-teal-700 transition"><Copy size={14} /></button>
              </div>
              <p className="mt-1.5 text-[9px] text-amber-800 leading-normal font-medium">{t('payment.memo_warning', { defaultValue: 'Ghi chính xác nội dung trên để hệ thống tự động ghi nhận.' })}</p>
            </div>
            
            <div className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2 border text-xs">
              <span className="text-slate-500 font-bold">Số tiền:</span>
              <span className="font-black text-teal-700 text-sm">{Number(checkout.transaction.amount).toLocaleString()} VND</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500">Tải ảnh hóa đơn / Biên lai:</span>
              <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium" />
            </div>

            <button type="button" disabled={busy || isProcessingPayment} onClick={() => submitProof()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60 hover:bg-teal-700 transition">
              {busy ? <Loader2 className="animate-spin" size={14} /> : null}
              {t('payment.submit_transaction', { defaultValue: 'Gửi biên nhận xác minh' })}
            </button>
          </div>
        </div>
      )}

      {checkout && method === 'VISA' && (
        <form onSubmit={(event) => submitVisa(event)} className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-xs">
          <label className="font-bold text-slate-700">{t('payment.cardholder_name', { defaultValue: 'Tên chủ thẻ' })}
            <input required value={card.cardholderName}
              onChange={(e) => setCard({ ...card, cardholderName: e.target.value.toUpperCase() })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold uppercase outline-none focus:border-teal-500" placeholder={t('payment.cardholder_placeholder', { defaultValue: 'NGUYEN VAN A' })} />
          </label>
          <label className="font-bold text-slate-700">{t('payment.visa_card_no', { defaultValue: 'Số thẻ Visa' })}
            <input required inputMode="numeric" maxLength={23} value={card.cardNumber}
              onChange={(e) => setCard({ ...card, cardNumber: e.target.value.replace(/[^\d ]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ') })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-teal-500" placeholder="4111 1111 1111 1111" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="font-bold text-slate-700">{t('payment.visa_expiry', { defaultValue: 'Hạn dùng' })}
              <input required maxLength={5} value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-teal-500" placeholder="MM/YY" />
            </label>
            <label className="font-bold text-slate-700">{t('payment.visa_cvv', { defaultValue: 'CVV' })}
              <input required type="password" inputMode="numeric" maxLength={4} value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-teal-500" placeholder="•••" />
            </label>
          </div>
          <button type="submit" disabled={busy || isProcessingPayment} className="mt-2 flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 font-black text-white hover:bg-slate-800 transition">
            {busy && <Loader2 className="animate-spin" size={14} />}{t('payment.visa_submit', { defaultValue: 'Thanh toán ngay' })}
          </button>
        </form>
      )}
      {busy && method === 'VISA' && checkout && (
        <div className="absolute inset-0 z-20 grid place-items-center rounded-3xl bg-slate-950/80 p-6 text-center text-white backdrop-blur-sm">
          <div><div className="mx-auto grid h-16 w-16 animate-pulse place-items-center rounded-full bg-teal-500/20 ring-4 ring-teal-400/30"><CreditCard size={28} className="text-teal-300" /></div><p className="mt-4 text-sm font-black">{t('payment.secure_processing', { defaultValue: 'Đang xử lý thẻ...' })}</p><p className="mt-1 text-[10px] text-slate-300">{t('payment.secure_processing_desc', { defaultValue: 'Vui lòng không đóng trình duyệt.' })}</p></div>
        </div>
      )}
      </>}
    </section>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-black text-slate-900">{value || '—'}</p></div>;
}
