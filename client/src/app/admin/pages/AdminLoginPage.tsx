import React from 'react';
import { adminColors } from '../../styles/adminTokens';

export const AdminLoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            VietTourAudio
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Cổng quản trị nội bộ
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="admin@viettour.vn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
              <input
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Đăng nhập vào hệ thống
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-slate-500">
          💡 Chỉ dành cho nhân viên nội bộ
        </p>
      </div>
    </div>
  );
};
