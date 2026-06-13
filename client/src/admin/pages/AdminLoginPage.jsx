import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
import { useAdminAuthStore } from '../store/adminAuthStore';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginDemo = useAdminAuthStore((state) => state.loginDemo);
  const from = location.state?.from?.pathname ?? '/admin';

  function handleSubmit(event) {
    event.preventDefault();
    loginDemo();
    navigate(from, { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl lg:block">
          <img className="h-14 w-14 rounded-2xl" src={logo} alt="VietTourAudio logo" />
          <img className="mt-8 h-12 w-64 object-contain" src={logoText} alt="VietTourAudio" />
          <h1 className="mt-10 max-w-xl text-4xl font-black leading-tight">
            Cổng quản trị nội bộ cho vận hành du lịch thông minh.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
            Kiểm duyệt vendor, media, geofence, thanh toán, hoa hồng và nhật ký hệ thống trong một giao diện enterprise responsive.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {['RBAC', 'Audit Log', 'Revenue'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="text-blue-300" size={22} />
                <p className="mt-3 text-sm font-black">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
          <div className="flex items-center gap-3 lg:hidden">
            <img className="h-11 w-11 rounded-xl" src={logo} alt="VietTourAudio logo" />
            <img className="h-8 w-44 object-contain" src={logoText} alt="VietTourAudio" />
          </div>
          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">Admin Portal</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Đăng nhập hệ thống</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Mẫu giao diện dùng tài khoản demo cho đến khi backend auth được nối thật.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input
                type="email"
                defaultValue="superadmin@viettouraudio.vn"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition duration-200 ease-out focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Mật khẩu</span>
              <input
                type="password"
                defaultValue="demo-admin"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition duration-200 ease-out focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition duration-200 ease-out hover:bg-blue-700 active:scale-[0.99]"
            >
              <LockKeyhole size={18} />
              Đăng nhập demo
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
