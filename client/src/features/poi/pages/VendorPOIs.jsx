import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVendorPois } from '../../../vendor/api/vendorQueries';
import { updateVendorPoi } from '../../../vendor/api/vendorApi';
import { Save, AlertCircle, Eye, CheckCircle, Clock } from 'lucide-react';

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

  useEffect(() => {
    if (poi) {
      // Initialize with pending changes if available, otherwise current values
      setName(poi.pendingName ?? poi.name ?? '');
      setDescription(poi.pendingDescription ?? poi.description ?? '');
      setImageUrl(poi.pendingCoverImageUrl ?? poi.imageUrl ?? '');
    }
  }, [poi]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await updateVendorPoi(poi.id, {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim()
      });
      setSubmitSuccess(true);
      refetch();
    } catch (err) {
      setSubmitError(err.response?.data?.error ?? t('poi.update_error', { defaultValue: 'Có lỗi xảy ra khi cập nhật.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div>
              <label htmlFor="poi-name" className="block text-sm font-bold text-slate-700 mb-2">
                {t('poi.name_label', { defaultValue: 'Tên điểm tham quan' })}
              </label>
              <input
                id="poi-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                {t('poi.desc_label', { defaultValue: 'Mô tả chi tiết' })}
              </label>
              <textarea
                id="poi-desc"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('poi.desc_placeholder', { defaultValue: 'Nhập nội dung thuyết minh hoặc mô tả chi tiết...' })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition resize-none leading-relaxed"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
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
                  alt={name || 'POI Preview'}
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
                <span>ID POI: #{poi.id}</span>
                <span>{poi.isPremiumContent ? '★ Premium Content' : 'Free Content'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
