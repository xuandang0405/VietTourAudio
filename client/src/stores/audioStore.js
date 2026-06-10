import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { stopSpeech, speakText } from '../utils/ttsPlayer';

const AUTO_PLAY_COOLDOWN_MS = 10 * 60 * 1000;

export const useAudioStore = create(
  persist(
    (set, get) => ({
      currentPoiId: null,
      isPlaying: false,
      lastPlayedAtByPoi: {},
      lastError: '',
      canAutoPlay: (poiId) => {
        const lastPlayedAt = get().lastPlayedAtByPoi[poiId] ?? 0;
        return Date.now() - lastPlayedAt > AUTO_PLAY_COOLDOWN_MS;
      },
      playPoi: (poi, languageMeta, options = {}) => {
        const text = poi.narration?.[languageMeta.code] ?? poi.description;
        const result = speakText(text, languageMeta.speechCode, {
          onEnd: () => {
            set({ isPlaying: false });
          },
          onError: () => {
            set({
              isPlaying: false,
              lastError: 'Trình duyệt không thể phát giọng đọc mô phỏng.'
            });
          }
        });

        if (!result.supported) {
          set({
            currentPoiId: poi.id,
            isPlaying: false,
            lastError: 'Trình duyệt hiện tại chưa hỗ trợ Web Speech API.'
          });
          return false;
        }

        set((state) => ({
          currentPoiId: poi.id,
          isPlaying: true,
          lastError: '',
          lastPlayedAtByPoi: {
            ...state.lastPlayedAtByPoi,
            [poi.id]: Date.now()
          }
        }));

        return true;
      },
      replayPoi: (poi, languageMeta) => {
        set((state) => ({
          lastPlayedAtByPoi: {
            ...state.lastPlayedAtByPoi,
            [poi.id]: 0
          }
        }));

        return get().playPoi(poi, languageMeta, { force: true });
      },
      stop: () => {
        stopSpeech();
        set({ isPlaying: false });
      }
    }),
    {
      name: 'vta-audio-state',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        currentPoiId: state.currentPoiId,
        lastPlayedAtByPoi: state.lastPlayedAtByPoi
      })
    }
  )
);
