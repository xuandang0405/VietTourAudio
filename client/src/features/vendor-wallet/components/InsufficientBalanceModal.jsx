import { ArrowRight, WalletCards, X } from 'lucide-react';

export function InsufficientBalanceModal({ open, message, onClose, onTopUp }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="insufficient-balance-title" className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
              <WalletCards size={26} />
            </div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 hover:bg-white/25" aria-label="Đóng">
              <X size={18} />
            </button>
          </div>
          <h2 id="insufficient-balance-title" className="mt-5 text-2xl font-black">Ví chưa đủ số dư</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/90">
            {message || 'Vui lòng nạp thêm tiền để tiếp tục thanh toán gói dịch vụ.'}
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm leading-6 text-slate-600">
            Mở khu vực nạp ví để quét mã QR, gửi bằng chứng chuyển khoản và chờ Admin xác nhận.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
              Để sau
            </button>
            <button type="button" onClick={onTopUp} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 font-black text-white hover:bg-teal-700">
              Nạp tiền ngay <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
