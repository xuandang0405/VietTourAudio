import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';

export function useGuestId() {
  const setGuestId = useAppStore((s) => s.setGuestId);
  const setSessionId = useAppStore((s) => s.setSessionId);

  useEffect(() => {
    const localGuest = localStorage.getItem('guestId') || crypto.randomUUID();
    localStorage.setItem('guestId', localGuest);
    setGuestId(localGuest);

    const localSession = localStorage.getItem('sessionId') || '';
    if (localSession) setSessionId(localSession);
  }, [setGuestId, setSessionId]);
}
