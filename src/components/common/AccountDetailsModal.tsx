import React from 'react';
import { 
  X, 
  GraduationCap, 
  ShieldCheck, 
  User, 
  Mail, 
  Hash, 
  Building2, 
  Calendar, 
  Award, 
  Key, 
  LogOut, 
  Users, 
  BookOpen, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { UserCredential } from '../../types';
import { UserAvatar } from './UserAvatar';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserCredential;
  allUsers: UserCredential[];
  onSwitchUser: (user: UserCredential) => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenLoginModal,
  onLogout,
}) => {
  if (!isOpen) return null;

  const getRoleTheme = (role: string) => {
    switch (role) {
      case 'superadmin':
        return {
          title: 'Super Administrator',
          description: 'Full institutional governance, credential provisioning & academic records.',
          badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          accent: 'from-rose-500 to-rose-600',
        };
      case 'teacher':
        return {
          title: 'Faculty / Educator',
          description: 'Exam authoring, curriculum evaluation & real-time test supervision.',
          badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          accent: 'from-emerald-500 to-emerald-600',
        };
      case 'student':
        return {
          title: 'Enrolled Scholar',
          description: 'Live CBT examinations, interactive study notes & academic honors.',
          badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
          accent: 'from-amber-500 to-amber-600',
        };
      case 'parent':
        return {
          title: 'Parent & Guardian',
          description: 'Ward performance observatory, answer sheet reviews & teacher helpdesk.',
          badge: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30',
          accent: 'from-blue-500 to-blue-600',
        };
      default:
        return {
          title: role,
          description: 'Institutional user account.',
          badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
          accent: 'from-slate-600 to-slate-700',
        };
    }
  };

  const roleMeta = getRoleTheme(currentUser.role);
  const uniqueUsers = Array.from(new Map(allUsers.map((u) => [u.id, u])).values());

  // Find linked students if parent
  const linkedStudents = currentUser.role === 'parent'
    ? uniqueUsers.filter((u) => currentUser.childrenIds?.includes(u.id) || u.parentId === currentUser.id)
    : [];

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Scrim with School Identity */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-amber-300 uppercase tracking-wider">
                  Nexus Ranaji English Medium High School
                </p>
                <h2 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
                  Institutional Account Identity
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Account Details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Card Header */}
          <div className="flex items-center gap-3.5 mt-5 pt-4 border-t border-white/10 relative z-10">
            <UserAvatar name={currentUser.name} role={currentUser.role} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {currentUser.name}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleMeta.badge}`}>
                  {roleMeta.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {currentUser.email || currentUser.username || 'Verified Institutional User'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Account Attributes Grid */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
              Profile &amp; Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <Hash className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Identifier / System Key</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {currentUser.rollNo || currentUser.employeeId || currentUser.id}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Username Handle</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    @{currentUser.username || currentUser.name.toLowerCase().replace(/\s+/g, '.')}
                  </span>
                </div>
              </div>

              {currentUser.role === 'student' && (
                <>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Class &amp; Division</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {currentUser.className || 'Standard 10'} &bull; {currentUser.divisionName || 'Division A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Honor Standing Points</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {currentUser.bonusPoints ?? 100} Points
                      </span>
                    </div>
                  </div>
                </>
              )}

              {currentUser.role === 'parent' && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 sm:col-span-2 flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Enrolled Wards Under Guardianship</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {linkedStudents.length > 0
                        ? linkedStudents.map((s) => `${s.name} (${s.className || 'Std 10'})`).join(', ')
                        : 'Aarav Sharma (Standard 10 - Div A)'}
                    </span>
                  </div>
                </div>
              )}

              {currentUser.role === 'teacher' && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 sm:col-span-2 flex items-start gap-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Curriculum Specialization</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Mathematics &amp; Physical Sciences &bull; Senior High School Wing
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Academic Session</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    2025–2026 Academic Year
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Security &amp; Proctoring</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active &amp; Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Persona Switcher in Account Modal */}
          <div className="pt-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Fast Role Switch (Institutional Preview)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {uniqueUsers.slice(0, 4).map((u) => {
                const isSelected = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      onClose();
                    }}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <UserAvatar name={u.name} role={u.role} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{u.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{u.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenLoginModal();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>Sign In with Other Password</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
