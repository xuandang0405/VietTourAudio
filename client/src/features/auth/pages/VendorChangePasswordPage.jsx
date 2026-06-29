import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeVendorPassword } from '../../../vendor/api/vendorApi';
import { useVendorAuthStore } from '../../../vendor/store/vendorAuthStore';

export function VendorChangePasswordPage() {
  const navigate = useNavigate();
  const setSession = useVendorAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (form.newPassword.length < 10 || form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu mới phải có ít nhất 10 ký tự và hai ô phải trùng nhau.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const refreshedSession = await changeVendorPassword(form.currentPassword, form.newPassword);
      setSession(refreshedSession);
      navigate('/vendor', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Không thể đổi mật khẩu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <KeyRound className="text-teal-600" />
        <h1 className="mt-4 text-2xl font-black text-slate-900">Đổi mật khẩu tạm</h1>
        <p className="mt-2 text-sm text-slate-500">Bạn phải đặt mật khẩu riêng trước khi sử dụng cổng Vendor.</p>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {[
          ['currentPassword', 'Mật khẩu tạm hiện tại'],
          ['newPassword', 'Mật khẩu mới'],
          ['confirmPassword', 'Nhập lại mật khẩu mới']
        ].map(([key, label]) => (
          <label key={key} className="mt-4 block text-sm font-bold text-slate-700">
            {label}
            <input
              type="password"
              required
              minLength={key === 'currentPassword' ? 1 : 10}
              value={form[key]}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-teal-500"
            />
          </label>
        ))}
        <button disabled={saving} className="mt-5 h-11 w-full rounded-xl bg-teal-600 font-black text-white disabled:opacity-50">
          {saving ? 'Đang cập nhật...' : 'Đổi mật khẩu và tiếp tục'}
        </button>
      </form>
    </main>
  );
}
