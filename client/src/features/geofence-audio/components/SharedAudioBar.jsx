import { AnimatePresence, motion } from 'framer-motion';
import { Headphones, Lock, Pause, Play, Volume2 } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { visitorPois } from '../../../data/visitorPois';
import { useAudioStore } from '../stores/audioStore';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';

function SharedAudioBarComponent({ onUpgrade }) {
  const { t } = useTranslation();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentPoiId = useAudioStore((state) => state.currentPoiId);
  const pauseAudio = useAudioStore((state) => state.pauseAudio);
  const resumeAudio = useAudioStore((state) => state.resumeAudio);

  const currentPoi = visitorPois.find((poi) => poi.id === currentPoiId);
  // Audio bị khóa khi: không phải premium VÀ không còn lượt free
  const audioLocked = !isPremium && freeListensRemaining === 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1200] flex h-20 items-center justify-between border-t border-glassBorder bg-bgSurface/80 px-4 shadow-[0_-18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl pc:px-6">
      {audioLocked ? (
        // ── 🔒 Locked UI ─────────────────────────────────────
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 items-center justify-between gap-4"
        >
          <div className="flex min-w-0 items-center gap-3 pc:gap-4">
            <div className="relative grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-premiumNeon/30 bg-premiumNeon/10 text-premiumNeon shadow-neon-premium">
              <Headphones size={22} className="opacity-40" />
              <Lock size={13} className="absolute bottom-1 right-1 text-premiumNeon" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-textCrisp">{t('audio.locked')}</p>
              <p className="truncate text-xs font-medium italic text-textGhost">{t('audio.out_of_free')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="flex-shrink-0 rounded-full bg-gradient-to-r from-premiumNeon/80 to-electricBlue px-5 py-2.5 text-sm font-bold text-white shadow-neon-premium transition duration-150 ease-out hover:brightness-110 active:scale-[0.98]"
          >
            {t('audio.unlock_all')}
          </button>
        </motion.div>
      ) : !isPremium && freeListensRemaining > 0 ? (
        // ── Free tier - còn lượt nghe ─────────────────────────
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 pc:gap-4">
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-glassBorder bg-white/5 text-textGhost shadow-glass-inner">
              <Headphones size={24} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-textCrisp">{t('audio.free_mode')}</p>
              <p className="flex items-center gap-2 truncate text-xs font-medium italic text-textSeafoam">
                {t('audio.free_remaining', { count: freeListensRemaining })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="hidden flex-shrink-0 rounded-full border border-premiumNeon/35 bg-premiumNeon/10 px-5 py-2.5 text-sm font-bold text-premiumNeon transition duration-150 ease-out hover:bg-premiumNeon/15 active:scale-[0.98] sm:flex"
          >
            {t('audio.upgrade')}
          </button>
        </div>
      ) : !currentPoi ? (
        <div className="flex flex-1 items-center gap-3 pc:gap-4">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-oceanCyan/30 bg-oceanCyan/10 text-oceanCyan shadow-neon-cyan">
            <Headphones size={24} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-textCrisp">{t('audio.ready')}</p>
            <p className="truncate text-xs font-medium italic text-textSeafoam">{t('audio.ready_hint')}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between gap-4 pc:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 pc:gap-4">
            <img
              src={currentPoi.image}
              alt={currentPoi.title}
              className="h-12 w-12 flex-shrink-0 rounded-xl border border-glassBorder object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold uppercase text-oceanCyan">{currentPoi.category}</p>
              <p className="truncate text-sm font-bold text-textCrisp">{currentPoi.title}</p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (isPlaying) {
                  pauseAudio();
                } else {
                  resumeAudio();
                }
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-oceanCyan text-bgAbyss shadow-[0_0_20px_rgba(34,211,238,0.6)] transition duration-150 ease-out hover:bg-white active:scale-[0.98]"
              aria-label={isPlaying ? t('audio.pause') : t('audio.resume')}
            >
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
            </button>
            <div className="hidden w-32 items-center gap-2 sm:flex">
              <Volume2 size={18} className="text-textSeafoam" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bgElevated">
                <div className={isPlaying ? 'h-full w-full rounded-full bg-gradient-to-r from-electricBlue to-oceanCyan' : 'h-full w-1/2 rounded-full bg-textGhost'} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const SharedAudioBar = memo(SharedAudioBarComponent);
