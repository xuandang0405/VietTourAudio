import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CameraOff, Loader2, AlertTriangle, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUniversalScanner } from '../../../hooks/useUniversalScanner';
import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

/**
 * Quét QR bằng camera của trình duyệt (sử dụng useUniversalScanner và html5-qrcode).
 * Props:
 *   onResult(text: string) - callback khi đọc được nội dung QR
 *   onClose() - callback khi người dùng đóng
 */
export function QrCameraScanner({ onResult, onClose }) {
  const { t } = useTranslation();
  const { permissionStatus } = useUniversalScanner();
  const [scanStatus, setScanStatus] = useState('starting'); // starting, scanning, error
  const scannerRef = useRef(null);

  // 2. Suppress the AbortError (play request interrupted) in console
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      if (
        event.reason?.name === 'AbortError' ||
        event.reason?.message?.includes('play() request was interrupted')
      ) {
        event.preventDefault(); // suppress console warning
        console.log('Suppressed play() AbortError in scanner');
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 1. Scanner Lifecycle in useEffect
  useEffect(() => {
    let isMounted = true;
    let html5QrcodeInstance = null;

    if (permissionStatus !== 'allowed') {
      return;
    }

    async function startScanner() {
      try {
        const container = document.getElementById('reader');
        if (!container) {
          throw new Error('Reader container not found in DOM');
        }

        html5QrcodeInstance = new Html5Qrcode('reader');
        scannerRef.current = html5QrcodeInstance;

        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        const cameraConstraints = isMobile 
          ? { facingMode: 'environment' } 
          : { facingMode: 'user' };

        await html5QrcodeInstance.start(
          cameraConstraints,
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (isMounted) {
              onResult?.(decodedText);
            }
          },
          () => {} // silent frame errors
        );

        if (isMounted) {
          setScanStatus('scanning');
        }
      } catch (err) {
        console.error('Html5Qrcode start error:', err);
        if (isMounted) {
          setScanStatus('error');
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrcodeInstance) {
        if (html5QrcodeInstance.isScanning) {
          html5QrcodeInstance.stop()
            .then(() => {
              html5QrcodeInstance.clear();
            })
            .catch((err) => console.warn("Failed to stop scanner cleanly:", err));
        } else {
          try {
            html5QrcodeInstance.clear();
          } catch (e) {
            // ignore
          }
        }
      }
    };
  }, [permissionStatus, onResult]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("reader");
      const decodedText = await html5QrCode.scanFile(file, false);
      onResult?.(decodedText);
    } catch (err) {
      console.error("Error decoding QR from file via html5-qrcode:", err);
      try {
        if ('BarcodeDetector' in window) {
          const imageUrl = URL.createObjectURL(file);
          const img = new Image();
          img.onload = async () => {
            try {
              const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
              const barcodes = await detector.detect(img);
              if (barcodes && barcodes.length > 0) {
                onResult?.(barcodes[0].rawValue);
              } else {
                alert(t('admin.scanner.no_qr_found', { defaultValue: 'Không tìm thấy mã QR trong ảnh.' }));
              }
            } catch (err2) {
              alert(t('admin.scanner.detect_error', { defaultValue: 'Lỗi khi quét mã QR từ ảnh.' }));
            } finally {
              URL.revokeObjectURL(imageUrl);
            }
          };
          img.src = imageUrl;
        } else {
          alert(t('admin.scanner.no_qr_found', { defaultValue: 'Không tìm thấy mã QR trong ảnh.' }));
        }
      } catch (errFallback) {
        alert(t('admin.scanner.detect_error', { defaultValue: 'Lỗi khi quét mã QR từ ảnh.' }));
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        className="relative overflow-hidden rounded-2xl border border-glassBorder bg-bgSurface/90 shadow-2xl"
      >
        {/* Container for html5-qrcode: always mounted and static to avoid DOM-reconciliation crash */}
        <div className="relative aspect-square w-[280px] overflow-hidden bg-black rounded-xl mx-auto mt-4">
          <style>{`
            #reader video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
            }
          `}</style>
          <div 
            id="reader" 
            key="qr-scanner-renderer" 
            className="w-full h-full" 
            style={{ 
              visibility: (permissionStatus === 'allowed' && scanStatus !== 'error') ? 'visible' : 'hidden',
              position: 'absolute',
              inset: 0
            }}
          />

          {/* Overlay loading state */}
          {permissionStatus === 'starting' && scanStatus === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-textSeafoam bg-bgSurface/90 z-20">
              <Loader2 size={30} className="animate-spin text-oceanCyan" />
              <p className="text-sm font-bold">{t('landing.scanner.starting')}</p>
            </div>
          )}

          {/* Viewfinder overlay during scanning */}
          {permissionStatus === 'allowed' && scanStatus === 'scanning' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
              <div className="h-44 w-44 rounded-xl border-2 border-oceanCyan shadow-[0_0_0_2000px_rgba(0,0,0,0.45)]" />
              <motion.div
                className="absolute h-0.5 w-40 bg-gradient-to-r from-transparent via-oceanCyan to-transparent"
                animate={{ y: [-72, 72] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
              />
            </div>
          )}

          {/* Fallback for error */}
          {(permissionStatus === 'error' || scanStatus === 'error') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-textSeafoam bg-bgSurface/90 z-20">
              <CameraOff size={32} className="text-red-400" />
              <p className="text-sm font-bold text-red-300">{t('landing.scanner.error')}</p>
              <p className="text-xs text-textGhost">{t('landing.scanner.error_hint')}</p>
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-glassBorder bg-white/5 px-4 py-2 text-xs font-bold text-textSeafoam transition hover:bg-white/10 active:scale-[0.98]">
                <Upload size={14} className="text-oceanCyan" />
                <span>{t('admin.scanner.upload_fallback', { defaultValue: 'Tải ảnh lên để giải mã' })}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Fallback for unsecure */}
          {permissionStatus === 'unsecure' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 py-5 text-center text-textSeafoam bg-bgSurface/90 z-20">
              <AlertTriangle size={32} className="text-amber-400" />
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-semibold leading-relaxed text-amber-200">
                {t('admin.scanner.unsecure_warning')}
              </div>
              
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-glassBorder bg-white/5 px-4 py-2 text-xs font-bold text-textSeafoam transition hover:bg-white/10 active:scale-[0.98]">
                <Upload size={14} className="text-oceanCyan" />
                <span>{t('admin.scanner.upload_fallback')}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Hint */}
        {permissionStatus === 'allowed' && scanStatus === 'scanning' && (
          <p className="py-2 text-center text-xs font-bold text-textSeafoam">
            {t('landing.scanner.hint')}
          </p>
        )}

        <div className="flex justify-center pb-3 mt-4">
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
