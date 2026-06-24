import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { flush } from '../services/syncService';

export function useOnlineStatus() {
  const setOnline = useAppStore((s) => s.setOnline);

  useEffect(() => {
    const onOnline = async () => {
      setOnline(true);
      await flush();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOnline]);
}
