import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { speakText, stopSpeech } from '../../../utils/ttsPlayer';
import { useAudioQueueStore } from './audioQueueStore';
import { visitorTrackingService } from '../services/visitorTrackingService';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';
import { resolveBackendMediaUrl } from '../../../utils/mediaUrl';
import { apiTruyCapPremium } from '../../payment/ApiTruyCapPremium';

const DEFAULT_COOLDOWN_MS = 10 * 60 * 1000;
let globalAudio = null;

function getAudioElement(store) {
  if (typeof window === 'undefined') return null;
  if (!globalAudio) {
    globalAudio = new window.Audio();
    
    globalAudio.addEventListener('timeupdate', () => {
      const state = store.getState();
      const current = globalAudio.currentTime;
      const dur = globalAudio.duration || 0;
      state.updateProgress(current, dur);
    });

    globalAudio.addEventListener('durationchange', () => {
      const state = store.getState();
      const current = globalAudio.currentTime;
      const dur = globalAudio.duration || 0;
      state.updateProgress(current, dur);
    });

    globalAudio.addEventListener('ended', () => {
      const state = store.getState();
      state.handleAudioEnded();
    });

    globalAudio.addEventListener('error', (e) => {
      console.error('HTML5 Audio error, falling back to TTS:', e);
      const state = store.getState();
      state.handleAudioError();
    });
  }
  return globalAudio;
}

