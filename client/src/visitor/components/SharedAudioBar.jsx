import { memo } from 'react';
import { Headphones, Pause, Play, Volume2 } from 'lucide-react';
import { visitorPois } from '../../data/visitorPois';
import { useAudioStore } from '../../stores/audioStore';
import { usePremiumStore } from '../../stores/premiumStore';

function SharedAudioBarComponent({ onUpgrade }) {
  const isPremium = usePremiumStore((state) => state.isPremium);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentPoiId = useAudioStore((state) => state.currentPoiId);
  const pauseAudio = useAudioStore((state) => state.pauseAudio);
  const resumeAudio = useAudioStore((state) => state.resumeAudio);

  const currentPoi = visitorPois.find((poi) => poi.id === currentPoiId);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1200] flex h-20 items-center justify-between border-t border-glassBorder bg-bgSurface/80 px-4 shadow-[0_-18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl pc:px-6">
      {!isPremium ? (
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 pc:gap-4">
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-glassBorder bg-white/5 text-textGhost shadow-glass-inner">
              <Headphones size={24} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-textCrisp">Audio Premium đang khóa</p>
              <p className="flex items-center gap-2 truncate text-xs font-medium italic text-textGhost">Mở khóa để nghe thuyết minh AI tự động</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="hidden rounded-full bg-gradient-to-r from-abyssIndigo to-electricBlue px-5 py-2.5 text-sm font-semibold text-white shadow-neon-cyan transition duration-150 ease-out hover:brightness-110 active:scale-[0.98] sm:flex"
          >
            Mở khóa Audio
          </button>
        </div>
      ) : !currentPoi ? (
        <div className="flex flex-1 items-center gap-3 pc:gap-4">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-oceanCyan/30 bg-oceanCyan/10 text-oceanCyan shadow-neon-cyan">
            <Headphones size={24} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-textCrisp">Đã sẵn sàng</p>
            <p className="truncate text-xs font-medium italic text-textSeafoam">Tiến đến điểm tham quan để tự động nghe thuyết minh</p>
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
              aria-label={isPlaying ? 'Tạm dừng audio' : 'Tiếp tục audio'}
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
