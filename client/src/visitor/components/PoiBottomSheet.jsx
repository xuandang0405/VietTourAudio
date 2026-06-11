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
    const played = replayPoi(poi, getLanguageMeta());
    onToast(played ? t('playingAgain') : t('cannotPlay'));
  }

  return (
    <AnimatePresence>
      {poi && (
        <>
          <motion.button
            type="button"
            aria-label={t('close')}
            className="absolute inset-0 z-[1400] bg-slate-950/20 backdrop-blur-[2px]"
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
            className="absolute bottom-0 left-0 right-0 z-[1500] max-h-[84%] overflow-hidden rounded-t-[2rem] bg-white shadow-2xl"
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="max-h-[calc(84vh-1rem)] overflow-y-auto px-4 pb-6 pt-4 hide-scrollbar">
              <div className="grid grid-cols-[92px_1fr_auto] gap-3">
                <img className="h-24 w-24 rounded-3xl object-cover shadow-lg shadow-slate-900/10" src={poi.image} alt={poi.title} />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">{poi.zoneName}</p>
                  <h2 className="mt-1 text-xl font-black leading-tight text-slate-950">{poi.title}</h2>
                  <p className="mt-1 text-sm font-bold text-teal-700">{poi.distanceLabel ?? poi.distanceHint}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 transition duration-200 ease-out hover:bg-slate-200 active:scale-95"
                  aria-label={t('close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">{poi.category}</span>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">{poi.duration}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{t('rating')} {poi.rating}/5</span>
              </div>

              <section className="mt-5 rounded-3xl bg-slate-50 p-4">
                <h3 className="font-black text-slate-950">{t('freeText')}</h3>
                <p className="mt-2 max-h-36 overflow-y-auto pr-1 text-sm leading-7 text-slate-600 hide-scrollbar">{localizedContent.description}</p>
              </section>

              <button
                type="button"
                onClick={() => setShowQr((value) => !value)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 active:scale-95"
              >
                <QrCode size={18} />
                {showQr ? t('hideQr') : t('showQr')}
              </button>

              {showQr && (
                <section className="mt-3 rounded-3xl bg-slate-950 p-5 text-center text-white">
                  <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                    <QRCodeSVG value={qrTarget} size={172} level="M" includeMargin={false} />
                  </div>
                  <p className="mt-3 text-sm font-bold">{t('scanToOpen', { name: poi.title })}</p>
                  <p className="mt-1 text-xs text-slate-400">{t('qrTracking')}</p>
                </section>
              )}

              <section className="mt-4 rounded-3xl border border-teal-100 bg-white p-4 shadow-lg shadow-slate-900/5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">AI Audio</p>
                    <h3 className="font-black text-slate-950">{audioLocked ? t('audioPremium') : t('readyToPlay')}</h3>
                  </div>
                  {audioLocked ? <Lock className="text-slate-400" size={22} /> : <Volume2 className="text-teal-700" size={22} />}
                </div>

                {!audioLocked ? (
                  <div className="rounded-3xl bg-teal-50 p-4">
                    <AudioVisualizer active={currentPoiId === poi.id && isPlaying} />
                    {poi.isInsideRadius && (
                      <p className="mt-4 rounded-2xl bg-white/75 px-3 py-2 text-center text-xs font-black text-teal-800">
                        {t('insideRadius')}
                      </p>
                    )}
                    <button
                      type="button"
                      data-testid="replay-audio"
                      onClick={handleReplay}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/20 transition duration-200 ease-out hover:bg-teal-800 active:scale-95"
                    >
                      <RefreshCw size={18} />
                      {t('replay')}
                    </button>
                    <p className="mt-3 text-center text-xs font-semibold text-teal-800/70">{t('browserTts')}: {getLanguageMeta().name}</p>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-3xl bg-slate-100 p-4">
                    <AudioVisualizer locked />
                    <div data-testid="audio-locked-state" className="absolute inset-0 grid place-items-center bg-white/60 px-5 text-center backdrop-blur-[2px]">
                      <div>
                        <Lock className="mx-auto text-slate-500" size={24} />
                        <p className="mt-2 text-sm font-black text-slate-800">{t('textOnly')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="unlock-audio"
                      onClick={onUpgrade}
                      className="relative z-10 mt-20 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition duration-200 ease-out hover:bg-orange-600 active:scale-95"
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
