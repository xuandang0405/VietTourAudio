import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Crown, X, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useTranslation } from '../../i18n/translations';

const TEST_PAYMENT_VALUE = 'VietTourAudio-TestPayment-30000VND';
const BANK_ACCOUNT = '190382910283 (Techcombank)';
const TRANSFER_CONTENT = 'VTA PREMIUM';

export function CheckoutModal({ open, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(TRANSFER_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[1600] grid place-items-center px-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-[360px] overflow-hidden rounded-[2.5rem] bg-white text-center shadow-2xl"
          >
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-premium-400 to-premium-600" />
            
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/40 active:scale-95"
            >
              <X size={18} />
            </button>
            
            <div className="relative z-10 mx-auto mt-12 grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-xl shadow-premium-900/20 border-4 border-white">
              <Crown size={40} className="text-premium-500" />
            </div>

            <div className="px-6 pb-8 pt-4">
              <h2 className="text-2xl font-black leading-tight text-slate-900">{t('openPremium')}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">{t('activateAudio')}</p>
              
              <div className="mt-4 mb-2">
                <span className="text-4xl font-extrabold text-premium-600">30.000</span>
                <span className="text-sm font-bold text-premium-600 ml-1">VND</span>
              </div>

              <div className="mx-auto mt-4 w-max rounded-3xl border border-slate-100 bg-white p-3 shadow-md">
                <QRCodeSVG value={TEST_PAYMENT_VALUE} size={180} level="M" includeMargin />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-500">{t('bank')}</span>
                  <span className="font-bold text-slate-900">{BANK_ACCOUNT}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">{t('transferContent')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-premium-600">{TRANSFER_CONTENT}</span>
                    <button onClick={handleCopy} className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-200 text-slate-600 active:scale-95">
                      {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onSuccess}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition duration-300 hover:bg-black active:scale-[0.98]"
              >
                <CheckCircle2 size={20} className="text-premium-400" />
                {t('paid')}
              </button>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
