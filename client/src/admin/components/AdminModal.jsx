import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function AdminModal({ open, title, description, confirmLabel = 'Xác nhận', tone = 'blue', onClose, onConfirm, children, size = 'lg' }) {
  const confirmClass =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : tone === 'success'
        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '3xl': 'max-w-3xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };
  const widthClass = sizeClasses[size] || 'max-w-lg';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[2000] grid place-items-center px-4 py-6 overflow-y-auto">
          <motion.button
            type="button"
            aria-label="Đóng modal"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${widthClass} rounded-2xl bg-white p-5 shadow-2xl my-auto`}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition duration-200 ease-out hover:bg-slate-200"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
            <h2 className="pr-10 text-lg font-black text-slate-950">{title}</h2>
            {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
            {children && <div className="mt-4">{children}</div>}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition duration-200 ease-out hover:bg-slate-50"
              >
                {onConfirm && confirmLabel ? 'Hủy' : 'Đóng'}
              </button>
              {onConfirm && confirmLabel && (
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmClass}`}
                >
                  {confirmLabel}
                </button>
              )}
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
