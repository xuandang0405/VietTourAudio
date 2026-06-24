import { KeyRound, Store } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { vendorLogin } from '../../../vendor/api/vendorApi';
import { useVendorAuthStore } from '../../../vendor/store/vendorAuthStore';

export function VendorLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useVendorAuthStore((state) => state.isAuthenticated);
  const setSession = useVendorAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ vendorCode: 'VND-0001', password: 'Vendor123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const from = location.state?.from?.pathname ?? '/vendor';

  if (isAuthenticated) {
    return <Navigate to="/vendor" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await vendorLogin({ vendorCode: form.vendorCode, password: form.password });
      setSession(session);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error ?? t('auth.vendor_login_error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm lg:block">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600">
            <Store size={28} />
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.14em] text-teal-600">{t('auth.vendor_portal')}</p>
          <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight text-slate-900">
            {t('auth.vendor_hero_title')}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
            {t('auth.vendor_hero_desc')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">📍 {t('auth.vendor_feature_1')}</span>
            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">🎙️ {t('auth.vendor_feature_2')}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">📊 {t('auth.vendor_feature_3')}</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-600">{t('auth.vendor_login')}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{t('auth.vendor_login_title')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{t('auth.vendor_login_subtitle')}</p>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">{t('auth.vendor_code')}</span>
              <div className="relative mt-1">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.vendorCode}
                  onChange={(event) => setForm((current) => ({ ...current, vendorCode: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition duration-200 ease-out focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  placeholder="VND-XXXX"
                  autoComplete="username"
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">{t('auth.password')}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition duration-200 ease-out focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                autoComplete="current-password"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-black text-white shadow-sm transition duration-200 ease-out hover:bg-teal-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-teal-300"
            >
              <Store size={18} />
              {loading ? t('auth.login_loading') : t('auth.vendor_login_button')}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-500">🔑 {t('auth.demo_account_hint')}</p>
            <p className="mt-1 text-xs font-mono text-slate-600">{t('auth.vendor_code_short')}: <span className="font-bold text-teal-600">VND-0001</span> / {t('auth.password')}: <span className="font-bold text-teal-600">Vendor123</span></p>
          </div>
        </section>
      </div>
    </main>
  );
}