import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Copy, Crown, X, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeRealtime } from '../../services/realtimeClient';
import { useTranslation } from 'react-i18next';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../../services/apiClient';
import { getVisitorSessionId } from '../../utils/visitorSession';
import toast from 'react-hot-toast';
import { usePremiumStore } from '../../features/vendor-wallet/stores/premiumStore';
import { premiumAccessApi } from '../../features/payment/premiumAccessApi';

export function CheckoutModal({ open, onClose, onSuccess }) {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const { t: tRoot } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Method selection & gateways state
  const [gateways, setGateways] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('BANK'); // Defaults to BANK/MOMO/VISA
  const [proofFile, setProofFile] = useState(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofStatus, setProofStatus] = useState(''); // '', 'PENDING'
  const [activeTransactionId, setActiveTransactionId] = useState('');
  const [isProcessingVisa, setIsProcessingVisa] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const successTriggeredRef = useRef(false);
  const successCloseTimerRef = useRef(null);
  const paymentSubmissionLockRef = useRef(false);
  const applyServerStatus = usePremiumStore((state) => state.applyServerStatus);

  // Visa card fields
  const [visaName, setVisaName] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [visaExpiry, setVisaExpiry] = useState('');
  const [visaCvv, setVisaCvv] = useState('');

  const guestId = getVisitorSessionId();
  const visitorHeaders = { 'X-Visitor-Session': guestId };
  const transferContent = `VTA PREMIUM USER ${guestId}`;

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    apiClient
      .get('/guest/payment-gateways')
      .then((res) => {
        setGateways(res.data?.data || []);
      })
      .catch((err) => {
        console.error('Failed to load payment gateways:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open]);

  // Clean form state when closing
  useEffect(() => {
    if (!open) {
      setProofFile(null);
      setProofStatus('');
      setActiveTransactionId('');
      successTriggeredRef.current = false;
      paymentSubmissionLockRef.current = false;
      setIsProcessingPayment(false);
      if (successCloseTimerRef.current) {
        window.clearTimeout(successCloseTimerRef.current);
        successCloseTimerRef.current = null;
      }
      setVisaName('');
      setVisaNumber('');
      setVisaExpiry('');
      setVisaCvv('');
    }
  }, [open]);

  const triggerPremiumSuccessSequence = useCallback(async () => {
    if (successTriggeredRef.current) return;
    successTriggeredRef.current = true;
    const premiumStatus = await premiumAccessApi.getStatus();
    applyServerStatus(premiumStatus);
    setProofStatus('APPROVED');
    toast.success(tRoot('payment.approved_toast'));
    successCloseTimerRef.current = window.setTimeout(() => onSuccess?.(premiumStatus), 2400);
  }, [applyServerStatus, onSuccess, tRoot]);

  const handleBuyPass24Hours = async (event) => {
    event?.preventDefault();
    if (paymentSubmissionLockRef.current || isProcessingPayment || loading) return;
    paymentSubmissionLockRef.current = true;
    setIsProcessingPayment(true);
    setLoading(true);
    try {
      const premiumStatus = await premiumAccessApi.unlock24Hours();
      applyServerStatus(premiumStatus);
      toast.success('Tuyệt vời! Tài khoản của bạn đã được nâng cấp lên Premium trong 24h.');
      onSuccess?.(premiumStatus);
    } catch {
      toast.error('Giao dịch thất bại. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setLoading(false);
      setIsProcessingPayment(false);
      paymentSubmissionLockRef.current = false;
    }
  };

  useEffect(() => {
    if (!open || proofStatus !== 'PENDING' || !activeTransactionId) return undefined;

    let disposed = false;
    const handlePaymentUpdate = (targetId, currentStatus) => {
      if (String(targetId).toLowerCase() !== activeTransactionId.toLowerCase()) return;
      if (currentStatus === 'APPROVED') triggerPremiumSuccessSequence();
      if (currentStatus === 'FAILED') {
        setProofStatus('FAILED');
        toast.error(tRoot('payment.rejected_toast'));
      }
    };
    const unsubscribe = subscribeRealtime('ReceivePaymentUpdate', handlePaymentUpdate);

    const pollStatus = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/payment/status/${activeTransactionId}`
        );
        const status = response.data?.data?.status ?? response.data?.status;
        if (status === 'APPROVED') triggerPremiumSuccessSequence();
        if (status === 'FAILED') {
          setProofStatus('FAILED');
          toast.error(tRoot('payment.rejected_toast'));
        }
      } catch (error) {
        if (!disposed) console.debug('Silent payment status poll failed:', error.message);
      }
    };

    void pollStatus();
    const pollingTimer = window.setInterval(pollStatus, 3000);
    return () => {
      disposed = true;
      window.clearInterval(pollingTimer);
      unsubscribe();
    };
  }, [activeTransactionId, open, proofStatus, tRoot, triggerPremiumSuccessSequence]);

  async function handleCopyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const handleProofFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleProofSubmit = async (event) => {
    event?.preventDefault();
    if (paymentSubmissionLockRef.current || isProcessingPayment || isUploadingProof) return;
    if (!proofFile) {
      toast.error(tRoot('payment.proof_required'));
      return;
    }

    paymentSubmissionLockRef.current = true;
    setIsProcessingPayment(true);
    setIsUploadingProof(true);
    try {
      // 1. Initialize payment transaction in database
      const initRes = await axios.post(`${appConfig.paymentApiBaseUrl}/checkout/initialize`, {
        senderId: guestId,
        senderType: 'USER',
        paymentMethod: selectedMethod,
        transactionType: 'USER_PREMIUM'
      }, { headers: visitorHeaders });
      const transactionId = initRes.data?.data?.transaction?.id || initRes.data?.transaction?.id;
      if (!transactionId) {
        throw new Error("Không thể khởi tạo giao dịch.");
      }
      
      // 2. Upload proof receipt image
      const formData = new FormData();
      formData.append('transactionId', transactionId);
      formData.append('proofFile', proofFile);
      
      await axios.post(`${appConfig.paymentApiBaseUrl}/checkout/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...visitorHeaders }
      });
      
      setActiveTransactionId(transactionId);
      setProofStatus('PENDING'); // Chờ Admin Duyệt
      toast.success(tRoot('payment.manual_submission_success'));
    } catch (err) {
      console.error('Upload process aborted error trace:', err);
      toast.error(
        `${tRoot('payment.upload_failed')}: ${
          err.response?.data?.message || err.message || tRoot('common.error')
        }`
      );
    } finally {
      setIsUploadingProof(false);
      setIsProcessingPayment(false);
      paymentSubmissionLockRef.current = false;
    }
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setVisaNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length > 2) {
      setVisaExpiry(`${value.substring(0, 2)}/${value.substring(2)}`);
    } else {
      setVisaExpiry(value);
    }
  };

  const handleVisaSubmit = async (event) => {
    event?.preventDefault();
    if (paymentSubmissionLockRef.current || isProcessingPayment || isProcessingVisa) return;
    if (!visaName || !visaNumber || !visaExpiry || !visaCvv) {
      alert("Vui lòng điền đầy đủ thông tin thẻ Visa!");
      return;
    }

    paymentSubmissionLockRef.current = true;
    setIsProcessingPayment(true);
    setIsProcessingVisa(true);
    try {
      // 1. Initialize payment transaction in database
      const initRes = await axios.post(`${appConfig.paymentApiBaseUrl}/checkout/initialize`, {
        senderId: guestId,
        senderType: 'USER',
        paymentMethod: 'VISA',
        transactionType: 'USER_PREMIUM'
      }, { headers: visitorHeaders });
      const transactionId = initRes.data?.data?.transaction?.id || initRes.data?.transaction?.id;
      if (!transactionId) {
        throw new Error("Không thể khởi tạo giao dịch.");
      }
      
      // 2. Process Visa payment
      await axios.post(`${appConfig.paymentApiBaseUrl}/checkout/visa-process`, {
        transactionId,
        cardholderName: visaName.toUpperCase(),
        cardNumber: visaNumber.replace(/\s+/g, ''),
        expiry: visaExpiry,
        cvv: visaCvv
      }, { headers: visitorHeaders });
      
      onSuccess?.(); // Active Premium locally
    } catch (err) {
      console.error(err);
      alert("Thanh toán thẻ Visa thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessingVisa(false);
      setIsProcessingPayment(false);
      paymentSubmissionLockRef.current = false;
    }
  };

  // Find active gateway configs
  const currentGateway = gateways.find(g => g.gatewayType === selectedMethod) || {
    accountName: selectedMethod === 'BANK' ? 'Techcombank' : 'MoMo E-Wallet',
    accountNumber: selectedMethod === 'BANK' ? '190382910283' : '0912345678',
    qrCodeUrl: selectedMethod === 'BANK' ? '/uploads/bank-qr.png' : '/uploads/bank_qr.png'
  };

  const hostRoot = (import.meta.env.VITE_API_BASE_URL ?? '').replace('/api', '');
  const qrSrc = currentGateway.qrCodeUrl
    ? (currentGateway.qrCodeUrl.startsWith('http') ? currentGateway.qrCodeUrl : `${hostRoot}${currentGateway.qrCodeUrl}`)
    : '';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1600] grid place-items-center px-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-bgAbyss/78 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose()}
            aria-label="Đóng thanh toán Premium"
          />
          <motion.section
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto bg-slate-900 text-white rounded-3xl shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-thin scrollbar-thumb-slate-700 relative text-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <div className="absolute left-0 right-0 top-0 h-32 bg-gradient-to-br from-premiumNeon/70 via-abyssIndigo/70 to-oceanCyan/65" />

            <div className="relative z-10 mx-auto mt-12 grid h-20 w-20 place-items-center rounded-2xl border-4 border-bgSurface bg-bgAbyss shadow-neon-premium">
              <Crown size={40} className="text-premiumNeon" />
            </div>

            <div className="px-6 pb-8 pt-4">
              <h2 id="checkout-title" className="font-display text-2xl font-bold leading-tight text-white">
                {t('openPremium')}
              </h2>
              <p className="mt-1 text-sm font-medium text-textSeafoam">{t('activateAudio')}</p>

              <div className="mb-2 mt-4">
                <span className="bg-gradient-to-r from-premiumNeon to-electricBlue bg-clip-text font-display text-4xl font-bold text-transparent">30.000</span>
                <span className="ml-1 text-sm font-bold text-electricBlue">VND</span>
              </div>

              <button
                type="button"
                onClick={(event) => handleBuyPass24Hours(event)}
                disabled={loading || isProcessingPayment}
                className="mb-5 mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-4 text-sm font-black text-slate-950 shadow-lg transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Crown size={20} />}
                MỞ KHÓA PREMIUM 24H
              </button>

              {/* Segmented Tab Bar Selector */}
              <div className="flex bg-slate-900/60 p-1 rounded-xl gap-1 mb-6 border border-slate-700/50 relative z-10 mx-auto max-w-[340px]">
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={() => setSelectedMethod('BANK')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedMethod === 'BANK'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Ngân hàng
                </button>
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={() => setSelectedMethod('MOMO')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedMethod === 'MOMO'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Ví MoMo
                </button>
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={() => setSelectedMethod('VISA')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedMethod === 'VISA'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Thẻ Visa
                </button>
              </div>

              {/* Dynamic Content Views */}
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-300 py-8">
                  <Loader2 size={32} className="animate-spin text-teal-600" />
                  <span className="text-xs font-semibold">Đang tải cấu hình cổng thanh toán...</span>
                </div>
              ) : selectedMethod === 'BANK' || selectedMethod === 'MOMO' ? (
                <div>
                  <div className="relative p-3 bg-white rounded-2xl shadow-md mx-auto w-48 h-48 flex items-center justify-center mt-4">
                    {qrSrc ? (
                      <img src={qrSrc} alt="Payment QR" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <QRCodeSVG value={transferContent} size={168} level="M" includeMargin={false} />
                    )}
                  </div>

                  <p className="mt-3 text-xs font-medium text-textSeafoam leading-relaxed px-4">
                    Quét mã QR để chuyển khoản trực tiếp qua ứng dụng ví điện tử hoặc ngân hàng.
                  </p>

                  <div className="mt-6 text-left rounded-2xl border border-slate-700 bg-slate-950/80 p-4 shadow-inner">
                    <div className="mb-3 flex items-center justify-between gap-3 text-sm pb-2 border-b border-slate-800">
                      <span className="text-slate-400">
                        {selectedMethod === 'BANK' ? 'Ngân hàng' : 'Ví điện tử'}
                      </span>
                      <span className="text-right font-bold text-white">
                        {currentGateway.accountName}
                      </span>
                    </div>
                    <div className="mb-3 flex items-center justify-between gap-3 text-sm pb-2 border-b border-slate-800">
                      <span className="text-slate-400">
                        {selectedMethod === 'BANK' ? 'Số tài khoản' : 'Số điện thoại'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{currentGateway.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleCopyText(currentGateway.accountNumber);
                            toast.success('Đã sao chép số tài khoản');
                          }}
                          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                        <span>Nội dung chuyển khoản bắt buộc</span>
                        <span className="text-[10px] text-amber-500 font-normal">Chính xác 100%</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="font-mono font-bold text-base text-amber-300">{transferContent}</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleCopyText(transferContent);
                            toast.success('Đã sao chép nội dung chuyển khoản');
                          }}
                          className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 active:scale-[0.98] transition cursor-pointer shadow-md"
                          aria-label="Sao chép nội dung chuyển khoản"
                        >
                          <Copy size={12} />
                          Sao chép
                        </button>
                      </div>
                    </div>
                  </div>

                  {proofStatus === 'APPROVED' ? (
                    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 rounded-2xl border border-amber-300/40 bg-gradient-to-b from-amber-300/15 to-amber-500/5 p-6 text-center shadow-neon-premium">
                      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-300/15 ring-4 ring-amber-300/20">
                        <Crown size={42} className="text-amber-300" />
                      </div>
                      <p className="mt-4 text-lg font-black text-amber-200">{tRoot('payment.approved_title')}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">{tRoot('payment.approved_desc')}</p>
                    </motion.div>
                  ) : proofStatus === 'PENDING' ? (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-6 overflow-hidden rounded-2xl border border-teal-400/30 bg-gradient-to-b from-teal-400/10 to-slate-950/40 p-6 text-center">
                      <div className="relative mx-auto h-24 w-24">
                        <span className="absolute inset-0 animate-ping rounded-full border border-teal-300/30 bg-teal-400/10" />
                        <span className="absolute inset-3 animate-pulse rounded-full border border-teal-300/40" />
                        <span className="absolute inset-7 rounded-full bg-teal-400/20 shadow-[0_0_28px_rgba(45,212,191,0.45)]" />
                        <Loader2 className="absolute inset-0 m-auto animate-spin text-teal-300" size={30} />
                      </div>
                      <p className="mt-4 text-base font-black text-teal-200">{tRoot('payment.waiting_title')}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">{tRoot('payment.waiting_desc')}</p>
                      <p className="mt-3 break-all font-mono text-[10px] text-slate-500">{activeTransactionId}</p>
                    </motion.div>
                  ) : proofStatus === 'FAILED' ? (
                    <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-center">
                      <X className="mx-auto text-red-300" size={30} />
                      <p className="mt-3 font-black text-red-200">{tRoot('payment.rejected_title')}</p>
                      <p className="mt-1 text-xs text-slate-300">{tRoot('payment.rejected_desc')}</p>
                      <button type="button" onClick={() => { setProofStatus(''); setActiveTransactionId(''); }}
                        className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15">
                        {tRoot('payment.try_again')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 text-left">
                        <span className="block text-xs font-semibold text-slate-400 mb-2">
                          Minh chứng thanh toán:
                        </span>
                        <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-slate-600 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white active:scale-[0.98] transition cursor-pointer">
                          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="truncate">{proofFile ? proofFile.name : 'Chọn ảnh biên lai chuyển khoản'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleProofFileSelect} 
                            className="hidden"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => handleProofSubmit(event)}
                        disabled={isUploadingProof || isProcessingPayment}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-premiumNeon to-electricBlue px-4 py-4 text-sm font-bold text-white shadow-neon-premium transition duration-150 ease-out hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        {isUploadingProof ? (
                          <>
                            <Loader2 size={20} className="animate-spin text-white" />
                            Đang gửi giao dịch...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={20} className="text-white" />
                            Xác nhận đã chuyển khoản
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Visa Credit Card Interface */
                <div>
                  <div className="mt-4 rounded-2xl border border-glassBorder bg-white/5 p-4 shadow-glass-inner text-slate-200">
                    <div className="text-left mb-3">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">TÊN CHỦ THẺ</label>
                      <input
                        type="text"
                        placeholder="NGUYEN VAN A"
                        value={visaName}
                        onChange={(e) => setVisaName(e.target.value.toUpperCase())}
                        className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="text-left mb-3">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">SỐ THẺ</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={visaNumber}
                        onChange={handleCardNumberChange}
                        className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 text-left">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">HẠN SỬ DỤNG (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="12/28"
                          value={visaExpiry}
                          onChange={handleExpiryChange}
                          className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                      <div className="w-24 text-left">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="***"
                          maxLength="3"
                          value={visaCvv}
                          onChange={(e) => setVisaCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-center text-white focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {isProcessingVisa && (
                    <div className="mt-4 p-4 rounded-xl border border-teal-500/30 bg-teal-500/10 text-center">
                      <Loader2 className="animate-spin mx-auto text-teal-400 mb-2" size={24} />
                      <p className="text-sm font-bold text-teal-300">Đang xác thực giao dịch thẻ...</p>
                      <p className="text-xs text-slate-300 mt-1">Hệ thống đang kiểm tra bảo mật từ ngân hàng...</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(event) => handleVisaSubmit(event)}
                    disabled={isProcessingVisa || isProcessingPayment}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-premiumNeon to-electricBlue px-4 py-4 text-sm font-bold text-white shadow-neon-premium transition duration-150 ease-out hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessingVisa ? (
                      <>
                        <Loader2 size={20} className="animate-spin text-white" />
                        Đang giao dịch...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} className="text-white" />
                        Thanh toán ngay bằng thẻ Visa
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
