import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Copy, Crown, X, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { appConfig } from '../../config/appConfig';

export function CheckoutModal({ open, onClose, onSuccess }) {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    qrValue: 'VietTourAudio-TestPayment-30000VND',
    bankAccount: '190382910283 (Techcombank)',
    transferContent: 'VTA PREMIUM',
    message: 'Quét mã để thanh toán. Cú pháp: [Số điện thoại của bạn]'
  });

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    axios
      .get(`${appConfig.paymentApiBaseUrl}/premium-qr`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data) {
          setPaymentInfo({
            qrValue: data.qrValue ?? 'VietTourAudio-TestPayment-30000VND',
            bankAccount: data.bankAccount ?? '190382910283 (Techcombank)',
            transferContent: data.transferContent ?? 'VTA PREMIUM',
            message: data.message ?? 'Quét mã để thanh toán. Cú pháp: [Số điện thoại của bạn]'
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load premium QR config:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open]);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(paymentInfo.transferContent);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

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
            onClick={onClose}
            aria-label="Đóng thanh toán Premium"
          />
          <motion.section
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[360px] overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 text-center text-white shadow-2xl shadow-black/45 backdrop-blur-xl tablet:max-w-[480px] pc:max-w-[520px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <div className="absolute left-0 right-0 top-0 h-32 bg-gradient-to-br from-premiumNeon/70 via-abyssIndigo/70 to-oceanCyan/65" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-bgAbyss/35 text-white backdrop-blur-md transition duration-150 ease-out hover:bg-bgAbyss/55 active:scale-[0.98]"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

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

              <div className="relative mx-auto mt-4 flex aspect-square w-full max-w-[200px] items-center justify-center rounded-xl bg-white p-4 shadow-sm">
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-800">
                    <Loader2 size={32} className="animate-spin text-teal-600" />
                    <span className="text-xs font-semibold">Đang tải QR...</span>
                  </div>
                ) : (
                  <QRCodeSVG value={paymentInfo.qrValue} size={168} level="M" includeMargin />
                )}
              </div>

              <p className="mt-3 text-xs font-medium text-textSeafoam leading-relaxed px-4">
                {paymentInfo.message}
              </p>

              <div className="mt-6 rounded-2xl border border-glassBorder bg-white/5 p-4 shadow-glass-inner">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-textSeafoam">{t('bank')}</span>
                  <span className="text-right font-bold text-textCrisp">{paymentInfo.bankAccount}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-textSeafoam">{t('transferContent')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-oceanCyan">{paymentInfo.transferContent}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="rounded-full border border-glassBorder bg-white/5 p-1.5 text-textSeafoam shadow-glass-inner transition duration-150 ease-out hover:border-electricBlue/40 hover:text-oceanCyan active:scale-[0.98]"
                      aria-label="Sao chép nội dung chuyển khoản"
                    >
                      {copied ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onSuccess}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-premiumNeon to-electricBlue px-4 py-4 text-sm font-bold text-white shadow-neon-premium transition duration-150 ease-out hover:brightness-110 active:scale-[0.98]"
              >
                <CheckCircle2 size={20} className="text-white" />
                {t('paid')}
              </button>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}

