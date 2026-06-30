import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Compass, Globe, MapPinned, ScanLine, ChevronRight, Mail, Send, Check, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo/logo.png';
import { useTranslation } from 'react-i18next';
import { languages, useLanguageStore } from '../../../stores/languageStore';
import { useLocationStore } from '../../geofence-audio/stores/locationStore';
import { usePremiumStore } from '../../vendor-wallet/stores/premiumStore';
import { QrCameraScanner } from '../components/QrCameraScanner';
import { apiClient } from '../../../services/apiClient';
import { appConfig } from '../../../config/appConfig';

export function LandingPage({ onToast, onUpgrade }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const freeListensRemaining = usePremiumStore((state) => state.freeListensRemaining);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [showScanner, setShowScanner] = useState(false);
  const [zoneCodeInput, setZoneCodeInput] = useState('');

  // Live active locations
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(true);

  // Ticket modal form
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError, setSupportError] = useState('');

  // Redirect if locked to a zone
  useEffect(() => {
    const lockedZone = localStorage.getItem('locked_zone');
    if (lockedZone) {
      navigate(`/map?zone=${lockedZone}`, { replace: true });
    }
  }, [navigate]);

  // Fetch active tours from DB
  useEffect(() => {
    let active = true;
    setToursLoading(true);
    apiClient.get(`/guest/tours?lang=${i18n.language}`)
      .then(res => {
        if (!active) return;
        const data = res.data?.data ?? res.data ?? [];
        setTours(data);
        setToursLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tours:', err);
        if (active) setToursLoading(false);
      });
    return () => { active = false; };
  }, [i18n.language]);

  // Handle i18next language switch
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  function handleQrResult(rawValue) {
    setShowScanner(false);
    try {
      const url = new URL(rawValue);
      const zoneMatch = url.pathname.match(/\/zone\/([^/?#]+)/);
      if (zoneMatch) {
        navigate(`/zone/${zoneMatch[1]}`);
        return;
      }
    } catch {
      // Not a URL, treat as zone code
    }
    const code = rawValue.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code) navigate(`/zone/${code}`);
  }

  function handleZoneCodeSubmit(e) {
    e.preventDefault();
    const code = zoneCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) return;
    navigate(`/zone/${code}`);
  }

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSupportError('');
    setSupportSuccess(false);

    if (!supportEmail.trim() || !supportSubject.trim() || !supportMessage.trim()) {
      setSupportError(t('support.error_fields_required', { defaultValue: 'Vui lòng điền đầy đủ các trường.' }));
      return;
    }

    setSupportLoading(true);
    try {
      await apiClient.post('/guest/tickets', {
        email: supportEmail.trim(),
        subject: supportSubject.trim(),
        message: supportMessage.trim()
      });
      setSupportSuccess(true);
      setSupportEmail('');
      setSupportSubject('');
      setSupportMessage('');
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error sending ticket:', err);
      setSupportError(t('support.error_failed', { defaultValue: 'Gửi yêu cầu thất bại. Vui lòng thử lại.' }));
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full bg-slate-50 font-body text-slate-800">
      {/* GLOBAL HEADER */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="VietTourAudio" className="h-10 w-10 rounded-xl shadow-sm" />
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">VietTourAudio</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Premium Badge */}
          {!isPremium && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700">
              {freeListensRemaining > 0
                ? t('landing.free_listens', { count: freeListensRemaining })
                : t('landing.out_of_listens')}
              {freeListensRemaining === 0 && (
                <button
                  type="button"
                  onClick={() => onUpgrade?.()}
                  className="ml-2 rounded-full bg-orange-600 px-2 py-0.5 text-white hover:bg-orange-700 transition"
                >
                  {t('landing.unlock')}
                </button>
              )}
            </div>
          )}
          {isPremium && (
             <div className="hidden sm:flex items-center gap-2 rounded-full border border-teal-200 bg-teal-100 px-3 py-1.5 text-xs font-bold text-teal-800">
               {t('landing.premium_active')}
             </div>
          )}

          {/* Language Selector */}
          <div className="relative flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
            <Globe size={16} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <select
              value={currentLanguage}
              onChange={handleLanguageChange}
              className="appearance-none bg-transparent pl-8 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* TWO COLUMNS */}
      <div className="flex flex-1 w-full pt-20 md:pt-0">
        {/* LEFT COLUMN: ACTION AREA */}
        <div className="flex w-full md:w-1/2 flex-col items-center justify-center p-6 md:p-12 lg:p-16">
          <div className="w-full max-w-md">
            {/* Hero */}
            <div className="mb-8 text-center md:text-left">
              <h1 
                className="mb-4 text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900"
                dangerouslySetInnerHTML={{ __html: t('landing.hero_title') }}
              />
              <p className="text-lg text-slate-500">
                {t('landing.heroDescription')}
              </p>
            </div>

            {/* Premium Badge Mobile Fallback */}
            {!isPremium && (
              <div className="flex sm:hidden items-center justify-between gap-2 mb-6 rounded-xl border border-orange-200 bg-orange-100 px-4 py-3 text-sm font-bold text-orange-700">
                <span>
                  {freeListensRemaining > 0
                    ? t('landing.free_listens', { count: freeListensRemaining })
                    : t('landing.out_of_listens')}
                </span>
                {freeListensRemaining === 0 && (
                  <button
                    type="button"
                    onClick={() => onUpgrade?.()}
                    className="rounded-full bg-orange-600 px-3 py-1 text-white hover:bg-orange-700 transition"
                  >
                    {t('landing.unlock')}
                  </button>
                )}
              </div>
            )}

            {/* QR Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
              <button
                type="button"
                onClick={() => setShowScanner((v) => !v)}
                className="flex w-full min-h-[56px] items-center justify-center gap-2 rounded-xl bg-teal-600 text-white font-bold text-lg hover:bg-teal-700 transition shadow-sm active:scale-[0.98]"
              >
                {showScanner ? <Camera size={24} /> : <ScanLine size={24} />}
                {showScanner ? t('landing.close_camera') : t('landing.open_camera')}
              </button>

              <AnimatePresence>
                {showScanner && (
                  <motion.div
                    key="scanner"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 flex justify-center overflow-hidden rounded-xl"
                  >
                    <QrCameraScanner onResult={handleQrResult} onClose={() => setShowScanner(false)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="my-6 flex items-center text-slate-400 text-sm">
                <div className="flex-1 border-t border-slate-100"></div>
                <span className="px-3 font-medium">{t('landing.or')}</span>
                <div className="flex-1 border-t border-slate-100"></div>
              </div>

              <form onSubmit={handleZoneCodeSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={zoneCodeInput}
                  onChange={(e) => setZoneCodeInput(e.target.value)}
                  placeholder={t('landing.enter_code_placeholder')}
                  maxLength={60}
                  className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="submit"
                  disabled={!zoneCodeInput.trim()}
                  className="flex-shrink-0 rounded-xl bg-slate-800 px-6 py-3 font-bold text-white hover:bg-slate-900 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {t('landing.enter')}
                </button>
              </form>
            </div>

            {permissionStatus === 'denied' && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600">
                {t('landing.gpsDenied')}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DISCOVERY AREA */}
        <div className="hidden md:flex w-1/2 flex-col bg-slate-100/50 p-6 md:p-12 lg:p-16 border-l border-slate-200 overflow-y-auto">
          <div className="w-full max-w-lg mx-auto pt-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('landing.active_locations')}</h2>
            
            {toursLoading ? (
              <div className="text-slate-400 font-semibold text-center py-8">{t('common.loading', { defaultValue: 'Đang tải...' })}</div>
            ) : tours.length === 0 ? (
              <div className="text-slate-400 font-semibold text-center py-8">{t('common.no_data', { defaultValue: 'Chưa có dữ liệu' })}</div>
            ) : (
              <div className="flex flex-col gap-4">
                {tours.map((zone) => {
                  const assetServerRoot = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
                  const item = { ...zone, coverUrl: zone.coverUrl || zone.coverImage || zone.cover_image_url };
                  const finalImageUrl = item.coverUrl?.startsWith('http') ? item.coverUrl : `${assetServerRoot}${item.coverUrl || '/uploads/default-placeholder.png'}`;
                  const poiCountValue = item.poi_count ?? item.pois?.length ?? 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/zone/${item.slug}`)}
                      className="group flex items-center gap-4 rounded-xl bg-white p-3 border border-slate-100 shadow-sm transition hover:shadow-md hover:border-teal-200 cursor-pointer"
                    >
                      <img
                        src={finalImageUrl}
                        alt={item.name}
                        className="h-20 w-20 rounded-lg object-cover bg-slate-200"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {poiCountValue} {t('discovery.poi_count_label', { defaultValue: 'điểm tham quan' })}
                        </p>
                      </div>
                      <div className="pr-2 text-slate-300 group-hover:text-teal-500 transition">
                        <ChevronRight size={24} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Optional decoration/footer for the right column */}
            <div className="mt-10 p-6 rounded-2xl bg-teal-50 border border-teal-100 text-center">
              <h4 className="font-bold text-teal-800 mb-2">{t('landing.become_partner')}</h4>
              <p className="text-sm text-teal-600 mb-4">{t('landing.partner_desc')}</p>
              <button 
                onClick={() => setShowSupportModal(true)}
                className="text-sm font-bold bg-white text-teal-700 px-6 py-2.5 rounded-xl border border-teal-200 hover:bg-teal-50 transition active:scale-95 shadow-sm cursor-pointer"
              >
                {t('landing.register_now')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support Form Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSupportModal(false)}
              className="fixed inset-0 z-[1500] bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-[10%] mx-auto z-[1600] max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl md:top-[15%]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="text-teal-600" size={20} />
                  <h3 className="font-bold text-slate-950">{t('support.modal_title', { defaultValue: 'Liên hệ hỗ trợ' })}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {supportSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 rounded-full bg-green-100 p-3 text-green-600">
                    <Check size={28} />
                  </div>
                  <h4 className="font-bold text-slate-950">{t('support.success_title', { defaultValue: 'Gửi thành công!' })}</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {t('support.success_desc', { defaultValue: 'Chúng tôi sẽ phản hồi lại bạn sớm nhất.' })}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="mt-4 space-y-4">
                  {supportError && (
                    <p className="text-xs font-bold text-red-600">{supportError}</p>
                  )}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                      {t('support.form_email', { defaultValue: 'Email liên hệ' })}
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                      {t('support.form_subject', { defaultValue: 'Chủ đề' })}
                    </label>
                    <input
                      type="text"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder={t('support.form_subject_placeholder', { defaultValue: 'Đăng ký đối tác / Cần hỗ trợ...' })}
                      required
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                      {t('support.form_message', { defaultValue: 'Nội dung tin nhắn' })}
                    </label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder={t('support.form_message_placeholder', { defaultValue: 'Nhập nội dung chi tiết...' })}
                      required
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-teal-500 resize-none"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-medium text-slate-400 text-center mb-3">
                      {t('support.official_contact', { defaultValue: 'Email liên hệ chính thức: support@viettouraudio.com' })}
                    </p>
                    <button
                      type="submit"
                      disabled={supportLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      {supportLoading ? t('support.sending', { defaultValue: 'Đang gửi...' }) : (
                        <>
                          <Send size={14} />
                          {t('support.send_button', { defaultValue: 'Gửi tin nhắn' })}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
