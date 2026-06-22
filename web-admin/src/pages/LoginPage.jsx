import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const schema = z.object({
  username: z.string().min(3, 'Username toi thieu 3 ky tu'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu')
});

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: 'admin', password: 'Admin@123' }
  });

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fffbeb,#f8fafc_35%)] px-4">
      <form
        onSubmit={handleSubmit(async (values) => {
          try {
            await login(values);
            toast.success('Dang nhap thanh cong');
            navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
          } catch (e) {
            toast.error(e.message);
          }
        })}
        className="w-full max-w-md space-y-4 rounded-2xl border border-amber-100 bg-white p-6 shadow-lg"
      >
        <div>
          <h1 className="text-2xl font-black text-amber-900">Web Admin</h1>
          <p className="text-sm text-slate-500">Quan tri he thong VietTourAudio</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Username</label>
          <input {...register('username')} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          {errors.username ? <p className="mt-1 text-xs text-red-600">{errors.username.message}</p> : null}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Password</label>
          <input type="password" {...register('password')} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
        </div>

        <button disabled={isSubmitting} className="w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {isSubmitting ? 'Dang xu ly...' : 'Dang nhap'}
        </button>
      </form>
    </div>
  );
}
