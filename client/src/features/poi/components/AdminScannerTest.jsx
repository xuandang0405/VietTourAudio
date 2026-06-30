import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCameraScanner } from './QrCameraScanner';
import { AdminModal } from '../../../admin/components/AdminModal';
import { CheckCircle2, QrCode } from 'lucide-react';

/**
 * Reusable Admin QR Scanner testing modal.
 * Restricts access context to admin page integration and releases video tracks properly on close.
 */
export function AdminScannerTest({ open, onClose }) {
  const { t } = useTranslation();
  const [result, setResult] = useState(null);

  const handleResult = (val) => {
    setResult(val);
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <AdminModal
      open={open}
      title={t('admin.scanner.title', { defaultValue: 'quét mã QR' })}
      description={t('admin.scanner.description', { defaultValue: 'Giao diện kiểm thử camera và giải mã QR cho Quản trị viên.' })}
      confirmLabel={t('common.close', { defaultValue: 'Đóng' })}
      tone="blue"
      onClose={handleClose}
      onConfirm={handleClose}
    >
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        {result ? (
          <div className="w-full space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
              <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-sm font-black text-emerald-800">
                {t('admin.scanner.success', { defaultValue: 'Quét/Giải mã QR thành công!' })}
              </p>
              <p className="mt-3 text-xs font-mono text-slate-900 bg-slate-100 p-3 rounded-lg border border-slate-200 break-all select-all hover:bg-slate-200 transition">
                {result}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-700 transition active:scale-[0.98]"
            >
              <QrCode size={16} />
              <span>{t('admin.scanner.scan_again', { defaultValue: 'Quét lại' })}</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center p-2 bg-slate-950 rounded-2xl border border-glassBorder shadow-inner">
            {open && (
              <QrCameraScanner
                onResult={handleResult}
                onClose={handleClose}
              />
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
}
