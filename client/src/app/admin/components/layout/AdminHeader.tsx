import React from 'react';
import { Bell, User } from 'lucide-react';
import { adminColors } from '../../styles/adminTokens';

export const AdminHeader: React.FC = () => {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b z-10" style={{ backgroundColor: adminColors.surface, borderColor: adminColors.border }}>
      <div className="text-sm text-slate-500 font-medium">
        VietTour / Dashboard
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-900">Admin User</span>
            <span className="text-xs text-slate-500">Super Admin</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};
