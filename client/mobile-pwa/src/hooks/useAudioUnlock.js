import { useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';

export function useAudioUnlock() {
  const setAudioUnlocked = useAppStore((s) => s.setAudioUnlocked);

  const unlock = useCallback(() => {
    // iOS autoplay unlock gesture
    const a = new Audio();
    a.play().catch(() => {});
    setAudioUnlocked(true);
  }, [setAudioUnlocked]);

  return unlock;
}
