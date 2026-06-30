import { useEffect, useRef, useState } from 'react';

export function useUniversalScanner() {
  const [permissionStatus, setPermissionStatus] = useState<'starting' | 'allowed' | 'error' | 'unsecure'>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAndRequest() {
      const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        if (mounted) {
          setPermissionStatus('unsecure');
        }
        return;
      }

      try {
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        const constraints = isMobile 
          ? { video: { facingMode: 'environment' } } 
          : { video: { facingMode: 'user' } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mounted) {
          streamRef.current = stream;
          setPermissionStatus('allowed');
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch (err: any) {
        console.error('Camera permission request failed:', err);
        if (mounted) {
          setPermissionStatus('error');
          setErrorMsg(err?.message || String(err));
        }
      }
    }

    checkAndRequest();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return { permissionStatus, errorMsg };
}
