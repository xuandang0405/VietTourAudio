import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Quét QR bằng camera của trình duyệt (không cần thư viện ngoài).
 * Dùng BarcodeDetector API (Chrome/Edge) nếu có, fallback hiện thông báo.
 * Props:
 *   onResult(text: string) - callback khi đọc được nội dung QR
 *   onClose() - callback khi người dùng đóng
 */
export function QrCameraScanner({ onResult, onClose }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | error | unsupported

  useEffect(() => {
    let cancelled = false;

    async function start() {
      // Kiểm tra BarcodeDetector API
      if (!('BarcodeDetector' in window)) {
        setStatus('unsupported');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

        setStatus('scanning');

        intervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              clearInterval(intervalRef.current);
              onResult?.(barcodes[0].rawValue);
            }
          } catch {
            // Bỏ qua lỗi từng frame
          }
        }, 400);
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    start();
    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        className="relative overflow-hidden rounded-2xl border border-glassBorder bg-bgSurface/90 shadow-2xl"
      >
        {status === 'scanning' && (
          <div className="relative aspect-square w-full max-w-[280px] overflow-hidden bg-black">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            {/* Viewfinder overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-44 w-44 rounded-xl border-2 border-oceanCyan shadow-[0_0_0_2000px_rgba(0,0,0,0.45)]" />
              <motion.div
                className="absolute h-0.5 w-40 bg-gradient-to-r from-transparent via-oceanCyan to-transparent"
                animate={{ y: [-72, 72] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
              />
            </div>
          </div>
        )}

        {status === 'starting' && (
          <div className="flex h-56 w-full max-w-[280px] flex-col items-center justify-center gap-3 text-textSeafoam">
            <Loader2 size={30} className="animate-spin text-oceanCyan" />
            <p className="text-sm font-bold">{t('landing.scanner.starting')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex h-56 w-full max-w-[280px] flex-col items-center justify-center gap-3 px-6 text-center text-textSeafoam">
            <CameraOff size={32} className="text-red-400" />
            <p className="text-sm font-bold text-red-300">{t('landing.scanner.error')}</p>
            <p className="text-xs text-textGhost">{t('landing.scanner.error_hint')}</p>
          </div>
        )}

        {status === 'unsupported' && (
          <div className="flex h-56 w-full max-w-[280px] flex-col items-center justify-center gap-3 px-6 text-center text-textSeafoam">
            <Camera size={32} className="text-textGhost" />
            <p className="text-sm font-bold">{t('landing.scanner.unsupported')}</p>
            <p className="text-xs text-textGhost">{t('landing.scanner.unsupported_hint')}</p>
          </div>
        )}

        {/* Hint */}
        {status === 'scanning' && (
          <p className="py-2 text-center text-xs font-bold text-textSeafoam">
            {t('landing.scanner.hint')}
          </p>
        )}

        <div className="flex justify-center pb-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-glassBorder bg-white/5 px-5 py-2 text-xs font-bold text-textSeafoam transition hover:bg-white/10 active:scale-[0.98]"
          >
            {t('landing.scanner.close')}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
