import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  BookOpen, 
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { UserCredential } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserCredential) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Authentication failed');
      }

      const data = await res.json();
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    {
      role: 'Super Admin',
      user: 'admin',
      pass: 'Admin@Nexus2025!',
      icon: ShieldCheck,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    },
    {
      role: 'Teacher (Physics)',
      user: 'teacher.sharma',
      pass: 'NexusTeacher#2025',
      icon: BookOpen,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      role: 'Student (Class 10)',
      user: 'student.rohan',
      pass: 'StudentPass#101',
      icon: GraduationCap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      role: 'Parent (Rohan & Ananya)',
      user: 'parent.sharma',
      pass: 'ParentPass#2025',
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-8 space-y-4 sm:space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto pb-safe animate-in slide-in-from-bottom duration-200">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden mb-1" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                Nexus Ranaji Sign In
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Institutional Role Authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">
              Username / Institutional ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. teacher.sharma or student.rohan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* 1-Click Quick Fill Credentials for testing */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Or Click to Auto-Fill Role Account:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickLogins.map((ql, idx) => {
              const Icon = ql.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUsername(ql.user);
                    setPassword(ql.pass);
                  }}
                  className={`p-2 rounded-xl border text-left text-xs transition-all flex items-center gap-2 cursor-pointer ${ql.color}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1 truncate">
                    <p className="font-bold truncate text-[11px]">{ql.role}</p>
                    <p className="text-[9px] opacity-80 font-mono truncate">{ql.user}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
