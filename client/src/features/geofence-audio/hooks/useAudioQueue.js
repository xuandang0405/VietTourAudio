import { useAudioQueueStore } from '../stores/audioQueueStore_backup';

export function useAudioQueue() {
  const queue = useAudioQueueStore((state) => state.queue);
  const currentTrack = useAudioQueueStore((state) => state.currentTrack);
  const setCurrentTrack = useAudioQueueStore((state) => state.setCurrentTrack);

  return {
    queue,
    currentTrack,
    playNext: () => setCurrentTrack(queue[0] ?? null)
  };
}
