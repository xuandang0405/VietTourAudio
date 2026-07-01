import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Send, MessageSquare, Loader2, Clock, CheckCircle } from 'lucide-react';
import { vendorApiClient } from '../../../vendor/api/vendorApi';

export function VendorSupport() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await vendorApiClient.get('/tickets');
      const data = res.data?.data ?? res.data ?? [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load vendor tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;

    try {
      setSubmitting(true);
      setNotice({ type: '', text: '' });
      await vendorApiClient.post('/tickets', {
        subject: form.subject.trim(),
        message: form.message.trim()
      });
      setForm({ subject: '', message: '' });
      setNotice({ type: 'success', text: 'Gửi ticket hỗ trợ thành công! Ban quản trị sẽ phản hồi sớm nhất.' });
      loadTickets();
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message ?? err.response?.data?.error ?? 'Gửi ticket thất bại, vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <HelpCircle className="text-teal-600" size={26} />
          Hỗ trợ & Gửi Ticket
        </h2>
        <p className="mt-1 text-slate-500">Gửi phản hồi, yêu cầu hỗ trợ hoặc báo cáo lỗi kỹ thuật trực tiếp tới Ban quản trị hệ thống.</p>
      </header>

      {notice.text && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
          notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
        }`}>
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column: Form Card */}
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-2">
              <MessageSquare size={18} className="text-teal-600" />
              Tạo Yêu Cầu Hỗ Trợ
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Tiêu đề yêu cầu</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Ví dụ: Lỗi thanh toán, Cập nhật sạp..."
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-teal-500 transition focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Nội dung chi tiết</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Mô tả cụ thể vấn đề hoặc câu hỏi của bạn..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-teal-500 transition focus:bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !form.subject.trim() || !form.message.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-50 active:scale-[0.98] cursor-pointer"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu'}
            </button>
          </form>
        </div>

        {/* Right Column: Ticket List */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-4">
              <Clock size={18} className="text-teal-600" />
              Lịch sử Yêu cầu hỗ trợ
            </h3>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-teal-600" />
                <span className="text-xs font-bold">Đang tải lịch sử ticket...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                <MessageSquare size={36} className="text-slate-300 mb-2" />
                <span className="text-sm font-bold">Bạn chưa gửi yêu cầu hỗ trợ nào.</span>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-3 pl-2">Tiêu đề</th>
                      <th className="pb-3">Chi tiết</th>
                      <th className="pb-3">Trạng thái</th>
                      <th className="pb-3 pr-2 text-right">Ngày gửi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} className="border-b border-slate-50 text-sm hover:bg-slate-50/50 transition">
                        <td className="py-4 pl-2 font-bold text-slate-900 max-w-[150px] truncate">{t.subject}</td>
                        <td className="py-4 text-xs font-semibold text-slate-500 max-w-[220px] truncate" title={t.message}>{t.message}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black border ${
                            t.status === 'PROCESSED' || t.status === 'CLOSED'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {t.status === 'PROCESSED' || t.status === 'CLOSED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                            {t.status === 'PROCESSED'
                              ? 'Đã xử lý'
                              : t.status === 'CLOSED'
                              ? 'Đã đóng'
                              : t.status === 'IN_PROGRESS'
                              ? 'Đang xử lý'
                              : 'Chờ xử lý'}
                          </span>
                        </td>
                        <td className="py-4 pr-2 text-right text-xs font-semibold text-slate-400 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
