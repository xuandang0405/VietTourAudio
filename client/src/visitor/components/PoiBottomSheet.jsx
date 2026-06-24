import { AnimatePresence, motion } from 'framer-motion';
import { Lock, QrCode, RefreshCw, Volume2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { appConfig } from '../../config/appConfig';
import { getLocalizedPoiContent } from '../../data/visitorPois';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '../../stores/audioStore';
import { useLanguageStore } from '../../stores/languageStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { AudioVisualizer } from './AudioVisualizer';

export function PoiBottomSheet({ poi, onClose, onUpgrade, onToast }) {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  const [showQr, setShowQr] = useState(false);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);
  const currentPoiId = useAudioStore((state) => state.currentPoiId);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const replayPoi = useAudioStore((state) => state.replayPoi);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const getLanguageMeta = useLanguageStore((state) => state.getLanguageMeta);
  // Khóa audio khi: (POI premium & chưa trả phí) HOẶC (hết lượt free & chưa premium)
  const audioLocked = Boolean(
    (poi?.isPremiumPoi && !isPremium) || (!isPremium && freeListensRemaining === 0)
  );
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
            className="absolute inset-0 z-[1400] bg-slate-900/40 backdrop-blur-[2px]"
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
            className="absolute bottom-0 left-0 right-0 z-[1500] max-h-[84%] overflow-hidden rounded-t-3xl border-t border-slate-200 bg-white text-slate-900 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pc:left-[calc(50%-260px)] pc:right-auto pc:w-[520px]"
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="max-h-[calc(84vh-1rem)] overflow-y-auto px-4 pb-6 pt-4 hide-scrollbar">
              <div className="grid grid-cols-[92px_1fr_auto] gap-3">
                <img className="h-24 w-24 rounded-xl border border-slate-100 object-cover shadow-sm" src={poi.image} alt={poi.title} loading="lazy" decoding="async" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-teal-600">{poi.zoneName}</p>
                  <h2 className="mt-1 font-display text-xl font-bold leading-tight text-slate-900">{poi.title}</h2>
                  <p className="mt-1 text-sm font-bold text-teal-600">{t('distance_away', { distance: poi.distanceLabel ?? poi.distanceHint })}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition duration-150 ease-out hover:bg-slate-100 hover:text-slate-800 active:scale-[0.98]"
                  aria-label={t('close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{poi.category}</span>
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{poi.duration}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">{t('rating', { score: `${poi.rating}/5` })}</span>
              </div>

              <section className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="font-display font-bold text-slate-900">{t('freeText')}</h3>
                <p className="mt-2 max-h-36 overflow-y-auto pr-1 text-sm leading-7 text-slate-600 hide-scrollbar">{localizedContent.description}</p>
              </section>

              <button
                type="button"
                onClick={() => setShowQr((value) => !value)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition duration-150 ease-out hover:bg-slate-50 active:scale-[0.98]"
              >
                <QrCode size={18} />
                {showQr ? t('hideQr') : t('showQr')}
              </button>

              {showQr && (
                <section className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <div className="mx-auto w-fit rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
                    <QRCodeSVG value={qrTarget} size={172} level="M" includeMargin={false} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-900">{t('scanToOpen', { name: poi.title })}</p>
                  <p className="mt-1 text-xs text-slate-500">{t('qrTracking')}</p>
                </section>
              )}

              <section className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-teal-600">AI Audio</p>
                    <h3 className="font-display font-bold text-slate-900">{audioLocked ? t('audioPremium') : t('readyToPlay')}</h3>
                  </div>
                  {audioLocked ? <Lock className="text-slate-400" size={22} /> : <Volume2 className="text-teal-600" size={22} />}
                </div>

                {!audioLocked ? (
                  <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                    <AudioVisualizer active={currentPoiId === poi.id && isPlaying} />
                    {poi.isInsideRadius && (
                      <p className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-center text-xs font-bold text-orange-600">
                        {t('insideRadius')}
                      </p>
                    )}
                    <button
                      type="button"
                      data-testid="replay-audio"
                      onClick={handleReplay}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition duration-150 ease-out hover:bg-teal-700 active:scale-[0.98]"
                    >
                      <RefreshCw size={18} />
                      {poi.isInsideRadius ? 'Phát lại' : t('replay')}
                    </button>
                    <p className="mt-3 text-center text-xs font-semibold text-slate-500">{t('browserTts')}: {getLanguageMeta().name}</p>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <AudioVisualizer locked />
                    <div data-testid="audio-locked-state" className="absolute inset-0 grid place-items-center bg-slate-100/80 px-5 text-center backdrop-blur-[2px]">
                      <div>
                        <Lock className="mx-auto text-orange-500" size={24} />
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {!isPremium && freeListensRemaining === 0
                            ? '🔒 Đã hết 2 lượt nghe miễn phí'
                            : t('textOnly')}
                        </p>
                        {!isPremium && freeListensRemaining === 0 && (
                          <p className="mt-1 text-xs text-orange-600">Mở khóa Premium để nghe không giới hạn 24h</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="unlock-audio"
                      onClick={onUpgrade}
                      className="relative z-10 mt-20 w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition duration-150 ease-out hover:bg-orange-600 active:scale-[0.98]"
                    >
                      🔓 Mở khóa toàn bộ Audio – 30.000 VND
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
