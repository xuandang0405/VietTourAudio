import { AnimatePresence, motion } from 'framer-motion';
import { Lock, QrCode, RefreshCw, Volume2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { appConfig } from '../../config/appConfig';
import { getLocalizedPoiContent } from '../../data/visitorPois';
import { useTranslation } from '../../i18n/translations';
import { useAudioStore } from '../../stores/audioStore';
import { useLanguageStore } from '../../stores/languageStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { AudioVisualizer } from './AudioVisualizer';

export function PoiBottomSheet({ poi, onClose, onUpgrade, onToast }) {
  const { t } = useTranslation();
  const [showQr, setShowQr] = useState(false);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const currentPoiId = useAudioStore((state) => state.currentPoiId);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const replayPoi = useAudioStore((state) => state.replayPoi);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const getLanguageMeta = useLanguageStore((state) => state.getLanguageMeta);
  const audioLocked = Boolean(poi?.isPremiumPoi && !isPremium);
  const localizedContent = getLocalizedPoiContent(poi, currentLanguage);
  const qrTarget = poi
    ? `${appConfig.publicAppUrl}/map?poi=${encodeURIComponent(poi.id)}&source=qr&qr=${poi.qrCodeId ?? poi.apiId}`
    : '';

  function handleReplay() {
    if (!poi) return;
    const played = replayPoi(poi, getLanguageMeta());
    onToast?.(played ? t('playingAgain') : t('cannotPlay'));
  }

  return (
    <AnimatePresence>
      {poi && (
        <>
          <motion.button
            type="button"
            aria-label={t('close')}
            className="absolute inset-0 z-[1400] bg-bgAbyss/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            data-testid="poi-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.22 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 650) onClose();
            }}
            className="absolute bottom-0 left-0 right-0 z-[1500] max-h-[84%] overflow-hidden rounded-t-2xl border border-glassBorder bg-bgSurface/94 text-textCrisp shadow-2xl shadow-black/45 backdrop-blur-xl pc:left-[calc(50%-260px)] pc:right-auto pc:w-[520px]"
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-electricBlue/25" />
            <div className="max-h-[calc(84vh-1rem)] overflow-y-auto px-4 pb-6 pt-4 hide-scrollbar">
              <div className="grid grid-cols-[92px_1fr_auto] gap-3">
                <img className="h-24 w-24 rounded-xl border border-glassBorder object-cover shadow-lg shadow-black/25" src={poi.image} alt={poi.title} loading="lazy" decoding="async" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-oceanCyan">{poi.zoneName}</p>
                  <h2 className="mt-1 font-display text-xl font-bold leading-tight text-textCrisp">{poi.title}</h2>
                  <p className="mt-1 text-sm font-bold text-electricBlue">{poi.distanceLabel ?? poi.distanceHint}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-10 w-10 place-items-center rounded-full border border-glassBorder bg-white/5 text-textSeafoam transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 hover:text-textCrisp active:scale-[0.98]"
                  aria-label={t('close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-electricBlue/20 bg-electricBlue/10 px-3 py-1 text-xs font-bold text-electricBlue">{poi.category}</span>
                <span className="rounded-full border border-oceanCyan/20 bg-oceanCyan/10 px-3 py-1 text-xs font-bold text-oceanCyan">{poi.duration}</span>
                <span className="rounded-full border border-glassBorder bg-white/5 px-3 py-1 text-xs font-bold text-textSeafoam">{t('rating')} {poi.rating}/5</span>
              </div>

              <section className="mt-5 rounded-2xl border border-glassBorder bg-white/5 p-4 shadow-glass-inner">
                <h3 className="font-display font-bold text-textCrisp">{t('freeText')}</h3>
                <p className="mt-2 max-h-36 overflow-y-auto pr-1 text-sm leading-7 text-textSeafoam hide-scrollbar">{localizedContent.description}</p>
              </section>

              <button
                type="button"
                onClick={() => setShowQr((value) => !value)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-glassBorder bg-white/5 px-4 py-3 text-sm font-bold text-textCrisp transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 active:scale-[0.98]"
              >
                <QrCode size={18} />
                {showQr ? t('hideQr') : t('showQr')}
              </button>

              {showQr && (
                <section className="mt-3 rounded-2xl border border-glassBorder bg-bgAbyss/65 p-5 text-center">
                  <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                    <QRCodeSVG value={qrTarget} size={172} level="M" includeMargin={false} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-textCrisp">{t('scanToOpen', { name: poi.title })}</p>
                  <p className="mt-1 text-xs text-textGhost">{t('qrTracking')}</p>
                </section>
              )}

              <section className="mt-4 rounded-2xl border border-glassBorder bg-glassCore p-4 shadow-glass-inner">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-premiumNeon">AI Audio</p>
                    <h3 className="font-display font-bold text-textCrisp">{audioLocked ? t('audioPremium') : t('readyToPlay')}</h3>
                  </div>
                  {audioLocked ? <Lock className="text-textGhost" size={22} /> : <Volume2 className="text-oceanCyan" size={22} />}
                </div>

                {!audioLocked ? (
                  <div className="rounded-2xl border border-oceanCyan/20 bg-oceanCyan/10 p-4">
                    <AudioVisualizer active={currentPoiId === poi.id && isPlaying} />
                    {poi.isInsideRadius && (
                      <p className="mt-4 rounded-xl border border-oceanCyan/20 bg-bgAbyss/45 px-3 py-2 text-center text-xs font-bold text-oceanCyan">
                        {t('insideRadius')}
                      </p>
                    )}
                    <button
                      type="button"
                      data-testid="replay-audio"
                      onClick={handleReplay}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-oceanCyan px-4 py-3 text-sm font-bold text-bgAbyss shadow-[0_0_20px_rgba(34,211,238,0.6)] transition duration-150 ease-out hover:bg-white active:scale-[0.98]"
                    >
                      <RefreshCw size={18} />
                      {t('replay')}
                    </button>
                    <p className="mt-3 text-center text-xs font-semibold text-textSeafoam">{t('browserTts')}: {getLanguageMeta().name}</p>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl border border-glassBorder bg-bgElevated/50 p-4">
                    <AudioVisualizer locked />
                    <div data-testid="audio-locked-state" className="absolute inset-0 grid place-items-center bg-bgAbyss/62 px-5 text-center backdrop-blur-[2px]">
                      <div>
                        <Lock className="mx-auto text-premiumNeon" size={24} />
                        <p className="mt-2 text-sm font-bold text-textCrisp">{t('textOnly')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="unlock-audio"
                      onClick={onUpgrade}
                      className="relative z-10 mt-20 w-full rounded-full bg-gradient-to-r from-premiumNeon to-electricBlue px-4 py-3 text-sm font-bold text-white shadow-neon-premium transition duration-150 ease-out hover:brightness-110 active:scale-[0.98]"
                    >
                      {t('unlockAudio')}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
