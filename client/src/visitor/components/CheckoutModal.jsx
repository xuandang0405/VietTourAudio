import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const TEST_PAYMENT_VALUE = 'VietTourAudio-TestPayment-30000VND';

export function CheckoutModal({ open, onClose, onSuccess }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[1600] grid place-items-center px-5">
          <motion.button
            type="button"
            aria-label="Đóng thanh toán"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            data-testid="checkout-modal"
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-[340px] rounded-[2rem] bg-white p-5 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition duration-200 ease-out hover:bg-slate-200 active:scale-95"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-orange-100 text-orange-500">
              <Sparkles size={27} />
            </div>
            <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950">Mở khóa Toàn bộ Audio (24 Giờ)</h2>
            <p className="mt-2 text-3xl font-black text-teal-700">30.000 VNĐ</p>
            <div className="mx-auto mt-5 w-max rounded-3xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-900/10">
              <QRCodeSVG value={TEST_PAYMENT_VALUE} size={200} level="M" includeMargin />
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              Quét QR test hoặc bấm nút mô phỏng bên dưới để mở Premium trên thiết bị này.
            </p>
            <button
              type="button"
              data-testid="simulate-payment"
              onClick={onSuccess}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/20 transition duration-200 ease-out hover:bg-teal-800 active:scale-95"
            >
              <CheckCircle2 size={18} />
              Giả lập Thanh toán Thành công
            </button>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
