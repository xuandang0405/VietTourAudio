import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../../assets/logo/logo.png';
import logoText from '../../../assets/logo/logo-text.png';
import { adminLogin } from '../../../admin/api/adminApi';
import { useAdminAuthStore } from '../../../admin/store/adminAuthStore';

export function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAdminAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ email: 'admin@viettouraudio.vn', password: 'Admin123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const from = location.state?.from?.pathname ?? '/admin';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await adminLogin(form);
      setSession(session);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error ?? t('auth.login_error_default'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-shell min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl lg:block">
          <img className="h-14 w-14 rounded-2xl" src={logo} alt="VietTourAudio logo" loading="lazy" decoding="async" />
          <img className="mt-8 h-12 w-64 object-contain" src={logoText} alt="VietTourAudio" loading="lazy" decoding="async" />
          <h1 className="mt-10 max-w-xl text-4xl font-black leading-tight">
            {t('auth.portal_desc')}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
            {t('auth.portal_features')}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {['RBAC', 'Audit Log', 'Wallet'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="text-blue-300" size={22} />
                <p className="mt-3 text-sm font-black">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
          <div className="flex items-center gap-3 lg:hidden">
            <img className="h-11 w-11 rounded-xl" src={logo} alt="VietTourAudio logo" loading="lazy" decoding="async" />
            <img className="h-8 w-44 object-contain" src={logoText} alt="VietTourAudio" loading="lazy" decoding="async" />
          </div>
          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">{t('sidebar.admin_portal')}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{t('auth.login_title')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t('auth.login_subtitle')}</p>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">{t('auth.email')}</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition duration-200 ease-out focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                autoComplete="username"
                placeholder="admin@viettouraudio.vn"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">{t('auth.password')}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition duration-200 ease-out focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                autoComplete="current-password"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition duration-200 ease-out hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <LockKeyhole size={18} />
              {loading ? t('auth.login_loading') : t('auth.login_button')}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