export const useAudioStore = create(
  persist(
    (set, get) => ({
      currentPoiId: null,
      isPlaying: false,
      lastPlayedAtByPoi: {},
      lastError: '',
      
      // Progress states for HTML5 audio
      currentTime: 0,
      duration: 0,
      progress: 0,
      isHtml5: false,
      activeOnFinished: null,

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
            get().playPoi(poi, languageMeta, { onFinished: resolve })
              .then((success) => {
                if (!success) resolve();
              })
              .catch(resolve);
          });
        });
      },

      playPoi: async (poi, languageMeta, options = {}) => {
        if (!poi?.id) {
          set({ isPlaying: false, lastError: 'Không tìm thấy điểm thuyết minh.' });
          return false;
        }

        const text = poi.narration?.[languageMeta?.code] ?? poi.description ?? '';
        const audioUrl = poi.audioUrl;
        if (!audioUrl && !text.trim()) {
          set({ currentPoiId: poi.id, isPlaying: false, lastError: 'Chưa có nội dung thuyết minh.' });
          return false;
        }

        const premiumState = usePremiumStore.getState();
        const backendPoiId = poi.backendId ?? poi.apiId ?? poi.id;
        let access;
        try {
          access = await apiTruyCapPremium.authorizeAudioPlay(backendPoiId);
          premiumState.applyServerStatus(access);
        } catch (error) {
          set({
            isPlaying: false,
            lastError: error.response?.data?.message ?? 'Không thể xác thực quyền nghe audio.'
          });
          return false;
        }

        if (!access?.allowed) {
          premiumState.markPoiPlayed(backendPoiId);
          set({ isPlaying: false, lastError: 'Đã hết lượt nghe miễn phí cho điểm này. Vui lòng mở khóa Premium.' });
          window.dispatchEvent(new CustomEvent('open-checkout'));
          return false;
        }
        if (access.freeListenConsumed) {
          premiumState.markPoiPlayed(backendPoiId);
          premiumState.markPoiPlayed(poi.id);
        }

        // Stop any current audio
        get().stop();
        set({ activeOnFinished: options.onFinished || null });

        if (audioUrl) {
          const audio = getAudioElement({ getState: () => get(), setState: set });
          if (audio) {
            try {
              const resolvedUrl = resolveBackendMediaUrl(audioUrl);

              audio.src = resolvedUrl;
              audio.load();

              set({
                currentPoiId: poi.id,
                isPlaying: true,
                isHtml5: true,
                currentTime: 0,
                duration: 0,
                progress: 0,
                lastError: '',
                lastPlayedAtByPoi: {
                  ...get().lastPlayedAtByPoi,
                  [poi.id]: Date.now()
                }
              });

              audio.play().catch((err) => {
                console.warn('HTML5 Audio play blocked or failed, falling back to TTS:', err);
                get().playTtsFallback(text, languageMeta, poi, premiumState, options);
              });

              visitorTrackingService.trackAudioPlay(poi, languageMeta?.code);
              return true;
            } catch (err) {
              console.error('HTML5 audio setup exception, trying TTS fallback:', err);
            }
          }
        }

        return get().playTtsFallback(text, languageMeta, poi, premiumState, options);
      },

      playTtsFallback: (text, languageMeta, poi, premiumState, options) => {
        if (!text.trim()) {
          set({ currentPoiId: poi.id, isPlaying: false, lastError: 'Chưa có nội dung thuyết minh.' });
          return false;
        }

        const result = speakText(text, languageMeta?.speechCode ?? 'vi-VN', {
          onEnd: () => {
            set({ isPlaying: false });
            options.onFinished?.();
            const cb = get().activeOnFinished;
            if (cb) cb();
          },
          onError: () => {
            set({
              isPlaying: false,
              lastError: 'Không thể phát giọng đọc.'
            });
            options.onFinished?.();
            const cb = get().activeOnFinished;
            if (cb) cb();
          }
        });

        if (!result.supported) {
          set({
            currentPoiId: poi.id,
            isPlaying: false,
            isHtml5: false,
            lastError: 'Trình duyệt chưa hỗ trợ Web Speech API.'
          });
          return false;
        }

        set((state) => ({
          currentPoiId: poi.id,
          isPlaying: true,
          isHtml5: false,
          currentTime: 0,
          duration: 0,
          progress: 0,
          lastError: '',
          lastPlayedAtByPoi: {
            ...state.lastPlayedAtByPoi,
            [poi.id]: Date.now()
          }
        }));

        visitorTrackingService.trackAudioPlay(poi, languageMeta?.code);
        return true;
      },

      replayPoi: async (poi, languageMeta) => {
        if (!poi?.id) return false;

        set((state) => ({
          lastPlayedAtByPoi: {
            ...state.lastPlayedAtByPoi,
            [poi.id]: 0
          }
        }));

        useAudioQueueStore.getState().clearQueue();
        get().stop();
        return await get().playPoi(poi, languageMeta, { force: true });
      },

      pauseAudio: () => {
        if (get().isHtml5) {
          const audio = getAudioElement({ getState: () => get(), setState: set });
          if (audio) audio.pause();
        } else {
          if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
            window.speechSynthesis.pause();
          }
        }
        set({ isPlaying: false });
      },

      resumeAudio: () => {
        if (get().isHtml5) {
          const audio = getAudioElement({ getState: () => get(), setState: set });
          if (audio) {
            audio.play().catch((err) => console.error('Audio resume play failed:', err));
            set({ isPlaying: true });
          }
        } else {
          if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
            window.speechSynthesis.resume();
            set({ isPlaying: true });
          }
        }
      },

      stop: () => {
        const audio = getAudioElement({ getState: () => get(), setState: set });
        if (audio) {
          audio.pause();
          audio.src = '';
        }
        stopSpeech();
        set({ isPlaying: false, isHtml5: false, currentTime: 0, duration: 0, progress: 0 });
      },

      seek: (time) => {
        if (get().isHtml5) {
          const audio = getAudioElement({ getState: () => get(), setState: set });
          if (audio) {
            audio.currentTime = time;
            set({ currentTime: time });
          }
        }
      },

      updateProgress: (current, dur) => {
        set({
          currentTime: current,
          duration: dur,
          progress: dur > 0 ? (current / dur) * 100 : 0
        });
      },

      handleAudioEnded: () => {
        set({ isPlaying: false });
        const cb = get().activeOnFinished;
        if (cb) cb();
      },

      handleAudioError: () => {
        set({
          isPlaying: false,
          isHtml5: false,
          lastError: 'Lỗi phát file âm thanh. Đang chuyển sang thuyết minh giọng đọc AI...'
        });
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
