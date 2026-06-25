import { useState, useEffect } from 'react';
import { RefreshCw, Pause, ChevronDown, ChevronUp, Play, X, Headphones } from 'lucide-react';
import { useAudioStore } from '../features/geofence-audio/stores/audioStore';
import { useAudioQueueStore } from '../features/geofence-audio/stores/audioQueueStore';
import { localizePoi, visitorPois } from '../data/visitorPois';
import { useLanguageStore } from '../stores/languageStore';
import { useTranslation } from 'react-i18next';

export function AudioPlayerSheet() {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentPoiId = useAudioStore((state) => state.currentPoiId);
  const stop = useAudioStore((state) => state.stop);
  const replayPoi = useAudioStore((state) => state.replayPoi);
  const getCooldownRemaining = useAudioStore((state) => state.getCooldownRemaining);
  const canAutoPlay = useAudioStore((state) => state.canAutoPlay);
  
  const queue = useAudioQueueStore((state) => state.queue);
  const getLanguageMeta = useLanguageStore((state) => state.getLanguageMeta);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const [cooldownTime, setCooldownTime] = useState(0);

  const activePoiData = visitorPois.find(p => p.id === currentPoiId);
  const activePoi = activePoiData ? localizePoi(activePoiData, currentLanguage) : null;

  useEffect(() => {
    if (!currentPoiId) return;
    const interval = setInterval(() => {
      setCooldownTime(getCooldownRemaining(currentPoiId));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPoiId, getCooldownRemaining, isPlaying]);

  if (!currentPoiId && queue.length === 0) return null;

  const handleReplay = () => {
    if (activePoi) replayPoi(activePoi, getLanguageMeta());
  };

  const handleStop = () => {
    stop();
  };

  if (isCollapsed) {
    return (
      <aside className="absolute bottom-20 left-4 right-4 z-45 flex items-center justify-between rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur-md border border-slate-200 transition-all duration-300">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer w-full" onClick={() => setIsCollapsed(false)}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 shadow-sm border border-teal-200">
            <Headphones size={20} className={isPlaying ? 'animate-pulse' : ''} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{activePoi?.title || t('waiting')}</p>
            <p className="text-xs font-medium text-slate-500">
              {isPlaying ? t('playing') : t('stopped')} {queue.length > 0 ? `• ${t('queue', { count: queue.length })}` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 border-l border-slate-200 pl-3">
          <button onClick={handleStop} className="p-2 text-slate-400 hover:text-slate-700 transition active:scale-95 bg-slate-50 rounded-full">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={() => setIsCollapsed(false)} className="p-2 text-slate-400 hover:text-slate-700 transition active:scale-95">
            <ChevronUp size={24} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="absolute bottom-0 left-0 right-0 z-45 rounded-t-[2rem] bg-white p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl border-t border-slate-200 transition-all duration-300 pb-24">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-slate-300" />
      
      <div className="flex items-start justify-between mb-6 pt-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-600">
            {queue.length > 0 ? t('queue', { count: queue.length }) : t('listening')}
          </span>
          <h2 className="mt-1 text-xl font-black text-slate-900 line-clamp-1">{activePoi?.title || t('noInfo')}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleStop} className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 active:scale-95 border border-slate-200">
            <X size={20} />
          </button>
          <button onClick={() => setIsCollapsed(true)} className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 active:scale-95 border border-slate-200">
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center py-4">
         <div className="flex items-center gap-1.5">
           {Array.from({ length: 8 }).map((_, i) => (
             <span key={i} className={`w-1.5 rounded-full bg-teal-500 transition-all duration-200 ${isPlaying ? 'animate-pulse' : 'h-2 opacity-30 bg-slate-400'}`} style={{ height: isPlaying ? `${Math.max(12, Math.random() * 40)}px` : '8px' }} />
           ))}
         </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {cooldownTime > 0 && !isPlaying ? (
          <p className="text-center text-sm font-medium text-slate-500">
            {t('replayAfter')} <span className="text-teal-600 font-mono font-bold">{Math.ceil(cooldownTime / 1000)}s</span>
          </p>
        ) : (
          <button
            onClick={handleReplay}
            disabled={!canAutoPlay(currentPoiId) && isPlaying}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={isPlaying ? 'animate-spin' : ''} />
            {isPlaying ? t('playing') : t('replay')}
          </button>
        )}
      </div>
    </aside>
  );
}
