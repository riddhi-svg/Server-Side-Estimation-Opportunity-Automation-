import React from 'react';
import { LogIn, LogOut, CheckCircle, Zap } from 'lucide-react';
import { UserProfile } from '../../types/auth.types';

interface HeaderProps {
  isAuthenticated: boolean;
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  user,
  onLogin,
  onLogout
}) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6 border-b border-slate-200 mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 bg-clip-text text-transparent">
            sGTM Speed Automation
          </h1>
          <p className="text-sm text-slate-500">
            Lighthouse Performance & Core Web Vitals Projection Engine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        {isAuthenticated ? (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="truncate max-w-[150px]">{user?.displayName || user?.email || 'Connected'}</span>
            <button
              onClick={onLogout}
              className="ml-2 px-2 py-0.5 rounded bg-white border border-emerald-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 inline" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition shadow-blue-600/20 active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            Login with Google
          </button>
        )}
      </div>
    </header>
  );
};
