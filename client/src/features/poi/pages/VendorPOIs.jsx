import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVendorPois } from '../../../vendor/api/vendorQueries';
import { requestUpdatePoi, fetchPoiProducts, createPoiProduct, updatePoiProduct, deletePoiProduct, vendorApiClient } from '../../../vendor/api/vendorApi';
import { Save, AlertCircle, Eye, CheckCircle, Clock, Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';

export function VendorPOIs() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useVendorPois();
  const pois = data?.pois ?? [];
  const poi = pois[0];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Multilingual Tabs for POI Details
  const languages = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];
  const [activeTab, setActiveTab] = useState('vi');
  const [translations, setTranslations] = useState([
    { lang: 'vi', title: '', ttsScript: '' },
    { lang: 'en', title: '', ttsScript: '' },
    { lang: 'ja', title: '', ttsScript: '' },
    { lang: 'ko', title: '', ttsScript: '' },
    { lang: 'zh', title: '', ttsScript: '' }
  ]);
  const [translating, setTranslating] = useState(false);

  // Products state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('30000');
  const [editingProdId, setEditingProdId] = useState(null);
  const [editProdPrice, setEditProdPrice] = useState('');

  // Multilingual state for Stall Products (Add / Edit)
  const [prodActiveTab, setProdActiveTab] = useState('vi');
  const [newProdTranslations, setNewProdTranslations] = useState([
    { lang: 'vi', title: '' },
    { lang: 'en', title: '' },
    { lang: 'ja', title: '' },
    { lang: 'ko', title: '' },
    { lang: 'zh', title: '' }
  ]);
  const [translatingProd, setTranslatingProd] = useState(false);

  const [editProdActiveTab, setEditProdActiveTab] = useState('vi');
  const [editProdTranslations, setEditProdTranslations] = useState([
    { lang: 'vi', title: '' },
    { lang: 'en', title: '' },
    { lang: 'ja', title: '' },
    { lang: 'ko', title: '' },
    { lang: 'zh', title: '' }
  ]);
  const [translatingEditProd, setTranslatingEditProd] = useState(false);

  useEffect(() => {
    if (poi) {
      // Initialize with pending changes if available, otherwise current values
      setName(poi.pendingName ?? poi.name ?? '');
      setDescription(poi.pendingDescription ?? poi.description ?? '');
      setImageUrl(poi.pendingCoverImageUrl ?? poi.imageUrl ?? '');

      setTranslations([
        { lang: 'vi', title: poi.pendingName ?? poi.name ?? '', ttsScript: poi.pendingDescription ?? poi.description ?? '' },
        { lang: 'en', title: poi.pendingNameEn ?? poi.stallNameEn ?? poi.nameEn ?? '', ttsScript: poi.pendingDescriptionEn ?? poi.descriptionEn ?? '' },
        { lang: 'ja', title: poi.pendingNameJa ?? poi.stallNameJa ?? poi.nameJa ?? '', ttsScript: poi.pendingDescriptionJa ?? poi.descriptionJa ?? '' },
        { lang: 'ko', title: poi.pendingNameKo ?? poi.stallNameKo ?? poi.nameKo ?? '', ttsScript: poi.pendingDescriptionKo ?? poi.descriptionKo ?? '' },
        { lang: 'zh', title: poi.pendingNameZh ?? poi.stallNameZh ?? poi.nameZh ?? '', ttsScript: poi.pendingDescriptionZh ?? poi.descriptionZh ?? '' }
      ]);
    }
  }, [poi]);

  useEffect(() => {
    if (poi?.id) {
      setLoadingProducts(true);
      fetchPoiProducts(poi.id)
        .then((res) => setProducts(res.products ?? []))
        .catch((err) => console.error('Failed to load products:', err))
        .finally(() => setLoadingProducts(false));
    }
  }, [poi?.id]);

  // Sync title changes for the active POI translation tab
  const currentTranslation = translations.find((t) => t.lang === activeTab) || {
    lang: activeTab,
    title: '',
    ttsScript: '',
  };

  const handleTitleChange = (val) => {
    if (activeTab === 'vi') {
      setName(val);
    }
    setTranslations((prev) =>
      prev.map((t) => (t.lang === activeTab ? { ...t, title: val } : t))
    );
  };

  const handleTtsScriptChange = (val) => {
    if (activeTab === 'vi') {
      setDescription(val);
    }
    setTranslations((prev) =>
      prev.map((t) => (t.lang === activeTab ? { ...t, ttsScript: val } : t))
    );
  };

  const handleAutoTranslateThisLang = async () => {
    const viTrans = translations.find((tr) => tr.lang === 'vi');
    if (!viTrans || (!viTrans.title.trim() && !viTrans.ttsScript.trim())) {
      alert("Vui lòng điền tên và mô tả tiếng Việt trước khi dịch.");
      return;
    }
    setTranslating(true);
    try {
      let updatedTitle = currentTranslation.title;
      let updatedTts = currentTranslation.ttsScript;

      if (viTrans.title.trim()) {
        const titleRes = await vendorApiClient.post('/translate', {
          text: viTrans.title,
          targetLangs: [activeTab]
        });
        const resData = titleRes.data?.data ?? titleRes.data ?? {};
        if (resData[activeTab]) {
          updatedTitle = resData[activeTab];
        }
      }

      if (viTrans.ttsScript.trim()) {
        const ttsRes = await vendorApiClient.post('/translate', {
          text: viTrans.ttsScript,
          targetLangs: [activeTab]
        });
        const resData = ttsRes.data?.data ?? ttsRes.data ?? {};
        if (resData[activeTab]) {
          updatedTts = resData[activeTab];
        }
      }

      setTranslations((prev) =>
        prev.map((tr) =>
          tr.lang === activeTab ? { ...tr, title: updatedTitle, ttsScript: updatedTts } : tr
        )
      );
    } catch (err) {
      console.error(err);
      alert("Lỗi khi dịch tự động.");
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const viTrans = translations.find(t => t.lang === 'vi') || { title: name, ttsScript: description };
      await requestUpdatePoi({
        id: poi.id,
        stallName: viTrans.title.trim(),
        description: viTrans.ttsScript.trim(),
        imageUrl: imageUrl.trim(),
        latitude: poi.latitude || 0,
        longitude: poi.longitude || 0,
        
        stallNameEn: translations.find(t => t.lang === 'en')?.title || '',
        stallNameJa: translations.find(t => t.lang === 'ja')?.title || '',
        stallNameKo: translations.find(t => t.lang === 'ko')?.title || '',
        stallNameZh: translations.find(t => t.lang === 'zh')?.title || '',
        
        descriptionEn: translations.find(t => t.lang === 'en')?.ttsScript || '',
        descriptionJa: translations.find(t => t.lang === 'ja')?.ttsScript || '',
        descriptionKo: translations.find(t => t.lang === 'ko')?.ttsScript || '',
        descriptionZh: translations.find(t => t.lang === 'zh')?.ttsScript || ''
      });
      setSubmitSuccess(true);
      refetch();
    } catch (err) {
      setSubmitError(err.response?.data?.error ?? t('poi.update_error', { defaultValue: 'Có lỗi xảy ra khi cập nhật.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Stall Products Translation logic ---
  const currentNewProdTranslation = newProdTranslations.find((t) => t.lang === prodActiveTab) || {
    lang: prodActiveTab,
    title: '',
  };

  const handleNewProdTitleChange = (val) => {
    if (prodActiveTab === 'vi') {
      setNewProdName(val);
    }
    setNewProdTranslations((prev) =>
      prev.map((t) => (t.lang === prodActiveTab ? { ...t, title: val } : t))
    );
  };

  const handleAutoTranslateProduct = async () => {
    const viName = newProdTranslations.find(t => t.lang === 'vi')?.title || newProdName;
    if (!viName.trim()) {
      alert("Vui lòng điền tên sản phẩm tiếng Việt trước.");
      return;
    }
    setTranslatingProd(true);
    try {
      const res = await vendorApiClient.post('/translate', {
        text: viName,
        targetLangs: ['en', 'ja', 'ko', 'zh']
      });
      const data = res.data?.data ?? res.data ?? {};
      setNewProdTranslations((prev) =>
        prev.map((t) => {
          if (t.lang === 'vi') return t;
          return { ...t, title: data[t.lang] ?? t.title };
        })
      );
    } catch (err) {
      console.error(err);
      alert("Lỗi khi dịch tự động sản phẩm.");
    } finally {
      setTranslatingProd(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const viName = newProdTranslations.find(t => t.lang === 'vi')?.title || newProdName;
    if (!viName.trim() || !newProdPrice) return;
    try {
      await createPoiProduct(poi.id, {
        name: viName.trim(),
        price: Number(newProdPrice),
        nameEn: newProdTranslations.find(t => t.lang === 'en')?.title || '',
        nameJa: newProdTranslations.find(t => t.lang === 'ja')?.title || '',
        nameKo: newProdTranslations.find(t => t.lang === 'ko')?.title || '',
        nameZh: newProdTranslations.find(t => t.lang === 'zh')?.title || ''
      });
      const refreshed = await fetchPoiProducts(poi.id);
      setProducts(refreshed.products ?? []);
      setNewProdName('');
      setNewProdTranslations([
        { lang: 'vi', title: '' },
        { lang: 'en', title: '' },
        { lang: 'ja', title: '' },
        { lang: 'ko', title: '' },
        { lang: 'zh', title: '' }
      ]);
    } catch (err) {
      alert(t('poi.product_add_error'));
    }
  };

  const handleStartEdit = (prod) => {
    setEditingProdId(prod.id);
    setEditProdPrice(String(prod.price));
    setEditProdActiveTab('vi');
    setEditProdTranslations([
      { lang: 'vi', title: prod.name ?? '' },
      { lang: 'en', title: prod.nameEn ?? '' },
      { lang: 'ja', title: prod.nameJa ?? '' },
      { lang: 'ko', title: prod.nameKo ?? '' },
      { lang: 'zh', title: prod.nameZh ?? '' }
    ]);
  };

  const currentEditProdTranslation = editProdTranslations.find((t) => t.lang === editProdActiveTab) || {
    lang: editProdActiveTab,
    title: '',
  };

  const handleEditProdTitleChange = (val) => {
    setEditProdTranslations((prev) =>
      prev.map((t) => (t.lang === editProdActiveTab ? { ...t, title: val } : t))
    );
  };

  const handleAutoTranslateEditProduct = async () => {
    const viName = editProdTranslations.find(t => t.lang === 'vi')?.title;
    if (!viName.trim()) {
      alert("Vui lòng điền tên sản phẩm tiếng Việt trước.");
      return;
    }
    setTranslatingEditProd(true);
    try {
      const res = await vendorApiClient.post('/translate', {
        text: viName,
        targetLangs: ['en', 'ja', 'ko', 'zh']
      });
      const data = res.data?.data ?? res.data ?? {};
      setEditProdTranslations((prev) =>
        prev.map((t) => {
          if (t.lang === 'vi') return t;
          return { ...t, title: data[t.lang] ?? t.title };
        })
      );
    } catch (err) {
      console.error(err);
      alert("Lỗi khi dịch tự động sản phẩm.");
    } finally {
      setTranslatingEditProd(false);
    }
  };

  const handleUpdateProduct = async (productId) => {
    const viName = editProdTranslations.find(t => t.lang === 'vi')?.title;
    if (!viName.trim() || !editProdPrice) return;
    try {
      await updatePoiProduct(poi.id, productId, {
        name: viName.trim(),
        price: Number(editProdPrice),
        nameEn: editProdTranslations.find(t => t.lang === 'en')?.title || '',
        nameJa: editProdTranslations.find(t => t.lang === 'ja')?.title || '',
        nameKo: editProdTranslations.find(t => t.lang === 'ko')?.title || '',
        nameZh: editProdTranslations.find(t => t.lang === 'zh')?.title || ''
      });
      const refreshed = await fetchPoiProducts(poi.id);
      setProducts(refreshed.products ?? []);
      setEditingProdId(null);
    } catch (err) {
      alert(t('poi.product_update_error'));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(t('poi.product_delete_confirm'))) return;
    try {
      await deletePoiProduct(poi.id, productId);
      const refreshed = await fetchPoiProducts(poi.id);
      setProducts(refreshed.products ?? []);
    } catch (err) {
      alert(t('poi.product_delete_error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !poi) {
    return (
      <div className="max-w-xl mx-auto mt-8 text-center bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
        <h2 className="text-xl font-bold text-slate-900">{t('poi.no_poi_title', { defaultValue: 'Không tìm thấy POI' })}</h2>
        <p className="text-slate-500 mt-2">
          {error?.response?.data?.error ?? t('poi.no_poi_assigned', { defaultValue: 'Không tìm thấy điểm thuyết minh nào được gán cho tài khoản của bạn.' })}
        </p>
      </div>
    );
  }

  const isPending = poi.approvalStatus === 'PENDING';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">{t('poi.profile_title', { defaultValue: 'Hồ sơ điểm thuyết minh (POI)' })}</h1>
        <p className="text-slate-500 mt-1">{t('poi.profile_desc', { defaultValue: 'Chỉnh sửa thông tin giới thiệu, hình ảnh của điểm tham quan của bạn.' })}</p>
      </header>

      {/* Banner Trạng Thái */}
      {isPending && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-amber-800 shadow-sm">
          <Clock className="mt-0.5 text-amber-600 shrink-0" size={20} />
          <div>
            <h3 className="font-bold text-amber-900">{t('poi.pending_status_title', { defaultValue: 'Chỉnh sửa của bạn đang chờ phê duyệt' })}</h3>
            <p className="text-sm text-amber-700 mt-1">
              {t('poi.pending_status_desc', { defaultValue: 'Thay đổi đã được gửi lên hệ thống và đang chờ admin duyệt. Bạn vẫn có thể cập nhật tiếp.' })}
            </p>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 flex items-start gap-3 text-green-800 shadow-sm animate-fade-in">
          <CheckCircle className="mt-0.5 text-green-600 shrink-0" size={20} />
          <div>
            <h3 className="font-bold text-green-900">{t('poi.update_success_title', { defaultValue: 'Gửi yêu cầu chỉnh sửa thành công' })}</h3>
            <p className="text-sm text-green-700 mt-1">
              {t('poi.update_success', { defaultValue: 'Yêu cầu cập nhật POI đã được gửi lên hệ thống và đang chờ admin phê duyệt!' })}
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-800 shadow-sm">
          <AlertCircle className="mt-0.5 text-red-600 shrink-0" size={20} />
          <div>
            <h3 className="font-bold text-red-900">{t('poi.update_failed_title', { defaultValue: 'Cập nhật thất bại' })}</h3>
            <p className="text-sm text-red-700 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Chỉnh Sửa (Chiếm 2 cột) */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Multilingual Tabs */}
            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {languages.map((lang) => {
                const isActive = activeTab === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setActiveTab(lang.code)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition-all ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label htmlFor="poi-name" className="block text-sm font-bold text-slate-700 mb-2">
                {t('poi.name_label', { defaultValue: 'Tên điểm tham quan' })} ({languages.find((l) => l.code === activeTab)?.flag} {activeTab.toUpperCase()})
              </label>
              <input
                id="poi-name"
                type="text"
                required
                value={currentTranslation.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t('poi.name_placeholder', { defaultValue: 'Nhập tên điểm tham quan...' })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label htmlFor="poi-image" className="block text-sm font-bold text-slate-700 mb-2">
                {t('poi.image_label', { defaultValue: 'Liên kết ảnh bìa (Cover Image URL)' })}
              </label>
              <input
                id="poi-image"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t('poi.image_placeholder', { defaultValue: 'Nhập URL hình ảnh (ví dụ: https://images.unsplash.com/...)' })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label htmlFor="poi-desc" className="block text-sm font-bold text-slate-700 mb-2">
                {t('poi.desc_label', { defaultValue: 'Mô tả chi tiết' })} ({languages.find((l) => l.code === activeTab)?.flag} {activeTab.toUpperCase()})
              </label>
              <textarea
                id="poi-desc"
                rows={6}
                value={currentTranslation.ttsScript}
                onChange={(e) => handleTtsScriptChange(e.target.value)}
                placeholder={t('poi.desc_placeholder', { defaultValue: 'Nhập nội dung thuyết minh hoặc mô tả chi tiết...' })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition resize-none leading-relaxed"
              />
            </div>

            {activeTab !== 'vi' && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAutoTranslateThisLang}
                  disabled={translating}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {translating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang dịch...</span>
                    </>
                  ) : (
                    <span>Auto-Translate (Dịch tự động)</span>
                  )}
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save size={18} />
                {isSubmitting ? t('poi.saving', { defaultValue: 'Đang lưu...' }) : t('poi.save_changes', { defaultValue: 'Lưu thay đổi & Gửi duyệt' })}
              </button>
            </div>
          </form>
        </div>

        {/* Xem Trước (Chiếm 1 cột) */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Eye size={18} className="text-slate-500" />
            {t('poi.preview_title', { defaultValue: 'Bản xem trước trực quan' })}
          </h2>

          <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100">
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name || t('poi.preview_title')}
                  className="w-full h-full object-cover transition duration-300"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=600&auto=format&fit=crop&q=60';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                  {t('poi.no_image', { defaultValue: 'Chưa có ảnh bìa' })}
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                  isPending
                    ? 'bg-amber-500 text-white'
                    : 'bg-green-600 text-white'
                }`}>
                  {isPending
                    ? t('poi.status_pending', { defaultValue: 'Đang chờ duyệt' })
                    : t('poi.status_approved', { defaultValue: 'Công khai' })}
                </span>
              </div>
            </div>

            <div className="p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                {poi.stallName || t('common.stall', { defaultValue: 'Sạp' })}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1 line-clamp-1">
                {name || t('poi.untitled', { defaultValue: 'Chưa đặt tên' })}
              </h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-4 leading-relaxed">
                {description || t('poi.no_description_preview', { defaultValue: 'Chưa có nội dung mô tả chi tiết được thiết lập.' })}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{t('poi.poi_id')}: #{poi.id}</span>
                <span>{poi.isPremiumContent ? t('poi.premium_content') : t('poi.free_content')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Catalog Section */}
      <div className="mt-8 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">{t('poi.products_catalog', { defaultValue: 'Danh mục sản phẩm của sạp' })}</h2>
            <p className="text-xs text-slate-500 mt-1">{t('poi.products_catalog_desc', { defaultValue: 'Sản phẩm và giá tiền hiển thị trực tiếp cho khách mua trên thiết bị di động.' })}</p>
          </div>
        </div>

        {/* Product Add Languages Tabs Selector */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 mb-3 max-w-xl">
          {languages.map((lang) => {
            const isActive = prodActiveTab === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setProdActiveTab(lang.code)}
                className={`flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] font-black transition-all rounded-lg ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.code.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Add Product Form */}
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-[1fr_200px_auto] gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              required={prodActiveTab === 'vi'}
              value={currentNewProdTranslation.title}
              onChange={(e) => handleNewProdTitleChange(e.target.value)}
              placeholder={`${t('poi.new_product_name', { defaultValue: 'Tên sản phẩm' })} (${languages.find(l => l.code === prodActiveTab)?.flag} ${prodActiveTab.toUpperCase()})`}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
            {prodActiveTab !== 'vi' && (
              <button
                type="button"
                onClick={handleAutoTranslateProduct}
                disabled={translatingProd}
                className="self-end text-[10px] font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {translatingProd ? <Loader2 size={10} className="animate-spin" /> : null}
                <span>Auto-Translate (Dịch tự động)</span>
              </button>
            )}
          </div>
          <input
            type="number"
            required
            value={newProdPrice}
            onChange={(e) => setNewProdPrice(e.target.value)}
            placeholder={t('poi.new_product_price', { defaultValue: 'Giá tiền (VND)' })}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition h-[38px] self-start"
          />
          <button
            type="submit"
            className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-4 transition active:scale-[0.98] cursor-pointer"
          >
            <Plus size={14} />
            {t('common.add', { defaultValue: 'Thêm' })}
          </button>
        </form>

        {/* Products List Table */}
        {loadingProducts ? (
          <div className="text-center py-6 text-xs text-slate-500 font-bold">{t('common.loading', { defaultValue: 'Đang tải...' })}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">{t('poi.product_name', { defaultValue: 'Tên sản phẩm' })}</th>
                  <th className="p-3">{t('poi.product_price', { defaultValue: 'Giá bán' })}</th>
                  <th className="p-3 text-center w-28">{t('common.actions', { defaultValue: 'Hành động' })}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod, idx) => (
                  <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50 transition text-xs font-semibold">
                    <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      {editingProdId === prod.id ? (
                        <div className="flex flex-col gap-1.5">
                          {/* Language selector for inline editing */}
                          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg max-w-xs">
                            {languages.map((l) => (
                              <button
                                key={l.code}
                                type="button"
                                onClick={() => setEditProdActiveTab(l.code)}
                                className={`flex-1 py-1 text-[9px] font-bold rounded ${
                                  editProdActiveTab === l.code ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                                }`}
                              >
                                {l.code.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={currentEditProdTranslation.title}
                              onChange={(e) => handleEditProdTitleChange(e.target.value)}
                              placeholder={`Tên (${editProdActiveTab.toUpperCase()})`}
                              className="px-2 py-1 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
                            />
                            {editProdActiveTab !== 'vi' && (
                              <button
                                type="button"
                                onClick={handleAutoTranslateEditProduct}
                                disabled={translatingEditProd}
                                className="px-2 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 text-[10px] whitespace-nowrap cursor-pointer"
                                title="Auto-Translate"
                              >
                                {translatingEditProd ? '...' : 'Dịch'}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800">{prod.name}</span>
                          {prod.nameEn && <span className="text-[10px] text-slate-400">EN: {prod.nameEn}</span>}
                          {prod.nameJa && <span className="text-[10px] text-slate-400">JA: {prod.nameJa}</span>}
                          {prod.nameKo && <span className="text-[10px] text-slate-400">KO: {prod.nameKo}</span>}
                          {prod.nameZh && <span className="text-[10px] text-slate-400">ZH: {prod.nameZh}</span>}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {editingProdId === prod.id ? (
                        <input
                          type="number"
                          value={editProdPrice}
                          onChange={(e) => setEditProdPrice(e.target.value)}
                          className="px-2 py-1 border border-slate-200 rounded-lg w-32 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white h-[32px] mt-6"
                        />
                      ) : (
                        <span className="font-extrabold text-teal-600">{Number(prod.price).toLocaleString()} VND</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {editingProdId === prod.id ? (
                        <div className="flex justify-center gap-1.5 mt-6">
                          <button
                            type="button"
                            onClick={() => handleUpdateProduct(prod.id)}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProdId(null)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(prod)}
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-slate-400 font-bold">
                      {t('poi.no_products', { defaultValue: 'Sạp chưa đăng ký sản phẩm nào.' })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
