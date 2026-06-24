let audio = null;
let timeCb = null;
let endCb = null;
let errCb = null;

function bindEvents() {
  if (!audio) return;
  audio.ontimeupdate = () => timeCb?.(audio.currentTime, audio.duration || 0);
  audio.onended = () => endCb?.();
  audio.onerror = () => errCb?.(new Error('Audio playback failed'));
}

export const audioService = {
  load(url) {
    if (!url) throw new Error('Audio URL is empty');
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    audio = new Audio(url);
    bindEvents();
    return audio;
  },
  play() { return audio?.play(); },
  pause() { audio?.pause(); },
  replay() {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  },
  seekPercent(pct) {
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.duration * pct));
  },
  seekTo(seconds) {
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, seconds));
  },
  setRate(rate) { if (audio) audio.playbackRate = rate; },
  destroy() {
    if (!audio) return;
    audio.pause();
    audio.src = '';
    audio = null;
  },
  onTimeUpdate(cb) { timeCb = cb; bindEvents(); },
  onEnded(cb) { endCb = cb; bindEvents(); },
  onError(cb) { errCb = cb; bindEvents(); }
};
