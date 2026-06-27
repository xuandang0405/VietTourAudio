import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Lock, Navigation, QrCode, RefreshCw, Volume2, X } from 'lucide-react';
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { appConfig } from '../../../config/appConfig';
import { getLocalizedPoiContent } from '../../../data/visitorPois';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '../../geofence-audio/stores/audioStore';
import { useLanguageStore } from '../../../stores/languageStore';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';
import { AudioVisualizer } from '../../geofence-audio/components/AudioVisualizer';

export function PoiBottomSheet({
  poi,
  selectedStall,
  onClose,
  onUpgrade,
  onToast,
  routingCoordinates,
  routingInfo,
  onGetDirections,
  onClearDirections
}) {
  const { t } = useTranslation();
  const activeStallName = poi?.stall_name || selectedStall?.name || t('common.unknown_stall');
  const activeStallDescription = poi?.stall_description || selectedStall?.description || t('landing.no_description');
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  const stallId = poi?.stallId || selectedStall?.id;
  const isFav = stallId ? isFavorite(stallId) : false;

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} ${t('common.km', { defaultValue: 'km' })}`;
    }
    return `${Math.round(meters)} ${t('common.m', { defaultValue: 'm' })}`;
  };

  const formatDuration = (seconds) => {
    const mins = Math.round(seconds / 60);
    if (mins < 1) return `1 ${t('common.minute', { defaultValue: 'phút' })}`;
    return `${mins} ${t('common.minute', { defaultValue: 'phút' })}`;
  };
  const [showQr, setShowQr] = useState(false);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);
  const currentPoiId = useAudioStore((state) => state.currentPoiId);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const replayPoi = useAudioStore((state) => state.replayPoi);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const getLanguageMeta = useLanguageStore((state) => state.getLanguageMeta);
  // BẢN GỐC ĐÃ BỎ KHÓA PREMIUM: LUÔN CHO PHÉP NGHE MIỄN PHÍ
  const audioLocked = false;
  const localizedContent = getLocalizedPoiContent(poi, currentLanguage);
  const qrTarget = poi
    ? `${appConfig.publicAppUrl}/map?poi=${encodeURIComponent(poi.id)}&source=qr&qr=${poi.qrCodeId ?? poi.apiId}`
    : '';

  function handleReplay() {
    if (!poi) return;
    const played = replayPoi(poi, getLanguageMeta());
    onToast?.(played ? t('landing.playingAgain') : t('landing.cannotPlay'));
  }

  return (
    <AnimatePresence>
      {poi && (
        <>
          <motion.button
            type="button"
            aria-label={t('landing.close')}
            className="fixed inset-0 z-20 pointer-events-auto bg-slate-900/40 backdrop-blur-[2px]"
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
            style={{ zIndex: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.22 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 650) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-30 max-h-[84%] pointer-events-auto overflow-hidden rounded-t-3xl border-t border-slate-200 bg-white text-slate-900 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pc:left-[calc(50%-260px)] pc:right-auto pc:w-[520px]"
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="max-h-[calc(84vh-1rem)] overflow-y-auto px-4 pb-6 pt-4 hide-scrollbar">
              <div className="grid grid-cols-[92px_1fr_auto] gap-3">
                <img className="h-24 w-24 rounded-xl border border-slate-100 object-cover shadow-sm" src={poi.image} alt={poi.title} loading="lazy" decoding="async" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-teal-600">{activeStallName}</p>
                  <h2 className="mt-1 font-display text-xl font-bold leading-tight text-slate-900">{poi.title}</h2>
                  <p className="mt-1 text-[11px] font-medium text-slate-400 line-clamp-2" title={activeStallDescription}>{activeStallDescription}</p>
                  <p className="mt-1 text-sm font-bold text-teal-600">{poi.distanceLabel ?? poi.distanceHint}</p>
                </div>
                 <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition duration-150 ease-out hover:bg-slate-100 hover:text-slate-800 active:scale-[0.98]"
                    aria-label={t('landing.close')}
                  >
                    <X size={20} />
                  </button>
                  {stallId && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(stallId)}
                      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 transition duration-150 ease-out hover:bg-slate-100 active:scale-[0.98]"
                      aria-label={isFav ? t('favorites_remove', { defaultValue: 'Xóa khỏi yêu thích' }) : t('favorites_add', { defaultValue: 'Thêm vào yêu thích' })}
                    >
                      <Heart size={20} className={isFav ? "text-red-500 fill-red-500" : "text-slate-400"} />
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{poi.category}</span>
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{poi.duration}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">{t('landing.rating', { score: `${poi.rating}/5` })}</span>
              </div>

              <section className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="font-display font-bold text-slate-900">{t('landing.freeText')}</h3>
                <p className="mt-2 max-h-36 overflow-y-auto pr-1 text-sm leading-7 text-slate-600 hide-scrollbar">{localizedContent.description}</p>
              </section>

              <button
                type="button"
                onClick={onGetDirections}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition duration-150 ease-out hover:bg-teal-700 active:scale-[0.98]"
              >
                <Navigation size={18} />
                {t('routing.get_directions', { defaultValue: 'Tìm đường' })}
              </button>

              {routingInfo && (
                <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-sm font-semibold text-teal-800">
                  {routingInfo.status === 'calculating' ? (
                    <p className="flex items-center gap-2">
                      <RefreshCw className="animate-spin" size={16} />
                      {t('routing.calculating', { defaultValue: 'Đang tính đường...' })}
                    </p>
                  ) : routingInfo.status === 'success' ? (
                    <div>
                      <div className="flex justify-between items-center">
                        <p>
                          {t('routing.distance', { defaultValue: 'Khoảng cách' })}: <span className="font-bold">{formatDistance(routingInfo.distance)}</span>
                          <span className="mx-2">·</span>
                          {t('routing.time', { defaultValue: 'Thời gian' })}: <span className="font-bold">{formatDuration(routingInfo.duration)}</span>
                        </p>
                        <button
                          type="button"
                          onClick={onClearDirections}
                          className="text-xs font-bold text-red-600 hover:text-red-700 underline"
                        >
                          {t('routing.clear', { defaultValue: 'Xóa' })}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600">{t('routing.error', { defaultValue: 'Không thể tìm đường.' })}</p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowQr((value) => !value)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition duration-150 ease-out hover:bg-slate-50 active:scale-[0.98]"
              >
                <QrCode size={18} />
                {showQr ? t('landing.hideQr') : t('landing.showQr')}
              </button>

              {showQr && (
                <section className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <div className="mx-auto w-fit rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
                    <QRCodeSVG value={qrTarget} size={172} level="M" includeMargin={false} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-900">{t('landing.scanToOpen', { name: poi.title })}</p>
                  <p className="mt-1 text-xs text-slate-500">{t('landing.qrTracking')}</p>
                </section>
              )}

              <section className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-teal-600">AI Audio</p>
                    <h3 className="font-display font-bold text-slate-900">{audioLocked ? t('landing.audioPremium') : t('landing.readyToPlay')}</h3>
                  </div>
                  {audioLocked ? <Lock className="text-slate-400" size={22} /> : <Volume2 className="text-teal-600" size={22} />}
                </div>

                {!audioLocked ? (
                  <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                    <AudioVisualizer active={currentPoiId === poi.id && isPlaying} />
                    {poi.isInsideRadius && (
                      <p className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-center text-xs font-bold text-orange-600">
                        {t('landing.insideRadius')}
                      </p>
                    )}
                    <button
                      type="button"
                      data-testid="replay-audio"
                      onClick={handleReplay}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition duration-150 ease-out hover:bg-teal-700 active:scale-[0.98]"
                    >
                      <RefreshCw size={18} />
                      {poi.isInsideRadius ? t('landing.replay', { defaultValue: 'Phát lại' }) : t('landing.replay')}
                    </button>
                    <p className="mt-3 text-center text-xs font-semibold text-slate-500">{t('landing.browserTts')}: {getLanguageMeta().name}</p>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <AudioVisualizer locked />
                    <div data-testid="audio-locked-state" className="absolute inset-0 grid place-items-center bg-slate-100/80 px-5 text-center backdrop-blur-[2px]">
                      <div>
                        <Lock className="mx-auto text-orange-500" size={24} />
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {!isPremium && freeListensRemaining === 0
                            ? t('landing.audioLockedFree', { defaultValue: '🔒 Đã hết lượt nghe miễn phí' })
                            : t('landing.textOnly')}
                        </p>
                        {!isPremium && freeListensRemaining === 0 && (
                          <p className="mt-1 text-xs text-orange-600">{t('landing.unlockPremium24h', { defaultValue: 'Mở khóa Premium để nghe không giới hạn 24h' })}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="unlock-audio"
                      onClick={onUpgrade}
                      className="relative z-10 mt-20 w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition duration-150 ease-out hover:bg-orange-600 active:scale-[0.98]"
                    >
                      {t('landing.upgradePremium', { defaultValue: '🔓 Mở khóa toàn bộ Audio – 30.000 VND' })}
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
