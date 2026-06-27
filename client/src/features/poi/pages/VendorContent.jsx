import { AlertTriangle, CheckCircle, Clock, FileText, Loader2, Lock, Send, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVendorContent, vendorQueryKeys } from '../../../vendor/api/vendorQueries';
import { submitContent } from '../../../vendor/api/vendorApi';
import { useQueryClient } from '@tanstack/react-query';

export function VendorContent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: content, isLoading, error, refetch } = useVendorContent();

  const [ttsScript, setTtsScript] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentValidationError, setContentValidationError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (content?.ttsScript) {
      setTtsScript(content.ttsScript);
    }
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-bold">{t('common.error', 'Có lỗi xảy ra')}</p>
        <p className="text-sm mt-1">{error.message || t('common.load_error')}</p>
      </div>
    );
  }

  const activeContent = content || {
    title: t('vendor_content.default_title', 'Bài giới thiệu sạp thuyết minh'),
    approvalStatus: 'approved',
    ttsScript: ''
  };

  const isPending = activeContent.approvalStatus === 'pending';

  const STATUS_CONFIG = {
    pending: {
      label: t('vendor_content.status_pending', 'Đang chờ duyệt'),
      icon: Clock,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      dotColor: 'bg-amber-400'
    },
    approved: {
      label: t('vendor_content.status_approved', 'Đã duyệt'),
      icon: CheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      dotColor: 'bg-green-400'
    },
    rejected: {
      label: t('vendor_content.status_rejected', 'Từ chối'),
      icon: XCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      dotColor: 'bg-red-400'
    }
  };

  const statusConfig = STATUS_CONFIG[activeContent.approvalStatus] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const charCount = ttsScript?.length ?? 0;

  async function handleSubmit() {
    if (charCount < 50) {
      setContentValidationError(t('vendor_content.need_more_chars_error', 'Nội dung TTS phải có ít nhất 50 ký tự để AI đọc giọng chuẩn.'));
      return;
    }

    const hasPunctuation = /[.,;:!?]/.test(ttsScript);
    if (!hasPunctuation) {
      setContentValidationError(t('vendor_content.punctuation_error', 'Vui lòng thêm dấu câu (dấu chấm, phẩy, chấm than...) để AI đọc giọng tự nhiên hơn.'));
      return;
    }

    setIsSavingContent(true);
    setContentValidationError('');
    setSubmitSuccess(false);

    try {
      await submitContent(ttsScript, 'vi');
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.content });
      refetch();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setContentValidationError(err.response?.data?.error ?? t('vendor_content.save_error', 'Không thể lưu nội dung.'));
    } finally {
      setIsSavingContent(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">{t('vendor_content.title', 'Nội dung TTS')}</h2>
        <p className="text-slate-500 mt-1">{t('vendor_content.subtitle', 'Quản lý bài thuyết minh bằng giọng nói AI.')}</p>
      </header>

      {/* TTS Warning Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-bold text-amber-800">{t('vendor_content.warning_title', 'Lưu ý khi viết nội dung')}</p>
          <p className="mt-1 text-xs text-amber-700">
            {t('vendor_content.warning_desc', 'Dùng từ ngữ mô tả chân thực, rõ ràng và đầy đủ dấu câu để AI đọc truyền cảm nhất.')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header with status badge */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{activeContent.title || t('vendor_content.default_title', 'Bài giới thiệu sạp thuyết minh')}</p>
              <p className="text-xs text-slate-500">{t('vendor_content.language_vi', 'Tiếng Việt')}</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full ${statusConfig.bg} ${statusConfig.border} border px-3 py-1.5`}>
            <span className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
            <StatusIcon size={14} className={statusConfig.text} />
            <span className={`text-xs font-bold ${statusConfig.text}`}>{statusConfig.label}</span>
          </div>
        </div>

        {/* TTS Script Editor */}
        <div className="p-5">
          <div className="relative">
            {isPending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-50/80 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
                  <Lock size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">{t('vendor_content.locked_pending', 'Đang chờ phê duyệt, không thể sửa')}</span>
                </div>
              </div>
            )}
            <textarea
              value={ttsScript}
              onChange={(e) => setTtsScript(e.target.value)}
              disabled={isPending}
              rows={12}
              placeholder={t('vendor_content.placeholder', 'Nhập mô tả giới thiệu sạp hàng của bạn tại đây...')}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          {/* Character counter & validation */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${charCount < 50 ? 'text-red-500' : 'text-slate-500'}`}>
                {charCount} {t('vendor_content.chars', 'ký tự')} {charCount < 50 ? t('vendor_content.need_more_chars', 'cần thêm {{count}} ký tự', { count: 50 - charCount }) : '✓'}
              </span>
              {activeContent.updatedAt && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-400">
                    {t('vendor_content.updated_at', 'Cập nhật')}: {new Date(activeContent.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Validation Error */}
          {contentValidationError && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
              ⚠️ {contentValidationError}
            </div>
          )}

          {/* Submit Success */}
          {submitSuccess && (
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">
              {t('vendor_content.submit_success', 'Đã gửi yêu cầu phê duyệt thành công!')}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 p-5">
          <p className="text-xs text-slate-500" dangerouslySetInnerHTML={{ __html: t('vendor_content.footer_hint', 'Dùng công cụ kiểm tra để đảm bảo đúng ngữ pháp.') }} />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSavingContent || isPending || charCount < 50}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isSavingContent ? (
              <><Loader2 size={16} className="animate-spin" /> {t('vendor_content.sending', 'Đang gửi...')}</>
            ) : (
              <><Send size={16} /> {t('vendor_content.send', 'Gửi duyệt')}</>
            )}
          </button>
        </div>
      </div>

      {/* Content Preview */}
      {activeContent.approvalStatus === 'approved' && activeContent.ttsScript && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <h3 className="text-sm font-black text-green-800 flex items-center gap-2">
            <CheckCircle size={16} />
            {t('vendor_content.approved_title', 'Nội dung thuyết minh công khai')}
          </h3>
          <p className="mt-3 text-sm leading-7 text-green-900">{activeContent.ttsScript}</p>
        </div>
      )}
    </div>
  );
}
