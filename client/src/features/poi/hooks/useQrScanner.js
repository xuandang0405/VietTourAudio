import { useEffect, useRef, useState } from 'react';

/**
 * [UC38] Scan QR Code - Custom Hook.
 * Encapsulates the WebRTC camera stream initialization, BarcodeDetector API execution,
 * and scanning loop coordination.
 */
export function useQrScanner({ onResult }) {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | error | unsupported

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const isSecureContext = window.isSecureContext || location.protocol === 'https:';
      if (!navigator.mediaDevices || !isSecureContext) {
        setStatus('unsecure');
        return;
      }

      // Check BarcodeDetector API presence
      if (!('BarcodeDetector' in window)) {
        setStatus('unsupported');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
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
            // Ignore single frame detection errors
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onResult]);

  return { videoRef, status };
}
