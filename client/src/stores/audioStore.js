import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { speakText, stopSpeech } from '../utils/ttsPlayer';
import { useAudioQueueStore } from './audioQueueStore';
import { visitorTrackingService } from '../services/visitorTrackingService';

const DEFAULT_COOLDOWN_MS = 10 * 60 * 1000;

export const useAudioStore = create(
  persist(
    (set, get) => ({
      currentPoiId: null,
      isPlaying: false,
      lastPlayedAtByPoi: {},
      lastError: '',

      canAutoPlay: (poiId, cooldownMs = DEFAULT_COOLDOWN_MS) => {
        if (!poiId) return false;
        const lastPlayedAt = get().lastPlayedAtByPoi[poiId] ?? 0;
        return Date.now() - lastPlayedAt > cooldownMs;
      },

      getCooldownRemaining: (poiId, cooldownMs = DEFAULT_COOLDOWN_MS) => {
        const lastPlayedAt = get().lastPlayedAtByPoi[poiId] ?? 0;
        const remaining = lastPlayedAt + cooldownMs - Date.now();
        return remaining > 0 ? remaining : 0;
      },

      enqueuePoi: (poi, languageMeta) => {
        if (!poi?.id || !get().canAutoPlay(poi.id)) return;

        useAudioQueueStore.getState().enqueue(poi.id, () => {
          return new Promise((resolve) => {
            const success = get().playPoi(poi, languageMeta, {
              onFinished: resolve
            });

            if (!success) resolve();
          });
        });
      },

      playPoi: (poi, languageMeta, options = {}) => {
        if (!poi?.id) {
          set({ isPlaying: false, lastError: 'Không tìm thấy điểm thuyết minh.' });
          return false;
        }

        const text = poi.narration?.[languageMeta?.code] ?? poi.description ?? '';
        if (!text.trim()) {
          set({ currentPoiId: poi.id, isPlaying: false, lastError: 'Chưa có nội dung thuyết minh.' });
          return false;
        }

        const result = speakText(text, languageMeta?.speechCode ?? 'vi-VN', {
          onEnd: () => {
            set({ isPlaying: false });
            options.onFinished?.();
          },
          onError: () => {
            set({
              isPlaying: false,
              lastError: 'Không thể phát giọng đọc.'
            });
            options.onFinished?.();
          }
        });

        if (!result.supported) {
          set({
            currentPoiId: poi.id,
            isPlaying: false,
            lastError: 'Trình duyệt chưa hỗ trợ Web Speech API.'
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

        visitorTrackingService.trackAudioPlay(poi, languageMeta.code);

        return true;
      },

      replayPoi: (poi, languageMeta) => {
        if (!poi?.id) return false;

        set((state) => ({
          lastPlayedAtByPoi: {
            ...state.lastPlayedAtByPoi,
            [poi.id]: 0
          }
        }));

        useAudioQueueStore.getState().clearQueue();
        get().stop();
        return get().playPoi(poi, languageMeta, { force: true });
      },

      pauseAudio: () => {
        if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
          window.speechSynthesis.pause();
        }
        set({ isPlaying: false });
      },

      resumeAudio: () => {
        if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
          window.speechSynthesis.resume();
          set({ isPlaying: true });
        }
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
